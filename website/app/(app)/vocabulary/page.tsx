// app/(app)/vocabulary/page.tsx — Words
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/lessons/queries'
import { formatDate } from '@/lib/lessons/format'
import { t } from '@/lib/i18n'
import { StatusToggle } from '@/components/app/StatusToggle'
import { Speak } from '@/components/app/Speak'

export const metadata = { title: 'Words' }
const FILTERS = ['all', 'new', 'learning', 'known'] as const

export default async function VocabularyPage({ searchParams }: PageProps<'/vocabulary'>) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const status = FILTERS.includes(sp.status as never) ? (sp.status as string) : 'all'
  const user = await requireAuth()
  const db = await createClient()
  const { timezone, pair } = await getProfile(db, user.id)
  const d = t(pair.uiLocale)
  const filterLabel: Record<string, string> = { all: d.filterAll, new: d.filterNew, learning: d.filterLearning, known: d.filterKnown }

  let query = db.from('vocabulary')
    .select('id, vietnamese, english, status, first_seen_at, lesson_vocabulary(lesson_id, lessons(id, title, created_at))')
    .eq('user_id', user.id).eq('pair', pair.id).order('first_seen_at', { ascending: false })
  if (status !== 'all') query = query.eq('status', status)
  if (q) { const safe = q.replace(/[%,]/g, ''); query = query.or(`vietnamese.ilike.%${safe}%,english.ilike.%${safe}%`) }
  const [{ data: rows }, { data: counts }] = await Promise.all([
    query,
    db.from('vocabulary').select('status').eq('user_id', user.id).eq('pair', pair.id),
  ])
  const tally = { total: counts?.length ?? 0, known: 0, learning: 0, new: 0 }
  for (const r of counts ?? []) tally[r.status as 'known' | 'learning' | 'new']++

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
        <input type="search" name="q" defaultValue={q} placeholder={d.searchPlaceholder} className="input flex-1" />
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="btn-quiet">{d.search}</button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <Link key={f} href={`/vocabulary?${new URLSearchParams({ ...(q ? { q } : {}), ...(f !== 'all' ? { status: f } : {}) })}`}
            className={`rounded-pill px-3 py-1 text-xs font-semibold capitalize ${status === f ? 'bg-ink text-white' : 'bg-cream-warm text-body hover:bg-sand'}`}>
            {filterLabel[f]}
          </Link>
        ))}
      </div>

      {!rows?.length ? (
        <div className="rounded-card border border-dashed border-sand px-4 py-8 text-center text-sm text-stone">{d.nothingYet}</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(rows as unknown as Row[]).map(r => {
            const intro = r.lesson_vocabulary.map(lv => lv.lessons).filter(Boolean).sort((a, b) => a!.created_at.localeCompare(b!.created_at))[0]
            return (
              <li key={r.id} className="card px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Speak text={r[pair.targetField]} pair={pair.id} size="sm" />
                    <span className="font-vn text-[16px] font-bold text-ink">{r[pair.targetField]}</span>
                  </span>
                  <StatusToggle id={r.id} status={r.status} locale={pair.uiLocale} />
                </div>
                <p className="gloss text-[14px]">{r[pair.sourceField]}</p>
                {intro && <p className="meta"><Link href={`/lessons/${intro.id}`} className="hover:text-ink">{intro.title}</Link> · {formatDate(intro.created_at, timezone, pair.uiLocale)}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
