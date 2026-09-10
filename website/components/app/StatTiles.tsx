// components/app/StatTiles.tsx
import Link from 'next/link'

export interface Stat { label: string; value: string | number; href?: string; tone?: 'amber' }

export function StatTiles({ stats, cols }: { stats: Stat[]; cols?: string }) {
  return (
    <div className={`grid gap-2 ${cols ?? 'grid-cols-3 sm:grid-cols-4'}`}>
      {stats.map(s => {
        const amber = s.tone === 'amber'
        const cls = `rounded-card border px-3 py-3 ${amber ? 'border-transparent bg-amber-bg' : 'card'} ${s.href ? 'hover:border-ink' : ''}`
        const inner = (
          <>
            <b className={`tabular block font-vn text-2xl font-extrabold leading-none tracking-[-0.03em] ${amber ? 'text-amber-ink' : 'text-ink'}`}>{s.value}</b>
            <span className={`mt-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] ${amber ? 'text-amber-ink' : 'text-stone'}`}>{s.label}</span>
          </>
        )
        return s.href ? <Link key={s.label} href={s.href} className={cls}>{inner}</Link> : <div key={s.label} className={cls}>{inner}</div>
      })}
    </div>
  )
}
