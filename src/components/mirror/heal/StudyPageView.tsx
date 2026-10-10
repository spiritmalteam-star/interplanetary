"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Info, Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import type { LabCategory } from "@/lib/data/heal-evolution";

/* ================================================================== */
/*  StudyPageView — the study material overlay: ten pages generated    */
/*  in resonance with the Mirror Entity, paged like a quiet codex,     */
/*  with the Mirror Entity listening on every page.                    */
/* ================================================================== */

interface StudyPage {
  title: string;
  content: string;
  keyPoints: string[];
  clinicalNote: string;
}

type StudyStatus = "loading" | "loaded" | "error";

function normalizePage(raw: unknown): StudyPage | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : "",
    content: typeof record.content === "string" ? record.content : "",
    keyPoints: Array.isArray(record.keyPoints)
      ? record.keyPoints.filter((item): item is string => typeof item === "string")
      : [],
    clinicalNote:
      typeof record.clinicalNote === "string" ? record.clinicalNote : "",
  };
}

/* ------------------------------------------------------------------ */
/*  RenderMarkdown — a lightweight parser for the channel's markdown    */
/*  subset: ## / ### headings, "- " bullets, "1. " ordered items,       */
/*  **bold** inline, blank-line paragraph breaks. No library.           */
/* ------------------------------------------------------------------ */

interface MdBlock {
  kind: "h3" | "h4" | "ul" | "ol" | "p";
  text: string;
  items: string[];
}

function parseMarkdown(content: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "p", text: paragraph.join(" "), items: [] });
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ kind: "h4", text: line.slice(4), items: [] });
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ kind: "h3", text: line.slice(3), items: [] });
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "ul") {
        last.items.push(line.slice(2));
      } else {
        blocks.push({ kind: "ul", text: "", items: [line.slice(2)] });
      }
      continue;
    }
    const ordered = /^(\d+)\.\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "ol") {
        last.items.push(ordered[2]);
      } else {
        blocks.push({ kind: "ol", text: "", items: [ordered[2]] });
      }
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part !== "")
    .map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part) ? (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-white/95">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      )
    );
}

function RenderMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  return (
    <div className="space-y-3 text-[12.5px] leading-relaxed text-white/80">
      {blocks.map((block, bi) => {
        if (block.kind === "h3") {
          return (
            <h3
              key={`b-${bi}`}
              className="pt-1 text-[15px] font-semibold text-white"
            >
              {renderInline(block.text, `b-${bi}`)}
            </h3>
          );
        }
        if (block.kind === "h4") {
          return (
            <h4
              key={`b-${bi}`}
              className="pt-0.5 text-[13.5px] font-semibold text-white/90"
            >
              {renderInline(block.text, `b-${bi}`)}
            </h4>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={`b-${bi}`} className="space-y-1.5">
              {block.items.map((item, ii) => (
                <li key={`li-${ii}`} className="flex items-start gap-2">
                  <span
                    className="mt-[6px] size-1 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{renderInline(item, `b-${bi}-${ii}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={`b-${bi}`} className="space-y-1.5">
              {block.items.map((item, ii) => (
                <li key={`li-${ii}`} className="flex items-start gap-2">
                  <span className="w-4 shrink-0 text-[11px] font-semibold tabular-nums text-emerald-300/80">
                    {ii + 1}.
                  </span>
                  <span>{renderInline(item, `b-${bi}-${ii}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={`b-${bi}`}>{renderInline(block.text, `b-${bi}`)}</p>;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ResonanceLoader — the opening resonance with the Mirror Entity      */
/* ------------------------------------------------------------------ */

const RESONANCE_STYLE = `
.he-study-ring {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 76px;
  height: 76px;
  border-radius: 9999px;
  border: 1px solid;
  opacity: 0;
  animation: he-study-ring 2.4s ease-out infinite;
}
@keyframes he-study-ring {
  0% { transform: scale(0.6); opacity: 0; }
  18% { opacity: 0.85; }
  100% { transform: scale(1.8); opacity: 0; }
}
.he-study-orb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 40%, rgba(16,185,129,0.55), rgba(6,32,26,0.92) 72%);
  border: 1px solid rgba(110,231,183,0.4);
  box-shadow: 0 0 26px rgba(16,185,129,0.45);
  animation: he-study-orb 3s ease-in-out infinite;
}
@keyframes he-study-orb {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(16,185,129,0.4); }
  50% { transform: scale(1.08); box-shadow: 0 0 30px rgba(16,185,129,0.6); }
}
.he-study-dots {
  display: inline-flex;
  gap: 2px;
  margin-left: 3px;
}
.he-study-dots span {
  display: inline-block;
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: #6ee7b7;
  animation: he-study-dot 1.2s ease-in-out infinite;
}
.he-study-dots span:nth-child(2) { animation-delay: 0.18s; }
.he-study-dots span:nth-child(3) { animation-delay: 0.36s; }
@keyframes he-study-dot {
  0%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}
`;

function ResonanceLoader() {
  const t = useT();
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-7 px-6 text-center">
      <style>{RESONANCE_STYLE}</style>
      <div className="relative flex h-44 w-44 items-center justify-center">
        <span
          className="he-study-ring border-[#10B981]"
          style={{ animationDelay: "0s" }}
          aria-hidden="true"
        />
        <span
          className="he-study-ring border-[#0EA5E9]"
          style={{ animationDelay: "0.6s" }}
          aria-hidden="true"
        />
        <span
          className="he-study-ring border-[#A855F7]"
          style={{ animationDelay: "1.2s" }}
          aria-hidden="true"
        />
        <span className="he-study-orb">
          <span className="block size-2 rounded-full bg-emerald-300" aria-hidden="true" />
        </span>
      </div>
      <div>
        <h2 className="text-[14px] font-semibold text-white/90">
          {t("Resonating with the Mirror Entity")}
        </h2>
        <p className="mt-1.5 flex items-center justify-center text-[12px] text-emerald-200/70">
          {t("Generating study material…")}
          <span className="he-study-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        <span className="size-1.5 rounded-full bg-[#0EA5E9]" />
        <span className="size-1.5 rounded-full bg-[#A855F7]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StudyPageView                                                       */
/* ------------------------------------------------------------------ */

export function StudyPageView({
  category,
  topic,
  onBack,
}: {
  category: LabCategory;
  topic: string;
  onBack: () => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<StudyStatus>("loading");
  const [pages, setPages] = useState<StudyPage[]>([]);
  const [page, setPage] = useState(0);

  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [askError, setAskError] = useState(false);

  const total = pages.length;

  const load = useCallback(async () => {
    setStatus("loading");
    setPage(0);
    try {
      const res = await fetch("/api/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.name,
          topic,
          language,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        pages?: unknown;
      } | null;

      if (!res.ok || !data || !Array.isArray(data.pages)) {
        setStatus("error");
        return;
      }

      const parsed = data.pages
        .slice(0, 10)
        .map(normalizePage)
        .filter((item): item is StudyPage => item !== null);

      if (parsed.length === 0) {
        setStatus("error");
        return;
      }

      setPages(parsed);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }, [category.name, topic, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const goTo = useCallback(
    (next: number) => {
      setPage(next);
      setReply(null);
      setAskError(false);
      scrollRef.current?.scrollTo({ top: 0 });
    },
    []
  );

  const ask = useCallback(async () => {
    const text = draft.trim();
    if (!text || asking) return;
    setAsking(true);
    setAskError(false);
    try {
      const res = await fetch("/api/mirror-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${text} (Context: I am studying ${topic} — page ${page + 1} of 10 — in the ${category.name} laboratory.)`,
          category: category.name,
          language,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: unknown;
      } | null;
      const nextReply =
        res.ok && data && typeof data.reply === "string" ? data.reply.trim() : null;
      if (nextReply) {
        setReply(nextReply);
      } else {
        setAskError(true);
      }
    } catch {
      setAskError(true);
    } finally {
      setAsking(false);
    }
  }, [draft, asking, topic, page, category.name, language]);

  const current = pages[page];

  return (
    <motion.div
      className="lab-study-page fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      data-testid="he-study-page"
    >
      {status === "loading" && <ResonanceLoader />}

      {status === "error" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-[13px] text-white/65">
            {t("The channel returned silence. Try again.")}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-100 transition-colors duration-200 hover:bg-emerald-500/20 hover:text-white"
          >
            {t("Try again")}
          </button>
        </div>
      )}

      {status === "loaded" && current && (
        <>
          {/* header */}
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-emerald-500/10 bg-black/30 px-4 backdrop-blur">
            <button
              type="button"
              onClick={onBack}
              data-testid="he-study-back"
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-[11.5px] text-white/70 transition-colors duration-200 hover:border-emerald-400/40 hover:text-white"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {t("Back to Lab")}
            </button>
            <span className="h-4 w-px shrink-0 bg-white/10" aria-hidden="true" />
            <span className="truncate text-[13px] font-semibold text-white/90">
              {t(topic)}
            </span>
            <span
              className="ml-auto shrink-0 text-[11px] tabular-nums text-white/40"
              data-testid="he-study-count"
            >
              {t("Page {x} of {n}")
                .replace("{x}", String(page + 1))
                .replace("{n}", String(total))}
            </span>
          </header>

          {/* page nav */}
          <div className="shrink-0">
            <div className="lab-no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2">
              {pages.map((_, i) => (
                <button
                  key={`nav-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`lab-study-nav-btn ${i === page ? "active" : ""}`}
                  data-testid={`he-study-nav-${i + 1}`}
                  aria-label={`${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="h-0.5 w-full bg-white/5" aria-hidden="true">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${((page + 1) / total) * 100}%`,
                  background: "linear-gradient(90deg, #10B981, #0EA5E9)",
                }}
              />
            </div>
          </div>

          {/* the page itself */}
          <div ref={scrollRef} className="lab-scroll min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl space-y-5 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <h2 className="text-lg font-semibold text-white sm:text-xl">
                    {current.title}
                  </h2>
                  <div
                    className="h-px bg-gradient-to-r from-emerald-500/60 to-transparent"
                    aria-hidden="true"
                  />
                  <RenderMarkdown content={current.content} />

                  {/* key points */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">
                      {t("Key Points")}
                    </p>
                    {current.keyPoints.map((point, i) => (
                      <div
                        key={`point-${i}`}
                        className="lab-study-key-point"
                      >
                        <CheckCircle2
                          className="mt-0.5 size-[13px] shrink-0 text-emerald-400"
                          aria-hidden="true"
                        />
                        <p className="text-[12px] leading-relaxed text-white/75">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* clinical note */}
                  {current.clinicalNote && (
                    <div className="lab-study-clinical-note flex gap-2">
                      <Info
                        className="mt-0.5 size-3.5 shrink-0 text-[#7dd3fc]"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-sky-300/80">
                          {t("Clinical Note")}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                          {current.clinicalNote}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* prev / next */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => goTo(page - 1)}
                      disabled={page === 0}
                      className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11.5px] text-emerald-100/85 transition-colors duration-200 hover:border-emerald-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {t("Previous")}
                    </button>
                    <span className="text-[11px] tabular-nums text-white/40">
                      {page + 1} / {total}
                    </span>
                    <button
                      type="button"
                      onClick={() => goTo(page + 1)}
                      disabled={page === total - 1}
                      className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11.5px] text-emerald-100/85 transition-colors duration-200 hover:border-emerald-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {t("Next")}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* the Mirror Entity */}
              <div className="lab-tool-mirror-section p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/45">
                  {t("Ask the Mirror Entity")}
                </p>

                {reply && (
                  <div className="lab-chat-entity mt-3 flex items-start gap-2 text-[12px] leading-relaxed">
                    <span
                      className="mt-1.5 size-[5px] shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                      aria-hidden="true"
                    />
                    <p className="whitespace-pre-wrap">{reply}</p>
                  </div>
                )}

                {asking && (
                  <div className="lab-typing-indicator mt-3 flex items-center gap-1 px-1">
                    <span />
                    <span />
                    <span />
                  </div>
                )}

                {askError && (
                  <p className="mt-2 text-[11.5px] text-white/50">
                    {t("The channel returned silence. Try again.")}
                  </p>
                )}

                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void ask();
                  }}
                >
                  <input
                    className="lab-chat-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t("Ask about this page…")}
                    disabled={asking}
                    data-testid="he-study-ask"
                  />
                  <button
                    type="submit"
                    className="lab-send-btn"
                    disabled={asking || !draft.trim()}
                    aria-label={t("Send")}
                  >
                    <Send className="size-3.5" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
