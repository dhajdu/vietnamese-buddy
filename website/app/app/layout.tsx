// app/(app)/layout.tsx
import { requireAuth, getCurrentProfile } from '@/lib/auth/guards'
import { DEFAULT_TZ } from '@/lib/activity/streak'
import { Nav } from '@/components/app/Nav'
import { TimezoneSync } from '@/components/auth/TimezoneSync'

export const metadata = { robots: { index: false, follow: false } }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const { pair, timezone } = await getCurrentProfile(user.id)
  return (
    <div className="flex min-h-full flex-col">
      {timezone === DEFAULT_TZ && <TimezoneSync stored={timezone} />}
      <Nav pair={pair.id} locale={pair.uiLocale} />
      <main className="flex-1 pb-24 sm:pb-16">{children}</main>
    </div>
  )
}
