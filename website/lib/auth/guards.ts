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
