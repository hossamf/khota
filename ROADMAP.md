# KHOTA Roadmap — V1 → V5 (live status)

> القاعدة: لا Demo Data. كل سطر أخضر مثبت بفحص آلي.

## V1.0 Production Core — 95% (الكود مكتمل، يتبقى النشر)
- [x] Auth + Roles (student/teacher/parent/admin) + onboarding — `npm run test:rls`
- [x] Admin: users, teacher verification, course moderation, taxonomy, audit logs
- [x] Teacher: course builder, YouTube RSS sync, students, question bank, exams
- [x] Student: enroll, watch + 80% progress, notes, favorites, exams + auto-grade
- [x] RLS everywhere + recursion-free helpers — 7/7 `test:rls`
- [x] Acceptance chain 16/16 — `npm run test:acceptance`
- [x] Design system KHOTA (Cairo, dark/light, RTL)
- [ ] Run `0006` + `0009` in prod DB → re-probe
- [ ] Push + Vercel deploy + smoke test (see PRODUCTION.md)
- [ ] Delete test data + custom SMTP + Confirm email ON

## V1.5 Education Expansion
- [ ] Assignments + submissions + manual grading (schema ready: extend `questions` type)
- [ ] Lesson file attachments (Storage `documents` bucket exists; add UI)
- [ ] Weak-areas block on student dashboard (data exists: attempts + progress)
- [ ] Teacher per-question analytics

## V2.0 Complete Learning Platform
- [x] Gamification engine: XP/streak/badges + hooks (needs `0013` applied) — agent 1
- [x] Learning paths section on student dashboard — agent 1
- [ ] Certificates + `/certificates/[id]` verify — agent 2 (Gemini), contract: `maybeIssueCertificate` in `app/actions/certificates.ts`
- [ ] Parent reports (children progress/attempts) — agent 2 (Gemini), files: `app/dashboard/parent/page.tsx` + `components/parent/*`

## V2.5 Live + Business
- [ ] Live sessions + attendance (new tables)
- [ ] Payments: plans/subscriptions exist in schema; provider + webhooks needed
- [ ] Coupons UI (`coupons` table exists)

## V3.0+ Advanced / Multi-tenant / Ecosystem
- Design only — requires V1 deployed and stable first.
- Schema note: current names (`course_modules`, `parent_children`) are final;
  roadmap aliases (`sections`, `parent_students`) need no rename.

## Auth decision (recorded)
- V1 stays on **Supabase Auth** (RLS via `auth.uid()`, zero extra cost).
- Clerk deferred: needs Supabase third-party JWT integration + rewriting all
  guards/actions/triggers with no V1 feature gain. Revisit at V4 if orgs demand it.
