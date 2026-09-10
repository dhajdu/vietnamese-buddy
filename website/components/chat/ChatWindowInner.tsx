// components/chat/ChatWindowInner.tsx
'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useSessionMessages } from '@/lib/chat/queries'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { LoadingSkeleton } from './LoadingSkeleton'

interface Props {
  sessionId: string
}

export function ChatWindowInner({ sessionId }: Props) {
  const { data: initialMessages, isLoading } = useSessionMessages(sessionId)

  // Always call useChat — hooks cannot be conditional.
  // Pass initialMessages only once it's loaded; the key={sessionId} on ChatWindow
  // guarantees this component remounts on session switch, so stale state never bleeds.
  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { sessionId },
    }),
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} status={status} />
      <ChatInput
        onSubmit={(text) => sendMessage({ text })}
        disabled={status === 'streaming'}
      />
    </div>
  )
}
