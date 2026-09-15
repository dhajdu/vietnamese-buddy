// components/app/ReviewSession.tsx — full-screen review in the warm-black room.
'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { reviewCard } from '@/lib/flashcards/actions'
import { Speak } from './Speak'
import { PAIRS, DEFAULT_PAIR, type PairId, type Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export interface Card { id: string; type: 'phrase' | 'vocabulary'; front: string; back: { english: string; explanation?: string } }

// Encouragements in the language being learned, with a small visible gloss line.
const CHEER: Record<PairId, [string, string][]> = {
  'en-vi': [['Giỏi lắm.', 'Very good.'], ['Ráng lên.', 'Keep going.'], ['Gần xong rồi.', 'Almost done.'], ['Đúng rồi đó.', 'That’s right.']],
  'vi-en': [['Nice work.', 'Làm tốt lắm.'], ['Keep going.', 'Cố lên.'], ['Almost there.', 'Sắp xong rồi.'], ['You got it.', 'Đúng rồi đó.']],
}

export function ReviewSession({ cards, backHref, title, streakBefore, activeToday = false, pair = DEFAULT_PAIR, locale = 'en' }: {
  cards: Card[]; backHref: string; title: string; streakBefore: number; activeToday?: boolean; pair?: PairId; locale?: Locale
}) {
  const d = t(locale)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState({ known: 0, again: 0, run: 0 })
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const cardRef = useRef<HTMLButtonElement>(null)
  const targetLang = PAIRS[pair].targetField === 'vietnamese' ? 'vi' : 'en'
  const sourceLang = targetLang === 'vi' ? 'en' : 'vi'

  const card = cards[i]
  // Focus moves to the card so Space and the arrow keys act on it, not on the button just pressed.
  const next = () => { setError(null); setFlipped(false); setI(n => n + 1); cardRef.current?.focus({ preventScroll: true }) }
  // Advance before the save lands. On { error }, step back to that card uncounted so it can be answered again.
  const answer = (result: 'known' | 'again') => {
    if (!card || pending) return
    const at = i
    const before = tally
    setTally({ ...before, [result]: before[result] + 1, run: result === 'known' ? before.run + 1 : 0 })
    next()
    start(async () => {
      const res = await reviewCard(card.id, result)
      if (res.error) { setError(res.error); setTally(before); setI(at); setFlipped(false) }
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const el = e.target instanceof Element ? e.target : null
      const onCard = el === cardRef.current
      // Other controls keep their own keys. The focused card flips on Space natively.
      if (!onCard && el?.closest('a, button, input, textarea, select, [contenteditable]')) return
      if (e.key === ' ') { if (!onCard) { e.preventDefault(); setFlipped(f => !f) } }
      else if (pending) return
      else if (e.key === 'ArrowLeft' || e.key === '1') { e.preventDefault(); answer('again') }
      else if (e.key === 'ArrowRight' || e.key === '2') { e.preventDefault(); answer('known') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const cheers = CHEER[pair]
  const cheer = tally.run >= 3 ? cheers[Math.min(Math.floor(tally.run / 3) - 1, cheers.length - 1)] : null
  // The first answer of the day adds a day to the streak; a learner who already studied today keeps the number.
  const bumped = !activeToday && tally.known + tally.again > 0
  const streak = streakBefore + (bumped ? 1 : 0)

  return (
    <div className="fixed inset-0 z-30 flex flex-col gap-4 overflow-y-auto bg-ink-warm px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 text-sand sm:static sm:min-h-[70vh] sm:rounded-card sm:px-8 sm:py-8">
      {!card ? (
        <div className="m-auto max-w-sm space-y-5 text-center">
          <p className="eyebrow-dark">{d.sessionDone}</p>
          <p className={`${bumped ? 'streak-pulse ' : ''}font-vn text-6xl font-extrabold tracking-[-0.04em] text-sand`}>🔥 {streak}</p>
          <p className="tabular gloss text-sand-70">{tally.known} {d.known} · {tally.again} {d.toReviewAgain}</p>
          <div className="flex justify-center gap-2">
            <Link href="/app/flashcards" className="btn-ghost-dark">{d.otherDecks}</Link>
            <Link href={backHref} className="btn-red-dark">{d.back}</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-sand-70">
            <Link href="/app/flashcards" className="-my-3 inline-flex min-h-11 items-center hover:text-sand sm:my-0 sm:min-h-0">{d.endSession}</Link>
            <h1 className="tabular">{title} · {i + 1} / {cards.length}</h1>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-on-dark-line"><div className="h-full rounded bg-red-bright motion-safe:transition-all" style={{ width: `${(i / cards.length) * 100}%` }} /></div>

          {/* Speak sits beside the flip button, not inside it: a button may not contain a button. */}
          <div className="relative flex min-h-[220px] shrink-0 grow">
            <button ref={cardRef} type="button" onClick={() => setFlipped(f => !f)} aria-pressed={flipped}
              className="relative flex flex-1 items-center justify-center rounded-[20px] bg-white px-7 py-10 text-center shadow-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-sand focus-visible:ring-offset-2 focus-visible:ring-offset-ink-warm">
              <span className="absolute left-4 top-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-body">{flipped ? 'back' : 'front'} · {card.type}</span>
              {flipped ? (
                <span lang={sourceLang} className="space-y-3">
                  <span className="gloss block text-2xl">{card.back.english}</span>
                  {card.back.explanation && <span className="block border-t border-sand pt-3 text-[15px] leading-relaxed text-body">{card.back.explanation}</span>}
                </span>
              ) : (
                <span lang={targetLang} className="target text-3xl leading-tight sm:text-4xl">{card.front}</span>
              )}
              <span className="absolute bottom-3 text-xs text-body">{d.tapToFlip}</span>
            </button>
            <div className="absolute right-3 top-2.5 flex"><Speak text={card.front} pair={pair} size="lg" autoPlay /></div>
          </div>

          <p lang={targetLang} className="gloss min-h-[1.5em] text-center text-[15px] italic text-sand-70">
            {cheer && <>{cheer[0]} {tally.run}.<span lang={sourceLang} className="block text-xs">{cheer[1]}</span></>}
          </p>
          {error && <p role="alert" className="alert text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" disabled={pending} className="btn-ghost-dark py-4" onClick={() => answer('again')}>{d.again}</button>
            <button type="button" disabled={pending} className="btn-red-dark py-4" onClick={() => answer('known')}>{d.knowIt}</button>
          </div>
          <button type="button" disabled={pending} className="-my-3 min-h-11 text-center text-sm font-semibold text-sand-70 hover:text-sand sm:my-0 sm:min-h-0" onClick={next}>{d.skip}</button>
        </>
      )}
    </div>
  )
}
