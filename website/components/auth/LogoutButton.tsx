// components/auth/LogoutButton.tsx
'use client'
import { useState, useTransition } from 'react'
import { logout } from '@/lib/auth/actions'

export function LogoutButton({ dark = false, label = 'Sign out' }: { dark?: boolean; label?: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const signOut = () => {
    if (pending) return
    setError('')
    start(async () => {
      // logout redirects when it works; a failure comes back as { error }.
      const res = await logout()
      if (res?.error) setError(res.error)
    })
  }
  return (
    // In a dark header the error hangs below the bar so the bar keeps its height; on light pages it sits in the flow.
    <span className={dark ? 'relative inline-flex' : 'inline-flex flex-col items-start gap-2'}>
      <button type="button" onClick={signOut} aria-busy={pending}
        className={`inline-flex min-h-11 items-center text-sm font-semibold aria-busy:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-0 ${dark ? 'text-sand-70 hover:text-sand focus-visible:outline-sand' : 'text-body hover:text-ink focus-visible:outline-red'}`}>
        {label}
      </button>
      {error && <span role="alert" className={`alert ${dark ? 'absolute right-0 top-full z-10 mt-2 w-max max-w-xs' : ''}`}>{error}</span>}
    </span>
  )
}
