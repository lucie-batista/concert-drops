import { createClient } from "@supabase/supabase-js";

import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Supabase client for public data, with no user session or cookies. Because it
 * doesn't depend on the visitor, results can be cached with "use cache".
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
