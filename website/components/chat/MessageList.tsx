// components/chat/MessageList.tsx
'use client'
import { useEffect, useRef } from 'react'
import type { ChatStatus, UIMessage } from 'ai'
import { MessageBubble } from './MessageBubble'
import { StreamingIndicator } from './StreamingIndicator'

// status comes directly from useChat
interface Props {
  messages: UIMessage[]
  status: ChatStatus
}

export function MessageList({ messages, status }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  // Track whether user is near the bottom
  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distanceFromBottom < 50
  }

  // Auto-scroll when messages change — only if near bottom
  useEffect(() => {
    const el = containerRef.current
    if (!el || !isNearBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto flex flex-col gap-3 p-4"
    >
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {status === 'streaming' && <StreamingIndicator />}
    </div>
  )
}
