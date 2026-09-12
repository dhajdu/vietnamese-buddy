// lib/billing/entitlement.ts
// What this learner is allowed to do right now. Derived on every read, never
// stored, so it can never drift out of sync with Stripe.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PairId } from '@/lib/pairs'
import { localDate } from '@/lib/activity/streak'
import { weekStart } from './week'

export interface Entitlement {
  plan: 'free' | 'pro'
  /** The owner and comped accounts skip every cap. */
  unlimited: boolean
  /** True when this direction can be paid for at all. */
  monetised: boolean
  lessonsThisWeek: number
  weeklyLimit: number
  lessonsToday: number
  dailyLimit: number
  canCreate: boolean
  /** Why not, when canCreate is false. */
  reason: 'weekly' | 'daily' | null
  /** Adjust is a full-price second generation, so it is a paid feature. */
  canAdjust: boolean
}

export interface Settings { freeLessonsPerWeek: number; paidLessonsPerDay: number; aiProvider: string; aiModel: string }

export async function getSettings(db: SupabaseClient): Promise<Settings> {
  const { data } = await db.from('app_settings').select('*').eq('id', 1).single()
  return {
    freeLessonsPerWeek: (data?.free_lessons_per_week as number) ?? 3,
    paidLessonsPerDay: (data?.paid_lessons_per_day as number) ?? 3,
    aiProvider: (data?.ai_provider as string) ?? 'anthropic',
    aiModel: (data?.ai_model as string) ?? 'claude-sonnet-5',
  }
}

export async function getEntitlement(
  db: SupabaseClient,
  userId: string,
  opts: { pair: PairId; timezone: string; isAdmin: boolean },
): Promise<Entitlement> {
  const today = localDate(opts.timezone)
  const monday = weekStart(today)

  const [settings, sub, plan, week, day] = await Promise.all([
    getSettings(db),
    db.from('subscriptions').select('status, comped').eq('user_id', userId).maybeSingle(),
    db.from('plans').select('monetised').eq('pair', opts.pair).maybeSingle(),
    db.from('lessons').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('pair', opts.pair).eq('source', 'ai').gte('created_at', `${monday}T00:00:00Z`),
    db.from('lessons').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('source', 'ai').gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
  ])

  const comped = Boolean(sub.data?.comped)
  const active = ['active', 'trialing'].includes((sub.data?.status as string) ?? '')
  const unlimited = opts.isAdmin || comped
  const monetised = Boolean(plan.data?.monetised)
  // An unmonetised direction has nobody who can pay, so everyone gets the free
  // allowance rather than being sold something that does not exist yet.
  const pro = unlimited || active

  const lessonsThisWeek = week.count ?? 0
  const lessonsToday = day.count ?? 0
  const weeklyLimit = pro ? Infinity : settings.freeLessonsPerWeek
  const dailyLimit = unlimited ? Infinity : settings.paidLessonsPerDay

  const overDaily = lessonsToday >= dailyLimit
  const overWeekly = lessonsThisWeek >= weeklyLimit
  return {
    plan: pro ? 'pro' : 'free',
    unlimited, monetised,
    lessonsThisWeek, weeklyLimit, lessonsToday, dailyLimit,
    canCreate: !overDaily && !overWeekly,
    reason: overWeekly ? 'weekly' : overDaily ? 'daily' : null,
    // Adjust is pro-only where there is a plan to buy; otherwise it follows the
    // ordinary allowance so an unmonetised pair is not crippled.
    canAdjust: monetised ? pro : !overDaily && !overWeekly,
  }
}
