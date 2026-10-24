"use client";

/* ------------------------------------------------------------------ */
/*  THE WALK'S HANDS — the vertical arm of the house.                  */
/*                                                                     */
/*  THE UNIVERSAL EVOLUTION PROTOCOL — part II: the minimal top        */
/*  control (◈ Mirror · Search · Menu) now carries the steering and    */
/*  the one universal menu, so this arm keeps only the walk's own      */
/*  hands: the tree level readout, the depth's choice, zoom, fit,      */
/*  home, the step back, the clarity dusk, the journey and the list.   */
/*  All carried by events to the navigator, which reports its state    */
/*  back. Nothing here moves the map by itself.                        */
/*                                                                     */
/*  THE CALM DEFAULT — the arm starts FOLDED: the top control and the  */
/*  conversation own the walk, and one junction mark waits in the      */
/*  corner for the hands to be wanted. The choice is remembered on     */
/*  the device; the universal menu's "Hands" hand unfolds it too.      */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Compass,
  Eye,
  Layers,
  ListTree,
  Maximize2,
  Minus,
  NotebookPen,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RailState {
  depthBias: number;
  journeyOpen: boolean;
  listOpen: boolean;
  depth: number;
  clarity: boolean;
}

const EMPTY: RailState = {
  depthBias: 0,
  journeyOpen: false,
  listOpen: false,
  depth: 0,
  clarity: false,
};

const FOLD_KEY = "nav:rail-open";

/** THE JUNCTION'S OWN MARK — a minimalist right angle: the horizontal
 *  arm flowing into the vertical, the two halves of one toolbar. */
function CornerMark({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("transition-transform duration-300", !open && "rotate-90")}
    >
      {/* the corner: horizontal arm bending into the vertical arm */}
      <path d="M2.5 3h4.2a2.3 2.3 0 0 1 2.3 2.3v7.2" />
      <circle cx="12.6" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const ToolbarRail = memo(function ToolbarRail({
  testIdPrefix,
}: {
  testIdPrefix: string;
}) {
  const t = useT();
  /* THE CALM DEFAULT — folded, until the visitor asks for the hands.
     The remembered choice joins after the first paint (no hydration
     drift: server and client carve the same folded first frame). */
  const [open, setOpen] = useState(false);
  const [depthPick, setDepthPick] = useState(false);
  const [state, setState] = useState<RailState>(EMPTY);

  /* the remembered fold, and the menu's own unfold hand */
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(FOLD_KEY) === "1") setOpen(true);
      } catch {
        /* a closed vault keeps the calm default */
      }
    }, 0);
    const onUnfold = () => {
      setOpen(true);
      try {
        window.localStorage.setItem(FOLD_KEY, "1");
      } catch {
        /* the keeping stays closed — the fold itself still answers */
      }
    };
    window.addEventListener("nav:rail-unfold", onUnfold);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("nav:rail-unfold", onUnfold);
    };
  }, []);

  /* the navigator's own state, reported as it changes */
  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<Partial<RailState>>).detail;
      if (!d) return;
      setState((s) => ({ ...s, ...d }));
    };
    window.addEventListener("nav:rail-state", onState);
    return () => window.removeEventListener("nav:rail-state", onState);
  }, []);

  const send = useCallback((name: string, detail?: unknown) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }, []);

  const toggleFold = useCallback(() => {
    setOpen((v) => {
      try {
        window.localStorage.setItem(FOLD_KEY, v ? "0" : "1");
      } catch {
        /* the keeping stays closed — the fold itself still answers */
      }
      return !v;
    });
    setDepthPick(false);
  }, []);

  const closeDepthPick = useCallback(() => setDepthPick(false), []);

  const railBtn =
    "focus-glow flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground";

  const hands: {
    key: string;
    icon: typeof Plus;
    label: string;
    on: () => void;
    active?: boolean;
  }[] = [
    { key: "zoom-in", icon: Plus, label: "Zoom in", on: () => send("nav:rail-zoom", { dir: 1 }) },
    { key: "zoom-out", icon: Minus, label: "Zoom out", on: () => send("nav:rail-zoom", { dir: -1 }) },
    { key: "fit", icon: Maximize2, label: "Fit the journey into view", on: () => send("nav:rail-fit") },
    { key: "home", icon: Compass, label: "Return home", on: () => send("nav:rail-home") },
    { key: "back", icon: RotateCcw, label: "Return to the previous focus", on: () => send("nav:rail-back") },
    {
      key: "clarity",
      icon: Eye,
      label: "Clarity mode — dim what stands away",
      on: () => send("nav:rail-clarity"),
      active: state.clarity,
    },
    {
      key: "journey",
      icon: NotebookPen,
      label: "My journey",
      on: () => send("nav:rail-journey"),
      active: state.journeyOpen,
    },
    {
      key: "list",
      icon: ListTree,
      label: "The walk as a list",
      on: () => send("nav:rail-list"),
      active: state.listOpen,
    },
  ];

  return (
    <div
      className="absolute z-40 flex flex-col items-center"
      style={{
        top: "max(0.5rem, env(safe-area-inset-top))",
        right: "max(0.5rem, env(safe-area-inset-right))",
      }}
      data-testid={`${testIdPrefix}-rail`}
    >
      <div
        className={cn(
          "flex flex-col items-center rounded-2xl border bg-background/92 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] transition-colors duration-300",
          open ? "gap-0.5 p-1" : "p-1"
        )}
        style={{
          borderColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, var(--hairline))",
        }}
      >
        {/* THE JUNCTION BUTTON — the corner where the two arms meet */}
        <button
          type="button"
          onClick={toggleFold}
          aria-expanded={open}
          aria-label={open ? t("Fold the walk's hands away") : t("Show the walk's hands")}
          title={open ? t("Fold the walk's hands away") : t("Show the walk's hands")}
          data-testid={`${testIdPrefix}-rail-toggle`}
          className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--scope-a,var(--gd))] transition-colors duration-200 hover:bg-foreground/5"
          style={{
            backgroundColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 9%, transparent)",
          }}
        >
          <CornerMark open={open} />
        </button>

        {/* THE VERTICAL ARM — folded and unfolded as one breath */}
        <div
          aria-hidden={!open}
          className="grid w-9 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
          }}
        >
          <div className="flex min-h-0 flex-col items-center overflow-hidden">
            {/* the tree level's own readout — the walk's depth, small
                and always honest (directive 07) */}
            <span
              className="mono-label pointer-events-none mt-0.5 text-[8px] tabular-nums tracking-[0.1em] text-muted-foreground"
              title={t("Your depth in the walk")}
              data-testid={`${testIdPrefix}-rail-depth`}
            >
              L{Math.max(0, state.depth)}
            </span>
            <i
              aria-hidden="true"
              className="my-1 h-px w-5"
              style={{ backgroundColor: "var(--hairline)" }}
            />

            {/* the depth's own choice — the same two words, folded in
                a small popover so the arm stays slim */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDepthPick((v) => !v)}
                aria-expanded={depthPick}
                aria-label={t("Simpler or deeper words")}
                title={t("Simpler or deeper words")}
                data-testid={`${testIdPrefix}-nav-depth`}
                className={cn(
                  railBtn,
                  state.depthBias !== 0 && "text-[var(--scope-a,var(--gd))]"
                )}
              >
                <Layers className="size-3.5" aria-hidden="true" />
                {state.depthBias !== 0 && (
                  <i
                    aria-hidden="true"
                    className="absolute right-1 top-1 size-1 rounded-full"
                    style={{ backgroundColor: "var(--scope-a,var(--gd))" }}
                  />
                )}
              </button>
              {depthPick && (
                <>
                  <div
                    aria-hidden="true"
                    className="fixed inset-0 z-30"
                    onClick={closeDepthPick}
                  />
                  <div className="absolute right-10 top-0 z-40 flex flex-col gap-1 rounded-2xl border bg-background p-1.5 shadow-[0_14px_40px_-20px_rgba(0,0,0,0.6)]">
                    <button
                      type="button"
                      onClick={() => {
                        send("nav:rail-depth", { bias: state.depthBias === -1 ? 0 : -1 });
                        closeDepthPick();
                      }}
                      aria-pressed={state.depthBias === -1}
                      data-testid={`${testIdPrefix}-nav-simpler`}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] transition-colors duration-200",
                        state.depthBias === -1
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t("Simpler")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        send("nav:rail-depth", { bias: state.depthBias === 1 ? 0 : 1 });
                        closeDepthPick();
                      }}
                      aria-pressed={state.depthBias === 1}
                      data-testid={`${testIdPrefix}-nav-deeper`}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] transition-colors duration-200",
                        state.depthBias === 1
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t("Explore deeper")}
                    </button>
                  </div>
                </>
              )}
            </div>

            <i
              aria-hidden="true"
              className="my-1 h-px w-5"
              style={{ backgroundColor: "var(--hairline)" }}
            />

            {hands.slice(0, 6).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.on}
                aria-label={t(c.label)}
                aria-pressed={c.active}
                title={t(c.label)}
                data-testid={`${testIdPrefix}-nav-${c.key}`}
                className={cn(
                  railBtn,
                  c.active && "bg-foreground/10 text-foreground"
                )}
              >
                <c.icon className="size-3.5" aria-hidden="true" />
              </button>
            ))}

            <i
              aria-hidden="true"
              className="my-1 h-px w-5"
              style={{ backgroundColor: "var(--hairline)" }}
            />

            {hands.slice(6).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.on}
                aria-label={t(c.label)}
                aria-pressed={c.active}
                title={t(c.label)}
                data-testid={`${testIdPrefix}-nav-${c.key}`}
                className={cn(
                  railBtn,
                  c.active && "bg-foreground/10 text-foreground"
                )}
              >
                <c.icon className="size-3.5" aria-hidden="true" />
              </button>
            ))}

            <span className="pb-0.5 pt-1">
              <ChevronDown
                aria-hidden="true"
                className="size-3 text-muted-foreground/40"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
