-- supabase/migrations/20260910120000_audio_bucket.sql
-- Public bucket for cached phrase audio. Writes happen server-side with the service role only.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

create policy "audio is public to read"
  on storage.objects for select
  using (bucket_id = 'audio');
