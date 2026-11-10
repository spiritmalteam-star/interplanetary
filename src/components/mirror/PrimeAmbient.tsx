"use client";

/* ================================================================== */
/*  M.E. PRIME'S OWN ROOM — the mother of all scopes dressed in her    */
/*  laboratory light.                                                  */
/*                                                                     */
/*  THE PRIME AMBIENT — a passive cyberpunk laboratory behind the      */
/*  chat: a deep circuit grid, one slow scanning light, the liquid     */
/*  lab border (a golden-teal current running the room's frame), the   */
/*  HUD corner brackets and the compact status strip — and, on the     */
/*  quiet floor, the reactor rings breathing behind the question.      */
/*  Everything here is pointer-passive decoration; every honest word   */
/*  of the room stands above it untouched.                             */
/*                                                                     */
/*  THE PRIME DECK — the compact Jarvis console on the quiet floor:    */
/*  what Prime can truly do (the audited hands), spoken in one row     */
/*  of chips, the approval law in one line, and three prepared asks    */
/*  that each walk a real tool path. Nothing here promises a power     */
/*  the field does not carry.                                          */
/*                                                                     */
/*  THE PRIME CONFIRM CARD — the workbench's own interactive gate:     */
/*  the staged work stands visible with its honest step ledger and     */
/*  two hands — Confirm (the yes that lets it act) and Stand down      */
/*  (the no that closes it honestly). Nothing moves without this       */
/*  press; the card lives inside the conversation, never a stray       */
/*  toast the visitor might never meet.                                */
/* ================================================================== */

import type { JSX } from "react";
import { useState } from "react";
import {
  Check,
  Feather,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";

const mix = (accent: string, pct: number): string =>
  `color-mix(in srgb, ${accent} ${pct}%, transparent)`;

const GOLD = "#e6c887";
const TEAL = "#9fd8dc";

/* ------------------------------------------------------------------ */
/*  THE AMBIENT — the laboratory behind the room.                      */
/* ------------------------------------------------------------------ */

export function PrimeAmbient({
  quiet,
  busy,
}: {
  /** the quiet floor — the reactor rings breathe only here */
  quiet: boolean;
  /** the field is weaving — the status strip says so honestly */
  busy: boolean;
}): JSX.Element {
  return (
    <div
      aria-hidden="true"
      data-testid="prime-ambient"
      className="prime-ambient pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* THE DEEP GRID — the laboratory's own night: faint circuit
          lines falling away under a radial mask, gold over teal */}
      <div className="prime-grid absolute inset-0" />
      <div className="prime-vignette absolute inset-0" />

      {/* THE SCANNING LIGHT — one thin line passing the room, slow */}
      <div className="prime-scan absolute inset-x-0 top-0 h-full" />

      {/* THE LIQUID LAB BORDER — the room's own frame: a dual current
          (gold and teal) running the rounded glass edge, with the HUD
          corner brackets and the compact status strip */}
      <div className="prime-frame absolute inset-x-2.5 bottom-2.5 top-2.5 sm:inset-x-5 sm:bottom-4 sm:top-4">
        <div className="prime-frame-liquid absolute inset-0" />
        <span className="prime-corner prime-corner-tl" aria-hidden="true" />
        <span className="prime-corner prime-corner-tr" aria-hidden="true" />
        <span className="prime-corner prime-corner-bl" aria-hidden="true" />
        <span className="prime-corner prime-corner-br" aria-hidden="true" />
        <div className="prime-strip absolute inset-x-0 top-0 flex items-center justify-center gap-2 pt-1.5">
          <span className="prime-strip-brand">M.E. PRIME</span>
          <span className="prime-strip-sep" aria-hidden="true" />
          <span className="prime-strip-hands max-sm:hidden">
            SEARCH · COMPOSE · SHARE · ECHO · GATHER · MESSAGE
          </span>
          <span className="prime-strip-sep prime-strip-hands max-sm:hidden" aria-hidden="true" />
          <span className="prime-strip-status">
            {busy ? "◇" : "◈"}
          </span>
        </div>
      </div>

      {/* THE REACTOR — the quiet floor's own rings, breathing behind
          the question (the conversation covers them with its words) */}
      {quiet && (
        <div className="prime-reactor absolute left-1/2 top-[16%] -translate-x-1/2">
          <span className="prime-ring prime-ring-outer" />
          <span className="prime-ring prime-ring-mid" />
          <span className="prime-ring prime-ring-core" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE DECK — the compact console of real hands on the quiet floor.   */
/* ------------------------------------------------------------------ */

const PRIME_HANDS: { icon: typeof Search; label: string }[] = [
  { icon: Wand2, label: "Compose books, songs & visions" },
  { icon: Search, label: "Search every shelf" },
  { icon: Feather, label: "Share & publish" },
  { icon: Sparkles, label: "Echo & resonate" },
  { icon: Users, label: "Follow, connect & join" },
  { icon: MessagesSquare, label: "Message & remember" },
];

const PRIME_ASKS: string[] = [
  "Create a book about music",
  "What needs my attention today?",
  "Find a circle about dreams and join it",
  "Search the Gathering for music creations and echo one",
];

export function PrimeDeck({
  onAsk,
  disabled,
}: {
  /** sends a prepared ask into the Prime conversation */
  onAsk: (question: string) => void;
  disabled?: boolean;
}): JSX.Element {
  const t = useT();
  return (
    <section
      data-testid="prime-deck"
      aria-label={t("M.E. Prime")}
      className="prime-deck pointer-events-auto relative w-full max-w-[560px] shrink-0 overflow-hidden rounded-3xl border p-3 sm:p-4"
      style={{
        borderColor: mix(GOLD, 24),
        background: `color-mix(in srgb, ${GOLD} 4%, var(--background))`,
      }}
    >
      {/* the deck's own liquid edge — one thin current over the frame */}
      <span className="prime-deck-current" aria-hidden="true" />

      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className="prime-deck-core shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[15px] leading-tight text-foreground">
            {t("M.E. Prime")}
          </h2>
          <p className="mono-label truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
            {t("The mother of all scopes — everything, in one request")}
          </p>
        </div>
        <span
          className="mono-label shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.14em]"
          style={{
            color: disabled ? TEAL : GOLD,
            borderColor: mix(disabled ? TEAL : GOLD, 38),
            background: mix(disabled ? TEAL : GOLD, 8),
          }}
        >
          {disabled ? t("Prime weaving — one breath") : t("Every hand ready")}
        </span>
      </header>

      {/* THE HONEST HANDS — what the field can truly do, one row */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PRIME_HANDS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10.5px] leading-none text-foreground/85"
            style={{
              borderColor: mix(GOLD, 20),
              background: "var(--glass-bg-soft, transparent)",
            }}
          >
            <Icon className="size-3" style={{ color: GOLD }} aria-hidden="true" />
            {t(label)}
          </span>
        ))}
      </div>

      {/* THE APPROVAL LAW — the house's own word, one line, always */}
      <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground/75">
        {t(
          "One consequential step is staged — confirm to let it act. Nothing moves without you."
        )}
      </p>

      {/* THE PREPARED ASKS — three doors that each walk a real path */}
      <div className="mt-2.5">
        <p className="mono-label text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
          {t("Try one ask")}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {PRIME_ASKS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => onAsk(q)}
              className="focus-glow rounded-full border px-2.5 py-1.5 text-[11px] leading-none text-foreground/90 transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                borderColor: mix(TEAL, 26),
                background: mix(TEAL, 6),
              }}
            >
              {t(q)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  THE CONFIRM CARD — the workbench's interactive gate, inside the    */
/*  conversation: the staged work's honest ledger and the two hands.   */
/* ------------------------------------------------------------------ */

const STEP_GLYPH: Record<string, string> = {
  completed: "✓",
  running: "◇",
  pending: "·",
  awaiting: "◇",
  awaiting_approval: "◇",
  failed: "✕",
  cancelled: "✕",
};

export function PrimeConfirmCard({
  steps,
  busy,
  error,
  onConfirm,
  onCancel,
  testId,
}: {
  taskId?: string;
  steps: { tool: string; status: string; name: string }[];
  /** the verdict crossing — both hands rest while true */
  busy?: boolean;
  /** the honest failure word, when the verdict could not cross */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  testId?: string;
}): JSX.Element {
  const t = useT();
  const [gone, setGone] = useState(false);
  if (gone) return <></>;
  /* THE HONEST LEDGER'S OWN PATIENCE — an absent ledger is an empty
     one; the card still stands, and the two hands still speak. */
  const ledger = Array.isArray(steps) ? steps : [];
  const staged = ledger.filter((s) => s.status !== "completed" && s.status !== "failed");
  const done = ledger.filter((s) => s.status === "completed");
  const failed = ledger.filter((s) => s.status === "failed");
  return (
    <div
      data-testid={testId ?? "prime-confirm-card"}
      role="group"
      aria-label={t("One step awaits your yes")}
      className="prime-confirm mt-2.5 w-full max-w-[560px] overflow-hidden rounded-2xl border p-3"
      style={{
        borderColor: mix(GOLD, 30),
        background: `color-mix(in srgb, ${GOLD} 5%, var(--background))`,
      }}
    >
      <div className="prime-deck-current" aria-hidden="true" />
      <header className="flex items-center gap-2">
        <ShieldCheck className="size-3.5 shrink-0" style={{ color: GOLD }} aria-hidden="true" />
        <p className="mono-label text-[9px] uppercase tracking-[0.16em]" style={{ color: GOLD }}>
          {t("One step awaits your yes")}
        </p>
      </header>

      {/* THE HONEST LEDGER — the steps as they truly ran, never dressed */}
      <ul className="mt-2 space-y-1" data-testid={`${testId ?? "prime"}-steps`}>
        {[...done, ...staged, ...failed].slice(0, 6).map((s, i) => (
          <li key={`${s.tool}-${i}`} className="flex items-center gap-2 text-[11px] leading-snug text-foreground/80">
            <span
              aria-hidden="true"
              className="w-3 shrink-0 text-center"
              style={{ color: s.status === "completed" ? TEAL : s.status === "failed" ? "#f43f5e" : GOLD }}
            >
              {STEP_GLYPH[s.status] ?? "·"}
            </span>
            <span className="truncate">
              <span className="font-semibold">{s.tool}</span>
              {s.name ? ` — ${s.name}` : ""}
            </span>
            <span className="mono-label ml-auto shrink-0 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/70">
              {s.status}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground/75">
        {t("Nothing moves without you — confirm to let this act, or stand it down.")}
      </p>

      {error && (
        <p role="alert" className="mt-1.5 rounded-lg border border-[color-mix(in_srgb,#f43f5e_30%,transparent)] bg-[color-mix(in_srgb,#f43f5e_6%,transparent)] px-2.5 py-1.5 text-[11px] leading-relaxed text-foreground/85">
          {error}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          data-testid={`${testId ?? "prime"}-confirm`}
          className="focus-glow inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-full border px-4 text-[12px] font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            color: GOLD,
            borderColor: mix(GOLD, 45),
            background: mix(GOLD, 10),
          }}
        >
          <Check className="size-3.5" aria-hidden="true" />
          {busy ? t("Crossing…") : t("Confirm")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setGone(true);
            onCancel();
          }}
          data-testid={`${testId ?? "prime"}-cancel`}
          className="focus-glow inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-[var(--hairline)] px-4 text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-3.5" aria-hidden="true" />
          {t("Stand down")}
        </button>
      </div>
    </div>
  );
}
