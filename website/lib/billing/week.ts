// lib/billing/week.ts
/** Monday of the learner's local week, as "YYYY-MM-DD". Pure, so it is testable. */
export function weekStart(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d)
  // getUTCDay: 0 is Sunday, so Sunday belongs to the week that began six days earlier.
  const back = (new Date(utc).getUTCDay() + 6) % 7
  return new Date(utc - back * 86_400_000).toISOString().slice(0, 10)
}

/** Milliseconds the zone is ahead of UTC at that instant, e.g. +7h for Asia/Ho_Chi_Minh. */
function offsetMs(instant: number, timeZone: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(instant).find(p => p.type === 'timeZoneName')?.value ?? 'GMT'
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name)
  if (!m) return 0 // plain "GMT"
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 3_600_000 + Number(m[3]) * 60_000)
}

/** The UTC instant of 00:00 on a local "YYYY-MM-DD" in that zone, as an ISO string. */
export function zonedMidnightUtc(localDate: string, timeZone: string): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const wall = Date.UTC(y, m - 1, d)
  // Take the offset again at the first estimate, in case a DST change falls in between.
  const first = wall - offsetMs(wall, timeZone)
  return new Date(wall - offsetMs(first, timeZone)).toISOString()
}
