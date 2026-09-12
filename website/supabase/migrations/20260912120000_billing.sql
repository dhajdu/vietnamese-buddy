-- supabase/migrations/20260912120000_billing.sql
-- Settings, plans, subscriptions and the two supporting tables. One migration
-- rather than three, because they are all plain tables and the freemium, admin
-- and Stripe PRs all read from this set.
-- See docs/plans/2026-09-12-freemium-and-marketing.md §5.3.

-- ── app_settings: one row, admin-writable ───────────────────────────────────
create table app_settings (
  id int primary key default 1 check (id = 1),
  free_lessons_per_week int not null default 1 check (free_lessons_per_week between 0 and 100),
  paid_lessons_per_day int not null default 3 check (paid_lessons_per_day between 1 and 100),
  ai_provider text not null default 'anthropic',
  ai_model text not null default 'claude-sonnet-5',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users
);
insert into app_settings (id) values (1) on conflict do nothing;

alter table app_settings enable row level security;
create policy "settings readable by signed-in users" on app_settings for select to authenticated using (true);
create policy "settings writable by admins" on app_settings for update to authenticated
  using (exists (select 1 from profiles p where p.id = (select auth.uid()) and p.is_admin));

-- ── plans: one row per language pair ────────────────────────────────────────
-- Prices live here, not in env, because a Stripe Price is immutable: changing
-- what you charge means creating a new Price and pointing at it. Existing
-- subscribers stay on the Price they signed up to.
create table plans (
  pair language_pair primary key,
  stripe_price_monthly text,
  stripe_price_annual text,
  monetised boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into plans (pair, monetised) values ('en-vi', false), ('vi-en', false)
  on conflict (pair) do nothing;

alter table plans enable row level security;
create policy "plans readable by anyone" on plans for select using (true);
create policy "plans writable by admins" on plans for update to authenticated
  using (exists (select 1 from profiles p where p.id = (select auth.uid()) and p.is_admin));

-- ── subscriptions: one row per user, written only by the webhook ────────────
create table subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'incomplete'
    check (status in ('trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused')),
  plan text check (plan in ('monthly','annual')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  comped boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
create policy "user reads own subscription" on subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
-- No insert/update policy: only the service role writes, from the Stripe webhook.

-- ── stripe_events: webhook idempotency ──────────────────────────────────────
create table stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table stripe_events enable row level security;

-- ── model_tests: the admin model harness ────────────────────────────────────
create table model_tests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users,
  pair language_pair not null,
  provider text not null,
  model text not null,
  situation text not null,
  passed boolean not null,
  latency_ms int,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 5),
  lesson_json jsonb,
  error text,
  created_at timestamptz not null default now()
);
alter table model_tests enable row level security;
create policy "model tests readable by admins" on model_tests for select to authenticated
  using (exists (select 1 from profiles p where p.id = (select auth.uid()) and p.is_admin));
create index on model_tests (created_at desc);
