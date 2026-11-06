"use client";

import {
  Atom,
  Brain,
  Check,
  Cpu,
  Dna,
  FlaskConical,
  Gem,
  Orbit,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE HYPERX FUSION — the discovery field's own crossing hand.       */
/*                                                                     */
/*  Nine lenses of science stand in the picker; the visitor arms two   */
/*  or more and the revelation that follows is ONE braided seeing —    */
/*  never one answer per lens, a single whole revealing laid out in    */
/*  beautiful structure. While the fusion stands armed, its chips      */
/*  glow above the whisper line — the room always shows WHICH fusion  */
/*  is being used, and the answer's own badge carries the mark.        */
/*                                                                     */
/*  The default HyperX remains exactly as it was: no lenses armed,     */
/*  no fusion line, the plain discovery voice.                         */
/* ------------------------------------------------------------------ */

export interface FusionCategory {
  id: string;
  name: string;
  hint: string;
  icon: LucideIcon;
  color: string;
}

/* THE NINE LENSES — futuristic in name, honest in meaning. */
export const HYPERX_FUSION_CATEGORIES: FusionCategory[] = [
  {
    id: "metaphysica",
    name: "Metaphysica",
    hint: "The laws beneath reality",
    icon: Sparkles,
    color: "#a78bfa",
  },
  {
    id: "proteinics",
    name: "Proteinics",
    hint: "Living matter & bio-architecture",
    icon: FlaskConical,
    color: "#4ade80",
  },
  {
    id: "mineralis",
    name: "Mineralis",
    hint: "Crystals, minerals & geo-memory",
    icon: Gem,
    color: "#fbbf24",
  },
  {
    id: "digitronica",
    name: "Digitronica",
    hint: "Code, AI & digital minds",
    icon: Cpu,
    color: "#22d3ee",
  },
  {
    id: "quantara",
    name: "Quantara",
    hint: "Quantum fields & particles",
    icon: Atom,
    color: "#818cf8",
  },
  {
    id: "cosmara",
    name: "Cosmara",
    hint: "Cosmology & the deep sky",
    icon: Orbit,
    color: "#f472b6",
  },
  {
    id: "neurofutura",
    name: "Neurofutura",
    hint: "Mind, brain & cognition",
    icon: Brain,
    color: "#e879f9",
  },
  {
    id: "genomica",
    name: "Genomica",
    hint: "DNA & the code of life",
    icon: Dna,
    color: "#34d399",
  },
  {
    id: "energetica",
    name: "Energetica",
    hint: "Energy, fields & power",
    icon: Zap,
    color: "#fb923c",
  },
];

export function fusionCategory(id: string): FusionCategory | undefined {
  return HYPERX_FUSION_CATEGORIES.find((c) => c.id === id);
}

/** THE FUSION'S OWN NAMES — "Quantara × Mineralis", for badges. */
export function fusionLabel(ids: string[]): string {
  return ids
    .map((id) => fusionCategory(id)?.name ?? id)
    .join(" × ");
}

/* THE ARMED LAW — a fusion begins at two lenses; four is the focus
   cap (a braiding of many more dilutes into a survey, and the fusion
   must never become a list). */
export const FUSION_MIN = 2;
export const FUSION_MAX = 4;

export function sanitizeFusion(
  raw: unknown
): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const cat = fusionCategory(item);
    if (cat) seen.add(cat.id);
  }
  const ids = [...seen].slice(0, FUSION_MAX);
  return ids.length >= FUSION_MIN ? ids : undefined;
}

/* ------------------- the armed fusion's own bar --------------------- */

export function HyperXFusionBar({
  selected,
  busy,
  onClear,
  onOpen,
  testId,
}: {
  selected: string[];
  busy?: boolean;
  onClear: () => void;
  onOpen: () => void;
  testId: string;
}) {
  const t = useT();
  if (selected.length === 0) return null;
  return (
    <div
      data-testid={`${testId}-fusion-bar`}
      className={cn(
        "pointer-events-auto flex w-full max-w-[560px] flex-wrap items-center gap-1.5 rounded-2xl border px-2.5 py-1.5",
        busy && "animate-pulse motion-reduce:animate-none"
      )}
      style={{
        borderColor:
          "color-mix(in srgb, var(--hyperx-fusion, #e879f9) 42%, transparent)",
        background:
          "color-mix(in srgb, var(--hyperx-fusion, #e879f9) 7%, var(--background))",
        boxShadow:
          "0 0 22px -6px color-mix(in srgb, var(--hyperx-fusion, #e879f9) 34%, transparent)",
      }}
    >
      <span
        className="mono-label flex shrink-0 items-center gap-1 text-[9px] uppercase tracking-[0.2em]"
        style={{ color: "var(--hyperx-fusion, #e879f9)" }}
      >
        <FlaskConical className="size-3" aria-hidden="true" />
        {t("Fusion")}
      </span>
      {selected.map((id) => {
        const cat = fusionCategory(id);
        if (!cat) return null;
        const Icon = cat.icon;
        return (
          <span
            key={id}
            className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
            style={{
              color: cat.color,
              borderColor: `color-mix(in srgb, ${cat.color} 45%, transparent)`,
              background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
            }}
          >
            <Icon className="size-3" aria-hidden="true" />
            {cat.name}
          </span>
        );
      })}
      <span className="min-w-0 flex-1" />
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("Adjust the fusion")}
        title={t("Adjust the fusion")}
        className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
      >
        <span
          className="mono-label text-[8.5px] uppercase tracking-[0.16em]"
          style={{ color: "var(--hyperx-fusion, #e879f9)" }}
        >
          {selected.length}/{FUSION_MAX}
        </span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t("Clear the fusion")}
        title={t("Clear the fusion")}
        data-testid={`${testId}-fusion-clear`}
        className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* --------------------- the nine lenses' picker ---------------------- */

export function HyperXFusionPicker({
  selected,
  onToggle,
  onClose,
  testId,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  testId: string;
}) {
  const t = useT();
  const armed = selected.length >= FUSION_MIN;
  return (
    <div
      data-testid={`${testId}-fusion-picker`}
      className="pointer-events-auto w-full max-w-[560px] rounded-2xl border hairline bg-background p-3 shadow-lg"
      role="group"
      aria-label={t("The nine lenses of fusion")}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em]"
          style={{ color: "var(--hyperx-fusion, #e879f9)" }}
        >
          <FlaskConical className="size-3" aria-hidden="true" />
          {t("Fusion — choose 2 to 4 lenses")}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close the fusion picker")}
          className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-3">
        {HYPERX_FUSION_CATEGORIES.map((cat) => {
          const on = selected.includes(cat.id);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onToggle(cat.id)}
              aria-pressed={on}
              data-testid={`${testId}-fusion-lens-${cat.id}`}
              className="focus-glow flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left transition-all duration-300"
              style={
                on
                  ? {
                      borderColor: `color-mix(in srgb, ${cat.color} 55%, transparent)`,
                      background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
                      boxShadow: `0 0 14px -4px color-mix(in srgb, ${cat.color} 45%, transparent)`,
                    }
                  : {
                      borderColor: "var(--hairline)",
                      background: "transparent",
                    }
              }
            >
              <Icon
                className="size-3.5 shrink-0"
                style={{ color: on ? cat.color : undefined }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-foreground">
                  {cat.name}
                </span>
                <span className="block truncate text-[9px] leading-tight text-muted-foreground/75">
                  {t(cat.hint)}
                </span>
              </span>
              {on && (
                <Check
                  className="size-3 shrink-0"
                  style={{ color: cat.color }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground/70">
        {armed
          ? t("One revelation braided from the lenses — never one answer per lens.")
          : t("Arm two lenses or more — the crossing begins at two.")}
      </p>
      {armed && (
        <p
          className="mono-label mt-1 text-center text-[8.5px] uppercase tracking-[0.18em]"
          style={{ color: "var(--hyperx-fusion, #e879f9)" }}
        >
          {t("Fusion armed")} · {fusionLabel(selected)}
        </p>
      )}
    </div>
  );
}

/* ------------------- the answer's own fusion badge ------------------ */

export function HyperXFusionBadge({
  fusion,
  testId,
}: {
  fusion: string[];
  testId: string;
}) {
  const t = useT();
  if (fusion.length === 0) return null;
  return (
    <span
      data-testid={`${testId}-fusion-badge`}
      className="mono-label mt-1 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.16em]"
      style={{
        color: "var(--hyperx-fusion, #e879f9)",
        borderColor:
          "color-mix(in srgb, var(--hyperx-fusion, #e879f9) 40%, transparent)",
        background:
          "color-mix(in srgb, var(--hyperx-fusion, #e879f9) 8%, transparent)",
      }}
    >
      <FlaskConical className="size-2.5" aria-hidden="true" />
      {t("Fusion")} · {fusionLabel(fusion)}
    </span>
  );
}
