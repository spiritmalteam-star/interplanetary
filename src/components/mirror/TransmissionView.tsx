"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  Radio,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror, type ChatMessage } from "@/lib/mirror-store";
import { SCOPE_META, sectionImage } from "@/lib/entity-utils";
import { useT } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n/core";
import type { Scope } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";

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

const CHANNEL_PROMISE: Record<Scope, string> = {
  interplanetary:
    "Open contact channel with the star families. History here stays in this channel.",
  science:
    "Evidence-first channel. History here stays in this channel.",
  quantum:
    "Observer-included channel. History here stays in this channel.",
  healing:
    "Gentle-frequencies channel. History here stays in this channel.",
  manifesting:
    "Alchemy channel. History here stays in this channel.",
};

const LOCALES: Record<LanguageCode, string> = {
  en: "en-US",
  sq: "sq-AL",
  it: "it-IT",
  el: "el-GR",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  tr: "tr-TR",
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
    if (isLast && (p.startsWith("—") || p.startsWith("—"))) {
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

function Medallion({ scope }: { scope: Scope }) {
  const meta = SCOPE_META[scope];
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative size-16 sm:size-[72px]" aria-hidden="true">
      {/* rotating dashed ring */}
      <div
        className="scope-halo absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)" }}
      />
      {/* static ring */}
      <div
        className="absolute inset-[5px] rounded-full"
        style={{
          border: "1px solid color-mix(in srgb, var(--scope-b) 38%, transparent)",
          boxShadow:
            "0 0 24px -8px color-mix(in srgb, var(--scope-a) 40%, transparent)",
        }}
      />
      {/* image or glyph */}
      <div
        className="absolute inset-[7px] overflow-hidden rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--scope-a) 22%, transparent), transparent 72%)",
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
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 50%, transparent)" }}
      />
      <div
        className="scope-halo-rev absolute inset-3 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--scope-b) 38%, transparent)" }}
      />
      <div
        className="animate-charge-pulse absolute inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--scope-a) 45%, transparent), transparent 72%)",
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

function LoadingTransmission({ scope, query }: { scope: Scope; query: string }) {
  const [phase, setPhase] = useState(0);
  const phases = SCOPE_META[scope].phases;
  const t = useT();

  useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % phases.length),
      2000
    );
    return () => window.clearInterval(id);
  }, [phases.length]);

  return (
    <div className="mt-8" aria-live="polite" aria-busy="true">
      {query && (
        <div className="relative mx-auto mb-6 max-w-[620px]">
          <span
            className="pointer-events-none absolute -left-1 -top-5 select-none font-serif text-[44px] leading-none opacity-40"
            style={{ color: "var(--scope-a)" }}
            aria-hidden="true"
          >
            “
          </span>
          <p className="px-6 text-[14px] italic leading-relaxed text-muted-foreground">
            {query}
          </p>
        </div>
      )}
      <OrbitSpinner />
      <div className="mt-4 flex items-center justify-center gap-2.5">
        <span
          className="animate-dot-pulse inline-block size-1.5 rounded-full"
          style={{ background: "var(--scope-a)" }}
        />
        <span className="mono-label text-[9.5px] text-muted-foreground">
          {t(phases[phase] ?? phases[0] ?? "")}
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
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a) 14%, transparent), transparent)",
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

const stillItem = {
  hidden: { opacity: 1 },
  show: () => ({ opacity: 1 }),
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
              className="scope-gradient-text scope-glow-text text-[20px] font-semibold leading-[1.55] tracking-[-0.005em] sm:text-[22px]"
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
                    "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 32%, transparent), transparent)",
                }}
              />
              <p
                className="mono-label text-[10px] leading-relaxed"
                style={{ color: "color-mix(in srgb, var(--scope-b) 80%, white)" }}
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
                    className="mt-[10px] inline-block size-1.5 shrink-0 rotate-45"
                    style={{ background: "var(--scope-a)" }}
                    aria-hidden="true"
                  />
                  <span className="text-[14px] leading-[1.8] text-foreground/85 sm:text-[14.5px]">
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
            className="text-[14.5px] leading-[1.85] text-foreground/88 sm:text-[15px]"
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
        style={{ borderColor: "color-mix(in srgb, var(--scope-b) 32%, transparent)" }}
      />
      <div
        className="absolute inset-2 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 28%, transparent)" }}
      />
      <div className="flex h-full w-full items-center justify-center">
        <Sparkles
          className="size-4"
          style={{ color: "color-mix(in srgb, var(--scope-a) 75%, white)" }}
        />
      </div>
    </div>
  );
}

/* ---------- one completed exchange ---------- */

function Exchange({
  message,
  index,
  animate,
  scope,
}: {
  message: ChatMessage;
  index: number;
  animate: boolean;
  scope: Scope;
}) {
  const scopeMeta = SCOPE_META[scope];
  const [copied, setCopied] = useState(false);
  const t = useT();
  const language = useMirror((s) => s.language);

  const classification =
    CLASSIFICATION_META[message.classification] ?? {
      label: "Archive reflection",
      tone: "a" as const,
      note: "Held gently by the archive — verify inwardly what resonates.",
    };

  const stamp = useMemo(() => {
    const d = new Date(message.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(LOCALES[language] ?? "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  }, [message.createdAt, language]);

  const txId = useMemo(() => {
    let h = 0;
    for (const ch of message.createdAt + message.query) {
      h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    }
    return `TX-${h.toString(16).toUpperCase().padStart(6, "0").slice(0, 6)}`;
  }, [message]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — quiet fail */
    }
  };

  const item = animate ? staggerItem : stillItem;

  return (
    <motion.article
      initial={{ opacity: animate ? 0 : 1, y: animate ? 12 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t("Transmission {n}", { n: index + 1 })}
      className="pt-8 first:pt-0"
    >
      {/* index ribbon */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="mono-label rounded-full border px-2 py-0.5 text-[9px]"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)",
            color: "color-mix(in srgb, var(--scope-a) 85%, white)",
          }}
        >
          {t("{scope} · exchange {n}", {
            scope: t(scopeMeta.label),
            n: String(index + 1).padStart(2, "0"),
          })}
        </span>
        <span
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 24%, transparent), transparent)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* query echo */}
      <div className="relative mx-auto max-w-[620px]">
        <span
          className="pointer-events-none absolute -left-1 -top-5 select-none font-serif text-[44px] leading-none opacity-40"
          style={{ color: "var(--scope-a)" }}
          aria-hidden="true"
        >
          “
        </span>
        <p className="px-6 text-[14px] italic leading-relaxed text-muted-foreground">
          {message.query}
        </p>
      </div>

      {/* themed frame */}
      <div className="scope-frame-card relative mt-6 overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${sectionImage(scopeMeta.imageKey)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage:
              "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 78%)",
            mixBlendMode: "screen",
          }}
        />
        <span className="scope-corner scope-corner-tl" aria-hidden="true" />
        <span className="scope-corner scope-corner-tr" aria-hidden="true" />
        <span className="scope-corner scope-corner-bl" aria-hidden="true" />
        <span className="scope-corner scope-corner-br" aria-hidden="true" />
        <div
          className="animate-line-breathe h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
          }}
          aria-hidden="true"
        />

        <div className="relative px-6 py-6 sm:px-10 sm:py-8">
          {/* listen — at the top of every generation */}
          <div className="mb-4 flex items-center justify-end gap-2">
            <ListenButton text={message.text} cacheKey={message.id} />
          </div>
          <TransmissionBody text={message.text} />
        </div>
        <Seal />
      </div>

      {/* meta row */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {stamp && (
          <span className="mono-label text-[9px] text-muted-foreground/60">
            {stamp}
          </span>
        )}
        <span className="mono-label text-[9px] text-muted-foreground/60">
          {txId}
        </span>
        <span
          className="mono-label text-[9px]"
          style={{ color: "color-mix(in srgb, var(--scope-a) 70%, white)" }}
        >
          {t("{ornament} frame · {scope}", {
            ornament: t(scopeMeta.ornament),
            scope: t(scopeMeta.label),
          })}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="focus-glow mono-label inline-flex items-center gap-1 text-[9px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3" aria-hidden="true" />
          ) : (
            <Copy className="size-3" aria-hidden="true" />
          )}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>

      {/* classification */}
      <div className="mt-3 flex flex-col items-center gap-1.5 text-center">
        <span
          className="mono-label inline-flex items-center rounded-full border px-2.5 py-1 text-[9px]"
          style={{
            borderColor: `color-mix(in srgb, ${TONE_VAR[classification.tone]} 35%, transparent)`,
            color: `color-mix(in srgb, ${TONE_VAR[classification.tone]} 80%, white)`,
            background: `color-mix(in srgb, ${TONE_VAR[classification.tone]} 7%, transparent)`,
          }}
        >
          {t(classification.label)}
        </span>
        <p className="max-w-[540px] text-[11.5px] leading-relaxed text-muted-foreground/80">
          {t(classification.note)}
        </p>
      </div>
    </motion.article>
  );
}

/* ---------- main view: one independent channel per scope ---------- */

export function TransmissionView() {
  const activeMode = useMirror((s) => s.activeMode);
  const session = useMirror((s) => s.sessions[s.activeMode]);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const clearChannel = useMirror((s) => s.clearChannel);
  const t = useT();

  const scope: Scope = activeMode;
  const meta = SCOPE_META[scope];

  /* Auto-focus: the view follows every new generation so the visitor
     never has to scroll down manually. */
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesLength = session.messages.length;
  const status = session.status;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesLength, status]);

  const handleClear = () => {
    clearChannel();
    toast.success(
      t("{scope} channel cleared — this scope is now quiet.", {
        scope: t(meta.label),
      })
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${meta.label} channel — mirror transmissions`}
      className={cn(
        "scope-" + scope,
        "mx-auto w-full max-w-[760px] px-1 pb-6 pt-8 sm:pt-10"
      )}
    >
      {/* ---------- channel header ---------- */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <div
            className="hidden h-px w-16 sm:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a) 45%, transparent))",
            }}
            aria-hidden="true"
          />
          <Medallion scope={scope} />
          <div
            className="hidden h-px w-16 sm:block"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 45%, transparent), transparent)",
            }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className="mono-label text-[10.5px]"
            style={{ color: "var(--scope-a)" }}
          >
            {t("Mirror Transmission")}
          </span>
          <span
            className="mono-label rounded-full border px-2 py-0.5 text-[9px] text-muted-foreground"
            style={{ borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)" }}
          >
            {t("{scope} scope", { scope: t(meta.label) })}
          </span>
          <span className="mono-label inline-flex items-center gap-1 rounded-full border hairline px-2 py-0.5 text-[9px] text-muted-foreground">
            <Radio className="size-2.5" aria-hidden="true" />
            {t("independent channel")}
          </span>
        </div>
        <p className="mono-label mt-1.5 text-[9.5px] text-muted-foreground/70">
          {t(meta.tagline)}
        </p>
        <p className="mx-auto mt-2 max-w-[480px] text-[12px] leading-relaxed text-muted-foreground/70">
          {t(CHANNEL_PROMISE[scope])}
        </p>
      </div>

      {/* ---------- thread ---------- */}
      {session.messages.length === 0 &&
        session.status === "idle" &&
        !session.error && (
          <div className="scope-frame-card relative mt-8 overflow-hidden rounded-2xl glass px-6 py-10 text-center">
            <span className="scope-corner scope-corner-tl" aria-hidden="true" />
            <span className="scope-corner scope-corner-tr" aria-hidden="true" />
            <span className="scope-corner scope-corner-bl" aria-hidden="true" />
            <span className="scope-corner scope-corner-br" aria-hidden="true" />
            <p
              className="mono-label text-[9.5px]"
              style={{ color: "var(--scope-a)" }}
            >
              {t("{scope} channel", { scope: t(meta.label) })}
            </p>
            <p className="mt-3 text-[15px] font-medium text-foreground/85">
              {t("This channel is quiet.")}
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-[12.5px] leading-relaxed text-muted-foreground">
              {t(
                "Every scope keeps its own private channel with its own history — nothing carries over from other scopes. Ask from the composer below to open the first transmission of this channel."
              )}
            </p>
          </div>
        )}

      {session.messages.map((m, i) => (
        <Exchange
          key={m.id}
          message={m}
          index={i}
          scope={scope}
          animate={i === session.messages.length - 1 && session.status !== "loading"}
        />
      ))}

      {session.status === "loading" && (
        <LoadingTransmission scope={scope} query={session.activeQuery} />
      )}

      {session.status === "error" && (
        <div className="scope-frame-card mt-8 rounded-2xl glass p-6 text-center">
          <p className="text-[14.5px] leading-relaxed text-foreground/85">
            {t(
              "The field received your question but could not complete the transmission."
            )}
          </p>
          <p className="mt-2 text-[13px] italic text-muted-foreground">
            {session.error}
          </p>
        </div>
      )}

      {/* ---------- footer actions ---------- */}
      {session.messages.length > 0 && (
        <>
          <p className="mono-label mt-8 text-center text-[9px] text-muted-foreground/60">
            {session.messages.length}{" "}
            {session.messages.length === 1
              ? t("exchange held in this channel")
              : t("exchanges held in this channel")}{" "}
            · {t("Free will honored always · Transmitted with love ❤️")}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={returnToObservatory}
              className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12.5px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <ArrowLeft
                className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              {t("Return to the Observatory")}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12.5px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <Eraser
                className="size-3.5 transition-transform duration-300 group-hover:rotate-12"
                aria-hidden="true"
              />
              {t("Clear the {scope} channel", { scope: t(meta.label) })}
            </button>
          </div>
        </>
      )}

      {/* auto-scroll anchor — the view follows each new generation */}
      <div ref={bottomRef} aria-hidden="true" className="h-px" />
    </motion.section>
  );
}
