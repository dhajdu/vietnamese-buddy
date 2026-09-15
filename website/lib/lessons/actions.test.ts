import { describe, it, expect, vi, beforeEach } from 'vitest'

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
// The service-role client: the reservation RPC, plus linking or releasing the ledger row.
const admin = vi.hoisted(() => ({
  rpc: vi.fn<(fn: string, args: Record<string, unknown>) => Promise<{ data: string | null; error: null }>>(
    async () => ({ data: 'R1', error: null }),
  ),
  released: vi.fn(),
  linked: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: admin.rpc,
    from: () => ({
      delete: () => ({ eq: async (_col: string, id: string) => { admin.released(id); return { error: null } } }),
      update: (row: unknown) => ({ eq: async (_col: string, id: string) => { admin.linked(id, row); return { error: null } } }),
    }),
  }),
}))
vi.mock('@/lib/billing/entitlement', () => ({
  getEntitlement: vi.fn(async () => ({
    canCreate: true, canAdjust: true, monetised: true,
    weeklyLimit: Infinity, lessonsThisWeek: 0, dailyLimit: Infinity, lessonsToday: 0,
  })),
  getSettings: vi.fn(async () => ({ aiProvider: 'anthropic', aiModel: 'claude-sonnet-5' })),
}))
vi.mock('@/lib/ai/generate', () => ({
  LessonGenerationError: class extends Error {},
  generateLesson: vi.fn(async () => ({ lesson: { phrases: [], vocabulary: [], grammar: { examples: [] } } })),
}))
vi.mock('./pipeline', () => ({ saveLesson: vi.fn(async () => ({ lessonId: 'L1' })) }))
vi.mock('@/lib/activity/actions', () => ({ recordActivity: vi.fn(async () => {}) }))
vi.mock('@/lib/voice/tts', () => ({ warmLessonAudio: vi.fn() }))

import { redirect } from 'next/navigation'
import { getEntitlement, type Entitlement } from '@/lib/billing/entitlement'
import { generateLesson, LessonGenerationError } from '@/lib/ai/generate'
import { saveLesson } from './pipeline'
import { recordActivity } from '@/lib/activity/actions'
import { t } from '@/lib/i18n'
import { createLesson } from './actions'

function situationForm() {
  const form = new FormData()
  form.set('situation', 'Talking to a Grab driver')
  return form
}

describe('createLesson', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('redirects to the lesson under /app once it is saved, and links the ledger row', async () => {
    await createLesson(null, situationForm())
    expect(admin.rpc).toHaveBeenCalledWith('reserve_lesson_generation', expect.objectContaining({
      p_user_id: 'U1', p_pair: 'en-vi', p_weekly_limit: null, p_daily_limit: null,
    }))
    expect(admin.linked).toHaveBeenCalledWith('R1', { lesson_id: 'L1' })
    expect(redirect).toHaveBeenCalledWith('/app/lessons/L1')
  })

  it('returns the weekly limit error without calling the model when the reservation is refused', async () => {
    vi.mocked(getEntitlement).mockResolvedValueOnce({
      canCreate: true, canAdjust: false, monetised: true,
      weeklyLimit: 1, lessonsThisWeek: 0, dailyLimit: 3, lessonsToday: 0,
    } as Entitlement)
    admin.rpc.mockResolvedValueOnce({ data: null, error: null })
    const result = await createLesson(null, situationForm())
    expect(admin.rpc).toHaveBeenCalledWith('reserve_lesson_generation', expect.objectContaining({ p_weekly_limit: 1, p_daily_limit: 3 }))
    expect(result).toEqual({ error: t('en').weeklyLimitReached, upgrade: true })
    expect(generateLesson).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('releases the reservation when generation fails', async () => {
    vi.mocked(generateLesson).mockRejectedValueOnce(new LessonGenerationError('The lesson came back malformed.'))
    const result = await createLesson(null, situationForm())
    expect(result).toEqual({ error: 'The lesson came back malformed.' })
    expect(admin.released).toHaveBeenCalledWith('R1')
    expect(saveLesson).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('still redirects when recording activity fails after the save', async () => {
    vi.mocked(recordActivity).mockRejectedValueOnce(new Error('record_activity failed'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await createLesson(null, situationForm())
    expect(admin.released).not.toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/app/lessons/L1')
  })

  it('rejects an empty situation before touching the database', async () => {
    const form = new FormData()
    form.set('situation', '   ')
    const result = await createLesson(null, form)
    expect(result).toHaveProperty('error')
    expect(admin.rpc).not.toHaveBeenCalled()
  })
})
