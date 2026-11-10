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
/* ================================================================== */

import type { JSX } from "react";
import {
  Feather,
  MessagesSquare,
  Search,
  Users,
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
            SEARCH · MAKE · PUBLISH · GATHER · SEND
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
  { icon: Search, label: "Search every shelf" },
  { icon: Feather, label: "Publish to the Gathering" },
  { icon: Users, label: "Found circles & projects" },
  { icon: MessagesSquare, label: "Invite & send words" },
];

const PRIME_ASKS: string[] = [
  "What needs my attention today?",
  "Find a circle about dreams",
  "Search the Gathering for music creations",
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
