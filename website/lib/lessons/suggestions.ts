// lib/lessons/suggestions.ts — Home chips and the greeting, both from the pair.
import type { LanguagePair } from '@/lib/pairs'
import { t } from '@/lib/i18n'

/** Four chips the learner has not obviously covered, rotating daily. */
export function pickSuggestions(pair: LanguagePair, existingSituations: string[], seedDay: number): string[] {
  const seen = existingSituations.map(s => s.toLowerCase())
  const pool = pair.situationExamples
  const fresh = pool.filter(p => !seen.some(s => s.includes(p.toLowerCase().split(' ').slice(-2).join(' '))))
  const use = fresh.length >= 4 ? fresh : pool
  const start = seedDay % use.length
  // Stride through the pool, skipping repeats: a short pool would otherwise wrap
  // and show the same chip twice.
  const out: string[] = []
  for (let i = 0; out.length < 4 && i < use.length; i++) {
    const c = use[(start + i * 3) % use.length]
    if (!out.includes(c)) out.push(c)
  }
  return out
}

export function greeting(pair: LanguagePair, tz: string, name: string | null, now = new Date()) {
  const d = t(pair.uiLocale)
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hour12: false }).format(now))
  const hello = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening
  return name ? `${hello}, ${name}.` : `${hello}.`
}
