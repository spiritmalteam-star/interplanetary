import { db } from "@/lib/db";
import { saveLibrary } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  THE TRANSMISSION PRESS — shared works-in-motion machinery for the  */
/*  quick-transmission PDF doors (Evolve Med, ParticleX).              */
/*                                                                     */
/*  THE LAW: a press that takes minutes never holds a response. The    */
/*  door opens a ProcessJob, answers at once, and the press walks      */
/*  behind the response — speaking its progress at every movement,     */
/*  and resting the finished ink on the Library's own shelf. A closed  */
/*  tab, a folded panel, a walked-away visitor: none of it interrupts  */
/*  the press; the PDF waits in the Library for whenever they return.  */
/* ------------------------------------------------------------------ */

export interface TransmissionPressOutput {
  title: string;
  filename: string;
  pdf: Uint8Array;
}

/** One honest movement spoken into the hall. */
export async function sayJob(
  jobId: string,
  patch: { progress?: number; stage?: string; status?: string; error?: string; result?: unknown }
): Promise<void> {
  try {
    await db.processJob.update({
      where: { id: jobId },
      data: {
        ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
        ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.error !== undefined ? { error: patch.error } : {}),
        ...(patch.result !== undefined ? { result: JSON.stringify(patch.result) } : {}),
      },
    });
  } catch {
    /* the hall may rest — the press itself never stops for it */
  }
}

/** Runs a transmission press job from its stored input to a finished,
    shelved PDF. The `press` closure carries the route's own LLM and
    render logic; this helper carries the hall's law around it. */
export async function runTransmissionJob(
  jobId: string,
  options: {
    /** the job kind this runner owns — guards against a reused row */
    kind: string;
    /** the Library sector the finished ink rests in */
    sector: "observatory" | "manifest" | "invent" | "dreambook" | "quantum" | "evolvemed" | "artx";
    /** the library content kind ("em-pdf" | "px-pdf") */
    libraryKind: string;
    /** rebuild the press from the job's stored input (already parsed) */
    press: () => Promise<TransmissionPressOutput>;
  }
): Promise<void> {
  let job;
  try {
    job = await db.processJob.findUnique({ where: { id: jobId } });
  } catch {
    return; /* no hall, no press */
  }
  if (!job || job.kind !== options.kind) return;
  if (job.status === "done") return;

  await sayJob(jobId, { progress: 8, stage: "The transmission is being received…" });
  try {
    const out = await options.press();
    await sayJob(jobId, { progress: 88, stage: "Pressing the ink…" });

    /* THE LIBRARY'S OWN SHELF — the finished transmission rests with
       the keeper's keepings, whatever page they stand on now. */
    let libraryId: string | null = null;
    try {
      const pdfBase64 = Buffer.from(out.pdf).toString("base64");
      if (pdfBase64.length < 4_000_000) {
        libraryId = await saveLibrary(
          job.userId,
          options.sector,
          out.title.slice(0, 140) || "A transmission received",
          "A transmission pressed into ink — received and bound while you walked.",
          {
            kind: options.libraryKind,
            title: out.title,
            filename: out.filename,
            pdf: pdfBase64,
          },
          5_500_000
        );
      }
    } catch {
      /* the shelf may rest — the work itself is done */
    }

    await sayJob(jobId, {
      status: "done",
      progress: 100,
      stage: "The transmission rests in your Library",
      result: { libraryId, filename: out.filename, title: out.title },
    });
  } catch (err) {
    console.error(`[transmission-press:${options.kind}] failed:`, err);
    await sayJob(jobId, {
      status: "failed",
      error:
        err instanceof Error && err.message
          ? err.message.slice(0, 300)
          : "The transmission stayed quiet — press again from the hall.",
    });
  }
}

/** Reads back a stored job's input (JSON string) safely. */
export function readJobInput(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
