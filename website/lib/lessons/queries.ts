// lib/lessons/queries.ts — read helpers for server components (RLS client).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lesson } from '@/lib/ai/schema'
import { computeStreak, localDate } from '@/lib/activity/streak'
import { getPair, type PairId } from '@/lib/pairs'

export interface LessonRow {
  id: string; situation: string; title: string; grammar_topic: string; pair: PairId
  lesson_json: Lesson; parent_lesson_id: string | null; source: 'ai' | 'seed'
  completed_at: string | null; created_at: string
}

export async function getProfile(db: SupabaseClient, userId: string) {
  const { data } = await db.from('profiles').select('timezone, display_name, pair, is_admin').eq('id', userId).single()
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
    .select('id, situation, title, grammar_topic, parent_lesson_id, source, completed_at, created_at, lesson_json')
    .eq('user_id', userId).eq('pair', pair).order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data } = await q
  return (data ?? []) as LessonRow[]
}

export async function getLesson(db: SupabaseClient, userId: string, id: string) {
  const { data } = await db.from('lessons').select('*').eq('user_id', userId).eq('id', id).single()
  return (data as LessonRow | null) ?? null
}

/** Count of vocabulary rows whose FIRST linked lesson is each lesson id. */
export async function newWordsByLesson(db: SupabaseClient, userId: string, pair: PairId) {
  const { data } = await db.from('lesson_vocabulary')
    .select('lesson_id, vocabulary_id, lessons!inner(user_id, created_at, pair)')
    .eq('lessons.user_id', userId).eq('lessons.pair', pair)
  const first = new Map<string, { lessonId: string; at: string }>()
  for (const r of (data ?? []) as unknown as { lesson_id: string; vocabulary_id: string; lessons: { created_at: string } }[]) {
    const cur = first.get(r.vocabulary_id)
    if (!cur || r.lessons.created_at < cur.at) first.set(r.vocabulary_id, { lessonId: r.lesson_id, at: r.lessons.created_at })
  }
  const counts = new Map<string, number>()
  for (const { lessonId } of first.values()) counts.set(lessonId, (counts.get(lessonId) ?? 0) + 1)
  return counts
}

import type { LessonState } from '@/components/app/LessonList'

/** Per-lesson state for list stripes: reviewed (all cards known), due (some open after a review), new (never reviewed). */
export async function lessonStates(db: SupabaseClient, userId: string, pair: PairId): Promise<Map<string, LessonState>> {
  const [{ data: cards }, newWords] = await Promise.all([
    db.from('flashcards').select('lesson_id, status, lessons!inner(pair)').eq('user_id', userId).eq('lessons.pair', pair),
    newWordsByLesson(db, userId, pair),
  ])
  const agg = new Map<string, { total: number; known: number; open: number }>()
  for (const c of (cards ?? []) as { lesson_id: string; status: string }[]) {
    const a = agg.get(c.lesson_id) ?? { total: 0, known: 0, open: 0 }
    a.total++; if (c.status === 'known') a.known++; else a.open++
    agg.set(c.lesson_id, a)
  }
  const out = new Map<string, LessonState>()
  for (const [id, a] of agg) {
    if (a.total && a.known === a.total) out.set(id, { kind: 'reviewed' })
    else if (a.known === 0) out.set(id, { kind: 'new', count: newWords.get(id) ?? 0 })
    else out.set(id, { kind: 'due', count: a.open })
  }
  return out
}
