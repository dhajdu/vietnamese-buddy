// app/admin/layout.tsx
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/guards'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-ink-warm">
        <nav className="mx-auto flex h-[60px] max-w-6xl items-center gap-6 px-6 text-sm font-semibold">
          <Link href="/admin" className="mr-auto font-serif text-[17px] text-sand">Vietnamese Buddy · admin</Link>
          <Link href="/admin" className="text-sand-70 hover:text-sand">Users</Link>
          <Link href="/admin/settings" className="text-sand-70 hover:text-sand">Settings</Link>
          <Link href="/app" className="text-sand-70 hover:text-sand">App</Link>
          <span className="text-stone">{admin.email}</span>
          <LogoutButton dark />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  )
}
