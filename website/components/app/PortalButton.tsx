// components/app/PortalButton.tsx
'use client'
import { useState, useTransition } from 'react'
import { openBillingPortal } from '@/lib/billing/actions'

export function PortalButton({ label }: { label: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <button type="button" disabled={pending} className="btn-ink"
        onClick={() => start(async () => { const r = await openBillingPortal(); if (r?.error) setError(r.error) })}>
        {pending ? 'Opening…' : label}
      </button>
      {error && <p role="alert" className="text-sm text-err-ink">{error}</p>}
    </div>
  )
}
