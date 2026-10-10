"use client";

import { motion } from "framer-motion";
import { Activity, FlaskConical, X } from "lucide-react";
import { modeContext } from "@/lib/data/metaphysics";
import { useMirror } from "@/lib/mirror-store";
import { useMetaScience } from "@/lib/meta-science-store";
import { useHealScope } from "@/lib/heal-scope-store";
import { useT } from "@/lib/i18n";
import { scopeThemeFor } from "@/lib/scope-theme";
import { cn } from "@/lib/utils";
import { QuestionCards } from "../QuestionCards";

/* ------------------------------------------------------------------ */
/*  THE CHAT-ONLY SCOPE WELCOME — Meta Science and Heal Evolution are  */
/*  only a chat: no hub, no boards, no pages. When their channel is    */
/*  quiet, this welcome stands in the thread — the scope's own name    */
/*  in its own light, its spirit line, and the shared suggestion       */
/*  field. Choosing an entry in the register at the side TUNES the     */
/*  channel to that specialty; the conversation itself is the lab.     */
/* ------------------------------------------------------------------ */

/** Each laboratory's own light for the welcome title. */
const SCOPE_GRADIENT: Record<"metascience" | "healevolution", string> = {
  metascience: "linear-gradient(100deg, #22d3ee, #d946ef 48%, #10b981)",
  healevolution: "linear-gradient(100deg, #00ff88, #00b4d8 55%, #a855f7)",
};

export function ScopeChannelWelcome() {
  const activeMode = useMirror((s) => s.activeMode);
  const tune = useMirror((s) => s.sessions[s.activeMode].tune);
  const tuneChannel = useMirror((s) => s.tuneChannel);
  const closeEntity = useMetaScience((s) => s.closeEntity);
  const closeCategory = useHealScope((s) => s.closeCategory);
  const t = useT();

  const theme = scopeThemeFor(activeMode);
  const isMeta = activeMode === "metascience";
  const ScopeGlyph = isMeta ? FlaskConical : Activity;

  const untune = () => {
    if (isMeta) closeEntity();
    else closeCategory();
    tuneChannel(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t(theme.label)}
      data-testid="scope-welcome"
      data-scope={theme.id}
      className={cn("scope-" + activeMode, "pb-2 pt-5 sm:pt-7")}
    >
      {/* ---------- the scope's own hero ---------- */}
      <div className="scope-frame-card relative overflow-hidden rounded-2xl glass px-6 py-9 text-center sm:px-10">
        <span className="scope-corner scope-corner-tl" aria-hidden="true" />
        <span className="scope-corner scope-corner-tr" aria-hidden="true" />
        <span className="scope-corner scope-corner-bl" aria-hidden="true" />
        <span className="scope-corner scope-corner-br" aria-hidden="true" />
        <div
          className="animate-line-breathe h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--scope) 30%, color-mix(in srgb, var(--scope) 55%, white) 70%, transparent)",
          }}
          aria-hidden="true"
        />

        <div className="mt-6 flex justify-center">
          <span
            className="flex size-11 items-center justify-center rounded-full border"
            style={{
              borderColor: "color-mix(in srgb, var(--scope) 40%, transparent)",
              background:
                "color-mix(in srgb, var(--scope) 12%, transparent)",
              boxShadow:
                "0 0 24px -8px color-mix(in srgb, var(--scope) 60%, transparent)",
            }}
            aria-hidden="true"
          >
            <ScopeGlyph
              className="size-5"
              style={{ color: "var(--scope)" }}
            />
          </span>
        </div>

        <h2
          data-testid="scope-welcome-title"
          className="mx-auto mt-5 bg-clip-text text-3xl font-bold tracking-[0.08em] text-transparent sm:text-[42px]"
          style={{ backgroundImage: SCOPE_GRADIENT[activeMode] }}
        >
          {t(theme.label).toUpperCase()}
        </h2>

        <p className="mono-label mt-3 text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground/75">
          {t(modeContext[activeMode] ?? "")}
        </p>

        <p className="mx-auto mt-4 max-w-[480px] text-[14.5px] leading-relaxed text-muted-foreground">
          {activeMode === "metascience"
            ? t(
                "One channel, twelve minds — choose a mirror entity from the register and this chat tunes to it; then speak, and the deeper laboratory answers."
              )
            : t(
                "One channel, twelve disciplines — choose one from the register and this chat tunes to its field; then speak, and the evolution laboratory answers."
              )}
        </p>

        {/* the tuning state — the register's choice, worn openly */}
        {tune && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-6 flex justify-center"
          >
            <button
              type="button"
              onClick={untune}
              data-testid="scope-welcome-untune"
              aria-label={t("Untune the channel")}
              title={t("Untune the channel")}
              className="focus-glow group flex h-9 items-center gap-2 rounded-full border px-4 text-[12.5px] font-medium transition-all duration-300 hover:-translate-y-px"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope) 40%, transparent)",
                background:
                  "color-mix(in srgb, var(--scope) 10%, transparent)",
                color: "color-mix(in srgb, var(--scope) 72%, var(--foreground))",
              }}
            >
              <span
                className="block size-1.5 rotate-45"
                style={{ background: "var(--scope)" }}
                aria-hidden="true"
              />
              <span className="max-w-[240px] truncate">
                {t("Tuned to {tune}", { tune })}
              </span>
              <X
                className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </button>
          </motion.div>
        )}

        <div className="mt-7" aria-hidden="true">
          <div
            className="animate-line-breathe mx-auto h-px w-2/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope) 45%, transparent), transparent)",
            }}
          />
        </div>
      </div>

      {/* the shared suggestion field — wearing this scope's light */}
      <QuestionCards />
    </motion.section>
  );
}
