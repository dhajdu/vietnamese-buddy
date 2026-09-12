// lib/lessons/seeds.ts — the bundled sample lessons, validated at load.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LessonSchema, type Lesson } from '@/lib/ai/schema'
import type { PairId } from '@/lib/pairs'

const FILES: Record<PairId, string[]> = {
  'en-vi': ['dinner.json', 'movie.json', 'internship.json'],
  'vi-en': ['vi-en/coworker.json', 'vi-en/interview.json', 'vi-en/restaurant.json'],
}

export function loadSeedLessons(pair: PairId): Lesson[] {
  return FILES[pair].map(f => {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'data', 'seed-lessons', f), 'utf8'))
    const r = LessonSchema.safeParse(raw)
    if (!r.success) throw new Error(`Seed ${f} invalid: ${r.error.message}`)
    return r.data
  })
}
