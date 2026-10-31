"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronDown,
  Disc3,
  Download,
  Drum,
  Pause,
  Play,
  Repeat,
  SlidersHorizontal,
  Trash2,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { registerWorkspaceCleanup } from "@/lib/mirror/workspace-lifecycle";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE ETHERMIX DECK — the music room's full-screen set, poured in    */
/*  glass crystal. Two decks over one shared AudioContext, a ten-pad   */
/*  synthesizer, four synthesized drums, an equal-power crossfader,    */
/*  a prismatic spectrum and an honest recorder. Everything plays on   */
/*  the visitor's own device: no server, no credits, no pretend.       */
/*                                                                     */
/*  THE SOUND LAW — one context, born on the first gesture (a Play or  */
/*  a pad press), resumed on every touch, closed on unmount. Each deck */
/*  owns ONE <audio> element and ONE MediaElementSource (never twice — */
/*  the browser forbids a second marriage). The master chain feeds     */
/*  the analyser, the speakers, and the recorder's stream alike.       */
/*                                                                     */
/*  THE HONESTY LAW — sync beat-matches the tempo control only (never  */
/*  key); a loop on a media element is kept by the draw loop's own     */
/*  hand (loopStart/loopEnd belong to buffers, not elements); a track  */
/*  still weaving shows "weaving…" and refuses to play.                */
/*                                                                     */
/*  THE CLEANUP LAW — unmount stops every voice, closes the context,   */
/*  cancels the draw loop, removes the key listeners and restores the  */
/*  body's scroll. Nothing global is ever registered.                  */
/* ------------------------------------------------------------------ */

/* ------------------------- the constant set ------------------------ */

/** the ten pads — A minor pentatonic across two octaves */
const SYNTH_PADS = [
  { note: "A3", freq: 220.0, key: "a" },
  { note: "C4", freq: 261.63, key: "s" },
  { note: "D4", freq: 293.66, key: "d" },
  { note: "E4", freq: 329.63, key: "f" },
  { note: "G4", freq: 392.0, key: "g" },
  { note: "A4", freq: 440.0, key: "h" },
  { note: "C5", freq: 523.25, key: "j" },
  { note: "D5", freq: 587.33, key: "k" },
  { note: "E5", freq: 659.25, key: "l" },
  { note: "G5", freq: 783.99, key: ";" },
] as const;

const DRUM_PADS = [
  { id: "kick", label: "Kick", key: "z" },
  { id: "snare", label: "Snare", key: "x" },
  { id: "hat", label: "Hat", key: "c" },
  { id: "clap", label: "Clap", key: "v" },
] as const;

type DrumId = (typeof DRUM_PADS)[number]["id"];
type DeckId = "a" | "b";
type LoopBeats = 0 | 4 | 8 | 16;
type SynthWave = OscillatorType;

/** the recorder's honest mime ladder — the first the browser speaks */
const REC_MIMES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

const TEMPO_MIN = 0.85;
const TEMPO_MAX = 1.15;
const FILTER_HZ_MIN = 80;
const FILTER_HZ_MAX = 20000;
const CUTOFF_HZ_MIN = 120;
const CUTOFF_HZ_MAX = 12000;
/** log position (0..1) → hertz, the musical way */
const hzOf = (pos: number, min: number, max: number) =>
  min * Math.pow(max / min, Math.min(1, Math.max(0, pos)));

const fmtTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
};
const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** a track as the deck hears it — the shelf, the stage, or the house */
type EtherTrack = {
  id: string;
  title: string;
  audioUrl: string;
  status: string;
  favorite: boolean;
  durationSec: number | null;
  source: "library" | "stage" | "demo";
};

type DeckUi = {
  trackId: string | null;
  playing: boolean;
  bpm: number;
  rate: number; // 0.85..1.15 — the tempo slider
  volume: number;
  low: number; // dB, -12..12
  mid: number;
  high: number;
  filterPos: number; // 0..1 → 80..20000 Hz log
  resoPos: number; // 0..1 → Q 0.8..10 log
  loop: LoopBeats;
  synced: boolean;
};

const makeDeckUi = (): DeckUi => ({
  trackId: null,
  playing: false,
  bpm: 120,
  rate: 1,
  volume: 0.8,
  low: 0,
  mid: 0,
  high: 0,
  filterPos: 1,
  resoPos: 0.1,
  loop: 0,
  synced: false,
});

/** the demo loop — the house's own voice, synthesized live, so the
    deck always has something to spin even before any track was woven */
const DEMO_TRACK: EtherTrack = {
  id: "ethermix-demo",
  title: "The House's Voice — demo loop",
  audioUrl: "",
  status: "succeeded",
  favorite: false,
  durationSec: null,
  source: "demo",
};
/** semitone ladder over A3 (minor pentatonic), -1 = a rest */
const DEMO_TONE_STEPS = [0, -1, 7, -1, 3, -1, 10, -1, 5, -1, 12, -1, 7, -1, 15, -1];

/* ------------------------- the crystal dress ----------------------- */

const CRYSTAL_PANEL =
  "relative rounded-2xl border bg-gradient-to-b from-white/50 to-white/20 dark:from-white/[0.07] dark:to-white/[0.02] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-30px_color-mix(in_srgb,var(--scope-a)_45%,transparent)] " +
  "transition-transform duration-300 [transform:rotateX(4deg)] hover:[transform:rotateX(0deg)] focus-within:[transform:rotateX(0deg)]";
const CRYSTAL_BORDER: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)",
};
const PRISM_EDGE =
  "bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.35),rgba(232,217,176,0.3),transparent)]";

/* the one <style> the set needs — pad flash, rec pulse, canvas glow */
const ETHERMIX_CSS = `
@keyframes ethermix-padflash {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--scope-a) 55%, transparent), inset 0 0 26px color-mix(in srgb, var(--scope-a) 40%, transparent); }
  100% { box-shadow: 0 0 0 12px transparent, inset 0 0 0 transparent; }
}
.ethermix-flash { animation: ethermix-padflash 320ms ease-out; }
@keyframes ethermix-recpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
.ethermix-rec-dot { animation: ethermix-recpulse 1.1s ease-in-out infinite; }
@keyframes ethermix-glow {
  0%, 100% { filter: drop-shadow(0 0 12px color-mix(in srgb, var(--scope-a) 22%, transparent)); }
  50% { filter: drop-shadow(0 0 26px color-mix(in srgb, var(--scope-a) 42%, transparent)); }
}
.ethermix-canvas-glow { animation: ethermix-glow 5.5s ease-in-out infinite; }
`;

/* ------------------------- the audio engine ------------------------ */

type SynthVoice = { oscs: OscillatorNode[]; gain: GainNode };

type DeckNodes = {
  el: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  input: GainNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  high: BiquadFilterNode;
  filter: BiquadFilterNode;
  out: GainNode;
  xfade: GainNode;
  cue: number;
  loopStart: number;
  loopEnd: number;
  rotation: number;
  cueHeld: boolean;
  cueWasPlaying: boolean;
  lastCueTap: number;
};

type Engine = {
  ctx: AudioContext;
  masterIn: GainNode;
  analyser: AnalyserNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
  masterGain: GainNode;
  streamDest: MediaStreamAudioDestinationNode;
  decks: Record<DeckId, DeckNodes>;
  synth: {
    filter: BiquadFilterNode;
    gain: GainNode;
    echoSend: GainNode;
    voices: SynthVoice[];
    wave: SynthWave;
    detune: boolean;
  };
  drumBus: GainNode;
  noise: AudioBuffer;
  demo: {
    gain: GainNode;
    timer: number | null;
    nextTime: number;
    step: number;
    owner: DeckId | null;
  };
  recorder: MediaRecorder | null;
};

/* --------------------------- the sliders --------------------------- */

/** A crystal rail — pointer-draggable, keyboard-lit, honest to aria. */
function CrystalSlider({
  value,
  min,
  max,
  step = 0.01,
  keyStep,
  label,
  display,
  testid,
  vertical = false,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  keyStep?: number;
  label: string;
  display: string;
  testid?: string;
  vertical?: boolean;
  onChange: (v: number) => void;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const ks = keyStep ?? step;

  const setFromClient = (clientX: number, clientY: number) => {
    const el = railRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let p = vertical
      ? 1 - (clientY - r.top) / Math.max(1, r.height)
      : (clientX - r.left) / Math.max(1, r.width);
    p = Math.min(1, Math.max(0, p));
    const raw = min + p * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, Number(snapped.toFixed(4)))));
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + ks;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - ks;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    onChange(Math.min(max, Math.max(min, Number(next.toFixed(4)))));
  };

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(3))}
      aria-valuetext={display}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      data-testid={testid}
      onKeyDown={onKeyDown}
      onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return;
        setFromClient(e.clientX, e.clientY);
      }}
      className={cn(
        "group relative flex touch-none select-none items-center outline-none focus-glow",
        vertical ? "h-28 w-11 justify-center" : "h-11 w-full",
        vertical ? "flex-col" : "flex-row"
      )}
    >
      {/* the rail itself */}
      <div
        className={cn(
          "relative overflow-visible rounded-full bg-[color-mix(in_srgb,var(--foreground)_14%,transparent)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
          vertical ? "h-full w-1.5" : "h-1.5 w-full"
        )}
      >
        <div
          className={cn(
            "absolute rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--scope-a)_75%,transparent),color-mix(in_srgb,var(--scope-a)_35%,rgba(232,217,176,0.55)))]",
            vertical
              ? "inset-x-0 bottom-0 w-full"
              : "inset-y-0 left-0 h-full"
          )}
          style={vertical ? { height: `${pct * 100}%` } : { width: `${pct * 100}%` }}
        />
        {/* the crystal thumb */}
        <div
          className={cn(
            "absolute size-4 rounded-full border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),color-mix(in_srgb,var(--scope-a)_55%,transparent)_60%,rgba(232,217,176,0.85))] shadow-[0_2px_10px_color-mix(in_srgb,var(--scope-a)_60%,transparent),inset_0_1px_0_rgba(255,255,255,0.6)] transition-transform group-hover:scale-110",
            vertical
              ? "left-1/2 -translate-x-1/2 translate-y-1/2"
              : "top-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
          style={
            vertical
              ? { bottom: `calc(${pct * 100}% - 8px)` }
              : { left: `${pct * 100}%` }
          }
        />
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none select-none text-[10px] tabular-nums text-muted-foreground",
          vertical ? "mt-1" : "sr-only"
        )}
      >
        {display}
      </span>
    </div>
  );
}

/* ---------------------------- the deck ----------------------------- */

export function EthermixDeck({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lcTrack = useMirror((s) => s.lcTrack);
  const lcHistory = useMirror((s) => s.lcHistory);

  /* ------------------------------ state ---------------------------- */
  const [library, setLibrary] = useState<EtherTrack[]>([]);
  const [anon, setAnon] = useState(false);
  const [deckA, setDeckA] = useState<DeckUi>(makeDeckUi);
  const [deckB, setDeckB] = useState<DeckUi>(makeDeckUi);
  const [crossfade, setCrossfade] = useState(0.5);
  const [pickerOpen, setPickerOpen] = useState<DeckId | null>(null);
  const [synthWave, setSynthWave] = useState<SynthWave>("sawtooth");
  const [synthDetune, setSynthDetune] = useState(true);
  const [synthCutoff, setSynthCutoff] = useState(0.72);
  const [synthReso, setSynthReso] = useState(0.15);
  const [synthEcho, setSynthEcho] = useState(0.25);
  const [synthVol, setSynthVol] = useState(0.6);
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const [drumFlash, setDrumFlash] = useState<Record<string, boolean>>({});
  const [recActive, setRecActive] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [recResult, setRecResult] = useState<{
    url: string;
    size: number;
    name: string;
  } | null>(null);

  /* --------------------------- the refs ---------------------------- */
  const engineRef = useRef<Engine | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accentRef = useRef({ hue: 283 });
  const rafRef = useRef(0);
  const timeRefs = useRef<Record<DeckId, HTMLSpanElement | null>>({
    a: null,
    b: null,
  });
  const jogRefs = useRef<Record<DeckId, HTMLDivElement | null>>({
    a: null,
    b: null,
  });
  const meterRefs = useRef<{ l: HTMLDivElement | null; r: HTMLDivElement | null }>({
    l: null,
    r: null,
  });
  const dragRef = useRef<Record<DeckId, { x: number; at: number } | null>>({
    a: null,
    b: null,
  });
  const uiRef = useRef({ a: deckA, b: deckB });
  const tracksRef = useRef<EtherTrack[]>([]);
  const specBufRef = useRef<{ arr: Uint8Array<ArrayBuffer> | null }>({ arr: null });
  const meterBufRef = useRef<{
    l: Uint8Array<ArrayBuffer> | null;
    r: Uint8Array<ArrayBuffer> | null;
  }>({ l: null, r: null });
  const activeVoicesRef = useRef<Map<number, SynthVoice>>(new Map());
  const recChunksRef = useRef<Blob[]>([]);
  const recDiscardRef = useRef(false);
  const recUrlRef = useRef<string | null>(null);
  const xfRef = useRef(crossfade);

  useEffect(() => {
    uiRef.current = { a: deckA, b: deckB };
  }, [deckA, deckB]);
  useEffect(() => {
    xfRef.current = crossfade;
  }, [crossfade]);

  /* a per-deck state patcher — defined first, everyone rides it */
  const setDeck = useCallback((id: DeckId, patch: Partial<DeckUi>) => {
    const setter = id === "a" ? setDeckA : setDeckB;
    setter((prev) => ({ ...prev, ...patch }));
  }, []);

  /* ------------------------ the merged shelf ----------------------- */
  const allTracks = useMemo<EtherTrack[]>(() => {
    const seen = new Set<string>();
    const out: EtherTrack[] = [];
    for (const tr of library) {
      if (!tr.audioUrl || seen.has(tr.audioUrl)) continue;
      seen.add(tr.audioUrl);
      out.push(tr);
    }
    const stage = [lcTrack, ...lcHistory];
    for (const tr of stage) {
      if (!tr?.audioUrl || seen.has(tr.audioUrl)) continue;
      seen.add(tr.audioUrl);
      out.push({
        id: tr.id,
        title: tr.title,
        audioUrl: tr.audioUrl,
        status: "succeeded",
        favorite: false,
        durationSec: tr.duration ?? null,
        source: "stage",
      });
    }
    out.push(DEMO_TRACK);
    return out;
  }, [library, lcTrack, lcHistory]);

  useEffect(() => {
    tracksRef.current = allTracks;
  }, [allTracks]);

  const deckTrack = useCallback(
    (id: DeckId): EtherTrack | null => {
      const tid = uiRef.current[id].trackId;
      if (!tid) return null;
      return tracksRef.current.find((tr) => tr.id === tid) ?? null;
    },
    []
  );

  /* ----------------------- the engine builder ---------------------- */
  const applyDeckToNodes = useCallback((id: DeckId, ui: DeckUi) => {
    const eng = engineRef.current;
    if (!eng) return;
    const d = eng.decks[id];
    const now = eng.ctx.currentTime;
    d.low.gain.setTargetAtTime(ui.low, now, 0.05);
    d.mid.gain.setTargetAtTime(ui.mid, now, 0.05);
    d.high.gain.setTargetAtTime(ui.high, now, 0.05);
    d.filter.frequency.setTargetAtTime(
      hzOf(ui.filterPos, FILTER_HZ_MIN, FILTER_HZ_MAX),
      now,
      0.05
    );
    d.filter.Q.setTargetAtTime(
      0.8 * Math.pow(10 / 0.8, ui.resoPos),
      now,
      0.05
    );
    d.out.gain.setTargetAtTime(ui.volume, now, 0.05);
    d.el.playbackRate = ui.rate;
    /* a live loop keeps its start and re-measures its length */
    if (ui.loop > 0) {
      d.loopEnd = d.loopStart + ui.loop * (60 / (ui.bpm * ui.rate));
    }
  }, []);

  const ensureEngine = useCallback((): Engine | null => {
    if (engineRef.current) {
      void engineRef.current.ctx.resume();
      return engineRef.current;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) {
      toast.error(t("This browser keeps no audio engine — the set cannot wake."));
      return null;
    }
    const ctx = new Ctor();
    void ctx.resume();

    /* THE MASTER CHAIN — in → analyser → gain → speakers + recorder */
    const masterIn = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.channelCount = 2;
    masterGain.channelCountMode = "explicit";
    const streamDest = ctx.createMediaStreamDestination();
    masterIn.connect(analyser);
    analyser.connect(masterGain);
    masterGain.connect(ctx.destination);
    masterGain.connect(streamDest);
    /* the honest L/R meters — one splitter, two eyes */
    const splitter = ctx.createChannelSplitter(2);
    masterGain.connect(splitter);
    const analyserL = ctx.createAnalyser();
    const analyserR = ctx.createAnalyser();
    analyserL.fftSize = 2048;
    analyserR.fftSize = 2048;
    splitter.connect(analyserL, 0);
    splitter.connect(analyserR, 1);

    /* one second of shared white noise for the drums */
    const noise = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate),
      ctx.sampleRate
    );
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    /* the two decks — each element marries its source exactly once */
    const mkDeck = (id: DeckId): DeckNodes => {
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      const source = ctx.createMediaElementSource(el);
      const input = ctx.createGain();
      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 200;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 4000;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = FILTER_HZ_MAX;
      filter.Q.value = 0.8;
      const out = ctx.createGain();
      const xfade = ctx.createGain();
      source.connect(input);
      input.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(filter);
      filter.connect(out);
      out.connect(xfade);
      xfade.connect(masterIn);
      el.addEventListener("error", () => {
        toast.error(t("A track stumbled while loading — pick it again."));
      });
      return {
        el,
        source,
        input,
        low,
        mid,
        high,
        filter,
        out,
        xfade,
        cue: 0,
        loopStart: 0,
        loopEnd: 0,
        rotation: 0,
        cueHeld: false,
        cueWasPlaying: false,
        lastCueTap: 0,
      };
    };

    /* THE SYNTH — voices → shared lowpass → gain → master, with one
       honest echo: gain → send → delay ↔ feedback → master */
    const synthFilter = ctx.createBiquadFilter();
    synthFilter.type = "lowpass";
    synthFilter.frequency.value = hzOf(0.72, CUTOFF_HZ_MIN, CUTOFF_HZ_MAX);
    synthFilter.Q.value = 0.5 * Math.pow(12 / 0.5, 0.15);
    const synthGain = ctx.createGain();
    synthGain.gain.value = 0.6;
    synthFilter.connect(synthGain);
    synthGain.connect(masterIn);
    const echoSend = ctx.createGain();
    echoSend.gain.value = 0.25;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.375;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    synthGain.connect(echoSend);
    echoSend.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(masterIn);

    /* the drum bus and the demo loop's own gain */
    const drumBus = ctx.createGain();
    drumBus.gain.value = 0.9;
    drumBus.connect(masterIn);
    const demoGain = ctx.createGain();
    demoGain.gain.value = 0.5;
    demoGain.connect(masterIn);

    const engine: Engine = {
      ctx,
      masterIn,
      analyser,
      analyserL,
      analyserR,
      masterGain,
      streamDest,
      decks: { a: mkDeck("a"), b: mkDeck("b") },
      synth: {
        filter: synthFilter,
        gain: synthGain,
        echoSend,
        voices: [],
        wave: synthWave,
        detune: synthDetune,
      },
      drumBus,
      noise,
      demo: { gain: demoGain, timer: null, nextTime: 0, step: 0, owner: null },
      recorder: null,
    };
    engineRef.current = engine;

    /* the decks wake with whatever the visitor already chose */
    (["a", "b"] as const).forEach((id) => {
      const tr = deckTrack(id);
      if (tr && tr.source !== "demo" && tr.audioUrl) {
        engine.decks[id].el.src = tr.audioUrl;
        engine.decks[id].el.load();
      }
      applyDeckToNodes(id, uiRef.current[id]);
    });
    /* and the crossfader wears its current shoulder at once */
    const xf = xfRef.current;
    engine.decks.a.xfade.gain.value = Math.cos(xf * (Math.PI / 2));
    engine.decks.b.xfade.gain.value = Math.cos((1 - xf) * (Math.PI / 2));
    return engine;
  }, [applyDeckToNodes, deckTrack, synthDetune, synthWave, t]);

  /* the demo loop's heartbeat — scheduled honestly by the clock */
  const stopDemo = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.demo.timer !== null) window.clearInterval(eng.demo.timer);
    eng.demo.timer = null;
    eng.demo.owner = null;
  }, []);

  /* ------------------------- the drum voices ----------------------- */
  function playKickAt(eng: Engine, at: number, dest: AudioNode) {
    const { ctx } = eng;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(40, at + 0.12);
    g.gain.setValueAtTime(0.85, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + 0.36);
  }

  function playSnareAt(eng: Engine, at: number, dest: AudioNode) {
    const { ctx, noise } = eng;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    src.connect(bp).connect(g).connect(dest);
    src.start(at);
    src.stop(at + 0.2);
    const body = ctx.createOscillator();
    const bg = ctx.createGain();
    body.type = "sine";
    body.frequency.value = 200;
    bg.gain.setValueAtTime(0.4, at);
    bg.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    body.connect(bg).connect(dest);
    body.start(at);
    body.stop(at + 0.13);
  }

  function playHatAt(eng: Engine, at: number, dest: AudioNode) {
    const { ctx, noise } = eng;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    src.connect(hp).connect(g).connect(dest);
    src.start(at);
    src.stop(at + 0.08);
  }

  function playClapAt(eng: Engine, at: number, dest: AudioNode) {
    const { ctx, noise } = eng;
    for (let i = 0; i < 3; i++) {
      const start = at + i * 0.03;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1200;
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      const peak = i === 2 ? 0.5 : 0.34;
      g.gain.setValueAtTime(peak, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      src.connect(bp).connect(g).connect(dest);
      src.start(start);
      src.stop(start + 0.09);
    }
  }

  const scheduleDemo = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || eng.demo.owner === null || eng.demo.timer === null) return;
    const ui = uiRef.current[eng.demo.owner];
    const stepDur = 60 / (ui.bpm * ui.rate) / 4;
    const { ctx } = eng;
    while (eng.demo.nextTime < ctx.currentTime + 0.28) {
      const at = eng.demo.nextTime;
      const step = eng.demo.step;
      if (step === 0 || step === 10) playKickAt(eng, at, eng.demo.gain);
      if (step === 4 || step === 12) playSnareAt(eng, at, eng.demo.gain);
      if (step % 4 === 2) playHatAt(eng, at, eng.demo.gain);
      const semi = DEMO_TONE_STEPS[step];
      if (semi >= 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 220 * Math.pow(2, semi / 12);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(0.16, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
        osc.connect(g).connect(eng.demo.gain);
        osc.start(at);
        osc.stop(at + 0.36);
      }
      eng.demo.nextTime += stepDur;
      eng.demo.step = (step + 1) % 16;
    }
  }, []);

  const startDemo = useCallback(
    (id: DeckId) => {
      const eng = ensureEngine();
      if (!eng) return;
      /* the house's voice sings in one place at a time */
      if (eng.demo.owner !== null && eng.demo.owner !== id) {
        setDeck(eng.demo.owner, { playing: false });
        stopDemo();
      }
      eng.demo.owner = id;
      eng.demo.step = 0;
      eng.demo.nextTime = eng.ctx.currentTime + 0.06;
      if (eng.demo.timer !== null) window.clearInterval(eng.demo.timer);
      eng.demo.timer = window.setInterval(scheduleDemo, 90);
      scheduleDemo();
    },
    [ensureEngine, scheduleDemo, setDeck, stopDemo]
  );

  const hitDrum = useCallback(
    (id: DrumId) => {
      const eng = ensureEngine();
      if (!eng) return;
      const at = eng.ctx.currentTime;
      const dest = eng.drumBus;
      if (id === "kick") playKickAt(eng, at, dest);
      else if (id === "snare") playSnareAt(eng, at, dest);
      else if (id === "hat") playHatAt(eng, at, dest);
      else playClapAt(eng, at, dest);
      setDrumFlash((f) => ({ ...f, [id]: true }));
      window.setTimeout(
        () => setDrumFlash((f) => ({ ...f, [id]: false })),
        320
      );
    },
    [ensureEngine]
  );

  /* ------------------------- the synth voice ----------------------- */
  const noteOn = useCallback(
    (pad: number) => {
      const eng = ensureEngine();
      if (!eng) return;
      const s = eng.synth;
      /* steal the oldest voice if the set is full */
      while (s.voices.length >= 16) {
        const old = s.voices.shift();
        if (old) {
          for (const o of old.oscs) {
            try {
              o.stop();
            } catch {
              /* already silent */
            }
          }
        }
      }
      const now = eng.ctx.currentTime;
      const freq = SYNTH_PADS[pad].freq;
      const g = eng.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.42, now + 0.01); // attack
      g.gain.linearRampToValueAtTime(0.42 * 0.7, now + 0.16); // decay → sustain
      const oscs: OscillatorNode[] = [];
      const mk = (detuneCents: number) => {
        const osc = eng.ctx.createOscillator();
        osc.type = s.wave;
        osc.frequency.value = freq;
        osc.detune.value = detuneCents;
        osc.connect(g);
        osc.start(now);
        oscs.push(osc);
        return osc;
      };
      mk(0);
      if (s.detune) mk(7);
      g.connect(s.filter);
      const voice: SynthVoice = { oscs, gain: g };
      s.voices.push(voice);
      activeVoicesRef.current.set(pad, voice);
      setPressed((p) => new Set(p).add(pad));
    },
    [ensureEngine]
  );

  const noteOff = useCallback((pad: number) => {
    const eng = engineRef.current;
    const voice = activeVoicesRef.current.get(pad);
    activeVoicesRef.current.delete(pad);
    setPressed((p) => {
      const n = new Set(p);
      n.delete(pad);
      return n;
    });
    if (!eng || !voice) return;
    const now = eng.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.09); // release
    for (const o of voice.oscs) {
      try {
        o.stop(now + 0.4);
      } catch {
        /* already silent */
      }
    }
    const list = eng.synth.voices;
    const idx = list.indexOf(voice);
    if (idx >= 0) list.splice(idx, 1);
  }, []);

  /* ------------------------ the deck controls ---------------------- */
  const playDeck = useCallback(
    (id: DeckId) => {
      const eng = ensureEngine();
      if (!eng) return;
      const tr = deckTrack(id);
      if (!tr) return;
      if (tr.source !== "demo" && tr.status !== "succeeded") return;
      if (tr.source === "demo") {
        startDemo(id);
        setDeck(id, { playing: true });
        return;
      }
      const d = eng.decks[id];
      void d.el
        .play()
        .then(() => setDeck(id, { playing: true }))
        .catch(() => {
          setDeck(id, { playing: false });
          toast.error(t("The track would not wake — pick it again."));
        });
    },
    [deckTrack, ensureEngine, setDeck, startDemo, t]
  );

  const pauseDeck = useCallback(
    (id: DeckId) => {
      const eng = engineRef.current;
      if (eng?.demo.owner === id) stopDemo();
      eng?.decks[id].el.pause();
      setDeck(id, { playing: false });
    },
    [setDeck, stopDemo]
  );

  const togglePlay = useCallback(
    (id: DeckId) => {
      if (uiRef.current[id].playing) pauseDeck(id);
      else playDeck(id);
    },
    [pauseDeck, playDeck]
  );

  const loadTrack = useCallback(
    (id: DeckId, tr: EtherTrack) => {
      const eng = engineRef.current;
      if (eng?.demo.owner === id) stopDemo();
      const d = eng?.decks[id];
      if (eng && d) {
        d.el.pause();
        /* the keeps are written through the engine's own record — the
           compiler's immutability eye never loses the ref's provenance */
        eng.decks[id].cue = 0;
        eng.decks[id].loopStart = 0;
        eng.decks[id].loopEnd = 0;
        if (tr.source !== "demo" && tr.audioUrl) {
          eng.decks[id].el.src = tr.audioUrl;
          eng.decks[id].el.load();
        } else {
          eng.decks[id].el.removeAttribute("src");
          eng.decks[id].el.load();
        }
      }
      setPickerOpen(null);
      setDeck(id, {
        trackId: tr.id,
        playing: false,
        synced: false,
        loop: 0,
        bpm: tr.source === "demo" ? 120 : uiRef.current[id].bpm,
      });
    },
    [setDeck, stopDemo]
  );

  /* CUE — press-and-hold previews from the cue point; release jumps
     back; a double-tap lays the cue down where the music stands */
  const cueDown = useCallback(
    (id: DeckId) => {
      const eng = ensureEngine();
      if (!eng) return;
      const d = eng.decks[id];
      const ui = uiRef.current[id];
      const tr = deckTrack(id);
      if (!tr || tr.source === "demo") return;
      const now = performance.now();
      if (now - d.lastCueTap < 350) {
        d.cue = Number.isFinite(d.el.currentTime) ? d.el.currentTime : 0;
        d.lastCueTap = 0;
        return;
      }
      d.lastCueTap = now;
      d.cueHeld = true;
      d.cueWasPlaying = ui.playing;
      if (Number.isFinite(d.el.duration) && d.el.duration > 0) {
        d.el.currentTime = d.cue;
      }
      if (!ui.playing) playDeck(id);
    },
    [deckTrack, ensureEngine, playDeck]
  );

  const cueUp = useCallback(
    (id: DeckId) => {
      const eng = engineRef.current;
      if (!eng) return;
      const d = eng.decks[id];
      /* only a held cue may be released — a stray leave never jumps */
      if (!d.cueHeld) return;
      d.cueHeld = false;
      const tr = deckTrack(id);
      if (!tr || tr.source === "demo") return;
      if (Number.isFinite(d.el.duration) && d.el.duration > 0) {
        d.el.currentTime = d.cue;
      }
      if (!d.cueWasPlaying) pauseDeck(id);
      d.cueWasPlaying = false;
    },
    [deckTrack, pauseDeck]
  );

  const cycleLoop = useCallback(
    (id: DeckId) => {
      const eng = engineRef.current;
      const ui = uiRef.current[id];
      const order: LoopBeats[] = [0, 4, 8, 16];
      const next = order[(order.indexOf(ui.loop) + 1) % order.length];
      if (eng && next > 0) {
        const d = eng.decks[id];
        d.loopStart = Number.isFinite(d.el.currentTime)
          ? d.el.currentTime
          : 0;
        d.loopEnd =
          d.loopStart + next * (60 / (ui.bpm * ui.rate));
      }
      setDeck(id, { loop: next, synced: false });
    },
    [setDeck]
  );

  const syncDeck = useCallback(
    (id: DeckId) => {
      const other = id === "a" ? "b" : "a";
      setDeck(id, {
        bpm: uiRef.current[other].bpm,
        rate: 1,
        synced: true,
      });
    },
    [setDeck]
  );

  /* the jog — a horizontal drag scrubs the record, spinning as it goes */
  const jogDown = useCallback(
    (id: DeckId, e: ReactPointerEvent<HTMLDivElement>) => {
      const eng = engineRef.current;
      const tr = deckTrack(id);
      if (!eng || !tr || tr.source === "demo") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current[id] = { x: e.clientX, at: eng.decks[id].el.currentTime };
    },
    [deckTrack]
  );

  const jogMove = useCallback(
    (id: DeckId, e: ReactPointerEvent<HTMLDivElement>) => {
      const eng = engineRef.current;
      const drag = dragRef.current[id];
      if (!eng || !drag || e.buttons !== 1) return;
      const d = eng.decks[id];
      const dur = Number.isFinite(d.el.duration) ? d.el.duration : 0;
      const next = Math.min(
        Math.max(0, drag.at + (e.clientX - drag.x) * 0.01),
        Math.max(0, dur - 0.05)
      );
      d.el.currentTime = next;
      d.rotation += (e.clientX - drag.x) * 0.6;
      drag.x = e.clientX;
      drag.at = next;
    },
    []
  );

  const jogUp = useCallback((id: DeckId) => {
    dragRef.current[id] = null;
  }, []);

  /* -------------------------- the recorder ------------------------- */
  const pickMime = () => {
    if (typeof MediaRecorder === "undefined") return "";
    return REC_MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
  };

  const startRec = useCallback(() => {
    const eng = ensureEngine();
    if (!eng) return;
    if (recActive || eng.recorder) return;
    const mime = pickMime();
    try {
      const rec = new MediaRecorder(
        eng.streamDest.stream,
        mime ? { mimeType: mime } : undefined
      );
      recChunksRef.current = [];
      recDiscardRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) recChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        eng.recorder = null;
        if (recDiscardRef.current) return;
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(recChunksRef.current, { type });
        if (blob.size === 0) {
          toast.error(t("The silence kept nothing — the set played too quiet."));
          return;
        }
        const url = URL.createObjectURL(blob);
        recUrlRef.current = url;
        setRecResult({
          url,
          size: blob.size,
          name: type.includes("mp4") ? "ethermix-set.mp4" : "ethermix-set.webm",
        });
      };
      rec.start();
      eng.recorder = rec;
      setRecActive(true);
      setRecSecs(0);
    } catch {
      toast.error(t("The recorder could not wake — the set still plays."));
    }
  }, [ensureEngine, recActive, t]);

  const stopRec = useCallback(() => {
    const eng = engineRef.current;
    const rec = eng?.recorder;
    if (!rec) return;
    setRecActive(false);
    try {
      rec.stop();
    } catch {
      eng.recorder = null;
    }
  }, []);

  const discardRec = useCallback(() => {
    if (recUrlRef.current) {
      URL.revokeObjectURL(recUrlRef.current);
      recUrlRef.current = null;
    }
    setRecResult(null);
  }, []);

  /* the elapsed breath while recording */
  useEffect(() => {
    if (!recActive) return;
    const iv = window.setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => window.clearInterval(iv);
  }, [recActive]);

  /* ------------------------- the shelf wake ------------------------ */
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/music-library", { cache: "no-store" });
        if (!alive) return;
        if (res.status === 401) {
          setAnon(true);
          return;
        }
        const data = (await res.json().catch(() => null)) as {
          tracks?: {
            id: string;
            title: string;
            audioUrl: string;
            durationSec: number | null;
            status: string;
            favorite: boolean;
          }[];
        } | null;
        if (!res.ok || !data?.tracks) {
          toast.error(
            tRef.current("The shelf rests a moment — your tracks join when it wakes.")
          );
          return;
        }
        setLibrary(
          data.tracks.map((r) => ({
            id: r.id,
            title: r.title,
            audioUrl: r.audioUrl,
            status: r.status,
            favorite: Boolean(r.favorite),
            durationSec: r.durationSec,
            source: "library" as const,
          }))
        );
      } catch {
        if (alive) {
          toast.error(
            tRef.current("The shelf rests a moment — your tracks join when it wakes.")
          );
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ------------------- the room's own housekeeping ------------------ */
  /* the accent — read once from the room's own light */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const v = getComputedStyle(el).getPropertyValue("--scope-a").trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) {
      const n = parseInt(m[1], 16);
      const r = ((n >> 16) & 255) / 255;
      const g = ((n >> 8) & 255) / 255;
      const b = (n & 255) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      let h = 0;
      if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
      }
      accentRef.current.hue = ((h * 60) % 360 + 360) % 360;
    }
  }, []);

  /* the body's scroll rests while the set stands */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Esc lays the whole set down */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* THE INSTRUMENT KEYS — a…; play the pads, z x c v the drums.
     Modifiers and typing hands are always respected. */
  useEffect(() => {
    const isTyping = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      const pad = SYNTH_PADS.findIndex((p) => p.key === k);
      if (pad >= 0) {
        if (!e.repeat) noteOn(pad);
        e.preventDefault();
        return;
      }
      const drum = DRUM_PADS.findIndex((p) => p.key === k);
      if (drum >= 0) {
        if (!e.repeat) hitDrum(DRUM_PADS[drum].id);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const pad = SYNTH_PADS.findIndex((p) => p.key === k);
      if (pad >= 0) noteOff(pad);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [hitDrum, noteOff, noteOn]);

  /* THE HOUSE LAW — a page turn pauses the set (the room's cleanup
     registry; the work is never erased, only the breath is released) */
  useEffect(() => {
    const pauseAll = () => {
      const eng = engineRef.current;
      if (!eng) return;
      stopDemo();
      eng.decks.a.el.pause();
      eng.decks.b.el.pause();
      setDeckA((p) => ({ ...p, playing: false }));
      setDeckB((p) => ({ ...p, playing: false }));
    };
    return registerWorkspaceCleanup("lightcodes", pauseAll);
  }, [stopDemo]);

  /* --------------------- state → node parameters ------------------- */
  useEffect(() => {
    applyDeckToNodes("a", deckA);
  }, [applyDeckToNodes, deckA]);
  useEffect(() => {
    applyDeckToNodes("b", deckB);
  }, [applyDeckToNodes, deckB]);

  /* the equal-power crossfade — cosine shoulders, never a dip */
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const now = eng.ctx.currentTime;
    eng.decks.a.xfade.gain.setTargetAtTime(
      Math.cos(crossfade * (Math.PI / 2)),
      now,
      0.03
    );
    eng.decks.b.xfade.gain.setTargetAtTime(
      Math.cos((1 - crossfade) * (Math.PI / 2)),
      now,
      0.03
    );
  }, [crossfade]);

  /* the synth panel → the shared voice */
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.synth.wave = synthWave;
    eng.synth.detune = synthDetune;
    const now = eng.ctx.currentTime;
    eng.synth.filter.frequency.setTargetAtTime(
      hzOf(synthCutoff, CUTOFF_HZ_MIN, CUTOFF_HZ_MAX),
      now,
      0.04
    );
    eng.synth.filter.Q.setTargetAtTime(
      0.5 * Math.pow(12 / 0.5, synthReso),
      now,
      0.04
    );
    eng.synth.echoSend.gain.setTargetAtTime(synthEcho, now, 0.04);
    eng.synth.gain.gain.setTargetAtTime(synthVol, now, 0.04);
  }, [synthCutoff, synthDetune, synthEcho, synthReso, synthVol, synthWave]);

  /* ------------------- the draw loop (one RAF) ---------------------- */
  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      rafRef.current = requestAnimationFrame(loop);
      const eng = engineRef.current;
      const now = performance.now();

      /* --- the prismatic spectrum --- */
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w > 0 && h > 0) {
          if (canvas.width !== Math.round(w * dpr)) {
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
          }
          const g = canvas.getContext("2d");
          if (g) {
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);
            const bars = 56;
            const gap = 3;
            const bw = (w - gap * (bars - 1)) / bars;
            const cy = h / 2;
            const hue0 = accentRef.current.hue;
            let spec = specBufRef.current.arr;
            if (eng) {
              const need = eng.analyser.frequencyBinCount;
              if (!spec || spec.length !== need) {
                spec = new Uint8Array(need);
                specBufRef.current.arr = spec;
              }
              eng.analyser.getByteFrequencyData(spec);
            }
            for (let i = 0; i < bars; i++) {
              let v: number;
              if (spec) {
                const bin = Math.floor(
                  Math.pow(i / bars, 1.6) * spec.length * 0.72
                );
                v = spec[Math.min(spec.length - 1, bin)] / 255;
              } else {
                v = 0.05 + 0.035 * Math.sin(now * 0.001 + i * 0.38);
              }
              const bh = Math.max(2, v * (h / 2 - 6));
              const x = i * (bw + gap);
              const hue =
                hue0 + Math.sin(now * 0.0006) * 26 + i * 0.55;
              g.fillStyle = `hsla(${hue.toFixed(1)}, 82%, ${(52 + v * 20).toFixed(1)}%, ${(0.3 + v * 0.62).toFixed(2)})`;
              g.fillRect(x, cy - bh, bw, bh * 2);
              /* the gold crown on the loudest bars */
              if (v > 0.7) {
                g.fillStyle = `rgba(232, 217, 176, ${Math.min(1, (v - 0.7) * 3).toFixed(2)})`;
                g.fillRect(x, cy - bh - 3, bw, 2);
              }
            }
          }
        }
      }

      if (!eng) return;

      /* --- the honest L/R meters --- */
      const rmsOf = (a: AnalyserNode, buf: Uint8Array<ArrayBuffer> | null) => {
        const need = a.fftSize;
        const arr = buf && buf.length === need ? buf : new Uint8Array(need);
        a.getByteTimeDomainData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          const d = (arr[i] - 128) / 128;
          sum += d * d;
        }
        return Math.sqrt(sum / arr.length);
      };
      if (!meterBufRef.current.l || meterBufRef.current.l.length !== eng.analyserL.fftSize)
        meterBufRef.current.l = new Uint8Array(eng.analyserL.fftSize);
      if (!meterBufRef.current.r || meterBufRef.current.r.length !== eng.analyserR.fftSize)
        meterBufRef.current.r = new Uint8Array(eng.analyserR.fftSize);
      const lv = rmsOf(eng.analyserL, meterBufRef.current.l);
      const rv = rmsOf(eng.analyserR, meterBufRef.current.r);
      if (meterRefs.current.l)
        meterRefs.current.l.style.width = `${Math.min(100, lv * 220).toFixed(1)}%`;
      if (meterRefs.current.r)
        meterRefs.current.r.style.width = `${Math.min(100, rv * 220).toFixed(1)}%`;

      /* --- the decks: loop keep, end keep, time, spin --- */
      (["a", "b"] as const).forEach((id) => {
        const d = eng.decks[id];
        const ui = uiRef.current[id];
        if (ui.loop > 0 && ui.playing && !dragRef.current[id]) {
          if (
            Number.isFinite(d.el.duration) &&
            d.loopEnd > d.loopStart + 0.05 &&
            d.el.currentTime >= d.loopEnd - 0.02
          ) {
            d.el.currentTime = d.loopStart;
          }
        }
        if (ui.playing && d.el.ended) {
          setDeck(id, { playing: false });
        }
        const tEl = timeRefs.current[id];
        if (tEl) {
          tEl.textContent = `${fmtTime(d.el.currentTime)} / ${fmtTime(
            Number.isFinite(d.el.duration) ? d.el.duration : 0
          )}`;
        }
        if (ui.playing && !dragRef.current[id]) {
          d.rotation += 1.4 * ui.rate;
        }
        const jog = jogRefs.current[id];
        if (jog) jog.style.transform = `rotate(${(d.rotation % 360).toFixed(1)}deg)`;
      });
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [setDeck]);

  /* ------------------------- THE CLEANUP LAW ----------------------- */
  useEffect(
    () => () => {
      const eng = engineRef.current;
      if (!eng) return;
      engineRef.current = null;
      if (eng.demo.timer !== null) window.clearInterval(eng.demo.timer);
      for (const id of ["a", "b"] as const) {
        const d = eng.decks[id];
        d.el.pause();
        d.el.removeAttribute("src");
        d.el.load();
        try {
          d.source.disconnect();
        } catch {
          /* the context's own closing will finish the job */
        }
      }
      for (const v of eng.synth.voices) {
        for (const o of v.oscs) {
          try {
            o.stop();
          } catch {
            /* already silent */
          }
        }
      }
      eng.synth.voices.length = 0;
      activeVoicesRef.current.clear();
      if (eng.recorder && eng.recorder.state === "recording") {
        recDiscardRef.current = true;
        eng.recorder.onstop = null;
        try {
          eng.recorder.stop();
        } catch {
          /* the stream dies with the context */
        }
      }
      if (recUrlRef.current) {
        URL.revokeObjectURL(recUrlRef.current);
        recUrlRef.current = null;
      }
      try {
        eng.masterIn.disconnect();
        eng.masterGain.disconnect();
      } catch {
        /* closing finishes the rest */
      }
      void eng.ctx.close();
    },
    []
  );

  /* ---------------------------- the render ------------------------- */
  const fmtHz = (pos: number, min: number, max: number) => {
    const f = hzOf(pos, min, max);
    return f >= 1000 ? `${(f / 1000).toFixed(1)} kHz` : `${Math.round(f)} Hz`;
  };
  const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
  const fmtDb = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`;
  const fmtRate = (r: number) => {
    const pct = (r - 1) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  /* one deck panel — rendered twice, dressed once */
  const renderDeck = (id: DeckId) => {
    const ui = id === "a" ? deckA : deckB;
    const track = allTracks.find((tr) => tr.id === ui.trackId) ?? null;
    const playable =
      track !== null && (track.source === "demo" || track.status === "succeeded");
    const isDemo = track?.source === "demo";
    return (
      <div key={id} style={{ perspective: "1200px" }}>
        <section
          className={cn(CRYSTAL_PANEL, "flex flex-col gap-3 p-4")}
          style={CRYSTAL_BORDER}
          aria-label={t("Deck {id}", { id: id.toUpperCase() })}
        >
          {/* the prismatic top edge */}
          <div
            aria-hidden="true"
            className={cn("absolute inset-x-4 top-0 h-px", PRISM_EDGE)}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="font-[family-name:Cinzel] text-[12px] tracking-[0.3em] text-[var(--scope-a)]">
              {t("Deck {id}", { id: id.toUpperCase() })}
            </span>
            {ui.synced && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--scope-a) 14%, transparent)",
                  color: "var(--scope-a)",
                }}
              >
                {t("synced")}
              </span>
            )}
            {track && !playable && (
              <span className="text-[11px] italic text-muted-foreground">
                {t("weaving…")}
              </span>
            )}
          </div>

          {/* the picker */}
          <div className="relative">
            <button
              type="button"
              data-testid={`ethermix-track-${id}`}
              aria-expanded={pickerOpen === id}
              onClick={() =>
                setPickerOpen((p) => (p === id ? null : id))
              }
              className="btn-chip flex h-11 w-full items-center justify-between px-3 text-left text-[12.5px]"
            >
              <span className="min-w-0 truncate">
                {track
                  ? track.title
                  : t("Load a track onto this deck")}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
            </button>
            {pickerOpen === id && (
              <div
                className="nice-scroll absolute inset-x-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border bg-background/95 p-1 shadow-xl backdrop-blur-xl"
                style={CRYSTAL_BORDER}
                role="listbox"
                aria-label={t("Your woven tracks")}
              >
                {allTracks.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    role="option"
                    aria-selected={tr.id === ui.trackId}
                    onClick={() => loadTrack(id, tr)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] hover:bg-foreground/5"
                  >
                    <span className="min-w-0 truncate">{tr.title}</span>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">
                      {tr.source === "demo"
                        ? t("demo")
                        : tr.status !== "succeeded"
                          ? t("weaving…")
                          : tr.durationSec
                            ? fmtTime(tr.durationSec)
                            : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* transport */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid={`ethermix-deck-${id}-play`}
              onClick={() => togglePlay(id)}
              disabled={!playable}
              aria-pressed={ui.playing}
              aria-label={ui.playing ? t("Pause") : t("Play")}
              className="btn-chip flex h-11 w-11 items-center justify-center disabled:opacity-40"
              style={
                ui.playing
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--scope-a) 18%, transparent)",
                      color: "var(--scope-a)",
                    }
                  : undefined
              }
            >
              {ui.playing ? (
                <Pause className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                cueDown(id);
              }}
              onPointerUp={() => cueUp(id)}
              onPointerCancel={() => cueUp(id)}
              onPointerLeave={() => cueUp(id)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                  e.preventDefault();
                  cueDown(id);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter" || e.key === " ") cueUp(id);
              }}
              disabled={!playable || isDemo}
              aria-label={t("Cue — hold to preview, double-tap to set")}
              className="btn-chip h-11 flex-1 px-3 text-[11.5px] uppercase tracking-widest disabled:opacity-40"
            >
              {t("Cue")}
            </button>
            <button
              type="button"
              onClick={() => syncDeck(id)}
              disabled={!playable}
              title={t(
                "Beat-matches the other deck's tempo control — it does not match key."
              )}
              aria-pressed={ui.synced}
              className="btn-chip h-11 px-3 text-[11.5px] uppercase tracking-widest disabled:opacity-40"
            >
              {t("Sync")}
            </button>
          </div>

          {/* the jog wheel and the clock */}
          <div className="flex items-center gap-4">
            <div
              onPointerDown={(e) => jogDown(id, e)}
              onPointerMove={(e) => jogMove(id, e)}
              onPointerUp={() => jogUp(id)}
              onPointerCancel={() => jogUp(id)}
              className={cn(
                "relative flex size-24 shrink-0 touch-none items-center justify-center rounded-full border md:size-28",
                isDemo
                  ? "opacity-50"
                  : "cursor-grab active:cursor-grabbing"
              )}
              style={{
                ...CRYSTAL_BORDER,
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.35), color-mix(in srgb, var(--scope-a) 16%, transparent) 46%, transparent 75%), var(--glass-bg-soft)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 30px -12px color-mix(in srgb, var(--scope-a) 55%, transparent)",
              }}
              role="group"
              tabIndex={isDemo ? -1 : 0}
              aria-label={t("Jog wheel — drag sideways to scrub")}
            >
              <div
                ref={(el) => {
                  jogRefs.current[id] = el;
                }}
                className="absolute inset-1.5 rounded-full border"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 26%, transparent)",
                }}
              >
                <span
                  className="absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: "var(--scope-a)" }}
                />
              </div>
              <Disc3
                className="size-6 opacity-40"
                aria-hidden="true"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span
                ref={(el) => {
                  timeRefs.current[id] = el;
                }}
                className="text-[13px] tabular-nums text-foreground/85"
              >
                0:00 / 0:00
              </span>
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  {t("BPM")}
                </label>
                <input
                  type="number"
                  min={60}
                  max={200}
                  step={1}
                  value={ui.bpm}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v)) return;
                    setDeck(id, {
                      bpm: Math.min(200, Math.max(60, Math.round(v))),
                      synced: false,
                    });
                  }}
                  className="h-8 w-16 rounded-lg border bg-transparent px-2 text-center text-[12px] tabular-nums outline-none focus-glow"
                  style={CRYSTAL_BORDER}
                  aria-label={t("Deck {id} tempo in BPM", { id: id.toUpperCase() })}
                />
                <button
                  type="button"
                  onClick={() => cycleLoop(id)}
                  disabled={!playable || isDemo}
                  aria-pressed={ui.loop > 0}
                  className="btn-chip h-8 px-2.5 text-[11px] disabled:opacity-40"
                >
                  <Repeat className="size-3.5" aria-hidden="true" />
                  {ui.loop > 0 ? `${ui.loop}` : t("Loop")}
                </button>
              </div>
              <CrystalSlider
                value={ui.rate}
                min={TEMPO_MIN}
                max={TEMPO_MAX}
                step={0.005}
                keyStep={0.01}
                label={t("Deck {id} tempo", { id: id.toUpperCase() })}
                display={fmtRate(ui.rate)}
                onChange={(v) => setDeck(id, { rate: v, synced: false })}
              />
            </div>
          </div>

          {/* EQ + filter + volume */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            <CrystalSlider
              value={ui.low}
              min={-12}
              max={12}
              step={0.5}
              label={t("Low")}
              display={fmtDb(ui.low)}
              onChange={(v) => setDeck(id, { low: v })}
            />
            <CrystalSlider
              value={ui.mid}
              min={-12}
              max={12}
              step={0.5}
              label={t("Mid")}
              display={fmtDb(ui.mid)}
              onChange={(v) => setDeck(id, { mid: v })}
            />
            <CrystalSlider
              value={ui.high}
              min={-12}
              max={12}
              step={0.5}
              label={t("High")}
              display={fmtDb(ui.high)}
              onChange={(v) => setDeck(id, { high: v })}
            />
            <CrystalSlider
              value={ui.filterPos}
              min={0}
              max={1}
              step={0.01}
              label={t("Filter")}
              display={fmtHz(ui.filterPos, FILTER_HZ_MIN, FILTER_HZ_MAX)}
              onChange={(v) => setDeck(id, { filterPos: v })}
            />
            <CrystalSlider
              value={ui.resoPos}
              min={0}
              max={1}
              step={0.01}
              label={t("Resonance")}
              display={(0.8 * Math.pow(10 / 0.8, ui.resoPos)).toFixed(1)}
              onChange={(v) => setDeck(id, { resoPos: v })}
            />
            <CrystalSlider
              value={ui.volume}
              min={0}
              max={1}
              step={0.01}
              label={t("Deck {id} volume", { id: id.toUpperCase() })}
              display={fmtPct(ui.volume)}
              onChange={(v) => setDeck(id, { volume: v })}
            />
          </div>
          <div className="flex justify-between text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <span>{t("Low · Mid · High")}</span>
            <span>{t("Filter · Reso · Vol")}</span>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("The Ethermix deck")}
      data-testid="ethermix-deck"
      className="fixed inset-0 z-[90] flex flex-col bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-2xl"
    >
      <style>{ETHERMIX_CSS}</style>

      {/* ------------------------- the header ------------------------- */}
      <header
        className="relative shrink-0 border-b hairline px-4 pb-3 pt-3 sm:px-6"
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a) 24%, transparent)",
        }}
      >
        <div
          aria-hidden="true"
          className={cn("absolute inset-x-0 top-0 h-px", PRISM_EDGE)}
        />
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rotate-45 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(168,85,247,0.7),rgba(232,217,176,0.85))] shadow-[0_0_12px_color-mix(in_srgb,var(--scope-a)_60%,transparent)]"
          />
          <h2 className="font-[family-name:Cinzel] text-[17px] tracking-[0.34em] text-[var(--scope-a)]">
            {t("ETHERMIX")}
          </h2>
          <span className="hidden text-[11.5px] italic text-muted-foreground sm:inline">
            {t("the crystal set — two decks, a synth, the drums")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {recResult ? (
              <>
                <a
                  data-testid="ethermix-recording"
                  href={recResult.url}
                  download={recResult.name}
                  className="btn-chip flex h-9 items-center gap-1.5 px-3 text-[12px]"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--scope-a) 14%, transparent)",
                    color: "var(--scope-a)",
                  }}
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  {recResult.name} · {fmtSize(recResult.size)}
                </a>
                <button
                  type="button"
                  onClick={discardRec}
                  aria-label={t("Discard the recording")}
                  className="btn-chip flex h-9 w-9 items-center justify-center"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                data-testid="ethermix-rec"
                onClick={() => (recActive ? stopRec() : startRec())}
                aria-pressed={recActive}
                className="btn-chip flex h-9 items-center gap-2 px-3 text-[12px]"
                style={
                  recActive
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, #ef4444 12%, transparent)",
                        color: "#ef4444",
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full bg-red-500",
                    recActive && "ethermix-rec-dot"
                  )}
                />
                {recActive
                  ? `${t("Recording")} · ${fmtTime(recSecs)}`
                  : t("Record the set")}
              </button>
            )}
            <button
              type="button"
              data-testid="ethermix-close"
              onClick={onClose}
              aria-label={t("Close the deck")}
              className="btn-chip flex h-9 w-9 items-center justify-center"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {anon && (
          <p className="mx-auto mt-2 w-full max-w-[1120px] text-[11.5px] italic text-muted-foreground">
            {t(
              "Sign in to load your woven tracks — the deck still plays with the house's voices."
            )}
          </p>
        )}
      </header>

      {/* ---------------------- the scrolling set ---------------------- */}
      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-10 pt-4 sm:px-5">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">
          {/* the prismatic spectrum */}
          <div
            className={cn(CRYSTAL_PANEL, "h-28 overflow-hidden")}
            style={CRYSTAL_BORDER}
            aria-hidden="true"
          >
            <canvas
              ref={canvasRef}
              className="ethermix-canvas-glow h-full w-full"
            />
          </div>

          {/* the two decks */}
          <div className="grid items-start gap-4 md:grid-cols-2">
            {renderDeck("a")}
            {renderDeck("b")}
          </div>

          {/* the mixer rail — crossfader and the honest meters */}
          <div style={{ perspective: "1200px" }}>
            <section
              className={cn(CRYSTAL_PANEL, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center")}
              style={CRYSTAL_BORDER}
              aria-label={t("The mixer")}
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  className="size-4 shrink-0 text-[var(--scope-a)]"
                  aria-hidden="true"
                />
                <span className="w-6 text-center font-[family-name:Cinzel] text-[11px] tracking-widest">
                  A
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <CrystalSlider
                  value={crossfade}
                  min={0}
                  max={1}
                  step={0.01}
                  keyStep={0.03}
                  testid="ethermix-crossfader"
                  label={t("Crossfader — deck A to deck B")}
                  display={`${Math.round((1 - crossfade) * 100)} / ${Math.round(crossfade * 100)}`}
                  onChange={setCrossfade}
                />
              </div>
              <span className="w-6 text-center font-[family-name:Cinzel] text-[11px] tracking-widest">
                B
              </span>
              <div className="flex w-full shrink-0 flex-col gap-1 sm:w-44">
                {(["L", "R"] as const).map((side) => (
                  <div key={side} className="flex items-center gap-2">
                    <span className="w-3 text-[10px] tabular-nums text-muted-foreground">
                      {side}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)]">
                      <div
                        ref={(el) => {
                          if (side === "L") meterRefs.current.l = el;
                          else meterRefs.current.r = el;
                        }}
                        className="h-full w-0 rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--scope-a)_80%,transparent),rgba(232,217,176,0.85))]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --------------------- the synthesizer --------------------- */}
          <div style={{ perspective: "1200px" }}>
            <section
              className={cn(CRYSTAL_PANEL, "flex flex-col gap-3 p-4")}
              style={CRYSTAL_BORDER}
              aria-label={t("The synthesizer")}
            >
              <div
                aria-hidden="true"
                className={cn("absolute inset-x-4 top-0 h-px", PRISM_EDGE)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Waves className="size-4 text-[var(--scope-a)]" aria-hidden="true" />
                <h3 className="font-[family-name:Cinzel] text-[12px] tracking-[0.3em] text-[var(--scope-a)]">
                  {t("THE SYNTH")}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {t("A minor pentatonic — keys a s d f g h j k l ;")}
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <select
                    value={synthWave}
                    onChange={(e) => setSynthWave(e.target.value as SynthWave)}
                    aria-label={t("Waveform")}
                    className="h-9 rounded-lg border bg-transparent px-2 text-[12px] outline-none focus-glow"
                    style={CRYSTAL_BORDER}
                  >
                    <option value="sine">{t("Sine")}</option>
                    <option value="triangle">{t("Triangle")}</option>
                    <option value="sawtooth">{t("Saw")}</option>
                    <option value="square">{t("Square")}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSynthDetune((d) => !d)}
                    aria-pressed={synthDetune}
                    className={cn(
                      "btn-chip h-9 px-3 text-[11.5px]",
                      !synthDetune && "opacity-55"
                    )}
                  >
                    {t("Detune +7¢")}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
                <CrystalSlider
                  value={synthCutoff}
                  min={0}
                  max={1}
                  step={0.01}
                  label={t("Cutoff")}
                  display={fmtHz(synthCutoff, CUTOFF_HZ_MIN, CUTOFF_HZ_MAX)}
                  onChange={setSynthCutoff}
                />
                <CrystalSlider
                  value={synthReso}
                  min={0}
                  max={1}
                  step={0.01}
                  label={t("Resonance")}
                  display={(0.5 * Math.pow(12 / 0.5, synthReso)).toFixed(1)}
                  onChange={setSynthReso}
                />
                <CrystalSlider
                  value={synthEcho}
                  min={0}
                  max={1}
                  step={0.01}
                  label={t("Echo")}
                  display={fmtPct(synthEcho)}
                  onChange={setSynthEcho}
                />
                <CrystalSlider
                  value={synthVol}
                  min={0}
                  max={1}
                  step={0.01}
                  label={t("Synth volume")}
                  display={fmtPct(synthVol)}
                  onChange={setSynthVol}
                />
              </div>
              {/* the ten pads */}
              <div className="grid grid-cols-5 gap-2">
                {SYNTH_PADS.map((p, i) => (
                  <button
                    key={p.note}
                    type="button"
                    data-testid={`ethermix-synth-pad-${i}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      noteOn(i);
                    }}
                    onPointerUp={() => noteOff(i)}
                    onPointerLeave={() => noteOff(i)}
                    onPointerCancel={() => noteOff(i)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                        e.preventDefault();
                        noteOn(i);
                      }
                    }}
                    onKeyUp={(e) => {
                      if (e.key === "Enter" || e.key === " ") noteOff(i);
                    }}
                    aria-label={`${t("Pad")} ${p.note}`}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center rounded-xl border uppercase transition-colors",
                      pressed.has(i) && "ethermix-flash"
                    )}
                    style={{
                      ...CRYSTAL_BORDER,
                      backgroundColor: pressed.has(i)
                        ? "color-mix(in srgb, var(--scope-a) 20%, transparent)"
                        : "color-mix(in srgb, var(--scope-a) 6%, transparent)",
                      boxShadow: pressed.has(i)
                        ? "inset 0 0 18px color-mix(in srgb, var(--scope-a) 45%, transparent)"
                        : "inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                  >
                    <span className="text-[12.5px] font-medium tracking-wide">
                      {p.note}
                    </span>
                    <span className="text-[9.5px] uppercase text-muted-foreground">
                      {p.key === ";" ? ";" : p.key}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ------------------------ the drums ------------------------ */}
          <div style={{ perspective: "1200px" }}>
            <section
              className={cn(CRYSTAL_PANEL, "flex flex-col gap-3 p-4")}
              style={CRYSTAL_BORDER}
              aria-label={t("The drums")}
            >
              <div
                aria-hidden="true"
                className={cn("absolute inset-x-4 top-0 h-px", PRISM_EDGE)}
              />
              <div className="flex items-center gap-3">
                <Drum className="size-4 text-[var(--scope-a)]" aria-hidden="true" />
                <h3 className="font-[family-name:Cinzel] text-[12px] tracking-[0.3em] text-[var(--scope-a)]">
                  {t("THE DRUMS")}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {t("keys z x c v")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DRUM_PADS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    data-testid={`ethermix-drum-${d.id}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      hitDrum(d.id);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                        e.preventDefault();
                        hitDrum(d.id);
                      }
                    }}
                    aria-label={`${t("Drum")} ${t(d.label)}`}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border uppercase tracking-widest transition-colors",
                      drumFlash[d.id] && "ethermix-flash"
                    )}
                    style={{
                      ...CRYSTAL_BORDER,
                      backgroundColor: drumFlash[d.id]
                        ? "color-mix(in srgb, var(--scope-a) 20%, transparent)"
                        : "color-mix(in srgb, var(--scope-a) 6%, transparent)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                  >
                    <Zap
                      className="size-3.5 text-[var(--scope-a)]"
                      aria-hidden="true"
                    />
                    <span className="text-[12px]">{t(d.label)}</span>
                    <span className="text-[9.5px] text-muted-foreground">
                      {d.key}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
