import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getLesson, lessonStates } from './queries'

type Query = { table: string; ops: [string, unknown[]][] }
type Result = { data?: unknown; error?: { message: string; code?: string } | null }

/** A query builder that records every call and answers from `respond` when awaited. */
function fakeDb(respond: (q: Query) => Result) {
  const queries: Query[] = []
  const db = {
    from(table: string) {
      const q: Query = { table, ops: [] }
      queries.push(q)
      const b: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'in', 'single'])
        b[m] = (...args: unknown[]) => { q.ops.push([m, args]); return b }
      b.then = (resolve: (v: Result) => void) => resolve({ data: null, error: null, ...respond(q) })
      return b
    },
  }
  return { db: db as unknown as SupabaseClient, queries }
}
const idsOf = (q: Query) => q.ops.find(([m]) => m === 'in')?.[1][1] as string[]

const at = (s: number) => `2026-09-15T10:00:${String(s).padStart(2, '0')}.5+00:00`
const cards = (lesson: string, ...statuses: string[]) => statuses.map(status => ({ lesson_id: lesson, status }))

describe('lessonStates', () => {
  it('classifies reviewed, new, due, and a lesson answered Again throughout', async () => {
    const lessons = [
      { id: 'done', created_at: at(1) }, { id: 'fresh', created_at: at(2) },
      { id: 'part', created_at: at(3) }, { id: 'again', created_at: at(4) },
    ]
    const { db } = fakeDb(q => q.table === 'flashcards'
      ? { data: [...cards('done', 'known', 'known'), ...cards('fresh', 'new', 'new'), ...cards('part', 'known', 'new', 'review'), ...cards('again', 'review', 'review', 'review')] }
      : { data: [
          { lesson_id: 'fresh', vocabulary: { first_seen_at: at(2).replace('.5+', '.500001+') } },
          { lesson_id: 'fresh', vocabulary: { first_seen_at: at(1) } },
        ] })

    const states = await lessonStates(db, 'U1', lessons)

    expect(states.get('done')).toEqual({ kind: 'reviewed' })
    expect(states.get('fresh')).toEqual({ kind: 'new', count: 1 })
    expect(states.get('part')).toEqual({ kind: 'due', count: 2 })
    expect(states.get('again')).toEqual({ kind: 'due', count: 3 })
  })

  it('reads only the lessons passed in, in requests small enough to stay under the row cap', async () => {
    const lessons = Array.from({ length: 30 }, (_, i) => ({ id: `L${i}`, created_at: at(i) }))
    const { db, queries } = fakeDb(() => ({ data: [] }))

    await lessonStates(db, 'U1', lessons)

    const flashcardReads = queries.filter(q => q.table === 'flashcards')
    expect(flashcardReads.map(q => idsOf(q).length)).toEqual([25, 5])
    expect(flashcardReads.flatMap(idsOf)).toEqual(lessons.map(l => l.id))
    expect(queries.filter(q => q.table === 'lesson_vocabulary')).toHaveLength(2)
  })
})

describe('getLesson', () => {
  it('reads a missing row or a malformed id as not found', async () => {
    for (const code of ['PGRST116', '22P02']) {
      const { db } = fakeDb(() => ({ error: { message: 'no', code } }))
      expect(await getLesson(db, 'U1', 'x')).toBeNull()
    }
  })

  it('throws on any other read failure, so the error page shows instead of a 404', async () => {
    const { db } = fakeDb(() => ({ error: { message: 'timeout', code: '57014' } }))
    await expect(getLesson(db, 'U1', 'x')).rejects.toThrow('lesson read failed')
  })
})
