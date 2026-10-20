"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Library, Loader2, Plus, Search } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type GatheringPost,
  type LibraryCard,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  EmptyRoom,
  RoomLabel,
  netFetch,
  relativeTime,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE COLLECTIVE LIBRARY — the community's growing archive.          */
/*                                                                     */
/*  Every item keeps its maker's name and where it grew from. A        */
/*  contribution enters by a human hand only — from an offering, a     */
/*  shared workshop, or the visitor's own words.                       */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  "reflection",
  "artwork",
  "music",
  "book",
  "research",
  "invention",
  "project",
  "discovery",
  "question",
];

const CATEGORY_LABEL: Record<string, string> = {
  reflection: "Reflections",
  artwork: "Artwork",
  music: "Music",
  book: "Books & Stories",
  research: "Research",
  invention: "Inventions",
  project: "Shared works",
  discovery: "Discoveries",
  question: "Questions",
};

export default function LibrarySection({
  active,
  fromPost,
  onSeedConsumed,
}: {
  active: boolean;
  fromPost: GatheringPost | null;
  onSeedConsumed: () => void;
}) {
  const t = useT();
  const [items, setItems] = useState<LibraryCard[] | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  const [contributing, setContributing] = useState(false);

  /* the contribution sheet */
  const [cTitle, setCTitle] = useState("");
  const [cSummary, setCSummary] = useState("");
  const [cCategory, setCCategory] = useState("reflection");
  const [cTags, setCTags] = useState("");
  const [cPostId, setCPostId] = useState<string | null>(null);
  const [cPostLabel, setCPostLabel] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<GatheringPost[]>([]);
  const [cBusy, setCBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    setItems(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q.trim()) params.set("q", q.trim());
      const data = await netFetch<{ items: LibraryCard[] }>(
        `/api/network/library?${params.toString()}`
      );
      setItems(data.items);
    } catch {
      setError(true);
    }
  }, [category, q]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  /* a post carried in from the stream opens the contribution sheet */
  useEffect(() => {
    if (fromPost && active) {
      setContributing(true);
      setCPostId(fromPost.id);
      setCPostLabel(fromPost.title);
      setCTitle(fromPost.title);
      setCSummary(fromPost.body.slice(0, 400));
      setCCategory(fromPost.kind in CATEGORY_LABEL ? fromPost.kind : "reflection");
      onSeedConsumed();
    }
  }, [fromPost, active, onSeedConsumed]);

  const openContributor = useCallback(async () => {
    setContributing(true);
    try {
      const data = await netFetch<{ posts: GatheringPost[] }>("/api/gathering?mine=1&take=30");
      setMyPosts(data.posts);
    } catch {
      setMyPosts([]);
    }
  }, []);

  const contribute = useCallback(async () => {
    if (cTitle.trim().length < 2 || cSummary.trim().length < 2 || cBusy) return;
    setCBusy(true);
    try {
      await netFetch("/api/network/library", {
        method: "POST",
        body: {
          title: cTitle.trim(),
          summary: cSummary.trim(),
          category: cCategory,
          tags: cTags.trim() || undefined,
          postId: cPostId ?? undefined,
        },
      });
      setContributing(false);
      setCTitle("");
      setCSummary("");
      setCTags("");
      setCPostId(null);
      setCPostLabel(null);
      setNote(t("The contribution now rests in the Library."));
      void load();
    } catch {
      /* the sheet stays open */
    } finally {
      setCBusy(false);
    }
  }, [cTitle, cSummary, cCategory, cTags, cPostId, cBusy, load, t]);

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[1000px]">
        <div className="flex items-center justify-between gap-3">
          <RoomLabel>{t("The Collective Library")}</RoomLabel>
          <button type="button" onClick={() => void openContributor()} className={GP_HAND} data-testid="library-contribute">
            <Plus className="size-4" aria-hidden="true" />
            {t("Contribute")}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#b3a68d]" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={60}
              placeholder={t("Search the archive — titles, makers, threads of meaning…")}
              aria-label={t("Search the archive — titles, makers, threads of meaning…")}
              data-testid="library-search"
              className={cn(GP_INPUT, "pl-9")}
            />
          </div>
        </div>

        <div className="gp-scroll mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={cn(
              "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
              category === null
                ? "border-[#cbb98d] bg-white text-[#5c5344]"
                : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
            )}
          >
            {t("All shelves")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              aria-pressed={category === c}
              className={cn(
                "focus-glow shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                category === c
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              {t(CATEGORY_LABEL[c])}
            </button>
          ))}
        </div>

        {items === null && !error && (
          <p className="flex items-center justify-center gap-2 py-24 text-[13.5px] text-[#a2947c]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("The library is gathering your stars…")}
          </p>
        )}
        {error && (
          <p className="py-20 text-center text-[13.5px] text-[#b45309]">
            {t("The library could not be read.")}
          </p>
        )}
        {items !== null && items.length === 0 && !error && (
          <EmptyRoom
            icon={Library}
            line={t("The shelves rest quiet — a creation carried here becomes the community's own.")}
          />
        )}
        {items !== null && items.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="gp-card flex flex-col rounded-[22px] p-4" data-testid={`library-item-${item.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
                    {t(CATEGORY_LABEL[item.category] ?? item.category)}
                  </span>
                  {item.project && (
                    <span className="mono-label rounded-full border border-[#0d9488]/40 bg-[#0d9488]/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#0d9488]">
                      {t("a shared work")}
                    </span>
                  )}
                </div>
                <h3 className="mt-2.5 font-[family-name:var(--font-literata)] text-[14.5px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
                  {item.title}
                </h3>
                <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-[1.65] text-[#7c715f] [overflow-wrap:anywhere]">
                  {item.summary}
                </p>
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-[#e8dfc9] bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-[#8a6f46]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-auto pt-3 text-[11px] text-[#a2947c]">
                  {item.authorName} · {relativeTime(item.createdAt, t)}
                </p>
              </div>
            ))}
          </div>
        )}

        {note && (
          <p className="mt-4 text-center text-[12.5px] italic text-[#8a6f46]" role="status">
            {note}
          </p>
        )}
      </div>

      {/* ---------- the contribution sheet ---------- */}
      <AnimatePresence>
        {contributing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-label={t("Contribute")}
          >
            <button
              type="button"
              aria-label={t("Keep shaping")}
              onClick={() => setContributing(false)}
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
                <RoomLabel>{t("Lay a work in the Library")}</RoomLabel>
                <button
                  type="button"
                  onClick={() => setContributing(false)}
                  aria-label={t("Keep shaping")}
                  className="focus-glow rounded-full border border-[#e4d9bd] bg-white/70 p-1.5 text-[#7c715f] transition-colors duration-300 hover:text-[#3d3428]"
                >
                  <ArrowLeft className="size-3.5 rotate-90" aria-hidden="true" />
                </button>
              </div>
              <div className="gp-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
                <input
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  maxLength={160}
                  placeholder={t("Give the work its name…")}
                  aria-label={t("Give the work its name…")}
                  data-testid="library-title"
                  className={GP_INPUT}
                />
                <textarea
                  value={cSummary}
                  onChange={(e) => setCSummary(e.target.value)}
                  maxLength={1200}
                  rows={4}
                  placeholder={t("A few honest words about it…")}
                  aria-label={t("A few honest words about it…")}
                  className={cn(GP_INPUT, "gp-scroll mt-2.5 resize-none")}
                />
                <input
                  value={cTags}
                  onChange={(e) => setCTags(e.target.value)}
                  maxLength={120}
                  placeholder={t("Threads of meaning… (comma-separated, optional)")}
                  aria-label={t("Threads of meaning… (comma-separated, optional)")}
                  className={cn(GP_INPUT, "mt-2.5")}
                />
                <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                  {t("The shelf")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCCategory(c)}
                      aria-pressed={cCategory === c}
                      className={cn(
                        "focus-glow rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                        cCategory === c
                          ? "border-[#cbb98d] bg-white text-[#5c5344]"
                          : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
                      )}
                    >
                      {t(CATEGORY_LABEL[c])}
                    </button>
                  ))}
                </div>
                {!cPostLabel && myPosts.length > 0 && (
                  <>
                    <p className="mono-label mt-4 text-[9px] uppercase tracking-[0.22em] text-[#a2947c]">
                      {t("Grown from one of your offerings (optional)")}
                    </p>
                    <select
                      value={cPostId ?? ""}
                      onChange={(e) => setCPostId(e.target.value || null)}
                      aria-label={t("Grown from one of your offerings (optional)")}
                      className="mt-2 w-full rounded-[16px] border border-[#eee5d0] bg-white/80 px-3 py-2.5 text-[12.5px] text-[#5c5344] outline-none focus:border-[#cbb98d]"
                    >
                      <option value="">{t("No origin — it enters as it stands")}</option>
                      {myPosts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {cPostLabel && (
                  <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#8a6f46]">
                    {t("grown from")} “{cPostLabel}”
                    <button
                      type="button"
                      onClick={() => {
                        setCPostId(null);
                        setCPostLabel(null);
                      }}
                      className="focus-glow ml-1 text-[10px] text-[#b45309] underline"
                    >
                      {t("let it rest")}
                    </button>
                  </p>
                )}
                <p className="mt-4 text-[11.5px] italic leading-relaxed text-[#a2947c]">
                  {t("Your name stays with the work. What enters the Library becomes part of what everyone can discover.")}
                </p>
              </div>
              <div className="flex items-center gap-2.5 border-t border-[#eadfca]/70 px-5 py-3.5 sm:px-7">
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => void contribute()}
                  disabled={cTitle.trim().length < 2 || cSummary.trim().length < 2 || cBusy}
                  className={GP_HAND}
                  data-testid="library-submit"
                >
                  {cBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("Lay it in")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
