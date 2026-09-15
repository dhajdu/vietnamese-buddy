// app/(marketing)/vi/page.tsx — the Vietnamese landing page.
import type { Metadata } from 'next'
import { BASE_URL, SITE_NAME } from '@/lib/seo/metadata'
import { VI } from '@/lib/marketing/content'
import { loadSample } from '@/lib/marketing/sample'
import { getSettings } from '@/lib/billing/entitlement'
import { createAdminClient } from '@/lib/supabase/admin'
import { Hero, Contrast, Steps, Sample, Accumulate, Faq, Closing, LandingJsonLd } from '@/components/marketing/Sections'

// Static, and rebuilt at most every five minutes so an admin change to the free allowance shows up.
export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: VI.titleTag },
  description: VI.metaDescription.replace('{freeWord}', 'One').replace('{lessonWord}', 'lesson'),
  keywords: VI.keywords,
  alternates: { canonical: `${BASE_URL}/vi`, languages: { 'en-US': BASE_URL, 'vi-VN': `${BASE_URL}/vi` } },
  openGraph: { title: SITE_NAME, description: VI.lede, url: `${BASE_URL}/vi`, type: 'website', locale: 'vi_VN' },
}

export default async function LandingViPage() {
  const settings = await getSettings(createAdminClient())
  const freeLessons = settings.freeLessonsPerWeek
  const lesson = loadSample(VI.sampleFile)
  return (
    <div lang="vi">
      <LandingJsonLd c={VI} base={BASE_URL} freeLessons={freeLessons} />
      <Hero c={VI} signedIn={false} freeLessons={freeLessons} />
      <Contrast c={VI} />
      <Steps c={VI} />
      <Sample c={VI} lesson={lesson} />
      <Accumulate c={VI} />
      <Faq c={VI} freeLessons={freeLessons} />
      <Closing c={VI} signedIn={false} freeLessons={freeLessons} />
    </div>
  )
}
