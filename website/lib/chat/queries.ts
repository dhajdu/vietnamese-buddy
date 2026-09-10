// lib/chat/queries.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useChatStore } from './store'
import type { UIMessage } from 'ai'

export interface ChatSession {
  id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

export function useSessions(): UseQueryResult<ChatSession[]> {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetch('/api/sessions').then(r => r.json()),
  })
}

export function useSessionMessages(
  sessionId: string | null
): UseQueryResult<UIMessage[]> {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () =>
      fetch(`/api/sessions/${sessionId}/messages`).then(r => r.json()),
    enabled: !!sessionId,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  const setActive = useChatStore(s => s.setActiveSession)
  return useMutation({
    mutationFn: (model: string) =>
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      }).then(r => r.json()),
    onSuccess: (session: ChatSession) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setActive(session.id)
    },
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useRenameSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
