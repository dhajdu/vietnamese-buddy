// components/app/LessonList.tsx
import Link from 'next/link'
import type { LessonRow } from '@/lib/lessons/queries'
import { formatDate } from '@/lib/lessons/format'

export type LessonState = { kind: 'reviewed' } | { kind: 'new'; count: number } | { kind: 'due'; count: number } | { kind: 'none' }

const STRIPE: Record<LessonState['kind'], string> = { reviewed: 'bg-ok-ink', new: 'bg-amber-ink', due: 'bg-red', none: 'bg-sand-deep' }
const TEXT: Record<LessonState['kind'], string> = { reviewed: 'text-ok-ink', new: 'text-amber-ink', due: 'text-red', none: 'text-stone' }

function label(s: LessonState) {
  if (s.kind === 'reviewed') return '✓ reviewed'
  if (s.kind === 'new') return `${s.count} new`
  if (s.kind === 'due') return `${s.count} due`
  return ''
}

export function LessonList({ lessons, tz, states, detailed = false }: {
  lessons: LessonRow[]; tz: string; states?: Map<string, LessonState>; detailed?: boolean
}) {
  if (!lessons.length) return <div className="rounded-card border border-dashed border-sand px-4 py-6 text-center text-sm text-stone">Your lessons will appear here.</div>
  return (
    <ul className="flex flex-col gap-2">
      {lessons.map(l => {
        const s = states?.get(l.id) ?? { kind: 'none' as const }
        return (
          <li key={l.id} className={l.parent_lesson_id ? 'ml-4' : ''}>
            <Link href={`/lessons/${l.id}`} className={`card flex items-center gap-3 px-3.5 py-3 hover:border-ink ${l.parent_lesson_id ? 'border-dashed' : ''}`}>
              <span className={`w-1.5 self-stretch rounded-[3px] ${STRIPE[s.kind]}`} />
              <span className="min-w-0 flex-1">
                <b className="block truncate font-vn text-[15px] font-bold text-ink">{l.parent_lesson_id ? '↳ ' : ''}{l.title}</b>
                <small className="t-gloss block text-[13px] text-stone">
                  {formatDate(l.created_at, tz)}{l.source === 'seed' ? ' · sample' : ''} · {l.grammar_topic}
                  {detailed && <> · {l.lesson_json.phrases.length} phrases</>}
                </small>
              </span>
              <em className={`shrink-0 text-xs font-semibold not-italic ${TEXT[s.kind]}`}>{label(s)}</em>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
