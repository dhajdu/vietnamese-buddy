// lib/ai/generate.ts
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LessonSchema, type Lesson } from './schema'
import { systemPrompt, userPrompt } from './prompt'
import { normalizeTerm } from '@/lib/vocabulary/normalize'
import type { LanguagePair } from '@/lib/pairs'

export class LessonGenerationError extends Error {}

const TIMEOUT_MS = 170_000 // pages hosting the action set maxDuration = 180

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

/** Dedupe vocabulary inside one lesson on the language being learned, and tidy edges. Pure. */
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
  return { ...lesson, vocabulary, situation: lesson.situation || situation }
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
  let inputTokens = 0
  let outputTokens = 0

  for (let attempt = 0; attempt < 2; attempt++) {
    const { object, usage } = await generateObject({
      model: m,
      schema: LessonSchema,
      system: systemPrompt(opts.pair),
      prompt,
      temperature: 0.7,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      // Routine structured task: low effort keeps Claude's thinking short so a lesson lands in ~30–60s.
      providerOptions: { anthropic: { effort: 'low' } },
    }).catch(err => {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new LessonGenerationError('The lesson took too long to write. Try again in a moment.')
      }
      throw err
    })
    inputTokens += usage?.inputTokens ?? 0
    outputTokens += usage?.outputTokens ?? 0
    const parsed = LessonSchema.safeParse(object)
    if (parsed.success) {
      const tidy = tidyLesson(parsed.data, situation, opts.pair)
      if (tidy.vocabulary.length >= 12) {
        return { lesson: tidy, modelSpec, inputTokens, outputTokens, latencyMs: Date.now() - started }
      }
      prompt += `\n\nPrevious attempt had too few unique vocabulary items after deduplication. Provide at least 14 distinct items.`
      continue
    }
    prompt += `\n\nPrevious attempt failed validation: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}. Fix these and return the full lesson again.`
  }
  throw new LessonGenerationError('The lesson came back malformed. Try again or rephrase the situation.')
}
