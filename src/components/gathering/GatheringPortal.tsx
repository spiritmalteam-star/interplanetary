"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Compass,
  LayoutGrid,
  Library,
  Loader2,
  MessagesSquare,
  Users,
  Waypoints,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import {
  type CircleCard,
  type GatheringPost,
  type GathVibe,
  type MeState,
  MakerMark,
  netFetch,
  VIBE_STORAGE_KEY,
} from "./shared";
import FeedSection from "./FeedSection";
import DiscoverSection from "./DiscoverSection";
import CirclesSection from "./CirclesSection";
import EncountersSection from "./EncountersSection";
import MessagesSection from "./MessagesSection";
import CollaborateSection from "./CollaborateSection";
import LibrarySection from "./LibrarySection";
import ProfileSheet from "./ProfileSheet";
import NotificationsSheet from "./NotificationsSheet";
import PublishPickerSheet from "./PublishPickerSheet";

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S PORTAL — the independent social heart of the       */
/*  house. The threshold's top-left sigil raises a completely          */
/*  separate space with its own structure, its own light, its own      */
/*  manners:                                                           */
/*                                                                     */
/*    GATHERING — the living community stream (the three natural       */
/*      hands first: share a reflection, publish a work, meet          */
/*      someone; the gallery wall and the vertical stream beneath);    */
/*    DISCOVER — six destinations: for you, people, creations,         */
/*      circles, projects, knowledge; M.E. listens here;               */
/*    CIRCLES — communities to join, or to found;                      */
/*    ENCOUNTERS — meaningful introductions, consent always;           */
/*    MESSAGES — private and group conversations;                      */
/*    COLLABORATE — shared workshops and the evolution path;           */
/*    LIBRARY — the collective archive of the community's work.        */
/*                                                                     */
/*  CREATION LIVES IN THE HOUSE'S ROOMS — ArtX, Music, Book, HyperX,   */
/*  a transmission's own line. The Gathering publishes finished work,  */
/*  it does not make it: there is no create street, no second studio.  */
/*                                                                     */
/*  THE PORCELAIN WEATHER — milk-white and cream, clean and three-     */
/*  dimensional. THE MIRROR SPIRIT — the network stands beside the     */
/*  house, never over it: no entanglement counts, no vanity metrics,   */
/*  no ranks. M.E. facilitates; humans choose.                         */
/*                                                                     */
/*  THE VIBE — the gathering's quantum identity pass. One switch in    */
/*  the profile room recolors the whole portal: the PURPLE FIELD       */
/*  (deep violet gradients, lavender stars) or the GOLD CONSTELLATION  */
/*  (an ink-dark ember sky, gold threads). Both vibes keep the text    */
/*  near-white and high-contrast; the accents live on borders, rings,  */
/*  glows and hands. The choice rests on the visitor's own device      */
/*  (localStorage "mirror-gathering-vibe") — no account round-trip.    */
/* ------------------------------------------------------------------ */

type Section =
  | "gathering"
  | "discover"
  | "circles"
  | "encounters"
  | "messages"
  | "collaborate"
  | "library";

const SECTIONS: Array<{ key: Section; label: string; icon: LucideIcon }> = [
  { key: "gathering", label: "Gathering", icon: Waypoints },
  { key: "discover", label: "Discover", icon: Compass },
  { key: "circles", label: "Circles", icon: Users },
  { key: "encounters", label: "Encounters", icon: Sparkles },
  { key: "messages", label: "Messages", icon: MessagesSquare },
  { key: "collaborate", label: "Collaborate", icon: LayoutGrid },
  { key: "library", label: "Library", icon: Library },
];

/* ================================================================== */
/*  THE VIBE ENGINE — two palettes, one law: text stays near-white     */
/*  and readable on both fields; color lives on edges, glows, hands.   */
/*  The vars ride the portal's root; every room below drinks from      */
/*  them (the porcelain utilities are re-tuned in the style block).    */
/* ================================================================== */

const VIBE_VARS: Record<GathVibe, React.CSSProperties> = {
  purple: {
    "--gath": "#a78bfa",
    "--gath-strong": "#c4b5fd",
    "--gath-ink": "#f4effe",
    "--gath-ink-2": "#d9cef2",
    "--gath-ink-3": "#a99cc9",
    "--gath-soft": "#c9b8f5",
    "--gath-card": "#251a44",
    "--gath-edge": "rgba(196, 181, 253, 0.20)",
    "--gath-edge-active": "rgba(167, 139, 250, 0.62)",
    "--gath-glow-a": "rgba(124, 92, 173, 0.38)",
    "--gath-glow-b": "rgba(88, 60, 160, 0.30)",
    "--gath-glow-c": "rgba(167, 139, 250, 0.18)",
    "--gath-star": "#cfc0ff",
    "--gath-sheet": "linear-gradient(168deg, #271b49 0%, #1e1440 55%, #191036 100%)",
    "--gath-ok": "#6ee7b7",
    "--gath-warn": "#fbbf24",
    /* the gathering speaks for itself while it is open — the app's own
       tokens are locally re-tuned so anything inside reads true */
    "--background": "#170f2b",
    "--foreground": "#f4effe",
    "--card": "#251a44",
    "--hairline": "rgba(196, 181, 253, 0.20)",
  } as React.CSSProperties,
  gold: {
    "--gath": "#d4af37",
    "--gath-strong": "#e6c96a",
    "--gath-ink": "#f8f1de",
    "--gath-ink-2": "#ded0af",
    "--gath-ink-3": "#b0a17f",
    "--gath-soft": "#e2c877",
    "--gath-card": "#261c0e",
    "--gath-edge": "rgba(212, 175, 55, 0.22)",
    "--gath-edge-active": "rgba(212, 175, 55, 0.62)",
    "--gath-glow-a": "rgba(212, 175, 55, 0.15)",
    "--gath-glow-b": "rgba(146, 104, 22, 0.22)",
    "--gath-glow-c": "rgba(255, 216, 120, 0.10)",
    "--gath-star": "#ecd28a",
    "--gath-sheet": "linear-gradient(168deg, #2a1f0f 0%, #221810 55%, #1a120b 100%)",
    "--gath-ok": "#6ee7b7",
    "--gath-warn": "#fbbf24",
    /* the ember override — every token the app's widgets drink is
       locally re-inked so the gold field keeps every word readable */
    "--background": "#171008",
    "--foreground": "#f8f1de",
    "--card": "#261c0e",
    "--hairline": "rgba(212, 175, 55, 0.22)",
  } as React.CSSProperties,
};

/* the vibe's own re-tuning of the hall — the porcelain utilities and
   the hall's gp-* garments are re-dressed per vibe without touching
   the house's own stylesheet: everything here rides the portal root */
const GATH_STYLE = `
/* --- the fields themselves --- */
.gath-purple .gp-sky {
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(124, 92, 173, 0.38) 0%, rgba(124, 92, 173, 0) 55%),
    radial-gradient(90% 70% at 88% 12%, rgba(88, 60, 160, 0.32) 0%, rgba(88, 60, 160, 0) 60%),
    radial-gradient(110% 80% at 50% 108%, rgba(46, 28, 84, 0.92) 0%, rgba(46, 28, 84, 0) 62%),
    linear-gradient(168deg, #201540 0%, #190f31 48%, #130b24 100%);
}
.gath-gold .gp-sky {
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0) 55%),
    radial-gradient(90% 70% at 88% 12%, rgba(146, 104, 22, 0.22) 0%, rgba(146, 104, 22, 0) 60%),
    radial-gradient(110% 80% at 50% 108%, rgba(64, 44, 12, 0.88) 0%, rgba(64, 44, 12, 0) 62%),
    linear-gradient(168deg, #1c1409 0%, #171008 48%, #110b06 100%);
}

/* --- the porcelain garments, re-woven on the dark fields --- */
:is(.gath-purple, .gath-gold) .gp-card {
  background: linear-gradient(158deg, color-mix(in srgb, var(--gath-card) 88%, transparent) 0%, color-mix(in srgb, var(--gath-card) 72%, transparent) 100%);
  border: 1px solid var(--gath-edge);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 18px 42px -20px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
:is(.gath-purple, .gath-gold) .gp-card-hover:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 24px 52px -22px rgba(0, 0, 0, 0.68);
}
:is(.gath-purple, .gath-gold) .gp-glass {
  background: linear-gradient(165deg, color-mix(in srgb, var(--gath-card) 82%, transparent) 0%, color-mix(in srgb, var(--gath-card) 68%, transparent) 100%);
  border-color: var(--gath-edge);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 16px 40px -20px rgba(0, 0, 0, 0.55);
}
:is(.gath-purple, .gath-gold) .gp-seg {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 10px 24px -14px rgba(0, 0, 0, 0.5);
}
:is(.gath-purple, .gath-gold) .gp-seg-thumb {
  background: color-mix(in srgb, var(--gath) 24%, var(--gath-card));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 2px 8px -2px rgba(0, 0, 0, 0.5);
}
:is(.gath-purple, .gath-gold) .gp-scroll { scrollbar-color: var(--gath-edge) transparent; }
:is(.gath-purple, .gath-gold) .gp-scroll::-webkit-scrollbar-thumb { background: var(--gath-edge); }

/* --- the ink law: every porcelain word re-inks, high-contrast --- */
:is(.gath-purple, .gath-gold) .text-\\[\\#3d3428\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#4c4436\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#5c5344\\] { color: var(--gath-ink); }
:is(.gath-purple, .gath-gold) .text-\\[\\#7c715f\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#8a7c64\\] { color: var(--gath-ink-2); }
:is(.gath-purple, .gath-gold) .text-\\[\\#a2947c\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#b3a68d\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#b0a184\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#bfb398\\] { color: var(--gath-ink-3); }
:is(.gath-purple, .gath-gold) .text-\\[\\#8a6f46\\] { color: var(--gath-soft); }
:is(.gath-purple, .gath-gold) .text-\\[\\#b45309\\] { color: var(--gath-warn); }
:is(.gath-purple, .gath-gold) .text-\\[\\#5f7a52\\] { color: var(--gath-ok); }
:is(.gath-purple, .gath-gold) .text-\\[\\#7c5cad\\] { color: var(--gath-strong); }
:is(.gath-purple, .gath-gold) .text-\\[\\#0f766e\\],
:is(.gath-purple, .gath-gold) .text-\\[\\#0d9488\\] { color: #2dd4bf; }
:is(.gath-purple, .gath-gold) .placeholder\\:text-\\[\\#b3a68d\\]::placeholder,
:is(.gath-purple, .gath-gold) .placeholder\\:text-\\[\\#bfb398\\]::placeholder { color: var(--gath-ink-3); }
:is(.gath-purple, .gath-gold) .hover\\:text-\\[\\#3d3428\\]:hover,
:is(.gath-purple, .gath-gold) .hover\\:text-\\[\\#7c715f\\]:hover { color: var(--gath-ink); }
:is(.gath-purple, .gath-gold) .hover\\:text-\\[\\#b45309\\]:hover { color: var(--gath-warn); }

/* --- the hairline law: edges drink the vibe, never shout --- */
:is(.gath-purple, .gath-gold) .border-\\[\\#e4d9bd\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#e8dfc9\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#eadfc4\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#eee5d0\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#eadfca\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#eadfca\\]\\/70,
:is(.gath-purple, .gath-gold) .border-white\\/75,
:is(.gath-purple, .gath-gold) .border-white\\/80,
:is(.gath-purple, .gath-gold) .border-white\\/85,
:is(.gath-purple, .gath-gold) .border-white\\/90 { border-color: var(--gath-edge); }
:is(.gath-purple, .gath-gold) .border-white\\/95 { border-color: rgba(255, 255, 255, 0.55); }
:is(.gath-purple, .gath-gold) .border-\\[\\#cbb98d\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#d3c39c\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#d9c99a\\]\\/60,
:is(.gath-purple, .gath-gold) .border-\\[\\#d9c99a\\]\\/50 { border-color: var(--gath-edge-active); }
:is(.gath-purple, .gath-gold) .hover\\:border-\\[\\#d3c39c\\]:hover { border-color: var(--gath-edge-active); }
:is(.gath-purple, .gath-gold) .border-\\[\\#d8e5d0\\],
:is(.gath-purple, .gath-gold) .border-\\[\\#c7d8c0\\] { border-color: color-mix(in srgb, var(--gath-ok) 40%, transparent); }
:is(.gath-purple, .gath-gold) .border-\\[\\#7c5cad\\]\\/25,
:is(.gath-purple, .gath-gold) .border-\\[\\#7c5cad\\]\\/40 { border-color: color-mix(in srgb, var(--gath-strong) 38%, transparent); }

/* --- the surface law: translucent vibe glass, hairline edges --- */
:is(.gath-purple, .gath-gold) .bg-white\\/45 { background-color: color-mix(in srgb, var(--gath-card) 45%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
:is(.gath-purple, .gath-gold) .bg-white\\/50 { background-color: color-mix(in srgb, var(--gath-card) 50%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
:is(.gath-purple, .gath-gold) .bg-white\\/55 { background-color: color-mix(in srgb, var(--gath-card) 55%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
:is(.gath-purple, .gath-gold) .bg-white\\/60 { background-color: color-mix(in srgb, var(--gath-card) 60%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
:is(.gath-purple, .gath-gold) .bg-white\\/70 { background-color: color-mix(in srgb, var(--gath-card) 70%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
:is(.gath-purple, .gath-gold) .bg-white\\/80 { background-color: color-mix(in srgb, var(--gath-card) 80%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
:is(.gath-purple, .gath-gold) .bg-white { background-color: color-mix(in srgb, var(--gath) 16%, var(--gath-card)); }
:is(.gath-purple, .gath-gold) .bg-\\[\\#faf5e6\\] { background-color: color-mix(in srgb, var(--gath) 13%, var(--gath-card)); }
:is(.gath-purple, .gath-gold) .bg-\\[\\#f2f7ee\\],
:is(.gath-purple, .gath-gold) .bg-\\[\\#eef5ea\\] { background-color: color-mix(in srgb, var(--gath-ok) 13%, var(--gath-card)); }
:is(.gath-purple, .gath-gold) .bg-\\[\\#7c5cad\\]\\/10 { background-color: color-mix(in srgb, var(--gath-strong) 14%, transparent); }
:is(.gath-purple, .gath-gold) .bg-\\[\\#3d3428\\]\\/25 { background-color: rgba(8, 5, 18, 0.5); }
:is(.gath-purple, .gath-gold) .bg-\\[\\#2b2416\\]\\/45 { background-color: rgba(6, 4, 2, 0.6); }

/* --- the constellation's breath — opacity and scale only, and it
       stands completely still for the stillness law --- */
.gath-star {
  opacity: var(--dim, 0.5);
  animation: gath-twinkle var(--dur, 4s) ease-in-out var(--delay, 0s) infinite;
  will-change: opacity, transform;
}
@keyframes gath-twinkle {
  0%, 100% { opacity: var(--dim, 0.5); transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.18); }
}
@media (prefers-reduced-motion: reduce) {
  .gath-star { animation: none; opacity: 0.7; transform: none; }
}
`;

/* ================================================================== */
/*  THE CONSTELLATION — a deterministic sky. The same forty stars in   */
/*  the same places on every visit, in both vibes: lavender-tinted     */
/*  over the purple field, gold threads over the ember. Lines join     */
/*  near neighbors; the stars breathe (opacity and scale only).        */
/* ================================================================== */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* computed once, from a fixed seed — the sky never rerolls */
const GATH_CONSTELLATION = (() => {
  const rnd = mulberry32(0x67a7e5c9);
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: 2.5 + rnd() * 95,
    y: 3 + rnd() * 93,
    r: 1.1 + rnd() * 1.7,
    dur: 3 + rnd() * 3.4,
    delay: -(rnd() * 6),
    dim: 0.32 + rnd() * 0.3,
  }));
  /* threads between near neighbors — the same math in both vibes */
  const links: Array<[number, number]> = [];
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x;
      const dy = stars[i].y - stars[j].y;
      if (Math.hypot(dx, dy) < 13.5) links.push([i, j]);
    }
  }
  return { stars, links };
})();

function GathConstellation() {
  const { stars, links } = GATH_CONSTELLATION;
  return (
    <div
      aria-hidden="true"
      data-testid="gath-constellation"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {links.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={stars[a].x}
            y1={stars[a].y}
            x2={stars[b].x}
            y2={stars[b].y}
            stroke="var(--gath-star)"
            strokeOpacity={0.16}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {stars.map((s) => (
        <span
          key={s.id}
          className="gath-star absolute rounded-full"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              background: "var(--gath-star)",
              boxShadow:
                "0 0 6px 1px color-mix(in srgb, var(--gath-star) 55%, transparent)",
              "--dur": `${s.dur}s`,
              "--delay": `${s.delay}s`,
              "--dim": `${s.dim}`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* the visitor's stored choice — a device-local tune, never a server round-trip */
function readStoredVibe(): GathVibe {
  try {
    return window.localStorage.getItem(VIBE_STORAGE_KEY) === "gold" ? "gold" : "purple";
  } catch {
    return "purple";
  }
}

export default function GatheringPortal() {
  const t = useT();
  const [section, setSection] = useState<Section>("gathering");
  const [me, setMe] = useState<MeState | null>(null);
  const [circles, setCircles] = useState<CircleCard[]>([]);
  const [unread, setUnread] = useState(0);
  const [overlay, setOverlay] = useState<"none" | "profile" | "notifications">("none");
  /* the vibe wakes from the visitor's own device — read at first breath,
     so the field is already dressed before the portal's first paint */
  const [vibe, setVibe] = useState<GathVibe>(() =>
    typeof window === "undefined" ? "purple" : readStoredVibe()
  );
  /* carried between rooms — the weave and library hands of the stream */
  const [weaveSeed, setWeaveSeed] = useState<GatheringPost | null>(null);
  const [librarySeed, setLibrarySeed] = useState<GatheringPost | null>(null);

  /* the publication picker — the hall's only creation-adjacent door, */
  /* and it creates nothing: it carries finished works in */
  const [pickerOpen, setPickerOpen] = useState(false);

  const changeVibe = useCallback((next: GathVibe) => {
    setVibe(next);
    try {
      window.localStorage.setItem(VIBE_STORAGE_KEY, next);
    } catch {
      /* storage closed — the field still changes for this visit */
    }
  }, []);

  const closePortal = useCallback(() => {
    useMirror.getState().closeGatheringPortal();
  }, []);

  /* the portal's first breath: who the visitor is, which circles keep
     their doors open for them */
  useEffect(() => {
    void (async () => {
      try {
        const [m, c] = await Promise.all([
          netFetch<{ me: MeState }>("/api/network/me"),
          netFetch<{ circles: CircleCard[] }>("/api/network/circles?mine=1&take=40"),
        ]);
        setMe(m.me);
        setCircles(c.circles);
      } catch {
        /* the rooms still open — identity arrives on the next breath */
      }
    })();
  }, []);

  /* the bell breathes quietly */
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await netFetch<{ unread: number }>("/api/network/notifications");
        if (alive) setUnread(data.unread);
        const m = await netFetch<{ me: MeState }>("/api/network/me");
        if (alive) setMe((prev) => (prev ? { ...prev, counts: m.me.counts } : prev));
      } catch {
        /* a missed breath is followed by the next one */
      }
    };
    const id = window.setInterval(tick, 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  /* the escape hand — one breath of Escape folds the portal */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlay === "none") closePortal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, closePortal]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={t("The Gathering")}
      data-testid="gathering-portal"
      data-vibe={vibe}
      className={cn(
        "fixed inset-0 z-[90] overflow-hidden",
        vibe === "gold" ? "gath-gold" : "gath-purple"
      )}
      style={VIBE_VARS[vibe]}
    >
      <style>{GATH_STYLE}</style>

      {/* ---------- the vibe's own sky ---------- */}
      <div aria-hidden="true" className="gp-sky absolute inset-0">
        <div
          className="gp-drift absolute -top-32 left-[8%] h-[420px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--gath-glow-a), transparent)" }}
        />
        <div
          className="gp-drift-slow absolute bottom-[-140px] right-[-80px] h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--gath-glow-b), transparent)" }}
        />
        <div
          className="gp-drift absolute left-[-120px] top-1/2 h-[380px] w-[380px] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--gath-glow-c), transparent)" }}
        />
      </div>

      {/* ---------- the constellation — the same sky in both vibes ---------- */}
      <GathConstellation />

      {/* ---------- the portal's crown ---------- */}
      <header className="gp-glass absolute inset-x-0 top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2.5 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={closePortal}
            aria-label={t("Return to the house")}
            title={t("Return to the house")}
            data-testid="gathering-portal-return"
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
              }}
            >
              <span className="block size-3.5 rounded-[5px] border border-[#cbb98d] bg-[linear-gradient(150deg,#fefcf6,#e8dcbd)]" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-cinzel)] text-[14px] font-semibold tracking-wide text-[#3d3428] sm:text-[15px]">
                {t("The Gathering")}
              </p>
              <p className="mono-label hidden text-[8px] uppercase tracking-[0.26em] text-[#a2947c] sm:block">
                {t("the network of becoming")}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* the bell — every ring a real row */}
          <button
            type="button"
            onClick={() => setOverlay(overlay === "notifications" ? "none" : "notifications")}
            aria-label={t("The bell")}
            title={t("The bell")}
            data-testid="gathering-bell"
            className="focus-glow relative flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
          >
            <Bell className="size-4" aria-hidden="true" />
            {unread > 0 && (
              <span
                aria-hidden="true"
                data-testid="gathering-bell-count"
                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#a16207] text-[9px] font-bold text-white"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* the visitor's own mark — the introduction's room */}
          <button
            type="button"
            onClick={() => setOverlay(overlay === "profile" ? "none" : "profile")}
            aria-label={t("Your introduction")}
            title={t("Your introduction")}
            data-testid="gathering-profile"
            className="focus-glow flex max-w-[150px] shrink-0 items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 py-1 pl-1 pr-2.5 transition-all duration-300 hover:border-[#d3c39c]"
          >
            <MakerMark name={me?.name ?? "·"} size={26} />
            <span className="truncate text-[12px] font-semibold text-[#5c5344]">
              {me?.name ?? "…"}
            </span>
          </button>
        </div>

        {/* ---------- the network's own streets ---------- */}
        <nav
          aria-label={t("The Gathering")}
          className="mx-auto max-w-[1200px] px-3 pb-2.5 sm:px-6 sm:pb-3"
        >
          <div
            role="tablist"
            aria-label={t("The Gathering")}
            className="gp-seg gp-scroll flex items-center gap-0.5 overflow-x-auto rounded-full border border-white/80 bg-white/45 p-1"
          >
            {SECTIONS.map((s) => {
              const SIcon = s.icon;
              const on = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setSection(s.key);
                    setOverlay("none");
                  }}
                  data-testid={`gathering-nav-${s.key}`}
                  className={cn(
                    "focus-glow relative flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-300 sm:px-3.5",
                    on ? "text-[#5c5344]" : "text-[#a2947c] hover:text-[#7c715f]"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="gp-nav-thumb"
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="gp-seg-thumb absolute inset-0 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <SIcon className="relative size-3.5" aria-hidden="true" />
                  <span className="relative">{t(s.label)}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ---------- the rooms ---------- */}
      <div className="absolute inset-0 overflow-hidden pt-[104px] sm:pt-[120px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={overlay !== "none" ? overlay : section}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {overlay === "profile" ? (
              <ProfileSheet
                me={me}
                vibe={vibe}
                onVibe={changeVibe}
                onSaved={setMe}
                onClose={() => setOverlay("none")}
              />
            ) : overlay === "notifications" ? (
              <NotificationsSheet onCount={setUnread} onClose={() => setOverlay("none")} />
            ) : section === "gathering" ? (
              <FeedSection
                active
                circles={circles}
                onMeetSomeone={() => setSection("encounters")}
                onPublishWork={() => setPickerOpen(true)}
                onWeaveFrom={(post) => {
                  setWeaveSeed(post);
                  setSection("collaborate");
                }}
                onLibraryFrom={(post) => {
                  setLibrarySeed(post);
                  setSection("library");
                }}
              />
            ) : section === "discover" ? (
              <DiscoverSection
                active
                onOpenMessages={() => setSection("messages")}
              />
            ) : section === "circles" ? (
              <CirclesSection active />
            ) : section === "encounters" ? (
              <EncountersSection active onOpenMessages={() => setSection("messages")} />
            ) : section === "messages" ? (
              <MessagesSection active />
            ) : section === "collaborate" ? (
              <CollaborateSection
                active
                seedPost={weaveSeed}
                onSeedConsumed={() => setWeaveSeed(null)}
              />
            ) : (
              <LibrarySection
                active
                fromPost={librarySeed}
                onSeedConsumed={() => setLibrarySeed(null)}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* the picker stands above everything — it is not a room, it is a hand */}
      <PublishPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </motion.div>,
    document.body
  );
}
