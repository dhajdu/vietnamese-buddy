// components/chat/EmptyState.tsx
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
      <p className="text-lg font-medium">No chat selected</p>
      <p className="text-sm">Create a new chat or select one from the sidebar.</p>
    </div>
  )
}
