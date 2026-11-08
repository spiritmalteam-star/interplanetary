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
  PenLine,
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
import CreateSection from "./CreateSection";
import CirclesSection from "./CirclesSection";
import EncountersSection from "./EncountersSection";
import MessagesSection from "./MessagesSection";
import CollaborateSection from "./CollaborateSection";
import LibrarySection from "./LibrarySection";
import ProfileSheet from "./ProfileSheet";
import NotificationsSheet from "./NotificationsSheet";

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S PORTAL — the independent social heart of the       */
/*  house. The threshold's top-left sigil raises a completely          */
/*  separate space with its own structure, its own light, its own      */
/*  manners:                                                           */
/*                                                                     */
/*    GATHERING — the living community stream (the three natural       */
/*      hands first: share a reflection, share a creation, meet        */
/*      someone; the gallery wall and the vertical stream beneath);    */
/*    DISCOVER — find people and creations; M.E. listens here;         */
/*    CREATE — publish and share, into the hall or a circle;           */
/*    CIRCLES — communities to join, or to found;                      */
/*    ENCOUNTERS — meaningful introductions, consent always;           */
/*    MESSAGES — private and group conversations;                      */
/*    COLLABORATE — shared workshops and the evolution path;           */
/*    LIBRARY — the collective archive of the community's work.        */
/*                                                                     */
/*  THE PORCELAIN WEATHER — milk-white and cream, clean and three-     */
/*  dimensional. THE MIRROR SPIRIT — the network stands beside the     */
/*  house, never over it: no follower counts, no vanity metrics, no    */
/*  ranks. M.E. facilitates; humans choose.                            */
/* ------------------------------------------------------------------ */

type Section =
  | "gathering"
  | "discover"
  | "create"
  | "circles"
  | "encounters"
  | "messages"
  | "collaborate"
  | "library";

const SECTIONS: Array<{ key: Section; label: string; icon: LucideIcon }> = [
  { key: "gathering", label: "Gathering", icon: Waypoints },
  { key: "discover", label: "Discover", icon: Compass },
  { key: "create", label: "Create", icon: PenLine },
  { key: "circles", label: "Circles", icon: Users },
  { key: "encounters", label: "Encounters", icon: Sparkles },
  { key: "messages", label: "Messages", icon: MessagesSquare },
  { key: "collaborate", label: "Collaborate", icon: LayoutGrid },
  { key: "library", label: "Library", icon: Library },
];

export default function GatheringPortal() {
  const t = useT();
  const [section, setSection] = useState<Section>("gathering");
  const [me, setMe] = useState<MeState | null>(null);
  const [circles, setCircles] = useState<CircleCard[]>([]);
  const [unread, setUnread] = useState(0);
  const [overlay, setOverlay] = useState<"none" | "profile" | "notifications">("none");

  /* carried between rooms — the weave and library hands of the stream */
  const [weaveSeed, setWeaveSeed] = useState<GatheringPost | null>(null);
  const [librarySeed, setLibrarySeed] = useState<GatheringPost | null>(null);

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

  const onHung = useCallback((post: GatheringPost) => {
    /* a hung offering refreshes the visitor's own count */
    setMe((prev) =>
      prev ? { ...prev, counts: { ...prev.counts, posts: prev.counts.posts + 1 } } : prev
    );
    setSection("gathering");
  }, []);

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
      className="fixed inset-0 z-[90] overflow-hidden"
    >
      {/* ---------- the porcelain sky ---------- */}
      <div aria-hidden="true" className="gp-sky absolute inset-0">
        <div className="gp-drift absolute -top-32 left-[8%] h-[420px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(255,252,244,0.9),transparent)]" />
        <div className="gp-drift-slow absolute bottom-[-140px] right-[-80px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(243,231,204,0.75),transparent)]" />
        <div className="gp-drift absolute left-[-120px] top-1/2 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(250,242,224,0.7),transparent)]" />
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
              <p className="truncate font-[family-name:Cinzel] text-[14px] font-semibold tracking-wide text-[#3d3428] sm:text-[15px]">
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
              <ProfileSheet me={me} onSaved={setMe} onClose={() => setOverlay("none")} />
            ) : overlay === "notifications" ? (
              <NotificationsSheet onCount={setUnread} onClose={() => setOverlay("none")} />
            ) : section === "gathering" ? (
              <FeedSection
                active
                circles={circles}
                onMeetSomeone={() => setSection("encounters")}
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
            ) : section === "create" ? (
              <CreateSection circles={circles} onHung={onHung} />
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
    </motion.div>,
    document.body
  );
}
