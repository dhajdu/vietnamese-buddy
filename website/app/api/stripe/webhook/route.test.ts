import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  seen: null as unknown,
  upsertError: null as unknown,
  inserts: [] as unknown[],
  upserts: [] as Record<string, unknown>[],
  constructEvent: vi.fn(),
  retrieve: vi.fn(),
}))

vi.mock('@/lib/billing/stripe', () => ({
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  stripe: { webhooks: { constructEvent: h.constructEvent }, subscriptions: { retrieve: h.retrieve } },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    // One chainable builder covers the event lookup, the event insert and the subscription upsert.
    from: (table: string) => {
      const q: Record<string, unknown> = {}
      for (const m of ['select', 'eq']) q[m] = () => q
      q.maybeSingle = async () => ({ data: table === 'stripe_events' ? h.seen : null, error: null })
      q.insert = async (row: unknown) => { h.inserts.push(row); return { error: null } }
      q.upsert = async (row: Record<string, unknown>) => { h.upserts.push(row); return { error: h.upsertError } }
      return q
    },
  }),
}))

import { POST } from './route'

const PERIOD_END = 1789000000
// The event payload is stale on purpose: the route must write what Stripe says now.
const event = { id: 'evt_1', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'incomplete' } } }

function deliver() {
  h.constructEvent.mockReturnValue(event)
  return POST(new Request('http://localhost/api/stripe/webhook', {
    method: 'POST', headers: { 'stripe-signature': 't=1,v1=sig' }, body: '{}',
  }))
}

beforeEach(() => {
  h.seen = null
  h.upsertError = null
  h.inserts.length = 0
  h.upserts.length = 0
  h.retrieve.mockReset()
  h.retrieve.mockResolvedValue({
    id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: false, metadata: { user_id: 'U1' },
    items: { data: [{ current_period_end: PERIOD_END, price: { id: 'price_m', recurring: { interval: 'month' } } }] },
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('stripe webhook', () => {
  it('returns 500 and records nothing when the upsert fails, so Stripe retries', async () => {
    h.upsertError = { message: 'boom' }
    const res = await deliver()
    expect(res.status).toBe(500)
    expect(h.inserts).toEqual([])
  })

  it('acknowledges an already-recorded event without processing it again', async () => {
    h.seen = { id: 'evt_1' }
    const res = await deliver()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true, duplicate: true })
    expect(h.retrieve).not.toHaveBeenCalled()
    expect(h.upserts).toEqual([])
  })

  it('writes the current subscription with the period end from its item, then records the event', async () => {
    const res = await deliver()
    expect(res.status).toBe(200)
    expect(h.retrieve).toHaveBeenCalledWith('sub_1')
    expect(h.upserts[0]).toMatchObject({
      user_id: 'U1', status: 'active', plan: 'monthly', stripe_price_id: 'price_m',
      current_period_end: '2026-09-10T00:26:40.000Z',
    })
    expect(h.inserts).toEqual([{ id: 'evt_1', type: 'customer.subscription.updated' }])
  })
})
