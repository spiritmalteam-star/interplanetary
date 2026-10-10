"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CircleAlert,
  Feather,
  Flame,
  Hammer,
  History,
  RotateCcw,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useMirror, type ChatMessage } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ReplyBranches } from "./ReplyBranches";
import {
  BranchCanopy,
  CanopyRestStrip,
  CanopySummonButton,
  useCanopyAnswerFold,
} from "./BranchCanopy";
import {
  forgeChatPhases,
  forgeDomains,
  forgePhases,
  forgeScales,
  forgeSparks,
  inventTools,
  toolPhases,
} from "@/lib/data/invent";
import type { ForgeDialOption } from "@/lib/mirror-types";
import {
  blendVisualRequest,
  isVisualIntent,
} from "@/lib/visual-intent";
import { cn } from "@/lib/utils";
import { ForgeLoading } from "./ThemedLoadings";
import { ListenButton } from "./ListenButton";
import { voiceProfile } from "@/lib/voice-profiles";
import {
  PreparedPromptFallback,
  VisualizationCard,
  VisualizationPending,
} from "./VisualizationCard";
import { SigilForIntent } from "./MirrorOSForge";
import { WorldNewChat } from "./WorldNewChat";
import { ChatHistoryPanel } from "./ChatHistoryPanel";
import { WindowSelect } from "./WindowSelect";
import { useFloatingBarAutoHide } from "./useFloatingBar";

/* ------------------------------------------------------------------ */
/*  INVENT — THE FORGE · the fourth book on the shelf, rebuilt as its  */
/*  own interactive workshop, arranged as CHAMBERS like the Mirror     */
/*  Entity OS: a top bar (back · title · chamber tabs) and ONE         */
/*  spacious chamber filling the world at a time. Three chambers:      */
/*                                                                     */
/*   · THE BENCH — the core: the direct Forge chat with the whole      */
/*     height of the world to breathe — thread, living sparks and      */
/*     composer — plus the crystallization of images from the line.    */
/*                                                                     */
/*   · THE TOOL WALL — four bench presences through which the Mirror   */
/*     inteligjence works (the Crucible, the Name-Giver, the Nature    */
/*     Mirror, the Honest Spark) as a roomy card wall, with the        */
/*     chosen tool's workbench resting below it.                       */
/*                                                                     */
/*   · THE MYSTERY CHAMBER — turn three dials, strike, and a random    */
/*     creation climbs out of the coals, forged from three embers.     */
/*                                                                     */
/*  Each chamber fills the world and scrolls inside itself; the top-   */
/*  bar tabs move between them, exactly like the OS chambers. "Ask     */
/*  the Forge about it" carries the visitor back to the Bench.         */
/* ------------------------------------------------------------------ */

type InventPlace = "bench" | "tools" | "mystery";

const INVENT_PLACES: {
  id: Exclude<InventPlace, "bench">;
  label: string;
  icon: typeof Hammer;
}[] = [
  { id: "tools", label: "The Tool Wall", icon: Wrench },
  { id: "mystery", label: "The Mystery Chamber", icon: Sparkles },
];

/* Every chamber of the Forge gathered behind one quiet button — the
   tools no longer sprawl as a row of circles across the top. */
const INVENT_TOOL_ITEMS: { id: InventPlace; name: string; icon: typeof Hammer }[] = [
  { id: "bench", name: "The Bench", icon: Hammer },
  ...INVENT_PLACES.map(({ id, label, icon }) => ({ id, name: label, icon })),
];

/* ---------------- one dial group of the Mystery Chamber ---------------- */

function DialGroup({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: ForgeDialOption[];
  value: string;
  onChange: (id: string) => void;
  testId: string;
}) {
  const t = useT();
  return (
    <div>
      <p className="mono-label text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </p>
      <div
        className="mt-2 flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label={label}
        data-testid={testId}
      >
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={t(o.hint)}
              onClick={() => onChange(o.id)}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background:
                        "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                      boxShadow:
                        "0 0 16px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    }
                  : undefined
              }
            >
              <span aria-hidden="true" className="emoji-ink">{o.emoji}</span>
              {t(o.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- the forging ember — strike animation ---------------- */

function ForgingEmber({ phase }: { phase: number }) {
  const t = useT();
  return (
    <div className="py-5 text-center" aria-live="polite" aria-busy="true">
      <div className="relative mx-auto size-24" aria-hidden="true">
        <div
          className="scope-halo absolute inset-0 rounded-full border border-dashed"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 50%, transparent)",
          }}
        />
        <div
          className="scope-halo-rev absolute inset-3 rounded-full border"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-b) 38%, transparent)",
          }}
        />
        <div
          className="animate-charge-pulse absolute inset-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--scope-a) 55%, transparent), transparent 72%)",
          }}
        />
        <span
          className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
          style={{
            background: "var(--scope-a)",
            boxShadow: "0 0 12px var(--scope-a)",
          }}
        />
      </div>
      <p className="mono-label mt-4 text-[11px] text-muted-foreground">
        {t(forgePhases[phase] ?? forgePhases[0])}
      </p>
    </div>
  );
}

/* ---------------- the revealed mystery creation ---------------- */

function MysteryCard({ onAskBench }: { onAskBench: () => void }) {
  const mystery = useMirror((s) => s.mystery);
  const strikeMystery = useMirror((s) => s.strikeMystery);
  const askForge = useMirror((s) => s.askForge);
  const mysteryStatus = useMirror((s) => s.mysteryStatus);
  const t = useT();

  const spoken = useMemo(
    () =>
      mystery
        ? [
            mystery.name,
            mystery.essence,
            mystery.purpose,
            mystery.first_stroke,
            mystery.whisper,
          ]
            .filter(Boolean)
            .join(". ")
        : "",
    [mystery]
  );

  if (!mystery) return null;

  const askAbout = () => {
    if (mysteryStatus === "forging") return;
    void askForge(
      t("Speak with me about {name} — what would making it truly take?", {
        name: mystery.name,
      })
    );
    onAskBench();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mt-5 rounded-xl border px-5 py-6 sm:px-6"
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)",
        background:
          "color-mix(in srgb, var(--scope-a) 7%, transparent)",
      }}
      data-testid="mystery-card"
    >
      {/* name + sigil */}
      <div className="flex flex-col items-center text-center">
        <SigilForIntent text={mystery.name} size={64} />
        <h4 className="scope-gradient-text mt-2.5 font-serif text-[18.5px] italic leading-snug sm:text-[20px]">
          {mystery.name}
        </h4>
      </div>

      <div className="mt-4 space-y-3.5 text-left">
        <section>
          <p className="mono-label text-[9.5px] uppercase tracking-[0.16em] text-[var(--scope-a)]">
            {t("What it is")}
          </p>
          <p className="mt-1 text-[14px] leading-[1.7] text-foreground/88">
            {mystery.essence}
          </p>
        </section>

        {mystery.purpose && (
          <section>
            <p className="mono-label text-[9.5px] uppercase tracking-[0.16em] text-[var(--scope-a)]">
              {t("What it changes")}
            </p>
            <p className="mt-1 text-[14px] leading-[1.7] text-foreground/85">
              {mystery.purpose}
            </p>
          </section>
        )}

        <section
          className="rounded-lg border px-3.5 py-3"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a) 26%, transparent)",
            background:
              "color-mix(in srgb, var(--scope-a) 6%, transparent)",
          }}
        >
          <p className="mono-label text-[9.5px] uppercase tracking-[0.16em] text-[var(--scope-a)]">
            {t("The first stroke")}
          </p>
          <p className="mt-1 text-[14px] leading-[1.7] text-foreground/90">
            {mystery.first_stroke}
          </p>
        </section>

        {mystery.whisper && (
          <p className="pt-1 text-center font-serif text-[14.5px] italic leading-relaxed text-muted-foreground">
            “{mystery.whisper}”
          </p>
        )}
      </div>

      {/* actions */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={askAbout}
          data-testid="ask-forge-about"
          className="focus-glow flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium text-foreground/90 transition-all duration-300 hover:text-foreground"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background:
              "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 14%, transparent), color-mix(in srgb, var(--scope-b) 12%, transparent))",
          }}
        >
          <Feather className="size-3.5" aria-hidden="true" />
          {t("Ask the Forge about it")}
        </button>
        <button
          type="button"
          onClick={() => void strikeMystery()}
          disabled={mysteryStatus === "forging"}
          data-testid="forge-another"
          className={cn(
            "focus-glow flex items-center gap-2 rounded-full border hairline px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-300 hover:text-foreground",
            mysteryStatus === "forging" && "cursor-not-allowed opacity-50"
          )}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t("Forge another")}
        </button>
        <ListenButton text={spoken} cacheKey={`mystery-${mystery.name}`} profile={voiceProfile("forge")} />
      </div>
    </motion.div>
  );
}

/* ---------------- the Mystery Chamber ---------------- */

function MysteryChamber({ onAskBench }: { onAskBench: () => void }) {
  const mysteryStatus = useMirror((s) => s.mysteryStatus);
  const mysteryDials = useMirror((s) => s.mysteryDials);
  const setMysteryDial = useMirror((s) => s.setMysteryDial);
  const strikeMystery = useMirror((s) => s.strikeMystery);
  const mysteryError = useMirror((s) => s.mysteryError);
  const t = useT();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (mysteryStatus !== "forging") return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % forgePhases.length),
      1900
    );
    return () => window.clearInterval(id);
  }, [mysteryStatus]);

  return (
    <div
      className="scope-frame-card relative mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl glass p-5 sm:p-8"
      data-testid="mystery-chamber"
    >

      <div className="text-center">
        <h3 className="mono-label flex items-center justify-center gap-2 text-[11px] text-[var(--scope-a)]">
          <Flame className="size-3.5" aria-hidden="true" />
          {t("The Mystery Chamber")}
        </h3>
        <p className="mx-auto mt-2 max-w-[440px] text-[13.5px] leading-relaxed text-muted-foreground">
          {t(
            "Turn the dials and strike — a creation you never asked for will climb out of the coals."
          )}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <DialGroup
          label={t("What it is")}
          options={forgeDomains}
          value={mysteryDials.domain}
          onChange={(id) => setMysteryDial("domain", id)}
          testId="dial-domain"
        />
        <DialGroup
          label={t("How much world")}
          options={forgeScales}
          value={mysteryDials.scale}
          onChange={(id) => setMysteryDial("scale", id)}
          testId="dial-scale"
        />
        <DialGroup
          label={t("Which energy")}
          options={forgeSparks}
          value={mysteryDials.spark}
          onChange={(id) => setMysteryDial("spark", id)}
          testId="dial-spark"
        />
      </div>

      <button
        type="button"
        disabled={mysteryStatus === "forging"}
        onClick={() => void strikeMystery()}
        data-testid="strike-forge"
        aria-label={t("Strike the Forge")}
        className={cn(
          "focus-glow mt-7 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-[14.5px] font-semibold transition-all duration-300",
          mysteryStatus === "forging"
            ? "cursor-wait opacity-70"
            : "hover:glow-sm"
        )}
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a) 50%, transparent)",
          background:
            "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 16%, transparent), color-mix(in srgb, var(--scope-b) 14%, transparent))",
        }}
      >
        <Hammer className="size-4" aria-hidden="true" />
        {t("Strike the Forge")}
      </button>

      <AnimatePresence mode="wait">
        {mysteryStatus === "forging" && (
          <motion.div
            key="forging"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ForgingEmber phase={phase} />
          </motion.div>
        )}

        {mysteryStatus === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MysteryCard onAskBench={onAskBench} />
          </motion.div>
        )}

        {(mysteryStatus === "idle" || mysteryStatus === "error") && (
          <motion.p
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 text-center text-[12.5px] italic leading-relaxed text-muted-foreground/75"
          >
            {mysteryStatus === "error" && mysteryError
              ? t(mysteryError)
              : t("The coals are lit. The Forge is waiting.")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- the Tool Wall — four bench presences ---------------- */

function ToolWorking({ phase }: { phase: number }) {
  const t = useT();
  return (
    <div className="py-5 text-center" aria-live="polite" aria-busy="true">
      <div className="relative mx-auto size-20" aria-hidden="true">
        <div
          className="scope-halo absolute inset-0 rounded-full border border-dashed"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 50%, transparent)",
          }}
        />
        <div
          className="scope-halo-rev absolute inset-3 rounded-full border"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-b) 38%, transparent)",
          }}
        />
        <div
          className="animate-charge-pulse absolute inset-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--scope-a) 55%, transparent), transparent 72%)",
          }}
        />
      </div>
      <p className="mono-label mt-4 text-[11px] text-muted-foreground">
        {t(toolPhases[phase] ?? toolPhases[0])}
      </p>
    </div>
  );
}

function ToolResultCard({ onAskBench }: { onAskBench: () => void }) {
  const result = useMirror((s) => s.toolResult);
  const askForge = useMirror((s) => s.askForge);
  const t = useT();

  const spoken = useMemo(
    () =>
      result
        ? [result.title, ...result.lines.map((l) => l.text)]
            .filter(Boolean)
            .join(". ")
        : "",
    [result]
  );

  if (!result) return null;

  const askAbout = () => {
    if (result.title) {
      void askForge(
        t("Speak with me about {name} — what would making it truly take?", {
          name: result.title,
        })
      );
    } else {
      void askForge(
        t(
          "Speak with me about what the bench tool revealed — what would making it truly take?"
        )
      );
    }
    onAskBench();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mt-5 rounded-xl border px-5 py-5"
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)",
        background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
      }}
      data-testid="tool-result"
    >
      {result.title && (
        <h4 className="scope-gradient-text text-center font-serif text-[18px] italic leading-snug">
          {result.title}
        </h4>
      )}

      <div className={cn("space-y-3", result.title && "mt-3.5")}>
        {result.lines.map((l) =>
          l.highlight ? (
            <section
              key={l.key}
              className="rounded-lg border px-3.5 py-2.5"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a) 26%, transparent)",
                background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
              }}
            >
              <p className="mono-label text-[9.5px] uppercase tracking-[0.16em] text-[var(--scope-a)]">
                {t(l.key)}
              </p>
              <p className="mt-1 text-[14px] leading-[1.7] text-foreground/90">
                {l.text}
              </p>
            </section>
          ) : (
            <section key={l.key}>
              <p className="mono-label text-[9.5px] uppercase tracking-[0.16em] text-[var(--scope-a)]">
                {t(l.key)}
              </p>
              <p className="mt-1 text-[13.5px] leading-[1.7] text-foreground/85">
                {l.text}
              </p>
            </section>
          )
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={askAbout}
          data-testid="ask-forge-about-tool"
          className="focus-glow flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium text-foreground/90 transition-all duration-300 hover:text-foreground"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background:
              "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 14%, transparent), color-mix(in srgb, var(--scope-b) 12%, transparent))",
          }}
        >
          <Feather className="size-3.5" aria-hidden="true" />
          {t("Ask the Forge about it")}
        </button>
        <ListenButton text={spoken} cacheKey={`tool-${spoken.length}-${spoken.slice(0, 24)}`} profile={voiceProfile("forge")} />
      </div>
    </motion.div>
  );
}

/* ---------------- the Tool Wall chamber ---------------- */

function ToolWallChamber({ onAskBench }: { onAskBench: () => void }) {
  const toolStatus = useMirror((s) => s.toolStatus);
  const toolId = useMirror((s) => s.toolId);
  const toolInput = useMirror((s) => s.toolInput);
  const toolError = useMirror((s) => s.toolError);
  const setToolId = useMirror((s) => s.setToolId);
  const setToolInput = useMirror((s) => s.setToolInput);
  const workTool = useMirror((s) => s.workTool);
  const t = useT();
  const [phase, setPhase] = useState(0);

  const tool = inventTools.find((x) => x.id === toolId) ?? null;

  useEffect(() => {
    if (toolStatus !== "working") return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % toolPhases.length),
      1900
    );
    return () => window.clearInterval(id);
  }, [toolStatus]);

  const canWork = tool !== null && toolInput.trim().length >= 2 && toolStatus !== "working";

  return (
    <div data-testid="tool-wall">
      {/* chamber intro */}
      <div className="text-center">
        <h3 className="mono-label flex items-center justify-center gap-2 text-[11px] text-[var(--scope-a)]">
          <Wrench className="size-3.5" aria-hidden="true" />
          {t("The Tool Wall")}
        </h3>
        <p className="mx-auto mt-2 max-w-[560px] text-[13.5px] leading-relaxed text-muted-foreground">
          {t(
            "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out."
          )}
        </p>
      </div>

      {/* the tool cards — roomy, fully readable, one selectable wall */}
      <div
        className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6"
        role="radiogroup"
        aria-label={t("The Tool Wall")}
        data-testid="tool-chips"
      >
        {inventTools.map((x) => {
          const active = x.id === toolId;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={t(x.whisper)}
              onClick={() => setToolId(x.id)}
              data-testid={`tool-chip-${x.id}`}
              className={cn(
                "focus-glow relative overflow-hidden rounded-2xl glass p-5 text-left transition-all duration-300 hover:-translate-y-0.5 sm:p-6",
                active && "glow-sm"
              )}
              style={
                active
                  ? {
                      borderColor:
                        "color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    }
                  : undefined
              }
            >
              {active && (
                <>
                </>
              )}

              <div className="flex items-start gap-3.5">
                <span
                  className="emoji-ink flex size-11 shrink-0 items-center justify-center rounded-full border text-[18px]"
                  style={
                    active
                      ? {
                          borderColor:
                            "color-mix(in srgb, var(--scope-a) 45%, transparent)",
                          background:
                            "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                        }
                      : {
                          borderColor:
                            "color-mix(in srgb, var(--scope-a) 22%, transparent)",
                          background:
                            "color-mix(in srgb, var(--scope-a) 6%, transparent)",
                        }
                  }
                  aria-hidden="true"
                >
                  {x.emoji}
                </span>
                <span className="min-w-0">
                  <span className="scope-gradient-text block text-[16px] font-semibold leading-snug">
                    {t(x.name)}
                  </span>
                  <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted-foreground">
                    {t(x.whisper)}
                  </span>
                </span>
              </div>

              <span
                className="mono-label mt-4 flex items-center gap-1.5 text-[10px]"
                style={{ color: "var(--scope-a)" }}
              >
                <Hammer className="size-3" aria-hidden="true" />
                {t(x.action)}
              </span>
            </button>
          );
        })}
      </div>

      {/* the selected tool's workbench */}
      {tool && (
        <div
          className="scope-frame-card relative mt-6 overflow-hidden rounded-2xl glass p-5 sm:p-6"
          data-testid="tool-workbench"
        >

          <div className="flex items-center gap-2.5">
            <span className="emoji-ink flex size-8 shrink-0 items-center justify-center rounded-full border text-[15px]" aria-hidden="true"
              style={{
                borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                background: "color-mix(in srgb, var(--scope-a) 10%, transparent)",
              }}
            >
              {tool.emoji}
            </span>
            <p className="mono-label text-[11px] text-[var(--scope-a)]">
              {t(tool.name)}
            </p>
          </div>

          <label
            htmlFor="tool-input"
            className="mono-label mt-4 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70"
          >
            {t(tool.bring)}
          </label>
          <textarea
            id="tool-input"
            value={toolInput}
            onChange={(e) => setToolInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && canWork) {
                e.preventDefault();
                void workTool();
              }
            }}
            rows={3}
            maxLength={800}
            aria-label={t(tool.bring)}
            data-testid="tool-input"
            placeholder={t("Set it on the bench — plainly, as it came to you…")}
            className="focus-glow mt-1.5 max-h-32 min-h-[64px] w-full resize-none rounded-xl border hairline bg-transparent px-3.5 py-2.5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
          />

          <button
            type="button"
            disabled={!canWork}
            onClick={() => void workTool()}
            data-testid="work-tool"
            aria-label={t(tool.action)}
            className={cn(
              "focus-glow mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-semibold transition-all duration-300",
              canWork ? "hover:glow-sm" : "cursor-not-allowed opacity-50"
            )}
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 50%, transparent)",
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 16%, transparent), color-mix(in srgb, var(--scope-b) 14%, transparent))",
            }}
          >
            <Hammer className="size-4" aria-hidden="true" />
            {t(tool.action)}
          </button>

          <AnimatePresence mode="wait">
            {toolStatus === "working" && (
              <motion.div
                key="working"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ToolWorking phase={phase} />
              </motion.div>
            )}

            {toolStatus === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ToolResultCard onAskBench={onAskBench} />
              </motion.div>
            )}

            {toolStatus === "error" && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 text-center text-[12.5px] italic leading-relaxed text-muted-foreground/75"
              >
                {toolError ? t(toolError) : t("The bench is still. Try once more.")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {!tool && (
        <p className="mt-6 text-center text-[13px] italic leading-relaxed text-muted-foreground/75">
          {t("Choose a tool from the wall and set it to work.")}
        </p>
      )}
    </div>
  );
}

/* ---------------- the forge's voice ---------------- */

function ForgeBody({ text }: { text: string }) {
  const paras = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [text]
  );
  return (
    <div className="space-y-2.5">
      {paras.map((p, i) => {
        const isLast = i === paras.length - 1;
        if (isLast && p.startsWith("—")) {
          return (
            <p
              key={i}
              className="mono-label pt-1 text-[11px] leading-relaxed"
              style={{ color: "color-mix(in srgb, var(--scope-b) 82%, white)" }}
            >
              {p}
            </p>
          );
        }
        return (
          <p
            key={i}
            className={cn(
              "text-[14.5px] leading-[1.75] text-foreground/88",
              i === 0 && "font-medium text-foreground/95"
            )}
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}

/* ---------- the crystallized image — one visual block per stroke ----- */

/** The visualization slot of one forge exchange: the pending animation,
    the atelier-quiet fallback with one repaint, the prepared-prompt
    fallback, or the completed card — the forge's own accent light. */
function ForgeVisualBlock({ m }: { m: ChatMessage }) {
  const t = useT();
  const askForgeVisual = useMirror((s) => s.askForgeVisual);

  if (m.visual === "pending") {
    return <VisualizationPending accent="var(--scope-a)" testIdPrefix="forge-visual" repaint />;
  }
  if (m.visual === "error") {
    return (
      <div
        className="glass mt-3 rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_65%,transparent)] px-4 py-3.5"
        data-testid="forge-visual-error"
      >
        <p className="text-[14px] italic leading-relaxed text-foreground/80">
          {t(
            "The atelier is quiet — the vision could not be composed. Rest a breath, then ask again."
          )}
        </p>
        {m.visualRequest && (
          <button
            type="button"
            onClick={() =>
              void askForgeVisual(m.visualRequest ?? "", undefined, {
                id: m.id,
                request: m.visualRequest,
              })
            }
            data-testid="forge-visual-retry"
            className="focus-glow mt-2.5 flex h-9 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_35%,transparent)] px-4 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("Be still and receive")}
          </button>
        )}
      </div>
    );
  }
  if (!m.artifact) return null;
  const artifact = m.artifact;
  if (!artifact.imageUrl && artifact.slides.length === 0) {
    return (
      <div className="mt-3">
        <PreparedPromptFallback
          artifact={artifact}
          accent="var(--scope-a)"
          testIdPrefix="forge-visual"
          onPaint={() =>
            void askForgeVisual(m.visualRequest ?? artifact.subject, undefined, {
              id: m.id,
              request: m.visualRequest ?? artifact.subject,
              prompt: artifact.prompt,
              subject: artifact.subject,
              mode: artifact.mode,
            })
          }
        />
      </div>
    );
  }
  return (
    <div className="mt-3">
      <VisualizationCard
        artifact={artifact}
        accent="var(--scope-a)"
        testIdPrefix="forge-visual"
        onRegenerate={() =>
          void askForgeVisual(m.visualRequest ?? artifact.subject, undefined, {
            id: m.id,
            request: m.visualRequest ?? artifact.subject,
            prompt: artifact.prompt,
            subject: artifact.subject,
            mode: artifact.mode,
          })
        }
      />
    </div>
  );
}

function ForgeExchange({
  m,
  animate,
  retryDisabled,
}: {
  m: ChatMessage;
  animate: boolean;
  retryDisabled?: boolean;
}) {
  const t = useT();

  /* the stroke that never landed — the question stays in the thread,
     dimmed and marked, one touch from being sent again; no reply body
     is drawn for it, for no answer ever came */
  if (m.failed) {
    return (
      <motion.article
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border hairline px-4 py-3.5 sm:px-5"
        style={{
          background: "color-mix(in srgb, var(--scope-a) 5%, transparent)",
        }}
      >
        <p className="text-[13px] italic leading-relaxed text-muted-foreground opacity-70">
          {m.query}
        </p>
        <div
          data-testid="failed-msg"
          className="mt-2 flex flex-wrap items-center gap-1.5"
        >
          <span className="mono-label flex items-center gap-1 rounded-full border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-2 py-1 text-[9.5px] text-muted-foreground">
            <CircleAlert
              className="size-3 text-[var(--destructive)]"
              aria-hidden="true"
            />
            {t("Not delivered — the field was quiet")}
          </span>
          <button
            type="button"
            data-testid="retry-failed"
            disabled={retryDisabled}
            onClick={() => useMirror.getState().retryFailed("forge", m.id)}
            className="focus-glow flex items-center gap-1 rounded-full border hairline px-2.5 py-1 text-[11px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            {t("Send again")}
          </button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border hairline px-4 py-3.5 sm:px-5"
      style={{
        background: "color-mix(in srgb, var(--scope-a) 5%, transparent)",
      }}
    >
      <p className="text-[13px] italic leading-relaxed text-muted-foreground">
        {m.query}
      </p>
      <div className="mt-2.5">
        <ForgeBody text={m.text} />
      </div>
      {(m.visual || m.artifact) && <ForgeVisualBlock m={m} />}
    </motion.article>
  );
}

/* ---------------- THE BENCH — the core chamber of the Invent ---------------- */

function BenchChat() {
  const forgeSession = useMirror((s) => s.forgeSession);
  const setForgeDraft = useMirror((s) => s.setForgeDraft);
  const askForge = useMirror((s) => s.askForge);
  const askForgeVisual = useMirror((s) => s.askForgeVisual);
  const t = useT();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0);
  /* THE CANOPY — the branches fill the whole chat box: standing in the
     empty room, fading when the answer arrives, summoned again by the
     button beside the input. */
  const [summoned, setSummoned] = useState(false);

  const { status, messages, draft, error, activeQuery } = forgeSession;
  const loading = status === "loading";
  /* THE ANSWER'S SPACE — the walk grows while the transmission runs;
     the revealed answer folds the tree and takes its room. */
  useCanopyAnswerFold(loading, setSummoned);

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % forgeChatPhases.length),
      1900
    );
    return () => window.clearInterval(id);
  }, [loading]);

  /* the thread keeps its latest stroke in view — the bench holds the
     whole height of the world, so the pane itself is the scroll */
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, status]);

  const send = (text?: string) => {
    const q = (text ?? draft).trim();
    if (!q || loading) return;
    /* the tree steps aside as the answer begins to form */
    setSummoned(false);
    /* IMAGE CRYSTALLIZATION — an image is asked for by name: the last
       channel (the forge's most recent stroke) crystallizes at once,
       shaped by the visitor's words; with an empty thread, the words
       themselves crystallize. */
    if (isVisualIntent(q)) {
      const lastReply =
        [...messages].reverse().find((m) => m.text.trim())?.text ?? "";
      void askForgeVisual(blendVisualRequest(q, lastReply), q);
      return;
    }
    void askForge(q);
  };

  const canSend = draft.trim().length > 0 && !loading;

  return (
    <div
      className="scope-frame-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl glass"
      data-testid="forge-chat"
    >

      {/* slim header retired — the floating world controls carry the
          forge's name and the fresh-chat hand now */}

      {/* thread — it reaches the very top of the world, sliding beneath
          the floating controls */}
      <div
        ref={threadRef}
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-16 sm:px-5 sm:pt-[72px]"
        data-testid="forge-thread"
      >
        {messages.length === 0 && status === "idle" && !error ? (
          /* the room belongs to the tree — the canopy stands over it */
          <div className="h-full" aria-hidden="true" />
        ) : (
          <div className="mx-auto w-full max-w-[860px] space-y-4">
            {messages.map((m, i) => (
              <div key={m.id}>
                <ForgeExchange
                  m={m}
                  animate={i === messages.length - 1 && status !== "loading"}
                  retryDisabled={loading}
                />
                {/* the branches of this stroke — connected with the
                    Invent branch of the living tree */}
                {!m.artifact &&
                  !m.visual &&
                  m.text.trim() &&
                  (m.branches?.length || i === messages.length - 1) && (
                    <div className="pl-6">
                      <ReplyBranches
                        message={m}
                        kind="forge"
                        active={
                          i === messages.length - 1 && status !== "loading"
                        }
                        disabled={status === "loading"}
                        onPick={() => {}}
                        askFn={(q) => {
                          if (!loading) send(q);
                        }}
                      />
                    </div>
                  )}
              </div>
            ))}

            {loading && (
              <div
                className="rounded-xl border hairline px-4 py-3.5 sm:px-5"
                aria-live="polite"
                aria-busy="true"
              >
                <p className="text-[13px] italic leading-relaxed text-muted-foreground">
                  {activeQuery}
                </p>
                <div className="mt-3 flex flex-col items-center gap-2.5">
                  <ForgeLoading className="size-16 text-foreground sm:size-20" />
                  <span className="mono-label text-center text-[11px] text-muted-foreground">
                    {t(forgeChatPhases[phase] ?? forgeChatPhases[0])}
                  </span>
                </div>
              </div>
            )}

            {status === "error" && error && (
              <div className="rounded-xl border hairline px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground/85">
                {t(error)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* THE BRANCH CANOPY — the living tree of this chat, filling the
          whole box: it stands in the empty room, fades when the answer
          is revealed, and is summoned again beside the input. */}
      <BranchCanopy
        category="invent"
        open={
          messages.length === 0 && status === "idle" && !error
            ? true
            : summoned || loading
        }
        onPick={(q) => {
          /* the tree stays open — the new branches grow from the pressed
             whisper; the answer's own reveal folds the tree in time */
          if (!loading) send(q);
        }}
        onClose={() => setSummoned(false)}
        disabled={loading}
        testIdPrefix="forge-canopy"
        introHeading={t("Strike While the Coals Are Lit")}
        introSub={
          messages.length === 0 && status === "idle" && !error
            ? t(
                "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for."
              )
            : null
        }
        introSubExtra={
          messages.length === 0 && status === "idle" && !error
            ? t(
                "The bench is quiet. Speak a want, a half-idea, a block — or strike the chamber for a mystery."
              )
            : null
        }
        contextText={messages
          .slice(-6)
          .map((m) => `${m.query ?? ""}\n${m.text}`)
          .join("\n")}
        channeling={
          [...messages].reverse().find((m) => m.branches?.length)?.branches ??
          null
        }
      />

      {/* THE TRUNK'S REST — the living tree's slim floor at the top of
          the input bar; one touch summons the whole grove again. */}
      <CanopyRestStrip
        open={
          messages.length === 0 && status === "idle" && !error
            ? true
            : summoned || loading
        }
        onSummon={() => setSummoned(true)}
        disabled={loading}
        testIdPrefix="forge-composer"
      />

      {/* composer */}
      <div className="relative z-30 shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex w-full max-w-[800px] items-end gap-2">
          <CanopySummonButton
            open={summoned}
            onToggle={() => setSummoned((v) => !v)}
            disabled={loading}
            testIdPrefix="forge-composer-summon"
          />
          <textarea
            value={draft}
            onChange={(e) => setForgeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            maxLength={600}
            aria-label={t("Speak to the Forge")}
            data-testid="forge-composer"
            placeholder={t("Speak to the Forge — a want, a half-idea, a block…")}
            className="focus-glow max-h-28 min-h-[46px] w-full resize-none rounded-xl border hairline bg-transparent px-3.5 py-2.5 text-[14.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!canSend}
            aria-label={t("Send to the Forge")}
            data-testid="forge-send"
            className={cn(
              "focus-glow flex size-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
              canSend ? "hover:glow-sm" : "cursor-not-allowed opacity-45"
            )}
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a) 45%, transparent)",
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 15%, transparent), color-mix(in srgb, var(--scope-b) 13%, transparent))",
            }}
          >
            <Feather className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- the workshop shell — one chamber at a time ---------------- */

export function InventView() {
  const exitInvent = useMirror((s) => s.exitInvent);
  const [place, setPlace] = useState<InventPlace>("bench");
  const [historyOpen, setHistoryOpen] = useState(false);
  const t = useT();

  /* the reading bar law — the floating controls sink away with the
     stillness or the downward flow, rise at the first upward breath */
  const worldRootRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLElement | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const topBarHidden = useFloatingBarAutoHide({
    rootRef: worldRootRef,
    barRef: topBarRef,
    hold: toolsOpen,
  });

  return (
    <div
      ref={worldRootRef}
      className="scope-invent relative flex h-full flex-col"
    >
      {/* ---------- floating top controls over the chat — back, every
          chamber behind one tools button, and the fresh hand — they
          sink away as the visitor reads and rise when reached for ---------- */}
      <header
        ref={topBarRef}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[var(--background)]/85 via-[var(--background)]/30 to-transparent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          topBarHidden ? "invisible -translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className="bar-safe flex items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={exitInvent}
            data-testid="invent-back"
            className="focus-glow pointer-events-auto group flex h-9 shrink-0 items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)]/80 px-3 text-[14px] font-medium text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {t("Return to the Observatory")}
            </span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          {/* every tool in one button — centered like the other worlds */}
          <div className="pointer-events-auto flex min-w-0 items-center">
            <WindowSelect
              items={INVENT_TOOL_ITEMS}
              activeId={place}
              placeholder="Tools"
              onSelect={(id) => setPlace(id as InventPlace)}
              testIdPrefix="invent-tab"
              triggerClassName="bg-[var(--glass-bg)]/80 backdrop-blur-xl"
              onOpenChange={setToolsOpen}
            />
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={t("Your conversations")}
              title={t("Your conversations")}
              onClick={() => setHistoryOpen(true)}
              className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <History className="size-4" aria-hidden="true" />
            </button>
            <WorldNewChat world="invent" />
          </div>
        </div>
      </header>

      {/* ---------- the workshop — one spacious chamber at a time,
          reaching the very top of the world ---------- */}
      <main
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="invent-view"
      >
        <div className="mx-auto flex h-full w-full max-w-[1000px] flex-col px-3 pb-5 sm:px-5">
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              place === "bench" ? "pt-1.5 sm:pt-2" : "pt-16 sm:pt-20"
            )}
          >
            {place === "bench" ? (
              <BenchChat />
            ) : (
              <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                <motion.div
                  key={place}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="pb-8"
                >
                  {/* return to the bench */}
                  <div className="mb-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setPlace("bench")}
                      data-testid="invent-back-to-bench"
                      className="focus-glow group flex h-8 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_30%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_7%,transparent)] px-3.5 text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a)_50%,transparent)]"
                    >
                      <Hammer className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                      {t("Back to the bench")}
                    </button>
                  </div>

                  {place === "tools" && <ToolWallChamber onAskBench={() => setPlace("bench")} />}
                  {place === "mystery" && <MysteryChamber onAskBench={() => setPlace("bench")} />}

                  <p className="mono-label mt-8 text-center text-[10px] text-muted-foreground/60">
                    {t(
                      "The Forge keeps the next stroke ready · Free will honored always"
                    )}
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* the conversation shelf — every past chat, kept on this device */}
      <ChatHistoryPanel
        surface="forge"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
