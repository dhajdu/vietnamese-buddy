// components/app/LessonActions.tsx
'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { completeLesson, adjustLesson } from '@/lib/lessons/actions'
import { Generating } from './Generating'

const ADJUST_LINES = [
  'Rewriting the phrases with your note…',
  'Keeping the grammar pattern…',
  'Checking it still sounds Southern…',
]

export function LessonActions({ lessonId, completed, cardCount }: { lessonId: string; completed: boolean; cardCount: number }) {
  const [pending, start] = useTransition()
  const [adjusting, setAdjusting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(completed)

  const run = (fn: () => Promise<{ error?: string } | { ok: true } | undefined | void>) =>
    start(async () => { setError(null); const r = await fn(); if (r && 'error' in r && r.error) setError(r.error) })

  if (pending && adjusting) return <Generating echo={note} lines={ADJUST_LINES} dark />

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-card bg-err-bg px-3 py-2 text-sm text-err-ink">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Link href={`/flashcards?lesson=${lessonId}`} className="btn-red-dark">Review {cardCount} cards</Link>
        <button type="button" disabled={done || pending} className="btn-ghost-dark"
          onClick={() => run(async () => { const r = await completeLesson(lessonId); if (r && 'ok' in r) setDone(true); return r })}>
          {done ? '✓ Completed' : 'Mark complete'}
        </button>
        <button type="button" disabled={pending} className="btn-ghost-dark" onClick={() => setAdjusting(a => !a)}>
          {adjusting ? 'Cancel' : 'Adjust…'}
        </button>
      </div>
      {adjusting && (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); run(() => adjustLesson(lessonId, note)) }}>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. make it more casual" required autoFocus
            className="input flex-1 border-on-dark-line bg-on-dark-soft text-sand placeholder:text-sand-70" />
          <button type="submit" disabled={pending || !note.trim()} className="btn-ghost-dark">Rewrite</button>
        </form>
      )}
    </div>
  )
}
