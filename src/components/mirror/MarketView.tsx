"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  FlaskConical,
  Music,
  Pause,
  Play,
  Store,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE MARKET — the house's own open hall (the visitor named it): a   */
/*  beautiful, laid-out market at the crown's corner where every       */
/*  visitor's creations are displayed — the woven books with their     */
/*  painted covers, the songs with their listening door, the atelier's */
/*  visions, the studies and transmissions of every field. The hall    */
/*  hangs its newest works first and wears the crown's own gold.       */
/* ------------------------------------------------------------------ */

type MarketKind = "book" | "music" | "art" | "research";

interface MarketItem {
  id: string;
  kind: MarketKind;
  title: string;
  excerpt: string;
  creator: string;
  createdAt: string;
  cover: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  pages: number | null;
  note: string | null;
}

interface MarketPayload {
  items: MarketItem[];
  counts: { books?: number; music?: number; art?: number; research?: number };
}

const KINDS: Array<{ id: MarketKind | "all"; label: string }> = [
  { id: "all", label: "All works" },
  { id: "book", label: "Books" },
  { id: "music", label: "Music" },
  { id: "art", label: "Art" },
  { id: "research", label: "Research" },
];

function fmtDuration(s: number | null): string {
  if (!s || !Number.isFinite(s) || s <= 0) return "";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return (iso || "").slice(0, 10);
}

/* THE FALLBACK FACE — a creation without a cover still wears a plate:
   a calm gradient tuned to its kind, its kind's mark at the heart. */
function KindFace({ kind }: { kind: MarketKind }) {
  const faces: Record<
    MarketKind,
    { from: string; to: string; Icon: typeof BookOpen }
  > = {
    book: { from: "#eab308", to: "#b45309", Icon: BookOpen },
    music: { from: "#a855f7", to: "#6b21a8", Icon: Music },
    art: { from: "#e879f9", to: "#9d174d", Icon: Store },
    research: { from: "#2dd4bf", to: "#0f766e", Icon: FlaskConical },
  };
  const { from, to, Icon } = faces[kind];
  return (
    <div
      className="flex size-full items-center justify-center"
      style={{ background: `linear-gradient(150deg, ${from}33, ${to}66)` }}
      aria-hidden="true"
    >
      <Icon className="size-8 opacity-70" style={{ color: from }} />
    </div>
  );
}

/* ONE WORK'S CARD — the hall's own table setting: the face up top,
   the words beneath, the maker's name at the foot. */
function MarketCard({
  item,
  playing,
  onToggle,
}: {
  item: MarketItem;
  playing: boolean;
  onToggle: (item: MarketItem) => void;
}) {
  const t = useT();
  const isMusic = item.kind === "music";

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, var(--hairline))",
        background: "var(--glass-bg-soft, color-mix(in srgb, var(--card) 70%, transparent))",
      }}
      data-testid={`market-card-${item.kind}`}
    >
      {/* the face */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        {item.cover ? (
          <img
            src={item.cover}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <KindFace kind={item.kind} />
        )}
        {isMusic && (
          <button
            type="button"
            onClick={() => onToggle(item)}
            aria-label={playing ? t("Pause") : t("Play")}
            data-testid="market-play"
            className="focus-glow absolute bottom-2.5 right-2.5 flex size-10 items-center justify-center rounded-full text-[#f6f4ef] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, var(--scope-a,var(--gd)), color-mix(in srgb, var(--scope-a,var(--gd)) 55%, #000))",
            }}
          >
            {playing ? (
              <Pause className="size-4" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 size-4" aria-hidden="true" />
            )}
          </button>
        )}
        <span
          className="mono-label absolute left-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.16em] backdrop-blur-sm"
          style={{
            color: "var(--scope-a,var(--gd))",
            borderColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
            background: "color-mix(in srgb, var(--background) 72%, transparent)",
          }}
        >
          {t(KINDS.find((k) => k.id === item.kind)?.label ?? "All works")}
        </span>
      </div>

      {/* the words */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-serif text-[15.5px] font-semibold leading-snug text-foreground">
          {item.title}
        </h3>
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {item.excerpt}
        </p>
        <span className="mt-auto pt-1.5">
          <span className="mono-label block text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {item.creator}
          </span>
          <span className="mono-label mt-0.5 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/55">
            {fmtDate(item.createdAt)}
            {item.pages ? <span>· {item.pages} pages</span> : null}
            {isMusic && item.durationSec ? (
              <span>· {fmtDuration(item.durationSec)}</span>
            ) : null}
          </span>
        </span>
      </div>
    </article>
  );
}

/* the hall's own quiet scaffold — the shape of works about to hang */
function MarketSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-[var(--hairline)]"
          aria-hidden="true"
        >
          <div
            className="w-full"
            style={{
              aspectRatio: "16 / 9",
              background: "color-mix(in srgb, var(--foreground) 5%, transparent)",
            }}
          />
          <div className="flex flex-col gap-2 p-4">
            <div
              className="h-3.5 w-3/4 rounded-full"
              style={{ background: "color-mix(in srgb, var(--foreground) 6%, transparent)" }}
            />
            <div
              className="h-3 w-1/2 rounded-full"
              style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketView() {
  const t = useT();
  const [payload, setPayload] = useState<MarketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<MarketKind | "all">("all");

  /* THE HALL'S ONE VOICE — only one song may sound in the hall at a
     time; a new play lays the last one down. */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        /* already quiet */
      }
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const togglePlay = useCallback(
    (item: MarketItem) => {
      if (playingId === item.id) {
        stopAudio();
        return;
      }
      stopAudio();
      if (!item.audioUrl) return;
      const audio = new Audio(item.audioUrl);
      audioRef.current = audio;
      setPlayingId(item.id);
      audio.onended = stopAudio;
      audio.onerror = stopAudio;
      void audio.play().catch(stopAudio);
    },
    [playingId, stopAudio]
  );

  useEffect(
    () => () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          /* already quiet */
        }
      }
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/marketplace", {
        signal: AbortSignal.timeout(30000),
      });
      const data = (await res.json().catch(() => null)) as MarketPayload | null;
      if (!res.ok || !data?.items) throw new Error("veiled");
      setPayload(data);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = payload?.items ?? [];
  const shown = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );
  const counts = payload?.counts ?? {};

  return (
    <div
      className="nice-scroll h-full overflow-y-auto overscroll-contain"
      data-testid="market-view"
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-5 sm:px-6">
        {/* THE HALL'S OWN HEAD */}
        <header className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 32%, transparent)",
            }}
          >
            <Store className="size-5 text-[var(--scope-a,var(--gd))]" />
          </span>
          <h1 className="mt-3 font-serif text-[24px] font-semibold text-foreground sm:text-[28px]">
            {t("The Market")}
          </h1>
          <p className="mt-1.5 max-w-[520px] text-[13.5px] leading-relaxed text-muted-foreground">
            {t(
              "The house's open hall — every visitor's woven books, songs, visions and studies, hung here for all to see."
            )}
          </p>
          {!loading && !failed && (
            <div className="mono-label mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
              <span>
                {counts.books ?? 0} {t("books")}
              </span>
              <span>
                {counts.music ?? 0} {t("songs")}
              </span>
              <span>
                {counts.art ?? 0} {t("visions")}
              </span>
              <span>
                {counts.research ?? 0} {t("studies")}
              </span>
            </div>
          )}
        </header>

        {/* THE FILTERS — one quiet row of chips */}
        <div
          role="group"
          aria-label={t("Filter the works")}
          className="mt-5 flex flex-wrap items-center justify-center gap-1.5"
        >
          {KINDS.map((k) => {
            const active = filter === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setFilter(k.id)}
                aria-pressed={active}
                data-testid={`market-filter-${k.id}`}
                className={cn("btn-chip h-7 px-3 text-[12px]")}
                style={
                  active
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 13%, transparent)",
                        color: "var(--scope-a,var(--gd))",
                        boxShadow:
                          "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 38%, transparent)",
                      }
                    : undefined
                }
              >
                {t(k.label)}
              </button>
            );
          })}
        </div>

        {/* THE HALL'S FLOOR */}
        <div className="mt-6">
          {loading ? (
            <MarketSkeleton />
          ) : failed ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-[14px] text-muted-foreground">
                {t("The hall's doors rest a moment. Breathe, then return.")}
              </p>
              <button
                type="button"
                onClick={() => void load()}
                data-testid="market-retry"
                className="focus-glow rounded-full border px-4 py-1.5 text-[12.5px] text-foreground transition-colors duration-300 hover:bg-foreground/5"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
                  color: "var(--scope-a,var(--gd))",
                }}
              >
                {t("Try again")}
              </button>
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Store className="size-6 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[14px] font-medium text-foreground/80">
                {t("The hall waits for its first works")}
              </p>
              <p className="max-w-[420px] text-[12.5px] leading-relaxed text-muted-foreground">
                {t(
                  "Everything woven in the house — a book, a song, a vision, a study — takes its place here once it is made."
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((item) => (
                <MarketCard
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  playing={playingId === item.id}
                  onToggle={togglePlay}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-[11.5px] leading-relaxed text-muted-foreground/60">
          {t(
            "Every work shown here was woven by a visitor of the house — the book you weave tonight may hang here tomorrow."
          )}
        </p>
      </div>
    </div>
  );
}
