"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Atom,
  BookOpen,
  ChevronDown,
  Compass,
  Feather,
  Globe2,
  Handshake,
  Library,
  Loader2,
  Music,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  Users,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  EmptyRoom,
  GP_CARD,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  MakerMark,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE DISCOVER CURRENT — an exploration environment beside the       */
/*  hall, never a second feed. Six mouths, one current:                */
/*                                                                     */
/*    FOR YOU     a personal blend — interest threads first, recency   */
/*                second; never a leaderboard, never a score           */
/*    PEOPLE      the makers' directory                                */
/*    CREATIONS   the unified gallery of published works               */
/*    CIRCLES     the communities                                      */
/*    PROJECTS    the collaborative works seeking hands                */
/*    KNOWLEDGE   public contributions, each wearing its own label:    */
/*                established · hypothesis · interpretation · creative */
/*                                                                     */
/*  Private things never enter the current — the server enforces       */
/*  visibility at retrieval time, not the visitor's politeness.        */
/* ------------------------------------------------------------------ */

interface DiscoverCreation {
  id: string;
  title: string;
  preview: string;
  kind: string;
  contentType: string;
  sourcePortal: string | null;
  cover: string | null;
  refUrl: string | null;
  tags: string | null;
  resonanceCount: number;
  echoCount?: number;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
}

interface DiscoverMaker {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  disciplines: string | null;
  interests: string | null;
  publicCreations?: number;
  sharedProjects?: number;
  following?: boolean;
  connectionState?: string | null;
}

interface DiscoverCircle {
  id: string;
  name: string;
  focus: string;
  description: string | null;
  members: number;
  posts: number;
  joined: boolean;
  owner: { id: string; name: string };
}

interface DiscoverProject {
  id: string;
  title: string;
  description: string | null;
  focus: string;
  status: string;
  seeking: boolean;
  requiredSkills: string | null;
  owner: { id: string; name: string; image: string | null };
  members: number;
  entries: number;
  joined: boolean;
  isOwner: boolean;
}

interface DiscoverKnowledge {
  id: string;
  title: string;
  preview: string;
  epistemicLabel: string | null;
  contentType: string;
  sourcePortal: string | null;
  tags: string | null;
  resonanceCount: number;
  createdAt: string;
  author: { id: string; name: string };
}

interface ForYouPayload {
  interests: string[];
  creations: DiscoverCreation[];
  makers: DiscoverMaker[];
  circles: DiscoverCircle[];
  projects: DiscoverProject[];
  knowledge: DiscoverKnowledge[];
  themes: Array<{ tag: string; count: number }>;
}

interface ReaderPost {
  id: string;
  kind: string;
  title: string;
  body: string;
  tags: string[];
  sourcePortal: string | null;
  sourceType: string | null;
  cover: string | null;
  refUrl: string | null;
  resonanceCount: number;
  echoCount: number;
  createdAt: string;
  author: { id?: string; name: string; image: string | null; anon: boolean };
  mine: boolean;
  resonated: boolean;
}

interface ReaderEcho {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; image: string | null; anon: boolean };
  isMine: boolean;
}

type Dest = "for-you" | "people" | "creations" | "circles" | "projects" | "knowledge";

const DESTS: Array<{ key: Dest; label: string; icon: LucideIcon }> = [
  { key: "for-you", label: "For You", icon: Sparkles },
  { key: "people", label: "People", icon: Users },
  { key: "creations", label: "Creations", icon: Library },
  { key: "circles", label: "Circles", icon: Globe2 },
  { key: "projects", label: "Projects", icon: Handshake },
  { key: "knowledge", label: "Knowledge", icon: BookOpen },
];

const TYPE_META: Record<string, { icon: LucideIcon; accent: string }> = {
  artwork: { icon: Feather, accent: "#8a6f46" },
  music: { icon: Music, accent: "#0f766e" },
  book: { icon: BookOpen, accent: "#8a6d3b" },
  story: { icon: BookOpen, accent: "#8a6d3b" },
  dream: { icon: Sparkles, accent: "#7c5cad" },
  research: { icon: Atom, accent: "#0d9488" },
  exploration: { icon: Atom, accent: "#0d9488" },
  transmission: { icon: Sparkles, accent: "#7c5cad" },
  reflection: { icon: Feather, accent: "#8a6f46" },
  intention: { icon: Sparkles, accent: "#a16207" },
  invention: { icon: Compass, accent: "#a16207" },
};

const EPISTEMIC_DRESS: Record<string, { label: string; color: string; bg: string; edge: string }> = {
  established: { label: "Established", color: "#0f766e", bg: "#eef7f4", edge: "#bcdcd6" },
  hypothesis: { label: "Hypothesis", color: "#9a5b21", bg: "#faf1e4", edge: "#e5d2b4" },
  interpretation: { label: "Interpretation", color: "#7c5cad", bg: "#f3eef9", edge: "#d6c8e8" },
  creative: { label: "Creative", color: "#a16207", bg: "#faf5e6", edge: "#e3d4ae" },
};

const CONTENT_TYPES = ["", "artwork", "music", "book", "research", "transmission", "invention"];

export default function DiscoverSection({
  active,
  onOpenMessages: _onOpenMessages,
}: {
  active: boolean;
  onOpenMessages: () => void;
}) {
  const t = useT();
  const [dest, setDest] = useState<Dest>("for-you");
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [epistemicFilter, setEpistemicFilter] = useState("");
  const [seekingOnly, setSeekingOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forYou, setForYou] = useState<ForYouPayload | null>(null);
  const [people, setPeople] = useState<DiscoverMaker[] | null>(null);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [creations, setCreations] = useState<DiscoverCreation[] | null>(null);
  const [circles, setCircles] = useState<DiscoverCircle[] | null>(null);
  const [projects, setProjects] = useState<DiscoverProject[] | null>(null);
  const [knowledge, setKnowledge] = useState<DiscoverKnowledge[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  /* THE READER — a publication opened whole: the full body, its echoes
     and its resonance, never a truncated card. Every work card in the
     current opens this reader. */
  const [reading, setReading] = useState<string | null>(null);
  const [readerPost, setReaderPost] = useState<ReaderPost | null>(null);
  const [readerEchoes, setReaderEchoes] = useState<ReaderEcho[]>([]);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerEchoDraft, setReaderEchoDraft] = useState("");
  const [readerSending, setReaderSending] = useState(false);

  /* THE DEEP CURRENT — creations read on and on: the sentinel hand
     pours the next page when it reaches the bottom of the scroll. */
  const [creationsCursor, setCreationsCursor] = useState<string | null>(null);
  const [creationsHasMore, setCreationsHasMore] = useState(false);
  const [creationsMoreLoading, setCreationsMoreLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* the preferences' quiet drawer — explicit interests tune the current */
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [interestDraft, setInterestDraft] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const read = useCallback(
    async (which: Dest, term: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ dest: which });
        if (term) params.set("q", term);
        if (which === "creations" && typeFilter) params.set("type", typeFilter);
        if (which === "knowledge" && epistemicFilter) params.set("epistemic", epistemicFilter);
        if (which === "projects" && seekingOnly) params.set("seeking", "1");
        if (which === "people" && sort) params.set("sort", sort);
        const data = await netFetch<Record<string, unknown>>(`/api/discover?${params.toString()}`);
        if (which === "for-you") {
          const p = data as unknown as ForYouPayload;
          setForYou(p);
          setInterests(p.interests ?? []);
        } else if (which === "people") setPeople((data as { people: DiscoverMaker[] }).people);
        else if (which === "creations") {
          const d = data as { creations: DiscoverCreation[]; hasMore?: boolean; cursor?: string | null };
          setCreations(d.creations);
          setCreationsHasMore(Boolean(d.hasMore));
          setCreationsCursor(d.cursor ?? null);
        }
        else if (which === "circles") setCircles((data as { circles: DiscoverCircle[] }).circles);
        else if (which === "projects") setProjects((data as { projects: DiscoverProject[] }).projects);
        else if (which === "knowledge") setKnowledge((data as { knowledge: DiscoverKnowledge[] }).knowledge);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The current could not be reached.");
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, epistemicFilter, seekingOnly, sort]
  );

  /* the section's first breath */
  useEffect(() => {
    if (!active) return;
    if (dest === "for-you" && !forYou) void read("for-you", searchTerm);
    if (dest === "people" && people === null) void read("people", searchTerm);
    if (dest === "creations" && creations === null) void read("creations", searchTerm);
    if (dest === "circles" && circles === null) void read("circles", searchTerm);
    if (dest === "projects" && projects === null) void read("projects", searchTerm);
    if (dest === "knowledge" && knowledge === null) void read("knowledge", searchTerm);
    /* each mouth reads when it first opens — the shared hand re-reads on demand */
     
  }, [active, dest]);

  const runSearch = () => {
    const term = q.trim();
    setSearchTerm(term);
    void read(dest, term);
  };

  /* THE DEEP CURRENT'S HAND — pour the next page of creations into the
     same grid (the shelf never ends at fifteen works). */
  const loadMoreCreations = useCallback(async () => {
    if (!creationsHasMore || creationsMoreLoading || creationsCursor === null) return;
    setCreationsMoreLoading(true);
    try {
      const params = new URLSearchParams({ dest: "creations", cursor: creationsCursor });
      if (searchTerm) params.set("q", searchTerm);
      if (typeFilter) params.set("type", typeFilter);
      const data = await netFetch<{ creations: DiscoverCreation[]; hasMore?: boolean; cursor?: string | null }>(
        `/api/discover?${params.toString()}`
      );
      const more = data.creations ?? [];
      setCreations((prev) => [...(prev ?? []), ...more]);
      setCreationsHasMore(Boolean(data.hasMore));
      setCreationsCursor(data.cursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The current could not be reached.");
    } finally {
      setCreationsMoreLoading(false);
    }
  }, [creationsHasMore, creationsMoreLoading, creationsCursor, searchTerm, typeFilter]);

  /* the sentinel — one breath above the floor, the next page arrives */
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || dest !== "creations" || !creationsHasMore) return;
    const sentinel = root.querySelector<HTMLElement>("[data-current-sentinel]");
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMoreCreations();
      },
      { root, rootMargin: "400px 0px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [dest, creationsHasMore, loadMoreCreations]);

  /* ------------------- THE READER'S OWN HANDS ----------------------- */

  const openReader = useCallback(async (id: string) => {
    setReading(id);
    setReaderPost(null);
    setReaderEchoes([]);
    setReaderError(null);
    setReaderEchoDraft("");
    setReaderLoading(true);
    try {
      const data = await netFetch<{ post: ReaderPost; echoes: ReaderEcho[] }>(`/api/gathering/${id}`);
      setReaderPost(data.post);
      setReaderEchoes(data.echoes ?? []);
    } catch (err) {
      setReaderError(err instanceof Error ? err.message : "The offering could not be opened.");
    } finally {
      setReaderLoading(false);
    }
  }, []);

  const closeReader = useCallback(() => {
    setReading(null);
    setReaderPost(null);
    setReaderError(null);
  }, []);

  /* the reader's echo hand — a response, signed, calm */
  const sendReaderEcho = useCallback(async () => {
    if (!reading || readerEchoDraft.trim().length < 2) return;
    setReaderSending(true);
    try {
      const data = await netFetch<{ echo: ReaderEcho }>(`/api/gathering/${reading}/echoes`, {
        method: "POST",
        body: { body: readerEchoDraft.trim() },
      });
      setReaderEchoes((prev) => [...prev, data.echo]);
      setReaderEchoDraft("");
      setReaderPost((prev) => (prev ? { ...prev, echoCount: prev.echoCount + 1 } : prev));
    } catch {
      setNote("The echo could not be carried.");
    } finally {
      setReaderSending(false);
    }
  }, [reading, readerEchoDraft]);

  /* the reader's resonance hand — one tuning, taken back freely; the
     server's own count comes back, so the column never drifts */
  const toggleReaderResonance = useCallback(async () => {
    if (!reading || !readerPost) return;
    try {
      const data = await netFetch<{ resonated: boolean; resonanceCount: number }>(
        `/api/gathering/${reading}/resonate`,
        { method: "POST", body: {} }
      );
      setReaderPost((prev) =>
        prev ? { ...prev, resonated: data.resonated, resonanceCount: data.resonanceCount } : prev
      );
      /* the cards of the same work keep their honest counts */
      setCreations((prev) =>
        prev
          ? prev.map((c) => (c.id === reading ? { ...c, resonanceCount: data.resonanceCount } : c))
          : prev
      );
    } catch {
      setNote("The resonance could not be tuned.");
    }
  }, [reading, readerPost]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(id);
  }, [note]);

  /* ---------------- hands: follow, connect, join ---------------- */

  const follow = useCallback(async (makerId: string) => {
    try {
      await netFetch(`/api/network/people/${makerId}`, { method: "POST", body: {} });
      setPeople((prev) => prev?.map((p) => (p.id === makerId ? { ...p, following: !p.following } : p)) ?? prev);
      setNote("The follow has changed hands.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "The door would not open.");
    }
  }, []);

  const connect = useCallback(async (makerId: string) => {
    try {
      await netFetch("/api/network/connections", { method: "POST", body: { userId: makerId } });
      setPeople((prev) => prev?.map((p) => (p.id === makerId ? { ...p, connectionState: "pending" } : p)) ?? prev);
      setNote("A connection request was carried — their yes is theirs alone.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "The door would not open.");
    }
  }, []);

  const joinCircle = useCallback(async (circleId: string) => {
    try {
      const data = await netFetch<{ joined?: boolean }>(`/api/network/circles/${circleId}`, { method: "POST", body: { action: "join" } });
      setCircles((prev) => prev?.map((c) => (c.id === circleId ? { ...c, joined: data.joined ?? !c.joined } : c)) ?? prev);
      setForYou((prev) => (prev ? { ...prev, circles: prev.circles.map((c) => (c.id === circleId ? { ...c, joined: !c.joined } : c)) } : prev));
      setNote("The circle knows your name now.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "The circle did not open.");
    }
  }, []);

  const joinProject = useCallback(async (projectId: string) => {
    try {
      await netFetch(`/api/network/projects/${projectId}`, { method: "POST", body: { action: "join" } });
      setProjects((prev) => prev?.map((p) => (p.id === projectId ? { ...p, joined: true } : p)) ?? prev);
      setForYou((prev) => (prev ? { ...prev, projects: prev.projects.map((p) => (p.id === projectId ? { ...p, joined: true } : p)) } : prev));
      setNote("You stand among the weavers now.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "The workshop did not open.");
    }
  }, []);

  /* ---------------- preferences: explicit interests ---------------- */

  const savePrefs = useCallback(async () => {
    setSavingPrefs(true);
    try {
      await netFetch("/api/network/me", { method: "PATCH", body: { interests: interestDraft } });
      setInterests(interestDraft.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
      setPrefsOpen(false);
      setNote("The current remembers your threads.");
      void read("for-you", searchTerm);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "The current did not listen.");
    } finally {
      setSavingPrefs(false);
    }
  }, [interestDraft, read, searchTerm]);

  const creationCard = (p: DiscoverCreation) => {
    const meta = TYPE_META[p.contentType] ?? TYPE_META.reflection;
    const Icon = meta.icon;
    return (
      <article
        key={p.id}
        className="gp-card group overflow-hidden rounded-[22px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_38px_-16px_rgba(122,103,70,0.45)]"
        data-testid="discover-creation-card"
      >
        <button
          type="button"
          onClick={() => void openReader(p.id)}
          aria-label={t("Read the whole offering")}
          className="focus-glow block w-full cursor-pointer text-left"
        >
          {p.cover ? (
            <img src={p.cover} alt="" className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-32 items-center justify-center border-b border-[#eadfc4] transition-transform duration-500 sm:h-36"
              style={{ background: `linear-gradient(150deg, color-mix(in srgb, ${meta.accent} 9%, #fffdf8) 0%, #f3ecdb 60%, #ece2cb 100%)` }}
            >
              <Icon className="size-8 opacity-80" style={{ color: meta.accent }} />
            </div>
          )}
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: meta.accent, borderColor: `color-mix(in srgb, ${meta.accent} 34%, transparent)`, background: `color-mix(in srgb, ${meta.accent} 7%, transparent)` }}
              >
                {p.contentType}
              </span>
              {p.sourcePortal && <span className="truncate text-[10px] text-[#b3a68d]">from {p.sourcePortal}</span>}
              <span className="ml-auto shrink-0 text-[10.5px] font-medium text-[#b0a184]">
                {t("Read whole")} →
              </span>
            </div>
            <h3 className="mt-2.5 line-clamp-2 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428]">{p.title}</h3>
            <p className="mt-1.5 line-clamp-4 text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">{p.preview}</p>
            <div className="mt-3 flex items-center gap-2">
              <MakerMark name={p.author.name} size={24} />
              <span className="truncate text-[11.5px] font-semibold text-[#5c5344]">{p.author.name}</span>
              <span className="ml-auto shrink-0 text-[10.5px] text-[#a2947c]">
                {p.resonanceCount} ✦ {p.echoCount !== undefined ? `· ${p.echoCount} ✒` : ""}
              </span>
            </div>
            {p.tags && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {p.tags.split(",").slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full border border-[#e4d9bd] px-2 py-0.5 text-[10px] text-[#8a7c64]">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
      </article>
    );
  };

  const body = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-14 text-[#8a6f46]">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span className="text-[12.5px]">The current gathers itself…</span>
        </div>
      );
    }
    if (error) {
      return <EmptyRoom icon={Search} line={error} />;
    }

    /* ----------------------------- FOR YOU ----------------------------- */
    if (dest === "for-you" && forYou) {
      return (
        <div className="space-y-8" data-testid="discover-for-you">
          {/* the tuning hand */}
          <div className="gp-card flex flex-wrap items-center gap-2 rounded-[18px] p-3.5">
            <SlidersHorizontal className="size-4 shrink-0 text-[#8a6f46]" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-[#7c715f]">
              {interests.length > 0 ? (
                <>
                  The current bends toward:{" "}
                  <span className="font-semibold text-[#5c5344]">{interests.join(" · ")}</span>
                </>
              ) : (
                "Name a few threads of interest and the current bends toward them — no popularity, only relevance."
              )}
            </p>
            <button type="button" onClick={() => { setInterestDraft(interests.join(", ")); setPrefsOpen(true); }} className={cn(GP_GHOST, "min-h-[38px] px-3.5 py-1.5 text-[11.5px]")} data-testid="discover-preferences">
              Tune
            </button>
          </div>

          {forYou.creations.length > 0 && (
            <section aria-label="Public creations">
              <SectionHead label="Works moving through the current" />
              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{forYou.creations.map(creationCard)}</div>
            </section>
          )}

          {forYou.makers.length > 0 && (
            <section aria-label="Makers who may resonate">
              <SectionHead label="Makers who may resonate" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{forYou.makers.map((m) => (
                  <div key={m.id} className="gp-card rounded-[20px] p-4">
                    <div className="flex items-center gap-2.5">
                      <MakerMark name={m.name} size={30} />
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-[#3d3428]">{m.name}</p>
                        {m.disciplines && <p className="truncate text-[10.5px] text-[#a2947c]">{m.disciplines}</p>}
                      </div>
                    </div>
                    {m.bio && <p className="mt-2 line-clamp-2 text-[11.5px] leading-[1.6] text-[#7c715f]">{m.bio}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {forYou.circles.length > 0 && (
            <section aria-label="Circles at work">
              <SectionHead label="Circles at work" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {forYou.circles.map((c) => (
                  <div key={c.id} className="gp-card rounded-[20px] p-4">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">{c.focus}</p>
                    <h3 className="mt-1 font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">{c.name}</h3>
                    {c.description && <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.6] text-[#7c715f]">{c.description}</p>}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[10.5px] text-[#a2947c]">{c.members} members · {c.posts} offerings</span>
                      <button type="button" onClick={() => void joinCircle(c.id)} disabled={c.joined} className={cn(c.joined ? GP_GHOST : GP_HAND, "min-h-[36px] px-3 py-1 text-[11px]")}>
                        {c.joined ? "Joined" : "Join"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {forYou.projects.length > 0 && (
            <section aria-label="Open doors for collaborators">
              <SectionHead label="Doors open for collaborators" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {forYou.projects.map((p) => (
                  <div key={p.id} className="gp-card rounded-[20px] p-4">
                    <div className="flex items-center gap-2">
                      {p.seeking && (
                        <span className="rounded-full border border-[#c7d8c0] bg-[#eef5ea] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#5f7a52]">
                          seeking hands
                        </span>
                      )}
                      <span className="text-[10px] text-[#b3a68d]">{p.status}</span>
                    </div>
                    <h3 className="mt-1.5 font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">{p.title}</h3>
                    {p.description && <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.6] text-[#7c715f]">{p.description}</p>}
                    {p.requiredSkills && <p className="mt-1.5 text-[10.5px] text-[#a2947c]">threads sought: {p.requiredSkills}</p>}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="truncate text-[10.5px] text-[#a2947c]">kept by {p.owner.name}</span>
                      <button type="button" onClick={() => void joinProject(p.id)} disabled={p.joined || p.isOwner} className={cn(p.joined || p.isOwner ? GP_GHOST : GP_HAND, "min-h-[36px] px-3 py-1 text-[11px]")}>
                        {p.isOwner ? "Yours" : p.joined ? "Joined" : "Join"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {forYou.knowledge.length > 0 && (
            <section aria-label="Recent knowledge">
              <SectionHead label="Recent knowledge, labeled" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{forYou.knowledge.map(knowledgeCard)}</div>
            </section>
          )}

          {forYou.themes.length > 0 && (
            <section aria-label="Threads the community is pulling">
              <SectionHead label="Threads the community is pulling" />
              <div className="flex flex-wrap gap-2">
                {forYou.themes.map(({ tag, count }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => { setQ(tag); setSearchTerm(tag); void read("creations", tag); setDest("creations"); }}
                    className="focus-glow rounded-full border border-[#e4d9bd] bg-white/60 px-3 py-1.5 text-[11px] text-[#7c715f] transition-colors hover:border-[#cbb98d] hover:text-[#3d3428]"
                  >
                    #{tag} <span className="text-[#b3a68d]">· {count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <MirrorConnections onNote={setNote} />
        </div>
      );
    }

    /* ----------------------------- PEOPLE ------------------------------ */
    if (dest === "people") {
      return (
        <div data-testid="discover-people" className="space-y-3">
          <div className="flex items-center gap-2">
            <select value={sort} onChange={(e) => { setSort(e.target.value as "recent" | "name"); void read("people", searchTerm); }} aria-label="Sort" className="rounded-[14px] border border-[#e4d9bd] bg-white/80 px-3 py-2 text-[12px] text-[#5c5344] outline-none focus:border-[#cbb98d]">
              <option value="recent">Recently active</option>
              <option value="name">By name</option>
            </select>
            <p className="text-[11px] text-[#a2947c]">Only public introductions stand here.</p>
          </div>
          {(people ?? []).length === 0 ? (
            <EmptyRoom icon={Users} line={t("No makers answer that word yet — the directory waits.")} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(people ?? []).map((m) => (
                <article key={m.id} className="gp-card rounded-[20px] p-4" data-testid="discover-person-card">
                  <div className="flex items-start gap-3">
                    <MakerMark name={m.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-[#3d3428]">{m.name}</p>
                      {m.disciplines && <p className="mt-0.5 truncate text-[10.5px] uppercase tracking-[0.1em] text-[#a2947c]">{m.disciplines}</p>}
                      {m.bio && <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.6] text-[#7c715f]">{m.bio}</p>}
                      {m.interests && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {m.interests.split(",").slice(0, 3).map((i) => (
                            <span key={i} className="rounded-full border border-[#e4d9bd] px-2 py-0.5 text-[9.5px] text-[#8a7c64]">{i.trim()}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-1.5 text-[10.5px] text-[#b3a68d]">
                        {m.publicCreations ?? 0} works · {m.sharedProjects ?? 0} shared works
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => void follow(m.id)} className={cn(GP_GHOST, "min-h-[38px] flex-1 py-1.5 text-[11.5px]")} data-testid={`discover-follow-${m.id}`}>
                      <UserCheck className="size-3.5" aria-hidden="true" />
                      {m.following ? "Following" : "Follow"}
                    </button>
                    {m.connectionState === "accepted" ? (
                      <span className="min-h-[38px] flex-1 rounded-full border border-[#d8e5d0] bg-[#f2f7ee] px-3 py-2 text-center text-[11.5px] font-semibold text-[#5f7a52]">Connected</span>
                    ) : m.connectionState === "pending" ? (
                      <span className="min-h-[38px] flex-1 rounded-full border border-[#e4d9bd] bg-white/60 px-3 py-2 text-center text-[11.5px] text-[#a2947c]">Asked</span>
                    ) : (
                      <button type="button" onClick={() => void connect(m.id)} className={cn(GP_HAND, "min-h-[38px] flex-1 py-1.5 text-[11.5px]")} data-testid={`discover-connect-${m.id}`}>
                        <UserPlus className="size-3.5" aria-hidden="true" />
                        Connect
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      );
    }

    /* --------------------------- CREATIONS ----------------------------- */
    if (dest === "creations") {
      return (
        <div data-testid="discover-creations" className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct || "all"}
                type="button"
                onClick={() => { setTypeFilter(ct); void read("creations", searchTerm); }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  typeFilter === ct ? "border-[#cbb98d] bg-white text-[#4c4436] shadow-[0_2px_8px_-4px_rgba(122,103,70,0.4)]" : "border-[#e4d9bd] bg-white/50 text-[#a2947c] hover:text-[#7c715f]"
                )}
              >
                {ct === "" ? "All" : ct}
              </button>
            ))}
          </div>
          {(creations ?? []).length === 0 ? (
            <EmptyRoom icon={Library} line={t("The gallery rests quiet. Works published from the rooms will hang here.")} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{(creations ?? []).map(creationCard)}</div>
          )}
        </div>
      );
    }

    /* ---------------------------- CIRCLES ------------------------------ */
    if (dest === "circles") {
      return (
        <div data-testid="discover-circles" className="space-y-3">
          {(circles ?? []).length === 0 ? (
            <EmptyRoom icon={Globe2} line={t("No circle answers that word yet — perhaps yours will be the first.")} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(circles ?? []).map((c) => (
                <div key={c.id} className="gp-card rounded-[20px] p-4" data-testid="discover-circle-card">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">{c.focus}</p>
                  <h3 className="mt-1 font-[family-name:var(--font-literata)] text-[14.5px] font-semibold text-[#3d3428]">{c.name}</h3>
                  {c.description && <p className="mt-1 line-clamp-3 text-[11.5px] leading-[1.6] text-[#7c715f]">{c.description}</p>}
                  <p className="mt-2 text-[10.5px] text-[#b3a68d]">kept by {c.owner.name}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10.5px] text-[#a2947c]">{c.members} members · {c.posts} offerings</span>
                    <button type="button" onClick={() => void joinCircle(c.id)} disabled={c.joined} className={cn(c.joined ? GP_GHOST : GP_HAND, "min-h-[36px] px-3.5 py-1 text-[11px]")} data-testid={`discover-join-circle-${c.id}`}>
                      {c.joined ? "Joined" : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    /* ---------------------------- PROJECTS ----------------------------- */
    if (dest === "projects") {
      return (
        <div data-testid="discover-projects" className="space-y-3">
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/60 px-3.5 py-2">
            <input type="checkbox" checked={seekingOnly} onChange={(e) => { setSeekingOnly(e.target.checked); void read("projects", searchTerm); }} className="size-4 accent-[#a16207]" />
            <span className="text-[12px] font-medium text-[#5c5344]">Only works seeking collaborators</span>
          </label>
          {(projects ?? []).length === 0 ? (
            <EmptyRoom icon={Handshake} line={t("No workshop answers yet — the doors open when the first weavers arrive.")} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(projects ?? []).map((p) => (
                <article key={p.id} className="gp-card rounded-[20px] p-4" data-testid="discover-project-card">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.seeking && (
                      <span className="rounded-full border border-[#c7d8c0] bg-[#eef5ea] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#5f7a52]">
                        seeking hands
                      </span>
                    )}
                    <span className="rounded-full border border-[#e4d9bd] px-2 py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-[#a2947c]">{p.status}</span>
                    <span className="text-[10px] text-[#b3a68d]">{p.focus}</span>
                  </div>
                  <h3 className="mt-1.5 font-[family-name:var(--font-literata)] text-[14.5px] font-semibold text-[#3d3428]">{p.title}</h3>
                  {p.description && <p className="mt-1 line-clamp-3 text-[12px] leading-[1.6] text-[#7c715f]">{p.description}</p>}
                  {p.requiredSkills && (
                    <p className="mt-2 text-[10.5px] text-[#8a7c64]">
                      <span className="font-semibold text-[#a2947c]">threads sought:</span> {p.requiredSkills}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2.5">
                    <MakerMark name={p.owner.name} size={24} />
                    <span className="truncate text-[11px] text-[#7c715f]">{p.owner.name}</span>
                    <span className="ml-auto shrink-0 text-[10.5px] text-[#b3a68d]">{p.members} weavers · {p.entries} entries</span>
                  </div>
                  <div className="mt-3">
                    <button type="button" onClick={() => void joinProject(p.id)} disabled={p.joined || p.isOwner} className={cn(p.joined || p.isOwner ? GP_GHOST : GP_HAND, "min-h-[38px] w-full py-1.5 text-[12px]")} data-testid={`discover-join-project-${p.id}`}>
                      {p.isOwner ? "Your workshop" : p.joined ? "Joined" : "Ask to weave"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      );
    }

    /* --------------------------- KNOWLEDGE ----------------------------- */
    if (dest === "knowledge") {
      return (
        <div data-testid="discover-knowledge" className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setEpistemicFilter(""); void read("knowledge", searchTerm); }}
              className={cn("rounded-full border px-3 py-1.5 text-[11px] font-semibold", epistemicFilter === "" ? "border-[#cbb98d] bg-white text-[#4c4436]" : "border-[#e4d9bd] bg-white/50 text-[#a2947c]")}
            >
              All
            </button>
            {Object.entries(EPISTEMIC_DRESS).map(([key, dress]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setEpistemicFilter(key); void read("knowledge", searchTerm); }}
                className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  color: dress.color,
                  borderColor: epistemicFilter === key ? dress.color : dress.edge,
                  background: epistemicFilter === key ? dress.bg : "transparent",
                }}
              >
                {dress.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] italic leading-relaxed text-[#a2947c]">
            Every entry wears its own nature: what stands established, what is hypothesized, what is
            interpreted, what is imagined. Attribution and sources stay with each contribution.
          </p>
          {(knowledge ?? []).length === 0 ? (
            <EmptyRoom icon={BookOpen} line={t("The index rests quiet — research, reflections and discoveries will gather here.")} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{(knowledge ?? []).map(knowledgeCard)}</div>
          )}
        </div>
      );
    }

    return null;
  }, [loading, error, dest, forYou, people, creations, circles, projects, knowledge, interests, sort, typeFilter, epistemicFilter, seekingOnly, creationCard, knowledgeCard, follow, connect, joinCircle, joinProject, t]);

  /* the knowledge card stands apart — its label is the point, and it
     too opens whole in the reader */
  function knowledgeCard(k: DiscoverKnowledge) {
    const dress = EPISTEMIC_DRESS[k.epistemicLabel ?? "interpretation"];
    return (
      <article
        key={k.id}
        className="gp-card group rounded-[22px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_38px_-16px_rgba(122,103,70,0.45)]"
        data-testid="discover-knowledge-card"
      >
        <button type="button" onClick={() => void openReader(k.id)} aria-label={t("Read the whole offering")} className="focus-glow block w-full cursor-pointer rounded-[22px] p-4 text-left sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: dress.color, borderColor: dress.edge, background: dress.bg }}>
              {dress.label}
            </span>
            {k.contentType && <span className="text-[10px] text-[#b3a68d]">{k.contentType}</span>}
          </div>
          <h3 className="mt-2.5 line-clamp-2 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428]">{k.title}</h3>
          <p className="mt-1.5 line-clamp-4 text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">{k.preview}</p>
          <div className="mt-3 flex items-center gap-2">
            <MakerMark name={k.author.name} size={24} />
            <span className="truncate text-[11.5px] font-semibold text-[#5c5344]">{k.author.name}</span>
            <span className="ml-auto shrink-0 text-[10.5px] text-[#a2947c]">{k.resonanceCount} ✦</span>
          </div>
        </button>
      </article>
    );
  }

  function SectionHead({ label }: { label: string }) {
    return (
      <h2 className="mb-2.5 font-[family-name:var(--font-literata)] text-[13px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">
        {label}
      </h2>
    );
  }

  /* the mirror's own listening card — kept whole from the hall's first wall */
  function MirrorConnections({ onNote }: { onNote: (note: string | null) => void }) {
    const [myPosts, setMyPosts] = useState<Array<{ id: string; title: string }>>([]);
    const [mirrorPostId, setMirrorPostId] = useState("");
    const [suggestions, setSuggestions] = useState<Array<{ userId: string; name: string; reason: string; themes: string | null; postTitle: string }> | null>(null);
    const [listening, setListening] = useState(false);
    const [mirrorNote, setMirrorNote] = useState<string | null>(null);

    useEffect(() => {
      void (async () => {
        try {
          const data = await netFetch<{ posts: Array<{ id: string; title: string }> }>("/api/gathering?mine=1&take=20");
          setMyPosts(data.posts);
          if (data.posts.length > 0) setMirrorPostId(data.posts[0].id);
        } catch {
          /* the card stays honest */
        }
      })();
    }, []);

    const listen = async () => {
      if (!mirrorPostId) return;
      setListening(true);
      setMirrorNote(null);
      try {
        const data = await netFetch<{ suggestions: Array<{ userId: string; name: string; reason: string; themes: string | null; postTitle: string }> }>(
          "/api/network/mirror",
          { method: "POST", body: { postId: mirrorPostId } }
        );
        setSuggestions(data.suggestions);
        if (data.suggestions.length === 0) setMirrorNote("M.E. heard no kindred voice yet — the hall grows, and the listening continues.");
      } catch (err) {
        setMirrorNote(err instanceof Error ? err.message : "The listening faltered.");
      } finally {
        setListening(false);
      }
    };

    const openDoor = async (userId: string) => {
      try {
        await netFetch("/api/network/connections", { method: "POST", body: { userId, viaMirror: true } });
        onNote("A door was offered — their yes opens it.");
      } catch (err) {
        onNote(err instanceof Error ? err.message : "The door would not open.");
      }
    };

    return (
      <div className="gp-card mt-10 rounded-[26px] border-[#7c5cad]/25 p-5 sm:p-6" data-testid="mirror-connections">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-[12px] border border-white/90"
            style={{ background: "linear-gradient(150deg,#fffdf8 0%,#ece2f4 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(124,92,173,0.35)" }}
          >
            <Sparkles className="size-4 text-[#7c5cad]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">{t("Mirror connections")}</p>
            <p className="text-[11px] text-[#a2947c]">{t("M.E. listens from one of your offerings and names kindred voices it senses.")}</p>
          </div>
        </div>
        {myPosts.length === 0 ? (
          <p className="mt-4 text-[12.5px] italic leading-relaxed text-[#8a7c64]">
            {t("Hang an offering in the hall first — M.E. reads your own words to listen from.")}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                value={mirrorPostId}
                onChange={(e) => setMirrorPostId(e.target.value)}
                aria-label={t("The offering M.E. listens from")}
                className="min-w-0 flex-1 rounded-[16px] border border-[#eee5d0] bg-white/80 px-3 py-2.5 text-[12.5px] text-[#5c5344] outline-none focus:border-[#cbb98d]"
                data-testid="mirror-select"
              >
                {myPosts.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <button type="button" onClick={() => void listen()} disabled={listening || !mirrorPostId} className={GP_HAND} data-testid="mirror-listen">
                {listening ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                {t("Listen")}
              </button>
            </div>
            {mirrorNote && <p className="mt-3 text-[12.5px] italic leading-relaxed text-[#7c5cad]" role="status">{mirrorNote}</p>}
            {suggestions !== null && suggestions.length > 0 && (
              <div className="mt-4 space-y-3">
                {suggestions.map((s) => (
                  <div key={s.userId} className="rounded-[20px] border border-[#e4d9bd] bg-white/70 p-4" data-testid={`mirror-suggestion-${s.userId}`}>
                    <div className="flex items-center gap-2.5">
                      <MakerMark name={s.name} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-[#3d3428]">{s.name}</p>
                        {s.themes && <p className="text-[10.5px] font-semibold text-[#7c5cad]">{s.themes}</p>}
                      </div>
                      <button type="button" onClick={() => void openDoor(s.userId)} className={cn(GP_HAND, "px-3 py-1.5 text-[11.5px]")} data-testid={`mirror-open-${s.userId}`}>
                        <UserPlus className="size-3.5" aria-hidden="true" />
                        {t("Open a door")}
                      </button>
                    </div>
                    <p className="mt-2 text-[12.5px] italic leading-[1.7] text-[#5c5344] [overflow-wrap:anywhere]">“{s.reason}”</p>
                    <p className="mt-1 text-[10.5px] text-[#a2947c]">{t("sensed from")} “{s.postTitle}”</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="gp-scroll h-full overflow-y-auto px-4 pb-24 pt-4 sm:px-6"
      data-testid="discover-section"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* the mouth's own tabs */}
        <div className="gp-seg mb-4 flex items-center gap-0.5 overflow-x-auto rounded-full border border-white/80 bg-white/45 p-1" role="tablist" aria-label={t("Discover")}>
          {DESTS.map((d) => {
            const DIcon = d.icon;
            const on = dest === d.key;
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setDest(d.key)}
                data-testid={`discover-dest-${d.key}`}
                className={cn(
                  "focus-glow flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors duration-300",
                  on ? "bg-white text-[#5c5344] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_-6px_rgba(122,103,70,0.45)]" : "text-[#a2947c] hover:text-[#7c715f]"
                )}
              >
                <DIcon className="size-3.5" aria-hidden="true" />
                {t(d.label)}
              </button>
            );
          })}
        </div>

        {/* the shared search — the current answers a word */}
        <div className="mb-5 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#b3a68d]" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder={t("Search the whole current…")}
              aria-label={t("Search the whole current…")}
              className={cn(GP_INPUT, "pl-10")}
              data-testid="discover-search"
            />
          </div>
          <button type="button" onClick={runSearch} className={cn(GP_HAND, "min-h-[44px] px-5")} data-testid="discover-search-run">
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {t("Search")}
          </button>
        </div>

        {body}

        {/* the deep current's sentinel — reaching the floor pours the
            next page of the gallery, so the shelf is never a dead end */}
        {dest === "creations" && creationsHasMore && (
          <div data-current-sentinel="" className="flex justify-center py-6">
            {creationsMoreLoading ? (
              <span className="flex items-center gap-2 text-[12px] text-[#8a6f46]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The current gathers itself…")}
              </span>
            ) : (
              <button type="button" onClick={() => void loadMoreCreations()} className={cn(GP_GHOST, "min-h-[40px] px-5")}>
                <ChevronDown className="size-4" aria-hidden="true" />
                {t("More of the current")}
              </button>
            )}
          </div>
        )}

        {note && (
          <p className="mt-4 text-center text-[12.5px] italic text-[#8a6f46]" role="status">
            {note}
          </p>
        )}
      </div>

      {/* THE READER — the offering opened whole */}
      <PublicationReader
        open={reading !== null}
        post={readerPost}
        echoes={readerEchoes}
        loading={readerLoading}
        error={readerError}
        echoDraft={readerEchoDraft}
        sending={readerSending}
        onEchoDraft={setReaderEchoDraft}
        onEcho={() => void sendReaderEcho()}
        onResonate={() => void toggleReaderResonance()}
        onClose={closeReader}
      />

      {/* the preferences drawer */}
      {prefsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("Tune the current")}
          className="fixed inset-0 z-[96] flex items-center justify-center bg-[rgba(46,38,24,0.32)] p-4 backdrop-blur-[3px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPrefsOpen(false);
          }}
        >
          <div className={cn(GP_CARD, "w-full max-w-[440px] rounded-[26px] bg-[linear-gradient(165deg,#fffef9_0%,#f7f0de_100%)] p-5")}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-[family-name:var(--font-cinzel)] text-[15px] font-semibold text-[#3d3428]">{t("Tune the current")}</p>
                <p className="mt-0.5 text-[11.5px] text-[#a2947c]">
                  {t("Comma-separated threads of interest. The current bends toward them; nothing is ranked, only relevant.")}
                </p>
              </div>
              <button type="button" onClick={() => setPrefsOpen(false)} aria-label="Close" className="focus-glow flex size-8 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f]">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <input
              value={interestDraft}
              onChange={(e) => setInterestDraft(e.target.value.slice(0, 200))}
              placeholder={t("dreams, cosmology, field recording…")}
              className={cn(GP_INPUT, "mt-3")}
              data-testid="discover-interests-input"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPrefsOpen(false)} className={cn(GP_GHOST, "min-h-[44px] px-5")}>
                {t("Not yet")}
              </button>
              <button type="button" onClick={() => void savePrefs()} disabled={savingPrefs} className={cn(GP_HAND, "min-h-[44px] px-5")} data-testid="discover-interests-save">
                {savingPrefs ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {t("Let the current listen")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  THE READER — a publication opened whole. The current's cards keep  */
/*  their quiet previews; the reader is where a work is read entire —  */
/*  its full words, its maker's name, its echoes, one resonance.       */
/* ================================================================== */

function PublicationReader({
  open,
  post,
  echoes,
  loading,
  error,
  echoDraft,
  sending,
  onEchoDraft,
  onEcho,
  onResonate,
  onClose,
}: {
  open: boolean;
  post: ReaderPost | null;
  echoes: ReaderEcho[];
  loading: boolean;
  error: string | null;
  echoDraft: string;
  sending: boolean;
  onEchoDraft: (v: string) => void;
  onEcho: () => void;
  onResonate: () => void;
  onClose: () => void;
}) {
  const t = useT();
  if (!open) return null;
  const meta = post ? (TYPE_META[post.sourceType ?? post.kind] ?? TYPE_META.reflection) : null;
  const MetaIcon = meta?.icon ?? BookOpen;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("The reader")}
      data-testid="publication-reader"
    >
      <div className="absolute inset-0 bg-[#2b2416]/45 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        className="gp-card relative flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        style={{ background: "linear-gradient(170deg,#fffdf9 0%,#fbf5e8 100%)" }}
      >
        {/* the reader's crown */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-[#eee5d0] px-4 py-3 sm:px-6">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[11px] border border-white/90"
            style={{ background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 6px -2px rgba(122,103,70,0.4)" }}
          >
            <MetaIcon className="size-4" style={{ color: meta?.accent ?? "#8a6f46" }} />
          </span>
          <p className="mono-label min-w-0 flex-1 truncate text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
            {post?.sourcePortal ? `${post.sourcePortal} · ${post.sourceType ?? post.kind}` : (post?.kind ?? "")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close the reader")}
            data-testid="publication-reader-close"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-colors hover:text-[#3d3428]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* the reader's body */}
        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[#8a6f46]">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="text-[13px]">{t("The offering opens itself…")}</span>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.8] text-[#8a7c64]">{error}</p>
              <button type="button" onClick={onClose} className={cn(GP_GHOST, "mt-4 min-h-[40px] px-5")}>{t("Close the reader")}</button>
            </div>
          ) : post ? (
            <>
              <h2 className="font-[family-name:var(--font-literata)] text-[22px] font-semibold leading-[1.3] text-[#3d3428] sm:text-[26px]">
                {post.title}
              </h2>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex items-center gap-2">
                  <MakerMark name={post.author.name} size={28} />
                  <span className="text-[12.5px] font-semibold text-[#5c5344]">{post.author.name}</span>
                </span>
                <span className="text-[11px] text-[#a2947c]">{relativeTime(post.createdAt, t)}</span>
                {post.tags.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 6).map((tag) => (
                      <span key={tag} className="rounded-full border border-[#e4d9bd] bg-white/60 px-2 py-0.5 text-[10px] text-[#8a7c64]">#{tag}</span>
                    ))}
                  </span>
                )}
              </div>

              {post.cover && (
                <img src={post.cover} alt="" className="mt-5 max-h-[420px] w-full rounded-[18px] border border-[#eee5d0] object-cover" />
              )}
              {post.refUrl && (
                <a
                  href={post.refUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0f766e] underline decoration-[#bcdcd6] underline-offset-4 hover:decoration-[#0f766e]"
                >
                  <Music className="size-3.5" aria-hidden="true" />
                  {t("Hear the work itself")}
                </a>
              )}

              {/* THE WHOLE WORD — the body stands complete, every line of it */}
              <div className="mt-5 space-y-3.5">
                {post.body.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line font-[family-name:var(--font-literata)] text-[14.5px] leading-[1.85] text-[#4c4436] [overflow-wrap:anywhere]">
                    {para}
                  </p>
                ))}
              </div>

              {/* the reader's hands — one resonance, echoes beneath */}
              <div className="mt-7 border-t border-[#eee5d0] pt-5">
                <button
                  type="button"
                  onClick={onResonate}
                  aria-pressed={post.resonated}
                  data-testid="publication-reader-resonate"
                  className={cn(
                    "focus-glow inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-all duration-300",
                    post.resonated
                      ? "border-[#cbb98d] bg-[linear-gradient(150deg,#fffdf8_0%,#f3ead6_100%)] text-[#8a6f46]"
                      : "border-[#e4d9bd] bg-white/70 text-[#7c715f] hover:border-[#d3c39c]"
                  )}
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  {post.resonated ? t("Resonating") : t("Resonate")}
                  <span className="text-[#a2947c]">· {post.resonanceCount}</span>
                </button>

                {/* the echoes */}
                <div className="mt-6" data-testid="publication-reader-echoes">
                  <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-[#a2947c]">
                    {t("Echoes")} · {echoes.length}
                  </p>
                  {echoes.length === 0 ? (
                    <p className="mt-3 text-[12.5px] italic leading-relaxed text-[#8a7c64]">
                      {t("No echoes yet — the first response waits for you.")}
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {echoes.map((e) => (
                        <li key={e.id} className="rounded-[18px] border border-[#eee5d0] bg-white/70 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MakerMark name={e.author.name} size={22} />
                            <span className="text-[11.5px] font-semibold text-[#5c5344]">{e.author.name}</span>
                            <span className="ml-auto text-[10px] text-[#b3a68d]">{relativeTime(e.createdAt, t)}</span>
                          </div>
                          <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#5c5344] [overflow-wrap:anywhere]">{e.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* the echo's own hand */}
                  <div className="mt-4 flex items-end gap-2">
                    <textarea
                      value={echoDraft}
                      onChange={(e) => onEchoDraft(e.target.value.slice(0, 600))}
                      placeholder={t("Leave an echo — short, calm, yours…")}
                      aria-label={t("Leave an echo")}
                      rows={2}
                      className={cn(GP_INPUT, "min-h-[44px] resize-y")}
                      data-testid="publication-reader-echo-input"
                    />
                    <button
                      type="button"
                      onClick={onEcho}
                      disabled={sending || echoDraft.trim().length < 2}
                      className={cn(GP_HAND, "min-h-[44px] shrink-0 px-5")}
                      data-testid="publication-reader-echo-send"
                    >
                      {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                      {t("Echo")}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
