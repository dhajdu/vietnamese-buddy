// app/(app)/page.tsx — Today
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile, getHomeStats, listLessons, lessonStates } from '@/lib/lessons/queries'
import { pickSuggestions, greeting } from '@/lib/lessons/suggestions'
import { CreateLessonForm } from '@/components/app/CreateLessonForm'
import { StatTiles } from '@/components/app/StatTiles'
import { LessonList } from '@/components/app/LessonList'
import { LoadSamplesButton } from '@/components/app/LoadSamplesButton'
import { Wordmark } from '@/components/app/Wordmark'

// Lesson generation runs as a Server Action from this route; give it room.
export const maxDuration = 180

export default async function HomePage() {
  const user = await requireAuth()
  const db = await createClient()
  const { timezone, displayName } = await getProfile(db, user.id)
  const [stats, lessons, states, all] = await Promise.all([
    getHomeStats(db, user.id, timezone), listLessons(db, user.id, 5), lessonStates(db, user.id),
    db.from('lessons').select('situation').eq('user_id', user.id),
  ])
  const dayNumber = stats.streak.current + (stats.activeToday ? 0 : 1)
  const suggestions = pickSuggestions((all.data ?? []).map(r => r.situation as string), Number(stats.today.slice(-2)))

  return (
    <div>
      <section className="bg-ink-warm px-6 pb-16 pt-6 text-sand sm:pb-20 sm:pt-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between sm:hidden">
            <Wordmark />
            <Link href="/progress" className="inline-flex items-center gap-1.5 rounded-pill bg-red px-3 py-1.5 font-vn text-sm font-extrabold text-white">🔥 {stats.streak.current}</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-[1.3fr_1fr] sm:items-end">
            <div>
              <p className="t-gloss mb-2 text-[17px] italic text-sand-70 sm:text-[19px]">{greeting(timezone, displayName)} Day {dayNumber} starts now.</p>
              <h1 className="font-vn text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-sand sm:text-[46px]">What are you going to <span className="text-red-bright">say</span> today?</h1>
            </div>
            <div className="hidden flex-col items-start gap-2 sm:flex">
              <Link href="/progress" className="inline-flex items-center gap-2 rounded-pill bg-red-bright px-4 py-2 font-vn text-xl font-extrabold text-white">🔥 {stats.streak.current} day streak</Link>
              {stats.recentWords.length > 0 && (
                <p className="t-gloss text-[15px] italic text-sand-70">
                  Yesterday you learned {stats.recentWords.slice(0, 2).map((w, i) => <span key={w}><b className="font-vn not-italic text-sand">{w}</b>{i === 0 ? ', ' : ''}</span>)}{stats.recentWords.length > 2 ? `, and ${stats.recentWords.length - 2} more.` : '.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="-mt-10 sm:-mt-14"><CreateLessonForm suggestions={suggestions} /></div>

        <div className="mt-6 space-y-6">
          <StatTiles cols="grid-cols-3 sm:grid-cols-4" stats={[
            { label: 'Cards due', value: stats.due, href: '/flashcards?deck=due', tone: stats.due > 0 ? 'amber' : undefined },
            { label: 'Words', value: stats.vocabTotal, href: '/vocabulary' },
            { label: 'Known', value: stats.vocabKnown, href: '/vocabulary?status=known' },
            { label: 'Learning days', value: stats.streak.totalDays, href: '/progress' },
          ]} />
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow">This week</h2>
              {lessons.length > 0 && <Link href="/lessons" className="text-sm font-semibold text-red hover:underline">All lessons</Link>}
            </div>
            {lessons.length ? <LessonList lessons={lessons} tz={timezone} states={states} /> : <LoadSamplesButton />}
          </section>
        </div>
      </div>
    </div>
  )
}
