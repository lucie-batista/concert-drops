import { describe, expect, it } from "vitest";

import { combineArtistLists, pickImage } from "./affinity";
import type { SpotifyArtist } from "./types";

const artist = (
  id: string,
  extra: Partial<SpotifyArtist> = {},
): SpotifyArtist => ({
  id,
  name: `Artist ${id}`,
  ...extra,
});

describe("combineArtistLists", () => {
  it("records each list an artist appears in, with its rank", () => {
    const { artists, affinity } = combineArtistLists({
      short_term: [artist("a"), artist("b")],
      medium_term: [artist("b"), artist("a")],
      long_term: [artist("a")],
      followed: [artist("a"), artist("c")],
    });

    expect(artists.map((a) => a.spotifyId)).toEqual(["a", "b", "c"]);
    expect(affinity.filter((r) => r.spotifyId === "a")).toEqual([
      { spotifyId: "a", source: "top_short_term", rank: 1 },
      { spotifyId: "a", source: "top_medium_term", rank: 2 },
      { spotifyId: "a", source: "top_long_term", rank: 1 },
      { spotifyId: "a", source: "followed", rank: null },
    ]);
  });

  it("includes followed artists that aren't in any top list", () => {
    const { artists, affinity } = combineArtistLists({
      short_term: [],
      medium_term: [],
      long_term: [],
      followed: [artist("x", { genres: ["indie pop"] })],
    });
    expect(artists).toEqual([
      {
        spotifyId: "x",
        name: "Artist x",
        imageUrl: null,
        genres: ["indie pop"],
      },
    ]);
    expect(affinity).toEqual([
      { spotifyId: "x", source: "followed", rank: null },
    ]);
  });

  it("handles empty lists", () => {
    expect(
      combineArtistLists({
        short_term: [],
        medium_term: [],
        long_term: [],
        followed: [],
      }),
    ).toEqual({ artists: [], affinity: [] });
  });
});

describe("pickImage", () => {
  const images = [
    { url: "large", width: 640, height: 640 },
    { url: "medium", width: 320, height: 320 },
    { url: "small", width: 160, height: 160 },
  ];

  it("picks the smallest image that's at least 300px wide", () => {
    expect(pickImage(images)).toBe("medium");
  });

  it("falls back to the largest image when all are small", () => {
    expect(pickImage([{ url: "tiny", width: 64, height: 64 }, images[2]])).toBe(
      "small",
    );
  });

  it("returns null without images", () => {
    expect(pickImage([])).toBeNull();
    expect(pickImage()).toBeNull();
  });
});
