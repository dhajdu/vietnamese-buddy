// lib/lessons/seeds.ts — the three bundled sample lessons, validated at load.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LessonSchema, type Lesson } from '@/lib/ai/schema'

const FILES = ['dinner.json', 'movie.json', 'internship.json'] as const

export function loadSeedLessons(): Lesson[] {
  return FILES.map(f => {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'data', 'seed-lessons', f), 'utf8'))
    const r = LessonSchema.safeParse(raw)
    if (!r.success) throw new Error(`Seed ${f} invalid: ${r.error.message}`)
    return r.data
  })
}
