"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FlaskConical,
  Gift,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { labFrequencies } from "@/lib/data/science";
import { giftLines } from "@/lib/data/science";
import { sectionImage } from "@/lib/entity-utils";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

/* ---------------- sigil forge (deterministic per intention) ---------------- */

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function SigilForIntent({ text, size = 120 }: { text: string; size?: number }) {
  const svg = useMemo(() => {
    const h = hash32(text.trim() || "mirror");
    const rnd = mulberry32(h);
    const c = 60;
    const sides = 3 + Math.floor(rnd() * 6);
    const rot = rnd() * 360;
    const r2 = 34 + rnd() * 10;
    const dash = `${5 + rnd() * 14} ${3 + rnd() * 9}`;
    const pts: string[] = [];
    for (let i = 0; i < sides; i++) {
      const a = ((rot + (360 / sides) * i) * Math.PI) / 180;
      pts.push(`${(c + r2 * Math.cos(a)).toFixed(1)},${(c + r2 * Math.sin(a)).toFixed(1)}`);
    }
    const spokes = 5 + Math.floor(rnd() * 6);
    const lines: string[] = [];
    for (let i = 0; i < spokes; i++) {
      const a = ((rot + 12 + (360 / spokes) * i) * Math.PI) / 180;
      lines.push(
        `<line x1="${(c + 16 * Math.cos(a)).toFixed(1)}" y1="${(c + 16 * Math.sin(a)).toFixed(1)}" x2="${(c + 47 * Math.cos(a)).toFixed(1)}" y2="${(c + 47 * Math.sin(a)).toFixed(1)}" stroke="rgba(246,198,107,0.5)" stroke-width="1"/>`
      );
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(246,198,107,0.55)" stroke-width="1.4"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(246,198,107,0.35)" stroke-width="1" stroke-dasharray="${dash}"/>
      <polygon points="${pts.join(" ")}" fill="none" stroke="rgba(246,198,107,0.65)" stroke-width="1.2"/>
      ${lines.join("")}
      <circle cx="60" cy="60" r="3.2" fill="rgba(246,198,107,0.9)"/>
    </svg>`;
  }, [text, size]);

  return (
    <span
      aria-hidden="true"
      className="inline-block"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/* ---------------- chamber orb ---------------- */

function ChargingOrb({ progress, stage }: { progress: number; stage: string }) {
  const R = 86;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.round(progress);

  return (
    <div className="relative mx-auto size-[220px] sm:size-[240px]" aria-hidden="true">
      {/* slow outer halo rings */}
      <div
        className="scope-halo absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)" }}
      />
      <div
        className="scope-halo-rev absolute inset-4 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--scope-b) 35%, transparent)" }}
      />

      {/* progress ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 220 220">
        <circle
          cx="110" cy="110" r={R}
          fill="none"
          stroke="color-mix(in srgb, var(--scope-a) 16%, transparent)"
          strokeWidth="3"
        />
        <circle
          cx="110" cy="110" r={R}
          fill="none"
          stroke="var(--scope-a)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress / 100)}
          style={{
            transition: "stroke-dashoffset 160ms linear",
            filter: "drop-shadow(0 0 6px var(--scope-a))",
          }}
        />
      </svg>

      {/* chamber image core */}
      <div className="absolute inset-[38px] overflow-hidden rounded-full">
        { }
        <img
          src={sectionImage("lab-orb")}
          alt=""
          className={cn(
            "size-full object-cover transition-all duration-700",
            stage === "charging" && "animate-charge-pulse",
            stage === "blueprint" && "brightness-125 saturate-125"
          )}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 38% 30%, color-mix(in srgb, var(--scope-a) 30%, transparent), transparent 70%)",
          }}
        />
      </div>

      {stage === "charging" && (
        <span
          className="mono-label absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-semibold"
          style={{ color: "var(--scope-a)" }}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}

/* ---------------- blueprint card ---------------- */

function BlueprintCard() {
  const blueprint = useMirror((s) => s.labBlueprint);
  const askMirror = useMirror((s) => s.askMirror);
  const resetLabDraft = useMirror((s) => s.resetLabDraft);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const labIntensity = useMirror((s) => s.labIntensity);
  const t = useT();

  if (!blueprint) return null;

  const discuss = () => {
    void askMirror(
      t(
        "I have just charged an intention called \"{title}\" in the manifesting laboratory. How can I best hold and act on it?",
        { title: blueprint.title }
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-8 overflow-hidden rounded-2xl scope-frame-card"
    >
      {/* backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${sectionImage("lab-sigil")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 20%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      />
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />

      <div className="relative px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-center gap-2">
          <SigilForIntent text={blueprint.title} size={40} />
          <div className="text-center">
            <p className="mono-label text-[8.5px] text-muted-foreground">
              {t("Manifestation blueprint")}
            </p>
            <h3 className="scope-gradient-text text-[20px] font-semibold sm:text-[23px]">
              {blueprint.title}
            </h3>
          </div>
          <SigilForIntent text={blueprint.title} size={40} />
        </div>

        <div className="mx-auto mt-6 max-w-[640px] space-y-5">
          <section>
            <h4 className="mono-label text-[8.5px] text-[var(--scope-a)]">
              {t("Anchor this field state first")}
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-[1.8] text-foreground/88">
              {blueprint.field_state}
            </p>
          </section>

          <section className="rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_6%,transparent)] p-4">
            <h4 className="mono-label text-[8.5px] text-[var(--scope-a)]">
              {t("Visualization · three breaths")}
            </h4>
            <p className="mt-1.5 text-[13.5px] italic leading-[1.8] text-foreground/85">
              {blueprint.visualization}
            </p>
          </section>

          <section>
            <h4 className="mono-label text-[8.5px] text-[var(--scope-a)]">
              {t("Give it hands · three small actions")}
            </h4>
            <ol className="mt-2 space-y-2.5">
              {blueprint.micro_actions.map((a, i) => (
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
                  <span className="text-[13px] leading-relaxed text-foreground/85">{a}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="rounded-xl border hairline py-5 text-center">
            <h4 className="mono-label text-[8.5px] text-[var(--scope-a)]">{t("Seal it with")}</h4>
            <p className="scope-gradient-text mx-auto mt-2 max-w-[480px] font-serif text-[17px] italic leading-relaxed sm:text-[19px]">
              “{blueprint.affirmation}”
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border hairline p-3.5">
              <h4 className="mono-label text-[8px] text-muted-foreground">{t("Aligned window")}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/80">
                {blueprint.window}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--gd)]/25 bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
              <h4 className="mono-label text-[8px] text-[var(--gd)]">{t("Honest note")}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/80">
                {blueprint.caution}
              </p>
            </div>
          </div>
        </div>

        <p className="mono-label mt-6 text-center text-[8px] text-muted-foreground/60">
          {t("Chamber intensity {n}/10 · Free will honored always", {
            n: labIntensity,
          })}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={discuss}
            className="focus-glow flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium transition-all duration-300 hover:glow-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 10%, transparent)",
            }}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("Discuss in the Observatory")}
          </button>
          <button
            type="button"
            onClick={resetLabDraft}
            className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t("Charge a new intention")}
          </button>
          <button
            type="button"
            onClick={returnToObservatory}
            className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("Return to the Observatory")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- main lab ---------------- */

export function ManifestationLab() {
  const labStage = useMirror((s) => s.labStage);
  const labIntention = useMirror((s) => s.labIntention);
  const setLabIntention = useMirror((s) => s.setLabIntention);
  const labEmotion = useMirror((s) => s.labEmotion);
  const setLabEmotion = useMirror((s) => s.setLabEmotion);
  const labIntensity = useMirror((s) => s.labIntensity);
  const setLabIntensity = useMirror((s) => s.setLabIntensity);
  const labProgress = useMirror((s) => s.labProgress);
  const labError = useMirror((s) => s.labError);
  const chargeIntention = useMirror((s) => s.chargeIntention);
  const exitLab = useMirror((s) => s.exitLab);
  const t = useT();

  const [phase, setPhase] = useState(0);
  const phases = [
    "Sealing the chamber…",
    "Charging the sigil…",
    "Consulting the alchemical record…",
    "Drawing the blueprint…",
  ];

  useEffect(() => {
    if (labStage !== "charging") return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % phases.length),
      1900
    );
    return () => window.clearInterval(id);
     
  }, [labStage]);

  const canCharge = labIntention.trim().length >= 8 && labStage === "compose";

  const handleGift = () => {
    const line = giftLines[Math.floor(Math.random() * giftLines.length)];
    toast({
      title: t("✦ A gift from the stars"),
      description: t(line),
      duration: 7000,
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t("Reality Manifesting Laboratory")}
      className="scope-manifesting mx-auto w-full max-w-[880px] px-1 pb-8 pt-8 sm:pt-10"
    >
      {/* header */}
      <div className="relative overflow-hidden rounded-2xl scope-frame-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${sectionImage("lab-desk")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(180deg, black 0%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 90%)",
            mixBlendMode: "screen",
          }}
        />
        <div className="relative flex flex-col items-center gap-3 px-5 py-7 text-center sm:px-8">
          <div className="flex items-center gap-2">
            <FlaskConical
              className="size-3.5"
              style={{ color: "var(--scope-a)" }}
              aria-hidden="true"
            />
            <span className="mono-label text-[9px]" style={{ color: "var(--scope-a)" }}>
              {t("Reality Manifesting Laboratory")}
            </span>
          </div>
          <h2 className="scope-gradient-text text-[26px] font-semibold leading-tight sm:text-[32px]">
            {t("Refine Reality")}
          </h2>
          <p className="max-w-[560px] text-[13.5px] leading-relaxed text-muted-foreground">
            {t(
              "An advanced chamber where intentions are distilled into field states, small real-world actions and a sealed affirmation. The mirror reflects;"
            )}{" "}
            <span className="text-foreground/85">{t("you")}</span> {t("create.")}
          </p>
        </div>
      </div>

      {/* compose grid */}
      {labStage !== "blueprint" && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* composer */}
          <div className="rounded-2xl glass p-5 sm:p-6">
            <label
              htmlFor="lab-intention"
              className="mono-label text-[8.5px] text-[var(--scope-a)]"
            >
              {t("Intention · what do you choose to create?")}
            </label>
            <textarea
              id="lab-intention"
              value={labIntention}
              onChange={(e) => setLabIntention(e.target.value)}
              placeholder={t("Speak it plainly — the chamber understands plain words best…")}
              rows={3}
              maxLength={400}
              className="focus-glow mt-2 w-full resize-none rounded-xl border hairline bg-transparent px-3.5 py-3 text-[13.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            />
            <p className="mono-label mt-1.5 text-right text-[8px] text-muted-foreground/60">
              {labIntention.length}/400
            </p>

            <h3 className="mono-label mt-4 text-[8.5px] text-[var(--scope-a)]">
              {t("Emotional frequency · the carrier wave")}
            </h3>
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label={t("Emotional frequency")}
            >
              {labFrequencies.map((f) => {
                const active = f.id === labEmotion;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={t(f.hint)}
                    onClick={() => setLabEmotion(f.id)}
                    className={cn(
                      "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
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
                    <span aria-hidden="true">{f.glyph}</span>
                    {t(f.label)}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <h3 className="mono-label shrink-0 text-[8.5px] text-[var(--scope-a)]">
                {t("Chamber intensity")}
              </h3>
              <span
                className="mono-label shrink-0 rounded-full border px-2 py-0.5 text-[9px]"
                style={{
                  borderColor: "color-mix(in srgb, var(--scope-a) 35%, transparent)",
                  color: "var(--scope-a)",
                }}
              >
                {labIntensity}/10
              </span>
            </div>
            <Slider
              value={[labIntensity]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => setLabIntensity(v[0] ?? 6)}
              aria-label={t("Chamber intensity")}
              className="mt-2.5 [&_[data-slot=slider-range]]:bg-[var(--scope-a)] [&_[data-slot=slider-thumb]]:border-[var(--scope-a)]"
            />

            {labError && (
              <p className="mt-4 rounded-lg border border-[var(--destructive)]/30 bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-3 py-2 text-[12px] text-foreground/85">
                {t(labError)}
              </p>
            )}

            <button
              type="button"
              disabled={!canCharge}
              onClick={() => void chargeIntention()}
              className={cn(
                "focus-glow mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-all duration-300",
                canCharge
                  ? "hover:glow-sm"
                  : "cursor-not-allowed opacity-45"
              )}
              style={{
                borderColor: "color-mix(in srgb, var(--scope-a) 50%, transparent)",
                background:
                  "linear-gradient(120deg, color-mix(in srgb, var(--scope-a) 16%, transparent), color-mix(in srgb, var(--scope-b) 14%, transparent))",
              }}
            >
              <Zap className="size-4" aria-hidden="true" />
              {t("Charge the Chamber")}
            </button>
            <p className="mt-2 text-center text-[10.5px] leading-relaxed text-muted-foreground/70">
              {t(
                "Min. 8 characters · The chamber never promises outcomes — it sharpens alignment."
              )}
            </p>
          </div>

          {/* chamber column */}
          <div className="rounded-2xl glass p-5 sm:p-6">
            <h3 className="mono-label text-center text-[8.5px] text-[var(--scope-a)]">
              {labStage === "charging" ? t("Charging…") : t("Chamber")}
            </h3>
            <div className="mt-4">
              <ChargingOrb
                progress={labStage === "charging" ? labProgress : labStage === "blueprint" ? 100 : 0}
                stage={labStage}
              />
            </div>
            {labStage === "charging" ? (
              <div className="mt-5 text-center" aria-live="polite">
                <p className="mono-label text-[8.5px] text-muted-foreground">
                  {t(phases[phase])}
                </p>
                <div className="mx-auto mt-3 h-1 w-3/4 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)]">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${labProgress}%`,
                      background:
                        "linear-gradient(90deg, var(--scope-a), var(--scope-b))",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 text-center">
                <p className="mono-label text-[8px] text-muted-foreground/70">
                  {t("Sigil forge")}
                </p>
                <div className="mt-2 flex justify-center">
                  <SigilForIntent text={labIntention} size={104} />
                </div>
                <p className="mt-2 text-[10.5px] italic leading-relaxed text-muted-foreground/70">
                  {labIntention.trim()
                    ? t("Your sigil, awaiting charge.")
                    : t("Your sigil will take shape as you write.")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* blueprint */}
      {labStage === "blueprint" && <BlueprintCard />}

      {/* footer */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={exitLab}
          className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          {t("Return to the Observatory")}
        </button>
        <button
          type="button"
          onClick={handleGift}
          className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <Gift className="size-3.5" aria-hidden="true" />
          {t("A gift from the stars")}
        </button>
      </div>

      <p className="mono-label mt-5 text-center text-[8px] text-muted-foreground/60">
        {t(
          "Manifesting complements action · it never replaces it · Free will honored always ❤️"
        )}
      </p>
    </motion.section>
  );
}
