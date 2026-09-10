// lib/lessons/format.ts
import { localDate } from '@/lib/activity/streak'

export function formatDate(iso: string, tz: string, now = new Date()) {
  const d = new Date(iso)
  const day = localDate(tz, d)
  const today = localDate(tz, now)
  const yesterday = localDate(tz, new Date(now.getTime() - 86_400_000))
  if (day === today) return 'Today'
  if (day === yesterday) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'short' }).format(d)
}
