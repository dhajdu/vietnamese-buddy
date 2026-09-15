// lib/lessons/seeds.ts — the bundled sample lessons, validated at load.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
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

/** The sample lessons this account doesn't have yet, matched by title among its seed lessons, so loading twice adds nothing. */
export async function missingSeedLessons(db: SupabaseClient, userId: string, pair: PairId): Promise<Lesson[]> {
  const { data, error } = await db.from('lessons').select('title')
    .eq('user_id', userId).eq('pair', pair).eq('source', 'seed')
  if (error) throw new Error(`seed lesson lookup failed: ${error.message}`)
  const have = new Set((data ?? []).map(r => r.title as string))
  return loadSeedLessons(pair).filter(l => !have.has(l.title))
}
