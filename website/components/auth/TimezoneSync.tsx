// components/auth/TimezoneSync.tsx
'use client'
import { useEffect } from 'react'
import { syncTimezone } from '@/lib/auth/actions'

/** Accounts made before signup captured the zone sit on the Ho Chi Minh default. Swap it for the browser's, once. */
export function TimezoneSync({ stored }: { stored: string }) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && tz !== stored) void syncTimezone(tz)
  }, [stored])
  return null
}
