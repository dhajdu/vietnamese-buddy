-- supabase/migrations/20260915130000_signup_timezone.sql
-- Every profile was created on Ho Chi Minh time, so streaks and the Monday reset
-- were wrong for anyone outside UTC+7. Signup now sends the browser's zone as
-- user metadata; the trigger keeps it only when Postgres knows the name.
-- Same body as 20260912000000_language_pairs.sql plus the timezone column.
-- Older clients send no timezone and still get the column default.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tz text := new.raw_user_meta_data->>'timezone';
begin
  insert into public.profiles (id, email, display_name, timezone)
  values (
    new.id, new.email, split_part(new.email, '@', 1),
    -- 'Asia/Ho_Chi_Minh' matches the profiles.timezone default.
    coalesce((select name from pg_timezone_names where name = tz), 'Asia/Ho_Chi_Minh')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
