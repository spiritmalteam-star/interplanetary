"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  FOCUS_LABELS,
  type CircleCard,
  type GatheringPost,
  type PersonCard,
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
/*  THE CIRCLES — communities around interests, disciplines and        */
/*  shared projects. Discover, join, or found one: nine focuses,       */
/*  public or by invitation, the members' truth read from the tables.  */
/* ------------------------------------------------------------------ */

const FOCUS_ORDER = [
  "consciousness",
  "art",
  "music",
  "science",
  "philosophy",
  "dreams",
  "humanity",
  "technology",
  "projects",
];

const FOCUS_ACCENT: Record<string, string> = {
  consciousness: "#7c5cad",
  art: "#a16207",
  music: "#0f766e",
  science: "#0d9488",
  philosophy: "#8a6f46",
  dreams: "#9a6b8a",
  humanity: "#8a6d3b",
  technology: "#5c5344",
  projects: "#b45309",
};

export default function CirclesSection({ active }: { active: boolean }) {
  const t = useT();
  const [circles, setCircles] = useState<CircleCard[] | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  /* the founder's own sheet */
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fFocus, setFFocus] = useState("consciousness");
  const [fVis, setFVis] = useState<"public" | "invite">("public");
  const [fBusy, setFBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setCircles(null);
    try {
      const params = new URLSearchParams();
      if (focus) params.set("focus", focus);
      const data = await netFetch<{ circles: CircleCard[] }>(
        `/api/network/circles?${params.toString()}`
      );
      setCircles(data.circles);
    } catch {
      setError(true);
    }
  }, [focus]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const toggleMembership = useCallback(
    async (circle: CircleCard) => {
      setBusyId(circle.id);
      try {
        const data = await netFetch<{ joined: boolean }>(`/api/network/circles/${circle.id}`, {
          method: "POST",
          body: { action: circle.joined ? "leave" : "join" },
        });
        setCircles((prev) =>
          (prev ?? []).map((c) =>
            c.id === circle.id
              ? {
                  ...c,
                  joined: data.joined,
                  memberCount: Math.max(1, c.memberCount + (data.joined ? 1 : -1)),
                }
              : c
          )
        );
      } catch {
        /* the door stays where it was */
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  const found = useCallback(async () => {
    if (fName.trim().length < 3 || fBusy) return;
    setFBusy(true);
    try {
      const data = await netFetch<{ circle: CircleCard }>("/api/network/circles", {
        method: "POST",
        body: {
          name: fName.trim(),
          description: fDesc.trim() || undefined,
          focus: fFocus,
          visibility: fVis,
        },
      });
      setCircles((prev) => [data.circle, ...(prev ?? [])]);
      setCreating(false);
      setFName("");
      setFDesc("");
    } catch {
      /* the founder's sheet stays open, the words stay */
    } finally {
      setFBusy(false);
    }
  }, [fName, fDesc, fFocus, fVis, fBusy]);

  if (detailId) {
    return (
      <CircleRoom
        id={detailId}
        onBack={() => {
          setDetailId(null);
          void load();
        }}
      />
    );
  }

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between gap-3">
          <RoomLabel>{t("Circles")}</RoomLabel>
          <button type="button" onClick={() => setCreating(true)} className={GP_HAND} data-testid="circles-found">
            <Plus className="size-4" aria-hidden="true" />
            {t("Found a circle")}
          </button>
        </div>

        <div className="gp-scroll mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFocus(null)}
            aria-pressed={focus === null}
            className={cn(
              "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
              focus === null
                ? "border-[#cbb98d] bg-white text-[#5c5344]"
                : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
            )}
          >
            {t("All focuses")}
          </button>
          {FOCUS_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFocus(focus === f ? null : f)}
              aria-pressed={focus === f}
              className={cn(
                "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                focus === f
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block size-1.5 rounded-full"
                style={{ background: FOCUS_ACCENT[f] }}
              />
              {t(FOCUS_LABELS[f])}
            </button>
          ))}
        </div>

        {circles === null && !error && (
          <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The circles arrive…")}
          </p>
        )}
        {error && (
          <div className="py-24 text-center">
            <p className="text-[13.5px] text-[#b45309]">{t("The circles could not be read.")}</p>
            <button type="button" onClick={() => void load()} className={cn(GP_GHOST, "mt-4")}>
              {t("The exhibition continues")}
            </button>
          </div>
        )}
        {circles !== null && circles.length === 0 && !error && (
          <EmptyRoom
            icon={Users}
            line={t("No circles rest here yet — found the first one and gather your people.")}
          />
        )}

        {circles !== null && circles.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {circles.map((c) => (
              <div key={c.id} className="gp-card flex flex-col rounded-[24px] p-4 sm:p-5" data-testid={`circle-card-${c.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <span
                    aria-hidden="true"
                    className="flex size-9 items-center justify-center rounded-[12px] border border-white/90"
                    style={{
                      background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
                    }}
                  >
                    <span className="block size-2.5 rounded-full" style={{ background: FOCUS_ACCENT[c.focus] ?? "#8a6f46" }} />
                  </span>
                  {c.joined && (
                    <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
                      {c.role === "owner" ? t("founder") : t("yours")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDetailId(c.id)}
                  className="focus-glow mt-3 text-left outline-none"
                >
                  <h3 className="font-[family-name:var(--font-literata)] text-[15px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere] hover:underline">
                    {c.name}
                  </h3>
                </button>
                {c.description && (
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
                    {c.description}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-[#a2947c]">
                  {t(FOCUS_LABELS[c.focus] ?? c.focus)} · {c.memberCount} {t("members")} · {c.postCount} {t("offerings")}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => void toggleMembership(c)}
                    disabled={busyId === c.id || c.role === "owner"}
                    className={c.joined ? GP_GHOST : GP_HAND}
                    data-testid={`circle-join-${c.id}`}
                  >
                    {busyId === c.id ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : null}
                    {c.joined
                      ? c.role === "owner"
                        ? t("Founding member")
                        : t("Leave quietly")
                      : t("Join this circle")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailId(c.id)}
                    className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 px-3 py-2 text-[11.5px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
                  >
                    {t("Enter")}
                  </button>
                </div>
              </div>
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
            aria-label={t("Found a circle")}
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
              className="gp-glass relative flex max-h-[92%] flex-col rounded-t-[28px] sm:mx-auto sm:w-full sm:max-w-[560px] sm:rounded-[30px]"
            >
              <div className="flex items-center justify-between px-5 pt-4 sm:px-7 sm:pt-5">
                <RoomLabel>{t("Found a circle")}</RoomLabel>
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
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  maxLength={60}
                  placeholder={t("Give the circle its name…")}
                  aria-label={t("Give the circle its name…")}
                  data-testid="circle-name"
                  className={GP_INPUT}
                />
                <textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder={t("What gathers here? (optional)")}
                  aria-label={t("What gathers here? (optional)")}
                  className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
                />
                <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                  {t("The focus")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {FOCUS_ORDER.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFFocus(f)}
                      aria-pressed={fFocus === f}
                      className={cn(
                        "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                        fFocus === f
                          ? "border-[#cbb98d] bg-white text-[#5c5344]"
                          : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                      )}
                    >
                      {t(FOCUS_LABELS[f])}
                    </button>
                  ))}
                </div>
                <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                  {t("The door")}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFVis("public")}
                    aria-pressed={fVis === "public"}
                    className={cn(
                      "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                      fVis === "public"
                        ? "border-[#cbb98d] bg-white text-[#5c5344]"
                        : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                    )}
                  >
                    {t("Open to everyone")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFVis("invite")}
                    aria-pressed={fVis === "invite"}
                    className={cn(
                      "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                      fVis === "invite"
                        ? "border-[#cbb98d] bg-white text-[#5c5344]"
                        : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                    )}
                  >
                    {t("By invitation")}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t border-[#eadfca]/70 px-5 py-3.5 sm:px-7">
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => void found()}
                  disabled={fName.trim().length < 3 || fBusy}
                  className={GP_HAND}
                  data-testid="circle-found-submit"
                >
                  {fBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Found it")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============== ONE CIRCLE'S ROOM =============== */
function CircleRoom({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useT();
  const [data, setData] = useState<{
    circle: CircleCard;
    members: Array<PersonCard & { role: string; since: string }>;
    posts: GatheringPost[];
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await netFetch<{
          circle: CircleCard;
          members: Array<PersonCard & { role: string; since: string }>;
          posts: GatheringPost[];
        }>(`/api/network/circles/${id}`);
        if (!alive) return;
        setData(res);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-[13.5px] text-[#b45309]">{t("The circle could not be read.")}</p>
        <button type="button" onClick={onBack} className={cn(GP_GHOST, "mt-4")}>
          {t("The circles arrive…")}
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("The circles arrive…")}
      </p>
    );
  }

  const { circle, members, posts } = data;

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[900px]">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("The Gathering")}
          className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("Circles")}
        </button>

        <div className="gp-card mt-4 rounded-[26px] p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-literata)] text-[19px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
            {circle.name}
          </h2>
          {circle.description && (
            <p className="mt-2 text-[13px] leading-[1.75] text-[#5c5344] [overflow-wrap:anywhere]">
              {circle.description}
            </p>
          )}
          <p className="mt-3 text-[12px] text-[#a2947c]">
            {t(FOCUS_LABELS[circle.focus] ?? circle.focus)} · {circle.memberCount} {t("members")} ·{" "}
            {t("founded by")} {circle.owner.name}
          </p>
        </div>

        <div className="mt-5">
          <RoomLabel>{t("The members")}</RoomLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-2 rounded-full border border-[#e8dfc9] bg-white/60 py-1 pl-1 pr-3"
              >
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

        <div className="mt-6">
          <RoomLabel>{t("The circle's offerings")}</RoomLabel>
          {posts.length === 0 ? (
            <p className="mt-2 text-[13px] italic text-[#8a7c64]">
              {t("The circle rests quiet — its members' offerings gather here.")}
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="gp-card rounded-[20px] p-4">
                  <div className="flex items-center gap-2.5">
                    <MakerMark name={p.author.name} size={26} />
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold text-[#5c5344]">{p.author.name}</p>
                      <p className="text-[10px] text-[#a2947c]">{relativeTime(p.createdAt, t)}</p>
                    </div>
                  </div>
                  <h3 className="mt-2.5 font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
