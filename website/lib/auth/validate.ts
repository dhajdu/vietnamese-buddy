// lib/auth/validate.ts: checks on values a browser sends to the auth flow. Pure, so client forms can use them too.

/** Where to go after signing in. Only paths inside the app, so a crafted ?next can never leave the site. */
export function appPath(raw: unknown): string | null {
  return typeof raw === 'string' && (raw === '/app' || raw.startsWith('/app/') || raw.startsWith('/app?')) ? raw : null
}

/** A plan chosen on the pricing page becomes a checkout that opens once the learner is in. */
export function checkoutPath(plan: unknown): string | null {
  return plan === 'monthly' || plan === 'annual' ? `/app/billing?checkout=${plan}` : null
}

/** True when this runtime can format dates in `tz`, which is all streak math needs from it. */
export function isTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
