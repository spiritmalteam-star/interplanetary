"use client";

import { useEffect, useState } from "react";
import { Feather, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type CircleCard,
  type GatheringKind,
  type GatheringPost,
  type MeState,
  FOCUS_LABELS,
  KIND_META,
  EmptyRoom,
  GP_CARD,
  GP_GHOST,
  RoomLabel,
  MakerMark,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  MY SPACE — the visitor's own room inside the hall. The presence,   */
/*  the honest counts, the offerings they have spoken, the circles     */
/*  they keep. The parent holds the ProfileSheet; this page only       */
/*  shows the truth the tables carry.                                  */
/* ------------------------------------------------------------------ */

export default function MySpaceSection({
  active,
  me,
  onEditProfile,
}: {
  active: boolean;
  me: MeState | null;
  onEditProfile: () => void;
}) {
  const t = useT();
  const [posts, setPosts] = useState<GatheringPost[] | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [circles, setCircles] = useState<CircleCard[] | null>(null);
  const [circlesError, setCirclesError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);

  /* the offerings — the visitor's own words on the stream */
  useEffect(() => {
    if (!active) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ posts: GatheringPost[] }>("/api/gathering?mine=1&take=8");
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
  }, [active, t]);

  /* the circles the visitor keeps */
  useEffect(() => {
    if (!active) return;
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
  }, [active, t]);

  /* the shelf's own truth — the saved count is read, not guessed */
  useEffect(() => {
    if (!active) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ saved: Array<{ id: string }> }>("/api/network/bookmarks");
        if (!alive) return;
        setSavedCount(data.saved.length);
        setSavedError(null);
      } catch (err) {
        if (alive)
          setSavedError(err instanceof Error ? err.message : t("The shelf could not be read."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, t]);

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

        {/* ---------- your offerings ---------- */}
        <div className="mt-6">
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
                {posts.slice(0, 8).map((p) => {
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

        {/* ---------- your circles ---------- */}
        <div className="mt-4">
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

        {savedError && (
          <p className="mt-3 text-[12px] text-[#b45309]" role="alert">
            {savedError}
          </p>
        )}
      </div>
    </div>
  );
}
