// app/(app)/lessons/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getLesson } from '@/lib/lessons/queries'
import { LessonActions } from '@/components/app/LessonActions'

// Lesson generation runs as a Server Action from this route; give it room.
export const maxDuration = 180

export default async function LessonPage({ params }: PageProps<'/lessons/[id]'>) {
  const { id } = await params
  const user = await requireAuth()
  const db = await createClient()
  const row = await getLesson(db, user.id, id)
  if (!row) notFound()
  const lesson = row.lesson_json

  const [{ count: cardCount }, { data: parent }] = await Promise.all([
    db.from('flashcards').select('id', { count: 'exact', head: true }).eq('lesson_id', id),
    row.parent_lesson_id ? db.from('lessons').select('id, title').eq('id', row.parent_lesson_id).single() : Promise.resolve({ data: null }),
  ])

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <nav className="text-sm text-ink-3">
          <Link href="/lessons" className="hover:text-ink">Lessons</Link>
          {parent && <> / <Link href={`/lessons/${parent.id}`} className="hover:text-ink">{parent.title as string}</Link></>}
        </nav>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
        <p className="text-ink-2">&ldquo;{row.situation}&rdquo;</p>
        <LessonActions lessonId={id} completed={!!row.completed_at} cardCount={cardCount ?? 0} />
      </header>

      <section className="card px-5 py-5">
        <h2 className="mb-3 text-base font-semibold">Useful phrases <span className="font-normal text-ink-3">· {lesson.phrases.length}</span></h2>
        <ol className="divide-y divide-line">
          {lesson.phrases.map((p, i) => (
            <li key={i} className="py-3 sm:grid sm:grid-cols-[1.1fr_0.9fr] sm:gap-6">
              <div>
                <p className="vn text-xl leading-snug">{p.vietnamese}</p>
                <p className="text-[15px] text-ink-2">{p.english}</p>
              </div>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-2 sm:mt-0">{p.explanation}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card px-5 py-5">
        <h2 className="mb-3 text-base font-semibold">Vocabulary <span className="font-normal text-ink-3">· {lesson.vocabulary.length}</span></h2>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
          {lesson.vocabulary.map((v, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1">
              <span className="vn text-[16px]">{v.vietnamese}</span>
              <span className="text-right text-[14px] text-ink-2">{v.english}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card px-5 py-5">
        <h2 className="mb-1 text-base font-semibold">Grammar · <span className="vn text-base">{lesson.grammar.title}</span></h2>
        <p className="mb-3 inline-block rounded bg-accent-soft px-2 py-1 font-mono text-[13px] text-ink">{lesson.grammar.pattern}</p>
        <p className="mb-4 text-[16px] leading-relaxed text-ink-2">{lesson.grammar.explanation}</p>
        <ol className="divide-y divide-line">
          {lesson.grammar.examples.map((e, i) => (
            <li key={i} className="py-2.5">
              <p className="vn text-lg leading-snug">{e.vietnamese}</p>
              <p className="text-[15px] text-ink-2">{e.english}</p>
              <p className="text-[14px] text-ink-3">{e.explanation}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
