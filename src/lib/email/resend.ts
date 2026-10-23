const SEND_URL = "https://api.resend.com/emails";

/**
 * Resend's shared test sender. It needs no domain of our own, but can only
 * deliver to the email address the Resend account was created with.
 */
export const DEFAULT_FROM = "Concert Drops <onboarding@resend.dev>";

export class EmailError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function createEmailClient(options: {
  apiKey: string;
  from?: string;
  fetch?: typeof fetch;
}) {
  const { apiKey, from = DEFAULT_FROM, fetch: fetchImpl = fetch } = options;

  return {
    /** Sends one email and returns Resend's id for it. */
    async send(email: OutgoingEmail): Promise<string> {
      const response = await fetchImpl(SEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, ...email, to: [email.to] }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };
      if (!response.ok || !body.id) {
        throw new EmailError(
          `Resend couldn't send the email (${response.status}): ${body.message ?? "no details"}`,
          response.status,
        );
      }
      return body.id;
    },
  };
}

export type EmailClient = ReturnType<typeof createEmailClient>;
