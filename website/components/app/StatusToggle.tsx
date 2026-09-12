// components/app/StatusToggle.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { setVocabularyStatus } from '@/lib/vocabulary/actions'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

type S = 'new' | 'learning' | 'known'
const ON: Record<S, string> = { new: 'bg-ink text-white', learning: 'bg-amber-bg text-amber-ink', known: 'bg-ok-bg text-ok-ink' }

export function StatusToggle({ id, status, locale = 'en' }: { id: string; status: S; locale?: Locale }) {
  const d = t(locale)
  const LABEL: Record<S, string> = { new: d.filterNew, learning: d.filterLearning, known: d.filterKnown }
  const [opt, setOpt] = useOptimistic(status)
  const [, start] = useTransition()
  return (
    <span role="radiogroup" className="inline-flex overflow-hidden rounded-pill border border-sand text-[11px] font-semibold">
      {(['new', 'learning', 'known'] as S[]).map(s => (
        <button key={s} type="button" role="radio" aria-checked={opt === s}
          onClick={() => start(async () => { setOpt(s); await setVocabularyStatus(id, s) })}
          className={`px-2.5 py-1 capitalize ${opt === s ? ON[s] : 'text-stone hover:text-ink'}`}>
          {LABEL[s]}
        </button>
      ))}
    </span>
  )
}
