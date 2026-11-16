"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarHeart,
  CalendarPlus,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type EventDetail,
  type EventRow,
  EmptyRoom,
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  GP_ICON_BTN,
  GP_INPUT,
  MakerMark,
  RoomLabel,
  netFetch,
  useFlashNote,
  useInterval,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  GATHER LIVE — scheduled conversations where the community meets    */
/*  in the moment. Words only: voice and video wait until moderation   */
/*  is ready. A list of three quiet groupings, a composer for the      */
/*  hour, and the room itself — messages while it stands, and the      */
/*  summary written with consent once it has ended.                    */
/* ------------------------------------------------------------------ */

const DURATIONS = [30, 45, 60, 90, 120];

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: string }) {
  const t = useT();
  if (status === "live") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#0d9488]/40 bg-white/55 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#0f766e]">
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-[#0d9488]" />
        {t("Live")}
      </span>
    );
  }
  if (status === "scheduled") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-[#a16207]/40 bg-white/55 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#a16207]">
        {t("Scheduled")}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#e4d9bd] bg-white/55 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#a2947c]">
      {t("Ended")}
    </span>
  );
}

export default function LiveSection({ active }: { active: boolean }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /* the summaries the rooms have confessed — read the hand only when
     one actually exists (null means read, and none was written) */
  const [summaries, setSummaries] = useState<Record<string, string | null>>({});

  /* the composer's own sheet */
  const [composing, setComposing] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cWhen, setCWhen] = useState("");
  const [cDuration, setCDuration] = useState(60);
  const [cBusy, setCBusy] = useState(false);
  const [cError, setCError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    try {
      const data = await netFetch<{ events: EventRow[] }>("/api/network/events");
      setEvents(data.events);
    } catch (err) {
      setListError(err instanceof Error ? err.message : t("The rooms could not be read."));
    }
  }, [t]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  /* the composer closes on one breath of Escape */
  useEffect(() => {
    if (!composing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setComposing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composing]);

  const noteSummary = useCallback((id: string, summary: string | null) => {
    setSummaries((prev) => (prev[id] === summary ? prev : { ...prev, [id]: summary }));
  }, []);

  const setRegistration = useCallback(
    async (ev: EventRow) => {
      setBusyId(ev.id);
      try {
        await netFetch(`/api/network/events/${ev.id}`, {
          method: "POST",
          body: { action: ev.joined ? "cancel" : "register" },
        });
        setEvents((prev) =>
          (prev ?? []).map((e) =>
            e.id === ev.id
              ? {
                  ...e,
                  joined: !ev.joined,
                  attendeeCount: Math.max(0, e.attendeeCount + (ev.joined ? -1 : 1)),
                }
              : e
          )
        );
        flash(ev.joined ? t("Your seat is released.") : t("Your seat is kept — the room waits for you."));
      } catch (err) {
        flash(err instanceof Error ? err.message : t("The room could not be reached."));
      } finally {
        setBusyId(null);
      }
    },
    [flash, t]
  );

  const openTheRoom = useCallback(
    async (ev: EventRow) => {
      setBusyId(ev.id);
      try {
        await netFetch(`/api/network/events/${ev.id}`, {
          method: "POST",
          body: { action: "open" },
        });
        setEvents((prev) => (prev ?? []).map((e) => (e.id === ev.id ? { ...e, status: "live" } : e)));
        setOpenId(ev.id);
      } catch (err) {
        flash(err instanceof Error ? err.message : t("The room could not be opened."));
      } finally {
        setBusyId(null);
      }
    },
    [flash, t]
  );

  const schedule = useCallback(async () => {
    if (!cTitle.trim() || !cWhen || cBusy) return;
    setCBusy(true);
    setCError(null);
    try {
      await netFetch<{ event: { id: string } }>("/api/network/events", {
        method: "POST",
        body: {
          title: cTitle.trim(),
          description: cDesc.trim() || undefined,
          scheduledFor: new Date(cWhen).toISOString(),
          durationMin: cDuration,
        },
      });
      setComposing(false);
      setCTitle("");
      setCDesc("");
      setCWhen("");
      setCDuration(60);
      flash(t("The hour is set — the room waits for its people."));
      await load();
    } catch (err) {
      setCError(err instanceof Error ? err.message : t("The hour could not be set."));
    } finally {
      setCBusy(false);
    }
  }, [cBusy, cDesc, cDuration, cTitle, cWhen, flash, load, t]);

  /* the composer's own floor — now, in the visitor's own clock */
  const minWhen = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const groups = useMemo(() => {
    const rows = events ?? [];
    const live = rows.filter((e) => e.status === "live");
    const scheduled = rows
      .filter((e) => e.status === "scheduled")
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    const ended = rows.filter((e) => e.status === "ended").slice(0, 5);
    const out: Array<{ label: string; rows: EventRow[] }> = [];
    if (live.length > 0) out.push({ label: t("Standing now"), rows: live });
    if (scheduled.length > 0) out.push({ label: t("Soon"), rows: scheduled });
    if (ended.length > 0) out.push({ label: t("The record"), rows: ended });
    return out;
  }, [events, t]);

  if (openId) {
    return (
      <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-24">
        <div className="mx-auto max-w-[860px] px-4 pt-4 sm:px-6 sm:pt-6">
          <EventRoom
            id={openId}
            active={active}
            onBack={() => setOpenId(null)}
            onSummary={noteSummary}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-24">
      <div className="mx-auto max-w-[860px] px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <RoomLabel>{t("the gathering · gather live")}</RoomLabel>
          <button
            type="button"
            onClick={() => setComposing(true)}
            className={GP_HAND}
            data-testid="gath-live-new"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            {t("Schedule a gathering")}
          </button>
        </div>

        <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold text-[#3d3428]">
          {t("Gather Live")}
        </h2>
        <p className="mt-2 max-w-[640px] font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#8a7c64]">
          {t(
            "Words in real time — scheduled conversations where the community meets in the moment. Voice and video wait until moderation is ready."
          )}
        </p>

        {note && (
          <p className="mt-3 text-[12px] italic text-[#8a6f46]" role="status">
            {note}
          </p>
        )}

        {events === null && !listError && (
          <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The rooms are being read…")}
          </p>
        )}

        {listError && (
          <div className="py-24 text-center">
            <p className="text-[13.5px] text-[#b45309]" role="alert">
              {listError}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className={cn(GP_GHOST, "mt-4")}
              data-testid="gath-live-retry"
            >
              {t("Try again")}
            </button>
          </div>
        )}

        {events !== null && events.length === 0 && !listError && (
          <EmptyRoom
            icon={CalendarHeart}
            line={t("Nothing is scheduled yet — the first hour belongs to whoever sets it.")}
          />
        )}

        {groups.map((group) => (
          <div key={group.label} className="mt-6">
            <RoomLabel>{group.label}</RoomLabel>
            <div className="mt-2.5 flex flex-col gap-3.5">
              {group.rows.map((ev) => {
                const known = summaries[ev.id];
                return (
                  <div key={ev.id} className={cn(GP_CARD, "p-5")} data-testid="gath-event-card">
                    <div className="flex items-start justify-between gap-3">
                      <StatusPill status={ev.status} />
                      <span className="shrink-0 text-[11px] text-[#a2947c]">
                        {ev.attendeeCount} {t("attendees")}
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                        {ev.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-[#a2947c]">
                        <MakerMark name={ev.host.name} size={20} />
                        <span className="font-semibold text-[#5c5344]">{ev.host.name}</span>
                        {t("hosts")}
                      </span>
                      <span className="text-[11px] text-[#a2947c]">
                        {formatWhen(ev.scheduledFor)} · {ev.durationMin} {t("min")}
                      </span>
                    </div>
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      {ev.status === "scheduled" && (
                        <button
                          type="button"
                          onClick={() => void setRegistration(ev)}
                          disabled={busyId === ev.id}
                          className={GP_GHOST}
                          data-testid="gath-event-register"
                        >
                          {busyId === ev.id && (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          )}
                          {ev.joined ? t("Cancel") : t("Register")}
                        </button>
                      )}
                      {ev.mine && ev.status === "scheduled" && (
                        <button
                          type="button"
                          onClick={() => void openTheRoom(ev)}
                          disabled={busyId === ev.id}
                          className={GP_HAND}
                          data-testid="gath-event-open"
                        >
                          {busyId === ev.id && (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          )}
                          {t("Open the room")}
                        </button>
                      )}
                      {ev.status === "live" && (ev.mine || ev.joined) && (
                        <button
                          type="button"
                          onClick={() => setOpenId(ev.id)}
                          className={GP_HAND}
                          data-testid="gath-event-enter"
                        >
                          {t("Enter the room")}
                        </button>
                      )}
                      {ev.status === "ended" && known !== null && (
                        <button
                          type="button"
                          onClick={() => setOpenId(ev.id)}
                          className={GP_GHOST}
                          data-testid="gath-event-summary"
                        >
                          {t("Read the summary")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ---------- the composer's sheet ---------- */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-30 flex flex-col justify-end sm:justify-center sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-label={t("Schedule a gathering")}
          >
            <button
              type="button"
              aria-label={t("Close")}
              onClick={() => setComposing(false)}
              className="absolute inset-0 cursor-default bg-[rgba(46,38,24,0.32)]"
              tabIndex={-1}
            />
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="gp-glass relative mx-auto w-full max-w-[520px] rounded-t-[28px] border border-white/80 p-5 sm:rounded-[28px] sm:p-6"
            >
              <div className="flex items-center justify-between">
                <RoomLabel>{t("Schedule a gathering")}</RoomLabel>
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  aria-label={t("Close")}
                  className={cn(GP_ICON_BTN, "size-8")}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <input
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                maxLength={80}
                placeholder={t("What shall this hour be called?")}
                aria-label={t("What shall this hour be called?")}
                data-testid="gath-live-title"
                className={cn(GP_INPUT, "mt-3")}
              />
              <textarea
                value={cDesc}
                onChange={(e) => setCDesc(e.target.value)}
                maxLength={600}
                rows={3}
                placeholder={t("A few words on what will gather here (optional)")}
                aria-label={t("A few words on what will gather here (optional)")}
                data-testid="gath-live-desc"
                className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
              />
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_130px]">
                <input
                  type="datetime-local"
                  value={cWhen}
                  min={minWhen}
                  onChange={(e) => setCWhen(e.target.value)}
                  aria-label={t("The hour")}
                  data-testid="gath-live-when"
                  className={GP_INPUT}
                />
                <select
                  value={cDuration}
                  onChange={(e) => setCDuration(Number(e.target.value))}
                  aria-label={t("How long the room stands")}
                  data-testid="gath-live-duration"
                  className={GP_INPUT}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} {t("min")}
                    </option>
                  ))}
                </select>
              </div>
              {cError && (
                <p className="mt-2.5 text-[11.5px] text-[#b45309]" role="alert">
                  {cError}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void schedule()}
                  disabled={cBusy || !cTitle.trim() || !cWhen}
                  className={GP_HAND}
                  data-testid="gath-live-submit"
                >
                  {cBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Set the hour")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== ONE ROOM =============== */
function EventRoom({
  id,
  active,
  onBack,
  onSummary,
}: {
  id: string;
  active: boolean;
  onBack: () => void;
  onSummary: (id: string, summary: string | null) => void;
}) {
  const t = useT();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [registerBusy, setRegisterBusy] = useState(false);
  const [endBusy, setEndBusy] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await netFetch<{ event: EventDetail }>(`/api/network/events/${id}`);
      setDetail(data.event);
      setError(null);
      onSummary(id, data.event.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The room could not be read."));
    }
  }, [id, onSummary, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /* the room's own breath — only while it stands, the section is
     awake, and the visitor's eye rests on the page */
  useInterval(
    () => {
      if (document.visibilityState !== "visible") return;
      void load();
    },
    active ? 4000 : null
  );

  /* the newest word stays in sight */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length]);

  const send = useCallback(async () => {
    const body = msg.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await netFetch(`/api/network/events/${id}`, {
        method: "POST",
        body: { action: "message", body },
      });
      setMsg("");
      await load();
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : t("The words could not be carried into the room.")
      );
    } finally {
      setSending(false);
    }
  }, [id, load, msg, sending, t]);

  const setRegistration = useCallback(async () => {
    if (!detail) return;
    setRegisterBusy(true);
    setSendError(null);
    try {
      await netFetch(`/api/network/events/${id}`, {
        method: "POST",
        body: { action: detail.joined ? "cancel" : "register" },
      });
      await load();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t("The room could not be reached."));
    } finally {
      setRegisterBusy(false);
    }
  }, [detail, id, load, t]);

  const endRoom = useCallback(async () => {
    setEndBusy(true);
    setSendError(null);
    try {
      await netFetch(`/api/network/events/${id}`, {
        method: "POST",
        body: { action: "end" },
      });
      await load();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t("The room could not be reached."));
    } finally {
      setEndBusy(false);
    }
  }, [id, load, t]);

  const saveSummary = useCallback(async () => {
    const summary = summaryDraft.trim();
    if (!summary || summaryBusy) return;
    setSummaryBusy(true);
    setSummaryError(null);
    try {
      await netFetch(`/api/network/events/${id}`, {
        method: "POST",
        body: { action: "summary", summary },
      });
      setSummaryDraft("");
      await load();
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : t("The summary could not be kept."));
    } finally {
      setSummaryBusy(false);
    }
  }, [id, load, summaryBusy, summaryDraft, t]);

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-[13.5px] text-[#b45309]" role="alert">
          {error}
        </p>
        <button type="button" onClick={onBack} className={cn(GP_GHOST, "mt-4")}>
          {t("Gather Live")}
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("The room is being read…")}
      </p>
    );
  }

  const when = formatWhen(detail.scheduledFor);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label={t("Gather Live")}
        className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        data-testid="gath-live-back"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {t("Gather Live")}
      </button>

      <div className={cn(GP_CARD, "mt-4 p-5 sm:p-6")}>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-[family-name:var(--font-literata)] text-[18px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
            {detail.title}
          </h2>
          {detail.status === "live" && <StatusPill status="live" />}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-[#a2947c]">
          <span className="flex items-center gap-1.5">
            <MakerMark name={detail.host.name} size={20} />
            <span className="font-semibold text-[#5c5344]">{detail.host.name}</span>
            {t("hosts")}
          </span>
          <span>
            {when} · {detail.durationMin} {t("min")}
          </span>
          <span>
            {detail.attendeeCount} {t("attendees")}
          </span>
        </div>
        {detail.description && (
          <p className="mt-2.5 font-[family-name:var(--font-literata)] text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
            {detail.description}
          </p>
        )}
        {detail.mine && detail.status === "live" && (
          <div className="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void endRoom()}
              disabled={endBusy}
              className={cn(GP_GHOST, "text-[12px] text-[#b45309] hover:text-[#b45309]")}
              data-testid="gath-live-end"
            >
              {endBusy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              {t("End the gathering")}
            </button>
            <span className="font-[family-name:var(--font-literata)] text-[11px] italic text-[#a2947c]">
              {t("the summary waits for the room's close")}
            </span>
          </div>
        )}
      </div>

      {detail.status === "scheduled" && (
        <div className={cn(GP_CARD, "mt-4 p-5 text-center")}>
          <p className="font-[family-name:var(--font-literata)] text-[13px] italic text-[#7c715f]">
            {t("the room opens at")} {when}
          </p>
          <button
            type="button"
            onClick={() => void setRegistration()}
            disabled={registerBusy}
            className={cn(detail.joined ? GP_GHOST : GP_HAND, "mt-3.5")}
            data-testid="gath-event-register"
          >
            {registerBusy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {detail.joined ? t("Cancel") : t("Register")}
          </button>
        </div>
      )}

      {detail.status === "live" && (
        <div className={cn(GP_CARD, "mt-4 flex flex-col p-4 sm:p-5")}>
          <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
            {t("The conversation")}
          </p>
          <div
            ref={listRef}
            className="gp-scroll mt-3 flex max-h-[46vh] flex-col gap-2.5 overflow-y-auto pr-1"
          >
            {detail.messages.length === 0 ? (
              <p className="py-8 text-center font-[family-name:var(--font-literata)] text-[12.5px] italic text-[#a2947c]">
                {t("The room is quiet — the first word is yours.")}
              </p>
            ) : (
              detail.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.mine ? "justify-end" : "justify-start")}
                  data-testid="gath-live-message"
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[18px] px-3.5 py-2.5",
                      m.mine ? "bg-[#fdf1e7]" : "border border-[#e4d9bd] bg-white/70"
                    )}
                  >
                    <p className="text-[11px] font-semibold text-[#7c715f]">
                      {m.mine ? t("You") : m.author.name}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-literata)] text-[13px] leading-[1.65] text-[#3d3428] [overflow-wrap:anywhere]">
                      {m.body}
                    </p>
                    <p className="mt-1 text-[10px] text-[#a2947c]">
                      {new Date(m.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {sendError && (
            <p className="mt-2 text-[11.5px] text-[#b45309]" role="alert">
              {sendError}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 border-t border-[#eadfca]/70 pt-3">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void send();
                }
              }}
              maxLength={800}
              placeholder={t("Speak into the room…")}
              aria-label={t("Speak into the room…")}
              data-testid="gath-live-input"
              className={cn(GP_INPUT, "min-w-0 flex-1")}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !msg.trim()}
              className={cn(GP_ICON_BTN, "size-9")}
              aria-label={t("Send")}
              data-testid="gath-live-send"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}

      {detail.status === "ended" &&
        (detail.summary ? (
          <div className={cn(GP_CARD, "mt-4 p-5")}>
            <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
              {t("The summary — written with consent")}
            </p>
            <p className="mt-2.5 font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.85] text-[#5c5344] [overflow-wrap:anywhere]">
              {detail.summary}
            </p>
          </div>
        ) : detail.mine ? (
          <div className={cn(GP_CARD, "mt-4 p-5")}>
            <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
              {t("Write the summary")}
            </p>
            <textarea
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              maxLength={1200}
              rows={4}
              placeholder={t("What the room held — a few honest sentences.")}
              aria-label={t("Write the summary")}
              data-testid="gath-live-summary-input"
              className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
            />
            {summaryError && (
              <p className="mt-2 text-[11.5px] text-[#b45309]" role="alert">
                {summaryError}
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void saveSummary()}
                disabled={summaryBusy || !summaryDraft.trim()}
                className={GP_HAND}
                data-testid="gath-live-summary-submit"
              >
                {summaryBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("Keep the summary")}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center font-[family-name:var(--font-literata)] text-[12.5px] italic text-[#a2947c]">
            {t("The summary has not been written yet.")}
          </p>
        ))}
    </div>
  );
}
