// components/ui/skeletons/AvatarSkeleton.tsx
interface Props {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
  className?: string
}

const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }

/**
 * Skeleton for avatar + optional name/subtitle.
 * Note: sizes are controlled via Tailwind classes (no size prop on shadcn Avatar).
 */
export function AvatarSkeleton({ size = 'md', withText = false, className = '' }: Props) {
  return (
    <div aria-busy="true" aria-label="Loading" className={`flex items-center gap-3 animate-pulse ${className}`}>
      <div className={`shrink-0 rounded-full bg-gray-200 ${sizes[size]}`} />
      {withText && (
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-2.5 w-16 rounded bg-gray-200" />
        </div>
      )}
    </div>
  )
}
