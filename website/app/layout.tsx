import { Be_Vietnam_Pro, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { baseMetadata } from '@/lib/seo/metadata'

const beVietnam = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['700', '800'], variable: '--font-be-vietnam', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], weight: ['400'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap' })
const inter = Inter({ subsets: ['latin', 'vietnamese'], weight: ['400', '600'], variable: '--font-inter', display: 'swap' })

export const metadata = baseMetadata

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${beVietnam.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
