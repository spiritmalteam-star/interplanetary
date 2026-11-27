import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* the one honest map of the house — the portal lives at `/` and
   everything else is reached through it, so the sitemap carries
   exactly that one door, truthfully dated */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
