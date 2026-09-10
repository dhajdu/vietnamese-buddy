// lib/seo/fonts.ts
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

/**
 * Primary UI font — use for body text and UI elements.
 * Apply via className or CSS variable.
 *
 * TODO: Replace Inter with your brand font.
 */
export const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

/**
 * Display font — use for headings.
 * TODO: Replace Plus_Jakarta_Sans with your brand font, or remove if same as body.
 */
export const fontDisplay = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

/**
 * Usage in app/layout.tsx:
 *
 * import { fontSans, fontDisplay } from '@/lib/seo/fonts'
 *
 * <html className={`${fontSans.variable} ${fontDisplay.variable}`}>
 *   <body className="font-sans">...</body>
 * </html>
 */
