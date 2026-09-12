# Vietnamese Buddy — freemium, marketing site, and admin

Turning the working app into a product that can be found, tried, and paid for.

- Owner: Dave Hajdu
- Date: 12 Sep 2026
- Status: Stripe account decided (Talent Edge LLC); three smaller calls open (see §9)
- HTML twin: `docs/plans/2026-09-12-freemium-and-marketing.html`
- Builds on: `docs/plans/build-plan.md`, `docs/brand/DESIGN.md`

## 1. The numbers

Priced at **$9.99 a month and $79 a year**, decided 12 Sep after comparing the market. Duolingo Super is $7.99, Praktika $10, Busuu $12.49, Babbel $17.95, Speak $18, Pimsleur $19.95. A specialist tool prices with the specialists, not below the free-tier generalist.

Cost per lesson, measured against the live prompt and a real generated lesson at 1,800 input and about 3,800 output tokens including thinking:

| Model | Cost per lesson |
|---|---|
| Claude Opus 5 (what runs today) | $0.10 |
| Claude Sonnet 5 | $0.04 |

**Monthly plan at $9.99**, less Stripe fees of 2.9% + 30¢, nets **$9.40**:

| Learner | Lessons/mo | Opus cost | Opus margin | Sonnet cost | Sonnet margin |
|---|---|---|---|---|---|
| Light, 2 a week | 9 | $0.90 | $8.50 | $0.36 | $9.04 |
| Daily, the intended pattern | 30 | $3.00 | $6.40 | $1.20 | $8.20 |
| Heavy, 3 a day | 90 | $9.00 | $0.40 | $3.60 | $5.80 |
| At a 5/day cap | 150 | $15.00 | **–$5.60** | $6.00 | $3.40 |
| At today's 20/day cap | 600 | $60.00 | **–$50.60** | $24.00 | **–$14.60** |

**Annual at $79** nets $76.41, or **$6.37 a month**:

| Learner | Opus margin | Sonnet margin |
|---|---|---|
| Daily, 30/mo | $3.37 | $5.17 |
| At a 3/day cap, 90/mo | **–$2.63** | $2.77 |

Break-even lessons per month: **94 on Opus, 235 on Sonnet** for the monthly plan; **64 and 159** for annual.

**Three consequences:**

1. **Set the paid daily cap to 3, not 5 and certainly not 20.** The product's premise is one situation a day, so three is already triple the intended use, and it is the only cap that stays solvent on Opus. Configurable in admin either way.
2. **Move generation to Claude Sonnet 5** unless a quality test says otherwise. At $9.99 you no longer *need* it to be profitable at normal use, but it is the difference between an annual heavy user costing you money and earning you $2.77. PR 4 ships the test harness that makes this a measured decision rather than a guess.
3. **Free tier stays at 3 lessons per week**, which costs $1.30 a month on Opus and 52 cents on Sonnet against no revenue.

Voice is not in these numbers yet. FPT.AI bills per character and a lesson is about 1,200 Vietnamese characters, synthesised once and cached forever, so it is a one-time cost per lesson. Confirm the rate when the service is activated in PR 1 and fold it in.

Adjust is a full-price second generation, which is why §5 makes it pro-only and charges it against the daily cap.

## 2. Ground truth (verified 12 Sep 2026 against `main`)

- App lives at `/`, `/lessons`, `/flashcards`, `/vocabulary`, `/progress`. **Every route is behind auth** via `proxy.ts`; there is no public page except `/login` and `/signup`.
- `profiles` holds `id`, `display_name`, `timezone`, `created_at`. No email, no role, no plan.
- `createLesson` enforces `DAILY_LIMIT = 20` against `lessons` where `source = 'ai'` in the last 24 hours.
- Voice: `lib/voice/tts.ts`, `app/api/tts/route.ts`, `components/app/Speak.tsx`, the `audio` storage bucket, and `warmLessonAudio()` called from `lib/lessons/actions.ts`. **Re-tested 12 Sep: FPT.AI still returns 403**, so every play falls back to browser speech. The code is fine; the account needs the TTS service switched on.
- "Vietnamese Daily" appears in 13 files: the wordmark, SEO metadata, three auth pages, and the docs.
- Stripe is not installed. Scaffold leftovers (`app/chat`, `app/api/chat`, `api/sessions`, `api/notifications`, `api/upload`) are unused and untouched by this plan.

## 3. The one architectural decision

**Marketing moves to `/`; the app moves to `/app`.**

| | Today | After |
|---|---|---|
| Marketing | none | `/` and `/pricing`, public and static |
| App home | `/` | `/app` |
| Lessons, cards, words, streak | `/lessons` … | `/app/lessons` … |
| Admin | none | `/admin`, gated |
| Auth gate | everything | `/app/*` and `/admin/*` only |

Why not keep the app at `/` and swap by auth state: the root page is the one Google indexes and the one a paid ad lands on. It should be static, fast, and identical for everyone. Swapping content by cookie makes it dynamic, uncacheable, and awkward to A/B later.

A signed-in visitor hitting `/` sees the marketing page with "Continue learning →" instead of "Start free", rather than being bounced. That is one conditional in the header.

Cost: every internal `href` and `redirect` moves under `/app`, about 25 call sites, plus the auth callback default and the proxy matcher.

## 4. Data model additions

One migration. Three new tables, three new columns.

**`profiles`** gains:
- `email text` — backfilled and set by the signup trigger, so admin can list and search without touching `auth.users`
- `is_admin boolean not null default false` — set by hand in SQL for the first admin
- `stripe_customer_id text unique` — set on first checkout

**`app_settings`** — single row, `id` fixed to `1` by a check constraint:
- `free_lessons_per_week int not null default 3`
- `paid_lessons_per_day int not null default 3`
- `stripe_price_monthly text`, `stripe_price_annual text` — the active Stripe Price ids, chosen in admin
- `ai_provider text not null default 'anthropic'` — `anthropic | openai | openrouter`
- `ai_model text not null default 'claude-sonnet-5'`
- `updated_at`, `updated_by`
- RLS: readable by authenticated, writable only by admins.

Prices live here rather than in env because a Stripe Price is immutable: changing what you charge means creating a new Price and pointing at it. Storing the id in settings makes that a dropdown rather than a deploy, and existing subscribers stay on the Price they signed up to, which is the correct behaviour and gives you grandfathering for free.

**`model_tests`** — one row per admin model test: `provider`, `model`, `situation`, `passed`, `latency_ms`, `input_tokens`, `output_tokens`, `lesson_json`, `error`, `created_at`. This is what turns "try a cheaper model" into a decision you can look at.

**`subscriptions`** — one row per user:
- `user_id` pk → `auth.users`
- `stripe_subscription_id text unique`, `stripe_price_id text`
- `status text` — `trialing | active | past_due | canceled | incomplete`
- `plan text` — `monthly | annual`
- `current_period_end timestamptz`, `cancel_at_period_end boolean`
- `comped boolean default false` — admin grants free access without Stripe
- RLS: a user reads their own row; only the service role writes.

**`stripe_events`** — `id text primary key`, `type`, `received_at`. Webhook idempotency: insert first, skip if it conflicts.

Entitlement is derived, never stored: `plan = 'pro'` when a subscription row is `active`/`trialing` or `comped`, else `'free'`.

## 5. Workstreams

Six PRs, in order. Each is independently shippable.

### PR 1 — Rename to Vietnamese Buddy, fix the voice, drop Regenerate

**Rename:** wordmark, `lib/seo/metadata.ts` (`SITE_NAME`, description, keywords), OG image, three auth pages, README, CLAUDE.md, `docs/brand/DESIGN.md`. The Đ mark and the whole colour system stay. Leave the historical plan docs alone; they record what was true then.

**Voice stays, and needs to start working.** Re-tested 12 Sep: FPT.AI still answers `403 You cannot consume this service`, so every play in production is silently falling back to the browser's Northern-ish voice. The code is correct; the account is not provisioned. Two steps, neither of them code:

1. Activate the Text-to-Speech service on the FPT.AI console for this key, or subscribe to a TTS plan.
2. Confirm FPT's per-character price and add it to the unit economics in §1. A lesson is roughly 1,200 Vietnamese characters across phrases, examples and words, synthesised **once** and cached in the `audio` bucket forever, so it is a one-time cost per lesson rather than per play.

Until step 1 is done the fallback keeps the feature usable, so this does not block any other PR. Once it is done, verify a real `lannhi` mp3 lands in the bucket and plays.

**Remove Regenerate.** The button goes from `LessonActions`. The server action stays but is renamed `regenerateLesson` → `adjustLesson` and now requires a non-empty adjustment string, because a blind re-roll of the same situation was a full-price call that rarely produced a better lesson. Lesson actions become three: Review cards, Mark complete, Adjust.

Also in this PR, since they are one-line changes with real money attached: `AI_MODEL` to `anthropic/claude-sonnet-5` and `DAILY_LIMIT` to read `paid_lessons_per_day`.

*Done when:* the app says Vietnamese Buddy everywhere a user can see; Regenerate is gone; a generated lesson still validates; and either a real FPT mp3 plays or the fallback is confirmed working with the activation still outstanding.

**Half a day, plus whatever the FPT console takes.**

### PR 2 — Route split

Move `app/(app)/*` to `app/app/*`. Update every `href`, `redirect`, and `revalidatePath`. Change the proxy so `PUBLIC` becomes the default and only `/app` and `/admin` are gated. Point the auth callback at `/app`. Add `/pricing` and `/` as placeholder public pages so the routing is provable before the copy exists.

*Done when:* signed out, `/` returns 200 and `/app` redirects to login; signed in, `/app` renders Today and `/` renders the placeholder with "Continue learning".

**Half a day.**

### PR 3 — Freemium gate

- Migration for `app_settings` and `subscriptions`.
- `lib/billing/entitlement.ts`: `getEntitlement(db, userId)` returns `{ plan, lessonsThisWeek, weeklyLimit, dailyUsed, dailyLimit, canCreate, reason }`. Week starts Monday in the learner's timezone, reusing `localDate()`.
- `createLesson` calls it first and returns an upgrade prompt instead of a generic error.
- Home shows "2 of 3 free lessons left this week" under the input for free users, and an upsell card when the week is spent.
- **Adjust becomes pro-only.** On a free account the button renders with a lock and opens the upgrade sheet instead of the input. On a pro account it costs one lesson from the daily cap, since it is a full-price generation. `adjustLesson` re-checks entitlement server-side; the locked button is a courtesy, the guard is the rule.
- **Adjust gets the generating card.** Today it shows a single line of text while a 45-second call runs, which reads as a hang. Extract the progress card already used by `CreateLessonForm` into `components/app/Generating.tsx` — echoed input, animated bar, rotating status lines — and use it in both places. Adjust's lines name what is happening: "Rewriting the phrases with your note…", "Keeping the grammar pattern…", "Checking it still sounds Southern…".

*Done when:* a free account can create exactly the configured number in a week and sees a clear upgrade path on the next attempt; Adjust is locked on free and works on pro; the same progress card appears for both create and adjust; a comped account is unlimited to the daily cap; changing the setting in the database changes the behaviour without a deploy.

**One day.**

### PR 4 — Admin

- `requireAdmin()` in `lib/auth/guards.ts`, checked as the first statement of every admin page and action, matching the edge8-web rule.
- `/admin` — table of signups: email, joined, plan, lessons, words, current streak, last active. Search and sort. Server-rendered with the service-role client behind the guard.
- `/admin/users/[id]` — one learner: their lessons, their vocabulary counts, buttons to comp or un-comp access and to open their Stripe customer.
- `/admin/settings` — four groups, all writing `app_settings`:
  - **Limits.** Free lessons per week, paid lessons per day.
  - **Pricing.** Two dropdowns listing the live Prices from the Talent Edge Stripe account, fetched through the API and shown as "$9.99 / month · price_1Abc…". Pick the active monthly and annual. Changing them affects new checkouts only; a note on the screen says so.
  - **Discount codes.** Read-only list of active promotion codes with their percentage, redemption count and expiry, pulled from Stripe. Codes are created in the Stripe dashboard, which already has the whole feature; rebuilding it would be waste.
  - **Model.** Provider, model, and a **Test model** button. See below.

**The model picker.** A free-text model field is a foot-gun: generation depends on `generateObject`, which needs reliable structured output, and plenty of models cannot do it. So the field is a dropdown of known-good options, with a custom string behind an "advanced" toggle and a warning. Providers: Anthropic, OpenAI, and **OpenRouter**, which opens the door to open-weight models for testing. `@openrouter/ai-sdk-provider@3.0.0` matches the installed AI SDK 7 and Zod 4, so it is one dependency and a third branch in `lib/ai/generate.ts`.

**Test model** is the important half. It runs one golden situation through the selected provider and model without touching a learner's data, then shows the rendered lesson, whether it passed `LessonSchema`, latency, token counts and the computed cost per lesson, and writes a `model_tests` row. Two models can be compared side by side on the same situation. Nothing switches the live model except explicitly saving it, so you never change what learners get on a hunch.

Expect most open-weight models to fail on one of two axes: structured output, or Southern Vietnamese with correct diacritics. The harness is worth building precisely because it tells you which, in about a minute, per model.
- The first admin is set by hand: `update profiles set is_admin = true where email = 'dave@edge8.co';`

Security notes for review: the service-role client must never be imported into a client component; every action re-checks the guard rather than trusting the page; admin routes are excluded from the sitemap and get `robots: noindex`.

*Done when:* signed in as Dave, `/admin` lists every signup with live numbers; a non-admin gets a 404, not a redirect that confirms the route exists.

**Two days**, up from one and a half for the pricing, discount and model-test screens.

### PR 5 — Stripe

- `npm i stripe`. `lib/billing/stripe.ts` copied from the edge8-web pattern: lazy client, live key in production, test key otherwise.
- Products created in the **Talent Edge LLC** account: **Vietnamese Buddy Monthly, $9.99/month** and **Vietnamese Buddy Annual, $79/year**, a 34% saving worth stating plainly on the pricing page. The Price ids land in `app_settings`, not env, so admin can switch them later.
- `POST /app/api/checkout` — creates or reuses the Stripe customer, reads the active Price id from settings, opens a Checkout session with **`allow_promotion_codes: true`** so your discount codes work, and returns the URL. Codes themselves are created in the Stripe dashboard; nothing to build.
- `POST /api/stripe/webhook` — public, signature-verified, raw body, idempotent via `stripe_events`. Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- `POST /app/api/portal` — Stripe billing portal so cancellation and card updates need no UI of our own.
- `/app/billing` — current plan, renewal date, manage button.

Test mode first, end to end with the Stripe CLI forwarding webhooks to localhost. Live keys only once a test subscription has been created, cancelled, and reflected correctly in `subscriptions`.

*Done when:* a test card takes a free account to `pro` within seconds of checkout, a promotion code visibly reduces the total at checkout, cancelling in the portal flips `cancel_at_period_end`, and the entitlement follows in both directions.

**Two days.**

### PR 6 — Marketing site

One page at `/` plus `/pricing`, on the existing ĀRCA tokens. Neil Patel lens applied concretely in §6.

Sections, in order:
1. **Hero.** H1, one-line promise, "Start free — 3 lessons a week, no card" primary, "See a sample lesson" secondary. No hero image; the sample lesson is the visual.
2. **The problem.** Textbook Vietnamese versus what people actually say in Saigon. Three side-by-side pairs (`xem phim` / `coi phim`) — this is the differentiator and it should be visible in five seconds.
3. **How it works.** Three steps with the real interface: type a situation, get the lesson, review the cards.
4. **A real lesson**, rendered from an actual seed lesson, not a mock-up. Strongest trust signal available.
5. **What accumulates.** Vocabulary store, streak, history. Why day 30 is better than day 1.
6. **Pricing.** Free, Monthly $9.99, Annual $79 at 34% off. Card-free free tier stated plainly. The page reads the active prices from settings so it can never drift from what Stripe charges.
7. **FAQ.** Five questions, marked up as FAQ schema.
8. **Closing CTA.**

Also: `noindex` on `/app` and `/admin`, sitemap covering only public routes, JSON-LD for `SoftwareApplication` and `FAQPage`.

*Done when:* Lighthouse SEO 100, the page renders correctly at 375px, and the CTA reaches signup in one click.

**Two days.**

## 6. The Neil Patel lens, applied

Taken from the Edge8 brand profile's SEO lens and applied to this page rather than described.

**Keyword realism.** "Vietnamese Buddy" is a brand term and belongs in the H1 and schema, not the title tag. What a person actually types:

| Keyword | Why it is winnable |
|---|---|
| learn conversational Vietnamese (primary) | Intent matches the product; the head term "learn Vietnamese" is owned by Duolingo and Pimsleur |
| Southern Vietnamese lessons | Long tail, almost no dedicated competition, exactly what this is |
| how to speak Vietnamese in Ho Chi Minh City | Question format, wins AI Overviews, matches expats who will convert |
| Vietnamese phrases for daily life | Fits the situation-based structure |

**Title tag vs H1.** Split them, because the H1 has no searchable keyword.

- Title tag: `Learn Conversational Southern Vietnamese — Daily Situation-Based Lessons`
- H1: `Learn the Vietnamese people actually speak in Saigon`

**Meta description**, keyword first, benefit, hook: "Learn conversational Southern Vietnamese through daily lessons built around your real situations — ordering, dating, work, Grab rides. Three free lessons a week. No textbook Vietnamese."

**Intent to CTA.** Every keyword above belongs to someone who would start a free trial today, not to a browser researching languages.

**Links.** Five internal minimum: pricing, sample lesson, FAQ, signup, and the how-it-works anchor. Descriptive anchors, no "click here".

**FAQ schema**, the five questions an LLM would extract:
1. How is Southern Vietnamese different from Northern Vietnamese?
2. Can I learn Vietnamese without studying grammar first?
3. How much Vietnamese do I need to live in Ho Chi Minh City?
4. Is Vietnamese Buddy free?
5. What makes situation-based lessons better than a fixed curriculum?

**Entity definitions.** Clean, one-sentence definitions of Southern Vietnamese, situation-based learning, and spaced review, so an LLM can quote the page.

## 7. Sequencing and effort

| PR | Work | Days |
|---|---|---|
| 1 | Voice removal, rename, model and cap change | 0.5 |
| 2 | Route split | 0.5 |
| 3 | Freemium gate | 1 |
| 4 | Admin, incl. pricing, discounts, model test | 2 |
| 5 | Stripe | 2 |
| 6 | Marketing site | 2 |
| | **Total** | **8 days** |

PRs 1 and 2 are safe to ship immediately. PR 3 can ship before Stripe exists: the gate simply has nobody who can pay yet, which is the correct behaviour for a waitlist. PR 6 can be written in parallel with 4 and 5 since it shares no files.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Sonnet 5 lessons are noticeably worse than Opus 5 | Run the ten golden situations through both before switching; a native speaker marks each phrase. Reverting is one env var. |
| Live Stripe keys committed or leaked | Keys only in `.env.local` and Vercel; `.env.local.example` carries names and placeholders. Test mode until a full cycle passes. |
| Admin route exposes other learners' data | `requireAdmin()` as the first statement of every page and action, service-role client server-only, `noindex`, non-admins get 404. Reviewed as its own PR. |
| Route split breaks a link and 404s a signed-in user | Grep every `href` and `redirect`; walk all five screens signed in before merge. |
| Free tier gets farmed with throw-away emails | Accept for now. If it happens: require email confirmation (already on) and rate-limit signups by IP. |
| Marketing page ranks for nothing for months | Expected. SEO is the slow lane; the page's first job is converting paid and referral traffic. |

## 9. Decisions

1. ~~**Which Stripe account?**~~ **Decided 12 Sep: Talent Edge LLC** (`pk_live_51RPj3…` / `sk_live_51RPj3…`, with `STRIPE_SECRET_TEST_KEY` and both webhook secrets already in `edge8-web/.env.local`). Copy that block, not the AI Officer Institute one that follows it in the same file. The two products get created in the Talent Edge dashboard.
2. ~~**Pricing.**~~ **Decided 12 Sep: $9.99/month and $79/year**, with discount codes run through Stripe promotion codes. Both configurable in admin.
3. **Free tier size.** Plan assumes 3 lessons per week. Configurable from day one, so this is a starting point, not a commitment.
4. **Trial.** Not in this plan. A 7-day full-access trial converts better than a permanent free tier but costs about $0.28 per signup on Sonnet and needs a card. Worth a decision.

## 10. Not in this plan

Named so they do not creep in: teams or gifting, coupons and promo codes, annual-to-monthly proration UI, dunning emails beyond Stripe's own, referral mechanics, the multi-language work from the earlier conversation, and the scaffold leftovers (`app/chat`, `api/sessions`, `api/notifications`, `api/upload`) which should be deleted in a separate cleanup PR.
