// lib/billing/actions.ts — checkout and the billing portal.
'use server'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPair } from '@/lib/pairs'
import { stripe, stripeConfigured } from './stripe'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const CHECKOUT_FAILED = 'Could not open checkout. Try again in a moment.'
const PORTAL_FAILED = 'Could not open billing. Try again in a moment.'

/** Reuses the learner's Stripe customer, or makes one and remembers it. Throws on failure. */
async function customerFor(userId: string, email: string | null) {
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('stripe_customer_id').eq('id', userId).single()
  if (error) throw new Error(`profile read failed: ${error.message}`)
  const existing = data?.stripe_customer_id as string | null
  if (existing) return existing
  // The key makes a double click or a second tab reuse one customer instead of orphaning one.
  const customer = await stripe.customers.create(
    { email: email ?? undefined, metadata: { user_id: userId } },
    { idempotencyKey: `customer-${userId}` },
  )
  const { error: saveError } = await admin.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId)
  if (saveError) throw new Error(`customer save failed: ${saveError.message}`)
  return customer.id
}

/** A billing portal URL for the learner's Stripe customer, or a fixed error. */
async function portalSession(userId: string): Promise<{ url: string } | { error: string }> {
  const db = await createClient()
  const { data, error } = await db.from('profiles').select('stripe_customer_id').eq('id', userId).single()
  if (error) {
    console.error('billing: profile read failed', error.message)
    return { error: PORTAL_FAILED }
  }
  const customer = data?.stripe_customer_id as string | null
  if (!customer) return { error: 'No billing account yet.' }
  try {
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${SITE}/app/billing` })
    return { url: session.url }
  } catch (err) {
    console.error('billing: portal session failed', err)
    return { error: PORTAL_FAILED }
  }
}

export async function startCheckout(formData: FormData) {
  const term = formData.get('term') === 'annual' ? 'annual' : 'monthly'
  const user = await requireAuth()
  const db = await createClient()
  if (!stripeConfigured()) return { error: 'Billing is not configured yet.' }

  // A second Checkout for someone already subscribed bills them twice, and both
  // subscriptions would write the one subscriptions row. Send them to manage instead.
  const { data: sub, error: subError } = await db.from('subscriptions').select('status, comped').eq('user_id', user.id).maybeSingle()
  if (subError) {
    console.error('billing: subscription read failed', subError.message)
    return { error: CHECKOUT_FAILED }
  }
  if (sub?.comped) redirect('/app/billing')
  if (['active', 'trialing', 'past_due'].includes((sub?.status as string) ?? '')) {
    const portal = await portalSession(user.id)
    if ('error' in portal) return portal
    redirect(portal.url)
  }

  const { data: profile, error: profileError } = await db.from('profiles').select('pair, email').eq('id', user.id).single()
  if (profileError) {
    console.error('billing: profile read failed', profileError.message)
    return { error: CHECKOUT_FAILED }
  }
  const pair = getPair(profile.pair)
  const { data: plan, error: planError } = await db.from('plans').select('*').eq('pair', pair.id).single()
  if (planError) {
    console.error('billing: plan read failed', planError.message)
    return { error: CHECKOUT_FAILED }
  }
  if (!plan.monetised) return { error: 'This direction is free while in beta.' }

  const price = term === 'annual' ? plan.stripe_price_annual : plan.stripe_price_monthly
  if (!price) return { error: 'That plan is not set up yet.' }

  // redirect() works by throwing, so it stays outside the try.
  let url: string | null
  try {
    const customer = await customerFor(user.id, (profile.email as string) ?? user.email ?? null)
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
    url = session.url
  } catch (err) {
    console.error('billing: checkout session failed', err)
    return { error: CHECKOUT_FAILED }
  }
  if (!url) return { error: 'Stripe did not return a checkout URL.' }
  redirect(url)
}

/** Cancellation and card updates are Stripe's own screens, so we build none. */
export async function openBillingPortal() {
  const user = await requireAuth()
  const portal = await portalSession(user.id)
  if ('error' in portal) return portal
  redirect(portal.url)
}
