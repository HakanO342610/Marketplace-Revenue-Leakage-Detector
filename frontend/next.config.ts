import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3101";

const nextConfig: NextConfig = {
  // Standalone output: produces .next/standalone with a minimal server.js
  // for slim Docker production images.
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
