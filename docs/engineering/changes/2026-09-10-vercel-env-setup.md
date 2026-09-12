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


## 2026-09-12 — Stripe products created (Talent Edge LLC)

Account `acct_1RPj3URouu1ZL9vs`, confirmed as **Talent Edge LLC** before writing.

| Object | Id | Amount |
|---|---|---|
| Product | `prod_VFN1WA4VCK80f1` | Vietnamese Buddy Pro |
| Price, monthly | `price_1UEsHlRouu1ZL9vsWrEyInbX` | $9.99 / month |
| Price, annual | `price_1UEsHlRouu1ZL9vsrwOMFw0r` | $79 / year |

Both ids are stored in the `plans` table, not in env, because a Stripe Price is
immutable and admin needs to be able to point at a new one without a deploy.
`plans.monetised` is **false** for both directions, so nothing is on sale yet.
Flip it in `/admin/settings` after a checkout has been verified.

Still outstanding, and blocking a real checkout test:
- `STRIPE_PUBLISHABLE_TEST_KEY` and `STRIPE_SECRET_TEST_KEY` from the Talent
  Edge dashboard, Developers → API keys with test mode on.
- `STRIPE_WEBHOOK_TEST_SECRET` from `stripe listen --forward-to
  localhost:3000/api/stripe/webhook`.
- `STRIPE_WEBHOOK_SECRET` from the live endpoint at
  `https://www.vietnamese-buddy.com/api/stripe/webhook`, created once the code
  is deployed.
