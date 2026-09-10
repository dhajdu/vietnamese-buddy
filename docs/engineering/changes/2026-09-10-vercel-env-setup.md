# 2026-09-10 — Vercel environment variables set for vietnamese-buddy

Set via `vercel env add` (CLI, team `dave-hajdus-projects`, project `vietnamese-buddy`) for **production** and **preview**. Values come from `website/.env.local`; the authoritative key list is `website/.env.local.example`.

| Key | Production | Preview |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | project xdztfwmiangsepxfqjyt | same |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | set | same |
| SUPABASE_SECRET_KEY | set (server-only) | same |
| ANTHROPIC_API_KEY | set (server-only) | same |
| AI_MODEL | anthropic/claude-opus-5 | same |
| DEFAULT_TIMEZONE | Asia/Ho_Chi_Minh | same |
| NEXT_PUBLIC_SITE_URL | https://vietnamese-buddy.com | https://vietnamese-buddy.vercel.app |

Also set via the Vercel REST API: project **Root Directory = `website`**.

Still to do in dashboards (no API access from this machine):
- Supabase → Authentication → URL Configuration: Site URL `https://vietnamese-buddy.com`; redirect allow-list `http://localhost:3000/auth/callback`, `https://vietnamese-buddy.com/auth/callback`, `https://www.vietnamese-buddy.com/auth/callback`, `https://vietnamese-buddy.vercel.app/auth/callback`, `https://*-dave-hajdus-projects.vercel.app/auth/callback`.
- Domain `vietnamese-buddy.com` (+ www) is registered on Vercel and attached to the project; nameservers verified.
