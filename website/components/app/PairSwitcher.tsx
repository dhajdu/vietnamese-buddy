// components/app/PairSwitcher.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { setPair } from '@/lib/pairs/actions'
import { PAIRS, PAIR_IDS, type PairId } from '@/lib/pairs'

export function PairSwitcher({ pair, label }: { pair: PairId; label: string }) {
  const [opt, setOpt] = useOptimistic(pair)
  const [, start] = useTransition()
  return (
    <span role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-pill border border-on-dark-line text-[11px] font-semibold">
      {PAIR_IDS.map(id => (
        <button key={id} type="button" role="radio" aria-checked={opt === id}
          onClick={() => start(async () => { setOpt(id); await setPair(id) })}
          title={PAIRS[id].targetName} className={`px-2.5 py-1 ${opt === id ? 'bg-sand text-ink-warm' : 'text-sand-70 hover:text-sand'}`}>
          {PAIRS[id].targetCode}
        </button>
      ))}
    </span>
  )
}
