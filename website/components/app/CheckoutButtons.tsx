// components/app/CheckoutButtons.tsx
'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { startCheckout } from '@/lib/billing/actions'

/**
 * One click to Stripe for a signed-in visitor. A signed-out one has no account
 * to attach a subscription to, so they go to signup carrying the plan; billing
 * opens checkout for them the moment they land.
 */
export function CheckoutButton({ term, label, live, signedIn, variant }: {
  term: 'monthly' | 'annual'; label: string; live: boolean; signedIn: boolean; variant: 'red' | 'quiet'
}) {
  const [state, action, pending] = useActionState(
    async (_p: { error?: string } | null, fd: FormData) => startCheckout(fd), null)
  const cls = `w-full whitespace-nowrap ${variant === 'red' ? 'btn-red' : 'btn-quiet'}`

  if (!live) return <Link href={signedIn ? '/app' : '/signup'} className={cls}>{signedIn ? 'Go to your lessons' : 'Start free'}</Link>
  if (!signedIn) return <Link href={`/signup?plan=${term}`} className={cls}>{label}</Link>

  return (
    <form action={action}>
      <input type="hidden" name="term" value={term} />
      <button disabled={pending} className={cls}>{pending ? 'Opening Stripe…' : label}</button>
      {state?.error && <p role="alert" className="mt-2 text-sm text-err-ink">{state.error}</p>}
    </form>
  )
}

/** Carries a plan chosen before signup straight through to Stripe on arrival. */
export function AutoCheckout({ term }: { term: 'monthly' | 'annual' }) {
  const [state, action] = useActionState(
    async (_p: { error?: string } | null, fd: FormData) => startCheckout(fd), null)
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="term" value={term} />
      <button className="btn-red" autoFocus>Continue to payment →</button>
      <p className="meta">You picked the {term} plan. This opens Stripe.</p>
      {state?.error && <p role="alert" className="text-sm text-err-ink">{state.error}</p>}
    </form>
  )
}
