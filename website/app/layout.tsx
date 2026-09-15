import type { Viewport } from 'next'
import { Be_Vietnam_Pro, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { baseMetadata } from '@/lib/seo/metadata'

const beVietnam = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['700', '800'], variable: '--font-be-vietnam', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], weight: ['400'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap' })
const inter = Inter({ subsets: ['latin', 'vietnamese'], weight: ['400', '600'], variable: '--font-inter', display: 'swap' })

export const metadata = baseMetadata
// viewportFit 'cover' makes env(safe-area-inset-*) report real insets. A meta tag cannot
// read CSS variables, so themeColor repeats --ink-warm from app/globals.css.
export const viewport: Viewport = { viewportFit: 'cover', themeColor: '#1C1A17' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${beVietnam.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  )
}
