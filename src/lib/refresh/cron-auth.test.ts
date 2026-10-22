import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "./cron-auth";

describe("isAuthorizedCronRequest", () => {
  it("accepts the matching bearer token", () => {
    expect(isAuthorizedCronRequest("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects a wrong or missing token", () => {
    expect(isAuthorizedCronRequest("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorizedCronRequest("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedCronRequest(null, "s3cret")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(isAuthorizedCronRequest("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false);
  });
});
