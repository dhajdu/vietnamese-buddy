// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  // Everything behind login is private; only the public entry points are listed.
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
