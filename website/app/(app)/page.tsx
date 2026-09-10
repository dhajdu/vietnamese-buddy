// app/(app)/page.tsx — Home
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile, getHomeStats, listLessons } from '@/lib/lessons/queries'
import { CreateLessonForm } from '@/components/app/CreateLessonForm'
import { StatTiles } from '@/components/app/StatTiles'
import { LessonList } from '@/components/app/LessonList'
import Link from 'next/link'
import { LoadSamplesButton } from '@/components/app/LoadSamplesButton'

// Lesson generation runs as a Server Action from this route; give it room.
export const maxDuration = 180

export default async function HomePage() {
  const user = await requireAuth()
  const db = await createClient()
  const { timezone } = await getProfile(db, user.id)
  const [stats, lessons] = await Promise.all([getHomeStats(db, user.id, timezone), listLessons(db, user.id, 5)])

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:hidden">Vietnamese Daily</h1>
        <h2 className="text-xl font-medium sm:text-2xl">What situation do you want to practice today?</h2>
        <CreateLessonForm />
      </section>

      <StatTiles stats={[
        { label: 'Day streak', value: `🔥 ${stats.streak.current}`, href: '/progress' },
        { label: 'Vocabulary', value: stats.vocabTotal, href: '/vocabulary' },
        { label: 'Mastered', value: stats.vocabKnown, href: '/vocabulary?status=known' },
        { label: 'To review', value: stats.due, href: '/flashcards' },
      ]} />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="label">Recent lessons</h3>
          {lessons.length > 0 && <Link href="/lessons" className="text-sm text-accent hover:underline">See all</Link>}
        </div>
        {lessons.length ? <LessonList lessons={lessons} tz={timezone} /> : <LoadSamplesButton />}
      </section>
    </div>
  )
}
