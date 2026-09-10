// app/(app)/flashcards/page.tsx
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { ReviewSession, type Card } from '@/components/app/ReviewSession'

export const metadata = { title: 'Flashcards' }
const ORDER = { review: 0, new: 1, known: 2 } as const

export default async function FlashcardsPage({ searchParams }: PageProps<'/flashcards'>) {
  const { lesson, deck } = await searchParams
  const user = await requireAuth()
  const db = await createClient()

  if (lesson || deck === 'due') {
    let q = db.from('flashcards').select('id, type, front, back, status').eq('user_id', user.id)
    q = lesson ? q.eq('lesson_id', String(lesson)) : q.neq('status', 'known')
    const { data } = await q
    const cards = ((data ?? []) as (Card & { status: keyof typeof ORDER })[])
      .sort((a, b) => ORDER[a.status] - ORDER[b.status])
    if (!cards.length) {
      return <div className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-ink-3">No cards due. Create a lesson to get more. <Link href="/" className="text-accent hover:underline">Home</Link></div>
    }
    return <ReviewSession cards={cards} backHref={lesson ? `/lessons/${lesson}` : '/'} />
  }

  const [{ count: due }, { data: lessons }] = await Promise.all([
    db.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'known'),
    db.from('lessons').select('id, title, flashcards(status)').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
      <section className="space-y-2">
        <h2 className="label">Due today</h2>
        <Link href="/flashcards?deck=due" className="card flex items-center justify-between px-4 py-3 hover:border-ink">
          <span className="font-display text-[15px] font-semibold">All due cards</span>
          <span className="tabular text-sm text-ink-3">{due ?? 0}</span>
        </Link>
      </section>
      <section className="space-y-2">
        <h2 className="label">By lesson</h2>
        <ul className="flex flex-col gap-2">
          {(lessons ?? []).map(l => {
            const cards = (l.flashcards as { status: string }[]) ?? []
            const open = cards.filter(c => c.status !== 'known').length
            return (
              <li key={l.id}>
                <Link href={`/flashcards?lesson=${l.id}`} className="card flex items-center justify-between px-4 py-3 hover:border-ink">
                  <span className="font-display text-[15px] font-semibold">{l.title as string}</span>
                  <span className="tabular text-sm text-ink-3">{open ? `${open} due` : 'Done'} · {cards.length}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
