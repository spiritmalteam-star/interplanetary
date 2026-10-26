"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Dna,
  Globe2,
  Search,
  Sparkles,
  Telescope,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  CODEX EXOBIOLOGICA — the archive of star-kind.                     */
/*                                                                     */
/*  The threshold's museum wing: 3,212 civilizations catalogued from   */
/*  the house's own archival engine, 1,812 plates already opened       */
/*  (each carrying three artworks and its full record), plus the       */
/*  hyperspace shelf — six interdimensional dwellers of the            */
/*  threshold's deeper rooms. Everything is explored within this       */
/*  section: a card touched becomes a plate, the plate zooms to fill   */
/*  the screen, and closing it returns exactly where the walk stood.   */
/*                                                                     */
/*  CALM LAWS: lazy plates, pagination instead of three thousand       */
/*  DOM nodes, transform-and-opacity motion only, no continuous        */
/*  animation anywhere. The archive is data: /codex/*.json built by    */
/*  tools/codex/build_codex.py — new PDF batches rebuild it in place.  */
/* ------------------------------------------------------------------ */

/* ------------------------------- types ------------------------------- */

type CodexRow = {
  i: string;
  n: string;
  s: string;
  h: string;
  e?: string;
  d?: number | null;
  k?: string | null;
  b?: string | null;
  kn?: number | null;
  y?: string | null;
  c?: number;
  x?: number;
};

type CodexEntry = {
  i: string;
  name: string;
  epithet: string;
  fields: Record<string, string>;
  summary: Record<string, unknown>;
  overview: string;
  society: string;
  chronicle: string;
  tech: Record<string, string>;
  metrics: Record<string, string>;
  body: Record<string, string>;
  biota: Record<string, string>;
  vista: Record<string, string>;
  quote: { text: string; source: string };
  art: string[];
};

type IdwEntity = {
  i: string;
  name: string;
  classification: string;
  dimensionality: string;
  resonance: string;
  locus: string;
  communication: string;
  stability: string;
  phenomenology: string;
  anatomy: string;
  cognitive: string;
  quote: { text: string; source: string };
};

type IndexPayload = { manifest: { total: number; entries: number }; rows: CodexRow[] };
type IdwPayload = { note: string; entities: IdwEntity[] };

/* the seal plates' quiet ornaments — the house's own light language,
   one mark per sealed shelf, chosen by the catalogue's own arithmetic */
const SEALS = [
  "/sigils/sigil_05.png",
  "/sigils/sigil_06.png",
  "/sigils/sigil_09.png",
  "/sigils/intricate_02.png",
  "/sigils/intricate_06.png",
  "/sigils/intricate_08.png",
  "/sigils/intricate_10.png",
];

const PAGE = 24;
const RENDER_CAP = 240;

const KARDASHEV = ["I", "II", "III", "IV", "Ω"] as const;

function chunkKey(c: number) {
  return `chunk-${String(c).padStart(3, "0")}.json`;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

/* --------------------------- the component --------------------------- */

export default function CodexExobiologica() {
  const t = useT();

  const [payload, setPayload] = useState<IndexPayload | null>(null);
  const [idw, setIdw] = useState<IdwPayload | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [wing, setWing] = useState<"civ" | "idw">("civ");
  const [query, setQuery] = useState("");
  const [kard, setKard] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [fullOnly, setFullOnly] = useState(false);
  const [sort, setSort] = useState<"index" | "distance" | "kinship">("index");
  const [visible, setVisible] = useState(PAGE);

  /* the zoomed plate */
  const [openId, setOpenId] = useState<string | null>(null);
  const [entry, setEntry] = useState<CodexEntry | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [plateTab, setPlateTab] = useState(0);

  const chunkCache = useRef<Map<string, CodexEntry[]>>(new Map());

  /* ------------------------- the archive loads ------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ix, wingFile] = await Promise.all([
          fetch("/codex/index.json").then((r) => r.json()),
          fetch("/codex/idw.json").then((r) => r.json()),
        ]);
        if (!alive) return;
        setPayload(ix as IndexPayload);
        setIdw(wingFile as IdwPayload);
      } catch {
        if (alive) setLoadError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* --------------------- the catalogue's own filters -------------------- */
  const bioKinds = useMemo(() => {
    if (!payload) return [];
    const counts = new Map<string, number>();
    for (const r of payload.rows) {
      if (r.b) counts.set(r.b, (counts.get(r.b) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k]) => k);
  }, [payload]);

  const filtered = useMemo(() => {
    if (!payload) return [];
    const q = query.trim().toLowerCase();
    let rows = payload.rows.filter((r) => {
      if (fullOnly && r.c === undefined) return false;
      if (kard && r.k !== kard) return false;
      if (bio && r.b !== bio) return false;
      if (!q) return true;
      return (
        r.i.toLowerCase().includes(q) ||
        r.n.toLowerCase().includes(q) ||
        r.s.toLowerCase().includes(q) ||
        r.h.toLowerCase().includes(q) ||
        (r.e ? r.e.toLowerCase().includes(q) : false)
      );
    });
    if (sort === "distance") {
      rows = [...rows].sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    } else if (sort === "kinship") {
      rows = [...rows].sort((a, b) => (b.kn ?? -1) - (a.kn ?? -1));
    }
    return rows;
  }, [payload, query, kard, bio, fullOnly, sort]);

  useEffect(() => {
    setVisible(PAGE);
  }, [query, kard, bio, fullOnly, sort, wing]);

  const shown = filtered.slice(0, Math.min(visible, RENDER_CAP));
  const capped = filtered.length > RENDER_CAP && visible >= RENDER_CAP;

  /* --------------------- the zoomed plate's plumbing -------------------- */
  const openRow = useCallback((row: CodexRow) => {
    if (row.c === undefined) return;
    setOpenId(row.i);
    setEntry(null);
    setPlateTab(0);
    setEntryLoading(true);
    const key = chunkKey(row.c);
    const cached = chunkCache.current.get(key);
    if (cached) {
      setEntry(cached.find((e) => e.i === row.i) ?? null);
      setEntryLoading(false);
      return;
    }
    fetch(`/codex/details/${key}`)
      .then((r) => r.json())
      .then((records: CodexEntry[]) => {
        chunkCache.current.set(key, records);
        setEntry(records.find((e) => e.i === row.i) ?? null);
      })
      .catch(() => setEntry(null))
      .finally(() => setEntryLoading(false));
  }, []);

  const closePlate = useCallback(() => setOpenId(null), []);

  /* step between plates within the current walk's own order */
  const stepPlate = useCallback(
    (dir: 1 | -1) => {
      if (!openId || filtered.length === 0) return;
      const at = filtered.findIndex((r) => r.i === openId);
      if (at === -1) return;
      let next = at + dir;
      while (next >= 0 && next < filtered.length && filtered[next].c === undefined) {
        next += dir;
      }
      if (next < 0 || next >= filtered.length) return;
      openRow(filtered[next]);
    },
    [openId, filtered, openRow]
  );

  useEffect(() => {
    if (!openId) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePlate();
      if (e.key === "ArrowRight") stepPlate(1);
      if (e.key === "ArrowLeft") stepPlate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openId, closePlate, stepPlate]);

  const idwEntity = useMemo(
    () => (openId?.startsWith("IDM-") ? idw?.entities.find((e) => e.i === openId) ?? null : null),
    [openId, idw]
  );

  const openIdw = useCallback((entity: IdwEntity) => {
    setEntry(null);
    setOpenId(entity.i);
    setPlateTab(0);
  }, []);

  /* ============================== render ============================== */

  if (loadError) {
    return (
      <div className="rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-8 text-center">
        <p className="text-[14px] text-[var(--lp-mute)]">
          {t("The archive's shelves could not be reached this time. One breath, then try again.")}
        </p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-10">
        <span className="size-2 rounded-full bg-[var(--lp-violet)]" />
        <p className="mono-label text-[10px] uppercase tracking-[0.3em] text-[var(--lp-faint)]">
          {t("The archive is unrolling…")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ------------------- the wing's two doors ------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setWing("civ")}
          data-testid="codex-wing-civ"
          aria-pressed={wing === "civ"}
          className={cn(
            "focus-glow inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-300",
            wing === "civ"
              ? "border-[color-mix(in_srgb,var(--lp-violet)_72%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_14%,transparent)] text-[var(--lp-violet-bright)]"
              : "border-[var(--lp-edge)] bg-[var(--lp-veil)] text-[var(--lp-mute)] hover:text-[var(--lp-head)]"
          )}
        >
          <Telescope className="size-3.5" aria-hidden="true" />
          {t("Civilisations")}
          <span className="mono-label text-[9px] tracking-[0.14em] opacity-70">
            {fmt(payload.manifest.total)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setWing("idw")}
          data-testid="codex-wing-idw"
          aria-pressed={wing === "idw"}
          className={cn(
            "focus-glow inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-300",
            wing === "idw"
              ? "border-[color-mix(in_srgb,var(--lp-violet)_72%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_14%,transparent)] text-[var(--lp-violet-bright)]"
              : "border-[var(--lp-edge)] bg-[var(--lp-veil)] text-[var(--lp-mute)] hover:text-[var(--lp-head)]"
          )}
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          {t("The hyperspace wing")}
          <span className="mono-label text-[9px] tracking-[0.14em] opacity-70">
            {idw ? idw.entities.length : "…"}
          </span>
        </button>
      </div>

      <p className="mt-3 max-w-[640px] text-[13.5px] leading-[1.8] text-[var(--lp-mute)]">
        {wing === "civ"
          ? t(
              "3,212 civilizations catalogued from the house's archival engine, 1,812 plates already opened — each with its own artworks, metrics, and archive quotation. Touch a plate to zoom in. An archive of wonder: nothing here is a claim."
            )
          : t(
              "The wing of interdimensional, non-baryonic and tryptamine-space dwellers — catalogued by the same archival hand, met at the threshold rather than through a telescope."
            )}
      </p>

      {wing === "civ" ? (
        <>
          {/* ------------------- the reading instruments ------------------- */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* the lens */}
              <label className="focus-glow-within flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[var(--lp-edge)] bg-[var(--lp-veil)] px-4 py-2 sm:max-w-[340px]">
                <Search className="size-3.5 shrink-0 text-[var(--lp-faint)]" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search the catalogue — name, star, homeworld…")}
                  aria-label={t("Search the catalogue")}
                  data-testid="codex-search"
                  className="w-full bg-transparent text-[13px] text-[var(--lp-head)] outline-none placeholder:text-[var(--lp-faint)]"
                />
              </label>
              {/* the ordering hand */}
              <label className="sr-only" htmlFor="codex-sort">
                {t("Order the plates")}
              </label>
              <select
                id="codex-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                data-testid="codex-sort"
                className="focus-glow rounded-full border border-[var(--lp-edge)] bg-[var(--lp-veil)] px-4 py-2 text-[13px] text-[var(--lp-head)] outline-none"
              >
                <option value="index">{t("By catalogue number")}</option>
                <option value="distance">{t("By distance — nearest first")}</option>
                <option value="kinship">{t("By kinship — closest kin first")}</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* the Kardashev chips */}
              <span className="mono-label mr-1 text-[9px] uppercase tracking-[0.22em] text-[var(--lp-faint)]">
                {t("Type")}
              </span>
              <FilterChip active={kard === null} onClick={() => setKard(null)} label={t("All")} />
              {KARDASHEV.map((kk) => (
                <FilterChip
                  key={kk}
                  active={kard === kk}
                  onClick={() => setKard(kard === kk ? null : kk)}
                  label={kk === "Ω" ? "Ω" : `Type ${kk}`}
                />
              ))}
              <span className="mx-2 hidden h-4 w-px bg-[var(--lp-edge)] sm:block" aria-hidden="true" />
              {/* the biochemistry chips */}
              <span className="mono-label mr-1 text-[9px] uppercase tracking-[0.22em] text-[var(--lp-faint)]">
                {t("Living")}
              </span>
              {bioKinds.map((bk) => (
                <FilterChip
                  key={bk}
                  active={bio === bk}
                  onClick={() => setBio(bio === bk ? null : bk)}
                  label={bk}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="mono-label text-[10px] tracking-[0.16em] text-[var(--lp-faint)]" data-testid="codex-count">
                {fmt(filtered.length)} {t("plates answer the lens")} · {t("showing")} {fmt(shown.length)}
              </p>
              <FilterChip
                active={fullOnly}
                onClick={() => setFullOnly(!fullOnly)}
                label={t("Opened plates only")}
              />
            </div>
          </div>

          {/* ------------------- the plates' wall ------------------- */}
          <div
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="codex-grid"
          >
            {shown.map((row) => (
              <CivilisationCard key={row.i} row={row} onOpen={openRow} t={t} />
            ))}
          </div>

          {/* ------------------- revealing more ------------------- */}
          {filtered.length > shown.length && !capped && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE)}
                data-testid="codex-more"
                className="focus-glow rounded-full border border-[color-mix(in_srgb,var(--lp-violet)_42%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_7%,transparent)] px-6 py-2.5 text-[13px] font-medium text-[var(--lp-violet-bright)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--lp-violet)_72%,transparent)] hover:bg-[color-mix(in_srgb,var(--lp-violet)_14%,transparent)]"
              >
                {t("Unroll more plates")}
                <span className="mono-label ml-2 text-[9px] tracking-[0.16em] opacity-70">
                  +{PAGE}
                </span>
              </button>
            </div>
          )}
          {capped && (
            <p className="mono-label mt-6 text-center text-[10px] tracking-[0.2em] text-[var(--lp-faint)]">
              {t("The wall holds its first two hundred forty plates — narrow the lens to see further")}
            </p>
          )}
        </>
      ) : (
        /* ------------------- the hyperspace shelf ------------------- */
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="idw-grid">
          {(idw?.entities ?? []).map((entity, idx) => (
            <IdwCard key={entity.i} entity={entity} seal={SEALS[idx % SEALS.length]} onOpen={openIdw} t={t} />
          ))}
        </div>
      )}

      {/* ------------------- the zoomed plate ------------------- */}
      {openId && (
        <PlateOverlay
          onClose={closePlate}
          onStep={stepPlate}
          t={t}
          civ={entry ?? null}
          idw={idwEntity}
          civId={openId.startsWith("CIV-") ? openId : null}
          loading={entryLoading}
          tab={plateTab}
          setTab={setPlateTab}
        />
      )}
    </div>
  );
}

/* --------------------------- small pieces --------------------------- */

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-glow rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--lp-violet)_72%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_14%,transparent)] text-[var(--lp-violet-bright)]"
          : "border-[var(--lp-edge)] bg-[var(--lp-veil)] text-[var(--lp-mute)] hover:text-[var(--lp-head)]"
      )}
    >
      {label}
    </button>
  );
}

function CivilisationCard({
  row,
  onOpen,
  t,
}: {
  row: CodexRow;
  onOpen: (row: CodexRow) => void;
  t: (s: string) => string;
}) {
  const opened = row.c !== undefined;
  const seal = SEALS[(parseInt(row.i.slice(4), 10) || 0) % SEALS.length];

  return (
    <button
      type="button"
      onClick={() => opened && onOpen(row)}
      data-testid={`codex-card-${row.i}`}
      aria-label={opened ? `${row.i} — ${row.n}` : `${row.i} — ${t("sealed plate")}`}
      className={cn(
        "focus-glow group relative overflow-hidden rounded-2xl border text-left transition-all duration-300",
        opened
          ? "border-[var(--lp-edge)] bg-[var(--lp-veil)] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--lp-violet)_60%,transparent)] hover:shadow-[0_14px_40px_-18px_rgba(60,40,90,0.45)]"
          : "cursor-default border-[var(--lp-edge)] bg-[var(--lp-veil)] opacity-80"
      )}
    >
      {/* the plate's art — or the sealed shelf's quiet seal */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[color-mix(in_srgb,var(--lp-violet)_6%,var(--lp-veil-solid))]">
        {opened ? (
          <Image
            src={`/codex/art/${row.i.toLowerCase()}-a.webp`}
            alt={`${row.i} — ${row.n}`}
            fill
            unoptimized
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={seal}
              alt=""
              aria-hidden="true"
              width={140}
              height={140}
              unoptimized
              loading="lazy"
              className="size-[38%] h-auto w-auto opacity-25 grayscale"
            />
          </div>
        )}
        {/* the plate's own hairline veil — one breath, never a cover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(18,12,32,0.62)_0%,transparent_38%)]"
        />
        {/* the catalogue's own marks, living on the art's shoulder */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="mono-label rounded-full bg-[rgba(16,10,30,0.55)] px-2.5 py-1 text-[9px] tracking-[0.18em] text-[rgba(255,251,240,0.95)]">
            {row.i}
          </span>
          <span className="flex items-center gap-1.5">
            {row.d != null && (
              <span className="mono-label rounded-full bg-[rgba(16,10,30,0.55)] px-2 py-1 text-[9px] tracking-[0.12em] text-[rgba(255,251,240,0.88)]">
                {row.d < 1000 ? `${row.d} LY` : `${fmt(Math.round(row.d))} LY`}
              </span>
            )}
            {row.k && (
              <span className="mono-label rounded-full bg-[color-mix(in_srgb,var(--lp-violet)_46%,rgba(16,10,30,0.6))] px-2 py-1 text-[9px] tracking-[0.12em] text-[#f3edff]">
                {row.k === "Ω" ? "Ω" : `Type ${row.k}`}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* the plate's voice */}
      <div className="p-4">
        <h3 className="truncate font-[family-name:Cinzel] text-[15.5px] font-semibold tracking-wide text-[var(--lp-head)]">
          {row.n}
        </h3>
        {row.e && (
          <p className="mt-0.5 truncate text-[12.5px] italic text-[var(--lp-gold)]">{row.e}</p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12px] text-[var(--lp-mute)]">
          <Globe2 className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{row.s || row.h || t("A star awaiting its record")}</span>
        </p>
        {opened ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {row.kn != null && (
              <span className="rounded-full border border-[var(--lp-edge)] px-2 py-0.5 text-[10.5px] text-[var(--lp-body-soft)]">
                {row.kn}% {t("kinship")}
              </span>
            )}
            {row.b && (
              <span className="rounded-full border border-[var(--lp-edge)] px-2 py-0.5 text-[10.5px] text-[var(--lp-body-soft)]">
                {row.b}
              </span>
            )}
          </div>
        ) : (
          <p className="mono-label mt-2.5 text-[9px] uppercase tracking-[0.2em] text-[var(--lp-faint)]">
            {t("Sealed plate · awaiting its archive")}
          </p>
        )}
      </div>
    </button>
  );
}

function IdwCard({
  entity,
  seal,
  onOpen,
  t,
}: {
  entity: IdwEntity;
  seal: string;
  onOpen: (entity: IdwEntity) => void;
  t: (s: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entity)}
      data-testid={`codex-card-${entity.i}`}
      aria-label={`${entity.i} — ${entity.name}`}
      className="focus-glow group relative overflow-hidden rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--lp-violet)_60%,transparent)] hover:shadow-[0_14px_40px_-18px_rgba(60,40,90,0.45)]"
    >
      <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden bg-[color-mix(in_srgb,var(--lp-violet)_10%,var(--lp-veil-solid))]">
        <Image
          src={seal}
          alt=""
          aria-hidden="true"
          width={200}
          height={200}
          unoptimized
          loading="lazy"
          className="h-[58%] w-auto opacity-30 transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <span className="mono-label rounded-full bg-[rgba(16,10,30,0.55)] px-2.5 py-1 text-[9px] tracking-[0.18em] text-[rgba(255,251,240,0.95)]">
            {entity.i}
          </span>
          <span className="mono-label rounded-full bg-[color-mix(in_srgb,var(--lp-violet)_46%,rgba(16,10,30,0.6))] px-2 py-1 text-[9px] tracking-[0.12em] text-[#f3edff]">
            {entity.stability}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate font-[family-name:Cinzel] text-[15.5px] font-semibold tracking-wide text-[var(--lp-head)]">
          {entity.name}
        </h3>
        <p className="mt-0.5 truncate text-[12.5px] italic text-[var(--lp-gold)]">
          {entity.classification}
        </p>
        <p className="mt-1.5 truncate text-[12px] text-[var(--lp-mute)]">{entity.locus}</p>
      </div>
    </button>
  );
}

/* ------------------------- the zoomed plate ------------------------- */

function PlateOverlay({
  onClose,
  onStep,
  t,
  civ,
  idw,
  civId,
  loading,
  tab,
  setTab,
}: {
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  t: (s: string) => string;
  civ: CodexEntry | null;
  idw: IdwEntity | null;
  civId: string | null;
  loading: boolean;
  tab: number;
  setTab: (n: number) => void;
}) {
  const arts = civ?.art ?? [];
  const artSlot = tab === 0 ? "a" : tab === 1 ? "b" : "c";
  const artAlt =
    tab === 0
      ? t("The civilization and its world")
      : tab === 1
        ? t("Its signature technology")
        : t("A native lifeform");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={civ?.name ?? idw?.name ?? "Codex plate"}
      data-testid="codex-plate"
      className="fixed inset-0 z-[80] overflow-y-auto bg-[color-mix(in_srgb,var(--lp-deep)_94%,#0b0618)]"
    >
      {/* the plate's own ceiling — the closing hand and the stepping hands */}
      <div className="sticky top-0 z-10 border-b border-[var(--lp-edge)] bg-[color-mix(in_srgb,var(--lp-deep)_88%,transparent)]">
        <div className="mx-auto flex w-full max-w-[1080px] items-center gap-3 px-4 py-3 sm:px-6">
          <span className="mono-label truncate text-[10px] tracking-[0.22em] text-[var(--lp-violet-bright)]">
            {civId ?? idw?.i} · {t("CODEX EXOBIOLOGICA")}
          </span>
          <span className="hidden h-px flex-1 bg-[var(--lp-edge)] sm:block" aria-hidden="true" />
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label={t("The plate before")}
              className="focus-glow rounded-full border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-2 text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label={t("The plate after")}
              className="focus-glow rounded-full border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-2 text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="codex-plate-close"
              aria-label={t("Close the plate")}
              className="focus-glow ml-1 rounded-full border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-2 text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-6 sm:px-6">
        {/* ------------------- the name plate ------------------- */}
        <header>
          <h3 className="font-[family-name:Cinzel] text-[24px] font-semibold leading-tight tracking-wide text-[var(--lp-head)] sm:text-[30px]">
            {civ?.name ?? idw?.name}
          </h3>
          {(civ?.epithet || idw?.classification) && (
            <p className="mt-1 text-[15px] italic text-[var(--lp-gold)]">
              {civ?.epithet ?? idw?.classification}
            </p>
          )}
        </header>

        {loading && !civ && !idw && (
          <div className="mt-8 flex items-center gap-3">
            <span className="size-2 rounded-full bg-[var(--lp-violet)]" />
            <p className="mono-label text-[10px] uppercase tracking-[0.3em] text-[var(--lp-faint)]">
              {t("The plate is being brought…")}
            </p>
          </div>
        )}

        {/* =================== a civilization plate =================== */}
        {civ && !idw && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
            {/* the artwork's three faces */}
            <div>
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-[var(--lp-edge)] bg-[color-mix(in_srgb,var(--lp-violet)_6%,var(--lp-veil-solid))]">
                <Image
                  key={artSlot}
                  src={`/codex/art/${civ.i.toLowerCase()}-${artSlot}.webp`}
                  alt={artAlt}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="mt-2.5 flex gap-1.5" role="tablist" aria-label={t("The plate's three faces")}>
                {[
                  t("Civilisation"),
                  t("Technology"),
                  t("Life"),
                ].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={tab === i}
                    onClick={() => setTab(i)}
                    className={cn(
                      "focus-glow rounded-full border px-3.5 py-1.5 text-[12px] transition-all duration-300",
                      tab === i
                        ? "border-[color-mix(in_srgb,var(--lp-violet)_72%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_14%,transparent)] text-[var(--lp-violet-bright)]"
                        : "border-[var(--lp-edge)] bg-[var(--lp-veil)] text-[var(--lp-mute)] hover:text-[var(--lp-head)]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* the archive's own quotation, beneath the art */}
              {civ.quote?.text && (
                <blockquote className="mt-5 rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-5">
                  <p className="font-[family-name:var(--font-literata)] text-[15px] italic leading-relaxed text-[var(--lp-head)]">
                    “{civ.quote.text}”
                  </p>
                  {civ.quote.source && (
                    <cite className="mono-label mt-2 block text-[9px] not-italic uppercase tracking-[0.2em] text-[var(--lp-faint)]">
                      — {civ.quote.source}
                    </cite>
                  )}
                </blockquote>
              )}
            </div>

            {/* the record's right hand */}
            <div className="min-w-0">
              <FieldGrid
                rows={[
                  [t("Star system"), civ.fields.starSystem],
                  [t("Sector"), civ.fields.sector],
                  [t("Coordinates"), civ.fields.coordinates],
                  [t("Distance"), `${civ.fields.distance} LY`],
                  [t("Homeworld"), civ.fields.homeworld],
                  [t("Kinship"), civ.fields.kinship],
                  [t("Development"), civ.fields.development],
                  [t("Population"), civ.fields.population],
                  [t("Governance"), civ.fields.governance],
                  [t("Communication"), civ.fields.communication],
                  [t("Catalogued"), civ.fields.catalogued],
                ]}
              />

              <Prose title={t("Overview")} body={civ.overview} />
              <Prose title={t("Society & architecture")} body={civ.society} />
              <Prose title={t("Chronicle")} body={civ.chronicle} />

              {/* the signature technology */}
              {civ.tech?.name && (
                <section className="mt-6">
                  <PanelTitle icon={<Sparkles className="size-3.5" aria-hidden="true" />}>
                    {civ.tech.name}
                  </PanelTitle>
                  {civ.tech.desc && <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{civ.tech.desc}</p>}
                  {civ.tech.mechanism && (
                    <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--lp-body-soft)]">
                      <span className="mono-label mr-2 text-[9px] uppercase tracking-[0.2em] text-[var(--lp-violet-bright)]">
                        {t("Mechanism")}
                      </span>
                      {civ.tech.mechanism}
                    </p>
                  )}
                  <div className="mt-3">
                    <FieldGrid
                      rows={[
                        [t("Technology ID"), civ.tech.id],
                        [t("Domain"), civ.tech.domain],
                        [t("Energy output"), civ.tech.energy],
                        [t("Frequency"), civ.tech.frequency],
                        [t("Materials"), civ.tech.materials],
                        [t("Schematic"), civ.tech.schematic],
                      ]}
                    />
                  </div>
                  {civ.tech.notes && (
                    <p className="mt-2 text-[12.5px] italic leading-relaxed text-[var(--lp-mute)]">
                      {civ.tech.notes}
                    </p>
                  )}
                </section>
              )}

              {/* the six measured readings */}
              {Object.keys(civ.metrics ?? {}).length > 0 && (
                <section className="mt-6">
                  <PanelTitle icon={<Telescope className="size-3.5" aria-hidden="true" />}>
                    {t("Technology metrics")}
                  </PanelTitle>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                    {Object.entries(civ.metrics).map(([label, val]) => {
                      const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
                      return (
                        <div key={label}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[11px] text-[var(--lp-mute)]">{label}</span>
                            <span className="mono-label text-[10px] text-[var(--lp-head)]">{val}</span>
                          </div>
                          <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[var(--lp-edge)]">
                            <div
                              className="h-full rounded-full bg-[color-mix(in_srgb,var(--lp-violet)_76%,var(--lp-gold))]"
                              style={{ width: `${num}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* anatomy & integration */}
              <section className="mt-6">
                <PanelTitle icon={<Dna className="size-3.5" aria-hidden="true" />}>
                  {t("Anatomy & integration")}
                </PanelTitle>
                {civ.body?.anatomy && (
                  <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{civ.body.anatomy}</p>
                )}
                <div className="mt-3">
                  <FieldGrid
                    rows={[
                      [t("Biochemistry"), civ.body?.biochemistry],
                      [t("Morphology"), civ.body?.morphology],
                      [t("Gravity"), `${civ.body?.gravity} g`],
                      [t("Atmosphere"), civ.body?.atmosphere],
                    ]}
                  />
                </div>
              </section>

              {/* the native lifeform */}
              {civ.biota?.name && (
                <section className="mt-6">
                  <PanelTitle icon={<Globe2 className="size-3.5" aria-hidden="true" />}>
                    {civ.biota.binomial ? `${civ.biota.name} · ${civ.biota.binomial}` : civ.biota.name}
                  </PanelTitle>
                  {civ.biota.desc && (
                    <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{civ.biota.desc}</p>
                  )}
                  <div className="mt-3">
                    <FieldGrid
                      rows={[
                        [t("Biota ID"), civ.biota.id],
                        [t("Kingdom"), civ.biota.kingdom],
                        [t("Trophic method"), civ.biota.trophic],
                        [t("Typical scale"), civ.biota.scale],
                        [t("Bioluminescence"), civ.biota.bioluminescence],
                        [t("Anatomy"), civ.biota.anatomy],
                      ]}
                    />
                  </div>
                  {civ.biota.lifecycle && (
                    <p className="mt-2 text-[12.5px] leading-[1.8] text-[var(--lp-body-soft)]">
                      {civ.biota.lifecycle}
                    </p>
                  )}
                </section>
              )}

              {/* the homeworld vista */}
              {civ.vista?.title && (
                <section className="mt-6">
                  <PanelTitle icon={<Telescope className="size-3.5" aria-hidden="true" />}>
                    {civ.vista.title}
                  </PanelTitle>
                  {civ.vista.desc && (
                    <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{civ.vista.desc}</p>
                  )}
                  <div className="mt-3">
                    <FieldGrid
                      rows={[
                        [t("Location"), civ.vista.location],
                        [t("Architecture"), civ.vista.architecture],
                        [t("Elevation / orbit"), civ.vista.elevation],
                        [t("Density"), civ.vista.density],
                      ]}
                    />
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* =================== a hyperspace-wing plate =================== */}
        {idw && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
            <div>
              <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-2xl border border-[var(--lp-edge)] bg-[color-mix(in_srgb,var(--lp-violet)_10%,var(--lp-veil-solid))]">
                <Image
                  src={SEALS[(parseInt(idw.i.slice(4), 10) || 0) % SEALS.length]}
                  alt=""
                  aria-hidden="true"
                  width={220}
                  height={220}
                  unoptimized
                  className="h-[55%] w-auto opacity-30"
                />
              </div>
              {idw.quote?.text && (
                <blockquote className="mt-5 rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-5">
                  <p className="font-[family-name:var(--font-literata)] text-[15px] italic leading-relaxed text-[var(--lp-head)]">
                    “{idw.quote.text}”
                  </p>
                  {idw.quote.source && (
                    <cite className="mono-label mt-2 block text-[9px] not-italic uppercase tracking-[0.2em] text-[var(--lp-faint)]">
                      — {idw.quote.source}
                    </cite>
                  )}
                </blockquote>
              )}
            </div>
            <div className="min-w-0">
              <FieldGrid
                rows={[
                  [t("Entity ID"), idw.i],
                  [t("Dimensionality"), idw.dimensionality],
                  [t("Resonance substrate"), idw.resonance],
                  [t("Phenomenological locus"), idw.locus],
                  [t("Communication mode"), idw.communication],
                  [t("Ontological stability"), idw.stability],
                ]}
              />
              <Prose title={t("Phenomenology & encounters")} body={idw.phenomenology} />
              <Prose title={t("Hyper-geometric anatomy")} body={idw.anatomy} />
              <Prose title={t("Cognitive impact & messages")} body={idw.cognitive} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h4 className="flex items-center gap-2 font-[family-name:Cinzel] text-[15px] font-semibold tracking-wide text-[var(--lp-head)]">
      <span className="text-[var(--lp-violet-bright)]">{icon}</span>
      <span className="min-w-0">{children}</span>
    </h4>
  );
}

function Prose({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <section className="mt-6">
      <h4 className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--lp-violet-bright)]">
        {title}
      </h4>
      <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{body}</p>
    </section>
  );
}

function FieldGrid({ rows }: { rows: [string, string | undefined][] }) {
  const clean = rows.filter(([, v]) => v && String(v).trim() && String(v).trim() !== "LY");
  if (clean.length === 0) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-4 sm:grid-cols-[minmax(96px,auto)_1fr]">
      {clean.map(([label, val]) => (
        <div key={label} className="col-span-2 grid grid-cols-subgrid">
          <dt className="mono-label py-0.5 text-[9px] uppercase tracking-[0.16em] text-[var(--lp-faint)]">
            {label}
          </dt>
          <dd className="min-w-0 py-0.5 text-[12.5px] leading-snug text-[var(--lp-body)]">{val}</dd>
        </div>
      ))}
    </dl>
  );
}
