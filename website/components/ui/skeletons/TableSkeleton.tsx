// components/ui/skeletons/TableSkeleton.tsx
interface Props {
  rows?: number
  columns?: number
  className?: string
}

/**
 * Skeleton for table-shaped content.
 */
export function TableSkeleton({ rows = 5, columns = 4, className = '' }: Props) {
  return (
    <div aria-busy="true" aria-label="Loading" className={`animate-pulse ${className}`}>
      {/* Header row */}
      <div className="flex gap-4 border-b border-gray-200 pb-3 mb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-gray-300" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-2.5 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, col) => (
            <div
              key={col}
              className="h-3 flex-1 rounded bg-gray-200"
              style={{ opacity: 1 - row * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
