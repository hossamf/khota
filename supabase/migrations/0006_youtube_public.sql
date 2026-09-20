-- Phase 05b: public video visibility for verified teachers' pages.
-- Run AFTER 0005. (Do NOT run 0004 whole file — 0005 already replaced its other policies
-- with recursion-free versions; this file contains only the missing public-videos part.)

drop policy if exists "yt_videos_public" on public.youtube_videos;
create policy "yt_videos_public" on public.youtube_videos
for select using (
  channel_id in (
    select yc.id
    from public.youtube_channels yc
    join public.teachers t on t.id = yc.teacher_id
    where t.is_verified = true
  )
);
