'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function capitalise(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Breadcrumbs() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)

  // Return nothing on root dashboard path
  if (segments.length <= 1) return null

  // Build cumulative hrefs: ['dashboard'] → '/dashboard', ['dashboard','settings'] → '/dashboard/settings'
  const crumbs = segments.map((segment, index) => ({
    label: capitalise(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
    isCurrent: index === segments.length - 1,
  }))

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">/</span>}
            {crumb.isCurrent ? (
              <span className="text-foreground font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
