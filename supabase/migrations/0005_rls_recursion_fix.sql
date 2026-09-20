-- Phase 05 fix: break RLS infinite recursion (profiles <-> students <-> enrollments).
-- Strategy: SECURITY DEFINER helpers encapsulate cross-table checks,
-- so policies never reference other RLS tables directly.
-- Run in Supabase SQL Editor (safe to re-run).

-- ============ helpers (bypass RLS by design) ============
create or replace function public.my_teacher_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.teachers where profile_id = auth.uid() limit 1;
$$;

create or replace function public.my_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where profile_id = auth.uid() limit 1;
$$;

create or replace function public.my_course_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.courses where teacher_id = public.my_teacher_id();
$$;

create or replace function public.my_student_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select e.student_id from public.enrollments e
  where e.course_id in (select public.my_course_ids());
$$;

create or replace function public.my_student_profile_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select s.profile_id from public.students s
  where s.id in (select public.my_student_ids());
$$;

create or replace function public.my_channel_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.youtube_channels where teacher_id = public.my_teacher_id();
$$;

create or replace function public.my_exam_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.exams where teacher_id = public.my_teacher_id();
$$;

-- ============ students / profiles (the cycle) ============
drop policy if exists "students_own" on public.students;
drop policy if exists "students_own_write" on public.students;
drop policy if exists "students_teacher_read" on public.students;
create policy "students_read" on public.students
for select using (
  profile_id = auth.uid()
  or id in (select public.my_student_ids())
  or public.is_admin()
);
create policy "students_write" on public.students
for all using (
  profile_id = auth.uid() or public.is_admin()
) with check (
  profile_id = auth.uid() or public.is_admin()
);

drop policy if exists "profiles_own" on public.profiles;
drop policy if exists "profiles_teacher_read" on public.profiles;
create policy "profiles_read" on public.profiles
for select using (
  id = auth.uid()
  or id in (select public.my_student_profile_ids())
  or public.is_admin()
);

-- ============ courses / modules / lessons ============
drop policy if exists "courses_read" on public.courses;
drop policy if exists "courses_teacher_write" on public.courses;
create policy "courses_read" on public.courses
for select using (
  status = 'published'
  or teacher_id = public.my_teacher_id()
  or public.is_admin()
);
create policy "courses_write" on public.courses
for all using (
  teacher_id = public.my_teacher_id() or public.is_admin()
) with check (
  teacher_id = public.my_teacher_id() or public.is_admin()
);

drop policy if exists "modules_read" on public.course_modules;
drop policy if exists "modules_write" on public.course_modules;
create policy "modules_read" on public.course_modules
for select using (
  public.is_admin()
  or course_id in (select public.my_course_ids())
  or course_id in (select id from public.courses where status = 'published')
);
create policy "modules_write" on public.course_modules
for all using (
  public.is_admin() or course_id in (select public.my_course_ids())
) with check (
  public.is_admin() or course_id in (select public.my_course_ids())
);

drop policy if exists "lessons_read" on public.lessons;
drop policy if exists "lessons_write" on public.lessons;
create policy "lessons_read" on public.lessons
for select using (
  public.is_admin()
  or course_id in (select public.my_course_ids())
  or course_id in (select id from public.courses where status = 'published')
);
create policy "lessons_write" on public.lessons
for all using (
  public.is_admin() or course_id in (select public.my_course_ids())
) with check (
  public.is_admin() or course_id in (select public.my_course_ids())
);

drop policy if exists "resources_read" on public.lesson_resources;
create policy "resources_read" on public.lesson_resources
for select using (
  public.is_admin()
  or lesson_id in (select id from public.lessons where course_id in (select public.my_course_ids()))
  or lesson_id in (select l.id from public.lessons l join public.courses c on c.id = l.course_id where c.status = 'published')
);

-- ============ youtube ============
drop policy if exists "yt_all" on public.youtube_channels;
create policy "yt_all" on public.youtube_channels
for all using (
  public.is_admin() or teacher_id = public.my_teacher_id()
) with check (
  public.is_admin() or teacher_id = public.my_teacher_id()
);

drop policy if exists "yt_videos_read" on public.youtube_videos;
create policy "yt_videos_read" on public.youtube_videos
for select using (
  public.is_admin()
  or channel_id in (select public.my_channel_ids())
);

-- ============ enrollment / progress ============
drop policy if exists "enroll_all" on public.enrollments;
create policy "enroll_all" on public.enrollments
for all using (
  public.is_admin()
  or student_id = public.my_student_id()
  or course_id in (select public.my_course_ids())
) with check (
  public.is_admin()
  or student_id = public.my_student_id()
);

drop policy if exists "lprog_all" on public.lesson_progress;
drop policy if exists "lprog_teacher_read" on public.lesson_progress;
create policy "lprog_all" on public.lesson_progress
for all using (
  public.is_admin() or student_id = public.my_student_id()
) with check (
  public.is_admin() or student_id = public.my_student_id()
);
create policy "lprog_teacher_read" on public.lesson_progress
for select using (
  lesson_id in (
    select l.id from public.lessons l
    where l.course_id in (select public.my_course_ids())
  )
);

drop policy if exists "cprog_read" on public.course_progress;
create policy "cprog_read" on public.course_progress
for select using (
  public.is_admin()
  or student_id = public.my_student_id()
  or course_id in (select public.my_course_ids())
);

drop policy if exists "vprog_all" on public.video_progress;
create policy "vprog_all" on public.video_progress
for all using (
  public.is_admin() or student_id = public.my_student_id()
) with check (
  public.is_admin() or student_id = public.my_student_id()
);

-- ============ exams ============
drop policy if exists "exams_read" on public.exams;
drop policy if exists "exams_write" on public.exams;
create policy "exams_read" on public.exams
for select using (
  status = 'published'
  or teacher_id = public.my_teacher_id()
  or public.is_admin()
);
create policy "exams_write" on public.exams
for all using (
  teacher_id = public.my_teacher_id() or public.is_admin()
) with check (
  teacher_id = public.my_teacher_id() or public.is_admin()
);

drop policy if exists "attempt_all" on public.exam_attempts;
create policy "attempt_all" on public.exam_attempts
for all using (
  public.is_admin()
  or student_id = public.my_student_id()
  or exam_id in (select public.my_exam_ids())
) with check (
  public.is_admin()
  or student_id = public.my_student_id()
);

drop policy if exists "answer_all" on public.exam_answers;
create policy "answer_all" on public.exam_answers
for all using (
  public.is_admin()
  or attempt_id in (
    select a.id from public.exam_attempts a
    where a.student_id = public.my_student_id()
  )
) with check (
  public.is_admin()
  or attempt_id in (
    select a.id from public.exam_attempts a
    where a.student_id = public.my_student_id()
  )
);

-- ============ student tools ============
drop policy if exists "notes_all" on public.notes;
create policy "notes_all" on public.notes
for all using (
  public.is_admin() or student_id = public.my_student_id()
) with check (
  public.is_admin() or student_id = public.my_student_id()
);

drop policy if exists "fav_all" on public.favorites;
create policy "fav_all" on public.favorites
for all using (
  public.is_admin() or student_id = public.my_student_id()
) with check (
  public.is_admin() or student_id = public.my_student_id()
);

drop policy if exists "wl_all" on public.watch_later;
create policy "wl_all" on public.watch_later
for all using (
  public.is_admin() or student_id = public.my_student_id()
) with check (
  public.is_admin() or student_id = public.my_student_id()
);

-- ============ monetization reads ============
drop policy if exists "subs_own" on public.subscriptions;
create policy "subs_own" on public.subscriptions
for select using (
  public.is_admin() or student_id = public.my_student_id()
);

drop policy if exists "pay_own" on public.payments;
create policy "pay_own" on public.payments
for select using (
  public.is_admin() or student_id = public.my_student_id()
);

drop policy if exists "cert_read" on public.certificates;
create policy "cert_read" on public.certificates
for select using (
  public.is_admin()
  or student_id = public.my_student_id()
  or verification_code is not null
);
