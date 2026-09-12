// app/robots.ts
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/metadata'

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    rules: isProduction
      ? [{ userAgent: '*', allow: '/', disallow: ['/app/', '/admin/', '/api/'] }]
      : [{ userAgent: '*', disallow: '/' }], // keep previews out of the index
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
