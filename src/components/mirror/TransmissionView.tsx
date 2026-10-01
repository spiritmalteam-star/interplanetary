"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Leaf,
  Merge,
  Plus,
  RotateCcw,
  RefreshCw,
  X,
} from "lucide-react";
import { useMirror, type ChatMessage } from "@/lib/mirror-store";
import { SCOPE_META, sectionImage } from "@/lib/entity-utils";
import { auraFor } from "@/lib/aura";
import { useT } from "@/lib/i18n";
import { scopeSuggestionPools } from "@/lib/data/suggestions";
import {
  CHAMBER_ENTITIES,
  DEPTHS,
  PERSONAS,
  PERSONA_LABELS,
} from "@/lib/data/entities";
import { mintDiscovery } from "@/lib/discovery";
import type { Scope } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";
import { QueryComposer } from "./QueryComposer";
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

function OrbitSpinner() {
  return (
    <div className="relative mx-auto size-20" aria-hidden="true">
      <div
        className="scope-halo absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--ac) 50%, transparent)" }}
      />
      <div
        className="scope-halo-rev absolute inset-3 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--scope-b) 38%, transparent)" }}
      />
      <div
        className="animate-charge-pulse absolute inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--ac) 45%, transparent), transparent 72%)",
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "var(--ac)", boxShadow: "0 0 10px var(--ac)" }}
      />
    </div>
  );
}

/* ---------- loading ---------- */

function LoadingTransmission({ scope, query }: { scope: Scope; query: string }) {
  const [phase, setPhase] = useState(0);
  const phases = SCOPE_META[scope].phases;
  const t = useT();
  /* The forming card already glows with the light it will carry. */
  const aura = auraFor(`forming-${query}-${phase}`);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % phases.length),
      2000
    );
    return () => window.clearInterval(id);
  }, [phases.length]);

  return (
    <div
      className="mt-8"
      aria-live="polite"
      aria-busy="true"
      style={{ "--ac": aura.a, "--scope-b": aura.b } as CSSProperties}
    >
      {query && (
        <div className="relative mx-auto mb-6 max-w-[620px]">
          <span
            className="voice pointer-events-none absolute -left-1 -top-5 select-none text-[44px] leading-none opacity-40"
            style={{ color: "var(--ac)" }}
            aria-hidden="true"
          >
            “
          </span>
          <p className="px-6 text-[15.5px] italic leading-relaxed text-muted-foreground">
            {query}
          </p>
        </div>
      )}
      <OrbitSpinner />
      <div className="mt-4 flex items-center justify-center gap-2.5">
        <span
          className="animate-dot-pulse inline-block size-1.5 rounded-full"
          style={{ background: "var(--ac)" }}
        />
        <span className="mono-label text-[11.5px] text-muted-foreground">
          {t(phases[phase] ?? phases[0] ?? "")}
        </span>
      </div>
      <div className="panel-solid relative mx-auto mt-6 max-w-[680px] space-y-3 overflow-hidden p-6 sm:p-7">
        {[92, 78, 85, 60].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{
              width: `${w}%`,
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--ac) 14%, transparent), transparent)",
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
    transition: {
      delay: 0.12 + i * 0.14,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
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
              className="voice scope-gradient-text scope-glow-text text-[21px] font-semibold leading-[1.55] tracking-[-0.005em] sm:text-[23px]"
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
                    "linear-gradient(90deg, color-mix(in srgb, var(--ac) 32%, transparent), transparent)",
                }}
              />
              <p
                className="voice-italic text-[13px] leading-relaxed"
                style={{ color: "color-mix(in srgb, var(--ac) 80%, var(--foreground))" }}
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
                    style={{ background: "var(--ac)" }}
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
            className="text-[15.5px] leading-[1.85] text-foreground/88 sm:text-[16px]"
          >
            {b.text}
          </motion.p>
        );
      })}
    </div>
  );
}

/* ---------- the Novel Discovery seal — minted by the app ---------- */

function DiscoverySealBlock({ message, scope }: { message: ChatMessage; scope: Scope }) {
  const seal = useMemo(
    () => mintDiscovery(scope, message.id, message.discoveryNo ?? 1),
    [scope, message.id, message.discoveryNo]
  );

  return (
    <div
      data-testid="discovery-seal"
      className="reveal-in mt-6 rounded-xl border px-4 py-3.5"
      style={{
        borderColor: "color-mix(in srgb, var(--ac) 30%, transparent)",
        background: "color-mix(in srgb, var(--ac) 7%, transparent)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="kicker"
          style={{ color: "color-mix(in srgb, var(--ac) 85%, var(--foreground))" }}
        >
          Novel Discovery No.{seal.no}
        </span>
        <span className="kicker text-muted-foreground/60">
          {seal.fidelity}%
        </span>
      </div>
      <p
        className="voice mt-1.5 text-[14.5px] font-semibold"
        style={{ color: "color-mix(in srgb, var(--ac) 75%, var(--foreground))" }}
      >
        {seal.title}
      </p>
      <p className="mt-1 text-[13px] leading-[1.75] text-muted-foreground">
        {seal.body}
      </p>
    </div>
  );
}

/* ---------- the corner ornament ---------- */

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
        style={{ borderColor: "color-mix(in srgb, var(--ac) 28%, transparent)" }}
      />
      <div className="flex h-full w-full items-center justify-center">
        <span
          className="block size-2 rotate-45"
          style={{
            background: "color-mix(in srgb, var(--ac) 75%, white)",
            boxShadow: "0 0 10px color-mix(in srgb, var(--ac) 60%, transparent)",
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
        accent="var(--ac)"
        testIdPrefix="scope-visual"
        repaint
      />
    );
  }
  if (message.visual === "error") {
    return (
      <div
        className="rounded-2xl border px-4 py-3.5"
        style={{
          borderColor: "color-mix(in srgb, var(--ac) 24%, transparent)",
          background: "color-mix(in srgb, var(--ac) 5%, transparent)",
        }}
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
            className="focus-glow mt-2.5 flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
            style={{
              borderColor: "color-mix(in srgb, var(--ac) 35%, transparent)",
            }}
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
        accent="var(--ac)"
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
      accent="var(--ac)"
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
  anchorRef,
}: {
  message: ChatMessage;
  index: number;
  animate: boolean;
  scope: Scope;
  anchorRef?: (node: HTMLDivElement | null) => void;
}) {
  const scopeMeta = SCOPE_META[scope];
  const [copied, setCopied] = useState(false);
  const t = useT();
  /* Each card draws its own light — quietly, never spoken of. */
  const aura = auraFor(message.id);

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
      transition={{ duration: animate ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t("Transmission {n}", { n: index + 1 })}
      style={{ "--ac": aura.a, "--scope-b": aura.b } as CSSProperties}
      className="pt-7 first:pt-0"
    >
      <div ref={anchorRef}>
        {/* index ribbon */}
        <div className="mb-4 flex items-center gap-3">
          <span
            className="mono-label rounded-full border px-2 py-0.5 text-[10.5px]"
            style={{
              borderColor: "color-mix(in srgb, var(--ac) 30%, transparent)",
              color: "color-mix(in srgb, var(--ac) 85%, var(--foreground))",
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
                "linear-gradient(90deg, color-mix(in srgb, var(--ac) 24%, transparent), transparent)",
            }}
            aria-hidden="true"
          />
        </div>

        {/* query echo */}
        <div className="relative mx-auto max-w-[620px]">
          <span
            className="voice pointer-events-none absolute -left-1 -top-5 select-none text-[44px] leading-none opacity-40"
            style={{ color: "var(--ac)" }}
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

        {/* the transmission card */}
        <div
          className="relative mt-6 overflow-hidden rounded-2xl border"
          style={{
            borderColor: "color-mix(in srgb, var(--ac) 20%, transparent)",
            background:
              "linear-gradient(172deg, color-mix(in srgb, var(--ac) 6%, transparent), transparent 55%)",
            boxShadow:
              "0 0 40px -20px color-mix(in srgb, var(--ac) 28%, transparent)",
          }}
        >
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
                "linear-gradient(90deg, transparent, var(--ac) 30%, var(--scope-b) 70%, transparent)",
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
              <>
                <TransmissionBody text={message.text} />
                {/* the app seals every settled transmission — never the model */}
                {message.discoveryNo && <DiscoverySealBlock message={message} scope={scope} />}
              </>
            )}
          </div>
          <Seal />
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- the healing apothecary ---------- */

function ApothecaryStand({ concern }: { concern: string }) {
  const askRemedy = useMirror((s) => s.askRemedy);
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mt-9 flex flex-col items-center pb-1 text-center"
      data-testid="apothecary-stand"
    >
      <p className="kicker text-muted-foreground/60">
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
      <p className="voice-italic mt-2.5 max-w-[320px] text-[12.5px] leading-relaxed text-muted-foreground/70">
        {t("Prepared from what has been spoken here")}
      </p>
    </motion.div>
  );
}

/* ---------- the identity row — who speaks here, and how ---------- */

function IdentityRow({ scope }: { scope: Scope }) {
  const t = useT();
  const persona = useMirror((s) => s.persona);
  const setPersona = useMirror((s) => s.setPersona);
  const fusionWith = useMirror((s) => s.fusionWith);
  const setFusionWith = useMirror((s) => s.setFusionWith);
  const activeMode = useMirror((s) => s.activeMode);
  const clearChannel = useMirror((s) => s.clearChannel);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const [fusionOpen, setFusionOpen] = useState(false);

  const entity = CHAMBER_ENTITIES[scope];
  const fused = fusionWith ? CHAMBER_ENTITIES[fusionWith] : null;

  const otherModes = (Object.keys(CHAMBER_ENTITIES) as Array<keyof typeof CHAMBER_ENTITIES>)
    .filter((m) => m !== activeMode);

  return (
    <div
      className="relative shrink-0 border-b px-4 py-3 sm:px-6"
      style={{ borderColor: "color-mix(in srgb, var(--ac) 18%, transparent)" }}
    >
      <div className="flex items-center gap-3">
        {/* the entity's sigil */}
        <span
          className="relative flex size-9 shrink-0 items-center justify-center rounded-full border text-[15px]"
          aria-hidden="true"
          style={{
            borderColor: "color-mix(in srgb, var(--ac) 34%, transparent)",
            background: "color-mix(in srgb, var(--ac) 10%, transparent)",
          }}
        >
          {SCOPE_META[scope].glyph}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h2 className="voice truncate text-[17px] font-semibold text-foreground">
              {entity.name}
            </h2>
            <span className="kicker hidden truncate text-muted-foreground/60 sm:inline">
              {entity.epithet}
            </span>
          </div>
          <p
            className="voice-italic mt-0.5 truncate text-[12.5px]"
            style={{ color: "color-mix(in srgb, var(--ac) 72%, var(--foreground))" }}
            data-testid="chamber-motto"
          >
            “{entity.motto}”
          </p>
        </div>

        {/* persona — how the seeker is addressed (desktop; the name
            keeps its room on small screens) */}
        <div className="hidden shrink-0 md:flex">
          <div
            className="pill-tray"
            role="group"
            aria-label={t("Persona")}
          >
            {PERSONAS.map((p) => (
              <button
                key={p}
                type="button"
                className="pillbtn"
                data-active={persona === p}
                onClick={() => setPersona(p)}
                title={t("Addressed as {addr}", { addr: entity.addresses[p] })}
                aria-pressed={persona === p}
              >
                {t(PERSONA_LABELS[p])}
              </button>
            ))}
          </div>
        </div>

        {/* cross fusion — braid a second chamber into this voice */}
        <button
          type="button"
          onClick={() => setFusionOpen((o) => !o)}
          data-testid="fusion-button"
          aria-label={t("Cross fusion — braid a second chamber into this voice")}
          title={t("Cross fusion")}
          aria-expanded={fusionOpen}
          className="pgbtn relative size-9 shrink-0"
          style={
            fused
              ? {
                  borderColor: "color-mix(in srgb, var(--ac) 40%, transparent)",
                  color: "var(--ac)",
                }
              : { width: 36, height: 36 }
          }
        >
          <Merge className="size-4" aria-hidden="true" />
          {fused && (
            <span
              className="absolute -right-0.5 -top-0.5 size-2 rounded-full"
              style={{ background: "var(--ac)" }}
              aria-hidden="true"
            />
          )}
        </button>

        {/* new chat — the channel returns to its quiet origin */}
        <button
          type="button"
          onClick={() => {
            clearChannel(activeMode);
            returnToObservatory();
          }}
          data-testid="chamber-new-chat"
          aria-label={t("New chat — return this channel to its quiet origin")}
          title={t("New chat")}
          className="pgbtn size-9 shrink-0"
          style={{ width: 36, height: 36 }}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* the fusion drawer */}
      {fusionOpen && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setFusionOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            data-testid="fusion-drawer"
            className="panel-solid-deep fadeup absolute right-3 top-[calc(100%-4px)] z-40 w-60 p-1.5 sm:right-6"
          >
            {otherModes.map((m) => {
              const e = CHAMBER_ENTITIES[m];
              const active = fusionWith === m;
              return (
                <button
                  key={m}
                  type="button"
                  data-testid={`fusion-target-${m}`}
                  onClick={() => {
                    setFusionWith(active ? null : m);
                    setFusionOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-foreground/85 transition-colors hover:bg-[color-mix(in_srgb,var(--ac)_10%,transparent)]"
                >
                  <span aria-hidden="true" className="text-[14px]">
                    {SCOPE_META[m].glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="voice block truncate font-semibold">
                      {e.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {t(SCOPE_META[m].label)}
                    </span>
                  </span>
                  {active && <Check className="size-3.5 shrink-0 text-[var(--ac)]" aria-hidden="true" />}
                </button>
              );
            })}
            {fused && (
              <button
                type="button"
                data-testid="fusion-release"
                onClick={() => {
                  setFusionWith(null);
                  setFusionOpen(false);
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t px-2.5 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                style={{ borderColor: "var(--hairline)" }}
              >
                <X className="size-3.5 shrink-0" aria-hidden="true" />
                {t("Release fusion")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- the transmission pager ---------- */

function TransmissionPager({
  count,
  anchor,
  onAnchor,
}: {
  count: number;
  anchor: number; /* -1 = follow the latest */
  onAnchor: (n: number) => void;
}) {
  const t = useT();
  const current = anchor === -1 ? count : Math.min(Math.max(anchor, 1), count);

  if (count === 0) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-2 border-b px-4 py-1.5 sm:px-6"
      style={{ borderColor: "color-mix(in srgb, var(--ac) 12%, transparent)" }}
    >
      <span className="kicker text-muted-foreground/60">
        {t("transmission {n}/{N}", { n: current, N: count })}
      </span>
      <span className="flex-1" />
      <button
        type="button"
        aria-label={t("Previous transmission")}
        disabled={current <= 1}
        data-testid="pager-prev"
        onClick={() => onAnchor(current - 1)}
        className="pgbtn"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={t("Next transmission")}
        disabled={current >= count}
        data-testid="pager-next"
        onClick={() => (current + 1 > count ? onAnchor(-1) : onAnchor(current + 1))}
        className="pgbtn"
      >
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ---------- the anchored base: depth → attunements → input ---------- */

function DepthRow() {
  const depth = useMirror((s) => s.depth);
  const setDepth = useMirror((s) => s.setDepth);
  const t = useT();

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 sm:px-6">
      <span className="kicker hidden shrink-0 text-muted-foreground/50 sm:inline">
        {t("Depth")}
      </span>
      <div
        className="pill-tray pill-tray-wrap max-w-full"
        role="group"
        aria-label={t("Depth")}
      >
        {DEPTHS.map((d) => (
          <button
            key={d.id}
            type="button"
            className="pillbtn"
            data-active={depth === d.id}
            data-testid={`depth-${d.id}`}
            aria-pressed={depth === d.id}
            onClick={() => setDepth(d.id)}
          >
            {d.id === "ultron" ? (
              t(d.label)
            ) : (
              <>
                {`${d.id.replace("x", "")}×`}
                <span className="ml-1 opacity-80">{t(d.label)}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function AttunementRow({ scope }: { scope: Scope }) {
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const askMirror = useMirror((s) => s.askMirror);
  const t = useT();
  const [spin, setSpin] = useState(0);
  /* The starting window is drawn deterministically from the scope's name
     (SSR-safe), so every chamber opens on a different verse; the reload
     dial reshuffles at will. Remounted per scope via key in the parent. */
  const [manualOffset, setManualOffset] = useState<number | null>(null);
  const pool = scopeSuggestionPools[scope];
  const baseOffset = useMemo(() => {
    let h = 0;
    for (let i = 0; i < scope.length; i++) {
      h = (h * 31 + scope.charCodeAt(i)) >>> 0;
    }
    return h % pool.length;
  }, [scope, pool.length]);
  const offset = manualOffset ?? baseOffset;

  const visible = [0, 1, 2]
    .map((i) => pool[(offset + i) % pool.length])
    .filter(Boolean);
  const loading = status === "loading";

  return (
    <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-1 sm:px-6">
      <span className="kicker hidden shrink-0 text-muted-foreground/50 sm:inline">
        {t("Attunements")}
      </span>
      <div className="flex min-w-max items-center gap-1.5">
        {visible.map((q) => (
          <button
            key={q}
            type="button"
            className="chipbtn max-w-[280px] truncate"
            disabled={loading}
            aria-disabled={loading}
            onClick={() => {
              if (!loading) void askMirror(q);
            }}
          >
            {t(q)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setManualOffset(Math.floor(Math.random() * pool.length));
            setSpin((n) => n + 1);
          }}
          disabled={loading}
          aria-label={t("Reload suggestions")}
          title={t("Reload suggestions")}
          className="pgbtn shrink-0"
        >
          <motion.span
            aria-hidden="true"
            animate={{ rotate: spin * 180 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
          </motion.span>
        </button>
      </div>
    </div>
  );
}

/* ---------- main view: the chamber — one channel per scope ---------- */

export function TransmissionView() {
  const activeMode = useMirror((s) => s.activeMode);
  const session = useMirror((s) => s.sessions[s.activeMode]);
  const remedyStatus = useMirror((s) => s.remedyStatus);
  const t = useT();

  const scope: Scope = activeMode;
  const meta = SCOPE_META[scope];

  /* the pager's anchor: -1 = follow the latest */
  const [anchor, setAnchor] = useState(-1);
  const exchangeRefs = useRef<Array<HTMLDivElement | null>>([]);

  const messagesLength = session.messages.length;

  /* a new arrival (or a scope switch) resets the pager to the latest —
     the render-time reset pattern, no effect required */
  const [pagerKey, setPagerKey] = useState(`${messagesLength}:${activeMode}`);
  const nextPagerKey = `${messagesLength}:${activeMode}`;
  if (pagerKey !== nextPagerKey) {
    setPagerKey(nextPagerKey);
    setAnchor(-1);
  }

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

  /* the pager glides to the chosen exchange */
  const gotoAnchor = (n: number) => {
    setAnchor(n);
    if (n >= 1) {
      exchangeRefs.current[n - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${meta.label} channel — mirror transmissions`}
      className={cn(
        "scope-" + scope,
        "flex min-h-0 flex-1 flex-col px-2 pb-2 pt-3 sm:px-5 sm:pb-3"
      )}
    >
      <div className="panel-solid relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* ---------- identity row ---------- */}
        <IdentityRow scope={scope} />

        {/* ---------- transmission pager ---------- */}
        <TransmissionPager count={messagesLength} anchor={anchor} onAnchor={gotoAnchor} />

        {/* ---------- transcript: the only scrolling area ---------- */}
        <div
          className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8"
          data-testid="chamber-transcript"
        >
          {/* beginning anchor — opening a channel keeps the thread here */}
          <div ref={topRef} aria-hidden="true" className="h-px" />

          {session.messages.length === 0 &&
            session.status === "idle" &&
            !session.error && (
              <div className="fadeup relative mx-auto mt-6 max-w-[560px] rounded-2xl border px-6 py-9 text-center"
                style={{
                  borderColor: "color-mix(in srgb, var(--ac) 18%, transparent)",
                  background: "color-mix(in srgb, var(--ac) 5%, transparent)",
                }}
              >
                <p className="voice text-[16.5px] font-medium text-foreground/85">
                  {t("This channel is quiet.")}
                </p>
                <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-relaxed text-muted-foreground">
                  {t(
                    "Every scope keeps its own private channel — ask from the composer below to open the first transmission."
                  )}
                </p>
                <p
                  className="voice-italic mt-4 text-[13px]"
                  style={{ color: "color-mix(in srgb, var(--ac) 72%, var(--foreground))" }}
                >
                  {t(CHAMBER_ENTITIES[scope].openings[0])}
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
                  : (node) => {
                      exchangeRefs.current[i] = node;
                    }
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
              <LoadingTransmission scope={scope} query={session.activeQuery} />
            </div>
          )}

          {session.status === "error" && (
            <div
              ref={errorRef}
              className="mt-8 rounded-2xl border p-6 text-center"
              style={{
                borderColor: "color-mix(in srgb, var(--ac) 24%, transparent)",
                background: "color-mix(in srgb, var(--ac) 5%, transparent)",
              }}
            >
              <p className="text-[16px] leading-relaxed text-foreground/85">
                {t(
                  "The field received your question but could not complete the transmission."
                )}
              </p>
              <p className="voice-italic mt-2 text-[14.5px] text-muted-foreground">
                {session.error}
              </p>
            </div>
          )}

          {/* new generations settle at the TOP of this anchor — the reader
              begins at their first line and scrolls down for the rest */}
          <div aria-hidden="true" className="h-px" />
        </div>

        {/* ---------- the anchored base — the input never drifts ---------- */}
        <div
          className="shrink-0 border-t"
          style={{ borderColor: "color-mix(in srgb, var(--ac) 18%, transparent)" }}
        >
          <DepthRow />
          <AttunementRow key={scope} scope={scope} />
          <QueryComposer embedded />
        </div>
      </div>
    </motion.section>
  );
}
