<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Base44 Dev Environment

- **Stack:** Next.js 16 (Turbopack) + React 19 + Tailwind 4 + Supabase (SSR). RTL Arabic UI.
- **Boot without Supabase:** The app is designed to render logged-out/empty states when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent. `proxy.ts` (middleware) and `tryCreateClient()` short-circuit gracefully. Do NOT add mock data.
- **Compose:** `docker compose -f docker-compose.base44.yml up -d` — node:22-slim, source bind-mounted, `npm ci` then `next dev -H 0.0.0.0 -p 3000`. Port 3000.
- **Preview origin:** `next.config.ts` conditionally adds `allowedDevOrigins` when `BASE44_PREVIEW_MODE === "1"`. Do not remove this — Next blocks dev assets/HMR from the preview origin without it.
- **Health check:** `GET /api/health` returns `{ ok: true, supabaseConfigured: bool }`.
- **Secrets:** Supabase keys are optional at boot. When provided they go to `/run/base44/app.env` (platform-managed, outside repo). Three keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Tests:** `npm run typecheck`, `npm run lint`, `npm test` (unit), `npm run test:db` / `test:rls` / `test:acceptance` (need Supabase).
