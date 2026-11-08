"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  FOCUS_LABELS,
  KIND_META,
  type CircleCard,
  type GatheringPost,
  type LibraryCard,
  type PersonCard,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  EmptyRoom,
  RoomLabel,
  MakerMark,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  DISCOVER — find people and creations.                              */
/*                                                                     */
/*  One search field, four honest shelves: the hall's offerings, the   */
/*  makers, the circles, the Library.                                  */
/*                                                                     */
/*  MIRROR CONNECTIONS — M.E. listens from one of the visitor's own    */
/*  offerings and names the kindred voices it senses among the         */
/*  public words. A suggestion is a door offered, never a door         */
/*  opened: only the visitor's own hand introduces anyone.             */
/* ------------------------------------------------------------------ */

interface MirrorSuggestion {
  userId: string;
  name: string;
  reason: string;
  themes: string;
  postId: string;
  postTitle: string;
  postKind: string;
}

export default function DiscoverSection({
  active,
  onOpenMessages,
}: {
  active: boolean;
  onOpenMessages: () => void;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const [shelf, setShelf] = useState<"offerings" | "makers" | "circles" | "library">("offerings");
  const [posts, setPosts] = useState<GatheringPost[] | null>(null);
  const [people, setPeople] = useState<PersonCard[] | null>(null);
  const [circles, setCircles] = useState<CircleCard[] | null>(null);
  const [items, setItems] = useState<LibraryCard[] | null>(null);
  const [error, setError] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  /* the mirror's own listening */
  const [myPosts, setMyPosts] = useState<GatheringPost[]>([]);
  const [mirrorPostId, setMirrorPostId] = useState<string>("");
  const [mirror, setMirror] = useState<MirrorSuggestion[] | null>(null);
  const [listening, setListening] = useState(false);
  const [mirrorNote, setMirrorNote] = useState<string | null>(null);

  const search = useCallback(async () => {
    setError(false);
    const term = q.trim();
    try {
      if (shelf === "offerings") {
        setPosts(null);
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        const data = await netFetch<{ posts: GatheringPost[] }>(`/api/gathering?${params.toString()}`);
        setPosts(data.posts);
      } else if (shelf === "makers") {
        setPeople(null);
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        const data = await netFetch<{ people: PersonCard[] }>(`/api/network/people?${params.toString()}`);
        setPeople(data.people);
      } else if (shelf === "circles") {
        setCircles(null);
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        const data = await netFetch<{ circles: CircleCard[] }>(`/api/network/circles?${params.toString()}`);
        setCircles(data.circles);
      } else {
        setItems(null);
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        const data = await netFetch<{ items: LibraryCard[] }>(`/api/network/library?${params.toString()}`);
        setItems(data.items);
      }
    } catch {
      setError(true);
    }
  }, [q, shelf]);

  useEffect(() => {
    if (!active) return;
    void search();
  }, [active, search]);

  /* M.E.'s reading material: the visitor's own offerings */
  useEffect(() => {
    if (!active) return;
    void (async () => {
      try {
        const data = await netFetch<{ posts: GatheringPost[] }>("/api/gathering?mine=1&take=20");
        setMyPosts(data.posts);
        if (data.posts.length > 0 && !mirrorPostId) setMirrorPostId(data.posts[0].id);
      } catch {
        setMyPosts([]);
      }
    })();
    /* the mirror's material is read once per visit */
  }, [active]);

  const listen = useCallback(async () => {
    if (!mirrorPostId || listening) return;
    setListening(true);
    setMirror(null);
    setMirrorNote(null);
    try {
      const data = await netFetch<{ suggestions: MirrorSuggestion[] }>("/api/network/mirror", {
        method: "POST",
        body: { postId: mirrorPostId },
      });
      setMirror(data.suggestions);
      if (data.suggestions.length === 0) {
        setMirrorNote(t("M.E. hears no kindred voices yet — as more makers share, the mirror listens again."));
      }
    } catch (err) {
      setMirrorNote(err instanceof Error ? err.message : t("M.E. could not finish listening."));
    } finally {
      setListening(false);
    }
  }, [mirrorPostId, listening, t]);

  const openDoor = useCallback(
    async (s: MirrorSuggestion) => {
      try {
        await netFetch("/api/network/connections", {
          method: "POST",
          body: { userId: s.userId, viaMirror: true },
        });
        setNote(t("The door was offered. When the other hand opens it, you will meet in Messages."));
        void loadPeople();
      } catch {
        /* the door stays where it was */
      }
    },
    []
  );

  const loadPeople = useCallback(() => {
    void search();
  }, [search]);

  const shelves: Array<{ key: typeof shelf; label: string }> = [
    { key: "offerings", label: "Offerings" },
    { key: "makers", label: "Makers" },
    { key: "circles", label: "Circles" },
    { key: "library", label: "Library" },
  ];

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[900px]">
        <RoomLabel>{t("Discover")}</RoomLabel>

        {/* the search line */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#b3a68d]" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search();
            }}
            maxLength={60}
            placeholder={t("Search the whole network…")}
            aria-label={t("Search the whole network…")}
            data-testid="discover-search"
            className={cn(GP_INPUT, "pl-9")}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {shelves.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setShelf(s.key)}
              aria-pressed={shelf === s.key}
              className={cn(
                "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                shelf === s.key
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              {t(s.label)}
            </button>
          ))}
          <div className="flex-1" />
          {q.trim() !== "" && (
            <button type="button" onClick={() => { setQ(""); }} className="focus-glow text-[11px] font-semibold text-[#b45309] underline">
              {t("let the words rest")}
            </button>
          )}
        </div>

        {/* ---------- the shelves ---------- */}
        {error && (
          <p className="py-16 text-center text-[13.5px] text-[#b45309]">
            {t("The network could not be read.")}
          </p>
        )}

        {shelf === "offerings" && (
          <div className="mt-4">
            {posts === null && !error ? (
              <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The exhibition arrives…")}
              </p>
            ) : (posts ?? []).length === 0 ? (
              <EmptyRoom icon={Search} line={t("Nothing answers that word yet — other shelves may know more.")} />
            ) : (
              <div className="space-y-3">
                {(posts ?? []).map((p) => {
                  const meta = KIND_META[(p.kind as keyof typeof KIND_META) in KIND_META ? (p.kind as keyof typeof KIND_META) : "reflection"];
                  const Icon = meta.icon;
                  return (
                    <div key={p.id} className="gp-card rounded-[20px] p-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="flex size-8 items-center justify-center rounded-[12px] border border-white/90"
                          style={{ background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)" }}
                        >
                          <Icon className="size-4" style={{ color: meta.accent }} />
                        </span>
                        <MakerMark name={p.author.name} size={26} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-[#5c5344]">{p.author.name}</p>
                          <p className="text-[10px] text-[#a2947c]">
                            {p.circle ? p.circle.name : p.sector ? p.sector : t("The open hall")}
                          </p>
                        </div>
                      </div>
                      <h3 className="mt-2 font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
                        {p.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
                        {p.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {shelf === "makers" && (
          <div className="mt-4">
            {people === null && !error ? (
              <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The encounters arrive…")}
              </p>
            ) : (people ?? []).length === 0 ? (
              <EmptyRoom icon={Users} line={t("No makers answer that word yet.")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(people ?? []).map((p) => (
                  <div key={p.id} className="gp-card rounded-[20px] p-4">
                    <div className="flex items-center gap-3">
                      <MakerMark name={p.name} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#3d3428]">{p.name}</p>
                        <p className="text-[10.5px] text-[#a2947c]">
                          {p.postCount} {t("offerings")} · {p.projectCount} {t("works together")}
                        </p>
                      </div>
                    </div>
                    {p.bio && (
                      <p className="mt-2 line-clamp-2 text-[12px] leading-[1.6] text-[#5c5344] [overflow-wrap:anywhere]">
                        {p.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {shelf === "circles" && (
          <div className="mt-4">
            {circles === null && !error ? (
              <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The circles arrive…")}
              </p>
            ) : (circles ?? []).length === 0 ? (
              <EmptyRoom icon={Users} line={t("No circles answer that word yet.")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(circles ?? []).map((c) => (
                  <div key={c.id} className="gp-card rounded-[20px] p-4">
                    <h3 className="font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#a2947c]">
                      {t(FOCUS_LABELS[c.focus] ?? c.focus)} · {c.memberCount} {t("members")}
                    </p>
                    {c.description && (
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.6] text-[#7c715f] [overflow-wrap:anywhere]">
                        {c.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {shelf === "library" && (
          <div className="mt-4">
            {items === null && !error ? (
              <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The library is gathering your stars…")}
              </p>
            ) : (items ?? []).length === 0 ? (
              <EmptyRoom icon={Search} line={t("The shelves rest quiet — nothing answers that word yet.")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(items ?? []).map((item) => (
                  <div key={item.id} className="gp-card rounded-[20px] p-4">
                    <h3 className="font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-[1.6] text-[#7c715f] [overflow-wrap:anywhere]">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-[10.5px] text-[#a2947c]">{item.authorName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {note && (
          <p className="mt-4 text-center text-[12.5px] italic text-[#8a6f46]" role="status">
            {note}
          </p>
        )}

        {/* ---------- MIRROR CONNECTIONS ---------- */}
        <div className="gp-card mt-10 rounded-[26px] border-[#7c5cad]/25 p-5 sm:p-6" data-testid="mirror-connections">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-[12px] border border-white/90"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#ece2f4 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(124,92,173,0.35)",
              }}
            >
              <Sparkles className="size-4 text-[#7c5cad]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">
                {t("Mirror connections")}
              </p>
              <p className="text-[11px] text-[#a2947c]">
                {t("M.E. listens from one of your offerings and names kindred voices it senses.")}
              </p>
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
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void listen()}
                  disabled={listening || !mirrorPostId}
                  className={GP_HAND}
                  data-testid="mirror-listen"
                >
                  {listening ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                  {t("Listen")}
                </button>
              </div>

              {mirrorNote && (
                <p className="mt-3 text-[12.5px] italic leading-relaxed text-[#7c5cad]" role="status">
                  {mirrorNote}
                </p>
              )}

              {mirror !== null && mirror.length > 0 && (
                <div className="mt-4 space-y-3">
                  {mirror.map((s) => (
                    <div key={s.userId} className="rounded-[20px] border border-[#e4d9bd] bg-white/70 p-4" data-testid={`mirror-suggestion-${s.userId}`}>
                      <div className="flex items-center gap-2.5">
                        <MakerMark name={s.name} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold text-[#3d3428]">{s.name}</p>
                          {s.themes && (
                            <p className="text-[10.5px] font-semibold text-[#7c5cad]">{s.themes}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void openDoor(s)}
                          className={cn(GP_HAND, "px-3 py-1.5 text-[11.5px]")}
                          data-testid={`mirror-open-${s.userId}`}
                        >
                          <UserPlus className="size-3.5" aria-hidden="true" />
                          {t("Open a door")}
                        </button>
                      </div>
                      <p className="mt-2 text-[12.5px] italic leading-[1.7] text-[#5c5344] [overflow-wrap:anywhere]">
                        “{s.reason}”
                      </p>
                      <p className="mt-1 text-[10.5px] text-[#a2947c]">
                        {t("sensed from")} “{s.postTitle}”
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
