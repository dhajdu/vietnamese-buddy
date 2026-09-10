// app/(app)/lessons/page.tsx — History
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile, listLessons, newWordsByLesson, type LessonRow } from '@/lib/lessons/queries'
import { LessonList } from '@/components/app/LessonList'

export const metadata = { title: 'Lessons' }

export default async function LessonsPage() {
  const user = await requireAuth()
  const db = await createClient()
  const { timezone } = await getProfile(db, user.id)
  const [lessons, newWords] = await Promise.all([listLessons(db, user.id), newWordsByLesson(db, user.id)])

  // Nest variants directly under their parent.
  const roots = lessons.filter(l => !l.parent_lesson_id)
  const byParent = new Map<string, LessonRow[]>()
  for (const l of lessons) if (l.parent_lesson_id) byParent.set(l.parent_lesson_id, [...(byParent.get(l.parent_lesson_id) ?? []), l])
  const ordered = roots.flatMap(r => [r, ...(byParent.get(r.id) ?? [])])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
      <LessonList lessons={ordered} tz={timezone} newWords={newWords} detailed />
    </div>
  )
}
