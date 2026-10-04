"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, RotateCcw, X } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import {
  CRAFT_PHASES,
  KIND_LABEL,
  stepsLabelFor,
} from "@/lib/data/remedy";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  The Healing Apothecary's mini tab — docked inside the Healing      */
/*  channel, floating just above the composer. While the remedy        */
/*  forms, a small vessel stirs with rising herbs and named phases;    */
/*  then the remedy reveals itself in a quiet, readable card. The      */
/*  background is kept essentially opaque so the chat beneath never    */
/*  interferes with the apothecary's words. The shared vocabulary      */
/*  (phases, kind labels, step headings) lives in data/remedy.ts.      */
/* ------------------------------------------------------------------ */

/* the apothecary's own palette — rose and herb-green, softly lit */
const ROSE = "#52525b";
const HERB = "#71717a";
const GOLD = "#71717a";

function CraftingVessel() {
  return (
    <div className="relative mx-auto size-24" aria-hidden="true">
      {/* breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #71717a 26%, transparent), transparent 70%)",
        }}
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* the vessel rim */}
      <div
        className="absolute inset-1.5 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, #52525b 42%, transparent)" }}
      />
      {/* the swirling blend */}
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, color-mix(in srgb, ${ROSE} 36%, transparent), color-mix(in srgb, ${HERB} 30%, transparent), color-mix(in srgb, ${GOLD} 24%, transparent), color-mix(in srgb, ${ROSE} 36%, transparent))`,
          filter: "blur(1px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      {/* the pestle, stirring in slow circles */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <motion.div
          className="h-11 w-[3px] rounded-full"
          style={{
            transformOrigin: "50% 100%",
            background: `linear-gradient(180deg, color-mix(in srgb, ${GOLD} 75%, white), color-mix(in srgb, ${ROSE} 65%, transparent))`,
          }}
          animate={{ rotate: [-18, 16, -18] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {/* herbs rising from the blend */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          className="absolute size-1 rounded-full"
          style={{
            left: `${22 + ((i * 13) % 56)}%`,
            top: "62%",
            background: i % 2 ? HERB : ROSE,
          }}
          animate={{ y: [4, -30], opacity: [0, 1, 0], scale: [0.7, 1, 0.8] }}
          transition={{
            duration: 2.3,
            repeat: Infinity,
            delay: i * 0.38,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function RemedyCard() {
  const remedy = useMirror((s) => s.remedy);
  const concern = useMirror((s) => s.remedyConcern);
  const closeRemedy = useMirror((s) => s.closeRemedy);
  const t = useT();

  if (!remedy) return null;
  const stepsLabel = stepsLabelFor(remedy.kind);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      data-testid="remedy-card"
      role="region"
      aria-label={t("The remedy is ready")}
    >
      {/* header — sigil, kind, title, close */}
      <div className="flex items-start gap-3 border-b hairline px-4 py-3.5">
        <span
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: `color-mix(in srgb, ${HERB} 45%, transparent)`,
            background: `color-mix(in srgb, ${HERB} 12%, transparent)`,
          }}
          aria-hidden="true"
        >
          <Leaf className="size-3.5" style={{ color: HERB }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/75">
            {t(KIND_LABEL[remedy.kind])}
          </p>
          <p className="mt-0.5 truncate font-serif text-[16.5px] leading-snug text-foreground">
            {remedy.title}
          </p>
          <p className="mono-label mt-0.5 text-[9.5px] uppercase tracking-[0.18em]" style={{ color: `color-mix(in srgb, ${GOLD} 80%, white)` }}>
            {t("The remedy is ready")}
          </p>
        </div>
        <button
          type="button"
          onClick={closeRemedy}
          aria-label={t("Close the remedy")}
          data-testid="remedy-close"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* body — scrollable so the tab never crowds the chat */}
      <div className="nice-scroll max-h-[min(52vh,420px)] overflow-y-auto px-4 py-4">
        {concern && (
          <p className="mb-4 text-[13px] italic leading-relaxed text-muted-foreground">
            “{concern}”
          </p>
        )}

        {remedy.needs.length > 0 && (
          <section aria-label={t("What you will need")}>
            <p className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {t("What you will need")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {remedy.needs.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                    style={{ background: `color-mix(in srgb, ${HERB} 80%, white)` }}
                    aria-hidden="true"
                  />
                  <span className="text-[14px] leading-relaxed text-foreground/88">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-4" aria-label={t(stepsLabel)}>
          <p className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {t(stepsLabel)}
          </p>
          <ol className="mt-2 space-y-2.5">
            {remedy.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mono-label mt-0.5 shrink-0 text-[10px] tabular-nums"
                  style={{ color: `color-mix(in srgb, ${ROSE} 75%, white)` }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[14px] leading-relaxed text-foreground/88">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

      </div>
    </motion.div>
  );
}

/* the crafting ritual — mounts fresh on every craft, cycling the named
   phases while the vessel works */
function CraftingPhases({ concern }: { concern: string }) {
  const t = useT();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % CRAFT_PHASES.length),
      1900
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="px-4 py-6"
      aria-live="polite"
      aria-busy="true"
      data-testid="remedy-crafting"
    >
      <p className="mono-label mb-4 text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/75">
        {t("Preparing a remedy")}
      </p>
      <CraftingVessel />
      <p className="mt-4 text-center text-[13.5px] leading-relaxed text-muted-foreground">
        {t(CRAFT_PHASES[phase] ?? CRAFT_PHASES[0])}
      </p>
      {concern && (
        <p className="mx-auto mt-1.5 max-w-[320px] truncate text-center text-[12px] italic text-muted-foreground/70">
          “{concern}”
        </p>
      )}
    </div>
  );
}

export function RemedyLayer() {
  const status = useMirror((s) => s.remedyStatus);
  const concern = useMirror((s) => s.remedyConcern);
  const error = useMirror((s) => s.remedyError);
  const askRemedy = useMirror((s) => s.askRemedy);
  const t = useT();

  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          key="remedy-layer"
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.985 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="absolute bottom-full left-0 right-0 z-30 mb-2"
        >
          <div
            data-testid="remedy-layer"
            className="overflow-hidden rounded-2xl border hairline shadow-[0_18px_50px_-12px_rgba(0,0,0,0.65)]"
            style={{
              /* essentially opaque — the chat beneath never shows through */
              background:
                "color-mix(in srgb, var(--background) 94%, #1b1b1c)",
            }}
          >
            <div
              className="animate-line-breathe h-px w-full"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${ROSE} 55%, transparent), color-mix(in srgb, ${HERB} 55%, transparent), transparent)`,
              }}
              aria-hidden="true"
            />

            {status === "crafting" && <CraftingPhases concern={concern} />}

            {status === "ready" && <RemedyCard />}

            {status === "error" && (
              <div className="px-4 py-6 text-center" data-testid="remedy-error">
                <p className="text-[14px] italic leading-relaxed text-foreground/80">
                  {t(
                    "The apothecary is quiet — the remedy could not be prepared. Rest a breath, then ask again."
                  )}
                </p>
                {error && (
                  <p className="mt-1.5 text-[12.5px] italic text-muted-foreground/70">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void askRemedy(concern)}
                  data-testid="remedy-retry"
                  className="focus-glow mt-3 inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
                  style={{
                    borderColor: `color-mix(in srgb, ${HERB} 40%, transparent)`,
                  }}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  {t("Be still and receive")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
