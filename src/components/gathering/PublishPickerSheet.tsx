"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Loader2, Music, Sparkles, X } from "lucide-react";
import { GP_CARD, GP_GHOST, GP_HAND, netFetch } from "./shared";
import PublishToGathering, { type PublishPayload } from "./PublishToGathering";

/* ------------------------------------------------------------------ */
/*  THE PUBLICATION PICKER — the hall's only "creation" door, and it   */
/*  creates nothing: it carries works that already exist on the        */
/*  maker's own shelves into the hall. Creation stays in the rooms     */
/*  where it was born.                                                 */
/* ------------------------------------------------------------------ */

interface MineEntry {
  sourceKind: "library" | "music";
  sourceId: string;
  sector: string;
  title: string;
  preview: string;
  cover: string | null;
  refUrl: string | null;
  createdAt: string;
  published: boolean;
}

const SECTOR_PORTAL: Record<string, string> = {
  artx: "artx",
  music: "music",
  lightcodes: "music",
  book: "book",
  dreambook: "book",
  quantum: "channeling",
  healx: "channeling",
  observatory: "hyperx",
  invent: "invent",
  manifest: "manifest",
};

const SECTOR_TYPE_LABEL: Record<string, string> = {
  artx: "Artwork",
  observatory: "Research / Exploration",
  dreambook: "Book / Story",
  manifest: "Intention / Reflection",
  invent: "Invention",
  quantum: "Reflection / Transmission",
  healx: "Reflection / Transmission",
};

const GENERIC_SECTORS = new Set(["quantum", "healx", "manifest"]);

export default function PublishPickerSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<MineEntry[]>([]);
  const [tracks, setTracks] = useState<MineEntry[]>([]);
  const [active, setActive] = useState<MineEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await netFetch<{ creations: MineEntry[]; tracks: MineEntry[] }>("/api/discover?dest=mine");
        setEntries(data.creations);
        setTracks(data.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The shelf could not be reached.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const payloadOf = (m: MineEntry): PublishPayload => ({
    sourcePortal: SECTOR_PORTAL[m.sector] ?? m.sector,
    sourceId: m.sourceId,
    refKind: m.sourceKind,
    suggestedTitle: m.title,
    preview: m.preview,
    cover: m.cover,
    refUrl: m.refUrl,
    generic: m.sourceKind === "library" && GENERIC_SECTORS.has(m.sector),
    contentTypeLabel:
      m.sourceKind === "music" ? "Music" : SECTOR_TYPE_LABEL[m.sector] ?? "Reflection / Transmission",
  });

  const row = (m: MineEntry) => (
    <button
      key={`${m.sourceKind}-${m.sourceId}`}
      type="button"
      onClick={() => setActive(m)}
      data-testid={`publish-picker-item-${m.sourceKind}`}
      className="focus-glow flex w-full items-center gap-3 rounded-[16px] border border-[#e4d9bd] bg-white/60 px-3 py-2.5 text-left transition-all duration-200 hover:border-[#cbb98d] hover:bg-white/80"
    >
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/90 bg-[linear-gradient(150deg,#fffdf8,#f0e6cf)]">
        {m.cover ? (
           
          <img src={m.cover} alt="" className="size-full object-cover" />
        ) : m.sourceKind === "music" ? (
          <Music className="size-4 text-[#8a6f46]" aria-hidden="true" />
        ) : (
          <BookOpen className="size-4 text-[#8a6f46]" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-[#4c4436]">{m.title || "An unnamed work"}</span>
        <span className="block truncate text-[11px] text-[#a2947c]">
          {m.sector} · {m.preview || "a quiet work"}
        </span>
      </span>
      {m.published ? (
        <span className="shrink-0 rounded-full border border-[#d8e5d0] bg-[#f2f7ee] px-2.5 py-1 text-[10px] font-semibold text-[#5f7a52]">
          hung
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-[#e4d9bd] bg-[linear-gradient(150deg,#fffdf8,#f3ead6)] px-2.5 py-1 text-[10px] font-semibold text-[#8a6f46]">
          publish
        </span>
      )}
    </button>
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publish a work"
      data-testid="publish-picker"
      className="fixed inset-0 z-[96] flex items-end justify-center bg-[rgba(46,38,24,0.32)] backdrop-blur-[3px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`gp-scroll max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-t-[26px] border border-white/85 p-5 shadow-[0_30px_80px_-30px_rgba(60,48,26,0.5)] sm:rounded-[26px] sm:p-6 ${GP_CARD}`}
        style={{ background: "var(--gath-sheet)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-cinzel)] text-[16px] font-semibold tracking-wide text-[#3d3428]">
              Publish a work
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#a2947c]">
              Every work below was born in one of the house's rooms. Carry it into the hall — the rooms
              themselves remain where creation happens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-colors hover:text-[#3d3428]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[#8a6f46]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="text-[12.5px]">Reading your shelves…</span>
          </div>
        ) : error ? (
          <p role="alert" className="mt-4 rounded-[12px] border border-[#e8c9b0] bg-[#fdf1e7] px-3 py-2 text-[12px] text-[#9a4f21]">
            {error}
          </p>
        ) : active ? (
          <PublishToGathering
            open
            payload={payloadOf(active)}
            onClose={() => setActive(null)}
            onPublished={() => {
              /* the row now reads "hung" on the next visit */
              setEntries((prev) => prev.map((e) => (e.sourceId === active.sourceId ? { ...e, published: true } : e)));
              setTracks((prev) => prev.map((e) => (e.sourceId === active.sourceId ? { ...e, published: true } : e)));
            }}
          />
        ) : (
          <div className="mt-4 space-y-4">
            {entries.length === 0 && tracks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Sparkles className="size-6 text-[#cbb98d]" aria-hidden="true" />
                <p className="text-[13px] text-[#7c715f]">
                  Your shelves are quiet for now. Create in ArtX, Music, Book, HyperX or a transmission —
                  then publish the finished work here.
                </p>
              </div>
            ) : (
              <>
                {entries.length > 0 && (
                  <section aria-label="Works from the shelves" className="space-y-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#a2947c]">From your shelves</p>
                    <div className="gp-scroll max-h-[300px] space-y-2 overflow-y-auto pr-1">{entries.map(row)}</div>
                  </section>
                )}
                {tracks.length > 0 && (
                  <section aria-label="Compositions from the music room" className="space-y-2">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#a2947c]">From the music room</p>
                    <div className="gp-scroll max-h-[240px] space-y-2 overflow-y-auto pr-1">{tracks.map(row)}</div>
                  </section>
                )}
              </>
            )}
            <div className="flex justify-end pt-1">
              <button type="button" onClick={onClose} className={`${GP_GHOST} min-h-[44px] px-5`}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* the small hand that opens the picker from the stream */
export function PublishWorkHand({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} data-testid="gathering-publish-work" className={`${GP_HAND} min-h-[44px]`}>
      Publish a work
    </button>
  );
}
