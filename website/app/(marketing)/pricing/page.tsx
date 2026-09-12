// app/(marketing)/pricing/page.tsx — prices read from the database so the page
// can never disagree with what Stripe charges.
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOptionalUser } from '@/lib/auth/guards'
import { stripe, stripeConfigured } from '@/lib/billing/stripe'
import { CheckoutButtons } from '@/components/app/CheckoutButtons'

export const metadata = { title: 'Pricing' }
export const revalidate = 300

async function priceAmount(id: string | null) {
  if (!id || !stripeConfigured()) return null
  try {
    const p = await stripe.prices.retrieve(id)
    return p.unit_amount != null ? p.unit_amount / 100 : null
  } catch { return null }
}

export default async function PricingPage() {
  const db = createAdminClient()
  const [{ data: plan }, user] = await Promise.all([
    db.from('plans').select('*').eq('pair', 'en-vi').single(),
    getOptionalUser(),
  ])
  const [monthly, annual] = await Promise.all([
    priceAmount(plan?.stripe_price_monthly ?? null),
    priceAmount(plan?.stripe_price_annual ?? null),
  ])
  const live = Boolean(plan?.monetised && monthly && annual)
  const saving = monthly && annual ? Math.round((1 - annual / (monthly * 12)) * 100) : null

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="eyebrow">Pricing</p>
      <h1 className="t-title text-4xl">Three lessons a week, free</h1>
      <p className="gloss mt-3 max-w-[60ch] text-xl">No card to start. Upgrade when a situation a day is the habit.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="card px-5 py-6">
          <h2 className="font-vn text-lg font-bold text-ink">Free</h2>
          <p className="mt-1 font-vn text-3xl font-extrabold text-ink">$0</p>
          <p className="gloss mt-2 text-[15px]">Three lessons a week, every flashcard, the whole vocabulary store and your streak.</p>
          <Link href="/signup" className="btn-quiet mt-5 w-full">Start free</Link>
        </div>
        <div className="card border-2 border-red px-5 py-6">
          <h2 className="font-vn text-lg font-bold text-ink">Monthly</h2>
          <p className="mt-1 font-vn text-3xl font-extrabold text-ink">{monthly ? `$${monthly}` : '$9.99'}<span className="text-base font-normal text-stone">/mo</span></p>
          <p className="gloss mt-2 text-[15px]">Unlimited lessons, and Adjust to rewrite any lesson in your own words.</p>
          {live ? <CheckoutButtons term="monthly" label="Go monthly" signedIn={Boolean(user)} /> : <Link href="/signup" className="btn-red mt-5 w-full">Start free</Link>}
        </div>
        <div className="card px-5 py-6">
          <h2 className="font-vn text-lg font-bold text-ink">Annual</h2>
          <p className="mt-1 font-vn text-3xl font-extrabold text-ink">{annual ? `$${annual}` : '$79'}<span className="text-base font-normal text-stone">/yr</span></p>
          <p className="gloss mt-2 text-[15px]">Everything monthly has{saving ? `, ${saving}% cheaper` : ', at a discount'}.</p>
          {live ? <CheckoutButtons term="annual" label="Go annual" signedIn={Boolean(user)} /> : <Link href="/signup" className="btn-quiet mt-5 w-full">Start free</Link>}
        </div>
      </div>

      {!live && <p className="meta mt-6">Paid plans are switched on from admin once the Stripe prices are set. Everything is free until then.</p>}
      <p className="meta mt-6">Learning English instead? <Link href="/vi" className="text-red hover:underline">Tiếng Việt →</Link> Free while in beta.</p>
    </section>
  )
}
