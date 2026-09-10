// components/chat/ChatWindow.tsx
'use client'
import { useChatStore } from '@/lib/chat/store'
import { EmptyState } from './EmptyState'
import { ChatWindowInner } from './ChatWindowInner'

export function ChatWindow() {
  const sessionId = useChatStore(s => s.activeSessionId)

  if (!sessionId) return <EmptyState />

  // key forces remount on session switch — prevents useChat state from
  // bleeding across sessions
  return <ChatWindowInner key={sessionId} sessionId={sessionId} />
}
