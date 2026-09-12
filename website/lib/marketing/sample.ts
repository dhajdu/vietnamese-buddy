// lib/marketing/sample.ts — the landing pages show a real seed lesson rather
// than a mock-up, so the strongest trust signal is the product's own output.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LessonSchema, type Lesson } from '@/lib/ai/schema'

export function loadSample(file: string): Lesson {
  const raw = JSON.parse(readFileSync(join(process.cwd(), 'data', 'seed-lessons', file), 'utf8'))
  return LessonSchema.parse(raw)
}
