"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dices, Eraser, Library, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { registerWorkspaceCleanup } from "@/lib/mirror/workspace-lifecycle";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE STEP BENCH — the Music room's own hands. A compact WebAudio    */
/*  step sequencer: four voices (Kick, Hush, Breath, Tone) over sixteen*/
/*  steps, scheduled honestly by the device's own clock. No server, no */
/*  credits, no pretend instrument — every sound is synthesized here,  */
/*  on the visitor's device, at gains kept deliberately low.           */
/*                                                                     */
/*  THE BENCH (compact for the living frame):                          */
/*  - 16 steps × 4 tracks; a touched cell turns its voice on that step */
/*  - the Tone speaks a fixed pentatonic ladder (A3, semitones         */
/*    0·3·5·7·10… — a warm minor-pentatonic climb, one note per step)  */
/*  - tempo 60–180 bpm, a master volume, per-track mutes               */
/*  - a look-ahead scheduler (a 25ms heartbeat scheduling ~0.1s ahead) */
/*    that breathes ONLY while playing and is cleared on every stop    */
/*  - the pattern, tempo and mutes persist in the house's own store    */
/*    (localStorage), so a page turn never erases the visitor's work   */
/*                                                                     */
/*  THE LIFECYCLE LAW — the bench registers its stop-hands with the    */
/*  book's lifecycle manager ("lightcodes"): scheduler cleared, every  */
/*  sounding source stopped, the context suspended — on a page turn,  */
/*  on a hidden tab, and on unmount. The interval is never left run-   */
/*  ning, and the context is never left breathing unattended.          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "mirror:music-pattern";
const STEP_COUNT = 16;
const MIN_BPM = 60;
const MAX_BPM = 180;
const DEFAULT_BPM = 92;
const LOOKAHEAD_S = 0.1;
const HEARTBEAT_MS = 25;
/** the warm base of the Tone ladder — A3 */
const TONE_BASE_HZ = 220;
/** semitones above A3 for each of the 16 steps — a minor-pentatonic climb */
const PENTATONIC = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34, 36];

const TRACK_IDS = ["kick", "hush", "breath", "tone"] as const;
type TrackId = (typeof TRACK_IDS)[number];

/** the voices' honest names (i18n keys — English is the key) */
const TRACK_LABELS: Record<TrackId, string> = {
  kick: "Kick",
  hush: "Hush",
  breath: "Breath",
  tone: "Tone",
};

type Pattern = boolean[][]; // [track][step]
type Mutes = boolean[]; // [track]

/** what rests on the house's shelf between visits (the stored shape) */
type StoredPattern = {
  tempo: number;
  tracks: number[][]; // 4 × 16 of 0/1
  mutes: boolean[];
};

/** what the bench wakes with (the living shape, already decoded) */
type RestoredBench = {
  tempo: number;
  tracks: Pattern;
  mutes: Mutes;
};

function makeEmptyPattern(): Pattern {
  return TRACK_IDS.map(() => Array<boolean>(STEP_COUNT).fill(false));
}

/* the house's gold glass — the same quiet chrome the chamber wears */
const GOLD_PILL =
  "border-[color-mix(in_srgb,var(--lp-gold)_32%,var(--hairline))] bg-[color-mix(in_srgb,var(--lp-gold)_7%,var(--glass-bg-soft))] hover:border-[color-mix(in_srgb,var(--lp-gold)_58%,transparent)]";

/** Restore the visitor's bench from the house's own store. Guarded —
 *  a cold server render (or a broken shelf) wakes grounded. */
function readStored(): RestoredBench | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPattern>;
    if (!parsed || typeof parsed.tempo !== "number") return null;
    if (!Array.isArray(parsed.tracks) || parsed.tracks.length !== TRACK_IDS.length)
      return null;
    const tracks = parsed.tracks.map((row) =>
      Array.isArray(row) && row.length === STEP_COUNT
        ? row.map((v) => v === 1)
        : Array<boolean>(STEP_COUNT).fill(false)
    );
    const mutes =
      Array.isArray(parsed.mutes) && parsed.mutes.length === TRACK_IDS.length
        ? parsed.mutes.map(Boolean)
        : TRACK_IDS.map(() => false);
    const tempo = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(parsed.tempo)));
    return { tempo, tracks, mutes };
  } catch {
    return null;
  }
}

/** THE SURPRISE — a tasteful sparse pattern: the kick mostly on the
 *  quarters, the hush answering on the back half, the breath whispering
 *  between, the tone scattered like light on water. Honest dice. */
function makeSurprisePattern(): Pattern {
  return TRACK_IDS.map((id) => {
    const row = Array<boolean>(STEP_COUNT).fill(false);
    for (let s = 0; s < STEP_COUNT; s++) {
      if (id === "kick") row[s] = s % 4 === 0 ? Math.random() < 0.85 : Math.random() < 0.1;
      else if (id === "hush") row[s] = s % 8 === 4 ? true : Math.random() < 0.16;
      else if (id === "breath") row[s] = s % 2 === 1 ? Math.random() < 0.38 : Math.random() < 0.08;
      else row[s] = Math.random() < 0.3;
    }
    return row;
  });
}

/* ------------------------- the engine ------------------------------ */
/*  One lazily-created AudioContext (born on the first Play, resumed    */
/*  there — a Play is always a visitor's own gesture). Everything the  */
/*  scheduler touches lives in the engine object, so no closure ever   */
/*  grows stale.                                                       */

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
  timer: number | null;
  playheadTimeouts: Set<number>;
  nextTime: number;
  nextStep: number;
  sources: Set<AudioScheduledSourceNode>;
};

/* --------------------------- the bench ----------------------------- */

export function MusicSequencer() {
  const t = useT();

  /* the visitor's work — restored from the house's store, kept there */
  const [stored] = useState<RestoredBench | null>(readStored);
  const [pattern, setPattern] = useState<Pattern>(
    () => stored?.tracks ?? makeEmptyPattern()
  );
  const [tempo, setTempo] = useState<number>(() => stored?.tempo ?? DEFAULT_BPM);
  const [mutes, setMutes] = useState<Mutes>(
    () => stored?.mutes ?? TRACK_IDS.map(() => false)
  );
  const [volume, setVolume] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  /** the step now sounding — a plain state re-render, never a loop */
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  /* the engine + the scheduler's live truth (refs, never stale) */
  const engineRef = useRef<Engine | null>(null);
  const patternRef = useRef(pattern);
  const mutesRef = useRef(mutes);
  const tempoRef = useRef(tempo);
  const volumeRef = useRef(volume);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);
  useEffect(() => {
    mutesRef.current = mutes;
  }, [mutes]);
  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);
  useEffect(() => {
    volumeRef.current = volume;
    const engine = engineRef.current;
    if (engine) {
      engine.master.gain.setTargetAtTime(volume, engine.ctx.currentTime, 0.03);
    }
  }, [volume]);

  /* the pattern rests on the house's shelf on every change — the
     registry's preserveState promise, kept by the store alone */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tempo,
          tracks: pattern.map((row) => row.map((v) => (v ? 1 : 0))),
          mutes,
        } satisfies StoredPattern)
      );
    } catch {
      /* a full shelf never breaks the bench */
    }
  }, [pattern, tempo, mutes]);

  const ensureEngine = useCallback((): Engine | null => {
    if (engineRef.current) return engineRef.current;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = volumeRef.current;
    master.connect(ctx.destination);
    /* one second of white noise, shared by the soft voices */
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const engine: Engine = {
      ctx,
      master,
      noise,
      timer: null,
      playheadTimeouts: new Set<number>(),
      nextTime: 0,
      nextStep: 0,
      sources: new Set(),
    };
    engineRef.current = engine;
    return engine;
  }, []);

  const rememberSource = (engine: Engine, node: AudioScheduledSourceNode) => {
    engine.sources.add(node);
    node.onended = () => {
      engine.sources.delete(node);
    };
  };

  /* THE VOICES — synthesized, modest, low. */
  const playKick = (engine: Engine, at: number) => {
    const { ctx, master } = engine;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    gain.gain.setValueAtTime(0.7, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 0.32);
    rememberSource(engine, osc);
  };

  const playHush = (engine: Engine, at: number) => {
    const { ctx, master, noise } = engine;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    src.connect(lp).connect(gain).connect(master);
    src.start(at);
    src.stop(at + 0.16);
    rememberSource(engine, src);
  };

  const playBreath = (engine: Engine, at: number) => {
    const { ctx, master, noise } = engine;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.14, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.055);
    src.connect(hp).connect(gain).connect(master);
    src.start(at);
    src.stop(at + 0.07);
    rememberSource(engine, src);
  };

  const playTone = (engine: Engine, step: number, at: number) => {
    const { ctx, master } = engine;
    const semis = PENTATONIC[step % STEP_COUNT];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = TONE_BASE_HZ * Math.pow(2, semis / 12);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(0.22, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.36);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 0.4);
    rememberSource(engine, osc);
  };

  const scheduleStep = (engine: Engine, step: number, at: number) => {
    TRACK_IDS.forEach((id, ti) => {
      if (mutesRef.current[ti]) return;
      if (!patternRef.current[ti]?.[step]) return;
      if (id === "kick") playKick(engine, at);
      else if (id === "hush") playHush(engine, at);
      else if (id === "breath") playBreath(engine, at);
      else playTone(engine, step, at);
    });
  };

  /** clear the heartbeat and every pending playhead mark — nothing
      keeps ticking once the bench stops */
  const stopScheduler = (engine: Engine) => {
    if (engine.timer !== null) {
      window.clearInterval(engine.timer);
      engine.timer = null;
    }
    for (const tid of engine.playheadTimeouts) window.clearTimeout(tid);
    engine.playheadTimeouts.clear();
  };

  const stopAllSound = (engine: Engine) => {
    for (const src of [...engine.sources]) {
      try {
        src.stop();
      } catch {
        /* a voice already ended rests quietly */
      }
    }
    engine.sources.clear();
  };

  /** the bench rests — used by Stop, by the hidden tab, by the page turn */
  const restEngine = useCallback((engine: Engine) => {
    stopScheduler(engine);
    stopAllSound(engine);
    setCurrentStep(null);
  }, []);

  const startScheduler = (engine: Engine) => {
    stopScheduler(engine);
    engine.nextStep = 0;
    engine.nextTime = engine.ctx.currentTime + 0.06;
    engine.timer = window.setInterval(() => {
      const horizon = engine.ctx.currentTime + LOOKAHEAD_S;
      while (engine.nextTime < horizon) {
        const step = engine.nextStep;
        const at = engine.nextTime;
        scheduleStep(engine, step, at);
        /* the playhead is a state re-render timed to the sound */
        const tid = window.setTimeout(
          () => {
            engine.playheadTimeouts.delete(tid);
            setCurrentStep(step);
          },
          Math.max(0, (at - engine.ctx.currentTime) * 1000)
        );
        engine.playheadTimeouts.add(tid);
        engine.nextTime += 60 / tempoRef.current / 4;
        engine.nextStep = (engine.nextStep + 1) % STEP_COUNT;
      }
    }, HEARTBEAT_MS);
  };

  /* THE LIFECYCLE — the bench's stop-hands registered with the book's
     manager: a page turn, a hidden tab or the window's own close lays
     the sound down. The unmount hand closes the context for good. */
  useEffect(() => {
    const stopAll = () => {
      const engine = engineRef.current;
      setPlaying(false);
      if (!engine) return;
      restEngine(engine);
      void engine.ctx.suspend().catch(() => undefined);
    };
    const un1 = registerWorkspaceCleanup("lightcodes", stopAll);
    const onHide = () => {
      if (document.hidden) stopAll();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      un1();
      document.removeEventListener("visibilitychange", onHide);
      const engine = engineRef.current;
      if (engine) {
        restEngine(engine);
        void engine.ctx.close().catch(() => undefined);
        engineRef.current = null;
      }
    };
  }, [restEngine]);

  /* --------------------------- the hands ---------------------------- */

  const handleTogglePlay = () => {
    if (playing) {
      setPlaying(false);
      const engine = engineRef.current;
      if (engine) restEngine(engine);
      return;
    }
    const engine = ensureEngine();
    if (!engine) return;
    /* the first Play is the context's birth — a visitor's own gesture */
    if (engine.ctx.state === "suspended") void engine.ctx.resume();
    setPlaying(true);
    startScheduler(engine);
  };

  const toggleCell = (ti: number, s: number) => {
    setPattern((prev) =>
      prev.map((row, i) =>
        i === ti ? row.map((v, j) => (j === s ? !v : v)) : row
      )
    );
  };

  const toggleMute = (ti: number) => {
    setMutes((prev) => prev.map((m, i) => (i === ti ? !m : m)));
  };

  const handleClear = () => {
    setPattern(makeEmptyPattern());
  };

  const handleSurprise = () => {
    setPattern(makeSurprisePattern());
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: "invent",
          title: `${t("Pattern")} — ${tempo} bpm`,
          excerpt: t("16 steps · kick/hush/breath/tone"),
          content: {
            kind: "music-pattern",
            tempo,
            tracks: pattern.map((row) => row.map((v) => (v ? 1 : 0))),
            mutes,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast(t("The pattern rests on the Library shelf."));
    } catch {
      toast(t("The shelf refused the pattern — try again in a moment."));
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------- the face ----------------------------- */

  const stepColumns = { gridTemplateColumns: `repeat(${STEP_COUNT}, minmax(0, 1fr))` };

  return (
    <section
      data-testid="sequencer"
      aria-label={t("Step sequencer")}
      className="scope-frame-card relative rounded-2xl p-3.5 sm:p-4"
    >
      {/* transport — the breath, the pace, the hush */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={handleTogglePlay}
          data-testid="sequencer-play"
          aria-label={playing ? t("Stop") : t("Play")}
          className="focus-glow flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--lp-gold)] to-[color-mix(in_srgb,var(--lp-gold)_58%,var(--lp-violet))] text-[#f8f3e6] shadow-[0_4px_20px_-8px_color-mix(in_srgb,var(--lp-gold)_85%,transparent)] transition-all duration-300 hover:-translate-y-px dark:to-[color-mix(in_srgb,var(--lp-gold)_78%,white)] dark:text-[#2a2313]"
        >
          {playing ? (
            <Square className="size-3.5" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-[1px]" aria-hidden="true" />
          )}
        </button>

        <label className="flex min-w-[150px] flex-1 items-center gap-2">
          <span className="mono-label shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Tempo")}
          </span>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            data-testid="sequencer-tempo"
            aria-label={t("Tempo")}
            className="h-1.5 min-w-0 flex-1 cursor-pointer"
            style={{ accentColor: "var(--scope-a, var(--gd))" }}
          />
          <span className="w-[62px] shrink-0 text-right font-mono text-[11.5px] tabular-nums text-[var(--scope-a)]">
            {tempo} bpm
          </span>
        </label>

        <label className="flex min-w-[130px] flex-1 items-center gap-2">
          <span className="mono-label shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Volume")}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label={t("Volume")}
            className="h-1.5 min-w-0 flex-1 cursor-pointer"
            style={{ accentColor: "var(--scope-a, var(--gd))" }}
          />
        </label>
      </div>

      {/* the grid — one ruler, four voices */}
      <div className="mt-3.5" role="group" aria-label={t("Steps")}>
        {/* the step ruler — the current step's quiet mark */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-[52px] shrink-0" />
          <div className="grid flex-1 gap-[3px]" style={stepColumns}>
            {Array.from({ length: STEP_COUNT }, (_, s) => {
              const isNow = playing && currentStep === s;
              return (
                <span
                  key={s}
                  data-testid={`sequencer-step-${s + 1}`}
                  className={cn(
                    "h-3.5 rounded-[3px] transition-colors duration-200",
                    s > 0 && s % 4 === 0 && "ml-[3px]"
                  )}
                  style={{
                    backgroundColor: isNow
                      ? "color-mix(in srgb, var(--scope-a) 55%, transparent)"
                      : "color-mix(in srgb, var(--foreground) 7%, transparent)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {TRACK_IDS.map((id, ti) => {
          const muted = mutes[ti];
          return (
            <div
              key={id}
              data-testid={`sequencer-track-${id}`}
              className="mt-1.5 flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={() => toggleMute(ti)}
                aria-pressed={muted}
                data-testid={`sequencer-mute-${id}`}
                title={muted ? t("Muted") : t("Mute")}
                className={cn(
                  "focus-glow h-7 w-[52px] shrink-0 rounded-md border text-[11.5px] font-medium transition-all duration-300",
                  muted
                    ? "border-dashed text-muted-foreground/60"
                    : "text-foreground/85"
                )}
                style={
                  muted
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--foreground) 14%, transparent)",
                      }
                    : {
                        borderColor:
                          "color-mix(in srgb, var(--lp-gold) 30%, var(--hairline))",
                        backgroundColor:
                          "color-mix(in srgb, var(--lp-gold) 7%, var(--glass-bg-soft))",
                      }
                }
              >
                {t(TRACK_LABELS[id])}
              </button>
              <div
                className={cn(
                  "grid min-w-0 flex-1 gap-[3px] transition-opacity duration-300",
                  muted && "opacity-40"
                )}
                style={stepColumns}
              >
                {Array.from({ length: STEP_COUNT }, (_, s) => {
                  const on = pattern[ti]?.[s] ?? false;
                  const isNow = playing && currentStep === s;
                  const downbeat = s % 4 === 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleCell(ti, s)}
                      aria-pressed={on}
                      aria-label={`${t(TRACK_LABELS[id])} — ${t("step")} ${s + 1}`}
                      data-testid={`sequencer-cell-${id}-${s}`}
                      className={cn(
                        "focus-glow h-7 rounded-[5px] border transition-colors duration-200",
                        s > 0 && s % 4 === 0 && "ml-[3px]"
                      )}
                      style={{
                        borderColor: on
                          ? "color-mix(in srgb, var(--scope-a) 45%, transparent)"
                          : "color-mix(in srgb, var(--foreground) 10%, transparent)",
                        backgroundColor: on
                          ? "color-mix(in srgb, var(--scope-a) 15%, transparent)"
                          : isNow
                            ? "color-mix(in srgb, var(--scope-a) 6%, transparent)"
                            : downbeat
                              ? "color-mix(in srgb, var(--foreground) 3%, transparent)"
                              : "transparent",
                        boxShadow: isNow
                          ? "inset 0 0 0 1.5px color-mix(in srgb, var(--scope-a) 62%, transparent)"
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* the honest hands — clear, surprise, and the library shelf */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleClear}
          data-testid="sequencer-clear"
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground",
            GOLD_PILL
          )}
        >
          <Eraser className="size-3" aria-hidden="true" />
          {t("Clear")}
        </button>
        <button
          type="button"
          onClick={handleSurprise}
          data-testid="sequencer-surprise"
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground",
            GOLD_PILL
          )}
        >
          <Dices className="size-3" aria-hidden="true" />
          {t("Surprise")}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          data-testid="sequencer-save"
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            GOLD_PILL
          )}
        >
          <Library className="size-3" aria-hidden="true" />
          {t("Save to the Library")}
        </button>
        <span className="mono-label ml-auto hidden text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55 sm:inline">
          {t("local synthesis · quiet gains")}
        </span>
      </div>
    </section>
  );
}

export default MusicSequencer;
