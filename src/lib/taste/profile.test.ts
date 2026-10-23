import { describe, expect, it } from "vitest";

import {
  profileFromSearch,
  profileToSearch,
  type TasteProfile,
} from "./profile";

const profile: TasteProfile = {
  vibes: { indie: 2, pop: 1 },
  performers: ["K8vZ917", "K8vZ918"],
  size: "small",
};

describe("profileToSearch", () => {
  it("writes a short, readable link", () => {
    expect(profileToSearch(profile)).toBe(
      "v=indie.2,pop.1&a=K8vZ917,K8vZ918&s=small",
    );
  });

  it("leaves out empty parts", () => {
    expect(profileToSearch({ vibes: {}, performers: [], size: "big" })).toBe(
      "s=big",
    );
  });
});

describe("profileFromSearch", () => {
  it("reads back what it wrote", () => {
    const params = Object.fromEntries(
      new URLSearchParams(profileToSearch(profile)),
    );
    expect(profileFromSearch(params)).toEqual(profile);
  });

  it("ignores unknown vibes, bad counts and odd ids", () => {
    expect(
      profileFromSearch({
        v: "indie.2,polka.3,pop.x,rock.-1,jazz.40",
        a: "K8vZ917,<script>,K8vZ917",
        s: "huge",
      }),
    ).toEqual({
      vibes: { indie: 2, jazz: 9 },
      performers: ["K8vZ917"],
      size: null,
    });
  });

  it("returns null when there's nothing usable", () => {
    expect(profileFromSearch({})).toBeNull();
    expect(profileFromSearch({ v: "polka.1", s: "huge" })).toBeNull();
  });

  it("takes the first value of repeated params", () => {
    expect(profileFromSearch({ s: ["big", "small"] })?.size).toBe("big");
  });
});
