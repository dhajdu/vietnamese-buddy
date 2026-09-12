// components/app/CheckoutButtons.tsx
'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { startCheckout } from '@/lib/billing/actions'

export function CheckoutButtons({ term, label, signedIn }: { term: 'monthly' | 'annual'; label: string; signedIn: boolean }) {
  const [state, action, pending] = useActionState(
    async (_p: { error?: string } | null, fd: FormData) => startCheckout(fd), null)

  // Checkout needs an account to attach the subscription to, so send a signed-out
  // visitor to signup rather than into a Stripe session with nobody behind it.
  if (!signedIn) return <Link href="/signup" className="btn-red mt-5 w-full">Start free</Link>

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="term" value={term} />
      <button disabled={pending} className="btn-red w-full">{pending ? 'Opening Stripe…' : label}</button>
      {state?.error && <p role="alert" className="mt-2 text-sm text-err-ink">{state.error}</p>}
    </form>
  )
}
