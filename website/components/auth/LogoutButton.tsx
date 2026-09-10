// components/auth/LogoutButton.tsx
'use client'
import { logout } from '@/lib/auth/actions'

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
    >
      Sign out
    </button>
  )
}
