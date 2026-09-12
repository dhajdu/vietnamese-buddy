// lib/pairs/types.ts
/**
 * A language pair is the only Vietnamese-specific (or English-specific) thing in
 * the app. Everything else — the pipeline, flashcards, vocabulary, streaks,
 * billing — is language-neutral.
 *
 * Note on the lesson schema: it does NOT change between pairs. A phrase always
 * carries a `vietnamese` string and an `english` string. What flips is which of
 * the two is the language being learned (`targetField`) and therefore which one
 * is set large, spoken aloud, and used as the vocabulary dedupe key. The
 * `explanation` is always written in the learner's own language.
 */
export type PairId = 'en-vi' | 'vi-en'
export type Locale = 'en' | 'vi'
export type PhraseField = 'vietnamese' | 'english'

export interface LanguagePair {
  id: PairId
  /** Which dictionary the interface uses. Always the learner's own language. */
  uiLocale: Locale
  /** The language being learned. Rendered large, spoken, and deduped on. */
  targetField: PhraseField
  /** The learner's own language. Rendered as the gloss. */
  sourceField: PhraseField
  /** Shown in the switcher, in the learner's own language. */
  label: string
  /** Short form for compact UI, e.g. "Tiếng Việt". */
  targetName: string
  /** Two letters for the switcher chip. */
  targetCode: string
  /**
   * The language layer of the prompt: who is teaching, what register, what this
   * particular learner gets wrong, which grammar to prefer and to skip.
   * Reviewed by a speaker before it changes. Bump `version` when it does.
   */
  teachingProfile: string
  /** Home suggestion chips, written in the learner's own language. */
  situationExamples: string[]
  /** Speech for the target language, or null while a provider is missing. */
  tts: { provider: 'fpt' | 'openai'; voice: string } | null
  /** Stamped on lessons so a quality regression can be traced to a profile edit. */
  version: number
}
