// app/(app)/flashcards/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { requireAuth, getCurrentProfile } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { computeStreak, localDate } from '@/lib/activity/streak'
import { getPair } from '@/lib/pairs'
import { t } from '@/lib/i18n'
import { ReviewSession, type Card } from '@/components/app/ReviewSession'

export const metadata = { title: 'Cards' }
const ORDER = { review: 0, new: 1, known: 2 } as const

export default async function FlashcardsPage({ searchParams }: PageProps<'/app/flashcards'>) {
  const { lesson, deck } = await searchParams
  const user = await requireAuth()
  const db = await createClient()
  const { timezone, pair } = await getCurrentProfile(user.id)
  const d = t(pair.uiLocale)

  if (lesson || deck === 'due') {
    const lessonId = lesson ? String(lesson) : null
    // A malformed id is a missing deck, not a Postgres cast error for the error boundary.
    if (lessonId && !z.uuid().safeParse(lessonId).success) notFound()
    const [cardsRes, actRes, lessonRes] = await Promise.all([
      // A lesson's deck is that lesson's cards, whichever direction the learner is on now.
      lessonId
        ? db.from('flashcards').select('id, type, front, back, status').eq('user_id', user.id).eq('lesson_id', lessonId)
        : db.from('flashcards').select('id, type, front, back, status, lessons!inner(pair)').eq('user_id', user.id).eq('lessons.pair', pair.id).neq('status', 'known'),
      db.from('daily_activity').select('activity_date').eq('user_id', user.id),
      lessonId ? db.from('lessons').select('title, pair').eq('id', lessonId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ])
    const failed = cardsRes.error ?? actRes.error ?? lessonRes.error
    if (failed) throw new Error(`flashcards: deck read failed: ${failed.message}`)
    const l = lessonRes.data
    if (lessonId && !l) notFound()
    const deckPair = l ? getPair(l.pair) : pair
    const dd = t(deckPair.uiLocale)
    const cards = ((cardsRes.data ?? []) as unknown as (Card & { status: keyof typeof ORDER })[]).sort((a, b) => ORDER[a.status] - ORDER[b.status])
    if (!cards.length) {
      return <div className="mx-auto max-w-3xl px-6 pt-12"><div className="rounded-card border border-dashed border-sand px-4 py-8 text-center text-sm text-body">{dd.noCardsDue} <Link href="/app" className="font-semibold text-red hover:underline">{dd.createALesson}</Link></div></div>
    }
    const today = localDate(timezone)
    const dates = (actRes.data ?? []).map(r => r.activity_date as string)
    const streak = computeStreak(dates, today)
    return (
      <div className="mx-auto max-w-3xl sm:px-6 sm:pt-8">
        <ReviewSession cards={cards} backHref={lessonId ? `/app/lessons/${lessonId}` : '/app'} title={(l?.title as string) ?? dd.allDueCards}
          streakBefore={streak.current} activeToday={dates.includes(today)} pair={deckPair.id} locale={deckPair.uiLocale} />
      </div>
    )
  }

  const [dueRes, lessonsRes] = await Promise.all([
    db.from('flashcards').select('id, lessons!inner(pair)', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'known').eq('lessons.pair', pair.id),
    db.from('lessons').select('id, title, flashcards(status)').eq('user_id', user.id).eq('pair', pair.id).order('created_at', { ascending: false }),
  ])
  const failed = dueRes.error ?? lessonsRes.error
  if (failed) throw new Error(`flashcards: deck list read failed: ${failed.message}`)
  const due = dueRes.count
  const lessons = lessonsRes.data

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pt-8 sm:px-6 sm:pt-12">
      <div><p className="eyebrow">{d.navCards}</p><h1 className="t-title text-3xl sm:text-4xl">{d.cardsTitle}</h1></div>
      <section className="space-y-2">
        <h2 className="eyebrow">{d.dueToday}</h2>
        <Link href="/app/flashcards?deck=due" className="card flex items-center justify-between px-4 py-3 hover:border-ink">
          <span className="font-vn text-[15px] font-bold text-ink">{d.allDueCards}</span>
          <span className={`tabular text-sm font-semibold ${due ? 'text-amber-ink' : 'text-body'}`}>{due ?? 0}</span>
        </Link>
      </section>
      <section className="space-y-2">
        <h2 className="eyebrow">{d.byLesson}</h2>
        <ul className="flex flex-col gap-2">
          {(lessons ?? []).map(l => {
            const cards = (l.flashcards as { status: string }[]) ?? []
            const open = cards.filter(c => c.status !== 'known').length
            return (
              <li key={l.id}>
                <Link href={`/app/flashcards?lesson=${l.id}`} className="card flex items-center justify-between px-4 py-3 hover:border-ink">
                  <span className="font-vn text-[15px] font-bold text-ink">{l.title as string}</span>
                  <span className={`tabular text-sm font-semibold ${open ? 'text-amber-ink' : 'text-ok-ink'}`}>{open ? `${open} ${d.due}` : d.done} <span className="text-body">· {cards.length}</span></span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
