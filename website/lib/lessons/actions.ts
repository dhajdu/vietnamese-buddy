// lib/lessons/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { generateLesson, LessonGenerationError } from '@/lib/ai/generate'
import { saveLesson } from './pipeline'
import { recordActivity } from '@/lib/activity/actions'

const DAILY_LIMIT = 20

async function ctx() {
  const user = await requireAuth()
  const db = await createClient()
  const { data: profile } = await db.from('profiles').select('timezone').eq('id', user.id).single()
  return { user, db, tz: profile?.timezone as string | undefined }
}

async function generateAndSave(situation: string, parentLessonId: string | null, adjustment?: string) {
  const { user, db, tz } = await ctx()

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await db.from('lessons').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('source', 'ai').gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) return { error: `Daily limit of ${DAILY_LIMIT} lessons reached. Come back tomorrow.` }

  const { data: recent } = await db.from('lessons').select('grammar_topic')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)

  let lessonId: string
  try {
    const lesson = await generateLesson({
      situation, adjustment, recentGrammar: (recent ?? []).map(r => r.grammar_topic as string),
    })
    ;({ lessonId } = await saveLesson(db, user.id, { lesson, situation, source: 'ai', parentLessonId }))
    await recordActivity(db, 'lesson_created', tz)
  } catch (err) {
    if (err instanceof LessonGenerationError) return { error: err.message }
    console.error('createLesson failed', err)
    return { error: 'Something went wrong saving the lesson. Try again.' }
  }
  revalidatePath('/')
  revalidatePath('/lessons')
  redirect(`/lessons/${lessonId}`)
}

export async function createLesson(_prev: { error?: string } | null, formData: FormData) {
  const situation = String(formData.get('situation') ?? '').trim()
  if (!situation) return { error: 'Describe a situation first.' }
  return generateAndSave(situation, null)
}

export async function regenerateLesson(lessonId: string, adjustment?: string) {
  const { user, db } = await ctx()
  const { data: original } = await db.from('lessons').select('situation, parent_lesson_id')
    .eq('id', lessonId).eq('user_id', user.id).single()
  if (!original) return { error: 'Lesson not found.' }
  const parent = (original.parent_lesson_id as string | null) ?? lessonId
  return generateAndSave(original.situation as string, parent, adjustment?.trim() || undefined)
}

export async function completeLesson(lessonId: string) {
  const { user, db, tz } = await ctx()
  const { error } = await db.from('lessons').update({ completed_at: new Date().toISOString() })
    .eq('id', lessonId).eq('user_id', user.id).is('completed_at', null)
  if (error) return { error: error.message }
  await recordActivity(db, 'lesson_completed', tz)
  revalidatePath(`/lessons/${lessonId}`)
  revalidatePath('/progress')
  return { ok: true }
}

/** Imports the three bundled sample lessons into the current account. Skips if any lesson already exists. */
export async function loadSampleLessons() {
  const { user, db } = await ctx()
  const { count } = await db.from('lessons').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((count ?? 0) > 0) return { error: 'You already have lessons.' }
  const { loadSeedLessons } = await import('./seeds')
  for (const lesson of loadSeedLessons()) {
    await saveLesson(db, user.id, { lesson, situation: lesson.situation, source: 'seed' })
  }
  revalidatePath('/')
  revalidatePath('/lessons')
  return { ok: true }
}
