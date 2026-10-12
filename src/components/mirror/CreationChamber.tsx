"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useId } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Hammer,
  LoaderCircle,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { familyLabelKeys } from "@/lib/tree-mix";
import { familyAccent } from "@/lib/data/suggestion-banks";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE CREATION CHAMBER — the gate's making, born above the tree.     */
/*                                                                     */
/*  Three gates hang beside the branches: the record (akasha), the     */
/*  book, the invention. Each is a gateway not to information but to   */
/*  CREATION: the moment a gate opens, a making is born — tuned to     */
/*  the whisper of the branch it hangs from and to the kategory that   */
/*  whisper serves, seeded by the walker's own resonance and by the    */
/*  exact second of the asking, so the same suggestion yields a        */
/*  different creation for every walker, every time.                   */
/*                                                                     */
/*  THE INVENTION GATE draws its creation as it speaks: a blueprint    */
/*  that drafts itself — rings turning, motes in orbit, a core         */
/*  breathing — shaped by the invention's own form, so the visitor     */
/*  can SEE the invention while they read it.                          */
/* ------------------------------------------------------------------ */

export type CreationKind = "akashic" | "book" | "invent";

export interface CreationRequest {
  kind: CreationKind;
  topic: string;
  family: string;
}

/* --------------------- the invention's drawing ---------------------- */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * THE INVENTION DRAFT — the drawing of the invention, drafted live.
 * A blueprint that breathes: two counter-turning rings, motes in
 * orbit, a pulsing core, a flowing line of force, and the invention's
 * own body drafted per its form. Transform/opacity/stroke only — the
 * compositor owns every frame (the chamber stays cool).
 */
function InventionDraft({
  form,
  accent,
  seed,
}: {
  form: string;
  accent: string;
  seed: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const h = useMemo(() => hashSeed(seed), [seed]);
  const moteCount = 5 + (h % 4);
  const ringShift = ((h >> 3) % 3) - 1; /* -1 | 0 | 1 — the rings breathe */
  const fig = 1 + (h % 97);
  const stroke = accent;
  const CX = 160;
  const CY = 102;

  const motes = useMemo(() => {
    const out: { angle: number; r: number }[] = [];
    for (let i = 0; i < moteCount; i++) {
      out.push({
        angle: (i * 360) / moteCount + ((h >> (i + 5)) % 24) - 12,
        r: 82 + ringShift * 6,
      });
    }
    return out;
  }, [moteCount, h, ringShift]);

  const ringR = 82 + ringShift * 6;
  const innerR = 58 + ringShift * 4;

  return (
    <figure
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 26%, transparent)`,
        background:
          "color-mix(in srgb, var(--foreground) 2%, var(--background))",
      }}
      data-testid="creation-draft"
    >
      {/* the drafting paper's corner marks */}
      <span aria-hidden="true" className="mono-label absolute left-2.5 top-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">
        FIG. {fig}
      </span>
      <span aria-hidden="true" className="mono-label absolute right-2.5 top-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50">
        {form}
      </span>
      <svg
        viewBox="0 0 320 210"
        className="block h-auto w-full"
        role="img"
        aria-label={form}
      >
        <defs>
          <pattern
            id={`grid-${uid}`}
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 14 0 L 0 0 0 14"
              fill="none"
              stroke={`color-mix(in srgb, ${stroke} 10%, transparent)`}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="320" height="210" fill={`url(#grid-${uid})`} />

        {/* the force line — flowing through the whole drawing */}
        <path
          d={`M 18 ${CY + 62} C 90 ${CY + 44}, 230 ${CY + 44}, 302 ${CY + 62}`}
          fill="none"
          stroke={`color-mix(in srgb, ${stroke} 42%, transparent)`}
          strokeWidth="1.1"
          strokeDasharray="3 7"
          className="draft-flow"
        />

        {/* the outer ring — turning one way */}
        <g className="draft-spin-rev">
          <circle
            cx={CX}
            cy={CY}
            r={ringR}
            fill="none"
            stroke={`color-mix(in srgb, ${stroke} 34%, transparent)`}
            strokeWidth="1"
            strokeDasharray="5 9"
          />
          {/* the orbiting motes */}
          {motes.map((m, i) => {
            const a = (m.angle * Math.PI) / 180;
            return (
              <circle
                key={i}
                cx={CX + m.r * Math.cos(a)}
                cy={CY + m.r * Math.sin(a)}
                r={i % 3 === 0 ? 2.4 : 1.5}
                fill={`color-mix(in srgb, ${stroke} ${i % 3 === 0 ? 80 : 45}%, transparent)`}
              />
            );
          })}
        </g>

        {/* the inner ring — turning the other way */}
        <g className="draft-spin">
          <circle
            cx={CX}
            cy={CY}
            r={innerR}
            fill="none"
            stroke={`color-mix(in srgb, ${stroke} 26%, transparent)`}
            strokeWidth="0.9"
            strokeDasharray="2 6"
          />
        </g>

        {/* the core — the invention's heart, breathing */}
        <circle
          cx={CX}
          cy={CY}
          r="5"
          fill={`color-mix(in srgb, ${stroke} 70%, transparent)`}
          className="draft-pulse"
        />

        {/* the body — drafted per the invention's own form */}
        <g
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {form === "engine" && (
            <>
              <rect x="106" y="82" width="56" height="40" rx="7" />
              <path d="M118 82 V 66 h 12 v 16" />
              <line x1="162" y1="102" x2="196" y2="102" />
              <g className="draft-spin-fast">
                <circle cx="208" cy="102" r="12" />
                <line x1="208" y1="90" x2="208" y2="114" />
                <line x1="196" y1="102" x2="220" y2="102" />
              </g>
              <line x1="96" y1="130" x2="238" y2="130" />
              <line x1="112" y1="130" x2="112" y2="140" />
              <line x1="222" y1="130" x2="222" y2="140" />
            </>
          )}
          {form === "instrument" && (
            <>
              <line x1={CX} y1="146" x2={CX} y2="56" />
              <path d={`M ${CX - 22} 56 a 22 22 0 0 1 44 0`} />
              <ellipse cx={CX} cy="76" rx="15" ry="4.5" />
              <ellipse cx={CX} cy="92" rx="11" ry="3.5" />
              <g className="draft-swing" style={{ transformOrigin: `${CX}px 56px` }}>
                <line x1={CX} y1="56" x2={CX + 38} y2="126" />
                <circle cx={CX + 38} cy="126" r="6.5" />
              </g>
              <line x1="140" y1="146" x2="180" y2="146" />
              <line x1={CX} y1="146" x2={CX - 14} y2="158" />
              <line x1={CX} y1="146" x2={CX + 14} y2="158" />
            </>
          )}
          {form === "structure" && (
            <>
              <line x1="118" y1="152" x2={CX} y2="48" />
              <line x1="202" y1="152" x2={CX} y2="48" />
              <line x1="129" y1="128" x2="191" y2="128" />
              <line x1="141" y1="104" x2="179" y2="104" />
              <line x1="129" y1="128" x2="179" y2="104" />
              <line x1="191" y1="128" x2="141" y2="104" />
              <line x1="118" y1="152" x2="202" y2="152" />
              <circle
                cx={CX}
                cy="44"
                r="5.5"
                className="draft-pulse"
                fill={`color-mix(in srgb, ${stroke} 55%, transparent)`}
                stroke="none"
              />
              <line x1="100" y1="152" x2={CX} y2="52" strokeDasharray="2 5" strokeWidth="0.9" />
              <line x1="220" y1="152" x2={CX} y2="52" strokeDasharray="2 5" strokeWidth="0.9" />
            </>
          )}
          {form === "signal" && (
            <>
              <path d={`M ${CX + 16} ${CY - 42} a 44 44 0 0 1 0 84`} className="draft-pulse" />
              <path
                d={`M ${CX + 30} ${CY - 26} a 28 28 0 0 1 0 52`}
                className="draft-pulse"
                style={{ animationDelay: "0.7s" }}
              />
              <path
                d={`M ${CX + 42} ${CY - 12} a 13 13 0 0 1 0 24`}
                className="draft-pulse"
                style={{ animationDelay: "1.4s" }}
              />
              <path d={`M ${CX - 34} ${CY - 20} a 34 34 0 0 0 0 40`} />
              <line x1={CX - 34} y1={CY} x2={CX - 12} y2={CY} />
            </>
          )}
          {form === "vessel" && (
            <>
              <path d="M 102 116 C 132 148 188 148 218 116 L 204 142 L 116 142 Z" />
              <line x1={CX} y1="116" x2={CX} y2="54" />
              <path d={`M ${CX} 58 L ${CX + 44} 108 L ${CX} 108 Z`} />
              <path d={`M ${CX - 8} 70 L ${CX - 30} 104 L ${CX - 8} 104 Z`} strokeWidth="1.2" />
              <path
                d="M 84 156 C 120 148, 200 148, 236 156"
                strokeDasharray="4 6"
                strokeWidth="1.1"
                className="draft-flow"
              />
            </>
          )}
          {form === "plaything" && (
            <>
              <g className="draft-wobble" style={{ transformOrigin: `${CX}px 100px` }}>
                <line x1={CX} y1="58" x2={CX} y2="140" />
                <path
                  d={`M ${CX} 66 C ${CX + 38} 92, ${CX + 38} 112, ${CX} 136 C ${CX - 38} 112, ${CX - 38} 92, ${CX} 66 Z`}
                />
                <ellipse cx={CX} cy="100" rx="30" ry="7" />
              </g>
              <path d={`M ${CX - 52} 148 h 104`} strokeDasharray="2 5" strokeWidth="1" />
            </>
          )}
        </g>

        {/* the draft's measure marks */}
        <g stroke={`color-mix(in srgb, ${stroke} 30%, transparent)`} strokeWidth="0.9">
          <line x1="20" y1="26" x2="36" y2="26" />
          <line x1="28" y1="18" x2="28" y2="34" />
          <line x1="284" y1="184" x2="300" y2="184" />
          <line x1="292" y1="176" x2="292" y2="192" />
        </g>
      </svg>
    </figure>
  );
}

/* ------------------------- the invention ---------------------------- */

interface Invention {
  name: string;
  epithet: string;
  form: string;
  essence: string;
  purpose: string;
  mechanism: string[];
  materials: string[];
  motion: string;
  first_stroke: string;
  caution: string;
  whisper: string;
}

function InventFlow({
  topic,
  family,
  accent,
}: {
  topic: string;
  family: string;
  accent: string;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [invention, setInvention] = useState<Invention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [phrase, setPhrase] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const seedRef = useRef(`${Date.now()}-${Math.random()}`);

  const phrases = useMemo(
    () => [
      t("Measuring the need…"),
      t("Drafting the mechanism…"),
      t("Kindling the form…"),
    ],
    [t]
  );

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(
      () => setPhrase((p) => (p + 1) % phrases.length),
      2400
    );
    return () => window.clearInterval(id);
  }, [loading, phrases.length]);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    setError(false);
    setInvention(null);
    const run = async () => {
      try {
        const res = await fetch("/api/branch-creation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "invent",
            topic,
            family,
            language,
            seed: seedRef.current,
          }),
          signal: AbortSignal.timeout(120000),
        });
        const data = await res.json().catch(() => null);
        if (dead) return;
        if (!res.ok || !data?.invention) throw new Error("silent");
        setInvention(data.invention as Invention);
        setLoading(false);
      } catch {
        if (dead) return;
        setError(true);
        setLoading(false);
      }
    };
    void run();
    return () => {
      dead = true;
    };
  }, [topic, family, language, attempt]);

  const strike = () => {
    seedRef.current = `${Date.now()}-${Math.random()}`;
    setAttempt((a) => a + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {phrases[phrase]}
        </p>
      </div>
    );
  }

  if (error || !invention) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="max-w-[380px] text-center text-[13px] leading-relaxed text-muted-foreground">
          {t("The gate is quiet — breathe, then open it once more")}
        </p>
        <button
          type="button"
          onClick={strike}
          data-testid="creation-retry"
          className="focus-glow flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] text-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)]"
          style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
        >
          <Hammer className="size-3.5" aria-hidden="true" />
          {t("Strike another")}
        </button>
      </div>
    );
  }

  const lines: [string, string][] = [
    [t("What it is"), invention.essence],
    [t("What it changes"), invention.purpose],
  ];

  return (
    <div className="flex flex-col gap-5">
      <InventionDraft form={invention.form} accent={accent} seed={seedRef.current} />
      {invention.motion && (
        <p className="-mt-2 text-center text-[11.5px] italic leading-relaxed text-muted-foreground/85">
          {invention.motion}
        </p>
      )}

      <div className="text-center">
        <h3
          className="ink-title text-[21px] font-semibold leading-tight text-foreground"
          data-testid="creation-title"
        >
          {invention.name}
        </h3>
        {invention.epithet && (
          <p className="mono-label mt-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {invention.epithet}
          </p>
        )}
      </div>

      {lines.map(([label, text]) =>
        text ? (
          <div key={label}>
            <p className="mono-label mb-1 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className="text-[13.5px] leading-relaxed text-foreground/90">{text}</p>
          </div>
        ) : null
      )}

      {invention.mechanism?.length > 0 && (
        <div>
          <p className="mono-label mb-1.5 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("The mechanism")}
          </p>
          <ol className="flex flex-col gap-1.5">
            {invention.mechanism.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mono-label mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border text-[8px] tabular-nums"
                  style={{
                    borderColor: `color-mix(in srgb, ${accent} 42%, transparent)`,
                    color: accent,
                    minWidth: "18px",
                    height: "18px",
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-foreground/88">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {invention.materials?.length > 0 && (
        <div>
          <p className="mono-label mb-1.5 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("Materials")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {invention.materials.map((m, i) => (
              <span
                key={i}
                className="rounded-full border px-2.5 py-0.5 text-[11.5px] text-foreground/85"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 24%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accent} 6%, transparent)`,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {invention.first_stroke && (
        <div
          className="rounded-2xl border px-4 py-3"
          style={{
            borderColor: `color-mix(in srgb, ${accent} 34%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accent} 7%, var(--background))`,
          }}
        >
          <p className="mono-label mb-1 text-[8.5px] uppercase tracking-[0.2em]" style={{ color: accent }}>
            {t("The first stroke")}
          </p>
          <p className="text-[13.5px] leading-relaxed text-foreground">
            {invention.first_stroke}
          </p>
        </div>
      )}

      {invention.caution && (
        <div>
          <p className="mono-label mb-1 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("A gentle caution")}
          </p>
          <p className="text-[12.5px] italic leading-relaxed text-muted-foreground">
            {invention.caution}
          </p>
        </div>
      )}

      {invention.whisper && (
        <p
          className="border-t pt-3 text-center font-serif text-[13px] italic leading-relaxed text-foreground/80"
          style={{ borderColor: "color-mix(in srgb, var(--hairline) 70%, transparent)" }}
        >
          {invention.whisper}
        </p>
      )}

      <button
        type="button"
        onClick={strike}
        data-testid="creation-again"
        className="focus-glow mx-auto flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] text-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)]"
        style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        {t("Strike another")}
      </button>
    </div>
  );
}

/* -------------------------- the record ------------------------------ */

interface AkashicRecord {
  title: string;
  era: string;
  paragraphs: string[];
  seal: string;
}

function AkashicFlow({
  topic,
  family,
  accent,
}: {
  topic: string;
  family: string;
  accent: string;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [record, setRecord] = useState<AkashicRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [phrase, setPhrase] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const phrases = useMemo(
    () => [t("The shelf stirs…"), t("A record opens…"), t("The Librarian reads…")],
    [t]
  );

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(
      () => setPhrase((p) => (p + 1) % phrases.length),
      2400
    );
    return () => window.clearInterval(id);
  }, [loading, phrases.length]);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    setError(false);
    setRecord(null);
    const run = async () => {
      try {
        const res = await fetch("/api/branch-creation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "akashic", topic, family, language }),
          signal: AbortSignal.timeout(120000),
        });
        const data = await res.json().catch(() => null);
        if (dead) return;
        if (!res.ok || !data?.record) throw new Error("silent");
        setRecord(data.record as AkashicRecord);
        setLoading(false);
      } catch {
        if (dead) return;
        setError(true);
        setLoading(false);
      }
    };
    void run();
    return () => {
      dead = true;
    };
  }, [topic, family, language, attempt]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {phrases[phrase]}
        </p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="max-w-[380px] text-center text-[13px] leading-relaxed text-muted-foreground">
          {t("The gate is quiet — breathe, then open it once more")}
        </p>
        <button
          type="button"
          onClick={() => setAttempt((a) => a + 1)}
          data-testid="creation-retry"
          className="focus-glow flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] text-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)]"
          style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
        >
          <ScrollText className="size-3.5" aria-hidden="true" />
          {t("Open another record")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h3 className="ink-title text-[21px] font-semibold leading-tight text-foreground" data-testid="creation-title">
          {record.title}
        </h3>
        {record.era && (
          <p className="mono-label mt-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {record.era}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3.5">
        {record.paragraphs.map((p, i) => (
          <p
            key={i}
            className={cn(
              "text-[13.5px] leading-[1.8] text-foreground/90",
              i === 0 &&
                "first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-[34px] first-letter:leading-[0.85] first-letter:text-foreground"
            )}
          >
            {p}
          </p>
        ))}
      </div>
      {record.seal && (
        <p
          className="border-t pt-3 text-right font-serif text-[13px] italic leading-relaxed text-foreground/75"
          style={{ borderColor: "color-mix(in srgb, var(--hairline) 70%, transparent)" }}
        >
          {record.seal}
        </p>
      )}
      <button
        type="button"
        onClick={() => setAttempt((a) => a + 1)}
        data-testid="creation-again"
        className="focus-glow mx-auto flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] text-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)]"
        style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
      >
        <ScrollText className="size-3.5" aria-hidden="true" />
        {t("Open another record")}
      </button>
    </div>
  );
}

/* --------------------------- the book ------------------------------- */

interface BookPage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

interface BookMeta {
  title: string;
  subtitle: string;
  sigil: string;
  axiom: string;
  dedication: string;
  totalPages?: number;
}

/* the kategory's own kind of tale — the book grown from a branch
   carries its family's nature in its telling */
const FAMILY_TALE: Record<string, string> = {
  interplanetary: "cosmic",
  manifest: "wonder",
  quantum: "cosmic",
  evolvemed: "creatures",
  invent: "fantasy",
  healing: "bedtime",
  artx: "fairytale",
};

function BookFlow({
  topic,
  family,
  accent,
}: {
  topic: string;
  family: string;
  accent: string;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [threads, setThreads] = useState("");
  const [ended, setEnded] = useState(false);
  const [pairIdx, setPairIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [phrase, setPhrase] = useState(0);
  const phaseRef = useRef<"open" | "next" | "close">("open");

  const phrases = useMemo(
    () => [t("The loom listens…"), t("Threads gather…"), t("The first page breathes…")],
    [t]
  );

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(
      () => setPhrase((p) => (p + 1) % phrases.length),
      2400
    );
    return () => window.clearInterval(id);
  }, [loading, phrases.length]);

  const weave = async (phase: "open" | "next" | "close") => {
    setLoading(true);
    setError(false);
    phaseRef.current = phase;
    const lastTwo = pages.slice(-2).map((p) => p.paragraphs.join("\n\n"));
    const pageNumber =
      phase === "open" ? 1 : (pages[pages.length - 1]?.n ?? 0) + 1;
    try {
      const res = await fetch("/api/dream-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          language,
          config: {
            topic,
            volume: "short",
            age: "timeless",
            tale: FAMILY_TALE[family] ?? "wonder",
          },
          threads: phase === "open" ? undefined : threads || undefined,
          recentPages: phase === "open" ? undefined : lastTwo,
          pageNumber,
        }),
        signal: AbortSignal.timeout(150000),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.pages?.length) throw new Error("silent");
      if (phase === "open") {
        setMeta({
          title: data.title ?? "",
          subtitle: data.subtitle ?? "",
          sigil: data.sigil ?? "",
          axiom: data.axiom ?? "",
          dedication: data.dedication ?? "",
          totalPages: typeof data.totalPages === "number" ? data.totalPages : undefined,
        });
        setPages(data.pages as BookPage[]);
        setPairIdx(0);
      } else {
        setPages((prev) => [...prev, ...(data.pages as BookPage[])]);
        setPairIdx(Math.floor(pages.length / 2));
      }
      if (typeof data.threads === "string") setThreads(data.threads);
      if (phase === "close") setEnded(true);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    void weave("open");
    /* the first opening weaves once — the book is born whole */
  }, [topic, language]);

  const pairs = useMemo(() => {
    const out: BookPage[][] = [];
    for (let i = 0; i < pages.length; i += 2) out.push(pages.slice(i, i + 2));
    return out;
  }, [pages]);
  const pair = pairs[Math.min(pairIdx, pairs.length - 1)] ?? [];

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10" aria-live="polite">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {phrases[phrase]}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="max-w-[380px] text-center text-[13px] leading-relaxed text-muted-foreground">
          {t("The loom fell silent for a moment. Breathe, then weave again.")}
        </p>
        <button
          type="button"
          onClick={() => void weave(phaseRef.current)}
          data-testid="creation-retry"
          className="focus-glow flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] text-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)]"
          style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
        >
          <BookOpen className="size-3.5" aria-hidden="true" />
          {t("Weave again")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {pairIdx === 0 && meta && (
        <div className="text-center">
          {meta.sigil && (
            <p className="font-serif text-[13px] italic leading-relaxed text-muted-foreground">
              {meta.sigil}
            </p>
          )}
          <h3 className="ink-title mt-2 text-[22px] font-semibold leading-tight text-foreground" data-testid="creation-title">
            {meta.title}
          </h3>
          {meta.subtitle && (
            <p className="mt-1 text-[12.5px] text-muted-foreground">{meta.subtitle}</p>
          )}
          {meta.axiom && (
            <p className="mono-label mx-auto mt-2.5 max-w-[420px] text-[9.5px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/80">
              {meta.axiom}
            </p>
          )}
          {meta.dedication && (
            <p className="mt-3 font-serif text-[12.5px] italic leading-relaxed text-foreground/70">
              {meta.dedication}
            </p>
          )}
        </div>
      )}

      {pair.map((p) => (
        <div key={p.n} data-testid="creation-book-page">
          {p.chapter && (
            <p
              className="mb-2 text-center font-serif text-[15px] font-medium text-foreground/90"
            >
              {p.chapter}
            </p>
          )}
          {p.paragraphs.map((para, i) => (
            <p key={i} className="mb-3 text-[13.5px] leading-[1.85] text-foreground/90">
              {para}
            </p>
          ))}
          <p className="mono-label text-center text-[8.5px] tabular-nums text-muted-foreground/50">
            {p.n}
            {meta?.totalPages ? ` / ${meta.totalPages}` : ""}
          </p>
        </div>
      ))}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPairIdx((i) => Math.max(0, i - 1))}
          disabled={pairIdx === 0}
          aria-label={t("The page before")}
          className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        {!ended ? (
          <>
            <button
              type="button"
              onClick={() => void weave("next")}
              disabled={loading || pairIdx < pairs.length - 1}
              data-testid="creation-book-next"
              className="focus-glow flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] text-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)] disabled:opacity-35"
              style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }}
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              {t("Weave onward")}
            </button>
            <button
              type="button"
              onClick={() => void weave("close")}
              disabled={loading || pairIdx < pairs.length - 1}
              data-testid="creation-book-seal"
              className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[12.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:opacity-35"
            >
              {t("Seal the book")}
            </button>
          </>
        ) : (
          <p className="mono-label text-[9px] uppercase tracking-[0.2em]" style={{ color: accent }}>
            {t("The book is complete")}
          </p>
        )}
        <button
          type="button"
          onClick={() => setPairIdx((i) => Math.min(pairs.length - 1, i + 1))}
          disabled={pairIdx >= pairs.length - 1}
          aria-label={t("The next page")}
          className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------- the chamber ------------------------------ */

const GATE_META: Record<
  CreationKind,
  { title: string; icon: typeof ScrollText }
> = {
  akashic: { title: "The akashic gate", icon: ScrollText },
  book: { title: "The book gate", icon: BookOpen },
  invent: { title: "The invention gate", icon: Hammer },
};

export function CreationChamber({
  creation,
  onClose,
}: {
  creation: CreationRequest | null;
  onClose: () => void;
}) {
  const t = useT();

  useEffect(() => {
    if (!creation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creation, onClose]);

  /* the chamber only ever opens from a client press, so the portal
     mounts where document already exists — no hydration dance needed */
  if (!creation) return null;

  const gate = GATE_META[creation.kind];
  const GateIcon = gate.icon;
  const accent = familyAccent(creation.family) ?? "var(--scope-a, var(--gd))";
  const familyLabel = creation.family
    ? t(familyLabelKeys[creation.family] ?? creation.family)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t(gate.title)}
      data-testid="creation-chamber"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <section className="relative flex max-h-[88dvh] w-[94vw] max-w-[620px] flex-col overflow-hidden rounded-3xl border bg-background shadow-[0_28px_90px_-30px_rgba(0,0,0,0.75)]"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`,
        }}
      >
        {/* the chamber's header — the gate, the whisper it hangs from */}
        <header
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "color-mix(in srgb, var(--hairline) 70%, transparent)" }}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 42%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
              }}
              aria-hidden="true"
            >
              <GateIcon className="size-3.5" style={{ color: accent }} />
            </span>
            <div className="min-w-0">
              <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                {t(gate.title)}
                {familyLabel ? ` · ${familyLabel}` : ""}
              </p>
              <p className="mt-0.5 break-words font-serif text-[13.5px] italic leading-snug text-foreground/90">
                {creation.topic}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close the chamber")}
            title={t("Close the chamber")}
            data-testid="creation-close"
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </header>

        {/* the making itself */}
        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          <div
            key={`${creation.kind}:${creation.topic}:${creation.family}`}
            className="mx-auto max-w-[520px]"
          >
            {creation.kind === "invent" && (
              <InventFlow topic={creation.topic} family={creation.family} accent={accent} />
            )}
            {creation.kind === "akashic" && (
              <AkashicFlow topic={creation.topic} family={creation.family} accent={accent} />
            )}
            {creation.kind === "book" && (
              <BookFlow topic={creation.topic} family={creation.family} accent={accent} />
            )}
          </div>
        </div>

        <footer
          className="shrink-0 border-t px-4 py-2 text-center sm:px-5"
          style={{ borderColor: "color-mix(in srgb, var(--hairline) 70%, transparent)" }}
        >
          <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {t("made in this moment · unique to your resonance")}
          </p>
        </footer>
      </section>
    </div>,
    document.body
  );
}
