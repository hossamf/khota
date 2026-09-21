-- V2 gamification: XP + streaks + badges.
-- Writes go through SECURITY DEFINER functions (no direct insert policies).
-- Run in Supabase SQL Editor.

create table if not exists public.student_stats (
  student_id uuid primary key references public.students (id) on delete cascade,
  total_xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  amount int not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_xp_student on public.xp_events (student_id);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  description_ar text,
  icon text not null default 'award'
);

create table if not exists public.student_badges (
  student_id uuid not null references public.students (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);

insert into public.badges (slug, title_ar, description_ar, icon) values
  ('first-step', 'الخطوة الأولى', 'أكملت أول درس في رحلتك', 'footprints'),
  ('first-exam', 'أول اختبار', 'سلّمت أول امتحان', 'file-check'),
  ('course-complete', 'مُكمل الكورس', 'أكملت كورساً بنسبة 100%', 'graduation-cap'),
  ('streak-7', 'المثابرة', 'ذاكرت 7 أيام متتالية', 'flame'),
  ('perfect-score', 'العلامة الكاملة', 'حصلت على 100% في امتحان', 'star')
on conflict (slug) do nothing;

alter table public.student_stats enable row level security;
alter table public.xp_events enable row level security;
alter table public.badges enable row level security;
alter table public.student_badges enable row level security;

drop policy if exists "stats_own" on public.student_stats;
create policy "stats_own" on public.student_stats
for select using (
  student_id = public.my_student_id() or public.is_admin()
);

drop policy if exists "xp_own" on public.xp_events;
create policy "xp_own" on public.xp_events
for select using (
  student_id = public.my_student_id() or public.is_admin()
);

drop policy if exists "badges_read" on public.badges;
create policy "badges_read" on public.badges for select using (true);

drop policy if exists "sb_own" on public.student_badges;
create policy "sb_own" on public.student_badges
for select using (
  student_id = public.my_student_id() or public.is_admin()
);

-- ============ writer functions (SECURITY DEFINER) ============
create or replace function public.record_activity(p_student uuid)
returns int language plpgsql security definer set search_path = public as $$
declare s int := 1;
begin
  insert into public.student_stats(student_id, total_xp, current_streak, longest_streak, last_activity_date)
  values (p_student, 0, 1, 1, current_date)
  on conflict (student_id) do update set
    current_streak = case
      when public.student_stats.last_activity_date = current_date then public.student_stats.current_streak
      when public.student_stats.last_activity_date = current_date - 1 then public.student_stats.current_streak + 1
      else 1 end,
    longest_streak = greatest(public.student_stats.longest_streak, case
      when public.student_stats.last_activity_date = current_date then public.student_stats.current_streak
      when public.student_stats.last_activity_date = current_date - 1 then public.student_stats.current_streak + 1
      else 1 end),
    last_activity_date = current_date,
    updated_at = now();
  select current_streak into s from public.student_stats where student_id = p_student;
  return coalesce(s, 1);
end;
$$;

create or replace function public.award_xp(p_student uuid, p_amount int, p_reason text, p_ref_type text default null, p_ref_id text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.xp_events(student_id, amount, reason, ref_type, ref_id)
  values (p_student, p_amount, p_reason, p_ref_type, p_ref_id);
  insert into public.student_stats(student_id, total_xp, current_streak, longest_streak, last_activity_date)
  values (p_student, p_amount, 0, 0, null)
  on conflict (student_id) do update set
    total_xp = public.student_stats.total_xp + excluded.total_xp,
    updated_at = now();
end;
$$;

create or replace function public.award_badge(p_student uuid, p_slug text)
returns boolean language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  select id into bid from public.badges where slug = p_slug;
  if bid is null then return false; end if;
  insert into public.student_badges(student_id, badge_id)
  values (p_student, bid)
  on conflict do nothing;
  return true;
end;
$$;

grant execute on function public.record_activity(uuid) to authenticated;
grant execute on function public.award_xp(uuid, int, text, text, text) to authenticated;
grant execute on function public.award_badge(uuid, text) to authenticated;
