-- supabase/migrations/20260910000000_vietnamese_daily.sql
-- Vietnamese Daily core tables. See docs/plans/build-plan.md §5.

-- profiles: one per auth user, created by trigger.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "user owns profile" on profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- enums
create type vocab_status as enum ('new', 'learning', 'known');
create type card_status as enum ('new', 'review', 'known');
create type card_type as enum ('phrase', 'vocabulary');
create type lesson_source as enum ('ai', 'seed');

-- lessons
create table lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  situation text not null,
  title text not null,
  grammar_topic text not null,
  lesson_json jsonb not null,
  parent_lesson_id uuid references lessons on delete set null,
  source lesson_source not null default 'ai',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table lessons enable row level security;
create policy "user owns lessons" on lessons for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index on lessons (user_id, created_at desc);

-- vocabulary: one row per (user, normalized Vietnamese form)
create table vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  vietnamese text not null,
  normalized text not null,
  english text not null,
  status vocab_status not null default 'new',
  first_seen_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  review_count int not null default 0,
  unique (user_id, normalized)
);
alter table vocabulary enable row level security;
create policy "user owns vocabulary" on vocabulary for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index on vocabulary (user_id, status);

-- lesson_vocabulary: which lessons introduced/used which words
create table lesson_vocabulary (
  lesson_id uuid not null references lessons on delete cascade,
  vocabulary_id uuid not null references vocabulary on delete cascade,
  primary key (lesson_id, vocabulary_id)
);
alter table lesson_vocabulary enable row level security;
create policy "user owns lesson_vocabulary" on lesson_vocabulary for all to authenticated
  using (exists (select 1 from lessons l where l.id = lesson_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from lessons l where l.id = lesson_id and l.user_id = (select auth.uid())));
create index on lesson_vocabulary (vocabulary_id);

-- flashcards
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  lesson_id uuid not null references lessons on delete cascade,
  vocabulary_id uuid references vocabulary on delete cascade,
  type card_type not null,
  front text not null,
  back jsonb not null,
  status card_status not null default 'new',
  review_count int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table flashcards enable row level security;
create policy "user owns flashcards" on flashcards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index on flashcards (user_id, status);
create index on flashcards (lesson_id);

-- daily_activity: one row per local day with any activity
create table daily_activity (
  user_id uuid not null references auth.users on delete cascade,
  activity_date date not null,
  lesson_created boolean not null default false,
  cards_reviewed int not null default 0,
  lesson_completed boolean not null default false,
  primary key (user_id, activity_date)
);
alter table daily_activity enable row level security;
create policy "user owns daily_activity" on daily_activity for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index on daily_activity (user_id, activity_date desc);

-- atomic activity upsert (called from server actions)
create or replace function record_activity(p_date date, p_kind text)
returns void language sql security invoker as $$
  insert into daily_activity (user_id, activity_date, lesson_created, cards_reviewed, lesson_completed)
  values ((select auth.uid()), p_date,
          p_kind = 'lesson_created', case when p_kind = 'card_reviewed' then 1 else 0 end, p_kind = 'lesson_completed')
  on conflict (user_id, activity_date) do update set
    lesson_created   = daily_activity.lesson_created or excluded.lesson_created,
    cards_reviewed   = daily_activity.cards_reviewed + excluded.cards_reviewed,
    lesson_completed = daily_activity.lesson_completed or excluded.lesson_completed;
$$;
