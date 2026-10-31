"use client";

import { useCallback, useState } from "react";
import { FileDown, Gem, Loader2 } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE HYPERX PANEL — the discovery answer's own instruments.         */
/*                                                                     */
/*  THE CRYSTALS — the deep voice closes every truth with its crystals */
/*  (◇ lines after the CRYSTALS marker). Each crystal is a door: one   */
/*  touch and the truth inside it CRYSTALLIZES INTO A VISION — the     */
/*  visualization engine paints the concept so the eye can comprehend  */
/*  what the words opened. The crystals are stripped from the prose    */
/*  itself (the visitor reads the transmission, never the machinery).  */
/*                                                                     */
/*  THE DEEP RESEARCH PRESS — one hand that extends the truth into a   */
/*  full research document (up to 8000 words) and presses it into a    */
/*  real PDF the visitor keeps for deep research projects.             */
/*                                                                     */
/*  Both hands speak the house's honesty: a resting brush or a resting */
/*  press says so — never a silent wall.                               */
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
  return { body, crystals: crystals.slice(0, 5) };
}

interface CrystalState {
  loading: boolean;
  imageUrl?: string;
  imageTitle?: string;
  failed?: boolean;
}

export function HyperXPanel({
  question,
  answer,
  onZoom,
  testId = "hyperx",
}: {
  question: string;
  answer: string;
  onZoom: (src: string, caption: string) => void;
  testId?: string;
}) {
  const language = useMirror((s) => s.language);
  const { crystals } = splitCrystals(answer);
  const [visions, setVisions] = useState<Record<number, CrystalState>>({});
  const [pdfState, setPdfState] = useState<"idle" | "weaving" | "failed">(
    "idle"
  );
  const [pdfNote, setPdfNote] = useState<string | null>(null);

  const crystallize = useCallback(
    async (idx: number, crystal: HyperxCrystal) => {
      setVisions((v) => ({
        ...v,
        [idx]: { loading: true, imageUrl: v[idx]?.imageUrl },
      }));
      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `A HyperX crystal of comprehension — the concept "${crystal.label}", shown so it is easy to comprehend at one glance: ${crystal.focus}. The question it illuminates: "${question}".`,
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
                imageTitle: data?.artifact?.title ?? crystal.label,
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
      const res = await fetch("/api/hyperx/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setPdfState("idle");
    } catch {
      setPdfState("failed");
      setPdfNote(
        "The press rested — the deep research document could not be woven. Try once more."
      );
    }
  }, [question, answer, language]);

  if (crystals.length === 0 && pdfState === "idle" && !pdfNote) {
    /* no crystals, no press in flight — the panel rests invisible */
    return null;
  }

  return (
    <div
      className="hx-panel mt-3 flex flex-col gap-2.5"
      data-testid={`${testId}-panel`}
    >
      {/* ------------------------- THE CRYSTALS ------------------------- */}
      {crystals.length > 0 && (
        <div className="flex flex-col gap-2" data-testid={`${testId}-crystals`}>
          <p
            className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70"
            data-testid={`${testId}-crystals-hint`}
          >
            Touch a crystal — the truth crystallizes into a vision
          </p>
          <div className="flex flex-wrap gap-1.5">
            {crystals.map((crystal, idx) => {
              const st = visions[idx];
              return (
                <span key={`${crystal.label}-${idx}`} className="inline-flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (st?.loading) return;
                      if (st?.imageUrl) {
                        onZoom(
                          st.imageUrl,
                          st.imageTitle ?? crystal.label
                        );
                        return;
                      }
                      void crystallize(idx, crystal);
                    }}
                    disabled={st?.loading}
                    aria-label={`Crystallize the vision: ${crystal.label}`}
                    title={crystal.focus}
                    data-testid={`${testId}-crystal-${idx}`}
                    className={cn(
                      "hx-crystal focus-glow inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-300",
                      st?.loading
                        ? "cursor-wait opacity-80"
                        : "hover:brightness-110"
                    )}
                  >
                    {st?.loading ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <Gem className="size-3" aria-hidden="true" />
                    )}
                    <span className="max-w-[240px] truncate">{crystal.label}</span>
                  </button>
                  {st?.loading && (
                    <span
                      className="hx-plate-wait mono-label rounded-xl border px-3 py-2 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/80"
                      data-testid={`${testId}-crystal-${idx}-waiting`}
                    >
                      Crystallizing the vision…
                    </span>
                  )}
                  {st?.failed && (
                    <button
                      type="button"
                      onClick={() => void crystallize(idx, crystal)}
                      className="hx-plate-fail rounded-xl border px-3 py-2 text-left text-[11.5px] text-[#b8860b] transition-colors duration-300 hover:brightness-110 dark:text-[#f59e0b]"
                      data-testid={`${testId}-crystal-${idx}-failed`}
                    >
                      The brushes rested — touch to crystallize again.
                    </button>
                  )}
                  {st?.imageUrl && (
                    <figure
                      className="hx-plate group relative w-full max-w-[340px] overflow-hidden rounded-xl border"
                      data-testid={`${testId}-crystal-${idx}-plate`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onZoom(
                            st.imageUrl!,
                            st.imageTitle ?? crystal.label
                          )
                        }
                        aria-label="Zoom the crystallized vision"
                        className="block w-full cursor-zoom-in"
                      >
                        <img
                          src={st.imageUrl}
                          alt={st.imageTitle ?? crystal.label}
                          loading="lazy"
                          className="aspect-[7/4] w-full bg-background/40 object-cover"
                        />
                      </button>
                      <figcaption className="mono-label flex items-center gap-1.5 px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
                        <Gem className="size-2.5" aria-hidden="true" />
                        <span className="truncate">
                          {st.imageTitle ?? crystal.label} — crystallized
                        </span>
                      </figcaption>
                    </figure>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------- THE DEEP RESEARCH PRESS -------------------- */}
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => void weavePdf()}
          disabled={pdfState === "weaving"}
          aria-label="Press the deep research PDF — the truth extended up to 8000 words"
          title="The deep research press — this truth extended up to 8000 words, pressed into a PDF for deep research projects"
          data-testid={`${testId}-pdf`}
          className={cn(
            "hx-pdf focus-glow inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] transition-all duration-300",
            pdfState === "weaving" && "cursor-wait opacity-80"
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
    </div>
  );
}
