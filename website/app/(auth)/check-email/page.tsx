// app/(auth)/check-email/page.tsx
import Link from 'next/link'
export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="t-title text-2xl">Check your inbox</h1>
        <p className="gloss text-[15px]">We sent a confirmation link from Vietnamese Buddy. Open it to finish creating your account.</p>
        <Link href="/login" className="text-sm font-semibold text-red hover:underline">Back to sign in</Link>
      </div>
    </div>
  )
}
