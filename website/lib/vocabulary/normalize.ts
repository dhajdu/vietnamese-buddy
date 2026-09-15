// lib/vocabulary/normalize.ts
// Also curly quotes, guillemets, and en and em dashes, which models write as often as the ASCII forms.
const EDGE = /^[\s.,!?;:"'()\[\]…“”‘’«»–—]+|[\s.,!?;:"'()\[\]…“”‘’«»–—]+$/g

/**
 * Dedupe key for a word or short phrase in either language.
 *
 * Keeps diacritics, because ma / má / mà / mã are four different Vietnamese
 * words. Drops case, Unicode form differences, bracketed glosses, edge
 * punctuation and extra whitespace. Safe for English, where the diacritic rule
 * is simply a no-op.
 */
export function normalizeTerm(s: string): string {
  return s
    .normalize('NFC')
    .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*$/, '')
    .toLowerCase()
    .replace(EDGE, '')
    .replace(/\s+/g, ' ')
    .trim()
}
