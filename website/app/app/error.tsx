// app/app/error.tsx: anything a learner page throws lands here, inside the app shell with its nav.
'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <div className="card space-y-3 px-5 py-8 text-center">
        <h1 className="t-title text-2xl">Something went wrong</h1>
        <p className="gloss text-[15px]">This page didn&rsquo;t load. Try again, or go back to Today.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button type="button" onClick={() => retry()} className="btn-red">Try again</button>
          <Link href="/app" className="btn-quiet">Back to Today</Link>
        </div>
      </div>
    </div>
  )
}
