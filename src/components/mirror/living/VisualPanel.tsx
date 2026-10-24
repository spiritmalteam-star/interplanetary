"use client";

/* ------------------------------------------------------------------ */
/*  THE VISUAL TOOLBAR — [2D] [3D] [Expand] [Reset], small and quiet.  */
/*                                                                     */
/*  A part of the Mirror's answer may be accompanied by a living       */
/*  scene. The toolbar is optional and unobtrusive: nothing moves,     */
/*  nothing loads, until a hand asks. The scene stands INSIDE the      */
/*  conversation — the network around it never leaves the eye — and    */
/*  its gestures end at its own glass (the boundary law).              */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useMemo, useState } from "react";
import { Box, Image as ImageIcon, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { pickScene, sceneSupports3D } from "@/lib/visual-scenes";
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
  const [resetKey, setResetKey] = useState(0);

  const pick = useMemo(() => pickScene(text, accent), [text, accent]);
  const can3D = useMemo(() => sceneSupports3D(pick.scene), [pick.scene]);

  const openMode = useCallback((m: VizMode) => {
    setMode((cur) => (cur === m ? "off" : m));
    setResetKey((k) => k + 1);
    /* the card's own bounds change — the canvas makes room */
    window.dispatchEvent(
      new CustomEvent<{ id: string }>("nav:conv-resize", {
        detail: { id: nodeId },
      })
    );
  }, [nodeId]);

  const toggleDeep = useCallback(() => {
    setDeep((d) => !d);
    window.setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent<{ id: string }>("nav:conv-resize", {
            detail: { id: nodeId },
          })
        ),
      40
    );
  }, [nodeId]);

  if (!text.trim()) return null;

  const toolCls =
    "focus-glow flex h-6 items-center gap-1 rounded-full border px-2 text-[9.5px] uppercase tracking-[0.14em] transition-colors duration-200";

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
              onClick={() => setResetKey((k) => k + 1)}
              aria-label={t("Reset the scene")}
              data-testid={`${testIdPrefix}-viz-reset`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
            </button>
            <span className="mono-label ml-0.5 truncate text-[8px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {t(pick.label)}
            </span>
          </>
        )}
      </div>

      {mode !== "off" && (
        <div
          key={`${mode}:${resetKey}`}
          data-testid={`${testIdPrefix}-viz-stage`}
          className={cn(
            "nav-conv-viz mt-1.5 overflow-hidden rounded-xl border bg-[color-mix(in_srgb,var(--background)_82%,transparent)]",
            deep ? "nav-conv-viz-deep" : ""
          )}
          style={{ borderColor: `color-mix(in srgb, ${accent} 26%, transparent)` }}
        >
          {mode === "2d" ? (
            <Scene2D
              scene={pick.scene}
              accent={accent}
              seedKey={text.slice(0, 80)}
              className="h-full w-full"
            />
          ) : (
            <Scene3D
              scene={pick.scene}
              accent={accent}
              seedKey={text.slice(0, 80)}
            />
          )}
        </div>
      )}
    </div>
  );
});
