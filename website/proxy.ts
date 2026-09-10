// proxy.ts — refreshes the Supabase session cookie on every request and gates the app.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC = ['/login', '/signup', '/check-email', '/auth', '/robots.txt', '/sitemap.xml', '/icon', '/apple-icon', '/opengraph-image', '/twitter-image']

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
  const { pathname } = request.nextUrl
  // Supabase falls back to the Site URL (the root) when a confirmation link's
  // redirect isn't allow-listed. Forward a stray ?code= to the callback so the
  // code is exchanged instead of dropped by the login redirect below.
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }
  const { data: { user } } = await supabase.auth.getUser()
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
