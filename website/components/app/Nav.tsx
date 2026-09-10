// components/app/Nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Layers, ListChecks, Flame } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'

const ITEMS = [
  { href: '/', label: 'Home', short: 'Home', Icon: Home },
  { href: '/lessons', label: 'Lessons', short: 'Lessons', Icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', short: 'Cards', Icon: Layers },
  { href: '/vocabulary', label: 'Vocabulary', short: 'Vocab', Icon: ListChecks },
  { href: '/progress', label: 'Progress', short: 'Progress', Icon: Flame },
]

export function Nav() {
  const path = usePathname()
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))
  return (
    <>
      <header className="hidden border-b border-line bg-surface sm:block">
        <nav className="mx-auto flex h-14 max-w-3xl items-center gap-7 px-6">
          <Link href="/" className="mr-auto font-display text-[15px] font-bold tracking-tight">Vietnamese Daily</Link>
          {ITEMS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`pb-0.5 text-sm ${active(href) ? 'border-b-2 border-ink font-semibold text-ink' : 'text-ink-3 hover:text-ink'}`}>
              {label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        {ITEMS.map(({ href, short, Icon }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-1 py-2 text-[10px] ${active(href) ? 'font-semibold text-ink' : 'text-ink-3'}`}>
            <Icon size={18} strokeWidth={active(href) ? 2.4 : 1.8} />
            {short}
          </Link>
        ))}
      </nav>
    </>
  )
}
