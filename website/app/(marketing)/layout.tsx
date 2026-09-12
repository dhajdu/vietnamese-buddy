// app/(marketing)/layout.tsx — the public shell. No auth, no database, cacheable.
import Link from 'next/link'
import { getOptionalUser } from '@/lib/auth/guards'
import { Wordmark } from '@/components/app/Wordmark'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // The only thing auth changes out here is the call to action, so a signed-in
  // visitor is offered their app rather than being bounced away from the page.
  const user = await getOptionalUser()
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-ink-warm">
        <nav className="mx-auto flex h-[60px] max-w-5xl items-center gap-6 px-6">
          <div className="mr-auto"><Wordmark href="/" /></div>
          <Link href="/pricing" className="text-sm font-semibold text-sand-70 hover:text-sand">Pricing</Link>
          <Link href="/vi" lang="vi" className="text-sm font-semibold text-sand-70 hover:text-sand">Tiếng Việt</Link>
          {user
            ? <Link href="/app" className="btn-red-dark px-4 py-2 text-sm">Continue learning →</Link>
            : <Link href="/signup" className="btn-red-dark px-4 py-2 text-sm">Start free</Link>}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-sand bg-cream-warm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-stone">
          <span>© {new Date().getFullYear()} Vietnamese Buddy</span>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/vi" className="hover:text-ink">Tiếng Việt</Link>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
