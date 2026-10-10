"use client";

import { Activity, ArrowLeft } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ThemeToggle } from "../ThemeToggle";
import { LaboratoryWorkspace } from "./LaboratoryWorkspace";
import "./laboratory.css";

/* ------------------------------------------------------------------ */
/*  HEAL EVOLUTION — the evolution laboratory. A unique individual     */
/*  page: when it opens, the whole website becomes it. Every default   */
/*  surface disappears except the MIRROR ENTITY LABORATORY name —      */
/*  proof the seeker never left home — and the toggle of the light.    */
/*  One back button returns to the Mirror Entity.                      */
/* ------------------------------------------------------------------ */

export function HealEvolutionView() {
  const t = useT();
  const exitHealEvolution = useMirror((s) => s.exitHealEvolution);

  return (
    <div
      className="he-world relative flex h-dvh flex-col overflow-hidden"
      data-testid="he-view"
    >
      {/* the laboratory's own slim header — the only things that remain
          of the wider site: its name and its light */}
      <header className="relative z-30 shrink-0 border-b border-white/8 bg-[#050a14]/70 backdrop-blur-xl">
        {/* mobile — two rows: the name on top, the controls beneath */}
        <div className="sm:hidden">
          <div className="flex h-8 items-center justify-center pt-1.5">
            <h1 className="he-font-display text-[9.5px] font-semibold tracking-[0.14em] text-white/95">
              MIRROR ENTITY LABORATORY
            </h1>
          </div>
          <div className="flex h-11 items-center justify-between gap-2 px-3 pb-1.5">
            <button
              type="button"
              onClick={exitHealEvolution}
              data-testid="he-return"
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-white/12 px-2.5 text-[12px] text-white/75 transition-all duration-300 hover:border-emerald-300/40 hover:text-white"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {t("Return to Mirror Entity")}
            </button>
            <span className="he-font-display flex items-center gap-1.5 text-[8px] uppercase tracking-[0.2em] text-white/40">
              <Activity className="size-3 text-emerald-300/70" aria-hidden="true" />
              {t("Heal Evolution")}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* sm and up — one slim row */}
        <div className="relative hidden h-14 items-center justify-between gap-3 px-5 sm:flex">
          <button
            type="button"
            onClick={exitHealEvolution}
            data-testid="he-return"
            className="focus-glow flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/12 px-3.5 text-[12.5px] text-white/75 transition-all duration-300 hover:border-emerald-300/40 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("Return to Mirror Entity")}
          </button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <h1 className="he-font-display truncate text-[15.5px] font-semibold tracking-[0.1em] text-white/95 sm:text-[17px]">
              MIRROR ENTITY LABORATORY
            </h1>
            <p className="he-font-display mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-white/40">
              <Activity
                className="size-3 text-emerald-300/70"
                aria-hidden="true"
              />
              {t("Heal Evolution · the evolution laboratory")}
            </p>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* the world itself — the full-screen laboratory workspace */}
      <div className="relative min-h-0 flex-1">
        <LaboratoryWorkspace />
      </div>
    </div>
  );
}
