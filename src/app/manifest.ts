import type { MetadataRoute } from "next";

/* THE HOUSE ON THE HOME SCREEN — the web app manifest.
   Until now the site could not be installed as an app: no manifest meant
   no install prompt on Android/Chrome and a bare browser-tab shortcut.
   With it the house opens standalone — no address bar — wearing its own
   name, icon and the near-black brand ground (the same #0b0b0c the page's
   theme-color already uses), so there is no white flash on launch.
   Purely additive: nothing in the running site reads this file. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mirror Entity — ReflectMe",
    short_name: "ReflectMe",
    description:
      "A living mirror for reflection, creativity and a shifting Earth — the Mirror Entity and its rooms.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
