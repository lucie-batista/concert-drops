import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireEnv, supabaseUrl } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Supabase client using the secret key. It bypasses row level security, so it's
 * only for trusted server work: saving Spotify credentials, the daily refresh.
 * The "server-only" import makes the build fail if browser code imports this.
 */
export function createAdminClient() {
  return createClient<Database>(
    supabaseUrl(),
    requireEnv("SUPABASE_SECRET_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
