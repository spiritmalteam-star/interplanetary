"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  DraftingCompass,
  Eraser,
  Layers,
  MessagesSquare,
  Route,
  Send,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { EnergyError, speakReply } from "@/lib/speak-client";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { MirrorChanneling } from "./MirrorChanneling";
import { cn } from "@/lib/utils";
import {
  INVENT_LAB,
  MANIFEST_LAB,
  type LabConfig,
} from "./labs/lab-config";
import { parseReplyToLays, type LaidPiece } from "./labs/parse-reply";

/* ------------------------------------------------------------------ */
/*  THE SIMPLE ROOMS — Manifest and Invent. One honest thing in each   */
/*  room: an interactive way of communicating with the Mirror — a      */
/*  spirit line, a conversation, a whisper line — and, beside the      */
/*  words, the room's own LAB: the forge's Invention bench and the     */
/*  manifest room's Path, the same shared canvas in two lights.        */
/*                                                                     */
/*  THE TWO WAYS SPEAK TO EACH OTHER — the lab's hands can drop a      */
/*  context message into the room's own conversation ("Ask the Mirror  */
/*  about the bench"), and every Mirror reply can be laid onto the     */
/*  bench in return ("Lay it on the bench"): the reply's essence is    */
/*  read on the device alone and becomes pieces. Both hands ride the   */
/*  room's own send flow — no second door to the Mirror is built.      */
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
  /** the reply's essence already laid onto the lab's bench */
  laid?: boolean;
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

/* a message handed over from the lab — sent through the room's own
   send flow, never a second door */
type InboundAsk = { text: string; nonce: number };

type SimpleRoomProps = {
  config: SimpleRoomConfig;
  /** the room's own lab — present, the replies can be laid onto it */
  lab?: LabConfig;
  /** the lab's context message waiting to be spoken */
  inbound?: InboundAsk | null;
  onInboundConsumed?: () => void;
  /** the lay hand — reads a reply's essence into pieces; true when
      the bench received something */
  onLayReply?: (reply: string) => boolean;
};

function SimpleMirrorRoom({
  config,
  lab,
  inbound,
  onInboundConsumed,
  onLayReply,
}: SimpleRoomProps) {
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
        .map((turn) => ({
          q: turn.q,
          a: turn.a,
          ...(typeof turn.laid === "boolean" ? { laid: turn.laid } : {}),
        }));
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

  /* THE LAB'S WORD, SPOKEN — when the bench asks the Mirror, the
     message rides this room's own send flow (the whisper line's very
     same hand), and the room turns to the conversation to receive it */
  const consumedNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!inbound) return;
    if (inbound.nonce === consumedNonceRef.current) return;
    if (busy) return; /* wait for the room to quiet, then speak */
    consumedNonceRef.current = inbound.nonce;
    const text = inbound.text;
    onInboundConsumed?.();
    void send(text);
  }, [inbound, busy, send, onInboundConsumed]);

  /* THE LAY HAND — a reply's essence read on the device alone and
     handed to the lab; the turn remembers it was laid. The mark is
     written to the device's keep directly, because laying also turns
     the room to the lab (this conversation unmounts in the same
     breath, before the keep's quiet effect could run). */
  const layTurn = useCallback(
    (index: number, reply: string) => {
      if (!onLayReply) return;
      const laid = onLayReply(reply);
      if (!laid) return;
      setThread((cur) =>
        cur.map((turn, i) => (i === index ? { ...turn, laid: true } : turn))
      );
      try {
        const raw = window.localStorage.getItem(config.storageKey);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          for (let i = parsed.length - 1; i >= 0; i--) {
            const turn = parsed[i] as RoomTurn | null;
            if (turn && turn.a === reply) {
              turn.laid = true;
              break;
            }
          }
          window.localStorage.setItem(
            config.storageKey,
            JSON.stringify(parsed.slice(-30))
          );
        }
      } catch {
        /* the keep stays closed — the visit's own memory serves */
      }
    },
    [config.storageKey, onLayReply]
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

  /* the lay chip's glass — the house's h-8 chip dialect, wearing the
     scope's own light; 36px tall on mobile with padded neighbors */
  const layChip = (laid: boolean) =>
    cn(
      "focus-glow inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors duration-300 sm:h-8",
      laid
        ? "border-white/12 bg-white/5 text-muted-foreground/70"
        : "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_28%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)] text-[color-mix(in_srgb,var(--scope-a,var(--gd))_82%,white)] hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_48%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_18%,transparent)] hover:shadow-[0_0_14px_-8px_color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)]"
    );

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
                  <div className="flex flex-col items-start gap-1.5">
                    <p className="min-w-0 max-w-[94%] whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-foreground/90">
                      {turn.a}
                    </p>
                    {/* THE LAY HAND — the reply's essence, offered to
                        the lab; read on the device, no round-trip */}
                    {lab && onLayReply && turn.a.trim() && (
                      <button
                        type="button"
                        onClick={() => layTurn(i, turn.a)}
                        disabled={turn.laid}
                        aria-label={t(turn.laid ? lab.lay.done : lab.lay.chip)}
                        data-testid="simple-room-lay"
                        data-laid={turn.laid ? "true" : "false"}
                        className={layChip(!!turn.laid)}
                      >
                        {turn.laid ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Layers className="size-3.5" aria-hidden="true" />
                        )}
                        {t(turn.laid ? lab.lay.done : lab.lay.chip)}
                      </button>
                    )}
                  </div>
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
              "color-mix(in srgb, var(--scope-a,var(--gd)) 32%, transparent)",
            background:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, transparent)",
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

/* THE SHARED LAB — both rooms' canvases are the same themed bench;
   its code arrives only when a lab mode is first chosen. */
const ThemedLabCanvas = dynamic(
  () => import("@/components/mirror/labs/ThemedLabCanvas"),
  {
    ssr: false,
    loading: () => (
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/60">
          The lab lights its coals…
        </span>
      </div>
    ),
  }
);

type LabRoomMode = "conversation" | "lab";

/** one mode of a room's own segmented hand (the house's active-pill
    dialect, the scope's light on the chosen way; 44px touch on mobile) */
function ModeHand({
  active,
  onClick,
  icon: Icon,
  label,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  testId: string;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
      className={cn(
        "focus-glow flex h-11 items-center gap-1.5 rounded-full px-3 text-[11.5px] transition-colors duration-300 sm:h-9",
        active
          ? "font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={
        active
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 14%, transparent)",
              color: "var(--scope-a,var(--gd))",
            }
          : undefined
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {t(label)}
    </button>
  );
}

/** THE LAB ROOM SHELL — the two ways of one room: the conversation
    and the room's own lab, with the hands that carry words between
    them. The lab asks through the room's own send flow; the replies
    are laid onto the bench by the room's own lay hand. */
function LabRoomShell({
  roomConfig,
  lab,
  modesLabel,
  testPrefix,
}: {
  roomConfig: SimpleRoomConfig;
  lab: LabConfig;
  modesLabel: string;
  testPrefix: string;
}) {
  const t = useT();
  const [mode, setMode] = useState<LabRoomMode>("conversation");
  const [inbound, setInbound] = useState<InboundAsk | null>(null);
  const [inbox, setInbox] = useState<LaidPiece[]>([]);
  const nonceRef = useRef(0);

  /* LAB → CHAT — the bench's context message becomes the room's next
     whisper: the conversation turns to face the visitor, and the
     room's own send flow speaks the message to the Mirror */
  const askFromLab = useCallback((message: string) => {
    nonceRef.current += 1;
    setInbound({ text: message, nonce: nonceRef.current });
    setMode("conversation");
  }, []);

  /* CHAT → LAB — a Mirror reply's essence, read on the device alone
     (a titled piece with its first paragraph as the note, or one
     piece per spoken step), laid onto the bench as the lab opens */
  const layFromChat = useCallback(
    (reply: string): boolean => {
      const lays = parseReplyToLays(reply, lab.defaultKind);
      if (lays.length === 0) return false;
      setInbox((cur) => [...cur, ...lays].slice(-12));
      setMode("lab");
      toast.success(t(lab.lay.toast));
      return true;
    },
    [lab, t]
  );

  const consumeInbound = useCallback(() => setInbound(null), []);
  const consumeInbox = useCallback(() => setInbox([]), []);

  return (
    <div className="flex h-full flex-col">
      {/* THE MODE ROW — the room's two ways: the whisper line and the
          lab's bench; one quiet segmented hand beneath the tabs */}
      <div className="flex shrink-0 items-center px-3.5 pt-2.5 sm:px-4">
        <div
          role="group"
          aria-label={t(modesLabel)}
          data-testid={`${testPrefix}-modes`}
          className="flex items-center gap-0.5 rounded-full border p-0.5"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)",
          }}
        >
          <ModeHand
            active={mode === "conversation"}
            onClick={() => setMode("conversation")}
            icon={MessagesSquare}
            label="Conversation"
            testId={`${testPrefix}-mode-conversation`}
          />
          <ModeHand
            active={mode === "lab"}
            onClick={() => setMode("lab")}
            icon={lab.id === "invent" ? DraftingCompass : Route}
            label={lab.id === "invent" ? "Invention Lab" : "Manifesting Lab"}
            testId={`${testPrefix}-mode-lab`}
          />
        </div>
      </div>

      {/* THE ROOM'S BODY — the chosen way fills the rest of the room;
          the frame's flex layout owns the height (no viewport hacks) */}
      <div className="relative min-h-0 flex-1">
        {mode === "conversation" ? (
          <SimpleMirrorRoom
            config={roomConfig}
            lab={lab}
            inbound={inbound}
            onInboundConsumed={consumeInbound}
            onLayReply={layFromChat}
          />
        ) : (
          <ThemedLabCanvas
            config={lab}
            inbox={inbox}
            onInboxConsumed={consumeInbox}
            onAskMirror={askFromLab}
          />
        )}
      </div>
    </div>
  );
}

/** THE MANIFEST — the simple making room (the manifesting voice),
    with its own Manifesting Lab beside the words: intentions,
    milestones, practices and blockers laid on a path of their own. */
export function ManifestRoom() {
  return (
    <LabRoomShell
      roomConfig={MANIFEST_CONFIG}
      lab={MANIFEST_LAB}
      modesLabel="The manifest room's ways"
      testPrefix="manifest"
    />
  );
}

/** THE INVENT — the forge room: the whisper line, and beside it the
    room's own Invention Lab. The lab's draft rests on the device
    (mirror-invent-canvas-v1) like every room's words — the keep's law
    holds, and no one loses their bench. */
export function InventRoom() {
  return (
    <LabRoomShell
      roomConfig={INVENT_CONFIG}
      lab={INVENT_LAB}
      modesLabel="The forge's ways"
      testPrefix="invent"
    />
  );
}
