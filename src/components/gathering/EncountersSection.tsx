"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type PersonCard,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  EmptyRoom,
  RoomLabel,
  MakerMark,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  ENCOUNTERS — meaningful connections.                               */
/*                                                                     */
/*  Real makers only, found through what they make. A connection       */
/*  request carries the visitor's own words; M.E.'s sensed resonances  */
/*  appear as offered doors — a human always opens them.               */
/* ------------------------------------------------------------------ */

interface IncomingRow {
  id: string;
  note: string | null;
  viaMirror: boolean;
  createdAt: string;
  person: { id: string; name: string; image: string | null; anon: boolean };
}
interface OutgoingRow {
  id: string;
  note: string | null;
  createdAt: string;
  person: { id: string; name: string; image: string | null; anon: boolean };
}

export default function EncountersSection({
  active,
  onOpenMessages,
}: {
  active: boolean;
  onOpenMessages: () => void;
}) {
  const t = useT();
  const [people, setPeople] = useState<PersonCard[] | null>(null);
  const [incoming, setIncoming] = useState<IncomingRow[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRow[]>([]);
  const [connections, setConnections] = useState<Array<{ id: string; person: { id: string; name: string; image: string | null; anon: boolean } }>>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  /* the request sheet */
  const [askSheet, setAskSheet] = useState<{ person: PersonCard } | null>(null);
  const [askNote, setAskNote] = useState("");
  const [askBusy, setAskBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setPeople(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const [p, c] = await Promise.all([
        netFetch<{ people: PersonCard[] }>(`/api/network/people?${params.toString()}`),
        netFetch<{
          connections: Array<{ id: string; person: IncomingRow["person"] }>;
          incoming: IncomingRow[];
          outgoing: OutgoingRow[];
        }>("/api/network/connections"),
      ]);
      setPeople(p.people);
      setIncoming(c.incoming);
      setOutgoing(c.outgoing);
      setConnections(c.connections);
    } catch {
      setError(true);
    }
  }, [q]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const entangle = useCallback(
    async (person: PersonCard) => {
      setBusyId(person.id);
      try {
        const res = await netFetch<{ following?: boolean }>(`/api/network/people/${person.id}`, {
          method: "POST",
        });
        setNote(
          t(
            res?.following === false
              ? "The entanglement rests — you let it go."
              : "Entangled — your presences stay connected across the field."
          )
        );
        void load();
      } catch {
        /* the hand stays where it was */
      } finally {
        setBusyId(null);
      }
    },
    [load, t]
  );

  const sendRequest = useCallback(async () => {
    if (!askSheet || askBusy) return;
    setAskBusy(true);
    try {
      await netFetch("/api/network/connections", {
        method: "POST",
        body: {
          userId: askSheet.person.id,
          note: askNote.trim() || undefined,
        },
      });
      setAskSheet(null);
      setAskNote("");
      setNote(t("The introduction was sent."));
      void load();
    } catch {
      /* the sheet stays open */
    } finally {
      setAskBusy(false);
    }
  }, [askSheet, askBusy, askNote, load, t]);

  const answer = useCallback(
    async (row: IncomingRow, accept: boolean) => {
      setBusyId(row.id);
      try {
        await netFetch(`/api/network/connections/${row.id}`, {
          method: "POST",
          body: { action: accept ? "accept" : "decline" },
        });
        void load();
      } catch {
        /* the request stays where it was */
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[900px]">
        <RoomLabel>{t("Encounters")}</RoomLabel>

        {/* the requests waiting */}
        {incoming.length > 0 && (
          <div className="mt-3">
            <div className="space-y-2">
              {incoming.map((row) => (
                <div key={row.id} className="gp-card flex flex-wrap items-center gap-3 rounded-[20px] px-4 py-3" data-testid={`encounter-request-${row.id}`}>
                  <MakerMark name={row.person.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-[#3d3428]">
                      {row.person.name}{" "}
                      <span className="font-normal text-[#a2947c]">{t("wants to meet you")}</span>
                    </p>
                    {row.note && (
                      <p className="mt-0.5 line-clamp-2 text-[12px] italic leading-relaxed text-[#7c715f] [overflow-wrap:anywhere]">
                        “{row.note}”
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void answer(row, true)}
                      disabled={busyId === row.id}
                      className={cn(GP_HAND, "px-3 py-1.5 text-[11.5px]")}
                      data-testid={`encounter-accept-${row.id}`}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Check className="size-3.5" aria-hidden="true" />
                      )}
                      {t("Meet")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void answer(row, false)}
                      disabled={busyId === row.id}
                      aria-label={t("Let it rest")}
                      className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#a2947c] transition-colors duration-300 hover:text-[#b45309]"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* the search */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={60}
          placeholder={t("Find makers by name, interest or craft…")}
          aria-label={t("Find makers by name, interest or craft…")}
          data-testid="encounters-search"
          className={cn(GP_INPUT, "mt-4")}
        />

        {/* the makers */}
        {people === null && !error && (
          <p className="flex items-center justify-center gap-2 py-20 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The encounters arrive…")}
          </p>
        )}
        {error && (
          <p className="py-16 text-center text-[13.5px] text-[#b45309]">
            {t("The encounters could not be read.")}
          </p>
        )}
        {people !== null && people.length === 0 && !error && (
          <EmptyRoom
            icon={Users}
            line={t("No makers stand here yet — an offering hung in the hall is the first introduction.")}
          />
        )}
        {people !== null && people.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {people.map((p) => {
              const connected = connections.some((c) => c.person.id === p.id);
              const asked = outgoing.some((o) => o.person.id === p.id);
              return (
                <div key={p.id} className="gp-card flex flex-col rounded-[22px] p-4" data-testid={`encounter-card-${p.id}`}>
                  <div className="flex items-center gap-3">
                    <MakerMark name={p.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#3d3428]">{p.name}</p>
                      <p className="text-[10.5px] text-[#a2947c]">
                        {p.postCount} {t("offerings")} · {p.projectCount} {t("works together")}
                      </p>
                    </div>
                  </div>
                  {p.bio && (
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.6] text-[#5c5344] [overflow-wrap:anywhere]">
                      {p.bio}
                    </p>
                  )}
                  {(p.interests.length > 0 || p.disciplines.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[...p.interests.slice(0, 2), ...p.disciplines.slice(0, 2)].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#e8dfc9] bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-[#8a6f46]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-3">
                    {connected ? (
                      <button type="button" onClick={onOpenMessages} className={cn(GP_HAND, "px-3 py-1.5 text-[11.5px]")}>
                        <Users className="size-3.5" aria-hidden="true" />
                        {t("Speak")}
                      </button>
                    ) : asked ? (
                      <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-[#a2947c]">
                        {t("the door is asked")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAskSheet({ person: p })}
                        className={cn(GP_HAND, "px-3 py-1.5 text-[11.5px]")}
                        data-testid={`encounter-ask-${p.id}`}
                      >
                        <UserPlus className="size-3.5" aria-hidden="true" />
                        {t("Meet")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void entangle(p)}
                      disabled={busyId === p.id}
                      title={t("Entangle — your presences stay connected across the field")}
                      aria-label={t("Entangle")}
                      className={GP_GHOST}
                    >
                      {busyId === p.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : null}
                      {t("Entangle")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {note && (
          <p className="mt-4 text-center text-[12.5px] italic text-[#8a6f46]" role="status">
            {note}
          </p>
        )}

        {outgoing.length > 0 && (
          <div className="mt-8">
            <RoomLabel>{t("Doors you have asked")}</RoomLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {outgoing.map((o) => (
                <span
                  key={o.id}
                  className="flex items-center gap-2 rounded-full border border-[#e8dfc9] bg-white/60 py-1 pl-1 pr-3"
                >
                  <MakerMark name={o.person.name} size={20} />
                  <span className="text-[11px] font-semibold text-[#5c5344]">{o.person.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- the introduction sheet ---------- */}
      <AnimatePresence>
        {askSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-label={t("Meet someone")}
          >
            <button
              type="button"
              aria-label={t("Keep shaping")}
              onClick={() => setAskSheet(null)}
              className="absolute inset-0 cursor-default bg-[#3d3428]/25"
              tabIndex={-1}
            />
            <motion.div
              initial={{ y: "40%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "30%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="gp-glass relative flex flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[520px] sm:rounded-[30px]"
            >
              <div className="flex items-center justify-between px-5 pt-4 sm:px-7 sm:pt-5">
                <RoomLabel>{t("Open a door")}</RoomLabel>
                <button
                  type="button"
                  onClick={() => setAskSheet(null)}
                  aria-label={t("Keep shaping")}
                  className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
                >
                  <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
                </button>
              </div>
              <div className="px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <MakerMark name={askSheet.person.name} size={36} />
                  <div>
                    <p className="text-[13px] font-semibold text-[#3d3428]">{askSheet.person.name}</p>
                    <p className="text-[11px] text-[#a2947c]">{t("A door opens both ways")}</p>
                  </div>
                </div>
                <textarea
                  value={askNote}
                  onChange={(e) => setAskNote(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder={t("Say why you would like to meet — your own words…")}
                  aria-label={t("Say why you would like to meet — your own words…")}
                  data-testid="encounter-note"
                  className={cn(GP_INPUT, "gp-scroll mt-3 resize-none")}
                />
              </div>
              <div className="flex items-center gap-2.5 border-t border-[#eadfca]/70 px-5 py-3.5 sm:px-7">
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => void sendRequest()}
                  disabled={askBusy}
                  className={GP_HAND}
                  data-testid="encounter-send"
                >
                  {askBusy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                  {t("Send the introduction")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
