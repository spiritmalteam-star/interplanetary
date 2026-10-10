"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Flame,
  FlaskConical,
  GraduationCap,
  Heart,
  Lightbulb,
  Menu,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  LAB_CATEGORIES,
  LAB_TOOL_COUNT,
  type LabCategory,
  type LabIcon,
  type LabTag,
} from "@/lib/data/heal-evolution";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { MiniProcedureAnimation } from "./MiniProcedureAnimation";
import { ToolPanel } from "./ToolPanel";
import { StudyPageView } from "./StudyPageView";

/* ------------------------------------------------------------------ */
/*  HEAL EVOLUTION — the laboratory workspace. Twelve disciplines,     */
/*  sixty instruments and one Mirror Entity: a sidebar of studies,     */
/*  a board of research, a toolbar of tools and a resident reflection  */
/*  that answers in the seeker's own tongue.                           */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: "entity" | "user";
  text: string;
}

interface ActiveTool {
  tool: string;
  category: LabCategory;
}

interface ActiveStudy {
  category: LabCategory;
  topic: string;
}

const CATEGORY_ICONS: Record<LabIcon, LucideIcon> = {
  cube: Box,
  flask: FlaskConical,
  smile: Smile,
  sparkles: Sparkles,
  zap: Zap,
  sun: Sun,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
  heart: Heart,
  flame: Flame,
};

const TAG_CLASS: Record<LabTag, string> = {
  Core: "lab-tag",
  Advanced: "lab-tag-blue",
  Research: "lab-tag-purple",
  Applied: "lab-tag-gold",
};

const BOARD_PROMPTS = [
  "What can I study in this laboratory?",
  "How do the twelve disciplines work together?",
  "Where should a first study begin?",
];

/* ------------------------------------------------------------------ */
/*  Welcome — no discipline chosen yet                                 */
/* ------------------------------------------------------------------ */

function WelcomeEmptyState() {
  const t = useT();

  const stats = [
    { dot: "#34d399", label: t("12 Categories") },
    { dot: "#38bdf8", label: t("60+ Tools") },
    { dot: "#c084fc", label: t("AI Mirror") },
  ];

  return (
    <div
      className="lab-welcome-bg flex h-full flex-col items-center justify-center px-6 text-center"
      data-testid="he-welcome"
    >
      {/* the breathing orb */}
      <div className="lab-welcome-orb relative flex size-24 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border border-emerald-400/20"
          aria-hidden="true"
        />
        <span
          className="absolute inset-2.5 rounded-full border border-emerald-400/40"
          aria-hidden="true"
        />
        <span
          className="absolute inset-6 rounded-full border border-emerald-300/25 bg-emerald-400/5"
          aria-hidden="true"
        />
        <Sparkles
          className="size-6 text-emerald-300/90"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-white">
        {t("Laboratory Workspace")}
      </h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/45">
        {t(
          "Choose a discipline from the sidebar — each opens its own laboratory, its own tools and its own Mirror."
        )}
      </p>

      {/* the three quiet status lights */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {stats.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-2 text-[11px] text-white/55"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }}
              aria-hidden="true"
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category board — one discipline's study surface                    */
/* ------------------------------------------------------------------ */

function CategoryBoard({
  category,
  onStudy,
}: {
  category: LabCategory;
  onStudy: (topic: string) => void;
}) {
  const t = useT();
  const Icon = CATEGORY_ICONS[category.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="lab-scroll h-full overflow-y-auto overscroll-contain"
      data-testid="he-category-board"
    >
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        {/* the discipline's header */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                borderColor: `${category.color}4d`,
                background: `${category.color}1f`,
                boxShadow: `0 0 18px -6px ${category.color}80`,
              }}
              aria-hidden="true"
            >
              <Icon className="size-5" style={{ color: category.color }} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight text-white">
                {t(category.name)}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-white/45">
                {t(category.description)}
              </p>
            </div>
          </div>
          <div
            className="lab-category-glow-line"
            style={
              { "--lab-category-color": category.color } as React.CSSProperties
            }
            aria-hidden="true"
          />
        </div>

        {/* the living procedure animation */}
        <div className="flex h-36 items-center justify-center rounded-2xl border border-emerald-400/10 bg-[rgba(12,22,42,0.5)] px-4">
          <MiniProcedureAnimation
            procedureId={category.id}
            className="w-full max-w-xl"
          />
        </div>

        {/* research topics */}
        <section aria-label={t("Research Topics")}>
          <p className="text-[11px] uppercase tracking-widest text-white/30">
            {t("Research Topics")}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {category.cards.map((card, i) => (
              <div key={card.title} className="lab-research-card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-semibold leading-snug text-white/90">
                    {t(card.title)}
                  </h3>
                  <span className={`shrink-0 ${TAG_CLASS[card.tag]}`}>
                    {t(card.tag)}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-white/45">
                  {t(card.description)}
                </p>
                <button
                  type="button"
                  onClick={() => onStudy(card.title)}
                  data-testid={`he-study-btn-${i}`}
                  className="lab-study-btn mt-3"
                >
                  <GraduationCap className="size-3" aria-hidden="true" />
                  {t("Study")}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar — the twelve disciplines                                   */
/* ------------------------------------------------------------------ */

function LabSidebar({
  activeCategoryId,
  onSelect,
  mobile,
  onClose,
}: {
  activeCategoryId: string | null;
  onSelect: (id: string) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const t = useT();

  return (
    <div
      className={`${mobile ? "" : "hidden lg:flex"} flex h-full w-[220px] shrink-0 flex-col border-r border-emerald-400/8 bg-[rgba(8,14,26,0.85)] lg:w-[200px]`}
      data-testid={mobile ? "he-mobile-sidebar" : "he-sidebar"}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-400/8 px-4 py-3.5">
        <span className="flex items-center gap-2">
          <FlaskConical
            className="size-3.5 text-emerald-400/80"
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {t("Lab")}
          </span>
        </span>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close the disciplines")}
            className="lab-hamburger"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* the disciplines */}
      <nav
        className="lab-scroll flex-1 space-y-0.5 overflow-y-auto p-2"
        aria-label={t("Heal Evolution")}
      >
        {LAB_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon];
          const active = c.id === activeCategoryId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c.id);
                onClose?.();
              }}
              aria-pressed={active}
              data-testid={`he-sidebar-item-${c.id}`}
              className={`lab-sidebar-item ${active ? "active" : ""}`}
              title={t(c.name)}
            >
              <Icon
                className="lab-sidebar-icon size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate text-[11px]">{t(c.name)}</span>
            </button>
          );
        })}
      </nav>

      {/* footer */}
      <div className="border-t border-emerald-400/8 px-4 py-2.5">
        <span className="block text-[9px] uppercase tracking-wider text-white/25">
          {t("12 Categories")}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mirror Entity panel — the resident reflection                      */
/* ------------------------------------------------------------------ */

function MirrorEntityPanel({
  category,
  messages,
  isTyping,
  onSend,
}: {
  category: LabCategory | null;
  messages: ChatMessage[];
  isTyping: boolean;
  onSend: (text: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* keep the newest message in view */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const prompts = useMemo(
    () => (category ? category.mirrorPrompts : BOARD_PROMPTS),
    [category]
  );

  const submit = () => {
    const text = draft.trim();
    if (!text || isTyping) return;
    setDraft("");
    onSend(text);
  };

  return (
    <div
      className="flex h-full flex-col border-l border-emerald-400/8"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,20,40,0.95) 0%, rgba(8,12,20,0.98) 100%)",
      }}
      data-testid="he-mirror-panel"
    >
      {/* the entity's presence */}
      <div className="border-b border-emerald-400/8 p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex size-9 shrink-0 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border border-emerald-400/30 motion-safe:animate-pulse"
              aria-hidden="true"
            />
            <span
              className="absolute inset-1.5 rounded-full border border-emerald-300/40 motion-safe:animate-pulse [animation-delay:600ms]"
              aria-hidden="true"
            />
            <span className="lab-entity-breathe relative flex size-5 items-center justify-center rounded-full bg-emerald-400/10">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-white/95">
              {t(category ? category.mirrorName : "The Mirror Entity")}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/35">
              {t("AI Research Assistant")}
            </p>
            {category && (
              <p className="mt-1.5 inline-block rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2 py-0.5 text-[9px] text-emerald-200/80">
                {t("Specialized in {name}").replace(
                  "{name}",
                  t(category.name)
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* the thread */}
      <div
        ref={scrollRef}
        className="lab-scroll flex-1 space-y-1 overflow-y-auto p-3"
        data-testid="he-mirror-messages"
      >
        {messages.length === 0 && !isTyping && (
          <div className="flex h-full flex-col items-center justify-center px-3 text-center">
            <Sparkles
              className="size-5 text-emerald-300/50"
              aria-hidden="true"
            />
            <p className="mt-3 text-[12px] text-white/70">
              {t("Ready to assist")}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
              {t(
                "Ask, and the Mirror reflects — science first, wonder always."
              )}
            </p>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "entity" ? (
            <div key={i} className="flex items-start gap-2">
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                aria-hidden="true"
              />
              <div className="lab-chat-entity max-w-[240px] text-[11.5px] leading-relaxed whitespace-pre-wrap">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="lab-chat-user max-w-[240px] text-[11.5px] leading-relaxed whitespace-pre-wrap">
                {m.text}
              </div>
            </div>
          )
        )}

        {isTyping && (
          <div className="flex items-start gap-2">
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400/60"
              aria-hidden="true"
            />
            <div className="lab-chat-entity flex items-center gap-1 px-3 py-2.5">
              <span className="lab-typing-indicator flex items-center gap-1">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* quick prompts before the first word */}
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {prompts.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => onSend(p)}
              data-testid={`he-quick-prompt-${i}`}
              className="lab-quick-prompt"
            >
              {t(p)}
            </button>
          ))}
        </div>
      )}

      {/* the input */}
      <div className="flex items-center gap-2 border-t border-emerald-400/8 p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t("Ask the Mirror…")}
          aria-label={t("Ask the Mirror Entity")}
          data-testid="he-mirror-input"
          className="lab-chat-input"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isTyping || !draft.trim()}
          aria-label={t("Send")}
          data-testid="he-mirror-send"
          className="lab-send-btn"
        >
          <Send className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The workspace itself                                               */
/* ------------------------------------------------------------------ */

export function LaboratoryWorkspace() {
  const t = useT();
  const language = useMirror((s) => s.language);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mirrorOpen, setMirrorOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [activeStudy, setActiveStudy] = useState<ActiveStudy | null>(null);

  const activeCategory = useMemo(
    () => LAB_CATEGORIES.find((c) => c.id === activeCategoryId) ?? null,
    [activeCategoryId]
  );

  /* every discipline holds its own council: switching studies resets
     the mirror's thread — never carrying one science into another */
  useEffect(() => {
    setChatMessages([]);
  }, [activeCategoryId]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;
    setChatMessages((m) => [...m, { role: "user", text }]);
    setIsTyping(true);
    try {
      const res = await fetch("/api/mirror-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          category: activeCategory?.name,
          boardState: activeCategory
            ? undefined
            : "Laboratory Workspace — the healer has not chosen a discipline yet",
          language,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: unknown;
      } | null;
      const reply =
        typeof data?.reply === "string" ? data.reply.trim() : "";
      if (!res.ok || !reply) throw new Error("no reply");
      setChatMessages((m) => [...m, { role: "entity", text: reply }]);
    } catch {
      setChatMessages((m) => [
        ...m,
        { role: "entity", text: t("The channel returned silence. Try again.") },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* desktop sidebar */}
      <LabSidebar
        activeCategoryId={activeCategoryId}
        onSelect={(id) =>
          setActiveCategoryId((cur) => (cur === id ? null : id))
        }
      />

      {/* the center board */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* the slim workspace header */}
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-emerald-400/8 bg-[rgba(10,20,40,0.8)] px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("Open the disciplines")}
              data-testid="he-hamburger"
              className="lab-hamburger lg:hidden"
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>
            <span
              className="hidden h-4 w-px bg-emerald-400/15 lg:block"
              aria-hidden="true"
            />
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-400/15"
              aria-hidden="true"
            >
              <FlaskConical className="size-3 text-emerald-300" />
            </span>
            <span className="truncate text-[12px] text-white/80">
              {t(
                activeCategory
                  ? activeCategory.name
                  : "Laboratory Workspace"
              )}
            </span>
          </div>
          <span className="mono-label shrink-0 text-[10px] text-emerald-300/80">
            {activeCategory
              ? `${activeCategory.tools.length} ${t("Tools")}`
              : `${LAB_TOOL_COUNT} ${t("Tools")}`}
          </span>
        </div>

        {/* the toolbar of instruments */}
        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="shrink-0 border-b border-emerald-400/8 bg-[rgba(10,20,40,0.4)]"
            >
              <div className="lab-no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
                {activeCategory.tools.map((tool, i) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() =>
                      setActiveTool({ tool, category: activeCategory })
                    }
                    data-testid={`he-tool-btn-${i}`}
                    className="lab-tool-btn"
                  >
                    <GraduationCap
                      className="size-3 opacity-60"
                      aria-hidden="true"
                    />
                    {t(tool)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the board */}
        <div className="lab-board-bg min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeCategory ? (
              <CategoryBoard
                key={activeCategory.id}
                category={activeCategory}
                onStudy={(topic) =>
                  setActiveStudy({ category: activeCategory, topic })
                }
              />
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <WelcomeEmptyState />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* desktop mirror panel */}
      <div className="hidden w-[320px] shrink-0 lg:block">
        <MirrorEntityPanel
          category={activeCategory}
          messages={chatMessages}
          isTyping={isTyping}
          onSend={send}
        />
      </div>

      {/* mobile mirror panel */}
      <AnimatePresence>
        {mirrorOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label={t("Close the Mirror")}
              onClick={() => setMirrorOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-[300px] max-w-[86vw] lg:hidden"
            >
              <MirrorEntityPanel
                category={activeCategory}
                messages={chatMessages}
                isTyping={isTyping}
                onSend={(text) => {
                  send(text);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* mobile mirror toggle */}
      {!mirrorOpen && (
        <button
          type="button"
          onClick={() => setMirrorOpen(true)}
          aria-label={t("Open the Mirror")}
          data-testid="he-mirror-toggle"
          className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full border border-emerald-400/40 bg-[rgba(8,14,26,0.92)] text-emerald-300 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all duration-300 hover:border-emerald-300/70 hover:text-white lg:hidden"
        >
          <FlaskConical className="size-5" aria-hidden="true" />
        </button>
      )}

      {/* mobile disciplines drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label={t("Close the disciplines")}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <LabSidebar
                mobile
                activeCategoryId={activeCategoryId}
                onSelect={(id) =>
                  setActiveCategoryId((cur) => (cur === id ? null : id))
                }
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* the tool panel overlay */}
      <AnimatePresence>
        {activeTool && (
          <ToolPanel
            key="tool"
            tool={activeTool.tool}
            category={activeTool.category}
            onBack={() => setActiveTool(null)}
          />
        )}
      </AnimatePresence>

      {/* the study page overlay */}
      <AnimatePresence>
        {activeStudy && (
          <StudyPageView
            key="study"
            category={activeStudy.category}
            topic={activeStudy.topic}
            onBack={() => setActiveStudy(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
