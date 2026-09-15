// components/marketing/MarketingLinks.tsx
'use client'
// The marketing shell is static and cannot read the path on the server, so its links
// read it here and speak the language of the page they sit on.
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const COPY = {
  en: { lang: 'en', pricing: 'Pricing', start: 'Start free', signIn: 'Sign in', other: { href: '/vi', lang: 'vi', label: 'Tiếng Việt' } },
  vi: { lang: 'vi', pricing: 'Bảng giá', start: 'Học thử', signIn: 'Đăng nhập', other: { href: '/', lang: 'en', label: 'English' } },
}

function useCopy() {
  return COPY[usePathname() === '/vi' ? 'vi' : 'en']
}

const onDark = 'hidden text-sm font-semibold text-sand-70 hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand sm:inline'
const onLight = 'inline-flex min-h-11 items-center hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:min-h-0'

/** Pricing and the language link live in the footer on phones, so the bar keeps one line. */
export function HeaderLinks() {
  const c = useCopy()
  return (
    <>
      <Link href="/pricing" lang={c.lang} className={onDark}>{c.pricing}</Link>
      <Link href={c.other.href} lang={c.other.lang} className={onDark}>{c.other.label}</Link>
      {/* Ghost, not red: each page's own primary is the one red in view. */}
      <Link href="/signup" lang={c.lang} className="btn-ghost-dark min-h-11 px-3 py-2 text-sm sm:min-h-0 sm:px-4">{c.start}</Link>
    </>
  )
}

export function FooterLinks() {
  const c = useCopy()
  return (
    <>
      <Link href="/pricing" lang={c.lang} className={onLight}>{c.pricing}</Link>
      <Link href={c.other.href} lang={c.other.lang} className={onLight}>{c.other.label}</Link>
      <Link href="/login" lang={c.lang} className={onLight}>{c.signIn}</Link>
    </>
  )
}
