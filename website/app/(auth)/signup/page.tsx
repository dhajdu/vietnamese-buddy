// app/(auth)/signup/page.tsx
import { getOptionalUser } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/SignupForm'

export default async function SignupPage() {
  const user = await getOptionalUser()
  if (user) redirect('/')

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="t-title text-3xl">Vietnamese Daily</h1>
          <p className="t-gloss text-[15px] italic">Create your account.</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
