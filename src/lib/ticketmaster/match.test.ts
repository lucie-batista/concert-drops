import { describe, expect, it } from "vitest";

import gnashSearch from "./__fixtures__/attractions-gnash.json";
import malcolmToddSearch from "./__fixtures__/attractions-malcolm-todd.json";
import taylorSwiftSearch from "./__fixtures__/attractions-taylor-swift.json";
import { matchAttraction, normalizeArtistName } from "./match";

describe("matchAttraction", () => {
  it("matches by Spotify ID when Ticketmaster links to the artist", () => {
    // The search returns several attractions named "gnash"; only one links to Spotify.
    expect(
      matchAttraction(
        { spotifyId: "3iri9nBFs9e4wN7PLIetAw", name: "gnash" },
        gnashSearch._embedded.attractions,
      ),
    ).toEqual({ attractionId: "K8vZ917f5O0", method: "spotify" });
  });

  it("refuses to guess between several same-name attractions", () => {
    expect(
      matchAttraction(
        { spotifyId: "someOtherArtistId00000", name: "gnash" },
        gnashSearch._embedded.attractions,
      ),
    ).toBeNull();
  });

  it("matches a single exact name when there's no Spotify link", () => {
    expect(
      matchAttraction(
        { spotifyId: "malcolmToddSpotifyId00", name: "Malcolm Todd" },
        malcolmToddSearch._embedded.attractions,
      ),
    ).toEqual({
      attractionId: malcolmToddSearch._embedded.attractions[0].id,
      method: "name",
    });
  });

  it("doesn't match tribute acts", () => {
    expect(
      matchAttraction(
        { spotifyId: "06HL4z0CvFAxyc27GXpf02", name: "Taylor Swift" },
        taylorSwiftSearch._embedded.attractions,
      ),
    ).toBeNull();
  });

  it("returns null for an empty search", () => {
    expect(matchAttraction({ spotifyId: "x", name: "Nobody" }, [])).toBeNull();
  });
});

describe("normalizeArtistName", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalizeArtistName("Beyoncé")).toBe("beyonce");
    expect(normalizeArtistName("  The  Night-Swims ")).toBe("the night swims");
  });

  it("treats & and 'and' the same", () => {
    expect(normalizeArtistName("Florence & The Machine")).toBe(
      normalizeArtistName("Florence and the Machine"),
    );
  });
});
