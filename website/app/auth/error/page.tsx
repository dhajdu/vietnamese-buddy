// app/auth/error/page.tsx
import Link from 'next/link'
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="t-title text-2xl">That link didn&rsquo;t work</h1>
        <p className="t-gloss text-[15px]">It may have expired or already been used. Request a new one.</p>
        <Link href="/login" className="btn-red">Back to sign in</Link>
      </div>
    </div>
  )
}
