import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/env";

/**
 * Browser Supabase client. Throws if env not configured
 * instead of silently returning fake data.
 */
export function createClient() {
  const { url, anon } = requireSupabaseEnv();
  return createBrowserClient(url, anon);
}
