"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeftRight,
  Flame,
  Hand,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  Moon,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import {
  canopyHour,
  focusCanopy,
  growCanopy,
  type CanopyWhisper,
} from "@/lib/data/suggestion-banks";
import type { BranchId } from "@/lib/data/suggestion-tree";
import {
  BRANCH_TYPE_LABELS,
  recordJourney,
  recordSeen,
  type BranchType,
  type LearnedBranch,
} from "@/lib/learning-branches";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE BRANCH CANOPY — the living tree of every chat.                 */
/*                                                                     */
/*  The branches are not a small box: they fill the whole chat box.    */
/*  In an empty room the tree STANDS — trunk and limbs spanning the    */
/*  conversation's full height, whispers hanging from every limb.      */
/*  When the visitor picks a branch and the answer is revealed, the    */
/*  tree fades out and makes space for the answer. A button beside     */
/*  the input summons the tree again at any time.                      */
/*                                                                     */
/*  THE 500 LAW: every category grows at least 560 unique whispers,    */
/*  deterministically keyed to the UTC hour — the grove renews itself  */
/*  every hour with no timers, no polling, no refetch storms: the      */
/*  next hour's grove is grown the moment it is asked for.             */
/*                                                                     */
/*  THE TRANSMISSION FOCUS: when a transmission has been received,     */
/*  the branches of that exchange (grown by the branch engine) hang    */
/*  at the crown, and the whispers whose words resonate with the       */
/*  conversation's own vocabulary rise to the top of the walk.         */
/*                                                                     */
/*  THE STILLNESS LAW: no intervals, no animation frames, no loops.    */
/*  The grove renders once and goes silent; the only motion is one     */
/*  breathing line and one staggered CSS bloom on the visible limbs.   */
/*  Offscreen limbs are never laid out; the canopy unmounts entirely   */
/*  when it fades. The phone stays cool.                               */
/* ------------------------------------------------------------------ */

/** Whispers in the first paint of the walk, and the growth per step. */
const FIRST_BLOOM = 48;
const BLOOM_STEP = 24;
/** Whispers per limb row. */
const PER_ROW = 3;

const MOVEMENT_ICONS: Record<BranchType, typeof Layers> = {
  deepen: Layers,
  connect: Link2,
  contrast: ArrowLeftRight,
  apply: Hand,
  create: Sparkles,
  reflect: Moon,
  pause: Hourglass,
};

/* ------------------- the summon button (by the input) ---------------- */

export function CanopySummonButton({
  open,
  onToggle,
  disabled,
  testIdPrefix,
}: {
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  testIdPrefix: string;
}) {
  const t = useT();
  const label = open ? t("Hide the branches") : t("Summon the branches");
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={open}
      aria-label={label}
      title={label}
      data-testid={`${testIdPrefix}-summon`}
      className={cn(
        "focus-glow mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 sm:size-8",
        open
          ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,transparent)] text-[var(--scope-a,var(--gd))] shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
          : "border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] bg-transparent text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
      )}
    >
      <ListTree className="size-4 sm:size-3.5" aria-hidden="true" />
    </button>
  );
}

/* --------------------------- the canopy ------------------------------ */

export function BranchCanopy({
  category,
  scopeHint,
  contextText,
  channeling,
  open,
  onPick,
  onClose,
  disabled,
  testIdPrefix,
  introHeading,
  introSub,
  introSubExtra,
  introExtra,
}: {
  /** The branch of the living tree this chat belongs to. */
  category: BranchId;
  /** The scope/window this chat stands in — the grove weaves it. */
  scopeHint?: string | null;
  /** The thread's last breaths — received transmissions focus the walk. */
  contextText?: string;
  /** The branches grown on the conversation's own replies — the crown. */
  channeling?: LearnedBranch[] | null;
  open: boolean;
  onPick: (q: string) => void;
  onClose: () => void;
  disabled?: boolean;
  testIdPrefix: string;
  /** The empty room's own identity, spoken above the tree. */
  introHeading?: string | null;
  introSub?: string | null;
  /** A second, quieter line beneath the intro. */
  introSubExtra?: string | null;
  introExtra?: ReactNode;
}) {
  const t = useT();

  /* THE FADE LAW — mount → visible on open; fade → unmount on close.
     Pure CSS transitions; the tree leaves the stage gently and the
     answer takes the whole room. The open/close reset happens during
     render (the official guarded pattern); the effects only schedule
     the entrance and the exit — never a synchronous render cascade. */
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [seenOpen, setSeenOpen] = useState(open);

  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setMounted(true);
      setShown(false);
    } else {
      setShown(false);
    }
  }

  /* THE HOURLY GROVE — captured when the canopy is summoned; if the
     hour has rolled since the last summon, the grove regrows itself. */
  const [hour, setHour] = useState(() => canopyHour());
  const [salt, setSalt] = useState(0);

  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => setMounted(false), 700);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setShown(true), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const grove = useMemo(
    () => growCanopy(category, scopeHint ?? null, hour, salt),
    [category, scopeHint, hour, salt]
  );

  /* THE TRANSMISSION FOCUS — the closest whispers rise to the crown. */
  const focused = useMemo(
    () => focusCanopy(grove, contextText ?? "", 6),
    [grove, contextText]
  );

  /* THE WALK — the grove renders in windows; the sentinel grows more
     limbs only when the visitor actually walks to them. A fresh grove
     resets the walk during render (the official guarded pattern). */
  const [visible, setVisible] = useState(FIRST_BLOOM);
  const [groveSeen, setGroveSeen] = useState(grove);
  if (grove !== groveSeen) {
    setGroveSeen(grove);
    setVisible(FIRST_BLOOM);
  }
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !mounted) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + BLOOM_STEP, grove.length));
        }
      },
      { rootMargin: "420px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, grove.length]);

  const rows = useMemo(() => {
    const slice = grove.slice(0, visible);
    const out: CanopyWhisper[][] = [];
    for (let i = 0; i < slice.length; i += PER_ROW)
      out.push(slice.slice(i, i + PER_ROW));
    return out;
  }, [grove, visible]);

  const pick = (q: string) => {
    if (disabled) return;
    /* the walk is kept — the helix reflects the branch this step took */
    recordJourney({ b: category, s: scopeHint ?? undefined });
    recordSeen([q]);
    onPick(q);
  };

  if (!mounted) return null;

  return (
    <div
      data-testid={testIdPrefix}
      aria-hidden={!shown}
      className={cn(
        "absolute inset-0 z-20 flex min-h-0 flex-col bg-[color-mix(in_srgb,var(--background)_94%,transparent)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        shown
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      {/* ---------------------------- header ---------------------------
          The tree reaches the very top of the chat box, sliding beneath
          the floating world controls — its own top padding keeps the
          title clear of them, the same law the thread obeys. */}
      <div className="shrink-0 border-b hairline bg-[color-mix(in_srgb,var(--background)_70%,transparent)] px-3 pb-2 pt-[52px] backdrop-blur-xl sm:px-5 sm:pt-[60px]">
        <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_42%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
              aria-hidden="true"
            >
              <ListTree className="size-3.5 text-[var(--scope-a,var(--gd))]" />
            </span>
            <div className="min-w-0">
              <p className="scope-gradient-text truncate text-[14.5px] font-semibold leading-tight">
                {t("The living tree")}
                {introHeading ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {introHeading}
                  </span>
                ) : null}
              </p>
              <p className="mono-label truncate text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
                {grove.length} {t("whispers on this branch")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSalt((s) => s + 1)}
              disabled={disabled}
              aria-label={t("New branches")}
              title={t("New branches")}
              data-testid={`${testIdPrefix}-renew`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="size-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("Hide the branches")}
              title={t("Hide the branches")}
              data-testid={`${testIdPrefix}-close`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------- the tree walk ----------------------- */}
      <div
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-5 sm:px-5"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mx-auto w-full max-w-[680px]">
          {/* the empty room's own identity, above the tree */}
          {introSub && (
            <p className="mx-auto max-w-[460px] pb-5 text-center text-[13.5px] leading-relaxed text-muted-foreground">
              {introSub}
            </p>
          )}
          {introSubExtra && (
            <p className="mx-auto max-w-[440px] pb-5 text-center text-[13px] italic leading-relaxed text-muted-foreground/80">
              {introSubExtra}
            </p>
          )}
          {introExtra && <div className="flex justify-center pb-5">{introExtra}</div>}

          {/* THE CROWN — the received transmission focuses the branches */}
          {((channeling && channeling.length > 0) || focused.length > 0) && (
            <section
              className="canopy-bloom relative mb-4 rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_30%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)] px-3.5 py-3"
              data-testid={`${testIdPrefix}-crown`}
            >
              <p className="mono-label mb-2 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-[var(--scope-a,var(--gd))]">
                <Flame className="size-3" aria-hidden="true" />
                {t("Focused on this exchange")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(channeling ?? []).map((b, i) => (
                  <button
                    key={`grown-${i}`}
                    type="button"
                    onClick={() => pick(b.question)}
                    disabled={disabled}
                    data-testid={`${testIdPrefix}-crown-chip`}
                    className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_52%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_13%,var(--glass-bg))] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_20%,var(--glass-bg))] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                  >
                    {b.question}
                  </button>
                ))}
                {focused.map((w) => (
                  <button
                    key={`focused-${w.text}`}
                    type="button"
                    onClick={() => pick(w.text)}
                    disabled={disabled}
                    data-testid={`${testIdPrefix}-crown-chip`}
                    className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_8%,var(--glass-bg))] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground/90 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_15%,var(--glass-bg))] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                  >
                    {w.text}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* THE TRUNK — one breathing line down the middle of the box */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="animate-line-breathe absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
              style={{
                background:
                  "linear-gradient(180deg, transparent, var(--scope-a,var(--gd)) 10%, var(--scope-b,var(--pk)) 88%, transparent)",
              }}
            />

            {/* the limbs — alternating sides of the trunk, each row one
                learning movement's grove of whispers */}
            {rows.map((row, ri) => {
              const movement = row[0]?.movement ?? "deepen";
              const Icon = MOVEMENT_ICONS[movement] ?? Layers;
              const left = ri % 2 === 0;
              return (
                <div
                  key={`${movement}-${ri}-${row[0]?.text.slice(0, 18)}`}
                  className={cn(
                    "canopy-bloom relative flex w-full py-2.5",
                    left ? "justify-start" : "justify-end"
                  )}
                  style={{ animationDelay: `${Math.min(ri * 40, 320)}ms` }}
                >
                  {/* the limb's knot on the trunk */}
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background: "var(--scope-a,var(--gd))",
                      boxShadow:
                        "0 0 12px 3px color-mix(in srgb, var(--scope-a,var(--gd)) 45%, transparent)",
                    }}
                  />
                  <div
                    className={cn(
                      "w-[85%] sm:w-[74%]",
                      left ? "sm:pr-7" : "sm:pl-7"
                    )}
                  >
                    <p
                      className={cn(
                        "mono-label mb-1.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground/75",
                        left ? "justify-start" : "justify-end"
                      )}
                    >
                      {left ? (
                        <>
                          <Icon className="size-3 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
                          {t(BRANCH_TYPE_LABELS[movement])}
                        </>
                      ) : (
                        <>
                          {t(BRANCH_TYPE_LABELS[movement])}
                          <Icon className="size-3 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
                        </>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {row.map((w) => (
                        <button
                          key={w.text}
                          type="button"
                          onClick={() => pick(w.text)}
                          disabled={disabled}
                          data-testid={`${testIdPrefix}-whisper`}
                          className="focus-glow max-w-full rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_34%,transparent)] bg-[color-mix(in_srgb,var(--glass-bg)_80%,transparent)] px-3 py-2 text-left text-[13.5px] leading-snug text-foreground/90 transition-all duration-300 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_62%,transparent)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {w.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* the walk continues — the browser grows more limbs only
                when the eye arrives; the grove never leaves the floor */}
            {visible < grove.length && (
              <div
                ref={sentinelRef}
                className="relative flex justify-center py-5"
                data-testid={`${testIdPrefix}-sentinel`}
              >
                <p className="mono-label rounded-full border hairline px-3 py-1 text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/60">
                  {t("Grow more branches")}
                </p>
              </div>
            )}
          </div>

          {/* the grove's own signature */}
          <p className="mono-label pt-2 text-center text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/50">
            {grove.length} {t("whispers on this branch")} ·{" "}
            {t("The grove renews each hour")}
          </p>
        </div>
      </div>
    </div>
  );
}
