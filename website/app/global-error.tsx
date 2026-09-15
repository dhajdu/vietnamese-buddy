// app/global-error.tsx: only when the root layout itself fails. It replaces that
// layout, so it brings its own html, body and stylesheet.
'use client'
import './globals.css'

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-6">
        <title>Something went wrong · Vietnamese Buddy</title>
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="t-title text-2xl">Something went wrong</h1>
          <p className="gloss text-[15px]">Vietnamese Buddy couldn&rsquo;t load this page.</p>
          <button type="button" onClick={() => retry()} className="btn-red">Try again</button>
        </div>
      </body>
    </html>
  )
}
