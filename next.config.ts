import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* the sandbox's 3.9GB ceiling silently killed next-server mid-compile;
     the turbo memory limit forces earlier GC so the house fits the vessel.
     Engines that know the key honor it; engines that do not simply warn —
     the cast keeps the intent while every Next version type-checks clean. */
  turbopack: {
    ...({ memoryLimit: 1536 } as unknown as NextConfig["turbopack"]),
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* the frame is the whole app — the dev-tools badge would sit on
     top of the composer on small screens; the page stays untouched */
  devIndicators: false,
};

export default nextConfig;
