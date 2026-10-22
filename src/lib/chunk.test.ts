import { describe, expect, it } from "vitest";

import { chunk } from "./chunk";

describe("chunk", () => {
  it("splits into groups of the given size, with a smaller last group", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns no groups for an empty list", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("rejects sizes below 1", () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
  });
});
