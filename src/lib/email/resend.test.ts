import { describe, expect, it, vi } from "vitest";

import { createEmailClient, DEFAULT_FROM, EmailError } from "./resend";

const email = {
  to: "me@example.com",
  subject: "Today: Ashe",
  html: "<p>Ashe</p>",
  text: "Ashe",
};

function fakeFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(body), { status }),
  );
}

describe("createEmailClient", () => {
  it("posts the email to Resend with the API key", async () => {
    const fetchMock = fakeFetch({ id: "email-1" });
    const client = createEmailClient({ apiKey: "re_test", fetch: fetchMock });

    await expect(client.send(email)).resolves.toBe("email-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer re_test",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      from: DEFAULT_FROM,
      to: ["me@example.com"],
      subject: "Today: Ashe",
      html: "<p>Ashe</p>",
      text: "Ashe",
    });
  });

  it("throws with Resend's message when sending fails", async () => {
    const client = createEmailClient({
      apiKey: "re_test",
      fetch: fakeFetch({ message: "You can only send testing emails" }, 403),
    });

    const error = await client.send(email).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(EmailError);
    expect((error as EmailError).status).toBe(403);
    expect((error as EmailError).message).toContain(
      "You can only send testing emails",
    );
  });
});
