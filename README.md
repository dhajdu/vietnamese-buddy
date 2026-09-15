# Vietnamese Buddy

A web app for learning conversational Southern Vietnamese, one real situation a day. You describe what you expect to talk about ("asking a coworker to dinner", "talking to a Grab driver"). The app writes a lesson in Ho Chi Minh City Vietnamese, turns it into flashcards with a Southern voice, and adds every word to one vocabulary store with a streak.

Start with [`CLAUDE.md`](./CLAUDE.md). It opens with the map: design tokens, component reference, domain logic, database, and ship flow. The app lives in [`website/`](./website) (Next.js 16, Supabase, Tailwind v4).

## Run locally

```bash
cd website
cp .env.local.example .env.local   # the authoritative env list: Supabase, AI model, optional FPT.AI voice
npx supabase link --project-ref <project-ref>
npx supabase db push
npm run dev
```

In Supabase, enable the Email provider and allow `http://localhost:3000/auth/callback` as a redirect. On an empty account, Home offers a button to load the bundled sample lessons, so the app works before an AI key is set. From the CLI: `npx tsx --env-file=.env.local scripts/seed.ts you@example.com`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

## Ship

Branch, PR, merge to `main`, and Vercel auto-deploys. Nobody pushes to `main` directly.
