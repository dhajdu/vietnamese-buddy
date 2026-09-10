// components/chat/LoadingSkeleton.tsx
export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse" aria-busy="true">
      {[80, 60, 90, 50].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gray-200"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  )
}
