// components/app/Nav.tsx
'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Sun, BookOpen, Layers, ListChecks, Flame } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Wordmark } from './Wordmark'
import { PairSwitcher } from './PairSwitcher'
import type { PairId, Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export function Nav({ pair, locale }: { pair: PairId; locale: Locale }) {
  const path = usePathname()
  // The app layout reads the session, so every /app route renders per request and
  // useSearchParams resolves on the server: no Suspense boundary needed.
  const search = useSearchParams()
  const d = t(locale)
  const items = [
    { href: '/app', label: d.navToday, Icon: Sun },
    { href: '/app/lessons', label: d.navLessons, Icon: BookOpen },
    { href: '/app/flashcards', label: d.navCards, Icon: Layers },
    { href: '/app/vocabulary', label: d.navWords, Icon: ListChecks },
    { href: '/app/progress', label: d.navStreak, Icon: Flame },
  ]
  const active = (href: string) => (href === '/app' ? path === '/app' : path.startsWith(href))
  // Same condition the flashcards page uses to start a review session.
  const inSession = path.startsWith('/app/flashcards') && (search.has('lesson') || search.get('deck') === 'due')

  return (
    <>
      <header className="hidden bg-ink-warm md:block">
        {/* The Vietnamese labels need about 690px at gap-4, close to the 720px (less a scrollbar) this bar
            gets at 768px, so the gap tightens below lg and labels never wrap inside the 60px bar. */}
        <nav aria-label="Vietnamese Buddy" className="mx-auto flex h-[60px] max-w-3xl items-center gap-3 px-6 lg:gap-4">
          <div className="mr-auto"><Wordmark /></div>
          {items.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
              className={`whitespace-nowrap pb-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand ${active(href) ? 'border-b-[3px] border-red-bright text-sand' : 'text-sand-70 hover:text-sand'}`}>
              {label}
            </Link>
          ))}
          <PairSwitcher dark pair={pair} label={d.switchDirection} />
          <LogoutButton dark label={d.signOut} />
        </nav>
      </header>
      {!inSession && (
        <nav aria-label="Vietnamese Buddy" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 bg-ink-warm pb-[env(safe-area-inset-bottom)] md:hidden">
          {items.map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sand ${active(href) ? 'text-red-bright' : 'text-sand-70'}`}>
              <Icon size={20} strokeWidth={active(href) ? 2.4 : 1.8} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}
