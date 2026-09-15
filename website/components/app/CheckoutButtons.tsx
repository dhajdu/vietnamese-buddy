// components/app/CheckoutButtons.tsx
'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { startCheckout } from '@/lib/billing/actions'

/**
 * The public pricing page is static, so every visitor is treated as signed out:
 * they go to signup carrying the plan, and billing opens checkout the moment they land.
 */
export function CheckoutButton({ term, label, live, variant }: {
  term: 'monthly' | 'annual'; label: string; live: boolean; variant: 'red' | 'quiet'
}) {
  const cls = `w-full whitespace-nowrap ${variant === 'red' ? 'btn-red' : 'btn-quiet'}`
  return live
    ? <Link href={`/signup?plan=${term}`} className={cls}>{label}</Link>
    : <Link href="/signup" className={cls}>Start free</Link>
}

/** Carries a plan chosen before signup straight through to Stripe on arrival. */
export function AutoCheckout({ term }: { term: 'monthly' | 'annual' }) {
  const [state, action, pending] = useActionState(
    async (_p: { error?: string } | null, fd: FormData) => startCheckout(fd), null)
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="term" value={term} />
      <button disabled={pending} className="btn-red" autoFocus>{pending ? 'Opening Stripe…' : 'Continue to payment →'}</button>
      <p className="meta">You picked the {term} plan. This opens Stripe.</p>
      {state?.error && <p role="alert" className="text-sm text-err-ink">{state.error}</p>}
    </form>
  )
}
