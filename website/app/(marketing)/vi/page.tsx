// app/(marketing)/vi/page.tsx — the Vietnamese landing page.
import type { Metadata } from 'next'
import { getOptionalUser } from '@/lib/auth/guards'
import { BASE_URL, SITE_NAME } from '@/lib/seo/metadata'
import { VI } from '@/lib/marketing/content'
import { loadSample } from '@/lib/marketing/sample'
import { Hero, Contrast, Steps, Sample, Accumulate, Faq, Closing, LandingJsonLd } from '@/components/marketing/Sections'

export const metadata: Metadata = {
  title: { absolute: VI.titleTag },
  description: VI.metaDescription,
  keywords: VI.keywords,
  alternates: { canonical: `${BASE_URL}/vi`, languages: { 'en-US': BASE_URL, 'vi-VN': `${BASE_URL}/vi` } },
  openGraph: { title: SITE_NAME, description: VI.lede, url: `${BASE_URL}/vi`, type: 'website', locale: 'vi_VN' },
}

export default async function LandingViPage() {
  const user = await getOptionalUser()
  const lesson = loadSample(VI.sampleFile)
  const signedIn = Boolean(user)
  return (
    <div lang="vi">
      <LandingJsonLd c={VI} base={BASE_URL} />
      <Hero c={VI} signedIn={signedIn} />
      <Contrast c={VI} />
      <Steps c={VI} />
      <Sample c={VI} lesson={lesson} />
      <Accumulate c={VI} />
      <Faq c={VI} />
      <Closing c={VI} signedIn={signedIn} />
    </div>
  )
}
