import { describe, expect, it } from "vitest";

import { encodeGeohash } from "./geohash";

describe("encodeGeohash", () => {
  it("matches the reference example from the geohash spec", () => {
    expect(encodeGeohash(57.64911, 10.40744, 11)).toBe("u4pruydqqvj");
  });

  it("encodes San Francisco and New York", () => {
    expect(encodeGeohash(37.7749, -122.4194)).toMatch(/^9q8yy/);
    expect(encodeGeohash(40.7128, -74.006)).toMatch(/^dr5reg/);
  });

  it("respects the requested precision", () => {
    expect(encodeGeohash(37.7749, -122.4194, 5)).toHaveLength(5);
  });

  it("rejects coordinates outside the valid range", () => {
    expect(() => encodeGeohash(91, 0)).toThrow(RangeError);
    expect(() => encodeGeohash(0, -181)).toThrow(RangeError);
  });
});
