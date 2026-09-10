// components/chat/StreamingIndicator.tsx
export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2" aria-label="AI is responding">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}
