-- V1 notifications: scoped INSERT (own + teacher->own students + admin).
-- Run in Supabase SQL Editor.

drop policy if exists "notif_insert" on public.notifications;
create policy "notif_insert" on public.notifications
for insert with check (
  user_id = auth.uid()
  or user_id in (select public.my_student_profile_ids())
  or public.is_admin()
);
