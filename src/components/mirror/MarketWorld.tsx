"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Music,
  Pause,
  Play,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { useMarketPublish } from "@/lib/market-publish";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE MARKET WORLD — the market is its OWN WORLD: never a tab of     */
/*  the workplace, never a scope. The crown's corner hand opens it     */
/*  over everything; its back hand lays it down and the visitor stands */
/*  exactly where they were.                                           */
/*                                                                     */
/*  Its world wears the violet light — deep amethyst halls, glass      */
/*  tables, a gold sigil at the crown. Only signed-in keepers walk     */
/*  here; an anonymous visitor meets the world's own gate, and the     */
/*  passage it asks for returns them to this same place.               */
/*                                                                     */
/*  THE HALL hangs only what keepers have published: every offering    */
/*  was laid on the shelf by its maker's own hand, and the Mirror      */
/*  wrote its explaining words. The keeper's own offerings stand in a  */
/*  private row — their progress readable, their publishing            */
/*  cancellable until live.                                            */
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

const KINDS: Array<{ id: MarketKind | "all"; label: string }> = [
  { id: "all", label: "All works" },
  { id: "book", label: "Books" },
  { id: "music", label: "Music" },
  { id: "art", label: "Art" },
  { id: "research", label: "Research" },
];

/* THE WORLD'S OWN DRESS — the violet constants every surface here reads */
const VIOLET_GEM =
  "linear-gradient(135deg, rgba(168,85,247,0.9), rgba(124,58,237,0.85))";

function fmtDuration(s: number | null): string {
  if (!s || !Number.isFinite(s) || s <= 0) return "";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return (iso || "").slice(0, 10);
}

/* THE FALLBACK FACE — a creation without a cover still wears a plate */
function KindFace({ kind }: { kind: MarketKind }) {
  const faces: Record<
    MarketKind,
    { from: string; to: string; Icon: typeof BookOpen }
  > = {
    book: { from: "#fbbf24", to: "#92400e", Icon: BookOpen },
    music: { from: "#c084fc", to: "#581c87", Icon: Music },
    art: { from: "#f0abfc", to: "#701a75", Icon: Sparkles },
    research: { from: "#5eead4", to: "#115e59", Icon: FlaskConical },
  };
  const { from, to, Icon } = faces[kind];
  return (
    <div
      className="flex size-full items-center justify-center"
      style={{ background: `linear-gradient(150deg, ${from}2e, ${to}73)` }}
      aria-hidden="true"
    >
      <Icon className="size-8 opacity-75" style={{ color: from }} />
    </div>
  );
}

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
      className="group flex flex-col overflow-hidden rounded-2xl border border-[rgba(196,181,253,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(216,180,254,0.35)]"
      style={{
        background:
          "linear-gradient(165deg, rgba(76,29,149,0.30), rgba(30,17,54,0.55))",
        boxShadow:
          "0 10px 34px -18px rgba(0,0,0,0.65), inset 0 1px 0 rgba(233,213,255,0.07)",
      }}
      data-testid={`market-card-${item.kind}`}
    >
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
            style={{ background: VIOLET_GEM }}
          >
            {playing ? (
              <Pause className="size-4" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 size-4" aria-hidden="true" />
            )}
          </button>
        )}
        <span
          className="mono-label absolute left-2.5 top-2.5 rounded-full border border-[rgba(216,180,254,0.3)] bg-[rgba(23,11,43,0.72)] px-2 py-0.5 text-[8.5px] uppercase tracking-[0.16em] text-[#d8b4fe] backdrop-blur-sm"
        >
          {t(KINDS.find((k) => k.id === item.kind)?.label ?? "All works")}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-serif text-[15.5px] font-semibold leading-snug text-[#f5f3ff]">
          {item.title}
        </h3>
        {item.note ? (
          <p className="line-clamp-3 text-[12.5px] italic leading-relaxed text-[#c4b5fd]">
            {item.note}
          </p>
        ) : null}
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[#a78bda]">
          {item.excerpt}
        </p>
        <span className="mt-auto pt-1.5">
          <span className="mono-label block text-[9px] uppercase tracking-[0.16em] text-[#9d8ec7]/80">
            {item.creator}
          </span>
          <span className="mono-label mt-0.5 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-[#8b7bb8]/70">
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

function MarketSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(196,181,253,0.12)]"
          aria-hidden="true"
        >
          <div
            className="w-full"
            style={{ aspectRatio: "16 / 9", background: "rgba(168,85,247,0.07)" }}
          />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3.5 w-3/4 rounded-full bg-[rgba(168,85,247,0.10)]" />
            <div className="h-3 w-1/2 rounded-full bg-[rgba(168,85,247,0.07)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* THE KEEPER'S OWN ROW — the offerings laid by this visitor's hand */
function MyOfferings() {
  const t = useT();
  const byRef = useMarketPublish((s) => s.byRef);
  const cancel = useMarketPublish((s) => s.cancel);
  const mine = useMemo(
    () => Object.values(byRef).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [byRef]
  );
  if (mine.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-[rgba(196,181,253,0.18)] p-4 sm:p-5"
      style={{
        background: "linear-gradient(150deg, rgba(76,29,149,0.26), rgba(30,17,54,0.5))",
      }}
      data-testid="market-my-offerings"
    >
      <h2 className="mono-label text-[10px] uppercase tracking-[0.18em] text-[#c4b5fd]">
        {t("Your offerings")}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {mine.map((l) => (
          <li
            key={l.id}
            className="flex items-center gap-3 rounded-xl border border-[rgba(196,181,253,0.12)] bg-[rgba(23,11,43,0.5)] px-3 py-2.5"
          >
            {l.cover ? (
              <img
                src={l.cover}
                alt=""
                className="size-10 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(168,85,247,0.14)" }}
              >
                <Store className="size-4 text-[#c4b5fd]" aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-[#f5f3ff]">
                {l.title}
              </span>
              <span className="mono-label block text-[9px] uppercase tracking-[0.14em] text-[#9d8ec7]">
                {l.status === "live" ? (
                  <span className="inline-flex items-center gap-1 text-[#86efac]">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    {t("In the Market")}
                  </span>
                ) : l.status === "publishing" ? (
                  <span className="inline-flex items-center gap-1 text-[#c4b5fd]">
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                    {t("The Mirror is writing")} · {Math.max(l.progress, 10)}%
                  </span>
                ) : l.status === "cancelled" ? (
                  <span>{t("Laid down")}</span>
                ) : (
                  <span>{l.status}</span>
                )}
              </span>
              {l.status === "publishing" && (
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[rgba(168,85,247,0.14)]">
                  <span
                    className="block h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(l.progress, 10)}%`,
                      background: VIOLET_GEM,
                    }}
                  />
                </span>
              )}
            </span>
            {l.status !== "live" && (
              <button
                type="button"
                onClick={() => void cancel(l.id)}
                aria-label={t("Cancel the publishing")}
                title={t("Cancel the publishing")}
                className="focus-glow rounded-full p-1.5 text-[#9d8ec7] transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* THE WORLD'S GATE — the anonymous visitor meets the passage ask */
function MarketGate() {
  const t = useT();
  const openAuth = useMirror((s) => s.openAuth);
  return (
    <div className="flex flex-1 items-center justify-center px-5 pb-24">
      <div
        className="w-full max-w-[440px] rounded-3xl border border-[rgba(196,181,253,0.2)] p-8 text-center"
        style={{
          background:
            "linear-gradient(165deg, rgba(76,29,149,0.4), rgba(30,17,54,0.72))",
          boxShadow: "0 30px 80px -30px rgba(88,28,135,0.8)",
        }}
        data-testid="market-gate"
      >
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-2xl"
          style={{ background: VIOLET_GEM, boxShadow: "0 8px 30px -8px rgba(168,85,247,0.7)" }}
        >
          <Store className="size-6 text-[#f3e8ff]" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-serif text-[22px] font-semibold text-[#f5f3ff]">
          {t("The Market")}
        </h2>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#c4b5fd]">
          {t(
            "A hall of the house's own creations — woven books, songs, visions and studies, each offered by its maker. Sign in to walk among them."
          )}
        </p>
        <button
          type="button"
          onClick={() => openAuth("signin")}
          data-testid="market-gate-signin"
          className="focus-glow mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-medium text-[#f3e8ff] transition-all duration-300 hover:brightness-110"
          style={{
            background: VIOLET_GEM,
            boxShadow: "0 6px 24px -8px rgba(168,85,247,0.8)",
          }}
        >
          {t("Sign in")}
        </button>
      </div>
    </div>
  );
}

export function MarketWorld() {
  const t = useT();
  const open = useMirror((s) => s.marketOpen);
  const closeMarket = useMirror((s) => s.closeMarket);
  const me = useMirror((s) => s.me);
  const loadMine = useMarketPublish((s) => s.loadMine);

  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<MarketItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<MarketKind | "all">("all");

  /* mount/unmount with a breath — the world rises and folds */
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const id = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(id);
    }
  }, [open]);

  /* the keeper's own offerings — read when the door opens and when the
     passage arrives */
  useEffect(() => {
    if (open && me) void loadMine();
  }, [open, me, loadMine]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/marketplace", {
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        items?: MarketItem[];
      } | null;
      if (!res.ok || !data?.items) throw new Error("veiled");
      setPayload(data.items);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!me) {
      setPayload(null);
      return;
    }
    void load();
  }, [open, me, load]);

  /* Esc lays the world down */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMarket();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMarket]);

  /* THE HALL'S ONE VOICE — one song at a time */
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

  if (typeof document === "undefined") return null;
  /* the world does not exist at all until it is first opened — and
     once it has opened, the closed state reads fully gone (hidden from
     the eyes, the readers and the tab order alike) */
  if (!open && !mounted) return null;

  const items = payload ?? [];
  const shown =
    filter === "all" ? items : items.filter((i) => i.kind === filter);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[92] transition-[opacity,visibility] duration-300",
        open ? "visible opacity-100" : "invisible opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t("The Market")}
      data-testid="market-world"
    >
      {/* the world's own sky — deep amethyst, two breathing orbs */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 620px at 18% -8%, rgba(124,58,237,0.30), transparent 62%)," +
            "radial-gradient(1000px 540px at 88% 4%, rgba(192,38,211,0.16), transparent 58%)," +
            "linear-gradient(180deg, #150a26 0%, #1d0f35 44%, #120822 100%)",
        }}
        aria-hidden="true"
      >
        <span
          className="absolute left-[8%] top-[16%] size-64 rounded-full blur-[110px]"
          style={{ background: "rgba(147,51,234,0.16)" }}
        />
        <span
          className="absolute bottom-[10%] right-[6%] size-72 rounded-full blur-[130px]"
          style={{ background: "rgba(88,28,135,0.22)" }}
        />
      </div>

      {/* the world's own header */}
      <header
        className={cn(
          "relative z-10 flex items-center justify-between gap-3 border-b border-[rgba(196,181,253,0.14)] px-4 py-3 transition-transform duration-300 sm:px-6",
          mounted ? "translate-y-0" : "-translate-y-3"
        )}
        style={{
          background: "linear-gradient(180deg, rgba(29,15,53,0.85), rgba(21,10,38,0.6))",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={closeMarket}
            aria-label={t("Back")}
            title={t("Back")}
            data-testid="market-back"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border border-[rgba(196,181,253,0.25)] text-[#d8b4fe] transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: VIOLET_GEM }}
          >
            <Store className="size-4 text-[#f3e8ff]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[17px] font-semibold text-[#f5f3ff]">
              {t("The Market")}
            </h1>
            <p className="mono-label truncate text-[9px] uppercase tracking-[0.18em] text-[#9d8ec7]">
              {t("the hall of creations")}
            </p>
          </div>
        </div>
      </header>

      {/* the hall's floor */}
      <div className="nice-scroll relative z-10 h-[calc(100%-61px)] overflow-y-auto overscroll-contain">
        {!me ? (
          <MarketGate />
        ) : (
          <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
            <MyOfferings />

            <header className="mt-2 flex flex-col items-center text-center">
              <p className="max-w-[560px] text-[13.5px] leading-relaxed text-[#c4b5fd]">
                {t(
                  "Every work here was offered by its maker's own hand — the book you weave tonight may hang here tomorrow."
                )}
              </p>
              <div className="mono-label mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.16em] text-[#9d8ec7]/80">
                <span>
                  {(payload ?? []).filter((i) => i.kind === "book").length} {t("books")}
                </span>
                <span>
                  {(payload ?? []).filter((i) => i.kind === "music").length} {t("songs")}
                </span>
                <span>
                  {(payload ?? []).filter((i) => i.kind === "art").length} {t("visions")}
                </span>
                <span>
                  {(payload ?? []).filter((i) => i.kind === "research").length} {t("studies")}
                </span>
              </div>
            </header>

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
                    className={cn(
                      "focus-glow h-7 rounded-full border px-3 text-[12px] transition-all duration-300",
                      active
                        ? "border-[rgba(216,180,254,0.5)] bg-[rgba(168,85,247,0.2)] text-[#e9d5ff]"
                        : "border-[rgba(196,181,253,0.16)] text-[#a78bda] hover:bg-white/5"
                    )}
                  >
                    {t(k.label)}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {loading ? (
                <MarketSkeleton />
              ) : failed ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-[14px] text-[#a78bda]">
                    {t("The hall's doors rest a moment. Breathe, then return.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    data-testid="market-retry"
                    className="focus-glow rounded-full border border-[rgba(216,180,254,0.4)] px-4 py-1.5 text-[12.5px] text-[#d8b4fe] transition-colors hover:bg-white/5"
                  >
                    {t("Try again")}
                  </button>
                </div>
              ) : shown.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Store className="size-6 text-[#9d8ec7]/50" aria-hidden="true" />
                  <p className="text-[14px] font-medium text-[#e9d5ff]/90">
                    {t("The hall waits for its first offerings")}
                  </p>
                  <p className="max-w-[440px] text-[12.5px] leading-relaxed text-[#a78bda]">
                    {t(
                      "When you finish a book, a song, a vision or a study, the publish hand beside it lays it on this shelf — the Mirror writes its words, and it hangs here for every keeper."
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((item) => (
                    <MarketCard
                      key={item.id}
                      item={item}
                      playing={playingId === item.id}
                      onToggle={togglePlay}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
