// components/ui/skeletons/PageHeaderSkeleton.tsx
interface Props {
  className?: string
}

/**
 * Skeleton for a page title + subtitle header.
 * Use in loading.tsx files as the first visible element.
 */
export function PageHeaderSkeleton({ className = '' }: Props) {
  return (
    <div aria-busy="true" aria-label="Loading" className={`animate-pulse ${className}`}>
      <div className="h-7 w-48 rounded bg-gray-300 mb-2" />
      <div className="h-4 w-72 rounded bg-gray-200" />
    </div>
  )
}
