// components/ui/skeletons/TextSkeleton.tsx
interface Props {
  lines?: number
  className?: string
}

/**
 * Skeleton for text/paragraph content.
 */
export function TextSkeleton({ lines = 4, className = '' }: Props) {
  const widths = [100, 95, 100, 60]
  return (
    <div aria-busy="true" aria-label="Loading" className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-gray-200"
          style={{ width: `${widths[i % widths.length]}%` }}
        />
      ))}
    </div>
  )
}
