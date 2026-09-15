// lib/lessons/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLesson, LessonGenerationError } from '@/lib/ai/generate'
import { saveLesson } from './pipeline'
import { recordActivity, type ActivityKind } from '@/lib/activity/actions'
import { localDate } from '@/lib/activity/streak'
import { warmLessonAudio } from '@/lib/voice/tts'
import type { Lesson } from '@/lib/ai/schema'
import { getPair, type LanguagePair } from '@/lib/pairs'
import { getEntitlement, getSettings } from '@/lib/billing/entitlement'
import { weekStart, zonedMidnightUtc } from '@/lib/billing/week'
import { t, type Dictionary } from '@/lib/i18n'

// Arguments arrive from the browser, so they are checked before they reach Postgres or the model.
const LessonId = z.uuid()
const Situation = z.string().trim().min(1).max(500)
const AdjustNote = z.string().trim().min(1).max(300)

/** Every string in the language being learned, for speech pre-warming. */
function lessonTexts(l: Lesson, pair: LanguagePair) {
  const f = pair.targetField
  return [...l.phrases.map(p => p[f]), ...l.vocabulary.map(v => v[f]), ...l.grammar.examples.map(e => e[f])]
}

async function ctx() {
  const user = await requireAuth()
  const db = await createClient()
  const { data: profile, error } = await db.from('profiles').select('timezone, pair, is_admin').eq('id', user.id).single()
  if (error) throw new Error(`profile read failed: ${error.message}`)
  const tz = (profile?.timezone as string) ?? 'Asia/Ho_Chi_Minh'
  return { user, db, tz, pair: getPair(profile?.pair), isAdmin: Boolean(profile?.is_admin) }
}
type Ctx = Awaited<ReturnType<typeof ctx>>

/** Streak bookkeeping must never turn a saved lesson into an error. */
async function logActivity(c: Ctx, kind: ActivityKind) {
  await recordActivity(c.db, kind, c.tz).catch(err => console.error('recordActivity failed', err))
}

function limitError(d: Dictionary, reason: 'weekly' | 'daily', monetised: boolean) {
  return { error: reason === 'weekly' ? d.weeklyLimitReached : d.dailyLimitReached, upgrade: reason === 'weekly' && monetised }
}

async function generateAndSave(c: Ctx, pair: LanguagePair, situation: string, parentLessonId: string | null, adjustment?: string) {
  const { user, db, tz, isAdmin } = c
  const d = t(pair.uiLocale)

  let reservationId: string | null = null
  let lessonId: string
  let lesson: Lesson
  try {
    // Checked first for the friendly message; the reservation below is what enforces it.
    const ent = await getEntitlement(db, user.id, { pair: pair.id, timezone: tz, isAdmin })
    if (!ent.canCreate) return limitError(d, ent.reason === 'weekly' ? 'weekly' : 'daily', ent.monetised)
    if (adjustment && !ent.canAdjust) return { error: d.adjustIsPro, upgrade: ent.monetised }

    const { data: recent, error: recentError } = await db.from('lessons').select('grammar_topic')
      .eq('user_id', user.id).eq('pair', pair.id).order('created_at', { ascending: false }).limit(5)
    if (recentError) throw new Error(`recent lessons read failed: ${recentError.message}`)
    const settings = await getSettings(db)

    // Claim the slot atomically before paying for the model, so parallel requests cannot all pass the check.
    const { data: reserved, error: reserveError } = await createAdminClient().rpc('reserve_lesson_generation', {
      p_user_id: user.id,
      p_pair: pair.id,
      p_week_start: zonedMidnightUtc(weekStart(localDate(tz)), tz),
      p_weekly_limit: Number.isFinite(ent.weeklyLimit) ? ent.weeklyLimit : null,
      p_daily_limit: Number.isFinite(ent.dailyLimit) ? ent.dailyLimit : null,
    })
    if (reserveError) throw new Error(`reserve_lesson_generation failed: ${reserveError.message}`)
    if (!reserved) {
      // Another request took the last slot. Name whichever cap had less room left.
      const weekly = ent.weeklyLimit - ent.lessonsThisWeek <= ent.dailyLimit - ent.lessonsToday
      return limitError(d, weekly ? 'weekly' : 'daily', ent.monetised)
    }
    reservationId = reserved as string

    ;({ lesson } = await generateLesson({
      pair, situation, adjustment,
      recentGrammar: (recent ?? []).map(r => r.grammar_topic as string),
      modelSpec: `${settings.aiProvider}/${settings.aiModel}`,
    }))
    ;({ lessonId } = await saveLesson(db, user.id, { lesson, situation, source: 'ai', pair, parentLessonId }))

    const { error: linkError } = await createAdminClient().from('lesson_generations')
      .update({ lesson_id: lessonId }).eq('id', reservationId)
    if (linkError) console.error('lesson_generations link failed', linkError)
  } catch (err) {
    // Nothing was delivered, so the slot goes back.
    if (reservationId) {
      const { error: releaseError } = await createAdminClient().from('lesson_generations').delete().eq('id', reservationId)
      if (releaseError) console.error('lesson_generations release failed', releaseError)
    }
    if (err instanceof LessonGenerationError) return { error: err.message }
    console.error('createLesson failed', err)
    return { error: 'Something went wrong saving the lesson. Try again.' }
  }
  await logActivity(c, 'lesson_created')
  after(() => warmLessonAudio(lessonTexts(lesson, pair), pair.id))
  revalidatePath('/app')
  revalidatePath('/app/lessons')
  redirect(`/app/lessons/${lessonId}`)
}

export async function createLesson(_prev: { error?: string; upgrade?: boolean } | null, formData: FormData) {
  const situation = Situation.safeParse(formData.get('situation'))
  if (!situation.success) return { error: 'Describe a situation first, in 500 characters or fewer.' }
  const c = await ctx()
  return generateAndSave(c, c.pair, situation.data, null)
}

/**
 * Rewrites a lesson with the learner's note as a new row linked to the original.
 * A note is required: a blind re-roll of the same situation was a full-price call
 * that rarely produced a better lesson, so the Regenerate button is gone.
 */
export async function adjustLesson(lessonId: string, adjustment: string) {
  const id = LessonId.safeParse(lessonId)
  const note = AdjustNote.safeParse(adjustment)
  if (!id.success) return { error: 'Lesson not found.' }
  const c = await ctx()
  const { data: original, error } = await c.db.from('lessons').select('situation, parent_lesson_id, pair')
    .eq('id', id.data).eq('user_id', c.user.id).single()
  if (error || !original) return { error: 'Lesson not found.' }
  // A lesson is rewritten in the direction it was written in, not the learner's current one.
  const pair = getPair(original.pair)
  if (!note.success) return { error: t(pair.uiLocale).sayWhatChanged }
  const parent = (original.parent_lesson_id as string | null) ?? id.data
  return generateAndSave(c, pair, original.situation as string, parent, note.data)
}

/**
 * Removes a lesson, its flashcards and its vocabulary. Words that other lessons
 * still teach survive: vocabulary is deduped across lessons, so a blanket
 * delete would strip words out from under lessons that still use them. The
 * database function does both steps in one transaction.
 */
export async function deleteLesson(lessonId: string) {
  if (!LessonId.safeParse(lessonId).success) return { error: 'Lesson not found.' }
  const { user, db } = await ctx()
  const { data: owned, error: findError } = await db.from('lessons')
    .select('id').eq('id', lessonId).eq('user_id', user.id).maybeSingle()
  if (findError) {
    console.error('deleteLesson lookup failed', findError)
    return { error: 'Could not delete the lesson. Try again.' }
  }
  if (!owned) return { error: 'Lesson not found.' }

  const { error } = await db.rpc('delete_lesson', { p_lesson_id: lessonId })
  if (error) {
    console.error('delete_lesson failed', error)
    return { error: 'Could not delete the lesson. Try again.' }
  }

  revalidatePath('/app')
  revalidatePath('/app/lessons')
  revalidatePath('/app/vocabulary')
  revalidatePath('/app/flashcards')
  redirect('/app/lessons')
}

export async function completeLesson(lessonId: string) {
  if (!LessonId.safeParse(lessonId).success) return { error: 'Lesson not found.' }
  const c = await ctx()
  const { data: updated, error } = await c.db.from('lessons').update({ completed_at: new Date().toISOString() })
    .eq('id', lessonId).eq('user_id', c.user.id).is('completed_at', null).select('id')
  if (error) {
    console.error('completeLesson failed', error)
    return { error: 'Could not mark the lesson complete. Try again.' }
  }
  // Only a lesson that was actually completed now counts toward the streak.
  if (updated?.length) await logActivity(c, 'lesson_completed')
  revalidatePath(`/app/lessons/${lessonId}`)
  revalidatePath('/app/progress')
  return { ok: true }
}

/** Imports the bundled sample lessons into the current account, skipping any already loaded. */
export async function loadSampleLessons() {
  const { user, db, pair } = await ctx()
  try {
    const { missingSeedLessons } = await import('./seeds')
    const seeds = await missingSeedLessons(db, user.id, pair.id)
    for (const lesson of seeds) {
      await saveLesson(db, user.id, { lesson, situation: lesson.situation, source: 'seed', pair })
    }
    after(() => warmLessonAudio(seeds.flatMap(l => lessonTexts(l, pair)), pair.id))
  } catch (err) {
    console.error('loadSampleLessons failed', err)
    return { error: 'Could not load the sample lessons. Try again.' }
  }
  revalidatePath('/app')
  revalidatePath('/app/lessons')
  return { ok: true }
}
