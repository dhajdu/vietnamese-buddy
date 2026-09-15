// lib/auth/guards.ts
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'

// cache() lasts one server request, so a layout and its page share one Auth
// round trip and one profile read instead of each paying for their own.
const currentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  // Signed out also comes back as an error, so any error means no user.
  return error ? null : user
})

/**
 * Use in Server Components and layouts to protect routes.
 * Returns the authenticated user or redirects to /login.
 * Always uses getUser() — never getSession() — for server-side auth.
 */
export async function requireAuth(redirectTo = '/login') {
  const user = await currentUser()
  if (!user) redirect(redirectTo)
  return user
}

/**
 * Returns the current user without redirecting. Returns null if unauthenticated.
 */
export async function getOptionalUser() {
  return currentUser()
}

/** The signed-in learner's profile, read once per request however many components ask. */
export const getCurrentProfile = cache(async (userId: string) => getProfile(await createClient(), userId))

/**
 * Gate for every admin page and action. Must be the FIRST statement in each one:
 * a page that checks and an action that trusts the page is the classic hole.
 *
 * A non-admin gets 404, not a redirect, so the route's existence is not
 * confirmed to someone who should not know about it.
 */
export const requireAdmin = cache(async (): Promise<{ id: string; email: string | null }> => {
  const { notFound } = await import('next/navigation')
  const user = await currentUser()
  if (!user) return notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('is_admin, email').eq('id', user.id).single()
  if (error || !data?.is_admin) return notFound()
  return { id: user.id, email: (data.email as string | null) ?? null }
})
