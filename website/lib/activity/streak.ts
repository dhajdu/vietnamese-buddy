// lib/activity/streak.ts
export const DEFAULT_TZ = 'Asia/Ho_Chi_Minh'

/** "YYYY-MM-DD" for `now` in the given IANA timezone. */
export function localDate(tz: string = DEFAULT_TZ, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d + n)
  return new Date(t).toISOString().slice(0, 10)
}

/**
 * `dates` are distinct "YYYY-MM-DD" strings, any order. Current streak counts
 * back from today, or from yesterday if today has no activity yet.
 */
export function computeStreak(dates: string[], today: string) {
  const set = new Set(dates)
  let current = 0
  let cursor = set.has(today) ? today : addDays(today, -1)
  while (set.has(cursor)) { current++; cursor = addDays(cursor, -1) }

  let longest = 0
  const sorted = [...set].sort()
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }
  return { current, longest, totalDays: set.size }
}

/** The last `n` local dates ending today, oldest first. */
export function lastNDates(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}
