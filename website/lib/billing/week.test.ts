import { describe, it, expect } from 'vitest'
import { weekStart, zonedMidnightUtc } from './week'

describe('weekStart', () => {
  it('returns the Monday of that local week', () => {
    expect(weekStart('2026-09-12')).toBe('2026-09-07') // Saturday → Monday
    expect(weekStart('2026-09-07')).toBe('2026-09-07') // Monday → itself
  })
  it('puts Sunday at the end of its week, not the start', () => {
    expect(weekStart('2026-09-13')).toBe('2026-09-07')
    expect(weekStart('2026-09-14')).toBe('2026-09-14') // the next Monday
  })
  it('crosses a month and a year boundary', () => {
    expect(weekStart('2026-09-01')).toBe('2026-08-31')
    expect(weekStart('2027-01-01')).toBe('2026-12-28')
  })
})

describe('zonedMidnightUtc', () => {
  it('moves local midnight back for a zone ahead of UTC', () => {
    expect(zonedMidnightUtc('2026-09-14', 'Asia/Ho_Chi_Minh')).toBe('2026-09-13T17:00:00.000Z')
  })
  it('moves local midnight forward for a zone behind UTC', () => {
    expect(zonedMidnightUtc('2026-09-14', 'America/Los_Angeles')).toBe('2026-09-14T07:00:00.000Z')
  })
  it('uses the offset in force on that date, not today', () => {
    expect(zonedMidnightUtc('2026-11-02', 'America/Los_Angeles')).toBe('2026-11-02T08:00:00.000Z') // after fall back
    expect(zonedMidnightUtc('2026-09-14', 'UTC')).toBe('2026-09-14T00:00:00.000Z')
  })
})
