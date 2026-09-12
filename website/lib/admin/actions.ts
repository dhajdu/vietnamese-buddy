// lib/admin/actions.ts — every action re-checks the guard rather than trusting the page.
'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLesson, LessonGenerationError } from '@/lib/ai/generate'
import { estimateCost } from '@/lib/ai/models'
import { getPair, isPairId } from '@/lib/pairs'

export async function saveLimits(formData: FormData) {
  const admin = await requireAdmin()
  const week = Number(formData.get('free_lessons_per_week'))
  const day = Number(formData.get('paid_lessons_per_day'))
  if (!Number.isInteger(week) || week < 0 || week > 100) return { error: 'Free lessons per week must be 0 to 100.' }
  if (!Number.isInteger(day) || day < 1 || day > 100) return { error: 'Paid lessons per day must be 1 to 100.' }
  const db = createAdminClient()
  const { error } = await db.from('app_settings')
    .update({ free_lessons_per_week: week, paid_lessons_per_day: day, updated_at: new Date().toISOString(), updated_by: admin.id })
    .eq('id', 1)
  if (error) return { error: error.message }
  revalidatePath('/admin/settings')
  return { ok: true }
}

export async function saveModel(formData: FormData) {
  const admin = await requireAdmin()
  const spec = String(formData.get('spec') ?? '').trim()
  const [provider, ...rest] = spec.split('/')
  const model = rest.join('/')
  if (!provider || !model) return { error: 'Use provider/model, for example anthropic/claude-sonnet-5.' }
  const db = createAdminClient()
  const { error } = await db.from('app_settings')
    .update({ ai_provider: provider, ai_model: model, updated_at: new Date().toISOString(), updated_by: admin.id })
    .eq('id', 1)
  if (error) return { error: error.message }
  revalidatePath('/admin/settings')
  return { ok: true }
}

export async function savePlan(formData: FormData) {
  await requireAdmin()
  const pair = String(formData.get('pair') ?? '')
  if (!isPairId(pair)) return { error: 'Unknown language pair.' }
  const db = createAdminClient()
  const { error } = await db.from('plans').update({
    stripe_price_monthly: String(formData.get('monthly') ?? '').trim() || null,
    stripe_price_annual: String(formData.get('annual') ?? '').trim() || null,
    monetised: formData.get('monetised') === 'on',
    updated_at: new Date().toISOString(),
  }).eq('pair', pair)
  if (error) return { error: error.message }
  revalidatePath('/admin/settings')
  revalidatePath('/pricing')
  return { ok: true }
}

/** Grants or removes free access without involving Stripe. */
export async function setComped(userId: string, comped: boolean) {
  await requireAdmin()
  const db = createAdminClient()
  const { error } = await db.from('subscriptions')
    .upsert({ user_id: userId, comped, status: comped ? 'active' : 'canceled', updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return { error: error.message }
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin')
  return { ok: true }
}

const GOLDEN: Record<string, string> = {
  'en-vi': 'Talking to a Grab driver who took a wrong turn on the way to District 1',
  'vi-en': 'Họp online với khách hàng người Mỹ lần đầu',
}

/**
 * Runs one golden situation through a model without touching any learner's data,
 * and records the result so two models can be compared on the same input.
 */
export async function testModel(formData: FormData) {
  const admin = await requireAdmin()
  const spec = String(formData.get('spec') ?? '').trim()
  const pairId = String(formData.get('pair') ?? 'en-vi')
  if (!isPairId(pairId)) return { error: 'Unknown language pair.' }
  const pair = getPair(pairId)
  const situation = String(formData.get('situation') ?? '').trim() || GOLDEN[pairId]
  const [provider, ...rest] = spec.split('/')
  const db = createAdminClient()
  const started = Date.now()

  try {
    const r = await generateLesson({ pair, situation, modelSpec: spec })
    await db.from('model_tests').insert({
      created_by: admin.id, pair: pairId, provider, model: rest.join('/'), situation,
      passed: true, latency_ms: r.latencyMs, input_tokens: r.inputTokens, output_tokens: r.outputTokens,
      cost_usd: estimateCost(spec, r.inputTokens, r.outputTokens), lesson_json: r.lesson,
    })
    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (err) {
    const message = err instanceof LessonGenerationError ? err.message : err instanceof Error ? err.message : String(err)
    await db.from('model_tests').insert({
      created_by: admin.id, pair: pairId, provider, model: rest.join('/'), situation,
      passed: false, latency_ms: Date.now() - started, error: message.slice(0, 500),
    })
    revalidatePath('/admin/settings')
    return { error: message }
  }
}
