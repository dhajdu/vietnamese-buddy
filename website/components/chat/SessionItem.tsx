// components/chat/SessionItem.tsx
'use client'
import { useState } from 'react'
import { useChatStore } from '@/lib/chat/store'
import { useDeleteSession, useRenameSession } from '@/lib/chat/queries'
import type { ChatSession } from '@/lib/chat/queries'

interface Props {
  session: ChatSession
  isActive: boolean
}

export function SessionItem({ session, isActive }: Props) {
  const setActive = useChatStore(s => s.setActiveSession)
  const deleteSession = useDeleteSession()
  const renameSession = useRenameSession()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(session.title)

  function confirmRename() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== session.title) {
      renameSession.mutate({ id: session.id, title: trimmed })
    }
    setIsRenaming(false)
  }

  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${
        isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
      }`}
      onClick={() => setActive(session.id)}
    >
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onBlur={confirmRename}
          onKeyDown={e => {
            if (e.key === 'Enter') confirmRename()
            if (e.key === 'Escape') setIsRenaming(false)
          }}
          className="flex-1 bg-transparent text-sm outline-none border-b border-gray-400"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate text-sm">{session.title}</span>
      )}

      <div
        className="hidden group-hover:flex items-center gap-1"
        onClick={e => e.stopPropagation()}
      >
        <button
          title="Rename"
          onClick={() => setIsRenaming(true)}
          className="rounded p-1 text-xs hover:bg-gray-300"
        >
          ✏️
        </button>
        <button
          title="Delete"
          onClick={() => deleteSession.mutate(session.id)}
          className="rounded p-1 text-xs hover:bg-red-100 text-red-600"
        >
          🗑️
        </button>
      </div>
    </button>
  )
}
