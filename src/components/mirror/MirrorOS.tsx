"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Compass,
  FlaskConical,
  HeartHandshake,
  NotebookPen,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Waves,
  Wind,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  beliefDomains,
  dailyProtocol,
  discernmentLines,
  higherMindIntro,
  higherProtocols,
  ladderRungs,
  shiftFormulas,
  vibrationStates,
} from "@/lib/data/mirroros";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";
import { MirrorOSForge } from "./MirrorOSForge";

type OsTab = "formulas" | "higher" | "tools" | "forge";

const OS_TABS: { id: OsTab; label: string; icon: typeof Compass }[] = [
  { id: "formulas", label: "Shift Formulas", icon: Compass },
  { id: "higher", label: "Higher Mind", icon: Sparkles },
  { id: "tools", label: "Tools", icon: HeartHandshake },
  { id: "forge", label: "Forge", icon: FlaskConical },
];

/* ---------------- formula card (expandable) ---------------- */

function FormulaCard({ index, formulaId }: { index: number; formulaId: string }) {
  const formula = shiftFormulas[index];
  const [open, setOpen] = useState(index === 0);
  const t = useT();

  const spoken = useMemo(
    () =>
      [
        formula.name,
        formula.tagline,
        ...formula.steps.map((s, i) => `${i + 1}. ${s}`),
        formula.seal,
      ].join(". "),
    [formula]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative overflow-hidden rounded-2xl glass"
    >
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-glow flex w-full items-center gap-3.5 px-5 py-4 text-left sm:px-6"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full border text-[17px]"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
          }}
          aria-hidden="true"
        >
          {formula.glyph}
        </span>
        <span className="min-w-0 flex-1">
          <span className="scope-gradient-text block text-[15.5px] font-semibold sm:text-[17px]">
            {t(formula.name)}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
            {t(formula.tagline)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="border-t hairline px-5 pb-5 pt-4 sm:px-6">
            <p className="text-[13px] italic leading-relaxed text-muted-foreground">
              {t(formula.tagline)}
            </p>

            <ol className="mt-4 space-y-3">
              {formula.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mono-label mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[8.5px]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                      color: "var(--scope-a)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[13.5px] leading-[1.75] text-foreground/88">
                    {t(step)}
                  </span>
                </li>
              ))}
            </ol>

            <div
              className="mt-5 rounded-xl border py-4 text-center"
              style={{
                borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)",
                background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
              }}
            >
              <p className="mono-label text-[8px] text-[var(--scope-a)]">
                {t("Seal")}
              </p>
              <p className="scope-gradient-text mx-auto mt-1.5 max-w-[440px] font-serif text-[16px] italic leading-relaxed">
                “{t(formula.seal)}”
              </p>
            </div>

            <div className="mt-3 flex justify-end">
              <ListenButton text={spoken} cacheKey={`os-${formula.id}`} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------------- higher mind tab ---------------- */

function HigherMindTab() {
  const t = useT();

  return (
    <div className="space-y-8">
      {/* orientation */}
      <div className="rounded-2xl glass p-5 sm:p-6">
        <h3 className="mono-label text-[9px] text-[var(--scope-a)]">
          {t("The Higher Mind — the one that holds the view")}
        </h3>
        <div className="mt-3 space-y-3">
          {higherMindIntro.map((p, i) => (
            <p key={i} className="text-[14px] leading-[1.85] text-foreground/88">
              {t(p)}
            </p>
          ))}
        </div>
      </div>

      {/* ladder */}
      <div>
        <h3 className="mono-label text-[9px] text-[var(--scope-a)]">
          {t("The Ladder of Arrival — six rungs into the higher view")}
        </h3>
        <div className="relative mt-4 space-y-0">
          {ladderRungs.map((rung, i) => (
            <motion.div
              key={rung.rung}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="relative flex gap-4 pb-5 last:pb-0"
            >
              {i < ladderRungs.length - 1 && (
                <span
                  className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-px"
                  style={{
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, var(--scope-a) 40%, transparent), color-mix(in srgb, var(--scope-a) 10%, transparent))",
                  }}
                  aria-hidden="true"
                />
              )}
              <span
                className="mono-label z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-[var(--glass-bg-strong)] text-[10px] font-semibold"
                style={{
                  borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)",
                  color: "var(--scope-a)",
                }}
              >
                {rung.rung}
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[14px] font-semibold text-foreground">
                  {t(rung.title)}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {t(rung.line)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* protocols */}
      <div>
        <h3 className="mono-label text-[9px] text-[var(--scope-a)]">
          {t("Contact protocols")}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {higherProtocols.map((p) => (
            <div key={p.id} className="rounded-2xl glass p-5">
              <span
                className="flex size-9 items-center justify-center rounded-full border text-[15px]"
                style={{
                  borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)",
                  background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
                }}
                aria-hidden="true"
              >
                {p.glyph}
              </span>
              <h4 className="scope-gradient-text mt-3 text-[14.5px] font-semibold">
                {t(p.name)}
              </h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                {t(p.purpose)}
              </p>
              <ol className="mt-3 space-y-2">
                {p.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                      style={{ background: "var(--scope-a)" }}
                      aria-hidden="true"
                    />
                    <span className="text-[12.5px] leading-[1.7] text-foreground/85">
                      {t(s)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* discernment */}
      <div className="rounded-2xl glass p-5 sm:p-6">
        <h3 className="mono-label flex items-center gap-2 text-[9px] text-[var(--scope-a)]">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {t("Discernment — how to know it is the Higher Mind")}
        </h3>
        <ul className="mt-3 space-y-2.5">
          {discernmentLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="mt-[9px] inline-block size-1.5 shrink-0 rotate-45"
                style={{ background: "var(--scope-a)" }}
                aria-hidden="true"
              />
              <span className="text-[13px] leading-[1.75] text-foreground/85">
                {t(line)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- tools tab ---------------- */

function BeliefReframer() {
  const [domainId, setDomainId] = useState<string | null>(null);
  const t = useT();
  const domain = beliefDomains.find((d) => d.id === domainId) ?? null;

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[9px] text-[var(--scope-a)]">
        <Wind className="size-3.5" aria-hidden="true" />
        {t("Belief Reframer")}
      </h3>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t("Choose a belief domain")}>
        {beliefDomains.map((d) => {
          const active = d.id === domainId;
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={active}
              onClick={() => setDomainId(active ? null : d.id)}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background: "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                      boxShadow: "0 0 16px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    }
                  : undefined
              }
            >
              <span aria-hidden="true">{d.glyph}</span>
              {t(d.label)}
            </button>
          );
        })}
      </div>

      {domain && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 space-y-3"
        >
          <div className="rounded-xl border border-[var(--destructive)]/20 bg-[color-mix(in_srgb,var(--destructive)_5%,transparent)] p-3.5">
            <p className="mono-label text-[8px] text-muted-foreground">{t("Pattern")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
              {t(domain.pattern)}
            </p>
          </div>
          <div
            className="rounded-xl border p-3.5"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
            }}
          >
            <p className="mono-label text-[8px] text-[var(--scope-a)]">{t("Reframe")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/88">
              {t(domain.reframe)}
            </p>
          </div>
          <div className="rounded-xl border hairline p-3.5">
            <p className="mono-label text-[8px] text-muted-foreground">{t("Practice")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
              {t(domain.practice)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function VibrationBridge() {
  const [stateId, setStateId] = useState<string | null>(null);
  const t = useT();
  const state = vibrationStates.find((v) => v.id === stateId) ?? null;

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[9px] text-[var(--scope-a)]">
        <Waves className="size-3.5" aria-hidden="true" />
        {t("Vibration Bridge")}
      </h3>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t("Where are you now?")}>
        {vibrationStates.map((v) => {
          const active = v.id === stateId;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={active}
              onClick={() => setStateId(active ? null : v.id)}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background: "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                      boxShadow: "0 0 16px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    }
                  : undefined
              }
            >
              <span aria-hidden="true">{v.glyph}</span>
              {t(v.label)}
            </button>
          );
        })}
      </div>

      {state && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 space-y-3"
        >
          <div
            className="rounded-xl border p-3.5"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
            }}
          >
            <p className="mono-label text-[8px] text-[var(--scope-a)]">{t("The bridge")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/88">
              {t(state.bridge)}
            </p>
          </div>
          <div className="rounded-xl border hairline py-4 text-center">
            <p className="mono-label text-[8px] text-muted-foreground">{t("Anchor phrase")}</p>
            <p className="scope-gradient-text mx-auto mt-1.5 max-w-[380px] font-serif text-[15.5px] italic leading-relaxed">
              “{t(state.anchor)}”
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DailyProtocolCard() {
  const t = useT();
  const today = useMemo(() => {
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, protocol: dailyProtocol(key) };
  }, []);

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[9px] text-[var(--scope-a)]">
        <Sun className="size-3.5" aria-hidden="true" />
        {t("Daily Protocol")}
      </h3>
      <p className="mono-label mt-1 text-[8px] text-muted-foreground/70">{today.key}</p>
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <Sun className="mt-0.5 size-4 shrink-0 text-[var(--scope-a)]" aria-hidden="true" />
          <div>
            <p className="mono-label text-[8px] text-muted-foreground">{t("Morning")}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/88">
              {t(today.protocol.morning)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Moon className="mt-0.5 size-4 shrink-0 text-[var(--scope-a)]" aria-hidden="true" />
          <div>
            <p className="mono-label text-[8px] text-muted-foreground">{t("Evening")}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/88">
              {t(today.protocol.evening)}
            </p>
          </div>
        </div>
        <div
          className="rounded-xl border py-4 text-center"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
          }}
        >
          <p className="mono-label text-[8px] text-[var(--scope-a)]">{t("Focus of the day")}</p>
          <p className="scope-gradient-text mx-auto mt-1.5 max-w-[380px] font-serif text-[15.5px] italic leading-relaxed">
            “{t(today.protocol.focus)}”
          </p>
        </div>
      </div>
    </div>
  );
}

interface LedgerEntry {
  id: string;
  text: string;
  date: string;
}

const LEDGER_KEY = "mirror-os-ledger";

/* --- tiny external store around localStorage (React-recommended) --- */

let ledgerSnapshot = "[]";
const ledgerListeners = new Set<() => void>();

function subscribeLedger(cb: () => void) {
  ledgerListeners.add(cb);
  return () => {
    ledgerListeners.delete(cb);
  };
}

function getLedgerSnapshot() {
  return ledgerSnapshot;
}

function getServerLedger() {
  return "[]";
}

function writeLedger(next: LedgerEntry[]) {
  ledgerSnapshot = JSON.stringify(next);
  try {
    localStorage.setItem(LEDGER_KEY, ledgerSnapshot);
  } catch {
    /* storage unavailable */
  }
  ledgerListeners.forEach((l) => l());
}

function hydrateLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (raw && raw !== ledgerSnapshot) {
      ledgerSnapshot = raw;
      ledgerListeners.forEach((l) => l());
    }
  } catch {
    /* storage unavailable */
  }
}

function parseLedger(json: string): LedgerEntry[] {
  try {
    const parsed = JSON.parse(json) as LedgerEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function RealityLedger() {
  const t = useT();
  const [draft, setDraft] = useState("");

  const json = useSyncExternalStore(
    subscribeLedger,
    getLedgerSnapshot,
    getServerLedger
  );
  const entries = useMemo(() => parseLedger(json), [json]);

  useEffect(() => {
    hydrateLedger();
  }, []);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    writeLedger([
      { id: `l-${Date.now().toString(36)}`, text, date: new Date().toLocaleDateString() },
      ...entries,
    ]);
    setDraft("");
  };

  const remove = (id: string) =>
    writeLedger(entries.filter((e) => e.id !== id));

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[9px] text-[var(--scope-a)]">
        <NotebookPen className="size-3.5" aria-hidden="true" />
        {t("Reality Ledger")}
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
        {t(
          "Small proofs, recorded often, recalibrate belief faster than grand declarations."
        )}
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          maxLength={160}
          placeholder={t("Record one piece of evidence that your chosen line is real…")}
          aria-label={t("Reality Ledger")}
          className="focus-glow h-9 min-w-0 flex-1 rounded-lg border hairline bg-transparent px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label={t("Seal it")}
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-40"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-[12px] italic leading-relaxed text-muted-foreground/80">
          {t("No entries yet — the first proof tends to hide in an ordinary hour.")}
        </p>
      ) : (
        <ul className="nice-scroll mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
          {entries.map((e) => (
            <li
              key={e.id}
              className="group flex items-start gap-2.5 rounded-lg border hairline px-3 py-2"
            >
              <span
                className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                style={{ background: "var(--scope-a)" }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] leading-relaxed text-foreground/85">
                  {e.text}
                </span>
                <span className="mono-label mt-0.5 block text-[7.5px] text-muted-foreground/60">
                  {e.date}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(e.id)}
                aria-label={t("Release this entry")}
                className="focus-glow mt-0.5 shrink-0 text-muted-foreground/50 opacity-0 transition-all duration-200 hover:text-foreground group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ToolsTab() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <BeliefReframer />
        <VibrationBridge />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <DailyProtocolCard />
        <RealityLedger />
      </div>
    </div>
  );
}

/* ---------------- the OS shell ---------------- */

export function MirrorOS() {
  const exitMirrorOS = useMirror((s) => s.exitMirrorOS);
  const [tab, setTab] = useState<OsTab>("formulas");
  const t = useT();

  return (
    <div className="scope-manifesting relative flex h-full flex-col">
      {/* ---------- top bar with the single bridge back to the app ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
          <button
            type="button"
            onClick={exitMirrorOS}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          <div className="min-w-0 text-center">
            <h1 className="title-gradient truncate text-[14px] font-semibold tracking-[0.12em] sm:text-[16px]">
              MIRROR OS
            </h1>
            <p className="mono-label mt-0.5 truncate text-[8px] text-muted-foreground/80 sm:text-[9px]">
              {t("Reality Guidance · an independent workspace")}
            </p>
          </div>

          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline"
            aria-hidden="true"
          >
            <Sparkles className="size-4 text-[var(--gd)]" />
          </span>
        </div>
      </header>

      {/* ---------- scrollable OS body ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[880px] px-4 pb-12 sm:px-6">
          {/* hero */}
          <div className="relative pt-9 text-center sm:pt-12">
            <p
              className="mono-label text-[9px]"
              style={{ color: "var(--scope-a)" }}
            >
              MIRROR OS · {t("Reality Guidance")}
            </p>
            <h2 className="scope-gradient-text mx-auto mt-3 max-w-[560px] text-[26px] font-semibold leading-tight sm:text-[32px]">
              {t("Refine Reality")}
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[13.5px] leading-relaxed text-muted-foreground">
              {t(
                "An independent operating system for the reflective mind — formulas that shift the line you live on, contact with the Higher Mind that holds the view, and tools that keep manifestation honest."
              )}
            </p>
          </div>

          {/* tabs */}
          <div
            className="sticky top-0 z-20 -mx-4 mt-7 border-b hairline bg-[color-mix(in_srgb,var(--background)_86%,transparent)] px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6"
            role="tablist"
            aria-label={t("Mirror OS chambers")}
          >
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar sm:justify-center">
              {OS_TABS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(id)}
                    className={cn(
                      "focus-glow flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] transition-all duration-300 sm:px-4",
                      active
                        ? "animate-pill-breathe border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] font-semibold text-foreground"
                        : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {t(label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* chambers */}
          <div className="mt-7">
            {tab === "formulas" && (
              <motion.div
                key="formulas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-4"
                role="tabpanel"
              >
                <p className="mx-auto max-w-[560px] text-center text-[12.5px] leading-relaxed text-muted-foreground">
                  {t(
                    "Six complete formulas for shifting the line you live on. Open one, walk it slowly, and let the field do the arithmetic."
                  )}
                </p>
                {shiftFormulas.map((f, i) => (
                  <FormulaCard key={f.id} index={i} formulaId={f.id} />
                ))}
              </motion.div>
            )}

            {tab === "higher" && (
              <motion.div
                key="higher"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                role="tabpanel"
              >
                <HigherMindTab />
              </motion.div>
            )}

            {tab === "tools" && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                role="tabpanel"
              >
                <ToolsTab />
              </motion.div>
            )}

            {tab === "forge" && (
              <motion.div
                key="forge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                role="tabpanel"
              >
                <MirrorOSForge />
              </motion.div>
            )}
          </div>

          <p className="mono-label mt-10 text-center text-[8px] text-muted-foreground/50">
            {t("MIRROR OS runs independently of every other chamber · Free will honored always")}
          </p>
        </div>
      </main>
    </div>
  );
}
