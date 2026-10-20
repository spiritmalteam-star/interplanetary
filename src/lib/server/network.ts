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

/* --------------------- the astral name mint ---------------------- */
/* An anonymous visitor arrives nameless — the circle gives them a
   star-word joined to a far-walking title and a number, minted once
   from their own id, so the same visitor always wears the same name
   on every return. A signed-in passage keeps the landing profile's
   own name — the two rooms speak with one voice. */

const STAR_WORDS = [
  "Vega", "Lyra", "Nova", "Astra", "Altair", "Selene", "Rigel", "Mira",
  "Cygnus", "Vela", "Nyx", "Elara", "Thalos", "Kaelis", "Aurel", "Sorin",
  "Vesper", "Orion", "Ilya", "Zephyra", "Halcyon", "Meridian", "Solara",
  "Aether", "Onyx", "Calla", "Draven", "Eir", "Lumen", "Solenne",
];

const ASTRAL_TITLES = [
  "Wanderer", "Dreamer", "Seeker", "Oracle", "Voyager", "Keeper",
  "Weaver", "Echo", "Signal", "Ember", "Pulse", "Horizon", "Comet",
  "Beacon", "Chorus", "Lantern", "Current", "Vessel", "Psalm", "Grove",
  "Compass", "Threshold", "Aurora", "Cipher", "Vector", "Halo",
];

function mintAstralName(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h);
  };
  const word = STAR_WORDS[next() % STAR_WORDS.length];
  const title = ASTRAL_TITLES[next() % ASTRAL_TITLES.length];
  const num = 100 + (next() % 900);
  return `${word} ${title}-${num}`;
}

/** the name a maker wears in the network — the landing profile's own
    for the signed-in; a minted astral name for the quiet guest */
export function networkName(user: {
  name: string | null | undefined;
  email: string | null | undefined;
  provider?: string | null | undefined;
  id?: string | null | undefined;
}): string {
  if (user.name && user.name.trim().length >= 2) return user.name.trim().slice(0, 40);
  /* the quiet guest — every anon identity, however it announces
     itself: the provider mark, or the cookie-shaped email itself */
  const anon =
    user.provider === "anon" ||
    Boolean(user.email && user.email.startsWith("anon:")) ||
    Boolean(user.id && user.id.startsWith("stateless:"));
  if (anon) return mintAstralName(user.email || user.id || "quiet");
  const local = (user.email ?? "").split("@")[0] ?? "";
  return local.length >= 2 ? local.slice(0, 40) : mintAstralName(user.email || user.id || "quiet");
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

/** the bell's own manners — what each maker lets the bell carry.
    SQLite keeps no enums; the four switches are the law written here:
      resonance   — someone stood with their word
      echoes      — someone answered their word
      connections — introductions, requests and acceptances
      library     — the workshops' and library's own rings            */
export interface NetworkPrefs {
  resonance: boolean;
  echoes: boolean;
  connections: boolean;
  library: boolean;
}

export const DEFAULT_NETWORK_PREFS: NetworkPrefs = {
  resonance: true,
  echoes: true,
  connections: true,
  library: true,
};

export function readNetworkPrefs(raw: unknown): NetworkPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NETWORK_PREFS };
  const r = raw as Record<string, unknown>;
  return {
    resonance: r.resonance !== false,
    echoes: r.echoes !== false,
    connections: r.connections !== false,
    library: r.library !== false,
  };
}

/** which manners govern one bell ring — resonance and echoes keep
    their own switches; introductions and follows ride connections;
    community updates ride the library switch */
function prefsAllow(prefs: NetworkPrefs | null, type: string): boolean {
  if (!prefs) return true;
  if (type === "resonance") return prefs.resonance;
  if (type === "echo") return prefs.echoes;
  if (
    type === "follow" ||
    type === "connection" ||
    type === "connection_request" ||
    type === "connection_accepted"
  )
    return prefs.connections;
  /* community updates — circle_join, project_*, question_branch,
     lab_entry, lab_review, intention and event rings, and anything
     the network grows later. Unknown types still ring (never
     swallowed silently). */
  return prefs.library;
}

/** the bell's own hand — a ring is written unless the visitor would
    not hear it (their own bell never rings for their own acts, and
    the bell's manners stand between every ring and every ear) */
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
  try {
    const profile = await db.networkProfile.findUnique({
      where: { userId: opts.userId },
      select: { prefs: true },
    });
    if (!prefsAllow(readNetworkPrefs(profile?.prefs), opts.type)) return;
  } catch {
    /* a read bell still rings — the manners rest */
  }
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
