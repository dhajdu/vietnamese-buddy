// app/(auth)/login/page.tsx
import { getOptionalUser } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const user = await getOptionalUser()
  if (user) redirect('/')

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">Vietnamese Daily</h1>
          <p className="text-sm text-ink-2">Sign in to continue.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
