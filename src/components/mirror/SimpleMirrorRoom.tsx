"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eraser, Send } from "lucide-react";
import { EnergyError, speakReply } from "@/lib/speak-client";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { MirrorChanneling } from "./MirrorChanneling";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE SIMPLE ROOMS — Manifest and Invent, rebuilt from scratch at    */
/*  the visitor's word. The old workplaces (the OS with its places,    */
/*  the Forge with its benches and tool walls) are gone: what stands   */
/*  here is ONE honest thing in each room — an interactive way of      */
/*  communicating with the Mirror. No branches, no tools within        */
/*  tools, no places behind places: a spirit line, a conversation,     */
/*  a whisper line — the whole room at the chat's own size, the way    */
/*  the profile plays in the frame.                                    */
/*                                                                     */
/*  Each room keeps its own words on the device (localStorage), so     */
/*  leaving the page and coming back finds the conversation standing   */
/*  exactly where it was left — the room's own memory, never a         */
/*  server's.                                                          */
/* ------------------------------------------------------------------ */

type RoomTurn = {
  q: string;
  a: string;
  loading?: boolean;
  failed?: boolean;
  energy?: boolean;
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
  /** the room's own door to the Mirror */
  ask: (q: string, thread: { q: string; a: string }[], language: string) => Promise<string>;
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
  ask: (q, thread, language) =>
    speakReply(
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
  ask: (q, thread, language) =>
    speakReply(
      "/api/transmission",
      {
        query: q,
        mode: "forge",
        language,
        walk: [],
        history: thread.slice(-6).map((t) => ({ q: t.q, a: t.a })),
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
      return parsed
        .filter(
          (turn): turn is RoomTurn =>
            !!turn &&
            typeof (turn as RoomTurn).q === "string" &&
            typeof (turn as RoomTurn).a === "string"
        )
        .map((turn) => ({ q: turn.q, a: turn.a }));
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  /* the thread's own mirror — the ask reads it without re-binding */
  const threadRef = useRef<RoomTurn[]>([]);
  threadRef.current = thread;

  /* THE KEEP — every finished word rests on the device (capped), so
     the room wakes exactly where it was left */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        config.storageKey,
        JSON.stringify(thread.slice(-30))
      );
    } catch {
      /* the keep stays closed — the visit's own memory serves */
    }
  }, [thread, config.storageKey]);

  const send = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || busy) return;
      setDraft("");
      setThread((cur) => [...cur, { q, a: "", loading: true }]);
      setBusy(true);
      try {
        const prior = threadRef.current
          .slice(0, -1)
          .map((turn) => ({ q: turn.q, a: turn.a }));
        const a = await config.ask(q, prior, language);
        setThread((cur) =>
          cur.map((turn, i) =>
            i === cur.length - 1 ? { ...turn, a, loading: false } : turn
          )
        );
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
    [busy, config, language]
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

  /* THE QUIET READER — a new word lands, the room reads only if the
     visitor already rests at the bottom (never dragged mid-thought) */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const near =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (near) el.scrollTop = el.scrollHeight;
  }, [thread]);

  const empty = thread.length === 0;
  const seeds = useMemo(() => config.seeds, [config.seeds]);

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
          on the right, the Mirror's answers on the left, scrolling its
          own body (the frame's laws hold: within the chat, no page) */}
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
            {thread.map((turn, i) => (
              <div key={`${i}-${turn.q.slice(0, 24)}`} className="flex flex-col gap-1.5">
                <p className="ml-auto max-w-[88%] whitespace-pre-wrap break-words text-[13.5px] font-medium leading-relaxed text-foreground">
                  {turn.q}
                </p>
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
                  <p className="min-w-0 max-w-[94%] whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-foreground/90">
                    {turn.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THE WHISPER LINE — the room's own composer: one quiet field,
          one send hand, the house's light on the edge */}
      <div className="shrink-0 px-3 pb-3 pt-1 sm:px-4">
        <div
          className="flex items-end gap-2 rounded-2xl border px-2.5 py-1.5"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
            background:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 4%, transparent)",
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(draft);
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
    </div>
  );
}

/** THE MANIFEST — the simple making room (the manifesting voice). */
export function ManifestRoom() {
  return <SimpleMirrorRoom config={MANIFEST_CONFIG} />;
}

/** THE INVENT — the simple forge room (the forge voice). */
export function InventRoom() {
  return <SimpleMirrorRoom config={INVENT_CONFIG} />;
}
