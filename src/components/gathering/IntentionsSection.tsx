"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Flame,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  REGION_IDS,
  REGION_LABELS,
  type IntentionDetail,
  type MeState,
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  GP_ICON_BTN,
  GP_INPUT,
  EmptyRoom,
  MakerMark,
  netFetch,
  regionLabel,
  relativeTime,
  RoomLabel,
  useFlashNote,
  useInterval,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  COLLECTIVE INTENTIONS — shared goals with real steps. Milestones   */
/*  are the promises, tasks are the hands that take them, and the      */
/*  stream keeps the momentum honest and visible. Progress is spoken,  */
/*  never silently assumed.                                            */
/* ------------------------------------------------------------------ */

interface IntentionSummary {
  id: string;
  title: string;
  purpose: string;
  region: string | null;
  status: string;
  memberCount: number;
  progress: number;
  milestoneCount: number;
  openTaskCount: number;
  createdAt: string;
  owner: { name: string; anon: boolean };
}

const INTENTION_STATUSES = ["open", "active", "completed"] as const;

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  active: "Active",
  completed: "Completed",
};

const STATUS_STYLE: Record<string, string> = {
  open: "border-[#a16207]/40 text-[#a16207]",
  active: "border-[#0d9488]/40 text-[#0d9488]",
  completed: "border-[#5f7a52]/40 text-[#5f7a52]",
};

const TINY_CHIP =
  "inline-flex shrink-0 items-center rounded-full border border-[#e8dfc9] bg-white/55 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#a2947c]";

function StatusPill({ status }: { status: string }) {
  const t = useT();
  const known = (INTENTION_STATUSES as readonly string[]).includes(status);
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

function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      data-testid="gath-intention-progress"
      className="h-1.5 w-full overflow-hidden rounded-full bg-[#e4d9bd]/60"
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#a16207_0%,#8a6f46_100%)] transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ================================================================== */
/*  THE SECTION — list and detail under one AnimatePresence breath     */
/* ================================================================== */

export default function IntentionsSection({ active }: { active: boolean }) {
  const t = useT();
  const [intentions, setIntentions] = useState<IntentionSummary[] | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [meName, setMeName] = useState<string | null>(null);
  const { note, flash } = useFlashNote();

  /* the founder's sheet */
  const [nTitle, setNTitle] = useState("");
  const [nPurpose, setNPurpose] = useState("");
  const [nRegion, setNRegion] = useState("");
  const [nSteps, setNSteps] = useState<string[]>([]);
  const [nDraft, setNDraft] = useState("");
  const [nBusy, setNBusy] = useState(false);
  const [nErr, setNErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (region) params.set("region", region);
      params.set("take", "48");
      const data = await netFetch<{ intentions: IntentionSummary[] }>(
        `/api/network/intentions?${params.toString()}`
      );
      setIntentions(data.intentions);
      setListErr(null);
    } catch (err) {
      setListErr(err instanceof Error ? err.message : t("The intentions could not be read."));
    }
  }, [status, region, t]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  /* who the visitor is — the steps' own-claimed truth needs the name */
  useEffect(() => {
    if (!active) return;
    void (async () => {
      try {
        const data = await netFetch<{ me: MeState }>("/api/network/me");
        setMeName(data.me.name);
      } catch {
        setMeName(null);
      }
    })();
  }, [active]);

  /* the list breathes while the room stands open */
  useInterval(
    () => {
      if (document.visibilityState === "visible") void load();
    },
    active && !openId ? 12000 : null
  );

  const begin = useCallback(async () => {
    if (nTitle.trim().length < 2 || nPurpose.trim().length < 2 || nBusy) return;
    setNBusy(true);
    setNErr(null);
    try {
      await netFetch<{ intention: { id: string } }>("/api/network/intentions", {
        method: "POST",
        body: {
          title: nTitle.trim(),
          purpose: nPurpose.trim(),
          ...(nRegion ? { region: nRegion } : {}),
          ...(nSteps.length > 0 ? { milestones: nSteps } : {}),
        },
      });
      setCreating(false);
      setNTitle("");
      setNPurpose("");
      setNRegion("");
      setNSteps([]);
      setNDraft("");
      await load();
      flash(t("The intention now gathers its people."));
    } catch (err) {
      setNErr(err instanceof Error ? err.message : t("The intention could not be planted."));
    } finally {
      setNBusy(false);
    }
  }, [nTitle, nPurpose, nRegion, nSteps, nBusy, load, flash, t]);

  const addStep = useCallback(() => {
    const title = nDraft.trim();
    if (title.length < 2 || nSteps.length >= 8) return;
    setNSteps((prev) => [...prev, title]);
    setNDraft("");
  }, [nDraft, nSteps.length]);

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
          <motion.div key={`intention-${openId}`} {...roomMotion} className="mx-auto max-w-[860px]">
            <IntentionRoom
              id={openId}
              active={active}
              meName={meName}
              onBack={() => {
                setOpenId(null);
                void load();
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="intentions-list" {...roomMotion} className="mx-auto max-w-[860px]">
            <RoomLabel>{t("the gathering · collective intentions")}</RoomLabel>
            <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold tracking-wide text-[#3d3428]">
              {t("Collective Intentions")}
            </h2>
            <p className="mt-1.5 font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#7c715f]">
              {t("Shared goals with real steps — milestones, tasks and honest, visible momentum.")}
            </p>

            {/* the filters and the founding hand */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus(null)}
                  aria-pressed={status === null}
                  data-testid="gath-intention-filter-all"
                  className={cn(
                    "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                    status === null
                      ? "border-[#cbb98d] bg-white text-[#5c5344]"
                      : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                  )}
                >
                  {t("All intentions")}
                </button>
                {INTENTION_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(status === s ? null : s)}
                    aria-pressed={status === s}
                    data-testid={`gath-intention-filter-${s}`}
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
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                aria-label={t("The region")}
                data-testid="gath-intention-region"
                className={cn(GP_INPUT, "w-auto min-w-[170px] py-2")}
              >
                <option value="">{t("Everywhere")}</option>
                {REGION_IDS.map((r) => (
                  <option key={r} value={r}>
                    {t(REGION_LABELS[r])}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={GP_HAND}
                data-testid="gath-intention-new"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("Begin an intention")}
              </button>
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

            {intentions === null && !listErr && (
              <p className="flex items-center justify-center gap-2 py-20 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The intentions arrive…")}
              </p>
            )}
            {intentions !== null && intentions.length === 0 && !listErr && (
              <EmptyRoom
                icon={Flame}
                line={t("No intentions gather yet — the first shared purpose starts with one step.")}
              />
            )}
            {intentions !== null && intentions.length > 0 && (
              <div className="mt-4 space-y-3">
                {intentions.map((i) => (
                  <IntentionCard key={i.id} intention={i} onOpen={() => setOpenId(i.id)} />
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
            aria-label={t("Begin an intention")}
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
              data-testid="gath-intention-sheet"
            >
              <div className="flex items-center justify-between">
                <RoomLabel>{t("Begin an intention")}</RoomLabel>
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
                placeholder={t("Give the intention its name…")}
                aria-label={t("Give the intention its name…")}
                data-testid="gath-intention-title"
                className={cn(GP_INPUT, "mt-3")}
              />
              <textarea
                value={nPurpose}
                onChange={(e) => setNPurpose(e.target.value)}
                rows={4}
                maxLength={1500}
                placeholder={t("The purpose it serves — what gathering here makes possible…")}
                aria-label={t("The purpose it serves — what gathering here makes possible…")}
                data-testid="gath-intention-purpose"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <p className="mono-label mt-3 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                {t("The region")}
              </p>
              <select
                value={nRegion}
                onChange={(e) => setNRegion(e.target.value)}
                aria-label={t("The region")}
                data-testid="gath-intention-sheet-region"
                className={cn(GP_INPUT, "mt-2")}
              >
                <option value="">{t("Everywhere")}</option>
                {REGION_IDS.map((r) => (
                  <option key={r} value={r}>
                    {t(REGION_LABELS[r])}
                  </option>
                ))}
              </select>
              <p className="mono-label mt-3 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                {t("The first milestones")}
              </p>
              {nSteps.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {nSteps.map((s, idx) => (
                    <div
                      key={`${s}-${idx}`}
                      className="flex items-center gap-2 rounded-full border border-[#e8dfc9] bg-white/60 py-1 pl-3 pr-1.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[12px] text-[#5c5344]">{s}</span>
                      <button
                        type="button"
                        onClick={() => setNSteps((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={t("Take the step back out")}
                        className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-[#a2947c] transition-colors duration-300 hover:text-[#b45309]"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={nDraft}
                  onChange={(e) => setNDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addStep();
                    }
                  }}
                  maxLength={160}
                  placeholder={t("A promised step…")}
                  aria-label={t("A promised step…")}
                  data-testid="gath-intention-milestone-draft"
                  className={GP_INPUT}
                />
                <button
                  type="button"
                  onClick={addStep}
                  disabled={nDraft.trim().length < 2 || nSteps.length >= 8}
                  className={cn(GP_GHOST, "shrink-0 px-3 py-2 text-[11.5px]")}
                  data-testid="gath-intention-milestone-add"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {t("Add a step")}
                </button>
              </div>
              {nErr && <p className="mt-2.5 text-[12px] text-[#b45309]">{nErr}</p>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className={GP_GHOST}
                  data-testid="gath-intention-cancel"
                >
                  {t("Set it aside")}
                </button>
                <button
                  type="button"
                  onClick={() => void begin()}
                  disabled={nTitle.trim().length < 2 || nPurpose.trim().length < 2 || nBusy}
                  className={GP_HAND}
                  data-testid="gath-intention-submit"
                >
                  {nBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Let it gather")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== ONE INTENTION'S CARD =============== */

function IntentionCard({
  intention: i,
  onOpen,
}: {
  intention: IntentionSummary;
  onOpen: () => void;
}) {
  const t = useT();
  const rLabel = regionLabel(i.region);
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="gath-intention-card"
      className={cn(GP_CARD, "focus-glow block w-full p-5 text-left transition-all duration-300 hover:border-[#d3c39c]")}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
          {i.title}
        </h3>
        <StatusPill status={i.status} />
      </div>
      <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#7c715f] [overflow-wrap:anywhere]">
        {i.purpose}
      </p>
      <div className="mt-3">
        <ProgressBar value={i.progress} label={t("Momentum")} />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {rLabel && <span className={TINY_CHIP}>{t(rLabel)}</span>}
      </div>
      <p className="mt-2.5 text-[11px] text-[#a2947c]">
        {i.memberCount} {t("members")} · {i.milestoneCount} {t("milestones")} · {i.openTaskCount}{" "}
        {t("open steps")} · {t("begun")} {relativeTime(i.createdAt, t)}
      </p>
      <div className="mt-3 flex items-center gap-2 border-t border-[#e4d9bd]/70 pt-3">
        <MakerMark name={i.owner.name} size={24} />
        <span className="text-[11.5px] text-[#7c715f]">
          <span className="font-semibold text-[#5c5344]">{i.owner.name}</span> {t("keeps this intention")}
        </span>
      </div>
    </button>
  );
}

/* =============== ONE INTENTION'S ROOM =============== */

function IntentionRoom({
  id,
  active,
  meName,
  onBack,
}: {
  id: string;
  active: boolean;
  meName: string | null;
  onBack: () => void;
}) {
  const t = useT();
  const [d, setD] = useState<IntentionDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [tTitle, setTTitle] = useState("");
  const [uBody, setUBody] = useState("");
  const [uProgress, setUProgress] = useState(50);
  const { note, flash } = useFlashNote();

  const load = useCallback(async () => {
    try {
      const data = await netFetch<{ intention: IntentionDetail }>(
        `/api/network/intentions/${id}`
      );
      setD(data.intention);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("The intention could not be read."));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* the intention breathes quietly while the room stands open */
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
        await netFetch<unknown>(`/api/network/intentions/${id}`, { method: "POST", body });
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

  const addMilestone = useCallback(async () => {
    if (mTitle.trim().length < 2 || busy) return;
    const title = mTitle.trim();
    setMTitle("");
    await act("milestone-add", { action: "milestone-add", title }, t("The milestone joins the path."));
  }, [mTitle, busy, act, t]);

  const addTask = useCallback(async () => {
    if (tTitle.trim().length < 2 || busy) return;
    const title = tTitle.trim();
    setTTitle("");
    await act("task-add", { action: "task-add", title }, t("The step waits for its hands."));
  }, [tTitle, busy, act, t]);

  const sendUpdate = useCallback(async () => {
    if (uBody.trim().length < 2 || busy) return;
    setBusy("update");
    setErr(null);
    try {
      await netFetch<unknown>(`/api/network/intentions/${id}`, {
        method: "POST",
        body: { action: "update", body: uBody.trim(), progress: Math.max(0, Math.min(100, Math.round(uProgress))) },
      });
      setUBody("");
      await load();
      flash(t("The stream carries the news."));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("The news could not be carried."));
    } finally {
      setBusy(null);
    }
  }, [uBody, uProgress, busy, id, load, flash, t]);

  if (err && !d) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13.5px] text-[#b45309]">{err}</p>
        <button type="button" onClick={onBack} className={cn(GP_GHOST, "mt-4")}>
          {t("Return to the intentions")}
        </button>
      </div>
    );
  }
  if (!d) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("The intention arrives…")}
      </p>
    );
  }

  const isMember = d.joined || d.mine;
  const rLabel = regionLabel(d.region);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Return to the intentions")}
          data-testid="gath-intention-back"
          className={cn(GP_ICON_BTN, "size-9")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <RoomLabel>{t("the gathering · collective intentions")}</RoomLabel>
      </div>

      {/* ---------- the intention's head ---------- */}
      <div className={cn(GP_CARD, "mt-3 p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-literata)] text-[19px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
              {d.title}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <MakerMark name={d.owner.name} size={24} />
              <span className="text-[11.5px] text-[#7c715f]">
                <span className="font-semibold text-[#5c5344]">{d.owner.name}</span>{" "}
                {t("keeps this intention")}
              </span>
            </div>
          </div>
          <StatusPill status={d.status} />
        </div>
        <p className="mt-2.5 whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.8] text-[#5c5344] [overflow-wrap:anywhere]">
          {d.purpose}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {rLabel && <span className={TINY_CHIP}>{t(rLabel)}</span>}
          <span className={TINY_CHIP}>
            {d.memberCount} {t("members")}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={d.progress} label={t("Momentum")} />
          <span className="shrink-0 text-[11.5px] font-semibold text-[#a16207]">{d.progress}%</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {d.mine ? (
            <select
              value={(INTENTION_STATUSES as readonly string[]).includes(d.status) ? d.status : "open"}
              onChange={(e) =>
                void act("status", { action: "status", status: e.target.value }, t("The intention wears its new state."))
              }
              aria-label={t("The intention's state")}
              data-testid="gath-intention-status"
              disabled={busy === "status"}
              className={cn(GP_INPUT, "w-auto py-1.5 text-[12px]")}
            >
              {INTENTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(STATUS_LABEL[s])}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() =>
                void act(
                  "membership",
                  { action: d.joined ? "leave" : "join" },
                  d.joined ? t("You stepped back quietly.") : t("You gather with them now.")
                )
              }
              disabled={busy === "membership"}
              className={d.joined ? GP_GHOST : GP_HAND}
              data-testid="gath-intention-join"
            >
              {busy === "membership" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {d.joined ? t("Leave the intention") : t("Join this intention")}
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

      {/* ---------- the milestones ---------- */}
      <div className="mt-6">
        <RoomLabel>{t("the milestones")}</RoomLabel>
        {d.milestones.length === 0 ? (
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[13px] italic text-[#8a7c64]">
            {t("No milestones yet — the first promise shapes the path.")}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {d.milestones.map((m) => {
              const rowBusy = busy === `milestone-${m.id}`;
              return (
                <div key={m.id} className={cn(GP_CARD, "flex items-start gap-2.5 p-3.5")} data-testid="gath-intention-milestone">
                  {d.mine ? (
                    <button
                      type="button"
                      onClick={() => void act(`milestone-${m.id}`, { action: "milestone-toggle", id: m.id })}
                      aria-pressed={m.done}
                      aria-label={m.done ? t("Mark the milestone undone") : t("Mark the milestone done")}
                      data-testid={`gath-intention-milestone-toggle-${m.id}`}
                      disabled={rowBusy}
                      className="focus-glow mt-0.5 shrink-0"
                    >
                      {rowBusy ? (
                        <Loader2 className="size-4 animate-spin text-[#a2947c]" aria-hidden="true" />
                      ) : m.done ? (
                        <CheckCircle2 className="size-4 text-[#5f7a52]" aria-hidden="true" />
                      ) : (
                        <Circle className="size-4 text-[#a2947c]" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <span className="mt-0.5 shrink-0" aria-hidden="true">
                      {m.done ? (
                        <CheckCircle2 className="size-4 text-[#5f7a52]" />
                      ) : (
                        <Circle className="size-4 text-[#a2947c]" />
                      )}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[13px] font-semibold [overflow-wrap:anywhere]",
                        m.done ? "text-[#a2947c] line-through decoration-[#a2947c]/50" : "text-[#3d3428]"
                      )}
                    >
                      {m.title}
                    </p>
                    {m.detail && (
                      <p className="mt-0.5 text-[11.5px] leading-[1.6] text-[#7c715f] [overflow-wrap:anywhere]">
                        {m.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {d.mine && (
          <div className="mt-2.5 flex items-center gap-2">
            <input
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addMilestone();
                }
              }}
              maxLength={160}
              placeholder={t("A promised step…")}
              aria-label={t("A promised step…")}
              data-testid="gath-intention-milestone-input"
              className={GP_INPUT}
            />
            <button
              type="button"
              onClick={() => void addMilestone()}
              disabled={mTitle.trim().length < 2 || busy === "milestone-add"}
              className={cn(GP_GHOST, "shrink-0 px-3 py-2 text-[11.5px]")}
              data-testid="gath-intention-milestone-add-btn"
            >
              {busy === "milestone-add" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-3.5" aria-hidden="true" />
              )}
              {t("Add a milestone")}
            </button>
          </div>
        )}
      </div>

      {/* ---------- the steps ---------- */}
      <div className="mt-6">
        <RoomLabel>{t("the steps")}</RoomLabel>
        {d.tasks.length === 0 ? (
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[13px] italic text-[#8a7c64]">
            {t("No steps yet — the smallest hand can begin.")}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {d.tasks.map((task) => {
              const ownClaim = task.claimedBy !== null && meName !== null && task.claimedBy === meName;
              const rowKey = `task-${task.id}`;
              return (
                <div key={task.id} className={cn(GP_CARD, "p-3.5")} data-testid="gath-intention-task">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[13px] font-semibold [overflow-wrap:anywhere]",
                          task.done ? "text-[#a2947c] line-through decoration-[#a2947c]/50" : "text-[#3d3428]"
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#a2947c]">
                        {task.done
                          ? t("done")
                          : task.claimedBy
                            ? `${t("taken by")} ${task.claimedBy}`
                            : t("waiting for hands")}
                      </p>
                    </div>
                    {task.done ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#5f7a52]" aria-hidden="true" />
                    ) : (
                      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        {!task.claimedBy && isMember && (
                          <button
                            type="button"
                            onClick={() =>
                              void act(rowKey, { action: "task-claim", id: task.id }, t("The step is yours now."))
                            }
                            disabled={busy === rowKey}
                            className={cn(GP_GHOST, "px-3 py-1.5 text-[11px]")}
                            data-testid={`gath-intention-task-claim-${task.id}`}
                          >
                            {busy === rowKey && (
                              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                            )}
                            {t("Take this step")}
                          </button>
                        )}
                        {task.claimedBy && (ownClaim || d.mine) && (
                          <button
                            type="button"
                            onClick={() =>
                              void act(rowKey, { action: "task-done", id: task.id }, t("The step is done."))
                            }
                            disabled={busy === rowKey}
                            className={cn(GP_GHOST, "px-3 py-1.5 text-[11px]")}
                            data-testid={`gath-intention-task-done-${task.id}`}
                          >
                            {busy === rowKey && (
                              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                            )}
                            {t("Mark done")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {(d.mine || isMember) && (
          <div className="mt-2.5 flex items-center gap-2">
            <input
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addTask();
                }
              }}
              maxLength={160}
              placeholder={t("A step someone's hands can take…")}
              aria-label={t("A step someone's hands can take…")}
              data-testid="gath-intention-task-input"
              className={GP_INPUT}
            />
            <button
              type="button"
              onClick={() => void addTask()}
              disabled={tTitle.trim().length < 2 || busy === "task-add"}
              className={cn(GP_GHOST, "shrink-0 px-3 py-2 text-[11.5px]")}
              data-testid="gath-intention-task-add-btn"
            >
              {busy === "task-add" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-3.5" aria-hidden="true" />
              )}
              {t("Add a step")}
            </button>
          </div>
        )}
      </div>

      {/* ---------- the stream ---------- */}
      <div className="mt-6">
        <RoomLabel>{t("the stream")}</RoomLabel>
        {d.updates.length === 0 ? (
          <p className="mt-2 font-[family-name:var(--font-literata)] text-[13px] italic text-[#8a7c64]">
            {t("The stream is quiet — the first word of momentum waits.")}
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {d.updates.map((u) => (
              <div key={u.id} className={cn(GP_CARD, "p-4")} data-testid="gath-intention-update">
                <p className="whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
                  {u.body}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#e4d9bd]/70 pt-2.5">
                  <span className="inline-flex shrink-0 items-center rounded-full border border-[#a16207]/40 bg-white/60 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#a16207]">
                    {t("momentum")} {u.progress}%
                  </span>
                  <MakerMark name={u.author.name} size={22} />
                  <span className="truncate text-[11px] text-[#a2947c]">
                    <span className="font-semibold text-[#5c5344]">{u.author.name}</span> ·{" "}
                    {relativeTime(u.createdAt, t)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {isMember && (
          <div className={cn(GP_CARD, "mt-4 p-4 sm:p-5")} data-testid="gath-intention-update-composer">
            <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
              {t("Speak the momentum")}
            </p>
            <textarea
              value={uBody}
              onChange={(e) => setUBody(e.target.value)}
              rows={3}
              maxLength={1500}
              placeholder={t("What moved, what changed, what was learned…")}
              aria-label={t("What moved, what changed, what was learned…")}
              data-testid="gath-intention-update-body"
              className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
            />
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={uProgress}
                onChange={(e) => setUProgress(Number(e.target.value))}
                aria-label={t("Momentum")}
                data-testid="gath-intention-update-progress"
                className="h-1.5 w-full cursor-pointer accent-[#a16207]"
              />
              <span className="shrink-0 text-[11.5px] font-semibold text-[#a16207]">{uProgress}%</span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={() => void sendUpdate()}
                disabled={uBody.trim().length < 2 || busy === "update"}
                className={GP_HAND}
                data-testid="gath-intention-update-submit"
              >
                {busy === "update" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("Carry the news")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
