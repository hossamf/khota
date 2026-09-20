-- Phase 05: let teachers read their own students' rows.
-- Run in Supabase SQL Editor.

-- Students enrolled in teacher's courses
drop policy if exists "students_teacher_read" on public.students;
create policy "students_teacher_read" on public.students
for select using (
  id in (
    select e.student_id
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    join public.teachers t on t.id = c.teacher_id
    where t.profile_id = auth.uid()
  )
);

-- Profiles (names) of those students
drop policy if exists "profiles_teacher_read" on public.profiles;
create policy "profiles_teacher_read" on public.profiles
for select using (
  id in (
    select s.profile_id
    from public.students s
    join public.enrollments e on e.student_id = s.id
    join public.courses c on c.id = e.course_id
    join public.teachers t on t.id = c.teacher_id
    where t.profile_id = auth.uid()
  )
);

-- Lesson progress of own courses (for teacher analytics)
drop policy if exists "lprog_teacher_read" on public.lesson_progress;
create policy "lprog_teacher_read" on public.lesson_progress
for select using (
  lesson_id in (
    select l.id
    from public.lessons l
    join public.courses c on c.id = l.course_id
    join public.teachers t on t.id = c.teacher_id
    where t.profile_id = auth.uid()
  )
);

-- Public can see videos of verified teachers (teacher public pages)
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
