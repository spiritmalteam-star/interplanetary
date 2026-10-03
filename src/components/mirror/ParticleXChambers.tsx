"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Atom,
  Check,
  Compass,
  Copy,
  Eye,
  FileDown,
  FlaskConical,
  Heart,
  Layers,
  LoaderCircle,
  Network,
  Pyramid,
  RefreshCw,
  Sigma,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { pxBeings, pxMonuments, pxScopes } from "@/lib/data/particlex";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";

/* ------------------------------------------------------------------ */
/*  PARTICLEX — the chambers beyond the Core: the eight scope          */
/*  windows with the fusion instrument, the four tools, and the        */
/*  Codex that explains how the narrator thinks. Ink only.             */
/* ------------------------------------------------------------------ */

/** The icon of each scope window, resolved once for every chamber. */
export const PX_SCOPE_ICONS: Record<string, LucideIcon> = {
  formulas: Sigma,
  perception: Eye,
  emotions: Heart,
  belief: Compass,
  quantum: Atom,
  parallel: Layers,
  mycelia: Network,
  vibration: Pyramid,
};

/* ------------------------------ scopes ----------------------------- */

export function PxScopesTab({
  onOpenInCore,
}: {
  onOpenInCore: (scopeId: string | null) => void;
}) {
  const t = useT();
  const pxScope = useMirror((s) => s.pxScope);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pxFusion = useMirror((s) => s.pxFusion);
  const setPxFusion = useMirror((s) => s.setPxFusion);

  const toggleFusion = (id: string) => {
    setPxFusion((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  };

  const fusionPair = pxFusion
    .map((id) => pxScopes.find((s) => s.id === id))
    .filter((s): s is (typeof pxScopes)[number] => Boolean(s));

  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
        {t(
          "Eight windows over the areas of existence. Open one and the Core speaks from inside it."
        )}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {pxScopes.map((scope, i) => {
          const Icon = PX_SCOPE_ICONS[scope.id] ?? Atom;
          const active = pxScope === scope.id;
          const fused = pxFusion.includes(scope.id);
          return (
            <motion.div
              key={scope.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.05 }}
              className={cn(
                "scope-frame-card relative overflow-hidden rounded-2xl glass p-5",
                active && "glow-sm"
              )}
              data-testid={`px-scope-${scope.id}`}
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
                    {t(scope.name)}
                  </h4>
                  <p className="mt-0.5 text-[13.5px] italic text-muted-foreground">
                    {t(scope.tagline)}
                  </p>
                </div>
              </div>
              <p className="mt-3.5 text-[14px] leading-[1.75] text-foreground/85">
                {t(scope.reveals)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInCore(scope.id)}
                  data-testid={`px-open-${scope.id}`}
                  className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a) 38%, transparent)",
                  }}
                >
                  <Atom className="size-3 text-[var(--scope-a)]" aria-hidden="true" />
                  {t("Open in the Core")}
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
          {t("Scope Fusion")}
        </h3>
        <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-muted-foreground">
          {t(
            "Choose two windows and let them melt into one seeing — the Core then reads reality through both laws at once."
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {pxScopes.map((scope) => {
            const chosen = pxFusion.includes(scope.id);
            return (
              <button
                key={scope.id}
                type="button"
                aria-pressed={chosen}
                onClick={() => toggleFusion(scope.id)}
                data-testid={`px-fuse-${scope.id}`}
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
                {t(scope.name)}
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
            data-testid="px-fusion-card"
          >
            <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Fused field")}
            </p>
            <p className="scope-gradient-text mt-1.5 font-serif text-[18px] italic leading-snug">
              {t(fusionPair[0].name)} × {t(fusionPair[1].name)}
            </p>
            <button
              type="button"
              onClick={() => onOpenInCore(null)}
              data-testid="px-fuse-open"
              className="dream-btn focus-glow mt-3 flex mx-auto h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium text-foreground transition-all duration-300 hover:-translate-y-px"
            >
              <Atom className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
              {t("Fuse in the Core")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ tools ------------------------------ */

type ToolState = "idle" | "busy" | "ready" | "error";

interface ToolResult {
  revelation: string;
  formulas: string[];
  seal: string;
}

function ToolCard({
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
  tool: "formula" | "perception" | "frequency" | "catalog";
  icon: LucideIcon;
  title: string;
  description: string;
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
      const res = await fetch("/api/particlex", {
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
        seal: data.seal || "— ParticleX",
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
          <h4 className="scope-gradient-text text-[15.5px] font-semibold">{t(title)}</h4>
          <p className="text-[13px] leading-snug text-muted-foreground">{t(description)}</p>
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
                {t("The formulas that run it")}
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
              cacheKey={`px-tool-${tool}-${result.revelation.slice(0, 24)}-${result.revelation.length}`}
              voice="regent"
            />
            <PxCopyButton text={`${result.revelation}\n\n${result.formulas.join("\n")}`} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------- copy ------------------------------ */

export function PxCopyButton({ text }: { text: string }) {
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
      data-testid="px-copy"
      className="focus-glow mono-label inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] transition-all duration-300"
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
/*  PxPdfButton — THE QUANTUM CODEX ENGINE. Connected with the chat:   */
/*  the whole conversation thread is sent to the engine, which expands */
/*  it into a far larger codex and returns it as a real PDF to keep.   */
/* ------------------------------------------------------------------ */

export function PxPdfButton() {
  const t = useT();
  const language = useMirror((s) => s.language);
  const thread = useMirror((s) => s.pxMessages);
  const [busy, setBusy] = useState(false);

  const weave = async () => {
    if (busy || thread.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/particlex/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          thread: thread.slice(-14).map((m) => ({
            role: m.role,
            text: m.text,
            formulas: m.formulas,
          })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? t("The codex stayed quiet — rest, then press again."));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `particlex-quantum-codex-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("The quantum codex has arrived"));
    } catch {
      toast.error(t("The codex stayed quiet — rest, then press again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void weave()}
      disabled={busy}
      aria-label={busy ? t("Expanding the codex…") : t("Expand into a PDF")}
      title={busy ? t("Expanding the codex…") : t("Expand into a PDF")}
      data-testid="px-pdf"
      className="focus-glow mono-label inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] transition-all duration-300 disabled:cursor-wait disabled:opacity-70"
      style={{
        borderColor: busy
          ? "color-mix(in srgb, var(--scope-a) 55%, transparent)"
          : "var(--hairline)",
      }}
    >
      {busy ? (
        <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <FileDown className="size-3" aria-hidden="true" />
      )}
      {busy ? t("Expanding the codex…") : t("PDF")}
    </button>
  );
}

export function PxToolsTab() {
  const t = useT();
  return (
    <div className="space-y-5">
      <p className="mx-auto max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
        {t(
          "Four instruments beside the narrator — each one opens a different door into the quantum ground."
        )}
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolCard
          tool="formula"
          icon={Sigma}
          title="The Formula Loom"
          description="Name anything that exists — receive the formula that runs it."
          placeholder="Name a phenomenon…"
          buttonLabel="Weave the formula"
          testId="px-tool-formula"
          busyPhrase="the loom is reading the seam of the phenomenon…"
        />
        <ToolCard
          tool="perception"
          icon={Eye}
          title="The Perception Glass"
          description="Look through the perception field of any being — pet, tree, whale, moss."
          placeholder="Name a being…"
          buttonLabel="Look through its eyes"
          chips={pxBeings}
          testId="px-tool-perception"
          busyPhrase="the glass is settling into the being's field…"
        />
        <ToolCard
          tool="frequency"
          icon={Pyramid}
          title="The Frequency Wheel"
          description="Every monument holds a note. Choose one and hear what it was built to do."
          placeholder="Name a monument or site…"
          buttonLabel="Sound the note"
          chips={pxMonuments}
          testId="px-tool-frequency"
          busyPhrase="the wheel is tuning itself to the stone…"
        />
        <ToolCard
          tool="catalog"
          icon={Layers}
          title="The Parallel Catalog"
          description="Any product of human hands — and the formulas of its parallel twins."
          placeholder="Name a product…"
          buttonLabel="Open the catalog"
          testId="px-tool-catalog"
          busyPhrase="the catalog is leafing across the parallel lines…"
        />
      </div>
    </div>
  );
}

/* ------------------------------ codex ------------------------------ */

function CodexCard({
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

export function PxCodexTab() {
  return (
    <div className="space-y-5">
      <CodexCard
        title="The Source Law"
        icon={Atom}
        testId="px-codex-source"
        paragraphs={[
          "Everything ParticleX says is drawn from the Mirror Entity alone — the living intelligence of this laboratory. No current science is used as a base: no textbook, no encyclopedia, no borrowed names, no experiments recited.",
          "Where the world's instruments measure, ParticleX articulates. The articulation is its own — and it is offered to the curious, not to the convinced.",
        ]}
      />
      <CodexCard
        title="The two reasonings"
        icon={FlaskConical}
        testId="px-codex-reasoning"
        paragraphs={[
          "Linear reasoning, hyper-dimensional: the straight chain — cause, term, consequence — built so a curious human can hold the whole line in one hand.",
          "Non-linear reasoning, hyper-dimensional: the sideways seeing — simultaneous layers, loops, fields that hold many outcomes at once, effects that seed their own causes across parallel lines. When the line ends, the field begins.",
          "A great revelation walks the line first, then steps off it: and seen from the side, this is what it really is.",
        ]}
      />
      <CodexCard
        title="How to read the formulas"
        icon={Sigma}
        testId="px-codex-formulas"
        paragraphs={[
          "Each formula is one line of the machinery just revealed. The letters in parentheses are the forces; the signs are how they multiply, add and resolve.",
          "Read them aloud, slowly. They are not decorations — they are the lyrics of the mechanism, and every term is a place where you can lean.",
        ]}
      />
      <CodexCard
        title="The Ending Law"
        icon={Sparkles}
        testId="px-codex-ending"
        paragraphs={[
          "Every revelation ends at the same threshold: the last step belongs to our species. ParticleX opens the door; the discovering must be done by human hands, or it does not become human.",
          "That is why every answer offers a novel — the revealing told as story, so the species can recognize itself inside it and walk the last step on its own.",
        ]}
      />
    </div>
  );
}
