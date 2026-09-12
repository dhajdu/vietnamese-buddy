// app/app/billing/page.tsx
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { getEntitlement } from '@/lib/billing/entitlement'
import { t } from '@/lib/i18n'
import { PortalButton } from '@/components/app/PortalButton'
import { AutoCheckout } from '@/components/app/CheckoutButtons'

export const metadata = { title: 'Billing' }

export default async function BillingPage({ searchParams }: PageProps<'/app/billing'>) {
  const sp = await searchParams
  const user = await requireAuth()
  const db = await createClient()
  const { pair, timezone, isAdmin } = await getProfile(db, user.id)
  const d = t(pair.uiLocale)
  const [ent, { data: sub }] = await Promise.all([
    getEntitlement(db, user.id, { pair: pair.id, timezone, isAdmin }),
    db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-8 sm:px-6 sm:pt-12">
      {sp.welcome && <p className="rounded-card bg-ok-bg px-4 py-3 text-sm font-semibold text-ok-ink">Thanks. Your plan is active.</p>}
      <header>
        <p className="eyebrow">Billing</p>
        <h1 className="t-title text-3xl">{ent.unlimited ? d.unlimitedPlan : ent.plan === 'pro' ? d.proPlan : d.freePlan}</h1>
      </header>

      <dl className="card grid grid-cols-2 gap-x-6 gap-y-2 px-5 py-4 text-sm">
        <dt className="text-stone">Plan</dt>
        <dd className="font-semibold text-ink">{ent.unlimited ? 'Unlimited' : ent.plan === 'pro' ? (sub?.plan ?? 'pro') : 'Free'}</dd>
        <dt className="text-stone">This week</dt>
        <dd className="tabular font-semibold text-ink">{ent.lessonsThisWeek}{Number.isFinite(ent.weeklyLimit) ? ` / ${ent.weeklyLimit}` : ''}</dd>
        {sub?.current_period_end && (<>
          <dt className="text-stone">{sub.cancel_at_period_end ? 'Ends' : 'Renews'}</dt>
          <dd className="font-semibold text-ink">{String(sub.current_period_end).slice(0, 10)}</dd>
        </>)}
      </dl>

      {ent.plan === 'free' && ent.monetised && (sp.checkout === 'monthly' || sp.checkout === 'annual')
        ? <AutoCheckout term={sp.checkout} />
        : ent.plan === 'pro' && !ent.unlimited
        ? <PortalButton label="Manage billing" />
        : ent.monetised
          ? <Link href="/pricing" className="btn-red">{d.upgrade}</Link>
          : <p className="gloss text-[15px]">Free while in beta for this direction.</p>}
    </div>
  )
}
