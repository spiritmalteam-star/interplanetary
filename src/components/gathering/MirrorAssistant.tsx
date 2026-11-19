"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Maximize2, Minimize2, Send, Sparkles, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type MeState, GP_GHOST, GP_ICON_BTN, GP_INPUT, netFetch } from "./shared";

/* ------------------------------------------------------------------ */
/*  THE MIRROR — M.E.'s own contextual hand inside the hall. It        */
/*  listens to the room it stands in, suggests, explains, drafts —     */
/*  and never acts without a human hand. Every answer it gives is a    */
/*  suggestion by definition; every error it meets is shown verbatim,  */
/*  prefixed honestly.                                                 */
/*                                                                     */
/*  THE COMPACT DRAWER — on the palm it rests at the screen's foot, a  */
/*  quiet sheet; on the desk it keeps its side seat. The scope it      */
/*  reads is spoken in its own crown — the room, and any offering      */
/*  the visitor carried to it — never guessed, never hidden.           */
/*  THE FULL CONVERSATION — one expand hand opens the keyboard-safe    */
/*  room-wide dialogue; one fold returns to the sheet.                 */
/* ------------------------------------------------------------------ */

type AssistantAction = "summarize" | "explain" | "find" | "suggest" | "draft" | "next";

interface Turn {
  who: "me" | "mirror";
  text: string;
  /** the panel's own welcome — never rides the memory sent to M.E. */
  greeting?: boolean;
  /** an honest error — shown verbatim, but never remembered */
  transient?: boolean;
}

/** the scope M.E. is asked to read — spoken in the crown, sent along */
interface MirrorScope {
  postTitle?: string;
  postExcerpt?: string;
}

/* THE CONVERSATION'S OWN KEEP — the thread survives the tab's journeys
   (sections, reloads, returns) in sessionStorage, and rides to M.E. as
   the memory of the conversation being proceeded. One keep per hall;
   each chat of the house keeps its own separate shelf. */
const MEMORY_KEY = "mirror:gath-assistant-thread-v1";
const MEMORY_MAX = 40;

function loadThread(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is Turn =>
        !!x &&
        typeof x === "object" &&
        ((x as Turn).who === "me" || (x as Turn).who === "mirror") &&
        typeof (x as Turn).text === "string"
    );
  } catch {
    return [];
  }
}

function saveThread(turns: Turn[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(turns.slice(-MEMORY_MAX))
    );
  } catch {
    /* the keep is full — the living thread still holds in memory */
  }
}

/** the memory M.E. receives — the thread as it stands, minus the
    welcome, oldest first, capped so the newest turns lead */
function memoryOf(turns: Turn[]): { role: "user" | "assistant"; text: string }[] {
  return turns
    .filter((x) => !x.greeting && !x.transient)
    .map((x) => ({
      role: x.who === "me" ? ("user" as const) : ("assistant" as const),
      text: x.text,
    }))
    .slice(-8);
}

const QUICK_HANDS: Array<{ action: AssistantAction; label: string }> = [
  { action: "summarize", label: "Summarize this room" },
  { action: "explain", label: "Explain a concept" },
  { action: "find", label: "Find questions" },
  { action: "suggest", label: "Suggest circles" },
  { action: "draft", label: "Draft a post" },
  { action: "next", label: "Next steps" },
];

/* the room's own name, spoken in the mirror's crown */
const ROOM_NAMES: Record<string, string> = {
  gathering: "the Gather",
  create: "the composer",
  discover: "Explore",
  possibilities: "the Possibilities Realm",
  questions: "Living Questions",
  circles: "Resonance Circles",
  laboratory: "the Laboratory",
  library: "the Creation Commons",
  collaborate: "the Workshops",
  intentions: "Collective Intentions",
  live: "Gather Live",
  encounters: "Connections",
  messages: "the Inbox",
  saved: "the Saved shelf",
  myspace: "My Space",
  settings: "Settings",
  guidelines: "the Guidelines",
  mirror: "the Mirror Laboratory",
};

export default function MirrorAssistant({
  section,
  me,
  radioOpen = false,
}: {
  section: string;
  me: MeState | null;
  /** the frequency radio stands at the hall's foot — the mirror
      lifts itself above its band on the palm, and comes back down
      when the radio folds away */
  radioOpen?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [scope, setScope] = useState<MirrorScope | null>(null);
  const [turns, setTurns] = useState<Turn[]>(() => {
    const kept = loadThread();
    if (kept.length > 0) return kept;
    return [
      {
        who: "mirror",
        greeting: true,
        text: me?.name
          ? `${me.name} — ${t("ask me anything about this room. I suggest; I never act without your hand.")}`
          : t("Ask me anything about this room. I suggest; I never act without your hand."),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* one honest exchange — the question rides with the pending hand
     when a quick hand sent it, and with the thread's own memory so
     M.E. proceeds the conversation instead of starting it cold;
     the spoken scope rides too; errors are shown verbatim, prefixed */
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;
  const scopeRef = useRef<MirrorScope | null>(null);
  scopeRef.current = scope;
  const ask = useCallback(
    async (question: string, action?: AssistantAction) => {
      if (thinking) return;
      const text = question.trim();
      if (!text && !action) return;
      setPendingAction(null);
      if (text) setTurns((prev) => [...prev, { who: "me", text }]);
      setInput("");
      setThinking(true);
      try {
        const data = await netFetch<{ answer: string }>("/api/network/assistant", {
          method: "POST",
          body: {
            section,
            question: text,
            action: action ?? undefined,
            history: memoryOf(turnsRef.current),
            ...(scopeRef.current?.postTitle
              ? { postTitle: scopeRef.current.postTitle }
              : {}),
            ...(scopeRef.current?.postExcerpt
              ? { postExcerpt: scopeRef.current.postExcerpt }
              : {}),
          },
        });
        setTurns((prev) => [...prev, { who: "mirror", text: data.answer }]);
      } catch (err) {
        const raw = err instanceof Error ? err.message : t("M.E. could not be reached just now.");
        setTurns((prev) => [
          ...prev,
          { who: "mirror", text: `(honest) ${raw}`, transient: true },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [section, t, thinking]
  );

  /* a quick hand sets its intent and speaks at once — an empty
     question is honest when the action carries the asking */
  const quick = useCallback(
    (action: AssistantAction) => {
      setPendingAction(action);
      void ask("", action);
    },
    [ask]
  );

  /* the newest word stays in sight */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, thinking, open, full]);

  /* the keep — every finished exchange rests in the tab's session, so
     a journey to another room (or a reload) finds the conversation
     standing where it was left; the welcome and the honest errors
     never take a shelf */
  useEffect(() => {
    saveThread(turns.filter((x) => !x.greeting && !x.transient));
  }, [turns]);

  /* the input receives the visitor's hand when the mirror opens */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, full]);

  /* one breath of Escape folds the mirror — the full room first */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (full) setFull(false);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, full]);

  /* AN OFFERING'S OWN HAND — a card may carry its words to the mirror:
     the drawer opens with the offering named in the crown, and the
     next answer reads it in context */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ postTitle?: string; postExcerpt?: string }>).detail;
      setScope(
        detail && (detail.postTitle || detail.postExcerpt)
          ? { postTitle: detail.postTitle, postExcerpt: detail.postExcerpt }
          : null
      );
      setOpen(true);
    };
    window.addEventListener("gath-me-open", onOpen);
    return () => window.removeEventListener("gath-me-open", onOpen);
  }, []);

  /* the room's scope resets when the visitor changes streets */
  useEffect(() => {
    setScope(null);
  }, [section]);

  const scopeLine = scope?.postTitle
    ? `${t("listening to")}: ${scope.postTitle}`
    : `${t("listening to")}: ${t(ROOM_NAMES[section] ?? section)}`;

  /* the shared transcript — one body, two rooms (the sheet and the
     full conversation read from the same turns) */
  const transcript = (
    <>
      {turns.map((turn, i) =>
        turn.who === "me" ? (
          <div key={i} className="mt-2 flex justify-end">
            <p className="max-w-[85%] rounded-[14px] bg-[#fdf1e7] px-3 py-2 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.7] text-[#3d3428] [overflow-wrap:anywhere]">
              {turn.text}
            </p>
          </div>
        ) : (
          <div key={i} className="mt-2.5 flex flex-col items-start">
            <p className="font-[family-name:var(--font-literata)] text-[12.5px] italic leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
              <Sparkles
                className="mr-1.5 inline size-3 align-[-2px] text-[#8a6f46]"
                aria-hidden="true"
              />
              {turn.text}
            </p>
            <p className="mono-label mt-1 text-[8px] uppercase tracking-[0.18em] text-[#a2947c]">
              {t("M.E. suggested")}
            </p>
          </div>
        )
      )}
      {thinking && (
        <p className="mt-2 flex items-center gap-2 text-[11.5px] italic text-[#a2947c]">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          {t("M.E. listens…")}
        </p>
      )}
    </>
  );

  const quickHands = (
    <div className="gp-scroll flex shrink-0 gap-1.5 overflow-x-auto px-4 py-2.5">
      {QUICK_HANDS.map((q) => (
        <button
          key={q.action}
          type="button"
          onClick={() => quick(q.action)}
          disabled={thinking}
          className={cn(GP_GHOST, "shrink-0 whitespace-nowrap px-3 py-1.5 text-[11px]")}
          data-testid={`gath-assistant-act-${q.action}`}
        >
          {t(q.label)}
        </button>
      ))}
    </div>
  );

  const askingHand = (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void ask(input, pendingAction ?? undefined);
          }
        }}
        maxLength={600}
        placeholder={t("Ask M.E. anything about this room…")}
        aria-label={t("Ask M.E. anything about this room…")}
        data-testid="gath-assistant-input"
        className={cn(GP_INPUT, "min-w-0 flex-1")}
      />
      <button
        type="button"
        onClick={() => void ask(input, pendingAction ?? undefined)}
        disabled={thinking}
        className={cn(GP_ICON_BTN, "size-9")}
        aria-label={t("Send to M.E.")}
        data-testid="gath-assistant-send"
      >
        {thinking ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );

  const crown = (
    <div className="flex items-start justify-between gap-2 border-b border-[#eadfca]/70 px-4 py-3">
      <div className="min-w-0">
        <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
          {t("the mirror · m.e.")}
        </p>
        {/* THE SPOKEN SCOPE — what M.E. reads is named, never guessed */}
        <p
          className="mono-label mt-1 truncate text-[8px] uppercase tracking-[0.18em] text-[#a16207]"
          data-testid="gath-assistant-scope"
        >
          {scopeLine}
        </p>
        <p className="mt-1 font-[family-name:var(--font-literata)] text-[11.5px] italic leading-[1.6] text-[#8a7c64]">
          {t("It suggests — it never acts without your hand.")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFull((v) => !v)}
          aria-label={full ? t("Fold to the compact mirror") : t("Open the full conversation")}
          title={full ? t("Fold to the compact mirror") : t("Open the full conversation")}
          data-testid="gath-assistant-expand"
          className={cn(GP_ICON_BTN, "size-8")}
        >
          {full ? <Minimize2 className="size-3.5" aria-hidden="true" /> : <Maximize2 className="size-3.5" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setFull(false);
          }}
          aria-label={t("Close the mirror")}
          className={cn(GP_ICON_BTN, "size-8")}
          data-testid="gath-assistant-close"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* the floating pearl — the one mirror presence in the hall:
          it rests just above the palm's streets (and above the safe
          area, always), lifts over the radio while it plays, and
          never covers community content */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        animate={{ scale: open ? 0.92 : 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        aria-label={t("Ask M.E.")}
        title={t("Ask M.E.")}
        aria-expanded={open}
        data-testid="gath-assistant-open"
        className={cn(
          "gp-pearl focus-glow fixed right-4 z-50 flex size-12 items-center justify-center rounded-full border border-white/90 transition-[bottom] duration-300 sm:right-6 lg:bottom-[84px]",
          radioOpen ? "bottom-[196px]" : "bottom-[84px]"
        )}
        style={{
          bottom: `calc(${radioOpen ? "196px" : "84px"} + env(safe-area-inset-bottom, 0px))`,
          background: "linear-gradient(150deg,#fdf9ef 0%,#f3ead6 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 20px -8px rgba(122,103,70,0.55)",
        }}
      >
        <Sparkles className="size-5 text-[#8a6f46]" aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {open && !full && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label={t("The mirror — M.E.")}
            data-testid="gath-assistant-panel"
            className={cn(
              "fixed right-4 z-40 flex max-h-[64vh] w-[min(92vw,380px)] flex-col overflow-hidden shadow-xl transition-[bottom] duration-300 sm:right-6",
              radioOpen ? "bottom-[260px] lg:bottom-[148px]" : "bottom-[148px]"
            )}
            style={{
              borderRadius: 22,
              border: "1px solid rgba(228,217,189,0.7)",
              background: "#fffdf8",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.9), 0 18px 42px -20px rgba(122,103,70,0.45)",
            }}
          >
            {crown}
            {quickHands}
            <div
              ref={scrollRef}
              className="gp-scroll min-h-0 max-h-[40vh] flex-1 overflow-x-hidden overflow-y-auto border-t border-[#eadfca]/70 px-4 py-3"
            >
              {transcript}
            </div>
            <div className="border-t border-[#eadfca]/70">{askingHand}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE FULL CONVERSATION — the room-wide mirror: keyboard-safe,
          the whole thread in sight, one fold back to the sheet */}
      <AnimatePresence>
        {open && full && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={t("The mirror — the full conversation")}
            data-testid="gath-assistant-full"
            className="fixed inset-0 z-[65] flex h-[100dvh] flex-col"
            style={{
              background:
                "linear-gradient(168deg,#fffdf8 0%,#faf5e8 60%,#f4ecda 100%)",
            }}
          >
            <div className="shrink-0">{crown}</div>
            {quickHands}
            <div
              ref={scrollRef}
              className="gp-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto border-t border-[#eadfca]/70 px-4 py-3 sm:px-8"
            >
              <div className="mx-auto max-w-[720px]">{transcript}</div>
            </div>
            <div
              className="shrink-0 border-t border-[#eadfca]/70"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
            >
              <div className="mx-auto max-w-[720px]">{askingHand}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
