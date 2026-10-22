import type { UserIdentity } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { isOwnerAccount, spotifyIdOf } from "./owner";

function userWith(...identities: Partial<UserIdentity>[]) {
  return { identities: identities as UserIdentity[] };
}

describe("spotifyIdOf", () => {
  it("reads the Spotify identity's ID", () => {
    expect(spotifyIdOf(userWith({ provider: "spotify", id: "lucie123" }))).toBe(
      "lucie123",
    );
  });

  it("ignores other providers", () => {
    expect(
      spotifyIdOf(userWith({ provider: "github", id: "lucie123" })),
    ).toBeNull();
  });

  it("handles users with no identities", () => {
    expect(spotifyIdOf({ identities: undefined })).toBeNull();
  });
});

describe("isOwnerAccount", () => {
  const owner = userWith({ provider: "spotify", id: "lucie123" });

  it("accepts the owner's Spotify account", () => {
    expect(isOwnerAccount(owner, "lucie123")).toBe(true);
  });

  it("rejects any other Spotify account", () => {
    expect(
      isOwnerAccount(
        userWith({ provider: "spotify", id: "someone" }),
        "lucie123",
      ),
    ).toBe(false);
  });

  it("is case-sensitive, like Spotify IDs", () => {
    expect(isOwnerAccount(owner, "Lucie123")).toBe(false);
  });

  it("rejects everyone when no owner is configured", () => {
    expect(isOwnerAccount(owner, "")).toBe(false);
    expect(isOwnerAccount({ identities: [] }, "")).toBe(false);
  });
});
