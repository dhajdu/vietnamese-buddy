# Performance Patterns

## Route-level loading (instant shell)

Add `loading.tsx` next to any `page.tsx` that fetches data:
```tsx
// app/orders/loading.tsx
import { TableSkeleton } from '@/components/ui/skeletons'
export default function Loading() {
  return <TableSkeleton rows={10} columns={4} />
}
```
Next.js streams the skeleton immediately; the real page replaces it when ready.

## Granular Suspense (parallel data fetching)

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { CardSkeleton } from '@/components/ui/skeletons'

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<CardSkeleton />}>
        <RevenueCard />          {/* async Server Component — fetches in parallel */}
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <OrdersCard />
      </Suspense>
    </div>
  )
}
```

## Dynamic imports for heavy Client Components

```ts
import { clientOnly } from '@/lib/perf/dynamic'
import { CardSkeleton } from '@/components/ui/skeletons'

const Chart = clientOnly(
  () => import('@/components/Chart'),
  { loading: () => <CardSkeleton lines={1} className="h-48" /> }
)

const RichEditor = clientOnly(
  () => import('@/components/editor/MDXEditorFull'),
  { loading: () => <div className="h-64 animate-pulse rounded bg-gray-200" /> }
)
```

## LCP image — always add priority

```tsx
import Image from 'next/image'
// The largest above-the-fold image must have priority
<Image src={hero.src} alt={hero.alt} fill priority className="object-cover" />
```

## Font setup (no layout shift)

```ts
// lib/seo/fonts.ts
import { Inter } from 'next/font/google'
export const fontSans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })

// app/layout.tsx
<html className={fontSans.variable}>
  <body className="font-sans">...</body>
</html>
```

## Bundle analysis

```bash
ANALYZE=true npm run build
```

Requires `@next/bundle-analyzer` in `next.config.ts`. Look for:
- Large chunks in `pages/` or `app/` — candidates for dynamic import
- Duplicated packages — check for multiple React or lodash versions
- Unexpectedly large dependencies — look for lighter alternatives
