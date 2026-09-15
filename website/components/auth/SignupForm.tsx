// components/auth/SignupForm.tsx
'use client'
import { useForm } from '@tanstack/react-form'
import { signupWithEmail } from '@/lib/auth/actions'
import { checkoutPath } from '@/lib/auth/validate'
import { useState } from 'react'

export function SignupForm({ plan }: { plan?: string }) {
  const [serverError, setServerError] = useState<string | null>(null)
  // Someone who picked a plan but already has an account keeps that choice through sign-in.
  const checkout = checkoutPath(plan)

  const form = useForm({
    defaultValues: { email: '', password: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      if (value.password !== value.confirmPassword) {
        setServerError('Passwords do not match')
        return
      }
      const fd = new FormData()
      fd.set('email', value.email)
      fd.set('password', value.password)
      if (plan) fd.set('plan', plan)
      // Read at submit, not render, so server and client HTML match. The action validates it.
      fd.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
      const result = await signupWithEmail(fd)
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
              <input id={field.name} name={field.name} type="email" autoComplete="email" autoCapitalize="none" inputMode="email"
                value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
                aria-invalid={Boolean(err)} aria-describedby={err ? `${field.name}-error` : undefined}
                className="input"
              />
              {err && <p id={`${field.name}-error`} className="mt-1 text-xs text-err-ink">{err}</p>}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="password" validators={{ onChange: ({ value }) => value.length < 8 ? 'Min 8 characters' : undefined }}>
        {(field) => {
          const err = field.state.meta.errors[0]
          return (
            <div>
              <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-body">Password</label>
              <input id={field.name} name={field.name} type="password" autoComplete="new-password"
                value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
                aria-invalid={Boolean(err)} aria-describedby={err ? `${field.name}-error` : undefined}
                className="input"
              />
              {err && <p id={`${field.name}-error`} className="mt-1 text-xs text-err-ink">{err}</p>}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="confirmPassword">
        {(field) => (
          <div>
            <label htmlFor={field.name} className="mb-1 block text-sm font-semibold text-body">Confirm password</label>
            <input id={field.name} name={field.name} type="password" autoComplete="new-password"
              value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
              className="input"
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={s => s.isSubmitting}>
        {(isSubmitting) => (
          <button type="submit" disabled={isSubmitting}
            className="btn-red w-full">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-stone">
        Already have an account? <a href={checkout ? `/login?next=${encodeURIComponent(checkout)}` : '/login'} className="font-semibold text-red hover:underline">Sign in</a>
      </p>
    </form>
  )
}
