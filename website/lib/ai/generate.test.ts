import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('ai', async importOriginal => ({ ...(await importOriginal<typeof import('ai')>()), generateObject: vi.fn() }))
vi.mock('@ai-sdk/anthropic', () => ({ createAnthropic: () => () => ({}) }))

import { generateObject, NoObjectGeneratedError, TypeValidationError } from 'ai'
import { generateLesson, tidyLesson } from './generate'
import { LessonSchema, type Lesson } from './schema'
import { loadSeedLessons } from '@/lib/lessons/seeds'
import { getPair } from '@/lib/pairs'

const lesson = loadSeedLessons('en-vi')[0]
const pair = getPair('en-vi')
const run = () => generateLesson({ pair, situation: lesson.situation, modelSpec: 'anthropic/claude-sonnet-5' })

function schemaMismatch() {
  const bad = LessonSchema.safeParse({ ...lesson, phrases: lesson.phrases.slice(0, 9) })
  return new NoObjectGeneratedError({
    message: 'No object generated: response did not match schema.',
    cause: new TypeValidationError({ value: {}, cause: bad.error }),
    response: {} as never,
    usage: { inputTokens: 100, outputTokens: 50 } as never,
    finishReason: 'stop',
  })
}

describe('generateLesson', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test'
    vi.mocked(generateObject).mockReset()
  })
  afterEach(() => { vi.useRealTimers() })

  it('retries once with the schema problems when the object does not match', async () => {
    vi.mocked(generateObject)
      .mockRejectedValueOnce(schemaMismatch())
      .mockResolvedValueOnce({ object: lesson, usage: { inputTokens: 120, outputTokens: 900 } } as never)

    const r = await run()

    expect(generateObject).toHaveBeenCalledTimes(2)
    expect(String(vi.mocked(generateObject).mock.calls[1][0].prompt)).toContain('Previous attempt failed validation: phrases:')
    expect(r.lesson.title).toBe(lesson.title)
    expect(r.inputTokens).toBe(220)
    expect(r.outputTokens).toBe(950)
  })

  it('skips the retry when too little of the shared deadline is left', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.mocked(generateObject).mockImplementationOnce(async () => {
      vi.setSystemTime(Date.now() + 110_000)
      throw schemaMismatch()
    })

    await expect(run()).rejects.toThrow('The lesson came back malformed')
    expect(generateObject).toHaveBeenCalledTimes(1)
  })
})

describe('tidyLesson', () => {
  it('trims phrase and grammar example text so speech lookups match exactly', () => {
    const messy: Lesson = {
      ...lesson,
      phrases: lesson.phrases.map((p, i) => i === 0 ? { ...p, vietnamese: `  ${p.vietnamese} \n`, english: ` ${p.english} ` } : p),
      grammar: { ...lesson.grammar, examples: lesson.grammar.examples.map((e, i) => i === 0 ? { ...e, vietnamese: ` ${e.vietnamese}  ` } : e) },
    }
    const tidy = tidyLesson(messy, lesson.situation, pair)
    expect(tidy.phrases[0].vietnamese).toBe(lesson.phrases[0].vietnamese)
    expect(tidy.phrases[0].english).toBe(lesson.phrases[0].english)
    expect(tidy.grammar.examples[0].vietnamese).toBe(lesson.grammar.examples[0].vietnamese)
  })

  it('dedupes vocabulary on the language being learned', () => {
    const vocabulary = [{ vietnamese: 'Hông?', english: 'no' }, { vietnamese: 'hông', english: 'not' }]
    expect(tidyLesson({ ...lesson, vocabulary }, '', pair).vocabulary).toEqual([{ vietnamese: 'Hông', english: 'no' }])
    const english = [{ vietnamese: 'không', english: 'No.' }, { vietnamese: 'hông', english: 'no' }]
    expect(tidyLesson({ ...lesson, vocabulary: english }, '', getPair('vi-en')).vocabulary).toHaveLength(1)
  })
})
