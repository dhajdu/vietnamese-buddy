// lib/ai/generate.ts
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { LessonSchema, type Lesson } from './schema'
import { SYSTEM_PROMPT, userPrompt } from './prompt'
import { normalizeVietnamese } from '@/lib/vocabulary/normalize'

export class LessonGenerationError extends Error {}

const TIMEOUT_MS = 170_000 // pages hosting the action set maxDuration = 180

/** AI_MODEL is "<provider>/<model>". Provider picks the key: anthropic → ANTHROPIC_API_KEY, openai → OPENAI_API_KEY. */
function model() {
  const spec = process.env.AI_MODEL ?? 'anthropic/claude-sonnet-5'
  const [provider, ...rest] = spec.split('/')
  const name = rest.join('/')
  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new LessonGenerationError('ANTHROPIC_API_KEY is not set. Add it to .env.local to generate lessons.')
    return createAnthropic({ apiKey: key })(name)
  }
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new LessonGenerationError('OPENAI_API_KEY is not set. Add it to .env.local to generate lessons.')
    return createOpenAI({ apiKey: key })(name)
  }
  throw new LessonGenerationError(`Unknown AI_MODEL provider "${provider}". Use anthropic/… or openai/…`)
}

/** Dedupe vocabulary inside one lesson and tidy edges. Pure. */
export function tidyLesson(lesson: Lesson, situation: string): Lesson {
  const seen = new Set<string>()
  const vocabulary = lesson.vocabulary
    .map(v => ({ vietnamese: v.vietnamese.trim().replace(/[.,!?;:]+$/, ''), english: v.english.trim() }))
    .filter(v => {
      const k = normalizeVietnamese(v.vietnamese)
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
  return { ...lesson, vocabulary, situation: lesson.situation || situation }
}

export async function generateLesson(opts: {
  situation: string
  recentGrammar?: string[]
  adjustment?: string
}): Promise<Lesson> {
  const situation = opts.situation.trim()
  if (!situation) throw new LessonGenerationError('Describe a situation first.')
  if (situation.length > 500) throw new LessonGenerationError('Keep the situation under 500 characters.')

  const m = model()
  let prompt = userPrompt(situation, opts.recentGrammar ?? [], opts.adjustment)

  for (let attempt = 0; attempt < 2; attempt++) {
    const { object } = await generateObject({
      model: m,
      schema: LessonSchema,
      system: SYSTEM_PROMPT,
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
    const parsed = LessonSchema.safeParse(object)
    if (parsed.success) {
      const tidy = tidyLesson(parsed.data, situation)
      if (tidy.vocabulary.length >= 12) return tidy
      prompt += `\n\nPrevious attempt had too few unique vocabulary items after deduplication. Provide at least 14 distinct items.`
      continue
    }
    prompt += `\n\nPrevious attempt failed validation: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}. Fix these and return the full lesson again.`
  }
  throw new LessonGenerationError('The lesson came back malformed. Try again or rephrase the situation.')
}
