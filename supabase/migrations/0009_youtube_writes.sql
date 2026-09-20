-- Phase 05/06 fix: teachers couldn't INSERT synced videos (read-only policies).
-- Also run 0006_youtube_public.sql if not yet applied.
-- Run in Supabase SQL Editor.

drop policy if exists "yt_videos_write" on public.youtube_videos;
create policy "yt_videos_write" on public.youtube_videos
for all using (
  public.is_admin()
  or channel_id in (select public.my_channel_ids())
) with check (
  public.is_admin()
  or channel_id in (select public.my_channel_ids())
);
