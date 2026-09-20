# Real EdTech Platform — Phase 01 Foundation

No fake data. All lists come from Supabase. Empty DB = EmptyState, not mock arrays.

## Run
1. Copy `.env.local.example` to `.env.local` with real Supabase values.
2. `npm install`
3. `npm run dev`
4. `npm run typecheck`, `npm run lint`, `npm run build`

## Structure
app/ (routes + api) / components/shared/ / features/ / lib/supabase/ / services/ / hooks/ / types/ / utils/ / supabase/migrations/

## Phases
- 01 Foundation (current): Next.js+TS+Tailwind+Supabase clients+RTL+brand loader+health API — DONE when build+lint+typecheck pass
- 02 Database: schema+migrations+RLS+Storage+pgTAP
- 03 Auth: login/register/roles/onboarding/middleware
- 04 Student core, 05 Teacher+YouTube, 06 Exams, 07 Admin, 08 Polish, 09 Testing, 10 Production, 11 Launch
