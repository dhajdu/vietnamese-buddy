// app/(marketing)/pricing/page.tsx — prices read from Stripe through the plans
// table, so the page can never disagree with what is actually charged.
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, stripeConfigured } from '@/lib/billing/stripe'
import { CheckoutButton } from '@/components/app/CheckoutButtons'
import { getSettings } from '@/lib/billing/entitlement'
import { fill, EN } from '@/lib/marketing/content'
import { t } from '@/lib/i18n'

export const metadata = { title: 'Pricing' }
// Nothing here reads cookies, so the page is cached and Stripe is asked at most
// every five minutes. Every visitor gets the signed-out buttons; signup sends a
// signed-in one on to the app.
export const revalidate = 300

async function priceAmount(id: string | null) {
  if (!id || !stripeConfigured()) return null
  try {
    const p = await stripe.prices.retrieve(id)
    return p.unit_amount != null ? p.unit_amount / 100 : null
  } catch (err) {
    console.error('pricing: price read failed', id, err)
    return null
  }
}

export default async function PricingPage() {
  const db = createAdminClient()
  const [{ data: plan, error }, settings] = await Promise.all([
    db.from('plans').select('*').eq('pair', 'en-vi').single(),
    getSettings(db),
  ])
  // Throwing keeps the last good cached page in place rather than caching a broken one.
  if (error) throw new Error(`pricing: plan read failed: ${error.message}`)
  const d = t('en')
  const freeLessons = settings.freeLessonsPerWeek
  const lessonWord = freeLessons === 1 ? 'lesson' : 'lessons'
  const [monthly, annual] = await Promise.all([
    priceAmount(plan.stripe_price_monthly ?? null),
    priceAmount(plan.stripe_price_annual ?? null),
  ])
  const live = Boolean(plan.monetised && monthly && annual)
  const saving = monthly && annual ? Math.round((1 - annual / (monthly * 12)) * 100) : null
  const unavailable = <span className="align-baseline text-base font-normal text-body">Price unavailable</span>

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="eyebrow">Pricing</p>
      <h1 className="t-title text-4xl">{fill(EN.pricingHeading, freeLessons, 'en')}</h1>
      <p className="gloss mt-3 max-w-[60ch] text-xl">No card to start. Upgrade when a situation a day is the habit.</p>

      {/* items-stretch plus mt-auto on each action keeps the three buttons on one line
          however long the descriptions run. */}
      <div className="mt-10 grid items-stretch gap-4 sm:grid-cols-3">
        <div className="card flex flex-col px-5 py-6">
          <h2 className="t-title text-xl">Free</h2>
          <p className="mt-2 font-vn text-4xl font-extrabold leading-none tracking-[-0.03em] text-ink">
            $0<span className="align-baseline text-base font-normal text-body">&nbsp;</span>
          </p>
          <p className="gloss mt-3 flex-1 text-[15px]">{freeLessons} {lessonWord} a week, every flashcard, the whole vocabulary store and your streak.</p>
          <Link href="/signup" className="btn-quiet mt-6 w-full whitespace-nowrap">Start free</Link>
        </div>

        <div className="card relative flex flex-col border-2 border-ink px-5 py-6">
          <span className="absolute -top-3 left-5 rounded-pill bg-ink px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white">Most popular</span>
          <h2 className="t-title text-xl">Monthly</h2>
          <p className="mt-2 font-vn text-4xl font-extrabold leading-none tracking-[-0.03em] text-ink">
            {monthly != null ? <>${monthly}<span className="align-baseline text-base font-normal text-body">/mo</span></> : unavailable}
          </p>
          <p className="gloss mt-3 flex-1 text-[15px]">{d.paidDailyCap(settings.paidLessonsPerDay)}, and Adjust to rewrite any lesson in your own words.</p>
          <div className="mt-6">
            <CheckoutButton term="monthly" label="Subscribe now" live={live} variant="red" />
          </div>
        </div>

        <div className="card flex flex-col px-5 py-6">
          <h2 className="t-title text-xl">Annual</h2>
          <p className="mt-2 font-vn text-4xl font-extrabold leading-none tracking-[-0.03em] text-ink">
            {annual != null ? <>${annual}<span className="align-baseline text-base font-normal text-body">/yr</span></> : unavailable}
          </p>
          <p className="gloss mt-3 flex-1 text-[15px]">
            Everything monthly has{saving ? <>, <strong className="text-ink">{saving}% cheaper</strong></> : ', at a discount'}.
          </p>
          <div className="mt-6">
            <CheckoutButton term="annual" label="Subscribe now" live={live} variant="quiet" />
          </div>
        </div>
      </div>

      {plan.monetised && !live && (
        <p role="status" className="meta mt-4">Prices could not be loaded from Stripe, so checkout is paused. Try again in a few minutes.</p>
      )}

      <p className="meta mt-8">
        Cancel any time from your billing page. Discount codes are accepted at checkout.
        {' '}Learning English instead? <Link href="/vi" lang="vi" className="font-semibold text-ink underline">Tiếng Việt →</Link> Free while in beta.
      </p>
    </section>
  )
}
