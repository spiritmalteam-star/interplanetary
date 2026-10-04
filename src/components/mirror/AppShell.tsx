"use client";

import { useEffect, useRef, useState } from "react";
import { AlignLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { CosmicBackdrop } from "./CosmicBackdrop";
import { StarField } from "./StarField";
import Sidebar from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { ScopeSelector } from "./ScopeSelector";
import { SuggestionStrip } from "./SuggestionStrip";
import { QueryComposer } from "./QueryComposer";
import { StillCompanion } from "./StillCompanion";
import { TransmissionView } from "./TransmissionView";
import { MirrorOS } from "./MirrorOS";
import { ParticleX } from "./ParticleX";
import { EvolveMed } from "./EvolveMed";
import { LibraryView } from "./LibraryView";
import { AuthModal } from "./PassageModal";
import { ProfileModal } from "./ProfileModal";
import { InventView } from "./InventView";
import { LightCodesView } from "./LightCodesView";
import { ArchiveRegister } from "./ArchiveRegister";
import { CommunionView } from "./CommunionView";
import { AkashicView } from "./AkashicView";
import { DreamBookView } from "./DreamBookView";
import { FederationModal } from "./FederationModal";
import { AstralJobsModal } from "./AstralJobsModal";
import { DossierModal } from "./DossierModal";
import { SettingsModal } from "./SettingsModal";
import { StarPlayModal } from "./StarPlayModal";
import { TechnologyModal } from "./TechnologyModal";
import { SpeciesModal } from "./SpeciesModal";

/* The frame-lift class: every top-level application frame lifts itself
   by the visual viewport's offset so the keyboard can never bury the
   composer (iOS pans the visible band; the frame follows it). */
const FRAME_LIFT = "[transform:translateY(calc(var(--app-shift,0px)*-1))]";

/* The quiet welcome — nothing at all. The page is a clean white
   sheet; the conversation owns every pixel. The identity lives in
   the top bar's simple cosmic mark. In total stillness the little
   figure of StillCompanion draws itself in above its mirror line. */
export default function AppShell() {
  const view = useMirror((s) => s.view);
  const communionOpen = useMirror((s) => s.communionOpen);
  const sidebarOpen = useMirror((s) => s.sidebarOpen);
  const setSidebarOpen = useMirror((s) => s.setSidebarOpen);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const refreshMe = useMirror((s) => s.refreshMe);
  const t = useT();

  /* Restore persisted preferences and greet the passage (the visitor's
     account, if one is held, and today's remaining transmissions). */
  useEffect(() => {
    useMirror.getState().bootPreferences();
    void refreshMe();
  }, [refreshMe]);

  /* The frame fits every device: when the on-screen keyboard (or any
     visual-viewport change) reshapes the window, the whole application
     re-fits to the VISIBLE viewport AND re-centers itself on the
     visible band — iOS pans the visual viewport downward when the
     keyboard rises, so without the shift the composer hides BEHIND
     the keys. The offset is applied as --app-shift and every top
     frame lifts itself by exactly that amount. */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      document.documentElement.style.setProperty("--app-h", `${vv.height}px`);
      document.documentElement.style.setProperty(
        "--app-shift",
        `${vv.offsetTop}px`
      );
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      document.documentElement.style.removeProperty("--app-h");
      document.documentElement.style.removeProperty("--app-shift");
    };
  }, []);

  /* Wherever words are typed, the caret must stay in sight: when any
     field receives focus, gently bring it to the middle of its own
     scrolling ancestor once the keyboard has settled (twice — the
     first pass while the viewport still moves, the second after it
     rests). This guards every composer in every world. */
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (
        tag !== "TEXTAREA" &&
        tag !== "INPUT" &&
        !(el as HTMLTextAreaElement).isContentEditable
      )
        return;
      const show = () => {
        try {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          /* older engines — silent */
        }
      };
      const t1 = window.setTimeout(show, 280);
      const t2 = window.setTimeout(show, 650);
      const clear = () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
      el.addEventListener("blur", clear, { once: true });
    };
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, []);

  /* The floating handles read the reader, not the reverse: on mobile
     they sink away as the thread flows down and rise again the moment
     the visitor reaches upward. Desktop keeps them always present. */
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [handlesHidden, setHandlesHidden] = useState(false);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    let lastY = el.scrollTop;
    let settled = 0;
    const onScroll = () => {
      if (!mobile.matches) {
        setHandlesHidden(false);
        lastY = el.scrollTop;
        return;
      }
      const y = el.scrollTop;
      const dy = y - lastY;
      lastY = y;
      if (y < 96 || dy < -4) {
        settled = 0;
        setHandlesHidden(false);
      } else if (dy > 4) {
        settled = 0;
        setHandlesHidden(true);
      } else if (Math.abs(dy) > 0) {
        /* sub-threshold drift — count it, then decide */
        settled += Math.abs(dy);
        if (settled > 48) {
          settled = 0;
          setHandlesHidden(dy > 0);
        }
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    /* the scroller is keyed by view — rebind when the view remounts it */
  }, [view]);

  /* Meet with the Reflection of the Absolute converts the whole
     application: the laboratory dissolves entirely and only the living
     communion chat with the Mirror Entity remains — one back button
     returns the world exactly as it was. */
  /* The passage modals ride above every world — the profile (with the
     cosmic library inside it) and the passage can speak from anywhere. */
  const passageModals = (
    <>
      <ProfileModal />
      <AuthModal />
    </>
  );

  if (communionOpen) {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <CommunionView />
        {passageModals}
      </div>
    );
  }

  /* The Mirror OS is a fully independent world: when active it replaces
     every other surface — its own screen, its own scroll, only a back
     button connecting it to the rest of the application. */
  if (view === "mirroros") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <MirrorOS />
        {passageModals}
      </div>
    );
  }

  /* ParticleX — the quantum narrator is its own world too, structured
     like the manifest: one top bar, chamber tabs, one full-height core. */
  if (view === "particlex") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <ParticleX />
        {passageModals}
      </div>
    );
  }

  /* Evolve Med — the evolutionary medical nexus is its own world too:
     one top bar, chamber tabs, one full-height nexus core. */
  if (view === "evolvemed") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <EvolveMed />
        {passageModals}
      </div>
    );
  }

  /* The Cosmic Library — the visitor's own keeping-place and the
     quantum shift of their spirit through the portal. */
  if (view === "library") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <LibraryView />
        {passageModals}
      </div>
    );
  }

  /* The Akashic Library is its own quiet chapter: the reading room of
     records — one sheet on the desk, one record at a time, in the same
     ink as the rest of the book. */
  if (view === "akashic") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <AkashicView />
      </div>
    );
  }

  /* The Dream Book is its own enchanted world: the atelier where a
     tale is woven with the visitor and read as it is being written —
     one back button returns to the laboratory. */
  if (view === "dreambook") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <DreamBookView />
      </div>
    );
  }

  /* LIGHT CODES — the musical chamber is its own quiet world:
     intention in, transmission out — one back button returns. */
  if (view === "lightcodes") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <LightCodesView />
        {passageModals}
      </div>
    );
  }

  /* The Invent studio is its own bound world: the inventor's compact
     workshop — blueprints, bench and rail — one back button returns. */
  if (view === "invent") {
    return (
      <div className={`relative h-[var(--app-h,100dvh)] overflow-hidden ${FRAME_LIFT}`}>
        <CosmicBackdrop />
        <StarField />
        <InventView />
      </div>
    );
  }

  const inConversation = view === "observatory" || view === "transmission";

  return (
    <div className="flex h-[var(--app-h,100dvh)] overflow-hidden">
      <CosmicBackdrop />
      <StarField />

      <Sidebar />
      <MobileSidebar />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Floating handles — no header, just two quiet controls:
            the sidebar at the left (with the simple cosmic mark),
            the scope selector as a fancy icon at the right */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-3 pt-3 transition-all duration-300 sm:px-4 ${
            handlesHidden
              ? "pointer-events-none -translate-y-3 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <div className="pointer-events-auto flex items-center gap-2">
            {/* mobile: open the sheet — desktop: collapse the rail */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t("Open sidebar")}
              title={t("Open sidebar")}
              data-testid="sidebar-toggle"
              className="focus-glow flex size-9 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)] text-muted-foreground shadow-[0_2px_14px_-8px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground md:hidden"
            >
              <AlignLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? t("Close sidebar") : t("Open sidebar")}
              title={sidebarOpen ? t("Close sidebar") : t("Open sidebar")}
              data-testid="sidebar-toggle-desktop"
              className="focus-glow hidden size-9 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)] text-muted-foreground shadow-[0_2px_14px_-8px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground md:flex"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="size-4" aria-hidden="true" />
              )}
            </button>

            {/* The chat keeps only the sidebar's mark — the top bar
                here stays clear, as asked. */}
          </div>

          <div className="pointer-events-auto">
            <ScopeSelector />
          </div>
        </div>

        {/* the space between the handles stays quiet — no indicator,
            no pill; the page simply breathes */}

        {/* Scrollable conversation area — keyed by view so each screen
            (and every chat thread) opens at its very beginning */}
        <div
          ref={chatScrollRef}
          key={view}
          className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* clearance for the floating handles — constant height, so
              hiding them never shifts the thread (that would re-trigger
              the scroll listener in an endless loop) */}
          <div aria-hidden="true" className="h-12" />

          <div className="mx-auto w-full max-w-[760px] px-4 pb-4 sm:px-6">
            {view === "observatory" ? (
              <StillCompanion />
            ) : view === "transmission" ? (
              <TransmissionView />
            ) : (
              <ArchiveRegister />
            )}
          </div>
        </div>

        {/* Bottom — small suggestion bars sliding above the input */}
        {inConversation && (
          <div className="shrink-0 px-3 pb-0.5 sm:px-6">
            <SuggestionStrip />
          </div>
        )}
        <QueryComposer />
      </main>

      <FederationModal />
      <AstralJobsModal />
      <DossierModal />
      <SettingsModal />
      <StarPlayModal />
      <TechnologyModal />
      <SpeciesModal />
      {passageModals}
    </div>
  );
}
