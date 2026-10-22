import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Don't generate AGENTS.md during development.
  agentRules: false,
  partialPrefetching: true,
  images: {
    // Artist photos from Spotify.
    remotePatterns: [{ protocol: "https", hostname: "i.scdn.co" }],
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
