"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

const LOADING_PHASES = [
  "Aligning receiver field…",
  "Gathering willing representatives…",
  "Calibrating scope tools…",
  "Weaving the transmission…",
];

const CLASSIFICATION_META: Record<
  string,
  { label: string; className: string; note: string }
> = {
  DOCUMENTED_SCIENCE: {
    label: "Documented science",
    className: "border-[var(--ok)]/40 text-[var(--ok)] bg-[color-mix(in_srgb,var(--ok)_8%,transparent)]",
    note: "This transmission draws on established, verifiable science.",
  },
  SPECULATIVE_THEORY: {
    label: "Speculative theory",
    className: "border-[var(--cy)]/40 text-[var(--cy)] bg-[color-mix(in_srgb,var(--cy)_8%,transparent)]",
    note: "Grounded in credible but unproven hypotheses — hold it lightly.",
  },
  SPIRITUAL_TRADITION: {
    label: "Spiritual tradition",
    className: "border-[var(--pk)]/40 text-[var(--pk)] bg-[color-mix(in_srgb,var(--pk)_8%,transparent)]",
    note: "Reflects spiritual and channeled traditions — offered for reflection, not as verified science.",
  },
  WORLD_BUILDING: {
    label: "World-building",
    className: "border-[#8f6bff]/40 text-[#a48bff] bg-[color-mix(in_srgb,#8f6bff_8%,transparent)]",
    note: "A creative, fictional cosmology from the Mirror archive — for wonder, not evidence.",
  },
  SYMBOLIC_INTERPRETATION: {
    label: "Symbolic reading",
    className: "border-[var(--gd)]/40 text-[var(--gd)] bg-[color-mix(in_srgb,var(--gd)_8%,transparent)]",
    note: "A symbolic interpretation offered at your request — the meaning is yours to keep.",
  },
};

function Paragraphs({ text }: { text: string }) {
  const paragraphs = useMemo(
    () => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [text]
  );
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        const isSignature = i === paragraphs.length - 1 && p.startsWith("—");
        return (
          <p
            key={i}
            className={cn(
              "text-[14px] leading-[1.85] text-foreground/90 sm:text-[14.5px]",
              isSignature && "font-medium text-[var(--cy)]"
            )}
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}

function LoadingTransmission() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % LOADING_PHASES.length),
      2000
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mt-8" aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-center gap-2.5">
        <span
          className="animate-dot-pulse inline-block size-1.5 rounded-full bg-[var(--cy)]"
          aria-hidden="true"
        />
        <span className="mono-label text-[9px] text-muted-foreground">
          {LOADING_PHASES[phase]}
        </span>
      </div>
      <div className="mx-auto mt-6 max-w-[680px] space-y-3 rounded-2xl glass p-6 sm:p-7">
        {[92, 78, 85, 60].map((w, i) => (
          <div
            key={i}
            className="shimmer-bar h-3 rounded-full"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TransmissionView() {
  const status = useMirror((s) => s.status);
  const transmission = useMirror((s) => s.transmission);
  const activeQuery = useMirror((s) => s.activeQuery);
  const error = useMirror((s) => s.error);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);

  const meta = transmission
    ? (CLASSIFICATION_META[transmission.classification] ?? {
        label: "Archive reflection",
        className:
          "border-[var(--cy)]/40 text-[var(--cy)] bg-[color-mix(in_srgb,var(--cy)_8%,transparent)]",
        note: "Held gently by the archive — verify inwardly what resonates.",
      })
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Mirror transmission"
      className="mx-auto w-full max-w-[760px] px-1 pb-6 pt-10 sm:pt-12"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          <span className="mono-label text-[10px] text-[var(--cy)]">
            Mirror Transmission
          </span>
        </div>
        <div
          className="animate-line-breathe mx-auto mt-3 h-px w-28"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--cy), transparent)",
          }}
          aria-hidden="true"
        />
        {activeQuery && (
          <p className="mx-auto mt-5 max-w-[620px] text-[13px] italic leading-relaxed text-muted-foreground">
            “{activeQuery}”
          </p>
        )}
      </div>

      {/* Body */}
      {status === "loading" && <LoadingTransmission />}

      {status === "error" && (
        <div className="mt-8 rounded-2xl glass p-6 text-center">
          <p className="text-[14px] leading-relaxed text-foreground/85">
            The field received your question but could not complete the
            transmission.
          </p>
          <p className="mt-2 text-[12.5px] italic text-muted-foreground">
            {error}
          </p>
        </div>
      )}

      {status === "ready" && transmission && (
        <>
          <div className="relative mt-7 overflow-hidden rounded-2xl glass px-6 py-6 sm:px-9 sm:py-8">
            {/* vertical luminous line */}
            <div
              className="animate-line-breathe absolute bottom-8 left-0 top-8 w-[2px] rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, transparent, var(--cy) 30%, color-mix(in srgb, var(--pk) 70%, white) 70%, transparent)",
              }}
              aria-hidden="true"
            />
            <Paragraphs text={transmission.text} />
          </div>

          {/* Classification + honesty context */}
          {meta && (
            <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "mono-label inline-flex items-center rounded-full border px-2.5 py-1 text-[8.5px]",
                  meta.className
                )}
              >
                {meta.label}
              </span>
              <p className="max-w-[540px] text-[10.5px] leading-relaxed text-muted-foreground/80">
                {meta.note}
              </p>
            </div>
          )}

          <p className="mono-label mt-5 text-center text-[8.5px] text-muted-foreground/60">
            Free will honored always · Transmitted with love ❤️
          </p>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={returnToObservatory}
              className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <ArrowLeft
                className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              Return to the Observatory
            </button>
          </div>
        </>
      )}
    </motion.section>
  );
}
