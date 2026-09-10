// components/app/ReviewSession.tsx
'use client'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { reviewCard } from '@/lib/flashcards/actions'

export interface Card { id: string; type: 'phrase' | 'vocabulary'; front: string; back: { english: string; explanation?: string } }

export function ReviewSession({ cards, backHref }: { cards: Card[]; backHref: string }) {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState({ known: 0, again: 0 })
  const [pending, start] = useTransition()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const card = cards[i]
  const next = () => { setFlipped(false); setI(n => n + 1) }
  const answer = (result: 'known' | 'again') => start(async () => {
    await reviewCard(card.id, result)
    setTally(t => ({ ...t, [result]: t[result] + 1 }))
    next()
  })

  if (!card) {
    return (
      <div className="card space-y-4 px-6 py-8 text-center">
        <p className="text-lg font-semibold">Session done</p>
        <p className="tabular text-ink-2">{tally.known} known · {tally.again} to review again</p>
        <div className="flex justify-center gap-2">
          <Link href="/flashcards" className="btn-ghost">Other decks</Link>
          <Link href={backHref} className="btn-primary">Back</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-ink-3">
        <Link href="/flashcards" className="hover:text-ink">✕ End session</Link>
        <span className="tabular">{i + 1} / {cards.length}</span>
      </div>
      <div className="h-1 overflow-hidden rounded bg-line"><div className="h-full bg-ink transition-all" style={{ width: `${(i / cards.length) * 100}%` }} /></div>

      <button type="button" onClick={() => setFlipped(f => !f)} aria-pressed={flipped}
        className="card relative flex aspect-[3/2] w-full items-center justify-center px-6 py-8 text-center focus:outline-none focus:ring-2 focus:ring-accent">
        <span className="absolute left-3 top-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">{flipped ? 'back' : 'front'} · {card.type}</span>
        {flipped ? (
          <span className="space-y-3">
            <span className="block font-body text-2xl">{card.back.english}</span>
            {card.back.explanation && <span className="block border-t border-line pt-3 text-[15px] leading-relaxed text-ink-2">{card.back.explanation}</span>}
          </span>
        ) : (
          <span className="vn text-2xl leading-snug sm:text-3xl">{card.front}</span>
        )}
      </button>
      <p className="text-center text-xs text-ink-3">Tap or press Space to flip</p>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={pending} className="btn-ghost" onClick={() => answer('again')}>Review again</button>
        <button type="button" disabled={pending} className="btn-primary" onClick={() => answer('known')}>Know it</button>
      </div>
      <button type="button" disabled={pending} className="btn-quiet w-full" onClick={next}>Next card</button>
    </div>
  )
}
