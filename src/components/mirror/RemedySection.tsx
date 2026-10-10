"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Droplets,
  FlaskConical,
  Hourglass,
  Leaf,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror, type ChatMessage, type Remedy } from "@/lib/mirror-store";
import type { Mode } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  RemedySection — the Mirror Apothecary inside a Healing channel.    */
/*  A transmission may end with an invitation: prepare a remedy.       */
/*  When the visitor accepts, the LIVING ARCHIVE OF NATURE opens —     */
/*  3,847 biological components are sifted, the gathering is chosen,   */
/*  and the remedy is weighed, ground and infused — all within the     */
/*  chat, in the Mirror's own humble, grounded voice.                  */
/* ------------------------------------------------------------------ */

const ARCHIVE_COUNT = 3847;
const ARCHIVE_MS = 1500;
const SIFT_MS = 3000;
const COUNT_MS = 2600;
const GATHER_MIN_MS = 1150;
const GATHER_STEP_MS = 260;
const INFUSE_MS = 1700;

/* The stream that flickers past while the archive is being sifted —
   real components of the green archive, glimpsed one breath at a time. */
const COMPONENT_STREAM = [
  "Yarrow",
  "Chamomile",
  "Lemon balm",
  "Reishi",
  "Chaga",
  "Rosemary",
  "Lavender",
  "Ashwagandha",
  "Elderberry",
  "Calendula",
  "Nettle",
  "Plantain leaf",
  "Marshmallow root",
  "Licorice root",
  "Ginger root",
  "Turmeric root",
  "Frankincense resin",
  "Propolis",
  "Raw honey",
  "Sea buckthorn",
  "Moringa leaf",
  "Tulsi",
  "Rose petal",
  "Hawthorn berry",
  "Motherwort",
  "Passionflower",
  "Valerian root",
  "Skullcap",
  "Linden flower",
  "Mullein leaf",
  "Thyme",
  "Sage leaf",
  "Peppermint",
  "Fennel seed",
  "Cumin seed",
  "Fenugreek seed",
  "Astragalus root",
  "Schisandra berry",
  "Goji berry",
  "Jujube fruit",
  "Cacao",
  "Cinnamon bark",
  "Clove bud",
  "Cardamom pod",
  "Gotu kola",
  "Bacopa",
  "Lion's mane",
  "Cordyceps",
] as const;

/* ---------- one labeled section of the remedy card ---------- */

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="inline-block size-1.5 shrink-0 rotate-45"
        style={{
          background: "var(--scope-a)",
          boxShadow:
            "0 0 8px color-mix(in srgb, var(--scope-a) 55%, transparent)",
        }}
      />
      <span
        className="mono-label shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: "color-mix(in srgb, var(--scope-a) 82%, white)" }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 32%, transparent), transparent)",
        }}
      />
    </div>
  );
}

/* ---------- the animated preparation ---------- */

type PrepStage = "archive" | "sifting" | "gathering" | "infusing";

function RemedyPreparation({
  ready,
  onAgain,
}: {
  ready: Remedy | null;
  onAgain: () => void;
}) {
  const t = useT();
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<PrepStage>("archive");
  const [count, setCount] = useState(0);
  const [streamIdx, setStreamIdx] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [sealed, setSealed] = useState(false);

  const handleSeal = useCallback(() => setSealed(true), []);

  /* the fixed timeline — archive → sifting → gathering */
  useEffect(() => {
    if (reduced) return;
    if (stage === "archive") {
      const id = window.setTimeout(() => setStage("sifting"), ARCHIVE_MS);
      return () => window.clearTimeout(id);
    }
    if (stage === "sifting") {
      const id = window.setTimeout(() => setStage("gathering"), SIFT_MS);
      return () => window.clearTimeout(id);
    }
  }, [stage, reduced]);

  /* the counter — 0 → 3,847, eased, once */
  useEffect(() => {
    if (reduced || stage !== "sifting") return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / COUNT_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ARCHIVE_COUNT * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, reduced]);

  /* the stream of names glimpsed while sifting */
  useEffect(() => {
    if (reduced || stage !== "sifting") return;
    const id = window.setInterval(
      () => setStreamIdx((i) => i + 1),
      130
    );
    return () => window.clearInterval(id);
  }, [stage, reduced]);

  /* the gathering — the chosen components surface one by one */
  useEffect(() => {
    if (reduced || stage !== "gathering") return;
    const total = ready?.components.length ?? 0;
    if (total === 0) return; /* the archive is still choosing */
    const timers: number[] = [];
    for (let i = 0; i < total; i++) {
      timers.push(
        window.setTimeout(
          () => setRevealed(i + 1),
          GATHER_MIN_MS + i * GATHER_STEP_MS
        )
      );
    }
    timers.push(
      window.setTimeout(
        () => setStage("infusing"),
        GATHER_MIN_MS + total * GATHER_STEP_MS + 650
      )
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [stage, ready, reduced]);

  /* the seal — the preparation completes into the remedy card */
  useEffect(() => {
    if (reduced) {
      if (ready) {
        const id = window.setTimeout(handleSeal, 450);
        return () => window.clearTimeout(id);
      }
      return;
    }
    if (stage === "infusing") {
      const id = window.setTimeout(handleSeal, INFUSE_MS);
      return () => window.clearTimeout(id);
    }
  }, [stage, ready, reduced, handleSeal]);

  /* the remedy has been sealed — it becomes a section within the chat */
  if (sealed && ready) {
    return <RemedyCard remedy={ready} onAgain={onAgain} />;
  }

  const caption =
    stage === "archive"
      ? t("Opening the living archive")
      : stage === "sifting"
        ? t("Sifting the components of nature")
        : stage === "gathering"
          ? ready
            ? t("The gathering is chosen")
            : t("The archive is choosing")
          : t("Weighing · grinding · infusing");

  /* the quiet path — reduced motion holds one still, honest line */
  if (reduced) {
    return (
      <div
        data-testid="remedy-preparation"
        aria-live="polite"
        className="mt-5 rounded-2xl border px-5 py-6 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--scope-a) 24%, transparent)",
          background:
            "color-mix(in srgb, var(--scope-a) 4%, transparent)",
        }}
      >
        <Leaf
          className="mx-auto size-5"
          style={{ color: "var(--scope-a)" }}
          aria-hidden="true"
        />
        <p className="mono-label mt-3 text-[10.5px] uppercase tracking-[0.24em] text-muted-foreground">
          {ready ? t("The gathering is chosen") : t("Opening the living archive")}
        </p>
        <p className="mt-1.5 text-[13px] italic text-muted-foreground/80">
          {t("from the living archive of nature — 3,847 components")}
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="remedy-preparation"
      aria-live="polite"
      className="mt-5 overflow-hidden rounded-2xl border px-5 py-6 sm:px-6"
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 24%, transparent)",
        background:
          "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--scope-a) 8%, transparent), transparent 70%)",
      }}
    >
      <div
        className="relative mx-auto flex h-[172px] max-w-[360px] items-center justify-center"
        aria-hidden={stage !== "gathering"}
      >
        <AnimatePresence mode="wait">
          {/* ---------- the archive opens ---------- */}
          {stage === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <motion.span
                className="relative flex size-20 items-center justify-center rounded-full border border-dashed"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 45%, transparent)",
                }}
                animate={{ scale: [1, 1.07, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Leaf
                  className="size-7"
                  style={{
                    color: "var(--scope-a)",
                    filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--scope-a) 60%, transparent))",
                  }}
                  aria-hidden="true"
                />
              </motion.span>
            </motion.div>
          )}

          {/* ---------- the sifting: 3,847 components, one breath each ---------- */}
          {stage === "sifting" && (
            <motion.div
              key="sifting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <p
                className="text-[38px] font-semibold leading-none tabular-nums"
                style={{
                  color: "color-mix(in srgb, var(--scope-a) 88%, white)",
                  textShadow:
                    "0 0 18px color-mix(in srgb, var(--scope-a) 40%, transparent)",
                }}
              >
                {count.toLocaleString()}
              </p>
              <p className="mono-label mt-2 text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
                {t("biological components of nature")}
              </p>
              <div className="mt-3 h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={streamIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 0.85, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="block text-[13.5px] italic text-foreground/80"
                  >
                    {COMPONENT_STREAM[streamIdx % COMPONENT_STREAM.length]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ---------- the gathering: the chosen surface one by one ---------- */}
          {stage === "gathering" && (
            <motion.div
              key="gathering"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex w-full flex-col items-center gap-1.5"
            >
              {ready ? (
                ready.components.slice(0, revealed).map((c, i) => (
                  <motion.span
                    key={c.name + i}
                    initial={{ opacity: 0, x: -10, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border px-3 py-1"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--scope-a) 30%, transparent)",
                      background:
                        "color-mix(in srgb, var(--scope-a) 6%, transparent)",
                    }}
                  >
                    <span
                      className="inline-block size-1 rotate-45"
                      style={{ background: "var(--scope-a)" }}
                      aria-hidden="true"
                    />
                    <span className="text-[13px] text-foreground/90">{c.name}</span>
                    {c.latin && (
                      <span className="text-[11px] italic text-muted-foreground/70">
                        {c.latin}
                      </span>
                    )}
                  </motion.span>
                ))
              ) : (
                <motion.span
                  className="mono-label text-[10.5px] uppercase tracking-[0.26em] text-muted-foreground"
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  {t("The archive is choosing")}
                </motion.span>
              )}
            </motion.div>
          )}

          {/* ---------- the infusion: the vessel breathes, then seals ---------- */}
          {stage === "infusing" && (
            <motion.div
              key="infusing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <motion.span
                className="relative flex size-20 items-center justify-center rounded-full"
                style={{
                  border: "1px solid color-mix(in srgb, var(--scope-a) 55%, transparent)",
                  background:
                    "radial-gradient(circle, color-mix(in srgb, var(--scope-a) 22%, transparent), transparent 72%)",
                }}
                animate={{ scale: [1.06, 0.97, 1.06] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              >
                <Leaf
                  className="size-7"
                  style={{
                    color: "color-mix(in srgb, var(--scope-a) 85%, white)",
                    filter: "drop-shadow(0 0 12px color-mix(in srgb, var(--scope-a) 70%, transparent))",
                  }}
                  aria-hidden="true"
                />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p
        className="mono-label mt-4 text-center text-[10px] uppercase tracking-[0.26em]"
        style={{ color: "color-mix(in srgb, var(--scope-a) 78%, white)" }}
      >
        {caption}
      </p>
    </div>
  );
}

/* ---------- the remedy itself, rendered within the chat ---------- */

function RemedyCard({
  remedy,
  onAgain,
}: {
  remedy: Remedy;
  onAgain: () => void;
}) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      data-testid="remedy-card"
      className="mt-5 overflow-hidden rounded-2xl border"
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 28%, transparent)",
        background:
          "radial-gradient(130% 90% at 50% 0%, color-mix(in srgb, var(--scope-a) 9%, transparent), transparent 68%)",
      }}
    >
      {/* the vessel's rim */}
      <div
        className="h-px w-full"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
        }}
      />

      <div className="space-y-5 px-5 py-6 sm:px-7">
        {/* name */}
        <div className="flex items-start gap-3">
          <span
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 10%, transparent)",
            }}
            aria-hidden="true"
          >
            <Leaf
              className="size-4"
              style={{ color: "color-mix(in srgb, var(--scope-a) 85%, white)" }}
            />
          </span>
          <div className="min-w-0">
            <p className="mono-label text-[9.5px] uppercase tracking-[0.26em] text-muted-foreground/70">
              {t("The Remedy")}
            </p>
            <p
              className="mt-0.5 font-serif text-[20px] italic leading-snug"
              style={{ color: "color-mix(in srgb, var(--scope-a) 85%, white)" }}
            >
              {remedy.name}
            </p>
          </div>
        </div>

        {remedy.essence && (
          <p className="text-[15px] italic leading-relaxed text-foreground/80">
            {remedy.essence}
          </p>
        )}

        {/* components */}
        <div>
          <SectionLabel>{t("Components")}</SectionLabel>
          <ul className="mt-3 space-y-3">
            {remedy.components.map((c, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
              >
                <span className="min-w-0">
                  <span className="text-[15px] font-medium text-foreground/92">
                    {c.name}
                  </span>
                  {c.latin && (
                    <span className="ml-2 text-[12.5px] italic text-muted-foreground/75">
                      {c.latin}
                    </span>
                  )}
                  {c.role && (
                    <span className="block text-[13px] leading-relaxed text-muted-foreground">
                      {c.role}
                    </span>
                  )}
                </span>
                {c.amount && (
                  <span
                    className="mono-label shrink-0 text-[11px] tabular-nums sm:text-right"
                    style={{
                      color: "color-mix(in srgb, var(--scope-a) 75%, white)",
                    }}
                  >
                    {c.amount}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* preparation */}
        <div>
          <SectionLabel>{t("Preparation")}</SectionLabel>
          <ol className="mt-3 space-y-2.5">
            {remedy.preparation.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mono-label mt-[3px] shrink-0 text-[10.5px]"
                  style={{
                    color: "color-mix(in srgb, var(--scope-a) 70%, white)",
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[14.5px] leading-[1.75] text-foreground/87">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* application + duration */}
        {(remedy.application || remedy.duration) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {remedy.application && (
              <div
                className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 22%, transparent)",
                }}
              >
                <Droplets
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "color-mix(in srgb, var(--scope-a) 75%, white)" }}
                  aria-hidden="true"
                />
                <div>
                  <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
                    {t("Application")}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/85">
                    {remedy.application}
                  </p>
                </div>
              </div>
            )}
            {remedy.duration && (
              <div
                className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 22%, transparent)",
                }}
              >
                <Hourglass
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "color-mix(in srgb, var(--scope-a) 75%, white)" }}
                  aria-hidden="true"
                />
                <div>
                  <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
                    {t("Duration")}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/85">
                    {remedy.duration}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* caution — honest, specific, humble */}
        {remedy.caution && (
          <div
            className="flex items-start gap-2.5 rounded-xl border-l-2 px-3.5 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--gd) 55%, transparent)",
              background: "color-mix(in srgb, var(--gd) 6%, transparent)",
            }}
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              style={{ color: "var(--gd)" }}
              aria-hidden="true"
            />
            <div>
              <p
                className="mono-label text-[9px] uppercase tracking-[0.22em]"
                style={{ color: "color-mix(in srgb, var(--gd) 85%, white)" }}
              >
                {t("Caution")}
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/85">
                {remedy.caution}
              </p>
            </div>
          </div>
        )}

        {/* again — no signature, no credits: the gathering speaks for itself */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onAgain}
            data-testid="remedy-again"
            className="focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] text-muted-foreground transition-all duration-300 hover:-translate-y-px hover:text-foreground"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a) 30%, transparent)",
            }}
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            {t("Prepare again")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- the section: invitation → preparation → remedy ---------- */

export function RemedySection({
  message,
  mode,
}: {
  message: ChatMessage;
  mode: Mode;
}) {
  const t = useT();
  const prepareRemedy = useMirror((s) => s.prepareRemedy);
  const remedy = message.remedy;
  /* each gathering is its own ritual — a fresh preparation every time
     the visitor asks again (the key remounts the animated vessel) */
  const [prepSeq, setPrepSeq] = useState(0);

  const gather = useCallback(() => {
    setPrepSeq((n) => n + 1);
    void prepareRemedy(mode, message.id);
  }, [prepareRemedy, mode, message.id]);

  /* the invitation */
  if (remedy === undefined) {
    return (
      <div className="mt-5" data-testid="remedy-invite">
        <div
          className="mb-4 h-px w-full"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 32%, transparent), transparent)",
          }}
        />
        <button
          type="button"
          onClick={gather}
          data-testid="prepare-remedy"
          className="focus-glow group flex w-full items-center justify-center gap-2.5 rounded-full border px-5 py-3 transition-all duration-300 hover:-translate-y-px"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
          }}
        >
          <FlaskConical
            className="size-4 transition-transform duration-300 group-hover:rotate-12"
            style={{ color: "color-mix(in srgb, var(--scope-a) 85%, white)" }}
            aria-hidden="true"
          />
          <span
            className="text-[14px] font-semibold tracking-[0.02em]"
            style={{ color: "color-mix(in srgb, var(--scope-a) 90%, white)" }}
          >
            {t("Prepare a remedy")}
          </span>
        </button>
        <p className="mono-label mt-2.5 text-center text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/60">
          {t("from the living archive of nature — 3,847 components")}
        </p>
      </div>
    );
  }

  /* the gathering did not hold — rest, then try again */
  if (remedy === "error") {
    return (
      <div
        data-testid="remedy-error"
        className="mt-5 rounded-2xl border px-5 py-4 text-center"
        style={{
          borderColor: "var(--hairline)",
        }}
      >
        <p className="text-[14px] italic leading-relaxed text-muted-foreground">
          {t(
            "The remedy could not be prepared — rest a breath, then try again"
          )}
        </p>
        <button
          type="button"
          onClick={gather}
          data-testid="remedy-retry"
          className="focus-glow mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 35%, transparent)",
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t("Prepare a remedy")}
        </button>
      </div>
    );
  }

  /* the remedy is still traveling — the preparation holds the room,
     then seals itself into the remedy card */
  return (
    <RemedyPreparation
      key={prepSeq}
      ready={remedy === "pending" ? null : remedy}
      onAgain={gather}
    />
  );
}
