// app/(app)/layout.tsx
import { requireAuth } from '@/lib/auth/guards'
import { Nav } from '@/components/app/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-8 sm:pb-16 sm:pt-12">{children}</main>
    </div>
  )
}
