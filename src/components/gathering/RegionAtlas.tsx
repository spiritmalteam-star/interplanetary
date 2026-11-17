"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Loader2, MapPin, Send, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type GatheringPost,
  type RegionId,
  REGION_IDS,
  REGION_LABELS,
  GP_INPUT,
  MakerMark,
  RoomLabel,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE REGION ATLAS — the gathering's own map, standing only here.    */
/*                                                                     */
/*  One small map inside the hall: seven stylized shores of the        */
/*  earth, each carrying the intentions spoken for it. The visitor     */
/*  localizes — chooses the region their heart stands in — and          */
/*  intentionalizes — speaks a vow for that shore — and the hall       */
/*  keeps both: the offering wears its region in the stream, and the   */
/*  atlas wears the living count on the map itself.                    */
/*                                                                     */
/*  The map is deliberately a cartographer's dream, not a survey:      */
/*  soft porcelain lands on a quiet ocean of graticule lines, the      */
/*  house's own warmth in daylight, the site's own crystal at night.   */
/* ------------------------------------------------------------------ */

/* the seven shores, drawn by hand on a 720 × 340 ocean */
const REGION_SHAPES: Record<RegionId, string[]> = {
  "north-america": [
    "M28 72 C34 50 62 36 98 32 C134 28 170 36 194 52 C210 62 218 76 210 88 C202 98 190 102 184 114 C178 126 172 138 160 146 C156 168 152 184 144 196 C140 202 132 202 130 194 C128 184 124 172 114 166 C96 156 72 148 54 132 C38 118 24 90 28 72 Z",
  ],
  "south-america": [
    "M168 200 C180 190 200 190 214 202 C226 212 234 230 232 250 C230 272 222 292 210 308 C202 318 190 322 184 312 C178 302 180 288 174 274 C168 258 158 240 158 222 C158 210 160 206 168 200 Z",
  ],
  europe: [
    "M320 78 C312 66 318 52 332 46 C340 26 362 20 380 28 C396 24 412 30 420 42 C428 52 424 64 414 68 C406 72 400 66 392 70 C386 74 384 82 376 86 C366 92 352 90 342 86 C334 84 326 84 320 78 Z",
  ],
  africa: [
    "M318 112 C330 100 354 96 376 102 C394 108 408 118 412 134 C416 150 408 160 402 174 C396 188 394 204 386 218 C378 232 368 246 358 254 C350 260 342 256 338 246 C334 234 336 220 328 206 C320 192 308 178 306 158 C304 138 308 122 318 112 Z",
    "M424 232 C428 226 434 228 434 236 C434 244 430 252 426 256 C422 260 418 256 418 250 C418 242 420 238 424 232 Z",
  ],
  "middle-east": [
    "M424 100 C436 90 454 88 468 96 C480 103 486 116 480 128 C474 140 462 148 452 156 C444 162 434 158 430 148 C426 138 418 126 418 112 C418 106 420 102 424 100 Z",
  ],
  asia: [
    "M446 44 C470 30 516 24 558 30 C600 36 640 48 662 66 C680 80 682 96 670 110 C658 122 644 126 636 138 C628 150 622 164 610 172 C598 180 586 174 580 162 C574 150 566 142 554 136 C542 130 528 128 518 118 C508 108 500 96 488 88 C476 80 462 72 452 60 C446 52 444 48 446 44 Z",
    "M528 140 C538 136 548 142 550 154 C552 166 546 178 538 188 C532 196 524 194 522 184 C520 172 518 160 522 150 C524 144 524 142 528 140 Z",
  ],
  oceania: [
    "M592 222 C606 210 630 206 648 214 C664 221 672 236 666 250 C660 264 644 272 626 272 C610 272 596 266 590 252 C585 242 584 230 592 222 Z",
    "M688 262 C692 256 698 258 696 266 C694 274 688 280 684 284 C680 288 676 284 678 278 C680 272 684 268 688 262 Z",
  ],
};

/* where each shore's living count rests */
const REGION_BADGES: Record<RegionId, { x: number; y: number }> = {
  "north-america": { x: 116, y: 86 },
  "south-america": { x: 196, y: 246 },
  europe: { x: 366, y: 60 },
  africa: { x: 358, y: 174 },
  "middle-east": { x: 448, y: 122 },
  asia: { x: 556, y: 94 },
  oceania: { x: 628, y: 240 },
};

interface RegionCount {
  id: RegionId;
  count: number;
}

const ATLAS_STYLE = `
/* the atlas' own dress — porcelain lands by day, crystal lands at night */
.gath-hall .atlas-ocean { stroke: rgba(138, 111, 70, 0.14); }
.gath-hall .atlas-shore {
  fill: #f1e7d2;
  stroke: #d3c39c;
  stroke-width: 1;
  cursor: pointer;
  transition: fill 0.35s ease, stroke 0.35s ease, filter 0.35s ease;
  outline: none;
}
.gath-hall .atlas-shore:hover,
.gath-hall .atlas-shore:focus-visible {
  fill: #ecdcba;
  stroke: #b39d72;
  filter: drop-shadow(0 3px 8px rgba(122, 103, 70, 0.28));
}
.gath-hall .atlas-shore[data-on="true"] {
  fill: #f6e4b8;
  stroke: #a16207;
  stroke-width: 1.6;
  filter: drop-shadow(0 4px 12px rgba(161, 98, 7, 0.35));
}
.dark .gath-hall .atlas-ocean { stroke: rgba(168, 203, 255, 0.12); }
.dark .gath-hall .atlas-shore {
  fill: #2c3f6b;
  stroke: rgba(168, 203, 255, 0.32);
}
.dark .gath-hall .atlas-shore:hover,
.dark .gath-hall .atlas-shore:focus-visible {
  fill: #35508a;
  stroke: rgba(168, 203, 255, 0.6);
  filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.45));
}
.dark .gath-hall .atlas-shore[data-on="true"] {
  fill: #3f5c9e;
  stroke: #cfe0f2;
  stroke-width: 1.6;
}
.gath-hall .atlas-badge-fill { fill: #ffffff; stroke: #d3c39c; }
.dark .gath-hall .atlas-badge-fill { fill: #243459; stroke: rgba(168, 203, 255, 0.4); }
.gath-hall .atlas-badge-text { fill: #5c5344; }
.dark .gath-hall .atlas-badge-text { fill: #d7e2f0; }
`;

export default function RegionAtlas({
  onPosted,
  onClose,
}: {
  onPosted: (post: GatheringPost) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [selected, setSelected] = useState<RegionId | null>(null);
  const [regionPosts, setRegionPosts] = useState<GatheringPost[] | null>(null);
  const [regionLoading, setRegionLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  /* the ledger's first reading — how many intentions each shore wears */
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await netFetch<{ regions: Array<{ id: string; count: number }> }>(
          "/api/gathering/regions"
        );
        if (!alive) return;
        const map: Record<string, number> = {};
        for (const r of data.regions) map[r.id] = r.count;
        setCounts(map);
      } catch {
        if (alive) setCounts({});
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* a chosen shore is read on its own breath */
  useEffect(() => {
    if (!selected) {
      setRegionPosts(null);
      return;
    }
    let alive = true;
    setRegionLoading(true);
    setRegionPosts(null);
    void (async () => {
      try {
        const data = await netFetch<{ posts: GatheringPost[] }>(
          `/api/gathering?kind=intention&region=${selected}&take=8`
        );
        if (alive) setRegionPosts(data.posts);
      } catch {
        if (alive) setRegionPosts([]);
      } finally {
        if (alive) setRegionLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected]);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(id);
  }, [note]);

  const speak = useCallback(async () => {
    if (!selected || title.trim().length < 2 || body.trim().length < 2 || sending) return;
    setSending(true);
    setError(null);
    try {
      const data = await netFetch<{ post: GatheringPost }>("/api/gathering", {
        method: "POST",
        body: { kind: "intention", title: title.trim(), body: body.trim(), region: selected },
      });
      setRegionPosts((prev) => (prev ? [data.post, ...prev] : [data.post]));
      setCounts((prev) => ({
        ...(prev ?? {}),
        [selected]: (prev?.[selected] ?? 0) + 1,
      }));
      setTitle("");
      setBody("");
      setNote(t("The intention now stands for its shore."));
      onPosted(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The intention could not be placed."));
    } finally {
      setSending(false);
    }
  }, [selected, title, body, sending, onPosted, t]);

  const countOf = (id: RegionId) => counts?.[id] ?? null;

  const choose = useCallback((id: RegionId) => {
    setSelected(id);
    setTitle("");
    setBody("");
    setError(null);
  }, []);

  return (
    <div className="flex h-full flex-col px-3 pb-6 pt-4 sm:px-6 sm:pt-5">
      <style>{ATLAS_STYLE}</style>
      <div className="mx-auto w-full max-w-[1100px]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Keep shaping")}
          className="focus-glow flex items-center gap-2 rounded-full border border-[#e4d9bd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#7c715f] transition-colors duration-300 hover:border-[#d3c39c] hover:text-[#3d3428]"
        >
          ← {t("The Gathering")}
        </button>
      </div>

      <div className="gp-scroll mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 overflow-y-auto pb-8 pt-4 lg:flex-row lg:gap-5">
        {/* ---------------- the map ---------------- */}
        <div className="gp-card shrink-0 p-4 sm:p-5 lg:flex-1" data-testid="gathering-atlas-map">
          <div className="flex items-center justify-between gap-3">
            <div>
              <RoomLabel>{t("The region atlas")}</RoomLabel>
              <p className="mt-1 font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428]">
                {t("Choose a shore, speak an intention")}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
              style={{
                background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
              }}
            >
              <MapPin className="size-4 text-[#a16207]" />
            </span>
          </div>

          <svg
            viewBox="0 0 720 340"
            role="group"
            aria-label={t("The world's shores")}
            className="mt-3 w-full"
          >
            {/* the quiet ocean — a graticule of meridians and parallels */}
            <g aria-hidden="true" className="atlas-ocean" fill="none" strokeWidth="1">
              <path d="M0 85 C160 72 480 72 720 85" />
              <path d="M0 170 C180 158 500 158 720 170" />
              <path d="M0 255 C180 244 500 244 720 255" />
              <path d="M144 0 C132 110 132 230 144 340" />
              <path d="M360 0 C352 110 352 230 360 340" />
              <path d="M576 0 C568 110 568 230 576 340" />
            </g>

            {REGION_IDS.map((id) => {
              const label = REGION_LABELS[id];
              const n = countOf(id);
              const badge = REGION_BADGES[id];
              return (
                <g
                  key={id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label} — ${
                    n === null
                      ? t("…")
                      : n === 0
                        ? t("no intentions yet")
                        : `${n} ${t("intentions")}`
                  }`}
                  aria-pressed={selected === id}
                  data-testid={`atlas-region-${id}`}
                  onClick={() => choose(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      choose(id);
                    }
                  }}
                >
                  {REGION_SHAPES[id].map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      className="atlas-shore"
                      data-on={selected === id ? "true" : "false"}
                    />
                  ))}
                  {n !== null && n > 0 && (
                    <g aria-hidden="true" className="pointer-events-none">
                      <circle cx={badge.x} cy={badge.y} r="10" className="atlas-badge-fill" strokeWidth="1" />
                      <text
                        x={badge.x}
                        y={badge.y + 3.5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        className="atlas-badge-text"
                      >
                        {n > 99 ? "99+" : n}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* the shores also stand as words — the map's own legend,
              readable by every hand */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REGION_IDS.map((id) => {
              const n = countOf(id);
              const on = selected === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  aria-pressed={on}
                  data-testid={`atlas-chip-${id}`}
                  className={cn(
                    "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                    on
                      ? "border-[#cbb98d] bg-white text-[#5c5344]"
                      : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                  )}
                >
                  {t(REGION_LABELS[id])}
                  {n !== null && n > 0 && (
                    <span className="ml-1.5 tabular-nums text-[#a16207]">{n}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- the chosen shore ---------------- */}
        <div className="flex min-h-0 flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-h-0 flex-col gap-4"
              >
                {/* the shore's own head */}
                <div className="gp-card p-4 sm:p-5" data-testid="gathering-atlas-region">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-white/90"
                      style={{
                        background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px -2px rgba(122,103,70,0.3)",
                      }}
                    >
                      <Flame className="size-4 text-[#b45309]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-[family-name:var(--font-cinzel)] text-[14.5px] font-semibold text-[#3d3428]">
                        {t(REGION_LABELS[selected])}
                      </p>
                      <p className="text-[10.5px] text-[#a2947c]">
                        {regionLoading
                          ? t("Listening…")
                          : `${regionPosts?.length ?? 0} ${t("intentions hanging here")}`}
                      </p>
                    </div>
                  </div>

                  {/* the vow line */}
                  <div className="mt-3.5">
                    <RoomLabel>{t("Speak an intention for this shore")}</RoomLabel>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={120}
                      placeholder={t("Give the intention its name…")}
                      aria-label={t("Give the intention its name…")}
                      data-testid="atlas-intention-title"
                      className={cn(GP_INPUT, "mt-2")}
                    />
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={4000}
                      rows={3}
                      placeholder={t("Speak the vow itself — what this land may become…")}
                      aria-label={t("Speak the vow itself")}
                      data-testid="atlas-intention-body"
                      className={cn(GP_INPUT, "gp-scroll mt-2 resize-none")}
                    />
                    <div className="mt-2.5 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => void speak()}
                        disabled={title.trim().length < 2 || body.trim().length < 2 || sending}
                        aria-label={t("Speak it to the shore")}
                        title={t("Speak it to the shore")}
                        data-testid="atlas-intention-send"
                        className="focus-glow gp-pearl flex size-10 shrink-0 items-center justify-center rounded-full border border-white/90 text-[#8a6f46] transition-all duration-300 hover:brightness-[1.03] disabled:opacity-45"
                        style={{
                          background: "linear-gradient(150deg,#fffdf8 0%,#f3ead6 100%)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 18px -8px rgba(122,103,70,0.45)",
                        }}
                      >
                        {sending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Send className="size-4" aria-hidden="true" />
                        )}
                      </button>
                      {error && (
                        <p className="text-[11.5px] font-medium text-[#b45309]" role="alert">
                          {error}
                        </p>
                      )}
                      {note && !error && (
                        <p className="text-[11.5px] font-medium text-[#5f7a52]">{note}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* the shore's own intentions */}
                <div className="gp-card min-h-0 p-4 sm:p-5">
                  <RoomLabel>{t("The shore's intentions")}</RoomLabel>
                  <div className="gp-scroll mt-2.5 flex max-h-[340px] flex-col gap-2.5 overflow-y-auto pr-0.5 lg:max-h-[300px]">
                    {regionLoading ? (
                      <p className="flex items-center gap-2 py-6 text-[12.5px] italic text-[#a2947c]">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        {t("Listening…")}
                      </p>
                    ) : (regionPosts?.length ?? 0) === 0 ? (
                      <p className="py-6 text-center text-[12.5px] italic leading-[1.8] text-[#8a7c64]">
                        {t(
                          "No intention stands here yet — the first one waits for your voice."
                        )}
                      </p>
                    ) : (
                      regionPosts?.map((p) => (
                        <div
                          key={p.id}
                          data-testid="atlas-intention-row"
                          className="rounded-[16px] border border-[#eee5d0] bg-white/80 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <MakerMark name={p.author.name} size={22} />
                            <p className="min-w-0 truncate text-[11.5px] font-semibold text-[#5c5344]">
                              {p.author.name}
                            </p>
                            <span className="ml-auto shrink-0 text-[9.5px] text-[#a2947c]">
                              {relativeTime(p.createdAt, t)}
                            </span>
                          </div>
                          <p className="mt-1.5 font-[family-name:var(--font-literata)] text-[12.5px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
                            {p.title}
                          </p>
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[11.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                            {p.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="atlas-hint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="gp-card p-5"
                data-testid="gathering-atlas-hint"
              >
                <RoomLabel>{t("The atlas waits")}</RoomLabel>
                <div className="mt-2 flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-[#a16207]" aria-hidden="true" />
                  <p className="font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.85] text-[#8a7c64]">
                    {t(
                      "Touch a shore of the earth — name the region your intention stands for, speak the vow, and it will hang here in the hall wearing its shore."
                    )}
                  </p>
                </div>
                <p className="mono-label mt-4 text-[8.5px] uppercase tracking-[0.18em] text-[#a2947c]">
                  {t("the world's living counts")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {REGION_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => choose(id)}
                      data-testid={`atlas-count-${id}`}
                      className="focus-glow flex items-center justify-between gap-2 rounded-[14px] border border-[#eee5d0] bg-white px-3 py-2.5 text-left transition-colors duration-300 hover:border-[#d3c39c]"
                    >
                      <span className="min-w-0 truncate text-[11.5px] font-semibold text-[#5c5344]">
                        {t(REGION_LABELS[id])}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#a16207]">
                        {counts === null ? "…" : (counts[id] ?? 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
