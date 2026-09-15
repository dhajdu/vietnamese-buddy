// lib/lessons/queries.ts — read helpers for server components (RLS client).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lesson } from '@/lib/ai/schema'
import { computeStreak, localDate } from '@/lib/activity/streak'
import { getPair, type PairId } from '@/lib/pairs'

/** A lesson as lists show it. The body stays out: it is several KB per lesson and lists never read it. */
export interface LessonRow {
  id: string; situation: string; title: string; grammar_topic: string; pair: PairId
  parent_lesson_id: string | null; source: 'ai' | 'seed'
  completed_at: string | null; created_at: string
}
export interface LessonDetail extends LessonRow { lesson_json: Lesson }

export async function getProfile(db: SupabaseClient, userId: string) {
  const { data, error } = await db.from('profiles').select('timezone, display_name, pair, is_admin').eq('id', userId).maybeSingle()
  if (error) throw new Error(`profile read failed: ${error.message}`)
  return {
    timezone: (data?.timezone as string) ?? 'Asia/Ho_Chi_Minh',
    displayName: (data?.display_name as string | null) ?? null,
    pair: getPair(data?.pair),
    isAdmin: Boolean(data?.is_admin),
  }
}

export async function getHomeStats(db: SupabaseClient, userId: string, tz: string, pair: PairId) {
  const today = localDate(tz)
  const [act, vocabTotal, vocabKnown, due, recent] = await Promise.all([
    db.from('daily_activity').select('activity_date').eq('user_id', userId),
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('pair', pair),
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('pair', pair).eq('status', 'known'),
    db.from('flashcards').select('id, lessons!inner(pair)', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'known').eq('lessons.pair', pair),
    db.from('vocabulary').select('vietnamese, english').eq('user_id', userId).eq('pair', pair).order('first_seen_at', { ascending: false }).limit(6),
  ])
  const dates = (act.data ?? []).map(r => r.activity_date as string)
  const streak = computeStreak(dates, today)
  return {
    streak, today, activeToday: dates.includes(today),
    vocabTotal: vocabTotal.count ?? 0, vocabKnown: vocabKnown.count ?? 0, due: due.count ?? 0,
    recentWords: (recent.data ?? []).map(r => (getPair(pair).targetField === 'vietnamese' ? r.vietnamese : r.english) as string),
  }
}

export async function listLessons(db: SupabaseClient, userId: string, pair: PairId, limit?: number) {
  let q = db.from('lessons')
    .select('id, situation, title, grammar_topic, parent_lesson_id, source, completed_at, created_at')
    .eq('user_id', userId).eq('pair', pair).order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) throw new Error(`lessons read failed: ${error.message}`)
  return (data ?? []) as LessonRow[]
}

export async function getLesson(db: SupabaseClient, userId: string, id: string) {
  const { data, error } = await db.from('lessons').select('*').eq('user_id', userId).eq('id', id).single()
  // No row, or an id that is not a uuid: both are a 404, not a failure.
  if (error && error.code !== 'PGRST116' && error.code !== '22P02') throw new Error(`lesson read failed: ${error.message}`)
  return (data as LessonDetail | null) ?? null
}

// PostgREST returns at most 1000 rows. A lesson has at most 35 cards (15 phrases,
// 20 words), so asking about 25 lessons per request always fits.
const LESSONS_PER_REQUEST = 25
function batches(ids: string[]) {
  return Array.from({ length: Math.ceil(ids.length / LESSONS_PER_REQUEST) }, (_, i) =>
    ids.slice(i * LESSONS_PER_REQUEST, (i + 1) * LESSONS_PER_REQUEST))
}

type ListedLesson = Pick<LessonRow, 'id' | 'created_at'>

/**
 * Count of the words each lesson introduced. The pipeline saves the lesson row
 * before its words, so a linked word first seen at or after the lesson's creation
 * arrived with it; one first seen earlier came from an older lesson.
 */
export async function newWordsByLesson(db: SupabaseClient, lessons: ListedLesson[]) {
  const createdAt = new Map(lessons.map(l => [l.id, l.created_at]))
  const pages = await Promise.all(batches(lessons.map(l => l.id)).map(ids =>
    db.from('lesson_vocabulary').select('lesson_id, vocabulary(first_seen_at)').in('lesson_id', ids)))
  const counts = new Map<string, number>()
  for (const { data, error } of pages) {
    if (error) throw new Error(`lesson_vocabulary read failed: ${error.message}`)
    for (const r of (data ?? []) as unknown as { lesson_id: string; vocabulary: { first_seen_at: string } | null }[]) {
      const at = createdAt.get(r.lesson_id)
      if (at && r.vocabulary && r.vocabulary.first_seen_at >= at) counts.set(r.lesson_id, (counts.get(r.lesson_id) ?? 0) + 1)
    }
  }
  return counts
}

/** Phrases per lesson, counted from phrase cards (the pipeline makes one per phrase) so lists never load lesson_json. */
export async function phraseCounts(db: SupabaseClient, userId: string, lessonIds: string[]) {
  const pages = await Promise.all(batches(lessonIds).map(ids =>
    db.from('flashcards').select('lesson_id').eq('user_id', userId).eq('type', 'phrase').in('lesson_id', ids)))
  const counts = new Map<string, number>()
  for (const { data, error } of pages) {
    if (error) throw new Error(`phrase card read failed: ${error.message}`)
    for (const c of (data ?? []) as { lesson_id: string }[]) counts.set(c.lesson_id, (counts.get(c.lesson_id) ?? 0) + 1)
  }
  return counts
}

import type { LessonState } from '@/components/app/LessonList'

/** Per-lesson state for list stripes: reviewed (all cards known), new (no card reviewed yet), due (anything in between). Only the lessons passed in are read. */
export async function lessonStates(db: SupabaseClient, userId: string, lessons: ListedLesson[]): Promise<Map<string, LessonState>> {
  const out = new Map<string, LessonState>()
  if (!lessons.length) return out
  const [pages, newWords] = await Promise.all([
    Promise.all(batches(lessons.map(l => l.id)).map(ids =>
      db.from('flashcards').select('lesson_id, status').eq('user_id', userId).in('lesson_id', ids))),
    newWordsByLesson(db, lessons),
  ])
  const agg = new Map<string, { total: number; known: number; fresh: number }>()
  for (const { data, error } of pages) {
    if (error) throw new Error(`flashcards read failed: ${error.message}`)
    for (const c of (data ?? []) as { lesson_id: string; status: string }[]) {
      const a = agg.get(c.lesson_id) ?? { total: 0, known: 0, fresh: 0 }
      a.total++; if (c.status === 'known') a.known++; else if (c.status === 'new') a.fresh++
      agg.set(c.lesson_id, a)
    }
  }
  for (const [id, a] of agg) {
    if (a.known === a.total) out.set(id, { kind: 'reviewed' })
    else if (a.fresh === a.total) out.set(id, { kind: 'new', count: newWords.get(id) ?? 0 })
    else out.set(id, { kind: 'due', count: a.total - a.known })
  }
  return out
}
