import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/env";

function cookieHandlers(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // ignore when called from Server Component (read-only)
      }
    },
  };
}

/**
 * Null-safe variant for prerender/build without env.
 * Returns null instead of throwing so static pages render logged-out state.
 */
export async function tryCreateClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anon, { cookies: cookieHandlers(cookieStore) });
}

export async function createClient() {
  const { url, anon } = requireSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anon, { cookies: cookieHandlers(cookieStore) });
}
