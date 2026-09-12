// components/app/LoadSamplesButton.tsx
'use client'
import { useState, useTransition } from 'react'
import { loadSampleLessons } from '@/lib/lessons/actions'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export function LoadSamplesButton({ locale = 'en' }: { locale?: Locale }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const d = t(locale)
  return (
    <div className="rounded-card border border-dashed border-sand px-4 py-6 text-center text-sm text-stone">
      <p className="gloss text-[15px]">{d.emptyLessons}</p>
      <button type="button" disabled={pending} className="mt-3 font-semibold text-red hover:underline disabled:opacity-50"
        onClick={() => start(async () => { const r = await loadSampleLessons(); if (r?.error) setError(r.error) })}>
        {pending ? d.loading : d.loadSamples}
      </button>
      {error && <p role="alert" className="mt-2 text-err-ink">{error}</p>}
    </div>
  )
}
