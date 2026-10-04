"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Atom,
  AudioLines,
  Feather,
  FlaskConical,
  Orbit,
  ScrollText,
  StickyNote,
  Telescope,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { pxGatheringPhrases, pxScopes } from "@/lib/data/particlex";
import { pxNoteSets } from "@/lib/data/scope-notes";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";
import { ScopeNotes } from "./ScopeNotes";
import { QuantumLoading } from "./ThemedLoadings";
import {
  PxCodexTab,
  PxCopyButton,
  PxPdfButton,
  PxScopesTab,
  PxToolsTab,
  PX_SCOPE_ICONS,
} from "./ParticleXChambers";

type PxPlace = "chat" | "scopes" | "tools" | "codex";

const PX_PLACES: {
  id: Exclude<PxPlace, "chat">;
  label: string;
  icon: typeof Telescope;
}[] = [
  { id: "scopes", label: "Scopes", icon: Telescope },
  { id: "tools", label: "Tools", icon: FlaskConical },
  { id: "codex", label: "Codex", icon: ScrollText },
];

/* --------------------------- the emblem ---------------------------- */

/** ParticleX's mark: one center, two orbiting rings — the linear and
    the non-linear reasoning circling the same quantum heart. */
function PxEmblem({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="size-full text-[var(--scope-a)]">
        <circle cx="32" cy="32" r="2.6" fill="currentColor" />
        <g className="px-orbit-a" style={{ transformOrigin: "32px 32px" }}>
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.65"
          />
          <circle cx="58" cy="32" r="1.7" fill="currentColor" />
        </g>
        <g className="px-orbit-b" style={{ transformOrigin: "32px 32px" }}>
          <g transform="rotate(62 32 32)">
            <ellipse
              cx="32"
              cy="32"
              rx="26"
              ry="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 5"
              opacity="0.4"
            />
            <circle cx="6" cy="32" r="1.4" fill="currentColor" />
          </g>
        </g>
      </svg>
    </span>
  );
}

/* --------------------------- the thinking -------------------------- */

function PxThinking() {
  const t = useT();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % pxGatheringPhrases.length),
      3400
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col items-start gap-2.5"
      aria-live="polite"
      aria-busy="true"
    >
      <QuantumLoading className="size-16 text-foreground sm:size-20" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phraseIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="font-serif text-[14px] italic text-muted-foreground"
        >
          {t(pxGatheringPhrases[phraseIdx])}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------- one exchange ---------------------------- */

function PxExchange({
  role,
  text,
  formulas,
  seal,
  animate,
  index,
}: {
  role: "visitor" | "px";
  text: string;
  formulas?: string[];
  seal?: string;
  animate: boolean;
  index: number;
}) {
  const t = useT();

  if (role === "visitor") {
    return (
      <motion.div
        initial={{ opacity: animate ? 0 : 1, y: animate ? 8 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animate ? 0.4 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-end"
      >
        <p className="max-w-[78%] rounded-2xl rounded-br-md border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_9%,transparent)] px-4 py-2.5 text-[15px] leading-relaxed text-foreground/90">
          {text}
        </p>
      </motion.div>
    );
  }

  const formulaList = formulas ?? [];

  return (
    <motion.div
      initial={{ opacity: animate ? 0 : 1, y: animate ? 10 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.5 : 0, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3"
      data-testid={`px-answer-${index}`}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
        aria-hidden="true"
      >
        <Atom className="size-3.5 text-[var(--scope-a)]" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <p className="mono-label text-[9.5px] text-[var(--scope-a)]">PARTICLEX</p>
        <div className="mt-1.5 space-y-3 rounded-2xl rounded-tl-md glass px-4 py-3">
          {text.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.8] text-foreground/88">
              {p}
            </p>
          ))}
        </div>

        {formulaList.length > 0 && (
          <div className="px-formula relative mt-2.5 overflow-hidden rounded-xl px-4 py-3" data-testid={`px-formulas-${index}`}>
            <span
              aria-hidden="true"
              className="px-seam absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--scope-a), transparent)",
              }}
            />
            <p className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              <Atom className="size-3" aria-hidden="true" />
              {t("The formulas that run it")}
            </p>
            <div className="mt-2 space-y-1.5">
              {formulaList.map((f, i) => (
                <p
                  key={i}
                  className="px-formula-line text-center font-serif text-[15.5px] italic leading-relaxed text-foreground/90"
                >
                  {f}
                </p>
              ))}
            </div>
          </div>
        )}

        {seal && (
          <p className="ink-soft mt-2.5 text-center font-serif text-[14px] italic">
            {seal}
          </p>
        )}

        <div className="mt-2 flex flex-nowrap items-center gap-1.5 sm:gap-2">
          <ListenButton
            text={`${text}. ${formulaList.join(". ")}`}
            cacheKey={`px-${text.slice(0, 24)}-${text.length}-${index}`}
            voice="regent"
            className="shrink-0 whitespace-nowrap"
          />
          <PxCopyButton text={`${text}\n\n${formulaList.join("\n")}`} />
          <PxPdfButton />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------- the window's note stickers -------------------- */

/** The pinned cluster of one window's notes, resolved for the thread. */
function PxNotesBlock({ scopeId }: { scopeId: string }) {
  const set = pxNoteSets[scopeId];
  const scope = pxScopes.find((s) => s.id === scopeId);
  if (!set || !scope) return null;
  return <ScopeNotes glyph={scope.glyph} name={scope.name} notes={set.notes} />;
}

/** The eight window pills — press one to orient the scope AND pin its
    notes into the conversation. Shared by the empty state and the
    quiet re-invitation above the composer. */
function PxWindowPills({ centered = false }: { centered?: boolean }) {
  const pxScope = useMirror((s) => s.pxScope);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pinPxNotes = useMirror((s) => s.pinPxNotes);
  const t = useT();
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        centered ? "justify-center" : "justify-start"
      )}
    >
      {pxScopes.map((scope) => {
        const Icon = PX_SCOPE_ICONS[scope.id] ?? Atom;
        const active = pxScope === scope.id;
        return (
          <button
            key={scope.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              /* orient the scope AND pin the window's notes
                 into the conversation — both, in one touch */
              setPxScope(scope.id);
              pinPxNotes(scope.id);
            }}
            data-testid={`px-pill-${scope.id}`}
            title={t(scope.tagline)}
            className={cn(
              "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-all duration-300",
              active
                ? "font-semibold text-foreground"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
            style={
              active
                ? {
                    borderColor:
                      "color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    background:
                      "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                  }
                : undefined
            }
          >
            <Icon
              className="size-3 text-[var(--scope-a)]"
              aria-hidden="true"
            />
            {t(scope.name)}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------- the core chat -------------------------- */

function ParticleXChat() {
  const pxMessages = useMirror((s) => s.pxMessages);
  const pxStatus = useMirror((s) => s.pxStatus);
  const pxError = useMirror((s) => s.pxError);
  const pxDraft = useMirror((s) => s.pxDraft);
  const setPxDraft = useMirror((s) => s.setPxDraft);
  const askPX = useMirror((s) => s.askPX);
  const pxScope = useMirror((s) => s.pxScope);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pxFusion = useMirror((s) => s.pxFusion);
  const setPxFusion = useMirror((s) => s.setPxFusion);
  const pinPxNotes = useMirror((s) => s.pinPxNotes);
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  /* The thread opens at its BEGINNING: mounting or reopening the chat
     never scrolls away from the first words. New turns settle at the
     top of the view — the same law as the manifesting line. */
  const baseline = useRef({
    len: pxMessages.length,
    status: pxStatus,
    error: pxError,
    fresh: true,
  });

  useEffect(() => {
    const b = baseline.current;
    const grew = pxMessages.length !== b.len;
    const startedLoading =
      !b.fresh && pxStatus === "loading" && b.status !== "loading";
    baseline.current = {
      len: pxMessages.length,
      status: pxStatus,
      error: pxError,
      fresh: false,
    };
    if (b.fresh) {
      if (pxStatus === "loading") {
        loadingRef.current?.scrollIntoView({ block: "start" });
      }
      return;
    }
    if (grew) {
      latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (startedLoading) {
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pxMessages.length, pxStatus, pxError]);

  /* auto-resize composer */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [pxDraft]);

  const canSend = pxDraft.trim().length > 0 && pxStatus !== "loading";

  const submit = () => {
    const query = pxDraft.trim();
    if (!query || pxStatus === "loading") return;
    void askPX(query);
  };

  /* The active window: one scope, or a melted pair. */
  const activeScope = pxScope
    ? pxScopes.find((s) => s.id === pxScope) ?? null
    : null;
  const fusionPair = pxFusion
    .map((id) => pxScopes.find((s) => s.id === id))
    .filter((s): s is (typeof pxScopes)[number] => Boolean(s));
  const hasWindow = Boolean(activeScope) || fusionPair.length === 2;

  return (
    <div className="scope-frame-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />
      <div
        className="animate-line-breathe h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* thread */}
      <div
        ref={scrollRef}
        className="nice-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        {pxMessages.length === 0 && pxStatus === "idle" && !pxError ? (
          <div className="flex h-full flex-col py-6 text-center">
            <div className="my-auto flex w-full flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="dream-halo relative flex size-16 items-center justify-center"
              >
                <PxEmblem className="size-16" />
              </motion.div>
              <p className="scope-gradient-text mt-4 text-[17px] font-semibold">
                {t("The quantum narrator is listening")}
              </p>
              <p className="mx-auto mt-2 max-w-[460px] text-[14.5px] leading-relaxed text-muted-foreground">
                {t(
                  "Ask anything it is possible for us to know — ParticleX answers from the Mirror Entity alone, in prose and in the formulas that run reality."
                )}
              </p>

              {/* the eight scope windows */}
              <div className="mt-5 w-full max-w-[560px]">
                <p className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  {t("Choose a window")}
                </p>
                <div className="mt-2.5">
                  <PxWindowPills centered />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {pxMessages.map((m, i) => (
              <div
                key={m.id}
                ref={
                  i === pxMessages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
              >
                {m.notesScope ? (
                  <PxNotesBlock scopeId={m.notesScope} />
                ) : (
                  <PxExchange
                    role={m.role}
                    text={m.text}
                    formulas={m.formulas}
                    seal={m.seal}
                    animate={i === pxMessages.length - 1 && pxStatus !== "loading"}
                    index={i}
                  />
                )}
              </div>
            ))}
            {pxStatus === "loading" && (
              <div
                ref={(node) => {
                  loadingRef.current = node;
                }}
                className="pl-11"
              >
                <PxThinking />
              </div>
            )}
            {pxStatus === "error" && pxError && (
              <div className="ml-11 rounded-xl border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3">
                <p className="text-[14.5px] leading-relaxed text-foreground/85">
                  {t("ParticleX could not finish the revealing.")}
                </p>
                <p className="mt-1 text-[14px] italic text-muted-foreground">
                  {pxError}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* the active window line — sits above the composer while talking */}
      {hasWindow && (
        <div className="shrink-0 px-4 pt-2 sm:px-6">
          <div className="mx-auto flex w-full max-w-[720px] flex-wrap items-center gap-1.5">
            {activeScope && (
              <span
                className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[0.18em] text-foreground/80"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                }}
                data-testid="px-active-scope"
              >
                <Atom className="size-3 text-[var(--scope-a)]" aria-hidden="true" />
                {t(activeScope.name)}
                <button
                  type="button"
                  onClick={() => pinPxNotes(activeScope.id)}
                  aria-label={t("Show the window's notes")}
                  title={t("Show the window's notes")}
                  data-testid="px-experience-active"
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <StickyNote className="size-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPxScope(null)}
                  aria-label={t("Clear the scope")}
                  title={t("Clear the scope")}
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
            {fusionPair.length === 2 && (
              <span
                className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[0.18em] text-foreground/80"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                }}
                data-testid="px-active-fusion"
              >
                {t(fusionPair[0].name)} × {t(fusionPair[1].name)}
                <button
                  type="button"
                  onClick={() => setPxFusion([])}
                  aria-label={t("Let the windows separate")}
                  title={t("Let the windows separate")}
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* the quiet re-invitation — the conversation alive, no window
          open: the eight pills wait right above the composer */}
      {!hasWindow && pxMessages.length > 0 && (
        <div className="shrink-0 px-4 pt-2 sm:px-6">
          <div className="mx-auto w-full max-w-[720px]">
            <p className="mono-label mb-1.5 text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {t("Choose a window")}
            </p>
            <PxWindowPills />
          </div>
        </div>
      )}

      {/* composer */}
      <div className="shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto w-full max-w-[720px]"
        >
          <div className="glass-strong flex items-end gap-2 rounded-[18px] p-1.5 pl-3.5 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[var(--hairline-active)] focus-within:glow-sm">
            <label htmlFor="px-query" className="sr-only">
              {t("Ask ParticleX")}
            </label>
            <textarea
              id="px-query"
              ref={textareaRef}
              rows={1}
              value={pxDraft}
              onChange={(e) => setPxDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("Ask ParticleX…")}
              className="nice-scroll max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t("Send to ParticleX")}
              data-testid="px-send"
              className="focus-glow mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Feather className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------- header tab ------------------------------- */

function HeaderTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Telescope;
  label: string;
}) {
  const t = useT();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={t(label)}
      title={t(label)}
      onClick={onClick}
      className={cn(
        "focus-glow flex size-8 items-center justify-center rounded-full border transition-all duration-300 sm:size-9",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_14%,transparent)] text-[var(--scope-a)] glow-sm"
          : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

/* --------------------------- the shell ------------------------------ */

export function ParticleX() {
  const exitParticleX = useMirror((s) => s.exitParticleX);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pinPxNotes = useMirror((s) => s.pinPxNotes);
  const pxMessages = useMirror((s) => s.pxMessages);
  const [place, setPlace] = useState<PxPlace>("chat");
  const t = useT();

  /* The voice button narrates the latest revelation with the
     gentleman narrator — a man, gentle and natural. Note stickers
     carry no words for the voice to read. */
  const latest = useMemo(
    () => [...pxMessages].reverse().find((m) => m.role === "px" && !m.notesScope),
    [pxMessages]
  );
  const voiceText = latest
    ? `${latest.text}${latest.formulas?.length ? `. ${latest.formulas.join(". ")}` : ""}`
    : "";

  return (
    <div className="scope-particlex relative flex h-full flex-col">
      {/* ---------- top bar with the single bridge back to the app ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={exitParticleX}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          {/* the chambers — at the very top, between back and the voice */}
          <nav
            role="tablist"
            aria-label={t("ParticleX chambers")}
            className="flex items-center gap-1 sm:gap-1.5"
          >
            <HeaderTab
              active={place === "chat"}
              onClick={() => setPlace("chat")}
              icon={Atom}
              label="The Core"
            />
            {PX_PLACES.map(({ id, label, icon: Icon }) => (
              <HeaderTab
                key={id}
                active={place === id}
                onClick={() => setPlace(id)}
                icon={Icon}
                label={label}
              />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {/* the voice — narrates the latest revelation, a man's gentle
                natural voice, at the very top as asked */}
            {voiceText ? (
              <ListenButton
                text={voiceText}
                cacheKey="px-top-narration"
                variant="icon"
                className="size-9"
                voice="regent"
              />
            ) : (
              <span
                className="flex size-9 items-center justify-center rounded-full border hairline text-muted-foreground/40"
                aria-hidden="true"
                title={t("The voice waits for the first revelation")}
              >
                <AudioLines className="size-4" />
              </span>
            )}
            <span
              className="flex size-9 items-center justify-center rounded-full border hairline"
              aria-hidden="true"
            >
              <Orbit className="size-4 text-[var(--gd)]" />
            </span>
          </div>
        </div>
      </header>

      {/* ---------- the core ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex h-full w-full max-w-[1020px] flex-col px-4 pb-5 sm:px-6">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-4">
            {place === "chat" ? (
              <ParticleXChat />
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
                      <Atom className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                      {t("Back to the Core")}
                    </button>
                  </div>

                  {place === "scopes" && (
                    <PxScopesTab
                      onOpenInCore={(scopeId) => {
                        if (scopeId) {
                          setPxScope(scopeId);
                          pinPxNotes(scopeId);
                        }
                        setPlace("chat");
                      }}
                    />
                  )}
                  {place === "tools" && <PxToolsTab />}
                  {place === "codex" && <PxCodexTab />}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
