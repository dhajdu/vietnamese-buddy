// components/auth/LoginForm.tsx
'use client'
import { useForm } from '@tanstack/react-form'
import { loginWithEmail } from '@/lib/auth/actions'
import { useState } from 'react'

/** `next` is an already-validated /app path to return to after signing in. */
export function LoginForm({ next }: { next?: string }) {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const fd = new FormData()
      fd.set('email', value.email)
      fd.set('password', value.password)
      if (next) fd.set('next', next)
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
        {(field) => {
          const err = field.state.meta.errors[0]
          return (
            <div>
              <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-body">Email</label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${field.name}-error` : undefined}
                className="input"
              />
              {err && (
                <p id={`${field.name}-error`} className="mt-1 text-xs text-err-ink">{err}</p>
              )}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="password" validators={{ onChange: ({ value }) => !value ? 'Password is required' : undefined }}>
        {(field) => {
          const err = field.state.meta.errors[0]
          return (
            <div>
              <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-body">Password</label>
              <input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${field.name}-error` : undefined}
                className="input"
              />
              {err && (
                <p id={`${field.name}-error`} className="mt-1 text-xs text-err-ink">{err}</p>
              )}
            </div>
          )
        }}
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

      <p className="text-center text-sm text-body">
        No account? <a href="/signup" className="font-semibold text-ink underline">Sign up</a>
      </p>
    </form>
  )
}
