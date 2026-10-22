/** Reads a required environment variable, failing loudly if it's missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See .env.example for setup.`,
    );
  }
  return value;
}

// NEXT_PUBLIC_ values must be read with literal property access so Next.js can
// inline them into browser code.
export const supabaseUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");

export const supabasePublishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
