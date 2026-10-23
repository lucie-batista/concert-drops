import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Don't generate AGENTS.md during development.
  agentRules: false,
  partialPrefetching: true,
  images: {
    // Artist photos from Spotify and show photos from Ticketmaster.
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "s1.ticketm.net" },
      { protocol: "https", hostname: "i.ticketweb.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
