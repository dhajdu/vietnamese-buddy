// components/admin/CompToggle.tsx
'use client'
import { useState, useTransition } from 'react'
import { setComped } from '@/lib/admin/actions'

export function CompToggle({ userId, comped }: { userId: string; comped: boolean }) {
  const [on, setOn] = useState(comped)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="flex items-center gap-2">
      <button type="button" disabled={pending} className={on ? 'btn-ink' : 'btn-quiet'}
        onClick={() => start(async () => {
          const next = !on
          const r = await setComped(userId, next)
          if (r?.error) setError(r.error); else { setOn(next); setError(null) }
        })}>
        {pending ? '…' : on ? 'Comped ✓' : 'Comp access'}
      </button>
      {error && <span role="alert" className="text-xs text-err-ink">{error}</span>}
    </span>
  )
}
