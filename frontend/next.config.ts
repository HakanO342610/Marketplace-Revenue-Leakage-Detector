import type { NextConfig } from "next";

/**
 * ⚠️ CRITICAL — DO NOT REMOVE the `BACKEND_INTERNAL_URL` ARG from
 * `frontend/Dockerfile`.
 *
 * Next.js evaluates `rewrites()` at BUILD time (during `next build`)
 * and serializes the destinations into `routes-manifest.json`. Runtime
 * env vars are NOT picked up by rewrites. So in Docker production:
 *   1. `frontend/Dockerfile` builder stage exposes BACKEND_INTERNAL_URL
 *      via `ARG` + `ENV` (default: http://backend:3101)
 *   2. `docker-compose.prod.yml` passes the value as a build arg
 *   3. `npm run build` reads it from process.env and bakes it into the
 *      manifest
 *
 * Removing any of those steps means `/api/*` rewrites will point at
 * `localhost:3101` inside the frontend container → ECONNREFUSED 500.
 *
 * Symptoms if broken:
 *   - All `/api/*` requests through the frontend return 500
 *   - Frontend logs show `connect ECONNREFUSED 127.0.0.1:3101`
 *
 * Fix:
 *   docker compose -f docker-compose.prod.yml --env-file .env build frontend
 *   docker compose -f docker-compose.prod.yml --env-file .env up -d frontend
 */

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3101";

const isProdBuild =
  process.env.NODE_ENV === "production" &&
  // `next build` sets this; `next dev` does not.
  process.env.NEXT_PHASE !== "phase-development-server";

if (isProdBuild && BACKEND_URL.includes("localhost")) {
  // Loud build-time warning. Doesn't fail the build (so local prod
  // builds without Docker still work), but anyone reading CI logs will
  // see this immediately.
  // eslint-disable-next-line no-console
  console.warn(
    "\n[next.config] ⚠️  BACKEND_INTERNAL_URL is not set during this " +
      "production build. The rewrite manifest will hard-code " +
      `'${BACKEND_URL}', which will NOT reach a backend running in a ` +
      "separate Docker container.\n" +
      "    Fix: pass --build-arg BACKEND_INTERNAL_URL=http://backend:3101 " +
      "to `docker build`, or use docker-compose.prod.yml which sets it.\n",
  );
}

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
