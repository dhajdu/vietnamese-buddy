// lib/chat/queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useSessions, useCreateSession } from './queries'
import { act } from 'react'
import { useChatStore } from './store'

// Minimal wrapper
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
  }
  return Wrapper
}

describe('useSessions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    act(() => useChatStore.setState({ activeSessionId: null }))
  })

  it('fetches /api/sessions', async () => {
    const mockSessions = [{ id: 'session-1', title: 'New Chat' }]
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockSessions),
      ok: true,
    } as Response)

    const { result } = renderHook(() => useSessions(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSessions)
    expect(fetch).toHaveBeenCalledWith('/api/sessions')
  })
})

describe('useCreateSession', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    act(() => useChatStore.setState({ activeSessionId: null }))
  })

  it('POSTs to /api/sessions and sets activeSessionId on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ id: 'new-session', title: 'New Chat' }),
      ok: true,
    } as Response)
    // Second fetch for invalidation refetch
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve([]),
      ok: true,
    } as Response)

    const { result } = renderHook(() => useCreateSession(), {
      wrapper: makeWrapper(),
    })

    await act(async () => {
      result.current.mutate('anthropic/claude-sonnet-4.6')
    })

    await waitFor(() => result.current.isSuccess)
    expect(useChatStore.getState().activeSessionId).toBe('new-session')
  })
})
