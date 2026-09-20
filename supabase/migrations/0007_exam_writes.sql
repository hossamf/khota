-- Phase 06: write policies for options/tags/exam_questions (teacher-owned).
-- Safe: parent tables (questions, exams) have recursion-free policies.
-- Run in Supabase SQL Editor.

drop policy if exists "qopt_write" on public.question_options;
create policy "qopt_write" on public.question_options
for all using (
  public.is_admin()
  or question_id in (select id from public.questions where created_by = auth.uid())
) with check (
  public.is_admin()
  or question_id in (select id from public.questions where created_by = auth.uid())
);

drop policy if exists "qtag_write" on public.question_tags;
create policy "qtag_write" on public.question_tags
for all using (
  public.is_admin()
  or question_id in (select id from public.questions where created_by = auth.uid())
) with check (
  public.is_admin()
  or question_id in (select id from public.questions where created_by = auth.uid())
);

drop policy if exists "examq_write" on public.exam_questions;
create policy "examq_write" on public.exam_questions
for all using (
  public.is_admin()
  or exam_id in (select id from public.exams where teacher_id = public.my_teacher_id())
) with check (
  public.is_admin()
  or exam_id in (select id from public.exams where teacher_id = public.my_teacher_id())
);
