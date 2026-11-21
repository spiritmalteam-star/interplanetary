"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleX, Download, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { cancelDownloadWork, useDownloadWorks, type DownloadWork } from "@/lib/download-works";

/* ------------------------------------------------------------------ */
/*  THE DOWNLOADS TRAY — every work set in motion stands here until    */
/*  it lands, with its own honest progress and its own cancel hand.    */
/*  The tray rides above every room (portal included) so a download    */
/*  is never out of sight, and only the visitor's own hand can stop    */
/*  it. Navigation never interrupts a work — the works live above the  */
/*  rooms, outside them all.                                           */
/* ------------------------------------------------------------------ */

function WorkRow({ work, t }: { work: DownloadWork; t: (s: string) => string }) {
  const done = work.state === "done";
  const failed = work.state === "failed";
  const cancelled = work.state === "cancelled";
  const settled = done || failed || cancelled;
  const indeterminate = work.progress < 0;
  return (
    <div
      data-testid={`dl-work-${work.id}`}
      className={cn(
        "rounded-[14px] border px-3 py-2.5",
        failed || cancelled
          ? "border-[#b45309]/45 bg-[#fdf1e7]/95"
          : "border-[#e4d9bd] bg-white/95"
      )}
    >
      <div className="flex items-center gap-2.5">
        {work.state === "running" ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-[#a16207]" aria-hidden="true" />
        ) : (
          <Download
            className={cn(
              "size-4 shrink-0",
              done ? "text-[#0d9488]" : "text-[#b45309]"
            )}
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-[#3d3428]">{work.label}</p>
          <p className="truncate text-[10.5px] text-[#7c715f]">
            {failed
              ? t("Interrupted — the sky took it. Ask again and the press will retry.")
              : cancelled
                ? t("Cancelled by your hand.")
                : done
                  ? t("Landed — the file is yours.")
                  : work.stage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => cancelDownloadWork(work.id)}
          aria-label={t("Cancel this download")}
          title={t("Cancel this download")}
          data-testid={`dl-cancel-${work.id}`}
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-[#7c715f] transition-colors duration-300 hover:bg-[#f2e7cd] hover:text-[#8a6f46]"
        >
          <CircleX className="size-4" aria-hidden="true" />
        </button>
      </div>
      {work.state === "running" && (
        <div className="mt-2">
          <div
            role="progressbar"
            aria-label={t("Download progress")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={indeterminate ? undefined : work.progress}
            className="h-1 w-full overflow-hidden rounded-full bg-[#efe6d2]"
          >
            <div
              className={cn(
                "h-full rounded-full bg-[#a16207] transition-all duration-300",
                indeterminate && "dl-pulse w-1/3"
              )}
              style={indeterminate ? undefined : { width: `${Math.max(3, work.progress)}%` }}
            />
          </div>
          {!indeterminate && (
            <p className="mt-1 text-right text-[9.5px] font-semibold text-[#a2947c]">
              {work.progress}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DownloadWorksTray() {
  const t = useT();
  const works = useDownloadWorks();
  const visible = works.filter((w) => w.state === "running" || w.state === "failed");
  if (typeof document === "undefined") return null;
  return (
    <AnimatePresence>
      {visible.length > 0 && (
        <motion.aside
          key="download-works-tray"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label={t("Downloads in motion")}
          data-testid="download-works-tray"
          className="pointer-events-auto fixed bottom-3 left-3 z-[95] w-[290px] max-w-[calc(100vw-24px)] sm:bottom-4 sm:left-4 sm:w-[320px]"
        >
          <div className="flex flex-col gap-2">
            {visible.slice(0, 4).map((w) => (
              <WorkRow key={w.id} work={w} t={t} />
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
