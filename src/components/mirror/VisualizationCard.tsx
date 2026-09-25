"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  LoaderCircle,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { VisualizationArtifact } from "@/lib/visualization";

/* ================================================================== */
/*  MIRROR ENTITY — Universal Visualization Engine (client)            */
/*  The completed vision arrives as a responsive image card: artwork,  */
/*  title, contextual explanation, expand · download · regenerate —    */
/*  with hybrid overlays (diagram nodes, map markers, panels) drawn    */
/*  as real interface elements so every word stays readable.           */
/* ================================================================== */

const MODE_LABELS: Record<VisualizationArtifact["mode"], string> = {
  illustration: "Cinematic Illustration",
  encyclopedia: "Visual Encyclopedia",
  diagram: "Organizational Diagram",
  science: "Scientific Visualization",
  map: "Interplanetary Map",
  presentation: "Visual Presentation",
};

interface CardTheme {
  /** css color string, e.g. "var(--sp-b)" */
  accent: string;
  testIdPrefix: string;
}

/* ------------------------------------------------------------------ */
/*  The pending vision — a quiet animation of every process            */
/* ------------------------------------------------------------------ */

const STAGES = [
  "Composing the vision…",
  "Painting the artwork…",
  "Placing it before you…",
] as const;

export function VisualizationPending({
  accent,
  repaint = false,
  testIdPrefix,
}: {
  accent: string;
  repaint?: boolean;
  testIdPrefix: string;
}) {
  const t = useT();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (repaint) return;
    const id = window.setInterval(
      () => setStage((s) => (s + 1) % STAGES.length),
      3400
    );
    return () => window.clearInterval(id);
  }, [repaint]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_65%,transparent)] px-5 py-5"
      data-testid={`${testIdPrefix}-pending`}
      aria-busy="true"
      aria-live="polite"
    >
      <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
        {repaint ? t("Repainting the vision…") : t("Creating visualization…")}
      </p>
      <div className="mt-3 flex items-center gap-4">
        {/* the forming vision */}
        <span className="relative flex size-14 shrink-0 items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: `color-mix(in srgb, ${accent} 45%, transparent)` }}
              animate={{ scale: [0.5, 1.25], opacity: [0.65, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
          <motion.span
            className="flex size-8 items-center justify-center rounded-full"
            style={{
              background: `color-mix(in srgb, ${accent} 16%, transparent)`,
              boxShadow: `0 0 22px -6px color-mix(in srgb, ${accent} 75%, transparent)`,
            }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <LoaderCircle
              className="size-4 animate-[spin-slower_3.2s_linear_infinite]"
              style={{ color: accent }}
              aria-hidden="true"
            />
          </motion.span>
        </span>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={repaint ? "repaint" : stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-[14.5px] italic text-foreground/85"
            >
              {repaint ? t("Repainting the vision…") : t(STAGES[stage])}
            </motion.p>
          </AnimatePresence>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--hairline)_60%,transparent)]">
            <motion.div
              className="h-full w-1/3 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              }}
              animate={{ x: ["-110%", "330%"] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  The prepared-prompt fallback — when the brushes rest               */
/* ------------------------------------------------------------------ */

export function PreparedPromptFallback({
  artifact,
  accent,
  testIdPrefix,
}: {
  artifact: VisualizationArtifact;
  accent: string;
  testIdPrefix: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(artifact.prompt);
      setCopied(true);
      toast.success(t("Prompt copied."));
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error(t("The copying did not take — select and copy by hand."));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_65%,transparent)] px-5 py-4"
      data-testid={`${testIdPrefix}-fallback`}
    >
      <p className="mono-label text-[10px] uppercase tracking-[0.24em]" style={{ color: accent }}>
        {artifact.title}
      </p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/85">
        {t(
          "The vision was composed, but the brushes rest. Keep this prepared prompt until the painter returns:"
        )}
      </p>
      <p className="nice-scroll mt-2.5 max-h-24 overflow-y-auto rounded-xl border border-[color-mix(in_srgb,var(--hairline)_55%,transparent)] bg-[color-mix(in_srgb,var(--hairline)_16%,transparent)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {artifact.prompt}
      </p>
      <button
        type="button"
        onClick={() => void copyPrompt()}
        className="focus-glow mt-3 flex h-9 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] px-4 text-[13px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)]"
        data-testid={`${testIdPrefix}-copy-prompt`}
      >
        <Copy className="size-3.5" aria-hidden="true" />
        {copied ? t("copied") : t("Copy the prompt")}
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Diagram overlay — elegant nodes and threads over the artwork       */
/* ------------------------------------------------------------------ */

function DiagramOverlay({
  artifact,
  accent,
}: {
  artifact: VisualizationArtifact;
  accent: string;
}) {
  const diagram = artifact.diagram;
  const byId = useMemo(
    () => new Map((diagram?.nodes ?? []).map((n) => [n.id, n])),
    [diagram]
  );
  if (!diagram || diagram.nodes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0" data-testid="visual-diagram-overlay">
      {/* the threads */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {diagram.edges.map(([a, b], i) => {
          const na = byId.get(a);
          const nb = byId.get(b);
          if (!na || !nb) return null;
          const mx = (na.x + nb.x) / 2;
          const my = (na.y + nb.y) / 2 - Math.abs(nb.x - na.x) * 0.12 - 3;
          return (
            <path
              key={i}
              d={`M ${na.x} ${na.y} Q ${mx} ${my} ${nb.x} ${nb.y}`}
              fill="none"
              stroke={accent}
              strokeWidth={1}
              strokeOpacity={0.55}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="3 3"
            />
          );
        })}
      </svg>
      {/* the councils themselves */}
      {diagram.nodes.map((n, i) => (
        <motion.span
          key={n.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-[10.5px] font-medium leading-tight backdrop-blur-md sm:text-[11.5px]"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            maxWidth: "30%",
            borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
            background: "color-mix(in srgb, #08050f 62%, transparent)",
            color: "rgba(255,255,255,0.94)",
            boxShadow: `0 0 18px -8px color-mix(in srgb, ${accent} 80%, transparent)`,
          }}
        >
          <span className="line-clamp-2">{n.label}</span>
        </motion.span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Map / science annotations — luminous markers on the artwork        */
/* ------------------------------------------------------------------ */

function AnnotationMarkers({
  artifact,
  accent,
}: {
  artifact: VisualizationArtifact;
  accent: string;
}) {
  if (artifact.annotations.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0" data-testid="visual-annotations">
      {artifact.annotations.map((a, i) => (
        <motion.span
          key={`${a.x}-${a.y}-${i}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
        >
          <span
            className="size-2 shrink-0 rotate-45 border"
            style={{
              borderColor: accent,
              background: "color-mix(in srgb, #08050f 55%, transparent)",
              boxShadow: `0 0 10px -2px color-mix(in srgb, ${accent} 90%, transparent)`,
            }}
          />
          <span
            className="max-w-[150px] rounded-full border px-2 py-0.5 text-[9.5px] leading-tight backdrop-blur-md sm:max-w-[190px] sm:text-[10.5px]"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
              background: "color-mix(in srgb, #08050f 58%, transparent)",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {a.label}
          </span>
        </motion.span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The presentation deck — each slide with its own artwork            */
/* ------------------------------------------------------------------ */

function PresentationDeck({
  artifact,
  accent,
  testIdPrefix,
}: {
  artifact: VisualizationArtifact;
  accent: string;
  testIdPrefix: string;
}) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const slides = artifact.slides;
  const total = slides.length;
  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + total) % total);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <div data-testid={`${testIdPrefix}-deck`}>
      <div className="relative overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--hairline)_60%,transparent)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                loading="lazy"
                className="aspect-[7/4] w-full object-cover"
              />
            ) : (
              <div
                className="flex aspect-[7/4] w-full items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${accent} 22%, transparent), transparent 60%), linear-gradient(160deg, #0a0716, #120a24)`,
                }}
              >
                <span className="mono-label text-[11px] tracking-[0.3em]" style={{ color: accent }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("Previous slide")}
              data-testid={`${testIdPrefix}-deck-prev`}
              className="focus-glow absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 backdrop-blur-md transition-all duration-300 hover:bg-black/55"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("Next slide")}
              data-testid={`${testIdPrefix}-deck-next`}
              className="focus-glow absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 backdrop-blur-md transition-all duration-300 hover:bg-black/55"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`cap-${index}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-3"
        >
          <p className="text-[15px] font-semibold text-foreground/95">{slide.title}</p>
          {slide.body && (
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              {slide.body}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 flex items-center justify-between">
        <span className="mono-label text-[10px] tracking-[0.2em] text-muted-foreground/70">
          {t("Slide {n} of {total}", { n: index + 1, total })}
        </span>
        <span className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${t("Slide {n} of {total}", { n: i + 1, total })}`}
              className={cn(
                "size-1.5 rounded-full transition-all duration-300",
                i === index ? "w-4" : "opacity-40"
              )}
              style={{ background: i === index ? accent : "currentColor" }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The card itself                                                    */
/* ------------------------------------------------------------------ */

export function VisualizationCard({
  artifact,
  accent,
  testIdPrefix,
  onRegenerate,
  regenerating = false,
}: {
  artifact: VisualizationArtifact;
  accent: string;
  testIdPrefix: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const t = useT();
  const [loaded, setLoaded] = useState(false);
  const [ratio, setRatio] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const modeLabel = MODE_LABELS[artifact.mode];
  const deckRef = useRef<HTMLDivElement>(null);

  /* body scroll lock while expanded */
  useEffect(() => {
    if (!expanded) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [expanded]);

  /* Escape closes · arrows turn the deck while expanded */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      if (artifact.mode === "presentation" && artifact.slides.length > 1) {
        if (e.key === "ArrowRight")
          deckRef.current
            ?.querySelector<HTMLButtonElement>(`[data-testid="${testIdPrefix}-deck-next"]`)
            ?.click();
        if (e.key === "ArrowLeft")
          deckRef.current
            ?.querySelector<HTMLButtonElement>(`[data-testid="${testIdPrefix}-deck-prev"]`)
            ?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, artifact.mode, artifact.slides.length, testIdPrefix]);

  const showArtwork =
    artifact.imageUrl !== null && artifact.mode !== "presentation";
  const hasPanels = artifact.panels.length > 0;

  const artwork = (large: boolean) => (
    <div
      className="relative overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--hairline)_60%,transparent)]"
      style={{
        aspectRatio:
          ratio ?? (artifact.mode === "encyclopedia" || artifact.mode === "science" ? "4 / 3" : "7 / 4"),
      }}
      data-testid={large ? `${testIdPrefix}-artwork-large` : `${testIdPrefix}-artwork`}
    >
      {!loaded && (
        <div className="shimmer-bar absolute inset-0" aria-hidden="true" />
      )}
      {artifact.imageUrl && (
        <img
          src={artifact.imageUrl}
          alt={artifact.title}
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
            }
            setLoaded(true);
          }}
          className={cn(
            "size-full object-cover transition-opacity duration-700",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {!large && (
        <>
          <DiagramOverlay artifact={artifact} accent={accent} />
          <AnnotationMarkers artifact={artifact} accent={accent} />
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_70%,transparent)]"
      data-testid={`${testIdPrefix}-card`}
    >
      {/* the Mirror's whisper above the vision */}
      {artifact.whisper && (
        <p className="px-5 pt-4 text-[14.5px] italic leading-relaxed text-foreground/80 sm:px-6">
          {artifact.whisper}
        </p>
      )}

      <div className="p-4 pt-3 sm:p-5 sm:pt-3.5">
        {regenerating ? (
          <div className="relative">
            <div className="pointer-events-none opacity-30">
              {artifact.mode === "presentation" ? (
                <div className="aspect-[7/4] w-full rounded-xl bg-[color-mix(in_srgb,var(--hairline)_35%,transparent)]" />
              ) : (
                artwork(false)
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <VisualizationPending accent={accent} repaint testIdPrefix={`${testIdPrefix}-repaint`} />
            </div>
          </div>
        ) : artifact.mode === "presentation" ? (
          <div ref={deckRef}>
            <PresentationDeck artifact={artifact} accent={accent} testIdPrefix={testIdPrefix} />
          </div>
        ) : (
          <>
            {showArtwork && artwork(false)}
            {/* title · subtitle */}
            <div className="mt-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="mono-label text-[9.5px] uppercase tracking-[0.26em]"
                  style={{ color: accent }}
                >
                  {t(modeLabel)}
                </p>
                <h4
                  className="mt-1 text-[17px] font-semibold leading-snug text-foreground"
                  data-testid={`${testIdPrefix}-title`}
                >
                  {artifact.title}
                </h4>
                {artifact.subtitle && (
                  <p className="mt-0.5 text-[13.5px] italic text-muted-foreground">
                    {artifact.subtitle}
                  </p>
                )}
              </div>
            </div>
            {artifact.explanation && (
              <p className="mt-2.5 text-[14px] leading-relaxed text-foreground/85">
                {artifact.explanation}
              </p>
            )}
          </>
        )}

        {/* the informational panels — real interface text, always readable */}
        {hasPanels && !regenerating && (
          <div
            className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            data-testid={`${testIdPrefix}-panels`}
          >
            {artifact.panels.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border border-[color-mix(in_srgb,var(--hairline)_55%,transparent)] bg-[color-mix(in_srgb,var(--hairline)_14%,transparent)] px-3.5 py-3",
                  i === 0 && artifact.panels.length > 2 && "sm:col-span-2"
                )}
              >
                <p
                  className="mono-label text-[9.5px] uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  {p.heading}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* controls */}
        {!regenerating && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {artifact.mode !== "presentation" && artifact.imageUrl && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={t("Expand")}
                title={t("Expand")}
                data-testid={`${testIdPrefix}-expand`}
                className="focus-glow flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] px-3.5 text-[12.5px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)]"
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t("Expand")}</span>
              </button>
            )}
            {artifact.downloadUrl && (
              <a
                href={artifact.downloadUrl}
                download
                aria-label={t("Download")}
                title={t("Download")}
                data-testid={`${testIdPrefix}-download`}
                className="focus-glow flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] px-3.5 text-[12.5px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)]"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t("Download")}</span>
              </a>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                aria-label={t("Regenerate")}
                title={t("Regenerate")}
                data-testid={`${testIdPrefix}-regenerate`}
                className="focus-glow flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] px-3.5 text-[12.5px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)]"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t("Regenerate")}</span>
              </button>
            )}
          </div>
        )}

        {/* discernment — imagination is never sold as evidence */}
        {artifact.discernment && (
          <p
            className="mt-3.5 border-t border-[color-mix(in_srgb,var(--hairline)_40%,transparent)] pt-2.5 text-[11.5px] italic leading-relaxed text-muted-foreground/80"
            data-testid={`${testIdPrefix}-discernment`}
          >
            ✦ {artifact.discernment}
          </p>
        )}
      </div>

      {/* ---------- the expanded vision ----------
          Rendered through a portal to document.body: ancestors carry
          framer-motion transforms, and a fixed overlay inside a
          transformed ancestor would be trapped by the containing block. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[120] flex flex-col bg-[rgba(4,2,10,0.92)] backdrop-blur-xl"
                data-testid={`${testIdPrefix}-lightbox`}
                onClick={() => setExpanded(false)}
              >
                <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div className="min-w-0">
                    <p
                      className="mono-label text-[9.5px] uppercase tracking-[0.26em]"
                      style={{ color: accent }}
                    >
                      {t(modeLabel)}
                    </p>
                    <p className="truncate text-[15px] font-semibold text-foreground">
                      {artifact.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    aria-label={t("Close the expanded vision")}
                    data-testid={`${testIdPrefix}-lightbox-close`}
                    className="focus-glow flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/90 transition-all duration-300 hover:rotate-90 hover:border-white/40"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div
                  className="nice-scroll flex-1 overflow-y-auto px-4 pb-6 sm:px-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto max-w-[1080px]">
                    {artifact.mode === "presentation" ? (
                      <div ref={deckRef}>
                        <PresentationDeck
                          artifact={artifact}
                          accent={accent}
                          testIdPrefix={`${testIdPrefix}-lb`}
                        />
                      </div>
                    ) : (
                      artwork(true)
                    )}
                    {artifact.explanation && (
                      <p className="mx-auto mt-4 max-w-[720px] text-[14.5px] leading-relaxed text-foreground/85">
                        {artifact.explanation}
                      </p>
                    )}
                    {hasPanels && (
                      <div className="mx-auto mt-4 grid max-w-[900px] grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {artifact.panels.map((p, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded-xl border border-white/12 bg-white/[0.045] px-4 py-3.5",
                              i === 0 &&
                                artifact.panels.length > 2 &&
                                "sm:col-span-2"
                            )}
                          >
                            <p
                              className="mono-label text-[9.5px] uppercase tracking-[0.2em]"
                              style={{ color: accent }}
                            >
                              {p.heading}
                            </p>
                            <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85">
                              {p.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {artifact.discernment && (
                      <p className="mx-auto mt-4 max-w-[720px] border-t border-white/10 pt-3 text-center text-[11.5px] italic text-muted-foreground/80">
                        ✦ {artifact.discernment}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}
