// lib/billing/stripe.ts
// Server-only Stripe client. NEVER import this from a client component.
// Live key in production, test key everywhere else, matching the edge8-web pattern.
//
// The client is built on first use rather than at import time, so a missing key
// throws a clear error at the first call instead of an opaque 401 from Stripe,
// and importing this module stays free of side effects.
import Stripe from 'stripe'

function secretKey(): string {
  const live = process.env.STRIPE_SECRET_KEY
  const test = process.env.STRIPE_SECRET_TEST_KEY
  const key = process.env.NODE_ENV === 'production' ? live : (test || live)
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  return key
}

let client: Stripe | undefined
function getStripe(): Stripe {
  if (!client) client = new Stripe(secretKey(), { typescript: true })
  return client
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    const real = getStripe()
    return Reflect.get(real, prop, real)
  },
})

export const STRIPE_WEBHOOK_SECRET =
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_TEST_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_TEST_KEY)
}
