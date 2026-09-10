// app/(auth)/login/page.tsx
import { getOptionalUser } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const user = await getOptionalUser()
  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  )
}
