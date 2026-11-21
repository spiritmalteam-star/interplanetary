import type { MetadataRoute } from "next";

/* the one honest map of the house — the portal lives at `/` and
   everything else is reached through it, so the sitemap carries
   exactly that one door, truthfully dated */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://reflectme.space",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
