-- supabase/migrations/20260912000000_language_pairs.sql
-- Language pairs: the app now runs in both directions. Also adds the profile
-- columns the freemium gate and admin need, so those PRs need no migration.
-- See docs/plans/2026-09-12-freemium-and-marketing.md §5.

create type language_pair as enum ('en-vi', 'vi-en');

-- ── profiles ────────────────────────────────────────────────────────────────
alter table profiles
  add column pair language_pair not null default 'en-vi',
  add column email text,
  add column is_admin boolean not null default false,
  add column stripe_customer_id text unique;

-- Backfill emails for existing accounts, and keep the trigger in sync from now on.
update profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;
create index on profiles (email);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

-- The owner is never rate limited. Both spellings, since the address is used
-- inconsistently across our accounts.
update profiles set is_admin = true where lower(email) in ('dave@edge8.co', 'dave@edge8.ai');

-- ── lessons and vocabulary are scoped to a direction ────────────────────────
alter table lessons add column pair language_pair not null default 'en-vi';
alter table vocabulary add column pair language_pair not null default 'en-vi';

-- A word only collides with itself within the same direction, so "no" the
-- English word and "nó" the Vietnamese word can both exist for one learner.
alter table vocabulary drop constraint vocabulary_user_id_normalized_key;
alter table vocabulary add constraint vocabulary_user_pair_normalized_key unique (user_id, pair, normalized);

create index on lessons (user_id, pair, created_at desc);
create index on vocabulary (user_id, pair, status);
