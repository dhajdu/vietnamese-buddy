// app/(app)/progress/page.tsx — Streak
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { computeStreak, lastNDates, localDate } from '@/lib/activity/streak'
import { StatTiles } from '@/components/app/StatTiles'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const metadata = { title: 'Streak' }

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
  const words = vocabTotal.count ?? 0
  const milestone = Math.max(50, Math.ceil((words + 1) / 50) * 50)
  const lessonsToGo = Math.max(1, Math.round((milestone - words) / 15))

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="room flex items-center gap-5 px-5 py-5">
        <b className="font-vn text-[56px] font-extrabold leading-none tracking-[-0.04em] text-sand">🔥 {streak.current}</b>
        <div><div className="text-[15px] font-semibold text-sand">day streak</div><span className="t-gloss text-[15px] text-sand-70">Longest {streak.longest} · {streak.totalDays} learning days</span></div>
      </div>

      <section className="space-y-2">
        <h2 className="eyebrow">Last 30 days</h2>
        <ol className="grid grid-cols-10 gap-1.5">
          {lastNDates(today, 30).map(d => {
            const a = days.get(d)
            const full = a && a.lesson_created && a.cards_reviewed >= 10
            const what = a ? [a.lesson_created && 'lesson', a.cards_reviewed && `${a.cards_reviewed} cards`, a.lesson_completed && 'completed'].filter(Boolean).join(', ') : 'no activity'
            const cls = d === today ? 'border-red bg-red' : full ? 'border-ink bg-ink' : a ? 'border-sand-deep bg-sand-deep' : 'border-sand bg-white'
            return <li key={d} title={`${d}: ${what}`} className={`aspect-square rounded-md border ${cls}`}><span className="sr-only">{d}: {what}</span></li>
          })}
        </ol>
        <p className="meta">Sand: studied. Ink: lesson + full review. Red: today.</p>
      </section>

      <StatTiles cols="grid-cols-2 sm:grid-cols-4" stats={[
        { label: 'Lessons done', value: completed.count ?? 0 },
        { label: 'Phrases', value: phrases },
        { label: 'Words met', value: words },
        { label: 'Words known', value: vocabKnown.count ?? 0 },
      ]} />

      <div className="card border-l-[5px] border-l-red px-4 py-3">
        <p className="eyebrow mb-1">Next milestone</p>
        <p className="font-vn text-[18px] font-extrabold text-ink">{milestone} words · {milestone - words} to go</p>
        <p className="t-gloss text-[14px]">About {lessonsToGo} {lessonsToGo === 1 ? 'lesson' : 'lessons'} at your pace.</p>
      </div>
      <div className="pt-2 sm:hidden"><LogoutButton /></div>
    </div>
  )
}
