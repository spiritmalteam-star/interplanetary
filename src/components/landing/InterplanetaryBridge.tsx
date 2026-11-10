"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, Maximize2, Orbit, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BiotaPanel,
  FieldGrid,
  Prose,
  TechPanel,
  VistaPanel,
  type CivRecord,
} from "./Chronoscope";

/* ------------------------------------------------------------------ */
/*  THE INTERPLANETARY BRIDGE — the scopes' interplanetary field       */
/*  crossed into the codex (the owner's word): a lane between the      */
/*  archive's charted worlds, hanging at the chronoscope's top-left    */
/*  corner. Every station is a fully-illustrated profile; every        */
/*  station carries its own contexts — the being, the homeworld, the   */
/*  technology, the life — and a DOUBLE-TOUCH on a context unfolds     */
/*  its full story (a single touch on the small unfold hand walks the  */
/*  same road, for the phone and the keyboard). The bridge speaks the  */
/*  chronoscope's own language — the veil, the hairlines, Cinzel's     */
/*  crown, the mono labels — so it reads as the codex's own            */
/*  instrument, and it stands as an overlay: unmounted it is nothing,  */
/*  open it never moves the featured profile one hair.                 */
/*                                                                     */
/*  CALM LAWS: static lane, transform-and-opacity motion only, one     */
/*  record decodes at a time, reduced motion is a law not a wish.      */
/*  THE DATA LAW: the stations' records live in a state-held cache —   */
/*  the render reads the state, the effect only fills it from outside  */
/*  the render (every write rides a promise callback), so no ref is    */
/*  ever read while painting and no state ever walks sideways.         */
/* ------------------------------------------------------------------ */

type BridgeStation = { id: string; name: string; hue: number | null };
type ContextKey = "being" | "world" | "technology" | "life";

const CONTEXT_ORDER: ContextKey[] = ["being", "world", "technology", "life"];

function hueAccent(hue: number | null | undefined) {
  const h = typeof hue === "number" ? ((hue % 360) + 360) % 360 : 190;
  return `hsl(${h} 45% 62%)`;
}

export default function InterplanetaryBridge({
  onClose,
  t,
  stations,
  getRecord,
  getArt,
}: {
  onClose: () => void;
  t: (s: string) => string;
  stations: BridgeStation[];
  getRecord: (id: string) => Promise<CivRecord | null>;
  getArt: (id: string) => string | undefined;
}) {
  /* the lane opens on its first charted world — the initial state IS
     the opening, no effect needs to push it */
  const [stationId, setStationId] = useState<string | null>(
    () => stations[0]?.id ?? null
  );
  const [context, setContext] = useState<ContextKey | null>(null);
  /* the stations' own cache — state, not a ref: the render may read
     it, and every fill rides a promise callback from outside */
  const [cache, setCache] = useState<Map<string, CivRecord | null>>(
    () => new Map()
  );
  const panelRef = useRef<HTMLDivElement | null>(null);

  const record =
    stationId != null ? (cache.get(stationId) ?? null) : null;
  const loading = stationId != null && !cache.has(stationId);

  /* the station's record fills the cache from outside the render —
     every state write rides inside a promise callback, never in the
     effect's own body */
  useEffect(() => {
    if (stationId == null) return;
    if (cache.has(stationId)) return;
    let alive = true;
    getRecord(stationId).then((rec) => {
      if (!alive) return;
      setCache((prev) => {
        const next = new Map(prev);
        next.set(stationId, rec);
        return next;
      });
    });
    return () => {
      alive = false;
    };
  }, [stationId, cache, getRecord]);

  /* Esc folds the context sheet first, then the bridge; the body
     rests still while the lane stands open */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (context) setContext(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [context, onClose]);

  /* the chosen station glides to the lane's center */
  useEffect(() => {
    if (!stationId) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = panelRef.current?.querySelector<HTMLButtonElement>(
      '[data-testid="bridge-station"][aria-pressed="true"]'
    );
    el?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [stationId]);

  const pickStation = useCallback((id: string) => {
    setStationId(id);
    setContext(null);
  }, []);

  const station = stations.find((s) => s.id === stationId) ?? null;
  const artFile = stationId ? getArt(stationId) : undefined;
  const accent = hueAccent(record?.hue);

  const tech = (record?.tech ?? {}) as Record<string, string>;
  const biota = (record?.biota ?? {}) as Record<string, string>;
  const vista = (record?.vista ?? {}) as Record<string, string>;

  /* the station's own contexts — each name a door, a double-touch
     opens it (the small unfold hand opens it for the phone) */
  const contexts: {
    key: ContextKey;
    label: string;
    name?: string;
    ready: boolean;
  }[] = [
    {
      key: "being",
      label: t("The being"),
      name: record?.kinship ?? record?.morph,
      ready: Boolean(record?.morph || record?.anat || record?.bio),
    },
    {
      key: "world",
      label: t("The homeworld"),
      name: record?.home ?? vista.title,
      ready: Boolean(record?.home || vista.title || record?.society),
    },
    {
      key: "technology",
      label: t("The technology"),
      name: tech.name,
      ready: Boolean(tech.name),
    },
    {
      key: "life",
      label: t("The life"),
      name: biota.name,
      ready: Boolean(biota.name),
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[76]" data-testid="interplanetary-bridge">
      {/* the veil — one touch anywhere lays the bridge down */}
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,#0d0a16_58%,transparent)]"
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("The Interplanetary Bridge")}
        className="absolute left-2 top-2 flex max-h-[calc(100dvh-1rem)] w-[min(96vw,540px)] flex-col overflow-hidden rounded-3xl border shadow-[0_30px_90px_-30px_rgba(6,10,20,0.75)] sm:left-5 sm:top-5"
        style={{
          borderColor: "color-mix(in srgb, #22d3ee 34%, var(--lp-edge))",
          background: "color-mix(in srgb, var(--lp-deep) 97%, #0d0a16)",
        }}
      >
        {/* ---------------- the head ---------------- */}
        <header
          className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3"
          style={{ borderColor: "color-mix(in srgb, #22d3ee 22%, var(--lp-edge))" }}
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: "color-mix(in srgb, #22d3ee 44%, transparent)",
              background: "color-mix(in srgb, #22d3ee 10%, transparent)",
            }}
            aria-hidden="true"
          >
            <Orbit className="size-4" style={{ color: "#67e8f9" }} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-[family-name:var(--font-cinzel)] text-[15px] font-semibold tracking-wide text-[var(--lp-head)]">
              {t("The Interplanetary Bridge")}
            </h3>
            <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-[var(--lp-faint)]">
              {stations.length} {t("charted worlds on the lane")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="bridge-close"
            aria-label={t("Close the bridge")}
            className="focus-glow flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        {/* ---------------- the lane ---------------- */}
        {/* the stations' own strip — every charted world one orbit-mark,
            the chosen one lit from within; the strip scrolls, the page
            beneath never does */}
        <div
          className="nice-scroll relative shrink-0 overflow-x-auto px-4 py-3"
          data-testid="bridge-lane"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-1/2 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, #22d3ee 30%, transparent) 12%, color-mix(in srgb, #22d3ee 30%, transparent) 88%, transparent)",
            }}
          />
          <div className="relative flex gap-2.5">
            {stations.map((s) => {
              const selected = s.id === stationId;
              const hue = hueAccent(s.hue);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickStation(s.id)}
                  aria-pressed={selected}
                  title={`${s.id} · ${s.name}`}
                  data-testid="bridge-station"
                  className="group flex w-[64px] shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border transition-all duration-200",
                      !selected && "group-hover:scale-105"
                    )}
                    style={
                      selected
                        ? {
                            borderColor: "#22d3ee",
                            boxShadow:
                              "0 0 16px 0 color-mix(in srgb, #22d3ee 45%, transparent)",
                            background:
                              "color-mix(in srgb, #22d3ee 14%, transparent)",
                          }
                        : {
                            borderColor: `color-mix(in srgb, ${hue} 42%, transparent)`,
                            background: `color-mix(in srgb, ${hue} 8%, transparent)`,
                          }
                    }
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor: selected ? "#22d3ee" : hue,
                        boxShadow: `0 0 8px 0 color-mix(in srgb, ${
                          selected ? "#22d3ee" : hue
                        } 70%, transparent)`,
                      }}
                    />
                  </span>
                  <span
                    className={cn(
                      "w-full truncate text-center text-[8.5px] tracking-wide",
                      selected
                        ? "text-[var(--lp-head)]"
                        : "text-[var(--lp-faint)]"
                    )}
                  >
                    {s.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- the dossier ---------------- */}
        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-5">
          {loading || !record ? (
            <p className="mono-label py-8 text-center text-[9px] uppercase tracking-[0.24em] text-[var(--lp-faint)]">
              {t("the record is arriving…")}
            </p>
          ) : context === null ? (
            /* -------- the station's own dossier -------- */
            <div className="chrono-swap" data-testid="bridge-dossier">
              <p className="mono-label text-[9px] tracking-[0.2em]" style={{ color: accent }}>
                {record.i}
              </p>
              <h4 className="mt-1 font-[family-name:var(--font-cinzel)] text-[19px] font-semibold leading-tight tracking-wide text-[var(--lp-head)]">
                {record.n}
              </h4>
              {record.e && (
                <p className="mt-0.5 text-[12.5px] italic leading-snug text-[var(--lp-gold)]">
                  {record.e}
                </p>
              )}

              {/* the station's own artwork — small, honest, its own */}
              {artFile && (
                <div
                  className="relative mt-3 aspect-[3/2] w-full overflow-hidden rounded-xl border"
                  style={{
                    borderColor: `color-mix(in srgb, ${accent} 30%, var(--lp-edge))`,
                    background: "color-mix(in srgb, var(--lp-deep) 88%, #0d0a16)",
                  }}
                >
                  <Image
                    src={`/chronoscope/art/${artFile}`}
                    alt={`${record.i} — ${record.n}`}
                    fill
                    unoptimized
                    sizes="500px"
                    className="object-cover"
                  />
                </div>
              )}

              <p className="mt-4 text-[12px] leading-relaxed text-[var(--lp-mute)]">
                {t("Double-touch a context to unfold its full story.")}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {CONTEXT_ORDER.map((key) => {
                  const c = contexts.find((x) => x.key === key)!;
                  return (
                    <div
                      key={c.key}
                      onDoubleClick={() => c.ready && setContext(c.key)}
                      data-testid={`bridge-context-${c.key}`}
                      className="rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-3 transition-colors"
                    >
                      <p
                        className="mono-label text-[8.5px] uppercase tracking-[0.18em]"
                        style={{ color: "#67e8f9" }}
                      >
                        {c.label}
                      </p>
                      <p className="mt-1 line-clamp-2 min-h-[2.4em] break-words text-[13px] font-medium leading-snug text-[var(--lp-head)]">
                        {c.name ?? "—"}
                      </p>
                      <button
                        type="button"
                        disabled={!c.ready}
                        onClick={() => setContext(c.key)}
                        aria-label={`${c.label} — ${t("Unfold")}`}
                        className="focus-glow mt-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-[10.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          borderColor:
                            "color-mix(in srgb, #22d3ee 38%, transparent)",
                          color: "#67e8f9",
                        }}
                      >
                        <Maximize2 className="size-3" aria-hidden="true" />
                        {t("Unfold")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* -------- the context's own story -------- */
            <div className="chrono-swap" data-testid="bridge-context-sheet">
              <button
                type="button"
                onClick={() => setContext(null)}
                data-testid="bridge-context-back"
                className="focus-glow mb-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--lp-edge)] px-3 text-[12px] text-[var(--lp-mute)] transition-colors hover:text-[var(--lp-head)]"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                {t("Back to the bridge")}
              </button>
              {context === "being" && (
                <div className="space-y-4">
                  <Prose title={t("Morphology")} body={record.morph} />
                  <Prose title={t("Biochemistry")} body={record.bio} />
                  <Prose
                    title={t("Anatomy & integration")}
                    body={record.anat}
                  />
                </div>
              )}
              {context === "world" && (
                <div className="space-y-4">
                  <FieldGrid
                    rows={[
                      [t("Star system"), record.star],
                      [t("Homeworld"), record.home],
                      [t("Sector"), record.sector],
                      [
                        t("Distance"),
                        typeof record.d === "number"
                          ? `${record.d.toLocaleString("en-US")} LY`
                          : (record.d ?? undefined) as string | undefined,
                      ],
                      [
                        t("Gravity"),
                        record.g != null ? `${record.g} g` : undefined,
                      ],
                      [t("Atmosphere"), record.atm],
                    ]}
                  />
                  <VistaPanel civ={record} t={t} />
                  <Prose
                    title={t("Society & architecture")}
                    body={record.society}
                  />
                </div>
              )}
              {context === "technology" && <TechPanel civ={record} t={t} />}
              {context === "life" && <BiotaPanel civ={record} t={t} />}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
