// lib/chat/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from './store'
import { act } from 'react'

describe('useChatStore', () => {
  beforeEach(() => {
    act(() => useChatStore.setState({ activeSessionId: null }))
  })

  it('starts with null activeSessionId', () => {
    expect(useChatStore.getState().activeSessionId).toBeNull()
  })

  it('sets activeSessionId', () => {
    act(() => useChatStore.getState().setActiveSession('abc-123'))
    expect(useChatStore.getState().activeSessionId).toBe('abc-123')
  })

  it('clears activeSessionId', () => {
    act(() => useChatStore.getState().setActiveSession('abc-123'))
    act(() => useChatStore.getState().setActiveSession(null))
    expect(useChatStore.getState().activeSessionId).toBeNull()
  })
})
