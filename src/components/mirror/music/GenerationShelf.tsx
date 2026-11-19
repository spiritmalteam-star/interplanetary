"use client";

/* ------------------------------------------------------------------ */
/*  THE GENERATION SHELF — every generation ever paid for, kept.       */
/*                                                                     */
/*  One card per job, named for what it is ("3 of 6 ready"): every     */
/*  landed song plays from the shelf, a failed track speaks its own    */
/*  honest line, and the continue action brings a partial or failed    */
/*  set back to life — only the songs not already held are charged.    */
/* ------------------------------------------------------------------ */

import { RefreshCw, X, Play, AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ShelfJob, ShelfTrack } from "./shelf-client";

interface Props {
  jobs: ShelfJob[];
  loading: boolean;
  activeJobId: string | null;
  onPlay: (job: ShelfJob, track: ShelfTrack) => void;
  onResume: (jobId: string) => void;
  onHide: (jobId: string) => void;
  onRefresh: () => void;
}

function statusLine(job: ShelfJob): string {
  const ready = job.readyCount;
  const total = job.trackCount;
  if (job.status === "ready" && ready === total) return `${ready} of ${total} ready`;
  if (job.status === "failed") return `0 of ${total} ready`;
  return `${ready} of ${total} ready`;
}

export default function GenerationShelf({
  jobs,
  loading,
  activeJobId,
  onPlay,
  onResume,
  onHide,
  onRefresh,
}: Props) {
  const t = useT();

  return (
    <section
      aria-label={t("The generation shelf")}
      data-testid="lc-generation-shelf"
      className="nice-scroll max-h-[420px] space-y-2.5 overflow-y-auto pr-1"
    >
      <div className="flex items-center justify-between">
        <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("The generation shelf")}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          data-testid="lc-shelf-refresh"
          className="focus-glow flex h-7 items-center gap-1.5 rounded-full border hairline px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} aria-hidden="true" />
          {t("Refresh")}
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border hairline bg-[var(--glass-bg-soft)]" />
          ))}
        </div>
      ) : null}

      {!loading && jobs.length === 0 ? (
        <p className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-4 text-center text-[12.5px] text-muted-foreground">
          {t("The shelf stands empty — every generation you keep will rest here, song by song.")}
        </p>
      ) : null}

      {jobs.map((job) => {
        const active = job.id === activeJobId;
        return (
          <article
            key={job.id}
            data-testid="lc-shelf-job"
            className={cn(
              "rounded-xl border bg-[var(--glass-bg-soft)] p-3 transition-colors",
              active
                ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)]"
                : "hairline"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/80">
                  {t("Songs")} · {statusLine(job)}
                  {active ? ` · ${t("weaving")}` : ""}
                </p>
                {job.intention ? (
                  <p className="mt-0.5 truncate text-[12.5px] text-foreground/85">
                    {job.intention}
                  </p>
                ) : (
                  <p className="mt-0.5 truncate text-[12.5px] text-foreground/85">
                    {t(job.mode)}
                  </p>
                )}
                <p className="mono-label mt-0.5 text-[8px] tracking-[0.14em] text-muted-foreground/60">
                  {new Date(job.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onHide(job.id)}
                aria-label={t("Hide this generation")}
                className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            <ul className="mt-2 space-y-1">
              {job.tracks.map((track) => (
                <li
                  key={track.id}
                  data-testid={`lc-shelf-track-${track.status}`}
                  className="flex items-center gap-2 rounded-lg border hairline bg-[var(--glass-bg)] px-2.5 py-1.5"
                >
                  {track.status === "ready" && track.audioUrl ? (
                    <button
                      type="button"
                      onClick={() => onPlay(job, track)}
                      aria-label={`${t("Play")} ${track.title ?? `take ${track.index + 1}`}`}
                      className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all hover:text-foreground"
                    >
                      <Play className="size-2.5 translate-x-[1px]" aria-hidden="true" />
                    </button>
                  ) : (
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground/50"
                      aria-hidden="true"
                    >
                      {track.status === "failed" ? (
                        <AlertTriangle className="size-2.5" />
                      ) : (
                        <span className="size-1.5 animate-pulse rounded-full bg-[var(--scope-a)] motion-reduce:animate-none" />
                      )}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-foreground/85">
                      {track.title ?? `${t("Take")} ${track.index + 1}`}
                    </span>
                    {track.status === "failed" && track.error ? (
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {track.error}
                      </span>
                    ) : (
                      <span className="mono-label block text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">
                        {track.status === "ready"
                          ? t("ready")
                          : track.status === "failed"
                            ? t("failed")
                            : t("weaving")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {job.pendingCount === 0 && (job.status === "partial" || job.status === "failed") ? (
              <button
                type="button"
                onClick={() => onResume(job.id)}
                data-testid="lc-shelf-resume"
                className="focus-glow mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-full border text-[12px] text-[var(--scope-a)] transition-all hover:glow-sm"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 45%, transparent)",
                }}
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                {t("Continue the set")}
                <span className="text-muted-foreground">
                  · {t("only the songs not already held are charged")}
                </span>
              </button>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
