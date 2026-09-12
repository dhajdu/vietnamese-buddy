// lib/ai/stance.ts
/**
 * What a lesson is. Identical for every language pair — the pair supplies the
 * language layer on top of this. Changing anything here changes every lesson in
 * every direction, so it moves slowly and deliberately.
 */
export const TEACHING_STANCE = `Generate practical language for the exact real-life situation provided, for a high-beginner / low-intermediate learner.

- Teach what a native speaker would actually say in that situation, not what a textbook would print.
- For every phrase, explain its tone, its social meaning, and why it is useful. The explanation is the lesson; a bare translation is not.
- Select one grammar concept that appears naturally in the situation and sits slightly above the learner's level. Explain the structure, what it means, and when native speakers reach for it.
- Avoid repetition between phrases. Each one should earn its place.
- Return structured JSON matching the schema exactly.

Hard requirements:
- 10 to 15 phrases. 12 to 20 vocabulary items. 3 to 5 grammar examples.
- Every vocabulary item is a reusable word or short expression that appears in the phrases or the grammar examples. No obscure words.
- Give every phrase a one-word "tone": casual, warm, direct, playful, polite, or professional.
- "situation" restates the learner's situation in one short sentence.`
