-- supabase/migrations/20260915120000_generation_ledger.sql
-- The lesson caps counted rows in lessons, which a learner can delete or edit,
-- and the check ran a minute before the insert, so parallel requests all passed.
-- Usage now lives in an append-only ledger, and a slot is reserved under a
-- per-user lock before the model is called.

-- ── lesson_generations: one row per AI generation, written only by the server ─
create table lesson_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  pair language_pair not null,
  -- Deleting the lesson keeps the row, so a delete never hands the slot back.
  lesson_id uuid references lessons on delete set null,
  created_at timestamptz not null default now()
);
create index on lesson_generations (user_id, created_at desc);

alter table lesson_generations enable row level security;
create policy "user reads own generations" on lesson_generations for select to authenticated
  using ((select auth.uid()) = user_id);
-- No write policies: only the service role writes, from the lesson actions.
revoke insert, update, delete on lesson_generations from anon, authenticated;

-- Existing AI lessons already used their slots.
insert into lesson_generations (user_id, pair, lesson_id, created_at)
select user_id, pair, id, created_at from lessons where source = 'ai';

-- ── reserve_lesson_generation: count and claim a slot in one transaction ─────
-- Returns the new row's id, or null when either cap is already reached. A null
-- limit means no cap. The advisory lock serialises one learner's requests, so
-- two tabs cannot both read the same count.
create or replace function reserve_lesson_generation(
  p_user_id uuid,
  p_pair language_pair,
  p_week_start timestamptz,
  p_weekly_limit int,
  p_daily_limit int
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  used int;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  if p_weekly_limit is not null then
    select count(*) into used from lesson_generations
     where user_id = p_user_id and pair = p_pair and created_at >= p_week_start;
    if used >= p_weekly_limit then return null; end if;
  end if;

  if p_daily_limit is not null then
    select count(*) into used from lesson_generations
     where user_id = p_user_id and created_at >= now() - interval '24 hours';
    if used >= p_daily_limit then return null; end if;
  end if;

  insert into lesson_generations (user_id, pair) values (p_user_id, p_pair)
  returning id into new_id;
  return new_id;
end $$;

-- The caller supplies the limits, so a learner must never be able to call this.
revoke execute on function reserve_lesson_generation(uuid, language_pair, timestamptz, int, int)
  from public, anon, authenticated;
grant execute on function reserve_lesson_generation(uuid, language_pair, timestamptz, int, int)
  to service_role;
