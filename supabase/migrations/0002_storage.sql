-- Phase 02: Storage buckets (run after 0001 in same SQL Editor session).
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('course-thumbnails', 'course-thumbnails', true),
  ('documents', 'documents', false),
  ('teacher-assets', 'teacher-assets', false),
  ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- Public read for avatars + thumbnails
drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars" on storage.objects
for select using (bucket_id in ('avatars', 'course-thumbnails'));

-- Authenticated users can upload to own folder: <uid>/...
drop policy if exists "own_upload" on storage.objects;
create policy "own_upload" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('avatars', 'course-thumbnails', 'documents', 'teacher-assets', 'certificates')
);

-- Owners can update/delete own files, admin via service role bypasses RLS
drop policy if exists "own_manage" on storage.objects;
create policy "own_manage" on storage.objects
for all to authenticated
using (auth.uid()::text = (storage.foldername(name))[1])
with check (auth.uid()::text = (storage.foldername(name))[1]);
