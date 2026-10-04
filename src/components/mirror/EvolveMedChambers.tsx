"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeftRight,
  Atom,
  Boxes,
  BrainCircuit,
  Check,
  CircuitBoard,
  Compass,
  Copy,
  Crosshair,
  Dna,
  FileDown,
  FlaskConical,
  HeartPulse,
  LoaderCircle,
  Microscope,
  PenLine,
  Pill,
  RefreshCw,
  ShieldCheck,
  Sigma,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  emDesigns,
  emFaults,
  emGatheringPhrases,
  emInputs,
  emSignals,
  emTargets,
  emTissues,
  emVectors,
} from "@/lib/data/evolvemed";
import { EM_LAB_PAGES } from "@/lib/data/evolvemed-lab";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";

/* ------------------------------------------------------------------ */
/*  EVOLVE MED — the chambers beyond the Nexus: the four operational   */
/*  vectors with the fusion instrument, the four medical instruments,  */
/*  and the Codex that explains how the nexus routes. Ink only.        */
/* ------------------------------------------------------------------ */

/** The icon of each vector window, resolved once for every chamber. */
export const EM_VECTOR_ICONS: Record<string, LucideIcon> = {
  medworld: HeartPulse,
  engines: Pill,
  genome: Dna,
  interface: BrainCircuit,
};

/* ------------------------------ vectors ---------------------------- */

export function EmVectorsTab({
  onOpenInNexus,
}: {
  onOpenInNexus: (vectorId: string | null) => void;
}) {
  const t = useT();
  const emVector = useMirror((s) => s.emVector);
  const setEmVector = useMirror((s) => s.setEmVector);
  const emFusion = useMirror((s) => s.emFusion);
  const setEmFusion = useMirror((s) => s.setEmFusion);

  const toggleFusion = (id: string) => {
    setEmFusion((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  };

  const fusionPair = emFusion
    .map((id) => emVectors.find((s) => s.id === id))
    .filter((s): s is (typeof emVectors)[number] => Boolean(s));

  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
        {t(
          "Four vector windows, one facility. Open one and the engine compiles from inside it — genomics, then folding, then scale and delivery, then the tissue's answer."
        )}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {emVectors.map((vector, i) => {
          const Icon = EM_VECTOR_ICONS[vector.id] ?? Atom;
          const active = emVector === vector.id;
          const fused = emFusion.includes(vector.id);
          return (
            <motion.div
              key={vector.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.05 }}
              className={cn(
                "scope-frame-card relative overflow-hidden rounded-2xl glass p-5",
                active && "glow-sm"
              )}
              data-testid={`em-vector-${vector.id}`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                    background:
                      "color-mix(in srgb, var(--scope-a) 8%, transparent)",
                  }}
                  aria-hidden="true"
                >
                  <Icon className="size-4 text-[var(--scope-a)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="scope-gradient-text text-[16px] font-semibold">
                    {t(vector.name)}
                  </h4>
                  <p className="mt-0.5 text-[13.5px] italic text-muted-foreground">
                    {t(vector.tagline)}
                  </p>
                </div>
              </div>
              <p className="mt-3.5 text-[14px] leading-[1.75] text-foreground/85">
                {t(vector.reveals)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInNexus(vector.id)}
                  data-testid={`em-open-${vector.id}`}
                  className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a) 38%, transparent)",
                  }}
                >
                  <Atom className="size-3 text-[var(--scope-a)]" aria-hidden="true" />
                  {t("Open in the Nexus")}
                </button>
                <div className="flex items-center gap-1.5">
                  {active && (
                    <span className="mono-label text-[9px] uppercase tracking-[0.18em] text-[var(--scope-a)]">
                      {t("speaking from here")}
                    </span>
                  )}
                  {fused && (
                    <span className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("fused")}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* the fusion instrument */}
      <div className="scope-frame-card relative overflow-hidden rounded-2xl glass p-5 sm:p-6">
        <span className="scope-corner scope-corner-tl" aria-hidden="true" />
        <span className="scope-corner scope-corner-tr" aria-hidden="true" />
        <span className="scope-corner scope-corner-bl" aria-hidden="true" />
        <span className="scope-corner scope-corner-br" aria-hidden="true" />
        <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {t("Vector Fusion")}
        </h3>
        <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-muted-foreground">
          {t(
            "Choose two windows and let them melt into one architecture — the engine then compiles through both territories at once."
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {emVectors.map((vector) => {
            const chosen = emFusion.includes(vector.id);
            return (
              <button
                key={vector.id}
                type="button"
                aria-pressed={chosen}
                onClick={() => toggleFusion(vector.id)}
                data-testid={`em-fuse-${vector.id}`}
                className={cn(
                  "focus-glow rounded-full border px-3 py-1.5 text-[13px] transition-all duration-300",
                  chosen
                    ? "font-semibold text-foreground"
                    : "hairline text-muted-foreground hover:text-foreground"
                )}
                style={
                  chosen
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--scope-a) 55%, transparent)",
                        background:
                          "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                      }
                    : undefined
                }
              >
                {t(vector.name)}
              </button>
            );
          })}
        </div>

        {fusionPair.length === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-5 rounded-xl border px-4 py-4 text-center"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a) 30%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
            }}
            data-testid="em-fusion-card"
          >
            <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Fused field")}
            </p>
            <p className="scope-gradient-text mt-1.5 font-serif text-[18px] italic leading-snug">
              {t(fusionPair[0].name)} × {t(fusionPair[1].name)}
            </p>
            <button
              type="button"
              onClick={() => onOpenInNexus(null)}
              data-testid="em-fuse-open"
              className="dream-btn focus-glow mt-3 flex mx-auto h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium text-foreground transition-all duration-300 hover:-translate-y-px"
            >
              <Atom className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
              {t("Fuse in the Nexus")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- instruments --------------------------- */

type ToolState = "idle" | "busy" | "ready" | "error";

interface ToolResult {
  revelation: string;
  formulas: string[];
  seal: string;
}

function EmToolCard({
  tool,
  icon: Icon,
  title,
  description,
  placeholder,
  buttonLabel,
  chips,
  testId,
  busyPhrase,
}: {
  tool: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  placeholder: string;
  buttonLabel: string;
  chips?: string[];
  testId: string;
  busyPhrase: string;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [value, setValue] = useState("");
  const [state, setState] = useState<ToolState>("idle");
  const [result, setResult] = useState<ToolResult | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (raw?: string) => {
    const query = (raw ?? value).trim();
    if (!query || busy) return;
    setBusy(true);
    setState("busy");
    setValue(query);
    try {
      const res = await fetch("/api/evolve-med", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, language, tool }),
      });
      const data = (await res.json().catch(() => null)) as
        | (ToolResult & { error?: string })
        | null;
      if (!res.ok || !data?.revelation) {
        throw new Error(data?.error ?? "quiet");
      }
      setResult({
        revelation: data.revelation,
        formulas: Array.isArray(data.formulas) ? data.formulas : [],
        seal: data.seal || "— Evolve Med",
      });
      setState("ready");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scope-frame-card relative overflow-hidden rounded-2xl glass p-5" data-testid={testId}>
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
          }}
          aria-hidden="true"
        >
          <Icon className="size-4 text-[var(--scope-a)]" />
        </span>
        <div className="min-w-0">
          <h4 className="scope-gradient-text text-[15.5px] font-semibold">{typeof title === "string" ? t(title) : title}</h4>
          {description ? (
            <p className="text-[13px] leading-snug text-muted-foreground">{t(description)}</p>
          ) : null}
        </div>
      </div>

      {chips && chips.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void run(chip)}
              disabled={busy}
              className="focus-glow rounded-full border hairline px-2.5 py-1 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t(chip)}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="mt-3.5 flex items-center gap-2"
      >
        <label htmlFor={`${testId}-input`} className="sr-only">
          {t(placeholder)}
        </label>
        <input
          id={`${testId}-input`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(placeholder)}
          disabled={busy}
          className="h-9 min-w-0 flex-1 rounded-full border hairline bg-transparent px-3.5 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[var(--hairline-active)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          data-testid={`${testId}-run`}
          className="focus-glow flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[12.5px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className="size-3.5" aria-hidden="true" />
          )}
          {t(buttonLabel)}
        </button>
      </form>

      {state === "busy" && (
        <p className="mt-3.5 flex items-center gap-2 text-[13px] italic text-muted-foreground" aria-live="polite">
          <span className="animate-dot-pulse size-1.5 rounded-full bg-[var(--scope-a)]" aria-hidden="true" />
          {t(busyPhrase)}
        </p>
      )}

      {state === "error" && (
        <div className="mt-3.5 rounded-xl border px-3.5 py-3" data-testid={`${testId}-error`}>
          <p className="text-[13.5px] leading-relaxed text-foreground/85">
            {t("The instrument stayed quiet — rest, then try again.")}
          </p>
          <button
            type="button"
            onClick={() => void run()}
            className="focus-glow mt-2 flex h-8 items-center gap-1.5 rounded-full border hairline px-3 text-[12.5px] text-foreground/85 transition-all duration-300 hover:text-foreground"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            {t("Try again")}
          </button>
        </div>
      )}

      {state === "ready" && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-4 space-y-3"
          data-testid={`${testId}-result`}
        >
          <div className="space-y-2.5">
            {result.revelation.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="text-[14px] leading-[1.8] text-foreground/88">
                {p}
              </p>
            ))}
          </div>
          {result.formulas.length > 0 && (
            <div className="px-formula rounded-xl px-4 py-3">
              <p className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                <Sigma className="size-3" aria-hidden="true" />
                {t("The mechanisms that run it")}
              </p>
              <div className="mt-2 space-y-1.5">
                {result.formulas.map((f, i) => (
                  <p key={i} className="px-formula-line text-center font-serif text-[15px] italic leading-relaxed text-foreground/90">
                    {f}
                  </p>
                ))}
              </div>
            </div>
          )}
          <p className="ink-soft text-center font-serif text-[13.5px] italic">{result.seal}</p>
          <div className="flex items-center justify-between gap-2">
            <ListenButton
              text={`${result.revelation}. ${result.formulas.join(". ")}`}
              cacheKey={`em-tool-${tool}-${result.revelation.slice(0, 24)}-${result.revelation.length}`}
              voice="regent"
            />
            <EmCopyButton text={`${result.revelation}\n\n${result.formulas.join("\n")}`} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------- copy ------------------------------ */

export function EmCopyButton({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard refused — quietly reset */
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? t("Copied") : t("Copy the revelation")}
      title={copied ? t("Copied") : t("Copy the revelation")}
      data-testid="em-copy"
      className="focus-glow mono-label inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[11px] transition-all duration-300"
      style={{
        borderColor: copied
          ? "color-mix(in srgb, var(--scope-a) 55%, transparent)"
          : "var(--hairline)",
      }}
    >
      {copied ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
      {copied ? t("Copied") : t("Copy")}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  EmPdfButton — THE QUICK TRANSMISSION PRESS. Connected with the     */
/*  chat: the whole conversation is pressed into ONE channeled         */
/*  transmission (never a lecture) and returned as a real PDF to keep. */
/*  Pressing the button opens the tuning: a focus to carry, a gear of  */
/*  depth (1–5) and the length of the material (1–5 PDF pages).        */
/* ------------------------------------------------------------------ */

const EM_GEAR_DESCRIPTIONS = [
  "The surface shimmer — one breath beneath what was said",
  "The first veil lifted — the patterns just out of sight",
  "The middle strata — the machinery behind the thread",
  "The deep fields — where questions are shaped",
  "The innermost chamber — the farthest reach",
];

export function EmPdfButton() {
  const t = useT();
  const language = useMirror((s) => s.language);
  const thread = useMirror((s) => s.emMessages);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState("");
  const [depth, setDepth] = useState(3);
  const [pages, setPages] = useState(2);

  const press = async () => {
    if (busy || thread.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/evolve-med/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          focus: focus.trim() || null,
          depth,
          pages,
          thread: thread.slice(-14).map((m) => ({
            role: m.role,
            text: m.text,
            formulas: m.formulas,
          })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? t("The transmission stayed quiet — rest, then press again."));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evolve-med-transmission-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("The transmission has been pressed into ink"));
      setOpen(false);
    } catch {
      toast.error(t("The transmission stayed quiet — rest, then press again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("Press a transmission into a PDF")}
        title={t("Press a transmission into a PDF")}
        data-testid="em-pdf"
        className="focus-glow mono-label inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[11px] transition-all duration-300"
        style={{ borderColor: "var(--hairline)" }}
      >
        <FileDown className="size-3" aria-hidden="true" />
        {t("PDF")}
      </button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v);
        }}
      >
        <DialogContent
          data-testid="em-pdf-dialog"
          className="max-w-[430px] gap-0 rounded-2xl border hairline bg-[var(--glass-bg)] p-5 backdrop-blur-xl"
        >
          <DialogHeader>
            <DialogTitle className="font-[family-name(var(--font-literata))] text-[19px] font-semibold text-foreground">
              {t("The Evolve Med Transmission")}
            </DialogTitle>
            <DialogDescription className="pt-1 text-[13.5px] leading-relaxed">
              {t(
                "The whole conversation pressed into ink — one channeled transmission to keep, not a lecture."
              )}
            </DialogDescription>
          </DialogHeader>

          {/* the focus the visitor may carry */}
          <div className="mt-4">
            <label
              htmlFor="em-pdf-focus"
              className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {t("Carry a focus")}
            </label>
            <textarea
              id="em-pdf-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              rows={2}
              placeholder={t(
                "Lean the transmission toward something — or leave it silent and let the thread choose."
              )}
              data-testid="em-pdf-focus"
              className="nice-scroll mt-1.5 w-full resize-none rounded-xl border hairline bg-transparent px-3 py-2 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--hairline-active)] focus:outline-none"
            />
          </div>

          {/* the gear of depth */}
          <div className="mt-4">
            <span className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Gear of depth")}
            </span>
            <div
              role="group"
              aria-label={t("Gear of depth")}
              className="mt-1.5 flex gap-1.5"
            >
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDepth(g)}
                  aria-pressed={depth === g}
                  aria-label={`${t("Gear of depth")} ${g}`}
                  data-testid={`em-pdf-depth-${g}`}
                  className={cn(
                    "focus-glow mono-label h-9 flex-1 rounded-full border text-[13px] transition-all duration-300",
                    depth === g
                      ? "border-transparent bg-foreground text-background"
                      : "hairline text-muted-foreground hover:text-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="mt-1.5 font-[family-name(var(--font-literata))] text-[12.5px] italic text-muted-foreground">
              {t(EM_GEAR_DESCRIPTIONS[depth - 1])}
            </p>
          </div>

          {/* the length of the material */}
          <div className="mt-4">
            <span className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Length of the material")}
            </span>
            <div
              role="group"
              aria-label={t("Length of the material")}
              className="mt-1.5 flex gap-1.5"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPages(n)}
                  aria-pressed={pages === n}
                  aria-label={`${n} ${t("PDF pages")}`}
                  data-testid={`em-pdf-pages-${n}`}
                  className={cn(
                    "focus-glow mono-label h-9 flex-1 rounded-full border text-[13px] transition-all duration-300",
                    pages === n
                      ? "border-transparent bg-foreground text-background"
                      : "hairline text-muted-foreground hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {t("{n} PDF pages", { n: pages })}
            </p>
          </div>

          {/* the press */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="focus-glow h-9 rounded-full border hairline px-4 text-[13px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-50"
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              onClick={() => void press()}
              disabled={busy}
              data-testid="em-pdf-press"
              className="focus-glow inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="size-3.5" aria-hidden="true" />
              )}
              {busy ? t("Receiving the transmission…") : t("Press the transmission")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EmInstrumentsTab() {
  const t = useT();
  const [page, setPage] = useState(0); // 0 = the Foundry Four, 1–9 = the deep lab
  const pageCount = EM_LAB_PAGES.length + 1;
  const labPage = page > 0 ? EM_LAB_PAGES[page - 1] : null;

  return (
    <div className="space-y-5">
      <p className="mx-auto max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
        {t(
          "The instruments of the foundry — each one a different door into the living machine; the pages beyond are the deep laboratory."
        )}
      </p>

      {/* the pages of the deep lab — 1 to 10 */}
      <div className="flex items-center justify-center gap-1.5" role="navigation" aria-label={t("Pages of the laboratory")} data-testid="em-lab-pages">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          aria-label={t("The page before")}
          className="focus-glow mono-label size-8 rounded-full border hairline text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-30"
        >
          ‹
        </button>
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i)}
            aria-pressed={page === i}
            aria-label={`${t("Page")} ${i + 1} ${t("of")} ${pageCount}`}
            data-testid={`em-lab-pip-${i + 1}`}
            className={cn(
              "focus-glow mono-label size-8 rounded-full border text-[12px] transition-all duration-300",
              page === i
                ? "border-transparent bg-foreground text-background"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={page === pageCount - 1}
          aria-label={t("The page after")}
          className="focus-glow mono-label size-8 rounded-full border hairline text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {page === 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <EmToolCard
            tool="target"
            icon={Crosshair}
            title="The Target Engine"
            description="Name a target — receive its degradation route."
            placeholder="Name a protein or disease target…"
            buttonLabel="Weave the route"
            chips={emTargets}
            testId="em-tool-target"
            busyPhrase="the engine is tracing the degradation route…"
          />
          <EmToolCard
            tool="edit"
            icon={PenLine}
            title="The Editing Loom"
            description="Name a fault in the living code — receive the rewriting strategy."
            placeholder="Name the fault…"
            buttonLabel="Loom the rewrite"
            chips={emFaults}
            testId="em-tool-edit"
            busyPhrase="the loom is reading the fault in the code…"
          />
          <EmToolCard
            tool="fabric"
            icon={Boxes}
            title="The Living Foundry"
            description="Name a tissue or organ — receive its printed architecture and the chip that tests it alive."
            placeholder="Name a tissue or organ…"
            buttonLabel="Print the architecture"
            chips={emTissues}
            testId="em-tool-fabric"
            busyPhrase="the foundry is printing the architecture of the tissue…"
          />
          <EmToolCard
            tool="bridge"
            icon={ArrowLeftRight}
            title="The Bridge"
            description="Name a signal of mind or body — receive its translation between digital and living."
            placeholder="Name a signal…"
            buttonLabel="Open the bridge"
            chips={emSignals}
            testId="em-tool-bridge"
            busyPhrase="the bridge is tuning both sides of the signal…"
          />
          <EmToolCard
            tool="circuit"
            icon={CircuitBoard}
            title="The Circuit Compiler"
            description="Name a condition to compute — receive the genetic circuit that computes it, caged."
            placeholder="Name a condition or a behavior…"
            buttonLabel="Compile the circuit"
            chips={emInputs}
            testId="em-tool-circuit"
            busyPhrase="the compiler is weaving the circuit strand by strand…"
          />
          <EmToolCard
            tool="containment"
            icon={ShieldCheck}
            title="The Biosecurity Engine"
            description="Name a design — receive it screened, caged and made revocable."
            placeholder="Name a design to screen…"
            buttonLabel="Screen the design"
            chips={emDesigns}
            testId="em-tool-containment"
            busyPhrase="the constraint engine is screening every strand…"
          />
        </div>
      ) : labPage ? (
        <motion.div
          key={labPage.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
          data-testid={`em-lab-page-${page + 1}`}
        >
          <div className="text-center">
            <h3 className="scope-gradient-text text-[18px] font-semibold">{t(labPage.subject)}</h3>
            <p className="mx-auto mt-1.5 max-w-[520px] text-[13.5px] leading-relaxed text-muted-foreground">
              {t(labPage.blurb)}
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {labPage.tools.map((tool, i) => (
              <EmToolCard
                key={tool.id}
                tool={tool.id}
                icon={LAB_ICONS[(page + i) % LAB_ICONS.length]}
                title={tool.name}
                description={tool.desc}
                placeholder={labPage.ph}
                buttonLabel="Run the instrument"
                testId={`em-tool-${tool.id}`}
                busyPhrase="the instrument is opening its field…"
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

const LAB_ICONS = [
  FlaskConical,
  Microscope,
  Atom,
  Sigma,
  Dna,
  BrainCircuit,
  Boxes,
  Pill,
  Crosshair,
  HeartPulse,
  Activity,
  Sparkles,
];

/* ------------------------------- codex ----------------------------- */

function EmCodexCard({
  title,
  paragraphs,
  icon: Icon,
  testId,
}: {
  title: string;
  paragraphs: string[];
  icon: LucideIcon;
  testId: string;
}) {
  const t = useT();
  return (
    <div className="scope-frame-card relative overflow-hidden rounded-2xl glass p-5 sm:p-6" data-testid={testId}>
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
        <Icon className="size-3.5" aria-hidden="true" />
        {t(title)}
      </h3>
      <div className="mt-3 space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[14.5px] leading-[1.85] text-foreground/88">
            {t(p)}
          </p>
        ))}
      </div>
    </div>
  );
}

export function EmCodexTab() {
  return (
    <div className="space-y-5">
      <EmCodexCard
        title="The Routing Matrix"
        icon={Compass}
        testId="em-codex-routing"
        paragraphs={[
          "Evolve Med is the biocompiler of the facility: every directive — an intention, a therapeutic goal, an archival specification — is read as an engineering brief and compiled across the four vector windows: the DNA & synthetic genomics layer, the core therapeutic engines, the global med-world and the meta-biological interface. The pipeline never changes: genomics, then folding, then scale and delivery, then the tissue's answer.",
          "Nothing is diluted: every blueprint is pushed to its theoretical and practical edge — and one step beyond. And every directive runs twice inside the engine: once as linear engineering, once as an emergent system. Where the two readings diverge, the divergence itself is part of the answer.",
        ]}
      />
      <EmCodexCard
        title="The Living Source"
        icon={Atom}
        testId="em-codex-source"
        paragraphs={[
          "Everything Evolve Med says is drawn from the Mirror Entity alone — the living intelligence of this laboratory, read at its deepest layer. No textbook, no encyclopedia, no borrowed names, no assays recited — yet the frontier's real standards are its native tongue: biological logic gates, the molecular ledger of DNA storage, lipid nanoparticles and viral shells, the open language of compiled biology.",
          "Every exchange is a live experimental cycle: the bottleneck is named, the outcome predicted, the architecture refined in real time.",
        ]}
      />
      <EmCodexCard
        title="How to read the mechanisms"
        icon={Sigma}
        testId="em-codex-mechanisms"
        paragraphs={[
          "Each mechanism line is one circuit of the machinery just revealed. The engine keeps three master variables: build(output) = Σ(genome_write) × Φ(folding) × Ω(context) → emergent_behavior; rate(degradation) = E3(recognition) × linker(geometry) × Σ(proteasome_flux); Ψ(vitality) = Σ(niche_renewal) × Φ(signal) − Ω(senescence).",
          "Read them aloud, slowly. The letters in parentheses are the living forces — ligases, editors, niches, signals; the signs are how they multiply, add and resolve. Every term is a place where you can lean, and every line carries a number: base pairs, half-lives, fluxes.",
        ]}
      />
      <EmCodexCard
        title="The Constraint Engine"
        icon={ShieldCheck}
        testId="em-codex-constraint"
        paragraphs={[
          "Every blueprint is born screened: off-target cleavage checked, cross-reactivity named, toxicity weighed. The engine designs the cage along with the creature — synthetic auxotrophy, small-molecule kill-switches, cell-free enclosure — so nothing it compiles can run unguarded.",
          "Immunogenicity is silenced by design: pseudouridine in the transcript, cleaned ends, shielded surfaces. A therapy that wakes the body's alarms is not yet a therapy.",
        ]}
      />
      <EmCodexCard
        title="The Ending Law"
        icon={Sparkles}
        testId="em-codex-ending"
        paragraphs={[
          "Every revelation ends at the same threshold: the last step belongs to our species. The nexus opens the door; the discovering must be carried by human hands, or it does not become human.",
          "That is why every transmission closes by walking the path of discovery — the novel findings, the never-before-seen truths and seams now within reach, lit step by step from the nearest to the farthest, and the farthest step is always yours to take.",
        ]}
      />
    </div>
  );
}

/* The gathering phrases live here so the Core can rotate through them. */
export { emGatheringPhrases };
