// Looks up the quiz's well-known artists on Ticketmaster and writes their ids
// and photos to src/lib/taste/famous-artists.ts.
//
//   TICKETMASTER_API_KEY=… node scripts/famous-artists.mjs
//
// Edit the names below, rerun, and commit the result.

import { writeFileSync } from "node:fs";

const ARTISTS = {
  pop: [
    "Taylor Swift",
    "Sabrina Carpenter",
    "Dua Lipa",
    "Harry Styles",
    "Olivia Rodrigo",
    "Chappell Roan",
    "Billie Eilish",
    "Ariana Grande",
    "Lady Gaga",
    "Bruno Mars",
    "Ed Sheeran",
    "Charli xcx",
    "Lorde",
    "The Weeknd",
    "Tate McRae",
    "Gracie Abrams",
  ],
  indie: [
    "Phoebe Bridgers",
    "Arctic Monkeys",
    "Tame Impala",
    "Clairo",
    "The 1975",
    "Mitski",
    "Vampire Weekend",
    "boygenius",
    "Mac DeMarco",
    "Beach House",
    "The Strokes",
    "Lana Del Rey",
    "Hozier",
    "Djo",
    "Japanese Breakfast",
    "Big Thief",
  ],
  rock: [
    "Foo Fighters",
    "Red Hot Chili Peppers",
    "Green Day",
    "Paramore",
    "Queens of the Stone Age",
    "Metallica",
    "Linkin Park",
    "Pearl Jam",
    "Sleep Token",
    "Turnstile",
    "Guns N' Roses",
    "The Black Keys",
    "Muse",
    "Bring Me The Horizon",
    "Ghost",
    "Jack White",
  ],
  hiphop: [
    "Kendrick Lamar",
    "Summer Walker",
    "Tyler, The Creator",
    "Doechii",
    "Travis Scott",
    "Drake",
    "J. Cole",
    "Childish Gambino",
    "Daniel Caesar",
    "Brent Faiyaz",
    "Kehlani",
    "Steve Lacy",
    "Jhené Aiko",
    "Playboi Carti",
    "Victoria Monét",
    "GloRilla",
  ],
  electronic: [
    "Fred again..",
    "Disclosure",
    "Calvin Harris",
    "ODESZA",
    "Skrillex",
    "Kaytranada",
    "John Summit",
    "Fisher",
    "RÜFÜS DU SOL",
    "Zedd",
    "Illenium",
    "Dom Dolla",
    "Justice",
    "Four Tet",
    "Chris Lake",
    "Bonobo",
  ],
  folk: [
    "Noah Kahan",
    "Zach Bryan",
    "Kacey Musgraves",
    "Mumford & Sons",
    "Morgan Wallen",
    "Chris Stapleton",
    "The Lumineers",
    "Luke Combs",
    "Lainey Wilson",
    "Tyler Childers",
    "Sierra Ferrell",
    "Shaboozey",
    "Bon Iver",
    "Fleet Foxes",
    "Gregory Alan Isakov",
    "Billy Strings",
  ],
  jazz: [
    "Norah Jones",
    "Laufey",
    "Kamasi Washington",
    "Robert Glasper",
    "Leon Bridges",
    "Gary Clark Jr.",
    "Esperanza Spalding",
    "Jacob Collier",
    "Snarky Puppy",
    "Samara Joy",
    "Thundercat",
    "Michael Kiwanuka",
    "Gregory Porter",
    "Cory Henry",
  ],
  classical: [
    "Yo-Yo Ma",
    "Hans Zimmer",
    "Ludovico Einaudi",
    "Lang Lang",
    "Kronos Quartet",
    "Max Richter",
    "Joshua Bell",
    "Hilary Hahn",
    "Yuja Wang",
    "Andrea Bocelli",
    "Ólafur Arnalds",
    "2CELLOS",
  ],
  world: [
    "Bad Bunny",
    "Rosalía",
    "Karol G",
    "Burna Boy",
    "Peso Pluma",
    "J Balvin",
    "Rauw Alejandro",
    "Wizkid",
    "Tems",
    "Shakira",
    "Fuerza Regida",
    "Grupo Frontera",
    "Natalia Lafourcade",
    "Bomba Estéreo",
  ],
};

const OUT = new URL("../src/lib/taste/famous-artists.ts", import.meta.url);
const apiKey = process.env.TICKETMASTER_API_KEY;
if (!apiKey) throw new Error("Set TICKETMASTER_API_KEY.");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const simplify = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

/** Same choice as the event photos: a 16:9 photo at least 640 wide. */
function pickImage(images = []) {
  const photos = images
    .filter((i) => !i.fallback && i.ratio === "16_9")
    .sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (photos.find((i) => (i.width ?? 0) >= 640) ?? photos.at(-1))?.url;
}

/** The attraction with this exact name and the most upcoming shows. */
async function lookUp(name) {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/attractions");
  url.search = new URLSearchParams({
    apikey: apiKey,
    keyword: name,
    size: "20",
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(250 * 2 ** attempt);
    const response = await fetch(url);
    if (response.status === 429) continue;
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    const data = await response.json();
    const matches = (data._embedded?.attractions ?? [])
      .filter((a) => simplify(a.name) === simplify(name))
      .map((a) => ({ ...a, imageUrl: pickImage(a.images) }))
      .filter((a) => a.imageUrl)
      .sort(
        (a, b) =>
          (b.upcomingEvents?._total ?? 0) - (a.upcomingEvents?._total ?? 0),
      );
    return matches[0] ?? null;
  }
  throw new Error(`${name}: rate limited`);
}

const found = {};
const missing = [];
// Co-headliners can share a tour photo; a playlist shouldn't show it twice.
const photos = new Set();
for (const [vibe, names] of Object.entries(ARTISTS)) {
  found[vibe] = [];
  for (const name of names) {
    const artist = await lookUp(name);
    if (artist && !photos.has(artist.imageUrl)) {
      photos.add(artist.imageUrl);
      found[vibe].push({ id: artist.id, name, imageUrl: artist.imageUrl });
    } else {
      missing.push(name);
    }
  }
}

const lines = Object.entries(found).map(
  ([vibe, artists]) =>
    `  ${vibe}: [\n${artists
      .map(
        (a) =>
          `    { id: ${JSON.stringify(a.id)}, name: ${JSON.stringify(a.name)}, imageUrl: ${JSON.stringify(a.imageUrl)} },`,
      )
      .join("\n")}\n  ],`,
);
writeFileSync(
  OUT,
  `// Generated by scripts/famous-artists.mjs. Edit the names there and rerun.

import type { VibeId } from "./vibes";

export type FamousArtist = {
  /** Ticketmaster attraction id. */
  id: string;
  name: string;
  imageUrl: string;
};

/** Artists most people know, by vibe, for the quiz's questions. */
export const FAMOUS_ARTISTS: Record<VibeId, FamousArtist[]> = {
${lines.join("\n")}
};
`,
);

console.log(
  Object.entries(found)
    .map(([vibe, artists]) => `${vibe}: ${artists.length}`)
    .join(", "),
);
if (missing.length)
  console.log(`Not found or same photo: ${missing.join(", ")}`);
