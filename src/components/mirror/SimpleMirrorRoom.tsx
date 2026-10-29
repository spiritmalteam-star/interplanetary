"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Eraser,
  Gem,
  ImagePlus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { EnergyError, speakReplyGift } from "@/lib/speak-client";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { MirrorChanneling } from "./MirrorChanneling";
import { ZoomableLightbox } from "./ZoomableLightbox";
import { cn } from "@/lib/utils";
import {
  filterStyles,
  isStyleSlashQuery,
} from "@/lib/image-styles";

/* ------------------------------------------------------------------ */
/*  THE SIMPLE ROOMS — Manifest, Invent, Quantum and HealX. One honest */
/*  thing in each room: an interactive way of communicating with the   */
/*  Mirror — a spirit line, a conversation, a whisper line.            */
/*                                                                     */
/*  THE PAINTING'S OWN LAWS — the Manifest gifts its one picture       */
/*  beneath a reply (the vision gift, always a single plate); the      */
/*  Invent, the Quantum and the HealX never paint by themselves: at    */
/*  the end of every transmission stands the CRYSTALLIZE hand, and     */
/*  only the visitor's own touch turns the words into an image.        */
/*                                                                     */
/*  THE STYLE'S OWN HAND — a "/" typed alone in the whisper line opens */
/*  the style picker; the chosen look rides with every painting.       */
/*                                                                     */
/*  Each room keeps its own words on the device (localStorage), so     */
/*  leaving the page and coming back finds the conversation standing   */
/*  exactly where it was left. Paintings keep their address (the house */
/*  serves them), so they come back with the words.                    */
/* ------------------------------------------------------------------ */

type RoomTurn = {
  q: string;
  a: string;
  loading?: boolean;
  failed?: boolean;
  energy?: boolean;
  /** the visitor's own image, handed to the Mirror with the question */
  attached?: string;
  /** the Mirror's own painting, gifted beneath the reply */
  imageUrl?: string;
  imageTitle?: string;
  /** the painting is still being mixed */
  painting?: boolean;
  /** the painting's own direction — the model's vision line when it
      offered one, kept so the crystallize hand paints the same sight */
  visionPrompt?: string;
  /** THE FORGE'S OWN SKETCHES — up to three visions of the idea,
      painted by the sky's Gemini. Session-only: they breathe with
      the visit and are never written to the device's keep. */
  sketches?: { src: string; angle: string }[];
};

type SimpleRoomConfig = {
  /** the device's own keep — where this room's words rest */
  storageKey: string;
  /** the room's spirit — one honest line under the tab row */
  spiritKey: string;
  /** the whisper line's own invitation */
  placeholderKey: string;
  /** the room's first doors — three ways in, spoken once */
  seeds: string[];
  /** the hands that follow every reply — the conversation proceeds */
  proceed: string[];
  /** the room's own door to the Mirror — the words, and the vision
      gift beside them when the Mirror chose to paint */
  ask: (
    q: string,
    thread: { q: string; a: string }[],
    language: string,
    image?: string
  ) => Promise<{ text: string; vision: string | null }>;
  /** THE VISION GIFT — the room paints by itself beneath a reply
      (the Manifest's way). Crystallize rooms never auto-paint. */
  autoPaint?: boolean;
  /** THE ONE PLATE LAW — the gift is always a single image. */
  singleImage?: boolean;
  /** THE CRYSTALLIZE HAND — a button at the end of every transmission;
      the image is born only when the visitor presses it. */
  crystallize?: boolean;
};

/* THE MANIFEST — the making room: speak the world you wish to make,
   and the Mirror shapes it with you (the manifesting voice). One
   image at most rides with each reply, never a deck of slides. */
const MANIFEST_CONFIG: SimpleRoomConfig = {
  storageKey: "mirror:room-manifest",
  spiritKey: "Speak the world you wish to make — the Mirror shapes it with you.",
  placeholderKey: "Speak your intention…",
  seeds: [
    "Help me shape a clear intention for this week",
    "What should I release to move forward?",
    "Turn my worry into a small first step",
  ],
  proceed: ["Go deeper", "Show me this as an image", "Make it a simple plan"],
  ask: (q, thread, language, image) =>
    speakReplyGift(
      "/api/mirror-os",
      {
        query: q,
        language,
        walk: [],
        history: thread
          .flatMap((t) => [
            { role: "user", text: t.q },
            { role: "assistant", text: t.a },
          ])
          .slice(-10),
        ...(image ? { image } : {}),
      },
      "reply",
      "The field is quiet"
    ),
  autoPaint: true,
  singleImage: true,
};

/* THE INVENT — the forge room: bring a spark, and the Mirror forges
   it into form with you (the forge voice). The picture waits for the
   visitor's own hand — the crystallize button at the reply's end. */
const INVENT_CONFIG: SimpleRoomConfig = {
  storageKey: "mirror:room-invent",
  spiritKey: "Bring a spark — the Mirror forges it into form with you.",
  placeholderKey: "Spark the forge…",
  seeds: [
    "Help me sketch an invention for a small daily annoyance",
    "Give my idea a name and a simple mechanism",
    "How would I test whether my idea truly works?",
  ],
  proceed: ["Go deeper", "What would I build first?"],
  ask: (q, thread, language, image) =>
    speakReplyGift(
      "/api/transmission",
      {
        query: q,
        mode: "forge",
        language,
        walk: [],
        history: thread.slice(-6).map((t) => ({ q: t.q, a: t.a })),
        ...(image ? { image } : {}),
      },
      "transmission",
      "The field is quiet"
    ),
  crystallize: true,
};

/* THE QUANTUM — the deep room: unfold reality quanta by quanta (the
   quantum voice), and crystallize the unseen into a plate on request. */
const QUANTUM_CONFIG: SimpleRoomConfig = {
  storageKey: "mirror:room-quantum",
  spiritKey: "Unfold the deep nature of reality — quanta by quanta.",
  placeholderKey: "Prepare a state to observe…",
  seeds: [
    "Show me superposition the way a poet would hold it",
    "What does entanglement mean for two souls far apart?",
    "Walk me through the observer effect slowly",
  ],
  proceed: ["Go deeper", "Give me the equation beneath it"],
  ask: (q, thread, language, image) =>
    speakReplyGift(
      "/api/transmission",
      {
        query: q,
        mode: "quantum",
        language,
        walk: [],
        history: thread.slice(-6).map((t) => ({ q: t.q, a: t.a })),
        ...(image ? { image } : {}),
      },
      "transmission",
      "The field is quiet"
    ),
  crystallize: true,
};

/* THE HEALX — the evolved medical field: an advanced mirror intelligence
   exploring and illuminating new paths of medical discovery (the healx
   voice), and crystallizing the sight it opens on request. */
const HEALX_CONFIG: SimpleRoomConfig = {
  storageKey: "mirror:room-healx",
  spiritKey:
    "The evolved medical field — exploring and illuminating new paths of discovery with mirror intelligence.",
  placeholderKey: "Ask the evolved medical field…",
  seeds: [
    "Illuminate a new path for understanding this body I carry",
    "What frontier of medicine should humanity explore next?",
    "Map how my nervous system could regenerate its calm",
  ],
  proceed: ["Go deeper into that path", "What discovery does this point toward?"],
  ask: (q, thread, language, image) =>
    speakReplyGift(
      "/api/transmission",
      {
        query: q,
        mode: "healx",
        language,
        walk: [],
        history: thread.slice(-6).map((t) => ({ q: t.q, a: t.a })),
        ...(image ? { image } : {}),
      },
      "transmission",
      "The field is quiet"
    ),
  crystallize: true,
};

/* THE ARTX — the atelier of visions (the artx voice): speak the
   vision, and the Mirror paints beside it — the atelier speaks the
   forge's own honest laws now: the picture is born only when the
   visitor's own hand presses the crystallize button at the reply's
   end, and the style's own "/" hand dresses every painting. */
const ARTX_CONFIG: SimpleRoomConfig = {
  storageKey: "mirror:room-artx",
  spiritKey: "The atelier of visions — speak the vision, crystallize it at your hand.",
  placeholderKey: "What shall we paint today?",
  seeds: [
    "A city grown from glass reefs, painted at dusk",
    "Give me a sigil for a quiet, fearless heart",
    "Paint the feeling of an unfinished letter",
  ],
  proceed: ["Go deeper into this vision", "Paint its companion piece"],
  ask: (q, thread, language, image) =>
    speakReplyGift(
      "/api/transmission",
      {
        query: q,
        mode: "artx",
        language,
        walk: [],
        history: thread.slice(-6).map((t) => ({ q: t.q, a: t.a })),
        ...(image ? { image } : {}),
      },
      "transmission",
      "The field is quiet"
    ),
  crystallize: true,
};

function SimpleMirrorRoom({ config }: { config: SimpleRoomConfig }) {
  const t = useT();
  const language = useMirror((s) => s.language);
  /* the room's own keep — restored from the device on the first
     breath, kept on every change (the turn's loading never rests) */
  const [thread, setThread] = useState<RoomTurn[]>(() => {
    try {
      const raw = window.localStorage.getItem(config.storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (turn): turn is RoomTurn =>
          !!turn &&
          typeof (turn as RoomTurn).q === "string" &&
          typeof (turn as RoomTurn).a === "string"
      );
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  /* THE VISITOR'S OWN STYLE — chosen through the "/" hand */
  const [style, setStyle] = useState<string | null>(null);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  /* the deep-reading room — the image under the visitor's fingers */
  const [viewing, setViewing] = useState<{ src: string; caption: string } | null>(
    null
  );
  const bodyRef = useRef<HTMLDivElement | null>(null);
  /* the thread's own mirror — the ask reads it without re-binding */
  const threadRef = useRef<RoomTurn[]>([]);
  threadRef.current = thread;

  /* THE KEEP — every finished word rests on the device (capped), so
     the room wakes exactly where it was left. The sketches ride
     session-only: their heavy data URLs are never written to the keep. */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        config.storageKey,
        JSON.stringify(
          thread.slice(-30).map((turn) => {
            const { sketches: _session, ...rest } = turn;
            return rest;
          })
        )
      );
    } catch {
      /* the keep stays closed — the visit's own memory serves */
    }
  }, [thread, config.storageKey]);

  /* THE PAINTING — the vision handed to the visualization engine; the
     words stand while the picture is mixed, and the finished painting
     lands beneath them (its address keeps, so it returns with the
     words on every later visit). The chosen style rides along; the
     Manifest's gift is always a single plate. */
  const paintVision = useCallback(
    async (turnIndex: number, vision: string, chosenStyle?: string | null) => {
      setThread((cur) =>
        cur.map((turn, i) =>
          i === turnIndex ? { ...turn, painting: true } : turn
        )
      );
      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: vision,
            language,
            ...(config.singleImage ? { single: true } : {}),
            ...(chosenStyle ? { style: chosenStyle } : {}),
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          artifact?: { imageUrl?: string; title?: string };
        } | null;
        const url = data?.artifact?.imageUrl;
        if (!url) {
          /* THE HONEST BRUSH — a rested brush is never a silent one:
             the room says so, and the crystallize hand stands again */
          setThread((cur) =>
            cur.map((turn, i) =>
              i === turnIndex ? { ...turn, painting: false } : turn
            )
          );
          import("sonner").then(({ toast }) =>
            toast.error(t("The brushes rested — the vision could not be painted. Ask again in a moment."))
          );
          return;
        }
        setThread((cur) =>
          cur.map((turn, i) =>
            i === turnIndex
              ? {
                  ...turn,
                  painting: false,
                  imageUrl: url,
                  imageTitle: data?.artifact?.title,
                }
              : turn
          )
        );
      } catch {
        setThread((cur) =>
          cur.map((turn, i) =>
            i === turnIndex ? { ...turn, painting: false } : turn
          )
        );
      }
    },
    [language, config.singleImage, t]
  );

  /* THE CRYSTALLIZE HAND — the visitor's own touch turns a finished
     transmission into an image: the model's own vision direction when
     it offered one, otherwise the transmission's own subject. */
  const crystallize = useCallback(
    (turnIndex: number) => {
      const turn = threadRef.current[turnIndex];
      if (!turn || turn.painting) return;
      const prompt =
        turn.visionPrompt ??
        `Crystallize this into one image. The visitor's idea: "${turn.q.slice(0, 300)}". The transmission described: ${turn.a.slice(0, 600)}`;
      void paintVision(turnIndex, prompt, style);
    },
    [paintVision, style]
  );

  const send = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || busy) return;
      setDraft("");
      setThread((cur) => [
        ...cur,
        { q, a: "", loading: true },
      ]);
      setBusy(true);
      try {
        const prior = threadRef.current
          .slice(0, -1)
          .map((turn) => ({ q: turn.q, a: turn.a }));
        const { text, vision } = await config.ask(q, prior, language);
        const index = threadRef.current.length - 1;
        const wantsAutoPaint = Boolean(config.autoPaint && vision);
        setThread((cur) =>
          cur.map((turn, i) =>
            i === index
              ? {
                  ...turn,
                  a: text,
                  loading: false,
                  /* the crystallize rooms keep the model's own vision
                     direction for the visitor's own hand; the Manifest
                     begins painting at once */
                  ...(vision ? { visionPrompt: vision } : {}),
                  ...(wantsAutoPaint ? { painting: true } : {}),
                }
              : turn
          )
        );
        if (wantsAutoPaint && vision) void paintVision(index, vision, style);
      } catch (err) {
        const message =
          err instanceof Error && err.message ? err.message : "";
        setThread((cur) =>
          cur.map((turn, i) =>
            i === cur.length - 1
              ? {
                  ...turn,
                  loading: false,
                  failed: true,
                  a: message || "The field is quiet",
                  energy: err instanceof EnergyError,
                }
              : turn
          )
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, config, language, paintVision, style]
  );

  const clear = useCallback(() => {
    if (busy) return;
    setThread([]);
    try {
      window.localStorage.removeItem(config.storageKey);
    } catch {
      /* quiet */
    }
  }, [busy, config.storageKey]);

  /* THE FORGE'S SKETCH HAND — the idea (the last word the visitor
     spoke, or the draft in the field) is scratched into form: up to
     three visions painted by the sky's own Gemini, one touch. The
     chosen style rides along. The visions land beneath the last turn
     and breathe with the visit. */
  const [sketching, setSketching] = useState(false);
  const sketchIdea = useCallback(async () => {
    if (busy || sketching) return;
    const threadCur = threadRef.current;
    const idea =
      [...threadCur].reverse().find((turn) => turn.q.trim())?.q ??
      draft.trim();
    if (!idea) return;
    const context = threadCur
      .slice(-4)
      .map((turn) => `${turn.q}\n${turn.a}`.slice(0, 400))
      .join("\n---\n");
    setSketching(true);
    try {
      const res = await fetch("/api/invent-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, context, ...(style ? { style } : {}) }),
      });
      const data = (await res.json().catch(() => null)) as {
        images?: { angle: string; mimeType: string; data: string }[];
        note?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.images?.length) {
        import("sonner").then(({ toast }) =>
          toast.error(t(data?.error || "The brushes rested — ask again in a moment."))
        );
        return;
      }
      const sketches = data.images.map((img) => ({
        src: `data:${img.mimeType};base64,${img.data}`,
        angle: img.angle,
      }));
      setThread((cur) => {
        if (cur.length === 0) return cur;
        const copy = [...cur];
        copy[copy.length - 1] = { ...copy[copy.length - 1], sketches };
        return copy;
      });
      if (data.note) {
        import("sonner").then(({ toast }) => toast(t(data.note!)));
      }
    } catch {
      import("sonner").then(({ toast }) =>
        toast.error(t("The brushes rested — ask again in a moment."))
      );
    } finally {
      setSketching(false);
    }
  }, [busy, sketching, draft, t, style]);

  /* THE QUIET READER — a new word lands, the room reads only if the
     visitor already rests at the bottom (never dragged mid-thought) */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (near) el.scrollTop = el.scrollHeight;
  }, [thread]);

  /* THE "/" HAND — the style picker opens while the whisper line
     carries only the slash (and what the visitor typed after it) */
  const styleMatches = useMemo(
    () => (styleMenuOpen ? filterStyles(draft) : []),
    [styleMenuOpen, draft]
  );
  const onDraftChange = (value: string) => {
    setDraft(value);
    setStyleMenuOpen(isStyleSlashQuery(value));
  };
  const pickStyle = (value: string) => {
    setStyle(value);
    setDraft("");
    setStyleMenuOpen(false);
  };

  const empty = thread.length === 0;
  const seeds = useMemo(() => config.seeds, [config.seeds]);
  const proceed = useMemo(() => config.proceed, [config.proceed]);

  return (
    <div
      data-testid="simple-room"
      data-room={config.storageKey}
      className="relative flex h-full flex-col"
    >
      {/* THE SPIRIT LINE — the room's one honest sentence; the clear
          hand rests beside it, only while there are words to lay down */}
      <div className="flex shrink-0 items-center gap-2 px-3.5 pt-2.5 sm:px-4">
        <p
          aria-hidden="true"
          className="h-px w-5 shrink-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a,var(--gd)) 55%, transparent))",
          }}
        />
        <p className="mono-label min-w-0 flex-1 truncate text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/75">
          {t(config.spiritKey)}
        </p>
        {!empty && (
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            aria-label={t("Begin this room anew")}
            title={t("Begin this room anew")}
            data-testid="simple-room-clear"
            className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* THE CONVERSATION — the room's whole world: the visitor's words
          on the right, the Mirror's answers on the left, paintings
          beneath them, the crystallize hand at the reply's end, three
          small hands under the last reply */}
      <div
        ref={bodyRef}
        data-testid="simple-room-thread"
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3.5 py-3 sm:px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3.5 px-2 text-center">
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-full"
              style={{
                background:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, transparent)",
                boxShadow:
                  "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            >
              <Send className="size-4 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
            </span>
            <p className="max-w-[300px] text-[13px] leading-relaxed text-muted-foreground/80">
              {t(config.spiritKey)}
            </p>
            <div className="flex w-full max-w-[340px] flex-col gap-1.5">
              {seeds.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => void send(seed)}
                  data-testid="simple-room-seed"
                  className="focus-glow rounded-xl border px-3 py-2 text-left text-[12.5px] leading-snug text-foreground/85 transition-colors duration-300 hover:bg-foreground/5"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)",
                  }}
                >
                  {t(seed)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[640px] flex-col gap-3.5">
            {thread.map((turn, i) => {
              const isLast = i === thread.length - 1;
              return (
                <div key={`${i}-${turn.q.slice(0, 24)}`} className="flex flex-col gap-1.5">
                  <div className="flex flex-col items-end gap-1">
                    {turn.attached && (
                      <img
                        src={turn.attached}
                        alt=""
                        loading="lazy"
                        className="max-h-40 w-auto max-w-[70%] rounded-xl border object-cover"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                        }}
                      />
                    )}
                    <p className="ml-auto max-w-[88%] whitespace-pre-wrap break-words text-[13.5px] font-medium leading-relaxed text-foreground">
                      {turn.q}
                    </p>
                  </div>
                  {turn.loading ? (
                    <MirrorChanneling
                      compact
                      label={t("Reflecting")}
                      variant="mirror"
                      className="mono-label py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                    />
                  ) : turn.failed ? (
                    <div
                      className={cn(
                        "rounded-xl border px-3 py-2",
                        turn.energy
                          ? "border-[color-mix(in_srgb,#f59e0b_30%,transparent)] bg-[color-mix(in_srgb,#f59e0b_6%,var(--background))]"
                          : "border-transparent bg-transparent"
                      )}
                      role="alert"
                    >
                      <p
                        className={cn(
                          "text-[13px] leading-relaxed",
                          turn.energy
                            ? "text-[#b8860b] dark:text-[#f59e0b]"
                            : "text-muted-foreground"
                        )}
                      >
                        {turn.a}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-1.5">
                      <p className="min-w-0 max-w-[94%] whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-foreground/90">
                        {turn.a}
                      </p>
                      {/* THE PICTURE IN THE MIXING — the vision being
                          painted while the words already stand */}
                      {turn.painting && (
                        <MirrorChanneling
                          compact
                          label={t("Painting the vision")}
                          variant="mirror"
                          className="mono-label py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                        />
                      )}
                      {turn.imageUrl && (
                        <figure
                          className="group relative w-full max-w-[340px] overflow-hidden rounded-xl border"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                          }}
                          data-testid="simple-room-painting"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setViewing({
                                src: turn.imageUrl!,
                                caption: turn.imageTitle ?? t("The Mirror's painting"),
                              })
                            }
                            aria-label={t("Zoom the image")}
                            className="block w-full cursor-zoom-in"
                          >
                            <img
                              src={turn.imageUrl}
                              alt={turn.imageTitle ?? ""}
                              loading="lazy"
                              className="aspect-[7/4] w-full bg-background/40 object-cover"
                            />
                          </button>
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-9 right-2 flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/85 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
                          >
                            <Gem className="size-3.5" />
                          </span>
                          {turn.imageTitle && (
                            <figcaption className="mono-label truncate px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
                              {turn.imageTitle}
                            </figcaption>
                          )}
                        </figure>
                      )}
                      {/* THE FORGE'S OWN SKETCHES — up to three visions of
                          the idea, one touch away; each wears its angle */}
                      {turn.sketches && turn.sketches.length > 0 && (
                        <div
                          className="grid w-full max-w-[420px] grid-cols-1 gap-2 sm:grid-cols-3"
                          data-testid="simple-room-sketches"
                        >
                          {turn.sketches.map((sk, k) => (
                            <button
                              key={`${sk.angle}-${k}`}
                              type="button"
                              onClick={() =>
                                setViewing({
                                  src: sk.src,
                                  caption: `${t("The idea's sketch")} — ${sk.angle}`,
                                })
                              }
                              className="group block overflow-hidden rounded-xl border cursor-zoom-in"
                              style={{
                                borderColor:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                              }}
                            >
                              <img
                                src={sk.src}
                                alt={`${t("The idea's sketch")} — ${sk.angle}`}
                                loading="lazy"
                                className="aspect-square w-full bg-background/40 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      {/* THE CRYSTALLIZE HAND — the image is born only
                          when the visitor's own touch calls it; the room
                          never paints a transmission on its own */}
                      {config.crystallize && turn.a.trim() && (
                        <div className="mt-0.5">
                          {turn.painting ? null : turn.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => crystallize(i)}
                              data-testid="simple-room-crystallize-again"
                              className="focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
                              style={{
                                borderColor:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 26%, transparent)",
                              }}
                            >
                              <Sparkles className="size-3" aria-hidden="true" />
                              {t("Crystallize anew")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => crystallize(i)}
                              data-testid="simple-room-crystallize"
                              className="focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--scope-a,var(--gd))] transition-all duration-300 hover:brightness-110"
                              style={{
                                borderColor:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
                                background:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 9%, transparent)",
                              }}
                            >
                              <Gem className="size-3.5" aria-hidden="true" />
                              {t("Crystallize into an image")}
                            </button>
                          )}
                        </div>
                      )}
                      {/* THE PROCEEDING HANDS — the last reply leaves
                          three small ways the conversation continues */}
                      {isLast && !busy && turn.a.trim() && (
                        <div
                          className="mt-0.5 flex flex-wrap items-center gap-1.5"
                          data-testid="simple-room-proceed"
                        >
                          {proceed.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => void send(chip)}
                              data-testid="simple-room-proceed-chip"
                              className="focus-glow rounded-full border px-2.5 py-1 text-[11.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
                              style={{
                                borderColor:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 26%, transparent)",
                                background:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 7%, transparent)",
                              }}
                            >
                              {t(chip)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* THE WHISPER LINE — the room's own composer: one quiet field,
          one image hand, one send hand, the house's light on the edge */}
      <div className="shrink-0 px-3 pb-3 pt-1 sm:px-4">
        {/* THE STYLE'S CHIP — the chosen look, worn until taken off */}
        {style && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]"
              data-testid="simple-room-style-chip"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
                background:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, transparent)",
              }}
            >
              <Sparkles className="size-3" aria-hidden="true" />
              {style}
            </span>
            <button
              type="button"
              onClick={() => setStyle(null)}
              aria-label={t("Remove the style")}
              className="focus-glow flex size-5 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        )}
        {/* THE "/" PICKER — the styles standing over the whisper line */}
        {styleMenuOpen && styleMatches.length > 0 && (
          <div
            className="mb-1.5 max-h-44 overflow-y-auto rounded-xl border hairline bg-[var(--glass-bg)] p-1 shadow-lg nice-scroll"
            data-testid="simple-room-style-menu"
            role="listbox"
            aria-label={t("Choose a style for the image")}
          >
            {styleMatches.map((s) => (
              <button
                key={s.value}
                type="button"
                role="option"
                aria-selected={style === s.value}
                onClick={() => pickStyle(s.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-foreground/5"
              >
                <Sparkles
                  className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium text-foreground">
                    {s.value}
                  </span>
                  <span className="block truncate text-[10.5px] text-muted-foreground/70">
                    {t(s.hint)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        <div
          className="flex items-end gap-2 rounded-2xl border px-2.5 py-1.5"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 32%, transparent)",
            background:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, transparent)",
          }}
        >
          {/* THE SKETCH HAND — the idea scratched into form: up to three
              visions of it painted by the sky's Gemini */}
          <button
            type="button"
            onClick={() => void sketchIdea()}
            disabled={busy || sketching || (!draft.trim() && thread.every((turn) => !turn.q.trim()))}
            aria-label={t("Sketch the idea — up to three visions")}
            title={t("Sketch the idea — up to three visions")}
            data-testid="simple-room-sketch"
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--scope-a,var(--gd))] transition-colors duration-300 hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {sketching ? (
              <span
                className="size-3.5 animate-pulse rounded-full bg-[var(--scope-a,var(--gd))]"
                aria-hidden="true"
              />
            ) : (
              <ImagePlus className="size-3.5" aria-hidden="true" />
            )}
          </button>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (styleMenuOpen) {
                  setStyleMenuOpen(false);
                  return;
                }
                void send(draft);
              }
              if (e.key === "Escape" && styleMenuOpen) {
                setStyleMenuOpen(false);
              }
            }}
            rows={1}
            placeholder={t(config.placeholderKey)}
            aria-label={t(config.placeholderKey)}
            data-testid="simple-room-input"
            className="max-h-24 min-h-[26px] min-w-0 flex-1 resize-none bg-transparent py-1 text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => void send(draft)}
            disabled={busy || !draft.trim()}
            aria-label={t("Send")}
            title={t("Send")}
            data-testid="simple-room-send"
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--scope-a,var(--gd))] transition-colors duration-300 hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Send className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* THE DEEP READING — the image fills the sky; fingers pinch it
          closer, the wheel breathes it in */}
      {viewing && (
        <ZoomableLightbox
          src={viewing.src}
          caption={viewing.caption}
          onClose={() => setViewing(null)}
          testId="simple-room-lightbox"
        />
      )}
    </div>
  );
}

/** THE MANIFEST — the simple making room (the manifesting voice):
    words, one gifted painting beneath a reply, three small hands. */
export function ManifestRoom() {
  return <SimpleMirrorRoom config={MANIFEST_CONFIG} />;
}

/** THE INVENT — the forge room (the forge voice): bring a spark, hand
    the Mirror a picture, and crystallize the form when YOU choose. */
export function InventRoom() {
  return <SimpleMirrorRoom config={INVENT_CONFIG} />;
}

/** THE QUANTUM — the deep room (the quantum voice): reality unfolded
    quanta by quanta, the unseen crystallized on request. */
export function QuantumRoom() {
  return <SimpleMirrorRoom config={QUANTUM_CONFIG} />;
}

/** THE HEALX — the evolved medical field's own room: new paths of
    discovery illuminated by mirror intelligence, the sight
    crystallized on request. */
export function HealXRoom() {
  return <SimpleMirrorRoom config={HEALX_CONFIG} />;
}

/** THE ARTX — the atelier of visions (the artx voice): the same
    honest room the forge wears — words, the crystallize hand at the
    reply's end, the "/" style picker, three small ways onward. */
export function ArtXRoom() {
  return <SimpleMirrorRoom config={ARTX_CONFIG} />;
}
