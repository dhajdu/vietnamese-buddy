// components/auth/LogoutButton.tsx
'use client'
import { logout } from '@/lib/auth/actions'

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="text-sm text-ink-3 hover:text-ink"
    >
      Sign out
    </button>
  )
}
