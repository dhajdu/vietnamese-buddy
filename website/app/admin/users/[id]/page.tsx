// app/admin/users/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/guards'
import { getUser } from '@/lib/admin/queries'
import { CompToggle } from '@/components/admin/CompToggle'

export default async function AdminUserPage({ params }: PageProps<'/admin/users/[id]'>) {
  await requireAdmin()
  const { id } = await params
  const found = await getUser(id)
  if (!found) notFound()
  const { user, lessons } = found

  const stats: [string, string | number][] = [
    ['Lessons', user.lessons], ['AI lessons', user.ai_lessons],
    ['Words', user.words], ['Known', user.words_known],
    ['Learning days', user.learning_days], ['Last active', user.last_active ?? '—'],
    ['Direction', user.pair], ['Timezone', user.timezone ?? '—'],
    ['Subscription', user.sub_status], ['Renews', user.current_period_end?.slice(0, 10) ?? '—'],
  ]

  return (
    <div className="space-y-6">
      <nav className="text-xs font-semibold text-stone"><Link href="/admin" className="hover:text-ink">← Users</Link></nav>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Learner</p>
          <h1 className="t-title text-3xl">{user.email ?? user.id}</h1>
          <p className="meta mt-1">Joined {user.created_at.slice(0, 10)}{user.is_admin && ' · admin'}</p>
        </div>
        <div className="flex items-center gap-3">
          <CompToggle userId={user.id} comped={user.comped} />
          <a href={`https://dashboard.stripe.com/search?query=${encodeURIComponent(user.email ?? '')}`}
            target="_blank" rel="noopener noreferrer" className="btn-quiet">Open in Stripe ↗</a>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-card border border-sand bg-white p-5 text-sm sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-sand py-1.5">
            <dt className="text-stone">{k}</dt><dd className="tabular font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-2">
        <h2 className="eyebrow">Recent lessons</h2>
        <div className="overflow-x-auto rounded-card border border-sand bg-white">
          <table className="w-full text-sm">
            <thead><tr className="bg-cream-warm text-[11px] uppercase tracking-[0.1em] text-stone">
              <th className="p-3 text-left font-semibold">Title</th><th className="p-3 text-left font-semibold">Direction</th>
              <th className="p-3 text-left font-semibold">Source</th><th className="p-3 text-left font-semibold">Completed</th>
              <th className="p-3 text-left font-semibold">Created</th>
            </tr></thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id} className="border-t border-sand">
                  <td className="p-3 font-semibold text-ink">{l.title}</td>
                  <td className="p-3 text-stone">{l.pair}</td>
                  <td className="p-3 text-stone">{l.source}</td>
                  <td className="p-3 text-stone">{l.completed_at ? '✓' : '—'}</td>
                  <td className="p-3 text-stone">{l.created_at.slice(0, 10)}</td>
                </tr>
              ))}
              {!lessons.length && <tr><td colSpan={5} className="p-8 text-center text-stone">No lessons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
