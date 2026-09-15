// app/not-found.tsx: unknown URLs, plus every notFound() (a missing lesson, a non-admin on /admin).
import Link from 'next/link'
import { Wordmark } from '@/components/app/Wordmark'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-sm space-y-4 px-6 py-8 text-center">
        <div className="flex justify-center"><Wordmark dark={false} href="/" /></div>
        <h1 className="t-title text-2xl">That page isn&rsquo;t here</h1>
        <p className="gloss text-[15px]">The link may be old, or what it pointed to was deleted.</p>
        <Link href="/" className="btn-red">Go home</Link>
      </div>
    </div>
  )
}
