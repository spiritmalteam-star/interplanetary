import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Public to every crawler; the API doors are not pages and are never
   crawled. (Authorization — not robots — is what protects private
   content: nothing private is ever served to an anonymous request.) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
