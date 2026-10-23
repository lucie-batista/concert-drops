import { describe, expect, it, vi } from "vitest";

import type { EmailClient, OutgoingEmail } from "@/lib/email/resend";
import type { ScheduleRow } from "@/lib/schedule/map";

vi.mock("server-only", () => ({}));
const { sendReminders, sendTestReminder } = await import("./send");

function row(id: string, startsAt: string): ScheduleRow {
  return {
    sale_windows: {
      id,
      kind: "presale",
      name: "Artist Presale",
      url: null,
      starts_at: startsAt,
      events: {
        name: "Ashe",
        url: "https://tickets.example/ashe",
        venues: {
          name: "The Castro Theatre",
          time_zone: "America/Los_Angeles",
        },
        event_artists: [{ artists: { name: "Ashe" } }],
      },
    },
  };
}

/** Just enough of the Supabase client for the reminder queries. */
function fakeAdmin(rows: ScheduleRow[]) {
  const sends = new Set<string>();
  const key = (r: { sale_window_id: string; slot: string }) =>
    `${r.sale_window_id}:${r.slot}`;
  const admin = {
    from(table: string) {
      if (table === "schedule_items") {
        return { select: async () => ({ data: rows, error: null }) };
      }
      return {
        upsert(claims: { sale_window_id: string; slot: string }[]) {
          const fresh = claims.filter((c) => !sends.has(key(c)));
          fresh.forEach((c) => sends.add(key(c)));
          return {
            select: async () => ({
              data: fresh.map((c) => ({ sale_window_id: c.sale_window_id })),
              error: null,
            }),
          };
        },
        delete: () => ({
          eq: (_: string, slot: string) => ({
            in: async (_col: string, ids: string[]) => {
              ids.forEach((id) => sends.delete(`${id}:${slot}`));
              return { error: null };
            },
          }),
        }),
      };
    },
  };
  return { admin: admin as never, sends };
}

function fakeEmail(fail = false) {
  const sent: OutgoingEmail[] = [];
  const email: EmailClient = {
    send: async (message) => {
      if (fail) throw new Error("Resend is down");
      sent.push(message);
      return "email-1";
    },
  };
  return { email, sent };
}

const rows = [
  row("tomorrow", "2026-10-24T17:00:00Z"), // Sat 10:00 AM PT
  row("next-week", "2026-10-30T17:00:00Z"),
];
const fridayNight = new Date("2026-10-24T04:20:00Z"); // Fri 9:20 PM PT
const base = { to: "me@example.com", siteUrl: "https://site.example" };

describe("sendReminders", () => {
  it("emails tomorrow's drops in the evening", async () => {
    const { admin } = fakeAdmin(rows);
    const { email, sent } = fakeEmail();

    const result = await sendReminders({
      ...base,
      admin,
      email,
      now: fridayNight,
    });

    expect(result).toEqual({ slot: "evening", sent: ["tomorrow"] });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("me@example.com");
    expect(sent[0].subject).toBe(
      "Tomorrow: Ashe · Artist Presale at 10:00 AM PT",
    );
  });

  it("never sends the same reminder twice", async () => {
    const { admin } = fakeAdmin(rows);
    const { email, sent } = fakeEmail();
    const run = () =>
      sendReminders({ ...base, admin, email, now: fridayNight });

    await run();
    expect(await run()).toEqual({ slot: "evening", sent: [] });
    expect(sent).toHaveLength(1);
  });

  it("still sends the morning reminder after the evening one", async () => {
    const { admin } = fakeAdmin(rows);
    const { email, sent } = fakeEmail();

    await sendReminders({ ...base, admin, email, now: fridayNight });
    await sendReminders({
      ...base,
      admin,
      email,
      now: new Date("2026-10-24T14:05:00Z"), // Sat 7:05 AM PT
    });

    expect(sent.map((m) => m.subject)).toEqual([
      "Tomorrow: Ashe · Artist Presale at 10:00 AM PT",
      "Today: Ashe · Artist Presale at 10:00 AM PT",
    ]);
  });

  it("does nothing outside reminder hours", async () => {
    const { admin } = fakeAdmin(rows);
    const { email, sent } = fakeEmail();

    const result = await sendReminders({
      ...base,
      admin,
      email,
      now: new Date("2026-10-24T05:20:00Z"), // Fri 10:20 PM PT
    });

    expect(result).toEqual({ slot: null, sent: [] });
    expect(sent).toHaveLength(0);
  });

  it("lets the next run retry when the email fails", async () => {
    const { admin, sends } = fakeAdmin(rows);

    await expect(
      sendReminders({
        ...base,
        admin,
        email: fakeEmail(true).email,
        now: fridayNight,
      }),
    ).rejects.toThrow("Resend is down");
    expect(sends.size).toBe(0);
  });
});

describe("sendTestReminder", () => {
  it("sends upcoming drops without using up the real reminders", async () => {
    const { admin, sends } = fakeAdmin(rows);
    const { email, sent } = fakeEmail();

    const result = await sendTestReminder({
      ...base,
      admin,
      email,
      now: new Date("2026-10-23T20:00:00Z"),
    });

    expect(result.sent).toEqual(["tomorrow", "next-week"]);
    expect(sent[0].subject).toBe(
      "[Test] Tomorrow: 2 drops, first at 10:00 AM PT",
    );
    expect(sends.size).toBe(0);
  });
});
