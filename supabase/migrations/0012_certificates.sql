-- 0012_certificates.sql
-- Function to issue certificate when course progress is 100% and ensure public verification policy

-- 1. Ensure unique index on (student_id, course_id) so multiple certificates cannot be created for the same course
create unique index if not exists idx_certificates_student_course
  on public.certificates (student_id, course_id);

-- 2. Public verification policy on certificates table
-- Allows admin, the student owner, or anyone with a valid verification_code to read
drop policy if exists "cert_read" on public.certificates;
create policy "cert_read" on public.certificates
for select using (
  public.is_admin()
  or student_id = public.my_student_id()
  or verification_code is not null
);

-- 3. issue_certificate function (SECURITY DEFINER)
-- Verifies that course_progress.percent = 100
-- Ignores duplicate certificates (idempotent: returns existing certificate if one exists)
create or replace function public.issue_certificate(
  p_student uuid,
  p_course uuid
)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_progress numeric;
  v_cert public.certificates;
  v_code text;
begin
  -- Check if certificate already exists
  select * into v_cert
  from public.certificates
  where student_id = p_student and course_id = p_course
  limit 1;

  if v_cert.id is not null then
    return v_cert;
  end if;

  -- Verify course progress is 100%
  select percent into v_progress
  from public.course_progress
  where student_id = p_student and course_id = p_course;

  if v_progress is null or v_progress < 100 then
    raise exception 'Course progress is not 100%% (current: %)', coalesce(v_progress, 0)
      using errcode = 'P0001';
  end if;

  -- Generate readable, unique verification code e.g. KHT-9F2B81C04A
  v_code := 'KHT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  -- Insert certificate and handle possible concurrent insert
  insert into public.certificates (student_id, course_id, verification_code, issued_at)
  values (p_student, p_course, v_code, now())
  on conflict (student_id, course_id) do update
    set student_id = excluded.student_id
  returning * into v_cert;

  return v_cert;
end;
$$;

grant execute on function public.issue_certificate(uuid, uuid) to authenticated;
grant execute on function public.issue_certificate(uuid, uuid) to service_role;
