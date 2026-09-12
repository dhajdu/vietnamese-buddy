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
| NEXT_PUBLIC_SITE_URL | https://www.vietnamese-buddy.com | https://vietnamese-buddy.vercel.app |

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


## 2026-09-12 — Stripe keys added to Vercel

`STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` (Talent Edge live) set for
**production and preview** via `vercel env add`. Needed because the pricing page
reads its amounts from Stripe; without a key it falls back to the hard-coded
$9.99 and $79 rather than failing, but the live figures are better.

Nothing is on sale: `plans.monetised` is false for both directions, so checkout
refuses. Turn it on in `/admin/settings` after a checkout has been verified with
test keys.


## 2026-09-12 — canonical URL moved to www

Production `NEXT_PUBLIC_SITE_URL` changed from `https://vietnamese-buddy.com` to
`https://www.vietnamese-buddy.com`.

Vercel serves the site from `www` and 308s the apex to it, so every canonical
tag, Open Graph URL, sitemap entry and auth redirect was pointing at a URL that
redirects. Harmless for a human, wasteful for a crawler, and a canonical that
redirects is a weak canonical.

The Supabase redirect allow-list already carries both hosts, so no change there.
