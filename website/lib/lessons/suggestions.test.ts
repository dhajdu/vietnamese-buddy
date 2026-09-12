import { describe, it, expect } from 'vitest'
import { pickSuggestions, greeting } from './suggestions'
import { PAIRS } from '@/lib/pairs'

describe('pickSuggestions', () => {
  it('returns four distinct chips', () => {
    for (const pair of Object.values(PAIRS)) {
      for (let day = 1; day <= 31; day++) {
        const got = pickSuggestions(pair, [], day)
        expect(got).toHaveLength(4)
        expect(new Set(got).size).toBe(4)
      }
    }
  })
  it('stays distinct when the pool is nearly exhausted', () => {
    const pair = { ...PAIRS['en-vi'], situationExamples: ['a', 'b', 'c', 'd', 'e'] }
    const got = pickSuggestions(pair, [], 3)
    expect(new Set(got).size).toBe(4)
  })
})

describe('greeting', () => {
  it('follows the pair locale', () => {
    const morning = new Date('2026-09-12T02:00:00Z') // 09:00 in Saigon
    expect(greeting(PAIRS['en-vi'], 'Asia/Ho_Chi_Minh', 'Dave', morning)).toBe('Good morning, Dave.')
    expect(greeting(PAIRS['vi-en'], 'Asia/Ho_Chi_Minh', 'Dave', morning)).toBe('Chào buổi sáng, Dave.')
  })
})
