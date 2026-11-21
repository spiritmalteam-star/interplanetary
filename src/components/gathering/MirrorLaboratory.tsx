"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom,
  Compass,
  FlaskConical,
  Handshake,
  Loader2,
  Maximize2,
  Minimize2,
  PenLine,
  Search,
  Send,
  Sparkles,
  Feather,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useMirror } from "@/lib/mirror-store";
import { GP_CARD, GP_GHOST, GP_HAND, GP_ICON_BTN, GP_INPUT, RoomLabel, netFetch } from "./shared";

/* ------------------------------------------------------------------ */
/*  THE MIRROR LABORATORY — the hall's unified field. One elegant      */
/*  place where the visitor asks, explores, creates, collaborates,     */
/*  experiments and prepares contributions — with M.E. reading the     */
/*  REAL hall before every answer and handing every consequential act  */
/*  back to the visitor's own hands.                                   */
/*                                                                     */
/*  THE HONESTY LAW: a hand below a reply never claims completion —    */
/*  it CARRIES the work into the room where the visitor's own hand     */
/*  finishes it (the composer, a bench, the circles, the current).     */
/*                                                                     */
/*  THE CONVERSATION'S OWN MEMORY — the thread rests in the tab's      */
/*  session keep and rides with every ask; one thread never reads      */
/*  another's shelf.                                                   */
/* ------------------------------------------------------------------ */

type LabMode = "ask" | "explore" | "create" | "collaborate" | "experiment" | "publish";

interface Draft {
  kind: string;
  title: string;
  body: string;
  tags: string[];
}

interface Turn {
  who: "me" | "mirror";
  text: string;
  intent?: string;
  draft?: Draft | null;
  /** the panel's own welcome — never rides the memory sent to M.E. */
  greeting?: boolean;
  /** an honest error — shown verbatim, but never remembered */
  transient?: boolean;
}

export interface ComposerSeed {
  kind: string;
  title?: string;
  body?: string;
  tags?: string;
}

export interface BenchSeed {
  title: string;
  question: string;
  hypothesis: string;
  method: string;
}

const MODES: Array<{ id: LabMode; label: string; icon: typeof Atom }> = [
  { id: "ask", label: "Ask", icon: Sparkles },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "create", label: "Create", icon: PenLine },
  { id: "collaborate", label: "Collaborate", icon: Handshake },
  { id: "experiment", label: "Experiment", icon: FlaskConical },
  { id: "publish", label: "Publish", icon: Feather },
];

const DRAFT_LABEL: Record<string, string> = {
  reflection: "a reflection",
  question: "a living question",
  hypothesis: "a hypothesis",
  discussion: "a community discussion",
  intention: "an intention",
  discovery: "a discovery",
};

const MEMORY_KEY = "mirror:gath-lab-thread-v1";
const MEMORY_MAX = 60;
const EXPANDED_KEY = "mirror:gath-lab-expanded";

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
    /* the keep is full — the living thread still holds */
  }
}

function memoryOf(turns: Turn[]) {
  return turns
    .filter((x) => !x.greeting && !x.transient)
    .map((x) => ({
      role: x.who === "me" ? ("user" as const) : ("assistant" as const),
      text: x.text,
    }))
    .slice(-8);
}

export default function MirrorLaboratory({
  active,
  onComposeIntent,
  onBenchSeed,
  onNavigate,
}: {
  active: boolean;
  /** carry a draft into the hall's real composer (the visitor's own hand hangs it) */
  onComposeIntent: (seed: ComposerSeed) => void;
  /** carry a draft into a real laboratory bench */
  onBenchSeed: (seed: BenchSeed) => void;
  /** walk to another room of the gathering */
  onNavigate: (section: string) => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [mode, setMode] = useState<LabMode>("ask");
  const [turns, setTurns] = useState<Turn[]>(() => {
    const kept = loadThread();
    if (kept.length > 0) return kept;
    return [
      {
        who: "mirror",
        greeting: true,
        text: t(
          "The laboratory is open. Ask anything, unfold an idea, draft a contribution, find your circle, or shape an experiment — begin wherever you are."
        ),
      },
    ];
  });
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  /* the keep — the thread survives the tab's journeys */
  useEffect(() => {
    saveThread(turns.filter((x) => !x.greeting && !x.transient));
  }, [turns]);

  /* the workspace's own dress — restored once */
  useEffect(() => {
    try {
      setExpanded(window.localStorage.getItem(EXPANDED_KEY) === "1");
    } catch {
      /* quiet */
    }
  }, []);

  const setExpandedPersist = useCallback((v: boolean) => {
    setExpanded(v);
    try {
      window.localStorage.setItem(EXPANDED_KEY, v ? "1" : "0");
    } catch {
      /* quiet */
    }
  }, []);

  /* the newest word stays in sight */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, thinking, active]);

  const ask = useCallback(
    async (text: string, chosenMode: LabMode) => {
      const words = text.trim();
      if (!words || thinking) return;
      setTurns((prev) => [...prev, { who: "me", text: words }]);
      setDraft("");
      setThinking(true);
      try {
        const data = await netFetch<{
          intent: string;
          reply: string;
          draft: Draft | null;
        }>("/api/network/laboratory/mirror", {
          method: "POST",
          body: {
            message: words,
            mode: chosenMode,
            language,
            history: memoryOf(turnsRef.current),
          },
        });
        setTurns((prev) => [
          ...prev,
          { who: "mirror", text: data.reply, intent: data.intent, draft: data.draft ?? null },
        ]);
      } catch (err) {
        const raw = err instanceof Error ? err.message : t("M.E. could not be reached just now.");
        setTurns((prev) => [...prev, { who: "mirror", text: `(honest) ${raw}`, transient: true }]);
      } finally {
        setThinking(false);
      }
    },
    [language, t, thinking]
  );

  /* the draft's hands — each carries the work into a real room */
  const handsFor = (turn: Turn) => {
    const hands: Array<{ key: string; label: string; icon: typeof Atom; run: () => void; primary?: boolean }> = [];
    if (turn.draft) {
      hands.push({
        key: "composer",
        label: `Open the composer with ${DRAFT_LABEL[turn.draft.kind] ?? "this draft"}`,
        icon: PenLine,
        primary: true,
        run: () =>
          onComposeIntent({
            kind: turn.draft!.kind,
            title: turn.draft!.title,
            body: turn.draft!.body,
            tags: turn.draft!.tags.join(", "),
          }),
      });
      if (turn.draft.kind === "hypothesis") {
        hands.push({
          key: "bench",
          label: "Open a bench from this",
          icon: FlaskConical,
          run: () => onBenchSeed(benchSeedOf(turn.draft!)),
        });
      }
    }
    if (turn.intent === "collaborate") {
      hands.push({
        key: "circles",
        label: "Find your circle",
        icon: Handshake,
        run: () => onNavigate("circles"),
      });
      hands.push({
        key: "encounters",
        label: "Meet someone",
        icon: Compass,
        run: () => onNavigate("encounters"),
      });
    }
    if (turn.intent === "explore" && !turn.draft) {
      hands.push({
        key: "questions",
        label: "The living questions",
        icon: Atom,
        run: () => onNavigate("questions"),
      });
    }
    if (turn.intent === "publish" && !turn.draft) {
      hands.push({
        key: "composer-plain",
        label: "Open the composer",
        icon: PenLine,
        run: () => onComposeIntent({ kind: "reflection" }),
      });
    }
    return hands;
  };

  const benchSeedOf = (d: Draft): BenchSeed => {
    const body = d.body;
    const grab = (head: string) => {
      const re = new RegExp(`${head}\\s*[:—-]?\\s*([^\\n]+)`, "i");
      const m = body.match(re);
      return m ? m[1].trim().slice(0, 2000) : "";
    };
    return {
      title: d.title,
      question: grab("Question") || grab("Hypothesis") || d.body.slice(0, 500),
      hypothesis: grab("Hypothesis") || d.body.slice(0, 800),
      method: grab("Method") || body.slice(0, 2000),
    };
  };

  return (
    <div className="gp-scroll h-full overflow-y-auto" data-testid="mirror-laboratory">
      <div className="mx-auto flex h-full max-w-[880px] flex-col px-4 pb-8 pt-5 sm:px-6">
        {/* the laboratory's own crown — compact, one line */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <RoomLabel>{t("the mirror laboratory")}</RoomLabel>
            <p className="mt-1.5 font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.7] text-[#8a7c64]">
              {t(
                "One field for asking, exploring, creating and sharing — M.E. suggests, your hand completes."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpandedPersist(!expanded)}
            aria-pressed={expanded}
            aria-label={expanded ? t("The compact workspace") : t("The expanded workspace")}
            title={expanded ? t("The compact workspace") : t("The expanded workspace")}
            data-testid="gath-lab-expand"
            className={GP_ICON_BTN + " size-9 shrink-0"}
          >
            {expanded ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
          </button>
        </div>

        {/* the contextual modes — one compact line, never a wall */}
        <div className="gp-scroll mt-4 flex shrink-0 gap-1.5 overflow-x-auto pb-1" role="toolbar" aria-label={t("Laboratory modes")}>
          {MODES.map((m) => {
            const MIcon = m.icon;
            const on = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={on}
                data-testid={`gath-lab-mode-${m.id}`}
                className={cn(
                  "focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-300",
                  on
                    ? "border-[#cbb98d] bg-white text-[#5c5344]"
                    : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c] hover:text-[#7c715f]"
                )}
              >
                <MIcon className="size-3.5" aria-hidden="true" />
                {t(m.label)}
              </button>
            );
          })}
        </div>

        <div className={cn("mt-4 flex min-h-0 flex-1 gap-4", expanded && "lg:flex-row")}>
          {/* the thread — the field's own conversation */}
          <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col")}>
            <div
              ref={scrollRef}
              className="gp-scroll min-h-[220px] flex-1 overflow-y-auto rounded-[22px] border border-white/80 px-4 py-4 sm:px-5"
              style={{ background: "var(--gath-sheet, #fffdf8)" }}
              data-testid="gath-lab-thread"
            >
              {turns.map((turn, i) =>
                turn.who === "me" ? (
                  <div key={i} className="mt-2.5 flex justify-end first:mt-0">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-[16px] bg-[#fdf1e7] px-3.5 py-2.5 font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#3d3428] [overflow-wrap:anywhere]">
                      {turn.text}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="mt-3.5 flex flex-col items-start first:mt-0">
                    <p className="max-w-full whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#4c4436] [overflow-wrap:anywhere]">
                      <Sparkles className="mr-1.5 inline size-3.5 align-[-2px] text-[#8a6f46]" aria-hidden="true" />
                      {turn.text}
                    </p>
                    {turn.draft && (
                      <div className={cn(GP_CARD, "mt-2.5 w-full max-w-[560px] p-3.5")} data-testid="gath-lab-draft">
                        <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-[#8a6f46]">
                          {t("a beginning — yours to edit")}
                        </p>
                        <p className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[13.5px] font-semibold text-[#3d3428]">
                          {turn.draft.title}
                        </p>
                        <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[12px] leading-[1.7] text-[#5c5344]">
                          {turn.draft.body}
                        </p>
                        {turn.draft.tags.length > 0 && (
                          <p className="mt-2 flex flex-wrap gap-1.5">
                            {turn.draft.tags.map((tg) => (
                              <span key={tg} className="rounded-full border border-[#e4d9bd] bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#8a6f46]">
                                {tg}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    )}
                    {handsFor(turn).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {handsFor(turn).map((h) => {
                          const HIcon = h.icon;
                          return (
                            <button
                              key={h.key}
                              type="button"
                              onClick={h.run}
                              data-testid={`gath-lab-hand-${h.key}`}
                              className={cn(h.primary ? GP_HAND : GP_GHOST, "min-h-[36px] px-3.5 py-1.5 text-[11.5px]")}
                            >
                              <HIcon className="size-3.5" aria-hidden="true" />
                              {t(h.label)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {!turn.greeting && (
                      <p className="mono-label mt-1 text-[8px] uppercase tracking-[0.18em] text-[#a2947c]">
                        {t("M.E. suggested")}
                      </p>
                    )}
                  </div>
                )
              )}
              {thinking && (
                <p className="mt-3 flex items-center gap-2 text-[12px] italic text-[#a2947c]">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {t("M.E. listens…")}
                </p>
              )}
            </div>

            {/* THE UNIFIED FIELD — one place for every intention */}
            <div className="mt-3 flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(draft, mode);
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder={t("Ask, discover, create, or share with Mirror…")}
                aria-label={t("Ask, discover, create, or share with Mirror…")}
                data-testid="gath-lab-input"
                className={cn(GP_INPUT, "min-h-[52px] flex-1 resize-none py-3")}
              />
              <button
                type="button"
                onClick={() => void ask(draft, mode)}
                disabled={thinking || !draft.trim()}
                aria-label={t("Speak to the laboratory")}
                data-testid="gath-lab-send"
                className={cn(GP_HAND, "size-[52px] shrink-0 rounded-[16px] p-0")}
              >
                {thinking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* THE EXPANDED WORKSPACE — the research panel, disclosed only
              when the visitor asks for it; never an empty decoration */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.aside
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                aria-label={t("The research panel")}
                className="hidden w-[280px] shrink-0 flex-col gap-3 lg:flex"
              >
                <div className={cn(GP_CARD, "p-4")}>
                  <RoomLabel>{t("how the field works")}</RoomLabel>
                  <ul className="mt-2 space-y-1.5 font-[family-name:var(--font-literata)] text-[11.5px] leading-[1.7] text-[#7c715f]">
                    <li>{t("Speak naturally — M.E. names the fitting intention itself.")}</li>
                    <li>{t("Drafts it prepares open in YOUR composer — you edit, you hang.")}</li>
                    <li>{t("It reads the hall's real questions and circles before answering.")}</li>
                    <li>{t("This thread keeps its own memory in your tab.")}</li>
                  </ul>
                </div>
                <div className={cn(GP_CARD, "p-4")}>
                  <RoomLabel>{t("walk straight into a room")}</RoomLabel>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => onNavigate("questions")} className={cn(GP_GHOST, "min-h-[34px] px-3 py-1 text-[11px]")}>
                      <Atom className="size-3" aria-hidden="true" /> {t("Questions")}
                    </button>
                    <button type="button" onClick={() => onNavigate("laboratory")} className={cn(GP_GHOST, "min-h-[34px] px-3 py-1 text-[11px]")}>
                      <FlaskConical className="size-3" aria-hidden="true" /> {t("Benches")}
                    </button>
                    <button type="button" onClick={() => onNavigate("circles")} className={cn(GP_GHOST, "min-h-[34px] px-3 py-1 text-[11px]")}>
                      <Handshake className="size-3" aria-hidden="true" /> {t("Circles")}
                    </button>
                    <button type="button" onClick={() => onNavigate("discover")} className={cn(GP_GHOST, "min-h-[34px] px-3 py-1 text-[11px]")}>
                      <Search className="size-3" aria-hidden="true" /> {t("Discover")}
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
