"use client";

/* ------------------------------------------------------------------ */
/*  THE VIDEO STUDIO — the motion picture's own room.                  */
/*                                                                     */
/*  One honest workflow, walked step by step (directive 03's universal */
/*  process): the visitor's wish is understood and planned into a real */
/*  storyboard on the server; the house's voice speaks each scene;     */
/*  the film itself is assembled ON THE VISITOR'S OWN DEVICE — painted */
/*  onto the studio's canvas at 30fps while MediaRecorder marries the  */
/*  narration into one file (mp4 where the browser speaks it, webm     */
/*  otherwise). Every failure is named; nothing is faked. The finished */
/*  film is kept on the device and registered by its branch.           */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Download,
  LoaderCircle,
  RotateCcw,
  Square,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { browserSupportsAssembly } from "@/lib/capabilities/registry";
import type { VideoSceneSpec, WorkflowPlan } from "@/lib/capabilities/types";
import {
  keepFile,
  readFile,
  runVideoWorkflow,
  type SavedArtifact,
  type WorkflowHandle,
} from "@/lib/creation-client";
import { recordFilm } from "./living/video/FilmRecorder";

type Phase = "idle" | "working" | "done" | "error";

export function VideoStudioView() {
  const t = useT();
  const videoSeed = useMirror((s) => s.videoSeed);
  const setVideoSeed = useMirror((s) => s.setVideoSeed);
  const exitVideo = useMirror((s) => s.exitVideo);

  const [topic, setTopic] = useState("");
  const [sceneCount, setSceneCount] = useState(5);
  const [mode, setMode] = useState<"motion" | "generative">("motion");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [sceneState, setSceneState] = useState<Record<string, string>>({});
  const [artifact, setArtifact] = useState<SavedArtifact | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMime, setResultMime] = useState("");
  const [resultBytes, setResultBytes] = useState(0);
  const handleRef = useRef<WorkflowHandle | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const urlRef = useRef<string | null>(null);

  /* the conversation's own words arrive as the seed (render-phase sync) */
  const seedTopic = videoSeed?.topic ?? "";
  if (seedTopic && !topic) {
    setTopic(seedTopic);
    setVideoSeed(null);
  }

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const supported = browserSupportsAssembly();

  const begin = useCallback(async () => {
    const wish = topic.trim();
    if (!wish || phase === "working") return;
    if (!supported) {
      setPhase("error");
      setError(
        "This browser cannot record films (MediaRecorder is missing). The words and the storyboard still stand."
      );
      return;
    }
    setPhase("working");
    setProgress(0);
    setNote("Understanding the wish…");
    setError("");
    setPlan(null);
    setArtifact(null);
    setSceneState({});
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setResultUrl(null);

    handleRef.current = await runVideoWorkflow(
      {
        topic: wish,
        sceneCount,
        mode,
        sourceConvId: videoSeed?.sourceConvId,
      },
      {
        onPlan: (p) => setPlan(p),
        onProgress: (p, n) => {
          setProgress(p);
          setNote(n);
        },
        onSceneStatus: (id, status, sNote) =>
          setSceneState((s) => ({ ...s, [id]: sNote ? `${status}:${sNote}` : status })),
        onError: (m) => {
          setPhase("error");
          setError(m);
        },
        onDone: (saved) => {
          if (saved) {
            setArtifact(saved);
            setPhase("done");
            void (async () => {
              if (saved.storageKey) {
                const blob = await readFile(saved.storageKey);
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  urlRef.current = url;
                  setResultUrl(url);
                  setResultMime(blob.type || saved.mime || "video/mp4");
                  setResultBytes(blob.size);
                }
              }
            })();
          }
        },
      },
      async (thePlan, narrations, clips, report, cancelled) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const made = await recordFilm({
          scenes: thePlan.scenes ?? [],
          narrations,
          clips,
          canvas,
          onProgress: report,
          isCancelled: cancelled,
        });
        return made ? { blob: made.blob, mime: made.mime } : null;
      }
    );
  }, [topic, phase, supported, sceneCount, mode, videoSeed]);

  const cancel = useCallback(() => {
    handleRef.current?.cancel();
    setPhase("idle");
    setNote("");
    setProgress(0);
  }, []);

  const download = useCallback(() => {
    if (!resultUrl || !artifact) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    const ext = resultMime.includes("mp4") ? "mp4" : "webm";
    a.download = `${artifact.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "mirror-film"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [resultUrl, artifact, resultMime]);

  const scenes: VideoSceneSpec[] = plan?.scenes ?? [];

  return (
    <div className="nice-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-5">
        {/* the crown of the room */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full border"
              style={{
                borderColor: "color-mix(in srgb, #22d3ee 42%, transparent)",
                backgroundColor: "color-mix(in srgb, #22d3ee 9%, var(--background))",
              }}
            >
              <Clapperboard className="size-3.5 text-[#22d3ee]" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-[family-name:var(--font-literata)] text-[17px] italic leading-tight text-foreground">
                {t("The Video Studio")}
              </h1>
              <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("a film, planned and narrated by the mirror")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exitVideo}
            className="focus-glow rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            data-testid="video-exit"
          >
            {t("Return to the walk")}
          </button>
        </div>

        {/* the wish */}
        {phase === "idle" || phase === "error" ? (
          <div className="rounded-2xl border bg-background/80 p-4" data-testid="video-wish">
            <label className="mono-label mb-1.5 block text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("What shall the film speak of?")}
            </label>
            <textarea
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (videoSeed) setVideoSeed(null);
              }}
              rows={2}
              placeholder={t("The construction of the Egyptian pyramids…")}
              className="w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-[13px] leading-snug text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground/25"
              data-testid="video-topic"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* the film's length */}
              <div className="flex items-center gap-1 rounded-full border px-1 py-0.5">
                {[3, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSceneCount(n)}
                    aria-pressed={sceneCount === n}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10.5px] transition-colors",
                      sceneCount === n
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {n} {t("scenes")}
                  </button>
                ))}
              </div>
              {/* the film's own mode */}
              <div className="flex items-center gap-1 rounded-full border px-1 py-0.5">
                {(
                  [
                    { id: "motion", label: "Drawn scenes" },
                    { id: "generative", label: "Generative (slow)" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    aria-pressed={mode === m.id}
                    title={
                      m.id === "motion"
                        ? t("The house's own animated templates — always ready")
                        : t("Real sky-made clips per scene — slower, experimental")
                    }
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10.5px] transition-colors",
                      mode === m.id
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(m.label)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={begin}
                disabled={!topic.trim()}
                className="focus-glow ml-auto flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
                style={{ borderColor: "color-mix(in srgb, #22d3ee 40%, transparent)" }}
                data-testid="video-compose"
              >
                <Clapperboard className="size-3.5" aria-hidden="true" />
                {t("Compose the film")}
              </button>
            </div>
            {!supported && (
              <p className="mt-2 text-[11px] italic text-muted-foreground">
                {t(
                  "This browser cannot record films — the storyboard and narration still stand."
                )}
              </p>
            )}
            {phase === "error" && error && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-[color-mix(in_srgb,#f43f5e_38%,transparent)] bg-[color-mix(in_srgb,#f43f5e_6%,var(--background))] px-3 py-2 text-[12px] text-foreground/85"
                data-testid="video-error"
              >
                {error}
              </div>
            )}
          </div>
        ) : null}

        {/* the walk of the film */}
        {phase === "working" && (
          <div className="rounded-2xl border bg-background/80 p-4" data-testid="video-working">
            <div className="flex items-center justify-between gap-3">
              <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {note || t("The film is being made…")}
              </p>
              <button
                type="button"
                onClick={cancel}
                className="focus-glow flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] text-muted-foreground hover:text-foreground"
                data-testid="video-cancel"
              >
                <Square className="size-3" aria-hidden="true" />
                {t("Stop")}
              </button>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${progress}%`, backgroundColor: "#22d3ee" }}
                data-testid="video-progress"
              />
            </div>
            {/* the film, painted live */}
            <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: "color-mix(in srgb, #22d3ee 26%, transparent)" }}>
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                className="block h-auto w-full"
                data-testid="video-canvas"
              />
            </div>
            {/* the storyboard's own honest list */}
            {scenes.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {scenes.map((s) => {
                  const st = sceneState[s.id] ?? "pending";
                  const [status, sNote] = st.split(":");
                  return (
                    <li key={s.id} className="flex items-start gap-2 text-[12px]">
                      <span className="mt-0.5 shrink-0">
                        {status === "completed" || status === "narrated" || status === "clipped" ? (
                          <i className="block size-1.5 rounded-full" style={{ backgroundColor: "#22d3ee" }} />
                        ) : status === "failed" ? (
                          <i className="block size-1.5 rounded-full bg-[#f59e0b]" />
                        ) : (
                          <LoaderCircle className="nav-spin size-3 text-muted-foreground/60" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium text-foreground/90">{s.heading}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          {status === "failed"
                            ? sNote || t("fell silent — the words still show")
                            : status === "narrated" || status === "clipped" || status === "completed"
                              ? t("stands")
                              : status === "narrating"
                                ? t("speaking…")
                                : status === "clipping"
                                  ? t("gathering the clip…")
                                  : t("waits")}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* the finished film */}
        {phase === "done" && resultUrl && (
          <div className="rounded-2xl border bg-background/80 p-4" data-testid="video-done">
            <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("The film stands complete")}
            </p>
            {plan && (
              <p className="mt-1 font-[family-name:var(--font-literata)] text-[15px] italic text-foreground">
                {plan.title}
              </p>
            )}
            <video
              src={resultUrl}
              controls
              playsInline
              className="mt-3 w-full rounded-xl border"
              style={{ borderColor: "color-mix(in srgb, #22d3ee 26%, transparent)" }}
              data-testid="video-player"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={download}
                className="focus-glow flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-foreground/5"
                style={{ borderColor: "color-mix(in srgb, #22d3ee 40%, transparent)" }}
                data-testid="video-download"
              >
                <Download className="size-3.5" aria-hidden="true" />
                {t("Download the film")}
              </button>
              <span className="mono-label text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                {(resultBytes / 1_048_576).toFixed(1)} MB · {resultMime.includes("mp4") ? "MP4" : "WebM"}
                {artifact?.storageKey ? ` · ${t("kept on this device")}` : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhase("idle");
                  setPlan(null);
                  setArtifact(null);
                  setResultUrl(null);
                }}
                className="focus-glow ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                {t("Make another")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
