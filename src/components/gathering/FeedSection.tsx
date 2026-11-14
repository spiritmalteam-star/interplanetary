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
  Bookmark,
  BookmarkCheck,
  Clock,
  CornerDownRight,
  Film,
  FlaskConical,
  Flame,
  LayoutGrid,
  Library,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  Repeat2,
  Send,
  Telescope,
  Trash2,
  User,
  Waves,
  Waypoints,
  X,
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
  GP_INPUT,
  EvidenceChip,
  EmptyRoom,
  RoomLabel,
  MakerMark,
  isEvidenceLevel,
  netFetch,
  relativeTime,
  regionLabel,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE FOUR CURRENTS — the hall reads itself four ways: for you,      */
/*  the ones you follow, the newest words, the discoveries.            */
/* ------------------------------------------------------------------ */
type FeedTab = "foryou" | "following" | "latest" | "discoveries";

/* THE ROOMS A WORK CAN GROW INTO — expand into discovery: a question  */
/* becomes a living question, a hypothesis a lab bench, an intention   */
/* a gathered purpose. One sheet, three doors.                         */
type GrowVariant = "questions" | "laboratory" | "intentions";

const GROW_TESTID: Record<GrowVariant, string> = {
  questions: "gath-grow-question",
  laboratory: "gath-grow-lab",
  intentions: "gath-grow-intention",
};

const GROW_ICON: Record<GrowVariant, LucideIcon> = {
  questions: Waypoints,
  laboratory: FlaskConical,
  intentions: Flame,
};

const GROW_HAND_LABEL: Record<GrowVariant, string> = {
  questions: "Grow a Living Question",
  laboratory: "Open a lab bench",
  intentions: "Gather it together",
};

const GROW_FLASH: Record<GrowVariant, string> = {
  questions: "The question now lives among the living.",
  laboratory: "The bench stands open.",
  intentions: "The intention gathers.",
};

const GROWN_CHIP: Record<GrowVariant, string> = {
  questions: "a living question grows here",
  laboratory: "a lab bench stands here",
  intentions: "an intention gathers here",
};

/* which room a post may still grow into */
function growVariantFor(post: GatheringPost): GrowVariant | null {
  if (post.kind === "question" && !post.hasQuestion) return "questions";
  if ((post.kind === "hypothesis" || post.kind === "experiment") && !post.hasLab) {
    return "laboratory";
  }
  if (post.kind === "intention" && !post.hasIntentionSpace) return "intentions";
  return null;
}

/* which room already grew — the small muted chip that says so */
function grownChipFor(post: GatheringPost): GrowVariant | null {
  if (post.kind === "question" && post.hasQuestion) return "questions";
  if ((post.kind === "hypothesis" || post.kind === "experiment") && post.hasLab) {
    return "laboratory";
  }
  if (post.kind === "intention" && post.hasIntentionSpace) return "intentions";
  return null;
}

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
function useGatheringFeed(mine: boolean, circleId: string | null, tab: FeedTab | null) {
  const [posts, setPosts] = useState<GatheringPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const mineRef = useRef(mine);
  const circleRef = useRef(circleId);
  const tabRef = useRef<FeedTab | null>(tab);
  mineRef.current = mine;
  circleRef.current = circleId;
  tabRef.current = tab;
  /* THE ONE BREATH LAW — the hall's first reading happens once, no
     matter how many times the reader object is handed back: an empty
     room is a still room, never a loop of knockings. */
  const bootedRef = useRef(false);

  const read = useCallback(
    async (opts: { fresh?: boolean; kind?: string | null; q?: string | null } = {}) => {
      const fresh = opts.fresh ?? false;
      if (!fresh && !hasMoreRef.current) return;
      if (fresh) {
        bootedRef.current = true;
        setLoading(true);
        setError(false);
      } else {
        setLoadingMore(true);
      }
      try {
        const params = new URLSearchParams();
        if (mineRef.current) params.set("mine", "1");
        if (circleRef.current) params.set("circle", circleRef.current);
        if (tabRef.current) params.set("tab", tabRef.current);
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

  /* the first breath — read once when the reader is born */
  useEffect(() => {
    if (bootedRef.current) return;
    void read({ fresh: true });
  }, [read]);

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
  onBookmark,
  onRepost,
  onGrow,
  onTakeBack,
  armedId,
  setArmedId,
}: {
  post: GatheringPost;
  onOpen: () => void;
  onResonate: () => void;
  onBookmark: () => void;
  onRepost: () => void;
  onGrow: () => void;
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
  const grow = growVariantFor(post);
  const grown = grownChipFor(post);
  const GrowHand = grow ? GROW_ICON[grow] : null;

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
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          {post.epistemic && isEvidenceLevel(post.epistemic) && (
            <EvidenceChip level={post.epistemic} />
          )}
          {grown && (
            <span className="text-[9.5px] italic text-[#a2947c]">{t(GROWN_CHIP[grown])}</span>
          )}
          {post.mine && (
            <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
              {t("you")}
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-2.5 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
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

      <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <MakerMark name={post.author.name} size={26} />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#5c5344]">
              {post.author.name}
            </p>
            <p className="text-[10px] text-[#a2947c]">
              {relativeTime(post.createdAt, t)}
              {regionLabel(post.region) ? ` · ${t(regionLabel(post.region)!)}` : ""}
            </p>
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            aria-pressed={!!post.bookmarked}
            aria-label={t(post.bookmarked ? "Take it off the shelf" : "Keep this on your shelf")}
            title={t(post.bookmarked ? "Take it off the shelf" : "Keep this on your shelf")}
            data-testid="gath-bookmark"
            className={cn(
              "focus-glow rounded-full p-1 transition-colors duration-300",
              post.bookmarked ? "text-[#a16207]" : "hover:text-[#8a6f46]"
            )}
          >
            {post.bookmarked ? (
              <BookmarkCheck className="size-3.5 fill-[#a16207]/20" aria-hidden="true" />
            ) : (
              <Bookmark className="size-3.5" aria-hidden="true" />
            )}
          </button>
          <span
            aria-label={t("Echoes")}
            title={t("Echoes")}
            className="flex items-center gap-1 text-[11px] font-semibold"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {post.echoCount}
          </span>
          {!post.mine && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRepost();
              }}
              aria-label={t(post.reposted ? "Take the reprint back" : "Reprint this offering")}
              title={t(post.reposted ? "Take the reprint back" : "Reprint this offering")}
              data-testid="gath-repost"
              className={cn(
                "focus-glow flex items-center gap-1 rounded-full px-1 py-0.5 text-[11px] font-semibold transition-colors duration-300",
                post.reposted ? "text-[#0d9488]" : "hover:text-[#8a6f46]"
              )}
            >
              <Repeat2
                className={cn("size-3.5", post.reposted && "fill-[#0d9488]/15")}
                aria-hidden="true"
              />
              {post.repostCount}
            </button>
          )}
          {grow && GrowHand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGrow();
              }}
              aria-label={t(GROW_HAND_LABEL[grow])}
              title={t(GROW_HAND_LABEL[grow])}
              data-testid={GROW_TESTID[grow]}
              className="focus-glow rounded-full p-1 text-[#a2947c] transition-colors duration-300 hover:text-[#8a6f46]"
            >
              <GrowHand className="size-3.5" aria-hidden="true" />
            </button>
          )}
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
  onBookmark,
  onEcho,
  onRepost,
  onGrow,
  onTakeBack,
  strikeId,
  armedId,
  setArmedId,
  onWeave,
  onLibrary,
}: {
  post: GatheringPost;
  onResonate: () => void;
  onBookmark: () => void;
  onEcho: () => void;
  onRepost: () => void;
  onGrow: () => void;
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
  const grow = growVariantFor(post);
  const grown = grownChipFor(post);
  const GrowHand = grow ? GROW_ICON[grow] : null;

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
                  {post.circle
                    ? ` · ${post.circle.name}`
                    : post.sector
                      ? ` · ${post.sector}`
                      : ""}
                  {regionLabel(post.region) ? ` · ${t(regionLabel(post.region)!)}` : ""}
                </p>
              </div>
            </div>
          </div>
          {post.epistemic && isEvidenceLevel(post.epistemic) && (
            <EvidenceChip level={post.epistemic} />
          )}
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
            onClick={onBookmark}
            aria-pressed={!!post.bookmarked}
            aria-label={t(post.bookmarked ? "Take it off the shelf" : "Keep this on your shelf")}
            title={t(post.bookmarked ? "Take it off the shelf" : "Keep this on your shelf")}
            data-testid="gath-bookmark"
            className={cn(
              "focus-glow flex items-center justify-center rounded-full border px-2.5 py-2 transition-all duration-300",
              post.bookmarked
                ? "border-[#a16207]/45 bg-[#a16207]/10 text-[#a16207]"
                : "border-[#e4d9bd] bg-white/70 text-[#7c715f] hover:border-[#d3c39c] hover:text-[#8a6f46]"
            )}
          >
            {post.bookmarked ? (
              <BookmarkCheck className="size-4 fill-[#a16207]/20" aria-hidden="true" />
            ) : (
              <Bookmark className="size-4" aria-hidden="true" />
            )}
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
          {!post.mine && (
            <button
              type="button"
              onClick={onRepost}
              aria-label={t(post.reposted ? "Take the reprint back" : "Reprint this offering")}
              title={t(post.reposted ? "Take the reprint back" : "Reprint this offering")}
              data-testid="gath-repost"
              className={cn(
                "focus-glow flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-all duration-300",
                post.reposted
                  ? "border-[#0d9488]/45 bg-[#0d9488]/10 text-[#0d9488]"
                  : "border-[#e4d9bd] bg-white/70 text-[#7c715f] hover:border-[#d3c39c] hover:text-[#0d9488]"
              )}
            >
              <Repeat2
                className={cn("size-4", post.reposted && "fill-[#0d9488]/15")}
                aria-hidden="true"
              />
              {post.repostCount}
            </button>
          )}
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
          {grow && GrowHand && (
            <button
              type="button"
              onClick={onGrow}
              aria-label={t(GROW_HAND_LABEL[grow])}
              title={t(GROW_HAND_LABEL[grow])}
              data-testid={GROW_TESTID[grow]}
              className="focus-glow hidden items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 p-2 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#0d9488] sm:flex"
            >
              <GrowHand className="size-4" aria-hidden="true" />
            </button>
          )}
          {grown && (
            <span className="text-[10.5px] italic text-[#a2947c]">{t(GROWN_CHIP[grown])}</span>
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
  const [replyTo, setReplyTo] = useState<GatheringEcho | null>(null);
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

  const refetchEchoes = useCallback(async () => {
    try {
      const data = await netFetch<{ echoes: GatheringEcho[] }>(
        `/api/gathering/${post.id}/echoes`
      );
      setEchoes(data.echoes);
      return true;
    } catch {
      return false;
    }
  }, [post.id]);

  const speak = useCallback(async () => {
    const text = body.trim();
    if (text.length < 2 || sending) return;
    setSending(true);
    setError(false);
    try {
      const data = await netFetch<{ echo: GatheringEcho; echoCount: number }>(
        `/api/gathering/${post.id}/echoes`,
        { method: "POST", body: { body: text, ...(replyTo ? { parentId: replyTo.id } : {}) } }
      );
      setBody("");
      setReplyTo(null);
      onCount(post.id, data.echoCount);
      const refetched = await refetchEchoes();
      if (!refetched) setEchoes((prev) => [...(prev ?? []), data.echo]);
    } catch {
      setError(true);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [body, sending, replyTo, post.id, onCount, refetchEchoes]);

  /* the echoes keep two honest levels — an answer lives under its answer */
  const roots = echoes?.filter((e) => e.parentId === null) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-[45] flex flex-col justify-end"
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
          {roots.map((root) => {
            const replies = echoes?.filter((e) => e.parentId === root.id) ?? [];
            return (
              <div key={root.id} className="space-y-2.5">
                <div className="gp-card rounded-[18px] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MakerMark name={root.author.name} size={22} />
                    <p className="text-[11.5px] font-semibold text-[#5c5344]">{root.author.name}</p>
                    <p className="text-[10px] text-[#a2947c]">{relativeTime(root.createdAt, t)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.7] text-[#4c4436] [overflow-wrap:anywhere]">
                    {root.body}
                  </p>
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => setReplyTo(root)}
                      data-testid="gath-echo-reply"
                      aria-label={t("Answer this echo")}
                      title={t("Answer this echo")}
                      className="focus-glow rounded-full border border-[#e4d9bd] bg-white/60 px-2.5 py-1 text-[10.5px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
                    >
                      {t("Reply")}
                    </button>
                  </div>
                </div>
                {replies.length > 0 && (
                  <div className="ml-6 space-y-2.5 border-l border-[#e4d9bd] pl-3">
                    {replies.map((r) => (
                      <div key={r.id} className="gp-card rounded-[18px] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CornerDownRight
                            className="size-3 shrink-0 text-[#a2947c]"
                            aria-hidden="true"
                          />
                          <MakerMark name={r.author.name} size={22} />
                          <p className="text-[11.5px] font-semibold text-[#5c5344]">
                            {r.author.name}
                          </p>
                          <p className="text-[10px] text-[#a2947c]">
                            {relativeTime(r.createdAt, t)}
                          </p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.7] text-[#4c4436] [overflow-wrap:anywhere]">
                          {r.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#eadfca]/70 px-4 py-3 sm:px-6">
          {error && (
            <p className="pb-2 text-center text-[11.5px] text-[#b45309]">
              {t("The echo could not be spoken.")}
            </p>
          )}
          {replyTo && (
            <div
              className="mb-2 flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/60 px-3 py-1.5"
              data-testid="gath-echo-replying"
            >
              <CornerDownRight className="size-3 shrink-0 text-[#a2947c]" aria-hidden="true" />
              <p className="min-w-0 truncate text-[11px] text-[#7c715f]">
                {t("answering")} <span className="font-semibold text-[#5c5344]">{replyTo.author.name}</span>
                {" — "}
              </p>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                aria-label={t("Answer the offering itself")}
                title={t("Answer the offering itself")}
                data-testid="gath-echo-reply-clear"
                className="focus-glow shrink-0 rounded-full p-0.5 text-[#a2947c] transition-colors duration-300 hover:text-[#b45309]"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
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

/* =============== THE REPRINT SHEET — walk it into the rooms =============== */
function RepostSheet({
  post,
  onClose,
  onReposted,
}: {
  post: GatheringPost;
  onClose: () => void;
  onReposted: (id: string, reposted: boolean, repostCount: number) => void;
}) {
  const t = useT();
  const takingBack = !!post.reposted;
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walk = useCallback(
    async (withNote: boolean) => {
      if (sending) return;
      setSending(true);
      setError(null);
      try {
        const data = await netFetch<{ reposted: boolean; repostCount: number }>(
          "/api/network/reposts",
          {
            method: "POST",
            body: {
              postId: post.id,
              ...(withNote && note.trim() ? { note: note.trim() } : {}),
            },
          }
        );
        onReposted(post.id, data.reposted, data.repostCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("The rooms could not be reached."));
        setSending(false);
      }
    },
    [sending, post.id, note, onReposted, t]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-[45] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={t("Walk it into the rooms")}
    >
      <button
        type="button"
        aria-label={t("Keep it here")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#3d3428]/25"
        tabIndex={-1}
      />
      <motion.div
        initial={{ y: "40%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "30%", opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="gp-glass relative flex flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[520px] sm:rounded-t-[32px]"
      >
        <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
          <RoomLabel>{t("Walk it into the rooms")}</RoomLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Keep it here")}
            className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
          >
            <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-3 sm:px-7">
          <p className="font-[family-name:var(--font-literata)] text-[14px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
            {post.title}
          </p>
          {takingBack ? (
            <p className="mt-2 text-[12.5px] leading-[1.7] text-[#7c715f]">
              {t("This offering already walks the rooms — take the reprint back?")}
            </p>
          ) : (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder={t("A word to carry with it — optional…")}
                aria-label={t("A word to carry with it — optional…")}
                data-testid="gath-repost-note"
                className={cn(GP_INPUT, "gp-scroll mt-3 min-h-[44px] resize-none")}
              />
              <p className="mt-1 text-[10px] text-[#a2947c]">{t("280 letters at most")}</p>
            </>
          )}

          {error && (
            <p className="mt-2 text-center text-[11.5px] text-[#b45309]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {takingBack ? (
              <button
                type="button"
                onClick={() => void walk(false)}
                disabled={sending}
                data-testid="gath-repost-takeback"
                className={GP_HAND}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Repeat2 className="size-4" aria-hidden="true" />
                )}
                {t("Take it back")}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void walk(true)}
                  disabled={sending || note.trim().length === 0}
                  data-testid="gath-repost-with-note"
                  className={GP_HAND}
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="size-4" aria-hidden="true" />
                  )}
                  {t("Reprint with a word")}
                </button>
                <button
                  type="button"
                  onClick={() => void walk(false)}
                  disabled={sending}
                  data-testid="gath-repost-quiet"
                  className={GP_GHOST}
                >
                  {t("Reprint quietly")}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              data-testid="gath-repost-cancel"
              className={GP_GHOST}
            >
              {t("Not now")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =============== THE GROW SHEET — expand into discovery =============== */
function GrowSheet({
  post,
  variant,
  onClose,
  onGrown,
  onFlash,
}: {
  post: GatheringPost;
  variant: GrowVariant;
  onClose: () => void;
  onGrown: (where: GrowVariant, postId: string) => void;
  onFlash: (line: string) => void;
}) {
  const t = useT();
  const [title, setTitle] = useState(post.title);
  const [question, setQuestion] = useState(post.title);
  const [hypothesis, setHypothesis] = useState(post.body);
  const [purpose, setPurpose] = useState(post.body);
  const [context, setContext] = useState("");
  const [disciplines, setDisciplines] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const HandIcon = GROW_ICON[variant];

  const canGrow =
    variant === "questions" ||
    (variant === "laboratory"
      ? title.trim().length >= 2 &&
        question.trim().length >= 2 &&
        hypothesis.trim().length >= 2
      : title.trim().length >= 2 && purpose.trim().length >= 2);

  const grow = useCallback(async () => {
    if (!canGrow || sending) return;
    setSending(true);
    setError(null);
    try {
      if (variant === "questions") {
        const list = disciplines
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await netFetch<{ question: { id: string } }>("/api/network/questions", {
          method: "POST",
          body: {
            postId: post.id,
            ...(context.trim() ? { context: context.trim() } : {}),
            ...(list.length ? { disciplines: list } : {}),
          },
        });
      } else if (variant === "laboratory") {
        await netFetch<{ lab: { id: string } }>("/api/network/laboratory", {
          method: "POST",
          body: {
            title: title.trim(),
            question: question.trim(),
            hypothesis: hypothesis.trim(),
            seedPostId: post.id,
          },
        });
      } else {
        await netFetch<{ intention: { id: string } }>("/api/network/intentions", {
          method: "POST",
          body: {
            title: title.trim(),
            purpose: purpose.trim(),
            seedPostId: post.id,
          },
        });
      }
      onFlash(t(GROW_FLASH[variant]));
      onGrown(variant, post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The room could not be reached."));
      setSending(false);
    }
  }, [
    canGrow,
    sending,
    variant,
    disciplines,
    context,
    title,
    question,
    hypothesis,
    purpose,
    post.id,
    onFlash,
    onGrown,
    t,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-[45] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={t(GROW_HAND_LABEL[variant])}
    >
      <button
        type="button"
        aria-label={t("Not now")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#3d3428]/25"
        tabIndex={-1}
      />
      <motion.div
        initial={{ y: "40%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "30%", opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="gp-glass relative flex max-h-[85%] flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[560px] sm:rounded-t-[32px]"
      >
        <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
          <RoomLabel>{t("Expand into discovery")}</RoomLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Not now")}
            className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
          >
            <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
          </button>
        </div>

        <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2">
            <HandIcon className="size-4 text-[#0d9488]" aria-hidden="true" />
            <p className="font-[family-name:var(--font-literata)] text-[14.5px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
              {t(GROW_HAND_LABEL[variant])}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-[#a2947c]">
            {t("Grown from the offering:")} <span className="text-[#7c715f]">{post.title}</span>
          </p>

          {variant === "questions" && (
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="grow-context"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the framing")}
                </label>
                <textarea
                  id="grow-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t("The fuller framing…")}
                  data-testid="gath-grow-context"
                  className={cn(GP_INPUT, "gp-scroll mt-1.5 resize-none")}
                />
              </div>
              <div>
                <label
                  htmlFor="grow-disciplines"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the disciplines")}
                </label>
                <input
                  id="grow-disciplines"
                  value={disciplines}
                  onChange={(e) => setDisciplines(e.target.value)}
                  maxLength={240}
                  placeholder={t("Physics, poetry, mycology — comma-separated…")}
                  data-testid="gath-grow-disciplines"
                  className={cn(GP_INPUT, "mt-1.5")}
                />
              </div>
            </div>
          )}

          {variant === "laboratory" && (
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="grow-title"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the bench's name")}
                </label>
                <input
                  id="grow-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  data-testid="gath-grow-title"
                  className={cn(GP_INPUT, "mt-1.5")}
                />
              </div>
              <div>
                <label
                  htmlFor="grow-lab-question"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the question")}
                </label>
                <input
                  id="grow-lab-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={200}
                  data-testid="gath-grow-lab-question"
                  className={cn(GP_INPUT, "mt-1.5")}
                />
              </div>
              <div>
                <label
                  htmlFor="grow-hypothesis"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the hypothesis")}
                </label>
                <textarea
                  id="grow-hypothesis"
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  data-testid="gath-grow-hypothesis"
                  className={cn(GP_INPUT, "gp-scroll mt-1.5 resize-none")}
                />
              </div>
            </div>
          )}

          {variant === "intentions" && (
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="grow-title"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the intention's name")}
                </label>
                <input
                  id="grow-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  data-testid="gath-grow-title"
                  className={cn(GP_INPUT, "mt-1.5")}
                />
              </div>
              <div>
                <label
                  htmlFor="grow-purpose"
                  className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                >
                  {t("the purpose")}
                </label>
                <textarea
                  id="grow-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  data-testid="gath-grow-purpose"
                  className={cn(GP_INPUT, "gp-scroll mt-1.5 resize-none")}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-center text-[11.5px] text-[#b45309]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => void grow()}
              disabled={!canGrow || sending}
              data-testid="gath-grow-submit"
              className={GP_HAND}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <HandIcon className="size-4" aria-hidden="true" />
              )}
              {t(GROW_HAND_LABEL[variant])}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              data-testid="gath-grow-cancel"
              className={GP_GHOST}
            >
              {t("Not now")}
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
  seed,
  circles,
  onClose,
  onHung,
}: {
  initialKind: string;
  seed?: { title?: string; body?: string; tags?: string } | null;
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
      className="absolute inset-0 z-[45] flex flex-col justify-end sm:justify-center sm:px-6"
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
          <ComposerForm initialKind={initialKind} seed={seed ?? undefined} circles={circles} onHung={onHung} compact />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FeedSection({
  active,
  circles,
  refreshSignal = 0,
  composeIntent = null,
  onComposeConsumed,
  onMeetSomeone,
  onPublishWork,
  onWeaveFrom,
  onLibraryFrom,
  onGrown,
}: {
  active: boolean;
  circles: CircleCard[];
  refreshSignal?: number;
  composeIntent?: { kind: string; n: number; seed?: { title?: string; body?: string; tags?: string } } | null;
  onComposeConsumed?: () => void;
  onMeetSomeone: () => void;
  onPublishWork: () => void;
  onWeaveFrom: (post: GatheringPost) => void;
  onLibraryFrom: (post: GatheringPost) => void;
  onGrown?: (where: GrowVariant) => void;
}) {
  const t = useT();
  const [view, setView] = useState<"gallery" | "stream" | "mine">("gallery");
  const [tab, setTab] = useState<FeedTab>("foryou");
  const [kind, setKind] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<string>("reflection");
  const [composerSeed, setComposerSeed] = useState<{
    title?: string;
    body?: string;
    tags?: string;
  } | null>(null);
  const [echoPost, setEchoPost] = useState<GatheringPost | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [strikeId, setStrikeId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [repostPost, setRepostPost] = useState<GatheringPost | null>(null);
  const [growTarget, setGrowTarget] = useState<{
    post: GatheringPost;
    variant: GrowVariant;
  } | null>(null);

  const hall = useGatheringFeed(false, null, tab);
  const mine = useGatheringFeed(true, null, null);

  /* the readers carry their own first breath — the section only
     answers the active gate; no effect ever re-reads an empty hall */

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(id);
  }, [note]);

  /* THE FOUR CURRENTS — turning a current re-reads the hall once, with
     the rekindle the hall already trusts. Mine keeps its own wall. */
  const lastTabRef = useRef<FeedTab>("foryou");
  useEffect(() => {
    if (lastTabRef.current === tab) return;
    lastTabRef.current = tab;
    hall.rekindle({ kind });
  }, [tab, kind, hall]);

  /* THE ATLAS' OWN ECHO — when an intention is spoken at the map, the
     hall reads itself again (once per spoken vow, never on a loop):
     the stream and the atlas always agree. */
  const lastSignalRef = useRef(0);
  useEffect(() => {
    if (refreshSignal <= 0 || refreshSignal === lastSignalRef.current) return;
    lastSignalRef.current = refreshSignal;
    hall.rekindle({ kind });
    mine.rekindle();
  }, [refreshSignal, kind, hall, mine]);

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

  /* THE SHELF — an honest optimistic mark; a missed shelf puts the
     bookmark back where it stood and speaks the error in the note. */
  const toggleBookmark = useCallback(
    async (post: GatheringPost) => {
      const wasOn = !!post.bookmarked;
      const write = (mutate: (p: GatheringPost) => GatheringPost) => {
        hall.setPosts((prev) => prev.map((p) => (p.id === post.id ? mutate(p) : p)));
        mine.setPosts((prev) => prev.map((p) => (p.id === post.id ? mutate(p) : p)));
      };
      write((p) => ({ ...p, bookmarked: !wasOn }));
      try {
        const data = await netFetch<{ bookmarked: boolean; savedCount: number }>(
          "/api/network/bookmarks",
          { method: "POST", body: { postId: post.id, on: !wasOn } }
        );
        write((p) => ({ ...p, bookmarked: data.bookmarked }));
      } catch (err) {
        write((p) => ({ ...p, bookmarked: wasOn }));
        setNote(err instanceof Error ? err.message : t("The shelf could not be reached."));
      }
    },
    [hall, mine, t]
  );

  const onReposted = useCallback(
    (id: string, reposted: boolean, repostCount: number) => {
      const bump = (prev: GatheringPost[]) =>
        prev.map((p) => (p.id === id ? { ...p, reposted, repostCount } : p));
      hall.setPosts(bump);
      mine.setPosts(bump);
      setRepostPost(null);
    },
    [hall, mine]
  );

  const handleGrown = useCallback(
    (where: GrowVariant, postId: string) => {
      const bump = (prev: GatheringPost[]) =>
        prev.map((p) =>
          p.id === postId
            ? where === "questions"
              ? { ...p, hasQuestion: true }
              : where === "laboratory"
                ? { ...p, hasLab: true }
                : { ...p, hasIntentionSpace: true }
            : p
        );
      hall.setPosts(bump);
      mine.setPosts(bump);
      setGrowTarget(null);
      onGrown?.(where);
    },
    [hall, mine, onGrown]
  );

  const openGrow = useCallback((post: GatheringPost) => {
    const variant = growVariantFor(post);
    if (!variant) return;
    setGrowTarget({ post, variant });
  }, []);

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

  const openComposer = useCallback((k: string, seed?: { title?: string; body?: string; tags?: string } | null) => {
    setComposerKind(k);
    setComposerSeed(seed ?? null);
    setComposerOpen(true);
  }, []);

  /* the create sheet's hand — a beginning carried from the crown:
     the composer unfolds once, then the intent is consumed. The
     update is deferred out of the effect body so renders never
     cascade. */
  const lastComposeRef = useRef(0);
  useEffect(() => {
    const n = composeIntent?.n ?? 0;
    if (!composeIntent || n <= lastComposeRef.current) return;
    lastComposeRef.current = n;
    const kind = composeIntent.kind;
    const seed = composeIntent.seed ?? null;
    const consume = onComposeConsumed;
    const id = window.setTimeout(() => {
      openComposer(kind, seed);
      consume?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [composeIntent, openComposer, onComposeConsumed]);

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

  /* THE FOUR CURRENTS — the hall reads itself four ways */
  const currents: Array<{ key: FeedTab; label: string; icon: LucideIcon }> = useMemo(
    () => [
      { key: "foryou", label: "For you", icon: Sparkles },
      { key: "following", label: "Following", icon: Users },
      { key: "latest", label: "Latest", icon: Clock },
      { key: "discoveries", label: "Discoveries", icon: Telescope },
    ],
    []
  );

  /* THE THREE DOORS OF THE EMPTY HALL — the first screen's natural
     openings. They stand where the eye already rests: in the quiet
     room itself, as labeled words a hand can trust — never as a
     permanent row of mute buttons crowding the stream. */
  const hallDoors: Array<{
    key: string;
    label: string;
    icon: LucideIcon;
    run: () => void;
    primary?: boolean;
  }> = [
    { key: "reflection", label: "Share a reflection", icon: Feather, run: () => openComposer("reflection"), primary: true },
    { key: "creation", label: "Publish a work", icon: Sparkles, run: onPublishWork },
    { key: "meet", label: "Meet someone", icon: Users, run: onMeetSomeone },
  ];

  const emptyDoors = hallDoors.map(({ key, label, icon, run, primary }) => ({
    key,
    label: t(label),
    icon,
    onClick: run,
    primary,
  }));

  const feedList = view === "mine" ? mine : hall;

  return (
    <div className="relative flex h-full flex-col">
      {/* ---------- one quiet crown: the four currents, one row ---------- */}
      {/* THE CLEAN SOCIAL LAW — the hall's top carries only the currents:
          the views have left the crown (the possibilities realm is the
          middle street at the foot, my offerings live in My Space), and
          the intention chips ride beneath as the feed's own filter strip. */}
      <div className="mx-auto w-full max-w-[1200px] shrink-0 px-3 pt-2 sm:px-6 sm:pt-3" data-testid="gathering-three-hands">
        <div className="gp-scroll flex items-center justify-center gap-2 overflow-x-auto pb-0.5">

          {/* the four currents — gone when mine keeps its own wall */}
          {view !== "mine" && (
            <div
              role="tablist"
              aria-label={t("The four currents")}
              className="gp-seg flex shrink-0 items-center gap-0.5 rounded-full border border-white/80 bg-white/45 p-1"
            >
              {currents.map((c) => {
                const CIcon = c.icon;
                const on = tab === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(c.key)}
                    data-testid={`gath-feed-tab-${c.key}`}
                    className={cn(
                      "focus-glow relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-300 sm:px-3.5",
                      on ? "text-[#5c5344]" : "text-[#a2947c] hover:text-[#7c715f]"
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="gp-currents-thumb"
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="gp-seg-thumb absolute inset-0 rounded-full"
                        aria-hidden="true"
                      />
                    )}
                    <CIcon className="relative size-3.5" aria-hidden="true" />
                    <span className="relative whitespace-nowrap">{t(c.label)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* the hall's intention chips — one scrollable line */}
        <div className="gp-scroll mt-2 flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5">
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

      {/* ---------- the rooms ---------- */}
      <div
        className="gp-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-28 pt-3 sm:px-6 sm:pt-4"
      >
        {view === "stream" ? (
          hall.loading ? (
            <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("The exhibition arrives…")}
            </p>
          ) : hall.posts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <EmptyRoom
                icon={Play}
                line={t(
                  "The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question."
                )}
                actions={emptyDoors}
              />
            </div>
          ) : (
            <div ref={streamRef} className="gp-stream h-full overflow-hidden" data-testid="gp-stream">
              {hall.posts.map((p, i) => (
                <div key={p.id} data-slide-index={i} className="h-full">
                  <StreamSlide
                    post={p}
                    onResonate={() => void resonate(p)}
                    onBookmark={() => void toggleBookmark(p)}
                    onEcho={() => setEchoPost(p)}
                    onRepost={() => setRepostPost(p)}
                    onGrow={() => openGrow(p)}
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
            {/* THE FEED'S OWN BEGINNINGS — two labeled words riding the
                content, not the crown: one opens the composer, one
                carries a finished work in. */}
            <div className="mx-auto w-full max-w-[1200px] px-0 pt-3" data-testid="gath-begin-row">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openComposer("reflection")}
                  data-testid="gath-begin-reflection"
                  className={cn(GP_GHOST, "min-w-0 flex-1 justify-start py-2.5 text-[12.5px] font-medium")}
                >
                  <Feather className="size-4 shrink-0 text-[#8a6f46]" aria-hidden="true" />
                  <span className="truncate">{t("Share a reflection…")}</span>
                </button>
                <button
                  type="button"
                  onClick={onPublishWork}
                  data-testid="gath-begin-publish"
                  aria-label={t("Publish a work")}
                  title={t("Publish a work")}
                  className={cn(GP_GHOST, "shrink-0 px-3 py-2.5")}
                >
                  <Library className="size-4 text-[#a16207]" aria-hidden="true" />
                </button>
              </div>
            </div>
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
              <div className="flex h-full flex-col items-center justify-center">
                <EmptyRoom
                  icon={LayoutGrid}
                  line={
                    view === "mine"
                      ? t("You have not hung anything yet — the quiet walls below wait for your first stone.")
                      : t("The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question.")
                  }
                  actions={view === "mine" ? emptyDoors.slice(0, 2) : emptyDoors}
                />
              </div>
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
                      onBookmark={() => void toggleBookmark(p)}
                      onRepost={() => setRepostPost(p)}
                      onGrow={() => openGrow(p)}
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

      {/* ---------- the offering hand — the wide desk's own door
              (on the palm the create sheet in the nav carries every
              beginning, so the hall stays clear) ---------- */}
      <button
        type="button"
        onClick={() => openComposer("reflection")}
        aria-label={t("The offering line")}
        title={t("The offering line")}
        data-testid="gathering-portal-offer"
        className="focus-glow gp-pearl absolute bottom-7 right-7 z-10 hidden items-center gap-2 rounded-full border border-white/95 py-3 pl-4 pr-5 text-[13px] font-semibold text-[#8a6f46] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.02] lg:flex"
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
        {repostPost && (
          <RepostSheet
            post={repostPost}
            onClose={() => setRepostPost(null)}
            onReposted={onReposted}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {growTarget && (
          <GrowSheet
            post={growTarget.post}
            variant={growTarget.variant}
            onClose={() => setGrowTarget(null)}
            onGrown={handleGrown}
            onFlash={setNote}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {composerOpen && (
          <ComposerSheet
            initialKind={composerKind}
            seed={composerSeed}
            circles={circles}
            onClose={() => setComposerOpen(false)}
            onHung={onHung}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
