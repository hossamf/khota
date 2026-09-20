-- Phase 03: auto-create profile + role rows on signup.
-- Run in Supabase SQL Editor, then new signups get real rows (no fake data).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role'), 'student');
  if v_role not in ('student', 'teacher', 'parent') then
    v_role := 'student';
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set
    role = excluded.role,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  insert into public.user_roles (user_id, role)
  values (new.id, v_role)
  on conflict do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict do nothing;

  if v_role = 'teacher' then
    insert into public.teachers (profile_id)
    values (new.id)
    on conflict do nothing;
  elsif v_role = 'student' then
    insert into public.students (profile_id)
    values (new.id)
    on conflict do nothing;
  elsif v_role = 'parent' then
    insert into public.parents (profile_id)
    values (new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
