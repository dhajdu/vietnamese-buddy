// app/(app)/progress/page.tsx
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { computeStreak, lastNDates, localDate } from '@/lib/activity/streak'
import { StatTiles } from '@/components/app/StatTiles'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const metadata = { title: 'Progress' }

export default async function ProgressPage() {
  const user = await requireAuth()
  const db = await createClient()
  const { timezone } = await getProfile(db, user.id)
  const today = localDate(timezone)

  const [act, completed, lessons, vocabTotal, vocabKnown] = await Promise.all([
    db.from('daily_activity').select('activity_date, lesson_created, cards_reviewed, lesson_completed').eq('user_id', user.id),
    db.from('lessons').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('completed_at', 'is', null),
    db.from('lessons').select('lesson_json').eq('user_id', user.id),
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'known'),
  ])
  type Day = { activity_date: string; lesson_created: boolean; cards_reviewed: number; lesson_completed: boolean }
  const days = new Map(((act.data ?? []) as Day[]).map(d => [d.activity_date, d]))
  const streak = computeStreak([...days.keys()], today)
  const phrases = (lessons.data ?? []).reduce((n, l) => n + ((l.lesson_json as { phrases: unknown[] }).phrases?.length ?? 0), 0)

  const rows: [string, number][] = [
    ['Lessons completed', completed.count ?? 0],
    ['Phrases learned', phrases],
    ['Vocabulary introduced', vocabTotal.count ?? 0],
    ['Vocabulary mastered', vocabKnown.count ?? 0],
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
      <StatTiles stats={[
        { label: 'Current streak', value: `🔥 ${streak.current}` },
        { label: 'Longest streak', value: streak.longest },
        { label: 'Learning days', value: streak.totalDays },
      ]} />
      <dl className="card grid grid-cols-[1fr_auto] gap-y-2 px-5 py-4 text-[15px]">
        {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="font-display font-medium">{k}</dt><dd className="tabular text-ink-2">{v}</dd></div>))}
      </dl>
      <section className="space-y-2">
        <h2 className="label">Last 30 days</h2>
        <ol className="grid grid-cols-10 gap-1.5">
          {lastNDates(today, 30).map(d => {
            const a = days.get(d)
            const what = a ? [a.lesson_created && 'lesson', a.cards_reviewed && `${a.cards_reviewed} cards`, a.lesson_completed && 'completed'].filter(Boolean).join(', ') : 'no activity'
            return (
              <li key={d} title={`${d}: ${what}`}
                className={`aspect-square rounded-[3px] border ${a ? 'border-ink bg-ink' : 'border-line'} ${d === today ? 'outline outline-2 outline-offset-1 outline-accent' : ''}`}>
                <span className="sr-only">{d}: {what}</span>
              </li>
            )
          })}
        </ol>
      </section>
      <div className="pt-4 sm:hidden"><LogoutButton /></div>
    </div>
  )
}
