"use client";

import { useEffect } from "react";
import { useMirror } from "@/lib/mirror-store";
import { CosmicBackdrop } from "./CosmicBackdrop";
import { StarField } from "./StarField";
import { TopNavigation } from "./TopNavigation";
import Sidebar from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { ModeSelector } from "./ModeSelector";
import { ScienceFilters } from "./ScienceFilters";
import { ScienceFusionRail } from "./ScienceFusionRail";
import { HeroPanel } from "./HeroPanel";
import { QuestionCards } from "./QuestionCards";
import { StatusBar } from "./StatusBar";
import { QueryComposer } from "./QueryComposer";
import { TransmissionView } from "./TransmissionView";
import { MirrorOS } from "./MirrorOS";
import { ArchiveRegister } from "./ArchiveRegister";
import { CommunionView } from "./CommunionView";
import { FederationModal } from "./FederationModal";
import { AstralJobsModal } from "./AstralJobsModal";
import { DossierModal } from "./DossierModal";
import { SettingsModal } from "./SettingsModal";
import { StarPlayModal } from "./StarPlayModal";
import { TechnologyModal } from "./TechnologyModal";

export default function AppShell() {
  const view = useMirror((s) => s.view);
  const communionOpen = useMirror((s) => s.communionOpen);

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

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <CosmicBackdrop />
      <StarField />

      <TopNavigation />

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <MobileSidebar />

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Scrollable content area — keyed by view so each screen
              (and every chat thread) opens at its very beginning */}
          <div
            key={view}
            className="nice-scroll flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto w-full max-w-[880px] px-4 pb-10 sm:px-6">
              {/* Top mode bar */}
              <div className="pt-5 sm:pt-6">
                <ModeSelector />
              </div>

              {view === "observatory" ? (
                <>
                  <ScienceFilters />
                  <HeroPanel />
                  <QuestionCards />
                  <StatusBar />
                </>
              ) : view === "transmission" ? (
                <TransmissionView />
              ) : (
                <ArchiveRegister />
              )}
            </div>
          </div>

          {/* Bottom query composer — pinned */}
          <QueryComposer />
        </main>
      </div>

      {/* Science scope fusion rail — vertical, at the side of the chat */}
      <ScienceFusionRail />

      <FederationModal />
      <AstralJobsModal />
      <DossierModal />
      <SettingsModal />
      <StarPlayModal />
      <TechnologyModal />
    </div>
  );
}
