// app/(auth)/login/page.tsx
import { getOptionalUser } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next } = await searchParams
  const user = await getOptionalUser()
  if (user) redirect(typeof next === 'string' && next.startsWith('/app') ? next : '/app')

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="t-title text-3xl">Vietnamese Buddy</h1>
          <p className="gloss text-[15px] italic">Sign in to continue.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
