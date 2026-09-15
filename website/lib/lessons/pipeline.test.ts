import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveLesson } from './pipeline'
import { loadSeedLessons } from './seeds'
import { getPair } from '@/lib/pairs'

type Query = { table: string; ops: [string, unknown[]][] }
type Result = { data?: unknown; error?: { message: string } | null }

/** A query builder that records every call and answers from `respond` when awaited. */
function fakeDb(respond: (q: Query) => Result) {
  const queries: Query[] = []
  const db = {
    from(table: string) {
      const q: Query = { table, ops: [] }
      queries.push(q)
      const b: Record<string, unknown> = {}
      for (const m of ['select', 'insert', 'upsert', 'update', 'delete', 'eq', 'neq', 'in', 'single'])
        b[m] = (...args: unknown[]) => { q.ops.push([m, args]); return b }
      b.then = (resolve: (v: Result) => void) => resolve({ data: null, error: null, ...respond(q) })
      return b
    },
  }
  return { db: db as unknown as SupabaseClient, queries }
}
const has = (q: Query, op: string) => q.ops.some(([m]) => m === op)
const args = (q: Query, op: string) => q.ops.find(([m]) => m === op)?.[1]

const pair = getPair('en-vi')
const lesson = loadSeedLessons('en-vi')[0]
const words = lesson.vocabulary.map((v, i) => ({ id: `v${i}`, normalized: v.vietnamese.toLowerCase(), status: i === 0 ? 'known' : 'new' }))

describe('saveLesson', () => {
  it('skips existing words on the unique key and makes no card for a known word', async () => {
    const { db, queries } = fakeDb(q => {
      if (q.table === 'lessons') return { data: { id: 'L1' } }
      if (q.table === 'vocabulary' && has(q, 'upsert')) return { data: [{ id: 'v1' }, { id: 'v2' }] }
      if (q.table === 'vocabulary') return { data: words }
      return {}
    })

    const r = await saveLesson(db, 'U1', { lesson, situation: lesson.situation, source: 'seed', pair })

    expect(r).toEqual({ lessonId: 'L1', newWords: 2 })
    const upsert = queries.find(q => q.table === 'vocabulary' && has(q, 'upsert'))!
    expect(args(upsert, 'upsert')?.[1]).toEqual({ onConflict: 'user_id,pair,normalized', ignoreDuplicates: true })
    const cards = args(queries.find(q => q.table === 'flashcards')!, 'insert')?.[0] as { vocabulary_id: string | null }[]
    expect(cards.filter(c => c.vocabulary_id === null)).toHaveLength(lesson.phrases.length)
    expect(cards.some(c => c.vocabulary_id === 'v0')).toBe(false)
  })

  it('rolls back the lesson and the words it created, keeping any another lesson now uses', async () => {
    const { db, queries } = fakeDb(q => {
      if (q.table === 'lessons' && has(q, 'insert')) return { data: { id: 'L1' } }
      if (q.table === 'vocabulary' && has(q, 'upsert')) return { data: [{ id: 'v1' }, { id: 'v2' }] }
      if (q.table === 'vocabulary' && has(q, 'select')) return { data: words }
      if (q.table === 'lesson_vocabulary' && has(q, 'select')) return { data: [{ vocabulary_id: 'v1' }] }
      if (q.table === 'flashcards') return { error: { message: 'boom' } }
      return {}
    })

    await expect(saveLesson(db, 'U1', { lesson, situation: lesson.situation, source: 'seed', pair }))
      .rejects.toThrow('flashcards insert failed: boom')

    const lessonDelete = queries.find(q => q.table === 'lessons' && has(q, 'delete'))!
    expect(args(lessonDelete, 'eq')).toEqual(['id', 'L1'])
    const wordDelete = queries.find(q => q.table === 'vocabulary' && has(q, 'delete'))!
    expect(args(wordDelete, 'in')).toEqual(['id', ['v2']])
  })
})
