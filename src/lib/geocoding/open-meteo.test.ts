import { describe, expect, it, vi } from "vitest";

import { getCity, placeLabel, searchCities, toCityOption } from "./open-meteo";

const austin = {
  id: 4671654,
  name: "Austin",
  latitude: 30.26715,
  longitude: -97.74306,
  feature_code: "PPLA",
  country_code: "US",
  country: "United States",
  admin1: "Texas",
  timezone: "America/Chicago",
};

function respond(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(body), { status }),
  );
}

describe("searchCities", () => {
  it("returns matching cities", async () => {
    const fetch = respond({ results: [austin] });
    const cities = await searchCities("Austin", { fetch });
    expect(cities).toEqual([
      {
        geonameId: 4671654,
        name: "Austin",
        region: "Texas",
        countryCode: "US",
        country: "United States",
        latitude: 30.26715,
        longitude: -97.74306,
        timeZone: "America/Chicago",
      },
    ]);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.searchParams.get("name")).toBe("Austin");
    expect(url.searchParams.get("language")).toBe("en");
  });

  it("skips places that aren't towns or cities", async () => {
    const fetch = respond({
      results: [{ ...austin, id: 1, feature_code: "ADM2" }, austin],
    });
    const cities = await searchCities("Austin", { fetch });
    expect(cities.map((c) => c.geonameId)).toEqual([4671654]);
  });

  it("puts bigger places first", async () => {
    const fetch = respond({
      results: [
        { ...austin, id: 1, name: "Melbot", population: 2000 },
        { ...austin, id: 2, name: "Melbourne", population: 4000000 },
        { ...austin, id: 3, name: "Melböda" },
      ],
    });
    const cities = await searchCities("Melb", { fetch });
    expect(cities.map((c) => c.name)).toEqual([
      "Melbourne",
      "Melbot",
      "Melböda",
    ]);
  });

  it("handles no results", async () => {
    expect(await searchCities("zzzz", { fetch: respond({}) })).toEqual([]);
  });

  it("doesn't search for a single character", async () => {
    const fetch = respond({ results: [austin] });
    expect(await searchCities(" a ", { fetch })).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws when the geocoder fails", async () => {
    await expect(
      searchCities("Austin", { fetch: respond({}, 500) }),
    ).rejects.toThrow("City search failed (500).");
  });
});

describe("getCity", () => {
  it("looks a city up by id", async () => {
    const fetch = respond(austin);
    expect((await getCity(4671654, fetch))?.name).toBe("Austin");
    expect(String(fetch.mock.calls[0][0])).toContain("/get?id=4671654");
  });

  it("returns null for an unknown id", async () => {
    expect(await getCity(1, respond({ error: true }, 400))).toBeNull();
  });
});

describe("toCityOption", () => {
  it("needs a time zone", () => {
    expect(toCityOption({ ...austin, timezone: undefined })).toBeNull();
  });
});

describe("placeLabel", () => {
  it("joins region and country", () => {
    expect(placeLabel({ region: "Texas", country: "United States" })).toBe(
      "Texas, United States",
    );
    expect(placeLabel({ region: null, country: "Singapore" })).toBe(
      "Singapore",
    );
  });
});
