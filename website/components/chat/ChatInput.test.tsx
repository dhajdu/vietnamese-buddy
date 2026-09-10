// components/chat/ChatInput.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  it('calls onSubmit with trimmed text on Enter', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} disabled={false} />)

    await userEvent.type(screen.getByRole('textbox'), 'Hello world{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Hello world')
  })

  it('does not submit empty or whitespace-only input', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} disabled={false} />)

    await userEvent.type(screen.getByRole('textbox'), '   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables textarea when disabled=true', () => {
    render(<ChatInput onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('clears input after submit', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} disabled={false} />)
    const textarea = screen.getByRole('textbox')

    await userEvent.type(textarea, 'Hello{Enter}')
    expect(textarea).toHaveValue('')
  })
})
