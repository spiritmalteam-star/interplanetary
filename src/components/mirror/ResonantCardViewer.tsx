"use client";

/* ------------------------------------------------------------------ */
/*  THE RESONANT CARD VIEWER — the sequential revelation mount.        */
/*                                                                     */
/*  Every room of the walk reveals itself in synchronized, lag-free    */
/*  steps (all transform/opacity — compositor work only):              */
/*                                                                     */
/*    Stage 1 — the category badge: which movement this room serves.  */
/*    Stage 2 — the transmission: the question and its answer,        */
/*              growing word by word while it channels.               */
/*    Stage 3 — THE NARRATOR: a man, the documentary register,        */
/*              reading the transmission aloud — the walk's one       */
/*              voice. His gate stands at the TOP of the room (the    */
/*              header); here lives only his quiet STATUS — no        */
/*              button, nothing to press, just the honest indicator   */
/*              while the voice gathers and the bars while he reads.  */
/*    Stage 4 — the next horizon: the branches grown on this answer,  */
/*              one touch and the walk continues from its end.        */
/*                                                                     */
/*  THE GPU LAW: zero requestAnimationFrame, one keyframe per element, */
/*  then stillness. prefers-reduced-motion opens every stage at once. */
/* ------------------------------------------------------------------ */

import { useEffect, useState, useSyncExternalStore } from "react";
import { LoaderCircle } from "lucide-react";
import type { ResonanceCategory } from "@/lib/resonance-walk";
import {
  getNarration,
  subscribeNarration,
  type NarrationSnapshot,
} from "@/lib/room-narrator";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------ THE SEQUENTIAL REVEAL HOOK --------------------- */

/** Four stages keyed to the room's own words. Stages 1–2 rise on the
    mount breath (50ms / 250ms); stages 3–4 wait for the transmission
    to land, then rise in their own turns (480ms / 740ms). The room's
    key resets the stage at render time (the official guarded pattern);
    the effects only schedule the compositors' timers. */
export function useSequentialReveal(
  nodeKey: string,
  landed: boolean
): number {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [stage, setStage] = useState(() => (reduced ? 4 : 0));
  const [seenKey, setSeenKey] = useState(nodeKey);
  if (nodeKey !== seenKey) {
    setSeenKey(nodeKey);
    setStage(reduced ? 4 : 0);
  }

  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setStage((s) => Math.max(s, 1)), 50);
    const t2 = window.setTimeout(() => setStage((s) => Math.max(s, 2)), 250);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [nodeKey, reduced]);

  useEffect(() => {
    if (reduced || !landed) return;
    const t3 = window.setTimeout(() => setStage((s) => Math.max(s, 3)), 480);
    const t4 = window.setTimeout(() => setStage((s) => Math.max(s, 4)), 740);
    return () => {
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [landed, nodeKey, reduced]);

  return stage;
}

/* ------------- THE NARRATOR'S EAR (a quiet external store) --------- */

/** The narrator's state, read without re-render storms: the module is
    a sync-external store; the room subscribes once and re-renders
    only when the voice itself changes (idle ↔ gathering ↔ speaking). */
export function useNarration(): NarrationSnapshot {
  return useSyncExternalStore(subscribeNarration, getNarration, getNarration);
}

/* --------------------- STAGE 1 — THE BADGE ------------------------- */

/** The four movements of the walk, spoken through the house's own
    tongues — each an i18n key that exists in every dictionary. */
const CATEGORY_LABELS: Record<ResonanceCategory, string> = {
  "REFLECT": "Reflect",
  "CONTINUE THE WALK": "Continue the walk",
  "INNER LIGHT": "Inner light",
  "OUTER REALM": "Outer realm",
};

export function ResonantStageBadge({
  category,
  moveLabel,
  visible,
}: {
  category: ResonanceCategory;
  /** The learning movement's own label, if the branch grew from one. */
  moveLabel?: string | null;
  visible: boolean;
}) {
  const t = useT();
  if (!visible) return null;
  return (
    <div
      data-testid="resonance-badge"
      className="animate-fade-in mb-2.5 flex items-center gap-2"
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--scope-a,var(--gd))] opacity-55" />
        <span className="relative inline-flex size-1.5 rounded-full bg-[var(--scope-a,var(--gd))]" />
      </span>
      <span className="mono-label text-[10px] uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--scope-a,var(--gd))_80%,var(--foreground))]">
        {t(CATEGORY_LABELS[category])}
      </span>
      {moveLabel ? (
        <span className="mono-label text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
          · {moveLabel}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------ STAGE 3 — THE NARRATOR'S EAR ------------------- */

/** The breathing bars — one keyframe, four delays, then infinite
    stillness in motion (pure transform, no frames). */
function VoiceBars() {
  return (
    <div className="flex h-4 shrink-0 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="res-bar w-[2.5px] rounded-full bg-[var(--scope-a,var(--gd))]"
          style={{
            height: `${8 + ((i * 5) % 9)}px`,
            animationDelay: `${i * 0.22}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * THE NARRATOR'S STATUS — the room's one honest indicator, and nothing
 * more. No button lives at the bottom of the text anymore: the voice's
 * gate stands at the TOP of the room. While the voice gathers, this
 * line asks the visitor to wait one breath; while he reads, the bars
 * breathe. When he rests, nothing stands here at all.
 */
export function NarrationStatusLine({
  roomId,
  visible,
  narration,
  testIdPrefix,
}: {
  /** The standing room's own id — the status is the room's own. */
  roomId: string;
  visible: boolean;
  /** The live narration snapshot (the room subscribes once). */
  narration: NarrationSnapshot;
  testIdPrefix: string;
}) {
  const t = useT();
  if (!visible) return null;

  const mine = narration.roomId === roomId;
  const loading = mine && narration.state === "loading";
  const playing = mine && narration.state === "playing";
  if (!loading && !playing) return null;

  return (
    <div
      className={cn(
        "animate-fade-in mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2",
        loading && "narration-gathering"
      )}
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)",
        backgroundColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 4%, var(--background))",
      }}
      data-testid={`${testIdPrefix}-narration-status`}
      aria-live="polite"
    >
      {loading ? (
        <LoaderCircle
          className="size-3.5 shrink-0 animate-spin text-[var(--scope-a,var(--gd))]"
          aria-hidden="true"
        />
      ) : (
        <VoiceBars />
      )}
      <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
        {loading
          ? t("The voice is gathering — one breath…")
          : t("The narrator is reading")}
      </p>
    </div>
  );
}
