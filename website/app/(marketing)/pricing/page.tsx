// app/(marketing)/pricing/page.tsx — placeholder until prices are read from the database.
import Link from 'next/link'

export const metadata = { title: 'Pricing' }

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="eyebrow">Pricing</p>
      <h1 className="t-title text-4xl">Three lessons a week, free</h1>
      <p className="gloss mt-4 max-w-[60ch] text-xl">
        No card to start. Full plans arrive with billing; until then everything is free while in beta.
      </p>
      <Link href="/signup" className="btn-red mt-8">Start free</Link>
    </section>
  )
}
