"use client";

/* ------------------------------------------------------------------ */
/*  THE VISUAL TOOLBAR — [2D] [3D] [Expand] [Reset] [Pause] [Close],   */
/*  small and quiet.                                                   */
/*                                                                     */
/*  A part of the Mirror's answer may be accompanied by a living       */
/*  scene. The toolbar is optional and unobtrusive: nothing moves,     */
/*  nothing loads, until a hand asks. The scene stands INSIDE the      */
/*  conversation — the network around it never leaves the eye — and    */
/*  its gestures end at its own glass (the boundary law).              */
/*                                                                     */
/*  THE SPEC'S OWN LAW (directive 09/10): the scene is rendered from   */
/*  a validated visual specification derived from the transmission     */
/*  itself — its subject, its entities, its labels — with the house's  */
/*  local reader as the quiet fallback. Only the modes the spec        */
/*  supports are offered.                                              */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { pickScene, sceneSupports3D } from "@/lib/visual-scenes";
import {
  localSpec,
  peekSpec,
  requestSpec,
  specCacheKey,
  type VisualSpec,
} from "@/lib/visual-spec";
import { Scene2D } from "./Scene2D";
import { Scene3D } from "./Scene3D";

type VizMode = "off" | "2d" | "3d";

export const VisualPanel = memo(function VisualPanel({
  text,
  accent,
  testIdPrefix,
  nodeId,
}: {
  /** The answer the scene accompanies (never modified). */
  text: string;
  accent: string;
  testIdPrefix: string;
  /** The living node that hosts this panel — resize news ride to it. */
  nodeId: string;
}) {
  const t = useT();
  const [mode, setMode] = useState<VizMode>("off");
  const [deep, setDeep] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const local = useMemo(() => localSpec(text, sceneSupports3D), [text]);
  const pick = useMemo(() => pickScene(text, accent), [text, accent]);

  /* the specification: seeded from the local reader, refined by the
     house's analyst when its door answers (never blocking the scene).
     The shelf is read in render (the honest derived-state pattern);
     only a transmission never read before sends one quiet request. */
  const [specState, setSpecState] = useState<{ key: string; spec: VisualSpec | null } | null>(null);
  const specKey = mode !== "off" ? specCacheKey(text) : null;
  if (specKey && (!specState || specState.key !== specKey)) {
    const known = peekSpec(specKey);
    if (known !== undefined) {
      setSpecState({ key: specKey, spec: known });
    }
  }
  useEffect(() => {
    if (!specKey) return;
    if (peekSpec(specKey) !== undefined) return;
    let dead = false;
    void requestSpec(text, local).then((s) => {
      if (!dead) setSpecState({ key: specKey, spec: s });
    });
    return () => {
      dead = true;
    };
  }, [specKey, text, local]);
  const spec = specKey && specState?.key === specKey ? specState.spec : null;

  const pickSpec = spec ?? local;
  const can3D = useMemo(
    () => sceneSupports3D(pickSpec.scene) && (spec ? spec.supports3D || sceneSupports3D(spec.scene) : sceneSupports3D(local.scene)),
    [pickSpec.scene, spec, local.scene]
  );

  const newsResize = useCallback(
    (delay = 0) => {
      window.setTimeout(
        () =>
          window.dispatchEvent(
            new CustomEvent<{ id: string }>("nav:conv-resize", {
              detail: { id: nodeId },
            })
          ),
        delay
      );
    },
    [nodeId]
  );

  const openMode = useCallback(
    (m: VizMode) => {
      setMode((cur) => (cur === m ? "off" : m));
      setPaused(false);
      setResetKey((k) => k + 1);
      /* the card's own bounds change — the canvas makes room */
      newsResize();
    },
    [newsResize]
  );

  const close = useCallback(() => {
    setMode("off");
    setDeep(false);
    setPaused(false);
    newsResize();
  }, [newsResize]);

  const toggleDeep = useCallback(() => {
    setDeep((d) => !d);
    newsResize(40);
  }, [newsResize]);

  if (!text.trim()) return null;

  const toolCls =
    "focus-glow flex h-6 items-center gap-1 rounded-full border px-2 text-[9.5px] uppercase tracking-[0.14em] transition-colors duration-200";

  const caption = spec?.subject
    ? `${spec.symbolic ? t("a symbolic scene") : t("the scene")} · ${spec.subject}`
    : t(pick.label);

  return (
    <div className="nodrag nowheel mt-2" data-testid={`${testIdPrefix}-viz`}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => openMode("2d")}
          aria-pressed={mode === "2d"}
          data-testid={`${testIdPrefix}-viz-2d`}
          className={cn(
            toolCls,
            mode === "2d"
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={{ borderColor: mode === "2d" ? accent : "var(--hairline)" }}
        >
          <ImageIcon className="size-3" aria-hidden="true" />
          2D
        </button>
        {can3D && (
          <button
            type="button"
            onClick={() => openMode("3d")}
            aria-pressed={mode === "3d"}
            data-testid={`${testIdPrefix}-viz-3d`}
            className={cn(
              toolCls,
              mode === "3d"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ borderColor: mode === "3d" ? accent : "var(--hairline)" }}
          >
            <Box className="size-3" aria-hidden="true" />
            3D
          </button>
        )}
        {mode !== "off" && (
          <>
            <button
              type="button"
              onClick={toggleDeep}
              aria-pressed={deep}
              aria-label={deep ? t("Restore the small view") : t("See it larger")}
              title={deep ? t("Restore the small view") : t("See it larger")}
              data-testid={`${testIdPrefix}-viz-expand`}
              className={cn(
                toolCls,
                deep
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{ borderColor: deep ? accent : "var(--hairline)" }}
            >
              {deep ? (
                <Minimize2 className="size-3" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-3" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setResetKey((k) => k + 1);
                setPaused(false);
              }}
              aria-label={t("Reset the scene")}
              title={t("Reset the scene")}
              data-testid={`${testIdPrefix}-viz-reset`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              aria-label={paused ? t("Let the scene move") : t("Hold the scene still")}
              title={paused ? t("Let the scene move") : t("Hold the scene still")}
              data-testid={`${testIdPrefix}-viz-pause`}
              className={cn(
                "focus-glow flex size-6 items-center justify-center rounded-full transition-colors duration-200 hover:text-foreground",
                paused ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {paused ? (
                <Play className="size-3" aria-hidden="true" />
              ) : (
                <Pause className="size-3" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={close}
              aria-label={t("Close the scene")}
              title={t("Close the scene")}
              data-testid={`${testIdPrefix}-viz-close`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
            <span
              className="mono-label ml-0.5 min-w-0 flex-1 truncate text-[8px] uppercase tracking-[0.18em] text-muted-foreground/70"
              title={caption}
            >
              {caption}
            </span>
          </>
        )}
      </div>

      {mode !== "off" && (
        <div
          key={`${mode}:${resetKey}`}
          data-testid={`${testIdPrefix}-viz-stage`}
          data-paused={paused || undefined}
          className={cn(
            "nav-conv-viz mt-1.5 overflow-hidden rounded-xl border bg-[color-mix(in_srgb,var(--background)_82%,transparent)]",
            deep ? "nav-conv-viz-deep" : ""
          )}
          style={{ borderColor: `color-mix(in srgb, ${accent} 26%, transparent)` }}
        >
          {mode === "2d" ? (
            <Scene2D
              scene={pickSpec.scene}
              accent={accent}
              seedKey={text.slice(0, 80)}
              className="h-full w-full"
              spec={spec}
            />
          ) : (
            <Scene3D
              scene={pickSpec.scene}
              accent={accent}
              seedKey={text.slice(0, 80)}
              testIdPrefix={testIdPrefix}
              paused={paused}
              spec={spec}
            />
          )}
          {/* the scene's own grounding — the words it came from */}
          {spec?.source && (
            <p
              className="border-t px-3 py-1 text-[9.5px] italic leading-snug text-muted-foreground/80"
              style={{ borderColor: `color-mix(in srgb, ${accent} 14%, var(--hairline))` }}
              data-testid={`${testIdPrefix}-viz-source`}
            >
              “{spec.source}”
            </p>
          )}
        </div>
      )}
    </div>
  );
});
