// lib/vocabulary/normalize.ts
const EDGE = /^[\s.,!?;:"'()\[\]…]+|[\s.,!?;:"'()\[\]…]+$/g

/**
 * Dedupe key for a Vietnamese word or short phrase.
 * Keeps diacritics (ma / má / mà / mã are different words). Drops case,
 * Unicode form differences, bracketed glosses, edge punctuation, and extra
 * whitespace.
 */
export function normalizeVietnamese(s: string): string {
  return s
    .normalize('NFC')
    .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*$/, '')
    .toLowerCase()
    .replace(EDGE, '')
    .replace(/\s+/g, ' ')
    .trim()
}
