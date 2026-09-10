// components/ui/skeletons/CardSkeleton.tsx
interface Props {
  className?: string
  lines?: number
}

/**
 * Skeleton placeholder for card-shaped content.
 * Match dimensions to your real card component.
 */
export function CardSkeleton({ className = '', lines = 3 }: Props) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={`animate-pulse rounded-lg border border-gray-200 bg-white p-4 ${className}`}
    >
      {/* Header */}
      <div className="h-4 w-1/3 rounded bg-gray-200 mb-3" />
      {/* Body lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-gray-200 mb-2"
          style={{ width: `${[100, 85, 70][i % 3]}%` }}
        />
      ))}
    </div>
  )
}
