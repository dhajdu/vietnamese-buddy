// components/chat/MessageBubble.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from './MessageBubble'
import type { UIMessage } from 'ai'

const userMsg: UIMessage = {
  id: '1',
  role: 'user',
  parts: [{ type: 'text', text: 'Hello world' }],
}

const assistantMsg: UIMessage = {
  id: '2',
  role: 'assistant',
  parts: [{ type: 'text', text: 'Hi there!' }],
}

describe('MessageBubble', () => {
  it('renders user message text', () => {
    render(<MessageBubble message={userMsg} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('applies user-bubble class for user messages', () => {
    const { container } = render(<MessageBubble message={userMsg} />)
    expect(container.firstChild).toHaveClass('user-bubble')
  })

  it('applies ai-bubble class for assistant messages', () => {
    const { container } = render(<MessageBubble message={assistantMsg} />)
    expect(container.firstChild).toHaveClass('ai-bubble')
  })
})
