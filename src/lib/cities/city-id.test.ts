import { describe, expect, it } from "vitest";

import { cityId } from "./city-id";

describe("cityId", () => {
  it("combines a readable name with the GeoNames id", () => {
    expect(cityId({ name: "Austin", geonameId: 4671654 })).toBe(
      "austin-4671654",
    );
    expect(cityId({ name: "São Paulo", geonameId: 3448439 })).toBe(
      "sao-paulo-3448439",
    );
  });

  it("falls back when the name has no Latin letters", () => {
    expect(cityId({ name: "東京", geonameId: 1850147 })).toBe("city-1850147");
  });
});
