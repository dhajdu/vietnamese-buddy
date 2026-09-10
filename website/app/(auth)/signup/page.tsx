// app/(auth)/signup/page.tsx
import { getOptionalUser } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/SignupForm'

export default async function SignupPage() {
  const user = await getOptionalUser()
  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>
        <SignupForm />
      </div>
    </div>
  )
}
