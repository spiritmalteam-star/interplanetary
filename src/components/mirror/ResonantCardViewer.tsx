"use client";

/* ------------------------------------------------------------------ */
/*  THE RESONANT CARD VIEWER — the sequential revelation mount.        */
/*                                                                     */
/*  Every room of the walk reveals itself in four synchronized,        */
/*  lag-free steps (all transform/opacity — compositor work only):     */
/*                                                                     */
/*    Stage 1 — the category badge: which movement this room serves.  */
/*    Stage 2 — the transmission: the question and its answer,        */
/*              growing word by word while it channels.               */
/*    Stage 3 — the multi-media attachments: the light-code frequency */
/*              (a real, playable tone), the dream-book archetype,    */
/*              the sigil of the resonance. They rise the moment the  */
/*              transmission lands — already pre-loaded by the PRC,   */
/*              so nothing here ever waits on the network.            */
/*    Stage 4 — the next horizon: the branches grown on this answer,  */
/*              one touch and the walk continues from its end.        */
/*                                                                     */
/*  THE GPU LAW: zero requestAnimationFrame, one keyframe per element, */
/*  then stillness. prefers-reduced-motion opens every stage at once. */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { BookOpen, Volume1, Volume2 } from "lucide-react";
import type { MediaPayload, ResonanceCategory } from "@/lib/resonance-walk";
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
      <span className="mono-label text-[9px] uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--scope-a,var(--gd))_80%,var(--foreground))]">
        {t(CATEGORY_LABELS[category])}
      </span>
      {moveLabel ? (
        <span className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
          · {moveLabel}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------- STAGE 3 — THE MEDIA CARDS --------------------- */

/** The breathing bars — one keyframe, four delays, then infinite
    stillness in motion (pure transform, no frames). */
function FieldBars() {
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

export function ResonantMediaStage({
  media,
  visible,
  fieldOn,
  onFieldToggle,
  onOpenBook,
  testIdPrefix,
}: {
  media: MediaPayload | null;
  visible: boolean;
  /** True while the field's voice is open (a frequency is humming). */
  fieldOn: boolean;
  onFieldToggle: () => void;
  /** Opens the Dream Book atelier — the archetype's full volume is
      woven there for real. */
  onOpenBook?: () => void;
  testIdPrefix: string;
}) {
  const t = useT();
  if (!visible || !media) return null;
  const hasAny = media.music || media.book || media.image;
  if (!hasAny) return null;

  return (
    <div
      className="animate-fade-in mt-4 space-y-2"
      data-testid={`${testIdPrefix}-media`}
    >
      {/* THE FIELD'S VOICE — a real tone, gated by the visitor's hand */}
      {media.music && (
        <div
          className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)",
            backgroundColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 5%, var(--background))",
          }}
          data-testid={`${testIdPrefix}-media-music`}
        >
          <button
            type="button"
            onClick={onFieldToggle}
            aria-pressed={fieldOn}
            aria-label={fieldOn ? t("Silence the field") : t("Open the field's voice")}
            title={fieldOn ? t("Silence the field") : t("Open the field's voice")}
            data-testid={`${testIdPrefix}-freq-toggle`}
            className={cn(
              "focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
              fieldOn
                ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_18%,var(--background))] text-[var(--scope-a,var(--gd))]"
                : "border-[color-mix(in_srgb,var(--hairline)_90%,transparent)] text-muted-foreground hover:text-foreground"
            )}
          >
            {fieldOn ? (
              <Volume2 className="size-3.5" aria-hidden="true" />
            ) : (
              <Volume1 className="size-3.5" aria-hidden="true" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {t("Light code frequency")}
            </p>
            <p className="truncate text-[12px] leading-snug text-foreground/90">
              {media.music.ambientFrequency}
            </p>
          </div>
          {fieldOn && <FieldBars />}
        </div>
      )}

      {/* THE DREAM BOOK — an archetype waiting to be woven */}
      {media.book && (
        <div
          className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
          style={{
            borderColor: "color-mix(in srgb, var(--hairline) 90%, transparent)",
            backgroundColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 3%, var(--background))",
          }}
          data-testid={`${testIdPrefix}-media-book`}
        >
          <BookOpen
            className="mt-0.5 size-4 shrink-0 text-[var(--scope-a,var(--gd))] opacity-85"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {t("Dream Book")}
            </p>
            <p className="truncate text-[12.5px] font-medium leading-snug text-foreground/95">
              {media.book.title}
            </p>
            <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground/80">
              {t("Reader")}: {t(media.book.targetReader)} · {t("Depth")}{" "}
              {media.book.depthLevel}/5
            </p>
            <p className="mt-1 text-[11.5px] italic leading-relaxed text-muted-foreground/85">
              {media.book.summary}
            </p>
            {onOpenBook && (
              <button
                type="button"
                onClick={onOpenBook}
                data-testid={`${testIdPrefix}-media-book-open`}
                className="focus-glow mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] leading-snug text-foreground/90 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)] hover:text-foreground"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 7%, var(--background))",
                }}
              >
                <BookOpen className="size-3" aria-hidden="true" />
                {t("Open in the Dream Book")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* THE SIGIL — the image shaped by this question's resonance */}
      {media.image && (
        <figure
          className="overflow-hidden rounded-xl border"
          style={{
            borderColor: "color-mix(in srgb, var(--hairline) 90%, transparent)",
          }}
          data-testid={`${testIdPrefix}-media-image`}
        >
          <img
            src={media.image.imageUrl}
            alt={`${t("The sigil of this resonance")} — ${media.image.prompt}`}
            loading="lazy"
            decoding="async"
            className="h-40 w-full object-cover sm:h-44"
          />
          <figcaption className="flex items-center gap-1.5 px-3 py-1.5">
            <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.2em] text-[var(--scope-a,var(--gd))] opacity-80">
              {t("The sigil of this resonance")}
            </span>
            <span className="truncate text-[10.5px] italic text-muted-foreground/75">
              {media.image.prompt}
            </span>
          </figcaption>
        </figure>
      )}
    </div>
  );
}
