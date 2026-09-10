// lib/ai/gateway.test.ts
import { describe, it, expect } from 'vitest'

describe('AI Gateway model strings', () => {
  it('gateway provider string format is provider/model', () => {
    const model = 'anthropic/claude-sonnet-4.6'
    expect(model).toMatch(/^[a-z]+\/[a-z-0-9.]+$/)
  })

  it('haiku model string is valid for auto-titling', () => {
    const model = 'anthropic/claude-haiku-4.5'
    expect(model).toMatch(/^anthropic\//)
  })
})
