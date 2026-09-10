import { describe, it, expect } from 'vitest'
import { computeStreak, localDate, lastNDates } from './streak'

describe('localDate', () => {
  it('uses the timezone, not UTC', () => {
    // 2026-09-10 16:30 UTC is 2026-09-10 23:30 ICT; 17:30 UTC is 00:30 next day ICT
    expect(localDate('Asia/Ho_Chi_Minh', new Date('2026-09-10T16:30:00Z'))).toBe('2026-09-10')
    expect(localDate('Asia/Ho_Chi_Minh', new Date('2026-09-10T17:30:00Z'))).toBe('2026-09-11')
  })
})

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-09-08', '2026-09-09', '2026-09-10'], '2026-09-10'))
      .toEqual({ current: 3, longest: 3, totalDays: 3 })
  })
  it('keeps the streak alive if today has nothing yet', () => {
    expect(computeStreak(['2026-09-08', '2026-09-09'], '2026-09-10').current).toBe(2)
  })
  it('breaks after a missed day', () => {
    expect(computeStreak(['2026-09-07', '2026-09-08'], '2026-09-10').current).toBe(0)
  })
  it('finds the longest run anywhere', () => {
    const r = computeStreak(['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-09-10'], '2026-09-10')
    expect(r).toEqual({ current: 1, longest: 4, totalDays: 5 })
  })
  it('handles empty', () => expect(computeStreak([], '2026-09-10')).toEqual({ current: 0, longest: 0, totalDays: 0 }))
})

describe('lastNDates', () => {
  it('ends today, crosses month boundary', () => {
    expect(lastNDates('2026-09-02', 3)).toEqual(['2026-08-31', '2026-09-01', '2026-09-02'])
  })
})
