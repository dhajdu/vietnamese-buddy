-- supabase/migrations/20260912160000_delete_lesson.sql
-- Deleting a lesson removes its cards and its vocabulary, but only the words
-- that no other lesson still uses. Vocabulary is deduped across lessons, so a
-- blanket delete would take words out from under lessons that still teach them.
--
-- security invoker, so RLS still scopes this to the caller's own rows and the
-- ownership check is not something the function has to be trusted to do.
create or replace function delete_lesson(p_lesson_id uuid)
returns table (deleted_words int)
language plpgsql
security invoker
set search_path = public
as $$
declare
  candidates uuid[];
  removed int;
begin
  -- The words this lesson touches, captured before the join rows cascade away.
  select coalesce(array_agg(vocabulary_id), '{}')
    into candidates
    from lesson_vocabulary
   where lesson_id = p_lesson_id;

  -- RLS decides whether this row is the caller's; if it is not, nothing is deleted.
  delete from lessons where id = p_lesson_id;

  delete from vocabulary v
   where v.id = any(candidates)
     and not exists (select 1 from lesson_vocabulary lv where lv.vocabulary_id = v.id);
  get diagnostics removed = row_count;

  return query select removed;
end $$;

revoke all on function delete_lesson(uuid) from public;
grant execute on function delete_lesson(uuid) to authenticated;
