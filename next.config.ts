import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
