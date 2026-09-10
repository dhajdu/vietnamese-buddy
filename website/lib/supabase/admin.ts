// lib/supabase/admin.ts
// Service-role client. Server-side only (seed script, admin tasks). Never import from client code.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SECRET
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set')
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
