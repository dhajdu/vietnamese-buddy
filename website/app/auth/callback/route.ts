// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Same-origin paths only. Comparing resolved origins also rejects '//host', '/\host' and tab tricks. */
function nextUrl(raw: string | null, origin: string) {
  try {
    const target = new URL(raw?.startsWith('/') ? raw : '/app', origin)
    if (target.origin === origin) return target
  } catch {
    // Malformed: use the default below.
  }
  return new URL('/app', origin)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  // In Next.js 16, URL searchParams on a Request are synchronous —
  // only page/layout searchParams props are async. Direct URL parsing is fine.
  const code = url.searchParams.get('code')
  const origin = url.origin
  const next = nextUrl(url.searchParams.get('next'), origin)

  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(next)
    }
  } else if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'email' | 'recovery' | 'magiclink' })
    if (error) console.error('auth callback verifyOtp failed:', error.message)
    if (!error) {
      return NextResponse.redirect(next)
    }
  }

  // Auth failed — redirect to error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
