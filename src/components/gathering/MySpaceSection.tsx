"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Bookmark,
  Eye,
  Feather,
  Library,
  Loader2,
  Music4,
  ScrollText,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type CircleCard,
  type GatheringKind,
  type GatheringPost,
  type MeState,
  type NotificationRow,
  FOCUS_LABELS,
  KIND_META,
  EmptyRoom,
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  RoomLabel,
  MakerMark,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  MY SPACE — the visitor's own room inside the hall, now a profile   */
/*  overview: the presence and the honest counts stand above four      */
/*  labeled rooms — Works (the offerings and the making doors),        */
/*  Activity (the bell's latest rings and the circles kept), Saved     */
/*  (the quiet shelf in miniature) and Settings (the manners in        */
/*  summary, with doors to the full rooms). Three quiet hands ride     */
/*  above the tabs: the bell, the frequency radio, the way home.       */
/*  The parent holds the ProfileSheet and the overlays; this page      */
/*  only shows the truth the tables carry.                             */
/* ------------------------------------------------------------------ */

type MeTab = "works" | "activity" | "saved" | "settings";

/* the bell's rings, phrased the way the bell's own room says them —
   the same lines the Notifications sheet speaks */
const BELL_LINE: Record<string, string> = {
  echo: "echoed your offering",
  resonance: "resonated with your offering",
  follow: "is entangled with your path now",
  connection_request: "asked to meet you",
  connection_accepted: "opened the door you offered",
  circle_join: "joined a circle you keep",
  project_join: "joined a weaving of yours",
  project_entry: "added a weaving",
  project_invite: "invited you to weave",
  message: "sent you a word",
};

/* the shelf's own row shape — the same source the Saved room reads */
interface SavedRow {
  id: string;
  postId: string;
  savedAt: string;
  post: {
    id: string;
    kind: string;
    title: string;
    body: string;
    author: { name: string; anon: boolean };
    resonanceCount: number;
    echoCount: number;
    createdAt: string;
  };
}

/* the bell's manners, for the read-only summary in the Settings tab */
const PREF_SUMMARY: Array<{ key: keyof MeState["prefs"]; label: string }> = [
  { key: "resonance", label: "Resonances on your work" },
  { key: "echoes", label: "Echoes and replies" },
  { key: "connections", label: "Introductions and follows" },
  { key: "library", label: "Community updates" },
];

export default function MySpaceSection({
  active,
  me,
  unread = 0,
  onEditProfile,
  onOpenNotifications,
  onOpenSaved,
  onOpenSettings,
  onOpenGuidelines,
  onOpenLibrary,
  onPublishWork,
  onToggleRadio,
  radioOpen = false,
  onReturnHome,
}: {
  active: boolean;
  me: MeState | null;
  unread?: number;
  onEditProfile: () => void;
  onOpenNotifications: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenGuidelines: () => void;
  onOpenLibrary: () => void;
  onPublishWork: () => void;
  onToggleRadio: () => void;
  radioOpen?: boolean;
  onReturnHome: () => void;
  /* accepted for forward-compatibility — the Settings tab carries a
     read-only summary with doors, so no live me-state flows back yet */
  onSaved?: (me: MeState) => void;
}) {
  const t = useT();
  const [tab, setTab] = useState<MeTab>("works");

  /* the offerings — the visitor's own words on the stream */
  const [posts, setPosts] = useState<GatheringPost[] | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  /* the bell's rings — the latest ten, read honestly */
  const [rings, setRings] = useState<NotificationRow[] | null>(null);
  const [ringsError, setRingsError] = useState<string | null>(null);

  /* the circles the visitor keeps */
  const [circles, setCircles] = useState<CircleCard[] | null>(null);
  const [circlesError, setCirclesError] = useState<string | null>(null);

  /* the shelf's own rows — the count above and the Saved tab read one truth */
  const [saved, setSaved] = useState<SavedRow[] | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);

  /* the offerings — read when the Works room opens */
  useEffect(() => {
    if (!active || tab !== "works" || posts !== null) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ posts: GatheringPost[] }>("/api/gathering?mine=1&take=12");
        if (!alive) return;
        setPosts(data.posts);
        setPostsError(null);
      } catch (err) {
        if (alive)
          setPostsError(err instanceof Error ? err.message : t("Your offerings could not be read."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, tab, posts, t]);

  /* the bell — read when the Activity room opens */
  useEffect(() => {
    if (!active || tab !== "activity" || rings !== null) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ notifications: NotificationRow[]; unread: number }>(
          "/api/network/notifications"
        );
        if (!alive) return;
        setRings(data.notifications);
        setRingsError(null);
      } catch (err) {
        if (alive)
          setRingsError(err instanceof Error ? err.message : t("The bell could not be read."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, tab, rings, t]);

  /* the circles — read when the Activity room opens */
  useEffect(() => {
    if (!active || tab !== "activity" || circles !== null) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ circles: CircleCard[] }>(
          "/api/network/circles?mine=1&take=40"
        );
        if (!alive) return;
        setCircles(data.circles.slice(0, 6));
        setCirclesError(null);
      } catch (err) {
        if (alive)
          setCirclesError(err instanceof Error ? err.message : t("Your circles could not be read."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, tab, circles, t]);

  /* the shelf — one read serves the honest counts and the Saved tab */
  useEffect(() => {
    if (!active || saved !== null) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ saved: SavedRow[] }>("/api/network/bookmarks");
        if (!alive) return;
        setSaved(data.saved);
        setSavedError(null);
      } catch (err) {
        if (alive)
          setSavedError(err instanceof Error ? err.message : t("The shelf could not be read."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, saved, t]);

  const savedCount = saved?.length ?? null;

  const counts: Array<{ key: string; n: number | null; label: string }> = [
    { key: "offerings", n: me?.counts.posts ?? null, label: t("offerings") },
    { key: "circles", n: me?.counts.circles ?? null, label: t("circles") },
    { key: "workshops", n: me?.counts.projects ?? null, label: t("workshops") },
    { key: "connections", n: me?.counts.connections ?? null, label: t("connections") },
    { key: "saved", n: savedCount, label: t("saved") },
  ];

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-24">
      <div className="mx-auto max-w-[860px] px-4 pt-4 sm:px-6 sm:pt-6">
        <RoomLabel>{t("the gathering · my space")}</RoomLabel>

        {/* ---------- the presence ---------- */}
        <div className={cn(GP_CARD, "mt-2.5 p-6 text-center")} data-testid="gath-me-identity">
          <div className="flex justify-center">
            <MakerMark name={me?.name ?? "·"} size={64} />
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-cinzel)] text-[18px] font-semibold text-[#3d3428]">
            {me?.name ?? "…"}
          </h2>
          {me?.bio ? (
            <p className="mx-auto mt-2 max-w-[460px] font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#7c715f] [overflow-wrap:anywhere]">
              {me.bio}
            </p>
          ) : (
            <>
              <p className="mx-auto mt-2 max-w-[460px] font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#a2947c]">
                {t("The introduction waits — a few honest words about your work.")}
              </p>
              <button
                type="button"
                onClick={onEditProfile}
                className={cn(GP_GHOST, "mt-3.5")}
                data-testid="gath-me-intro"
              >
                {t("Write your introduction")}
              </button>
            </>
          )}
          {me?.since && (
            <p className="mono-label mt-3.5 text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
              {t("in the gathering since")}{" "}
              {new Date(me.since).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          )}

          {me && me.interests.length > 0 && (
            <div className="mt-4">
              <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
                {t("fields of curiosity")}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {me.interests.map((i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[#e8dfc9] bg-white/55 px-2.5 py-1 text-[10.5px] font-semibold text-[#5c5344]"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {me && me.disciplines.length > 0 && (
            <div className="mt-3.5">
              <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
                {t("crafts")}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {me.disciplines.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-[#e8dfc9] bg-white/55 px-2.5 py-1 text-[10.5px] font-semibold text-[#5c5344]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {me && (
            <span className="mono-label mt-4 inline-flex items-center rounded-full border border-[#e4d9bd] bg-white/55 px-2.5 py-1 text-[8px] uppercase tracking-[0.16em] text-[#7c715f]">
              {me.visibility === "private" ? t("Private") : t("Public")}
            </span>
          )}
        </div>

        {/* ---------- the honest counts ---------- */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map((c) => (
            <div key={c.key} className={cn(GP_CARD, "p-4 text-center")} data-testid={`gath-me-count-${c.key}`}>
              <p className="font-[family-name:var(--font-cinzel)] text-[20px] font-semibold tabular-nums text-[#3d3428]">
                {c.n ?? "—"}
              </p>
              <p className="mono-label mt-1 text-[7.5px] uppercase tracking-[0.16em] text-[#a2947c]">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* ---------- the quiet hands — three small doors only; every
            other function now lives in its own labeled room below.
            Each pill reads its own name; no mute icons, no guesswork. ---------- */}
        <div
          className="mt-2.5 flex flex-wrap items-center gap-2"
          data-testid="gath-me-hands"
          role="group"
          aria-label={t("Quiet hands")}
        >
          <button
            type="button"
            onClick={onOpenNotifications}
            data-testid="gath-me-bell"
            className={cn(GP_GHOST, "min-h-[44px]")}
          >
            <Bell className="size-4" aria-hidden="true" />
            {t("The bell")}
            {unread > 0 && (
              <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#a16207] px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleRadio}
            aria-pressed={radioOpen}
            data-testid="gath-me-radio"
            className={cn(
              GP_GHOST,
              "min-h-[44px]",
              radioOpen && "border-[#cbb98d] bg-white text-[#3d3428]"
            )}
          >
            <Music4 className="size-4" aria-hidden="true" />
            {radioOpen ? t("The frequency radio — playing") : t("The frequency radio")}
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            data-testid="gath-me-return"
            className={cn(GP_GHOST, "min-h-[44px]")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("Return to the house")}
          </button>
        </div>

        {/* ---------- the four rooms ---------- */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as MeTab)}
          className="mt-5"
        >
          <TabsList
            aria-label={t("Your rooms within the gathering")}
            className="h-auto! grid w-full grid-cols-4 gap-1 rounded-full border border-[#e4d9bd] bg-white/60 p-1"
          >
            <TabsTrigger
              value="works"
              data-testid="gath-me-tab-works"
              className="min-h-[44px] rounded-full px-2 text-[11.5px] font-semibold text-[#7c715f] data-[state=active]:border-[#cbb98d] data-[state=active]:bg-white data-[state=active]:text-[#3d3428] data-[state=active]:shadow-[0_2px_8px_-4px_rgba(122,103,70,0.4)] dark:data-[state=active]:border-[#cbb98d] dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#3d3428] dark:text-[#7c715f]"
            >
              <Feather className="size-3.5" aria-hidden="true" />
              {t("Works")}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              data-testid="gath-me-tab-activity"
              className="min-h-[44px] rounded-full px-2 text-[11.5px] font-semibold text-[#7c715f] data-[state=active]:border-[#cbb98d] data-[state=active]:bg-white data-[state=active]:text-[#3d3428] data-[state=active]:shadow-[0_2px_8px_-4px_rgba(122,103,70,0.4)] dark:data-[state=active]:border-[#cbb98d] dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#3d3428] dark:text-[#7c715f]"
            >
              <Bell className="size-3.5" aria-hidden="true" />
              {t("Activity")}
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              data-testid="gath-me-tab-saved"
              className="min-h-[44px] rounded-full px-2 text-[11.5px] font-semibold text-[#7c715f] data-[state=active]:border-[#cbb98d] data-[state=active]:bg-white data-[state=active]:text-[#3d3428] data-[state=active]:shadow-[0_2px_8px_-4px_rgba(122,103,70,0.4)] dark:data-[state=active]:border-[#cbb98d] dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#3d3428] dark:text-[#7c715f]"
            >
              <Bookmark className="size-3.5" aria-hidden="true" />
              {t("Saved")}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              data-testid="gath-me-tab-settings"
              className="min-h-[44px] rounded-full px-2 text-[11.5px] font-semibold text-[#7c715f] data-[state=active]:border-[#cbb98d] data-[state=active]:bg-white data-[state=active]:text-[#3d3428] data-[state=active]:shadow-[0_2px_8px_-4px_rgba(122,103,70,0.4)] dark:data-[state=active]:border-[#cbb98d] dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#3d3428] dark:text-[#7c715f]"
            >
              <Settings2 className="size-3.5" aria-hidden="true" />
              {t("Settings")}
            </TabsTrigger>
          </TabsList>

          {/* ---------- works — the offerings and the making doors ---------- */}
          <TabsContent value="works" className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onPublishWork}
                data-testid="gath-me-publish"
                className={cn(GP_HAND, "min-h-[44px]")}
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {t("Publish a finished work")}
              </button>
              <button
                type="button"
                onClick={onOpenLibrary}
                data-testid="gath-me-library"
                className={cn(GP_GHOST, "min-h-[44px]")}
              >
                <Library className="size-4" aria-hidden="true" />
                {t("Creation Commons — the archive of finished work")}
              </button>
            </div>

            <div className="mt-4">
              <RoomLabel>{t("Your offerings")}</RoomLabel>
              {postsError ? (
                <p className="mt-2 text-[12px] text-[#b45309]" role="alert">
                  {postsError}
                </p>
              ) : posts === null ? (
                <p className="mt-2 flex items-center gap-2 py-8 text-[13px] text-[#a2947c]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("Your offerings are being read…")}
                </p>
              ) : posts.length === 0 ? (
                <EmptyRoom
                  icon={Feather}
                  line={t("Nothing offered yet — the Pulse receives your first reflection gladly.")}
                />
              ) : (
                <>
                  <div className="mt-1.5 flex flex-col divide-y divide-[#eadfca]/60">
                    {posts.slice(0, 12).map((p) => {
                      const meta = KIND_META[p.kind as GatheringKind];
                      const Icon = meta?.icon ?? Feather;
                      const accent = meta?.accent ?? "#8a6f46";
                      return (
                        <div key={p.id} className="flex items-center gap-3 py-2.5" data-testid="gath-me-post">
                          <Icon className="size-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-literata)] text-[13px] font-semibold text-[#3d3428]">
                            {p.title}
                          </span>
                          <span className="hidden shrink-0 text-[10.5px] text-[#a2947c] sm:inline">
                            {p.echoCount} {t("echoes")} · {p.resonanceCount} {t("resonances")}
                          </span>
                          <span className="w-[70px] shrink-0 text-right text-[10.5px] text-[#a2947c]">
                            {relativeTime(p.createdAt, t)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 pb-2.5 text-[11px] italic text-[#a2947c]">
                    {t("See all in the Pulse — the stream holds every offering in place.")}
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          {/* ---------- activity — the bell's latest rings, the circles kept ---------- */}
          <TabsContent value="activity" className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <RoomLabel>{t("The bell")}</RoomLabel>
              <button
                type="button"
                onClick={onOpenNotifications}
                data-testid="gath-me-notifications"
                className={cn(GP_GHOST, "min-h-[44px] px-3.5 text-[11.5px]")}
              >
                <Bell className="size-3.5" aria-hidden="true" />
                {t("Open the full bell")}
              </button>
            </div>

            {ringsError ? (
              <p className="mt-2 text-[12px] text-[#b45309]" role="alert">
                {ringsError}
              </p>
            ) : rings === null ? (
              <p className="mt-2 flex items-center gap-2 py-6 text-[13px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The bell arrives…")}
              </p>
            ) : rings.length === 0 ? (
              <p className="mt-2 rounded-[16px] border border-[#e8dfc9] bg-white/60 px-4 py-3 text-center font-[family-name:var(--font-literata)] text-[12px] italic text-[#a2947c]">
                {t("The bell rests quiet — no rings yet.")}
              </p>
            ) : (
              <div className="mt-1.5 flex flex-col divide-y divide-[#eadfca]/60">
                {rings.slice(0, 10).map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 py-2.5" data-testid="gath-me-ring">
                    <span aria-hidden="true" className="mt-[7px] flex size-1.5 shrink-0">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          n.read ? "bg-[#e4d9bd]" : "bg-[#a16207]"
                        )}
                      />
                    </span>
                    {!n.read && <span className="sr-only">{t("unread")}</span>}
                    <p className="min-w-0 flex-1 text-[12.5px] leading-[1.6] text-[#4c4436] [overflow-wrap:anywhere]">
                      <span className="font-semibold text-[#3d3428]">{n.actorName}</span>{" "}
                      {t(BELL_LINE[n.type] ?? "left a trace")}
                      {n.body && (
                        <span className="italic text-[#7c715f]"> · {n.body}</span>
                      )}
                    </p>
                    <span className="w-[70px] shrink-0 text-right text-[10.5px] text-[#a2947c]">
                      {relativeTime(n.createdAt, t)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5">
              <RoomLabel>{t("Your circles")}</RoomLabel>
              {circlesError ? (
                <p className="mt-2 text-[12px] text-[#b45309]" role="alert">
                  {circlesError}
                </p>
              ) : circles === null ? (
                <p className="mt-2 flex items-center gap-2 py-6 text-[13px] text-[#a2947c]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("Your circles are being read…")}
                </p>
              ) : circles.length === 0 ? (
                <p className="mt-2 rounded-[16px] border border-[#e8dfc9] bg-white/60 px-4 py-3 text-center font-[family-name:var(--font-literata)] text-[12px] italic text-[#a2947c]">
                  {t("No circle is yours yet — the Circles street waits for its founder.")}
                </p>
              ) : (
                <div className="mt-1.5 flex flex-col divide-y divide-[#eadfca]/60">
                  {circles.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-2.5" data-testid="gath-me-circle">
                      <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-literata)] text-[13px] font-semibold text-[#3d3428]">
                        {c.name}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-[#a2947c]">
                        {t(FOCUS_LABELS[c.focus] ?? c.focus)} · {c.memberCount} {t("members")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---------- saved — the quiet shelf in miniature ---------- */}
          <TabsContent value="saved" className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <RoomLabel>{t("Saved — your quiet shelf")}</RoomLabel>
              {saved !== null && !savedError && (
                <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
                  {saved.length} {t("works kept")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenSaved}
              data-testid="gath-me-saved"
              className={cn(GP_GHOST, "mt-2.5 min-h-[44px] px-3.5 text-[11.5px]")}
            >
              <Bookmark className="size-3.5" aria-hidden="true" />
              {t("Open the shelf in full")}
            </button>

            {savedError ? (
              <p className="mt-3 text-[12px] text-[#b45309]" role="alert">
                {savedError}
              </p>
            ) : saved === null ? (
              <p className="mt-2 flex items-center gap-2 py-6 text-[13px] text-[#a2947c]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("The shelf is being read…")}
              </p>
            ) : saved.length === 0 ? (
              <EmptyRoom
                icon={Bookmark}
                line={t("Nothing kept yet — the bookmark hand rests on every offering in the Pulse.")}
              />
            ) : (
              <div className="mt-2.5 flex flex-col divide-y divide-[#eadfca]/60">
                {saved.slice(0, 10).map((row) => {
                  const meta = KIND_META[row.post.kind as GatheringKind];
                  const Icon = meta?.icon ?? Feather;
                  const accent = meta?.accent ?? "#8a6f46";
                  return (
                    <div key={row.id} className="flex items-center gap-3 py-2.5" data-testid="gath-me-saved-row">
                      <Icon className="size-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-literata)] text-[13px] font-semibold text-[#3d3428]">
                        {row.post.title}
                      </span>
                      <span className="hidden max-w-[140px] shrink-0 truncate text-[10.5px] text-[#a2947c] sm:inline">
                        {row.post.author.name}
                      </span>
                      <span className="w-[70px] shrink-0 text-right text-[10.5px] text-[#a2947c]">
                        {relativeTime(row.savedAt, t)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ---------- settings — the manners in summary, doors to the rooms ---------- */}
          <TabsContent value="settings" className="mt-4">
            <RoomLabel>{t("Settings — the bell's manners, the visibility")}</RoomLabel>

            {me && (
              <div className={cn(GP_CARD, "mt-2.5 p-4")} data-testid="gath-me-settings-summary">
                <div className="flex items-center gap-2.5">
                  <Eye className="size-4 shrink-0 text-[#7c5cad]" aria-hidden="true" />
                  <span className="text-[12px] font-semibold text-[#3d3428]">{t("Visibility")}</span>
                  <span className="mono-label ml-auto rounded-full border border-[#e4d9bd] bg-white/55 px-2.5 py-1 text-[8px] uppercase tracking-[0.16em] text-[#7c715f]">
                    {me.visibility === "private" ? t("Private") : t("Public")}
                  </span>
                </div>

                <div className="mt-3 border-t border-[#eadfca]/70 pt-3">
                  <div className="flex items-center gap-2.5">
                    <BellRing className="size-4 shrink-0 text-[#a16207]" aria-hidden="true" />
                    <span className="text-[12px] font-semibold text-[#3d3428]">{t("The bell")}</span>
                  </div>
                  <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {PREF_SUMMARY.map((row) => {
                      const on = me.prefs[row.key];
                      return (
                        <li
                          key={row.key}
                          className="flex items-center justify-between gap-2 rounded-[14px] border border-[#e8dfc9] bg-white px-3 py-2"
                          data-testid={`gath-me-manner-${row.key}`}
                        >
                          <span className="min-w-0 truncate text-[11.5px] font-semibold text-[#5c5344]">
                            {t(row.label)}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]",
                              on
                                ? "border-[#cbb98d] text-[#8a6f46]"
                                : "border-[#e8dfc9] text-[#a2947c]"
                            )}
                          >
                            {on ? t("On") : t("Off")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEditProfile}
                data-testid="gath-me-edit"
                className={cn(GP_HAND, "min-h-[44px]")}
              >
                <UserRound className="size-4" aria-hidden="true" />
                {t("Edit your introduction")}
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                data-testid="gath-me-settings"
                className={cn(GP_GHOST, "min-h-[44px]")}
              >
                <Settings2 className="size-4" aria-hidden="true" />
                {t("Settings — the bell's manners, the visibility")}
              </button>
              <button
                type="button"
                onClick={onOpenGuidelines}
                data-testid="gath-me-guidelines"
                className={cn(GP_GHOST, "min-h-[44px]")}
              >
                <ScrollText className="size-4" aria-hidden="true" />
                {t("Guidelines — the trust this place runs on")}
              </button>
              <button
                type="button"
                onClick={onOpenSaved}
                data-testid="gath-me-saved-room"
                className={cn(GP_GHOST, "min-h-[44px]")}
              >
                <Bookmark className="size-4" aria-hidden="true" />
                {t("Saved — your quiet shelf")}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
