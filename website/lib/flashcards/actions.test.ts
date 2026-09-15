import { describe, it, expect, vi, beforeEach } from 'vitest'

type Query = { table: string; ops: [string, unknown[]][] }
type Result = { data?: unknown; error?: { message: string } | null }

const state = vi.hoisted(() => ({ db: null as unknown }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/guards', () => ({ requireAuth: vi.fn(async () => ({ id: 'U1' })) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => state.db) }))
vi.mock('@/lib/activity/actions', () => ({ recordActivity: vi.fn(async () => {}) }))

import { reviewCard } from './actions'
import { recordActivity } from '@/lib/activity/actions'

const CARD = '8f14e45f-ceea-467a-9e53-8a8e1b3c2d4f'
const WORD = '1c9b3a2e-5d4f-4b6a-8c7d-2e1f0a9b8c7d'

/** A query builder that records every call and answers from `respond` when awaited. */
function fakeDb(respond: (q: Query) => Result) {
  const queries: Query[] = []
  state.db = {
    from(table: string) {
      const q: Query = { table, ops: [] }
      queries.push(q)
      const b: Record<string, unknown> = {}
      for (const m of ['select', 'update', 'eq', 'neq', 'single', 'maybeSingle'])
        b[m] = (...args: unknown[]) => { q.ops.push([m, args]); return b }
      b.then = (resolve: (v: Result) => void) => resolve({ data: null, error: null, ...respond(q) })
      return b
    },
  }
  return queries
}
const has = (q: Query, op: string) => q.ops.some(([m]) => m === op)
const updates = (queries: Query[], table: string) =>
  queries.filter(q => q.table === table && has(q, 'update'))

const reads = (q: Query): Result => {
  if (q.table === 'flashcards' && has(q, 'select')) return { data: { vocabulary_id: WORD, review_count: 2, vocabulary: { review_count: 4 } } }
  if (q.table === 'profiles') return { data: { timezone: 'Asia/Ho_Chi_Minh' } }
  return {}
}

describe('reviewCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks the card, its word and the word\'s other cards known', async () => {
    const queries = fakeDb(reads)

    expect(await reviewCard(CARD, 'known')).toEqual({ ok: true })

    const [card, siblings] = updates(queries, 'flashcards')
    expect(card.ops[0][1][0]).toMatchObject({ status: 'known', review_count: 3 })
    expect(siblings.ops[0][1][0]).toEqual({ status: 'known' })
    expect(siblings.ops).toContainEqual(['eq', ['vocabulary_id', WORD]])
    expect(siblings.ops).toContainEqual(['neq', ['id', CARD]])
    expect(updates(queries, 'vocabulary')[0].ops[0][1][0]).toMatchObject({ status: 'known', review_count: 5 })
    expect(recordActivity).toHaveBeenCalledWith(state.db, 'card_reviewed', 'Asia/Ho_Chi_Minh')
  })

  it('leaves other cards alone on Again', async () => {
    const queries = fakeDb(reads)
    await reviewCard(CARD, 'again')
    expect(updates(queries, 'flashcards')).toHaveLength(1)
    expect(updates(queries, 'vocabulary')[0].ops[0][1][0]).toMatchObject({ status: 'learning' })
  })

  it('rejects arguments that did not come from the app without querying', async () => {
    const queries = fakeDb(reads)
    expect(await reviewCard('x', 'known')).toEqual({ error: 'Card not found.' })
    expect(await reviewCard(CARD, 'maybe' as 'known')).toEqual({ error: 'Card not found.' })
    expect(queries).toHaveLength(0)
  })

  it('returns a fixed message when a write fails, and records no activity', async () => {
    fakeDb(q => q.table === 'vocabulary' ? { error: { message: 'permission denied for table vocabulary' } } : reads(q))
    expect(await reviewCard(CARD, 'known')).toEqual({ error: 'Could not save that answer. Try again.' })
    expect(recordActivity).not.toHaveBeenCalled()
  })
})
