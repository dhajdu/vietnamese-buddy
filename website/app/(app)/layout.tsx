// app/(app)/layout.tsx
import { requireAuth } from '@/lib/auth/guards'
import { Nav } from '@/components/app/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      <main className="flex-1 pb-24 sm:pb-16">{children}</main>
    </div>
  )
}
