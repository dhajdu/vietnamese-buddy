// lib/activity/actions.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { localDate } from './streak'

export type ActivityKind = 'lesson_created' | 'card_reviewed' | 'lesson_completed'

export async function recordActivity(db: SupabaseClient, kind: ActivityKind, tz?: string) {
  const { error } = await db.rpc('record_activity', { p_date: localDate(tz), p_kind: kind })
  if (error) throw new Error(`record_activity failed: ${error.message}`)
}
