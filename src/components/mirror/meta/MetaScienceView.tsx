"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { getMetaEntity } from "@/lib/data/meta-science";
import { useMirror } from "@/lib/mirror-store";
import { useMetaScience } from "@/lib/meta-science-store";
import { useT } from "@/lib/i18n";
import { ThemeToggle } from "../ThemeToggle";
import { MsBoot } from "./MsBoot";
import { MsDetail } from "./MsDetail";
import { MsHub } from "./MsHub";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the deeper laboratory. A unique individual page:    */
/*  when it opens, the whole website becomes it. Every default         */
/*  surface disappears except the MIRROR ENTITY LABORATORY name —      */
/*  proof the seeker never left home — and the toggle of the light.    */
/*  One back button returns to the Mirror Entity.                      */
/* ------------------------------------------------------------------ */

export function MetaScienceView() {
  const t = useT();
  const exitMetaScience = useMirror((s) => s.exitMetaScience);
  const booted = useMetaScience((s) => s.booted);
  const activeEntity = useMetaScience((s) => s.activeEntity);
  const openEntity = useMetaScience((s) => s.openEntity);
  const closeEntity = useMetaScience((s) => s.closeEntity);

  const entity = getMetaEntity(activeEntity);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden ms-world" data-testid="metascience-view">
      {/* the laboratory's own slim header — the only things that remain
          of the wider site: its name and its light */}
      <header className="relative z-30 shrink-0 border-b border-white/8 bg-[#05050d]/70 backdrop-blur-xl">
        {/* mobile — two rows: the name on top, the controls beneath */}
        <div className="sm:hidden">
          <div className="flex h-8 items-center justify-center pt-1.5">
            <h1 className="ms-font-display text-[9.5px] font-semibold tracking-[0.14em] text-white/95">
              MIRROR ENTITY LABORATORY
            </h1>
          </div>
          <div className="flex h-11 items-center justify-between gap-2 px-3 pb-1.5">
            <button
              type="button"
              onClick={exitMetaScience}
              data-testid="ms-return"
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-white/12 px-2.5 text-[12px] text-white/75 transition-all duration-300 hover:border-cyan-300/40 hover:text-white"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {t("Return to Mirror Entity")}
            </button>
            <span className="ms-font-display flex items-center gap-1.5 text-[8px] uppercase tracking-[0.2em] text-white/40">
              <FlaskConical className="size-3 text-cyan-300/70" aria-hidden="true" />
              {t("Meta Science")}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* sm and up — one slim row */}
        <div className="relative hidden h-14 items-center justify-between gap-3 px-5 sm:flex">
          <button
            type="button"
            onClick={exitMetaScience}
            data-testid="ms-return"
            className="focus-glow flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/12 px-3.5 text-[12.5px] text-white/75 transition-all duration-300 hover:border-cyan-300/40 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("Return to Mirror Entity")}
          </button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <h1 className="ms-font-display truncate text-[15.5px] font-semibold tracking-[0.1em] text-white/95 sm:text-[17px]">
              MIRROR ENTITY LABORATORY
            </h1>
            <p className="ms-font-display mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-white/40">
              <FlaskConical className="size-3 text-cyan-300/70" aria-hidden="true" />
              {t("Meta Science · the deeper laboratory")}
            </p>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* the world itself */}
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain ms-scroll">
        <AnimatePresence mode="wait" initial={false}>
          {entity ? (
            <motion.div
              key={`entity-${entity.key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-h-full"
            >
              <MsDetail entity={entity} onBack={closeEntity} />
            </motion.div>
          ) : (
            <motion.div
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-h-full"
            >
              <MsHub onEngage={openEntity} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the boot sequence — once per arrival, then the lab is awake */}
      <AnimatePresence>
        {!booted && <MsBoot key="boot" />}
      </AnimatePresence>
    </div>
  );
}
