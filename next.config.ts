import type { NextConfig } from "next";

/* THE HOUSE'S SHIELD — security headers on every route. The laws:
   clickjacking shut out (frame-ancestors), MIME confusion shut out,
   referrers measured, the door opened only to the passage's own
   partners (Google OAuth, Stripe). `unsafe-inline` scripts remain —
   the App Router's hydration payload needs them; everything else is
   closed as tightly as the house allows without breaking the Google
   passage or the purse. */
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://accounts.google.com https://checkout.stripe.com",
  "form-action 'self' https://accounts.google.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* microphone stays with the house itself — the visitor's spoken
     questions are heard by their own origin only */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=(self \"https://checkout.stripe.com\"), interest-cohort=()",
  },
  /* the Google passage opens as a top-level crossing; popups from it
     must still be able to talk back (OAuth window messaging) */
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* THE ONE ADDRESS LAW — www is the canonical home (the Google
     redirect_uri, the session cookies and the app all live there).
     The bare apex is sent to www once, permanently, with its path and
     query intact, so a visitor can never be half-signed-in across two
     hostnames. Vercel's own domain redirect answers first when set;
     this is the repository's own guarantee that needs no dashboard. */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "reflectme.space" }],
        destination: "https://www.reflectme.space/:path*",
        permanent: true,
      },
    ];
  },
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
  /* THE LIGHTER PICTURES — every optimized image is offered in AVIF
     first (then WebP): the same paintings at a fraction of the bytes,
     so the threshold's first breath is quick on the phone. */
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
