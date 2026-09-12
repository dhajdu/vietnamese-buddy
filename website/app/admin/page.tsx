// app/admin/page.tsx — every signup, one query.
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/guards'
import { listUsers } from '@/lib/admin/queries'

const SORTS = [
  { key: 'created_at', label: 'Newest' },
  { key: 'lessons', label: 'Lessons' },
  { key: 'words', label: 'Words' },
  { key: 'last_active', label: 'Last active' },
  { key: 'email', label: 'Email' },
]

function planLabel(u: { comped: boolean; sub_status: string; is_admin: boolean }) {
  if (u.is_admin) return { text: 'admin', cls: 'bg-ink text-white' }
  if (u.comped) return { text: 'comped', cls: 'bg-info-bg text-info-ink' }
  if (['active', 'trialing'].includes(u.sub_status)) return { text: 'pro', cls: 'bg-ok-bg text-ok-ink' }
  if (u.sub_status === 'past_due') return { text: 'past due', cls: 'bg-err-bg text-err-ink' }
  return { text: 'free', cls: 'bg-cream-warm text-body' }
}

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin()
  const sp = await searchParams
  const search = typeof sp.q === 'string' ? sp.q : ''
  const sort = typeof sp.sort === 'string' ? sp.sort : 'created_at'
  const users = await listUsers(search, sort)
  const pro = users.filter(u => u.comped || ['active', 'trialing'].includes(u.sub_status)).length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Users</p>
          <h1 className="t-title text-3xl">{users.length} {users.length === 1 ? 'signup' : 'signups'}</h1>
          <p className="meta mt-1">{pro} on a paid or comped plan</p>
        </div>
        <form method="get" className="flex gap-2">
          <input type="search" name="q" defaultValue={search} placeholder="Search email" className="input w-56" />
          <input type="hidden" name="sort" value={sort} />
          <button className="btn-quiet">Search</button>
        </form>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {SORTS.map(s => (
          <Link key={s.key} href={`/admin?${new URLSearchParams({ ...(search ? { q: search } : {}), sort: s.key })}`}
            className={`rounded-pill px-3 py-1 text-xs font-semibold ${sort === s.key ? 'bg-ink text-white' : 'bg-cream-warm text-body hover:bg-sand'}`}>
            {s.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-sand bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-warm text-[11px] uppercase tracking-[0.1em] text-stone">
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-left font-semibold">Plan</th>
              <th className="p-3 text-left font-semibold">Direction</th>
              <th className="p-3 text-right font-semibold">Lessons</th>
              <th className="p-3 text-right font-semibold">Words</th>
              <th className="p-3 text-right font-semibold">Known</th>
              <th className="p-3 text-right font-semibold">Days</th>
              <th className="p-3 text-left font-semibold">Last active</th>
              <th className="p-3 text-left font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const p = planLabel(u)
              return (
                <tr key={u.id} className="border-t border-sand hover:bg-cream-warm">
                  <td className="p-3"><Link href={`/admin/users/${u.id}`} className="font-semibold text-red hover:underline">{u.email ?? u.id.slice(0, 8)}</Link></td>
                  <td className="p-3"><span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${p.cls}`}>{p.text}</span></td>
                  <td className="p-3 text-stone">{u.pair}</td>
                  <td className="tabular p-3 text-right">{u.lessons}</td>
                  <td className="tabular p-3 text-right">{u.words}</td>
                  <td className="tabular p-3 text-right">{u.words_known}</td>
                  <td className="tabular p-3 text-right">{u.learning_days}</td>
                  <td className="p-3 text-stone">{u.last_active ?? '—'}</td>
                  <td className="p-3 text-stone">{u.created_at.slice(0, 10)}</td>
                </tr>
              )
            })}
            {!users.length && <tr><td colSpan={9} className="p-8 text-center text-stone">No signups match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
