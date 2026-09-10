'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  read_at: string | null
  action_url: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch('/api/notifications')
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json() as Promise<Notification[]>
}

async function markAsRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to mark notification as read')
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useNotifications(): UseQueryResult<Notification[]> {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 30_000,
  })
}

export function useUnreadCount(): number {
  const { data } = useNotifications()
  if (!data) return 0
  return data.filter((n) => n.read_at === null).length
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    // Optimistic update: set read_at immediately in the cache
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previous = queryClient.getQueryData<Notification[]>(['notifications'])

      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ) ?? [],
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      // Roll back on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['notifications'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
