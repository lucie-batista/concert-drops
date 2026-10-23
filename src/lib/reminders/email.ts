import type { ScheduleItem } from "@/lib/schedule/map";
import { formatInTimeZone, tileParts } from "@/lib/time";

import type { Slot } from "./plan";

export type ReminderEmail = { subject: string; html: string; text: string };

/** A reminder for one day, or a sample of upcoming drops on any days. */
export type EmailKind = Slot | "upcoming";

const DAY_WORD: Record<EmailKind, string> = {
  evening: "Tomorrow",
  morning: "Today",
  upcoming: "Coming up",
};

/**
 * One email listing the drops a reminder covers, with times on my clock and
 * links to sign up and buy.
 */
export function reminderEmail(
  kind: EmailKind,
  items: ScheduleItem[],
  { timeZone, siteUrl }: { timeZone: string; siteUrl: string },
): ReminderEmail {
  const day = DAY_WORD[kind];
  // Upcoming drops can be on any day, so their times include the date.
  const time = (item: ScheduleItem) => {
    if (kind === "upcoming") return formatInTimeZone(item.startsAt, timeZone);
    const { time, zone } = tileParts(item.startsAt, timeZone);
    return `${time} ${zone}`;
  };
  const at = kind === "upcoming" ? "on" : "at";
  const title = (item: ScheduleItem) =>
    `${item.artistNames} · ${item.windowName}`;

  const subject =
    items.length === 1
      ? `${day}: ${title(items[0])} ${at} ${time(items[0])}`
      : `${day}: ${items.length} drops, first ${at} ${time(items[0])}`;

  const text = [
    `${day} on your drop schedule:`,
    ...items.map(
      (item) =>
        "\n" +
        [
          `${time(item)} — ${title(item)}`,
          item.venueName,
          item.signUpUrl && `Sign up: ${item.signUpUrl}`,
          item.ticketUrl && `Tickets: ${item.ticketUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
    ),
    "",
    `All drops: ${siteUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px 16px;background:#f4f2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0d0a14">
<div style="max-width:520px;margin:0 auto">
<p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#5a5566">${day} on your drop schedule</p>
${items.map((item) => card(item, time(item), title(item))).join("\n")}
<p style="margin:24px 0 0;font-size:14px"><a href="${escapeHtml(siteUrl)}" style="color:#0d0a14">See all drops</a></p>
</div>
</body>
</html>
`;

  return { subject, html, text };
}

function card(item: ScheduleItem, time: string, title: string): string {
  const tint = item.kind === "presale" ? "#ffdcea" : "#f1fbcd";
  const buttons = [
    item.signUpUrl && button("Sign up", item.signUpUrl),
    item.ticketUrl && button("Tickets", item.ticketUrl),
  ]
    .filter(Boolean)
    .join(" ");
  return `<div style="margin:0 0 12px;padding:20px;border-radius:20px;background:${tint}">
<p style="margin:0;font-size:24px;font-weight:800">${escapeHtml(time)}</p>
<p style="margin:4px 0 0;font-size:16px;font-weight:700">${escapeHtml(title)}</p>
${item.venueName ? `<p style="margin:4px 0 0;font-size:14px;color:#5a5566">${escapeHtml(item.venueName)}</p>` : ""}
${buttons ? `<p style="margin:16px 0 0">${buttons}</p>` : ""}
</div>`;
}

function button(label: string, url: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#0d0a14;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">${label}</a>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
