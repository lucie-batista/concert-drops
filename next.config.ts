import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Don't generate AGENTS.md during development.
  agentRules: false,
  partialPrefetching: true,
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
