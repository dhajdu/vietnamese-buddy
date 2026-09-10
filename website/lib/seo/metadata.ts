// lib/seo/metadata.ts
import type { Metadata } from 'next'

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

/**
 * Base metadata merged into every page via Next.js metadata merging.
 * Export this from app/layout.tsx as `export const metadata`.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'My App',       // TODO: replace with site name
    template: '%s | My App', // TODO: replace with site name
  },
  description: 'A description of your application.', // TODO: replace
  openGraph: {
    type: 'website',
    siteName: 'My App', // TODO: replace
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * Build page-level metadata that merges with the base.
 * Use in generateMetadata() or as a static export.
 */
export function buildMetadata(overrides: {
  title: string
  description: string
  path: string
  ogImage?: string
}): Metadata {
  const url = `${BASE_URL}${overrides.path}`
  return {
    title: overrides.title,
    description: overrides.description,
    alternates: { canonical: url },
    openGraph: {
      title: overrides.title,
      description: overrides.description,
      url,
      images: overrides.ogImage
        ? [{ url: overrides.ogImage, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      title: overrides.title,
      description: overrides.description,
      images: overrides.ogImage ? [overrides.ogImage] : undefined,
    },
  }
}
