// components/app/ToneTag.tsx
import type { Tone } from '@/lib/ai/schema'
const CLS: Record<Tone, string> = {
  casual: 'bg-ok-bg text-ok-ink', warm: 'bg-amber-bg text-amber-ink', playful: 'bg-pink-bg text-pink-ink',
  polite: 'bg-info-bg text-info-ink', professional: 'bg-info-bg text-info-ink', direct: 'bg-paper text-body',
}
export function ToneTag({ tone }: { tone?: Tone }) {
  if (!tone) return null
  return <span className={`tone ${CLS[tone]}`}>{tone}</span>
}
