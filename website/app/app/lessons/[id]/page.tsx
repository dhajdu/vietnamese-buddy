// app/(app)/lessons/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getLesson, getProfile } from '@/lib/lessons/queries'
import { getPair } from '@/lib/pairs'
import { t } from '@/lib/i18n'
import { LessonActions } from '@/components/app/LessonActions'
import { Speak } from '@/components/app/Speak'
import { ToneTag } from '@/components/app/ToneTag'

// Adjust runs as a Server Action from this route; give it room.
export const maxDuration = 180

export default async function LessonPage({ params }: PageProps<'/app/lessons/[id]'>) {
  const { id } = await params
  const user = await requireAuth()
  const db = await createClient()
  const row = await getLesson(db, user.id, id)
  if (!row) notFound()

  // A lesson is read in the direction it was written in, not the learner's current one.
  const pair = getPair(row.pair)
  const d = t(pair.uiLocale)
  const lesson = row.lesson_json
  const { isAdmin } = await getProfile(db, user.id)
  void isAdmin

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
            <Link href="/app/lessons" className="hover:text-sand">← {d.navLessons}</Link>
            {parent && <> / <Link href={`/app/lessons/${parent.id}`} className="hover:text-sand">{parent.title as string}</Link></>}
          </nav>
          <h1 className="flex items-center gap-3 font-vn text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-sand sm:text-[34px]">
            {lesson.title}
          </h1>
          <p className="gloss text-[15px] italic text-sand-70">&ldquo;{row.situation}&rdquo;</p>
          <LessonActions lessonId={id} completed={!!row.completed_at} cardCount={cardCount ?? 0} locale={pair.uiLocale} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <section className="card px-4 py-4 sm:px-5">
          <h2 className="mb-2 flex items-baseline justify-between"><span className="t-title text-xl">{d.usefulPhrases}</span><span className="meta">{lesson.phrases.length}</span></h2>
          <ol className="divide-y divide-sand">
            {lesson.phrases.map((p, i) => (
              <li key={i} className="py-3 sm:grid sm:grid-cols-[1.1fr_0.9fr] sm:gap-6">
                <div>
                  <div className="mb-1 flex items-center justify-between"><ToneTag tone={p.tone} /><Speak text={p[pair.targetField]} pair={pair.id} size="sm" /></div>
                  <p className="target text-[22px] leading-[1.15]">{p[pair.targetField]}</p>
                  <p className="gloss text-[16px]">{p[pair.sourceField]}</p>
                </div>
                <p className="mt-1 text-[14.5px] leading-relaxed text-body sm:mt-6">{p.explanation}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="room px-4 py-4 sm:px-5">
          <p className="eyebrow-dark mb-2">{d.todaysPattern} · {lesson.grammar.title}</p>
          <p className="mb-2 inline-block rounded-lg bg-on-dark-soft px-2.5 py-1.5 font-vn text-[15px] font-bold text-red-bright">{lesson.grammar.pattern}</p>
          <p className="gloss mb-3 text-[15px] leading-relaxed text-sand-70">{lesson.grammar.explanation}</p>
          <ol className="divide-y divide-on-dark-line">
            {lesson.grammar.examples.map((e, i) => (
              <li key={i} className="py-2.5">
                <div className="flex items-start gap-2">
                  <p className="font-vn text-[18px] font-extrabold leading-snug tracking-[-0.02em] text-sand">{e[pair.targetField]}</p>
                  <Speak text={e[pair.targetField]} pair={pair.id} size="sm" dark className="mt-0.5" />
                </div>
                <p className="gloss text-[15px] text-sand-70">{e[pair.sourceField]}</p>
                <p className="text-[13.5px] text-sand-70">{e.explanation}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="card px-4 py-4 sm:px-5">
          <h2 className="mb-2 flex items-baseline justify-between"><span className="t-title text-xl">{d.vocabulary}</span><span className="meta">{lesson.vocabulary.length} · {newWords ?? 0} {d.newWords}</span></h2>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {lesson.vocabulary.map((v, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b border-sand/70 py-1.5">
                <span className="flex items-center gap-2">
                  <Speak text={v[pair.targetField]} pair={pair.id} size="sm" />
                  <span className="font-vn text-[16px] font-bold text-ink">{v[pair.targetField]}</span>
                </span>
                <span className="gloss text-right text-[14px]">{v[pair.sourceField]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
