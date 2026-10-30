"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Link2,
  Maximize2,
  Search,
  ShieldQuestion,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  IDM_ROLE_LABELS,
  idmArchiveRecords,
  idmArchiveSymbol,
  idmArchiveImage,
  idmArchiveTotal,
  idmCategories,
  idmSuppliedCount,
  readCodexLast,
  resolveIdmRelated,
  writeCodexLast,
  type IdmArchiveRecord,
  type IdmRole,
} from "@/lib/data/idm-archive";
import type { RegisterKind } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE INTERDIMENSIONAL ARCHIVE BROWSER — one active card, never a    */
/*  feed. A number selector rides the very top: a dropdown roll of     */
/*  every profile, the roll coloured red at the profile the visitor's  */
/*  own device last showed (kept in localStorage, restored on return). */
/*  Previous / Next turn the pages from the top — the next profile     */
/*  always begins at its beginning, not at yesterday's scroll.         */
/* ------------------------------------------------------------------ */

const ROLES: IdmRole[] = ["subject", "locus", "geometry", "encounter"];

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-3 py-2.5">
      <p className="mono-label text-[9px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-medium leading-snug text-foreground/90">
        {value}
      </p>
    </div>
  );
}

function RoleImage({
  record,
  role,
  onOpen,
}: {
  record: IdmArchiveRecord;
  role: IdmRole;
  onOpen: () => void;
}) {
  const t = useT();
  const src = idmArchiveImage(record.id, role);
  if (!src) {
    return (
      <div
        className="flex aspect-[3/2] w-full items-center justify-center rounded-xl border hairline bg-[var(--glass-bg-soft)]"
        data-testid={`idm-${role}-empty`}
      >
        <p className="mono-label text-[10px] text-muted-foreground">
          {t("No {role} imagery was supplied", { role: IDM_ROLE_LABELS[role] })}
        </p>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("Open the {role} image fullscreen", { role: IDM_ROLE_LABELS[role] })}
      className="focus-glow group relative block w-full overflow-hidden rounded-xl border hairline bg-black/20"
      data-testid={`idm-${role}-figure`}
    >
      {/* stable frame — the native ratio is kept with contain, never stretched */}
      <img
        src={src}
        alt={`${record.name} — ${IDM_ROLE_LABELS[role]}`}
        loading="lazy"
        className="mx-auto aspect-[3/2] w-full object-contain"
      />
      <span className="mono-label absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full border hairline bg-background/80 px-2 py-1 text-[9.5px] text-foreground/90 backdrop-blur-sm">
        <Maximize2 className="size-2.5" aria-hidden="true" />
        {IDM_ROLE_LABELS[role]}
      </span>
    </button>
  );
}

/* the fullscreen viewer — the exact current image, escape to leave */
function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    /* hold the focus inside the viewer while it stands */
    boxRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      tabIndex={-1}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 outline-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="idm-lightbox"
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: zoom > 1 ? "grab" : "zoom-in",
        }}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.min(4, Math.max(1, z - Math.sign(e.deltaY) * 0.35)));
          if (zoom <= 1.01) setPan({ x: 0, y: 0 });
        }}
        onDoubleClick={() => {
          setZoom((z) => (z > 1 ? 1 : 2));
          setPan({ x: 0, y: 0 });
        }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="focus-glow absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border hairline bg-background/80 text-foreground transition-colors hover:border-[var(--hairline-hover)]"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      {zoom > 1 && (
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="mono-label absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border hairline bg-background/80 px-3 py-1.5 text-[10px] text-foreground"
        >
          {Math.round(zoom * 100)}% — reset
        </button>
      )}
    </div>
  );
}

export function IdmArchiveBrowser({
  onExit,
  onSwitch,
}: {
  onExit: () => void;
  onSwitch: (kind: RegisterKind) => void;
}) {
  const t = useT();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IdmArchiveRecord["category"] | null>(null);
  /* THE DEVICE'S OWN MEMORY — the archive opens on the exact profile
     it last showed (kept on this device); the roll marks it red. The
     read is a lazy initializer — localStorage is only touched on the
     client, and the first paint already carries the right card. */
  const [currentId, setCurrentId] = useState<string | null>(() => {
    const last = readCodexLast();
    return last &&
      last.kind === "archive" &&
      idmArchiveRecords.some((r) => r.id === last.id)
      ? last.id
      : null;
  });
  const [role, setRole] = useState<IdmRole>("subject");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const cardTopRef = useRef<HTMLDivElement>(null);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return idmArchiveRecords.filter((r) => {
      if (category && r.category !== category) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.classification.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  /* THE SHOWN CARD — the chosen one when it stands in the roll, else
     the roll's first card: a filter change never leaves a card
     floating outside its own filter (derived, not chased). */
  const effectiveId =
    currentId && filtered.some((r) => r.id === currentId)
      ? currentId
      : filtered[0]?.id ?? null;

  const index = effectiveId
    ? filtered.findIndex((r) => r.id === effectiveId)
    : -1;
  const current = effectiveId
    ? idmArchiveRecords.find((r) => r.id === effectiveId) ?? null
    : null;

  /* every shown card is recorded on the device — the red thread of
     the roll (an external-system write, not a render chase) */
  useEffect(() => {
    if (effectiveId) writeCodexLast("archive", effectiveId);
  }, [effectiveId]);

  const show = useCallback(
    (id: string, opts?: { fromTop?: boolean }) => {
      setCurrentId(id);
      setRole("subject");
      if (opts?.fromTop !== false) {
        /* THE PAGE TURNS FROM THE TOP — the next profile is read from
           its beginning, never from wherever the last one ended */
        requestAnimationFrame(() => {
          cardTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
        });
      }
    },
    []
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (filtered.length === 0) return;
      const at = index >= 0 ? index : dir === 1 ? -1 : 0;
      const next = filtered[(at + dir + filtered.length) % filtered.length];
      if (next) show(next.id);
    },
    [filtered, index, show]
  );

  /* keyboard page-turns — arrows walk the archive when not typing */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (lightbox) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, lightbox]);

  /* the neighbour's subject image preloads in the idle breath — the
     page-turn never waits on its picture */
  useEffect(() => {
    const idle =
      "requestIdleCallback" in window
        ? (cb: () => void) => (window as unknown as { requestIdleCallback: (c: () => void) => number }).requestIdleCallback(cb)
        : (cb: () => void) => window.setTimeout(cb, 220);
    const cancel =
      "cancelIdleCallback" in window
        ? (h: number) => (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(h)
        : (h: number) => window.clearTimeout(h);
    const handle = idle(() => {
      for (const d of [1, -1] as const) {
        const at = index + d;
        if (at < 0 || at >= filtered.length) continue;
        const src = idmArchiveImage(filtered[at].id, "subject");
        if (src) {
          const img = new Image();
          img.src = src; // the neighbour's picture warms the cache
        }
      }
    });
    return () => cancel(handle);
  }, [index, filtered]);

  const related = current ? resolveIdmRelated(current.relatedIds) : [];
  const missingRelated = current
    ? current.relatedIds.filter((id) => !related.some((r) => r.id === id))
    : [];
  const symbol = current ? idmArchiveSymbol(current.id) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t("Interdimensional Archive")}
      className="mx-auto w-full max-w-[860px] px-1 pb-10 pt-8 sm:pt-10"
      data-testid="idm-archive-browser"
    >
      {/* header */}
      <div className="text-center">
        <span className="mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground">
          <Fingerprint className="size-3" aria-hidden="true" />
          {t("Codex Exobiologica · sibling collection")}
        </span>
        <h1 className="hero-text mt-3 text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]">
          {t("Interdimensional Archive")}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[560px] text-[14.5px] leading-relaxed text-muted-foreground">
          {t(
            "Beings, portals, realms, flora and fauna from beyond the veil — one living card at a time, every role image bound to its own record."
          )}
        </p>
      </div>

      {/* counters */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {idmArchiveTotal}
          </p>
          <p className="mono-label mt-1 text-[9.5px] text-muted-foreground">
            {t("profiles · exact")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {idmCategories.length}
          </p>
          <p className="mono-label mt-1 text-[9.5px] text-muted-foreground">
            {t("categories catalogued")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p
            className={cn(
              "font-mono text-[18px] font-semibold tabular-nums sm:text-[22px]",
              current ? "text-[var(--ok)]" : "text-foreground"
            )}
          >
            {index >= 0 ? index + 1 : "—"}
            <span className="text-[14px] text-muted-foreground">/{filtered.length}</span>
          </p>
          <p className="mono-label mt-1 text-[9.5px] text-muted-foreground">
            {t("card in view")}
          </p>
        </div>
      </div>

      {/* THE NUMBER SELECTOR — the roll of every profile at the very top */}
      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[230px] flex-1">
            <label className="sr-only" htmlFor="idm-roll">
              {t("Choose a profile by number")}
            </label>
            <select
              id="idm-roll"
              value={effectiveId ?? ""}
              onChange={(e) => e.target.value && show(e.target.value)}
              data-testid="idm-roll"
              className="focus-glow h-10 w-full appearance-none rounded-xl border hairline bg-[var(--glass-bg-soft)] pl-9 pr-9 text-[13.5px] text-foreground"
            >
              <option value="" disabled>
                {t("Profile № — pick a card from the roll")}
              </option>
              {filtered.map((r, i) => {
                /* THE RED THREAD — the profile this device last showed
                   rides the roll in red, so the eye finds its place */
                const isLast = r.id === effectiveId;
                return (
                  <option key={r.id} value={r.id} className={isLast ? "text-red-500" : ""}>
                    {`${String(i + 1).padStart(4, "0")} · ${r.id} — ${r.name}${isLast ? " ●" : ""}`}
                  </option>
                );
              })}
            </select>
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground"
              aria-hidden="true"
            >
              №
            </span>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 rotate-90 text-muted-foreground" aria-hidden="true" />
          </div>

          {/* prev / next — the page turns from the top */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={filtered.length === 0}
              aria-label={t("Previous profile")}
              data-testid="idm-prev"
              className="focus-glow flex h-10 items-center gap-1 rounded-xl border hairline px-3 text-[13px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              {t("Prev")}
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={filtered.length === 0}
              aria-label={t("Next profile — shown from the top")}
              data-testid="idm-next"
              className="focus-glow flex h-10 items-center gap-1 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-3.5 text-[13px] font-semibold text-foreground transition-all duration-300 hover:glow-sm disabled:opacity-40"
            >
              {t("Next")}
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search by name, ID or classification (IDM-0001…)")}
            aria-label={t("Search the Interdimensional Archive")}
            className="focus-glow h-10 w-full rounded-xl border hairline bg-transparent pl-10 pr-9 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("Clear archive search")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* category filters with counts */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={cn(
              "focus-glow mono-label rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300",
              category === null
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {t("All profiles ({n})", { n: idmArchiveTotal })}
          </button>
          {idmCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(category === c.id ? null : c.id)}
              aria-pressed={category === c.id}
              className={cn(
                "focus-glow mono-label rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300",
                category === c.id
                  ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
            >
              {t(c.label)} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------- THE CARD ------------------------- */}
      {current ? (
        <article
          ref={cardTopRef}
          key={current.id}
          className="mt-6 scroll-mt-4 rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4 sm:p-6"
          data-testid="idm-card"
        >
          {/* identity row */}
          <div className="flex items-start gap-3">
            {symbol && (
              <span
                className="hidden size-12 shrink-0 items-center justify-center rounded-xl border hairline bg-background/40 sm:flex"
                aria-hidden="true"
              >
                <img src={symbol} alt="" className="size-9" loading="lazy" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-semibold leading-snug text-foreground sm:text-[20px]">
                {current.name}
              </h2>
              <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground/75">
                {current.id} · {current.categoryLabel} · №{String(index + 1).padStart(4, "0")}
              </p>
              <p className="mt-1 text-[13.5px] italic text-muted-foreground">
                {current.classification}
              </p>
            </div>
          </div>

          {/* role tabs + the role image */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label={t("Image roles")}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={role === r}
                  onClick={() => setRole(r)}
                  data-testid={`idm-tab-${r}`}
                  className={cn(
                    "focus-glow mono-label rounded-full border px-3 py-1.5 text-[10.5px] transition-all duration-300",
                    role === r
                      ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground"
                      : "hairline text-muted-foreground hover:text-foreground"
                  )}
                >
                  {IDM_ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <RoleImage
                record={current}
                role={role}
                onOpen={() => {
                  const src = idmArchiveImage(current.id, role);
                  if (src) setLightbox({ src, alt: `${current.name} — ${IDM_ROLE_LABELS[role]}` });
                }}
              />
            </div>
          </div>

          {/* at a glance */}
          <section className="mt-5">
            <h3 className="mono-label text-[10.5px] text-[var(--cy)]">{t("At a glance")}</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <FactTile label={t("Dimensionality")} value={current.dimensionality} />
              <FactTile label={t("Resonance substrate")} value={current.resonanceSubstrate} />
              <FactTile label={t("Phenomenological locus")} value={current.phenomenologicalLocus} />
              <FactTile label={t("Communication mode")} value={current.communicationMode} />
              <FactTile label={t("Ontological stability")} value={current.ontologicalStability} />
              <FactTile label={t("Archive order")} value={`№ ${current.archiveOrder}`} />
            </div>
          </section>

          {/* the four readings */}
          <section className="mt-5">
            <ProfileSection index="01" label={t("Summary")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/90">{current.summary}</p>
            </ProfileSection>
            <ProfileSection index="02" label={t("Phenomenology & encounters")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">
                {current.phenomenologyAndEncounters}
              </p>
            </ProfileSection>
            <ProfileSection index="03" label={t("Hyper-geometric anatomy")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">
                {current.hyperGeometricAnatomy}
              </p>
            </ProfileSection>
            <ProfileSection index="04" label={t("Cognitive impact & messages")}>
              <p className="text-[14.5px] leading-relaxed text-foreground/85">
                {current.cognitiveImpactAndMessages}
              </p>
            </ProfileSection>
          </section>

          {/* pull quote */}
          <blockquote
            className="mt-5 border-l-2 pl-4"
            style={{
              borderColor: current.accentColor ?? "color-mix(in srgb, var(--cy) 45%, transparent)",
            }}
          >
            <p className="font-serif text-[16px] leading-relaxed text-foreground/90">
              “{current.pullQuote}”
            </p>
            <footer className="mono-label mt-2 text-[10px] text-muted-foreground">
              {current.quoteSource}
            </footer>
          </blockquote>

          {/* related records — resolved by exact id, missing stay named */}
          {(related.length > 0 || missingRelated.length > 0) && (
            <section className="mt-5">
              <h3 className="mono-label flex items-center gap-1.5 text-[10.5px] text-[var(--cy)]">
                <Link2 className="size-3" aria-hidden="true" />
                {t("Related records")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {related.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => show(r.id)}
                    data-testid={`idm-related-${r.id}`}
                    className="focus-glow rounded-full border hairline px-2.5 py-1 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                  >
                    {r.id} · {r.name}
                  </button>
                ))}
                {missingRelated.map((id) => (
                  <span
                    key={id}
                    className="mono-label cursor-not-allowed rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground/50"
                    title={t("This record's pack has not been imported yet")}
                  >
                    {id} · {t("not yet loaded")}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* provenance */}
          <section className="mt-5 rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_5%,transparent)] p-3.5">
            <h3 className="mono-label flex items-center gap-1.5 text-[10px] text-[var(--gd)]">
              <ShieldQuestion className="size-3" aria-hidden="true" />
              {t("Provenance")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mono-label rounded-full border hairline px-2 py-0.5 text-[9.5px] text-muted-foreground">
                {current.sourceKind}
              </span>
              <span className="mono-label rounded-full border hairline px-2 py-0.5 text-[9.5px] text-muted-foreground">
                schema {current.schemaVersion}
              </span>
              <BadgeCheck
                className="size-3.5 text-[var(--ok)]"
                aria-hidden="true"
              />
              <span className="mono-label text-[9.5px] text-muted-foreground">
                {t("{n} of the archive's records keep the supplied catalog voice", {
                  n: idmSuppliedCount,
                })}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {current.provenance}
            </p>
            <p className="mt-2 text-[12.5px] italic leading-relaxed text-muted-foreground/85">
              {t(
                "Descriptions of dimensions, portals and perceived encounters are not measurements or verified observations — the imagery is concept art."
              )}
            </p>
          </section>

          {/* card footer page-turns */}
          <div className="mt-6 flex items-center justify-between border-t hairline pt-4">
            <button
              type="button"
              onClick={() => step(-1)}
              className="focus-glow flex items-center gap-1.5 rounded-full border hairline px-3.5 py-2 text-[13px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              {t("Previous profile")}
            </button>
            <span className="mono-label hidden text-[9.5px] text-muted-foreground/70 sm:block">
              {t("← → walk the archive")}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              className="focus-glow flex items-center gap-1.5 rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
            >
              {t("Next profile")}
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </article>
      ) : (
        <div className="mt-6 rounded-2xl border hairline bg-[var(--glass-bg-soft)] px-6 py-10 text-center">
          <p className="text-[15px] text-foreground/85">
            {filtered.length === 0
              ? t("No profiles match this filter.")
              : t("Pick a card from the roll above — or press Next to begin.")}
          </p>
        </div>
      )}

      {/* switch archive + back */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 border-t hairline pt-6">
        <button
          type="button"
          onClick={onExit}
          className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <ChevronLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          {t("Back to the wall")}
        </button>
        <button
          type="button"
          onClick={() => onSwitch("civilization")}
          className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <Fingerprint className="size-3.5" aria-hidden="true" />
          {t("civilization register ({n})", { n: 870 })}
        </button>
        <button
          type="button"
          onClick={() => onSwitch("interdim")}
          className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <Fingerprint className="size-3.5" aria-hidden="true" />
          {t("interdimensional register ({n})", { n: 202 })}
        </button>
      </div>

      {/* the fullscreen viewer */}
      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </motion.section>
  );
}

/* a numbered reading — shared shape with the dossier pages */
function ProfileSection({
  index,
  label,
  children,
}: {
  index: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-2">
      <div className="flex items-baseline gap-2">
        <span className="mono-label text-[9.5px] text-muted-foreground/70">{index}</span>
        <h4 className="mono-label text-[10.5px] text-[var(--cy)]">{label}</h4>
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
