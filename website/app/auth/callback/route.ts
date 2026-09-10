// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  // In Next.js 16, URL searchParams on a Request are synchronous —
  // only page/layout searchParams props are async. Direct URL parsing is fine.
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'
  const origin = url.origin

  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } else if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'email' | 'recovery' | 'magiclink' })
    if (error) console.error('auth callback verifyOtp failed:', error.message)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
