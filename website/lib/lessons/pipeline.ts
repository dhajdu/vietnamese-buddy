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

  // Words this save created, so a failed save can take them back out.
  let created: string[] = []
  try {
    // Vocabulary: insert the words that don't exist yet, then read back all of them.
    // The dedupe key is the language being learned, so the two directions keep
    // separate stores and never collide. Duplicates are skipped on the unique key
    // rather than checked first, so a lesson saving at the same moment with the
    // same new word cannot make this insert fail.
    const items = lesson.vocabulary.map(v => ({
      user_id: userId,
      pair: pair.id,
      vietnamese: v.vietnamese,
      english: v.english,
      normalized: normalizeTerm(v[pair.targetField]),
    }))
    const { data: inserted, error: iErr } = await db.from('vocabulary')
      .upsert(items, { onConflict: 'user_id,pair,normalized', ignoreDuplicates: true }).select('id')
    if (iErr) throw new Error(`vocabulary insert failed: ${iErr.message}`)
    created = (inserted ?? []).map(r => r.id as string)

    const { data: words, error: wErr } = await db.from('vocabulary')
      .select('id, normalized, status').eq('user_id', userId).eq('pair', pair.id).in('normalized', items.map(i => i.normalized))
    if (wErr) throw new Error(`vocabulary read failed: ${wErr.message}`)
    const all = (words ?? []) as { id: string; normalized: string; status: string }[]

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

    return { lessonId, newWords: created.length }
  } catch (err) {
    await rollback(db, lessonId, created)
    throw err
  }
}

/**
 * Undoes a failed save: the lesson row (its join rows and cards cascade) and the
 * words it created. A word another lesson has linked in the meantime stays.
 * Failures here are logged, and the caller still sees the original error.
 */
async function rollback(db: SupabaseClient, lessonId: string, createdWordIds: string[]) {
  const { error: lErr } = await db.from('lessons').delete().eq('id', lessonId)
  if (lErr) return console.error('saveLesson rollback: lesson delete failed', lErr)
  if (!createdWordIds.length) return

  const { data: linked, error: jErr } = await db.from('lesson_vocabulary')
    .select('vocabulary_id').in('vocabulary_id', createdWordIds)
  if (jErr) return console.error('saveLesson rollback: link read failed', jErr)
  const inUse = new Set((linked ?? []).map(r => r.vocabulary_id as string))
  const orphans = createdWordIds.filter(id => !inUse.has(id))
  if (!orphans.length) return

  const { error: vErr } = await db.from('vocabulary').delete().in('id', orphans)
  if (vErr) console.error('saveLesson rollback: vocabulary delete failed', vErr)
}
