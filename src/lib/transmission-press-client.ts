"use client";

/* ------------------------------------------------------------------ */
/*  transmission-press-client.ts — the visitor's hand for the           */
/*  works-in-motion transmission presses (Evolve Med, ParticleX).       */
/*                                                                     */
/*  THE LAW: the press is a download work. It lives in the downloads   */
/*  registry — above every room — so walking away, folding a panel,    */
/*  even closing the dialog never interrupts it. It speaks its stage   */
/*  and progress into the tray, and only the visitor's own cancel      */
/*  hand stops the watch (the press itself carries on server-side and  */
/*  rests the finished ink in the Library).                            */
/* ------------------------------------------------------------------ */

import {
  resilientFetch,
  resilientFetchBlob,
  saveBlob,
  startDownloadWork,
} from "@/lib/download-works";

export interface PressTransmissionOptions {
  /** the press door — "/api/evolve-med/pdf" or "/api/particlex/pdf" */
  endpoint: string;
  /** the tray's own name for the work */
  label: string;
  /** the thread and settings (mode:"job" is added here) */
  body: Record<string, unknown>;
  /** a quiet line under the dialog's lever, spoken while it walks */
  onNote?: (note: string | null) => void;
  /** the longest the watch will stand — then the honest word */
  maxWaitMs?: number;
}

interface ProcessJobLite {
  id: string;
  status: string;
  progress: number;
  stage: string | null;
  error: string | null;
  result: Record<string, unknown> | null;
}

const POLL_MS = 3000;

/** THE PRESS — job mode, polled, then handed to the visitor's device.
    Returns the filename the PDF was saved under. Throws a plain Error
    when the press fails (the caller speaks); a cancel throws an
    AbortError the caller may simply let rest. */
export async function pressTransmissionPdf(
  options: PressTransmissionOptions
): Promise<{ filename: string; libraryId: string | null }> {
  const { endpoint, label, body, onNote, maxWaitMs = 8 * 60 * 1000 } = options;

  return startDownloadWork(label, async (report) => {
    onNote?.(null);
    report.stage("Opening the press…");

    /* ---------- the job opens at once ---------- */
    const res = await resilientFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, mode: "job" }),
    });
    const data = (await res.json().catch(() => null)) as {
      id?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.id) {
      throw new Error(data?.error || "The transmission stayed quiet — rest, then press again.");
    }
    const jobId = data.id;
    report.progress(4);
    onNote?.(
      "The press continues even if you walk away — find it under Profile → Works in Motion. When it lands, the transmission rests in your Library."
    );

    /* ---------- the watch — the work speaks its own walk ---------- */
    const startedAt = Date.now();
    let done: { libraryId: string | null; filename: string } | null = null;
    let failure: string | null = null;

    while (!done && !failure) {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, POLL_MS);
        const onAbort = () => {
          window.clearTimeout(timer);
          reject(new DOMException("cancelled", "AbortError"));
        };
        if (report.signal.aborted) {
          window.clearTimeout(timer);
          reject(new DOMException("cancelled", "AbortError"));
          return;
        }
        report.signal.addEventListener("abort", onAbort, { once: true });
        window.setTimeout(() => report.signal.removeEventListener("abort", onAbort), POLL_MS + 60);
      });
      if (Date.now() - startedAt > maxWaitMs) {
        failure =
          "The press is taking longer than the watch can stand — it carries on in the hall, and the transmission will rest in your Library when it lands.";
        break;
      }
      try {
        const poll = await fetch("/api/processes", { cache: "no-store" });
        const data2 = (await poll.json().catch(() => null)) as {
          jobs?: ProcessJobLite[];
        } | null;
        const mine = data2?.jobs?.find((j) => j.id === jobId);
        if (!mine) continue;
        report.progress(Math.max(4, mine.progress));
        if (mine.stage) report.stage(mine.stage);
        if (mine.status === "done") {
          const result = mine.result ?? {};
          done = {
            libraryId:
              typeof result.libraryId === "string" ? result.libraryId : null,
            filename:
              typeof result.filename === "string"
                ? result.filename
                : `transmission-${Date.now()}.pdf`,
          };
        } else if (mine.status === "failed") {
          failure = mine.error || "The transmission stayed quiet — rest, then press again.";
        }
      } catch {
        /* a quiet tick missed — the next one carries the watch */
      }
    }

    if (failure) throw new Error(failure);
    if (!done) throw new Error("The transmission stayed quiet — rest, then press again.");

    /* ---------- the hand-over ---------- */
    if (done.libraryId) {
      report.stage("Carrying the ink to your hands…");
      try {
        const lib = await resilientFetch("/api/library");
        const libData = (await lib.json().catch(() => null)) as {
          entries?: {
            id: string;
            content?: { pdf?: string; filename?: string } | null;
          }[] | null;
        } | null;
        const entry = libData?.entries?.find((e) => e.id === done!.libraryId);
        const b64 = entry?.content?.pdf;
        if (b64) {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          saveBlob(new Blob([bytes], { type: "application/pdf" }), done.filename);
          return { filename: done.filename, libraryId: done.libraryId };
        }
      } catch {
        /* the shelf stumble falls through to the direct press below */
      }
    }

    /* THE DIRECT FALLBACK — the job finished but its ink could not be
       read from the shelf: press it once more in the quick hand, now
       streamed and retried, so the visitor still holds their file. */
    report.stage("Pressing once more — the quick hand…");
    const blob = await resilientFetchBlob(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      onProgress: (percent) => {
        if (percent >= 0) report.progress(percent);
      },
      signal: report.signal,
      retries: 1,
    });
    saveBlob(blob, done.filename);
    return { filename: done.filename, libraryId: done.libraryId };
  });
}
