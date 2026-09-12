// app/admin/settings/page.tsx
import { requireAdmin } from '@/lib/auth/guards'
import { getSettings } from '@/lib/billing/entitlement'
import { getPlans, recentModelTests } from '@/lib/admin/queries'
import { createAdminClient } from '@/lib/supabase/admin'
import { KNOWN_MODELS } from '@/lib/ai/models'
import { LimitsForm, PlanForm, ModelForm } from '@/components/admin/SettingsForms'

export const metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  await requireAdmin()
  const db = createAdminClient()
  const [settings, plans, tests] = await Promise.all([getSettings(db), getPlans(), recentModelTests()])
  const currentSpec = `${settings.aiProvider}/${settings.aiModel}`

  return (
    <div className="space-y-10">
      <header><p className="eyebrow">Settings</p><h1 className="t-title text-3xl">How the product behaves</h1></header>

      <section className="space-y-3">
        <h2 className="t-title text-xl">Limits</h2>
        <p className="max-w-[65ch] text-sm text-body">
          The free allowance resets on Monday in each learner&rsquo;s own timezone. The daily cap is the worst-case
          guard on a paid account, not the shape of the product: one situation a day is the premise. Admins and
          comped accounts skip both.
        </p>
        <LimitsForm week={settings.freeLessonsPerWeek} day={settings.paidLessonsPerDay} />
      </section>

      <section className="space-y-3">
        <h2 className="t-title text-xl">Pricing</h2>
        <p className="max-w-[65ch] text-sm text-body">
          One row per direction. A Stripe Price is immutable, so changing what you charge means creating a new Price
          in the Talent Edge dashboard and pasting its id here. Existing subscribers keep the Price they signed up to.
          Changes affect new checkouts only. Discount codes are created in Stripe and accepted automatically at checkout.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">{plans.map(p => <PlanForm key={p.pair} plan={p} />)}</div>
      </section>

      <section className="space-y-3">
        <h2 className="t-title text-xl">Model</h2>
        <p className="max-w-[65ch] text-sm text-body">
          Generation needs reliable structured output, which many models cannot do, so the list is curated. A custom
          spec is allowed but comes with no cost estimate and no promise. <strong>Test before you save.</strong> A test
          runs one golden situation and touches nobody&rsquo;s data.
        </p>
        <ModelForm current={currentSpec} models={KNOWN_MODELS} />
      </section>

      <section className="space-y-3">
        <h2 className="t-title text-xl">Recent model tests</h2>
        <div className="overflow-x-auto rounded-card border border-sand bg-white">
          <table className="w-full text-sm">
            <thead><tr className="bg-cream-warm text-[11px] uppercase tracking-[0.1em] text-stone">
              <th className="p-3 text-left font-semibold">Model</th><th className="p-3 text-left font-semibold">Direction</th>
              <th className="p-3 text-left font-semibold">Result</th><th className="p-3 text-right font-semibold">Latency</th>
              <th className="p-3 text-right font-semibold">Tokens in/out</th><th className="p-3 text-right font-semibold">Cost</th>
              <th className="p-3 text-left font-semibold">When</th>
            </tr></thead>
            <tbody>
              {tests.map(t => (
                <tr key={t.id} className="border-t border-sand align-top">
                  <td className="p-3 font-semibold text-ink">{t.provider}/{t.model}</td>
                  <td className="p-3 text-stone">{t.pair}</td>
                  <td className="p-3">
                    {t.passed
                      ? <span className="rounded-pill bg-ok-bg px-2 py-0.5 text-[11px] font-semibold text-ok-ink">passed</span>
                      : <span className="rounded-pill bg-err-bg px-2 py-0.5 text-[11px] font-semibold text-err-ink" title={t.error ?? ''}>failed</span>}
                    {!t.passed && t.error && <p className="mt-1 max-w-[40ch] text-xs text-stone">{t.error}</p>}
                  </td>
                  <td className="tabular p-3 text-right">{t.latency_ms ? `${(t.latency_ms / 1000).toFixed(1)}s` : '—'}</td>
                  <td className="tabular p-3 text-right">{t.input_tokens ?? '—'} / {t.output_tokens ?? '—'}</td>
                  <td className="tabular p-3 text-right">{t.cost_usd ? `$${Number(t.cost_usd).toFixed(4)}` : '—'}</td>
                  <td className="p-3 text-stone">{new Date(t.created_at).toLocaleString('en-GB')}</td>
                </tr>
              ))}
              {!tests.length && <tr><td colSpan={7} className="p-8 text-center text-stone">No tests run yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
