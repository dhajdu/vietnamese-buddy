# Vietnamese Buddy — language pairs, freemium, admin and launch

Turning a working one-directional app into a two-sided product that can be found, tried, and paid for.

- Owner: Dave Hajdu
- Date: 12 Sep 2026, revised the same day for language pairs
- Status: PR 1 merged. §2 assumption approved 12 Sep.
- HTML twin: `docs/plans/2026-09-12-freemium-and-marketing.html`
- Builds on: `docs/plans/build-plan.md`, `docs/brand/DESIGN.md`

## 1. What changed in this revision

The app now runs in both directions: an English speaker learning Southern Vietnamese, and a Vietnamese speaker learning English. That is not a flashcard toggle. It reshapes the plan, so pairs land before anything that touches money.

**Most of the app does not care.** The data model, the generate-validate-save pipeline, vocabulary dedupe, flashcards, streaks, admin, freemium mechanics and Stripe plumbing are all language-neutral. So is the design system. That is why this is affordable.

**Four things flip mechanically:** the language layer of the prompt, the interface language, the typographic roles (the target language is always the hero), and the speech provider, since FPT.AI only speaks Vietnamese.

**One thing is new content work.** The `en-vi` profile encodes what an English speaker needs to hear about Saigon speech. The `vi-en` profile needs the mirror: dropped final consonants, missing plural *s* and past-tense *-ed*, articles, the *th* sounds, word stress, "I very like it". Different expertise, and the one pair whose quality Dave can verify end to end.

## 2. The business assumption (approved 12 Sep)

The two directions are not the same business.

| | `en-vi` English → Vietnamese | `vi-en` Vietnamese → English |
|---|---|---|
| Competition | almost none | ELSA Speak, Duolingo, many local apps |
| ELSA Pro, one year | — | 495,000 VND, about $19 |
| ELSA Premium, one year | — | 799,000 VND, about $30 |
| Viable annual price | $79 | $20 to $30 |
| Marketing | English SEO, Google | Vietnamese SEO, Facebook and Zalo |
| Payment | Stripe, fine | Stripe is weak; MoMo, ZaloPay, VNPay dominate |

Stripe is the blocker, not price. Most Vietnamese consumers do not hold an international card, so charging them properly means a second payment rail, not a second number.

**Decision:** ship both pairs, monetise `en-vi` only, and let `vi-en` run on the free tier while we learn whether those users show up. At four cents a lesson that is cheap, it defers the payment-rail problem entirely, and Vietnamese users who like it are a referral channel into the paid side.

Reversing this is a data change, not a redesign: prices are stored per pair from day one so the Vietnamese side can be switched on later without touching code.

## 3. The numbers

Priced at **$9.99 a month and $79 a year** for `en-vi`. Duolingo Super is $7.99, Praktika $10, Busuu $12.49, Babbel $17.95, Speak $18, Pimsleur $19.95. A specialist prices with the specialists, not below the free-tier generalist.

Cost per lesson, measured against the live prompt and a real generated lesson at 1,800 input and about 3,800 output tokens including thinking:

| Model | Cost per lesson |
|---|---|
| Claude Opus 5 | $0.10 |
| Claude Sonnet 5 (now the default) | $0.04 |

**Monthly at $9.99**, less Stripe fees of 2.9% + 30¢, nets **$9.40**:

| Learner | Lessons/mo | Opus cost | Opus margin | Sonnet cost | Sonnet margin |
|---|---|---|---|---|---|
| Light, 2 a week | 9 | $0.90 | $8.50 | $0.36 | $9.04 |
| Daily, the intended pattern | 30 | $3.00 | $6.40 | $1.20 | $8.20 |
| Heavy, 3 a day | 90 | $9.00 | $0.40 | $3.60 | $5.80 |
| At a 5/day cap | 150 | $15.00 | **-$5.60** | $6.00 | $3.40 |

**Annual at $79** nets $76.41, or **$6.37 a month**. A daily user leaves $3.37 on Opus and $5.17 on Sonnet; at a 3/day cap Opus loses $2.63 while Sonnet earns $2.77.

Break-even is 94 lessons a month on Opus and 235 on Sonnet for the monthly plan; 64 and 159 for annual.

Shipped in PR 1: Sonnet 5 as the default, and the daily cap cut from 20 to 3. One situation a day is the premise, so three is already triple the intended use, and it is the only cap solvent on either model.

A free `vi-en` learner at 3 lessons a week costs about 52 cents a month on Sonnet. That is the entire cost of the §2 decision.

Voice is not in these numbers. FPT bills per character, a lesson is about 1,200 Vietnamese characters, synthesised once and cached forever, so it is a one-time cost per lesson. Confirm the rate when the service is activated.

## 4. Ground truth (verified 12 Sep, after PR 1)

- Six screens at `/`, `/lessons`, `/flashcards`, `/vocabulary`, `/progress`, all behind auth in `proxy.ts`. No public page except login and signup.
- `profiles` holds id, display name, timezone, created date. No email, no role, no plan, no pair.
- `lib/ai/prompt.ts` is one string mixing teaching stance with Southern Vietnamese specifics. `lib/ai/generate.ts` reads `AI_MODEL` and branches on `anthropic` and `openai`.
- `LessonSchema` has an optional `tone` per phrase. The three seed lessons are tagged.
- Voice runs on the browser fallback because FPT.AI still answers 403. The code is correct; the account needs Text-to-Speech switched on.
- Stripe is not installed. Talent Edge live keys are in `.env.local`; **the test keys and webhook secrets are not in edge8-web and must come from the Stripe dashboard.**
- Scaffold leftovers (`app/chat`, `api/sessions`, `api/notifications`, `api/upload`) are unused. Their own cleanup PR, not in scope.

## 5. Architecture

### 5.1 Language pairs

A pair is a code module, not a database row. Prose that needs a native speaker's review belongs in git, where a diff and a pull request are the review tools, and where a version number can be stamped on every lesson it produced.

```
lib/pairs/
  types.ts        LanguagePair interface
  en-vi.ts        English speaker → Southern Vietnamese   (today's product)
  vi-en.ts        Vietnamese speaker → American English   (new)
  index.ts        registry, getPair(id), PAIRS
```

Each pair exports:

| Field | Purpose |
|---|---|
| `id` | `en-vi` or `vi-en` |
| `uiLocale` | which dictionary the interface uses |
| `targetLanguage`, `sourceLanguage` | display names |
| `teachingProfile` | the language layer of the prompt: register, dialect, what learners get wrong, grammar to prefer and avoid |
| `situationExamples` | Home suggestion chips, in the source language |
| `tts` | provider and voice id, or null |
| `version` | bumped whenever the profile text changes |

The prompt splits in two. `lib/ai/stance.ts` holds what a lesson is and never changes between pairs: real situations, explain tone and social meaning, one grammar pattern slightly above level, the hard counts, return the schema. The pair supplies the rest. `userPrompt()` composes stance, then profile, then the learner's situation.

### 5.2 Interface language

Six screens, so a typed dictionary beats a framework. `lib/i18n/en.ts` and `lib/i18n/vi.ts` export the same keyed object, with the type derived from the English one so a missing Vietnamese key is a compile error. The locale comes from the pair, not the browser.

Typography roles swap with the pair. Be Vietnam Pro is the hero face for `en-vi` and the caption face for `vi-en`; Playfair the reverse. Both already carry Vietnamese subsets, so this is a class swap, not a font change.

### 5.3 Data model

`profiles` gains `email`, `is_admin`, `stripe_customer_id`, and `pair` (default `en-vi`).

`lessons` and `vocabulary` gain `pair`. Vocabulary uniqueness becomes **`(user_id, pair, normalized)`**, so a learner using both directions keeps two stores. Every list, count and streak query filters by the active pair.

`app_settings`, one row: `free_lessons_per_week`, `paid_lessons_per_day`, `ai_provider`, `ai_model`. Admin-writable only.

`plans`, one row **per pair**: `pair`, `stripe_price_monthly`, `stripe_price_annual`, `monetised boolean`. `vi-en` ships with `monetised = false`, which is the §2 decision expressed as data.

`subscriptions`, one row per user: Stripe ids, status, plan, period end, cancel flag, `comped`. Entitlement is derived, never stored.

`stripe_events` for webhook idempotency. `model_tests` for the admin model harness.

### 5.4 Routes

Marketing moves to the root, the app moves under `/app`.

| Today | After |
|---|---|
| nothing public | `/` English landing, `/vi` Vietnamese landing, `/pricing` |
| `/` | `/app` |
| `/lessons` and the rest | `/app/lessons` and the rest |
| none | `/admin`, gated |
| auth gate on everything | gate on `/app/*` and `/admin/*` only |

The root page is the one Google indexes and the one an ad lands on. It should be static, fast and identical for everyone, which rules out swapping it by auth cookie.

## 6. The pull requests

### PR 1 — Rename, drop Regenerate, Sonnet 5 — merged

Vietnamese Daily became Vietnamese Buddy. Regenerate removed and `regenerateLesson` became `adjustLesson`, which now requires a note. Shared `Generating` progress card. Sonnet 5 default, daily cap 3.

### PR 2 — Language pairs

The big one, and everything downstream depends on its shape.

- `lib/pairs/` registry with both pairs, and `lib/ai/stance.ts` split out of the prompt.
- `lib/i18n/` with English and Vietnamese dictionaries.
- Migration: `pair` on profiles, lessons and vocabulary; vocabulary uniqueness re-keyed; existing rows backfilled to `en-vi`.
- Every query filters by pair: entitlement, streak, vocabulary counts, lesson lists.
- A pair switcher in the app header writing `profiles.pair`, plus the choice at signup.
- Typography roles driven by the pair.
- The `vi-en` teaching profile written and reviewed, three `vi-en` seed lessons, tone-tagged.
- English speech: FPT stays for Vietnamese; `vi-en` gets an English voice behind the same `getAudioUrl` interface, cached in the same bucket keyed by voice.

*Done when:* an account can switch direction and get a correct lesson in either, the interface follows the pair, vocabulary from the two directions never collide, and both voices play.

**Three days.**

### PR 3 — Route split

Move `app/(app)/*` under `/app`, update every link and redirect, invert the proxy so public is the default, point the auth callback at `/app`, and add placeholder pages at `/`, `/vi` and `/pricing` so routing is provable before the copy exists.

*Done when:* signed out, `/` returns 200 and `/app` redirects to login; signed in, `/app` renders Today.

**Half a day.**

### PR 4 — Freemium gate

`getEntitlement(db, userId)` returns plan, week usage, both limits, and whether the next lesson is allowed, with the week starting Monday in the learner's timezone. `createLesson` calls it first and returns an upgrade prompt rather than a generic error. Home shows the remaining allowance and an upsell once the week is spent.

**Adjust becomes pro-only** on a monetised pair. On free it renders locked and opens the upgrade sheet; on pro it spends one lesson from the daily cap, because it is a full-price generation. On an unmonetised pair everyone is free, so Adjust follows the free rule.

*Done when:* a free account gets exactly the configured number each week, Adjust is locked on free and works on pro, a comped account is unlimited to the daily cap, and changing the setting in the database changes behaviour with no deploy.

**One day.**

### PR 5 — Admin

`requireAdmin()` as the first statement of every admin page and action. Three screens.

**Users.** Every signup with email, joined, pair, plan, lessons, words, streak, last active. Search and sort. Server-rendered with the service-role client behind the guard.

**One learner.** Their lessons and vocabulary counts, comp and un-comp buttons, a link to their Stripe customer.

**Settings**, in four parts. *Limits*: free per week, paid per day. *Pricing*: per pair, two dropdowns listing live Prices pulled from the Talent Edge account, plus the monetised switch. *Discount codes*: read-only list of active promotion codes with percentage, redemptions and expiry, since Stripe already owns creating them. *Model*: provider, model and a Test button.

**The model picker** is a dropdown of known-good options, with a custom string behind an advanced toggle and a warning, because generation needs reliable structured output and many models cannot do it. Providers are Anthropic, OpenAI and **OpenRouter**, whose provider package matches the installed AI SDK 7 and Zod 4, so it is one dependency and a third branch in `generate.ts`.

**Test model** runs one golden situation for a chosen pair through the selected model without touching learner data, then shows the lesson, whether it passed the schema, latency, tokens and cost per lesson, and writes a `model_tests` row so two models can be compared. Nothing changes for learners until you save. Expect most open-weight models to fail on structured output or on Vietnamese diacritics; the harness says which in about a minute.

Security notes for review: the service-role client never enters a client component, every action re-checks the guard, admin routes carry `noindex`, and a non-admin gets a 404 rather than a redirect that confirms the route exists.

**Two days.**

### PR 6 — Stripe

Lazy client copied from the edge8-web pattern: live key in production, test key otherwise. Two products in **Talent Edge LLC**, $9.99 a month and $79 a year, with Price ids stored in `plans` rather than env.

Checkout reads the active Price for the learner's pair, refuses if the pair is not monetised, and sets `allow_promotion_codes` so discount codes work. The webhook verifies the signature against the raw body and is idempotent through `stripe_events`, handling checkout completed, subscription updated, subscription deleted and payment failed. The portal route hands cancellation and card updates to Stripe.

Test mode first, end to end, with the Stripe CLI forwarding to localhost. **Blocked on the Talent Edge test keys**, which are not in edge8-web.

*Done when:* a test card takes a free account to pro, a promotion code visibly reduces the total, cancelling flips `cancel_at_period_end`, and entitlement follows both ways.

**Two days.**

### PR 7 — Marketing

Two landing pages sharing one set of components: `/` in English for `en-vi`, `/vi` in Vietnamese for `vi-en`. Eight sections each: hero with the free call to action; the problem shown as textbook language beside what people actually say; three steps with the real interface; **a real lesson rendered from a seed file**, not a mock-up; what accumulates over thirty days; pricing read live from `plans` so it cannot drift from Stripe, replaced by "free while in beta" on the unmonetised pair; five FAQ questions as schema; closing call to action.

Plus `noindex` on the app and admin, a sitemap of public routes only, and JSON-LD for the application and the FAQ.

**Three days.**

## 7. The SEO lens, applied

From the Edge8 brand profile, applied rather than described. Two pages means two keyword sets.

**English page.** "Vietnamese Buddy" is a brand term and belongs in the H1 and schema, not the title tag.

| Keyword | Why it is winnable |
|---|---|
| learn conversational Vietnamese *(primary)* | Intent matches; the head term is owned by Duolingo and Pimsleur |
| Southern Vietnamese lessons | Long tail, almost no dedicated competition |
| how to speak Vietnamese in Ho Chi Minh City | Question format wins AI Overviews, matches expats who convert |
| Vietnamese phrases for daily life | Fits the situation-based structure |

- Title tag: `Learn Conversational Southern Vietnamese — Daily Situation-Based Lessons`
- H1: `Learn the Vietnamese people actually speak in Saigon`
- Meta: keyword first, benefit, hook.

**Vietnamese page.** Head terms like *học tiếng Anh* are owned by ELSA and the schools, so go long tail and situational: *học tiếng Anh giao tiếp hàng ngày*, *luyện nói tiếng Anh theo tình huống*, *cách nói tiếng Anh tự nhiên*.

Both pages: five internal links minimum with descriptive anchors, clean one-sentence entity definitions so a language model can quote them, and FAQ schema answering the five questions a learner would actually ask.

## 8. Sequencing and effort

| PR | Work | Days |
|---|---|---|
| 1 | Rename, Regenerate, Sonnet | done |
| 2 | Language pairs | 3 |
| 3 | Route split | 0.5 |
| 4 | Freemium gate | 1 |
| 5 | Admin | 2 |
| 6 | Stripe | 2 |
| 7 | Marketing, two pages | 3 |
| | **Remaining** | **11.5 days** |

PR 2 is the dependency for everything: pricing, limits and marketing all key off the pair. PR 3 can go before or after it. PR 7 shares no files with 5 and 6, so it can be written alongside them.

## 9. Risks

| Risk | Mitigation |
|---|---|
| The `vi-en` profile teaches unnatural English or bad Vietnamese explanations | Both halves are verifiable here, which is not true of any other pair. Ten golden situations reviewed before it ships. |
| Sonnet 5 lessons are worse than Opus 5 | The PR 5 harness measures it on real situations. Reverting is one setting. |
| Pair filtering missed in one query, so counts leak across directions | One helper does every scoped read; the vocabulary unique index makes collisions impossible at the database level. |
| Live Stripe keys leak | Keys only in `.env.local` and Vercel; test mode until a full cycle passes. |
| Admin exposes other learners' data | Guard first everywhere, service-role server-only, 404 for non-admins, reviewed as its own PR. |
| Vietnamese users arrive and cannot pay | That is the §2 decision working as designed: they are free until a payment rail exists. |
| Route split 404s a signed-in user | Grep every link and redirect, walk all screens signed in before merge. |

## 10. Open items

1. **Stripe test keys** for Talent Edge. Not in edge8-web, needed before PR 6 can be verified.
2. **FPT Text-to-Speech activation.** Still 403. Voice runs on the browser fallback until it is switched on.
3. **English voice provider** for `vi-en`. Google, Azure, OpenAI and ElevenLabs all work; OpenAI is one fewer account.
4. **Free tier size**, currently 3 lessons a week, per pair and configurable from day one.
5. **Trial.** Not planned. Seven days of full access converts better than a permanent free tier but needs a card.

## 11. Not in this plan

Teams and gifting, coupon creation UI, proration screens, dunning beyond Stripe's own, referral mechanics, a third language pair, Vietnamese domestic payment rails, and the scaffold leftovers, which deserve their own small cleanup.
