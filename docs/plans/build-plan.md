# Vietnamese Daily — Build Plan

A situation-driven Vietnamese tutor for a high-beginner living in Ho Chi Minh City. Type what you expect to talk about today, get a lesson in real Southern Vietnamese, and let the vocabulary and streak accumulate into a curriculum you never had to pick.

- Owner: Dave Hajdu
- Date: 10 Sep 2026
- Status: Ready to build
- Stack: Next.js, TypeScript, Tailwind, Supabase, Vercel, OpenAI
- HTML twin: `docs/plans/build-plan.html`

## 1. Product principle

The app has no curriculum. The learner's day is the curriculum.

Every other Vietnamese app teaches a fixed sequence. This one asks one question each morning, "what situation do you want to practice today?", and generates a lesson for exactly that. The order of topics is whatever life in Saigon throws at the learner.

The long-term value comes from the second half: every phrase and word from those disconnected days lands in one persistent vocabulary store with a status, a streak keeps the habit alive, and flashcards turn today's lesson into tomorrow's recall.

**Language stance:** Southern, spoken, current. *coi phim* over *xem phim*. *hông* explained next to *không*. Particles (*nha, ha, nè, đó, vậy*) taught as social meaning. *anh / em* used when the situation calls for it. If the AI output reads like a textbook, the prompt is wrong.

## 2. The core loop

1. **Enter a situation.** Plain English, one text box.
2. **Generate the lesson.** Server-side call with a strict JSON schema, validated with Zod before saving.
3. **Save the lesson.** Full JSON in `lessons.lesson_json`, with title, situation, grammar topic denormalised.
4. **Extract and dedupe vocabulary.** Each item normalised and upserted into `vocabulary`. Duplicates link to the existing row.
5. **Create flashcards.** Phrase deck and vocabulary deck per lesson. Known words are skipped.
6. **Review cards.** Flip, Know it, Review again, Next. Updates card and linked vocabulary row.
7. **Update progress.** Today's `daily_activity` row upserted. Streak recomputed in Asia/Ho_Chi_Minh.
8. **Come back tomorrow.** Home shows streak, vocabulary count, review count, recent lessons.

Phases 1 to 3 build nothing outside this loop.

## 3. Stack and decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router (already scaffolded in `website/`), TypeScript strict | Server Actions keep AI calls and writes server-side. Vercel-native. |
| Styling | Tailwind v4, tokens in `globals.css` | Tokens defined once as CSS variables. |
| Database and auth | Supabase (Postgres, Auth, RLS) | Magic-link login. RLS on every table. |
| AI | OpenAI via Vercel AI SDK `generateObject` + Zod | Schema-enforced output plus local validation. Provider is one string. |
| Validation | Zod at every boundary | AI output, form input, seed JSON share `LessonSchema`. |
| Hosting | Vercel via PR merge to `main` | Fluid Compute, 300s timeout. |
| Timezone | Asia/Ho_Chi_Minh per user, defaulted | Local date derived server-side with `Intl.DateTimeFormat`. |

**Flag, once:** the spec names OpenAI. Wire it through the AI SDK provider abstraction so model choice is a single env var (`AI_MODEL=openai/gpt-4.1`).

## 4. Project structure

```
vietnamese-buddy/website/          (existing create-next-app scaffold)
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx               nav: Home · Lessons · Flashcards · Vocabulary · Progress
│   │   ├── page.tsx                 Home
│   │   ├── lessons/page.tsx         History
│   │   ├── lessons/[id]/page.tsx    Lesson view
│   │   ├── flashcards/page.tsx      Deck picker + review
│   │   ├── vocabulary/page.tsx      Search, filter, mark
│   │   └── progress/page.tsx        Stats + 30-day calendar
│   ├── auth/callback/route.ts
│   └── globals.css
├── components/
├── lib/
│   ├── ai/{prompt,schema,generate}.ts
│   ├── lessons/actions.ts
│   ├── vocabulary/{normalize,upsert}.ts
│   ├── flashcards/{create,actions}.ts
│   ├── activity/{streak,actions}.ts
│   └── supabase/{server,client,admin}.ts
├── supabase/migrations/0xx_vietnamese_daily.sql, seed.sql
├── data/seed-lessons/{dinner,movie,internship}.json
├── proxy.ts
├── .env.example
└── README.md
```

## 5. Data model

Six tables. RLS with `user_id = auth.uid()` on every user-owned table.

**profiles** — one per auth user via trigger. `timezone` (default Asia/Ho_Chi_Minh), `display_name`.

**lessons** — `id`, `user_id`, `situation`, `title`, `grammar_topic`, `lesson_json` (jsonb), `parent_lesson_id` (null; set for regenerations), `source` (`ai` | `seed`), `completed_at`, `created_at`.

**vocabulary** — `id`, `user_id`, `vietnamese`, `normalized` (unique on `(user_id, normalized)`), `english`, `status` (`new` | `learning` | `known`), `first_seen_at`, `last_reviewed_at`, `review_count`.

**lesson_vocabulary** — pk `(lesson_id, vocabulary_id)`. First linked lesson by `created_at` is the introducing lesson.

**flashcards** — `id`, `user_id`, `lesson_id`, `vocabulary_id` (null for phrase cards), `type` (`phrase` | `vocabulary`), `front`, `back` (jsonb `{english, explanation?}`), `status` (`new` | `review` | `known`), `review_count`, `last_reviewed_at`.

**daily_activity** — pk `(user_id, activity_date)` local date. `lesson_created`, `cards_reviewed` (int), `lesson_completed` (bool).

Indexes: `lessons (user_id, created_at desc)`, `vocabulary (user_id, status)`, `flashcards (user_id, status)`, `daily_activity (user_id, activity_date desc)`.

## 6. Lesson generation

**System prompt:** spec prompt verbatim, plus three guardrails: hard counts (10–15 phrases, 12–20 vocab, 3–5 examples); the grammar avoid/prefer lists, optionally with the learner's last five grammar topics; vocabulary must come from the phrases.

**Schema:**

```ts
const Phrase = z.object({ vietnamese: z.string().min(1), english: z.string().min(1), explanation: z.string().min(20) });
const Vocab = z.object({ vietnamese: z.string().min(1), english: z.string().min(1) });
export const LessonSchema = z.object({
  title: z.string().min(3).max(80),
  situation: z.string().min(3),
  phrases: z.array(Phrase).min(10).max(15),
  vocabulary: z.array(Vocab).min(12).max(20),
  grammar: z.object({
    title: z.string().min(3), pattern: z.string().min(2), explanation: z.string().min(40),
    examples: z.array(Phrase).min(3).max(5),
  }),
});
```

**generateLesson(situation):** reject empty or >500 chars; `generateObject` with schema, temperature 0.7, 60s abort; re-parse with `safeParse`; post-checks (dedupe vocab within lesson, strip punctuation, situation echoes input); retry once with the Zod error appended; plain error on second failure.

**createLesson action:** insert lesson → upsert vocabulary → join rows → flashcards → record activity → revalidate → redirect. Delete the lesson if a later step fails.

**Regenerate / Adjust:** both create a new row with `parent_lesson_id`. Originals never change. History nests variants.

## 7. Vocabulary and flashcards

**Normalisation:** NFC, lowercase, strip edge punctuation, collapse whitespace, trim. Diacritics kept (*ma / má / mà / mã* are different words). Bracketed glosses stripped before normalising.

**Upsert:** `insert … on conflict (user_id, normalized) do nothing returning id`, select on conflict, insert join row. Existing rows untouched. Returns count of genuinely new words.

**Flashcard creation:** one phrase card per phrase; one vocab card per vocabulary row that is new or not `known`.

**Review session:** decks are This lesson, All due, per-lesson. Order: review → new → known.

| Control | Card | Linked vocabulary |
|---|---|---|
| Flip | client only | |
| Know it | `known`, +1, reviewed now | `known`, +1, reviewed now |
| Review again | `review`, +1 | `learning`, +1 |
| Next | no change | |

Every Know it / Review again increments `daily_activity.cards_reviewed`.

**Vocabulary page:** search (vietnamese + english, diacritic-sensitive), filter All / New / Learning / Known, introducing lesson link, three-state status toggle. Header: "Vocabulary learned: 187 words · 132 known".

## 8. Streak and activity

```ts
export function localDate(tz = "Asia/Ho_Chi_Minh", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
```

`recordActivity(kind)` upserts today's row. `computeStreak(dates)` walks back from today or yesterday. Longest streak is the longest consecutive run. Total learning days is the row count. All computed on read. 30-day calendar is a 5×6 grid shaded by activity.

## 9. Screens

| Route | Contents |
|---|---|
| `/login` | Email field, Send magic link, confirmation state |
| `/` | Wordmark, question, large textarea with spec placeholder, Create Lesson, four stat tiles, recent lessons |
| `/lessons` | History: date, situation, grammar topic, phrases, new words; variants grouped |
| `/lessons/[id]` | Title, situation; Useful Phrases table, Vocabulary list, Grammar; actions: Review cards, Mark complete, Regenerate, Adjust |
| `/flashcards` | Deck picker, single card with flip + three buttons, session progress, end state |
| `/vocabulary` | Counter, search, filter, list with introducing lesson and status toggle |
| `/progress` | Seven stats and 30-day calendar |

Nav: top bar on desktop, five-item bottom bar on mobile.

## 10. Design system

Tokens in `app/globals.css` as CSS variables exposed through Tailwind `@theme`. No raw hex in components.

| Token | Light |
|---|---|
| bg | #F6F7F3 |
| surface | #FFFFFF |
| ink | #1B211C |
| ink-2 | #4A544C |
| accent | #1F6B4F |
| vietnamese | #8A4B12 |
| line | #DDE2DB |
| warn | #9A5B00 |

Type: **Be Vietnam Pro** for headings, Vietnamese, UI (built for Vietnamese diacritics). **Newsreader** for English body. **JetBrains Mono** for grammar pattern lines. Scale 13 · 15 · 17 · 20 · 24 · 30 · 40. Phrase row: Vietnamese 20, English 15, explanation 15 in ink-2.

Layout: 720px content width, 8px rhythm. Lesson sections are the only cards (1px line, 8px radius, no shadow). Stat tiles with tabular numbers. Flashcard 3:2, flip on click and Space. Dark theme from the same tokens. No emoji markers except the 🔥 streak.

## 11. Build phases

**Phase 1 — Foundation.** Use existing `website/` scaffold, add token map to root `CLAUDE.md`, replace placeholder `docs/brand/DESIGN.md` with section 10 tokens, Supabase schema + RLS + profile trigger, magic-link auth, tokens, nav, Home shell, three seed lessons run through the real pipeline, lesson page, Vercel deploy. *Done when you can log in on the Vercel URL and read all three sample lessons.*

**Phase 2 — The loop.** `lib/ai`, `createLesson` with rollback, normalise + upsert, flashcards, review session, `recordActivity`, `computeStreak`, live tiles, generation loading state. *Done when a fresh account completes loop steps 1–8.*

**Phase 3 — Memory.** History with variants, Regenerate and Adjust, Vocabulary page, Progress page with calendar, Mark complete. *Done when every Home, History, Vocabulary, Progress item in the spec exists.*

**Phase 4 — Polish and ship.** Mobile pass at 375px, dark theme, empty states, unit tests (normalize, streak incl. 23:30 ICT edge, schema vs seeds and malformed fixtures), `.env.example`, README, 20 generations/user/day limit. *Done when README works from a clean clone and the app is used for three consecutive days.*

## 12. Seed lessons

| Situation | Grammar | Flavour |
|---|---|---|
| Asking someone to dinner | *hay là…* | *Tối nay đi ăn hông?*, anh/em, *nha*, *nè* |
| Watching a movie at home or at the theater | *vừa… vừa…* | *coi phim*, *ở nhà hay ra rạp?*, *đó* |
| Two jobs + data analytics student, internship | *nếu… thì…* | polite-but-real, *làm hai việc*, *thực tập* |

Reviewed by a native Southern speaker before launch.

## 13. Acceptance criteria

- New user logs in by email, creates a lesson, sees it saved in under 30 seconds.
- Every lesson has 10–15 phrases, 12–20 vocab, one grammar section with 3–5 examples, or it is rejected.
- Two lessons sharing words produce no duplicate vocabulary rows.
- Know it on a vocab card marks the word known and it leaves future decks.
- Streak increments once per local day; 23:55 ICT then 00:05 ICT counts as two days.
- Regenerating leaves the original intact in History.
- No AI or service-role key reaches the browser bundle.
- Readable and operable at 375px and in dark mode.

## 14. Risks and decisions

| Risk | Mitigation |
|---|---|
| Model drifts Northern or textbook | Explicit Southern prompt with examples; "sounds textbook" flag on lesson page |
| Cost and latency | 20/day rate limit; single structured call |
| Dedupe misses near-variants | Accept; exact normalised match only |
| Streak vs learner's "today" | Timezone per user, all date maths in one server helper |
| Magic-link deliverability | Supabase default sender; custom SMTP later |

Decisions: AI SDK over raw OpenAI client; streak computed on read; regenerations are new rows; dedupe keeps diacritics; no cards for known words.

## 15. Not in the MVP

Spaced repetition scheduling, audio/TTS, social features and gamification, extra login providers, dialect toggle, hand-editing phrases, streak reminders.
