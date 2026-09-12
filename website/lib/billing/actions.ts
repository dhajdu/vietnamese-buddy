// lib/billing/actions.ts — checkout and the billing portal.
'use server'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPair } from '@/lib/pairs'
import { stripe, stripeConfigured } from './stripe'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Reuses the learner's Stripe customer, or makes one and remembers it. */
async function customerFor(userId: string, email: string | null) {
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('stripe_customer_id').eq('id', userId).single()
  const existing = data?.stripe_customer_id as string | null
  if (existing) return existing
  const customer = await stripe.customers.create({ email: email ?? undefined, metadata: { user_id: userId } })
  await admin.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId)
  return customer.id
}

export async function startCheckout(formData: FormData) {
  const term = formData.get('term') === 'annual' ? 'annual' : 'monthly'
  const user = await requireAuth()
  const db = await createClient()
  if (!stripeConfigured()) return { error: 'Billing is not configured yet.' }

  const { data: profile } = await db.from('profiles').select('pair, email').eq('id', user.id).single()
  const pair = getPair(profile?.pair)
  const { data: plan } = await db.from('plans').select('*').eq('pair', pair.id).single()
  if (!plan?.monetised) return { error: 'This direction is free while in beta.' }

  const price = term === 'annual' ? plan.stripe_price_annual : plan.stripe_price_monthly
  if (!price) return { error: 'That plan is not set up yet.' }

  const customer = await customerFor(user.id, (profile?.email as string) ?? user.email ?? null)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price, quantity: 1 }],
    // Your discount codes are created in the Stripe dashboard; this is all it
    // takes to let people redeem them.
    allow_promotion_codes: true,
    success_url: `${SITE}/app/billing?welcome=1`,
    cancel_url: `${SITE}/pricing`,
    subscription_data: { metadata: { user_id: user.id, pair: pair.id } },
    metadata: { user_id: user.id, pair: pair.id, term },
  })
  if (!session.url) return { error: 'Stripe did not return a checkout URL.' }
  redirect(session.url)
}

/** Cancellation and card updates are Stripe's own screens, so we build none. */
export async function openBillingPortal() {
  const user = await requireAuth()
  const db = await createClient()
  const { data } = await db.from('profiles').select('stripe_customer_id').eq('id', user.id).single()
  const customer = data?.stripe_customer_id as string | null
  if (!customer) return { error: 'No billing account yet.' }
  const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${SITE}/app/billing` })
  redirect(session.url)
}
