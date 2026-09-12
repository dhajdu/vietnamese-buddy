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
import { getEntitlement, getSettings } from '@/lib/billing/entitlement'
import { t } from '@/lib/i18n'

/** Every string in the language being learned, for speech pre-warming. */
function lessonTexts(l: Lesson, pair: LanguagePair) {
  const f = pair.targetField
  return [...l.phrases.map(p => p[f]), ...l.vocabulary.map(v => v[f]), ...l.grammar.examples.map(e => e[f])]
}

async function ctx() {
  const user = await requireAuth()
  const db = await createClient()
  const { data: profile } = await db.from('profiles').select('timezone, pair, is_admin').eq('id', user.id).single()
  const tz = (profile?.timezone as string) ?? 'Asia/Ho_Chi_Minh'
  return { user, db, tz, pair: getPair(profile?.pair), isAdmin: Boolean(profile?.is_admin) }
}

async function generateAndSave(situation: string, parentLessonId: string | null, adjustment?: string) {
  const { user, db, tz, pair, isAdmin } = await ctx()

  const ent = await getEntitlement(db, user.id, { pair: pair.id, timezone: tz, isAdmin })
  if (!ent.canCreate) {
    const d = t(pair.uiLocale)
    return { error: ent.reason === 'weekly' ? d.weeklyLimitReached : d.dailyLimitReached, upgrade: ent.reason === 'weekly' && ent.monetised }
  }
  if (adjustment && !ent.canAdjust) return { error: t(pair.uiLocale).adjustIsPro, upgrade: true }

  const { data: recent } = await db.from('lessons').select('grammar_topic')
    .eq('user_id', user.id).eq('pair', pair.id).order('created_at', { ascending: false }).limit(5)

  let lessonId: string
  try {
    const settings = await getSettings(db)
    const { lesson } = await generateLesson({
      pair, situation, adjustment,
      recentGrammar: (recent ?? []).map(r => r.grammar_topic as string),
      modelSpec: `${settings.aiProvider}/${settings.aiModel}`,
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

export async function createLesson(_prev: { error?: string; upgrade?: boolean } | null, formData: FormData) {
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
  const { user, db, tz, pair, isAdmin } = await ctx()
  const d = t(pair.uiLocale)
  if (!note) return { error: d.sayWhatChanged }
  const ent = await getEntitlement(db, user.id, { pair: pair.id, timezone: tz, isAdmin })
  if (!ent.canAdjust) return { error: d.adjustIsPro, upgrade: ent.monetised }
  const { data: original, error } = await db.from('lessons').select('situation, parent_lesson_id')
    .eq('id', lessonId).eq('user_id', user.id).single()
  if (error || !original) return { error: 'Lesson not found.' }
  const parent = (original.parent_lesson_id as string | null) ?? lessonId
  return generateAndSave(original.situation as string, parent, note)
}

/**
 * Removes a lesson, its flashcards and its vocabulary. Words that other lessons
 * still teach survive: vocabulary is deduped across lessons, so a blanket
 * delete would strip words out from under lessons that still use them. The
 * database function does both steps in one transaction.
 */
export async function deleteLesson(lessonId: string) {
  const { user, db } = await ctx()
  const { data: owned, error: findError } = await db.from('lessons')
    .select('id').eq('id', lessonId).eq('user_id', user.id).maybeSingle()
  if (findError) return { error: findError.message }
  if (!owned) return { error: 'Lesson not found.' }

  const { data, error } = await db.rpc('delete_lesson', { p_lesson_id: lessonId })
  if (error) return { error: error.message }
  const deletedWords = Array.isArray(data) ? (data[0]?.deleted_words ?? 0) : 0

  revalidatePath('/app')
  revalidatePath('/app/lessons')
  revalidatePath('/app/vocabulary')
  revalidatePath('/app/flashcards')
  redirect('/app/lessons')
  return { ok: true, deletedWords }
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
