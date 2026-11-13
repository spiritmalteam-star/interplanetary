"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CircleQuestionMark,
  GitBranch,
  Loader2,
  PenLine,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  EVIDENCE_LABEL,
  EVIDENCE_LEVELS,
  type EvidenceLevel,
  type QuestionBranchRow,
  type QuestionDetail,
  EmptyRoom,
  EvidenceChip,
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  GP_ICON_BTN,
  GP_INPUT,
  MakerMark,
  netFetch,
  relativeTime,
  RoomLabel,
  useFlashNote,
  useInterval,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  LIVING QUESTIONS — a question is a space, not a post. Every        */
/*  question grows a tree of branches: knowledge, hypotheses,          */
/*  uncertainties, experiments, findings and discussions, each         */
/*  carrying its own honest evidence step. M.E. may reflect, never     */
/*  verify; only the keeper settles or reopens the question.           */
/* ------------------------------------------------------------------ */

interface QuestionSummary {
  id: string;
  postId: string;
  title: string;
  body: string;
  status: string;
  disciplines: string[];
  branchCount: number;
  contributorCount: number;
  updatedAt: string;
  owner: { name: string; anon: boolean };
}

/* the detail speaks with its keeper's name too */
type QuestionDetailFull = QuestionDetail & { owner: { name: string } };

const BRANCH_KINDS = [
  "knowledge",
  "hypothesis",
  "uncertainty",
  "experiment",
  "finding",
  "discussion",
] as const;
type BranchKind = (typeof BRANCH_KINDS)[number];

const KIND_LABEL: Record<BranchKind, string> = {
  knowledge: "Knowledge",
  hypothesis: "Hypothesis",
  uncertainty: "Uncertainty",
  experiment: "Experiment",
  finding: "Finding",
  discussion: "Discussion",
};

const KIND_HUE: Record<BranchKind, string> = {
  knowledge: "#0d9488",
  hypothesis: "#7c5cad",
  uncertainty: "#9a6b8a",
  experiment: "#a16207",
  finding: "#5f7a52",
  discussion: "#8a6f46",
};

function isBranchKind(v: string): v is BranchKind {
  return (BRANCH_KINDS as readonly string[]).includes(v);
}

const TINY_CHIP =
  "inline-flex shrink-0 items-center rounded-full border border-[#e8dfc9] bg-white/55 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#a2947c]";

/* ---------- the tree's shape ---------- */

interface BranchNode {
  branch: QuestionBranchRow;
  children: BranchNode[];
}

function buildTree(branches: QuestionBranchRow[]): BranchNode[] {
  const ids = new Set(branches.map((b) => b.id));
  const byParent = new Map<string, QuestionBranchRow[]>();
  for (const b of branches) {
    const key = b.parentId !== null && ids.has(b.parentId) ? b.parentId : ":root:";
    const list = byParent.get(key) ?? [];
    list.push(b);
    byParent.set(key, list);
  }
  const make = (b: QuestionBranchRow): BranchNode => ({
    branch: b,
    children: (byParent.get(b.id) ?? []).map(make),
  });
  return (byParent.get(":root:") ?? []).map(make);
}

/* ================================================================== */
/*  THE SECTION — list and detail under one AnimatePresence breath     */
/* ================================================================== */

export default function QuestionsSection({ active }: { active: boolean }) {
  const t = useT();
  const [questions, setQuestions] = useState<QuestionSummary[] | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { note, flash } = useFlashNote();

  /* the founder's sheet */
  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");
  const [nContext, setNContext] = useState("");
  const [nDisciplines, setNDisciplines] = useState("");
  const [nBusy, setNBusy] = useState(false);
  const [nErr, setNErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      params.set("take", "48");
      const data = await netFetch<{ questions: QuestionSummary[] }>(
        `/api/network/questions?${params.toString()}`
      );
      setQuestions(data.questions);
      setListErr(null);
    } catch (err) {
      setListErr(err instanceof Error ? err.message : t("The questions could not be read."));
    }
  }, [appliedQ, t]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  /* the list breathes while the room stands open */
  useInterval(
    () => {
      if (document.visibilityState === "visible") void load();
    },
    active && !openId ? 12000 : null
  );

  const begin = useCallback(async () => {
    if (nTitle.trim().length < 2 || nBody.trim().length < 2 || nBusy) return;
    setNBusy(true);
    setNErr(null);
    try {
      await netFetch<{ question: { id: string } }>("/api/network/questions", {
        method: "POST",
        body: {
          title: nTitle.trim(),
          body: nBody.trim(),
          ...(nContext.trim() ? { context: nContext.trim() } : {}),
          ...(nDisciplines.trim() ? { disciplines: nDisciplines.trim() } : {}),
        },
      });
      setCreating(false);
      setNTitle("");
      setNBody("");
      setNContext("");
      setNDisciplines("");
      await load();
      flash(t("The question now lives among the living."));
    } catch (err) {
      setNErr(err instanceof Error ? err.message : t("The question could not be planted."));
    } finally {
      setNBusy(false);
    }
  }, [nTitle, nBody, nContext, nDisciplines, nBusy, load, flash, t]);

  /* escape closes the founder's sheet */
  useEffect(() => {
    if (!creating) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreating(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creating]);

  const roomMotion = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-4 pb-24 pt-4 sm:px-6 sm:pt-5">
      <AnimatePresence mode="wait" initial={false}>
        {openId ? (
          <motion.div key={`question-${openId}`} {...roomMotion} className="mx-auto max-w-[860px]">
            <QuestionRoom
              id={openId}
              active={active}
              onBack={() => {
                setOpenId(null);
                void load();
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="questions-list" {...roomMotion} className="mx-auto max-w-[860px]">
            <RoomLabel>{t("the gathering · living questions")}</RoomLabel>
            <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold tracking-wide text-[#3d3428]">
              {t("Living Questions")}
            </h2>
            <p className="mt-1.5 font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#7c715f]">
              {t(
                "A question is a space, not a post — it grows branches, contradictions and directions, together."
              )}
            </p>

            {/* the search and the founding hand */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <input
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setAppliedQ(draftQ.trim());
                  }}
                  maxLength={120}
                  placeholder={t("Search the open questions…")}
                  aria-label={t("Search the open questions…")}
                  data-testid="gath-questions-search"
                  className={cn(GP_INPUT, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setAppliedQ(draftQ.trim())}
                  aria-label={t("Search the open questions…")}
                  data-testid="gath-questions-search-go"
                  className={cn(GP_ICON_BTN, "absolute right-1.5 top-1/2 size-9 -translate-y-1/2")}
                >
                  <Search className="size-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={GP_HAND}
                data-testid="gath-questions-new"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("Begin a question")}
              </button>
            </div>

            {appliedQ && (
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  setAppliedQ("");
                }}
                className="focus-glow mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#e4d9bd] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
              >
                <X className="size-3" aria-hidden="true" />
                {t("Clear the search")}
              </button>
            )}

            <AnimatePresence>
              {note && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 font-[family-name:var(--font-literata)] text-[12.5px] italic text-[#8a6f46]"
                >
                  {note}
                </motion.p>
              )}
            </AnimatePresence>
            {listErr && <p className="mt-3 text-[12.5px] text-[#b45309]">{listErr}</p>}

            {questions === null && !listErr && (
              <p className="flex items-center justify-center gap-2 py-20 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The questions arrive…")}
              </p>
            )}
            {questions !== null && questions.length === 0 && !listErr && (
              <EmptyRoom
                icon={CircleQuestionMark}
                line={t("No questions stand yet — the first one grows from a wondering.")}
              />
            )}
            {questions !== null && questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {questions.map((q) => (
                  <QuestionCard key={q.id} q={q} onOpen={() => setOpenId(q.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- the founder's sheet ---------- */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 z-30 flex flex-col justify-end px-4 pb-6 sm:justify-center sm:px-6 sm:pb-0"
            role="dialog"
            aria-modal="true"
            aria-label={t("Begin a question")}
          >
            <button
              type="button"
              aria-label={t("Set it aside")}
              onClick={() => setCreating(false)}
              tabIndex={-1}
              className="absolute inset-0 cursor-default bg-[#3d3428]/25"
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="gp-glass relative mx-auto max-h-[88%] w-full max-w-lg overflow-y-auto rounded-[22px] bg-[#fffdf8] p-6 shadow-[0_24px_60px_-24px_rgba(46,38,24,0.45)]"
              data-testid="gath-question-sheet"
            >
              <div className="flex items-center justify-between">
                <RoomLabel>{t("Begin a question")}</RoomLabel>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  aria-label={t("Set it aside")}
                  className={cn(GP_ICON_BTN, "size-9")}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <input
                value={nTitle}
                onChange={(e) => setNTitle(e.target.value)}
                maxLength={140}
                placeholder={t("Give the question its words…")}
                aria-label={t("Give the question its words…")}
                data-testid="gath-question-title"
                className={cn(GP_INPUT, "mt-3")}
              />
              <textarea
                value={nBody}
                onChange={(e) => setNBody(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={t("What asks itself in you?")}
                aria-label={t("What asks itself in you?")}
                data-testid="gath-question-body"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <textarea
                value={nContext}
                onChange={(e) => setNContext(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder={t("The ground it stands on (optional)…")}
                aria-label={t("The ground it stands on (optional)…")}
                data-testid="gath-question-context"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <input
                value={nDisciplines}
                onChange={(e) => setNDisciplines(e.target.value)}
                maxLength={200}
                placeholder={t("Disciplines, comma separated (optional)…")}
                aria-label={t("Disciplines, comma separated (optional)…")}
                data-testid="gath-question-disciplines"
                className={cn(GP_INPUT, "mt-2.5")}
              />
              {nErr && <p className="mt-2.5 text-[12px] text-[#b45309]">{nErr}</p>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className={GP_GHOST}
                  data-testid="gath-question-cancel"
                >
                  {t("Set it aside")}
                </button>
                <button
                  type="button"
                  onClick={() => void begin()}
                  disabled={nTitle.trim().length < 2 || nBody.trim().length < 2 || nBusy}
                  className={GP_HAND}
                  data-testid="gath-question-submit"
                >
                  {nBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Grow it")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== ONE QUESTION'S CARD =============== */

function QuestionCard({ q, onOpen }: { q: QuestionSummary; onOpen: () => void }) {
  const t = useT();
  const open = q.status !== "settled";
  const shown = q.disciplines.slice(0, 3);
  const rest = q.disciplines.length - shown.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="gath-question-card"
      className={cn(GP_CARD, "focus-glow block w-full p-5 text-left transition-all duration-300 hover:border-[#d3c39c]")}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
          {q.title}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
            open ? "border-[#5f7a52]/40 text-[#5f7a52]" : "border-[#e4d9bd] text-[#7c715f]"
          )}
        >
          {open ? t("Open") : t("Settled")}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#7c715f] [overflow-wrap:anywhere]">
        {q.body}
      </p>
      {(shown.length > 0 || rest > 0) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {shown.map((d) => (
            <span key={d} className={TINY_CHIP}>
              {d}
            </span>
          ))}
          {rest > 0 && (
            <span className={TINY_CHIP}>
              +{rest}
            </span>
          )}
        </div>
      )}
      <p className="mt-2.5 text-[11px] text-[#a2947c]">
        {q.branchCount} {t("branches")} · {q.contributorCount} {t("voices")} · {t("updated")}{" "}
        {relativeTime(q.updatedAt, t)}
      </p>
      <div className="mt-3 flex items-center gap-2 border-t border-[#e4d9bd]/70 pt-3">
        <MakerMark name={q.owner.name} size={24} />
        <span className="text-[11.5px] text-[#7c715f]">
          <span className="font-semibold text-[#5c5344]">{q.owner.name}</span>{" "}
          {t("keeps this question")}
        </span>
      </div>
    </button>
  );
}

/* =============== SMALL CLOTHING =============== */

function KindChip({ kind }: { kind: BranchKind }) {
  const t = useT();
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e4d9bd] bg-white/60 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#7c715f]">
      <span className="size-1.5 rounded-full" style={{ background: KIND_HUE[kind] }} aria-hidden="true" />
      {t(KIND_LABEL[kind])}
    </span>
  );
}

function BranchCard({
  branch,
  onAnswer,
}: {
  branch: QuestionBranchRow;
  onAnswer: (b: QuestionBranchRow) => void;
}) {
  const t = useT();
  const kind = isBranchKind(branch.kind) ? branch.kind : "discussion";
  return (
    <div className={cn(GP_CARD, "p-4")} data-testid="gath-branch">
      <div className="flex flex-wrap items-center gap-1.5">
        <KindChip kind={kind} />
        <EvidenceChip level={branch.evidence} />
      </div>
      <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
        {branch.body}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <MakerMark name={branch.author.name} size={22} />
          <span className="truncate text-[11px] text-[#a2947c]">
            <span className="font-semibold text-[#5c5344]">{branch.author.name}</span> ·{" "}
            {relativeTime(branch.createdAt, t)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAnswer(branch)}
          data-testid="gath-branch-answer"
          className={cn(GP_GHOST, "shrink-0 px-3 py-1.5 text-[11px]")}
        >
          {t("Answer")}
        </button>
      </div>
    </div>
  );
}

function BranchNodeView({
  node,
  onAnswer,
}: {
  node: BranchNode;
  onAnswer: (b: QuestionBranchRow) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const collapsible = node.children.length > 2;
  const shownChildren = collapsible && !open ? [] : node.children;
  return (
    <div>
      <BranchCard branch={node.branch} onAnswer={onAnswer} />
      {shownChildren.length > 0 && (
        <div className="ml-2 mt-3 space-y-3 border-l border-[#e4d9bd] pl-4">
          {shownChildren.map((c) => (
            <div key={c.branch.id} className="flex gap-2">
              <GitBranch className="mt-3 size-3 shrink-0 text-[#a2947c]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <BranchNodeView node={c} onAnswer={onAnswer} />
              </div>
            </div>
          ))}
        </div>
      )}
      {collapsible && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="gath-branch-expand"
          className="focus-glow mt-2 ml-1 inline-flex items-center gap-1.5 rounded-full border border-[#e4d9bd] bg-white/70 px-3 py-1 text-[11px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          <ChevronDown className="size-3" aria-hidden="true" />
          {node.children.length} {t("answers")}
        </button>
      )}
      {collapsible && open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          data-testid="gath-branch-fold"
          className="focus-glow mt-2 ml-1 inline-flex items-center gap-1.5 rounded-full border border-[#e4d9bd] bg-white/70 px-3 py-1 text-[11px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          <ChevronUp className="size-3" aria-hidden="true" />
          {t("Fold the answers")}
        </button>
      )}
    </div>
  );
}

/* =============== ONE QUESTION'S ROOM =============== */

function QuestionRoom({
  id,
  active,
  onBack,
}: {
  id: string;
  active: boolean;
  onBack: () => void;
}) {
  const t = useT();
  const [q, setQ] = useState<QuestionDetailFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mirror, setMirror] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [eContext, setEContext] = useState("");
  const [eDisciplines, setEDisciplines] = useState("");
  const [treeView, setTreeView] = useState(true);
  const [reply, setReply] = useState<{ parentId: string; label: string } | null>(null);
  const [bKind, setBKind] = useState<BranchKind>("discussion");
  const [bEvidence, setBEvidence] = useState<EvidenceLevel>("hypothesis");
  const [bBody, setBBody] = useState("");
  const [bBusy, setBBusy] = useState(false);
  const [bErr, setBErr] = useState<string | null>(null);
  const { note, flash } = useFlashNote();

  const load = useCallback(async () => {
    try {
      const data = await netFetch<{ question: QuestionDetailFull }>(
        `/api/network/questions/${id}`
      );
      setQ(data.question);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("The question could not be read."));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* the tree breathes quietly while the room stands open */
  useInterval(
    () => {
      if (document.visibilityState === "visible") void load();
    },
    active ? 9000 : null
  );

  const act = useCallback(
    async (action: string) => {
      setBusy(action);
      setErr(null);
      try {
        await netFetch<unknown>(`/api/network/questions/${id}`, {
          method: "POST",
          body: { action },
        });
        await load();
        flash(action === "settle" ? t("The question rests, settled.") : t("The question opens again."));
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("The hand could not land."));
      } finally {
        setBusy(null);
      }
    },
    [id, load, flash, t]
  );

  const reflect = useCallback(async () => {
    setBusy("mirror");
    setErr(null);
    try {
      const data = await netFetch<{ summary: string }>(`/api/network/questions/${id}`, {
        method: "POST",
        body: { action: "mirror" },
      });
      setMirror(data.summary);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("M.E. could not reflect just now."));
    } finally {
      setBusy(null);
    }
  }, [id, t]);

  const saveFraming = useCallback(async () => {
    setBusy("context");
    setErr(null);
    try {
      await netFetch<unknown>(`/api/network/questions/${id}`, {
        method: "POST",
        body: { action: "context", context: eContext.trim(), disciplines: eDisciplines.trim() },
      });
      setEditing(false);
      await load();
      flash(t("The framing is renewed."));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("The framing could not be changed."));
    } finally {
      setBusy(null);
    }
  }, [id, eContext, eDisciplines, load, flash, t]);

  const growBranch = useCallback(async () => {
    if (bBody.trim().length < 2 || bBusy) return;
    setBBusy(true);
    setBErr(null);
    try {
      await netFetch<{ branch: QuestionBranchRow }>(`/api/network/questions/${id}`, {
        method: "POST",
        body: {
          action: "branch",
          ...(reply ? { parentId: reply.parentId } : {}),
          kind: bKind,
          body: bBody.trim(),
          evidence: bEvidence,
        },
      });
      setBBody("");
      setReply(null);
      await load();
      flash(t("The branch now grows on the tree."));
    } catch (e) {
      setBErr(e instanceof Error ? e.message : t("The branch could not be planted."));
    } finally {
      setBBusy(false);
    }
  }, [bBody, bBusy, id, reply, bKind, bEvidence, load, flash, t]);

  const tree = useMemo(() => (q ? buildTree(q.branches) : []), [q]);
  const open = q ? q.status !== "settled" : true;

  if (err && !q) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13.5px] text-[#b45309]">{err}</p>
        <button type="button" onClick={onBack} className={cn(GP_GHOST, "mt-4")}>
          {t("Return to the questions")}
        </button>
      </div>
    );
  }
  if (!q) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("The question arrives…")}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Return to the questions")}
          data-testid="gath-question-back"
          className={cn(GP_ICON_BTN, "size-9")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <RoomLabel>{t("the gathering · living questions")}</RoomLabel>
      </div>

      {/* ---------- the framing ---------- */}
      <div className={cn(GP_CARD, "mt-3 p-5 sm:p-6")}>
        <div className="flex items-center gap-2.5">
          <MakerMark name={q.owner.name} size={30} />
          <span className="text-[12px] text-[#7c715f]">
            <span className="font-semibold text-[#5c5344]">{q.owner.name}</span>{" "}
            {t("keeps this question")}
          </span>
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-literata)] text-[19px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
          {q.title}
        </h2>
        <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.8] text-[#5c5344] [overflow-wrap:anywhere]">
          {q.body}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
              open ? "border-[#5f7a52]/40 text-[#5f7a52]" : "border-[#e4d9bd] text-[#7c715f]"
            )}
          >
            {open ? t("Open") : t("Settled")}
          </span>
          {q.disciplines.map((d) => (
            <span key={d} className={TINY_CHIP}>
              {d}
            </span>
          ))}
        </div>
        {q.context && (
          <p className="mt-3 border-t border-[#e4d9bd]/70 pt-3 font-[family-name:var(--font-literata)] text-[12.5px] italic leading-[1.8] text-[#7c715f] [overflow-wrap:anywhere]">
            {q.context}
          </p>
        )}
        <p className="mt-3 text-[11px] text-[#a2947c]">
          {q.branchCount} {t("branches")} · {q.contributorCount} {t("voices")} · {t("updated")}{" "}
          {relativeTime(q.updatedAt, t)}
        </p>

        {/* the hands */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void reflect()}
            disabled={busy === "mirror"}
            className={GP_GHOST}
            data-testid="gath-question-mirror"
          >
            {busy === "mirror" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-3.5" aria-hidden="true" />
            )}
            {t("Reflect with M.E.")}
          </button>
          {q.mine && (
            <button
              type="button"
              onClick={() => void act(open ? "settle" : "reopen")}
              disabled={busy !== null}
              className={GP_GHOST}
              data-testid={open ? "gath-question-settle" : "gath-question-reopen"}
            >
              {busy !== null && busy !== "mirror" && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              {open ? t("Settle") : t("Reopen")}
            </button>
          )}
          {q.mine && (
            <button
              type="button"
              onClick={() => {
                setEContext(q.context ?? "");
                setEDisciplines(q.disciplines.join(", "));
                setEditing((v) => !v);
              }}
              aria-pressed={editing}
              className={GP_GHOST}
              data-testid="gath-question-edit"
            >
              <PenLine className="size-3.5" aria-hidden="true" />
              {t("Edit framing")}
            </button>
          )}
        </div>

        {/* the owner's inline framing editor */}
        {editing && q.mine && (
          <div className="mt-3 rounded-[16px] border border-[#e4d9bd] bg-white/55 p-3.5">
            <textarea
              value={eContext}
              onChange={(e) => setEContext(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={t("The ground it stands on (optional)…")}
              aria-label={t("The ground it stands on (optional)…")}
              data-testid="gath-question-edit-context"
              className={cn(GP_INPUT, "gp-scroll resize-none")}
            />
            <input
              value={eDisciplines}
              onChange={(e) => setEDisciplines(e.target.value)}
              maxLength={200}
              placeholder={t("Disciplines, comma separated (optional)…")}
              aria-label={t("Disciplines, comma separated (optional)…")}
              data-testid="gath-question-edit-disciplines"
              className={cn(GP_INPUT, "mt-2.5")}
            />
            <div className="mt-2.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className={GP_GHOST}
                data-testid="gath-question-edit-cancel"
              >
                {t("Set it aside")}
              </button>
              <button
                type="button"
                onClick={() => void saveFraming()}
                disabled={busy === "context"}
                className={GP_HAND}
                data-testid="gath-question-edit-save"
              >
                {busy === "context" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("Save the framing")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* M.E.'s reflection — interpretation, never fact */}
      {mirror && (
        <div className={cn(GP_CARD, "mt-4 p-5")}>
          <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#7c5cad]">
            {t("M.E. reflects — interpretation, never fact")}
          </p>
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.85] text-[#5c5344] [overflow-wrap:anywhere]">
            {mirror}
          </p>
          <p className="mt-2 text-[10.5px] text-[#a2947c]">{t("(M.E. suggests; it does not verify.)")}</p>
        </div>
      )}

      <AnimatePresence>
        {note && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 font-[family-name:var(--font-literata)] text-[12.5px] italic text-[#8a6f46]"
          >
            {note}
          </motion.p>
        )}
      </AnimatePresence>
      {err && <p className="mt-3 text-[12.5px] text-[#b45309]">{err}</p>}

      {/* ---------- the tree ---------- */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RoomLabel>{t("the tree")}</RoomLabel>
          <div className="inline-flex items-center rounded-full border border-[#e4d9bd] bg-white/70 p-0.5">
            <button
              type="button"
              onClick={() => setTreeView(true)}
              aria-pressed={treeView}
              data-testid="gath-question-view-tree"
              className={cn(
                "focus-glow rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-300",
                treeView ? "bg-[#faf5e6] text-[#8a6f46]" : "text-[#a2947c] hover:text-[#7c715f]"
              )}
            >
              {t("Tree")}
            </button>
            <button
              type="button"
              onClick={() => setTreeView(false)}
              aria-pressed={!treeView}
              data-testid="gath-question-view-list"
              className={cn(
                "focus-glow rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-300",
                !treeView ? "bg-[#faf5e6] text-[#8a6f46]" : "text-[#a2947c] hover:text-[#7c715f]"
              )}
            >
              {t("List")}
            </button>
          </div>
        </div>

        {/* the legend of the six kinds */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BRANCH_KINDS.map((k) => (
            <KindChip key={k} kind={k} />
          ))}
        </div>

        <div className="mt-3">
          {tree.length === 0 ? (
            <p className="py-6 text-center font-[family-name:var(--font-literata)] text-[13px] italic text-[#8a7c64]">
              {t("No branches yet — the first reflection roots the tree.")}
            </p>
          ) : treeView ? (
            <div className="space-y-3">
              {tree.map((n) => (
                <BranchNodeView
                  key={n.branch.id}
                  node={n}
                  onAnswer={(b) => setReply({ parentId: b.id, label: b.author.name })}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {q.branches.map((b) => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  onAnswer={(bb) => setReply({ parentId: bb.id, label: bb.author.name })}
                />
              ))}
            </div>
          )}
        </div>

        {/* grow a branch — anchored at the foot of the tree */}
        <div className={cn(GP_CARD, "mt-4 p-4 sm:p-5")}>
          <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
            {t("Grow a branch")}
          </p>
          {reply && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#cbb98d] bg-[#faf5e6] px-2.5 py-1 text-[11px] font-semibold text-[#8a6f46]">
              {t("answering")} {reply.label}
              <button
                type="button"
                onClick={() => setReply(null)}
                aria-label={t("Answer the question itself")}
                data-testid="gath-branch-reply-clear"
                className="focus-glow rounded-full"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          )}
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={bKind}
              onChange={(e) => setBKind(isBranchKind(e.target.value) ? e.target.value : "discussion")}
              aria-label={t("The branch's kind")}
              data-testid="gath-branch-kind"
              className={GP_INPUT}
            >
              {BRANCH_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(KIND_LABEL[k])}
                </option>
              ))}
            </select>
            <select
              value={bEvidence}
              onChange={(e) => {
                const v = EVIDENCE_LEVELS.find((l) => l === e.target.value);
                if (v) setBEvidence(v);
              }}
              aria-label={t("The evidence it carries")}
              data-testid="gath-branch-evidence"
              className={GP_INPUT}
            >
              {EVIDENCE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {t(EVIDENCE_LABEL[l])}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={bBody}
            onChange={(e) => setBBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t("Lay your branch on the tree…")}
            aria-label={t("Lay your branch on the tree…")}
            data-testid="gath-branch-body"
            className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
          />
          {bErr && <p className="mt-2 text-[12px] text-[#b45309]">{bErr}</p>}
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => void growBranch()}
              disabled={bBody.trim().length < 2 || bBusy}
              className={GP_HAND}
              data-testid="gath-branch-submit"
            >
              {bBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              <GitBranch className="size-4" aria-hidden="true" />
              {t("Grow this branch")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
