"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Atom,
  BookOpen,
  CircleQuestionMark,
  FlaskConical,
  Feather,
  Flame,
  Handshake,
  MessagesSquare,
  Microscope,
  MoonStar,
  Music,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE NETWORK'S SHARED WALLS — the types, the marks and the quiet    */
/*  hands every room of the living evolution network speaks with.      */
/*                                                                     */
/*  THE PORCELAIN WEATHER — milk-white and cream, clean and three-     */
/*  dimensional: extruded cards, soft deep shadows, glassy bars.       */
/* ------------------------------------------------------------------ */

export type GatheringKind =
  | "reflection"
  | "creation"
  | "dream"
  | "music"
  | "book"
  | "discovery"
  | "question"
  | "hypothesis"
  | "experiment"
  | "finding"
  | "collaboration"
  | "discussion"
  | "intention";

export const KIND_META: Record<GatheringKind, { icon: LucideIcon; accent: string }> = {
  reflection: { icon: Feather, accent: "#8a6f46" },
  creation: { icon: Sparkles, accent: "#a16207" },
  dream: { icon: MoonStar, accent: "#7c5cad" },
  music: { icon: Music, accent: "#0f766e" },
  book: { icon: BookOpen, accent: "#8a6d3b" },
  discovery: { icon: Atom, accent: "#0d9488" },
  question: { icon: CircleQuestionMark, accent: "#9a6b8a" },
  hypothesis: { icon: FlaskConical, accent: "#7c5cad" },
  experiment: { icon: Microscope, accent: "#0d9488" },
  finding: { icon: Atom, accent: "#0f766e" },
  collaboration: { icon: Handshake, accent: "#a16207" },
  discussion: { icon: MessagesSquare, accent: "#8a6f46" },
  intention: { icon: Flame, accent: "#b45309" },
};

/* The composer's own kinds — conversations only. "creation" stays in
   the meta for the older offerings already hanging on the walls, but
   it is no longer offered to a new hand: creations are published from
   the rooms where they were born, never composed here. */
export const KIND_ORDER: GatheringKind[] = [
  "reflection",
  "question",
  "hypothesis",
  "discovery",
  "finding",
  "experiment",
  "collaboration",
  "discussion",
  "intention",
  "dream",
  "music",
  "book",
];

/* THE EVIDENCE LADDER — seven honest steps between a hunch and a
   settled truth. Nothing on the walls is called verified because
   people agreed with it. */
export const EVIDENCE_LEVELS = [
  "established",
  "preliminary",
  "hypothesis",
  "personal",
  "philosophical",
  "creative",
  "disputed",
] as const;

export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  established: "Established evidence",
  preliminary: "Preliminary evidence",
  hypothesis: "Hypothesis",
  personal: "Personal experience",
  philosophical: "Philosophical interpretation",
  creative: "Creative speculation",
  disputed: "Disputed claim",
};

export const EVIDENCE_STYLE: Record<EvidenceLevel, string> = {
  established: "border-[#5f7a52]/40 text-[#4f6a44]",
  preliminary: "border-[#0d9488]/40 text-[#0f766e]",
  hypothesis: "border-[#7c5cad]/35 text-[#7c5cad]",
  personal: "border-[#cbb98d]/60 text-[#8a6f46]",
  philosophical: "border-[#9a6b8a]/35 text-[#9a6b8a]",
  creative: "border-[#a16207]/40 text-[#a16207]",
  disputed: "border-[#b45309]/45 text-[#b45309]",
};

export function isEvidenceLevel(v: unknown): v is EvidenceLevel {
  return typeof v === "string" && (EVIDENCE_LEVELS as readonly string[]).includes(v);
}

export const KIND_OFFERING_LABEL: Record<GatheringKind, string> = {
  reflection: "A reflection",
  creation: "A creation",
  dream: "A dream",
  music: "A composition",
  book: "A written work",
  discovery: "A discovery",
  question: "A question",
  hypothesis: "A hypothesis",
  experiment: "An experiment",
  finding: "A research finding",
  collaboration: "A collaboration request",
  discussion: "A community discussion",
  intention: "An intention",
};

export const KIND_FILTER_LABEL: Record<GatheringKind, string> = {
  reflection: "Reflections",
  creation: "Creations",
  dream: "Dreams",
  music: "Music",
  book: "Books",
  discovery: "Discoveries",
  question: "Questions",
  hypothesis: "Hypotheses",
  experiment: "Experiments",
  finding: "Findings",
  collaboration: "Collaborations",
  discussion: "Discussions",
  intention: "Intentions",
};

export const FOCUS_LABELS: Record<string, string> = {
  consciousness: "Consciousness & Awareness",
  art: "Art & Imagination",
  music: "Music & Sound",
  science: "Science & Discovery",
  philosophy: "Philosophy",
  dreams: "Dreams & Symbolism",
  humanity: "Humanity & Earth",
  technology: "Technology & Future",
  projects: "Collaborative Projects",
};

export const PROJECT_FOCUS_LABELS: Record<string, string> = {
  book: "Books & Stories",
  music: "Music",
  artwork: "Artwork",
  research: "Research",
  invention: "Inventions",
  community: "Community Projects",
};

export interface GatheringPost {
  id: string;
  kind: string;
  title: string;
  body: string;
  sector: string | null;
  region: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
  tags: string[];
  circle: { id: string; name: string } | null;
  epistemic?: string | null;
  resonanceCount: number;
  echoCount: number;
  repostCount: number;
  createdAt: string;
  author: { name: string; image: string | null; anon: boolean };
  mine: boolean;
  resonated: boolean;
  bookmarked?: boolean;
  reposted?: boolean;
  /* a repost's attribution — whose words walked into the room */
  repostNote?: string | null;
  repostAuthor?: string | null;
  /* the rooms a work can grow into */
  hasQuestion?: boolean;
  hasLab?: boolean;
  hasIntentionSpace?: boolean;
}

/* THE ATLAS' OWN SHORES — the seven regions the hall's map draws.
   The ids are the post's own words in the database; the names are
   what the hall wears. */
export const REGION_IDS = [
  "north-america",
  "south-america",
  "europe",
  "africa",
  "middle-east",
  "asia",
  "oceania",
] as const;

export type RegionId = (typeof REGION_IDS)[number];

export const REGION_LABELS: Record<RegionId, string> = {
  "north-america": "North America",
  "south-america": "South America",
  europe: "Europe",
  africa: "Africa",
  "middle-east": "Middle East & West Asia",
  asia: "Asia",
  oceania: "Oceania & the Pacific",
};

export function regionLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return (REGION_LABELS as Record<string, string>)[id] ?? null;
}

export interface GatheringEcho {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: { name: string; image: string | null; anon: boolean };
  isMine: boolean;
}

/* ---------- the second generation: signature rooms ---------- */

export interface QuestionBranchRow {
  id: string;
  parentId: string | null;
  kind: string;
  body: string;
  evidence: string;
  createdAt: string;
  author: { id: string; name: string; anon: boolean };
}

export interface QuestionDetail {
  id: string;
  postId: string;
  title: string;
  body: string;
  context: string | null;
  disciplines: string[];
  status: string;
  branchCount: number;
  contributorCount: number;
  mine: boolean;
  createdAt: string;
  updatedAt: string;
  branches: QuestionBranchRow[];
}

export interface LabEntryRow {
  id: string;
  kind: string;
  body: string;
  dataUrl: string | null;
  createdAt: string;
  author: { id: string; name: string; anon: boolean };
}

export interface LabReviewRow {
  id: string;
  verdict: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; anon: boolean };
}

export interface LabDetail {
  id: string;
  title: string;
  question: string;
  hypothesis: string;
  background: string | null;
  methodology: string | null;
  materials: string | null;
  safety: string | null;
  focus: string;
  status: string;
  memberCount: number;
  mine: boolean;
  membership: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; anon: boolean };
  entries: LabEntryRow[];
  reviews: LabReviewRow[];
}

export interface MilestoneRow {
  id: string;
  title: string;
  detail: string | null;
  position: number;
  done: boolean;
}

export interface TaskRow {
  id: string;
  title: string;
  claimedBy: string | null;
  done: boolean;
}

export interface IntentionUpdateRow {
  id: string;
  body: string;
  progress: number;
  createdAt: string;
  author: { id: string; name: string; anon: boolean };
}

export interface IntentionDetail {
  id: string;
  title: string;
  purpose: string;
  region: string | null;
  status: string;
  memberCount: number;
  mine: boolean;
  joined: boolean;
  progress: number;
  createdAt: string;
  owner: { id: string; name: string; anon: boolean };
  milestones: MilestoneRow[];
  tasks: TaskRow[];
  updates: IntentionUpdateRow[];
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  scheduledFor: string;
  durationMin: number;
  format: string;
  status: string;
  attendeeCount: number;
  joined: boolean;
  mine: boolean;
  host: { id: string; name: string; anon: boolean };
}

export interface EventDetail extends EventRow {
  summary: string | null;
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    mine: boolean;
    author: { id: string; name: string; anon: boolean };
  }>;
}

export interface PersonCard {
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
}

export interface CircleCard {
  id: string;
  name: string;
  description: string | null;
  focus: string;
  visibility: string;
  memberCount: number;
  postCount: number;
  joined: boolean;
  role: string | null;
  owner: { name: string };
  createdAt: string;
}

export interface ProjectCard {
  id: string;
  title: string;
  description: string | null;
  focus: string;
  status: string;
  seedPost: { id: string; title: string } | null;
  libraryItem: { id: string; title: string } | null;
  memberCount: number;
  entryCount: number;
  owner: { id: string; name: string };
  joined: boolean;
  mine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationCard {
  id: string;
  isGroup: boolean;
  title: string;
  members: Array<{ id: string; name: string; image: string | null; anon: boolean }>;
  lastMessage: { body: string; senderName: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
  sender: { id: string; name: string };
}

export interface LibraryCard {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  authorName: string;
  mine: boolean;
  project: { id: string; title: string; status: string } | null;
  createdAt: string;
}

export interface NotificationRow {
  id: string;
  type: string;
  actorName: string;
  body: string | null;
  refType: string | null;
  refId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NetworkPrefsState {
  resonance: boolean;
  echoes: boolean;
  connections: boolean;
  library: boolean;
}

export interface MeState {
  id: string;
  name: string;
  bio: string | null;
  interests: string[];
  disciplines: string[];
  visibility: string;
  /* the landing passage — the two profiles are one: the house's own
     email for the signed-in; a quiet guest carries nothing personal */
  email: string | null;
  anon: boolean;
  since: string | null;
  prefs: NetworkPrefsState;
  counts: {
    posts: number;
    circles: number;
    projects: number;
    connections: number;
    pendingIn: number;
    unreadNotifications: number;
  };
}

/* THE VIBE — retired. The hall wears the house's own weather now:
   porcelain in the daylight, the site's own crystal dark at night.
   No second palette, no constellation — the flicker left with it. */

/* the quiet fetch every door speaks through */
export async function netFetch<T>(
  url: string,
  opts?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(url, {
    method: opts?.method ?? "GET",
    cache: "no-store",
    headers: opts?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data || (data as { error?: string }).error) {
    throw new Error(
      (data && (data as { error?: string }).error) || "The network could not be reached."
    );
  }
  return data as T;
}

export function relativeTime(iso: string, t: (k: string) => string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("just now");
  if (m < 60) return `${m} ${t("min ago")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${t("h ago")}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ${t("days ago")}`;
  return new Date(iso).toLocaleDateString();
}

/* the maker's mark — a quiet cream disc with the name's first letter */
export function MakerMark({ name, size = 30 }: { name: string; size?: number }) {
  const letter = (name.trim()[0] ?? "·").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="gp-pearl flex shrink-0 items-center justify-center rounded-full border border-white/90 font-[family-name:var(--font-cinzel)] font-semibold text-[#8a6f46]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: "linear-gradient(150deg, #fdf9ef 0%, #f3ead6 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px -2px rgba(122,103,70,0.35)",
      }}
    >
      {letter}
    </span>
  );
}

/* the porcelain extruded card — the network's own card stock */
export const GP_CARD =
  "rounded-[22px] border border-white/80 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_26px_-14px_rgba(122,103,70,0.35)]";

/* the gold hand — the network's one call-to-action dress */
export const GP_HAND =
  "focus-glow flex items-center justify-center gap-2 rounded-full border border-white/90 bg-[linear-gradient(150deg,#fffdf8_0%,#f3ead6_100%)] px-4 py-2.5 text-[12.5px] font-semibold text-[#8a6f46] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_18px_-8px_rgba(122,103,70,0.45)] transition-all duration-300 hover:brightness-[1.03] disabled:opacity-45";

export const GP_GHOST =
  "focus-glow flex items-center justify-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-4 py-2.5 text-[12.5px] font-semibold text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428] disabled:opacity-50";

/* the quiet input — porcelain fields */
export const GP_INPUT =
  "w-full rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-2.5 text-[13px] leading-relaxed text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d] [overflow-wrap:anywhere]";

/* the small icon hand — a compact round porcelain button that speaks
   through its title and its aria-label, not through long words */
export const GP_ICON_BTN =
  "focus-glow flex shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428] disabled:opacity-50";

/* the evidence label as a small wearable chip */
export function EvidenceChip({ level }: { level: string }) {
  if (!isEvidenceLevel(level)) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border bg-white/60 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
        EVIDENCE_STYLE[level]
      )}
    >
      {EVIDENCE_LABEL[level]}
    </span>
  );
}

/* an empty room speaks honestly */
export function EmptyRoom({
  icon: Icon,
  line,
}: {
  icon: LucideIcon;
  line: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span
        aria-hidden="true"
        className="gp-pearl flex size-12 items-center justify-center rounded-[16px] border border-white/90"
        style={{
          background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
        }}
      >
        <Icon className="size-5 text-[#a2947c]" />
      </span>
      <p className="max-w-[420px] font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.85] text-[#8a7c64]">
        {line}
      </p>
    </div>
  );
}

/* a section's own small heading */
export function RoomLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]">
      {children}
    </p>
  );
}

/* the nine focuses as wearable chips */
export function FocusChip({
  focus,
  on,
  onChoose,
}: {
  focus: string;
  on: boolean;
  onChoose: (f: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChoose(on ? null : focus)}
      aria-pressed={on}
      className={cn(
        "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
        on
          ? "border-[#cbb98d] bg-white text-[#5c5344]"
          : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
      )}
    >
      {FOCUS_LABELS[focus] ?? focus}
    </button>
  );
}

/* a tiny polling hook — the messages' own breath */
export function useInterval(cb: () => void, ms: number | null) {
  const saved = useRef(cb);
  useEffect(() => {
    saved.current = cb;
  });
  useEffect(() => {
    if (ms === null) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/* a quiet action note that fades on its own */
export function useFlashNote() {
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(id);
  }, [note]);
  const flash = useCallback((line: string) => setNote(line), []);
  return { note, flash, clear: () => setNote(null) };
}
