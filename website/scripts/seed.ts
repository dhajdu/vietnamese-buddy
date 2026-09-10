// scripts/seed.ts — load the three sample lessons into one account via the service-role client.
// Usage: npx tsx --env-file=.env.local scripts/seed.ts you@example.com
import { createAdminClient } from '../lib/supabase/admin'
import { saveLesson } from '../lib/lessons/pipeline'
import { loadSeedLessons } from '../lib/lessons/seeds'

async function main() {
  const email = process.argv[2]
  if (!email) throw new Error('Usage: seed.ts <email>')
  const db = createAdminClient()

  const { data: list, error: listErr } = await db.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw listErr
  let user = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true })
    if (error) throw error
    user = data.user
    console.log('created user', email)
  }

  for (const lesson of loadSeedLessons()) {
    const { lessonId, newWords } = await saveLesson(db, user.id, { lesson, situation: lesson.situation, source: 'seed' })
    console.log(`seeded "${lesson.title}" → ${lessonId} (${newWords} new words)`)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
