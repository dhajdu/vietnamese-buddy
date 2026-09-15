import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/lib/auth/guards', () => ({ requireAuth: vi.fn(async () => ({ id: 'U1' })) }))
vi.mock('@/lib/supabase/server', () => {
  // One chainable query builder covers the profile lookup (.single) and the recent-grammar list (await).
  const q: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'limit']) q[m] = () => q
  q.single = async () => ({ data: { timezone: 'Asia/Ho_Chi_Minh', pair: 'en-vi', is_admin: false }, error: null })
  q.then = (resolve: (v: unknown) => void) => resolve({ data: [], error: null })
  return { createClient: vi.fn(async () => ({ from: () => q })) }
})
vi.mock('@/lib/billing/entitlement', () => ({
  getEntitlement: vi.fn(async () => ({ canCreate: true, canAdjust: true })),
  getSettings: vi.fn(async () => ({ aiProvider: 'anthropic', aiModel: 'claude-sonnet-5' })),
}))
vi.mock('@/lib/ai/generate', () => ({
  LessonGenerationError: class extends Error {},
  generateLesson: vi.fn(async () => ({ lesson: { phrases: [], vocabulary: [], grammar: { examples: [] } } })),
}))
vi.mock('./pipeline', () => ({ saveLesson: vi.fn(async () => ({ lessonId: 'L1' })) }))
vi.mock('@/lib/activity/actions', () => ({ recordActivity: vi.fn() }))
vi.mock('@/lib/voice/tts', () => ({ warmLessonAudio: vi.fn() }))

import { redirect } from 'next/navigation'
import { createLesson } from './actions'

describe('createLesson', () => {
  it('redirects to the lesson under /app once it is saved', async () => {
    const form = new FormData()
    form.set('situation', 'Talking to a Grab driver')
    await createLesson(null, form)
    expect(redirect).toHaveBeenCalledWith('/app/lessons/L1')
  })
})
