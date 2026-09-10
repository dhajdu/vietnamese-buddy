// app/(app)/vocabulary/page.tsx
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { formatDate } from '@/lib/lessons/format'
import { StatusToggle } from '@/components/app/StatusToggle'

export const metadata = { title: 'Vocabulary' }
const FILTERS = ['all', 'new', 'learning', 'known'] as const

export default async function VocabularyPage({ searchParams }: PageProps<'/vocabulary'>) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const status = FILTERS.includes(sp.status as never) ? (sp.status as string) : 'all'
  const user = await requireAuth()
  const db = await createClient()
  const { timezone } = await getProfile(db, user.id)

  let query = db.from('vocabulary')
    .select('id, vietnamese, english, status, first_seen_at, lesson_vocabulary(lesson_id, lessons(id, title, created_at))')
    .eq('user_id', user.id).order('first_seen_at', { ascending: false })
  if (status !== 'all') query = query.eq('status', status)
  if (q) query = query.or(`vietnamese.ilike.%${q.replace(/[%,]/g, '')}%,english.ilike.%${q.replace(/[%,]/g, '')}%`)
  const [{ data: rows }, { data: counts }] = await Promise.all([
    query,
    db.from('vocabulary').select('status').eq('user_id', user.id),
  ])
  const tally = { total: counts?.length ?? 0, known: 0, learning: 0, new: 0 }
  for (const r of counts ?? []) tally[r.status as 'known' | 'learning' | 'new']++

  type Row = { id: string; vietnamese: string; english: string; status: 'new' | 'learning' | 'known'
    lesson_vocabulary: { lessons: { id: string; title: string; created_at: string } | null }[] }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Vocabulary learned: <span className="tabular">{tally.total}</span> words</h1>
        <p className="tabular text-sm text-ink-2">{tally.known} known · {tally.learning} learning · {tally.new} new</p>
      </header>

      <form className="flex gap-2" method="get">
        <input type="search" name="q" defaultValue={q} placeholder="Search Vietnamese or English"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="btn-quiet">Search</button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <Link key={f} href={`/vocabulary?${new URLSearchParams({ ...(q ? { q } : {}), ...(f !== 'all' ? { status: f } : {}) })}`}
            className={`rounded-full border px-3 py-0.5 text-xs capitalize ${status === f ? 'border-ink bg-ink text-bg' : 'border-line text-ink-2 hover:border-ink'}`}>
            {f}
          </Link>
        ))}
      </div>

      {!rows?.length ? (
        <div className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-ink-3">Nothing here yet.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(rows as unknown as Row[]).map(r => {
            const intro = r.lesson_vocabulary.map(lv => lv.lessons).filter(Boolean)
              .sort((a, b) => a!.created_at.localeCompare(b!.created_at))[0]
            return (
              <li key={r.id} className="card px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="vn text-[16px]">{r.vietnamese}</span>
                  <StatusToggle id={r.id} status={r.status} />
                </div>
                <p className="text-[14px] text-ink-2">{r.english}</p>
                {intro && (
                  <p className="text-xs text-ink-3">
                    <Link href={`/lessons/${intro.id}`} className="hover:text-ink">{intro.title}</Link> · {formatDate(intro.created_at, timezone)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
