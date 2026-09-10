'use client'

import { useEffect, useRef } from 'react'
import { NAV_ITEMS } from '@/lib/dashboard/nav-config'
import { SidebarItem } from './SidebarItem'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus trap
  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    if (!panel) return

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      if (focusable.length === 0) return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 left-0 w-72 bg-background shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b">
          {/* TODO: replace with project logo */}
          <span className="font-semibold text-lg">Logo</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            {/* TODO: use Lucide X icon */}
            ✕
          </button>
        </div>

        {/* Nav items — clicking any link closes the drawer */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-2"
          aria-label="Main navigation"
          onClick={onClose}
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <SidebarItem href={item.href} label={item.label} icon={item.icon} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
