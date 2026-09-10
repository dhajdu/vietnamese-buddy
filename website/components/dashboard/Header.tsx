'use client'

import { Breadcrumbs } from './Breadcrumbs'

interface HeaderProps {
  onMobileMenuToggle: () => void
  children?: React.ReactNode
}

export function Header({ onMobileMenuToggle, children }: HeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b bg-background shrink-0">
      {/* Hamburger */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        {/* TODO: use Lucide Menu icon */}
        <span className="flex flex-col gap-1" aria-hidden="true">
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
        </span>
      </button>

      {/* Breadcrumbs / page title */}
      <div className="flex-1 mx-4">
        <Breadcrumbs />
      </div>

      {/* Right-side slot — notifications bell etc. */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}
