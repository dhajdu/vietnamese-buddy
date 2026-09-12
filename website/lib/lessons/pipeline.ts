// lib/lessons/pipeline.ts
// Saves a validated lesson: lesson row → vocabulary upsert → join rows → flashcards.
// Used by the createLesson action (RLS client) and the seed script (admin client).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lesson } from '@/lib/ai/schema'
import { normalizeTerm } from '@/lib/vocabulary/normalize'
import type { LanguagePair } from '@/lib/pairs'

export interface SaveLessonInput {
  lesson: Lesson
  situation: string
  source: 'ai' | 'seed'
  pair: LanguagePair
  parentLessonId?: string | null
}

export async function saveLesson(
  db: SupabaseClient, userId: string, input: SaveLessonInput,
): Promise<{ lessonId: string; newWords: number }> {
  const { lesson, pair } = input
  const { data: row, error: lErr } = await db.from('lessons').insert({
    user_id: userId,
    situation: input.situation,
    title: lesson.title,
    grammar_topic: lesson.grammar.title,
    lesson_json: lesson,
    source: input.source,
    pair: pair.id,
    parent_lesson_id: input.parentLessonId ?? null,
  }).select('id').single()
  if (lErr || !row) throw new Error(`lesson insert failed: ${lErr?.message}`)
  const lessonId = row.id as string

  try {
    // Vocabulary: insert only the ones that don't exist yet, then read back all.
    // The dedupe key is the language being learned, so the two directions keep
    // separate stores and never collide.
    const items = lesson.vocabulary.map(v => ({
      user_id: userId,
      pair: pair.id,
      vietnamese: v.vietnamese,
      english: v.english,
      normalized: normalizeTerm(v[pair.targetField]),
    }))
    const keys = items.map(i => i.normalized)
    const { data: existing, error: eErr } = await db.from('vocabulary')
      .select('id, normalized, status').eq('user_id', userId).eq('pair', pair.id).in('normalized', keys)
    if (eErr) throw new Error(`vocabulary read failed: ${eErr.message}`)
    const existingByKey = new Map((existing ?? []).map(r => [r.normalized as string, r]))
    const fresh = items.filter(i => !existingByKey.has(i.normalized))

    let inserted: { id: string; normalized: string; status: string }[] = []
    if (fresh.length) {
      const { data, error } = await db.from('vocabulary').insert(fresh).select('id, normalized, status')
      if (error) throw new Error(`vocabulary insert failed: ${error.message}`)
      inserted = data ?? []
    }
    const all = [...(existing ?? []), ...inserted] as { id: string; normalized: string; status: string }[]

    const { error: jErr } = await db.from('lesson_vocabulary')
      .insert(all.map(v => ({ lesson_id: lessonId, vocabulary_id: v.id })))
    if (jErr) throw new Error(`lesson_vocabulary insert failed: ${jErr.message}`)

    // Flashcards: every phrase; vocabulary only when the word isn't already known.
    const byKey = new Map(all.map(v => [v.normalized, v]))
    const cards = [
      ...lesson.phrases.map(p => ({
        user_id: userId, lesson_id: lessonId, vocabulary_id: null, type: 'phrase',
        front: p[pair.targetField], back: { english: p[pair.sourceField], explanation: p.explanation },
      })),
      ...lesson.vocabulary.flatMap(v => {
        const row = byKey.get(normalizeTerm(v[pair.targetField]))
        if (!row || row.status === 'known') return []
        return [{
          user_id: userId, lesson_id: lessonId, vocabulary_id: row.id, type: 'vocabulary',
          front: v[pair.targetField], back: { english: v[pair.sourceField] },
        }]
      }),
    ]
    const { error: cErr } = await db.from('flashcards').insert(cards)
    if (cErr) throw new Error(`flashcards insert failed: ${cErr.message}`)

    return { lessonId, newWords: inserted.length }
  } catch (err) {
    await db.from('lessons').delete().eq('id', lessonId)
    throw err
  }
}
