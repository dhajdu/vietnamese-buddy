'use client'

import { logout } from '@/lib/auth/actions'
import { NAV_ITEMS } from '@/lib/dashboard/nav-config'
import { SidebarItem } from './SidebarItem'

interface User {
  id: string
  email?: string
}

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const initials = (user.email ?? '??').slice(0, 2).toUpperCase()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-background h-full">
      {/* Logo slot */}
      <div className="flex h-14 items-center px-4 border-b">
        {/* TODO: replace with project logo */}
        <span className="font-semibold text-lg">Logo</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <SidebarItem href={item.href} label={item.label} icon={item.icon} />
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t p-4 flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sign out"
          >
            {/* TODO: replace with Lucide LogOut icon */}
            Out
          </button>
        </form>
      </div>
    </aside>
  )
}
