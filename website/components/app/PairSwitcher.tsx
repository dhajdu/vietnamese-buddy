// components/app/PairSwitcher.tsx
'use client'
import { useOptimistic, useState, useTransition } from 'react'
import { setPair } from '@/lib/pairs/actions'
import { PAIRS, PAIR_IDS, type PairId } from '@/lib/pairs'

export function PairSwitcher({ pair, label, dark = false }: { pair: PairId; label: string; dark?: boolean }) {
  const [opt, setOpt] = useOptimistic(pair)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const pick = (id: PairId) => {
    if (pending || id === opt) return
    setError('')
    start(async () => {
      setOpt(id)
      const res = await setPair(id)
      if (res.error) setError(res.error)
    })
  }
  return (
    // In the dark header the error hangs below the bar so the bar keeps its height; on light pages it sits in the flow.
    <span className={dark ? 'relative inline-flex' : 'inline-flex flex-col items-start gap-2'}>
      <span role="radiogroup" aria-label={label} aria-busy={pending}
        className={`inline-flex rounded-pill border text-sm font-semibold aria-busy:opacity-50 md:text-[11px] ${dark ? 'border-on-dark-line' : 'border-sand'}`}>
        {PAIR_IDS.map(id => (
          <button key={id} type="button" role="radio" aria-checked={opt === id} onClick={() => pick(id)}
            className={`min-h-11 rounded-pill px-3 focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-0 md:px-2.5 md:py-1 ${dark
              ? `focus-visible:outline-sand ${opt === id ? 'bg-sand text-ink-warm' : 'text-sand-70 hover:text-sand'}`
              : `focus-visible:outline-red ${opt === id ? 'bg-ink text-white' : 'text-body hover:text-ink'}`}`}>
            {PAIRS[id].targetCode}<span className="sr-only"> {PAIRS[id].targetName}</span>
          </button>
        ))}
      </span>
      {error && <span role="alert" className={`alert ${dark ? 'absolute right-0 top-full z-10 mt-2 w-max max-w-xs' : ''}`}>{error}</span>}
    </span>
  )
}
