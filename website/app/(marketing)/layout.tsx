// app/(marketing)/layout.tsx: the public shell. No auth, no database, cacheable.
import { Wordmark } from '@/components/app/Wordmark'
import { HeaderLinks, FooterLinks } from '@/components/marketing/MarketingLinks'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Everyone sees the same call to action: /signup sends a signed-in visitor on to
  // /app. Reading the session here would make every public page dynamic.
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-ink-warm">
        {/* 16px gutter on phones: at 320px the wordmark and the call to action need 282px. */}
        <nav className="mx-auto flex h-[60px] max-w-5xl items-center gap-4 whitespace-nowrap px-4 sm:gap-6 sm:px-6">
          <div className="mr-auto"><Wordmark href="/" /></div>
          <HeaderLinks />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-sand bg-cream-warm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-body">
          <span>© {new Date().getFullYear()} Vietnamese Buddy</span>
          <FooterLinks />
        </div>
      </footer>
    </div>
  )
}
