// app/(auth)/check-email/page.tsx
import Link from 'next/link'
export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="font-display text-xl font-bold">Check your inbox</h1>
        <p className="text-sm text-ink-2">We sent a confirmation link from Vietnamese Daily. Open it to finish creating your account.</p>
        <Link href="/login" className="text-sm text-accent hover:underline">Back to sign in</Link>
      </div>
    </div>
  )
}
