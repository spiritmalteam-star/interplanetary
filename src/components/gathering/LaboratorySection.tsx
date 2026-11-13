"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  FlaskConical,
  Loader2,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type LabDetail,
  FOCUS_LABELS,
  FocusChip,
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  GP_ICON_BTN,
  GP_INPUT,
  EmptyRoom,
  MakerMark,
  netFetch,
  relativeTime,
  RoomLabel,
  useFlashNote,
  useInterval,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE LABORATORY — hypotheses are tested together. A bench keeps     */
/*  its dossier (question, hypothesis, method, materials, safety),     */
/*  a shared record of observations, results and limitations, and      */
/*  reviews that are voices, never votes. No vote ever becomes proof.  */
/* ------------------------------------------------------------------ */

interface LabSummary {
  id: string;
  title: string;
  question: string;
  status: string;
  focus: string;
  memberCount: number;
  entryCount: number;
  reviewCount: number;
  createdAt: string;
  owner: { name: string; anon: boolean };
}

const LAB_STATUSES = ["open", "active", "concluded"] as const;

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  active: "Active",
  concluded: "Concluded",
};

const STATUS_STYLE: Record<string, string> = {
  open: "border-[#a16207]/40 text-[#a16207]",
  active: "border-[#0d9488]/40 text-[#0d9488]",
  concluded: "border-[#5f7a52]/40 text-[#5f7a52]",
};

const ENTRY_KINDS = ["observation", "result", "analysis", "limitation", "replication"] as const;
type EntryKind = (typeof ENTRY_KINDS)[number];

const ENTRY_LABEL: Record<EntryKind, string> = {
  observation: "Observation",
  result: "Result",
  analysis: "Analysis",
  limitation: "Limitation",
  replication: "Replication",
};

const ENTRY_STYLE: Record<EntryKind, string> = {
  observation: "text-[#0d9488]",
  result: "text-[#5f7a52]",
  analysis: "text-[#7c5cad]",
  limitation: "text-[#7c715f]",
  replication: "text-[#a16207]",
};

function isEntryKind(v: string): v is EntryKind {
  return (ENTRY_KINDS as readonly string[]).includes(v);
}

const VERDICTS = ["feedback", "concerns", "improvements"] as const;
type Verdict = (typeof VERDICTS)[number];

const VERDICT_LABEL: Record<Verdict, string> = {
  feedback: "Feedback",
  concerns: "Concerns",
  improvements: "Improvements",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  feedback: "text-[#0d9488]",
  concerns: "text-[#b45309]",
  improvements: "text-[#5f7a52]",
};

function isVerdict(v: string): v is Verdict {
  return (VERDICTS as readonly string[]).includes(v);
}

const FOCUS_ORDER = Object.keys(FOCUS_LABELS);

/* the record's honest attachment cap */
const MAX_UPLOAD = 8 * 1024 * 1024;

function mediaIsVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(?:$|\?)/i.test(url);
}

async function uploadAttachment(file: File, t: (k: string) => string): Promise<string> {
  if (file.size > MAX_UPLOAD) {
    throw new Error(t("The attachment is too heavy — 8 MB is the most the record carries."));
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/gathering/upload", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data || !data.url) {
    throw new Error((data && data.error) || t("The shelf could not receive the file."));
  }
  return data.url;
}

const TINY_CHIP =
  "inline-flex shrink-0 items-center rounded-full border border-[#e8dfc9] bg-white/55 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#a2947c]";

function StatusPill({ status }: { status: string }) {
  const t = useT();
  const known = (LAB_STATUSES as readonly string[]).includes(status);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
        known ? STATUS_STYLE[status] : "border-[#e4d9bd] text-[#7c715f]"
      )}
    >
      {known ? t(STATUS_LABEL[status]) : status}
    </span>
  );
}

/* ================================================================== */
/*  THE SECTION — list and detail under one AnimatePresence breath     */
/* ================================================================== */

export default function LaboratorySection({ active }: { active: boolean }) {
  const t = useT();
  const [labs, setLabs] = useState<LabSummary[] | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { note, flash } = useFlashNote();

  /* the new bench's sheet */
  const [nTitle, setNTitle] = useState("");
  const [nQuestion, setNQuestion] = useState("");
  const [nHypothesis, setNHypothesis] = useState("");
  const [nBackground, setNBackground] = useState("");
  const [nMethod, setNMethod] = useState("");
  const [nMaterials, setNMaterials] = useState("");
  const [nSafety, setNSafety] = useState("");
  const [nFocus, setNFocus] = useState<string | null>("science");
  const [nBusy, setNBusy] = useState(false);
  const [nErr, setNErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      params.set("take", "48");
      const data = await netFetch<{ labs: LabSummary[] }>(
        `/api/network/laboratory?${params.toString()}`
      );
      setLabs(data.labs);
      setListErr(null);
    } catch (err) {
      setListErr(err instanceof Error ? err.message : t("The benches could not be read."));
    }
  }, [status, appliedQ, t]);

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

  const openBench = useCallback(async () => {
    if (nTitle.trim().length < 2 || nQuestion.trim().length < 2 || nHypothesis.trim().length < 2 || nBusy) return;
    setNBusy(true);
    setNErr(null);
    try {
      const data = await netFetch<{ lab: { id: string } }>("/api/network/laboratory", {
        method: "POST",
        body: {
          title: nTitle.trim(),
          question: nQuestion.trim(),
          hypothesis: nHypothesis.trim(),
          ...(nBackground.trim() ? { background: nBackground.trim() } : {}),
          ...(nMethod.trim() ? { methodology: nMethod.trim() } : {}),
          ...(nMaterials.trim() ? { materials: nMaterials.trim() } : {}),
          ...(nSafety.trim() ? { safety: nSafety.trim() } : {}),
          ...(nFocus ? { focus: nFocus } : {}),
        },
      });
      setCreating(false);
      setNTitle("");
      setNQuestion("");
      setNHypothesis("");
      setNBackground("");
      setNMethod("");
      setNMaterials("");
      setNSafety("");
      await load();
      setOpenId(data.lab.id);
      flash(t("The bench stands. The experiment may begin."));
    } catch (err) {
      setNErr(err instanceof Error ? err.message : t("The bench could not be raised."));
    } finally {
      setNBusy(false);
    }
  }, [nTitle, nQuestion, nHypothesis, nBackground, nMethod, nMaterials, nSafety, nFocus, nBusy, load, flash, t]);

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
          <motion.div key={`lab-${openId}`} {...roomMotion} className="mx-auto max-w-[860px]">
            <LabRoom
              id={openId}
              active={active}
              onBack={() => {
                setOpenId(null);
                void load();
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="lab-list" {...roomMotion} className="mx-auto max-w-[860px]">
            <RoomLabel>{t("the gathering · the laboratory")}</RoomLabel>
            <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold tracking-wide text-[#3d3428]">
              {t("The Laboratory")}
            </h2>
            <p className="mt-1.5 font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#7c715f]">
              {t(
                "Hypotheses are tested together — evidence is read, methods are challenged, and no vote ever becomes proof."
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
                  placeholder={t("Search the benches…")}
                  aria-label={t("Search the benches…")}
                  data-testid="gath-lab-search"
                  className={cn(GP_INPUT, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setAppliedQ(draftQ.trim())}
                  aria-label={t("Search the benches…")}
                  data-testid="gath-lab-search-go"
                  className={cn(GP_ICON_BTN, "absolute right-1.5 top-1/2 size-9 -translate-y-1/2")}
                >
                  <Search className="size-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={GP_HAND}
                data-testid="gath-lab-new"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("Open a bench")}
              </button>
            </div>

            {/* the status filter */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatus(null)}
                aria-pressed={status === null}
                data-testid="gath-lab-filter-all"
                className={cn(
                  "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                  status === null
                    ? "border-[#cbb98d] bg-white text-[#5c5344]"
                    : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                )}
              >
                {t("All benches")}
              </button>
              {LAB_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(status === s ? null : s)}
                  aria-pressed={status === s}
                  data-testid={`gath-lab-filter-${s}`}
                  className={cn(
                    "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                    status === s
                      ? "border-[#cbb98d] bg-white text-[#5c5344]"
                      : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                  )}
                >
                  {t(STATUS_LABEL[s])}
                </button>
              ))}
            </div>

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

            {labs === null && !listErr && (
              <p className="flex items-center justify-center gap-2 py-20 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The benches arrive…")}
              </p>
            )}
            {labs !== null && labs.length === 0 && !listErr && (
              <EmptyRoom
                icon={FlaskConical}
                line={t("No benches stand yet — a hypothesis is waiting for its experiment.")}
              />
            )}
            {labs !== null && labs.length > 0 && (
              <div className="mt-4 space-y-3">
                {labs.map((l) => (
                  <LabCard key={l.id} lab={l} onOpen={() => setOpenId(l.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- the new bench's sheet ---------- */}
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
            aria-label={t("Open a bench")}
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
              className="gp-glass relative mx-auto max-h-[90%] w-full max-w-lg overflow-y-auto rounded-[22px] bg-[#fffdf8] p-6 shadow-[0_24px_60px_-24px_rgba(46,38,24,0.45)]"
              data-testid="gath-lab-sheet"
            >
              <div className="flex items-center justify-between">
                <RoomLabel>{t("Open a bench")}</RoomLabel>
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
                placeholder={t("Give the bench its name…")}
                aria-label={t("Give the bench its name…")}
                data-testid="gath-lab-title"
                className={cn(GP_INPUT, "mt-3")}
              />
              <textarea
                value={nQuestion}
                onChange={(e) => setNQuestion(e.target.value)}
                rows={3}
                maxLength={1200}
                placeholder={t("The research question it serves…")}
                aria-label={t("The research question it serves…")}
                data-testid="gath-lab-question"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <textarea
                value={nHypothesis}
                onChange={(e) => setNHypothesis(e.target.value)}
                rows={3}
                maxLength={1200}
                placeholder={t("The hypothesis it will test…")}
                aria-label={t("The hypothesis it will test…")}
                data-testid="gath-lab-hypothesis"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <textarea
                value={nBackground}
                onChange={(e) => setNBackground(e.target.value)}
                rows={2}
                maxLength={1200}
                placeholder={t("Background and sources (optional)…")}
                aria-label={t("Background and sources (optional)…")}
                data-testid="gath-lab-background"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <textarea
                value={nMethod}
                onChange={(e) => setNMethod(e.target.value)}
                rows={2}
                maxLength={1500}
                placeholder={t("The methodology, step by step (optional)…")}
                aria-label={t("The methodology, step by step (optional)…")}
                data-testid="gath-lab-methodology"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <input
                value={nMaterials}
                onChange={(e) => setNMaterials(e.target.value)}
                maxLength={300}
                placeholder={t("Materials and equipment (optional)…")}
                aria-label={t("Materials and equipment (optional)…")}
                data-testid="gath-lab-materials"
                className={cn(GP_INPUT, "mt-2.5")}
              />
              <textarea
                value={nSafety}
                onChange={(e) => setNSafety(e.target.value)}
                rows={2}
                maxLength={800}
                placeholder={t("Safety considerations (optional)…")}
                aria-label={t("Safety considerations (optional)…")}
                data-testid="gath-lab-safety"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <p className="mono-label mt-3 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                {t("The focus")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FOCUS_ORDER.map((f) => (
                  <FocusChip
                    key={f}
                    focus={f}
                    on={nFocus === f}
                    onChoose={(chosen) => setNFocus(chosen)}
                  />
                ))}
              </div>
              {nErr && <p className="mt-2.5 text-[12px] text-[#b45309]">{nErr}</p>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className={GP_GHOST}
                  data-testid="gath-lab-cancel"
                >
                  {t("Set it aside")}
                </button>
                <button
                  type="button"
                  onClick={() => void openBench()}
                  disabled={
                    nTitle.trim().length < 2 ||
                    nQuestion.trim().length < 2 ||
                    nHypothesis.trim().length < 2 ||
                    nBusy
                  }
                  className={GP_HAND}
                  data-testid="gath-lab-submit"
                >
                  {nBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Raise the bench")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== ONE BENCH'S CARD =============== */

function LabCard({ lab, onOpen }: { lab: LabSummary; onOpen: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="gath-lab-card"
      className={cn(GP_CARD, "focus-glow block w-full p-5 text-left transition-all duration-300 hover:border-[#d3c39c]")}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
          {lab.title}
        </h3>
        <StatusPill status={lab.status} />
      </div>
      <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#7c715f] [overflow-wrap:anywhere]">
        {lab.question}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className={TINY_CHIP}>{t(FOCUS_LABELS[lab.focus] ?? lab.focus)}</span>
      </div>
      <p className="mt-2.5 text-[11px] text-[#a2947c]">
        {lab.memberCount} {t("members")} · {lab.entryCount} {t("entries")} · {lab.reviewCount}{" "}
        {t("reviews")} · {t("began")} {relativeTime(lab.createdAt, t)}
      </p>
      <div className="mt-3 flex items-center gap-2 border-t border-[#e4d9bd]/70 pt-3">
        <MakerMark name={lab.owner.name} size={24} />
        <span className="text-[11.5px] text-[#7c715f]">
          <span className="font-semibold text-[#5c5344]">{lab.owner.name}</span> {t("keeps this bench")}
        </span>
      </div>
    </button>
  );
}

/* =============== ONE BENCH'S ROOM =============== */

function LabRoom({
  id,
  active,
  onBack,
}: {
  id: string;
  active: boolean;
  onBack: () => void;
}) {
  const t = useT();
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const { note, flash } = useFlashNote();

  const load = useCallback(async () => {
    try {
      const data = await netFetch<{ lab: LabDetail }>(`/api/network/laboratory/${id}`);
      setLab(data.lab);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("The bench could not be read."));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* the record breathes quietly while the room stands open */
  useInterval(
    () => {
      if (document.visibilityState === "visible") void load();
    },
    active ? 10000 : null
  );

  const act = useCallback(
    async (key: string, body: Record<string, unknown>, done?: string) => {
      setBusy(key);
      setErr(null);
      try {
        await netFetch<unknown>(`/api/network/laboratory/${id}`, { method: "POST", body });
        await load();
        if (done) flash(done);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("The hand could not land."));
      } finally {
        setBusy(null);
      }
    },
    [id, load, flash, t]
  );

  if (err && !lab) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13.5px] text-[#b45309]">{err}</p>
        <button type="button" onClick={onBack} className={cn(GP_GHOST, "mt-4")}>
          {t("Return to the laboratory")}
        </button>
      </div>
    );
  }
  if (!lab) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("The bench arrives…")}
      </p>
    );
  }

  const isMember = lab.mine || lab.membership !== null;
  const joined = lab.membership !== null;

  const dossier: Array<{ label: string; body: string; warn?: boolean }> = [
    { label: t("Research question"), body: lab.question },
    { label: t("Hypothesis"), body: lab.hypothesis },
    ...(lab.background ? [{ label: t("Background & sources"), body: lab.background }] : []),
    ...(lab.methodology ? [{ label: t("Methodology"), body: lab.methodology }] : []),
    ...(lab.materials ? [{ label: t("Materials & equipment"), body: lab.materials }] : []),
    ...(lab.safety ? [{ label: t("Safety considerations"), body: lab.safety, warn: true }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Return to the laboratory")}
          data-testid="gath-lab-back"
          className={cn(GP_ICON_BTN, "size-9")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <RoomLabel>{t("the gathering · the laboratory")}</RoomLabel>
      </div>

      {/* ---------- the bench's head ---------- */}
      <div className={cn(GP_CARD, "mt-3 p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-literata)] text-[19px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
              {lab.title}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <MakerMark name={lab.owner.name} size={24} />
              <span className="text-[11.5px] text-[#7c715f]">
                <span className="font-semibold text-[#5c5344]">{lab.owner.name}</span>{" "}
                {t("keeps this bench")}
              </span>
            </div>
          </div>
          <StatusPill status={lab.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={TINY_CHIP}>{t(FOCUS_LABELS[lab.focus] ?? lab.focus)}</span>
          <span className={TINY_CHIP}>
            {lab.memberCount} {t("members")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!lab.mine && (
            <button
              type="button"
              onClick={() =>
                void act(
                  "membership",
                  { action: joined ? "leave" : "join" },
                  joined ? t("You stepped away from the bench.") : t("You stand at the bench now.")
                )
              }
              disabled={busy === "membership"}
              className={joined ? GP_GHOST : GP_HAND}
              data-testid="gath-lab-join"
            >
              {busy === "membership" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {joined ? t("Leave the bench") : t("Join this bench")}
            </button>
          )}
          {lab.mine && (
            <button
              type="button"
              onClick={() => setRefining(true)}
              className={GP_HAND}
              data-testid="gath-lab-refine"
            >
              {t("Refine the protocol")}
            </button>
          )}
        </div>
      </div>

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

      {/* ---------- the dossier ---------- */}
      <div className="mt-6">
        <RoomLabel>{t("the dossier")}</RoomLabel>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dossier.map((b) => (
            <div
              key={b.label}
              className={cn(GP_CARD, "p-4", b.warn && "border-[#b45309]/45")}
              data-testid={b.warn ? "gath-lab-safety" : undefined}
            >
              <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
                {b.label}
              </p>
              <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- the record ---------- */}
      <div className="mt-6">
        <RoomLabel>{t("the record")}</RoomLabel>
        {lab.entries.length === 0 ? (
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[13px] italic text-[#8a7c64]">
            {t("The record waits for its first observation.")}
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {lab.entries.map((entry) => (
              <div key={entry.id} className={cn(GP_CARD, "p-4")} data-testid="gath-lab-entry">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full border border-[#e4d9bd] bg-white/60 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
                      isEntryKind(entry.kind) ? ENTRY_STYLE[entry.kind] : "text-[#7c715f]"
                    )}
                  >
                    {t(isEntryKind(entry.kind) ? ENTRY_LABEL[entry.kind] : entry.kind)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
                  {entry.body}
                </p>
                {entry.dataUrl && mediaIsVideo(entry.dataUrl) ? (
                  <video
                    controls
                    src={entry.dataUrl}
                    className="mt-2.5 max-h-72 w-full rounded-[14px]"
                  />
                ) : entry.dataUrl ? (
                  <img
                    src={entry.dataUrl}
                    alt={t("Experiment attachment")}
                    className="mt-2.5 max-h-72 w-full rounded-[14px] object-cover"
                  />
                ) : null}
                <div className="mt-2.5 flex items-center gap-2 border-t border-[#e4d9bd]/70 pt-2.5">
                  <MakerMark name={entry.author.name} size={22} />
                  <span className="truncate text-[11px] text-[#a2947c]">
                    <span className="font-semibold text-[#5c5344]">{entry.author.name}</span> ·{" "}
                    {relativeTime(entry.createdAt, t)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {isMember && (
          <EntryComposer
            id={id}
            busy={busy === "entry"}
            onDone={async () => {
              await load();
              flash(t("The record keeps your line."));
            }}
          />
        )}
      </div>

      {/* ---------- the review ---------- */}
      <div className="mt-6">
        <RoomLabel>{t("the review")}</RoomLabel>
        <p className="mt-1.5 font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#7c715f]">
          {t("Reviews are voices, not votes — concerns and improvements keep the work honest.")}
        </p>
        {lab.reviews.length === 0 ? (
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[13px] italic text-[#8a7c64]">
            {t("No reviews yet — the first honest voice shapes the work.")}
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {lab.reviews.map((r) => (
              <div key={r.id} className={cn(GP_CARD, "p-4")} data-testid="gath-lab-review">
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border border-[#e4d9bd] bg-white/60 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
                    isVerdict(r.verdict) ? VERDICT_STYLE[r.verdict] : "text-[#7c715f]"
                  )}
                >
                  {t(isVerdict(r.verdict) ? VERDICT_LABEL[r.verdict] : r.verdict)}
                </span>
                <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
                  {r.body}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <MakerMark name={r.author.name} size={22} />
                  <span className="truncate text-[11px] text-[#a2947c]">
                    <span className="font-semibold text-[#5c5344]">{r.author.name}</span> ·{" "}
                    {relativeTime(r.createdAt, t)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {isMember && (
          <ReviewComposer
            id={id}
            busy={busy === "review"}
            onDone={async () => {
              await load();
              flash(t("The review joins the bench."));
            }}
          />
        )}
      </div>

      {/* ---------- the owner's refining sheet ---------- */}
      <AnimatePresence>
        {refining && (
          <RefineSheet
            lab={lab}
            busy={busy === "update"}
            onClose={() => setRefining(false)}
            onSave={async (body) => {
              await act("update", { action: "update", ...body }, t("The protocol is renewed."));
              setRefining(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== THE RECORD'S COMPOSER =============== */

function EntryComposer({
  id,
  busy,
  onDone,
}: {
  id: string;
  busy: boolean;
  onDone: () => Promise<void>;
}) {
  const t = useT();
  const [kind, setKind] = useState<EntryKind>("observation");
  const [body, setBody] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [dataName, setDataName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const attach = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setUploading(true);
      setUploadErr(null);
      try {
        const url = await uploadAttachment(file, t);
        setDataUrl(url);
        setDataName(file.name);
      } catch (e) {
        setUploadErr(e instanceof Error ? e.message : t("The shelf could not receive the file."));
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [t]
  );

  const send = useCallback(async () => {
    if (body.trim().length < 2 || busy || uploading) return;
    setSendErr(null);
    try {
      await netFetch<unknown>(`/api/network/laboratory/${id}`, {
        method: "POST",
        body: {
          action: "entry",
          kind,
          body: body.trim(),
          ...(dataUrl ? { dataUrl } : {}),
        },
      });
      setBody("");
      setDataUrl(null);
      setDataName(null);
      await onDone();
    } catch (e) {
      setSendErr(e instanceof Error ? e.message : t("The record could not receive the line."));
    }
  }, [body, busy, uploading, id, kind, dataUrl, onDone, t]);

  return (
    <div className={cn(GP_CARD, "mt-4 p-4 sm:p-5")} data-testid="gath-lab-entry-composer">
      <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
        {t("Add to the record")}
      </p>
      <select
        value={kind}
        onChange={(e) => setKind(isEntryKind(e.target.value) ? e.target.value : "observation")}
        aria-label={t("The entry's kind")}
        data-testid="gath-lab-entry-kind"
        className={cn(GP_INPUT, "mt-2.5")}
      >
        {ENTRY_KINDS.map((k) => (
          <option key={k} value={k}>
            {t(ENTRY_LABEL[k])}
          </option>
        ))}
      </select>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={t("What the bench saw, made or learned…")}
        aria-label={t("What the bench saw, made or learned…")}
        data-testid="gath-lab-entry-body"
        className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
      />
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => void attach(e.target.files?.[0] ?? null)}
          aria-hidden="true"
          tabIndex={-1}
          data-testid="gath-lab-entry-file"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={cn(GP_GHOST, "px-3 py-1.5 text-[11px]")}
          data-testid="gath-lab-entry-attach"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Paperclip className="size-3.5" aria-hidden="true" />
          )}
          {t("Attach an image or film")}
        </button>
        {dataUrl && dataName && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbb98d] bg-[#faf5e6] px-2.5 py-1 text-[11px] font-semibold text-[#8a6f46]">
            <span className="max-w-[160px] truncate">{dataName}</span>
            <button
              type="button"
              onClick={() => {
                setDataUrl(null);
                setDataName(null);
              }}
              aria-label={t("Set the attachment aside")}
              className="focus-glow rounded-full"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        )}
      </div>
      {uploadErr && <p className="mt-2 text-[12px] text-[#b45309]">{uploadErr}</p>}
      {sendErr && <p className="mt-2 text-[12px] text-[#b45309]">{sendErr}</p>}
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => void send()}
          disabled={body.trim().length < 2 || busy || uploading}
          className={GP_HAND}
          data-testid="gath-lab-entry-submit"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {t("Lay it in the record")}
        </button>
      </div>
    </div>
  );
}

/* =============== THE REVIEW'S COMPOSER =============== */

function ReviewComposer({
  id,
  busy,
  onDone,
}: {
  id: string;
  busy: boolean;
  onDone: () => Promise<void>;
}) {
  const t = useT();
  const [verdict, setVerdict] = useState<Verdict>("feedback");
  const [body, setBody] = useState("");
  const [sendErr, setSendErr] = useState<string | null>(null);

  const send = useCallback(async () => {
    if (body.trim().length < 2 || busy) return;
    setSendErr(null);
    try {
      await netFetch<unknown>(`/api/network/laboratory/${id}`, {
        method: "POST",
        body: { action: "review", verdict, body: body.trim() },
      });
      setBody("");
      await onDone();
    } catch (e) {
      setSendErr(e instanceof Error ? e.message : t("The review could not be offered."));
    }
  }, [body, busy, id, verdict, onDone, t]);

  return (
    <div className={cn(GP_CARD, "mt-4 p-4 sm:p-5")} data-testid="gath-lab-review-composer">
      <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
        {t("Offer a review")}
      </p>
      <select
        value={verdict}
        onChange={(e) => setVerdict(isVerdict(e.target.value) ? e.target.value : "feedback")}
        aria-label={t("The review's verdict")}
        data-testid="gath-lab-review-verdict"
        className={cn(GP_INPUT, "mt-2.5")}
      >
        {VERDICTS.map((v) => (
          <option key={v} value={v}>
            {t(VERDICT_LABEL[v])}
          </option>
        ))}
      </select>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={t("Read the work honestly — what holds, what wobbles…")}
        aria-label={t("Read the work honestly — what holds, what wobbles…")}
        data-testid="gath-lab-review-body"
        className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
      />
      {sendErr && <p className="mt-2 text-[12px] text-[#b45309]">{sendErr}</p>}
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => void send()}
          disabled={body.trim().length < 2 || busy}
          className={GP_HAND}
          data-testid="gath-lab-review-submit"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {t("Offer the review")}
        </button>
      </div>
    </div>
  );
}

/* =============== THE OWNER'S REFINING SHEET =============== */

function RefineSheet({
  lab,
  busy,
  onClose,
  onSave,
}: {
  lab: LabDetail;
  busy: boolean;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const t = useT();
  const [background, setBackground] = useState(lab.background ?? "");
  const [methodology, setMethodology] = useState(lab.methodology ?? "");
  const [materials, setMaterials] = useState(lab.materials ?? "");
  const [safety, setSafety] = useState(lab.safety ?? "");
  const [status, setStatus] = useState(
    (LAB_STATUSES as readonly string[]).includes(lab.status) ? lab.status : "open"
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-0 z-30 flex flex-col justify-end px-4 pb-6 sm:justify-center sm:px-6 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label={t("Refine the protocol")}
    >
      <button
        type="button"
        aria-label={t("Set it aside")}
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-[#3d3428]/25"
      />
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 18, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="gp-glass relative mx-auto max-h-[90%] w-full max-w-lg overflow-y-auto rounded-[22px] bg-[#fffdf8] p-6 shadow-[0_24px_60px_-24px_rgba(46,38,24,0.45)]"
        data-testid="gath-lab-refine-sheet"
      >
        <div className="flex items-center justify-between">
          <RoomLabel>{t("Refine the protocol")}</RoomLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Set it aside")}
            className={cn(GP_ICON_BTN, "size-9")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          rows={2}
          maxLength={1200}
          placeholder={t("Background and sources…")}
          aria-label={t("Background and sources…")}
          data-testid="gath-lab-refine-background"
          className={cn(GP_INPUT, "gp-scroll mt-3 resize-none")}
        />
        <textarea
          value={methodology}
          onChange={(e) => setMethodology(e.target.value)}
          rows={3}
          maxLength={1500}
          placeholder={t("The methodology, step by step…")}
          aria-label={t("The methodology, step by step…")}
          data-testid="gath-lab-refine-methodology"
          className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
        />
        <input
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          maxLength={300}
          placeholder={t("Materials and equipment…")}
          aria-label={t("Materials and equipment…")}
          data-testid="gath-lab-refine-materials"
          className={cn(GP_INPUT, "mt-2.5")}
        />
        <textarea
          value={safety}
          onChange={(e) => setSafety(e.target.value)}
          rows={2}
          maxLength={800}
          placeholder={t("Safety considerations…")}
          aria-label={t("Safety considerations…")}
          data-testid="gath-lab-refine-safety"
          className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
        />
        <p className="mono-label mt-3 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
          {t("The bench's state")}
        </p>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label={t("The bench's state")}
          data-testid="gath-lab-refine-status"
          className={cn(GP_INPUT, "mt-2")}
        >
          {LAB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_LABEL[s])}
            </option>
          ))}
        </select>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={GP_GHOST} data-testid="gath-lab-refine-cancel">
            {t("Set it aside")}
          </button>
          <button
            type="button"
            onClick={() =>
              void onSave({
                background: background.trim(),
                methodology: methodology.trim(),
                materials: materials.trim(),
                safety: safety.trim(),
                status,
              })
            }
            disabled={busy}
            className={GP_HAND}
            data-testid="gath-lab-refine-save"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {t("Save the protocol")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
