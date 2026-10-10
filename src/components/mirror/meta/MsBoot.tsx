"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  Database,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { useMetaScience } from "@/lib/meta-science-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the boot sequence. The laboratory calibrates for    */
/*  about three seconds: five named steps, one rising progress bar,    */
/*  then the world fades in.                                           */
/* ------------------------------------------------------------------ */

const BOOT_STEPS = [
  { icon: Cpu, key: "Calibrating quantum substrate" },
  { icon: Database, key: "Loading entity knowledge cores" },
  { icon: Radio, key: "Establishing mirror channels" },
  { icon: ShieldCheck, key: "Verifying integrity shields" },
  { icon: Activity, key: "Synchronizing lab telemetry" },
];

export function MsBoot() {
  const t = useT();
  const bootProgress = useMetaScience((s) => s.bootProgress);
  const setBootProgress = useMetaScience((s) => s.setBootProgress);
  const setBooted = useMetaScience((s) => s.setBooted);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const id = window.setInterval(() => {
      setBootProgress(
        Math.min(100, useMetaScience.getState().bootProgress + 3 + Math.random() * 7)
      );
    }, 90);
    return () => window.clearInterval(id);
  }, [setBootProgress]);

  useEffect(() => {
    if (bootProgress >= 100) {
      const id = window.setTimeout(() => setBooted(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [bootProgress, setBooted]);

  const activeStep = Math.min(
    BOOT_STEPS.length - 1,
    Math.floor((bootProgress / 100) * BOOT_STEPS.length)
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6 ms-world"
      data-testid="ms-boot"
    >
      <div className="ms-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      {/* rotating dual rings */}
      <div className="relative mb-8 size-24" aria-hidden="true">
        <div className="ms-spin-slow absolute inset-0 rounded-full border-2 border-cyan-400/30" />
        <div
          className="ms-spin-slower absolute inset-2 rounded-full border border-fuchsia-400/30"
          style={{ animationDirection: "reverse" }}
        />
        <div
          className="ms-pulse absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300"
          style={{ boxShadow: "0 0 20px #22d3ee" }}
        />
      </div>

      <h1 className="ms-font-display text-3xl font-bold tracking-[0.18em] text-white">
        NEXUS
      </h1>
      <p className="ms-font-display mt-1 text-[11px] uppercase tracking-[0.35em] text-white/40">
        Discovery Lab
      </p>

      {/* the five steps */}
      <ul className="mt-8 w-full max-w-sm space-y-2.5">
        {BOOT_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < activeStep || bootProgress >= 100;
          const active = i === activeStep && bootProgress < 100;
          return (
            <li
              key={step.key}
              className="flex items-center gap-3 text-[13px]"
              aria-current={active ? "step" : undefined}
            >
              <Icon
                className={`size-4 shrink-0 ${
                  done
                    ? "text-emerald-400"
                    : active
                      ? "text-cyan-300"
                      : "text-white/30"
                }`}
                aria-hidden="true"
              />
              <span
                className={`flex-1 ${
                  done
                    ? "text-white/70"
                    : active
                      ? "text-white/90"
                      : "text-white/35"
                }`}
              >
                {t(step.key)}
              </span>
              {done ? (
                <span className="ms-font-display rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-emerald-300">
                  ok
                </span>
              ) : active ? (
                <span className="ms-font-display ms-pulse rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-cyan-300">
                  …
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* progress */}
      <div className="mt-8 w-full max-w-sm" role="progressbar" aria-valuenow={Math.floor(bootProgress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${bootProgress}%`,
              background: "linear-gradient(90deg, #22d3ee, #d946ef, #10b981)",
            }}
          />
        </div>
        <p className="ms-font-display mt-2 text-right text-[10px] tabular-nums text-white/45">
          {Math.floor(bootProgress)}%
        </p>
      </div>
    </motion.div>
  );
}
