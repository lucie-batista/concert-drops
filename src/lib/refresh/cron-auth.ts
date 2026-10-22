import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron calls the refresh route with `Authorization: Bearer <CRON_SECRET>`.
 * Compares in constant time so response timing doesn't leak how much matched.
 */
export function isAuthorizedCronRequest(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
