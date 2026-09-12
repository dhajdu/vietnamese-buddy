// components/app/LessonActions.tsx
'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { completeLesson, adjustLesson, deleteLesson } from '@/lib/lessons/actions'
import { Generating } from './Generating'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export function LessonActions({ lessonId, completed, cardCount, locale = 'en', canAdjust = true }: { lessonId: string; completed: boolean; cardCount: number; locale?: Locale; canAdjust?: boolean }) {
  const d = t(locale)
  const [pending, start] = useTransition()
  const [adjusting, setAdjusting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(completed)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const run = (fn: () => Promise<{ error?: string } | { ok: true } | undefined | void>) =>
    start(async () => { setError(null); const r = await fn(); if (r && 'error' in r && r.error) setError(r.error) })

  if (pending && adjusting) return <Generating echo={note} lines={d.adjustLines} dark />

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-card bg-err-bg px-3 py-2 text-sm text-err-ink">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Link href={`/app/flashcards?lesson=${lessonId}`} className="btn-red-dark">{d.reviewCards(cardCount)}</Link>
        <button type="button" disabled={done || pending} className="btn-ghost-dark"
          onClick={() => run(async () => { const r = await completeLesson(lessonId); if (r && 'ok' in r) setDone(true); return r })}>
          {done ? d.completed : d.markComplete}
        </button>
        {confirmingDelete ? (
          <span className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={pending} className="btn-red-dark"
              onClick={() => run(() => deleteLesson(lessonId))}>{d.deleteConfirm}</button>
            <button type="button" disabled={pending} className="btn-ghost-dark" onClick={() => setConfirmingDelete(false)}>{d.cancel}</button>
            <span className="gloss text-[13px] text-sand-70">{d.deleteHint}</span>
          </span>
        ) : (
          <button type="button" disabled={pending} className="btn-ghost-dark" onClick={() => setConfirmingDelete(true)}>{d.delete}</button>
        )}
        {canAdjust ? (
          <button type="button" disabled={pending} className="btn-ghost-dark" onClick={() => setAdjusting(a => !a)}>
            {adjusting ? d.cancel : d.adjust}
          </button>
        ) : (
          <Link href="/pricing" className="btn-ghost-dark opacity-70" title={d.adjustIsPro}>🔒 {d.adjust}</Link>
        )}
      </div>
      {adjusting && (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); run(() => adjustLesson(lessonId, note)) }}>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder={d.adjustPlaceholder} required autoFocus
            className="input flex-1 border-on-dark-line bg-on-dark-soft text-sand placeholder:text-sand-70" />
          <button type="submit" disabled={pending || !note.trim()} className="btn-ghost-dark">{d.rewrite}</button>
        </form>
      )}
    </div>
  )
}
