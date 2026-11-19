"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  GitBranch,
  Library,
  Loader2,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  PROJECT_FOCUS_LABELS,
  type GatheringPost,
  type PersonCard,
  type ProjectCard,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  EmptyRoom,
  RoomLabel,
  MakerMark,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  COLLABORATIVE CREATION — shared workshops where an idea becomes a  */
/*  collective work. Contributions keep their makers; the EVOLUTION    */
/*  PATH shows the honest walk from the seed idea to the published     */
/*  work; publishing lays the creation in the Collective Library with  */
/*  every weaver's name carried.                                       */
/* ------------------------------------------------------------------ */

const PROJECT_FOCUSES = ["book", "music", "artwork", "research", "invention", "community"];

interface ProjectEntry {
  id: string;
  body: string;
  by: string;
  mine: boolean;
  createdAt: string;
}
interface PathStep {
  stage: string;
  title: string;
  detail: string;
  by: string;
  at: string;
}
interface ProjectDetail {
  project: ProjectCard;
  seedPost: { id: string; title: string; body: string; kind: string; createdAt: string; author: { name: string } } | null;
  members: Array<{ id: string; name: string; image: string | null; anon: boolean; role: string }>;
  entries: ProjectEntry[];
  path: PathStep[];
  membership: { role: string } | null;
}

export default function CollaborateSection({
  active,
  seedPost,
  onSeedConsumed,
}: {
  active: boolean;
  seedPost: GatheringPost | null;
  onSeedConsumed: () => void;
}) {
  const t = useT();
  const [projects, setProjects] = useState<ProjectCard[] | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(false);

  /* the founder's sheet */
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pFocus, setPFocus] = useState("book");
  const [seedPostId, setSeedPostId] = useState<string | null>(null);
  const [seedLabel, setSeedLabel] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<GatheringPost[]>([]);
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  const [pBusy, setPBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setProjects(null);
    try {
      const params = new URLSearchParams();
      if (mine) params.set("mine", "1");
      const data = await netFetch<{ projects: ProjectCard[] }>(
        `/api/network/projects?${params.toString()}`
      );
      setProjects(data.projects);
    } catch {
      setError(true);
    }
  }, [mine]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  /* a seed idea carried in from the stream opens the founder's sheet */
  useEffect(() => {
    if (seedPost && active) {
      setCreating(true);
      setSeedPostId(seedPost.id);
      setSeedLabel(seedPost.title);
      setPTitle(seedPost.title);
      onSeedConsumed();
    }
  }, [seedPost, active, onSeedConsumed]);

  const openCreator = useCallback(async () => {
    setCreating(true);
    try {
      const [posts, ppl] = await Promise.all([
        netFetch<{ posts: GatheringPost[] }>("/api/gathering?mine=1&take=30"),
        netFetch<{ people: PersonCard[] }>("/api/network/people?take=20"),
      ]);
      setMyPosts(posts.posts);
      setPeople(ppl.people);
    } catch {
      /* the sheet still opens */
    }
  }, []);

  const create = useCallback(async () => {
    if (pTitle.trim().length < 3 || pBusy) return;
    setPBusy(true);
    try {
      const data = await netFetch<{ project: { id: string } }>("/api/network/projects", {
        method: "POST",
        body: {
          title: pTitle.trim(),
          description: pDesc.trim() || undefined,
          focus: pFocus,
          seedPostId: seedPostId ?? undefined,
          inviteIds: invited.length > 0 ? invited : undefined,
        },
      });
      setCreating(false);
      setPTitle("");
      setPDesc("");
      setSeedPostId(null);
      setSeedLabel(null);
      setInvited([]);
      setDetailId(data.project.id);
    } catch {
      /* the sheet stays open */
    } finally {
      setPBusy(false);
    }
  }, [pTitle, pDesc, pFocus, seedPostId, invited, pBusy]);

  if (detailId) {
    return <WorkshopRoom id={detailId} onBack={() => { setDetailId(null); void load(); }} />;
  }

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-center justify-between gap-3">
          <RoomLabel>{t("Collaborate")}</RoomLabel>
          <button
            type="button"
            onClick={() => void openCreator()}
            className={GP_HAND}
            data-testid="projects-new"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("Open a workshop")}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMine(false)}
            aria-pressed={!mine}
            className={cn(
              "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
              !mine
                ? "border-[#cbb98d] bg-white text-[#5c5344]"
                : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
            )}
          >
            {t("All workshops")}
          </button>
          <button
            type="button"
            onClick={() => setMine(true)}
            aria-pressed={mine}
            className={cn(
              "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
              mine
                ? "border-[#cbb98d] bg-white text-[#5c5344]"
                : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
            )}
          >
            {t("Mine and my weavings")}
          </button>
        </div>

        {projects === null && !error && (
          <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The workshops arrive…")}
          </p>
        )}
        {error && (
          <p className="py-20 text-center text-[13.5px] text-[#b45309]">
            {t("The workshops could not be read.")}
          </p>
        )}
        {projects !== null && projects.length === 0 && !error && (
          <EmptyRoom
            icon={Users}
            line={t(
              "No workshops stand yet — carry an offering here and weave it together with others."
            )}
          />
        )}
        {projects !== null && projects.length > 0 && (
          <div className="mt-4 space-y-3">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDetailId(p.id)}
                data-testid={`project-card-${p.id}`}
                className="gp-card gp-card-hover focus-glow block w-full rounded-[22px] p-4 text-left outline-none sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
                    {t(PROJECT_FOCUS_LABELS[p.focus] ?? p.focus)}
                  </span>
                  <span
                    className={cn(
                      "mono-label rounded-full px-2 py-0.5 text-[8px] uppercase tracking-[0.14em]",
                      p.status === "published"
                        ? "border border-[#0d9488]/40 bg-[#0d9488]/10 text-[#0d9488]"
                        : p.status === "weaving"
                          ? "border border-[#a16207]/40 bg-[#a16207]/10 text-[#a16207]"
                          : "border border-[#e4d9bd] bg-[#faf5e6] text-[#a2947c]"
                    )}
                  >
                    {p.status === "published" ? t("in the Library") : p.status === "weaving" ? t("in the weaving") : t("open doors")}
                  </span>
                  <span className="flex-1" />
                  <span className="text-[10.5px] text-[#a2947c]">
                    {p.memberCount} {t("weavers")} · {p.entryCount} {t("contributions")}
                  </span>
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
                    {p.description}
                  </p>
                )}
                {p.seedPost && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] italic text-[#a2947c]">
                    <GitBranch className="size-3" aria-hidden="true" />
                    {t("grown from")} “{p.seedPost.title}”
                  </p>
                )}
                <p className="mt-2 text-[11px] text-[#a2947c]">
                  {t("founded by")} {p.owner.name} · {relativeTime(p.createdAt, t)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------- the founder's sheet ---------- */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-label={t("Open a workshop")}
          >
            <button
              type="button"
              aria-label={t("Keep shaping")}
              onClick={() => setCreating(false)}
              className="absolute inset-0 cursor-default bg-[#3d3428]/25"
              tabIndex={-1}
            />
            <motion.div
              initial={{ y: "40%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "30%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="gp-glass relative flex max-h-[92%] flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[580px] sm:rounded-[30px]"
            >
              <div className="flex items-center justify-between px-5 pt-4 sm:px-7 sm:pt-5">
                <RoomLabel>{t("Open a workshop")}</RoomLabel>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  aria-label={t("Keep shaping")}
                  className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
                >
                  <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
                </button>
              </div>
              <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
                <input
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  maxLength={120}
                  placeholder={t("Give the workshop its name…")}
                  aria-label={t("Give the workshop its name…")}
                  data-testid="project-title"
                  className={GP_INPUT}
                />
                <textarea
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder={t("What will be woven here?")}
                  aria-label={t("What will be woven here?")}
                  className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
                />
                <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                  {t("What is being woven")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROJECT_FOCUSES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPFocus(f)}
                      aria-pressed={pFocus === f}
                      className={cn(
                        "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                        pFocus === f
                          ? "border-[#cbb98d] bg-white text-[#5c5344]"
                          : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                      )}
                    >
                      {t(PROJECT_FOCUS_LABELS[f])}
                    </button>
                  ))}
                </div>

                {/* the seed idea — the evolution path's first stone */}
                <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                  {t("Grown from an idea (optional)")}
                </p>
                {seedLabel && (
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#8a6f46]">
                    <GitBranch className="size-3.5" aria-hidden="true" />
                    {seedLabel}
                    <button
                      type="button"
                      onClick={() => {
                        setSeedPostId(null);
                        setSeedLabel(null);
                      }}
                      className="focus-glow ml-1 text-[10px] text-[#b45309] underline"
                    >
                      {t("let it rest")}
                    </button>
                  </p>
                )}
                {!seedLabel && myPosts.length > 0 && (
                  <select
                    value={seedPostId ?? ""}
                    onChange={(e) => {
                      setSeedPostId(e.target.value || null);
                      setSeedLabel(myPosts.find((p) => p.id === e.target.value)?.title ?? null);
                    }}
                    aria-label={t("Grown from an idea (optional)")}
                    className="mt-2 w-full rounded-[16px] border border-[#eee5d0] bg-white/80 px-3 py-2.5 text-[12.5px] text-[#5c5344] outline-none focus:border-[#cbb98d]"
                  >
                    <option value="">{t("No seed — the workshop starts fresh")}</option>
                    {myPosts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}

                {people.length > 0 && (
                  <>
                    <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                      {t("Invite weavers (optional)")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {people.slice(0, 12).map((p) => {
                        const on = invited.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              setInvited((prev) =>
                                on ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                              )
                            }
                            aria-pressed={on}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 transition-all duration-300",
                              on
                                ? "border-[#cbb98d] bg-white text-[#5c5344]"
                                : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                            )}
                          >
                            <MakerMark name={p.name} size={20} />
                            <span className="text-[11px] font-semibold">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5 border-t border-[#eadfca]/70 px-5 py-3.5 sm:px-7">
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => void create()}
                  disabled={pTitle.trim().length < 3 || pBusy}
                  className={GP_HAND}
                  data-testid="project-create"
                >
                  {pBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Open the workshop")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== ONE WORKSHOP'S ROOM =============== */
function WorkshopRoom({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useT();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState(false);
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await netFetch<ProjectDetail>(`/api/network/projects/${id}`);
      setData(res);
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const layEntry = useCallback(async () => {
    if (entry.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      const res = await netFetch<{ entry: ProjectEntry }>(`/api/network/projects/${id}`, {
        method: "POST",
        body: { action: "entry", body: entry.trim() },
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              entries: [...prev.entries, res.entry],
              project: { ...prev.project, entryCount: prev.project.entryCount + 1, status: "weaving" },
              path: [
                ...prev.path,
                {
                  stage: "contribution",
                  title: res.entry.body.slice(0, 80),
                  detail: "a contribution laid down",
                  by: res.entry.by,
                  at: res.entry.createdAt,
                },
              ],
            }
          : prev
      );
      setEntry("");
    } catch {
      /* the words stay */
    } finally {
      setBusy(false);
    }
  }, [entry, busy, id]);

  const join = useCallback(async () => {
    setBusy(true);
    try {
      await netFetch(`/api/network/projects/${id}`, { method: "POST", body: { action: "join" } });
      await load();
    } catch {
      /* the door stays */
    } finally {
      setBusy(false);
    }
  }, [id, load]);

  const publish = useCallback(async () => {
    setBusy(true);
    try {
      await netFetch(`/api/network/projects/${id}`, { method: "POST", body: { action: "publish" } });
      setNote(t("The work entered the Collective Library."));
      await load();
    } catch {
      /* the work stays in the workshop */
    } finally {
      setBusy(false);
    }
  }, [id, load, t]);

  const invite = useCallback(
    async (personId: string) => {
      try {
        await netFetch(`/api/network/projects/${id}`, {
          method: "POST",
          body: { action: "invite", userId: personId },
        });
        setInviting(false);
        setNote(t("A weaver was invited."));
        await load();
      } catch {
        /* the invitation rests */
      }
    },
    [id, load, t]
  );

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-[13.5px] text-[#b45309]">{t("The workshop could not be read.")}</p>
        <button type="button" onClick={onBack} className={cn(GP_GHOST, "mt-4")}>
          {t("Collaborate")}
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("The workshops arrive…")}
      </p>
    );
  }

  const { project, seedPost, members, entries, path, membership } = data;
  const isWeaver = !!membership;

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[820px]">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Collaborate")}
          className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("Collaborate")}
        </button>

        <div className="gp-card mt-4 rounded-[26px] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
              {t(PROJECT_FOCUS_LABELS[project.focus] ?? project.focus)}
            </span>
            <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#a2947c]">
              {project.status}
            </span>
          </div>
          <h2 className="mt-2 font-[family-name:var(--font-literata)] text-[19px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
            {project.title}
          </h2>
          {project.description && (
            <p className="mt-2 text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
              {project.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isWeaver ? (
              project.status !== "published" && (
                <button type="button" onClick={() => void publish()} disabled={busy} className={GP_HAND}>
                  <Library className="size-4" aria-hidden="true" />
                  {t("Lay it in the Library")}
                </button>
              )
            ) : (
              <button type="button" onClick={() => void join()} disabled={busy} className={GP_HAND} data-testid="project-join">
                <Users className="size-4" aria-hidden="true" />
                {t("Join the weaving")}
              </button>
            )}
            {project.owner.id !== members[0]?.id && null}
            {(membership?.role === "owner" || project.owner.name) && members[0]?.role === "owner" && (
              <button
                type="button"
                onClick={async () => {
                  if (people.length === 0) {
                    try {
                      const res = await netFetch<{ people: PersonCard[] }>("/api/network/people?take=20");
                      setPeople(res.people);
                    } catch {
                      setPeople([]);
                    }
                  }
                  setInviting((v) => !v);
                }}
                className={GP_GHOST}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                {t("Invite a weaver")}
              </button>
            )}
          </div>
          {inviting && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {people
                .filter((p) => !members.some((m) => m.id === p.id))
                .slice(0, 10)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void invite(p.id)}
                    className="flex items-center gap-1.5 rounded-full border border-[#e8dfc9] bg-white/60 py-1 pl-1 pr-2.5 transition-colors duration-300 hover:border-[#d3c39c]"
                  >
                    <MakerMark name={p.name} size={20} />
                    <span className="text-[11px] font-semibold text-[#5c5344]">{p.name}</span>
                  </button>
                ))}
            </div>
          )}
          {note && (
            <p className="mt-3 text-[12.5px] italic text-[#8a6f46]" role="status">
              {note}
            </p>
          )}
        </div>

        {/* the seed — the path's first stone */}
        {seedPost && (
          <div className="gp-card mt-4 rounded-[22px] border-[#cbb98d]/50 p-4 sm:p-5">
            <RoomLabel>{t("The seed idea")}</RoomLabel>
            <p className="mt-2 font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
              {seedPost.title}
            </p>
            <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
              {seedPost.body}
            </p>
            <p className="mt-2 text-[11px] text-[#a2947c]">
              {t("hung by")} {seedPost.author.name} · {relativeTime(seedPost.createdAt, t)}
            </p>
          </div>
        )}

        {/* the weavers */}
        <div className="mt-5">
          <RoomLabel>{t("The weavers")}</RoomLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <span key={m.id} className="flex items-center gap-2 rounded-full border border-[#e8dfc9] bg-white/60 py-1 pl-1 pr-3">
                <MakerMark name={m.name} size={22} />
                <span className="text-[11.5px] font-semibold text-[#5c5344]">{m.name}</span>
                {m.role === "owner" && (
                  <span className="mono-label text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
                    {t("founder")}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* the contributions — each keeping its maker */}
        <div className="mt-6">
          <RoomLabel>{t("The weaving")}</RoomLabel>
          {entries.length === 0 ? (
            <p className="mt-2 text-[13px] italic text-[#8a7c64]">
              {t("The workshop rests quiet — the first contribution opens the weaving.")}
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {entries.map((e) => (
                <div key={e.id} className="gp-card rounded-[20px] p-4">
                  <div className="flex items-center gap-2.5">
                    <MakerMark name={e.by} size={26} />
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold text-[#5c5344]">{e.by}</p>
                      <p className="text-[10px] text-[#a2947c]">{relativeTime(e.createdAt, t)}</p>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.75] text-[#4c4436] [overflow-wrap:anywhere]">
                    {e.body}
                  </p>
                </div>
              ))}
            </div>
          )}
          {isWeaver && project.status !== "published" && (
            <div className="mt-3 flex items-end gap-2">
              <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                rows={2}
                maxLength={6000}
                placeholder={t("Lay your contribution down…")}
                aria-label={t("Lay your contribution down…")}
                data-testid="project-entry"
                className="gp-scroll min-h-[44px] flex-1 resize-none rounded-[16px] border border-[#e4d9bd] bg-white/80 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
              />
              <button
                type="button"
                onClick={() => void layEntry()}
                disabled={busy || entry.trim().length < 2}
                aria-label={t("Lay your contribution down…")}
                className={cn(GP_HAND, "size-11 px-0 py-0")}
                data-testid="project-entry-send"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* THE EVOLUTION PATH — the idea's honest walk */}
        <div className="mt-6">
          <RoomLabel>{t("The evolution path")}</RoomLabel>
          <div className="mt-2 space-y-0">
            {path.map((step, i) => (
              <div key={`${step.stage}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                      step.stage === "published"
                        ? "border-[#0d9488]/50 bg-[#0d9488]/10 text-[#0d9488]"
                        : step.stage === "contribution"
                          ? "border-[#a16207]/40 bg-[#a16207]/10 text-[#a16207]"
                          : "border-[#7c5cad]/40 bg-[#7c5cad]/10 text-[#7c5cad]"
                    )}
                  >
                    {step.stage === "published" ? (
                      <Library className="size-3" aria-hidden="true" />
                    ) : step.stage === "contribution" ? (
                      <BookOpen className="size-3" aria-hidden="true" />
                    ) : (
                      <GitBranch className="size-3" aria-hidden="true" />
                    )}
                  </span>
                  {i < path.length - 1 && (
                    <span aria-hidden="true" className="h-8 w-px bg-[#e4d9bd]" />
                  )}
                </div>
                <div className="min-w-0 pb-4">
                  <p className="text-[12.5px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#a2947c]">
                    {step.detail} · {step.by} · {relativeTime(step.at, t)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
