// components/app/LoadSamplesButton.tsx
'use client'
import { useState, useTransition } from 'react'
import { loadSampleLessons } from '@/lib/lessons/actions'

export function LoadSamplesButton() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
      <p>Your lessons will appear here.</p>
      <button type="button" disabled={pending} className="mt-3 text-accent hover:underline disabled:opacity-50"
        onClick={() => start(async () => { const r = await loadSampleLessons(); if (r?.error) setError(r.error) })}>
        {pending ? 'Loading…' : 'Load three sample lessons to look around first'}
      </button>
      {error && <p role="alert" className="mt-2 text-warn">{error}</p>}
    </div>
  )
}
