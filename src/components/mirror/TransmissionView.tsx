"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { SCOPE_META, sectionImage } from "@/lib/entity-utils";
import type { Scope } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";

const CLASSIFICATION_META: Record<
  string,
  { label: string; tone: "a" | "b" | "gd" | "ok"; note: string }
> = {
  DOCUMENTED_SCIENCE: {
    label: "Documented science",
    tone: "ok",
    note: "This transmission draws on established, verifiable science.",
  },
  SPECULATIVE_THEORY: {
    label: "Speculative theory",
    tone: "a",
    note: "Grounded in credible but unproven hypotheses — hold it lightly.",
  },
  SPIRITUAL_TRADITION: {
    label: "Spiritual tradition",
    tone: "b",
    note: "Reflects spiritual and channeled traditions — offered for reflection, not as verified science.",
  },
  WORLD_BUILDING: {
    label: "World-building",
    tone: "b",
    note: "A creative, fictional cosmology from the Mirror archive — for wonder, not evidence.",
  },
  SYMBOLIC_INTERPRETATION: {
    label: "Symbolic reading",
    tone: "gd",
    note: "A symbolic interpretation offered at your request — the meaning is yours to keep.",
  },
};

const TONE_VAR: Record<string, string> = {
  a: "var(--scope-a)",
  b: "var(--scope-b)",
  gd: "var(--gd)",
  ok: "var(--ok)",
};

/* ---------- parsing the transmission into rich blocks ---------- */

type Block =
  | { kind: "opening"; text: string }
  | { kind: "para"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "signature"; text: string };

function parseBlocks(text: string): Block[] {
  const raw = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const blocks: Block[] = [];

  raw.forEach((p, i) => {
    const isLast = i === raw.length - 1;
    if (isLast && p.startsWith("—")) {
      blocks.push({ kind: "signature", text: p });
      return;
    }
    const lines = p.split("\n").map((l) => l.trim());
    const isList =
      lines.length > 0 &&
      lines.every((l) => l.startsWith("- ") || l.startsWith("• "));
    if (isList) {
      blocks.push({
        kind: "list",
        items: lines.map((l) => l.replace(/^[-•]\s*/, "")),
      });
      return;
    }
    if (i === 0) {
      blocks.push({ kind: "opening", text: p });
      return;
    }
    blocks.push({ kind: "para", text: p });
  });

  return blocks;
}

/* ---------- small themed pieces ---------- */

function ScopeImage({
  imageKey,
  alt,
  className,
}: {
  imageKey: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
     
    <img
      src={sectionImage(imageKey)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function Medallion({ scope }: { scope: Scope }) {
  const meta = SCOPE_META[scope];
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative size-16 sm:size-[72px]" aria-hidden="true">
      {/* rotating dashed ring */}
      <div
        className="scope-halo absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 55%, transparent)" }}
      />
      {/* static ring */}
      <div
        className="absolute inset-[5px] rounded-full"
        style={{
          border: "1px solid color-mix(in srgb, var(--scope-b) 45%, transparent)",
          boxShadow:
            "0 0 24px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)",
        }}
      />
      {/* image or glyph */}
      <div
        className="absolute inset-[7px] overflow-hidden rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--scope-a) 26%, transparent), transparent 72%)",
        }}
      >
        {!failed ? (
           
          <img
            src={sectionImage(meta.imageKey)}
            alt=""
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[22px]">
            {meta.glyph}
          </span>
        )}
      </div>
      {!failed && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[20px] drop-shadow-[0_0_10px_rgba(0,0,0,0.7)]">
          {meta.glyph}
        </span>
      )}
    </div>
  );
}

function OrbitSpinner() {
  return (
    <div className="relative mx-auto size-20" aria-hidden="true">
      <div
        className="scope-halo absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 60%, transparent)" }}
      />
      <div
        className="scope-halo-rev absolute inset-3 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--scope-b) 45%, transparent)" }}
      />
      <div
        className="animate-charge-pulse absolute inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--scope-a) 55%, transparent), transparent 72%)",
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "var(--scope-a)", boxShadow: "0 0 10px var(--scope-a)" }}
      />
    </div>
  );
}

/* ---------- loading ---------- */

function LoadingTransmission({ scope }: { scope: Scope }) {
  const [phase, setPhase] = useState(0);
  const phases = SCOPE_META[scope].phases;

  useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % phases.length),
      2000
    );
    return () => window.clearInterval(id);
  }, [phases.length]);

  return (
    <div className="mt-8" aria-live="polite" aria-busy="true">
      <OrbitSpinner />
      <div className="mt-4 flex items-center justify-center gap-2.5">
        <span
          className="animate-dot-pulse inline-block size-1.5 rounded-full"
          style={{ background: "var(--scope-a)" }}
        />
        <span className="mono-label text-[9px] text-muted-foreground">
          {phases[phase]}
        </span>
      </div>
      <div className="scope-frame-card relative mx-auto mt-6 max-w-[680px] space-y-3 overflow-hidden rounded-2xl glass p-6 sm:p-7">
        {[92, 78, 85, 60].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{
              width: `${w}%`,
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a) 18%, transparent), transparent)",
              backgroundSize: "220px 100%",
              animation: `shimmer-line 2.1s linear infinite`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- rich body ---------- */

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.14, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

function TransmissionBody({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.kind === "opening") {
          return (
            <motion.p
              key={i}
              custom={i}
              variants={staggerItem}
              initial="hidden"
              animate="show"
              className="scope-gradient-text scope-glow-text text-[19px] font-semibold leading-[1.5] tracking-[-0.005em] sm:text-[21px]"
            >
              {b.text}
            </motion.p>
          );
        }
        if (b.kind === "signature") {
          return (
            <motion.div
              key={i}
              custom={i}
              variants={staggerItem}
              initial="hidden"
              animate="show"
              className="pt-4"
            >
              <div
                className="mb-3 h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 40%, transparent), transparent)",
                }}
              />
              <p
                className="mono-label text-[9.5px] leading-relaxed"
                style={{ color: "color-mix(in srgb, var(--scope-b) 85%, white)" }}
              >
                {b.text}
              </p>
            </motion.div>
          );
        }
        if (b.kind === "list") {
          return (
            <motion.ul
              key={i}
              custom={i}
              variants={staggerItem}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {b.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span
                    className="mt-[9px] inline-block size-1.5 shrink-0 rotate-45"
                    style={{ background: "var(--scope-a)" }}
                    aria-hidden="true"
                  />
                  <span className="text-[13.5px] leading-[1.8] text-foreground/85 sm:text-[14px]">
                    {item}
                  </span>
                </li>
              ))}
            </motion.ul>
          );
        }
        return (
          <motion.p
            key={i}
            custom={i}
            variants={staggerItem}
            initial="hidden"
            animate="show"
            className="text-[14px] leading-[1.85] text-foreground/88 sm:text-[14.5px]"
          >
            {b.text}
          </motion.p>
        );
      })}
    </div>
  );
}

/* ---------- seal ---------- */

function Seal() {
  return (
    <div
      className="pointer-events-none absolute bottom-5 right-5 hidden size-16 sm:block"
      aria-hidden="true"
    >
      <div
        className="scope-halo-rev absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--scope-b) 40%, transparent)" }}
      />
      <div
        className="absolute inset-2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 35%, transparent)" }}
      />
      <div className="flex h-full w-full items-center justify-center">
        <Sparkles
          className="size-4"
          style={{ color: "color-mix(in srgb, var(--scope-a) 80%, white)" }}
        />
      </div>
    </div>
  );
}

/* ---------- main view ---------- */

export function TransmissionView() {
  const status = useMirror((s) => s.status);
  const transmission = useMirror((s) => s.transmission);
  const activeQuery = useMirror((s) => s.activeQuery);
  const error = useMirror((s) => s.error);
  const activeMode = useMirror((s) => s.activeMode);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const [copied, setCopied] = useState(false);

  const scope: Scope = activeMode;
  const meta = SCOPE_META[scope];

  const classification = transmission
    ? (CLASSIFICATION_META[transmission.classification] ?? {
        label: "Archive reflection",
        tone: "a" as const,
        note: "Held gently by the archive — verify inwardly what resonates.",
      })
    : null;

  const stamp = useMemo(() => {
    if (!transmission) return null;
    const d = new Date(transmission.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  }, [transmission]);

  const txId = useMemo(() => {
    if (!transmission) return "";
    let h = 0;
    for (const ch of transmission.createdAt + transmission.query) {
      h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    }
    return `TX-${h.toString(16).toUpperCase().padStart(6, "0").slice(0, 6)}`;
  }, [transmission]);

  const handleCopy = async () => {
    if (!transmission) return;
    try {
      await navigator.clipboard.writeText(transmission.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — quiet fail */
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Mirror transmission — ${meta.label} scope`}
      className={cn(
        "scope-" + scope,
        "mx-auto w-full max-w-[760px] px-1 pb-6 pt-8 sm:pt-10"
      )}
    >
      {/* ---------- header ---------- */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <div
            className="hidden h-px w-16 sm:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a) 55%, transparent))",
            }}
            aria-hidden="true"
          />
          <Medallion scope={scope} />
          <div
            className="hidden h-px w-16 sm:block"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 55%, transparent), transparent)",
            }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span
            className="mono-label text-[10px]"
            style={{ color: "var(--scope-a)" }}
          >
            Mirror Transmission
          </span>
          <span className="mono-label rounded-full border px-2 py-0.5 text-[8px] text-muted-foreground" style={{ borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)" }}>
            {meta.label} scope
          </span>
        </div>
        <p className="mono-label mt-1.5 text-[8.5px] text-muted-foreground/70">
          {meta.tagline}
        </p>

        {activeQuery && (
          <div className="relative mx-auto mt-5 max-w-[620px]">
            <span
              className="pointer-events-none absolute -left-1 -top-5 select-none font-serif text-[44px] leading-none opacity-40"
              style={{ color: "var(--scope-a)" }}
              aria-hidden="true"
            >
              “
            </span>
            <p className="px-6 text-[13.5px] italic leading-relaxed text-muted-foreground">
              {activeQuery}
            </p>
          </div>
        )}
      </div>

      {/* ---------- body ---------- */}
      {status === "loading" && <LoadingTransmission scope={scope} />}

      {status === "error" && (
        <div className="scope-frame-card mt-8 rounded-2xl glass p-6 text-center">
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
          <div className="scope-frame-card relative mt-7 overflow-hidden rounded-2xl">
            {/* masked scope backdrop */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${sectionImage(meta.imageKey)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                maskImage:
                  "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 78%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 78%)",
                mixBlendMode: "screen",
              }}
            />
            {/* corner ornaments */}
            <span className="scope-corner scope-corner-tl" aria-hidden="true" />
            <span className="scope-corner scope-corner-tr" aria-hidden="true" />
            <span className="scope-corner scope-corner-bl" aria-hidden="true" />
            <span className="scope-corner scope-corner-br" aria-hidden="true" />
            {/* top gradient rule */}
            <div
              className="animate-line-breathe h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
              }}
              aria-hidden="true"
            />

            <div className="relative px-6 py-7 sm:px-10 sm:py-9">
              <TransmissionBody text={transmission.text} />
            </div>
            <Seal />
          </div>

          {/* meta row */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {stamp && (
              <span className="mono-label text-[8px] text-muted-foreground/60">
                {stamp}
              </span>
            )}
            {txId && (
              <span className="mono-label text-[8px] text-muted-foreground/60">
                {txId}
              </span>
            )}
            <span
              className="mono-label text-[8px]"
              style={{ color: "color-mix(in srgb, var(--scope-a) 75%, white)" }}
            >
              {meta.ornament} frame · {meta.label}
            </span>
          </div>

          {/* classification + honesty context */}
          {classification && (
            <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
              <span
                className="mono-label inline-flex items-center rounded-full border px-2.5 py-1 text-[8.5px]"
                style={{
                  borderColor: `color-mix(in srgb, ${TONE_VAR[classification.tone]} 40%, transparent)`,
                  color: `color-mix(in srgb, ${TONE_VAR[classification.tone]} 85%, white)`,
                  background: `color-mix(in srgb, ${TONE_VAR[classification.tone]} 8%, transparent)`,
                }}
              >
                {classification.label}
              </span>
              <p className="max-w-[540px] text-[10.5px] leading-relaxed text-muted-foreground/80">
                {classification.note}
              </p>
            </div>
          )}

          <p className="mono-label mt-5 text-center text-[8.5px] text-muted-foreground/60">
            Free will honored always · Transmitted with love ❤️
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
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
            <button
              type="button"
              onClick={handleCopy}
              className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy transmission"}
            </button>
          </div>
        </>
      )}
    </motion.section>
  );
}
