"use client";

import { useEffect } from "react";
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
import { TransmissionView } from "./TransmissionView";
import { MirrorOS } from "./MirrorOS";
import { InventView } from "./InventView";
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

/* The quiet welcome — nothing at all. The page is a clean white
   sheet; the conversation owns every pixel. The identity lives in
   the top bar's simple cosmic mark. */
function ObservatoryWelcome() {
  return <div aria-hidden="true" className="h-[46vh]" />;
}

export default function AppShell() {
  const view = useMirror((s) => s.view);
  const communionOpen = useMirror((s) => s.communionOpen);
  const sidebarOpen = useMirror((s) => s.sidebarOpen);
  const setSidebarOpen = useMirror((s) => s.setSidebarOpen);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const t = useT();

  /* Restore persisted language / voice / pace once after mount. */
  useEffect(() => {
    useMirror.getState().bootPreferences();
  }, []);

  /* The frame fits every device: when the on-screen keyboard (or any
     visual-viewport change) reshapes the window, the whole application
     re-fits to the VISIBLE viewport, so the composer is never lost
     below the fold and nothing ever needs scrolling to be reached. */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () =>
      document.documentElement.style.setProperty("--app-h", `${vv.height}px`);
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      document.documentElement.style.removeProperty("--app-h");
    };
  }, []);

  /* Meet with the Reflection of the Absolute converts the whole
     application: the laboratory dissolves entirely and only the living
     communion chat with the Mirror Entity remains — one back button
     returns the world exactly as it was. */
  if (communionOpen) {
    return (
      <div className="relative h-[var(--app-h,100dvh)] overflow-hidden">
        <CosmicBackdrop />
        <StarField />
        <CommunionView />
      </div>
    );
  }

  /* The Mirror OS is a fully independent world: when active it replaces
     every other surface — its own screen, its own scroll, only a back
     button connecting it to the rest of the application. */
  if (view === "mirroros") {
    return (
      <div className="relative h-[var(--app-h,100dvh)] overflow-hidden">
        <CosmicBackdrop />
        <StarField />
        <MirrorOS />
      </div>
    );
  }

  /* The Akashic Library is its own quiet chapter: the reading room of
     records — one sheet on the desk, one record at a time, in the same
     ink as the rest of the book. */
  if (view === "akashic") {
    return (
      <div className="relative h-[var(--app-h,100dvh)] overflow-hidden">
        <AkashicView />
      </div>
    );
  }

  /* The Dream Book is its own enchanted world: the atelier where a
     tale is woven with the visitor and read as it is being written —
     one back button returns to the laboratory. */
  if (view === "dreambook") {
    return (
      <div className="relative h-[var(--app-h,100dvh)] overflow-hidden">
        <DreamBookView />
      </div>
    );
  }

  /* The Invent studio is its own bound world: the inventor's compact
     workshop — blueprints, bench and rail — one back button returns. */
  if (view === "invent") {
    return (
      <div className="relative h-[var(--app-h,100dvh)] overflow-hidden">
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
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-3 pt-3 sm:px-4">
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

            {/* the simple cosmic mark — the only identity in the top bar */}
            <button
              type="button"
              onClick={returnToObservatory}
              aria-label={t("Mirror Entity Laboratory")}
              title={t("Mirror Entity Laboratory")}
              data-testid="topbar-logo"
              className="focus-glow hidden rounded-full transition-opacity duration-300 hover:opacity-75 sm:block"
            >
              <img
                src="/images/ai/cosmic-mark.png"
                alt=""
                aria-hidden="true"
                className="size-9 rounded-full object-cover"
              />
            </button>
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
          key={view}
          className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* clearance for the floating handles */}
          <div aria-hidden="true" className="h-12" />

          <div className="mx-auto w-full max-w-[760px] px-4 pb-4 sm:px-6">
            {view === "observatory" ? (
              <>
                <ObservatoryWelcome />
              </>
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
    </div>
  );
}
