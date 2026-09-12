// components/app/ReviewSession.tsx — full-screen review in the warm-black room.
'use client'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { reviewCard } from '@/lib/flashcards/actions'
import { Speak } from './Speak'
import { DEFAULT_PAIR, type PairId, type Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export interface Card { id: string; type: 'phrase' | 'vocabulary'; front: string; back: { english: string; explanation?: string } }

// Encouragements in the language being learned, glossed on hover.
const CHEER: Record<PairId, [string, string][]> = {
  'en-vi': [['Giỏi lắm.', 'Very good.'], ['Ráng lên.', 'Keep going.'], ['Gần xong rồi.', 'Almost done.'], ['Đúng rồi đó.', 'That’s right.']],
  'vi-en': [['Nice work.', 'Làm tốt lắm.'], ['Keep going.', 'Cố lên.'], ['Almost there.', 'Sắp xong rồi.'], ['You got it.', 'Đúng rồi đó.']],
}

export function ReviewSession({ cards, backHref, title, streakBefore, pair = DEFAULT_PAIR, locale = 'en' }: {
  cards: Card[]; backHref: string; title: string; streakBefore: number; pair?: PairId; locale?: Locale
}) {
  const d = t(locale)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState({ known: 0, again: 0, run: 0 })
  const [pending, start] = useTransition()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const card = cards[i]
  const next = () => { setFlipped(false); setI(n => n + 1) }
  const answer = (result: 'known' | 'again') => start(async () => {
    await reviewCard(card.id, result)
    setTally(t => ({ ...t, [result]: t[result] + 1, run: result === 'known' ? t.run + 1 : 0 }))
    next()
  })
  const cheers = CHEER[pair]
  const cheer = tally.run >= 3 ? cheers[Math.min(Math.floor(tally.run / 3) - 1, cheers.length - 1)] : null

  return (
    <div className="fixed inset-0 z-30 flex flex-col gap-4 overflow-y-auto bg-ink-warm px-5 pb-8 pt-6 text-sand sm:static sm:min-h-[70vh] sm:rounded-card sm:px-8 sm:py-8">
      {!card ? (
        <div className="m-auto max-w-sm space-y-5 text-center">
          <p className="eyebrow-dark">{d.sessionDone}</p>
          <p className="streak-pulse font-target text-6xl font-extrabold tracking-[-0.04em] text-sand">🔥 {streakBefore + 1 > streakBefore ? Math.max(streakBefore, 1) : streakBefore}</p>
          <p className="tabular gloss text-sand-70">{tally.known} {d.known} · {tally.again} {d.toReviewAgain}</p>
          <div className="flex justify-center gap-2">
            <Link href="/app/flashcards" className="btn-ghost-dark">{d.otherDecks}</Link>
            <Link href={backHref} className="btn-red-dark">{d.back}</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs font-semibold text-sand-70">
            <Link href="/app/flashcards" className="hover:text-sand">{d.endSession}</Link>
            <span className="tabular">{title} · {i + 1} / {cards.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-on-dark-line"><div className="h-full rounded bg-red-bright transition-all" style={{ width: `${(i / cards.length) * 100}%` }} /></div>

          <button type="button" onClick={() => setFlipped(f => !f)} aria-pressed={flipped}
            className="relative flex min-h-[340px] flex-1 items-center justify-center rounded-[20px] bg-white px-7 py-10 text-center shadow-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]">
            <span className="absolute left-4 top-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone">{flipped ? 'back' : 'front'} · {card.type}</span>
            <Speak text={card.front} pair={pair} size="lg" className="absolute right-3 top-2.5" autoPlay />
            {flipped ? (
              <span className="space-y-3">
                <span className="gloss block text-2xl">{card.back.english}</span>
                {card.back.explanation && <span className="block border-t border-sand pt-3 text-[15px] leading-relaxed text-body">{card.back.explanation}</span>}
              </span>
            ) : (
              <span className="target text-3xl leading-tight sm:text-4xl">{card.front}</span>
            )}
            <span className="absolute bottom-3 text-xs text-stone">{d.tapToFlip}</span>
          </button>

          <p className="gloss min-h-[1.5em] text-center text-[15px] italic text-sand-70" title={cheer?.[1]}>{cheer ? `${cheer[0]} ${tally.run}.` : ''}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" disabled={pending} className="btn-ghost-dark py-4" onClick={() => answer('again')}>{d.again}</button>
            <button type="button" disabled={pending} className="btn-red-dark py-4" onClick={() => answer('known')}>{d.knowIt}</button>
          </div>
          <button type="button" disabled={pending} className="text-center text-sm font-semibold text-sand-70 hover:text-sand" onClick={next}>{d.skip}</button>
        </>
      )}
    </div>
  )
}
