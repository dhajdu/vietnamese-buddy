# Vietnamese Buddy — Project Instructions

App name in the UI is **Vietnamese Daily**. A situation-driven conversational Southern Vietnamese tutor. Plan and wireframes: `docs/plans/build-plan.md`, `docs/plans/wireframes.html`.

## Map (read first)
- **Design tokens**: `website/app/globals.css` (CSS variables + Tailwind `@theme`). Documented in `docs/brand/DESIGN.md`. Never invent a hex.
- **Component reference**: `website/components/app/` (StatTiles, LessonList, ReviewSession, StatusToggle, Nav). Copy these rather than hand-rolling.
- **Domain logic**: `website/lib/` — `ai/` (schema, prompt, generate), `lessons/` (pipeline, actions, queries), `vocabulary/` (normalize), `flashcards/`, `activity/` (streak).
- **Database**: `website/supabase/migrations/20260910000000_vietnamese_daily.sql`. Supabase project `xdztfwmiangsepxfqjyt`. Apply with `npx supabase db push` from `website/`.
- **Seed lessons**: `website/data/seed-lessons/*.json`, validated by `LessonSchema`. Load via the Home empty-state button or `npx tsx --env-file=.env.local scripts/seed.ts <email>`.
- **Env**: `website/.env.local.example` is the authoritative list.
- **Ship**: branch → PR → merge to `main` → Vercel auto-deploys. Nobody pushes to `main` directly.

## Stack
- Next.js 16 App Router, TypeScript strict, Tailwind v4 (`website/`)
- Supabase (Postgres + Auth email/password, RLS on every table)
- Vercel AI SDK `generateObject` + Zod; provider from `AI_MODEL` (default `anthropic/claude-opus-5`; `openai/…` also supported)
- Vitest (`npm test` in `website/`)

## Rules
- AI calls, service-role key, and all writes stay server-side (Server Actions in `lib/**/actions.ts`).
- Every Supabase call checks `error` before touching `data`.
- Vocabulary dedupe is exact match on `normalizeVietnamese()`; diacritics are kept.
- Streak math uses the profile timezone (default Asia/Ho_Chi_Minh) via `localDate()`. Never UTC.
- Regenerations create a new lesson row with `parent_lesson_id`; originals are never edited.

<!-- BEGIN: AGENT-DELEGATION (managed by infiniteleverage skills — do not delete this block) -->
## Agent delegation (auto-routing)

When you receive a request, **delegate to the right specialist agent** before doing the work yourself. The 4 agents and their triggers:

| Agent | Delegate when the request involves… |
|---|---|
| **product-manager** | roadmap, vision, epics, daily plan, project-status.html, scope changes, approval triage, stakeholder updates |
| **developer** | writing/changing code, fixing bugs, refactoring, scaffolding pages, API endpoints, Supabase migrations, env-vars wiring, **publishing posts to the live site** |
| **qa** | testing, regression checks, browser matrix, accessibility, QA plans, "verify this works" |
| **devops** | CI/CD, deployments, secret management, infra escalations, Vercel/GitHub workflow issues |

**Delegation rules:**
1. Pick exactly **one** agent per turn — don't run two in parallel unless the operator explicitly says so.
2. If a request spans agents (e.g., "build it *and* verify it"), call them **in sequence**: developer → qa.
3. If unclear which agent fits, **ask the operator** before assuming.
4. Cross-cutting engineering rules live in `.claude/rules/global-engineering.md` — every agent honors them.
5. Project-level persona overrides for each agent live in `agents/<name>/context/persona.md` — read these on first invocation.
6. Trigger phrases: `@product-manager`, `@developer`, etc. — but auto-route even without the `@` when intent is clear.
<!-- END: AGENT-DELEGATION -->

## Folder conventions
See `FOLDER-STRUCTURE.md` at the project root for the canonical structure every project follows. Agents MUST honor it — do not invent new top-level folders.
