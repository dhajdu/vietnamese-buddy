-- supabase/migrations/20260915000000_lock_down_writes.sql
-- RLS only checked row ownership, so a learner could set their own is_admin over the public API.
-- Learners keep only the columns the app writes for them; everything else goes through the service role.

-- ── profiles: pair and display_name only ────────────────────────────────────
-- handle_new_user is security definer, so sign-up still creates the row.
revoke insert, update, delete on profiles from authenticated, anon;
grant update (pair, display_name) on profiles to authenticated;

-- ── admin tables: admin actions write with the service role ─────────────────
drop policy if exists "settings writable by admins" on app_settings;
drop policy if exists "plans writable by admins" on plans;

-- ── audio: a public bucket serves by URL; this policy only let anyone list it ─
drop policy if exists "audio is public to read" on storage.objects;
