// lib/lessons/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { generateLesson, LessonGenerationError } from '@/lib/ai/generate'
import { saveLesson } from './pipeline'
import { recordActivity } from '@/lib/activity/actions'
import { warmLessonAudio } from '@/lib/voice/tts'
import type { Lesson } from '@/lib/ai/schema'
import { getPair, type LanguagePair } from '@/lib/pairs'

// Worst-case guard, not the product's shape: one situation a day is the premise.
// PR 3 moves this to app_settings so it is tunable without a deploy.
const DAILY_LIMIT = 3

/** Every string in the language being learned, for speech pre-warming. */
function lessonTexts(l: Lesson, pair: LanguagePair) {
  const f = pair.targetField
  return [...l.phrases.map(p => p[f]), ...l.vocabulary.map(v => v[f]), ...l.grammar.examples.map(e => e[f])]
}

async function ctx() {
  const user = await requireAuth()
  const db = await createClient()
  const { data: profile } = await db.from('profiles').select('timezone, pair').eq('id', user.id).single()
  return { user, db, tz: profile?.timezone as string | undefined, pair: getPair(profile?.pair) }
}

async function generateAndSave(situation: string, parentLessonId: string | null, adjustment?: string) {
  const { user, db, tz, pair } = await ctx()

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await db.from('lessons').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('source', 'ai').gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) return { error: `Daily limit of ${DAILY_LIMIT} lessons reached. Come back tomorrow.` }

  const { data: recent } = await db.from('lessons').select('grammar_topic')
    .eq('user_id', user.id).eq('pair', pair.id).order('created_at', { ascending: false }).limit(5)

  let lessonId: string
  try {
    const lesson = await generateLesson({
      pair, situation, adjustment, recentGrammar: (recent ?? []).map(r => r.grammar_topic as string),
    })
    ;({ lessonId } = await saveLesson(db, user.id, { lesson, situation, source: 'ai', pair, parentLessonId }))
    await recordActivity(db, 'lesson_created', tz)
    after(() => warmLessonAudio(lessonTexts(lesson, pair), pair.id))
  } catch (err) {
    if (err instanceof LessonGenerationError) return { error: err.message }
    console.error('createLesson failed', err)
    return { error: 'Something went wrong saving the lesson. Try again.' }
  }
  revalidatePath('/app')
  revalidatePath('/app/lessons')
  redirect(`/lessons/${lessonId}`)
}

export async function createLesson(_prev: { error?: string } | null, formData: FormData) {
  const situation = String(formData.get('situation') ?? '').trim()
  if (!situation) return { error: 'Describe a situation first.' }
  return generateAndSave(situation, null)
}

/**
 * Rewrites a lesson with the learner's note as a new row linked to the original.
 * A note is required: a blind re-roll of the same situation was a full-price call
 * that rarely produced a better lesson, so the Regenerate button is gone.
 */
export async function adjustLesson(lessonId: string, adjustment: string) {
  const note = adjustment.trim()
  if (!note) return { error: 'Say what you want changed.' }
  const { user, db } = await ctx()
  const { data: original, error } = await db.from('lessons').select('situation, parent_lesson_id')
    .eq('id', lessonId).eq('user_id', user.id).single()
  if (error || !original) return { error: 'Lesson not found.' }
  const parent = (original.parent_lesson_id as string | null) ?? lessonId
  return generateAndSave(original.situation as string, parent, note)
}

export async function completeLesson(lessonId: string) {
  const { user, db, tz } = await ctx()
  const { error } = await db.from('lessons').update({ completed_at: new Date().toISOString() })
    .eq('id', lessonId).eq('user_id', user.id).is('completed_at', null)
  if (error) return { error: error.message }
  await recordActivity(db, 'lesson_completed', tz)
  revalidatePath(`/app/lessons/${lessonId}`)
  revalidatePath('/app/progress')
  return { ok: true }
}

/** Imports the three bundled sample lessons into the current account. Skips if any lesson already exists. */
export async function loadSampleLessons() {
  const { user, db, pair } = await ctx()
  const { count } = await db.from('lessons').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('pair', pair.id)
  if ((count ?? 0) > 0) return { error: 'You already have lessons.' }
  const { loadSeedLessons } = await import('./seeds')
  const seeds = loadSeedLessons(pair.id)
  for (const lesson of seeds) {
    await saveLesson(db, user.id, { lesson, situation: lesson.situation, source: 'seed', pair })
  }
  after(() => warmLessonAudio(seeds.flatMap(l => lessonTexts(l, pair)), pair.id))
  revalidatePath('/app')
  revalidatePath('/app/lessons')
  return { ok: true }
}
