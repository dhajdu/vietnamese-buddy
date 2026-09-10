# Website — Next.js

This folder ships a **starter kit** — feature modules (chat, notifications, markdown rendering), Supabase migrations, and vitest tests — with **no `package.json`**. It is completed at bootstrap by merging a fresh `create-next-app` install underneath it:

```bash
# Scaffold Next.js in a temp dir — root-level app/, matching this starter kit
NEXT_TMP=$(mktemp -d)
npx create-next-app@latest "$NEXT_TMP/nextapp" \
  --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --yes
rm -rf "$NEXT_TMP/nextapp/.git" "$NEXT_TMP/nextapp/node_modules"

# Merge: create-next-app fills in gaps; starter-kit files always win
rsync -a --ignore-existing "$NEXT_TMP/nextapp/" website/
rm -rf "$NEXT_TMP"
```

See `il-project` SKILL.md Step 9 for the full workflow: the dependency install list, wiring `app/providers.tsx` (QueryClientProvider) into `app/layout.tsx`, and the `npm run build && npx vitest run` verification gate.

Do NOT run `create-next-app` directly into this folder (it refuses non-empty directories) and do NOT use `--src-dir` (the starter kit uses a root-level `app/` layout).

Structure after the merge:

```
website/
├── app/               ← App Router pages + API routes (chat, auth, sessions)
│   └── providers.tsx  ← QueryClientProvider — must be wired into app/layout.tsx
├── components/        ← chat/, dashboard/, markdown/, notifications/, editor/
├── lib/               ← auth/, chat/, supabase/, seo/, perf/, upload/
├── supabase/
│   └── migrations/    ← chat, notifications, subscriptions tables
├── docs/              ← per-module setup notes
├── public/
├── vitest.config.ts
└── vitest.setup.ts
```
