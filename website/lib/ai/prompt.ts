// lib/ai/prompt.ts — composes the shared stance with one pair's language layer.
import type { LanguagePair } from '@/lib/pairs'
import { TEACHING_STANCE } from './stance'

export function systemPrompt(pair: LanguagePair) {
  return `${pair.teachingProfile}\n\n${TEACHING_STANCE}`
}

export function userPrompt(situation: string, recentGrammar: string[], adjustment?: string) {
  const lines = [`Situation: ${situation}`]
  if (adjustment) lines.push(`Adjustment requested by the learner: ${adjustment}`)
  if (recentGrammar.length) lines.push(`Grammar topics already taught recently (pick something different): ${recentGrammar.join('; ')}`)
  return lines.join('\n')
}
