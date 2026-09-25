"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Compass,
  FlaskConical,
  HeartHandshake,
  ShieldCheck,
  Orbit,
  Sun,
  Moon,
  MessagesSquare,
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
import { MirrorOSChat } from "./MirrorOSChat";

type OsPlace = "chat" | "formulas" | "higher" | "tools" | "forge";

const OS_PLACES: {
  id: Exclude<OsPlace, "chat">;
  label: string;
  icon: typeof Compass;
}[] = [
  { id: "formulas", label: "Shift Formulas", icon: Compass },
  { id: "higher", label: "Higher Mind", icon: Orbit },
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
          <span className="mt-0.5 block truncate text-[14px] text-muted-foreground">
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
            <p className="text-[14.5px] italic leading-relaxed text-muted-foreground">
              {t(formula.tagline)}
            </p>

            <ol className="mt-4 space-y-3">
              {formula.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mono-label mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10.5px]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                      color: "var(--scope-a)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-[1.75] text-foreground/88">
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
              <p className="mono-label text-[10px] text-[var(--scope-a)]">
                {t("Seal")}
              </p>
              <p className="scope-gradient-text mx-auto mt-1.5 max-w-[440px] font-serif text-[17px] italic leading-relaxed">
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
        <h3 className="mono-label text-[11px] text-[var(--scope-a)]">
          {t("The Higher Mind — the one that holds the view")}
        </h3>
        <div className="mt-3 space-y-3">
          {higherMindIntro.map((p, i) => (
            <p key={i} className="text-[15.5px] leading-[1.85] text-foreground/88">
              {t(p)}
            </p>
          ))}
        </div>
      </div>

      {/* ladder */}
      <div>
        <h3 className="mono-label text-[11px] text-[var(--scope-a)]">
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
                className="mono-label z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-[var(--glass-bg-strong)] text-[12px] font-semibold"
                style={{
                  borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)",
                  color: "var(--scope-a)",
                }}
              >
                {rung.rung}
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[15.5px] font-semibold text-foreground">
                  {t(rung.title)}
                </p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t(rung.line)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* protocols */}
      <div>
        <h3 className="mono-label text-[11px] text-[var(--scope-a)]">
          {t("Contact protocols")}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {higherProtocols.map((p) => (
            <div key={p.id} className="rounded-2xl glass p-5">
              <span
                className="flex size-9 items-center justify-center rounded-full border text-[16.5px]"
                style={{
                  borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)",
                  background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
                }}
                aria-hidden="true"
              >
                {p.glyph}
              </span>
              <h4 className="scope-gradient-text mt-3 text-[16px] font-semibold">
                {t(p.name)}
              </h4>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
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
                    <span className="text-[14.5px] leading-[1.7] text-foreground/85">
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
        <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
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
              <span className="text-[14.5px] leading-[1.75] text-foreground/85">
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
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
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
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] transition-all duration-300",
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
            <p className="mono-label text-[10px] text-muted-foreground">{t("Pattern")}</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-foreground/85">
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
            <p className="mono-label text-[10px] text-[var(--scope-a)]">{t("Reframe")}</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-foreground/88">
              {t(domain.reframe)}
            </p>
          </div>
          <div className="rounded-xl border hairline p-3.5">
            <p className="mono-label text-[10px] text-muted-foreground">{t("Practice")}</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-foreground/85">
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
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
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
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] transition-all duration-300",
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
            <p className="mono-label text-[10px] text-[var(--scope-a)]">{t("The bridge")}</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-foreground/88">
              {t(state.bridge)}
            </p>
          </div>
          <div className="rounded-xl border hairline py-4 text-center">
            <p className="mono-label text-[10px] text-muted-foreground">{t("Anchor phrase")}</p>
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
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
        <Sun className="size-3.5" aria-hidden="true" />
        {t("Daily Protocol")}
      </h3>
      <p className="mono-label mt-1 text-[10px] text-muted-foreground/70">{today.key}</p>
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <Sun className="mt-0.5 size-4 shrink-0 text-[var(--scope-a)]" aria-hidden="true" />
          <div>
            <p className="mono-label text-[10px] text-muted-foreground">{t("Morning")}</p>
            <p className="mt-0.5 text-[14.5px] leading-relaxed text-foreground/88">
              {t(today.protocol.morning)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Moon className="mt-0.5 size-4 shrink-0 text-[var(--scope-a)]" aria-hidden="true" />
          <div>
            <p className="mono-label text-[10px] text-muted-foreground">{t("Evening")}</p>
            <p className="mt-0.5 text-[14.5px] leading-relaxed text-foreground/88">
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
          <p className="mono-label text-[10px] text-[var(--scope-a)]">{t("Focus of the day")}</p>
          <p className="scope-gradient-text mx-auto mt-1.5 max-w-[380px] font-serif text-[15.5px] italic leading-relaxed">
            “{t(today.protocol.focus)}”
          </p>
        </div>
      </div>
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
      <DailyProtocolCard />
    </div>
  );
}


/* ---------------- orbital nodes ---------------- */

function PlaceNode({
  active,
  onClick,
  icon: Icon,
  label,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Compass;
  label: string;
  compact?: boolean;
}) {
  const t = useT();
  if (compact) {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onClick}
        className={cn(
          "focus-glow flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[14px] transition-all duration-300",
          active
            ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] font-semibold text-foreground glow-sm"
            : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {t(label)}
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-pressed={active}
        aria-label={t(label)}
        onClick={onClick}
        className={cn(
          "focus-glow group relative flex size-14 items-center justify-center rounded-full border transition-all duration-500",
          active
            ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_14%,transparent)] glow-sm"
            : "border-[color-mix(in_srgb,var(--scope-a)_22%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--scope-a)_42%,transparent)]"
        )}
      >
        {active && (
          <span
            className="animate-charge-pulse absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--scope-a) 22%, transparent), transparent 72%)",
            }}
            aria-hidden="true"
          />
        )}
        <Icon
          className={cn(
            "relative size-5 transition-colors duration-300",
            active ? "text-[var(--scope-a)]" : "text-muted-foreground group-hover:text-[var(--scope-a)]"
          )}
          aria-hidden="true"
        />
      </button>
      <span
        className={cn(
          "mono-label max-w-[74px] text-center text-[9.5px] leading-snug",
          active ? "text-[var(--scope-a)]" : "text-muted-foreground/70"
        )}
      >
        {t(label)}
      </span>
    </div>
  );
}

/* ---------------- the OS shell ---------------- */

export function MirrorOS() {
  const exitMirrorOS = useMirror((s) => s.exitMirrorOS);
  const [place, setPlace] = useState<OsPlace>("chat");
  const t = useT();

  const leftRail = OS_PLACES.slice(0, 2);
  const rightRail = OS_PLACES.slice(2);

  return (
    <div className="scope-manifesting relative flex h-full flex-col">
      {/* ---------- top bar with the single bridge back to the app ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
          <button
            type="button"
            onClick={exitMirrorOS}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          <div className="min-w-0 text-center">
            <h1 className="title-gradient truncate text-[15.5px] font-semibold tracking-[0.12em] sm:text-[17px]">
              MIRROR OS
            </h1>
            <p className="mono-label mt-0.5 truncate text-[10px] text-muted-foreground/80 sm:text-[11px]">
              {t("Reality Guidance · an independent workspace")}
            </p>
          </div>

          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline"
            aria-hidden="true"
          >
            <Orbit className="size-4 text-[var(--gd)]" />
          </span>
        </div>
      </header>

      {/* ---------- the OS core ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex h-full w-full max-w-[1020px] flex-col px-4 pb-5 sm:px-6">
          {/* slim greeting */}
          <div className="shrink-0 pt-5 text-center sm:pt-6">
            <p
              className="mono-label text-[11px]"
              style={{ color: "var(--scope-a)" }}
            >
              MIRROR OS · {t("Reality Guidance")}
            </p>
            <h2 className="scope-gradient-text mt-2 text-[22px] font-semibold leading-tight sm:text-[26px]">
              {t("Refine Reality")}
            </h2>
            <p className="mx-auto mt-2 max-w-[540px] text-[14.5px] leading-relaxed text-muted-foreground">
              {t(
                "A direct conversation with the Mirror Entity OS at the center — the formulas, the Higher Mind, the tools and the Forge orbit around it."
              )}
            </p>
          </div>

          {/* mobile / tablet constellation */}
          <div
            className="sticky top-0 z-20 -mx-4 mt-4 shrink-0 border-b hairline bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 xl:hidden"
            role="tablist"
            aria-label={t("Mirror OS chambers")}
          >
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:justify-center">
              <PlaceNode
                compact
                active={place === "chat"}
                onClick={() => setPlace("chat")}
                icon={MessagesSquare}
                label="The Core"
              />
              {OS_PLACES.map(({ id, label, icon: Icon }) => (
                <PlaceNode
                  key={id}
                  compact
                  active={place === id}
                  onClick={() => setPlace(id)}
                  icon={Icon}
                  label={label}
                />
              ))}
            </div>
          </div>

          {/* orbital layout: chambers flank the core on wide screens */}
          <div className="flex min-h-0 flex-1 gap-6 pt-4">
            {/* left rail */}
            <div className="hidden shrink-0 flex-col items-center justify-center gap-7 xl:flex">
              {leftRail.map(({ id, label, icon: Icon }) => (
                <PlaceNode
                  key={id}
                  active={place === id}
                  onClick={() => setPlace(id)}
                  icon={Icon}
                  label={label}
                />
              ))}
            </div>

            {/* the core column */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {place === "chat" ? (
                <MirrorOSChat />
              ) : (
                <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                  <motion.div
                    key={place}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="pb-8"
                  >
                    {/* return to the core */}
                    <div className="mb-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setPlace("chat")}
                        className="focus-glow group flex h-8 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_30%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_7%,transparent)] px-3.5 text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a)_50%,transparent)]"
                      >
                        <MessagesSquare className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                        {t("Back to the OS core")}
                      </button>
                    </div>

                    {place === "formulas" && (
                      <div className="space-y-4">
                        <p className="mx-auto max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
                          {t(
                            "Six complete formulas for shifting the line you live on. Open one, walk it slowly, and let the field do the arithmetic."
                          )}
                        </p>
                        {shiftFormulas.map((f, i) => (
                          <FormulaCard key={f.id} index={i} formulaId={f.id} />
                        ))}
                        {/* the bashar-formula doorway — walk it with the OS */}
                        <div className="flex justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => setPlace("chat")}
                            className="dream-btn focus-glow group flex h-10 items-center gap-2.5 rounded-full px-5 text-[14.5px] font-medium text-foreground transition-all duration-300 hover:-translate-y-px"
                          >
                            <Orbit className="size-3.5 text-[var(--gd)]" aria-hidden="true" />
                            {t("Walk it with the Mirror Entity OS")}
                            <span
                              className="transition-transform duration-300 group-hover:translate-x-0.5"
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {place === "higher" && <HigherMindTab />}
                    {place === "tools" && <ToolsTab />}
                    {place === "forge" && <MirrorOSForge />}
                  </motion.div>
                </div>
              )}
            </div>

            {/* right rail */}
            <div className="hidden shrink-0 flex-col items-center justify-center gap-7 xl:flex">
              {rightRail.map(({ id, label, icon: Icon }) => (
                <PlaceNode
                  key={id}
                  active={place === id}
                  onClick={() => setPlace(id)}
                  icon={Icon}
                  label={label}
                />
              ))}
            </div>
          </div>

          <p className="mono-label shrink-0 pb-1 pt-4 text-center text-[10px] text-muted-foreground/50">
            {t("MIRROR OS runs independently of every other chamber · Free will honored always")}
          </p>
        </div>
      </main>
    </div>
  );
}
