// app/(app)/layout.tsx
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { Nav } from '@/components/app/Nav'

export const metadata = { robots: { index: false, follow: false } }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const db = await createClient()
  const { pair } = await getProfile(db, user.id)
  return (
    <div className="flex min-h-full flex-col">
      <Nav pair={pair.id} locale={pair.uiLocale} />
      <main className="flex-1 pb-24 sm:pb-16">{children}</main>
    </div>
  )
}
