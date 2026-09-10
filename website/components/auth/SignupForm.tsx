// components/auth/SignupForm.tsx
'use client'
import { useForm } from '@tanstack/react-form'
import { signupWithEmail } from '@/lib/auth/actions'
import { useState } from 'react'

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null)

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
        <p role="alert" className="rounded-md border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
          {serverError}
        </p>
      )}

      <form.Field name="email" validators={{ onChange: ({ value }) => !value ? 'Email is required' : undefined }}>
        {(field) => (
          <div>
            <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-ink-2">Email</label>
            <input id={field.name} type="email" value={field.state.value}
              onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {field.state.meta.errors[0] && <p className="mt-1 text-xs text-warn">{field.state.meta.errors[0]}</p>}
          </div>
        )}
      </form.Field>

      <form.Field name="password" validators={{ onChange: ({ value }) => value.length < 8 ? 'Min 8 characters' : undefined }}>
        {(field) => (
          <div>
            <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-ink-2">Password</label>
            <input id={field.name} type="password" value={field.state.value}
              onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {field.state.meta.errors[0] && <p className="mt-1 text-xs text-warn">{field.state.meta.errors[0]}</p>}
          </div>
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {(field) => (
          <div>
            <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-ink-2">Confirm password</label>
            <input id={field.name} type="password" value={field.state.value}
              onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={s => s.isSubmitting}>
        {(isSubmitting) => (
          <button type="submit" disabled={isSubmitting}
            className="btn-primary w-full">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-ink-3">
        Already have an account? <a href="/login" className="text-accent hover:underline">Sign in</a>
      </p>
    </form>
  )
}
