-- notifications: in-app notification records per user
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null check (type in ('info', 'success', 'warning', 'error')),
  title text not null,
  body text,
  read_at timestamptz,         -- null = unread
  action_url text,             -- optional deep link
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "user owns notifications"
  on notifications for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Optimises the two most common queries:
-- 1. Fetch unread for a user (user_id, read_at IS NULL)
-- 2. Fetch recent notifications for a user ordered by created_at DESC
create index on notifications(user_id, read_at, created_at desc);
