// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/metadata'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes — add all public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // TODO: add more static routes
  ]

  // Dynamic routes — fetch from Supabase (example for blog posts)
  // TODO: uncomment and adapt for your content type
  // const { createClient } = await import('@/lib/supabase/server')
  // const supabase = await createClient()
  // const { data: posts } = await supabase.from('posts').select('slug, updated_at')
  // const dynamicRoutes: MetadataRoute.Sitemap = (posts ?? []).map(post => ({
  //   url: `${BASE_URL}/blog/${post.slug}`,
  //   lastModified: new Date(post.updated_at),
  //   changeFrequency: 'weekly',
  //   priority: 0.7,
  // }))
  // return [...staticRoutes, ...dynamicRoutes]

  return staticRoutes
}
