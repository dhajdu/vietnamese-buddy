// lib/lessons/queries.ts — read helpers for server components (RLS client).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lesson } from '@/lib/ai/schema'
import { computeStreak, localDate } from '@/lib/activity/streak'

export interface LessonRow {
  id: string; situation: string; title: string; grammar_topic: string
  lesson_json: Lesson; parent_lesson_id: string | null; source: 'ai' | 'seed'
  completed_at: string | null; created_at: string
}

export async function getProfile(db: SupabaseClient, userId: string) {
  const { data } = await db.from('profiles').select('timezone, display_name').eq('id', userId).single()
  return { timezone: (data?.timezone as string) ?? 'Asia/Ho_Chi_Minh', displayName: data?.display_name as string | null }
}

export async function getHomeStats(db: SupabaseClient, userId: string, tz: string) {
  const today = localDate(tz)
  const [act, vocabTotal, vocabKnown, due] = await Promise.all([
    db.from('daily_activity').select('activity_date').eq('user_id', userId),
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'known'),
    db.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'known'),
  ])
  const streak = computeStreak((act.data ?? []).map(r => r.activity_date as string), today)
  return { streak, vocabTotal: vocabTotal.count ?? 0, vocabKnown: vocabKnown.count ?? 0, due: due.count ?? 0, today }
}

export async function listLessons(db: SupabaseClient, userId: string, limit?: number) {
  let q = db.from('lessons')
    .select('id, situation, title, grammar_topic, parent_lesson_id, source, completed_at, created_at, lesson_json')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data } = await q
  return (data ?? []) as LessonRow[]
}

export async function getLesson(db: SupabaseClient, userId: string, id: string) {
  const { data } = await db.from('lessons').select('*').eq('user_id', userId).eq('id', id).single()
  return (data as LessonRow | null) ?? null
}

/** Count of vocabulary rows whose FIRST linked lesson is each lesson id. */
export async function newWordsByLesson(db: SupabaseClient, userId: string) {
  const { data } = await db.from('lesson_vocabulary')
    .select('lesson_id, vocabulary_id, lessons!inner(user_id, created_at)')
    .eq('lessons.user_id', userId)
  const first = new Map<string, { lessonId: string; at: string }>()
  for (const r of (data ?? []) as unknown as { lesson_id: string; vocabulary_id: string; lessons: { created_at: string } }[]) {
    const cur = first.get(r.vocabulary_id)
    if (!cur || r.lessons.created_at < cur.at) first.set(r.vocabulary_id, { lessonId: r.lesson_id, at: r.lessons.created_at })
  }
  const counts = new Map<string, number>()
  for (const { lessonId } of first.values()) counts.set(lessonId, (counts.get(lessonId) ?? 0) + 1)
  return counts
}
