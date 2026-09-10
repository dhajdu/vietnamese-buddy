// lib/perf/dynamic.ts
// Typed helpers for dynamic imports of large Client Components.
// Always use ssr: false for browser-only libraries.
import dynamic from 'next/dynamic'
import type React from 'react'

/**
 * Creates a dynamic import for a Client Component that uses browser APIs.
 * Prevents SSR errors and reduces initial bundle size.
 *
 * @example
 * const Chart = clientOnly(() => import('@/components/Chart'))
 * const Map = clientOnly(() => import('@/components/Map'), { loading: () => <MapSkeleton /> })
 */
export function clientOnly<T extends object>(
  loader: () => Promise<{ default: React.ComponentType<T> }>,
  options?: { loading?: () => React.ReactNode }
) {
  return dynamic(loader, {
    ssr: false,
    loading: options?.loading,
  })
}

/**
 * Creates a dynamic import that works with SSR (for components that can render server-side
 * but are large and should be code-split).
 *
 * @example
 * const RichEditor = lazyLoad(() => import('@/components/editor/MDXEditorFull'))
 */
export function lazyLoad<T extends object>(
  loader: () => Promise<{ default: React.ComponentType<T> }>,
  options?: { loading?: () => React.ReactNode; ssr?: boolean }
) {
  return dynamic(loader, {
    ssr: options?.ssr ?? true,
    loading: options?.loading,
  })
}
