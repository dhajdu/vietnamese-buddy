-- supabase/migrations/20260912140000_admin_overview.sql
-- One view so the admin user list is a single query rather than N+1.
-- Read through the service role behind requireAdmin(), never from the browser.
create view admin_user_overview
with (security_invoker = true) as
select
  p.id,
  p.email,
  p.display_name,
  p.pair,
  p.is_admin,
  p.timezone,
  p.created_at,
  coalesce(s.status, 'none') as sub_status,
  coalesce(s.comped, false) as comped,
  s.plan as sub_plan,
  s.current_period_end,
  (select count(*) from lessons l where l.user_id = p.id) as lessons,
  (select count(*) from lessons l where l.user_id = p.id and l.source = 'ai') as ai_lessons,
  (select count(*) from vocabulary v where v.user_id = p.id) as words,
  (select count(*) from vocabulary v where v.user_id = p.id and v.status = 'known') as words_known,
  (select count(*) from daily_activity d where d.user_id = p.id) as learning_days,
  (select max(d.activity_date) from daily_activity d where d.user_id = p.id) as last_active
from profiles p
left join subscriptions s on s.user_id = p.id;
