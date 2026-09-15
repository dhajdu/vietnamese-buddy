// lib/ai/generate.ts
import { generateObject, NoObjectGeneratedError } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LessonSchema, type Lesson } from './schema'
import { systemPrompt, userPrompt } from './prompt'
import { normalizeTerm } from '@/lib/vocabulary/normalize'
import type { LanguagePair } from '@/lib/pairs'

export class LessonGenerationError extends Error {}

// One budget for every attempt: pages hosting the action set maxDuration = 180.
const DEADLINE_MS = 165_000
// A lesson usually lands in 30 to 60s, so a retry with less time left would only time out.
const MIN_RETRY_MS = 60_000

export const DEFAULT_MODEL_SPEC = 'anthropic/claude-sonnet-5'

/**
 * A spec is "<provider>/<model>". The provider picks the key. For OpenRouter the
 * model name itself contains a slash, so everything after the first segment is
 * the model: openrouter/qwen/qwen-2.5-72b-instruct.
 */
export function resolveModel(spec: string) {
  const [provider, ...rest] = spec.split('/')
  const name = rest.join('/')
  if (!name) throw new LessonGenerationError(`Malformed model "${spec}". Use provider/model.`)
  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new LessonGenerationError('ANTHROPIC_API_KEY is not set.')
    return createAnthropic({ apiKey: key })(name)
  }
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new LessonGenerationError('OPENAI_API_KEY is not set.')
    return createOpenAI({ apiKey: key })(name)
  }
  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY
    if (!key) throw new LessonGenerationError('OPENROUTER_API_KEY is not set. Create one at openrouter.ai/keys.')
    return createOpenRouter({ apiKey: key })(name)
  }
  throw new LessonGenerationError(`Unknown provider "${provider}". Use anthropic, openai or openrouter.`)
}

/**
 * Dedupe vocabulary inside one lesson on the language being learned, and tidy edges. Pure.
 * Phrase and example text is trimmed too: /api/tts trims the text it is asked for and
 * matches it exactly against the saved lesson.
 */
export function tidyLesson(lesson: Lesson, situation: string, pair: LanguagePair): Lesson {
  const seen = new Set<string>()
  const vocabulary = lesson.vocabulary
    .map(v => ({ vietnamese: v.vietnamese.trim().replace(/[.,!?;:]+$/, ''), english: v.english.trim().replace(/[.,!?;:]+$/, '') }))
    .filter(v => {
      const k = normalizeTerm(v[pair.targetField])
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
  const trimText = <T extends { vietnamese: string; english: string }>(p: T): T =>
    ({ ...p, vietnamese: p.vietnamese.trim(), english: p.english.trim() })
  return {
    ...lesson,
    phrases: lesson.phrases.map(trimText),
    vocabulary,
    grammar: { ...lesson.grammar, examples: lesson.grammar.examples.map(trimText) },
    situation: lesson.situation || situation,
  }
}

/** The schema problems behind a rejected object, short enough to hand back to the model. */
function validationFeedback(err: NoObjectGeneratedError): string {
  const cause = err.cause as { cause?: { issues?: { path: PropertyKey[]; message: string }[] }; message?: string } | undefined
  const issues = cause?.cause?.issues
  if (issues?.length) return issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
  return err.message
}

export interface GenerationResult {
  lesson: Lesson
  modelSpec: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

export async function generateLesson(opts: {
  pair: LanguagePair
  situation: string
  recentGrammar?: string[]
  adjustment?: string
  /** Overrides the configured model. Used by the admin test harness. */
  modelSpec?: string
}): Promise<GenerationResult> {
  const situation = opts.situation.trim()
  if (!situation) throw new LessonGenerationError('Describe a situation first.')
  if (situation.length > 500) throw new LessonGenerationError('Keep the situation under 500 characters.')

  const modelSpec = opts.modelSpec ?? process.env.AI_MODEL ?? DEFAULT_MODEL_SPEC
  const m = resolveModel(modelSpec)
  let prompt = userPrompt(situation, opts.recentGrammar ?? [], opts.adjustment)
  const started = Date.now()
  const deadline = started + DEADLINE_MS
  let inputTokens = 0
  let outputTokens = 0

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0 && deadline - Date.now() < MIN_RETRY_MS) break
    let object: Lesson
    try {
      const r = await generateObject({
        model: m,
        schema: LessonSchema,
        system: systemPrompt(opts.pair),
        prompt,
        temperature: 0.7,
        abortSignal: AbortSignal.timeout(deadline - Date.now()),
        // Routine structured task: low effort keeps Claude's thinking short so a lesson lands in ~30–60s.
        providerOptions: { anthropic: { effort: 'low' } },
      })
      object = r.object
      inputTokens += r.usage?.inputTokens ?? 0
      outputTokens += r.usage?.outputTokens ?? 0
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new LessonGenerationError('The lesson took too long to write. Try again in a moment.')
      }
      // generateObject throws, rather than returning, when the object does not match the schema.
      if (!NoObjectGeneratedError.isInstance(err)) throw err
      inputTokens += err.usage?.inputTokens ?? 0
      outputTokens += err.usage?.outputTokens ?? 0
      prompt += `\n\nPrevious attempt failed validation: ${validationFeedback(err)}. Fix these and return the full lesson again.`
      continue
    }
    const tidy = tidyLesson(object, situation, opts.pair)
    if (tidy.vocabulary.length >= 12) {
      return { lesson: tidy, modelSpec, inputTokens, outputTokens, latencyMs: Date.now() - started }
    }
    prompt += `\n\nPrevious attempt had too few unique vocabulary items after deduplication. Provide at least 14 distinct items.`
  }
  throw new LessonGenerationError('The lesson came back malformed. Try again or rephrase the situation.')
}
