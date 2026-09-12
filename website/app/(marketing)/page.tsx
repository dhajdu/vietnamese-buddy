// app/(marketing)/page.tsx — English landing. Full copy lands in the marketing PR.
import Link from 'next/link'

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="eyebrow">Southern Vietnamese, daily</p>
      <h1 className="t-title text-4xl sm:text-5xl">Learn the Vietnamese people actually speak in Saigon</h1>
      <p className="gloss mt-4 max-w-[60ch] text-xl">
        Tell it what you expect to talk about today and get a lesson in real spoken Southern Vietnamese:
        phrases with their social flavour, reusable vocabulary, one grammar pattern, and flashcards that build a streak.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/signup" className="btn-red">Start free</Link>
        <Link href="/pricing" className="btn-quiet">See pricing</Link>
      </div>
    </section>
  )
}
