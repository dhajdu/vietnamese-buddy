// components/auth/LogoutButton.tsx
'use client'
import { logout } from '@/lib/auth/actions'

export function LogoutButton({ dark = false }: { dark?: boolean }) {
  return (
    <button onClick={() => logout()} className={`text-sm font-semibold ${dark ? 'text-sand-70 hover:text-sand' : 'text-stone hover:text-ink'}`}>
      Sign out
    </button>
  )
}
