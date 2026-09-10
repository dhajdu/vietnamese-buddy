import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Newsreader, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-be-vietnam', display: 'swap',
})
const newsreader = Newsreader({
  subsets: ['latin', 'vietnamese'], style: ['normal', 'italic'], variable: '--font-newsreader', display: 'swap',
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Vietnamese Daily', template: '%s · Vietnamese Daily' },
  description: 'Conversational Southern Vietnamese, one real situation a day.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${beVietnam.variable} ${newsreader.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
