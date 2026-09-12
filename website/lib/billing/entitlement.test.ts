import { describe, it, expect } from 'vitest'
import { weekStart } from './week'

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
