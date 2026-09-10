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
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <form.Field name="email" validators={{ onChange: ({ value }) => !value ? 'Email is required' : undefined }}>
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium mb-1">Email</label>
            <input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.state.meta.errors[0] && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password" validators={{ onChange: ({ value }) => !value ? 'Password is required' : undefined }}>
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium mb-1">Password</label>
            <input
              id={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.state.meta.errors[0] && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={s => s.isSubmitting}>
        {(isSubmitting) => (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-gray-500">
        No account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
      </p>
    </form>
  )
}
