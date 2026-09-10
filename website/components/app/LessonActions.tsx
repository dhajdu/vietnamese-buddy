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
      {error && <p role="alert" className="rounded-md border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>}
      {pending && <p className="text-sm text-ink-2" aria-live="polite">Writing a new version of this lesson…</p>}
      <div className="flex flex-wrap gap-2">
        <Link href={`/flashcards?lesson=${lessonId}`} className="btn-primary">Review {cardCount} cards</Link>
        <button type="button" disabled={done || pending} className="btn-ghost"
          onClick={() => run(async () => { const r = await completeLesson(lessonId); if (r && 'ok' in r) setDone(true); return r })}>
          {done ? '✓ Completed' : 'Mark complete'}
        </button>
        <button type="button" disabled={pending} className="btn-quiet" onClick={() => run(() => regenerateLesson(lessonId))}>Regenerate</button>
        <button type="button" disabled={pending} className="btn-quiet" onClick={() => setAdjusting(a => !a)}>Adjust…</button>
      </div>
      {adjusting && (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); run(() => regenerateLesson(lessonId, adjustment)) }}>
          <input value={adjustment} onChange={e => setAdjustment(e.target.value)} placeholder="e.g. make it more casual" required
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button type="submit" disabled={pending} className="btn-ghost">Generate variant</button>
        </form>
      )}
    </div>
  )
}
