// components/app/CreateLessonForm.tsx
'use client'
import { useActionState, useEffect, useState } from 'react'
import { createLesson } from '@/lib/lessons/actions'

const WAIT_LINES = [
  'Writing phrases a Saigon local would actually say…',
  'Picking one grammar pattern from the situation…',
  'Choosing vocabulary you can reuse tomorrow…',
]

export function CreateLessonForm() {
  const [state, action, pending] = useActionState(createLesson, null)
  const [text, setText] = useState('')
  const [line, setLine] = useState(0)

  useEffect(() => {
    if (!pending) return
    const t = setInterval(() => setLine(l => (l + 1) % WAIT_LINES.length), 4000)
    return () => clearInterval(t)
  }, [pending])

  if (pending) {
    return (
      <div className="card space-y-3 px-5 py-5" aria-live="polite">
        <p className="font-display text-[15px] font-medium">&ldquo;{text}&rdquo;</p>
        <div className="h-1 w-full overflow-hidden rounded bg-line"><div className="h-full w-1/2 animate-pulse bg-ink" /></div>
        <p className="text-sm text-ink-2">{WAIT_LINES[line]}</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-3">
      {state?.error && (
        <p role="alert" className="rounded-md border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">{state.error}</p>
      )}
      <textarea
        name="situation" value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={500} required
        placeholder="e.g. I’m talking to someone who works at a restaurant about a possible internship"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
        className="w-full resize-none rounded-card border border-line bg-surface px-4 py-3 text-[17px] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button type="submit" disabled={!text.trim()} className="btn-primary w-full sm:w-auto sm:px-6">Create Lesson</button>
    </form>
  )
}
