// components/chat/ChatInput.tsx
'use client'
import { useRef } from 'react'

interface Props {
  onSubmit: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSubmit, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const value = textareaRef.current?.value.trim() ?? ''
    if (!value || disabled) return
    onSubmit(value)
    if (textareaRef.current) textareaRef.current.value = ''
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-white p-3 focus-within:ring-2 focus-within:ring-blue-500">
        <textarea
          ref={textareaRef}
          rows={1}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 resize-none bg-transparent text-sm outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <p className="mt-1 text-center text-xs text-gray-400">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
