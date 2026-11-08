import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE NETWORK'S OWN MANNERS — shared between every door of the       */
/*  living evolution network.                                          */
/*                                                                     */
/*  THE HONESTY LAWS (carried over from the hall):                     */
/*  - every maker keeps the name they arrived with;                    */
/*  - nothing is published, messaged or introduced without the         */
/*    visitor's own hand;                                              */
/*  - a blocked visitor's words never reach the one who closed the     */
/*    door — feeds, circles, encounters and messages all read the      */
/*    same quiet walls;                                                */
/*  - the bell never lies: every ring is a real row, every read a      */
/*    real timestamp.                                                  */
/* ------------------------------------------------------------------ */

export const NETWORK_FOCUSES = [
  "consciousness",
  "art",
  "music",
  "science",
  "philosophy",
  "dreams",
  "humanity",
  "technology",
  "projects",
] as const;

export type NetworkFocus = (typeof NETWORK_FOCUSES)[number];

export function isNetworkFocus(v: unknown): v is NetworkFocus {
  return typeof v === "string" && (NETWORK_FOCUSES as readonly string[]).includes(v);
}

export const PROJECT_FOCUSES = ["book", "music", "artwork", "research", "invention", "community"] as const;
export type ProjectFocus = (typeof PROJECT_FOCUSES)[number];

export function isProjectFocus(v: unknown): v is ProjectFocus {
  return typeof v === "string" && (PROJECT_FOCUSES as readonly string[]).includes(v);
}

export const LIBRARY_CATEGORIES = [
  "reflection",
  "artwork",
  "music",
  "book",
  "research",
  "invention",
  "project",
  "discovery",
  "question",
] as const;

/** the name a maker wears in the network */
export function networkName(user: {
  name: string | null | undefined;
  email: string | null | undefined;
  provider?: string | null | undefined;
}): string {
  if (user.name && user.name.trim().length >= 2) return user.name.trim().slice(0, 40);
  if (user.provider === "anon") return "A quiet explorer";
  const local = (user.email ?? "").split("@")[0] ?? "";
  return local.length >= 2 ? local.slice(0, 40) : "A quiet explorer";
}

/** the quiet walls — ids this visitor has closed a door on, and the
    ids of those who closed a door on them (both directions rest) */
export async function wallIdsFor(userId: string): Promise<Set<string>> {
  const rows = await db.networkBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  }
  return ids;
}

/** the bell's own hand — a ring is written unless the visitor would
    ring their own bell */
export async function notify(opts: {
  userId: string;
  actorId: string;
  actorName: string;
  type: string;
  body?: string;
  refType?: string;
  refId?: string;
}): Promise<void> {
  if (opts.userId === opts.actorId) return;
  await db.networkNotification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      actorName: opts.actorName,
      body: opts.body?.slice(0, 240) ?? null,
      refType: opts.refType ?? null,
      refId: opts.refId ?? null,
    },
  });
}

/** the shape a person wears in encounters and discoveries */
export type PersonCard = {
  id: string;
  name: string;
  image: string | null;
  anon: boolean;
  bio: string | null;
  interests: string[];
  disciplines: string[];
  postCount: number;
  circleCount: number;
  projectCount: number;
};

export function splitList(v: string | null | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 8);
}
