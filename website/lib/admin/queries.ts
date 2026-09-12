// lib/admin/queries.ts — admin reads, always behind requireAdmin().
// These use the service-role client because RLS scopes every table to its owner.
import { createAdminClient } from '@/lib/supabase/admin'

export interface UserRow {
  id: string; email: string | null; display_name: string | null
  pair: string; is_admin: boolean; created_at: string; timezone: string | null
  sub_status: string; comped: boolean; sub_plan: string | null; current_period_end: string | null
  lessons: number; ai_lessons: number; words: number; words_known: number
  learning_days: number; last_active: string | null
}

export async function listUsers(search: string, sort: string) {
  const db = createAdminClient()
  const column = ['created_at', 'lessons', 'words', 'last_active', 'email'].includes(sort) ? sort : 'created_at'
  let q = db.from('admin_user_overview').select('*').order(column, { ascending: column === 'email', nullsFirst: false }).limit(500)
  if (search) q = q.ilike('email', `%${search.replace(/[%,]/g, '')}%`)
  const { data, error } = await q
  if (error) throw new Error(`admin user list failed: ${error.message}`)
  return (data ?? []) as UserRow[]
}

export async function getUser(id: string) {
  const db = createAdminClient()
  const [{ data: overview }, { data: lessons }] = await Promise.all([
    db.from('admin_user_overview').select('*').eq('id', id).single(),
    db.from('lessons').select('id, title, pair, source, created_at, completed_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
  ])
  if (!overview) return null
  return { user: overview as UserRow, lessons: (lessons ?? []) as { id: string; title: string; pair: string; source: string; created_at: string; completed_at: string | null }[] }
}

export async function getPlans() {
  const db = createAdminClient()
  const { data } = await db.from('plans').select('*').order('pair')
  return (data ?? []) as { pair: string; stripe_price_monthly: string | null; stripe_price_annual: string | null; monetised: boolean }[]
}

export async function recentModelTests(limit = 10) {
  const db = createAdminClient()
  const { data } = await db.from('model_tests').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as {
    id: string; pair: string; provider: string; model: string; situation: string
    passed: boolean; latency_ms: number | null; input_tokens: number | null; output_tokens: number | null
    cost_usd: string | null; error: string | null; created_at: string
  }[]
}
