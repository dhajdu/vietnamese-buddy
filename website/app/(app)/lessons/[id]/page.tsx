// app/(app)/lessons/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getLesson } from '@/lib/lessons/queries'
import { LessonActions } from '@/components/app/LessonActions'
import { Speak } from '@/components/app/Speak'
import { ToneTag } from '@/components/app/ToneTag'

// Regenerate / Adjust run as Server Actions from this route; give them room.
export const maxDuration = 180

export default async function LessonPage({ params }: PageProps<'/lessons/[id]'>) {
  const { id } = await params
  const user = await requireAuth()
  const db = await createClient()
  const row = await getLesson(db, user.id, id)
  if (!row) notFound()
  const lesson = row.lesson_json

  const [{ count: cardCount }, { data: parent }, { count: newWords }] = await Promise.all([
    db.from('flashcards').select('id', { count: 'exact', head: true }).eq('lesson_id', id),
    row.parent_lesson_id ? db.from('lessons').select('id, title').eq('id', row.parent_lesson_id).single() : Promise.resolve({ data: null }),
    db.from('lesson_vocabulary').select('vocabulary_id, vocabulary!inner(status)', { count: 'exact', head: true }).eq('lesson_id', id).eq('vocabulary.status', 'new'),
  ])

  return (
    <article>
      <header className="bg-ink-warm px-6 pb-7 pt-6 text-sand sm:pt-10">
        <div className="mx-auto max-w-3xl space-y-3">
          <nav className="text-xs font-semibold text-sand-70">
            <Link href="/lessons" className="hover:text-sand">← Lessons</Link>
            {parent && <> / <Link href={`/lessons/${parent.id}`} className="hover:text-sand">{parent.title as string}</Link></>}
          </nav>
          <h1 className="flex items-center gap-3 font-vn text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-sand sm:text-[34px]">
            {lesson.title}<Speak text={lesson.title} dark />
          </h1>
          <p className="t-gloss text-[15px] italic text-sand-70">&ldquo;{row.situation}&rdquo;</p>
          <LessonActions lessonId={id} completed={!!row.completed_at} cardCount={cardCount ?? 0} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <section className="card px-4 py-4 sm:px-5">
          <h2 className="mb-2 flex items-baseline justify-between"><span className="t-title text-xl">Useful phrases</span><span className="meta">{lesson.phrases.length}</span></h2>
          <ol className="divide-y divide-sand">
            {lesson.phrases.map((p, i) => (
              <li key={i} className="py-3 sm:grid sm:grid-cols-[1.1fr_0.9fr] sm:gap-6">
                <div>
                  <div className="mb-1 flex items-center justify-between"><ToneTag tone={p.tone} /><Speak text={p.vietnamese} size="sm" /></div>
                  <p className="vn text-[22px] leading-[1.15]">{p.vietnamese}</p>
                  <p className="t-gloss text-[16px]">{p.english}</p>
                </div>
                <p className="mt-1 text-[14.5px] leading-relaxed text-body sm:mt-6">{p.explanation}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="room px-4 py-4 sm:px-5">
          <p className="eyebrow-dark mb-2">Today&rsquo;s pattern · {lesson.grammar.title}</p>
          <p className="mb-2 inline-block rounded-lg bg-on-dark-soft px-2.5 py-1.5 font-vn text-[15px] font-bold text-red-bright">{lesson.grammar.pattern}</p>
          <p className="t-gloss mb-3 text-[15px] leading-relaxed text-sand-70">{lesson.grammar.explanation}</p>
          <ol className="divide-y divide-on-dark-line">
            {lesson.grammar.examples.map((e, i) => (
              <li key={i} className="py-2.5">
                <div className="flex items-start gap-2"><p className="font-vn text-[18px] font-extrabold leading-snug tracking-[-0.02em] text-sand">{e.vietnamese}</p><Speak text={e.vietnamese} size="sm" dark className="mt-0.5" /></div>
                <p className="t-gloss text-[15px] text-sand-70">{e.english}</p>
                <p className="text-[13.5px] text-sand-70">{e.explanation}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="card px-4 py-4 sm:px-5">
          <h2 className="mb-2 flex items-baseline justify-between"><span className="t-title text-xl">Vocabulary</span><span className="meta">{lesson.vocabulary.length} · {newWords ?? 0} new</span></h2>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {lesson.vocabulary.map((v, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b border-sand/70 py-1.5">
                <span className="flex items-center gap-2"><Speak text={v.vietnamese} size="sm" /><span className="font-vn text-[16px] font-bold text-ink">{v.vietnamese}</span></span>
                <span className="t-gloss text-right text-[14px]">{v.english}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
