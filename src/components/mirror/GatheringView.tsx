"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Atom,
  BookOpen,
  ChevronDown,
  Feather,
  MessageCircle,
  MoonStar,
  Music,
  Send,
  Sparkles,
  Trash2,
  Waves,
  Waypoints,
  CircleQuestionMark,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE GATHERING — the house's shared hall.                           */
/*                                                                     */
/*  A living exhibition of human imagination, curiosity and            */
/*  exploration: seven intentions (reflections, creations, dreams,     */
/*  music, books, discoveries, questions) hang here because their      */
/*  makers chose to hang them. Resonance is a tuning, not a trophy;    */
/*  an echo is a response, not a comment section; nothing is ranked,   */
/*  nothing is scored, nothing is sold. The hall reads newest-first,   */
/*  the way an exhibition walks.                                       */
/*                                                                     */
/*  THE HALL'S MANNERS: every offering keeps its maker's name; the     */
/*  composer shows its offering as it will hang before it hangs;       */
/*  long words wrap (the house's wrap laws); the flood-gates stop      */
/*  bursts, not people; and the room's own back rests with the         */
/*  workplace header (THE ONE BACK).                                   */
/* ------------------------------------------------------------------ */

type GatheringKind =
  | "reflection"
  | "creation"
  | "dream"
  | "music"
  | "book"
  | "discovery"
  | "question";

const KIND_META: Record<GatheringKind, { icon: LucideIcon; accent: string }> = {
  reflection: { icon: Feather, accent: "#9fd8dc" },
  creation: { icon: Sparkles, accent: "#e8d9b0" },
  dream: { icon: MoonStar, accent: "#a78bfa" },
  music: { icon: Music, accent: "#a855f7" },
  book: { icon: BookOpen, accent: "#eab308" },
  discovery: { icon: Atom, accent: "#5eead4" },
  question: { icon: CircleQuestionMark, accent: "#f0abfc" },
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

/* the rooms an offering may confess it came from */
const SECTOR_LABELS: Record<string, string> = {
  dreambook: "the Book atelier",
  lightcodes: "the Music room",
  artx: "the ArtX atelier",
  quantum: "the Quantum lab",
  healx: "HealX",
  hyperx: "HyperX",
  manifest: "Manifest",
  invent: "the Forge",
  observatory: "the Observatory",
  akashic: "the Akashic records",
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

export function GatheringView() {
  const t = useT();

  /* ---------------- the hall's own state ---------------- */
  const [tab, setTab] = useState<"hall" | "mine">("hall");
  const [kindFilter, setKindFilter] = useState<GatheringKind | null>(null);
  const [posts, setPosts] = useState<GatheringPost[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* the offering line — the composer */
  const [kind, setKind] = useState<GatheringKind>("reflection");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sector, setSector] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [offering, setOffering] = useState(false);
  const [offerNote, setOfferNote] = useState<string | null>(null);

  /* the echoes — one open row at a time keeps the hall calm */
  const [openEchoes, setOpenEchoes] = useState<string | null>(null);
  const [echoLists, setEchoLists] = useState<Record<string, GatheringEcho[] | null>>({});
  const [echoDraft, setEchoDraft] = useState("");
  const [echoBusy, setEchoBusy] = useState(false);

  const feedRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- the hall's breath (fetch) ---------------- */
  const loadFeed = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      if (opts?.append) setLoadingMore(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (tab === "mine") params.set("mine", "1");
        if (kindFilter) params.set("kind", kindFilter);
        if (opts?.cursor) params.set("cursor", opts.cursor);
        const res = await fetch(`/api/gathering?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as {
          posts?: GatheringPost[];
          nextCursor?: string | null;
          error?: string;
        };
        if (!res.ok || data.error) {
          setError(data.error ?? t("The hall could not be read."));
          setPosts((prev) => (opts?.append ? prev : []));
          return;
        }
        setPosts((prev) => (opts?.append ? [...(prev ?? []), ...(data.posts ?? [])] : data.posts ?? []));
        setCursor(data.nextCursor ?? null);
      } catch {
        setError(t("The hall could not be read."));
        setPosts((prev) => (opts?.append ? prev : []));
      } finally {
        setLoadingMore(false);
      }
    },
    [tab, kindFilter, t]
  );

  useEffect(() => {
    setPosts(null);
    setCursor(null);
    void loadFeed();
  }, [loadFeed]);

  /* ---------------- the offering hand ---------------- */
  const canOffer = title.trim().length >= 2 && body.trim().length >= 2;

  const offer = useCallback(async () => {
    if (!canOffer || offering) return;
    setOffering(true);
    setOfferNote(null);
    try {
      const res = await fetch("/api/gathering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim(),
          body: body.trim(),
          sector: sector.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { post?: GatheringPost; error?: string };
      if (!res.ok || !data.post) {
        setOfferNote(data.error ?? t("The offering could not be placed."));
        return;
      }
      /* the offering hangs at the hall's head at once */
      setPosts((prev) => [data.post as GatheringPost, ...(prev ?? [])]);
      setTitle("");
      setBody("");
      setSector("");
      setPreviewing(false);
      setOfferNote(t("Your offering now hangs in the hall."));
      /* my-offerings tab holds the new stone too */
    } catch {
      setOfferNote(t("The offering could not be placed."));
    } finally {
      setOffering(false);
    }
  }, [canOffer, offering, kind, title, body, sector, t]);

  /* ---------------- the resonance hand ---------------- */
  const toggleResonance = useCallback(
    async (post: GatheringPost) => {
      /* the optimistic tuning — the hall feels the touch at once */
      setPosts((prev) =>
        (prev ?? []).map((p) =>
          p.id === post.id
            ? {
                ...p,
                resonated: !p.resonated,
                resonanceCount: p.resonanceCount + (p.resonated ? -1 : 1),
              }
            : p
        )
      );
      try {
        const res = await fetch(`/api/gathering/${post.id}/resonate`, { method: "POST" });
        const data = (await res.json()) as { resonated?: boolean; resonanceCount?: number; error?: string };
        if (!res.ok || typeof data.resonated !== "boolean") {
          throw new Error(data.error ?? "failed");
        }
        /* the truth returns and settles the count */
        setPosts((prev) =>
          (prev ?? []).map((p) =>
            p.id === post.id
              ? { ...p, resonated: data.resonated as boolean, resonanceCount: data.resonanceCount ?? p.resonanceCount }
              : p
          )
        );
      } catch {
        /* the touch is taken back — the hall returns to what was */
        setPosts((prev) =>
          (prev ?? []).map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  resonated: post.resonated,
                  resonanceCount: post.resonanceCount,
                }
              : p
          )
        );
      }
    },
    []
  );

  /* ---------------- the echo hands ---------------- */
  const openEchoRow = useCallback(
    async (post: GatheringPost) => {
      const next = openEchoes === post.id ? null : post.id;
      setOpenEchoes(next);
      setEchoDraft("");
      if (next && !echoLists[post.id]) {
        setEchoLists((prev) => ({ ...prev, [post.id]: null }));
        try {
          const res = await fetch(`/api/gathering/${post.id}/echoes`, { cache: "no-store" });
          const data = (await res.json()) as { echoes?: GatheringEcho[] };
          setEchoLists((prev) => ({ ...prev, [post.id]: data.echoes ?? [] }));
        } catch {
          setEchoLists((prev) => ({ ...prev, [post.id]: [] }));
        }
      }
    },
    [openEchoes, echoLists]
  );

  const speakEcho = useCallback(
    async (post: GatheringPost) => {
      const text = echoDraft.trim();
      if (text.length < 2 || echoBusy) return;
      setEchoBusy(true);
      try {
        const res = await fetch(`/api/gathering/${post.id}/echoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        const data = (await res.json()) as { echo?: GatheringEcho; echoCount?: number; error?: string };
        if (!res.ok || !data.echo) {
          setError(data.error ?? t("The echo could not be spoken."));
          return;
        }
        setEchoLists((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), data.echo as GatheringEcho] }));
        setPosts((prev) =>
          (prev ?? []).map((p) => (p.id === post.id ? { ...p, echoCount: data.echoCount ?? p.echoCount + 1 } : p))
        );
        setEchoDraft("");
      } catch {
        setError(t("The echo could not be spoken."));
      } finally {
        setEchoBusy(false);
      }
    },
    [echoDraft, echoBusy, t]
  );

  /* ---------------- the taking-back hand ---------------- */
  const takeBack = useCallback(
    async (post: GatheringPost) => {
      setPosts((prev) => (prev ?? []).filter((p) => p.id !== post.id));
      try {
        await fetch(`/api/gathering/${post.id}`, { method: "DELETE" });
      } catch {
        /* the hall's truth re-reads on the next turn */
      }
    },
    []
  );

  /* ---------------- the room's dress ---------------- */
  const chips = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2 pt-1 sm:px-5">
        <button
          type="button"
          onClick={() => setKindFilter(null)}
          aria-pressed={kindFilter === null}
          data-testid="gathering-filter-all"
          className={cn(
            "focus-glow flex h-7 items-center rounded-full border px-3 text-[11px] transition-all duration-300",
            kindFilter === null
              ? "border-[var(--hairline-active)] bg-foreground/8 text-foreground"
              : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
          )}
        >
          {t("All intentions")}
        </button>
        {KIND_ORDER.map((k) => {
          const meta = KIND_META[k];
          const Icon = meta.icon;
          const active = kindFilter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(active ? null : k)}
              aria-pressed={active}
              data-testid={`gathering-filter-${k}`}
              className={cn(
                "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] transition-all duration-300",
                active
                  ? "border-[var(--hairline-active)] bg-foreground/8 text-foreground"
                  : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
              )}
            >
              <Icon className="size-3 shrink-0" style={{ color: meta.accent }} aria-hidden="true" />
              {t(
                k === "reflection"
                  ? "Reflections"
                  : k === "creation"
                    ? "Creations"
                    : k === "dream"
                      ? "Dreams"
                      : k === "music"
                        ? "Music"
                        : k === "book"
                          ? "Books"
                          : k === "discovery"
                            ? "Discoveries"
                            : "Questions"
              )}
            </button>
          );
        })}
      </div>
    ),
    [kindFilter, t]
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* ---------- top bar ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-background">
        <div className="bar-safe flex items-center justify-between gap-2 px-3 sm:px-5">
          <nav role="tablist" aria-label={t("The Gathering")} className="flex items-center gap-1 sm:gap-1.5">
            {(
              [
                { id: "hall" as const, label: t("The hall"), icon: Waypoints },
                { id: "mine" as const, label: t("My offerings"), icon: Feather },
              ]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-label={label}
                title={label}
                onClick={() => setTab(id)}
                data-testid={`gathering-tab-${id}`}
                className={cn(
                  "focus-glow flex size-8 items-center justify-center rounded-full border transition-all duration-300 sm:size-9",
                  tab === id
                    ? "border-[var(--hairline-active)] bg-foreground/8 text-foreground glow-sm"
                    : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            ))}
          </nav>
          <span className="flex size-9 items-center justify-center rounded-full border hairline" aria-hidden="true">
            <Waypoints className="size-4 text-[#d9c99a]" />
          </span>
        </div>
        {chips}
      </header>

      {/* ---------- the body ---------- */}
      <main ref={feedRef} className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[680px] px-3 pb-16 pt-4 sm:px-5">
          {/* ============ THE OFFERING LINE ============ */}
          {tab === "hall" && (
            <section
              aria-label={t("The offering line")}
              data-testid="gathering-composer"
              className="mb-8 rounded-2xl border hairline bg-background/60 p-4"
            >
              <p className="mono-label text-[8.5px] uppercase tracking-[0.28em] text-muted-foreground/70">
                {t("The offering line")}
              </p>

              {/* the seven intentions */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {KIND_ORDER.map((k) => {
                  const meta = KIND_META[k];
                  const Icon = meta.icon;
                  const active = kind === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      aria-pressed={active}
                      data-testid={`gathering-intention-${k}`}
                      className={cn(
                        "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-all duration-300",
                        active
                          ? "border-[var(--hairline-active)] bg-foreground/8 text-foreground"
                          : "border-transparent text-muted-foreground/75 hover:border-[var(--hairline-hover)] hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3 shrink-0" style={{ color: meta.accent }} aria-hidden="true" />
                      {t(
                        k === "reflection"
                          ? "A reflection"
                          : k === "creation"
                            ? "A creation"
                            : k === "dream"
                              ? "A dream"
                              : k === "music"
                                ? "A composition"
                                : k === "book"
                                  ? "A written work"
                                  : k === "discovery"
                                    ? "A discovery"
                                    : "A question"
                      )}
                    </button>
                  );
                })}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t("Give the offering its name…")}
                aria-label={t("Give the offering its name…")}
                data-testid="gathering-title"
                className="mt-3 w-full rounded-xl border hairline bg-transparent px-3.5 py-2.5 text-[13.5px] text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/50 focus:border-[var(--hairline-active)] [overflow-wrap:anywhere]"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={4000}
                rows={4}
                placeholder={t("Speak the offering itself — a reflection, a story of a creation, a dream, a discovery, a question…")}
                aria-label={t("Speak the offering itself")}
                data-testid="gathering-body"
                className="mt-2 w-full resize-none rounded-xl border hairline bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/50 focus:border-[var(--hairline-active)] [overflow-wrap:anywhere]"
              />

              {/* where it came from — the offering's own confession */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  maxLength={24}
                  placeholder={t("Woven in… (a room's name, optional)")}
                  aria-label={t("Woven in… (a room's name, optional)")}
                  data-testid="gathering-sector"
                  className="min-w-0 flex-1 rounded-full border hairline bg-transparent px-3.5 py-1.5 text-[12px] text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/50 focus:border-[var(--hairline-active)] [overflow-wrap:anywhere]"
                />
                {!previewing ? (
                  <button
                    type="button"
                    onClick={() => setPreviewing(true)}
                    disabled={!canOffer}
                    aria-label={t("Preview the offering")}
                    data-testid="gathering-preview"
                    className="focus-glow flex h-9 items-center gap-1.5 rounded-full border px-4 text-[12.5px] text-foreground transition-all duration-300 enabled:hover:bg-foreground/5 disabled:opacity-40"
                    style={{ borderColor: "color-mix(in srgb, #d9c99a 45%, transparent)" }}
                  >
                    <Send className="size-3.5" aria-hidden="true" />
                    {t("Preview the offering")}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewing(false)}
                      aria-label={t("Keep shaping")}
                      data-testid="gathering-cancel"
                      className="focus-glow flex h-9 items-center rounded-full border hairline px-3.5 text-[12.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
                    >
                      {t("Keep shaping")}
                    </button>
                    <button
                      type="button"
                      onClick={offer}
                      disabled={offering}
                      aria-label={t("Hang it in the hall")}
                      data-testid="gathering-offer"
                      className="focus-glow flex h-9 items-center gap-1.5 rounded-full border border-[#d9c99a]/60 bg-[#d9c99a]/10 px-4 text-[12.5px] font-medium text-[#d9c99a] transition-all duration-300 hover:bg-[#d9c99a]/16 disabled:opacity-50"
                    >
                      <Send className="size-3.5" aria-hidden="true" />
                      {offering ? t("Hanging…") : t("Hang it in the hall")}
                    </button>
                  </div>
                )}
              </div>

              {offerNote && (
                <p className="mt-2.5 text-[12px] italic text-[#d9c99a] [overflow-wrap:anywhere]" data-testid="gathering-note">
                  {offerNote}
                </p>
              )}

              {/* the offering as it will hang — the preview */}
              {previewing && canOffer && (
                <div className="mt-3">
                  <PostCard
                    post={{
                      id: "preview",
                      kind,
                      title: title.trim(),
                      body: body.trim(),
                      sector: sector.trim() || null,
                      resonanceCount: 0,
                      echoCount: 0,
                      createdAt: new Date().toISOString(),
                      author: { name: t("you"), image: null, anon: false },
                      mine: true,
                      resonated: false,
                    }}
                    preview
                  />
                </div>
              )}
            </section>
          )}

          {/* ============ THE LIVING EXHIBITION ============ */}
          {posts === null ? (
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border hairline bg-foreground/[0.03]" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center" data-testid="gathering-empty">
              <span className="flex size-12 items-center justify-center rounded-full border hairline">
                <Waypoints className="size-5 text-[#d9c99a]" aria-hidden="true" />
              </span>
              <p className="max-w-[380px] text-[13.5px] leading-relaxed text-muted-foreground">
                {tab === "mine"
                  ? t("You have not hung anything yet — the offering line above waits for your first stone.")
                  : t("The hall rests quiet — be the first to hang a reflection, a dream, a discovery or a question.")}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4" data-testid="gathering-feed">
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onResonate={toggleResonance}
                    onEcho={openEchoRow}
                    onTakeBack={takeBack}
                    echoOpen={openEchoes === p.id}
                    echoList={echoLists[p.id]}
                    echoDraft={openEchoes === p.id ? echoDraft : ""}
                    setEchoDraft={setEchoDraft}
                    onSpeakEcho={speakEcho}
                    echoBusy={echoBusy}
                  />
                ))}
              </div>
              {cursor && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void loadFeed({ append: true, cursor })}
                    disabled={loadingMore}
                    data-testid="gathering-more"
                    className="focus-glow flex h-9 items-center gap-1.5 rounded-full border hairline px-4 text-[12.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:opacity-50"
                  >
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                    {loadingMore ? t("The exhibition arrives…") : t("The exhibition continues")}
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-[12.5px] text-red-300 [overflow-wrap:anywhere]" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE OFFERING'S CARD — how one post hangs in the hall.              */
/* ------------------------------------------------------------------ */
function PostCard({
  post,
  preview = false,
  onResonate,
  onEcho,
  onTakeBack,
  echoOpen = false,
  echoList,
  echoDraft = "",
  setEchoDraft,
  onSpeakEcho,
  echoBusy = false,
}: {
  post: GatheringPost;
  preview?: boolean;
  onResonate?: (p: GatheringPost) => void;
  onEcho?: (p: GatheringPost) => void;
  onTakeBack?: (p: GatheringPost) => void;
  echoOpen?: boolean;
  echoList?: GatheringEcho[] | null;
  echoDraft?: string;
  setEchoDraft?: (v: string) => void;
  onSpeakEcho?: (p: GatheringPost) => void;
  echoBusy?: boolean;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const meta = KIND_META[(post.kind as GatheringKind) in KIND_META ? (post.kind as GatheringKind) : "reflection"];
  const Icon = meta.icon;
  const long = post.body.length > 420;
  const shownBody = long && !expanded ? `${post.body.slice(0, 420)}…` : post.body;
  const sectorName = post.sector ? (SECTOR_LABELS[post.sector] ?? post.sector) : null;

  return (
    <article
      data-testid={preview ? "gathering-preview-card" : `gathering-post-${post.id}`}
      className={cn(
        "rounded-2xl border hairline bg-background/60 p-4 transition-colors duration-300",
        preview && "border-[#d9c99a]/35 bg-[#d9c99a]/[0.04]"
      )}
    >
      {/* the maker's row */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: `color-mix(in srgb, ${meta.accent} 40%, transparent)`,
            background: `color-mix(in srgb, ${meta.accent} 10%, transparent)`,
          }}
        >
          <Icon className="size-3.5" style={{ color: meta.accent }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold text-foreground [overflow-wrap:anywhere]">
              {post.author.name}
            </span>
            <span className="mono-label text-[8px] uppercase tracking-[0.18em] text-muted-foreground/60">
              {t(
                post.kind === "reflection"
                  ? "a reflection"
                  : post.kind === "creation"
                    ? "a creation"
                    : post.kind === "dream"
                      ? "a dream"
                      : post.kind === "music"
                        ? "a composition"
                        : post.kind === "book"
                          ? "a written work"
                          : post.kind === "discovery"
                            ? "a discovery"
                            : "a question"
              )}
            </span>
            {!preview && (
              <span className="text-[10.5px] text-muted-foreground/60">
                {relativeTime(post.createdAt, t)}
              </span>
            )}
            {preview && (
              <span className="mono-label text-[8px] uppercase tracking-[0.18em] text-[#d9c99a]">
                {t("as it will hang")}
              </span>
            )}
          </div>
          {sectorName && (
            <p className="mt-0.5 text-[10.5px] italic text-muted-foreground/60 [overflow-wrap:anywhere]">
              {t("woven in")} {sectorName}
            </p>
          )}
        </div>
        {post.mine && !preview && onTakeBack && (
          <button
            type="button"
            onClick={() => onTakeBack(post)}
            aria-label={t("Take this offering back")}
            title={t("Take this offering back")}
            data-testid={`gathering-takeback-${post.id}`}
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border border-transparent text-muted-foreground/60 transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* the offering itself */}
      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
        {post.title}
      </h3>
      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-[1.75] text-foreground/85 [overflow-wrap:anywhere]">
        {shownBody}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="focus-glow mt-1.5 flex items-center gap-1 text-[12px] text-[#d9c99a] transition-opacity duration-300 hover:opacity-80"
          aria-expanded={expanded}
        >
          {expanded ? t("fold the offering") : t("read the whole offering")}
          <ChevronDown className={cn("size-3 transition-transform duration-300", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      )}

      {/* the hall's manners row — resonance and echoes */}
      {!preview && (
        <div className="mt-3.5 flex items-center gap-1.5 border-t hairline pt-3">
          <button
            type="button"
            onClick={() => onResonate?.(post)}
            aria-pressed={post.resonated}
            aria-label={t("Resonate with this offering")}
            data-testid={`gathering-resonate-${post.id}`}
            className={cn(
              "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-all duration-300",
              post.resonated
                ? "border-[#d9c99a]/55 bg-[#d9c99a]/10 text-[#d9c99a]"
                : "border-transparent text-muted-foreground/75 hover:border-[var(--hairline-hover)] hover:text-foreground"
            )}
          >
            <Waves className={cn("size-3.5", post.resonated && "text-[#d9c99a]")} aria-hidden="true" />
            {post.resonanceCount > 0 && <span>{post.resonanceCount}</span>}
            <span className="hidden sm:inline">{t("Resonate")}</span>
          </button>
          <button
            type="button"
            onClick={() => onEcho?.(post)}
            aria-expanded={echoOpen}
            aria-label={t("Echoes")}
            data-testid={`gathering-echo-toggle-${post.id}`}
            className={cn(
              "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-all duration-300",
              echoOpen
                ? "border-[var(--hairline-active)] bg-foreground/8 text-foreground"
                : "border-transparent text-muted-foreground/75 hover:border-[var(--hairline-hover)] hover:text-foreground"
            )}
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {post.echoCount > 0 && <span>{post.echoCount}</span>}
            <span className="hidden sm:inline">{t("Echoes")}</span>
          </button>
        </div>
      )}

      {/* the echo row */}
      {echoOpen && (
        <div className="mt-3 border-t hairline pt-3" data-testid={`gathering-echoes-${post.id}`}>
          {echoList === null ? (
            <p className="py-2 text-center text-[12px] text-muted-foreground/60">{t("The echoes arrive…")}</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1 nice-scroll">
              {(echoList ?? []).length === 0 && (
                <p className="py-1 text-[12px] italic text-muted-foreground/60">{t("No echoes yet — speak the first response.")}</p>
              )}
              {(echoList ?? []).map((e) => (
                <div key={e.id} className="flex items-start gap-2.5" data-testid={`gathering-echo-${e.id}`}>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border hairline text-[9px] font-semibold text-foreground/80"
                  >
                    {e.author.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl border hairline bg-foreground/[0.03] px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[12px] font-semibold text-foreground/90 [overflow-wrap:anywhere]">
                        {e.author.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {relativeTime(e.createdAt, t)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/80 [overflow-wrap:anywhere]">
                      {e.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* the echo's own line */}
          <div className="mt-3 flex items-center gap-2">
            <input
              value={echoDraft}
              onChange={(e) => setEchoDraft?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSpeakEcho?.(post);
                }
              }}
              maxLength={600}
              placeholder={t("Speak an echo — a calm response…")}
              aria-label={t("Speak an echo — a calm response…")}
              data-testid={`gathering-echo-input-${post.id}`}
              className="min-w-0 flex-1 rounded-full border hairline bg-transparent px-3.5 py-2 text-[12.5px] text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/50 focus:border-[var(--hairline-active)] [overflow-wrap:anywhere]"
            />
            <button
              type="button"
              onClick={() => onSpeakEcho?.(post)}
              disabled={echoBusy || echoDraft.trim().length < 2}
              aria-label={t("Speak the echo")}
              data-testid={`gathering-echo-send-${post.id}`}
              className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d9c99a]/45 text-[#d9c99a] transition-all duration-300 hover:bg-[#d9c99a]/10 disabled:opacity-40"
            >
              <Send className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
