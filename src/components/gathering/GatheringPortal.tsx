"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  CircleQuestionMark,
  Feather,
  LayoutGrid,
  Loader2,
  MessageCircle,
  MoonStar,
  Music,
  Play,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S PORTAL — the independent hall.                     */
/*                                                                     */
/*  Not a tab of the chat, not a room of the house: the threshold's    */
/*  top-left sigil raises a completely separate social space with its  */
/*  own structure, its own light and its own manners.                  */
/*                                                                     */
/*  THE SHAPE — a fusion walked in the hall's own way:                 */
/*    · THE GALLERY — a porcelain wall of offerings (a living grid,    */
/*      the exhibition's own wall);                                    */
/*    · THE STREAM — one offering at a time, the whole cloth given to  */
/*      it, the visitor's hand turning the pages vertically (the       */
/*      hall's own current);                                           */
/*    · MINE — the visitor's own hanging wall.                         */
/*                                                                     */
/*  THE PORCELAIN WEATHER — milk-white and cream, clean and three-     */
/*  dimensional: extruded cards, soft deep shadows, glassy bars.       */
/*                                                                     */
/*  THE HALL'S MANNERS (unchanged): every offering keeps its maker's   */
/*  name; nothing hangs but by its maker's own hand; resonance is a    */
/*  tuning, not a trophy; an echo is a response, not a comment         */
/*  section; nothing is ranked — the hall reads newest-first.          */
/*                                                                     */
/*  THE MIRROR SPIRIT — the hall stands beside the house, never over   */
/*  it: no gamification, no follower counts, no vanity metrics, only   */
/*  human reflection meeting human reflection.                         */
/* ------------------------------------------------------------------ */

type GatheringKind =
  | "reflection"
  | "creation"
  | "dream"
  | "music"
  | "book"
  | "discovery"
  | "question";

type PortalView = "gallery" | "stream" | "mine";

const KIND_META: Record<GatheringKind, { icon: LucideIcon; accent: string }> = {
  reflection: { icon: Feather, accent: "#8a6f46" },
  creation: { icon: Sparkles, accent: "#a16207" },
  dream: { icon: MoonStar, accent: "#7c5cad" },
  music: { icon: Music, accent: "#0f766e" },
  book: { icon: BookOpen, accent: "#8a6d3b" },
  discovery: { icon: Atom, accent: "#0d9488" },
  question: { icon: CircleQuestionMark, accent: "#9a6b8a" },
};

const KIND_ORDER: GatheringKind[] = [
  "reflection",
  "creation",
  "dream",
  "music",
  "book",
  "discovery",
  "question",
];

/* the seven intentions, spoken the way the hall names them */
const KIND_OFFERING_LABEL: Record<GatheringKind, string> = {
  reflection: "A reflection",
  creation: "A creation",
  dream: "A dream",
  music: "A composition",
  book: "A written work",
  discovery: "A discovery",
  question: "A question",
};

const KIND_FILTER_LABEL: Record<GatheringKind, string> = {
  reflection: "Reflections",
  creation: "Creations",
  dream: "Dreams",
  music: "Music",
  book: "Books",
  discovery: "Discoveries",
  question: "Questions",
};

interface GatheringPost {
  id: string;
  kind: string;
  title: string;
  body: string;
  sector: string | null;
  resonanceCount: number;
  echoCount: number;
  createdAt: string;
  author: { name: string; image: string | null; anon: boolean };
  mine: boolean;
  resonated: boolean;
}

interface GatheringEcho {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; image: string | null; anon: boolean };
  isMine: boolean;
}

function relativeTime(iso: string, t: (k: string) => string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("just now");
  if (m < 60) return `${m} ${t("min ago")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${t("h ago")}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ${t("days ago")}`;
  return new Date(iso).toLocaleDateString();
}

/* the maker's mark — a quiet cream disc with the name's first letter */
function MakerMark({ name, size = 30 }: { name: string; size?: number }) {
  const letter = (name.trim()[0] ?? "·").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border border-white/90 font-[family-name:Cinzel] font-semibold text-[#8a6f46]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: "linear-gradient(150deg, #fdf9ef 0%, #f3ead6 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px -2px rgba(122,103,70,0.35)",
      }}
    >
      {letter}
    </span>
  );
}

/* ================================================================== */
/*  THE FEED — one honest reader of the hall's own API (no mock       */
/*  halls, no invented offerings: only the real rows answer).         */
/* ================================================================== */
function useGatheringFeed(mine: boolean) {
  const [posts, setPosts] = useState<GatheringPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const mineRef = useRef(mine);
  mineRef.current = mine;

  const read = useCallback(
    async (opts: { fresh?: boolean; kind?: string | null } = {}) => {
      const fresh = opts.fresh ?? false;
      const kind = opts.kind ?? null;
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
        if (kind) params.set("kind", kind);
        if (!fresh && cursorRef.current) params.set("cursor", cursorRef.current);
        const res = await fetch(`/api/gathering?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("read failed");
        const data = (await res.json()) as {
          posts: GatheringPost[];
          nextCursor: string | null;
        };
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
    (kind: string | null) => {
      cursorRef.current = null;
      hasMoreRef.current = false;
      void read({ fresh: true, kind });
    },
    [read]
  );

  return { posts, setPosts, loading, loadingMore, error, hasMore, read, rekindle };
}

/* ================================================================== */
/*  THE OFFERING CARD — the porcelain tile of the gallery wall.       */
/* ================================================================== */
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
    ? (post.kind as GatheringKind)
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
      {/* the kind's own seal */}
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

      {/* the words */}
      <h3 className="mt-3 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
        {post.title}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
        {post.body}
      </p>

      {/* the maker + the hall's quiet counts */}
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
                armed
                  ? "bg-[#b45309]/12 text-[#b45309]"
                  : "text-[#a2947c] hover:text-[#b45309]"
              )}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* the armed take-back speaks once before it acts */}
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

/* ================================================================== */
/*  THE STREAM SLIDE — one offering given the whole cloth.            */
/* ================================================================== */
function StreamSlide({
  post,
  onResonate,
  onEcho,
  onTakeBack,
  strikeId,
  armedId,
  setArmedId,
}: {
  post: GatheringPost;
  onResonate: () => void;
  onEcho: () => void;
  onTakeBack: () => void;
  strikeId: string | null;
  armedId: string | null;
  setArmedId: (id: string | null) => void;
}) {
  const t = useT();
  const kind = (KIND_META as Record<string, unknown>)[post.kind]
    ? (post.kind as GatheringKind)
    : "reflection";
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const armed = armedId === post.id;

  return (
    <div className="gp-slide flex h-full w-full items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
      <div className="gp-card relative flex max-h-full w-full max-w-[600px] flex-col overflow-hidden rounded-[28px] sm:rounded-[34px]">
        {/* the kind's seal and the maker, riding the card's crown */}
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
                  {post.sector ? ` · ${post.sector}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* the offering itself — the card's own room reads long words */}
        <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="font-[family-name:var(--font-literata)] text-[19px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere] sm:text-[22px]">
            {post.title}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.85] text-[#5c5344] [overflow-wrap:anywhere] sm:text-[15px]">
            {post.body}
          </p>
        </div>

        {/* the action rail — the hall's own quiet hand */}
        <div className="flex items-center gap-3 border-t border-[#eadfca]/60 px-5 py-3.5 sm:px-7">
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

/* ================================================================== */
/*  THE ECHO SHEET — responses rising from the porcelain floor.       */
/* ================================================================== */
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
        const res = await fetch(`/api/gathering/${post.id}/echoes`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { echoes: GatheringEcho[] };
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
      const res = await fetch(`/api/gathering/${post.id}/echoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        echo: GatheringEcho;
        echoCount: number;
      };
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
          <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-[#8a6f46]">
            {t("Echoes")}
          </p>
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

        {/* the echo's own hand */}
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
              className="focus-glow flex size-11 shrink-0 items-center justify-center rounded-[16px] border border-white/90 text-[#8a6f46] transition-all duration-300 hover:brightness-[1.03] disabled:opacity-45"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#f3ead6 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.95), 0 6px 14px -6px rgba(122,103,70,0.4)",
              }}
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

/* ================================================================== */
/*  THE OFFERING LINE — the composer, where an offering is shaped     */
/*  before it is hung.                                                */
/* ================================================================== */
function ComposerSheet({
  onClose,
  onHung,
}: {
  onClose: () => void;
  onHung: (post: GatheringPost) => void;
}) {
  const t = useT();
  const [kind, setKind] = useState<GatheringKind>("reflection");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sector, setSector] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canHang = title.trim().length >= 2 && body.trim().length >= 2 && !sending;

  const hang = useCallback(async () => {
    if (!canHang) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/gathering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim(),
          body: body.trim(),
          ...(sector.trim() ? { sector: sector.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { post?: GatheringPost; error?: string }
        | null;
      if (!res.ok || !data?.post) {
        setError(data?.error ?? t("The offering could not be placed."));
        return;
      }
      onHung(data.post);
    } catch {
      setError(t("The offering could not be placed."));
    } finally {
      setSending(false);
    }
  }, [canHang, kind, title, body, sector, onHung, t]);

  const meta = KIND_META[kind];
  const Icon = meta.icon;

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
          <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-[#8a6f46]">
            {t("The offering line")}
          </p>
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
          {/* the seven intentions */}
          <div className="flex flex-wrap gap-2">
            {KIND_ORDER.map((k) => {
              const m = KIND_META[k];
              const KIcon = m.icon;
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={on}
                  className={cn(
                    "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-300",
                    on
                      ? "border-[#cbb98d] bg-white text-[#5c5344]"
                      : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                  )}
                  style={
                    on
                      ? { boxShadow: "0 4px 12px -6px rgba(122,103,70,0.45)" }
                      : undefined
                  }
                >
                  <KIcon className="size-3.5" style={{ color: m.accent }} aria-hidden="true" />
                  {t(KIND_OFFERING_LABEL[k])}
                </button>
              );
            })}
          </div>

          {/* the words */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={t("Give the offering its name…")}
            aria-label={t("Give the offering its name…")}
            className="mt-4 w-full rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-3 font-[family-name:var(--font-literata)] text-[14.5px] font-semibold text-[#3d3428] outline-none transition-colors duration-300 placeholder:font-normal placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            rows={5}
            placeholder={t(
              "Speak the offering itself — a reflection, a story of a creation, a dream, a discovery, a question…"
            )}
            aria-label={t("Speak the offering itself")}
            className="gp-scroll mt-2.5 w-full resize-none rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-3 text-[13.5px] leading-[1.75] text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
          />
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            maxLength={24}
            placeholder={t("Woven in… (a room's name, optional)")}
            aria-label={t("Woven in… (a room's name, optional)")}
            className="mt-2.5 w-full rounded-[16px] border border-[#eee5d0] bg-white/60 px-4 py-2.5 text-[12.5px] text-[#5c5344] outline-none transition-colors duration-300 placeholder:text-[#bfb398] focus:border-[#cbb98d]"
          />

          {/* the offering as it will hang */}
          <AnimatePresence initial={false}>
            {preview && (
              <motion.div
                key="preview"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <p className="mono-label mb-2 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                    {t("as it will hang")}
                  </p>
                  <div className="gp-card rounded-[22px] p-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex size-8 items-center justify-center rounded-[12px] border border-white/90"
                        style={{
                          background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                        }}
                      >
                        <Icon className="size-4" style={{ color: meta.accent }} />
                      </span>
                      <p className="font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
                        {title.trim() || t("Give the offering its name…")}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                      {body.trim() || t("Speak the offering itself")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-3 text-center text-[12px] font-medium text-[#b45309]">{error}</p>
          )}
        </div>

        {/* the hanging hands */}
        <div className="flex items-center gap-2.5 border-t border-[#eadfca]/70 px-5 py-3.5 sm:px-7">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 px-4 py-2.5 text-[12.5px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#5c5344]"
          >
            {preview ? t("Keep shaping") : t("Preview the offering")}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void hang()}
            disabled={!canHang}
            className="focus-glow flex items-center gap-2 rounded-full border border-white/90 px-5 py-2.5 text-[12.5px] font-semibold text-[#8a6f46] transition-all duration-300 hover:brightness-[1.03] disabled:opacity-45"
            style={{
              background: "linear-gradient(150deg,#fffdf8 0%,#f3ead6 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 18px -8px rgba(122,103,70,0.45)",
            }}
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("Hanging…")}
              </>
            ) : (
              t("Hang it in the hall")
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */
/*  THE PORTAL ITSELF — the independent hall.                         */
/* ================================================================== */
export default function GatheringPortal() {
  const t = useT();
  const [view, setView] = useState<PortalView>("gallery");
  const [kind, setKind] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [echoPost, setEchoPost] = useState<GatheringPost | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [strikeId, setStrikeId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const hall = useGatheringFeed(false);
  const mine = useGatheringFeed(true);

  /* the portal's first breath reads the hall */
  useEffect(() => {
    void hall.read({ fresh: true, kind: null });
    void mine.read({ fresh: true, kind: null });
    /* the first breath alone — the feeds re-read themselves on demand */
  }, [hall.read, mine.read]);

  const closePortal = useCallback(() => {
    useMirror.getState().closeGatheringPortal();
  }, []);

  /* the escape hand — one breath of Escape folds sheet, then portal */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (composerOpen) setComposerOpen(false);
      else if (echoPost) setEchoPost(null);
      else closePortal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composerOpen, echoPost, closePortal]);

  /* the quiet note fades on its own */
  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(id);
  }, [note]);

  /* the kind's own hand re-reads the hall */
  const chooseKind = useCallback(
    (k: string | null) => {
      setKind(k);
      hall.rekindle(k);
    },
    [hall]
  );

  /* RESONANCE — the tuning hand (optimistic, honest on failure) */
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
        const res = await fetch(`/api/gathering/${post.id}/resonate`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          resonated: boolean;
          resonanceCount: number;
        };
        write((p) => ({ ...p, resonated: data.resonated, resonanceCount: data.resonanceCount }));
      } catch {
        write((p) => ({ ...p, resonated: wasOn, resonanceCount: post.resonanceCount }));
      }
    },
    [hall, mine]
  );

  /* THE TAKING-BACK HAND — only an offering's own maker may */
  const takeBack = useCallback(
    async (post: GatheringPost) => {
      try {
        const res = await fetch(`/api/gathering/${post.id}`, { method: "DELETE" });
        if (!res.ok) return;
        hall.setPosts((prev) => prev.filter((p) => p.id !== post.id));
        mine.setPosts((prev) => prev.filter((p) => p.id !== post.id));
      } catch {
        /* a fold that could not land leaves the hall as it was */
      }
    },
    [hall, mine]
  );

  /* the offering hung — it rides the wall at once */
  const onHung = useCallback(
    (post: GatheringPost) => {
      hall.setPosts((prev) => [post, ...prev]);
      mine.setPosts((prev) => [post, ...prev]);
      setComposerOpen(false);
      setNote(t("Your offering now hangs in the hall."));
      setView("gallery");
    },
    [hall, mine, t]
  );

  /* the echo count returns from the sheet */
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

  /* a gallery tile opens the stream at its own step (the fusion hand) */
  const streamIndexRef = useRef(0);
  const streamRef = useRef<HTMLDivElement>(null);
  const openInStream = useCallback((index: number) => {
    streamIndexRef.current = index;
    setView("stream");
  }, []);

  /* the stream walks to the chosen offering when it rises */
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

  const views: Array<{ key: PortalView; label: string; icon: LucideIcon }> = useMemo(
    () => [
      { key: "gallery", label: "Gallery", icon: LayoutGrid },
      { key: "stream", label: "Stream", icon: Play },
      { key: "mine", label: "My offerings", icon: User },
    ],
    []
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={t("The Gathering")}
      data-testid="gathering-portal"
      className="fixed inset-0 z-[90] overflow-hidden"
    >
      {/* ---------- the porcelain sky ---------- */}
      <div aria-hidden="true" className="gp-sky absolute inset-0">
        <div className="gp-drift absolute -top-32 left-[8%] h-[420px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(255,252,244,0.9),transparent)]" />
        <div className="gp-drift-slow absolute bottom-[-140px] right-[-80px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(243,231,204,0.75),transparent)]" />
        <div className="gp-drift absolute left-[-120px] top-1/2 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(250,242,224,0.7),transparent)]" />
      </div>

      {/* ---------- the hall's own crown ---------- */}
      <header className="gp-glass absolute inset-x-0 top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-3 sm:h-16 sm:px-6">
          {/* the return hand — the portal folds, the house remains */}
          <button
            type="button"
            onClick={closePortal}
            aria-label={t("Return to the house")}
            title={t("Return to the house")}
            data-testid="gathering-portal-return"
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>

          {/* the hall's own mark — a small porcelain mirror */}
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
              }}
            >
              <span className="block size-3.5 rounded-[5px] border border-[#cbb98d] bg-[linear-gradient(150deg,#fefcf6,#e8dcbd)]" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-[family-name:Cinzel] text-[14px] font-semibold tracking-wide text-[#3d3428] sm:text-[15px]">
                {t("The Gathering")}
              </p>
              <p className="mono-label hidden text-[8px] uppercase tracking-[0.26em] text-[#a2947c] sm:block">
                {t("The hall")}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* the three rooms of the hall — the porcelain segmented pill */}
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
        </div>

        {/* the intention chips — the wall filters itself by kind */}
        <div className="mx-auto max-w-[1200px] px-3 pb-2.5 sm:px-6 sm:pb-3">
          <div className="gp-scroll flex items-center gap-1.5 overflow-x-auto pb-0.5">
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
      </header>

      {/* ---------- the hall's rooms ---------- */}
      <div className="absolute inset-0 overflow-hidden pt-[92px] sm:pt-[108px]">
        <AnimatePresence mode="wait" initial={false}>
          {view === "gallery" && (
            <motion.section
              key="gallery"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-3 sm:px-6 sm:pt-5"
            >
              <div className="mx-auto max-w-[1200px]">
                {hall.loading ? (
                  <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("The exhibition arrives…")}
                  </p>
                ) : hall.error ? (
                  <div className="py-24 text-center">
                    <p className="text-[13.5px] text-[#b45309]">
                      {t("The hall could not be read.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void hall.read({ fresh: true, kind })}
                      className="focus-glow mt-4 rounded-full border border-[#e4d9bd] bg-white/70 px-4 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
                    >
                      {t("The exhibition continues")}
                    </button>
                  </div>
                ) : hall.posts.length === 0 ? (
                  <p className="mx-auto max-w-[420px] py-24 text-center font-[family-name:var(--font-literata)] text-[14px] italic leading-[1.85] text-[#8a7c64]">
                    {t(
                      "The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question."
                    )}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {hall.posts.map((p, i) => (
                        <OfferingTile
                          key={p.id}
                          post={p}
                          onOpen={() => openInStream(i)}
                          onResonate={() => void resonate(p)}
                          onTakeBack={() => void takeBack(p)}
                          armedId={armedId}
                          setArmedId={setArmedId}
                        />
                      ))}
                    </div>
                    {hall.hasMore ? (
                      <div className="py-8 text-center">
                        <button
                          type="button"
                          onClick={() => void hall.read({ kind })}
                          disabled={hall.loadingMore}
                          className="focus-glow inline-flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-5 py-2.5 text-[12.5px] font-semibold text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428] disabled:opacity-60"
                        >
                          {hall.loadingMore && (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          )}
                          {t("The exhibition continues")}
                        </button>
                      </div>
                    ) : (
                      <p className="py-8 text-center text-[11.5px] italic text-[#b3a68d]">
                        {t("The exhibition continues")}
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.section>
          )}

          {view === "stream" && (
            <motion.section
              key="stream"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {hall.loading ? (
                <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("The exhibition arrives…")}
                </p>
              ) : hall.posts.length === 0 ? (
                <p className="mx-auto max-w-[420px] py-24 text-center font-[family-name:var(--font-literata)] text-[14px] italic leading-[1.85] text-[#8a7c64]">
                  {t(
                    "The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question."
                  )}
                </p>
              ) : (
                <div
                  ref={streamRef}
                  className="gp-stream h-full overflow-y-auto overscroll-y-contain"
                  data-testid="gp-stream"
                >
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
                      />
                    </div>
                  ))}
                  {/* the current's own edge — one quiet rest at the end */}
                  <div className="gp-slide flex h-full w-full items-center justify-center px-6">
                    <p className="max-w-[380px] text-center font-[family-name:var(--font-literata)] text-[14px] italic leading-[1.85] text-[#8a7c64]">
                      {t("The exhibition continues")}
                    </p>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {view === "mine" && (
            <motion.section
              key="mine"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-3 sm:px-6 sm:pt-5"
            >
              <div className="mx-auto max-w-[1200px]">
                {mine.loading ? (
                  <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("The exhibition arrives…")}
                  </p>
                ) : mine.posts.length === 0 ? (
                  <p className="mx-auto max-w-[460px] py-24 text-center font-[family-name:var(--font-literata)] text-[14px] italic leading-[1.85] text-[#8a7c64]">
                    {t(
                      "You have not hung anything yet — the offering line above waits for your first stone."
                    )}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mine.posts.map((p) => (
                      <OfferingTile
                        key={p.id}
                        post={p}
                        onOpen={() => {
                          const idx = hall.posts.findIndex((x) => x.id === p.id);
                          if (idx >= 0) openInStream(idx);
                          else setView("gallery");
                        }}
                        onResonate={() => void resonate(p)}
                        onTakeBack={() => void takeBack(p)}
                        armedId={armedId}
                        setArmedId={setArmedId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- the offering hand — always within reach ---------- */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        aria-label={t("The offering line")}
        title={t("The offering line")}
        data-testid="gathering-portal-offer"
        className="focus-glow absolute bottom-5 right-4 z-10 flex items-center gap-2 rounded-full border border-white/95 py-3 pl-4 pr-5 text-[13px] font-semibold text-[#8a6f46] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.02] sm:bottom-7 sm:right-7"
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
          <ComposerSheet onClose={() => setComposerOpen(false)} onHung={onHung} />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
