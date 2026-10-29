"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Telescope,
  X,
  ZoomIn,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE CHRONOSCOPE — a time machine for discovery.                    */
/*                                                                     */
/*  Codex Exobiologica's own instrument. Not a feed: ONE active        */
/*  profile card floats inside a sparse, broken chrono dial; the       */
/*  console beneath carries Previous / Discover / Next; four role      */
/*  tabs open the being, the world, the technology and the life of     */
/*  the current record. The archive stays large — 3,212 canonical      */
/*  civilisations and eight hyperspace records, all addressable —      */
/*  while the interface stays small.                                   */
/*                                                                     */
/*  UNIQUENESS CONTRACT: only the six pilot profiles' role images      */
/*  (hash-verified against the bundle manifest) are "ready". Every     */
/*  other record shows an honest, ornamental "artwork pending" plate   */
/*  carrying its own ID — never a neighbour's picture, never a         */
/*  recoloured copy. The legacy PDF-lifted library (19 distinct        */
/*  pictures across 5,436 files) is quarantined in git history.        */
/*                                                                     */
/*  CALM LAWS: the dial is static CSS/SVG; it rotates only as a        */
/*  brief transform on deliberate navigation and then rests. No        */
/*  particle fields, no continuous glows, no render loops. One card    */
/*  and at most two lightweight neighbour shells are mounted. One      */
/*  primary image decodes at a time; details text opens in a bounded   */
/*  sheet on request. Respect for reduced motion is a law, not a wish. */
/* ------------------------------------------------------------------ */

/* ------------------------------- types ------------------------------- */

type ChronoRow = {
  i: string;
  n: string;
  e?: string;
  s?: string;
  h?: string;
  d?: number | null;
  k?: string | null;
  kn?: number | null;
  b?: string | null;
  hue?: number | null;
  c: number;
  x: number;
};

type CivRecord = {
  i: string;
  n: string;
  e: string;
  kinship?: string;
  star?: string;
  sector?: string;
  coords?: string;
  d?: number | null;
  kard?: string;
  kn?: number | null;
  bio?: string;
  morph?: string;
  home?: string;
  g?: string | number;
  atm?: string;
  gov?: string;
  comm?: string;
  pop?: string;
  year?: string | number;
  hue?: number;
  thesis?: string;
  anat?: string;
  society?: string;
  chron?: string;
  q?: { t?: string; s?: string };
  tech?: Record<string, unknown>;
  biota?: Record<string, unknown>;
  vista?: Record<string, unknown>;
};

type IdmRecord = {
  id: string;
  name: string;
  classification?: string;
  dimensionality?: string;
  resonanceSubstrate?: string;
  phenomenologicalLocus?: string;
  communicationMode?: string;
  ontologicalStability?: string;
  geometryArchetype?: string;
  accentColor?: string;
  summary?: string;
  phenomenologyAndEncounters?: string;
  hyperGeometricAnatomy?: string;
  cognitiveImpactAndMessages?: string;
  archivalQuote?: string;
  quoteAttribution?: string;
};

type ReadyAsset = {
  entityId: string;
  role: string;
  version: string;
  file: string;
  reviewStatus?: string;
};

type AssetPayload = {
  counts: { records: number; civilian: number; idm: number; readyRoleAssets: number };
  ready: ReadyAsset[];
};

type IndexPayload = {
  manifest: {
    total: number;
    civilian: number;
    idm: number;
    readyProfiles: number;
  };
  rows: ChronoRow[];
};

type Wing = "civ" | "idw";

/* the four faces — civilian and hyperspace speak their own names */
const ROLE_KEYS = ["being", "world", "technology", "life"] as const;

/* --------------------------- small helpers --------------------------- */

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function hueAccent(hue: number | null | undefined) {
  const h = typeof hue === "number" ? ((hue % 360) + 360) % 360 : 42;
  return `hsl(${h} 34% 58%)`;
}

/* a deterministic ornamental geometry — original interface ornament,
   unique to the record, never a purported alien script */
function ornamentSeed(id: string) {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  return h;
}

function PendingPlate({ id, hue }: { id: string; hue?: number | null }) {
  const seed = ornamentSeed(id);
  const sides = 5 + (seed % 6);
  const rot = (seed % 72) * 5;
  const accent = hueAccent(hue);
  const inner = 30 + (seed % 9);
  const pts = useMemo(() => {
    const r = 46;
    return Array.from({ length: sides }, (_, k) => {
      const a = (Math.PI * 2 * k) / sides + (rot * Math.PI) / 180;
      const rad = k % 2 === 0 ? r : inner;
      return `${60 + Math.cos(a) * rad},${60 + Math.sin(a) * rad}`;
    }).join(" ");
  }, [sides, rot, inner, seed]);

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="size-full">
      <circle cx="60" cy="60" r="54" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="3 5 40 6" />
      <circle cx="60" cy="60" r="38" fill="none" stroke={accent} strokeOpacity="0.22" strokeWidth="0.6" strokeDasharray="20 4" />
      <polygon points={pts} fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.9" strokeLinejoin="round" />
      <circle cx="60" cy="60" r="2.4" fill={accent} fillOpacity="0.7" />
    </svg>
  );
}

/* --------------------------- the instrument --------------------------- */

export default function Chronoscope() {
  const t = useT();

  const [index, setIndex] = useState<IndexPayload | null>(null);
  const [idm, setIdm] = useState<IdmRecord[]>([]);
  const [assets, setAssets] = useState<AssetPayload | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [wing, setWing] = useState<Wing>("civ");
  const [currentId, setCurrentId] = useState("CIV-0001");
  const [role, setRole] = useState(0);

  const [record, setRecord] = useState<CivRecord | IdmRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPage, setSearchPage] = useState(0);
  const [savedOpen, setSavedOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsScroll = useRef(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const chunkCache = useRef<Map<string, unknown[]>>(new Map());
  const rowMap = useRef<Map<string, ChronoRow>>(new Map());
  const navEpoch = useRef(0);

  /* --------------------------- the archive loads --------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ix, wingFile, assetFile] = await Promise.all([
          fetch("/chronoscope/index.json").then((r) => r.json()),
          fetch("/chronoscope/idm.json").then((r) => r.json()),
          fetch("/chronoscope/assets.json").then((r) => r.json()),
        ]);
        if (!alive) return;
        setIndex(ix as IndexPayload);
        setIdm((wingFile as { entities: IdmRecord[] }).entities);
        setAssets(assetFile as AssetPayload);
        rowMap.current = new Map(
          (ix as IndexPayload).rows.map((r) => [r.i, r])
        );
      } catch {
        if (alive) setLoadError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* saved-for-this-visit — temporary, under the site's own privacy law */
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const s = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("chronoscope-saved") : null;
      return s ? (JSON.parse(s) as string[]) : [];
    } catch {
      return [];
    }
  });
  const toggleSave = useCallback(() => {
    setSaved((prev) => {
      const next = prev.includes(currentId)
        ? prev.filter((x) => x !== currentId)
        : [...prev, currentId];
      try {
        sessionStorage.setItem("chronoscope-saved", JSON.stringify(next));
      } catch {
        /* the visit stays unremembered */
      }
      return next;
    });
  }, [currentId]);

  /* ------------------- record resolution (stale-safe) ------------------- */
  const isIdm = currentId.startsWith("IDM-");
  /* the newest version of a slot wins — future re-illustrations simply
     arrive as v002 and step past the v001 plates without any UI change */
  const readyMap = useMemo(() => {
    const m = new Map<string, string>();
    const sorted = [...(assets?.ready ?? [])].sort((a, b) =>
      a.version > b.version ? 1 : -1
    );
    for (const a of sorted) m.set(`${a.entityId}/${a.role}`, a.file);
    return m;
  }, [assets]);

  useEffect(() => {
    if (!index && !idm.length) return;
    if (isIdm && !idm.length) return;
    const epoch = ++navEpoch.current;
    const controller = new AbortController();

    /* every state write walks one microtask behind the effect, so the
       instrument never sets state synchronously while rendering */
    if (isIdm) {
      const entity = idm.find((e) => e.id === currentId) ?? null;
      queueMicrotask(() => {
        /* a late response must never overwrite the profile being viewed */
        if (epoch !== navEpoch.current) return;
        setRecord(entity);
        setLoading(false);
      });
      return () => controller.abort();
    }

    const row = rowMap.current.get(currentId);
    if (!row) {
      queueMicrotask(() => {
        if (epoch !== navEpoch.current) return;
        setRecord(null);
        setLoading(false);
      });
      return;
    }
    const key = `chunk-${String(row.c).padStart(3, "0")}.json`;
    const cached = chunkCache.current.get(key);
    if (cached) {
      queueMicrotask(() => {
        if (epoch !== navEpoch.current) return;
        setRecord((cached as CivRecord[])[row.x] ?? null);
        setLoading(false);
      });
      return;
    }
    /* the fetch itself also walks one microtask behind the effect */
    queueMicrotask(() => {
      if (epoch !== navEpoch.current) return;
      setLoading(true);
      fetch(`/chronoscope/details/${key}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((records: CivRecord[]) => {
          chunkCache.current.set(key, records);
          if (epoch === navEpoch.current) {
            setRecord(records[row.x] ?? null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          if (epoch === navEpoch.current) {
            setRecord(null);
            setLoading(false);
          }
        });
    });
    return () => controller.abort();
  }, [currentId, index, idm, isIdm]);

  /* ------------------------ the walk's own order ------------------------ */
  const rows = index?.rows ?? [];
  const filtered = useMemo(() => {
    if (wing === "idw") return [];
    return rows;
  }, [wing, rows]);

  const navList = useMemo<string[]>(() => {
    if (wing === "idw") return idm.map((e) => e.id);
    return filtered.map((r) => r.i);
  }, [wing, idm, filtered]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (navList.length === 0) return;
      const at = navList.indexOf(currentId);
      const next =
        at === -1 ? 0 : (at + dir + navList.length) % navList.length;
      setCurrentId(navList[next]);
    },
    [navList, currentId]
  );

  /* Discover — an unseen record within the active wing */
  const visitedRef = useRef<Set<string>>(new Set());
  const discover = useCallback(() => {
    if (navList.length === 0) return;
    const unseen = navList.filter((id) => !visitedRef.current.has(id));
    const pool = unseen.length > 0 ? unseen : navList;
    if (unseen.length === 0) visitedRef.current.clear();
    const pick = pool[Math.floor(Math.random() * pool.length)];
    visitedRef.current.add(pick);
    setCurrentId(pick);
    /* the focus walks to the new card's title once it stands */
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("chrono-card-title")?.focus();
      }, 260);
    });
  }, [navList]);

  /* ------------------------------ search ------------------------------ */
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { id: string; name: string; sub?: string; hue?: number | null }[];
    const out: { id: string; name: string; sub?: string; hue?: number | null }[] = [];
    for (const r of rows) {
      if (
        r.i.toLowerCase().includes(q) ||
        r.n.toLowerCase().includes(q) ||
        (r.s ?? "").toLowerCase().includes(q) ||
        (r.h ?? "").toLowerCase().includes(q) ||
        (r.e ?? "").toLowerCase().includes(q)
      ) {
        out.push({ id: r.i, name: r.n, sub: r.s ?? r.h, hue: r.hue });
      }
      if (out.length >= 300) break;
    }
    for (const e of idm) {
      if (
        e.id.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        (e.classification ?? "").toLowerCase().includes(q)
      ) {
        out.push({ id: e.id, name: e.name, sub: e.classification, hue: null });
      }
    }
    return out;
  }, [query, rows, idm]);

  const SEARCH_PAGE = 12;
  const searchSlice = searchResults.slice(
    searchPage * SEARCH_PAGE,
    searchPage * SEARCH_PAGE + SEARCH_PAGE
  );
  const searchPages = Math.max(1, Math.ceil(searchResults.length / SEARCH_PAGE));

  const resetSearch = useCallback(() => {
    setQuery("");
    setSearchPage(0);
  }, []);

  /* --------------------------- keyboard paths --------------------------- */
  const instrumentRef = useRef<HTMLDivElement | null>(null);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (detailsOpen && e.key === "Escape") {
        e.preventDefault();
        setDetailsOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "Escape" && expanded) {
        e.preventDefault();
        setExpanded(false);
      }
    },
    [step, detailsOpen, expanded]
  );

  /* ------------------------------ render ------------------------------ */

  if (loadError) {
    return (
      <div className="rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-8 text-center">
        <p className="text-[14px] text-[var(--lp-mute)]">
          {t("The chronoscope could not be wound this time. One breath, then try again.")}
        </p>
      </div>
    );
  }

  if (!index) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-10">
        <span className="size-2 rounded-full bg-[var(--lp-violet)]" />
        <p className="mono-label text-[10px] uppercase tracking-[0.3em] text-[var(--lp-faint)]">
          {t("The chronoscope is winding…")}
        </p>
      </div>
    );
  }

  const civRecord = !isIdm ? (record as CivRecord | null) : null;
  const idmRecord = isIdm ? (record as IdmRecord | null) : null;
  const displayName = idmRecord?.name ?? civRecord?.n ?? currentId;
  const displayEpithet = idmRecord?.classification ?? civRecord?.e ?? "";
  const hue = isIdm ? null : civRecord?.hue;
  const accent = hueAccent(hue);
  const roleKey = ROLE_KEYS[role];
  const readyFile = isIdm ? undefined : readyMap.get(`${currentId}/${roleKey}`);
  const position = navList.indexOf(currentId);
  const counter =
    wing === "idw"
      ? `${currentId} / ${fmt(idm.length)}`
      : position >= 0
        ? `${currentId} / ${fmt(rows.length)}`
        : `${currentId}`;

  const factChips: string[] = (() => {
    if (idmRecord) {
      return [
        idmRecord.dimensionality,
        idmRecord.ontologicalStability,
        idmRecord.resonanceSubstrate,
      ].filter(Boolean) as string[];
    }
    const chips: string[] = [];
    if (typeof civRecord?.d === "number") chips.push(`${fmt(Math.round(civRecord.d))} LY`);
    if (civRecord?.kard) chips.push(civRecord.kard);
    if (civRecord?.bio) chips.push(civRecord.bio);
    return chips.slice(0, 3);
  })();

  /* the dial's rotation — one brief transform per navigation, then rest */
  const dialTurn = position >= 0 ? (position / Math.max(1, navList.length)) * 360 : 0;

  return (
    <div ref={instrumentRef} onKeyDown={onKeyDown} className="relative">
      {/* ================== the collapsed landing module ================== */}
      <div
        data-testid="chronoscope-module"
        className="overflow-hidden rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--lp-edge)] px-4 py-2.5">
          <p className="mono-label text-[9px] uppercase tracking-[0.26em] text-[var(--lp-faint)]">
            {t("The Chronoscope · a time machine for discovery")}
          </p>
          <p className="mono-label hidden text-[9px] tracking-[0.16em] text-[var(--lp-faint)] sm:block">
            {fmt(index.manifest.civilian)} {t("civilisations")} · {index.manifest.idm}{" "}
            {t("hyperspace")} · {index.manifest.readyProfiles} {t("fully illustrated")}
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[300px_1fr] sm:items-center sm:p-5">
          {/* the card's face */}
          <div
            className="relative mx-auto aspect-[3/2] w-full max-w-[340px] overflow-hidden rounded-xl border sm:mx-0"
            style={{ borderColor: `color-mix(in srgb, ${accent} 36%, transparent)` }}
          >
            {readyFile ? (
              <>
                <Image
                  key={`${currentId}/${roleKey}`}
                  src={`/chronoscope/art/${readyFile}`}
                  alt={`${currentId} — ${displayName}`}
                  fill
                  unoptimized
                  sizes="340px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  data-testid="chronoscope-zoom-small"
                  aria-label={t("Enlarge the artwork")}
                  className="focus-glow absolute bottom-2 right-2 flex size-11 items-center justify-center rounded-full border bg-[color-mix(in_srgb,var(--lp-veil-solid)_82%,transparent)]"
                  style={{ borderColor: `color-mix(in srgb, ${accent} 44%, transparent)` }}
                >
                  <ZoomIn className="size-4" style={{ color: accent }} aria-hidden="true" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--lp-violet)_5%,var(--lp-veil-solid))]">
                <div className="size-[72%]">
                  <PendingPlate id={currentId} hue={hue} />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="mono-label text-[9px] tracking-[0.2em]" style={{ color: accent }}>
              {counter}
            </p>
            <h3
              id="chrono-card-title"
              tabIndex={-1}
              className="mt-1 truncate font-[family-name:Cinzel] text-[19px] font-semibold tracking-wide text-[var(--lp-head)] outline-none sm:text-[22px]"
            >
              {displayName}
            </h3>
            {displayEpithet && (
              <p className="mt-0.5 truncate text-[13px] italic text-[var(--lp-gold)]">
                {displayEpithet}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {factChips.map((chip) => (
                <span
                  key={chip}
                  className="max-w-[220px] truncate rounded-full border border-[var(--lp-edge)] px-2.5 py-0.5 text-[11px] text-[var(--lp-body-soft)]"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={discover}
                data-testid="chronoscope-discover"
                className="focus-glow inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 60%, transparent)`,
                  color: accent,
                  background: `color-mix(in srgb, ${accent} 8%, transparent)`,
                }}
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t("Discover")}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                data-testid="chronoscope-expand"
                className="focus-glow inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--lp-edge)] px-5 py-2 text-[13px] font-medium text-[var(--lp-head)] transition-colors hover:border-[color-mix(in_srgb,var(--lp-violet)_55%,transparent)]"
              >
                <Telescope className="size-3.5" aria-hidden="true" />
                {t("Open the chronoscope")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== the expanded instrument ==================== */}
      {/* the instrument is portaled to the body: no ancestor transform may
          claim its fixed coordinates — the dial owns the whole viewport */}
      {expanded &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("The Chronoscope")}
          data-testid="chronoscope-instrument"
          className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[color-mix(in_srgb,var(--lp-deep)_96%,#0d0a16)]"
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1100px] flex-col px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 sm:px-6 lg:max-w-[1560px]">
            {/* ------------------- the top edge ------------------- */}
            <div className="flex flex-wrap items-center gap-2 py-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setWing("civ");
                    if (isIdm) setCurrentId("CIV-0001");
                  }}
                  aria-pressed={wing === "civ"}
                  className={cn(
                    "focus-glow inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 text-[12px] transition-all duration-200",
                    wing === "civ"
                      ? "border-[color-mix(in_srgb,var(--lp-violet)_65%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_12%,transparent)] text-[var(--lp-violet-bright)]"
                      : "border-[var(--lp-edge)] text-[var(--lp-mute)]"
                  )}
                >
                  <Telescope className="size-3" aria-hidden="true" />
                  {t("Civilisations")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWing("idw");
                    if (!isIdm) setCurrentId("IDM-0001");
                  }}
                  aria-pressed={wing === "idw"}
                  data-testid="chronoscope-wing-idw"
                  className={cn(
                    "focus-glow inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 text-[12px] transition-all duration-200",
                    wing === "idw"
                      ? "border-[color-mix(in_srgb,var(--lp-violet)_65%,transparent)] bg-[color-mix(in_srgb,var(--lp-violet)_12%,transparent)] text-[var(--lp-violet-bright)]"
                      : "border-[var(--lp-edge)] text-[var(--lp-mute)]"
                  )}
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  {t("Hyperspace wing")}
                </button>
              </div>

              <span className="mono-label hidden text-[9px] tracking-[0.2em] text-[var(--lp-faint)] lg:block">
                {t("CODEX EXOBIOLOGICA · THE CHRONOSCOPE")}
              </span>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen((o) => !o);
                    setSavedOpen(false);
                  }}
                  aria-expanded={searchOpen}
                  data-testid="chronoscope-search-toggle"
                  className="focus-glow inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--lp-edge)] px-3.5 text-[12px] text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
                >
                  <Search className="size-3" aria-hidden="true" />
                  {t("Search")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedOpen((o) => !o);
                    setSearchOpen(false);
                  }}
                  aria-expanded={savedOpen}
                  data-testid="chronoscope-saved-toggle"
                  className="focus-glow relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--lp-edge)] px-3.5 text-[12px] text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
                >
                  <Bookmark className="size-3" aria-hidden="true" />
                  {t("Saved")}
                  {saved.length > 0 && (
                    <span
                      className="mono-label rounded-full px-1.5 text-[9px]"
                      style={{ background: `color-mix(in srgb, ${accent} 22%, transparent)`, color: "var(--lp-head)" }}
                    >
                      {saved.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  data-testid="chronoscope-minimise"
                  aria-label={t("Minimise the chronoscope")}
                  className="focus-glow inline-flex min-h-[36px] items-center gap-1 rounded-full border border-[var(--lp-edge)] px-3 text-[12px] text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  {t("Minimise")}
                </button>
              </div>
            </div>

            {/* ------------------- the search drawer ------------------- */}
            {searchOpen && (
              <div className="rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-3" data-testid="chronoscope-search">
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-2 rounded-full border border-[var(--lp-edge)] px-3.5 py-2">
                    <Search className="size-3.5 shrink-0 text-[var(--lp-faint)]" aria-hidden="true" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSearchPage(0);
                      }}
                      placeholder={t("Name, star, homeworld, or CIV-ID…")}
                      aria-label={t("Search the archive")}
                      className="w-full bg-transparent text-[13px] text-[var(--lp-head)] outline-none placeholder:text-[var(--lp-faint)]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="focus-glow min-h-[36px] rounded-full border border-[var(--lp-edge)] px-3 text-[12px] text-[var(--lp-mute)]"
                  >
                    {t("Clear")}
                  </button>
                </div>
                {query.trim() && (
                  <>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                      {searchSlice.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentId(r.id);
                              setSearchOpen(false);
                            }}
                            className="focus-glow flex w-full items-baseline gap-2 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--lp-edge)] hover:bg-[var(--lp-veil)]"
                          >
                            <span className="mono-label text-[9px] tracking-[0.14em] text-[var(--lp-faint)]">
                              {r.id}
                            </span>
                            <span className="min-w-0 truncate text-[13px] text-[var(--lp-head)]">{r.name}</span>
                          </button>
                        </li>
                      ))}
                      {searchSlice.length === 0 && (
                        <li className="px-3 py-3 text-[13px] text-[var(--lp-mute)]">
                          {t("Nothing in the archive answers that name.")}
                        </li>
                      )}
                    </ul>
                    <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--lp-mute)]">
                      <span className="mono-label text-[9px] tracking-[0.16em]">
                        {fmt(searchResults.length)} {t("records answer")} · {t("page")}{" "}
                        {searchPage + 1}/{searchPages}
                      </span>
                      <span className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={searchPage === 0}
                          onClick={() => setSearchPage((p) => Math.max(0, p - 1))}
                          className="focus-glow rounded-full border border-[var(--lp-edge)] px-3 py-1 disabled:opacity-40"
                        >
                          {t("Previous")}
                        </button>
                        <button
                          type="button"
                          disabled={searchPage + 1 >= searchPages}
                          onClick={() => setSearchPage((p) => p + 1)}
                          className="focus-glow rounded-full border border-[var(--lp-edge)] px-3 py-1 disabled:opacity-40"
                        >
                          {t("Next page")}
                        </button>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ------------------- the saved drawer ------------------- */}
            {savedOpen && (
              <div className="rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-3" data-testid="chronoscope-saved">
                {saved.length === 0 ? (
                  <p className="px-1 py-2 text-[13px] text-[var(--lp-mute)]">
                    {t("Nothing kept for this visit yet — the bookmark rests above the card.")}
                  </p>
                ) : (
                  <ul className="grid gap-1 sm:grid-cols-3">
                    {saved.map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentId(id);
                            setSavedOpen(false);
                          }}
                          className="focus-glow flex w-full items-baseline gap-2 rounded-xl border border-transparent px-3 py-2 text-left hover:border-[var(--lp-edge)]"
                        >
                          <span className="mono-label text-[9px] tracking-[0.14em] text-[var(--lp-faint)]">{id}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ------------------- the dial and its card ------------------- */}
            <div className="relative flex flex-1 items-center justify-center py-4">
              {/* the two neighbour shells — lightweight, imageless */}
              <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[150px] items-center xl:flex" aria-hidden="true">
                <NeighbourShell dir="left" navList={navList} currentId={currentId} rows={rows} idm={idm} isIdm={isIdm} />
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[150px] items-center xl:flex" aria-hidden="true">
                <NeighbourShell dir="right" navList={navList} currentId={currentId} rows={rows} idm={idm} isIdm={isIdm} />
              </div>

              {/* the broken chrono dial — static SVG, brief turn on travel */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 size-[min(96vw,780px)] -translate-x-1/2 -translate-y-1/2"
              >
                <svg viewBox="0 0 200 200" className="size-full">
                  <g
                    style={{
                      transform: `rotate(${dialTurn}deg)`,
                      transformOrigin: "100px 100px",
                      transition: "transform 240ms ease-out",
                    }}
                  >
                    <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(42 32% 62%)" strokeOpacity="0.34" strokeWidth="0.5" strokeDasharray="120 8 60 8 30 8" />
                    {Array.from({ length: 24 }, (_, k) => {
                      const a = (Math.PI * 2 * k) / 24;
                      const r1 = k % 2 === 0 ? 82 : 85;
                      const x1 = 100 + Math.cos(a) * r1;
                      const y1 = 100 + Math.sin(a) * r1;
                      const x2 = 100 + Math.cos(a) * 88;
                      const y2 = 100 + Math.sin(a) * 88;
                      return (
                        <line
                          key={k}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="hsl(42 32% 62%)"
                          strokeOpacity={k % 2 === 0 ? 0.5 : 0.28}
                          strokeWidth="0.5"
                        />
                      );
                    })}
                  </g>
                  <circle cx="100" cy="12" r="3.2" fill="hsl(42 32% 72%)" fillOpacity="0.75" />
                  <circle cx="100" cy="188" r="1.4" fill={accent} fillOpacity="0.8" />
                </svg>
              </div>

              {/* THE CARD — one active profile. ON DESKTOP THE WHOLE
                  RECORD AT ONCE: the four faces (being · world ·
                  technology · life) on the left, the artwork standing
                  in the middle, the record's own information on the
                  right — the full spread on one screen, no scrolling
                  up and down to read it. */}
              <article
                data-testid="chronoscope-card"
                className="relative z-10 w-full max-w-[680px] overflow-hidden rounded-2xl border bg-[color-mix(in_srgb,var(--lp-veil-solid)_88%,transparent)] shadow-[0_24px_80px_-32px_rgba(20,12,40,0.5)] lg:grid lg:max-w-[1400px] lg:grid-cols-[minmax(230px,0.95fr)_minmax(400px,1.5fr)_minmax(240px,1fr)] lg:items-stretch"
                style={{ borderColor: `color-mix(in srgb, ${accent} 42%, var(--lp-edge))` }}
              >
                {/* the card's face — one primary image decodes here.
                    Desktop: the artwork takes the MIDDLE column and
                    stretches with the record. */}
                <div
                  className={cn(
                    "relative aspect-[3/2] w-full overflow-hidden lg:order-2 lg:row-span-2 lg:aspect-auto lg:border-x",
                    readyFile && "cursor-zoom-in"
                  )}
                  style={{ borderColor: `color-mix(in srgb, ${accent} 24%, var(--lp-edge))` }}
                  onClick={readyFile ? () => setZoomOpen(true) : undefined}
                >
                  {readyFile ? (
                    <Image
                      key={`${currentId}/${roleKey}`}
                      src={`/chronoscope/art/${readyFile}`}
                      alt={`${currentId} · ${t("role")}: ${roleKey}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 680px, 540px"
                      className="object-cover"
                      priority={role === 0}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--lp-violet)_6%,var(--lp-veil-solid))]">
                      <div className="size-[46%] max-h-[180px] max-w-[180px]" aria-hidden="true">
                        <PendingPlate id={currentId} hue={hue} />
                      </div>
                      <p className="mono-label px-4 text-center text-[9px] uppercase tracking-[0.24em] text-[var(--lp-faint)]" data-testid="chronoscope-pending">
                        {loading
                          ? `${currentId} · ${t("the record is arriving…")}`
                          : `${currentId} · ${t("artwork pending — awaiting its own illustration")}`}
                      </p>
                    </div>
                  )}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--lp-veil-solid)_88%,transparent),transparent)]"
                  />
                  {readyFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomOpen(true);
                      }}
                      data-testid="chronoscope-zoom"
                      aria-label={t("Enlarge the artwork")}
                      className="focus-glow absolute left-2.5 top-2.5 flex size-11 items-center justify-center rounded-full border bg-[color-mix(in_srgb,var(--lp-veil-solid)_82%,transparent)]"
                      style={{ borderColor: `color-mix(in srgb, ${accent} 44%, transparent)` }}
                    >
                      <ZoomIn
                        className="size-4.5"
                        style={{ color: accent }}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleSave}
                    data-testid="chronoscope-save"
                    aria-pressed={saved.includes(currentId)}
                    aria-label={saved.includes(currentId) ? t("Kept for this visit") : t("Save for this visit")}
                    className="focus-glow absolute right-2.5 top-2.5 flex size-11 items-center justify-center rounded-full border bg-[color-mix(in_srgb,var(--lp-veil-solid)_82%,transparent)] backdrop-none"
                    style={{ borderColor: `color-mix(in srgb, ${accent} 44%, transparent)` }}
                  >
                    <Bookmark
                      className={cn("size-4", saved.includes(currentId) ? "fill-current" : "")}
                      style={{ color: saved.includes(currentId) ? accent : "var(--lp-mute)" }}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {/* the card's voice — the record's own information.
                    Desktop: the RIGHT column. */}
                <div className="flex flex-col p-4 sm:p-5 lg:order-3 lg:py-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="mono-label text-[9px] tracking-[0.2em]" style={{ color: accent }}>
                      {counter}
                    </p>
                    {isIdm && idmRecord?.ontologicalStability && (
                      <span className="mono-label text-[8.5px] tracking-[0.16em] text-[var(--lp-faint)]">
                        {idmRecord.ontologicalStability}
                      </span>
                    )}
                  </div>
                  <h3
                    id="chrono-card-title"
                    tabIndex={-1}
                    className="mt-1 font-[family-name:Cinzel] text-[21px] font-semibold leading-tight tracking-wide text-[var(--lp-head)] outline-none sm:text-[26px]"
                  >
                    {displayName}
                  </h3>
                  {displayEpithet && (
                    <p className="mt-1 text-[13.5px] italic leading-snug text-[var(--lp-gold)]">
                      {displayEpithet}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {factChips.map((chip) => (
                      <span
                        key={chip}
                        className="max-w-full truncate rounded-full border border-[var(--lp-edge)] px-2.5 py-1 text-[11px] text-[var(--lp-body-soft)]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--lp-edge)] pt-3 lg:mt-auto">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      data-testid="chronoscope-details"
                      className="focus-glow inline-flex min-h-[44px] items-center rounded-full border border-[var(--lp-edge)] px-4 text-[12.5px] text-[var(--lp-head)] transition-colors hover:border-[color-mix(in_srgb,var(--lp-violet)_55%,transparent)]"
                    >
                      {t("Open the full record")}
                    </button>
                    {!isIdm && readyFile && (
                      <span className="mono-label text-[8.5px] tracking-[0.14em] text-[var(--lp-faint)]">
                        {t("ready artwork · unique-batch audited")}
                      </span>
                    )}
                  </div>
                </div>

                {/* THE FOUR FACES — being · world · technology · life
                    (entity · geometry · locus · voices on the other
                    wing). Desktop: the LEFT column, the roles' own
                    shore beside the artwork. */}
                <div className="p-4 pt-0 sm:p-5 sm:pt-0 lg:order-1 lg:row-span-2 lg:flex lg:flex-col lg:py-5 lg:pl-5 lg:pr-0">
                  <div className="mt-3.5 grid grid-cols-4 gap-1 border-t border-[var(--lp-edge)] pt-3 lg:mt-0 lg:grid-cols-2 lg:border-t-0 lg:pt-0" role="tablist" aria-label={t("The profile's four faces")}>
                    {(isIdm
                      ? [t("Entity"), t("Geometry"), t("Locus"), t("Voices")]
                      : [t("Being"), t("World"), t("Technology"), t("Life")]
                    ).map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        role="tab"
                        aria-selected={role === i}
                        onClick={() => setRole(i)}
                        className={cn(
                          "focus-glow min-h-[44px] rounded-lg border text-[12px] transition-all duration-200",
                          role === i
                            ? "font-semibold"
                            : "border-transparent text-[var(--lp-mute)] hover:text-[var(--lp-head)]"
                        )}
                        style={
                          role === i
                            ? {
                                borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
                                background: `color-mix(in srgb, ${accent} 10%, transparent)`,
                                color: "var(--lp-head)",
                              }
                            : undefined
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* the role's short context — a breath, not a wall */}
                  <RoleContext
                    role={role}
                    civ={civRecord}
                    idm={idmRecord}
                    t={t}
                  />
                </div>
              </article>
            </div>

            {/* ------------------- the bottom console ------------------- */}
            <div
              className="sticky bottom-0 z-10 -mx-3 mt-auto border-t border-[var(--lp-edge)] bg-[color-mix(in_srgb,var(--lp-deep)_90%,transparent)] px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 sm:-mx-6 sm:px-6"
              data-testid="chronoscope-console"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  data-testid="chronoscope-prev"
                  className="focus-glow inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-[12.5px] text-[var(--lp-head)] transition-colors"
                  style={{ borderColor: `color-mix(in srgb, ${accent} 36%, var(--lp-edge))` }}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  {t("Previous")}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={discover}
                    data-testid="chronoscope-discover-big"
                    className="focus-glow mx-auto flex size-[74px] flex-col items-center justify-center rounded-full border-2 font-semibold tracking-[0.18em] transition-transform duration-200 active:scale-95"
                    style={{
                      borderColor: accent,
                      color: accent,
                      background: `color-mix(in srgb, ${accent} 7%, transparent)`,
                    }}
                  >
                    <span className="mono-label text-[9px] uppercase">{t("Discover")}</span>
                    <span className="mono-label mt-0.5 text-[8px] opacity-70">
                      {wing === "idw" ? t("hyperspace") : t("an unseen record")}
                    </span>
                  </button>
                  <p className="mono-label mt-1.5 text-[8.5px] tracking-[0.18em] text-[var(--lp-faint)]">
                    {counter}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => step(1)}
                  data-testid="chronoscope-next"
                  className="focus-glow inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-[12.5px] text-[var(--lp-head)] transition-colors"
                  style={{ borderColor: `color-mix(in srgb, ${accent} 36%, var(--lp-edge))` }}
                >
                  {t("Next")}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* ------------------- the bounded details sheet ------------------- */}
          {detailsOpen && (
            <DetailsSheet
              t={t}
              civ={civRecord}
              idm={idmRecord}
              accent={accent}
              scrollRef={detailsScroll}
              onClose={() => setDetailsOpen(false)}
            />
          )}
        </div>,
          document.body
        )}

      {/* ------------- the zoom plate — the artwork at full size ------------- */}
      <ZoomOverlay
        t={t}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        entityId={currentId}
        displayName={displayName}
        role={role}
        setRole={setRole}
        readyMap={readyMap}
        hue={hue}
        isIdm={isIdm}
      />
    </div>
  );
}

/* ------------------- the zoom plate ------------------- */

/* the artwork at its full size — a fixed plate above everything,
   closed by Esc, the hand, or the backdrop; the four faces stay
   reachable inside so every image of the record can be studied */
function ZoomOverlay({
  t,
  open,
  onClose,
  entityId,
  displayName,
  role,
  setRole,
  readyMap,
  hue,
  isIdm,
}: {
  t: (s: string) => string;
  open: boolean;
  onClose: () => void;
  entityId: string;
  displayName: string;
  role: number;
  setRole: (n: number) => void;
  readyMap: Map<string, string>;
  hue?: number | null;
  isIdm: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setRole((role + 3) % 4);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setRole((role + 1) % 4);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, role, setRole]);

  if (!open) return null;

  const accent = hueAccent(hue);
  const file = isIdm ? undefined : readyMap.get(`${entityId}/${ROLE_KEYS[role]}`);
  const labels = isIdm
    ? [t("Entity"), t("Geometry"), t("Locus"), t("Voices")]
    : [t("Being"), t("World"), t("Technology"), t("Life")];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("The artwork enlarged")}
      data-testid="chronoscope-zoom-overlay"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[color-mix(in_srgb,var(--lp-deep)_97%,#080510)] p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        data-testid="chronoscope-zoom-close"
        aria-label={t("Close the enlarged artwork")}
        className="focus-glow absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border border-[var(--lp-edge)] bg-[color-mix(in_srgb,var(--lp-veil-solid)_70%,transparent)] text-[var(--lp-mute)] sm:right-5 sm:top-5"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <div
        className="flex max-h-full flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {file ? (
          <div
            data-testid="chronoscope-zoom-image"
            className="relative h-[min(72dvh,512px)] w-[min(92vw,768px)] overflow-hidden rounded-xl border"
            style={{ borderColor: `color-mix(in srgb, ${accent} 40%, var(--lp-edge))` }}
          >
            <Image
              key={`${entityId}/${ROLE_KEYS[role]}`}
              src={`/chronoscope/art/${file}`}
              alt={`${entityId} · ${displayName} · ${labels[role]}`}
              fill
              unoptimized
              sizes="768px"
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div
            className="flex h-[min(52dvh,380px)] w-[min(92vw,560px)] items-center justify-center rounded-xl border border-[var(--lp-edge)]"
            aria-hidden="true"
          >
            <div className="size-[46%]">
              <PendingPlate id={entityId} hue={hue} />
            </div>
          </div>
        )}

        <p className="mono-label mt-3 text-center text-[9px] uppercase tracking-[0.24em] text-[var(--lp-faint)]">
          {entityId} · {displayName} · {labels[role]}
          {!file && ` · ${t("artwork pending — awaiting its own illustration")}`}
        </p>

        {/* the four faces, reachable inside the plate */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {labels.map((label, i) => {
            const has = readyMap.has(`${entityId}/${ROLE_KEYS[i]}`);
            return (
              <button
                key={label}
                type="button"
                disabled={!has}
                onClick={() => setRole(i)}
                aria-pressed={role === i}
                className={cn(
                  "focus-glow min-h-[44px] rounded-full border px-4 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                  role === i ? "font-semibold" : "text-[var(--lp-mute)]"
                )}
                style={
                  role === i
                    ? {
                        borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
                        background: `color-mix(in srgb, ${accent} 10%, transparent)`,
                        color: "var(--lp-head)",
                      }
                    : { borderColor: "var(--lp-edge)" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* --------------------- the neighbour shells --------------------- */

function NeighbourShell({
  dir,
  navList,
  currentId,
  rows,
  idm,
  isIdm,
}: {
  dir: "left" | "right";
  navList: string[];
  currentId: string;
  rows: ChronoRow[];
  idm: IdmRecord[];
  isIdm: boolean;
}) {
  const at = navList.indexOf(currentId);
  const nextId = at === -1 ? null : navList[(at + (dir === "left" ? -1 : 1) + navList.length) % navList.length];
  if (!nextId) return null;
  const name = isIdm
    ? idm.find((e) => e.id === nextId)?.name
    : rows.find((r) => r.i === nextId)?.n;
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-[var(--lp-edge)] px-3 py-4 opacity-55",
        dir === "left" ? "text-right" : "text-left"
      )}
    >
      <p className="mono-label text-[8px] tracking-[0.16em] text-[var(--lp-faint)]">{nextId}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--lp-mute)]">{name}</p>
    </div>
  );
}

/* ------------------- the role's short context ------------------- */

function RoleContext({
  role,
  civ,
  idm,
  t,
}: {
  role: number;
  civ: CivRecord | null;
  idm: IdmRecord | null;
  t: (s: string) => string;
}) {
  if (idm) {
    const byRole = [
      idm.summary,
      idm.hyperGeometricAnatomy ?? idm.dimensionality,
      idm.phenomenologicalLocus,
      idm.phenomenologyAndEncounters,
    ];
    const text = byRole[role];
    if (!text) return null;
    return (
      <p className="mt-3 line-clamp-4 text-[13px] leading-[1.75] text-[var(--lp-body)]">
        {text}
      </p>
    );
  }
  if (!civ) return null;
  const vista = (civ.vista ?? {}) as Record<string, string>;
  const tech = (civ.tech ?? {}) as Record<string, unknown>;
  const biota = (civ.biota ?? {}) as Record<string, string>;
  const byRole = [
    civ.morph,
    vista.cap || vista.analysis || civ.society,
    (tech.sum as string) || undefined,
    biota.sum,
  ];
  const text = byRole[role];
  if (!text) return null;
  return (
    <p className="mt-3 line-clamp-4 text-[13px] leading-[1.75] text-[var(--lp-body)]">
      {text}
    </p>
  );
}

/* ------------------- the bounded details sheet ------------------- */

function DetailsSheet({
  t,
  civ,
  idm,
  accent,
  scrollRef,
  onClose,
}: {
  t: (s: string) => string;
  civ: CivRecord | null;
  idm: IdmRecord | null;
  accent: string;
  scrollRef: React.MutableRefObject<number>;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sheetRef.current;
    if (el) el.scrollTop = scrollRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (el) scrollRef.current = el.scrollTop;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, scrollRef]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-auto z-[90] flex max-h-[86dvh] items-stretch justify-center sm:items-end"
      role="dialog"
      aria-modal="true"
      aria-label={t("The full record")}
      data-testid="chronoscope-details-sheet"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-[880px] overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 bg-[color-mix(in_srgb,var(--lp-deep)_97%,transparent)] px-4 pb-8 pt-3 shadow-[0_-20px_60px_-30px_rgba(10,6,24,0.6)] sm:rounded-3xl sm:px-6"
        style={{ borderColor: `color-mix(in srgb, ${accent} 30%, var(--lp-edge))` }}
      >
        <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between gap-2 bg-[color-mix(in_srgb,var(--lp-deep)_97%,transparent)] px-4 pb-2 pt-1 sm:-mx-6 sm:px-6">
          <p className="mono-label text-[9px] tracking-[0.2em]" style={{ color: accent }}>
            {idm?.id ?? civ?.i} · {t("THE FULL RECORD")}
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="chronoscope-details-close"
            aria-label={t("Close the record")}
            className="focus-glow flex size-11 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {idm && (
          <div className="space-y-5 pb-2">
            <Prose title={t("Summary")} body={idm.summary} />
            <FieldGrid
              rows={[
                [t("Classification"), idm.classification],
                [t("Dimensionality"), idm.dimensionality],
                [t("Resonance substrate"), idm.resonanceSubstrate],
                [t("Phenomenological locus"), idm.phenomenologicalLocus],
                [t("Communication mode"), idm.communicationMode],
                [t("Ontological stability"), idm.ontologicalStability],
              ]}
            />
            <Prose title={t("Phenomenology & encounters")} body={idm.phenomenologyAndEncounters} />
            <Prose title={t("Hyper-geometric anatomy")} body={idm.hyperGeometricAnatomy} />
            <Prose title={t("Cognitive impact & messages")} body={idm.cognitiveImpactAndMessages} />
            {idm.archivalQuote && (
              <QuoteBlock text={idm.archivalQuote} source={idm.quoteAttribution} />
            )}
          </div>
        )}

        {civ && (
          <div className="space-y-5 pb-2">
            <Prose title={t("Overview")} body={civ.thesis} />
            <FieldGrid
              rows={[
                [t("Star system"), civ.star],
                [t("Sector"), civ.sector],
                [t("Coordinates"), civ.coords],
                [t("Distance"), typeof civ.d === "number" ? `${fmt(civ.d)} LY` : (civ.d ?? undefined) as string | undefined],
                [t("Homeworld"), civ.home],
                [t("Kinship"), civ.kinship],
                [t("Development"), civ.kard],
                [t("Biochemistry"), civ.bio],
                [t("Morphology"), civ.morph],
                [t("Gravity"), civ.g != null ? `${civ.g} g` : undefined],
                [t("Atmosphere"), civ.atm],
                [t("Governance"), civ.gov],
                [t("Communication"), civ.comm],
                [t("Population"), civ.pop],
                [t("Catalogued"), civ.year ? String(civ.year) : undefined],
              ]}
            />
            <Prose title={t("Society & architecture")} body={civ.society} />
            <Prose title={t("Chronicle")} body={civ.chron} />
            <Prose title={t("Anatomy & integration")} body={civ.anat} />
            <TechPanel civ={civ} t={t} />
            <BiotaPanel civ={civ} t={t} />
            <VistaPanel civ={civ} t={t} />
            {civ.q?.t && <QuoteBlock text={civ.q.t} source={civ.q.s} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Prose({ title, body }: { title: string; body?: string | null }) {
  if (!body) return null;
  return (
    <section>
      <h4 className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--lp-violet-bright)]">
        {title}
      </h4>
      <p className="mt-1.5 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{body}</p>
    </section>
  );
}

function FieldGrid({ rows }: { rows: [string, string | undefined][] }) {
  const clean = rows.filter(([, v]) => v && String(v).trim());
  if (clean.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-4 sm:grid-cols-2">
      {clean.map(([label, val]) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt className="mono-label w-[112px] shrink-0 text-[8.5px] uppercase tracking-[0.14em] text-[var(--lp-faint)]">
            {label}
          </dt>
          <dd className="min-w-0 flex-1 text-[12.5px] leading-snug text-[var(--lp-body)]">{val}</dd>
        </div>
      ))}
    </dl>
  );
}

function TechPanel({ civ, t }: { civ: CivRecord; t: (s: string) => string }) {
  const tech = (civ.tech ?? {}) as Record<string, string>;
  const metrics = (civ.tech?.metrics ?? {}) as Record<string, number>;
  if (!tech.name) return null;
  return (
    <section>
      <h4 className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--lp-violet-bright)]">
        {t("Signature technology")} · {tech.id}
      </h4>
      <p className="mt-1.5 font-[family-name:Cinzel] text-[15px] font-semibold text-[var(--lp-head)]">
        {tech.name}
      </p>
      {tech.sum && <p className="mt-1.5 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{tech.sum}</p>}
      {tech.mech && (
        <p className="mt-2 text-[13px] leading-[1.8] text-[var(--lp-body-soft)]">
          <span className="mono-label mr-2 text-[9px] uppercase tracking-[0.2em] text-[var(--lp-violet-bright)]">
            {t("Mechanism")}
          </span>
          {tech.mech}
        </p>
      )}
      <div className="mt-3">
        <FieldGrid
          rows={[
            [t("Domain"), tech.domain],
            [t("Energy output"), tech.energy],
            [t("Frequency"), tech.freq],
            [t("Materials"), tech.mat],
            [t("Schematic"), tech.schem],
          ]}
        />
      </div>
      {Object.keys(metrics).length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {Object.entries(metrics).map(([label, val]) => (
            <div key={label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] text-[var(--lp-mute)]">{label}</span>
                <span className="mono-label text-[10px] text-[var(--lp-head)]">{val}</span>
              </div>
              <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[var(--lp-edge)]">
                <div
                  className="h-full rounded-full bg-[color-mix(in_srgb,var(--lp-violet)_76%,var(--lp-gold))]"
                  style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {tech.notes && (
        <p className="mt-2 text-[12.5px] italic leading-relaxed text-[var(--lp-mute)]">{tech.notes}</p>
      )}
    </section>
  );
}

function BiotaPanel({ civ, t }: { civ: CivRecord; t: (s: string) => string }) {
  const b = (civ.biota ?? {}) as Record<string, string>;
  if (!b.name) return null;
  return (
    <section>
      <h4 className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--lp-violet-bright)]">
        {t("Native life")} · {b.id}
      </h4>
      <p className="mt-1.5 font-[family-name:Cinzel] text-[15px] font-semibold text-[var(--lp-head)]">
        {b.name}
        {b.sci ? <span className="ml-2 font-[family-name:var(--font-literata)] text-[12.5px] italic text-[var(--lp-gold)]">{b.sci}</span> : null}
      </p>
      {b.sum && <p className="mt-1.5 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{b.sum}</p>}
      <div className="mt-3">
        <FieldGrid
          rows={[
            [t("Kingdom"), b.kingdom],
            [t("Trophic method"), b.trophic],
            [t("Typical scale"), b.scale],
            [t("Bioluminescence"), b.lum],
            [t("Anatomy"), b.anat],
          ]}
        />
      </div>
      {b.eco && <p className="mt-2 text-[13px] leading-[1.8] text-[var(--lp-body-soft)]">{b.eco}</p>}
      {b.sym && <p className="mt-2 text-[13px] leading-[1.8] text-[var(--lp-body-soft)]">{b.sym}</p>}
    </section>
  );
}

function VistaPanel({ civ, t }: { civ: CivRecord; t: (s: string) => string }) {
  const v = (civ.vista ?? {}) as Record<string, string>;
  if (!v.title) return null;
  return (
    <section>
      <h4 className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--lp-violet-bright)]">
        {t("Homeworld vista")} · {v.id}
      </h4>
      <p className="mt-1.5 font-[family-name:Cinzel] text-[15px] font-semibold text-[var(--lp-head)]">
        {v.title}
      </p>
      {v.cap && <p className="mt-1.5 text-[13.5px] leading-[1.8] text-[var(--lp-body)]">{v.cap}</p>}
      <div className="mt-3">
        <FieldGrid
          rows={[
            [t("Location"), v.loc],
            [t("Architecture"), v.style],
            [t("Elevation / orbit"), v.elev],
            [t("Density"), v.dens],
            [t("Star spectrum"), v.starSpec],
          ]}
        />
      </div>
      {v.analysis && <p className="mt-2 text-[13px] leading-[1.8] text-[var(--lp-body-soft)]">{v.analysis}</p>}
      {v.sensory && <p className="mt-2 text-[13px] italic leading-[1.8] text-[var(--lp-mute)]">{v.sensory}</p>}
    </section>
  );
}

function QuoteBlock({ text, source }: { text?: string; source?: string }) {
  if (!text) return null;
  return (
    <blockquote className="rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-5">
      <p className="font-[family-name:var(--font-literata)] text-[15px] italic leading-relaxed text-[var(--lp-head)]">
        “{text}”
      </p>
      {source && (
        <cite className="mono-label mt-2 block text-[9px] not-italic uppercase tracking-[0.2em] text-[var(--lp-faint)]">
          — {source}
        </cite>
      )}
    </blockquote>
  );
}
