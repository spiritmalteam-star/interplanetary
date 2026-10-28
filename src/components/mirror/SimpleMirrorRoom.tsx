"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Eraser,
  ImagePlus,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { EnergyError, speakReplyGift } from "@/lib/speak-client";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { MirrorChanneling } from "./MirrorChanneling";
import { cn } from "@/lib/utils";
import { IMAGE_ACCEPT, isImageFile, readFileAsDataUrl } from "./attachments";

/* ------------------------------------------------------------------ */
/*  THE SIMPLE ROOMS — Manifest and Invent. One honest thing in each   */
/*  room: an interactive way of communicating with the Mirror — a      */
/*  spirit line, a conversation, a whisper line. The words carry       */
/*  pictures now: the Mirror may end a reply with its own painting     */
/*  (the vision gift), and the visitor may hand the Mirror one image   */
/*  of their own to speak about. Each reply leaves three small hands   */
/*  beneath it — the conversation proceeds in one touch.               */
/*                                                                     */
/*  Each room keeps its own words on the device (localStorage), so     */
/*  leaving the page and coming back finds the conversation standing   */
/*  exactly where it was left — the room's own memory, never a         */
/*  server's. Paintings keep their address (the house serves them),   */
/*  so they come back with the words.                                  */
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
};

/* THE MANIFEST — the making room: speak the world you wish to make,
   and the Mirror shapes it with you (the manifesting voice). */
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
};

/* THE INVENT — the forge room: bring a spark, and the Mirror forges
   it into form with you (the forge voice). */
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
  const [attached, setAttached] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
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

  /* THE PAINTING — the vision gift handed to the visualization
     engine; the words stand while the picture is mixed, and the
     finished painting lands beneath them (its address keeps, so it
     returns with the words on every later visit). */
  const paintVision = useCallback(
    async (turnIndex: number, vision: string) => {
      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: vision, language }),
        });
        const data = (await res.json().catch(() => null)) as {
          artifact?: { imageUrl?: string; title?: string };
        } | null;
        const url = data?.artifact?.imageUrl;
        if (!url) {
          setThread((cur) =>
            cur.map((turn, i) =>
              i === turnIndex ? { ...turn, painting: false } : turn
            )
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
    [language]
  );

  const send = useCallback(
    async (raw: string, image?: string) => {
      const q = raw.trim();
      if (!q || busy) return;
      setDraft("");
      setAttached(null);
      setThread((cur) => [
        ...cur,
        { q, a: "", loading: true, ...(image ? { attached: image } : {}) },
      ]);
      setBusy(true);
      try {
        const prior = threadRef.current
          .slice(0, -1)
          .map((turn) => ({ q: turn.q, a: turn.a }));
        const { text, vision } = await config.ask(q, prior, language, image);
        const index = threadRef.current.length - 1;
        setThread((cur) =>
          cur.map((turn, i) =>
            i === index
              ? {
                  ...turn,
                  a: text,
                  loading: false,
                  ...(vision ? { painting: true } : {}),
                }
              : turn
          )
        );
        if (vision) void paintVision(index, vision);
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
    [busy, config, language, paintVision]
  );

  const pickImage = useCallback(async (file: File | undefined | null) => {
    if (!file || !isImageFile(file)) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttached(dataUrl);
    } catch {
      /* the image stays unhanded — the words still travel */
    }
  }, []);

  const onFilePicked = (e: ChangeEvent<HTMLInputElement>) => {
    void pickImage(e.target.files?.[0]);
    e.target.value = "";
  };

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
     visions land beneath the last turn and breathe with the visit. */
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
        body: JSON.stringify({ idea, context }),
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
  }, [busy, sketching, draft, t]);

  /* THE QUIET READER — a new word lands, the room reads only if the
     visitor already rests at the bottom (never dragged mid-thought) */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (near) el.scrollTop = el.scrollHeight;
  }, [thread]);

  const empty = thread.length === 0;
  const seeds = useMemo(() => config.seeds, [config.seeds]);
  const proceed = useMemo(() => config.proceed, [config.proceed]);

  return (
    <div
      data-testid="simple-room"
      data-room={config.storageKey}
      className="flex h-full flex-col"
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
          beneath them, three small hands under the last reply */}
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
                      {/* THE MIRROR'S OWN PAINTING — the vision gift,
                          mixed quietly while the words stood */}
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
                          className="w-full max-w-[340px] overflow-hidden rounded-xl border"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                          }}
                          data-testid="simple-room-painting"
                        >
                          <a
                            href={turn.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={turn.imageTitle ?? t("The Mirror's painting")}
                            className="block"
                          >
                            <img
                              src={turn.imageUrl}
                              alt={turn.imageTitle ?? ""}
                              loading="lazy"
                              className="aspect-[7/4] w-full bg-background/40 object-cover"
                            />
                          </a>
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
                            <a
                              key={`${sk.angle}-${k}`}
                              href={sk.src}
                              target="_blank"
                              rel="noreferrer"
                              className="group block overflow-hidden rounded-xl border"
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
                            </a>
                          ))}
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
        {attached && (
          <div className="mb-1.5 flex items-center gap-2">
            <img
              src={attached}
              alt=""
              className="size-9 rounded-lg border object-cover"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            />
            <button
              type="button"
              onClick={() => setAttached(null)}
              aria-label={t("Remove the image")}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
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
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={onFilePicked}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label={t("Attach an image")}
            title={t("Attach an image")}
            data-testid="simple-room-attach"
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/80 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground disabled:opacity-35"
          >
            <Paperclip className="size-3.5" aria-hidden="true" />
          </button>
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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(draft, attached ?? undefined);
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
            onClick={() => void send(draft, attached ?? undefined)}
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
    </div>
  );
}

/** THE MANIFEST — the simple making room (the manifesting voice):
    words, paintings and three small hands under every reply. */
export function ManifestRoom() {
  return <SimpleMirrorRoom config={MANIFEST_CONFIG} />;
}

/** THE INVENT — the forge room (the forge voice): bring a spark, hand
    the Mirror a picture, and the conversation proceeds in one touch. */
export function InventRoom() {
  return <SimpleMirrorRoom config={INVENT_CONFIG} />;
}
