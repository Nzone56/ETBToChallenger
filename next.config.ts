import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prerender one page at a time. Several pages read every season match from
  // Turso; run in parallel, the build trips Turso's "Resource exhausted:
  // mem_hrana_response" limit and fails.
  experimental: { cpus: 1 },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
    ],
  },
};

export default nextConfig;
