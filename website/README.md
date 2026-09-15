# Vietnamese Buddy (website)

The Next.js app. Project facts, the design system map, and conventions live in [`../CLAUDE.md`](../CLAUDE.md). Read it first.

```bash
npm run dev        # local dev server
npm run lint       # eslint
npm run typecheck  # next typegen && tsc --noEmit
npm test           # vitest
```

Env vars: copy `.env.local.example` to `.env.local`.

Ship: branch, PR, merge to `main`, Vercel auto-deploys. Nobody pushes to `main` directly.
