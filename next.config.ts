import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  // Disable SW in dev so HMR/route changes don't get cached unexpectedly.
  // It still runs in production builds.
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  // Serwist adds a webpack plugin. Next 16 defaults to Turbopack for dev and
  // complains about the unused webpack config. We disable Serwist in dev
  // (see above) and tell Next we know about Turbopack — Turbopack still runs
  // dev, webpack only runs for `pnpm build`.
  turbopack: {},
}

export default withSerwist(nextConfig)
