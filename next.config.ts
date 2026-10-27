import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* the sandbox's 3.9GB ceiling silently killed next-server mid-compile;
     the turbo memory limit forces earlier GC so the house fits the vessel */
  turbopack: {
    memoryLimit: 1536,
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
