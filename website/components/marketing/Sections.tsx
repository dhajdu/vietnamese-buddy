// components/marketing/Sections.tsx — the eight sections, written once and fed
// by lib/marketing/content.ts. Server components: no client JavaScript out here.
import Link from 'next/link'
import { fill, type Landing } from '@/lib/marketing/content'
import type { Lesson } from '@/lib/ai/schema'
import { getPair } from '@/lib/pairs'
import { ToneTag } from '@/components/app/ToneTag'

/** The language being learned on this landing page, for lang on target-language text. */
const targetLang = (c: Landing) => getPair(c.pair).targetField === 'vietnamese' ? 'vi' : 'en'

export function Hero({ c, freeLessons }: { c: Landing; freeLessons: number }) {
  return (
    <section className="bg-ink-warm px-6 py-20 text-sand sm:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow-dark mb-4">{c.eyebrow}</p>
        <h1 className="font-vn text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-sand sm:text-[54px]">{c.h1}</h1>
        <p className="gloss mt-5 max-w-[58ch] text-xl text-sand-70">{fill(c.lede, freeLessons, c.locale)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="btn-red-dark">{c.ctaPrimary}</Link>
          <Link href="#sample" className="btn-ghost-dark">{c.ctaSecondary}</Link>
        </div>
      </div>
    </section>
  )
}

export function Contrast({ c }: { c: Landing }) {
  const lang = targetLang(c)
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="t-title text-3xl">{c.contrastHeading}</h2>
      <p className="gloss mt-2 max-w-[60ch] text-lg">{c.contrastSub}</p>
      <ul className="mt-8 space-y-3">
        {c.contrasts.map(x => (
          <li key={x.right} className="card grid gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_1.3fr] sm:items-center">
            <span>
              <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-body">{c.contrastWrongLabel}</span>
              <span lang={lang} className="font-vn text-lg font-bold text-body line-through decoration-stone/50">{x.wrong}</span>
            </span>
            <span>
              <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-red">{c.contrastRightLabel}</span>
              <span lang={lang} className="target text-xl">{x.right}</span>
            </span>
            <span className="gloss text-[15px]">{x.note}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Steps({ c }: { c: Landing }) {
  return (
    <section className="bg-cream-warm px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="t-title text-3xl">{c.stepsHeading}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {c.steps.map((s, i) => (
            <li key={s.title} className="card px-5 py-5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
              <h3 className="t-title mt-3 text-xl">{s.title}</h3>
              <p className="gloss mt-1 text-[15px]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Sample({ c, lesson }: { c: Landing; lesson: Lesson }) {
  const pair = getPair(c.pair)
  const lang = targetLang(c)
  return (
    <section id="sample" className="mx-auto max-w-3xl scroll-mt-8 px-6 py-16">
      <h2 className="t-title text-3xl">{c.sampleHeading}</h2>
      <p className="gloss mt-2 max-w-[60ch] text-lg">{c.sampleSub}</p>
      <div className="card mt-8 px-5 py-5">
        <h3 lang={lang} className="font-vn text-xl font-extrabold text-ink">{lesson.title}</h3>
        <ol className="mt-3 divide-y divide-sand">
          {lesson.phrases.slice(0, 3).map((p, i) => (
            <li key={i} className="py-3">
              <ToneTag tone={p.tone} />
              <p lang={lang} className="target mt-1 text-[22px] leading-[1.15]">{p[pair.targetField]}</p>
              <p className="gloss text-[16px]">{p[pair.sourceField]}</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-body">{p.explanation}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-card bg-ink-warm px-4 py-3 text-sand">
          <p className="eyebrow-dark mb-1">{lesson.grammar.title}</p>
          {/* Same pattern chip as the lesson page's grammar block. */}
          <p lang={lang} className="inline-block rounded-lg border-l-[3px] border-red-bright bg-on-dark-soft px-2.5 py-1.5 font-vn text-[15px] font-bold text-sand">{lesson.grammar.pattern}</p>
        </div>
        <p className="meta mt-3">+ {lesson.phrases.length - 3} more phrases and {lesson.vocabulary.length} words in the full lesson.</p>
      </div>
    </section>
  )
}

export function Accumulate({ c }: { c: Landing }) {
  return (
    <section className="bg-ink-warm px-6 py-16 text-sand">
      <div className="mx-auto max-w-3xl">
        <h2 className="t-title text-3xl text-sand">{c.accumulateHeading}</h2>
        <p className="gloss mt-2 max-w-[60ch] text-lg text-sand-70">{c.accumulateSub}</p>
        <dl className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {c.accumulate.map(a => (
            <div key={a.label} className="rounded-card border border-on-dark-line px-3 py-4 sm:px-4">
              <dt className="whitespace-nowrap font-vn text-2xl font-extrabold tracking-[-0.03em] text-sand sm:text-3xl">{a.stat}</dt>
              <dd className="gloss mt-1 text-[15px] text-sand-70">{a.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function Faq({ c, freeLessons }: { c: Landing; freeLessons: number }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="t-title text-3xl">{c.faqHeading}</h2>
      <dl className="mt-8 divide-y divide-sand">
        {c.faqs.map(f => (
          <div key={f.q} className="py-5">
            <dt className="t-title text-xl">{f.q}</dt>
            <dd className="gloss mt-2 max-w-[65ch] text-[16px]">{fill(f.a, freeLessons, c.locale)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function Closing({ c, freeLessons }: { c: Landing; freeLessons: number }) {
  return (
    <section className="bg-cream-warm px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="t-title text-3xl sm:text-4xl">{c.closingHeading}</h2>
        <p className="gloss mx-auto mt-3 max-w-[50ch] text-lg">{c.closingBody}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn-red">{c.ctaPrimary}</Link>
          <Link href="/pricing" className="btn-quiet">{fill(c.pricingHeading, freeLessons, c.locale)}</Link>
        </div>
        <p className="meta mt-4">{fill(c.pricingBody, freeLessons, c.locale)}</p>
      </div>
    </section>
  )
}

/** SoftwareApplication plus FAQPage, so both the page and an LLM can quote it. */
export function LandingJsonLd({ c, base, freeLessons }: { c: Landing; base: string; freeLessons: number }) {
  const data = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'Vietnamese Buddy', url: `${base}${c.path}`,
      applicationCategory: 'EducationalApplication', operatingSystem: 'Web',
      description: fill(c.metaDescription, freeLessons, c.locale), inLanguage: c.locale,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: fill(c.pricingHeading, freeLessons, c.locale) },
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: c.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: fill(f.a, freeLessons, c.locale) } })),
    },
  ]
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
