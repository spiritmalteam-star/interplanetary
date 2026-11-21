import { db } from "@/lib/db";
import { generateImage } from "@/lib/image-engine";

/* ------------------------------------------------------------------ */
/*  THE PUBLICATION'S OWN FACE — every offering walks with a picture.  */
/*                                                                     */
/*  When a work is published (or found published without its face),    */
/*  the atelier paints one portrait picture from the offering's own    */
/*  words — title, body, tags, kind — in the possibilities realm's     */
/*  own tall frame, so the hall, the gallery and the TikTok-true walk  */
/*  all breathe with imagery.                                          */
/*                                                                     */
/*  THE HONEST BRUSHES:                                                */
/*  · the sky's own painter first (the image engine's chain);          */
/*  · if the sky is quiet, the KEEPER'S BRUSH paints a deterministic   */
/*    ink painting (a seeded SVG wash) — a publication never stands    */
/*    faceless just because one engine had a still hour.               */
/*                                                                     */
/*  EVERY adornment is honest: aiMedia is set true and the alt text    */
/*  says the picture was painted for the offering.                     */
/* ------------------------------------------------------------------ */

const PORTRAIT_SIZE = "720x1440";

interface AdornSeed {
  kind: string;
  title: string;
  body: string;
  tags: string | null;
  sector: string | null;
  sourcePortal: string | null;
}

/** the prompt contract — subject, context, frame, constraints. */
function buildAdornPrompt(seed: AdornSeed): string {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  const subject = clean(seed.title).slice(0, 120) || "an offering without a name";
  const context = clean(seed.body).slice(0, 420);
  const tags = (seed.tags ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  const family =
    seed.kind === "book"
      ? "a literary work"
      : seed.kind === "music"
        ? "a musical composition"
        : seed.kind === "artwork"
          ? "an artwork"
          : seed.kind === "discovery"
            ? "a research discovery"
            : "a reflective offering";

  return [
    `An original illustrative painting made for ${family} titled "${subject}".`,
    context ? `The work speaks of: ${context}.` : "",
    tags.length > 0 ? `Its themes: ${tags.join(", ")}.` : "",
    `Composition: one calm scene filling a tall vertical frame (9:16 aspect), painterly, luminous, with a soft deep ground and a quiet focal light; evocative rather than literal; editorial illustration quality.`,
    `Hard constraints: absolutely no written text, no letters, no watermark, no logo, no signature; no real person's likeness; conceptual and illustrative in tone — a visual meditation on the theme, never a photograph of an observed phenomenon and never a scientific claim.`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 1800);
}

function altFor(title: string): string {
  return `AI-generated illustration made for the offering "${title.slice(0, 80)}"`;
}

/* ---------------- the keeper's brush (deterministic SVG) ---------------- */

function hashOf(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const PALETTES: Array<[string, string, string]> = [
  ["#2b2410", "#8a6f46", "#f4ecda"],
  ["#0f2b28", "#0d9488", "#e4d9bd"],
  ["#241a33", "#7c5cad", "#efe6d2"],
  ["#2e1c29", "#a16207", "#f2e7cd"],
  ["#0e2b2a", "#3d6b5c", "#f4ecda"],
  ["#331c0e", "#b45309", "#efe0c0"],
];

/** A quiet ink painting, seeded by the offering itself — the picture
    that never fails. Stars, a horizon and the work's own sigil-light. */
function keeperPainting(seed: AdornSeed): string {
  const h = hashOf(seed.title + seed.kind + (seed.sector ?? ""));
  const [deep, mid, light] = PALETTES[h % PALETTES.length];
  const rand = (n: number) => ((h >> n) % 1000) / 1000;
  const stars: string[] = [];
  for (let i = 0; i < 26; i++) {
    const x = Math.round(rand(i * 3) * 720);
    const y = Math.round(rand(i * 7 + 3) * 900);
    const r = 1 + rand(i * 11 + 5) * 3.2;
    const o = 0.25 + rand(i * 13 + 7) * 0.65;
    stars.push(
      `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${light}" opacity="${o.toFixed(2)}"/>`
    );
  }
  const horizonY = 620 + Math.round(rand(17) * 180);
  const initial = (seed.title.trim()[0] ?? "*").toUpperCase().replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1440" viewBox="0 0 720 1440">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${deep}"/>
<stop offset="0.62" stop-color="${mid}"/>
<stop offset="1" stop-color="${deep}"/>
</linearGradient>
<radialGradient id="halo" cx="0.5" cy="0.42" r="0.55">
<stop offset="0" stop-color="${light}" stop-opacity="0.55"/>
<stop offset="1" stop-color="${light}" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="720" height="1440" fill="url(#sky)"/>
<rect width="720" height="1440" fill="url(#halo)"/>
<circle cx="${120 + Math.round(rand(5) * 480)}" cy="${180 + Math.round(rand(9) * 260)}" r="${70 + Math.round(rand(13) * 70)}" fill="${light}" opacity="0.32"/>
${stars.join("\n")}
<path d="M0 ${horizonY} Q ${180 + Math.round(rand(3) * 360)} ${horizonY - 90 - Math.round(rand(6) * 120)} 720 ${horizonY}" stroke="${light}" stroke-width="2.5" fill="none" opacity="0.6"/>
<path d="M0 ${horizonY + 46} Q ${360 - Math.round(rand(8) * 240)} ${horizonY - 30} 720 ${horizonY + 46}" stroke="${mid}" stroke-width="1.5" fill="none" opacity="0.5"/>
<text x="360" y="790" text-anchor="middle" font-family="Georgia, serif" font-size="150" fill="${light}" opacity="0.85">${initial}</text>
<rect x="250" y="880" width="220" height="1.5" fill="${light}" opacity="0.5"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n/g, ""))}`;
}

/* ---------------- the adornment itself ---------------- */

export interface AdornOutcome {
  ok: boolean;
  engine: "sky" | "keeper" | "skipped";
  reason?: string;
}

/** THE FACE IS WRITTEN through the graceful shelf: a young sky that
    has not built the newest columns yet still receives the picture on
    the column it does carry (cover) — the face walks wherever the
    offering walks. */
async function writeFace(postId: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    await db.gatheringPost.update({ where: { id: postId }, data: data as never });
    return true;
  } catch {
    /* the full dress may not fit this sky — lay the face alone */
    try {
      await db.gatheringPost.update({
        where: { id: postId },
        data: { cover: data.cover as string },
      });
      return true;
    } catch {
      return false;
    }
  }
}

/** THE FACE'S OWN READ — through the graceful shelf: the offering is
    read on whichever shelf the sky carries, the newest fields falling
    back to their honest defaults. */
async function readAdornSeed(
  postId: string
): Promise<(AdornSeed & { cover: string | null; mediaUrl: string | null; status: string }) | null> {
  const levels: Array<Record<string, true>> = [
    {
      id: true, kind: true, title: true, body: true, tags: true, sector: true,
      sourcePortal: true, cover: true, mediaUrl: true, status: true,
    },
    {
      id: true, kind: true, title: true, body: true, tags: true, sector: true,
      sourcePortal: true, cover: true, status: true,
    },
    { id: true, kind: true, title: true, body: true, status: true, cover: true },
  ];
  for (const select of levels) {
    try {
      const post = await db.gatheringPost.findUnique({
        where: { id: postId },
        select: select as never,
      }) as Record<string, unknown> | null;
      if (!post) return null;
      return {
        kind: String(post.kind ?? "reflection"),
        title: String(post.title ?? ""),
        body: String(post.body ?? ""),
        tags: (post.tags as string | null) ?? null,
        sector: (post.sector as string | null) ?? null,
        sourcePortal: (post.sourcePortal as string | null) ?? null,
        cover: (post.cover as string | null) ?? null,
        mediaUrl: (post.mediaUrl as string | null) ?? null,
        status: String(post.status ?? "published"),
      };
    } catch {
      /* this shelf is not the sky's — try the next */
    }
  }
  return null;
}

/** Paint one publication's face. Skips offerings that already walk
    with a picture. Never throws — a failed face is honestly reported. */
export async function adornPublication(postId: string): Promise<AdornOutcome> {
  const read = await readAdornSeed(postId);
  if (!read) {
    return { ok: false, engine: "skipped", reason: "unreadable" };
  }
  const { cover, mediaUrl, status } = read;
  if (status !== "published") {
    return { ok: false, engine: "skipped", reason: "not_published" };
  }
  if (cover || mediaUrl) {
    return { ok: true, engine: "skipped", reason: "already_faceful" };
  }
  const seed: AdornSeed = {
    kind: read.kind,
    title: read.title,
    body: read.body,
    tags: read.tags,
    sector: read.sector,
    sourcePortal: read.sourcePortal,
  };

  const prompt = buildAdornPrompt(seed);
  const alt = altFor(seed.title);

  /* the sky's own painter first */
  try {
    const img = await generateImage(prompt, { size: PORTRAIT_SIZE });
    if (img?.url) {
      const written = await writeFace(postId, {
        cover: img.url,
        mediaUrl: img.url,
        mediaType: "image",
        mediaName: null,
        aiMedia: true,
        aiStyle: "possibilities-portrait",
        altText: alt,
      });
      return { ok: written, engine: written ? "sky" : "skipped", reason: written ? undefined : "unwritable" };
    }
  } catch {
    /* the sky stumbled — the keeper's brush stands behind it */
  }

  /* the keeper's brush — the painting that never fails */
  try {
    const painting = keeperPainting(seed);
    const written = await writeFace(postId, {
      cover: painting,
      mediaUrl: painting,
      mediaType: "image",
      mediaName: null,
      aiMedia: true,
      aiStyle: "keeper's brush",
      altText: alt,
    });
    return { ok: written, engine: written ? "keeper" : "skipped", reason: written ? undefined : "unwritable" };
  } catch {
    return { ok: false, engine: "skipped", reason: "unpaintable" };
  }
}

/** One batch of faces — the backfill's own stride. Returns how many
    were painted and how many published works still stand faceless.
    The faceless read itself wears the graceful shelf: on a sky without
    the mediaUrl column the cover column alone names the faceless. */
export async function adornPublicationsBatch(take = 4): Promise<{
  painted: number;
  remaining: number;
}> {
  let faceless: { id: string }[] = [];
  try {
    faceless = await db.gatheringPost.findMany({
      where: { status: "published", cover: null, mediaUrl: null },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
  } catch {
    try {
      faceless = await db.gatheringPost.findMany({
        where: { status: "published", cover: null },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
    } catch {
      faceless = [];
    }
  }
  const remaining = faceless.length;
  const batch = faceless.slice(0, Math.max(1, Math.min(10, take)));
  let painted = 0;
  for (const row of batch) {
    const out = await adornPublication(row.id);
    if (out.ok && out.engine !== "skipped") painted += 1;
  }
  return { painted, remaining: Math.max(0, remaining - batch.length) };
}
