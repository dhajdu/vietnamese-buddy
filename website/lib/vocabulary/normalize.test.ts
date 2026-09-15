import { describe, it, expect } from 'vitest'
import { normalizeTerm as n } from './normalize'

describe('normalizeTerm', () => {
  it('lowercases and trims', () => expect(n('  Coi Phim ')).toBe('coi phim'))
  it('strips edge punctuation only', () => expect(n('Tối nay đi ăn hông?')).toBe('tối nay đi ăn hông'))
  it('keeps Vietnamese diacritics distinct', () => {
    expect(new Set(['ma', 'má', 'mà', 'mã'].map(n)).size).toBe(4)
  })
  it('unifies NFC/NFD', () => expect(n('ế'.normalize('NFD'))).toBe('ế'.normalize('NFC')))
  it('drops bracketed glosses', () => expect(n('hông (Southern)')).toBe('hông'))
  it('collapses whitespace', () => expect(n('bún   thịt  nướng')).toBe('bún thịt nướng'))
  it('handles English terms', () => {
    expect(n('  Would you mind…? ')).toBe('would you mind')
    expect(n('Pick Up')).toBe('pick up')
  })
  it('strips curly quotes and guillemets at the edges', () => {
    expect(n('“Hông”')).toBe('hông')
    expect(n('‘nha’')).toBe('nha')
    expect(n('«coi phim»')).toBe('coi phim')
  })
  it('strips en and em dashes at the edges', () => {
    expect(n('— hông –')).toBe('hông')
  })
  it('keeps inner apostrophes and dashes', () => {
    expect(n('“Don’t”')).toBe('don’t')
    expect(n('check–in')).toBe('check–in')
  })
  it('keeps tone-mark placement as written', () => expect(n('khỏe')).not.toBe(n('khoẻ')))
})
