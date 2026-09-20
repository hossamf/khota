-- Phase 07: admin audit-log writes.
-- Run in Supabase SQL Editor.

drop policy if exists "audit_insert_admin" on public.audit_logs;
create policy "audit_insert_admin" on public.audit_logs
for insert with check (public.is_admin());
