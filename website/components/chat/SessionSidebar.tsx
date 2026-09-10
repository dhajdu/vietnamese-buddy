// components/chat/SessionSidebar.tsx
'use client'
import { useSessions, useCreateSession } from '@/lib/chat/queries'
import { useChatStore } from '@/lib/chat/store'
import { SessionItem } from './SessionItem'
import { DEFAULT_CHAT_MODEL } from '@/lib/chat/constants'

export function SessionSidebar() {
  const { data: sessions, isLoading } = useSessions()
  const createSession = useCreateSession()
  const activeId = useChatStore(s => s.activeSessionId)

  return (
    <aside className="flex flex-col h-full w-64 border-r border-gray-200 bg-gray-50">
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={() => createSession.mutate(DEFAULT_CHAT_MODEL)}
          disabled={createSession.isPending}
          className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {isLoading && (
          <p className="text-xs text-gray-400 px-2 py-1">Loading...</p>
        )}
        {sessions?.map(session => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={session.id === activeId}
          />
        ))}
        {!isLoading && sessions?.length === 0 && (
          <p className="text-xs text-gray-400 px-2 py-4 text-center">
            No chats yet. Create one above.
          </p>
        )}
      </div>
    </aside>
  )
}
