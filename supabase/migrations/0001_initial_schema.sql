-- Phase 02: Initial real schema. No fake data.
-- Apply in Supabase Dashboard > SQL Editor (paste whole file, Run).
-- Rerunnable: uses IF NOT EXISTS + DROP POLICY IF EXISTS.

create extension if not exists "pgcrypto";

-- ============ helpers ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- NOTE: has_role/is_admin are defined AFTER tables (see RLS section),
-- because Postgres validates SQL-function bodies against existing tables.

-- ============ roles / profiles ============
create table if not exists public.roles (
  id text primary key,
  description_ar text
);
insert into public.roles (id) values ('student'), ('teacher'), ('parent'), ('admin')
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' references public.roles (id),
  full_name text,
  avatar_url text,
  grade_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null references public.roles (id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ============ taxonomy ============
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  slug text not null unique,
  order_num int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  slug text not null unique,
  description_ar text,
  grade_id uuid references public.grades (id) on delete set null,
  order_num int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ people ============
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  username text unique,
  bio_ar text,
  avatar_url text,
  is_verified boolean not null default false,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  grade_id uuid references public.grades (id) on delete set null,
  track_id uuid references public.tracks (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_children (
  parent_id uuid not null references public.parents (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ============ courses ============
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  title_ar text not null,
  slug text not null unique,
  description_ar text,
  thumbnail_url text,
  price numeric not null default 0,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  order_num int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title_ar text not null,
  order_num int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title_ar text not null,
  type text not null default 'youtube' check (type in ('youtube','upload','document')),
  youtube_video_id text,
  file_url text,
  duration_sec int not null default 0,
  order_num int not null default 0,
  is_free boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title_ar text not null,
  file_url text not null,
  file_type text,
  order_num int not null default 0,
  created_at timestamptz not null default now()
);

-- ============ youtube ============
create table if not exists public.youtube_channels (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  channel_id text not null unique,
  title text,
  avatar_url text,
  connected_at timestamptz not null default now()
);

create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.youtube_channels (id) on delete cascade,
  video_id text not null unique,
  title text,
  thumbnail_url text,
  duration_sec int not null default 0,
  published_at timestamptz,
  lesson_id uuid references public.lessons (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ progress / enrollment ============
create table if not exists public.enrollments (
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  progress_percent numeric not null default 0,
  primary key (student_id, course_id)
);

create table if not exists public.lesson_progress (
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  watch_percent numeric not null default 0,
  completed boolean not null default false,
  last_position_sec int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

create table if not exists public.course_progress (
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  percent numeric not null default 0,
  completed_lessons int not null default 0,
  total_lessons int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, course_id)
);

create table if not exists public.video_progress (
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  position_sec int not null default 0,
  duration_sec int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- ============ questions / exams ============
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete set null,
  grade_id uuid references public.grades (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  type text not null default 'mcq' check (type in ('mcq','true_false','multi','short')),
  question_ar text not null,
  points int not null default 1,
  explanation_ar text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  option_ar text not null,
  is_correct boolean not null default false,
  order_num int not null default 0
);

create table if not exists public.question_tags (
  question_id uuid not null references public.questions (id) on delete cascade,
  tag text not null,
  primary key (question_id, tag)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete set null,
  title_ar text not null,
  description_ar text,
  duration_min int not null default 30,
  total_marks int not null default 0,
  pass_percent numeric not null default 50,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  exam_id uuid not null references public.exams (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  order_num int not null default 0,
  marks int not null default 1,
  primary key (exam_id, question_id)
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  score numeric not null default 0,
  percent numeric not null default 0,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  skipped_count int not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','graded')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.exam_answers (
  attempt_id uuid not null references public.exam_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option_id uuid references public.question_options (id) on delete set null,
  answer_text text,
  is_correct boolean,
  marks_awarded numeric not null default 0,
  primary key (attempt_id, question_id)
);

-- ============ student tools ============
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  content text not null,
  timestamp_sec int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (course_id is not null or lesson_id is not null)
);

create table if not exists public.watch_later (
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- ============ notifications ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title_ar text not null,
  body_ar text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  in_app boolean not null default true,
  email boolean not null default true
);

-- ============ certificates / monetization ============
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  verification_code text not null unique,
  issued_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  price numeric not null default 0,
  duration_days int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  started_at timestamptz not null default now(),
  ends_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  student_id uuid references public.students (id) on delete set null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent numeric not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz
);

-- ============ audit ============
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- FK profiles.grade_id added after grades exists
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_grade_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_grade_id_fkey
      foreign key (grade_id) references public.grades (id) on delete set null;
  end if;
end
$$;

-- ============ indexes ============
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_subjects_slug on public.subjects (slug);
create index if not exists idx_subjects_grade on public.subjects (grade_id);
create index if not exists idx_courses_teacher on public.courses (teacher_id);
create index if not exists idx_courses_subject on public.courses (subject_id);
create index if not exists idx_courses_status on public.courses (status);
create index if not exists idx_courses_slug on public.courses (slug);
create index if not exists idx_modules_course on public.course_modules (course_id);
create index if not exists idx_lessons_module on public.lessons (module_id);
create index if not exists idx_lessons_course on public.lessons (course_id);
create index if not exists idx_lessons_status on public.lessons (status);
create index if not exists idx_questions_subject on public.questions (subject_id);
create index if not exists idx_questions_status on public.questions (status);
create index if not exists idx_exams_course on public.exams (course_id);
create index if not exists idx_exams_status on public.exams (status);
create index if not exists idx_attempts_exam on public.exam_attempts (exam_id);
create index if not exists idx_attempts_student on public.exam_attempts (student_id);
create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_audit_actor on public.audit_logs (actor_id);
create index if not exists idx_enrollments_course on public.enrollments (course_id);
create index if not exists idx_progress_student on public.lesson_progress (student_id);

-- ============ updated_at triggers ============
do $$
declare t text;
begin
  foreach t in array array['profiles','subjects','teachers','courses','lessons','questions','exams'] loop
    if not exists (select 1 from pg_trigger where tgname = 'trg_' || t || '_updated') then
      execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
    end if;
  end loop;
end
$$;

-- ============ RLS ============
-- Helper functions AFTER all tables exist (Postgres validates SQL bodies).
create or replace function public.has_role(required text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = required
  ) or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = required
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select public.has_role('admin');
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.grades enable row level security;
alter table public.tracks enable row level security;
alter table public.subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.parents enable row level security;
alter table public.parent_children enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.youtube_channels enable row level security;
alter table public.youtube_videos enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.course_progress enable row level security;
alter table public.video_progress enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_tags enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.notes enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_later enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.certificates enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.audit_logs enable row level security;

-- taxonomy: public read active, admin manage
drop policy if exists "taxonomy_read" on public.grades;
create policy "taxonomy_read" on public.grades for select using (is_active = true or public.is_admin());
drop policy if exists "taxonomy_write_admin" on public.grades;
create policy "taxonomy_write_admin" on public.grades for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "taxonomy_read" on public.tracks;
create policy "taxonomy_read" on public.tracks for select using (is_active = true or public.is_admin());
drop policy if exists "taxonomy_write_admin" on public.tracks;
create policy "taxonomy_write_admin" on public.tracks for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subjects_read" on public.subjects;
create policy "subjects_read" on public.subjects for select using (is_active = true or public.is_admin());
drop policy if exists "subjects_write_admin" on public.subjects;
create policy "subjects_write_admin" on public.subjects for all using (public.is_admin()) with check (public.is_admin());

-- profiles: own read/update, admin all
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update" on public.profiles for update using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

-- user_roles: own read, admin manage
drop policy if exists "user_roles_own" on public.user_roles;
create policy "user_roles_own" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "user_roles_admin" on public.user_roles;
create policy "user_roles_admin" on public.user_roles for all using (public.is_admin()) with check (public.is_admin());

-- teachers: public read verified, owner manage, admin all
drop policy if exists "teachers_read" on public.teachers;
create policy "teachers_read" on public.teachers for select using (is_verified = true or profile_id = auth.uid() or public.is_admin());
drop policy if exists "teachers_own_write" on public.teachers;
create policy "teachers_own_write" on public.teachers for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

-- students/parents: own + admin; parent sees linked children via parent_children
drop policy if exists "students_own" on public.students;
create policy "students_own" on public.students for select using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "students_own_write" on public.students;
create policy "students_own_write" on public.students for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "parents_own" on public.parents;
create policy "parents_own" on public.parents for select using (profile_id = auth.uid() or public.is_admin());
drop policy if exists "parents_own_write" on public.parents;
create policy "parents_own_write" on public.parents for all using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "parent_children_read" on public.parent_children;
create policy "parent_children_read" on public.parent_children for select using (
  public.is_admin()
  or parent_id in (select id from public.parents where profile_id = auth.uid())
);

-- courses: published public, teacher own, admin all
drop policy if exists "courses_read" on public.courses;
create policy "courses_read" on public.courses for select using (
  status = 'published' or public.is_admin()
  or teacher_id in (select id from public.teachers where profile_id = auth.uid())
);
drop policy if exists "courses_teacher_write" on public.courses;
create policy "courses_teacher_write" on public.courses for all using (
  public.is_admin()
  or teacher_id in (select id from public.teachers where profile_id = auth.uid())
) with check (
  public.is_admin()
  or teacher_id in (select id from public.teachers where profile_id = auth.uid())
);

-- modules/lessons/resources: readable if course published; teacher own; admin all
drop policy if exists "modules_read" on public.course_modules;
create policy "modules_read" on public.course_modules for select using (
  public.is_admin()
  or course_id in (select id from public.courses where status = 'published')
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
);
drop policy if exists "modules_write" on public.course_modules;
create policy "modules_write" on public.course_modules for all using (
  public.is_admin()
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
) with check (
  public.is_admin()
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
);

drop policy if exists "lessons_read" on public.lessons;
create policy "lessons_read" on public.lessons for select using (
  public.is_admin()
  or course_id in (select id from public.courses where status = 'published')
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
);
drop policy if exists "lessons_write" on public.lessons;
create policy "lessons_write" on public.lessons for all using (
  public.is_admin()
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
) with check (
  public.is_admin()
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
);

drop policy if exists "resources_read" on public.lesson_resources;
create policy "resources_read" on public.lesson_resources for select using (
  public.is_admin()
  or lesson_id in (select l.id from public.lessons l join public.courses c on c.id = l.course_id where c.status = 'published')
  or lesson_id in (select l.id from public.lessons l join public.courses c on c.id = l.course_id join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
);

-- youtube: teacher own + admin
drop policy if exists "yt_all" on public.youtube_channels;
create policy "yt_all" on public.youtube_channels for all using (
  public.is_admin() or teacher_id in (select id from public.teachers where profile_id = auth.uid())
) with check (
  public.is_admin() or teacher_id in (select id from public.teachers where profile_id = auth.uid())
);
drop policy if exists "yt_videos_read" on public.youtube_videos;
create policy "yt_videos_read" on public.youtube_videos for select using (
  public.is_admin()
  or channel_id in (select yc.id from public.youtube_channels yc join public.teachers t on t.id = yc.teacher_id where t.profile_id = auth.uid())
);

-- enrollment/progress: student own + teacher of course + admin
drop policy if exists "enroll_all" on public.enrollments;
create policy "enroll_all" on public.enrollments for all using (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
) with check (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "lprog_all" on public.lesson_progress;
create policy "lprog_all" on public.lesson_progress for all using (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
) with check (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "cprog_read" on public.course_progress;
create policy "cprog_read" on public.course_progress for select using (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
  or course_id in (select c.id from public.courses c join public.teachers t on t.id = c.teacher_id where t.profile_id = auth.uid())
);

drop policy if exists "vprog_all" on public.video_progress;
create policy "vprog_all" on public.video_progress for all using (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
) with check (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
);

-- questions: published readable, teacher own, admin all
drop policy if exists "questions_read" on public.questions;
create policy "questions_read" on public.questions for select using (
  status = 'published' or public.is_admin() or created_by = auth.uid()
);
drop policy if exists "questions_write" on public.questions;
create policy "questions_write" on public.questions for all using (
  public.is_admin() or created_by = auth.uid()
) with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "qopt_read" on public.question_options;
create policy "qopt_read" on public.question_options for select using (
  public.is_admin()
  or question_id in (select id from public.questions where status = 'published' or created_by = auth.uid())
);

drop policy if exists "qtag_read" on public.question_tags;
create policy "qtag_read" on public.question_tags for select using (
  public.is_admin()
  or question_id in (select id from public.questions where status = 'published' or created_by = auth.uid())
);

-- exams: published readable, teacher own, admin all
drop policy if exists "exams_read" on public.exams;
create policy "exams_read" on public.exams for select using (
  status = 'published' or public.is_admin()
  or teacher_id in (select id from public.teachers where profile_id = auth.uid())
);
drop policy if exists "exams_write" on public.exams;
create policy "exams_write" on public.exams for all using (
  public.is_admin()
  or teacher_id in (select id from public.teachers where profile_id = auth.uid())
) with check (
  public.is_admin()
  or teacher_id in (select id from public.teachers where profile_id = auth.uid())
);

drop policy if exists "examq_read" on public.exam_questions;
create policy "examq_read" on public.exam_questions for select using (
  public.is_admin()
  or exam_id in (select id from public.exams where status = 'published')
  or exam_id in (select e.id from public.exams e join public.teachers t on t.id = e.teacher_id where t.profile_id = auth.uid())
);

-- attempts/answers: student own, teacher of exam, admin
drop policy if exists "attempt_all" on public.exam_attempts;
create policy "attempt_all" on public.exam_attempts for all using (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
  or exam_id in (select e.id from public.exams e join public.teachers t on t.id = e.teacher_id where t.profile_id = auth.uid())
) with check (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "answer_all" on public.exam_answers;
create policy "answer_all" on public.exam_answers for all using (
  public.is_admin()
  or attempt_id in (select a.id from public.exam_attempts a join public.students s on s.id = a.student_id where s.profile_id = auth.uid())
) with check (
  public.is_admin()
  or attempt_id in (select a.id from public.exam_attempts a join public.students s on s.id = a.student_id where s.profile_id = auth.uid())
);

-- student tools: own only
drop policy if exists "notes_all" on public.notes;
create policy "notes_all" on public.notes for all using (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
) with check (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "fav_all" on public.favorites;
create policy "fav_all" on public.favorites for all using (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
) with check (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "wl_all" on public.watch_later;
create policy "wl_all" on public.watch_later for all using (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
) with check (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
);

-- notifications: own read/update, admin all
drop policy if exists "notif_own" on public.notifications;
create policy "notif_own" on public.notifications for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "notif_own_update" on public.notifications;
create policy "notif_own_update" on public.notifications for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifpref_own" on public.notification_preferences;
create policy "notifpref_own" on public.notification_preferences for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- certificates: own read, admin all
drop policy if exists "cert_read" on public.certificates;
create policy "cert_read" on public.certificates for select using (
  public.is_admin()
  or student_id in (select id from public.students where profile_id = auth.uid())
  or verification_code is not null
);

-- monetization: own read, admin all
drop policy if exists "plans_read" on public.plans;
create policy "plans_read" on public.plans for select using (is_active = true or public.is_admin());

drop policy if exists "subs_own" on public.subscriptions;
create policy "subs_own" on public.subscriptions for select using (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "pay_own" on public.payments;
create policy "pay_own" on public.payments for select using (
  public.is_admin() or student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "coupons_read" on public.coupons;
create policy "coupons_read" on public.coupons for select using (public.is_admin() or is_active = true);

-- audit: admin only
drop policy if exists "audit_admin" on public.audit_logs;
create policy "audit_admin" on public.audit_logs for select using (public.is_admin());
