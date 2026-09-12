// lib/i18n/index.ts
import type { Locale } from '@/lib/pairs'
import { en, type Dictionary } from './en'
import { vi } from './vi'

const DICTIONARIES: Record<Locale, Dictionary> = { en, vi }

/** The interface language always follows the pair, never the browser. */
export function t(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en
}
export type { Dictionary }
