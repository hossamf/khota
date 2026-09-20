import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY — never import from client components.
 * Bypasses RLS. Used for cross-user reads (push subscriptions) and cleanup.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Service role not configured (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(url, key);
}
