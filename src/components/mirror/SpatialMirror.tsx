"use client";

import { useMemo, useState } from "react";
import { Box, Eye, Hand } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { useDeviceCapability } from "@/lib/adaptive/device";
import { descriptorFor, presentationFor } from "@/lib/spatial/registry";
import { useLandingTurns } from "@/lib/spatial/thread-bridge";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE SPATIAL MIRROR — the WebXR prototype room.                     */
/*                                                                     */
/*  The device-independent spatial model made visible: the Mirror's    */
/*  presence descriptor (mirror.presence) is rendered by THE ROOM      */
/*  according to the current form — and over the REAL conversation,    */
/*  never a demo reel. The immersive arrangement floats the latest     */
/*  exchanges in depth around the visitor; the composer's voice still  */
/*  walks through the same askMirror channel as everywhere else.       */
/*                                                                     */
/*  COMFORT LAWS: no forced motion (the reduced-motion hand rests      */
/*  the drift), every panel readable at arm's length, and the         */
/*  workplace's own tab bar always one touch away. VR HARDWARE IS      */
/*  NEVER REQUIRED — a headset that answers WebXR's question is        */
/*  honored with a badge, and the same room stands gracefully for      */
/*  every other device.                                                */
/* ------------------------------------------------------------------ */

export function SpatialMirror() {
  const t = useT();
  const cap = useDeviceCapability();
  const [depth, setDepth] = useState(1);

  const descriptor = descriptorFor("mirror.presence");
  const presentation = descriptor
    ? presentationFor(descriptor, cap.form)
    : "persistent-panel";

  /* the real thread — the settled words cross the bridge from the
     realm's own conversation; the store's channel serves as the
     second shelf (the API-driven paths write there) */
  const bridged = useLandingTurns();
  const channel = useMirror((s) => s.sessions[s.activeMode]);
  const panels = useMemo(() => {
    const fromBridge = bridged
      .slice(-5)
      .reverse()
      .map((t, i) => ({ id: `bridge-${bridged.length - i}`, query: t.q, text: t.a }));
    if (fromBridge.length > 0) return fromBridge;
    const withWords = channel.messages.filter(
      (m) => m.text.trim() || m.query.trim()
    );
    return withWords
      .slice(-5)
      .reverse()
      .map((m) => ({ id: m.id, query: m.query, text: m.text }));
  }, [bridged, channel.messages]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: "1200px" }}
      data-testid="spatial-mirror"
    >
      {/* the room's floor — a receding plane of depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-40%] bottom-[-30%] h-[80%] opacity-60"
        style={{
          transform: "rotateX(64deg)",
          background:
            "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--scope-a,var(--gd)) 25%, transparent), transparent 65%)",
        }}
      />

      <header className="relative z-10 flex items-center gap-2 px-4 pt-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("The Spatial Mirror")}
          </p>
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
            {t("Mirror presence")}: {t(presentation)}
          </h1>
        </div>
        <span
          className={cn(
            "mono-label flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[8.5px] uppercase tracking-[0.16em]",
            cap.spatialSupported
              ? "border-[var(--hairline-hover)] text-foreground"
              : "hairline text-muted-foreground"
          )}
          data-testid="spatial-xr-badge"
        >
          <Box className="size-3" aria-hidden="true" />
          {cap.spatialChecked
            ? cap.spatialSupported
              ? t("WebXR headset present")
              : t("Graceful mode — no headset needed")
            : t("Asking the device…")}
        </span>
      </header>

      {/* the depth dial — the room breathes with the visitor's hand */}
      <div className="relative z-10 mx-auto mt-3 flex w-full max-w-[680px] items-center gap-2 px-4">
        <Eye className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="min-w-0 flex-1 accent-foreground"
          aria-label={t("Depth of the room")}
          data-testid="spatial-depth"
        />
        <Hand className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* the floating exchanges — real words standing in depth */}
      <div
        className="nice-scroll relative z-10 mt-3 h-[calc(100%-8rem)] overflow-y-auto overscroll-contain px-4 pb-6"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="mx-auto w-full max-w-[640px] space-y-6">
          {panels.length === 0 && (
            <p className="rounded-2xl border border-dashed hairline px-6 py-12 text-center text-[13px] text-muted-foreground">
              {t("The room stands ready — speak in the walk, and the words will float here.")}
            </p>
          )}
          {panels.map((m, i) => {
            const z = (i + 1) * depth * 26;
            const opacity = Math.max(0.55, 1 - i * 0.09);
            return (
              <article
                key={m.id}
                className="rounded-2xl border hairline bg-[var(--glass-bg)] px-5 py-4 shadow-xl"
                style={{
                  transform: `translateZ(${-z}px) scale(${1 - i * 0.035})`,
                  opacity,
                  transition: "transform 420ms cubic-bezier(.22,.8,.36,1), opacity 420ms",
                }}
                data-testid="spatial-panel"
              >
                <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {m.query ? m.query.slice(0, 80) : t("A transmission")}
                </p>
                <p className="mt-2 line-clamp-6 whitespace-pre-line text-[13px] leading-relaxed text-foreground/90">
                  {m.text.slice(0, 700)}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      {/* the room's whisper line — the device's own nature, spoken */}
      <p className="mono-label absolute bottom-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {cap.form} · {cap.input} · {t(presentation)}
      </p>
    </div>
  );
}
