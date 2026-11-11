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
  Map as MapIcon,
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
  type MeState,
  MakerMark,
  netFetch,
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
import RegionAtlas from "./RegionAtlas";

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
/*  THE HALL'S OWN WEATHER — two faces of one house: porcelain in the  */
/*  daylight (milk-white, cream, three-dimensional), the site's own    */
/*  lit-crystal dark at night. The gathering drinks the same tokens    */
/*  the whole Reflect Me house drinks, so dark mode here is dark mode  */
/*  everywhere. No second palette, no switch, no constellation — the   */
/*  flicker left with it.                                              */
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
/*  THE HALL'S VARS — porcelain by day; at night the hall's own vars   */
/*  are poured again from the site's own dark tokens, so every room    */
/*  below reads true in both weathers without touching its classes.    */
/* ================================================================== */

const GATH_STYLE = `
/* --- the daylight law: porcelain vars (the original hall) --- */
.gath-hall {
  --gath: #8a6f46;
  --gath-strong: #a16207;
  --gath-ink: #3d3428;
  --gath-ink-2: #5c5344;
  --gath-ink-3: #a2947c;
  --gath-soft: #8a6f46;
  --gath-card: #fffdf8;
  --gath-edge: rgba(214, 197, 164, 0.55);
  --gath-edge-active: rgba(178, 158, 122, 0.85);
  --gath-glow-a: rgba(253, 250, 242, 0.9);
  --gath-glow-b: rgba(244, 233, 210, 0.75);
  --gath-glow-c: rgba(238, 226, 200, 0.6);
  --gath-sheet: linear-gradient(168deg, #fffdf8 0%, #faf5e8 60%, #f4ecda 100%);
  --gath-ok: #5f7a52;
  --gath-warn: #b45309;
  --gath-amber: #a16207;
  --gath-teal: #0d9488;
  --gath-lav: #7c5cad;
}

/* --- THE SOLID GROUND LAW (daylight) — every section, every panel,
       every publishing surface stands opaque: no veil, no glass, no
       translucency anywhere the visitor reads or writes. The hall's
       own sky carries all the depth; the walls simply stand. --- */
.gath-hall .gp-card {
  background: #fffdf8;
}
.gath-hall .gp-glass {
  background: #fffdf8;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.gath-hall .bg-white\/45,
.gath-hall .bg-white\/50,
.gath-hall .bg-white\/55,
.gath-hall .bg-white\/60,
.gath-hall .bg-white\/70,
.gath-hall .bg-white\/80 {
  background-color: #fffdf8;
}
.gath-hall .bg-white {
  background-color: #ffffff;
}
.gath-hall input,
.gath-hall textarea,
.gath-hall select {
  background-color: #ffffff;
}

/* --- the night law: the hall drinks the site's own dark tokens --- */
.dark .gath-hall {
  --gath: #a9c3e2;
  --gath-strong: #cfe0f2;
  --gath-ink: #eef4fb;
  --gath-ink-2: #d7e2f0;
  --gath-ink-3: #b6c4d8;
  --gath-soft: #cfe0f2;
  --gath-card: #243459;
  --gath-edge: rgba(168, 203, 255, 0.14);
  --gath-edge-active: rgba(140, 190, 255, 0.45);
  --gath-glow-a: rgba(140, 190, 255, 0.13);
  --gath-glow-b: rgba(96, 148, 224, 0.10);
  --gath-glow-c: rgba(168, 203, 255, 0.08);
  --gath-sheet: linear-gradient(168deg, #243459 0%, #203054 55%, #1c2b4a 100%);
  --gath-ok: #86c9a8;
  --gath-warn: #f0b263;
  --gath-amber: #e8b954;
  --gath-teal: #6fc7bd;
  --gath-lav: #a5b8ea;
}

/* --- the night sky — the site's own crystal ground, opaque, still --- */
.dark .gath-hall .gp-sky {
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(140, 190, 255, 0.09) 0%, rgba(140, 190, 255, 0) 55%),
    radial-gradient(90% 70% at 88% 12%, rgba(96, 148, 224, 0.07) 0%, rgba(96, 148, 224, 0) 60%),
    linear-gradient(168deg, #1c2b4a 0%, #1a2744 52%, #182341 100%);
}

/* --- the night garments: SOLID crystal cards, no blur, no flicker --- */
.dark .gath-hall .gp-card {
  background: var(--gath-card);
  border: 1px solid var(--gath-edge);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 42px -20px rgba(0, 0, 0, 0.5);
}
.dark .gath-hall .gp-card-hover:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 24px 52px -22px rgba(0, 0, 0, 0.56);
}
.dark .gath-hall .gp-glass {
  background: var(--gath-card);
  border-color: var(--gath-edge);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 40px -20px rgba(0, 0, 0, 0.45);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.dark .gath-hall .gp-seg {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 10px 24px -14px rgba(0, 0, 0, 0.4);
}
.dark .gath-hall .gp-seg-thumb {
  background: color-mix(in srgb, var(--gath) 22%, var(--gath-card));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 2px 8px -2px rgba(0, 0, 0, 0.4);
}
.dark .gath-hall .gp-scroll { scrollbar-color: var(--gath-edge) transparent; }
.dark .gath-hall .gp-scroll::-webkit-scrollbar-thumb { background: var(--gath-edge); }

/* --- the night ink law: every porcelain word re-inks to crystal --- */
.dark .gath-hall .text-\\[\\#3d3428\\] { color: var(--gath-ink); }
.dark .gath-hall .text-\\[\\#4c4436\\],
.dark .gath-hall .text-\\[\\#5c5344\\],
.dark .gath-hall .text-\\[\\#7c715f\\] { color: var(--gath-ink-2); }
.dark .gath-hall .text-\\[\\#a2947c\\],
.dark .gath-hall .text-\\[\\#8a7c64\\],
.dark .gath-hall .text-\\[\\#b3a68d\\],
.dark .gath-hall .text-\\[\\#b0a184\\],
.dark .gath-hall .text-\\[\\#bfb398\\] { color: var(--gath-ink-3); }
.dark .gath-hall .text-\\[\\#8a6f46\\] { color: var(--gath-soft); }
.dark .gath-hall .text-\\[\\#a16207\\] { color: var(--gath-amber); }
.dark .gath-hall .text-\\[\\#b45309\\],
.dark .gath-hall .text-\\[\\#9a4f21\\],
.dark .gath-hall .text-\\[\\#b3542f\\] { color: var(--gath-warn); }
.dark .gath-hall .text-\\[\\#5f7a52\\] { color: var(--gath-ok); }
.dark .gath-hall .text-\\[\\#7c5cad\\] { color: var(--gath-lav); }
.dark .gath-hall .text-\\[\\#cbb98d\\] { color: var(--gath-strong); }
.dark .gath-hall .text-\\[\\#0f766e\\],
.dark .gath-hall .text-\\[\\#0d9488\\] { color: var(--gath-teal); }
.dark .gath-hall .placeholder\\:text-\\[\\#b3a68d\\]::placeholder,
.dark .gath-hall .placeholder\\:text-\\[\\#bfb398\\]::placeholder { color: var(--gath-ink-3); }
.dark .gath-hall .hover\\:text-\\[\\#3d3428\\]:hover,
.dark .gath-hall .hover\\:text-\\[\\#7c715f\\]:hover { color: var(--gath-ink); }
.dark .gath-hall .hover\\:text-\\[\\#8a6f46\\]:hover { color: var(--gath-strong); }
.dark .gath-hall .hover\\:text-\\[\\#b45309\\]:hover { color: var(--gath-warn); }

/* --- the night hairline law: edges drink the crystal, never shout --- */
.dark .gath-hall .border-\\[\\#e4d9bd\\],
.dark .gath-hall .border-\\[\\#e8dfc9\\],
.dark .gath-hall .border-\\[\\#eadfc4\\],
.dark .gath-hall .border-\\[\\#eee5d0\\],
.dark .gath-hall .border-\\[\\#eadfca\\],
.dark .gath-hall .border-\\[\\#eadfca\\]\\/60,
.dark .gath-hall .border-\\[\\#eadfca\\]\\/70,
.dark .gath-hall .border-white\\/75,
.dark .gath-hall .border-white\\/80,
.dark .gath-hall .border-white\\/85,
.dark .gath-hall .border-white\\/90 { border-color: var(--gath-edge); }
.dark .gath-hall .border-white\\/95 { border-color: var(--gath-edge-active); }
.dark .gath-hall .border-\\[\\#cbb98d\\],
.dark .gath-hall .border-\\[\\#cbb98d\\]\\/50,
.dark .gath-hall .border-\\[\\#d3c39c\\],
.dark .gath-hall .border-\\[\\#d9c99a\\]\\/60,
.dark .gath-hall .border-\\[\\#d9c99a\\]\\/50 { border-color: var(--gath-edge-active); }
.dark .gath-hall .hover\\:border-\\[\\#d3c39c\\]:hover { border-color: var(--gath-edge-active); }
.dark .gath-hall .border-\\[\\#d8e5d0\\],
.dark .gath-hall .border-\\[\\#c7d8c0\\] { border-color: color-mix(in srgb, var(--gath-ok) 40%, transparent); }
.dark .gath-hall .border-\\[\\#7c5cad\\]\\/25,
.dark .gath-hall .border-\\[\\#7c5cad\\]\\/40 { border-color: color-mix(in srgb, var(--gath-lav) 38%, transparent); }
.dark .gath-hall .border-\\[\\#a16207\\]\\/40,
.dark .gath-hall .border-\\[\\#a16207\\]\\/45 { border-color: color-mix(in srgb, var(--gath-amber) 45%, transparent); }
.dark .gath-hall .border-\\[\\#b45309\\]\\/30,
.dark .gath-hall .border-\\[\\#b45309\\]\\/45 { border-color: color-mix(in srgb, var(--gath-warn) 45%, transparent); }
.dark .gath-hall .border-\\[\\#0d9488\\]\\/40,
.dark .gath-hall .border-\\[\\#0d9488\\]\\/50 { border-color: color-mix(in srgb, var(--gath-teal) 45%, transparent); }

/* --- the night surface law: SOLID crystal — no veil, no blur,
       no translucency anywhere the visitor reads or writes --- */
.dark .gath-hall .bg-white\\/45,
.dark .gath-hall .bg-white\\/50,
.dark .gath-hall .bg-white\\/55,
.dark .gath-hall .bg-white\\/60,
.dark .gath-hall .bg-white\\/70,
.dark .gath-hall .bg-white\\/80 { background-color: var(--gath-card); }
.dark .gath-hall .bg-white { background-color: var(--gath-card); }
.dark .gath-hall .bg-\\[\\#faf5e6\\] { background-color: color-mix(in srgb, var(--gath-amber) 12%, var(--gath-card)); }
.dark .gath-hall .bg-\\[\\#fdf1e7\\] { background-color: color-mix(in srgb, var(--gath-amber) 14%, var(--gath-card)); }
.dark .gath-hall .bg-\\[\\#f2f7ee\\],
.dark .gath-hall .bg-\\[\\#eef5ea\\] { background-color: color-mix(in srgb, var(--gath-ok) 13%, var(--gath-card)); }
.dark .gath-hall .bg-\\[\\#7c5cad\\]\\/10 { background-color: color-mix(in srgb, var(--gath-lav) 16%, transparent); }
.dark .gath-hall .bg-\\[\\#e4d9bd\\] { background-color: color-mix(in srgb, var(--gath-strong) 40%, transparent); }
.dark .gath-hall .bg-\\[\\#3d3428\\]\\/25,
.dark .gath-hall .bg-\\[\\#2b2416\\]\\/45,
.dark .gath-hall .bg-\\[rgba\\(46\\,38\\,24\\,0\\.32\\)\\] { background-color: rgba(9, 14, 26, 0.55); }
.dark .gath-hall input,
.dark .gath-hall textarea,
.dark .gath-hall select {
  background-color: color-mix(in srgb, var(--gath-card) 88%, #10192e);
}

/* --- the pearl law: the hall's little ivory pieces (maker marks,
       the offering hand, the search hand) keep their warm ink on
       cream, whatever the night wears around them --- */
.dark .gath-hall .gp-pearl,
.dark .gath-hall .gp-pearl * { color: #8a6f46; }
`;

export default function GatheringPortal() {
  const t = useT();
  const [section, setSection] = useState<Section>("gathering");
  const [me, setMe] = useState<MeState | null>(null);
  const [circles, setCircles] = useState<CircleCard[]>([]);
  const [unread, setUnread] = useState(0);
  const [overlay, setOverlay] = useState<
    "none" | "profile" | "notifications" | "atlas"
  >("none");
  /* carried between rooms — the weave and library hands of the stream */
  const [weaveSeed, setWeaveSeed] = useState<GatheringPost | null>(null);
  const [librarySeed, setLibrarySeed] = useState<GatheringPost | null>(null);
  /* the atlas' own breath — every intention spoken at the map asks the
     stream to read itself again, so the hall and the map agree */
  const [atlasSignal, setAtlasSignal] = useState(0);

  /* the publication picker — the hall's only creation-adjacent door, */
  /* and it creates nothing: it carries finished works in */
  const [pickerOpen, setPickerOpen] = useState(false);

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
      className="gath-hall fixed inset-0 z-[90] overflow-hidden"
    >
      <style>{GATH_STYLE}</style>

      {/* ---------- the hall's own sky (porcelain by day, crystal at night) ---------- */}
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

          {/* THE ATLAS' OWN DOOR — the map stands only inside the hall:
              one small hand that opens the world's shores, where the
              visitor localizes and speaks an intention for a specific
              region. It has no life outside the gathering. */}
          <button
            type="button"
            onClick={() => setOverlay(overlay === "atlas" ? "none" : "atlas")}
            aria-label={t("The region atlas — localize an intention")}
            title={t("The region atlas — localize an intention")}
            aria-pressed={overlay === "atlas"}
            data-testid="gathering-atlas"
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
          >
            <MapIcon className="size-4" aria-hidden="true" />
          </button>

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
              <ProfileSheet me={me} onSaved={setMe} onClose={() => setOverlay("none")} />
            ) : overlay === "notifications" ? (
              <NotificationsSheet onCount={setUnread} onClose={() => setOverlay("none")} />
            ) : overlay === "atlas" ? (
              <RegionAtlas
                onPosted={() => setAtlasSignal((n) => n + 1)}
                onClose={() => setOverlay("none")}
              />
            ) : section === "gathering" ? (
              <FeedSection
                active
                circles={circles}
                refreshSignal={atlasSignal}
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
