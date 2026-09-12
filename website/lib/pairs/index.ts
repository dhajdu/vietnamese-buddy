// lib/pairs/index.ts
import type { LanguagePair, PairId } from './types'
import { enVi } from './en-vi'
import { viEn } from './vi-en'

export * from './types'

export const PAIRS: Record<PairId, LanguagePair> = { 'en-vi': enVi, 'vi-en': viEn }
export const PAIR_IDS = Object.keys(PAIRS) as PairId[]
export const DEFAULT_PAIR: PairId = 'en-vi'

export function isPairId(v: unknown): v is PairId {
  return typeof v === 'string' && v in PAIRS
}

/** Never throws: an unknown id falls back to the default rather than 500ing a page. */
export function getPair(id: unknown): LanguagePair {
  return isPairId(id) ? PAIRS[id] : PAIRS[DEFAULT_PAIR]
}
