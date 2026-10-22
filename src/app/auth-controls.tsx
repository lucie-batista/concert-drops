import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

const AUTH_MESSAGES: Record<string, string> = {
  error: "Login didn’t work. Please try again.",
  "not-owner": "Only the owner can log in here. Everything is still public.",
};

/** Owner login/logout button, plus a message after a failed login. */
export async function AuthControls({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const { auth } = await searchParams;
  const message = typeof auth === "string" ? AUTH_MESSAGES[auth] : null;

  // Checking the session reads the current time (token expiry), so this must
  // render per request rather than be prerendered.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // Non-owners are signed out at login, so any session here is the owner's.
  const isOwner = Boolean(data?.claims);

  return (
    <div className="flex flex-col items-end gap-3">
      <form action={isOwner ? "/auth/logout" : "/auth/login"} method="post">
        <button
          type="submit"
          className="border-ink min-h-11 rounded-full border-2 px-4 text-sm font-bold"
        >
          {isOwner ? "Log out" : "Owner login"}
        </button>
      </form>
      {message && (
        <p
          role="status"
          className="bg-surface max-w-xs rounded-2xl px-4 py-3 text-sm font-medium"
        >
          {message}
        </p>
      )}
    </div>
  );
}
