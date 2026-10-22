import { describe, expect, it } from "vitest";

import eventsFixture from "@/lib/ticketmaster/__fixtures__/events-sf.json";
import { normalizeEvents } from "@/lib/ticketmaster/normalize";
import type { NormalizedEvent } from "@/lib/ticketmaster/normalize";
import type { TmEvent } from "@/lib/ticketmaster/types";

import {
  dropReplacedReschedules,
  matchEventsToArtists,
  type KnownArtist,
} from "./match-events";

const events = normalizeEvents(eventsFixture._embedded.events as TmEvent[]);
const gnashShow = events.find((e) => e.id === "G5vYZ_A5NTXU-")!;
const malcolmToddShow = events.find((e) => e.id === "G5vYZ_GFHHYVA")!;

const gnash: KnownArtist = {
  id: "artist-gnash",
  spotifyId: "3iri9nBFs9e4wN7PLIetAw",
  name: "gnash",
};
const malcolmTodd: KnownArtist = {
  id: "artist-mt",
  spotifyId: "4Dev4wZyNwXfmaOsXHKWlT",
  name: "Malcolm Todd",
};

describe("matchEventsToArtists", () => {
  it("matches by Spotify ID when Ticketmaster links one", () => {
    expect(matchEventsToArtists([gnashShow], [gnash])).toEqual([
      { event: gnashShow, artistIds: ["artist-gnash"] },
    ]);
  });

  it("does not name-match an attraction that links to a different Spotify artist", () => {
    const sameNameOtherArtist = {
      ...gnash,
      spotifyId: "someoneElse0000000000",
    };
    expect(matchEventsToArtists([gnashShow], [sameNameOtherArtist])).toEqual(
      [],
    );
  });

  it("matches by exact name when there's no Spotify link", () => {
    expect(matchEventsToArtists([malcolmToddShow], [malcolmTodd])).toEqual([
      { event: malcolmToddShow, artistIds: ["artist-mt"] },
    ]);
  });

  it("skips names shared by two of my artists", () => {
    const twin = { ...malcolmTodd, id: "artist-mt-2", spotifyId: "other0000" };
    expect(
      matchEventsToArtists([malcolmToddShow], [malcolmTodd, twin]),
    ).toEqual([]);
  });

  it("drops events with none of my artists", () => {
    expect(matchEventsToArtists(events, [])).toEqual([]);
  });

  it("matches every one of my artists on a co-headlined bill", () => {
    const [match] = matchEventsToArtists(
      [malcolmToddShow],
      [malcolmTodd, { id: "artist-54", spotifyId: "x54", name: "54 Ultra" }],
    );
    expect(match.artistIds).toEqual(["artist-mt", "artist-54"]);
  });
});

describe("dropReplacedReschedules", () => {
  const original = { event: gnashShow, artistIds: ["artist-gnash"] };
  const replacement = {
    event: {
      ...gnashShow,
      id: "new-listing",
      status: "onsale",
    } satisfies NormalizedEvent,
    artistIds: ["artist-gnash"],
  };

  it("drops the original listing when a replacement exists", () => {
    expect(dropReplacedReschedules([original, replacement])).toEqual([
      replacement,
    ]);
  });

  it("keeps a rescheduled show that has no replacement", () => {
    expect(dropReplacedReschedules([original])).toEqual([original]);
  });

  it("keeps it when the other listing is a different artist", () => {
    const otherArtist = { ...replacement, artistIds: ["artist-other"] };
    expect(dropReplacedReschedules([original, otherArtist])).toEqual([
      original,
      otherArtist,
    ]);
  });
});
