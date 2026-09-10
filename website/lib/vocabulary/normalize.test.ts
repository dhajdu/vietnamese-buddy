import { describe, it, expect } from 'vitest'
import { normalizeVietnamese as n } from './normalize'

describe('normalizeVietnamese', () => {
  it('lowercases and trims', () => expect(n('  Coi Phim ')).toBe('coi phim'))
  it('strips edge punctuation only', () => expect(n('Tối nay đi ăn hông?')).toBe('tối nay đi ăn hông'))
  it('keeps diacritics distinct', () => {
    expect(new Set(['ma', 'má', 'mà', 'mã'].map(n)).size).toBe(4)
  })
  it('unifies NFC/NFD', () => expect(n('ế'.normalize('NFD'))).toBe('ế'.normalize('NFC')))
  it('drops bracketed glosses', () => expect(n('hông (Southern)')).toBe('hông'))
  it('collapses whitespace', () => expect(n('bún   thịt  nướng')).toBe('bún thịt nướng'))
})
