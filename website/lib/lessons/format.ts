// lib/lessons/format.ts
import { localDate } from '@/lib/activity/streak'
import type { Locale } from '@/lib/pairs'
import { t } from '@/lib/i18n'

export function formatDate(iso: string, tz: string, locale: Locale = 'en', now = new Date()) {
  const d = new Date(iso)
  const day = localDate(tz, d)
  if (day === localDate(tz, now)) return t(locale).today
  if (day === localDate(tz, new Date(now.getTime() - 86_400_000))) return t(locale).yesterday
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: tz, day: 'numeric', month: 'short' }).format(d)
}
