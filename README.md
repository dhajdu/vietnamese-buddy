# Vietnamese Buddy

**Vietnamese Daily**: a web app for learning conversational Southern Vietnamese through daily, situation-based lessons. You type what you expect to talk about today ("asking a coworker to dinner", "talking to a Grab driver"), the app generates a lesson in real Ho Chi Minh City Vietnamese, turns it into flashcards, and rolls every word into one persistent vocabulary store with a streak. Plan: `docs/plans/build-plan.md`.

> Scaffolded with [Infinite Leverage](https://github.com/talentedgeai/infinite-leverage)
> (`/il-project`) — a 4-agent team lives in `.claude/`; say what you need and the
> right agent picks it up (see `CLAUDE.md`).

## Getting started

The scaffold already ran `create-next-app` into `website/` and made the first
commit. Three steps to a live site:

### 1 · Supabase (database + auth)

Create a project at [supabase.com](https://supabase.com), then:

```bash
cd website
cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>            # server-side only — never NEXT_PUBLIC
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANTHROPIC_API_KEY=<anthropic-key>           # server-side only
AI_MODEL=anthropic/claude-opus-5            # or openai/<model> with OPENAI_API_KEY
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
EOF
```

`website/.env.local.example` is the authoritative list. Apply the migrations (starter chat/notifications tables plus the Vietnamese Daily schema):

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Enable **Email** under Supabase → Authentication → Providers (email + password; confirmation emails link back to `/auth/callback`) and add `http://localhost:3000/auth/callback` plus `https://vietnamese-buddy.com/auth/callback` to the redirect allow-list.

### 2 · Run locally

```bash
cd website
npm run dev
```

Create an account with email and password (confirm via the emailed link), then sign in. On an empty account, Home offers a button to load the three bundled sample lessons (dinner, movie night, internship), so the app is usable before an API key is added. From the CLI:

```bash
npx tsx --env-file=.env.local scripts/seed.ts you@example.com
```

Tests: `npx vitest run`.

### 3 · Vercel (deploy)

```bash
cd website
npx vercel link          # create/link the Vercel project (root directory: website)
```

Set the same env vars in Vercel (Project → Settings → Environment Variables), with `NEXT_PUBLIC_SITE_URL` pointed at the production domain (`https://…`). Deploys happen on merge to `main` via PR; nobody pushes to `main` directly.

## How it works

1. You describe a situation on Home.
2. A Server Action calls the model with a strict JSON schema (`lib/ai/schema.ts`) and validates the result twice.
3. The lesson is saved; vocabulary is normalised (`lib/vocabulary/normalize.ts`) and deduped per user; flashcards are created (phrase deck + vocabulary deck, skipping words you already know).
4. You review cards. Know it / Review again update the card and the word.
5. Today's activity row is upserted in your local timezone and the streak is computed from it.

## Building features

Ask Claude Code from the repo root — the agent team routes the work
(`CLAUDE.md` has the table). Typical first moves:

- `@product-manager` + `pm-client-interview` — capture what you're building
- "add an epic for <feature>" — PM writes the spec, developer builds from it
- The `website/` starter kit already ships auth-ready Supabase clients, chat,
  notifications, markdown rendering, and vitest tests to build on.

## Folder structure

See `FOLDER-STRUCTURE.md` (canonical layout — agents honor it) and `CLAUDE.md`
(roles + workflows).
