// app/api/stripe/webhook/route.ts
// Public by design and verified by signature, not by session. The raw body is
// required: parsing it first would break the signature check.
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/billing/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

type SubLike = Stripe.Subscription & { current_period_end?: number }

async function upsertFromSubscription(sub: SubLike) {
  const db = createAdminClient()
  const userId = sub.metadata?.user_id
    ?? (await db.from('profiles').select('id').eq('stripe_customer_id', String(sub.customer)).maybeSingle()).data?.id
  if (!userId) {
    console.error('stripe webhook: no user for customer', sub.customer)
    return
  }
  const price = sub.items.data[0]?.price
  const interval = price?.recurring?.interval
  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_price_id: price?.id ?? null,
    status: sub.status,
    plan: interval === 'year' ? 'annual' : interval === 'month' ? 'monthly' : null,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) console.error('stripe webhook: subscription upsert failed', error.message)
}

export async function POST(request: Request) {
  // A request with no signature is malformed whatever our configuration is, so
  // that check comes first; a missing secret is our fault, not the caller's.
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('stripe webhook: STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Webhook not configured', { status: 500 })
  }
  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('stripe webhook: bad signature', err)
    return new Response('Invalid signature', { status: 400 })
  }

  // Idempotency: Stripe retries, and a retry must not double-apply anything.
  const db = createAdminClient()
  const { error: seen } = await db.from('stripe_events').insert({ id: event.id, type: event.type })
  if (seen) return NextResponse.json({ received: true, duplicate: true })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription))
        await upsertFromSubscription({ ...sub, metadata: { ...sub.metadata, ...session.metadata } } as SubLike)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertFromSubscription(event.data.object as SubLike)
      break
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(invoice.subscription))
        await upsertFromSubscription(sub as SubLike)
      }
      break
    }
  }
  return NextResponse.json({ received: true })
}
