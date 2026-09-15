// app/(app)/vocabulary/page.tsx — Words
import Link from 'next/link'
import { requireAuth, getCurrentProfile } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/lessons/format'
import { t } from '@/lib/i18n'
import { StatusToggle } from '@/components/app/StatusToggle'
import { Speak } from '@/components/app/Speak'

export const metadata = { title: 'Words' }
const FILTERS = ['all', 'new', 'learning', 'known'] as const
const PAGE_SIZE = 50

export default async function VocabularyPage({ searchParams }: PageProps<'/app/vocabulary'>) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const status = FILTERS.includes(sp.status as never) ? (sp.status as string) : 'all'
  const page = Math.max(1, Number.parseInt(typeof sp.page === 'string' ? sp.page : '', 10) || 1)
  const user = await requireAuth()
  const db = await createClient()
  const { timezone, pair } = await getCurrentProfile(user.id)
  const d = t(pair.uiLocale)
  const filterLabel: Record<string, string> = { all: d.filterAll, new: d.filterNew, learning: d.filterLearning, known: d.filterKnown }

  // One row past the page tells us whether a next page exists. id breaks ties, since
  // a lesson's words share a first_seen_at and would otherwise shuffle between pages.
  const from = (page - 1) * PAGE_SIZE
  let query = db.from('vocabulary')
    .select('id, vietnamese, english, status, first_seen_at, lesson_vocabulary(lesson_id, lessons(id, title, created_at))')
    .eq('user_id', user.id).eq('pair', pair.id).order('first_seen_at', { ascending: false }).order('id')
  if (status !== 'all') query = query.eq('status', status)
  if (q) { const safe = q.replace(/[%,]/g, ''); query = query.or(`vietnamese.ilike.%${safe}%,english.ilike.%${safe}%`) }
  const count = (s: 'known' | 'learning' | 'new') =>
    db.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('pair', pair.id).eq('status', s)
  const [list, known, learning, fresh] = await Promise.all([query.range(from, from + PAGE_SIZE), count('known'), count('learning'), count('new')])
  const failed = list.error ?? known.error ?? learning.error ?? fresh.error
  if (failed) throw new Error(`vocabulary: read failed: ${failed.message}`)
  const rows = (list.data ?? []).slice(0, PAGE_SIZE)
  const hasMore = (list.data?.length ?? 0) > PAGE_SIZE
  const tally = { known: known.count ?? 0, learning: learning.count ?? 0, new: fresh.count ?? 0, total: 0 }
  tally.total = tally.known + tally.learning + tally.new
  const pageHref = (n: number) =>
    `/app/vocabulary?${new URLSearchParams({ ...(q ? { q } : {}), ...(status !== 'all' ? { status } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`

  type Row = { id: string; vietnamese: string; english: string; status: 'new' | 'learning' | 'known'
    lesson_vocabulary: { lessons: { id: string; title: string; created_at: string } | null }[] }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-8 sm:px-6 sm:pt-12">
      <header>
        <p className="eyebrow">{d.navWords}</p>
        <h1 className="t-title text-3xl sm:text-4xl">{d.wordsLearned(tally.total)}</h1>
        <p className="tabular meta mt-1 text-sm">{tally.known} {d.filterKnown} · {tally.learning} {d.filterLearning} · {tally.new} {d.filterNew}</p>
      </header>

      <form className="flex gap-2" method="get">
        <input type="search" name="q" defaultValue={q} placeholder={d.searchPlaceholder} aria-label={d.searchPlaceholder} className="input min-w-0 flex-1" />
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="btn-quiet">{d.search}</button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <Link key={f} href={`/app/vocabulary?${new URLSearchParams({ ...(q ? { q } : {}), ...(f !== 'all' ? { status: f } : {}) })}`}
            aria-current={status === f ? 'page' : undefined}
            className={`chip ${status === f ? 'bg-ink text-white hover:bg-ink' : ''}`}>
            {filterLabel[f]}
          </Link>
        ))}
      </div>

      {!rows.length ? (
        <div className="rounded-card border border-dashed border-sand px-4 py-8 text-center text-sm text-body">{d.nothingYet}</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(rows as unknown as Row[]).map(r => {
            const intro = r.lesson_vocabulary.map(lv => lv.lessons).filter(Boolean).sort((a, b) => a!.created_at.localeCompare(b!.created_at))[0]
            return (
              <li key={r.id} className="card px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Speak text={r[pair.targetField]} pair={pair.id} size="sm" />
                    <span lang={pair.targetField === 'vietnamese' ? 'vi' : 'en'} className="font-vn text-[16px] font-bold text-ink">{r[pair.targetField]}</span>
                  </span>
                  <StatusToggle id={r.id} status={r.status} word={r[pair.targetField]} locale={pair.uiLocale} />
                </div>
                <p className="gloss text-[14px]">{r[pair.sourceField]}</p>
                {intro && <p className="meta"><Link href={`/app/lessons/${intro.id}`} className="hover:text-ink">{intro.title}</Link> · {formatDate(intro.created_at, timezone, pair.uiLocale)}</p>}
              </li>
            )
          })}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <nav className="flex items-center justify-between">
          {page > 1 ? <Link href={pageHref(page - 1)} className="btn-quiet">← {d.back}</Link> : <span />}
          {hasMore && <Link href={pageHref(page + 1)} className="btn-quiet">{d.more} →</Link>}
        </nav>
      )}
    </div>
  )
}
