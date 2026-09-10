// lib/seo/metadata.ts
import type { Metadata } from 'next'

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.vietnamese-buddy.com'

export const SITE_NAME = 'Vietnamese Daily'
export const SITE_TAGLINE = 'Conversational Southern Vietnamese, one real situation a day.'
export const SITE_DESCRIPTION =
  'Tell it what you expect to talk about today in Ho Chi Minh City and get a lesson in real spoken Southern Vietnamese: phrases with their social flavour, reusable vocabulary, one grammar pattern, and flashcards that build a streak.'

/** Base metadata merged into every page. Exported from app/layout.tsx. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['Vietnamese', 'learn Vietnamese', 'Southern Vietnamese', 'Saigon', 'Ho Chi Minh City', 'conversational Vietnamese', 'flashcards'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    locale: 'en_US',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_TAGLINE,
  },
  robots: { index: true, follow: true },
  appleWebApp: { title: SITE_NAME, statusBarStyle: 'default' },
}

/** Page-level metadata that merges with the base. */
export function buildMetadata(overrides: { title: string; description: string; path: string; ogImage?: string }): Metadata {
  const url = `${BASE_URL}${overrides.path}`
  return {
    title: overrides.title,
    description: overrides.description,
    alternates: { canonical: url },
    openGraph: {
      title: overrides.title, description: overrides.description, url,
      images: overrides.ogImage ? [{ url: overrides.ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      title: overrides.title, description: overrides.description,
      images: overrides.ogImage ? [overrides.ogImage] : undefined,
    },
  }
}
