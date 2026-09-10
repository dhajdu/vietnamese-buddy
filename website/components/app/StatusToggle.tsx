// components/app/StatusToggle.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { setVocabularyStatus } from '@/lib/vocabulary/actions'

type S = 'new' | 'learning' | 'known'
const LABEL: Record<S, string> = { new: 'New', learning: 'Learning', known: 'Known' }

export function StatusToggle({ id, status }: { id: string; status: S }) {
  const [opt, setOpt] = useOptimistic(status)
  const [, start] = useTransition()
  return (
    <span role="radiogroup" className="inline-flex overflow-hidden rounded border border-line text-[11px]">
      {(['new', 'learning', 'known'] as S[]).map(s => (
        <button key={s} type="button" role="radio" aria-checked={opt === s}
          onClick={() => start(async () => { setOpt(s); await setVocabularyStatus(id, s) })}
          className={`px-2 py-0.5 ${opt === s ? 'bg-ink text-bg' : 'text-ink-3 hover:text-ink'}`}>
          {LABEL[s]}
        </button>
      ))}
    </span>
  )
}
