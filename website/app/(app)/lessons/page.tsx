// app/(app)/lessons/page.tsx — all lessons
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile, listLessons, lessonStates, type LessonRow } from '@/lib/lessons/queries'
import { LessonList } from '@/components/app/LessonList'

export const metadata = { title: 'Lessons' }

export default async function LessonsPage() {
  const user = await requireAuth()
  const db = await createClient()
  const { timezone } = await getProfile(db, user.id)
  const [lessons, states] = await Promise.all([listLessons(db, user.id), lessonStates(db, user.id)])
  const roots = lessons.filter(l => !l.parent_lesson_id)
  const byParent = new Map<string, LessonRow[]>()
  for (const l of lessons) if (l.parent_lesson_id) byParent.set(l.parent_lesson_id, [...(byParent.get(l.parent_lesson_id) ?? []), l])
  const ordered = roots.flatMap(r => [r, ...(byParent.get(r.id) ?? [])])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pt-8 sm:px-6 sm:pt-12">
      <div><p className="eyebrow">Lessons</p><h1 className="t-title text-3xl sm:text-4xl">Everything you&rsquo;ve practised</h1></div>
      <LessonList lessons={ordered} tz={timezone} states={states} detailed />
    </div>
  )
}
