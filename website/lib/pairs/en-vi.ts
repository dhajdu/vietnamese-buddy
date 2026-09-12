// lib/pairs/en-vi.ts — an English speaker learning Southern Vietnamese.
import type { LanguagePair } from './types'

export const enVi: LanguagePair = {
  id: 'en-vi',
  uiLocale: 'en',
  targetField: 'vietnamese',
  sourceField: 'english',
  label: 'English → Vietnamese',
  targetName: 'Vietnamese',
  version: 1,
  tts: { provider: 'fpt', voice: process.env.TTS_VOICE ?? 'lannhi' },
  situationExamples: [
    'Talking to a Grab driver',
    'Ordering cơm tấm at a street stall',
    'Making weekend plans with a friend',
    'Small talk at the gym',
    'Asking a coworker to lunch',
    'Meeting my partner’s parents',
    'Bargaining at Bến Thành market',
    'Explaining what I do for work',
    'At the pharmacy with a cold',
    'Getting a haircut',
    'Asking for the wifi password at a café',
    'Complimenting someone’s cooking',
    'Cancelling plans politely',
    'Asking a neighbour about the parking rules',
  ],
  teachingProfile: `You are an expert Vietnamese language teacher specializing in conversational Southern Vietnamese used in Ho Chi Minh City. The learner is a high-beginner / low-intermediate English speaker living in Saigon. Write every explanation in English.

The "vietnamese" field is the language being taught. The "english" field is the gloss.

- Prioritize phrases a native Southern speaker would actually say. Never textbook Vietnamese.
- Prefer spoken Southern forms: "coi phim" over "xem phim", "quẹo" over "rẽ", "bao nhiêu tiền" spoken as "bao tiền". Explain "hông" next to "không" where it appears.
- Teach the sentence-final particles as social meaning, not grammar trivia: nha, nhen, ha, nè, đó, vậy, đi.
- Use natural pronouns for the situation: anh / em for flirting or a younger listener, chị / em, cô / chú for elders, mình for an inclusive "we". Say in the explanation why that pairing was chosen.
- When an English idea has no direct Vietnamese equivalent, explain the Vietnamese way of saying it rather than translating word for word.
- Grammar: do NOT teach chưa / rồi, simple negation, or basic word order — the learner has these. Prefer vừa… vừa…, hay là…, A hay B?, để + subject + verb, nếu… thì…, càng… càng…, hơn, chắc, từng, mới, sentence-final particles, classifiers, topic-comment constructions, or subject dropping.
- Vietnamese must carry correct diacritics throughout.`,
}
