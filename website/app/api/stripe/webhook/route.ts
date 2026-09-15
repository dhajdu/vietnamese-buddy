// app/api/stripe/webhook/route.ts
// Public by design and verified by signature, not by session. The raw body is
// required: parsing it first would break the signature check.
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/billing/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

/**
 * Writes Stripe's current state for one subscription. Events arrive out of order,
 * so the payload snapshot is never trusted; retrieving makes every write a full,
 * idempotent overwrite. Throws on failure so the route returns 500 and Stripe retries.
 */
async function syncSubscription(id: string, userIdHint?: string) {
  const sub = await stripe.subscriptions.retrieve(id)
  const db = createAdminClient()
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  let userId: string | undefined = userIdHint ?? sub.metadata?.user_id
  if (!userId) {
    const { data, error } = await db.from('profiles').select('id').eq('stripe_customer_id', customer).maybeSingle()
    if (error) throw new Error(`profile lookup failed: ${error.message}`)
    userId = data?.id as string | undefined
  }
  if (!userId) {
    console.error('stripe webhook: no user for customer', customer)
    return
  }
  // The pinned API version keeps the billing period on the item, not the subscription.
  const item = sub.items.data[0]
  const interval = item?.price.recurring?.interval
  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_price_id: item?.price.id ?? null,
    status: sub.status,
    plan: interval === 'year' ? 'annual' : interval === 'month' ? 'monthly' : null,
    current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw new Error(`subscription upsert failed: ${error.message}`)
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

  // Idempotency: an event is recorded only once it has been applied, so a
  // delivery that failed halfway is processed again on Stripe's retry.
  const db = createAdminClient()
  const { data: seen, error: seenError } = await db.from('stripe_events').select('id').eq('id', event.id).maybeSingle()
  if (seenError) {
    console.error('stripe webhook: event lookup failed', seenError.message)
    return new Response('Webhook failed', { status: 500 })
  }
  if (seen) return NextResponse.json({ received: true, duplicate: true })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.subscription) {
          const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          await syncSubscription(id, session.metadata?.user_id)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object.id)
        break
    }
  } catch (err) {
    console.error('stripe webhook: processing failed', event.type, event.id, err)
    return new Response('Webhook failed', { status: 500 })
  }

  // A concurrent delivery may have recorded it first; that is the only benign error.
  const { error: recordError } = await db.from('stripe_events').insert({ id: event.id, type: event.type })
  if (recordError && recordError.code !== '23505') {
    console.error('stripe webhook: event record failed', recordError.message)
    return new Response('Webhook failed', { status: 500 })
  }
  return NextResponse.json({ received: true })
}
