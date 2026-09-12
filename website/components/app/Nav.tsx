// components/app/Nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, BookOpen, Layers, ListChecks, Flame } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Wordmark } from './Wordmark'
import { PairSwitcher } from './PairSwitcher'
import type { PairId, Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export function Nav({ pair, locale }: { pair: PairId; locale: Locale }) {
  const path = usePathname()
  const d = t(locale)
  const items = [
    { href: '/app', label: d.navToday, Icon: Sun },
    { href: '/app/lessons', label: d.navLessons, Icon: BookOpen },
    { href: '/app/flashcards', label: d.navCards, Icon: Layers },
    { href: '/app/vocabulary', label: d.navWords, Icon: ListChecks },
    { href: '/app/progress', label: d.navStreak, Icon: Flame },
  ]
  const active = (href: string) => (href === '/app' ? path === '/app' : path.startsWith(href))
  const inSession = path.startsWith('/app/flashcards') && typeof window !== 'undefined' && /[?&](lesson|deck)=/.test(window.location.search)

  return (
    <>
      <header className="hidden bg-ink-warm sm:block">
        <nav className="mx-auto flex h-[60px] max-w-3xl items-center gap-6 px-6">
          <div className="mr-auto"><Wordmark /></div>
          {items.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`pb-1 text-sm font-semibold ${active(href) ? 'border-b-[3px] border-red-bright text-sand' : 'text-sand-70 hover:text-sand'}`}>
              {label}
            </Link>
          ))}
          <PairSwitcher pair={pair} label={d.switchDirection} />
          <LogoutButton dark label={d.signOut} />
        </nav>
      </header>
      {!inSession && (
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 bg-ink-warm pb-[env(safe-area-inset-bottom)] sm:hidden">
          {items.map(({ href, label, Icon }) => (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active(href) ? 'text-red-bright' : 'text-sand-70'}`}>
              <Icon size={20} strokeWidth={active(href) ? 2.4 : 1.8} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  )
}
