// lib/auth/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_TZ } from '@/lib/activity/streak'
import { requireAuth } from './guards'
import { appPath, checkoutPath, isTimeZone } from './validate'

export async function loginWithEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === 'invalid_credentials') return { error: 'That email and password don’t match.' }
    if (error.code === 'email_not_confirmed') return { error: 'Confirm your email first: open the link we sent you.' }
    console.error('sign-in failed:', error.code, error.message)
    return { error: 'Could not sign you in. Try again in a minute.' }
  }
  // A deep link the proxy bounced to /login comes back as ?next.
  redirect(appPath(formData.get('next')) ?? '/app')
}

export async function signupWithEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  // A plan chosen on the pricing page rides through signup so the learner lands
  // on checkout rather than having to find it again.
  const next = checkoutPath(formData.get('plan')) ?? '/app'
  const timezone = formData.get('timezone')

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      // handle_new_user copies this onto the profile, so streaks run on the learner's own clock.
      data: isTimeZone(timezone) ? { timezone } : undefined,
    },
  })
  if (error) {
    // An existing account gets the same inbox page as a new one, so the form never confirms who has signed up.
    if (error.code === 'user_already_exists') redirect('/check-email')
    if (error.code === 'weak_password') return { error: 'Choose a stronger password: at least 8 characters, not a common one.' }
    console.error('sign-up failed:', error.code, error.message)
    return { error: 'Could not create your account. Try again in a few minutes.' }
  }
  redirect('/check-email')
}

/**
 * Replaces the Ho Chi Minh default with the browser's zone. profiles.timezone is
 * not learner-writable, so this uses the service role, and only while the default
 * is still there: nobody can keep moving their own week boundary.
 */
export async function syncTimezone(tz: string) {
  if (!isTimeZone(tz)) return { error: 'Unknown timezone.' }
  const user = await requireAuth()
  const { error } = await createAdminClient().from('profiles').update({ timezone: tz }).eq('id', user.id).eq('timezone', DEFAULT_TZ)
  if (error) {
    console.error('timezone sync failed:', error.message)
    return { error: 'Could not save your timezone.' }
  }
  return { ok: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
