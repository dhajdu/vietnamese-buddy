// app/(marketing)/page.tsx — the English landing page.
import type { Metadata } from 'next'
import { BASE_URL, SITE_NAME } from '@/lib/seo/metadata'
import { EN } from '@/lib/marketing/content'
import { loadSample } from '@/lib/marketing/sample'
import { getSettings } from '@/lib/billing/entitlement'
import { createAdminClient } from '@/lib/supabase/admin'
import { Hero, Contrast, Steps, Sample, Accumulate, Faq, Closing, LandingJsonLd } from '@/components/marketing/Sections'

// Static, and rebuilt at most every five minutes so an admin change to the free allowance shows up.
export const revalidate = 300

export const metadata: Metadata = {
  // The title tag is keyword-led; the brand name lives in the H1 and the schema.
  title: { absolute: EN.titleTag },
  description: EN.metaDescription.replace('{freeWord}', 'One').replace('{lessonWord}', 'lesson'),
  keywords: EN.keywords,
  alternates: { canonical: BASE_URL, languages: { 'en-US': BASE_URL, 'vi-VN': `${BASE_URL}/vi` } },
  openGraph: { title: SITE_NAME, description: EN.lede, url: BASE_URL, type: 'website' },
}

export default async function LandingPage() {
  const settings = await getSettings(createAdminClient())
  const freeLessons = settings.freeLessonsPerWeek
  const lesson = loadSample(EN.sampleFile)
  return (
    <>
      <LandingJsonLd c={EN} base={BASE_URL} freeLessons={freeLessons} />
      <Hero c={EN} freeLessons={freeLessons} />
      <Contrast c={EN} />
      <Steps c={EN} />
      <Sample c={EN} lesson={lesson} />
      <Accumulate c={EN} />
      <Faq c={EN} freeLessons={freeLessons} />
      <Closing c={EN} freeLessons={freeLessons} />
    </>
  )
}
