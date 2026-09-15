// app/(app)/lessons/page.tsx
import { requireAuth, getCurrentProfile } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { listLessons, lessonStates, phraseCounts, type LessonRow } from '@/lib/lessons/queries'
import { LessonList } from '@/components/app/LessonList'
import { t } from '@/lib/i18n'

export const metadata = { title: 'Lessons' }

export default async function LessonsPage() {
  const user = await requireAuth()
  const db = await createClient()
  const { timezone, pair } = await getCurrentProfile(user.id)
  const d = t(pair.uiLocale)
  const lessons = await listLessons(db, user.id, pair.id)
  const [states, phrases] = await Promise.all([
    lessonStates(db, user.id, lessons),
    phraseCounts(db, user.id, lessons.map(l => l.id)),
  ])
  const roots = lessons.filter(l => !l.parent_lesson_id)
  const byParent = new Map<string, LessonRow[]>()
  for (const l of lessons) if (l.parent_lesson_id) byParent.set(l.parent_lesson_id, [...(byParent.get(l.parent_lesson_id) ?? []), l])
  const ordered = roots.flatMap(r => [r, ...(byParent.get(r.id) ?? [])])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pt-8 sm:px-6 sm:pt-12">
      <div><p className="eyebrow">{d.navLessons}</p><h1 className="t-title text-3xl sm:text-4xl">{d.lessonsTitle}</h1></div>
      <LessonList lessons={ordered} tz={timezone} states={states} phrases={phrases} locale={pair.uiLocale} detailed />
    </div>
  )
}
