"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Feather, Users } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FOCUS_LABELS, FocusChip, GP_HAND, netFetch } from "./shared";

/* ------------------------------------------------------------------ */
/*  THE FIRST VISIT — the welcome sheet of the gathering. A sanctuary  */
/*  for curious minds: the visitor names what calls them (never more   */
/*  than six) and chooses one of three starting hands. The interests   */
/*  are saved first, quietly, and never block the chosen door.         */
/* ------------------------------------------------------------------ */

type StartAction = "discover" | "circles" | "share";

export default function FirstVisitSheet({
  open,
  onChoose,
  onClose,
}: {
  open: boolean;
  onChoose: (a: StartAction) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (f: string | null) => {
    if (!f) return;
    setSelected((prev) =>
      prev.includes(f)
        ? prev.filter((x) => x !== f)
        : prev.length >= 6
          ? prev
          : [...prev, f]
    );
  };

  /* the interests are kept first, best-effort and quiet — the chosen
     hand opens whatever the PATCH's answer is */
  const choose = async (action: StartAction) => {
    if (busy) return;
    setBusy(true);
    if (selected.length > 0) {
      try {
        await netFetch("/api/network/me", {
          method: "PATCH",
          body: { interests: selected.join(",") },
        });
      } catch {
        /* the interests wait — the hand never blocks the door */
      }
    }
    try {
      onChoose(action);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(46,38,24,0.32)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("Explore with Mirror. Discover together.")}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="gp-glass w-full max-w-md rounded-[24px] border border-white/80 p-7"
            data-testid="gath-firstvisit"
          >
            <p className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]">
              {t("the gathering · welcome")}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold leading-snug text-[#3d3428]">
              {t("Explore with Mirror. Discover together.")}
            </h2>
            <p className="mt-2.5 font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#7c715f]">
              {t(
                "A sanctuary for curious minds — share what you discover, meet kindred thinkers, test ideas together. Every presence here is real."
              )}
            </p>

            <p className="mono-label mt-5 text-[8.5px] uppercase tracking-[0.2em] text-[#a2947c]">
              {t("what calls you")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5" data-testid="gath-firstvisit-interest">
              {Object.keys(FOCUS_LABELS).map((f) => (
                <FocusChip key={f} focus={f} on={selected.includes(f)} onChoose={toggle} />
              ))}
            </div>
            {selected.length > 0 && (
              <p className="mono-label mt-2 text-[8px] uppercase tracking-[0.16em] text-[#8a6f46]">
                {selected.length}/6
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void choose("discover")}
                disabled={busy}
                className={cn(GP_HAND, "w-full")}
                data-testid="gath-firstvisit-explore"
              >
                <Compass className="size-4" aria-hidden="true" />
                {t("Explore discoveries")}
              </button>
              <button
                type="button"
                onClick={() => void choose("circles")}
                disabled={busy}
                className={cn(GP_HAND, "w-full")}
                data-testid="gath-firstvisit-circle"
              >
                <Users className="size-4" aria-hidden="true" />
                {t("Find your circle")}
              </button>
              <button
                type="button"
                onClick={() => void choose("share")}
                disabled={busy}
                className={cn(GP_HAND, "w-full")}
                data-testid="gath-firstvisit-share"
              >
                <Feather className="size-4" aria-hidden="true" />
                {t("Share something meaningful")}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="focus-glow rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#a2947c] transition-colors duration-300 hover:text-[#5c5344]"
                data-testid="gath-firstvisit-skip"
              >
                {t("Not now")}
              </button>
              <p className="text-[10.5px] text-[#a2947c]">
                {t("You can change this later in My Space.")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
