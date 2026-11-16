"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamicImport from "next/dynamic";
import {
  Bookmark,
  BookmarkCheck,
  Heart,
  Loader2,
  MessagesSquare,
  Music4,
  Send,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type GatheringEcho,
  type GatheringKind,
  type GatheringPost,
  EVIDENCE_LABEL,
  KIND_META,
  KIND_OFFERING_LABEL,
  GP_INPUT,
  MakerMark,
  netFetch,
  regionLabel,
  relativeTime,
} from "./shared";

const GatheringRadio = dynamicImport(
  () => import("./GatheringRadio").then((m) => ({ default: m.GatheringRadio })),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/*  THE POSSIBILITIES REALM — the hall's middle door. One creation at  */
/*  a time fills the whole stage and the visitor walks upward: every   */
/*  work the house has published — reflections, dreams, books, music,  */
/*  discoveries, questions, intentions — rises full-screen, one snap   */
/*  per breath, the way a story is told. No feeds of rows, no grids:   */
/*  the walk is vertical and the world arrives one possibility at a    */
/*  time. Every action is honest: a resonance is felt, an echo is      */
/*  spoken, a save keeps, a share carries the hall's address. Nothing  */
/*  pretends — an empty realm says so and offers the pour again.       */
/* ------------------------------------------------------------------ */

type RealmPost = GatheringPost;

/* the kind's own wash — one deep gradient per family of possibility */
const WASH: Record<string, string> = {
  reflection: "linear-gradient(165deg,#2b2416 0%,#181310 100%)",
  creation: "linear-gradient(165deg,#2e2412 0%,#1a1408 100%)",
  dream: "linear-gradient(165deg,#241a33 0%,#140f1d 100%)",
  music: "linear-gradient(165deg,#0f2b28 0%,#0a1815 100%)",
  book: "linear-gradient(165deg,#2b2410 0%,#171207 100%)",
  discovery: "linear-gradient(165deg,#0e2b2a 0%,#0a1a19 100%)",
  question: "linear-gradient(165deg,#2e1c29 0%,#1a0f18 100%)",
  hypothesis: "linear-gradient(165deg,#221a33 0%,#130f1e 100%)",
  experiment: "linear-gradient(165deg,#0e2625 0%,#0a1615 100%)",
  finding: "linear-gradient(165deg,#0e2b2a 0%,#0a1a19 100%)",
  collaboration: "linear-gradient(165deg,#2e2412 0%,#1a1408 100%)",
  discussion: "linear-gradient(165deg,#2b2416 0%,#181310 100%)",
  intention: "linear-gradient(165deg,#331c0e 0%,#1c0f06 100%)",
};

const FALLBACK_WASH = "linear-gradient(165deg,#26200f 0%,#15110a 100%)";

function washFor(kind: string): string {
  return WASH[kind] ?? FALLBACK_WASH;
}

export default function PossibilitiesRealm({
  active,
  onNavigate,
}: {
  active: boolean;
  onNavigate: (section: string) => void;
}) {
  const t = useT();

  /* the walk's own state — one page of possibilities at a time */
  const [posts, setPosts] = useState<RealmPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootedRef = useRef(false);

  /* the stage — the snap container and the slide it stands on */
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  /* per-post hands — resonance, saves, echoes */
  const [resonating, setResonating] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [echoFor, setEchoFor] = useState<string | null>(null);
  const [echoDraft, setEchoDraft] = useState("");
  const [echoSending, setEchoSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  /* the radio — the realm's own quiet music door */
  const [radioOpen, setRadioOpen] = useState(false);

  /* --------------------------- the reader --------------------------- */
  const read = useCallback(
    async (fresh: boolean) => {
      if (loading) return;
      if (!fresh && !hasMore) return;
      setLoading(true);
      if (fresh) setError(null);
      try {
        /* the whole hall's stream — every work the house holds, the
           newest first: the realm is the platform's creations walked
           one full screen at a time, not one kind's shelf */
        const params = new URLSearchParams({ tab: "latest", take: "12" });
        if (!fresh && cursor) params.set("cursor", cursor);
        const data = await netFetch<{ posts: RealmPost[]; nextCursor: string | null }>(
          `/api/gathering?${params.toString()}`
        );
        setPosts((prev) => {
          if (fresh) {
            setIndex(0);
            return data.posts;
          }
          /* never let the same work stand twice on the stage */
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.posts.filter((p) => !seen.has(p.id))];
        });
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("The realm could not be reached."));
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, cursor, t]
  );

  useEffect(() => {
    if (!active || bootedRef.current) return;
    bootedRef.current = true;
    void read(true);
  }, [active, read]);

  /* ------------------------- the walk's ear -------------------------
     the stage reports which slide stands; near the horizon the
     reader pours the next page without a button. */
  const onStageScroll = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || posts.length === 0) return;
    const i = Math.min(
      posts.length - 1,
      Math.max(0, Math.round(stage.scrollTop / stage.clientHeight))
    );
    if (i !== indexRef.current) setIndex(i);
    if (i >= posts.length - 3 && hasMore && !loading) void read(false);
  }, [posts.length, hasMore, loading, read]);

  /* the walk by keys — the desktop's quiet arrows */
  const walk = useCallback((dir: 1 | -1) => {
    const stage = stageRef.current;
    if (!stage) return;
    const next = Math.min(posts.length - 1, Math.max(0, indexRef.current + dir));
    stage.scrollTo({ top: next * stage.clientHeight, behavior: "smooth" });
  }, [posts.length]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); walk(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); walk(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, walk]);

  /* --------------------------- the hands ---------------------------- */
  const resonate = useCallback(async (post: RealmPost) => {
    if (resonating.has(post.id)) return;
    setResonating((s) => new Set(s).add(post.id));
    const undo = () => setResonating((s) => { const n = new Set(s); n.delete(post.id); return n; });
    try {
      const data = await netFetch<{ resonated: boolean; resonanceCount: number }>(
        `/api/gathering/${post.id}/resonate`,
        { method: "POST" }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, resonated: data.resonated, resonanceCount: data.resonanceCount }
            : p
        )
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : t("The resonance could not land."));
      window.setTimeout(() => setNote(null), 2600);
      undo();
    }
  }, [resonating, t]);

  const save = useCallback(async (post: RealmPost) => {
    if (saving.has(post.id)) return;
    setSaving((s) => new Set(s).add(post.id));
    const undo = () => setSaving((s) => { const n = new Set(s); n.delete(post.id); return n; });
    try {
      const data = await netFetch<{ bookmarked: boolean; savedCount: number }>(
        "/api/network/bookmarks",
        { method: "POST", body: { postId: post.id } }
      );
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, bookmarked: data.bookmarked } : p)));
    } catch (err) {
      setNote(err instanceof Error ? err.message : t("The shelf could not keep it."));
      window.setTimeout(() => setNote(null), 2600);
      undo();
    }
  }, [saving, t]);

  const share = useCallback(async (post: RealmPost) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/?room=gathering` : "https://www.reflectme.space/?room=gathering";
    const text = `${post.title || t("A possibility from the Gathering")} — ${t("ReflectMe")}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} — ${url}`);
      setNote(t("The hall's address rides with you — copied."));
      window.setTimeout(() => setNote(null), 2400);
    } catch {
      /* a refused share is a quiet no */
    }
  }, [t]);

  const sendEcho = useCallback(async () => {
    const postId = echoFor;
    const body = echoDraft.trim();
    if (!postId || !body || echoSending) return;
    setEchoSending(true);
    try {
      const data = await netFetch<{ echo: GatheringEcho; echoCount: number }>(
        `/api/gathering/${postId}/echoes`,
        { method: "POST", body: { body } }
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, echoCount: data.echoCount } : p))
      );
      setEchoDraft("");
      setEchoFor(null);
      setNote(t("Your echo was spoken into the hall."));
      window.setTimeout(() => setNote(null), 2400);
    } catch (err) {
      setNote(err instanceof Error ? err.message : t("The echo could not travel."));
      window.setTimeout(() => setNote(null), 2600);
    } finally {
      setEchoSending(false);
    }
  }, [echoFor, echoDraft, echoSending, t]);

  const pour = useCallback(() => {
    setCursor(null);
    setHasMore(true);
    void read(true);
  }, [read]);

  /* the empty realm — honest, with one quiet door */
  const emptyRealm = !loading && posts.length === 0 && !error;

  /* the slides' media — remembered once per post */
  const media = useMemo(() => {
    const map = new Map<string, { url: string; type: string | null }>();
    for (const p of posts) {
      if (p.mediaUrl) map.set(p.id, { url: p.mediaUrl, type: p.mediaType ?? null });
    }
    return map;
  }, [posts]);

  if (typeof document === "undefined") return null;

  return (
    <div
      role="region"
      aria-label={t("The possibilities realm")}
      data-testid="possibilities-realm"
      className="relative h-full overflow-hidden"
    >
      {/* ------------------------- the stage ------------------------- */}
      <div
        ref={stageRef}
        onScroll={onStageScroll}
        data-testid="possibilities-stage"
        className="nice-scroll h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
        style={{ scrollbarWidth: "none" }}
      >
        {loading && posts.length === 0 && (
          <div className="flex h-full items-center justify-center" style={{ background: FALLBACK_WASH }}>
            <p className="flex items-center gap-2 text-[13px] text-[#d3c39c]">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("The possibilities gather…")}
            </p>
          </div>
        )}

        {error && posts.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center" style={{ background: FALLBACK_WASH }}>
            <p className="max-w-[320px] text-[13.5px] leading-relaxed text-[#d3c39c]">{error}</p>
            <button type="button" onClick={pour} className="rounded-full border border-[#cbb98d]/50 px-4 py-2 text-[12px] font-semibold text-[#e4d9bd] transition-colors duration-300 hover:border-[#cbb98d]">
              {t("Reach again")}
            </button>
          </div>
        )}

        {emptyRealm && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center" style={{ background: FALLBACK_WASH }}>
            <Sparkles className="size-7 text-[#a2947c]" aria-hidden="true" />
            <p className="mono-label text-[9px] uppercase tracking-[0.26em] text-[#a2947c]">
              {t("the realm rests")}
            </p>
            <p className="max-w-[340px] text-[13.5px] leading-relaxed text-[#d3c39c]">
              {t("No possibilities hang yet — the first published work will open this realm. The hall's stream still breathes below.")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={pour}
                data-testid="possibilities-repour"
                className="rounded-full border border-[#cbb98d]/50 px-4 py-2 text-[12px] font-semibold text-[#e4d9bd] transition-colors duration-300 hover:border-[#cbb98d]"
              >
                {t("Pour again")}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("gathering")}
                className="rounded-full border border-[#cbb98d]/50 px-4 py-2 text-[12px] font-semibold text-[#e4d9bd] transition-colors duration-300 hover:border-[#cbb98d]"
              >
                {t("Open the Pulse")}
              </button>
            </div>
          </div>
        )}

        {posts.map((post, i) => {
          const kind = (post.kind as GatheringKind) in KIND_META ? (post.kind as GatheringKind) : null;
          const KIcon = kind ? KIND_META[kind].icon : Sparkles;
          const accent = kind ? KIND_META[kind].accent : "#a2947c";
          const m = media.get(post.id);
          const isVideo = m?.type === "video";
          return (
            <article
              key={post.id}
              data-testid={`possibilities-slide-${i}`}
              aria-label={post.title || t("A possibility")}
              className="relative flex h-full w-full snap-start snap-always flex-col overflow-hidden"
              style={{ background: washFor(post.kind) }}
            >
              {/* the media's own sky — a picture breathes behind the words */}
              {m && !isVideo && (
                <div aria-hidden="true" className="absolute inset-0">
                  <img
                    src={m.url}
                    alt=""
                    loading={i <= 1 ? "eager" : "lazy"}
                    className="h-full w-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(8,6,3,0.25) 0%,rgba(8,6,3,0.62) 55%,rgba(8,6,3,0.88) 100%)" }} />
                </div>
              )}

              {/* the walk's hands — the quiet rail at the right edge */}
              <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1">
                <RealmAction
                  label={post.resonated ? t("Resonated") : t("Resonate")}
                  count={post.resonanceCount}
                  active={post.resonated}
                  onClick={() => void resonate(post)}
                  testId={`possibilities-resonate-${post.id}`}
                  icon={<Heart className={cn("size-5", post.resonated && "fill-current")} aria-hidden="true" />}
                />
                <RealmAction
                  label={t("Echo")}
                  count={post.echoCount}
                  onClick={() => setEchoFor(echoFor === post.id ? null : post.id)}
                  testId={`possibilities-echo-${post.id}`}
                  icon={<MessagesSquare className="size-5" aria-hidden="true" />}
                />
                <RealmAction
                  label={post.bookmarked ? t("Kept") : t("Keep")}
                  count={undefined}
                  active={post.bookmarked}
                  onClick={() => void save(post)}
                  testId={`possibilities-save-${post.id}`}
                  icon={post.bookmarked ? <BookmarkCheck className="size-5" aria-hidden="true" /> : <Bookmark className="size-5" aria-hidden="true" />}
                />
                <RealmAction
                  label={t("Share")}
                  count={undefined}
                  onClick={() => void share(post)}
                  testId={`possibilities-share-${post.id}`}
                  icon={<Share2 className="size-5" aria-hidden="true" />}
                />
              </div>

              {/* the work itself — the words stand low-left, TikTok-true */}
              <div className="relative z-10 mt-auto flex max-w-[calc(100%-4.5rem)] flex-col gap-2.5 px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+5.25rem))] pt-8 sm:px-6 lg:mx-auto lg:w-full lg:max-w-[560px] lg:pb-24">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ borderColor: `${accent}55`, color: accent, background: "rgba(8,6,3,0.45)" }}
                  >
                    <KIcon className="size-3" aria-hidden="true" />
                    {kind ? t(KIND_OFFERING_LABEL[kind]) : t("A possibility")}
                  </span>
                  {post.epistemic && <EvidenceChipDark level={post.epistemic} />}
                  {regionLabel(post.region) && (
                    <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] text-[#cbb98d]" style={{ background: "rgba(8,6,3,0.45)" }}>
                      {regionLabel(post.region)}
                    </span>
                  )}
                </div>

                {post.title && (
                  <h2
                    data-testid="possibilities-title"
                    className="text-balance text-[19px] font-semibold leading-snug text-[#f4ecda] sm:text-[22px]"
                    style={{ textShadow: "0 2px 18px rgba(0,0,0,0.5)" }}
                  >
                    {post.title}
                  </h2>
                )}

                <p
                  className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#e4d9bd]/92"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 7,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textShadow: "0 1px 12px rgba(0,0,0,0.45)",
                  }}
                >
                  {post.body}
                </p>

                {/* the maker's row */}
                <div className="mt-1 flex items-center gap-2.5">
                  <MakerMark name={post.author.name} size={30} />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-[#f0e7cd]">
                      {post.author.name}
                    </p>
                    <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-[#a2947c]">
                      {relativeTime(post.createdAt, t)}
                      {post.circle ? ` · ${post.circle.name}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate("gathering")}
                    data-testid={`possibilities-open-${post.id}`}
                    className="ml-auto shrink-0 rounded-full border border-[#cbb98d]/45 px-3.5 py-1.5 text-[11px] font-semibold text-[#e4d9bd] transition-colors duration-300 hover:border-[#cbb98d] hover:text-[#f4ecda]"
                  >
                    {t("Open in the hall")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {/* the horizon — the walk's own end */}
        {posts.length > 0 && !hasMore && (
          <div className="flex h-full w-full snap-start snap-always flex-col items-center justify-center gap-4 px-8 text-center" style={{ background: FALLBACK_WASH }}>
            <Sparkles className="size-6 text-[#a2947c]" aria-hidden="true" />
            <p className="mono-label text-[9px] uppercase tracking-[0.26em] text-[#a2947c]">
              {t("today's horizon")}
            </p>
            <p className="max-w-[320px] text-[13px] leading-relaxed text-[#d3c39c]">
              {t("The possibilities rest — publish a work in the hall and the realm grows.")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={pour}
                className="rounded-full border border-[#cbb98d]/50 px-4 py-2 text-[12px] font-semibold text-[#e4d9bd] transition-colors duration-300 hover:border-[#cbb98d]"
              >
                {t("Pour again")}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("gathering")}
                className="rounded-full border border-[#cbb98d]/50 px-4 py-2 text-[12px] font-semibold text-[#e4d9bd] transition-colors duration-300 hover:border-[#cbb98d]"
              >
                {t("Open the Pulse")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* the walk's measure — one thin breath of where you stand, at
          the stage's left edge so it never crowds the hands */}
      {posts.length > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 hidden h-24 w-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 lg:block"
        >
          <span
            className="block w-full rounded-full bg-[#d3c39c] transition-all duration-300"
            style={{ height: `${100 / posts.length}%`, transform: `translateY(${index * 100}%)` }}
          />
        </div>
      )}

      {/* the realm's own music — the frequency radio, lifted above the streets */}
      {radioOpen && (
        <div className="absolute inset-x-0 bottom-[64px] z-30">
          <GatheringRadio onClose={() => setRadioOpen(false)} />
        </div>
      )}

      {/* the radio's small door — rides the realm's top-right, a hand not a crown */}
      <button
        type="button"
        onClick={() => setRadioOpen((v) => !v)}
        aria-label={t("The frequency radio")}
        title={t("The frequency radio")}
        aria-pressed={radioOpen}
        data-testid="possibilities-radio"
        className="absolute right-3 top-2 z-30 flex size-9 items-center justify-center rounded-full border border-white/15 text-[#cbb98d] transition-all duration-300 hover:border-[#cbb98d]/60 hover:text-[#f4ecda]"
        style={{ top: "max(0.5rem, env(safe-area-inset-top))", background: "rgba(8,6,3,0.5)" }}
      >
        <Music4 className="size-4" aria-hidden="true" />
      </button>

      {/* ---------------------- the echo's sheet ---------------------- */}
      {echoFor && (
        <EchoSheet
          onClose={() => setEchoFor(null)}
          draft={echoDraft}
          onDraft={setEchoDraft}
          onSend={() => void sendEcho()}
          sending={echoSending}
        />
      )}

      {/* the quiet note — one honest line above the streets */}
      {note && (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-0 bottom-[76px] z-40 flex justify-center px-4"
        >
          <p className="rounded-full border border-[#cbb98d]/45 px-4 py-2 text-[12px] font-medium text-[#f0e7cd]" style={{ background: "rgba(8,6,3,0.82)" }}>
            {note}
          </p>
        </div>
      )}

      {/* the loading breath while the next page pours */}
      {loading && posts.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[70px] z-20 flex justify-center">
          <Loader2 className="size-4 animate-spin text-[#a2947c]" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/* ------------------------- the small hands ------------------------- */

function RealmAction({
  icon,
  label,
  count,
  active,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      data-testid={testId}
      className="flex flex-col items-center gap-0.5 rounded-full px-1.5 py-1.5 transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full border text-[#e4d9bd] transition-colors duration-300",
          active ? "border-[#cbb98d]/70 text-[#f0e7cd]" : "border-white/15"
        )}
        style={{ background: "rgba(8,6,3,0.5)" }}
      >
        {icon}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-semibold tabular-nums text-[#cbb98d]">{count}</span>
      )}
    </button>
  );
}

function EvidenceChipDark({ level }: { level: string }) {
  const label = (EVIDENCE_LABEL as Record<string, string>)[level];
  if (!label) return null;
  return (
    <span
      className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-medium text-[#d3c39c]"
      style={{ background: "rgba(8,6,3,0.45)" }}
    >
      {label}
    </span>
  );
}

/* THE ECHO'S SHEET — an opaque reading surface by law: no glass, no
   translucency anywhere words are written. The sheet stands above the
   stage, the scroll behind rests. */
function EchoSheet({
  onClose,
  draft,
  onDraft,
  onSend,
  sending,
}: {
  onClose: () => void;
  draft: string;
  onDraft: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  const t = useT();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Speak an echo")}
      data-testid="possibilities-echo-sheet"
      className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] border-t border-[#cbb98d]/40 bg-[#171207] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_48px_-20px_rgba(0,0,0,0.8)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#a2947c]">
          {t("speak an echo")}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close")}
          className="flex size-8 items-center justify-center rounded-full border border-white/15 text-[#cbb98d] transition-colors duration-300 hover:border-[#cbb98d]/60"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder={t("Your echo joins the work…")}
        aria-label={t("Your echo")}
        data-testid="possibilities-echo-input"
        className={cn(GP_INPUT, "min-h-[76px] resize-none border-[#cbb98d]/40 bg-[#211a0d] text-[#f0e7cd] placeholder:text-[#8a7c64] focus:border-[#cbb98d]")}
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10.5px] text-[#8a7c64]">{draft.length}/600</p>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !draft.trim()}
          data-testid="possibilities-echo-send"
          className="flex items-center gap-1.5 rounded-full bg-[#d3c39c] px-4 py-2 text-[12px] font-semibold text-[#171207] transition-all duration-300 hover:bg-[#e4d9bd] disabled:opacity-45"
        >
          {sending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Send className="size-3.5" aria-hidden="true" />}
          {t("Speak")}
        </button>
      </div>
    </div>
  );
}
