'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItemProps {
  href: string
  label: string
  icon?: string
}

export function SidebarItem({ href, label, icon }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      ].join(' ')}
    >
      {icon && (
        <span className="w-4 h-4 shrink-0" aria-hidden="true">
          {/* TODO: use Lucide icon — replace with: import { <iconName> } from 'lucide-react' */}
          {icon.slice(0, 2)}
        </span>
      )}
      {label}
    </Link>
  )
}
