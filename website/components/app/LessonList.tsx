// components/app/LessonList.tsx
import Link from 'next/link'
import type { LessonRow } from '@/lib/lessons/queries'
import { formatDate } from '@/lib/lessons/format'

export function LessonList({ lessons, tz, newWords, detailed = false }: {
  lessons: LessonRow[]; tz: string; newWords?: Map<string, number>; detailed?: boolean
}) {
  if (!lessons.length) {
    return <div className="rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">Your lessons will appear here.</div>
  }
  return (
    <ul className="flex flex-col gap-2">
      {lessons.map(l => (
        <li key={l.id} className={l.parent_lesson_id ? 'ml-4' : ''}>
          <Link href={`/lessons/${l.id}`}
            className={`card block px-4 py-3 hover:border-ink ${l.parent_lesson_id ? 'border-dashed' : ''}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-[15px] font-semibold">{l.parent_lesson_id ? '↳ ' : ''}{l.title}</span>
              <span className="shrink-0 text-xs text-ink-3">{formatDate(l.created_at, tz)}{l.source === 'seed' ? ' · sample' : ''}</span>
            </div>
            {detailed && (
              <div className="mt-0.5 text-sm text-ink-2">
                <span className="vn font-medium text-[13px]">{l.grammar_topic}</span>
                {' · '}{l.lesson_json.phrases.length} phrases
                {newWords && <> · {newWords.get(l.id) ?? 0} new words</>}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
