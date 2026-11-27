/* THE HOUSE'S ONE ADDRESS — production serves www.reflectme.space (the
   apex answers 308 to it), so every canonical, sitemap, robots and
   share URL names the same host. Override only for previews. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.reflectme.space"
).replace(/\/$/, "");
