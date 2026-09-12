// lib/billing/week.ts
/** Monday of the learner's local week, as "YYYY-MM-DD". Pure, so it is testable. */
export function weekStart(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d)
  // getUTCDay: 0 is Sunday, so Sunday belongs to the week that began six days earlier.
  const back = (new Date(utc).getUTCDay() + 6) % 7
  return new Date(utc - back * 86_400_000).toISOString().slice(0, 10)
}
