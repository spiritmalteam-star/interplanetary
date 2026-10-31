"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Copy, FileDown, Gem, Loader2 } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { flowAnswerText } from "@/lib/text-flow";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE HYPERX ANSWER — the discovery transmission's own body.         */
/*                                                                     */
/*  THE DIAMONDS AT THE PARAGRAPH'S SIDE (the visitor's law): every    */
/*  paragraph of the transmission carries ONE small crystal at its     */
/*  side — nearly invisible at rest, waking on the pointer's approach  */
/*  — so no vision is ever asked by mistake. One touch and THE CHAT    */
/*  MAKES SPACE: an inline plate opens right beneath that paragraph    */
/*  and the truth crystallizes into a vision (the visualization        */
/*  engine paints the paragraph's own crystal). No crystal row at the  */
/*  bottom of the transmission any more — the visions live beside the  */
/*  words they illuminate.                                             */
/*                                                                     */
/*  THE FOLLOWING DOORS — when the answer stands complete, three       */
/*  follow-up suggestions ride beneath it (one grown from the          */
/*  answer's own crystals, two from the discovery's own well), each    */
/*  one touch from the next question.                                  */
/*                                                                     */
/*  THE DEEP RESEARCH PRESS — the truth extended up to 8000 words,     */
/*  pressed into a real PDF (rides with the full variant).             */
/* ------------------------------------------------------------------ */

export interface HyperxCrystal {
  label: string;
  focus: string;
}

/** THE CRYSTAL READER — splits a HyperX answer into its prose body
    and its crystals. The marker is the single word CRYSTALS on its
    own line; every following line beginning with ◇ (or a kindred
    bead) reads as `◇ Name — what the vision shows`. */
export function splitCrystals(text: string): {
  body: string;
  crystals: HyperxCrystal[];
} {
  const marker = /\n\s*[*_#]*\s*CRYSTALS\s*[*_#]*\s*\n/i;
  const at = text.search(marker);
  if (at === -1) return { body: text, crystals: [] };
  const body = text.slice(0, at).trimEnd();
  /* while the answer is still streaming, the tail may hold a partial
     crystal section — everything after the marker is crystal land */
  const tail = text.slice(at + text.slice(at).indexOf("\n"));
  const crystals: HyperxCrystal[] = [];
  for (const rawLine of tail.split("\n")) {
    const line = rawLine.trim();
    const m = line.match(/^[◇◆◈•·*-]\s*(.+)$/);
    if (!m) continue;
    const rest = m[1];
    const dash = rest.match(/^(.{2,60}?)\s+[—–-]+\s+(.+)$/);
    if (dash) {
      crystals.push({ label: dash[1].trim(), focus: dash[2].trim() });
    } else if (rest.trim()) {
      crystals.push({ label: rest.trim().slice(0, 60), focus: rest.trim() });
    }
  }
  return { body, crystals };
}

/** the vision's focus when a paragraph carries no crystal of its own:
    the paragraph's own opening thought, shaped for the painter. */
function deriveFocus(para: string): string {
  const clean = para.replace(/\s+/g, " ").trim();
  return clean.length > 170 ? `${clean.slice(0, 167)}…` : clean;
}

const FOLLOW_UP_WELL: string[] = [
  "What does humanity not yet know about this?",
  "What would a civilisation build with this truth?",
  "What is the next discovery a human can walk from here?",
  "Which hidden layer holds the next mechanism?",
  "Where does this truth touch the body directly?",
  "What mirrors this truth in the oldest records?",
];

function pickFollowUps(
  crystals: HyperxCrystal[],
  seedText: string
): string[] {
  const out: string[] = [];
  if (crystals[0]?.label) {
    out.push(`Unfold "${crystals[0].label}" — what stands beneath it?`);
  }
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  let cursor = seed % FOLLOW_UP_WELL.length;
  while (out.length < 3) {
    const pick = FOLLOW_UP_WELL[cursor % FOLLOW_UP_WELL.length];
    if (!out.includes(pick)) out.push(pick);
    cursor += 1 + (seed % 3);
  }
  return out.slice(0, 3);
}

interface VisionState {
  loading: boolean;
  imageUrl?: string;
  imageTitle?: string;
  failed?: boolean;
}

export function HyperXAnswer({
  question,
  answer,
  onZoom,
  onAsk,
  testId = "hyperx",
  variant = "full",
  loading = false,
}: {
  question: string;
  answer: string;
  onZoom: (src: string, caption: string) => void;
  /** the following doors — one touch asks the next question */
  onAsk?: (q: string) => void;
  testId?: string;
  /** full = follow-ups + deep research press; compact = the diamonds alone */
  variant?: "full" | "compact";
  /** while the transmission still streams, the doors and the press rest */
  loading?: boolean;
}) {
  const language = useMirror((s) => s.language);
  const { body, crystals } = splitCrystals(answer);
  /* THE FLOW LAW RUNS FIRST — the whole body is flowed as one text so
     a run of thin one-sentence paragraphs weaves back into the prose
     it was meant to be, and only then is the reading cut into its
     paragraphs (the old order flowed each paragraph alone and the
     thin-tall strips survived the cut). */
  const paragraphs = flowAnswerText(body)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const [visions, setVisions] = useState<Record<number, VisionState>>({});
  const [pdfState, setPdfState] = useState<
    "idle" | "weaving" | "failed" | "kept"
  >("idle");
  const [pdfNote, setPdfNote] = useState<string | null>(null);
  /* the copy hand at the discovery's own end — the visitor's law: every
     HyperX result closes with its copy of the truth alone */
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  const crystallize = useCallback(
    async (idx: number, focus: string, label: string) => {
      setVisions((v) => ({
        ...v,
        [idx]: { loading: true, imageUrl: v[idx]?.imageUrl },
      }));
      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `A HyperX crystal of comprehension — the concept "${label}", shown so it is easy to comprehend at one glance: ${focus}. The question it illuminates: "${question}".`,
            language,
            single: true,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          artifact?: { imageUrl?: string; title?: string };
        } | null;
        const url = data?.artifact?.imageUrl;
        setVisions((v) => ({
          ...v,
          [idx]: url
            ? {
                loading: false,
                imageUrl: url,
                imageTitle: data?.artifact?.title ?? label,
              }
            : { loading: false, failed: true },
        }));
      } catch {
        setVisions((v) => ({ ...v, [idx]: { loading: false, failed: true } }));
      }
    },
    [language, question]
  );

  const weavePdf = useCallback(async () => {
    setPdfState("weaving");
    setPdfNote(null);
    try {
      /* THE PATIENT PRESS — keepalive keeps the weaving alive through
         a page turned away: the deep research document completes on
         the server no matter where the visitor walks, and rests in
         the Library until they return for it. */
      const res = await fetch("/api/hyperx/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ question, answer, language }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPdfState("failed");
        setPdfNote(
          data?.error ??
            "The press rested — the deep research document could not be woven. Try once more."
        );
        return;
      }
      const keptInLibrary = res.headers.get("x-hyperx-library-id");
      const blob = await res.blob();
      const header = res.headers.get("content-disposition") ?? "";
      const nameMatch = header.match(/filename="?([^";]+)"?/i);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nameMatch?.[1] ?? "HyperX-Deep-Research.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 20_000);
      setPdfState("kept");
      setPdfNote(
        keptInLibrary
          ? "The deep research document is yours — and it rests in your Library, ready whenever you return for it."
          : null
      );
    } catch {
      setPdfState("failed");
      setPdfNote(
        "The press rested — the deep research document could not be woven. Try once more."
      );
    }
  }, [question, answer, language]);

  /* THE END-OF-RESULT COPY — the transmission alone (the crystal
     machinery never rides along), straight from the answer's tail. */
  const copyDiscovery = useCallback(async () => {
    const { body: prose, crystals: own } = splitCrystals(answer);
    const crystalsBlock =
      own.length > 0
        ? `\n\nCRYSTALS\n${own
            .map((c) => `◇ ${c.label} — ${c.focus}`)
            .join("\n")}`
        : "";
    try {
      await navigator.clipboard.writeText(`${prose.trim()}${crystalsBlock}`);
    } catch {
      /* the clipboard may rest behind a permission — the silent hand
         never breaks the reading */
      return;
    }
    setCopied(true);
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2400);
  }, [answer]);

  const followUps = pickFollowUps(crystals, answer);

  return (
    <div
      className="hx-answer flex flex-col gap-1"
      data-testid={`${testId}-answer`}
    >
      {/* ------------- THE TRANSMISSION, PARAGRAPH BY PARAGRAPH ---------- */}
      {paragraphs.map((para, idx) => {
        const crystal = crystals[idx];
        const label = crystal?.label ?? "This paragraph's truth";
        const focus = crystal?.focus ?? deriveFocus(para);
        const st = visions[idx];
        return (
          <div key={idx} className="hx-para">
            <div className="flex items-start gap-1">
              <p className="hx-para-text min-w-0 flex-1 whitespace-pre-wrap break-words text-[15.5px] leading-[1.75] text-foreground/90">
                {para}
              </p>
              <span className="hx-diamond-arm pt-[7px]">
                <button
                  type="button"
                  onClick={() => {
                    if (st?.loading) return;
                    if (st?.imageUrl) {
                      onZoom(st.imageUrl, st.imageTitle ?? label);
                      return;
                    }
                    void crystallize(idx, focus, label);
                  }}
                  disabled={st?.loading}
                  aria-label={`Crystallize this paragraph's vision: ${label}`}
                  title={`Crystallize a vision — ${label}`}
                  data-testid={`${testId}-diamond-${idx}`}
                  className="hx-diamond focus-glow flex size-5 items-center justify-center rounded-full"
                >
                  {st?.loading ? (
                    <Loader2
                      className="size-3 animate-spin text-[#e879f9]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Gem
                      className="size-3 text-[#e879f9]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </span>
            </div>
            {/* THE SPACE THE CHAT MAKES — the vision opens right beneath
                the paragraph it illuminates */}
            {st?.loading && (
              <div
                className="hx-plate-wait mono-label mt-1.5 flex w-full max-w-[340px] items-center gap-2 rounded-xl border px-3 py-2.5 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/85"
                data-testid={`${testId}-plate-${idx}-waiting`}
              >
                <Loader2
                  className="size-3.5 animate-spin text-[#e879f9]"
                  aria-hidden="true"
                />
                Crystallizing “{label}”…
              </div>
            )}
            {st?.failed && (
              <button
                type="button"
                onClick={() => void crystallize(idx, focus, label)}
                className="hx-plate-fail mt-1.5 w-full max-w-[340px] rounded-xl border px-3 py-2 text-left text-[11.5px] text-[#b8860b] transition-colors duration-300 hover:brightness-110 dark:text-[#f59e0b]"
                data-testid={`${testId}-plate-${idx}-failed`}
              >
                The brushes rested — touch to crystallize again.
              </button>
            )}
            {st?.imageUrl && (
              <figure
                className="hx-plate group relative mt-1.5 w-full max-w-[340px] overflow-hidden rounded-xl border"
                data-testid={`${testId}-plate-${idx}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onZoom(st.imageUrl!, st.imageTitle ?? label)
                  }
                  aria-label="Zoom the crystallized vision"
                  className="block w-full cursor-zoom-in"
                >
                  <img
                    src={st.imageUrl}
                    alt={st.imageTitle ?? label}
                    loading="lazy"
                    className="aspect-[7/4] w-full bg-background/40 object-cover"
                  />
                </button>
                <figcaption className="mono-label flex items-center gap-1.5 px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
                  <Gem className="size-2.5 shrink-0 text-[#e879f9]" aria-hidden="true" />
                  <span className="truncate">
                    {st.imageTitle ?? label} — crystallized
                  </span>
                </figcaption>
              </figure>
            )}
          </div>
        );
      })}

      {/* -------------- THE COPY HAND AT THE RESULT'S END ---------------
          THE ALWAYS LAW — the hand rests at the result's tail from the
          first word to the last: while the transmission still streams
          the visitor may already carry what has arrived, and when the
          body itself rests empty but the crystals stand, the hand
          copies the whole truth as it is. */}
      {answer.trim().length > 0 && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => void copyDiscovery()}
            aria-label={copied ? "Copied" : "Copy this discovery"}
            title="Copy this discovery — the truth alone, ready to travel"
            data-testid={`${testId}-copy-end`}
            className={cn(
              "focus-glow inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
              copied
                ? "border-[color-mix(in_srgb,#22d3ee_55%,transparent)] text-[#22d3ee]"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {copied ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <Copy className="size-3" aria-hidden="true" />
            )}
            <span className="mono-label uppercase tracking-[0.16em]">
              {copied ? "Copied" : "Copy this discovery"}
            </span>
          </button>
        </div>
      )}

      {/* ---------------- THE DOORS THAT FOLLOW THE ANSWER --------------- */}
      {variant === "full" && !loading && onAsk && (
        <div
          className="mt-3 flex flex-col gap-1.5"
          data-testid={`${testId}-follow-ups`}
        >
          <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Continue the discovery
          </p>
          <div className="flex flex-wrap gap-1.5">
            {followUps.map((q, i) => (
              <button
                key={`${q}-${i}`}
                type="button"
                onClick={() => onAsk(q)}
                data-testid={`${testId}-follow-up-${i}`}
                className="hx-follow focus-glow rounded-full border px-3 py-1 text-[11.5px] text-foreground/85 transition-all duration-300 hover:brightness-110"
                style={{
                  borderColor:
                    "color-mix(in srgb, #22d3ee 42%, transparent)",
                  background:
                    "color-mix(in srgb, #22d3ee 7%, var(--background))",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --------------------- THE DEEP RESEARCH PRESS -------------------- */}
      {variant === "full" && (
        <div className="mt-2 flex flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => void weavePdf()}
            disabled={pdfState === "weaving" || loading}
            aria-label="Press the deep research PDF — the truth extended up to 8000 words"
            title="The deep research press — this truth extended up to 8000 words, pressed into a PDF for deep research projects"
            data-testid={`${testId}-pdf`}
            className={cn(
              "hx-pdf focus-glow inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] transition-all duration-300",
              (pdfState === "weaving" || loading) && "cursor-wait opacity-80"
            )}
          >
            {pdfState === "weaving" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="size-3.5" aria-hidden="true" />
            )}
            <span className="mono-label uppercase tracking-[0.16em]">
              {pdfState === "weaving"
                ? "Weaving the deep research…"
                : pdfState === "kept"
                  ? "Deep Research PDF — in your Library"
                  : "Deep Research PDF — up to 8000 words"}
            </span>
          </button>
          {pdfNote && (
            <p
              className="rounded-xl border px-3 py-2 text-[12px] leading-relaxed text-[#b8860b] dark:text-[#f59e0b]"
              data-testid={`${testId}-pdf-note`}
            >
              {pdfNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
