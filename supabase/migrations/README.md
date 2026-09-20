# Phase 02 will create real migrations here.

## How to apply (Supabase Dashboard)
1. Open your Supabase project > SQL Editor > New query.
2. Paste the FULL content of `supabase/migrations/0001_initial_schema.sql` > Run.
3. Then paste `supabase/migrations/0002_storage.sql` > Run.
4. Back here run: `node scripts/verify-db.mjs` — all 5 tables must print OK.

Rules: every table with RLS enabled, indexes on FKs, no fake seed in app code.
Dev-only seed goes to supabase/seed.dev.sql and is never imported by the app.
