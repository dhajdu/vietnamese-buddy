// app/(app)/flashcards/page.tsx
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { computeStreak, localDate } from '@/lib/activity/streak'
import { t } from '@/lib/i18n'
import { ReviewSession, type Card } from '@/components/app/ReviewSession'

export const metadata = { title: 'Cards' }
const ORDER = { review: 0, new: 1, known: 2 } as const

export default async function FlashcardsPage({ searchParams }: PageProps<'/app/flashcards'>) {
  const { lesson, deck } = await searchParams
  const user = await requireAuth()
  const db = await createClient()
  const { timezone, pair } = await getProfile(db, user.id)
  const d = t(pair.uiLocale)

  if (lesson || deck === 'due') {
    let q = db.from('flashcards').select('id, type, front, back, status, lessons!inner(pair)').eq('user_id', user.id).eq('lessons.pair', pair.id)
    q = lesson ? q.eq('lesson_id', String(lesson)) : q.neq('status', 'known')
    const [{ data }, { data: act }, { data: l }] = await Promise.all([
      q,
      db.from('daily_activity').select('activity_date').eq('user_id', user.id),
      lesson ? db.from('lessons').select('title').eq('id', String(lesson)).single() : Promise.resolve({ data: null }),
    ])
    const cards = ((data ?? []) as unknown as (Card & { status: keyof typeof ORDER })[]).sort((a, b) => ORDER[a.status] - ORDER[b.status])
    if (!cards.length) {
      return <div className="mx-auto max-w-3xl px-6 pt-12"><div className="rounded-card border border-dashed border-sand px-4 py-8 text-center text-sm text-stone">{d.noCardsDue} <Link href="/app" className="font-semibold text-red hover:underline">{d.createALesson}</Link></div></div>
    }
    const streak = computeStreak((act ?? []).map(r => r.activity_date as string), localDate(timezone))
    return (
      <div className="mx-auto max-w-3xl sm:px-6 sm:pt-8">
        <ReviewSession cards={cards} backHref={lesson ? `/lessons/${lesson}` : '/'} title={(l?.title as string) ?? d.allDueCards}
          streakBefore={streak.current} pair={pair.id} locale={pair.uiLocale} />
      </div>
    )
  }

  const [{ count: due }, { data: lessons }] = await Promise.all([
    db.from('flashcards').select('id, lessons!inner(pair)', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'known').eq('lessons.pair', pair.id),
    db.from('lessons').select('id, title, flashcards(status)').eq('user_id', user.id).eq('pair', pair.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pt-8 sm:px-6 sm:pt-12">
      <div><p className="eyebrow">{d.navCards}</p><h1 className="t-title text-3xl sm:text-4xl">{d.cardsTitle}</h1></div>
      <section className="space-y-2">
        <h2 className="eyebrow">{d.dueToday}</h2>
        <Link href="/app/flashcards?deck=due" className="card flex items-center justify-between px-4 py-3 hover:border-ink">
          <span className="font-vn text-[15px] font-bold text-ink">{d.allDueCards}</span>
          <span className={`tabular text-sm font-semibold ${due ? 'text-amber-ink' : 'text-stone'}`}>{due ?? 0}</span>
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
                  <span className={`tabular text-sm font-semibold ${open ? 'text-amber-ink' : 'text-ok-ink'}`}>{open ? `${open} ${d.due}` : d.done} <span className="text-stone">· {cards.length}</span></span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
