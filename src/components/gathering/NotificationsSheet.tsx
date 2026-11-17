"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { type NotificationRow, GP_GHOST, RoomLabel, netFetch, relativeTime } from "./shared";

/* ------------------------------------------------------------------ */
/*  THE BELL'S ROOM — connection requests, echoes, resonances,         */
/*  invitations and messages: every ring a real row, every read a      */
/*  real timestamp. The visitor reads one, or reads them all.          */
/* ------------------------------------------------------------------ */

const TYPE_LINE: Record<string, string> = {
  echo: "echoed your offering",
  resonance: "resonated with your offering",
  follow: "is entangled with your path now",
  connection_request: "asked to meet you",
  connection_accepted: "opened the door you offered",
  circle_join: "joined a circle you keep",
  project_join: "joined a weaving of yours",
  project_entry: "added a weaving",
  project_invite: "invited you to weave",
  message: "sent you a word",
};

export default function NotificationsSheet({
  onCount,
  onClose,
}: {
  onCount: (n: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ notifications: NotificationRow[]; unread: number }>(
          "/api/network/notifications"
        );
        if (!alive) return;
        setRows(data.notifications);
        onCount(data.unread);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [onCount]);

  const markAll = useCallback(async () => {
    try {
      await netFetch("/api/network/notifications", { method: "POST", body: { all: true } });
      setRows((prev) => (prev ?? []).map((r) => ({ ...r, read: true })));
      onCount(0);
    } catch {
      /* the bell rests as it was */
    }
  }, [onCount]);

  return (
    <div className="flex h-full flex-col px-3 pb-6 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Keep shaping")}
          className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          ← {t("The Gathering")}
        </button>
        <button type="button" onClick={() => void markAll()} className={GP_GHOST}>
          {t("Read them all")}
        </button>
      </div>

      <div className="gp-scroll mx-auto w-full max-w-[640px] flex-1 overflow-y-auto pb-16 pt-4">
        <RoomLabel>{t("The bell")}</RoomLabel>
        {rows === null && !error && (
          <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The bell arrives…")}
          </p>
        )}
        {error && (
          <p className="py-16 text-center text-[13.5px] text-[#b45309]">
            {t("The bell could not be read.")}
          </p>
        )}
        {rows !== null && rows.length === 0 && !error && (
          <p className="py-16 text-center font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.85] text-[#8a7c64]">
            {t("The bell rests quiet — no rings yet.")}
          </p>
        )}
        <div className="mt-3 space-y-2">
          {(rows ?? []).map((n) => (
            <div
              key={n.id}
              className={n.read ? "gp-card rounded-[18px] px-4 py-3 opacity-70" : "gp-card rounded-[18px] border-[#d9c99a]/60 px-4 py-3"}
              data-testid={`notification-${n.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] leading-[1.6] text-[#4c4436] [overflow-wrap:anywhere]">
                  <span className="font-semibold text-[#3d3428]">{n.actorName}</span>{" "}
                  {t(TYPE_LINE[n.type] ?? "left a trace")}{" "}
                  {n.body && (
                    <span className="italic text-[#7c715f]">
                      {n.refType === "post" ? "· " : ""}
                      {n.body}
                    </span>
                  )}
                </p>
                <span className="shrink-0 text-[10px] text-[#a2947c]">
                  {relativeTime(n.createdAt, t)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("Keep shaping")}
        className="focus-glow absolute right-4 top-4 hidden rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428] sm:block"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
