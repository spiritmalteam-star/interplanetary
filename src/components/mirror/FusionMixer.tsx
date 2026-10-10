"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Atom, X } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { fusionFields } from "@/lib/data/science";
import { fusionColorsOf, fusionGlowOf, fusionGradientOf } from "@/lib/fusion";
import { cn } from "@/lib/utils";

/**
 * FusionMixer — the fusion entry of the Science scope, docked as a slim
 * VERTICAL RAIL at the side of the chat: a tall pill with a vertical
 * label that rides alongside the thread without ever covering a word.
 * Open it to mix disciplines; the mixed blend becomes the visible color
 * of the chat frame itself. The parent element must be `relative`.
 */
export function FusionMixer() {
  const fusionMix = useMirror((s) => s.fusionMix);
  const toggleFusionField = useMirror((s) => s.toggleFusionField);
  const clearFusionMix = useMirror((s) => s.clearFusionMix);
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const gradient = fusionGradientOf(fusionMix);
  const glow = fusionGlowOf(fusionMix);
  const fused = fusionMix.length > 0;

  /* ESC closes the mixer; click-away too. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      aria-label={t("Fusion mixer")}
      className="pointer-events-none absolute inset-y-2 right-0 z-30 w-12"
    >
      {/* rides with the scroll — always within reach, never over text */}
      <div className="sticky top-5 flex flex-col items-center gap-1.5">
        {/* the mixer panel — opens leftward, away from the thread */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto absolute right-[calc(100%+12px)] top-0 w-[min(80vw,320px)] rounded-2xl border hairline bg-[var(--glass-bg-strong)] p-4 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
              role="dialog"
              aria-label={t("Fusion mixer")}
            >
              <div className="flex items-center justify-between">
                <p className="mono-label text-[9px] text-muted-foreground">
                  {t("Fuse disciplines")}
                </p>
                {fused && (
                  <button
                    type="button"
                    onClick={() => clearFusionMix()}
                    className="focus-glow mono-label flex items-center gap-1 rounded-full border hairline px-2 py-0.5 text-[8.5px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-2.5" aria-hidden="true" />
                    {t("Clear mix")}
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {fusionFields.map((f) => {
                  const active = fusionMix.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFusionField(f.id)}
                      aria-pressed={active}
                      className={cn(
                        "focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] transition-all duration-300",
                        active
                          ? "font-semibold text-foreground"
                          : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                      )}
                      style={
                        active
                          ? {
                              borderColor: `color-mix(in srgb, ${f.color} 55%, transparent)`,
                              background: `color-mix(in srgb, ${f.color} 13%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{
                          background: f.color,
                          boxShadow: `0 0 8px color-mix(in srgb, ${f.color} 70%, transparent)`,
                        }}
                      />
                      <span aria-hidden="true" className="text-[11px] leading-none">
                        {f.emoji}
                      </span>
                      <span className="truncate">{t(f.label)}</span>
                    </button>
                  );
                })}
              </div>

              {/* live blend preview */}
              <div className="mt-3.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    background:
                      gradient ??
                      "color-mix(in srgb, var(--muted-foreground) 22%, transparent)",
                  }}
                  aria-hidden="true"
                />
                <p className="mono-label mt-2 text-[8.5px] text-muted-foreground/80">
                  {fused
                    ? t("{n} disciplines fused into one lens", {
                        n: fusionMix.length,
                      })
                    : t("Mix two or more — the chat takes their light")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the vertical fusion pill */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={t("Fusion mixer")}
          className={cn(
            "focus-glow pointer-events-auto group flex w-11 flex-col items-center gap-2 rounded-full border py-3.5 transition-all duration-500",
            fused
              ? "border-transparent text-[#140b04] shadow-[0_10px_36px_-12px_rgba(0,0,0,0.5)]"
              : "hairline glass text-foreground animate-pill-breathe hover:glow-sm"
          )}
          style={
            fused
              ? {
                  background: gradient ?? undefined,
                  boxShadow: glow ?? undefined,
                }
              : undefined
          }
        >
          <Atom
            className={cn(
              "size-4 shrink-0 transition-transform duration-700",
              fused
                ? "text-[#140b04]/85 group-hover:rotate-180"
                : "text-[var(--cy)] group-hover:rotate-90"
            )}
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="mono-label text-[9px] leading-none tracking-[0.22em] [writing-mode:vertical-rl]"
          >
            {t("Fusion")}
          </span>
          {fused && (
            <span className="mono-label flex size-5 shrink-0 items-center justify-center rounded-full bg-black/25 text-[8.5px] leading-none text-white">
              {fusionMix.length}
            </span>
          )}
        </button>

        {/* quiet color legend when fused — the colors stay visible at a glance */}
        {fused && (
          <span
            className="pointer-events-none flex flex-col items-center gap-1"
            aria-hidden="true"
          >
            {fusionColorsOf(fusionMix).map((c, i) => (
              <span key={i} className="size-1 rounded-full" style={{ background: c }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
