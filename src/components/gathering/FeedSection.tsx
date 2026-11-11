"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Film,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  Send,
  Trash2,
  User,
  Waves,
  Feather,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import ComposerForm from "./ComposerForm";
import {
  KIND_META,
  KIND_OFFERING_LABEL,
  KIND_FILTER_LABEL,
  KIND_ORDER,
  type GatheringPost,
  type GatheringEcho,
  type CircleCard,
  GP_HAND,
  GP_GHOST,
  EmptyRoom,
  RoomLabel,
  MakerMark,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE GATHERING HOME — the living community stream.                  */
/*                                                                     */
/*  THE FIRST SCREEN'S THREE HANDS — share a reflection, share a       */
/*  creation, meet someone: the three natural doors of the network.    */
/*                                                                     */
/*  THE FUSION, walked in the hall's own way:                          */
/*    · THE GALLERY — a porcelain wall of offerings (the living grid);  */
/*    · THE STREAM — one offering at a time, the whole cloth given     */
/*      to it, the visitor's hand turning the pages vertically;        */
/*    · MINE — the visitor's own hanging wall.                         */
/*                                                                     */
/*  THE MANNERS (unchanged): every offering keeps its maker's name;    */
/*  resonance is a tuning, not a trophy; an echo is a response, not    */
/*  a comment section; nothing is ranked — the hall reads newest.      */
/* ------------------------------------------------------------------ */

/* =============== THE FEED READER — one honest reader =============== */
function useGatheringFeed(mine: boolean, circleId: string | null) {
  const [posts, setPosts] = useState<GatheringPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const mineRef = useRef(mine);
  const circleRef = useRef(circleId);
  mineRef.current = mine;
  circleRef.current = circleId;

  const read = useCallback(
    async (opts: { fresh?: boolean; kind?: string | null; q?: string | null } = {}) => {
      const fresh = opts.fresh ?? false;
      if (!fresh && !hasMoreRef.current) return;
      if (fresh) {
        setLoading(true);
        setError(false);
      } else {
        setLoadingMore(true);
      }
      try {
        const params = new URLSearchParams();
        if (mineRef.current) params.set("mine", "1");
        if (circleRef.current) params.set("circle", circleRef.current);
        if (opts.kind) params.set("kind", opts.kind);
        if (opts.q) params.set("q", opts.q);
        if (!fresh && cursorRef.current) params.set("cursor", cursorRef.current);
        const data = await netFetch<{ posts: GatheringPost[]; nextCursor: string | null }>(
          `/api/gathering?${params.toString()}`
        );
        cursorRef.current = data.nextCursor;
        hasMoreRef.current = data.nextCursor !== null;
        setHasMore(hasMoreRef.current);
        setPosts((prev) => (fresh ? data.posts : [...prev, ...data.posts]));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const rekindle = useCallback(
    (opts?: { kind?: string | null; q?: string | null }) => {
      cursorRef.current = null;
      hasMoreRef.current = false;
      void read({ fresh: true, kind: opts?.kind ?? null, q: opts?.q ?? null });
    },
    [read]
  );

  return { posts, setPosts, loading, loadingMore, error, hasMore, read, rekindle };
}

/* =============== THE OFFERING TILE — the gallery's card =============== */
function OfferingTile({
  post,
  onOpen,
  onResonate,
  onTakeBack,
  armedId,
  setArmedId,
}: {
  post: GatheringPost;
  onOpen: () => void;
  onResonate: () => void;
  onTakeBack: () => void;
  armedId: string | null;
  setArmedId: (id: string | null) => void;
}) {
  const t = useT();
  const kind = (KIND_META as Record<string, unknown>)[post.kind]
    ? (post.kind as keyof typeof KIND_META)
    : "reflection";
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const armed = armedId === post.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={post.title}
      data-testid="gp-tile"
      className="gp-card gp-card-hover focus-glow group flex cursor-pointer flex-col rounded-[24px] p-4 outline-none sm:rounded-[26px] sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-[12px] border border-white/90"
          style={{
            background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
          }}
        >
          <Icon className="size-4" style={{ color: meta.accent }} />
        </span>
        {post.mine && (
          <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
            {t("you")}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
        {post.title}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
        {post.body}
      </p>
      {post.mediaUrl && post.mediaType === "image" && (
        <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#e8dfc9]">
          { }
          <img
            src={post.mediaUrl}
            alt={post.title}
            loading="lazy"
            className="h-36 w-full object-cover"
          />
        </div>
      )}
      {post.mediaUrl && post.mediaType === "video" && (
        <div className="mt-2.5 flex items-center gap-2 rounded-[14px] border border-[#e8dfc9] bg-white/60 px-3 py-2">
          <Film className="size-4 text-[#0d9488]" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-[#5c5344]">
            {t("A film travels with this offering")}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <MakerMark name={post.author.name} size={26} />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#5c5344]">
              {post.author.name}
            </p>
            <p className="text-[10px] text-[#a2947c]">{relativeTime(post.createdAt, t)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 text-[#a2947c]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResonate();
            }}
            aria-pressed={post.resonated}
            aria-label={t("Resonate with this offering")}
            title={t("Resonate with this offering")}
            className={cn(
              "focus-glow flex items-center gap-1 rounded-full px-1 py-0.5 text-[11px] font-semibold transition-colors duration-300",
              post.resonated ? "text-[#a16207]" : "hover:text-[#8a6f46]"
            )}
          >
            <Waves
              className={cn("size-3.5", post.resonated && "fill-[#a16207]/20")}
              aria-hidden="true"
            />
            {post.resonanceCount}
          </button>
          <span
            aria-label={t("Echoes")}
            title={t("Echoes")}
            className="flex items-center gap-1 text-[11px] font-semibold"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {post.echoCount}
          </span>
          {post.mine && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setArmedId(armed ? null : post.id);
              }}
              aria-label={t("Take this offering back")}
              title={t("Take this offering back")}
              className={cn(
                "focus-glow rounded-full p-1 transition-colors duration-300",
                armed ? "bg-[#b45309]/12 text-[#b45309]" : "text-[#a2947c] hover:text-[#b45309]"
              )}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {armed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTakeBack();
            setArmedId(null);
          }}
          className="focus-glow mt-3 rounded-full border border-[#b45309]/30 bg-[#b45309]/8 px-3 py-1.5 text-[11px] font-semibold text-[#b45309] transition-colors duration-300 hover:bg-[#b45309]/14"
        >
          {t("Take this offering back")}
        </button>
      )}
    </div>
  );
}

/* =============== THE STREAM SLIDE — one offering, whole cloth =============== */
function StreamSlide({
  post,
  onResonate,
  onEcho,
  onTakeBack,
  strikeId,
  armedId,
  setArmedId,
  onWeave,
  onLibrary,
}: {
  post: GatheringPost;
  onResonate: () => void;
  onEcho: () => void;
  onTakeBack: () => void;
  strikeId: string | null;
  armedId: string | null;
  setArmedId: (id: string | null) => void;
  onWeave: (post: GatheringPost) => void;
  onLibrary: (post: GatheringPost) => void;
}) {
  const t = useT();
  const kind = (KIND_META as Record<string, unknown>)[post.kind]
    ? (post.kind as keyof typeof KIND_META)
    : "reflection";
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const armed = armedId === post.id;

  return (
    <div className="gp-slide flex h-full w-full items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
      <div className="gp-card relative flex max-h-full w-full max-w-[600px] flex-col overflow-hidden rounded-[28px] sm:rounded-[34px]">
        <div className="flex items-center justify-between gap-3 border-b border-[#eadfca]/60 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-white/90"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
              }}
            >
              <Icon className="size-5" style={{ color: meta.accent }} />
            </span>
            <div className="flex min-w-0 items-center gap-2.5">
              <MakerMark name={post.author.name} />
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold text-[#5c5344]">
                  {post.author.name}
                </p>
                <p className="text-[10.5px] text-[#a2947c]">
                  {relativeTime(post.createdAt, t)}
                  {post.circle ? ` · ${post.circle.name}` : post.sector ? ` · ${post.sector}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="font-[family-name:var(--font-literata)] text-[19px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere] sm:text-[22px]">
            {post.title}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.85] text-[#5c5344] [overflow-wrap:anywhere] sm:text-[15px]">
            {post.body}
          </p>
          {post.mediaUrl && (
            <div className="mt-4">
              {post.mediaType === "video" ? (
                <video
                  src={post.mediaUrl}
                  controls
                  preload="metadata"
                  className="max-h-[380px] w-full rounded-[18px] border border-[#e8dfc9] bg-black object-contain"
                />
              ) : (
                 
                <img
                  src={post.mediaUrl}
                  alt={post.title}
                  className="max-h-[420px] w-full rounded-[18px] border border-[#e8dfc9] object-cover"
                />
              )}
            </div>
          )}
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#e8dfc9] bg-white/60 px-2.5 py-0.5 text-[10.5px] font-semibold text-[#8a6f46]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* the action rail — resonance, echoes, weave, library */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#eadfca]/60 px-4 py-3 sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={onResonate}
            aria-pressed={post.resonated}
            aria-label={t("Resonate with this offering")}
            title={t("Resonate with this offering")}
            className={cn(
              "focus-glow flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-all duration-300",
              post.resonated
                ? "border-[#a16207]/45 bg-[#a16207]/10 text-[#a16207]"
                : "border-[#e4d9bd] bg-white/70 text-[#7c715f] hover:border-[#d3c39c] hover:text-[#8a6f46]"
            )}
          >
            <Waves
              className={cn(
                "size-4",
                strikeId === post.id && "gp-strike",
                post.resonated && "fill-[#a16207]/20"
              )}
              aria-hidden="true"
            />
            {post.resonanceCount}
          </button>
          <button
            type="button"
            onClick={onEcho}
            aria-label={t("Echoes")}
            title={t("Echoes")}
            className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#8a6f46]"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            {post.echoCount}
          </button>
          <button
            type="button"
            onClick={() => onWeave(post)}
            aria-label={t("Weave this together")}
            title={t("Weave this together")}
            className="focus-glow hidden items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 p-2 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#8a6f46] sm:flex"
          >
            <Users className="size-4" aria-hidden="true" />
          </button>
          {post.mine && (
            <button
              type="button"
              onClick={() => onLibrary(post)}
              aria-label={t("Place in the Library")}
              title={t("Place in the Library")}
              className="focus-glow hidden items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 p-2 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#8a6f46] sm:flex"
            >
              <Sparkles className="size-4" aria-hidden="true" />
            </button>
          )}
          <div className="flex-1" />
          {post.mine && (
            <button
              type="button"
              onClick={() => {
                if (armed) {
                  onTakeBack();
                  setArmedId(null);
                } else {
                  setArmedId(post.id);
                }
              }}
              aria-label={t("Take this offering back")}
              title={t("Take this offering back")}
              className={cn(
                "focus-glow flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-all duration-300",
                armed
                  ? "border-[#b45309]/45 bg-[#b45309]/10 text-[#b45309]"
                  : "border-[#e4d9bd] bg-white/70 text-[#7c715f] hover:border-[#d3c39c] hover:text-[#b45309]"
              )}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {armed ? t("Take this offering back") : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =============== THE ECHO SHEET =============== */
function EchoSheet({
  post,
  onClose,
  onCount,
}: {
  post: GatheringPost;
  onClose: () => void;
  onCount: (id: string, n: number) => void;
}) {
  const t = useT();
  const [echoes, setEchoes] = useState<GatheringEcho[] | null>(null);
  const [error, setError] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ echoes: GatheringEcho[] }>(
          `/api/gathering/${post.id}/echoes`
        );
        if (alive) setEchoes(data.echoes);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [post.id]);

  const speak = useCallback(async () => {
    const text = body.trim();
    if (text.length < 2 || sending) return;
    setSending(true);
    setError(false);
    try {
      const data = await netFetch<{ echo: GatheringEcho; echoCount: number }>(
        `/api/gathering/${post.id}/echoes`,
        { method: "POST", body: { body: text } }
      );
      setEchoes((prev) => [...(prev ?? []), data.echo]);
      onCount(post.id, data.echoCount);
      setBody("");
    } catch {
      setError(true);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [body, sending, post.id, onCount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={t("Echoes")}
    >
      <button
        type="button"
        aria-label={t("fold the offering")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#3d3428]/25"
        tabIndex={-1}
      />
      <motion.div
        initial={{ y: "40%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "30%", opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="gp-glass relative flex max-h-[78%] flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[600px] sm:rounded-t-[32px]"
      >
        <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
          <RoomLabel>{t("Echoes")}</RoomLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("fold the offering")}
            className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
          >
            <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
          </button>
        </div>

        <div className="gp-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-7">
          {echoes === null && !error && (
            <p className="py-8 text-center text-[13px] text-[#a2947c]">
              {t("The echoes arrive…")}
            </p>
          )}
          {echoes !== null && echoes.length === 0 && (
            <p className="py-8 text-center text-[13px] text-[#a2947c]">
              {t("No echoes yet — speak the first response.")}
            </p>
          )}
          {echoes?.map((e) => (
            <div key={e.id} className="gp-card rounded-[18px] px-4 py-3">
              <div className="flex items-center gap-2">
                <MakerMark name={e.author.name} size={22} />
                <p className="text-[11.5px] font-semibold text-[#5c5344]">{e.author.name}</p>
                <p className="text-[10px] text-[#a2947c]">{relativeTime(e.createdAt, t)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.7] text-[#4c4436] [overflow-wrap:anywhere]">
                {e.body}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-[#eadfca]/70 px-4 py-3 sm:px-6">
          {error && (
            <p className="pb-2 text-center text-[11.5px] text-[#b45309]">
              {t("The echo could not be spoken.")}
            </p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void speak();
                }
              }}
              rows={2}
              maxLength={600}
              placeholder={t("Speak an echo — a calm response…")}
              aria-label={t("Speak an echo — a calm response…")}
              className="gp-scroll max-h-28 min-h-[44px] flex-1 resize-none rounded-[16px] border border-[#e4d9bd] bg-white/80 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
            />
            <button
              type="button"
              onClick={() => void speak()}
              disabled={sending || body.trim().length < 2}
              aria-label={t("Speak the echo")}
              title={t("Speak the echo")}
              className={cn(GP_HAND, "size-11 px-0 py-0")}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =============== THE COMPOSER SHEET — the offering line, worn as a sheet =============== */
function ComposerSheet({
  initialKind,
  circles,
  onClose,
  onHung,
}: {
  initialKind: string;
  circles: CircleCard[];
  onClose: () => void;
  onHung: (post: GatheringPost) => void;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("The offering line")}
    >
      <button
        type="button"
        aria-label={t("Keep shaping")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#3d3428]/25"
        tabIndex={-1}
      />
      <motion.div
        initial={{ y: "40%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "30%", opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="gp-glass relative flex max-h-[92%] flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[620px] sm:rounded-[30px]"
      >
        <div className="flex items-center justify-between px-5 pt-4 sm:px-7 sm:pt-5">
          <RoomLabel>{t("The offering line")}</RoomLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Keep shaping")}
            className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
          >
            <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
          </button>
        </div>
        <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
          <ComposerForm initialKind={initialKind} circles={circles} onHung={onHung} compact />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FeedSection({
  active,
  circles,
  onMeetSomeone,
  onPublishWork,
  onWeaveFrom,
  onLibraryFrom,
}: {
  active: boolean;
  circles: CircleCard[];
  onMeetSomeone: () => void;
  onPublishWork: () => void;
  onWeaveFrom: (post: GatheringPost) => void;
  onLibraryFrom: (post: GatheringPost) => void;
}) {
  const t = useT();
  const [view, setView] = useState<"gallery" | "stream" | "mine">("gallery");
  const [kind, setKind] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<string>("reflection");
  const [echoPost, setEchoPost] = useState<GatheringPost | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [strikeId, setStrikeId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const hall = useGatheringFeed(false, null);
  const mine = useGatheringFeed(true, null);

  /* the section's first breath reads the hall */
  useEffect(() => {
    if (!active) return;
    if (hall.posts.length === 0 && !hall.error) void hall.read({ fresh: true, kind: null });
    if (mine.posts.length === 0 && !mine.error && !mine.loading) void mine.read({ fresh: true, kind: null });
    /* the first breath alone — the feeds re-read themselves on demand */
  }, [active, hall, mine]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(id);
  }, [note]);

  const chooseKind = useCallback(
    (k: string | null) => {
      setKind(k);
      hall.rekindle({ kind: k });
    },
    [hall]
  );

  const resonate = useCallback(
    async (post: GatheringPost) => {
      const wasOn = post.resonated;
      const write = (mutate: (p: GatheringPost) => GatheringPost) => {
        hall.setPosts((prev) => prev.map((p) => (p.id === post.id ? mutate(p) : p)));
        mine.setPosts((prev) => prev.map((p) => (p.id === post.id ? mutate(p) : p)));
      };
      write((p) => ({
        ...p,
        resonated: !wasOn,
        resonanceCount: p.resonanceCount + (wasOn ? -1 : 1),
      }));
      setStrikeId(post.id);
      window.setTimeout(() => setStrikeId(null), 550);
      try {
        const data = await netFetch<{ resonated: boolean; resonanceCount: number }>(
          `/api/gathering/${post.id}/resonate`,
          { method: "POST" }
        );
        write((p) => ({ ...p, resonated: data.resonated, resonanceCount: data.resonanceCount }));
      } catch {
        write((p) => ({ ...p, resonated: wasOn, resonanceCount: post.resonanceCount }));
      }
    },
    [hall, mine]
  );

  const takeBack = useCallback(
    async (post: GatheringPost) => {
      try {
        await netFetch(`/api/gathering/${post.id}`, { method: "DELETE" });
        hall.setPosts((prev) => prev.filter((p) => p.id !== post.id));
        mine.setPosts((prev) => prev.filter((p) => p.id !== post.id));
      } catch {
        /* a fold that could not land leaves the hall as it was */
      }
    },
    [hall, mine]
  );

  const onHung = useCallback(
    (post: GatheringPost) => {
      if (!post.circle) hall.setPosts((prev) => [post, ...prev]);
      mine.setPosts((prev) => [post, ...prev]);
      setComposerOpen(false);
      setNote(t("Your offering now hangs in the hall."));
      setView("gallery");
    },
    [hall, mine, t]
  );

  const onEchoCount = useCallback(
    (id: string, n: number) => {
      const bump = (prev: GatheringPost[]) =>
        prev.map((p) => (p.id === id ? { ...p, echoCount: n } : p));
      hall.setPosts(bump);
      mine.setPosts(bump);
      setEchoPost((cur) => (cur && cur.id === id ? { ...cur, echoCount: n } : cur));
    },
    [hall, mine]
  );

  const openComposer = useCallback((k: string) => {
    setComposerKind(k);
    setComposerOpen(true);
  }, []);

  const streamIndexRef = useRef(0);
  const streamRef = useRef<HTMLDivElement>(null);
  const openInStream = useCallback((index: number) => {
    streamIndexRef.current = index;
    setView("stream");
  }, []);

  useEffect(() => {
    if (view !== "stream") return;
    const el = streamRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(
      `[data-slide-index="${streamIndexRef.current}"]`
    );
    if (target) el.scrollTo({ top: target.offsetTop, behavior: "auto" });
    streamIndexRef.current = 0;
  }, [view]);

  const views: Array<{ key: "gallery" | "stream" | "mine"; label: string; icon: LucideIcon }> =
    useMemo(
      () => [
        { key: "gallery", label: "Gallery", icon: LayoutGrid },
        { key: "stream", label: "Stream", icon: Play },
        { key: "mine", label: "My offerings", icon: User },
      ],
      []
    );

  /* THE THREE HANDS — the first screen's natural doors.
     The second hand publishes: creation itself stays in the house's
     rooms (ArtX, Music, Book, HyperX, a transmission's line) — the
     hall carries finished works, it does not make them. */
  const threeHands: Array<{ key: string; label: string; icon: LucideIcon; run: () => void }> = [
    { key: "reflection", label: "Share a reflection", icon: Feather, run: () => openComposer("reflection") },
    { key: "creation", label: "Publish a work", icon: Sparkles, run: onPublishWork },
    { key: "meet", label: "Meet someone", icon: Users, run: onMeetSomeone },
  ];

  const feedList = view === "mine" ? mine : hall;

  return (
    <div className="relative h-full">
      {/* ---------- the three hands — small icon circles, learned once ---------- */}
      <div className="mx-auto w-full max-w-[1200px] px-3 pt-3 sm:px-6 sm:pt-4" data-testid="gathering-three-hands">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {threeHands.map(({ key, label, icon: Icon, run }) => (
            <button
              key={key}
              type="button"
              onClick={run}
              aria-label={t(label)}
              title={t(label)}
              data-testid={`gathering-hand-${key}`}
              className="gp-card gp-card-hover focus-glow flex size-10 items-center justify-center rounded-full outline-none"
            >
              <Icon className="size-4 text-[#a16207]" aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* the hall's own segmented pill + intention chips */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label={t("The Gathering")}
            className="gp-seg flex shrink-0 items-center gap-0.5 rounded-full border border-white/80 bg-white/45 p-1"
          >
            {views.map((v) => {
              const VIcon = v.icon;
              const on = view === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setView(v.key)}
                  data-testid={`gp-view-${v.key}`}
                  className={cn(
                    "focus-glow relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-300 sm:px-3.5",
                    on ? "text-[#5c5344]" : "text-[#a2947c] hover:text-[#7c715f]"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="gp-seg-thumb"
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="gp-seg-thumb absolute inset-0 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <VIcon className="relative size-3.5" aria-hidden="true" />
                  <span className="relative hidden sm:inline">{t(v.label)}</span>
                </button>
              );
            })}
          </div>
          <div className="gp-scroll flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => chooseKind(null)}
              aria-pressed={kind === null}
              className={cn(
                "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                kind === null
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              {t("All intentions")}
            </button>
            {KIND_ORDER.map((k) => {
              const m = KIND_META[k];
              const KIcon = m.icon;
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => chooseKind(k)}
                  aria-pressed={on}
                  className={cn(
                    "focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                    on
                      ? "border-[#cbb98d] bg-white text-[#5c5344]"
                      : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                  )}
                >
                  <KIcon className="size-3" style={{ color: m.accent }} aria-hidden="true" />
                  {t(KIND_FILTER_LABEL[k])}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- the rooms ---------- */}
      <div className="gp-scroll h-[calc(100%-124px)] overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
        {view === "stream" ? (
          hall.loading ? (
            <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("The exhibition arrives…")}
            </p>
          ) : hall.posts.length === 0 ? (
            <EmptyRoom
              icon={Play}
              line={t(
                "The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question."
              )}
            />
          ) : (
            <div ref={streamRef} className="gp-stream h-full overflow-hidden" data-testid="gp-stream">
              {hall.posts.map((p, i) => (
                <div key={p.id} data-slide-index={i} className="h-full">
                  <StreamSlide
                    post={p}
                    onResonate={() => void resonate(p)}
                    onEcho={() => setEchoPost(p)}
                    onTakeBack={() => void takeBack(p)}
                    strikeId={strikeId}
                    armedId={armedId}
                    setArmedId={setArmedId}
                    onWeave={onWeaveFrom}
                    onLibrary={onLibraryFrom}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {feedList.loading ? (
              <div className="mx-auto max-w-[1200px]">
                <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("The exhibition arrives…")}
                </p>
              </div>
            ) : feedList.error ? (
              <div className="mx-auto max-w-[1200px] py-24 text-center">
                <p className="text-[13.5px] text-[#b45309]">{t("The hall could not be read.")}</p>
                <button
                  type="button"
                  onClick={() => void feedList.read({ fresh: true, kind })}
                  className={cn(GP_GHOST, "mt-4")}
                >
                  {t("The exhibition continues")}
                </button>
              </div>
            ) : feedList.posts.length === 0 ? (
              <EmptyRoom
                icon={LayoutGrid}
                line={
                  view === "mine"
                    ? t("You have not hung anything yet — the offering line above waits for your first stone.")
                    : t("The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question.")
                }
              />
            ) : (
              <div className="mx-auto max-w-[1200px]">
                <div
                  className={cn(
                    "grid grid-cols-1 gap-4 sm:grid-cols-2",
                    view === "gallery" && "lg:grid-cols-3 xl:grid-cols-4"
                  )}
                >
                  {feedList.posts.map((p, i) => (
                    <OfferingTile
                      key={p.id}
                      post={p}
                      onOpen={() => {
                        if (view === "mine") {
                          const idx = hall.posts.findIndex((x) => x.id === p.id);
                          if (idx >= 0) openInStream(idx);
                          else setView("gallery");
                        } else {
                          openInStream(i);
                        }
                      }}
                      onResonate={() => void resonate(p)}
                      onTakeBack={() => void takeBack(p)}
                      armedId={armedId}
                      setArmedId={setArmedId}
                    />
                  ))}
                </div>
                {feedList.hasMore && (
                  <div className="py-8 text-center">
                    <button
                      type="button"
                      onClick={() => void feedList.read({ kind })}
                      disabled={feedList.loadingMore}
                      className={GP_GHOST}
                    >
                      {feedList.loadingMore && (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      )}
                      {t("The exhibition continues")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------- the offering hand — always within reach ---------- */}
      <button
        type="button"
        onClick={() => openComposer("reflection")}
        aria-label={t("The offering line")}
        title={t("The offering line")}
        data-testid="gathering-portal-offer"
        className="focus-glow gp-pearl absolute bottom-5 right-4 z-10 flex items-center gap-2 rounded-full border border-white/95 py-3 pl-4 pr-5 text-[13px] font-semibold text-[#8a6f46] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.02] sm:bottom-7 sm:right-7"
        style={{
          background: "linear-gradient(150deg,#fffdf8 0%,#f4ebd7 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 14px 30px -12px rgba(122,103,70,0.5), 0 3px 8px -3px rgba(122,103,70,0.3)",
        }}
      >
        <Plus className="size-4" aria-hidden="true" />
        {t("Offer")}
      </button>

      {/* ---------- the quiet note ---------- */}
      <AnimatePresence>
        {note && (
          <motion.div
            key="note"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2"
            role="status"
          >
            <p className="gp-card rounded-full px-5 py-2.5 text-[12.5px] font-medium text-[#5c5344]">
              {note}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- the sheets ---------- */}
      <AnimatePresence>
        {echoPost && (
          <EchoSheet post={echoPost} onClose={() => setEchoPost(null)} onCount={onEchoCount} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {composerOpen && (
          <ComposerSheet
            initialKind={composerKind}
            circles={circles}
            onClose={() => setComposerOpen(false)}
            onHung={onHung}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
