// proxy.ts — refreshes the Supabase session cookie and gates the private surfaces.
// It only runs where a session is actually read (see the matcher). Marketing,
// icons, OG images, robots and sitemap never pay for an Auth round trip, and the
// gate is still a short allow-list of private prefixes rather than a deny-list
// of public ones.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PRIVATE = ['/app', '/admin']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPrivate = PRIVATE.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!user && isPrivate) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  // `/app/:path*` also matches `/app` itself.
  matcher: ['/app/:path*', '/admin/:path*', '/login', '/signup', '/check-email', '/auth/:path*', '/api/:path*'],
}
