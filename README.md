# Vietnamese Buddy

Brief one-paragraph description of what this project does and who it serves.

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

Apply the starter migrations (chat, notifications, subscriptions):

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

### 2 · Run locally

```bash
cd website
npm run dev
```

### 3 · Vercel (deploy)

```bash
cd website
npx vercel link          # create/link the Vercel project
npx vercel env pull      # or add the .env.local vars in the Vercel dashboard
git push                 # every push to main auto-deploys
```

Set the same env vars in the Vercel dashboard (Project → Settings →
Environment Variables), with `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_APP_URL`
pointed at the production domain.

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
