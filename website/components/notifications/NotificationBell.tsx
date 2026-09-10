'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react' // TODO: replace with project design system icon
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUnreadCount } from '@/lib/notifications/queries'
import { NotificationList } from './NotificationList'

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: { user_id: string }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useUnreadCount()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)

  // ---------------------------------------------------------------------------
  // Realtime subscription — invalidate cache on INSERT for this user
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient()

    // Retrieve the current user once; subscription filter mirrors RLS
    let userId: string | null = null
    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null
    })

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: RealtimePayload) => {
          // Guard: only invalidate when the new row belongs to this user
          if (userId && payload.new.user_id === userId) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // ---------------------------------------------------------------------------
  // Close panel on outside click
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={panelRef} className="relative inline-block">
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <NotificationList onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
