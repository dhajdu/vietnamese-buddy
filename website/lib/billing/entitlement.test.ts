import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getEntitlement, getSettings } from './entitlement'

type Filter = [op: string, column: string, value: unknown]
type Result = { data?: unknown; count?: number | null; error: { message: string } | null }

/** A query builder per from() call that records its filters and resolves by table. */
function fakeDb(opts: { weekCount?: number; dayCount?: number; monetised?: boolean; failTable?: string } = {}) {
  const calls: { table: string; filters: Filter[] }[] = []
  const db = {
    from(table: string) {
      const call = { table, filters: [] as Filter[] }
      calls.push(call)
      const result = (): Result => {
        if (table === opts.failTable) return { data: null, count: null, error: { message: 'boom' } }
        if (table === 'app_settings') return { data: { free_lessons_per_week: 1, paid_lessons_per_day: 3 }, error: null }
        if (table === 'subscriptions') return { data: null, error: null }
        if (table === 'plans') return { data: { monetised: opts.monetised ?? true }, error: null }
        const weekly = call.filters.some(([op, col]) => op === 'eq' && col === 'pair')
        return { count: weekly ? (opts.weekCount ?? 0) : (opts.dayCount ?? 0), error: null }
      }
      const q: Record<string, unknown> = {}
      q.select = () => q
      q.eq = (col: string, v: unknown) => { call.filters.push(['eq', col, v]); return q }
      q.gte = (col: string, v: unknown) => { call.filters.push(['gte', col, v]); return q }
      q.single = async () => result()
      q.maybeSingle = async () => result()
      q.then = (resolve: (v: Result) => void) => resolve(result())
      return q
    },
  }
  return { db: db as unknown as SupabaseClient, calls }
}

const learner = { pair: 'en-vi' as const, timezone: 'Asia/Ho_Chi_Minh', isAdmin: false }

describe('getEntitlement', () => {
  // Monday 2026-09-14 03:00 in Ho Chi Minh City, which is still Sunday in UTC.
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-13T20:00:00Z')) })
  afterEach(() => { vi.useRealTimers() })

  it('counts usage from the generation ledger, from local Monday midnight', async () => {
    const { db, calls } = fakeDb()
    await getEntitlement(db, 'U1', learner)
    const counts = calls.filter(c => c.table === 'lesson_generations')
    expect(counts).toHaveLength(2)
    expect(calls.some(c => c.table === 'lessons')).toBe(false)
    const weekly = counts.find(c => c.filters.some(([, col]) => col === 'pair'))!
    expect(weekly.filters).toContainEqual(['gte', 'created_at', '2026-09-13T17:00:00.000Z'])
  })

  it('blocks a free learner who has used this week’s lesson', async () => {
    const { db } = fakeDb({ weekCount: 1, dayCount: 1 })
    const ent = await getEntitlement(db, 'U1', learner)
    expect(ent).toMatchObject({ plan: 'free', canCreate: false, reason: 'weekly', canAdjust: false, weeklyLimit: 1 })
  })

  it('lets an unmonetised pair adjust while under the allowance', async () => {
    const { db } = fakeDb({ monetised: false })
    const ent = await getEntitlement(db, 'U1', learner)
    expect(ent).toMatchObject({ canCreate: true, canAdjust: true })
  })

  it('fails closed when a count cannot be read', async () => {
    const { db } = fakeDb({ failTable: 'lesson_generations' })
    await expect(getEntitlement(db, 'U1', learner)).rejects.toThrow()
  })
})

describe('getSettings', () => {
  it('throws instead of guessing when the settings row cannot be read', async () => {
    const { db } = fakeDb({ failTable: 'app_settings' })
    await expect(getSettings(db)).rejects.toThrow()
  })
})
