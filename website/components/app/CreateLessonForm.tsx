// components/app/CreateLessonForm.tsx
'use client'
import { useActionState, useState } from 'react'
import { createLesson } from '@/lib/lessons/actions'
import { Generating } from './Generating'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'
import Link from 'next/link'

export function CreateLessonForm({ suggestions, locale = 'en', allowance = null, canCreate = true, showUpgrade = false }: {
  suggestions: string[]; locale?: Locale
  /** Null for pro and unlimited accounts, who see no counter at all. */
  allowance?: { left: number; of: number } | null
  canCreate?: boolean
  showUpgrade?: boolean
}) {
  const [state, action, pending] = useActionState(createLesson, null)
  const [text, setText] = useState('')
  const d = t(locale)

  // The form unmounts while generating, so focus moves to the wait state instead of dropping to <body>.
  if (pending) return <div ref={el => { el?.focus() }} tabIndex={-1} className="focus:outline-none"><Generating echo={text} lines={d.waitLines} /></div>

  return (
    <form action={action} className="space-y-3 rounded-card bg-white p-4 shadow-float focus-within:ring-2 focus-within:ring-red">
      {state?.error && <p role="alert" className="alert">{state.error}</p>}
      <textarea
        name="situation" value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={500} required
        aria-label={d.situationLabel} placeholder={d.placeholder} autoFocus={Boolean(state?.error)}
        onKeyDown={e => {
          // Enter submits with a physical keyboard. On touch keyboards Return adds a newline,
          // and nothing submits mid-composition, so a half-typed situation never spends a lesson.
          if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || window.matchMedia('(pointer: coarse)').matches) return
          e.preventDefault(); e.currentTarget.form?.requestSubmit()
        }}
        className="gloss w-full resize-none border-0 bg-transparent px-1 py-1 text-[17px] leading-relaxed text-ink placeholder:text-stone focus:outline-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => <button key={s} type="button" className="chip" onClick={() => setText(s)}>{s}</button>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!text.trim() || !canCreate} className="btn-red w-full sm:w-auto">{d.createLesson}</button>
        {allowance && (
          <p className={`text-sm font-semibold ${allowance.left === 0 ? 'text-amber-ink' : 'text-body'}`}>
            {allowance.left > 0 ? d.freeLeft(allowance.left, allowance.of) : d.freeSpent}
            {allowance.left === 0 && showUpgrade && <> <Link href="/pricing" className="text-ink underline">{d.upgrade}</Link></>}
          </p>
        )}
      </div>
    </form>
  )
}
