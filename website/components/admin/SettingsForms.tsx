// components/admin/SettingsForms.tsx
'use client'
import { useActionState, useState } from 'react'
import { saveLimits, savePlan, saveModel, testModel } from '@/lib/admin/actions'
import type { KnownModel } from '@/lib/ai/models'
import { PAIR_IDS } from '@/lib/pairs'

type Result = { ok?: boolean; error?: string } | null
const wrap = (fn: (fd: FormData) => Promise<Result>) => async (_p: Result, fd: FormData) => fn(fd)

function Note({ state, okText = 'Saved' }: { state: Result; okText?: string }) {
  if (state?.error) return <p role="alert" className="text-sm font-semibold text-err-ink">{state.error}</p>
  if (state?.ok) return <p className="text-sm font-semibold text-ok-ink">{okText}</p>
  return null
}

export function LimitsForm({ week, day }: { week: number; day: number }) {
  const [state, action, pending] = useActionState(wrap(saveLimits), null)
  return (
    <form action={action} className="flex flex-wrap items-end gap-4 rounded-card border border-sand bg-white p-5">
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-body">Free lessons per week</span>
        <input name="free_lessons_per_week" type="number" min={0} max={100} defaultValue={week} className="input w-28" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-body">Paid lessons per day</span>
        <input name="paid_lessons_per_day" type="number" min={1} max={100} defaultValue={day} className="input w-28" />
      </label>
      <button disabled={pending} className="btn-red">{pending ? 'Saving…' : 'Save limits'}</button>
      <Note state={state} />
    </form>
  )
}

export function PlanForm({ plan }: { plan: { pair: string; stripe_price_monthly: string | null; stripe_price_annual: string | null; monetised: boolean } }) {
  const [state, action, pending] = useActionState(wrap(savePlan), null)
  return (
    <form action={action} className="space-y-3 rounded-card border border-sand bg-white p-5">
      <input type="hidden" name="pair" value={plan.pair} />
      <h3 className="font-vn text-[15px] font-bold text-ink">{plan.pair}</h3>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-body">Monthly Price id</span>
        <input name="monthly" defaultValue={plan.stripe_price_monthly ?? ''} placeholder="price_…" className="input font-mono text-xs" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-body">Annual Price id</span>
        <input name="annual" defaultValue={plan.stripe_price_annual ?? ''} placeholder="price_…" className="input font-mono text-xs" />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-body">
        <input type="checkbox" name="monetised" defaultChecked={plan.monetised} className="h-4 w-4 accent-[color:var(--red)]" />
        Sell this direction
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-quiet">{pending ? 'Saving…' : 'Save'}</button>
        <Note state={state} />
      </div>
    </form>
  )
}

export function ModelForm({ current, models }: { current: string; models: KnownModel[] }) {
  const known = models.some(m => m.spec === current)
  const [custom, setCustom] = useState(!known)
  const [spec, setSpec] = useState(current)
  const [saveState, saveAction, saving] = useActionState(wrap(saveModel), null)
  const [testState, testAction, testing] = useActionState(wrap(testModel), null)
  const chosen = models.find(m => m.spec === spec)

  return (
    <div className="space-y-3 rounded-card border border-sand bg-white p-5">
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-body">Model</span>
        {custom ? (
          <input value={spec} onChange={e => setSpec(e.target.value)} placeholder="provider/model" className="input font-mono text-sm" />
        ) : (
          <select value={spec} onChange={e => setSpec(e.target.value)} className="input">
            {models.map(m => <option key={m.spec} value={m.spec}>{m.label}</option>)}
          </select>
        )}
      </label>
      {chosen?.note && <p className="text-sm text-stone">{chosen.note}</p>}
      {custom && <p className="text-sm font-semibold text-amber-ink">Custom model: no cost estimate, and structured output is not guaranteed. Test it.</p>}
      <button type="button" onClick={() => setCustom(c => !c)} className="text-sm font-semibold text-red hover:underline">
        {custom ? 'Back to the list' : 'Advanced: enter a custom model'}
      </button>

      <div className="flex flex-wrap items-end gap-3 border-t border-sand pt-4">
        <form action={testAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="spec" value={spec} />
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-body">Test direction</span>
            <select name="pair" className="input">{PAIR_IDS.map(p => <option key={p} value={p}>{p}</option>)}</select>
          </label>
          <button disabled={testing} className="btn-quiet">{testing ? 'Generating a lesson…' : 'Test model'}</button>
        </form>
        <form action={saveAction}>
          <input type="hidden" name="spec" value={spec} />
          <button disabled={saving} className="btn-red">{saving ? 'Saving…' : 'Use this model'}</button>
        </form>
      </div>
      <Note state={testState} okText="Test passed. See the table below." />
      <Note state={saveState} okText="Model saved. New lessons use it from now on." />
    </div>
  )
}
