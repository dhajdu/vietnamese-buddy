// components/app/LessonActions.tsx
'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { completeLesson, regenerateLesson } from '@/lib/lessons/actions'

export function LessonActions({ lessonId, completed, cardCount }: { lessonId: string; completed: boolean; cardCount: number }) {
  const [pending, start] = useTransition()
  const [adjusting, setAdjusting] = useState(false)
  const [adjustment, setAdjustment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(completed)

  const run = (fn: () => Promise<{ error?: string } | { ok: true } | undefined | void>) =>
    start(async () => { setError(null); const r = await fn(); if (r && 'error' in r && r.error) setError(r.error) })

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-card bg-err-bg px-3 py-2 text-sm text-err-ink">{error}</p>}
      {pending && <p className="t-gloss text-sm italic text-sand-70" aria-live="polite">Writing a new version of this lesson…</p>}
      <div className="flex flex-wrap gap-2">
        <Link href={`/flashcards?lesson=${lessonId}`} className="btn-red-dark">Review {cardCount} cards</Link>
        <button type="button" disabled={done || pending} className="btn-ghost-dark"
          onClick={() => run(async () => { const r = await completeLesson(lessonId); if (r && 'ok' in r) setDone(true); return r })}>
          {done ? '✓ Completed' : 'Mark complete'}
        </button>
        <button type="button" disabled={pending} className="btn-ghost-dark" onClick={() => run(() => regenerateLesson(lessonId))}>Regenerate</button>
        <button type="button" disabled={pending} className="btn-ghost-dark" onClick={() => setAdjusting(a => !a)}>Adjust…</button>
      </div>
      {adjusting && (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); run(() => regenerateLesson(lessonId, adjustment)) }}>
          <input value={adjustment} onChange={e => setAdjustment(e.target.value)} placeholder="e.g. make it more casual" required
            className="input flex-1 border-on-dark-line bg-on-dark-soft text-sand placeholder:text-sand-70" />
          <button type="submit" disabled={pending} className="btn-ghost-dark">Generate variant</button>
        </form>
      )}
    </div>
  )
}
