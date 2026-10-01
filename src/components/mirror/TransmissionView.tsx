"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  FileText,
  Leaf,
  RotateCcw,
} from "lucide-react";
import { useMirror, type ChatMessage } from "@/lib/mirror-store";
import { SCOPE_META, sectionImage } from "@/lib/entity-utils";
import { auraFor, INK_AURA, type Aura } from "@/lib/aura";
import { useTheme } from "next-themes";
import { useT } from "@/lib/i18n";
import type { Scope } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";
import {
  PreparedPromptFallback,
  VisualizationCard,
  VisualizationPending,
} from "./VisualizationCard";

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

/* The mirror's waiting phrases — warm, positive, unhurried. */
const WAITING_PHRASES = [
  "Something beautiful is forming…",
  "The mirror is listening with love…",
  "Good news is already on its way…",
  "Every question deserves a gentle answer…",
  "The field is arranging itself for you…",
  "Breathe — your answer is arriving…",
];

/* Each transmission draws its own light — in the dark. On the classic
   white page every card wears the same clean neutral ink. */
function useAura(seed: string): Aura {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? auraFor(seed) : INK_AURA;
}

/* ---------- loading ---------- */

function LoadingTransmission({ query }: { query: string }) {
  const [phase, setPhase] = useState(0);
  const t = useT();
  /* The forming card already glows with the light it will carry. */
  const aura = useAura(`forming-${query}-${phase}`);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % WAITING_PHRASES.length),
      2400
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="mt-8"
      aria-live="polite"
      aria-busy="true"
      style={{ "--scope-a": aura.a, "--scope-b": aura.b } as CSSProperties}
    >
      {query && (
        <div className="relative mx-auto mb-6 max-w-[620px]">
          <span
            className="pointer-events-none absolute -left-1 -top-5 select-none font-serif text-[44px] leading-none opacity-40"
            style={{ color: "var(--scope-a)" }}
            aria-hidden="true"
          >
            “
          </span>
          <p className="px-6 text-[15.5px] italic leading-relaxed text-muted-foreground">
            {query}
          </p>
        </div>
      )}
      {/* no circle, no spinner — the mirror itself breathes quietly
          while positive phrases keep the seeker company */}
      <div className="flex justify-center">
        <img
          src="/images/ai/cosmic-mark.png"
          alt=""
          aria-hidden="true"
          className="animate-breathe size-14 rounded-full object-cover"
        />
      </div>
      <div
        className="mt-4 flex h-6 items-center justify-center px-4 text-center"
        aria-hidden="true"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-[14.5px] italic leading-relaxed text-muted-foreground"
          >
            {t(WAITING_PHRASES[phase] ?? WAITING_PHRASES[0])}
          </motion.p>
        </AnimatePresence>
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
    transition: { delay: 0.12 + i * 0.14, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
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
                className="mono-label text-[12px] leading-relaxed"
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
                  <span className="text-[15.5px] leading-[1.8] text-foreground/85 sm:text-[16px]">
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
            className="text-[16px] leading-[1.85] text-foreground/88 sm:text-[16.5px]"
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
        <span
          className="block size-2 rotate-45"
          style={{
            background: "color-mix(in srgb, var(--scope-a) 75%, white)",
            boxShadow: "0 0 10px color-mix(in srgb, var(--scope-a) 60%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

/* ---------- the vision itself — one exchange may carry an image ------- */

function ExchangeVisual({ message }: { message: ChatMessage }) {
  const t = useT();
  const askScopeVisual = useMirror((s) => s.askScopeVisual);
  const activeMode = useMirror((s) => s.activeMode);

  if (message.visual === "pending") {
    return (
      <VisualizationPending
        accent="var(--scope-a)"
        testIdPrefix="scope-visual"
        repaint
      />
    );
  }
  if (message.visual === "error") {
    return (
      <div
        className="glass rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_65%,transparent)] px-4 py-3.5"
        data-testid="scope-visual-error"
      >
        <p className="text-[14px] italic leading-relaxed text-foreground/80">
          {t(
            "The atelier is quiet — the vision could not be composed. Rest a breath, then ask again."
          )}
        </p>
        {message.visualRequest && (
          <button
            type="button"
            onClick={() =>
              void askScopeVisual(activeMode, message.visualRequest ?? "", null)
            }
            data-testid="scope-visual-retry"
            className="focus-glow mt-2.5 flex h-9 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_35%,transparent)] px-4 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("Be still and receive")}
          </button>
        )}
      </div>
    );
  }
  if (!message.artifact) return null;
  const artifact = message.artifact;
  if (!artifact.imageUrl && artifact.slides.length === 0) {
    return (
      <PreparedPromptFallback
        artifact={artifact}
        accent="var(--scope-a)"
        testIdPrefix="scope-visual"
        onPaint={() =>
          void askScopeVisual(
            activeMode,
            message.visualRequest ?? artifact.subject,
            {
              id: message.id,
              request: message.visualRequest ?? artifact.subject,
              prompt: artifact.prompt,
              subject: artifact.subject,
              mode: artifact.mode,
            }
          )
        }
      />
    );
  }
  return (
    <VisualizationCard
      artifact={artifact}
      accent="var(--scope-a)"
      testIdPrefix="scope-visual"
      onRegenerate={() =>
        void askScopeVisual(activeMode, message.visualRequest ?? artifact.subject, {
          id: message.id,
          request: message.visualRequest ?? artifact.subject,
          prompt: artifact.prompt,
          subject: artifact.subject,
          mode: artifact.mode,
        })
      }
    />
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
  /* Each card draws its own light — quietly, never spoken of. */
  const aura = useAura(message.id);

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
  const hasVisual = Boolean(message.artifact || message.visual);

  return (
    <motion.article
      initial={{ opacity: animate ? 0 : 1, y: animate ? 12 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] as const }}
      aria-label={t("Transmission {n}", { n: index + 1 })}
      style={{ "--scope-a": aura.a, "--scope-b": aura.b } as CSSProperties}
      className="pt-7 first:pt-0"
    >
      {/* index ribbon */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="mono-label rounded-full border px-2 py-0.5 text-[11px]"
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
        <p className="px-6 text-[15.5px] italic leading-relaxed text-muted-foreground">
          {message.query}
        </p>
        {message.attachments &&
          (message.attachments.images > 0 ||
            message.attachments.docNames.length > 0) && (
            <div
              className="mt-2 flex flex-wrap justify-end gap-1 px-6"
              data-testid="exchange-attachments"
            >
              {message.attachments.images > 0 && (
                <span className="mono-label flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] text-muted-foreground">
                  <FileText className="size-2.5" aria-hidden="true" />
                  {t("an image")}
                </span>
              )}
              {message.attachments.docNames.map((name) => (
                <span
                  key={name}
                  className="mono-label flex max-w-[200px] items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] text-muted-foreground"
                >
                  <FileText className="size-2.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{name}</span>
                </span>
              ))}
            </div>
          )}
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
          {/* listen + copy — the only actions, one quiet row (words only) */}
          {!hasVisual && (
            <div className="mb-4 flex items-center justify-end gap-2">
              <ListenButton text={message.text} cacheKey={message.id} />
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? t("copied") : t("copy")}
                title={copied ? t("copied") : t("copy")}
                className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                {copied ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
          {hasVisual ? (
            <ExchangeVisual message={message} />
          ) : (
            <TransmissionBody text={message.text} />
          )}
        </div>
        <Seal />
      </div>
    </motion.article>
  );
}

/* ---------- the healing apothecary — one quiet stand at the thread's
   end, offered only in the Healing channel once a transmission has
   been revealed ---------- */

function ApothecaryStand({ concern }: { concern: string }) {
  const askRemedy = useMirror((s) => s.askRemedy);
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
      className="mt-9 flex flex-col items-center pb-1 text-center"
      data-testid="apothecary-stand"
    >
      <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">
        {t("The healing apothecary")}
      </p>
      <button
        type="button"
        onClick={() => void askRemedy(concern)}
        aria-label={t("Prepare a remedy")}
        data-testid="prepare-remedy"
        className="focus-glow mt-3 flex h-10 items-center gap-2.5 rounded-full border px-5 text-[13.5px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px hover:glow-sm"
        style={{
          borderColor: "color-mix(in srgb, #b05e76 42%, transparent)",
          background:
            "linear-gradient(120deg, color-mix(in srgb, #b05e76 15%, transparent), color-mix(in srgb, #2f8a6e 13%, transparent))",
        }}
      >
        <Leaf
          className="size-4"
          style={{ color: "color-mix(in srgb, #b05e76 55%, white)" }}
          aria-hidden="true"
        />
        {t("Prepare a remedy")}
      </button>
      <p className="mt-2.5 max-w-[320px] text-[12.5px] italic leading-relaxed text-muted-foreground/70">
        {t("Prepared from what has been spoken here")}
      </p>
    </motion.div>
  );
}

/* ---------- main view: one independent channel per scope ---------- */

export function TransmissionView() {
  const activeMode = useMirror((s) => s.activeMode);
  const session = useMirror((s) => s.sessions[s.activeMode]);
  const remedyStatus = useMirror((s) => s.remedyStatus);
  const t = useT();

  const scope: Scope = activeMode;
  const meta = SCOPE_META[scope];

  /* The apothecary serves the concern most recently spoken — the last
     exchange's question, held quietly until the thread rests. */
  const lastSpoken = useMemo(
    () =>
      scope === "healing"
        ? (session.messages.at(-1)?.query ?? null)
        : null,
    [scope, session.messages]
  );

  /* The thread begins where it begins: opening, reloading or switching
     into a channel keeps the thread at its BEGINNING. New generations
     load from the TOP — the newest exchange settles its first line at
     the top of the view and the visitor reads downward from there.
     One law above all: the moment a suggestion is struck — even after
     the thread already carries conversations — the frame must meet
     THAT exchange, while it forms and again when it lands. */
  const topRef = useRef<HTMLDivElement | null>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const messagesLength = session.messages.length;
  const status = session.status;
  const baseline = useRef({
    mode: activeMode,
    len: messagesLength,
    status,
    fresh: true,
  });

  useEffect(() => {
    const b = baseline.current;
    const sameMode = b.mode === activeMode;
    const grew = sameMode && messagesLength !== b.len;
    const startedLoading =
      sameMode && !grew && status === "loading" && b.status !== "loading";
    const becameError =
      sameMode &&
      !grew &&
      !startedLoading &&
      status === "error" &&
      b.status !== "error";

    baseline.current = {
      mode: activeMode,
      len: messagesLength,
      status,
      fresh: false,
    };

    if (b.fresh || !sameMode) {
      /* First sight of the channel — arriving from the observatory the
         transmission may ALREADY be forming (a suggestion was struck
         and the channel mounted mid-reception): meet it where it
         forms, never wait above the older thread. A channel entering
         with a failed transmission meets the error; otherwise it
         rests at its beginning. */
      if (status === "loading") {
        loadingRef.current?.scrollIntoView({ block: "start" });
      } else if (status === "error") {
        errorRef.current?.scrollIntoView({ block: "start" });
      } else if (!sameMode) {
        topRef.current?.scrollIntoView({ block: "start" });
      }
      return;
    }
    if (grew) {
      latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      /* the answer must own the frame — re-affirm once the entrance
         has settled, in case the first glide was preempted */
      const id = window.setTimeout(() => {
        latestRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 450);
      return () => window.clearTimeout(id);
    }
    if (startedLoading) {
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (becameError) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeMode, messagesLength, status]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
      aria-label={`${meta.label} channel — mirror transmissions`}
      className={cn(
        "scope-" + scope,
        "mx-auto w-full max-w-[760px] px-1 pb-6 pt-6 sm:pt-8"
      )}
    >
      {/* beginning anchor — opening a channel keeps the thread here */}
      <div ref={topRef} aria-hidden="true" className="h-px" />

      {/* ---------- thread ---------- */}
      {session.messages.length === 0 &&
        session.status === "idle" &&
        !session.error && (
          <div className="scope-frame-card relative mt-2 overflow-hidden rounded-2xl glass px-6 py-9 text-center">
            <span className="scope-corner scope-corner-tl" aria-hidden="true" />
            <span className="scope-corner scope-corner-tr" aria-hidden="true" />
            <span className="scope-corner scope-corner-bl" aria-hidden="true" />
            <span className="scope-corner scope-corner-br" aria-hidden="true" />
            <p className="text-[16.5px] font-medium text-foreground/85">
              {t("This channel is quiet.")}
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-[14.5px] leading-relaxed text-muted-foreground">
              {t(
                "Every scope keeps its own private channel — ask from the composer below to open the first transmission."
              )}
            </p>
          </div>
        )}

      {session.messages.map((m, i) => (
        <div
          key={m.id}
          ref={
            i === session.messages.length - 1
              ? (node) => {
                  latestRef.current = node;
                }
              : undefined
          }
        >
          <Exchange
            message={m}
            index={i}
            scope={scope}
            animate={i === session.messages.length - 1 && session.status !== "loading"}
          />
        </div>
      ))}

      {scope === "healing" &&
        session.status !== "loading" &&
        remedyStatus !== "crafting" &&
        lastSpoken && <ApothecaryStand concern={lastSpoken} />}

      {session.status === "loading" &&
        session.messages.at(-1)?.visual !== "pending" && (
        <div
          ref={(node) => {
            loadingRef.current = node;
          }}
        >
          <LoadingTransmission query={session.activeQuery} />
        </div>
      )}

      {session.status === "error" && (
        <div
          ref={errorRef}
          className="scope-frame-card mt-8 rounded-2xl glass p-6 text-center"
        >
          <p className="text-[16px] leading-relaxed text-foreground/85">
            {t(
              "The field received your question but could not complete the transmission."
            )}
          </p>
          <p className="mt-2 text-[14.5px] italic text-muted-foreground">
            {session.error}
          </p>
        </div>
      )}

      {/* new generations settle at the TOP of this anchor — the reader
          begins at their first line and scrolls down for the rest */}
      <div aria-hidden="true" className="h-px" />
    </motion.section>
  );
}
