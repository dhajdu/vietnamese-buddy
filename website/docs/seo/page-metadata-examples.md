# SEO — Page Metadata Examples

## Static page

```tsx
// app/about/page.tsx
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'About Us',
  description: 'Learn about our company and mission.',
  path: '/about',
  ogImage: '/images/about-og.jpg',
})
```

## Dynamic page (blog post)

```tsx
// app/blog/[slug]/page.tsx
import { buildMetadata } from '@/lib/seo/metadata'
import { articleSchema } from '@/lib/seo/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug)
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    ogImage: post.coverImage,
  })
}

export default async function BlogPostPage({ params }) {
  const post = await fetchPost(params.slug)
  return (
    <>
      <JsonLd schema={articleSchema({
        title: post.title,
        description: post.excerpt,
        url: `${BASE_URL}/blog/${post.slug}`,
        imageUrl: post.coverImage,
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
        authorName: post.author,
      })} />
      {/* page content */}
    </>
  )
}
```

## Images — always next/image

```tsx
// Correct
import Image from 'next/image'
<Image src="/hero.jpg" width={1200} height={630} alt="Hero" priority />

// Never
<img src="/hero.jpg" alt="Hero" />
```

## LCP image

Add `priority` to the largest above-the-fold image to trigger preloading:
```tsx
<Image src={hero.src} fill alt={hero.alt} priority className="object-cover" />
```
