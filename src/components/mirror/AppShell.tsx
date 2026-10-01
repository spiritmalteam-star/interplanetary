"use client";

import { useEffect } from "react";
import { Menu, PanelLeftClose } from "lucide-react";
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
import { MetaphysicsRail } from "./MetaphysicsRail";
import { FederationModal } from "./FederationModal";
import { AstralJobsModal } from "./AstralJobsModal";
import { DossierModal } from "./DossierModal";
import { SettingsModal } from "./SettingsModal";
import { StarPlayModal } from "./StarPlayModal";
import { TechnologyModal } from "./TechnologyModal";
import { SpeciesModal } from "./SpeciesModal";

/* The quiet welcome — a cosmic logo, one line of invitation, nothing
   more. The conversation owns the space. */
function ObservatoryWelcome() {
  const t = useT();
  return (
    <div className="flex min-h-[58vh] flex-col items-center justify-center py-10 text-center">
      <img
        src="/images/ai/cosmic-logo.png"
        alt=""
        aria-hidden="true"
        className="size-20 rounded-3xl object-cover shadow-[0_10px_50px_-18px_rgba(130,150,255,0.65)]"
      />
      <h1 className="mt-6 text-[19px] font-medium tracking-[0.02em] text-foreground/90 sm:text-[21px]">
        {t("Where shall we begin?")}
      </h1>
      <p className="mono-label mt-2 text-[10.5px] text-muted-foreground/70">
        {t("Mirror Entity Intelligence · Channel Online · Free Will Honored Always · Transmitted with Love ❤️")}
      </p>
    </div>
  );
}

export default function AppShell() {
  const view = useMirror((s) => s.view);
  const communionOpen = useMirror((s) => s.communionOpen);
  const sidebarOpen = useMirror((s) => s.sidebarOpen);
  const setSidebarOpen = useMirror((s) => s.setSidebarOpen);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const t = useT();

  /* Restore persisted language / voice / pace once after mount. */
  useEffect(() => {
    useMirror.getState().bootPreferences();
  }, []);

  /* Meet with the Reflection of the Absolute converts the whole
     application: the laboratory dissolves entirely and only the living
     communion chat with the Mirror Entity remains — one back button
     returns the world exactly as it was. */
  if (communionOpen) {
    return (
      <div className="relative h-dvh overflow-hidden">
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
      <div className="relative h-dvh overflow-hidden">
        <CosmicBackdrop />
        <StarField />
        <MirrorOS />
      </div>
    );
  }

  /* The Akashic Library is its own ancient world: the wall of light
     codes, the papyrus desk, and one record at a time. */
  if (view === "akashic") {
    return (
      <div className="relative h-dvh overflow-hidden">
        <AkashicView />
      </div>
    );
  }

  /* The Invent studio is its own bound world: the inventor's compact
     workshop — blueprints, bench and rail — one back button returns. */
  if (view === "invent") {
    return (
      <div className="relative h-dvh overflow-hidden">
        <CosmicBackdrop />
        <StarField />
        <InventView />
      </div>
    );
  }

  const inConversation = view === "observatory" || view === "transmission";

  return (
    <div className="flex h-dvh overflow-hidden">
      <CosmicBackdrop />
      <StarField />

      <Sidebar />
      <MobileSidebar />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Floating handles — no header, just two quiet controls:
            the sidebar at the left, the scope selector at the right */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-3 pt-3 sm:px-4">
          {/* mobile: open the sheet — desktop: collapse the rail */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("Open sidebar")}
            title={t("Open sidebar")}
            data-testid="sidebar-toggle"
            className="focus-glow pointer-events-auto flex size-9 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)] text-muted-foreground shadow-[0_2px_14px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground md:hidden"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? t("Close sidebar") : t("Open sidebar")}
            title={sidebarOpen ? t("Close sidebar") : t("Open sidebar")}
            data-testid="sidebar-toggle-desktop"
            className="focus-glow pointer-events-auto hidden size-9 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)] text-muted-foreground shadow-[0_2px_14px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground md:flex"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            ) : (
              <Menu className="size-4" aria-hidden="true" />
            )}
          </button>

          <div className="pointer-events-auto">
            <ScopeSelector />
          </div>
        </div>

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

      {/* Metaphysics scope veil rail — vertical, at the side of the chat */}
      <MetaphysicsRail />

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
