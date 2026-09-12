// lib/auth/guards.ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Use in Server Components and layouts to protect routes.
 * Returns the authenticated user or redirects to /login.
 * Always uses getUser() — never getSession() — for server-side auth.
 */
export async function requireAuth(redirectTo = '/login') {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect(redirectTo)
  return user
}

/**
 * Returns the current user without redirecting. Returns null if unauthenticated.
 */
export async function getOptionalUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Gate for every admin page and action. Must be the FIRST statement in each one:
 * a page that checks and an action that trusts the page is the classic hole.
 *
 * A non-admin gets 404, not a redirect, so the route's existence is not
 * confirmed to someone who should not know about it.
 */
export async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const { notFound } = await import('next/navigation')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()
  const { data, error } = await supabase.from('profiles').select('is_admin, email').eq('id', user.id).single()
  if (error || !data?.is_admin) return notFound()
  return { id: user.id, email: (data.email as string | null) ?? null }
}
