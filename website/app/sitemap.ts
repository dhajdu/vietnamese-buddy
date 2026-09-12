// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the public surface. Everything under /app and /admin is private.
  const now = new Date()
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/vi`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
