// components/chat/ChatLayout.tsx
'use client'
import { SessionSidebar } from './SessionSidebar'
import { ChatWindow } from './ChatWindow'

export function ChatLayout() {
  return (
    <div className="flex h-screen">
      <SessionSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  )
}
