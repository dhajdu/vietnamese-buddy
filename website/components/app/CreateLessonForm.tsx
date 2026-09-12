// components/app/CreateLessonForm.tsx
'use client'
import { useActionState, useState } from 'react'
import { createLesson } from '@/lib/lessons/actions'
import { Generating } from './Generating'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export function CreateLessonForm({ suggestions, locale = 'en' }: { suggestions: string[]; locale?: Locale }) {
  const [state, action, pending] = useActionState(createLesson, null)
  const [text, setText] = useState('')
  const d = t(locale)

  if (pending) return <Generating echo={text} lines={d.waitLines} />

  return (
    <form action={action} className="space-y-3 rounded-card bg-white p-4 shadow-float">
      {state?.error && <p role="alert" className="alert">{state.error}</p>}
      <textarea
        name="situation" value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={500} required
        placeholder={d.placeholder}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
        className="gloss w-full resize-none border-0 bg-transparent px-1 py-1 text-[17px] leading-relaxed text-ink placeholder:text-stone focus:outline-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => <button key={s} type="button" className="chip" onClick={() => setText(s)}>{s}</button>)}
      </div>
      <button type="submit" disabled={!text.trim()} className="btn-red w-full sm:w-auto">{d.createLesson}</button>
    </form>
  )
}
