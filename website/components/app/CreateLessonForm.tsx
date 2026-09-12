// components/app/CreateLessonForm.tsx
'use client'
import { useActionState, useState } from 'react'
import { createLesson } from '@/lib/lessons/actions'
import { Generating } from './Generating'

const WAIT_LINES = [
  'Writing phrases a Saigon local would actually say…',
  'Picking one grammar pattern from the situation…',
  'Choosing vocabulary you can reuse tomorrow…',
]

export function CreateLessonForm({ suggestions }: { suggestions: string[] }) {
  const [state, action, pending] = useActionState(createLesson, null)
  const [text, setText] = useState('')

  if (pending) return <Generating echo={text} lines={WAIT_LINES} />

  return (
    <form action={action} className="space-y-3 rounded-card bg-white p-4 shadow-float">
      {state?.error && <p role="alert" className="alert">{state.error}</p>}
      <textarea
        name="situation" value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={500} required
        placeholder="e.g. I’m meeting my girlfriend’s friends at a café in Thảo Điền"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
        className="t-gloss w-full resize-none border-0 bg-transparent px-1 py-1 text-[17px] leading-relaxed text-ink placeholder:text-stone focus:outline-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => (
          <button key={s} type="button" className="chip" onClick={() => setText(s)}>{s}</button>
        ))}
      </div>
      <button type="submit" disabled={!text.trim()} className="btn-red w-full sm:w-auto">Create today&rsquo;s lesson →</button>
    </form>
  )
}
