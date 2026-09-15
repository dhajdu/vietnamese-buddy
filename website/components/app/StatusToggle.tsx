// components/app/StatusToggle.tsx
'use client'
import { useOptimistic, useState, useTransition } from 'react'
import { setVocabularyStatus } from '@/lib/vocabulary/actions'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

type S = 'new' | 'learning' | 'known'
const ON: Record<S, string> = { new: 'bg-ink text-white', learning: 'bg-amber-bg text-amber-ink', known: 'bg-ok-bg text-ok-ink' }

/** `word` names the group for screen readers, so each row's toggle is distinguishable. */
export function StatusToggle({ id, status, word, locale = 'en' }: { id: string; status: S; word?: string; locale?: Locale }) {
  const d = t(locale)
  const LABEL: Record<S, string> = { new: d.filterNew, learning: d.filterLearning, known: d.filterKnown }
  const [opt, setOpt] = useOptimistic(status)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // On { error } the optimistic pick falls back to the saved status by itself when the transition ends.
  // Guarded here rather than with disabled, so the focused button keeps focus while the save runs.
  const pick = (s: S) => {
    if (pending || s === opt) return
    start(async () => {
      setError(null)
      setOpt(s)
      const res = await setVocabularyStatus(id, s)
      if (res.error) setError(res.error)
    })
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span role="radiogroup" aria-label={word} aria-busy={pending} className="inline-flex overflow-hidden rounded-pill border border-sand text-[11px] font-semibold aria-busy:cursor-wait aria-busy:opacity-50">
        {(['new', 'learning', 'known'] as S[]).map(s => (
          <button key={s} type="button" role="radio" aria-checked={opt === s} onClick={() => pick(s)}
            className={`min-h-11 px-2.5 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red sm:min-h-0 ${opt === s ? ON[s] : 'text-body hover:text-ink'}`}>
            {LABEL[s]}
          </button>
        ))}
      </span>
      {error && <span role="alert" className="text-xs text-err-ink">{error}</span>}
    </span>
  )
}
