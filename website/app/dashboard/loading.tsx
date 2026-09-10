// app/dashboard/loading.tsx
// Next.js automatically shows this while app/dashboard/page.tsx is loading.
// Replace skeletons with shapes matching your real dashboard layout.
import { PageHeaderSkeleton } from '@/components/ui/skeletons/PageHeaderSkeleton'
import { CardSkeleton } from '@/components/ui/skeletons/CardSkeleton'
import { TableSkeleton } from '@/components/ui/skeletons/TableSkeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeaderSkeleton />
      {/* Stats row — TODO: match your real stats card count */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
      {/* Main content table */}
      <TableSkeleton rows={8} columns={5} />
    </div>
  )
}
