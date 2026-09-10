// components/app/Nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, BookOpen, Layers, ListChecks, Flame } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Wordmark } from './Wordmark'

const ITEMS = [
  { href: '/', label: 'Today', Icon: Sun },
  { href: '/lessons', label: 'Lessons', Icon: BookOpen },
  { href: '/flashcards', label: 'Cards', Icon: Layers },
  { href: '/vocabulary', label: 'Words', Icon: ListChecks },
  { href: '/progress', label: 'Streak', Icon: Flame },
]

export function Nav() {
  const path = usePathname()
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))
  const inSession = path.startsWith('/flashcards') && typeof window !== 'undefined' && /[?&](lesson|deck)=/.test(window.location.search)
  return (
    <>
      <header className="hidden bg-ink-warm sm:block">
        <nav className="mx-auto flex h-[60px] max-w-3xl items-center gap-7 px-6">
          <div className="mr-auto"><Wordmark /></div>
          {ITEMS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`pb-1 text-sm font-semibold ${active(href) ? 'border-b-[3px] border-red-bright text-sand' : 'text-sand-70 hover:text-sand'}`}>
              {label}
            </Link>
          ))}
          <LogoutButton dark />
        </nav>
      </header>
      {!inSession && (
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 bg-ink-warm pb-[env(safe-area-inset-bottom)] sm:hidden">
          {ITEMS.map(({ href, label, Icon }) => (
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
