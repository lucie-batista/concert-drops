import { NextResponse, type NextRequest } from "next/server";

import { createEmailClient } from "@/lib/email/resend";
import { requireEnv } from "@/lib/env";
import { isAuthorizedCronRequest } from "@/lib/refresh/cron-auth";
import { sendReminders, sendTestReminder } from "@/lib/reminders/send";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reminder emails, triggered by Vercel Cron around 9 PM and 7 AM Pacific (see
 * vercel.json). Add `?test=1` to send a sample right away.
 */
export async function GET(request: NextRequest) {
  if (
    !isAuthorizedCronRequest(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const options = {
    admin: createAdminClient(),
    email: createEmailClient({ apiKey: requireEnv("RESEND_API_KEY") }),
    to: requireEnv("REMINDER_EMAIL"),
    siteUrl: request.nextUrl.origin,
    now: new Date(),
  };
  const result =
    request.nextUrl.searchParams.get("test") === "1"
      ? await sendTestReminder(options)
      : await sendReminders(options);
  return NextResponse.json(result);
}
