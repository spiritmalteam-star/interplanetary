"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, ListChecks } from "lucide-react";
import type { MsEntity, MsTool } from "@/lib/data/meta-science";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the helping tools. Calculators evaluate live,       */
/*  timelines unfold on click, checklists keep a progress bar.         */
/* ------------------------------------------------------------------ */

function evaluateFormula(
  formula: string,
  inputs: { name: string }[],
  values: Record<string, number>
): number | null {
  try {
    let expr = formula;
    const names = inputs.map((i) => i.name).sort((a, b) => b.length - a.length);
    for (const name of names) {
      const v = Number.isFinite(values[name]) ? values[name] : 0;
      expr = expr.replaceAll(name, `(${v})`);
    }
    const fn = new Function(`"use strict"; return (${expr});`) as () => unknown;
    const result = fn();
    const n = typeof result === "number" ? result : Number(result);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function CalculatorTool({
  tool,
  accent,
  accentRgb,
  accentSoft,
}: {
  tool: Extract<MsTool, { kind: "calculator" }>;
  accent: string;
  accentRgb: string;
  accentSoft: string;
}) {
  const t = useT();
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(tool.inputs.map((i) => [i.name, i.default ?? 0]))
  );

  const result = useMemo(
    () => evaluateFormula(tool.formula, tool.inputs, values),
    [tool, values]
  );

  return (
    <div className="ms-holo rounded-2xl p-5 ms-glass" data-testid="ms-tool-calculator">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: accentSoft, color: accent }}
        >
          <Calculator className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h4 className="text-[14px] font-semibold text-white/90">{tool.label}</h4>
          <p className="mt-0.5 text-[11.5px] leading-snug text-white/50">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {tool.inputs.map((input) => (
          <label key={input.name} className="block">
            <span className="ms-font-display block text-[9px] uppercase tracking-[0.16em] text-white/45">
              {input.label}
              {input.unit ? ` (${input.unit})` : ""}
            </span>
            <input
              type="number"
              value={Number.isFinite(values[input.name]) ? values[input.name] : ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [input.name]: Number(e.target.value) }))
              }
              className="focus-glow mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-[13px] text-white tabular-nums focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div
        className="mt-4 rounded-xl px-4 py-3"
        style={{ background: accentSoft, border: `1px solid rgba(${accentRgb}, 0.3)` }}
      >
        <span className="ms-font-display block text-[9px] uppercase tracking-[0.18em] text-white/50">
          {tool.output.label}
          {tool.output.unit ? ` (${tool.output.unit})` : ""}
        </span>
        <span
          className="ms-font-display mt-0.5 block text-2xl font-bold tabular-nums"
          style={{ color: accent }}
          data-testid="ms-tool-result"
        >
          {result === null ? "—" : result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      </div>

      <p className="ms-font-display mt-2.5 truncate text-[10px] text-white/30" title={tool.formula}>
        {tool.formula}
      </p>
    </div>
  );
}

function TimelineTool({
  tool,
  accent,
  accentRgb,
  accentSoft,
}: {
  tool: Extract<MsTool, { kind: "timeline" }>;
  accent: string;
  accentRgb: string;
  accentSoft: string;
}) {
  const t = useT();
  const [active, setActive] = useState<number | null>(0);

  return (
    <div className="ms-holo rounded-2xl p-5 ms-glass" data-testid="ms-tool-timeline">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: accentSoft, color: accent }}
        >
          <Clock className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h4 className="text-[14px] font-semibold text-white/90">{tool.label}</h4>
          <p className="mt-0.5 text-[11.5px] leading-snug text-white/50">
            {tool.description}
          </p>
        </div>
      </div>

      <ol className="relative mt-4 space-y-0">
        {tool.events.map((event, i) => {
          const open = active === i;
          const last = i === tool.events.length - 1;
          return (
            <li key={`${event.year}-${event.title}`} className="relative">
              <button
                type="button"
                onClick={() => setActive(open ? null : i)}
                aria-expanded={open}
                className="group flex w-full items-baseline gap-3 py-2 text-left focus:outline-none"
              >
                <span
                  className="relative z-10 mt-0.5 inline-block size-3 shrink-0 rounded-full transition-colors duration-200"
                  style={{
                    background: open ? accent : "transparent",
                    border: `2px solid rgba(${accentRgb}, 0.55)`,
                    boxShadow: open ? `0 0 10px rgba(${accentRgb}, 0.6)` : undefined,
                  }}
                  aria-hidden="true"
                />
                <span className="ms-font-display w-12 shrink-0 text-[11px] tabular-nums text-white/50">
                  {event.year}
                </span>
                <span
                  className={`text-[13px] font-medium transition-colors duration-200 ${
                    open ? "text-white" : "text-white/70 group-hover:text-white/90"
                  }`}
                >
                  {event.title}
                </span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="pb-3 pl-[4.65rem] pr-2 text-[12px] leading-relaxed text-white/55">
                  {event.detail}
                </p>
              </motion.div>
              {!last && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-[5.5px] top-5 w-px bg-white/10"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ChecklistTool({
  tool,
  accent,
  accentRgb,
  accentSoft,
}: {
  tool: Extract<MsTool, { kind: "checklist" }>;
  accent: string;
  accentRgb: string;
  accentSoft: string;
}) {
  const t = useT();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const done = tool.items.filter((_, i) => checked[i]).length;
  const pct = tool.items.length ? (done / tool.items.length) * 100 : 0;

  return (
    <div className="ms-holo rounded-2xl p-5 ms-glass" data-testid="ms-tool-checklist">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: accentSoft, color: accent }}
        >
          <ListChecks className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-semibold text-white/90">{tool.label}</h4>
          <p className="mt-0.5 text-[11.5px] leading-snug text-white/50">
            {tool.description}
          </p>
        </div>
        <span className="ms-font-display shrink-0 text-[11px] tabular-nums text-white/60">
          {done}/{tool.items.length}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>

      <ul className="mt-3 space-y-1">
        {tool.items.map((item, i) => {
          const on = !!checked[i];
          return (
            <li key={item.label}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                className="group flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-white/5 focus:outline-none"
              >
                <span
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors duration-200"
                  style={{
                    borderColor: on ? accent : `rgba(${accentRgb}, 0.35)`,
                    background: on ? accent : "transparent",
                  }}
                  aria-hidden="true"
                >
                  {on && (
                    <svg viewBox="0 0 12 12" className="size-2.5 text-black">
                      <path
                        d="M2 6.5 4.5 9 10 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[12.5px] leading-snug transition-colors ${
                      on ? "text-white/45 line-through" : "text-white/80"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="block text-[10.5px] leading-snug text-white/35">
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MsTools({ entity }: { entity: MsEntity }) {
  const t = useT();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="ms-font-display text-lg font-bold uppercase tracking-[0.12em] text-white/90">
          {t("Helping Tools")}
        </h3>
        <span className="ms-font-display text-[10px] uppercase tracking-[0.16em] text-white/35">
          {t("{n} protocols", { n: entity.tools.length })}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {entity.tools.map((tool) => {
          if (tool.kind === "calculator") {
            return (
              <CalculatorTool
                key={tool.label}
                tool={tool}
                accent={entity.accent}
                accentRgb={entity.accentRgb}
                accentSoft={entity.accentSoft}
              />
            );
          }
          if (tool.kind === "timeline") {
            return (
              <TimelineTool
                key={tool.label}
                tool={tool}
                accent={entity.accent}
                accentRgb={entity.accentRgb}
                accentSoft={entity.accentSoft}
              />
            );
          }
          return (
            <ChecklistTool
              key={tool.label}
              tool={tool}
              accent={entity.accent}
              accentRgb={entity.accentRgb}
              accentSoft={entity.accentSoft}
            />
          );
        })}
      </div>
    </div>
  );
}
