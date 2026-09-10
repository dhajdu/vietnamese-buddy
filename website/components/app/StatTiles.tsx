// components/app/StatTiles.tsx
import Link from 'next/link'

export function StatTiles({ stats }: { stats: { label: string; value: string | number; href?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(s => {
        const inner = (
          <>
            <b className="tabular block font-display text-2xl font-semibold tracking-tight">{s.value}</b>
            <span className="label">{s.label}</span>
          </>
        )
        const cls = 'card px-3 py-3 text-center'
        return s.href
          ? <Link key={s.label} href={s.href} className={`${cls} hover:border-ink`}>{inner}</Link>
          : <div key={s.label} className={cls}>{inner}</div>
      })}
    </div>
  )
}
