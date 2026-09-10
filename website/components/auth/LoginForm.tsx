// components/auth/LoginForm.tsx
'use client'
import { useForm } from '@tanstack/react-form'
import { loginWithEmail } from '@/lib/auth/actions'
import { useState } from 'react'

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const fd = new FormData()
      fd.set('email', value.email)
      fd.set('password', value.password)
      const result = await loginWithEmail(fd)
      if (result?.error) setServerError(result.error)
    },
  })

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-4"
    >
      {serverError && (
        <p role="alert" className="alert">
          {serverError}
        </p>
      )}

      <form.Field name="email" validators={{ onChange: ({ value }) => !value ? 'Email is required' : undefined }}>
        {(field) => (
          <div>
            <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-body">Email</label>
            <input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
              className="input"
            />
            {field.state.meta.errors[0] && (
              <p className="mt-1 text-xs text-err-ink">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password" validators={{ onChange: ({ value }) => !value ? 'Password is required' : undefined }}>
        {(field) => (
          <div>
            <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-body">Password</label>
            <input
              id={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
              className="input"
            />
            {field.state.meta.errors[0] && (
              <p className="mt-1 text-xs text-err-ink">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={s => s.isSubmitting}>
        {(isSubmitting) => (
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-red w-full"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-stone">
        No account? <a href="/signup" className="font-semibold text-red hover:underline">Sign up</a>
      </p>
    </form>
  )
}
