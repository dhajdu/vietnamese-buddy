// app/(marketing)/page.tsx — the English landing page.
import type { Metadata } from 'next'
import { getOptionalUser } from '@/lib/auth/guards'
import { BASE_URL, SITE_NAME } from '@/lib/seo/metadata'
import { EN } from '@/lib/marketing/content'
import { loadSample } from '@/lib/marketing/sample'
import { getSettings } from '@/lib/billing/entitlement'
import { createAdminClient } from '@/lib/supabase/admin'
import { Hero, Contrast, Steps, Sample, Accumulate, Faq, Closing, LandingJsonLd } from '@/components/marketing/Sections'

export const metadata: Metadata = {
  // The title tag is keyword-led; the brand name lives in the H1 and the schema.
  title: { absolute: EN.titleTag },
  description: EN.metaDescription.replace('{freeWord}', 'One').replace('{lessonWord}', 'lesson'),
  keywords: EN.keywords,
  alternates: { canonical: BASE_URL, languages: { 'en-US': BASE_URL, 'vi-VN': `${BASE_URL}/vi` } },
  openGraph: { title: SITE_NAME, description: EN.lede, url: BASE_URL, type: 'website' },
}

export default async function LandingPage() {
  const [user, settings] = await Promise.all([getOptionalUser(), getSettings(createAdminClient())])
  const freeLessons = settings.freeLessonsPerWeek
  const lesson = loadSample(EN.sampleFile)
  const signedIn = Boolean(user)
  return (
    <>
      <LandingJsonLd c={EN} base={BASE_URL} freeLessons={freeLessons} />
      <Hero c={EN} signedIn={signedIn} freeLessons={freeLessons} />
      <Contrast c={EN} />
      <Steps c={EN} />
      <Sample c={EN} lesson={lesson} />
      <Accumulate c={EN} />
      <Faq c={EN} freeLessons={freeLessons} />
      <Closing c={EN} signedIn={signedIn} freeLessons={freeLessons} />
    </>
  )
}
