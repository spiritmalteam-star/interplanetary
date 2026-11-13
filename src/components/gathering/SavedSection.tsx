"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Feather, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type GatheringKind,
  KIND_META,
  EmptyRoom,
  GP_CARD,
  GP_ICON_BTN,
  RoomLabel,
  netFetch,
  relativeTime,
  useFlashNote,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  SAVED — the visitor's own quiet shelf. Private, never a public     */
/*  signal: what is kept here is kept for one reader only. Taking a    */
/*  work off the shelf releases it with one hand; the shelf breathes.  */
/* ------------------------------------------------------------------ */

interface SavedRow {
  id: string;
  postId: string;
  savedAt: string;
  post: {
    id: string;
    kind: string;
    title: string;
    body: string;
    author: { name: string; anon: boolean };
    resonanceCount: number;
    echoCount: number;
    createdAt: string;
  };
}

export default function SavedSection({ active }: { active: boolean }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [hintId, setHintId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await netFetch<{ saved: SavedRow[] }>("/api/network/bookmarks");
      setRows(data.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The shelf could not be read."));
    }
  }, [t]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const remove = useCallback(
    async (row: SavedRow) => {
      setRemovingId(row.id);
      setRows((prev) => (prev ?? []).filter((r) => r.id !== row.id));
      try {
        await netFetch<{ bookmarked: boolean; savedCount: number }>("/api/network/bookmarks", {
          method: "POST",
          body: { postId: row.postId, on: false },
        });
        flash(t("The shelf breathes — one saved, one released."));
      } catch (err) {
        flash(err instanceof Error ? err.message : t("The shelf could not be reached."));
        await load(); /* the shelf reads itself again — the truth stands */
      } finally {
        setRemovingId(null);
      }
    },
    [flash, load, t]
  );

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-24">
      <div className="mx-auto max-w-[860px] px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <RoomLabel>{t("the gathering · saved")}</RoomLabel>
          {rows !== null && !error && (
            <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
              {rows.length} {t("works kept")}
            </p>
          )}
        </div>

        <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold text-[#3d3428]">
          {t("Saved")}
        </h2>
        <p className="mt-2 max-w-[640px] font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#8a7c64]">
          {t("Your own quiet shelf — private, never a public signal.")}
        </p>

        {note && (
          <p className="mt-3 text-[12px] italic text-[#8a6f46]" role="status">
            {note}
          </p>
        )}

        {rows === null && !error && (
          <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The shelf is being read…")}
          </p>
        )}

        {error && (
          <div className="py-24 text-center">
            <p className="text-[13.5px] text-[#b45309]" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="focus-glow mt-4 flex items-center justify-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-4 py-2.5 text-[12.5px] font-semibold text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
              data-testid="gath-saved-retry"
            >
              {t("Try again")}
            </button>
          </div>
        )}

        {rows !== null && rows.length === 0 && !error && (
          <EmptyRoom
            icon={Bookmark}
            line={t("Nothing kept yet — the bookmark hand rests on every offering in the Pulse.")}
          />
        )}

        {rows !== null && rows.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {rows.map((row) => {
              const meta = KIND_META[row.post.kind as GatheringKind];
              const Icon = meta?.icon ?? Feather;
              const accent = meta?.accent ?? "#8a6f46";
              return (
                <div key={row.id} className={cn(GP_CARD, "p-4")} data-testid="gath-saved-card">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-white/90"
                      style={{
                        background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
                      }}
                    >
                      <Icon className="size-4" style={{ color: accent }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setHintId(hintId === row.id ? null : row.id)}
                        aria-expanded={hintId === row.id}
                        className="focus-glow block max-w-full text-left outline-none"
                        data-testid="gath-saved-title"
                      >
                        <h3 className="truncate font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428] [overflow-wrap:anywhere] hover:underline">
                          {row.post.title}
                        </h3>
                      </button>
                      <p className="mt-1 line-clamp-2 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
                        {row.post.body}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#a2947c]">
                        {row.post.author.name} · {t("kept")} {relativeTime(row.savedAt, t)}
                      </p>
                      {hintId === row.id && (
                        <p className="mt-2 text-[11px] italic text-[#a2947c]">
                          {t("Open the Pulse to read it in place.")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(row)}
                      disabled={removingId === row.id}
                      aria-label={t("Take it off the shelf")}
                      title={t("Take it off the shelf")}
                      className={cn(GP_ICON_BTN, "size-8")}
                      data-testid="gath-saved-remove"
                    >
                      {removingId === row.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <BookmarkCheck className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
