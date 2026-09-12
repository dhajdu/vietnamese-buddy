// lib/ai/models.ts
/**
 * The models the admin picker offers, and what they cost.
 *
 * Curated rather than free-text because generation depends on `generateObject`,
 * which needs reliable structured output, and plenty of models cannot do it. A
 * custom spec is still allowed behind the advanced toggle in admin; it just
 * comes with a warning and no cost estimate.
 */
export interface KnownModel {
  spec: string
  label: string
  /** USD per million tokens. Null when we do not track the price. */
  inputPerMTok: number | null
  outputPerMTok: number | null
  note?: string
}

export const KNOWN_MODELS: KnownModel[] = [
  { spec: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5', inputPerMTok: 2, outputPerMTok: 10, note: 'Default. Best cost for quality here.' },
  { spec: 'anthropic/claude-opus-5', label: 'Claude Opus 5', inputPerMTok: 5, outputPerMTok: 25, note: 'Strongest, about 2.5× the cost.' },
  { spec: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', inputPerMTok: 1, outputPerMTok: 5, note: 'Cheapest Claude. Test quality before switching.' },
  { spec: 'openai/gpt-4.1', label: 'GPT-4.1', inputPerMTok: null, outputPerMTok: null },
  { spec: 'openrouter/qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B (OpenRouter)', inputPerMTok: null, outputPerMTok: null, note: 'Open weight. Often good at Vietnamese.' },
  { spec: 'openrouter/deepseek/deepseek-chat', label: 'DeepSeek Chat (OpenRouter)', inputPerMTok: null, outputPerMTok: null, note: 'Open weight. Check structured output.' },
  { spec: 'openrouter/meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (OpenRouter)', inputPerMTok: null, outputPerMTok: null, note: 'Open weight. Diacritics are the usual failure.' },
]

export function findModel(spec: string) {
  return KNOWN_MODELS.find(m => m.spec === spec) ?? null
}

/** Cost of one generation in USD, or null when the model's price is not tracked. */
export function estimateCost(spec: string, inputTokens: number, outputTokens: number): number | null {
  const m = findModel(spec)
  if (!m || m.inputPerMTok === null || m.outputPerMTok === null) return null
  return (inputTokens * m.inputPerMTok + outputTokens * m.outputPerMTok) / 1_000_000
}
