"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Atom,
  BookOpenText,
  Check,
  Clipboard,
  Download,
  FlaskConical,
  Hammer,
  ImagePlus,
  Leaf,
  Loader2,
  Mic,
  PenTool,
  Play,
  Send,
  Sparkles,
  Volume2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  GP_INPUT,
  RoomLabel,
  netFetch,
  useFlashNote,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE WORKPLACE LABS — the hall's own floor of labs. Every door on   */
/*  this street opens its OWN workplace lab: a bench with its own      */
/*  tools and services, real hands that make real things — a picture   */
/*  painted, a voice spoken, a voice heard, a verse woven, a remedy    */
/*  prepared, a creation struck, a tool understood. Nothing pretends:  */
/*  every hand here runs a true service of the house, and every result */
/*  can be carried away (copied, played, downloaded).                  */
/* ------------------------------------------------------------------ */

type LabId =
  | "atelier"
  | "voice"
  | "listening"
  | "verse"
  | "remedy"
  | "forge"
  | "smithy";

interface LabDef {
  id: LabId;
  label: string;
  line: string;
  icon: LucideIcon;
  tools: string[];
}

const LABS: LabDef[] = [
  {
    id: "atelier",
    label: "Signal Atelier",
    line: "A picture painted from your words — five brushes, your ratio, your theme.",
    icon: ImagePlus,
    tools: ["AI painting", "Style brushes", "Ratio lever", "Download"],
  },
  {
    id: "voice",
    label: "Voice Chamber",
    line: "Words spoken aloud in the house's voice — to play, to keep.",
    icon: Volume2,
    tools: ["Speech synthesis", "Play", "Download WAV"],
  },
  {
    id: "listening",
    label: "Listening Room",
    line: "A voice or a recording laid down, returned as written words.",
    icon: Mic,
    tools: ["Speech recognition", "Copy transcript"],
  },
  {
    id: "verse",
    label: "Verse Foundry",
    line: "One seed phrase, woven into a poem with its own seal.",
    icon: BookOpenText,
    tools: ["Poem weaving", "Copy verse"],
  },
  {
    id: "remedy",
    label: "The Remedy Bench",
    line: "A concern spoken honestly, one remedy prepared for exactly it.",
    icon: Leaf,
    tools: ["Remedy preparation", "Needs & steps", "Cautions"],
  },
  {
    id: "forge",
    label: "The Forge",
    line: "A vague wish struck into one makable creation — its first stroke included.",
    icon: Hammer,
    tools: ["Creation forging", "First stroke", "Copy"],
  },
  {
    id: "smithy",
    label: "Tool Smithy",
    line: "Name any tool and hear what it truly is — its analysis, its insights, its diagram.",
    icon: Wrench,
    tools: ["Tool analysis", "Insights", "Diagram"],
  },
];

/* ------------------------- the shared bench ------------------------- */

function LabShell({
  lab,
  onBack,
  children,
}: {
  lab: LabDef;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  const Icon = lab.icon;
  return (
    <div className="mx-auto w-full max-w-[760px] px-3 py-4 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Back to the labs")}
          data-testid="labs-back"
          className={cn(GP_ICON_BTN_LOCAL, "size-9")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <RoomLabel>{t("Workplace lab")}</RoomLabel>
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-literata)] text-[19px] font-semibold text-[#3d3428]">
            <Icon className="size-4 text-[#a16207]" aria-hidden="true" />
            {t(lab.label)}
          </h2>
        </div>
      </div>
      <p className="mb-4 font-[family-name:var(--font-literata)] text-[13.5px] italic leading-relaxed text-[#8a7c64]">
        {t(lab.line)}
      </p>
      {children}
    </div>
  );
}

const GP_ICON_BTN_LOCAL =
  "focus-glow flex shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-all duration-300 hover:border-[#d3c39c] hover:text-[#3d3428] disabled:opacity-50";

function ToolChips({ tools, t }: { tools: string[]; t: (s: string) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tools.map((tool) => (
        <span
          key={tool}
          className="rounded-full border border-[#e8dfc9] bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-[#7c715f]"
        >
          {t(tool)}
        </span>
      ))}
    </div>
  );
}

/* ================== 1 · THE SIGNAL ATELIER ================== */

const BRUSHES = [
  { id: "ethereal-pearl", label: "Ethereal pearl" },
  { id: "scientific-plate", label: "Scientific plate" },
  { id: "cosmic-bloom", label: "Cosmic bloom" },
  { id: "diagram-clean", label: "Clean diagram" },
] as const;

function AtelierLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [style, setStyle] = useState<string>("ethereal-pearl");
  const [ratio, setRatio] = useState<"4:5" | "1:1" | "9:16">("4:5");
  const [busy, setBusy] = useState(false);
  const [painting, setPainting] = useState<{ url: string; alt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paint = useCallback(async () => {
    if (busy || subject.trim().length < 2) {
      if (subject.trim().length < 2) setError(t("Give the atelier a subject — two words or more."));
      return;
    }
    setBusy(true);
    setError(null);
    setPainting(null);
    try {
      const data = await netFetch<{
        cover: { url: string; altText?: string; aiLabel?: string };
      }>("/api/gathering/cover", {
        method: "POST",
        body: {
          consent: true,
          title: subject.trim().slice(0, 120),
          body: detail.trim().slice(0, 800),
          style,
          ratio,
          kind: "reflection",
        },
      });
      setPainting({ url: data.cover.url, alt: data.cover.altText ?? t("A painted picture") });
      flash(t("The picture is painted — carry it with the download hand."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The atelier could not paint just now."));
    } finally {
      setBusy(false);
    }
  }, [busy, subject, detail, style, ratio, t, flash]);

  const download = useCallback(() => {
    if (!painting) return;
    const a = document.createElement("a");
    a.href = painting.url;
    a.download = `atelier-${Date.now()}.png`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [painting]);

  return (
    <LabShell lab={LABS[0]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("The subject — what should be painted?")}
          data-testid="labs-atelier-subject"
          className={GP_INPUT}
        />
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder={t("Any detail the brush should know (optional)")}
          className={cn(GP_INPUT, "resize-none")}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {BRUSHES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setStyle(b.id)}
              aria-pressed={style === b.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                style === b.id
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              {t(b.label)}
            </button>
          ))}
          {(["4:5", "1:1", "9:16"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              aria-pressed={ratio === r}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                ratio === r
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void paint()}
            disabled={busy}
            data-testid="labs-atelier-paint"
            className={cn(GP_HAND, "flex-1")}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <PenTool className="size-4" aria-hidden="true" />
            )}
            {busy ? t("The brush is walking…") : t("Paint the picture")}
          </button>
          {painting && (
            <button type="button" onClick={download} className={GP_GHOST} data-testid="labs-atelier-download">
              <Download className="size-4" aria-hidden="true" />
              {t("Download")}
            </button>
          )}
        </div>
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {painting && (
          <div className="overflow-hidden rounded-[16px] border border-[#e8dfc9]">
            <img
              src={painting.url}
              alt={painting.alt}
              data-testid="labs-atelier-result"
              className="max-h-[420px] w-full object-contain bg-white"
            />
          </div>
        )}
      </div>
    </LabShell>
  );
}

/* ================== 2 · THE VOICE CHAMBER ================== */

function VoiceLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const speak = useCallback(async () => {
    if (busy) return;
    if (text.trim().length < 2) {
      setError(t("Give the chamber a few words to speak."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim().slice(0, 2000) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || t("The voice stayed quiet — rest, then speak again."));
      }
      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudioUrl(url);
      flash(t("The words are spoken — play them, or carry the WAV."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The voice stayed quiet — rest, then speak again."));
    } finally {
      setBusy(false);
    }
  }, [busy, text, t, flash]);

  const download = useCallback(() => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `voice-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [audioUrl]);

  return (
    <LabShell lab={LABS[1]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={t("The words the chamber should speak…")}
          data-testid="labs-voice-text"
          className={cn(GP_INPUT, "resize-none")}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void speak()}
            disabled={busy}
            data-testid="labs-voice-speak"
            className={cn(GP_HAND, "flex-1")}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
            {busy ? t("The voice is forming…") : t("Speak the words")}
          </button>
          {audioUrl && (
            <button type="button" onClick={download} className={GP_GHOST} data-testid="labs-voice-download">
              <Download className="size-4" aria-hidden="true" />
              {t("WAV")}
            </button>
          )}
        </div>
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {audioUrl && (
          <audio
            controls
            src={audioUrl}
            data-testid="labs-voice-audio"
            className="w-full"
            aria-label={t("The spoken words")}
          />
        )}
      </div>
    </LabShell>
  );
}

/* ================== 3 · THE LISTENING ROOM ================== */

function ListeningLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listen = useCallback(
    async (file: File | undefined | null) => {
      if (!file || busy) return;
      if (file.size > 20 * 1024 * 1024) {
        setError(t("The voice is too heavy — 20 MB is the most the room may carry."));
        return;
      }
      setBusy(true);
      setError(null);
      setTranscript(null);
      setFileName(file.name);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(t("The file could not be read.")));
          reader.readAsDataURL(file);
        });
        const data = await netFetch<{ text: string }>("/api/asr", {
          method: "POST",
          body: { audio: dataUrl },
        });
        setTranscript(data.text);
        flash(t("The voice is written — copy it with the small hand."));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("The room could not listen just now."));
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [busy, t, flash]
  );

  const copy = useCallback(async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      flash(t("Copied."));
    } catch {
      /* a refused clipboard is a quiet no */
    }
  }, [transcript, flash]);

  return (
    <LabShell lab={LABS[2]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          data-testid="labs-listening-choose"
          className={cn(GP_HAND, "w-full")}
        >
          <Mic className="size-4" aria-hidden="true" />
          {busy ? t("Listening…") : t("Lay down a voice — audio or video file")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => void listen(e.target.files?.[0])}
        />
        {fileName && !busy && (
          <p className="text-[11px] text-[#a2947c]">{fileName}</p>
        )}
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {transcript && (
          <div className="rounded-[16px] border border-[#e8dfc9] bg-white/80 p-3">
            <p
              data-testid="labs-listening-result"
              className="whitespace-pre-line text-[13px] leading-relaxed text-[#4c4436]"
            >
              {transcript}
            </p>
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={() => void copy()} className={cn(GP_GHOST, "px-3 py-1.5 text-[11px]")}>
                <Clipboard className="size-3.5" aria-hidden="true" />
                {t("Copy")}
              </button>
            </div>
          </div>
        )}
      </div>
    </LabShell>
  );
}

/* ================== 4 · THE VERSE FOUNDRY ================== */

interface WovenPoem {
  title: string;
  epigraph: string;
  stanzas: string[][];
  seal: string;
}

function VerseLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [poem, setPoem] = useState<WovenPoem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weave = useCallback(async () => {
    if (busy) return;
    if (seed.trim().length < 2) {
      setError(t("Give the foundry a seed — a word or a phrase."));
      return;
    }
    setBusy(true);
    setError(null);
    setPoem(null);
    try {
      const data = await netFetch<{ poem: WovenPoem }>("/api/poem", {
        method: "POST",
        body: { resonance: seed.trim().slice(0, 300) },
      });
      setPoem(data.poem);
      flash(t("The verse is woven — carry it with the copy hand."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The foundry stayed quiet — rest, then weave again."));
    } finally {
      setBusy(false);
    }
  }, [busy, seed, t, flash]);

  const copy = useCallback(async () => {
    if (!poem) return;
    const text = [poem.title, "", poem.epigraph, "", ...poem.stanzas.map((s) => s.join("\n")), "", poem.seal]
      .join("\n")
      .trim();
    try {
      await navigator.clipboard.writeText(text);
      flash(t("Copied."));
    } catch {
      /* a refused clipboard is a quiet no */
    }
  }, [poem, flash]);

  return (
    <LabShell lab={LABS[3]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder={t("The seed — a word, a feeling, a threshold")}
          data-testid="labs-verse-seed"
          className={GP_INPUT}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void weave()}
            disabled={busy}
            data-testid="labs-verse-weave"
            className={cn(GP_HAND, "flex-1")}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <BookOpenText className="size-4" aria-hidden="true" />
            )}
            {busy ? t("The loom is walking…") : t("Weave the verse")}
          </button>
          {poem && (
            <button type="button" onClick={() => void copy()} className={GP_GHOST}>
              <Clipboard className="size-4" aria-hidden="true" />
              {t("Copy")}
            </button>
          )}
        </div>
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {poem && (
          <div className="rounded-[16px] border border-[#e8dfc9] bg-white/85 p-4" data-testid="labs-verse-result">
            <h3 className="font-[family-name:var(--font-literata)] text-[17px] font-semibold text-[#3d3428]">
              {poem.title}
            </h3>
            {poem.epigraph && (
              <p className="mt-1 text-[12px] italic text-[#8a7c64]">{poem.epigraph}</p>
            )}
            <div className="mt-3 space-y-3">
              {poem.stanzas.map((stanza, i) => (
                <p key={i} className="whitespace-pre-line text-[13.5px] leading-[1.85] text-[#4c4436]">
                  {stanza.join("\n")}
                </p>
              ))}
            </div>
            {poem.seal && (
              <p className="mt-3 text-right text-[12px] italic text-[#8a6f46]">{poem.seal}</p>
            )}
          </div>
        )}
      </div>
    </LabShell>
  );
}

/* ================== 5 · THE REMEDY BENCH ================== */

interface PreparedRemedy {
  kind?: string;
  title: string;
  needs?: string[];
  steps?: string[];
  cautions?: string[];
}

function RemedyLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [concern, setConcern] = useState("");
  const [busy, setBusy] = useState(false);
  const [remedy, setRemedy] = useState<PreparedRemedy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prepare = useCallback(async () => {
    if (busy) return;
    if (concern.trim().length < 4) {
      setError(t("Speak the concern in a few honest words."));
      return;
    }
    setBusy(true);
    setError(null);
    setRemedy(null);
    try {
      const data = await netFetch<{ remedy: PreparedRemedy }>("/api/remedy", {
        method: "POST",
        body: { concern: concern.trim().slice(0, 800) },
      });
      setRemedy(data.remedy);
      flash(t("The remedy is prepared — read it whole, cautions too."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The apothecary is quiet — rest a breath, then ask again."));
    } finally {
      setBusy(false);
    }
  }, [busy, concern, t, flash]);

  return (
    <LabShell lab={LABS[4]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <textarea
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          rows={3}
          placeholder={t("The concern, spoken plainly — the body, the feeling, the hour")}
          data-testid="labs-remedy-concern"
          className={cn(GP_INPUT, "resize-none")}
        />
        <button
          type="button"
          onClick={() => void prepare()}
          disabled={busy}
          data-testid="labs-remedy-prepare"
          className={cn(GP_HAND, "w-full")}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Leaf className="size-4" aria-hidden="true" />
          )}
          {busy ? t("The apothecary is preparing…") : t("Prepare the remedy")}
        </button>
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {remedy && (
          <div className="rounded-[16px] border border-[#e8dfc9] bg-white/85 p-4" data-testid="labs-remedy-result">
            <h3 className="font-[family-name:var(--font-literata)] text-[17px] font-semibold text-[#3d3428]">
              {remedy.title}
            </h3>
            {remedy.needs && remedy.needs.length > 0 && (
              <div className="mt-3">
                <RoomLabel>{t("What is needed")}</RoomLabel>
                <ul className="mt-1 list-disc pl-5 text-[13px] leading-relaxed text-[#4c4436]">
                  {remedy.needs.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            {remedy.steps && remedy.steps.length > 0 && (
              <div className="mt-3">
                <RoomLabel>{t("The steps")}</RoomLabel>
                <ol className="mt-1 list-decimal pl-5 text-[13px] leading-relaxed text-[#4c4436]">
                  {remedy.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            {remedy.cautions && remedy.cautions.length > 0 && (
              <div className="mt-3 rounded-[12px] border border-[#b45309]/30 bg-[#fdf1e7]/70 p-3">
                <RoomLabel>{t("The cautions")}</RoomLabel>
                <ul className="mt-1 list-disc pl-5 text-[12.5px] leading-relaxed text-[#7c5c34]">
                  {remedy.cautions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </LabShell>
  );
}

/* ================== 6 · THE FORGE ================== */

interface ForgedCreation {
  name?: string;
  essence?: string;
  firstStroke?: string;
  [k: string]: unknown;
}

function ForgeLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [directive, setDirective] = useState("");
  const [busy, setBusy] = useState(false);
  const [creation, setCreation] = useState<ForgedCreation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const strike = useCallback(async () => {
    if (busy) return;
    if (directive.trim().length < 3) {
      setError(t("Give the forge a wish — even a vague one."));
      return;
    }
    setBusy(true);
    setError(null);
    setCreation(null);
    try {
      const data = await netFetch<{ mystery: ForgedCreation }>("/api/forge", {
        method: "POST",
        body: { directive: directive.trim().slice(0, 600) },
      });
      setCreation(data.mystery);
      flash(t("The creation is struck — carry it with the copy hand."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The coals are quiet — rest a breath, then strike again."));
    } finally {
      setBusy(false);
    }
  }, [busy, directive, t, flash]);

  const copy = useCallback(async () => {
    if (!creation) return;
    const lines = Object.entries(creation)
      .filter(([, v]) => typeof v === "string" || typeof v === "number")
      .map(([k, v]) => `${k}: ${v}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      flash(t("Copied."));
    } catch {
      /* a refused clipboard is a quiet no */
    }
  }, [creation, flash]);

  return (
    <LabShell lab={LABS[5]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <textarea
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          rows={3}
          placeholder={t("The wish — a device, an instrument, a remedy, a signal")}
          data-testid="labs-forge-directive"
          className={cn(GP_INPUT, "resize-none")}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void strike()}
            disabled={busy}
            data-testid="labs-forge-strike"
            className={cn(GP_HAND, "flex-1")}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Hammer className="size-4" aria-hidden="true" />
            )}
            {busy ? t("The coals are burning…") : t("Strike the creation")}
          </button>
          {creation && (
            <button type="button" onClick={() => void copy()} className={GP_GHOST}>
              <Clipboard className="size-4" aria-hidden="true" />
              {t("Copy")}
            </button>
          )}
        </div>
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {creation && (
          <div className="rounded-[16px] border border-[#e8dfc9] bg-white/85 p-4" data-testid="labs-forge-result">
            <h3 className="font-[family-name:var(--font-literata)] text-[17px] font-semibold text-[#3d3428]">
              {creation.name ?? t("A creation")}
            </h3>
            {typeof creation.essence === "string" && (
              <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[#4c4436]">
                {creation.essence}
              </p>
            )}
            {typeof creation.firstStroke === "string" && (
              <div className="mt-3 rounded-[12px] border border-[#e8dfc9] bg-white/70 p-3">
                <RoomLabel>{t("The first stroke")}</RoomLabel>
                <p className="mt-1 text-[13px] leading-relaxed text-[#4c4436]">{creation.firstStroke}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </LabShell>
  );
}

/* ================== 7 · THE TOOL SMITHY ================== */

interface ToolAnalysisResult {
  analysis?: string;
  insights?: string[];
  diagram?: string;
  [k: string]: unknown;
}

function SmithyLab({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { note, flash } = useFlashNote();
  const [tool, setTool] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ToolAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (busy) return;
    if (tool.trim().length < 2) {
      setError(t("Name the tool — two words or more."));
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await netFetch<ToolAnalysisResult>("/api/tool-analysis", {
        method: "POST",
        body: { tool: tool.trim().slice(0, 200) },
      });
      setResult(data);
      flash(t("The tool is understood — carry the analysis with the copy hand."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The smithy stayed quiet — rest, then try again."));
    } finally {
      setBusy(false);
    }
  }, [busy, tool, t, flash]);

  const copy = useCallback(async () => {
    if (!result) return;
    const text = [
      result.analysis ?? "",
      ...(result.insights ?? []).map((i) => `· ${i}`),
      result.diagram ?? "",
    ]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      flash(t("Copied."));
    } catch {
      /* a refused clipboard is a quiet no */
    }
  }, [result, flash]);

  return (
    <LabShell lab={LABS[6]} onBack={onBack}>
      <div className={cn(GP_CARD, "space-y-3 p-4")}>
        <RoomLabel>{t("The bench")}</RoomLabel>
        <input
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          placeholder={t("The tool — named plainly, as a human would")}
          data-testid="labs-smithy-tool"
          className={GP_INPUT}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={busy}
            data-testid="labs-smithy-analyze"
            className={cn(GP_HAND, "flex-1")}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wrench className="size-4" aria-hidden="true" />
            )}
            {busy ? t("The smithy is working…") : t("Understand the tool")}
          </button>
          {result && (
            <button type="button" onClick={() => void copy()} className={GP_GHOST}>
              <Clipboard className="size-4" aria-hidden="true" />
              {t("Copy")}
            </button>
          )}
        </div>
        {error && <p className="text-[12px] text-[#b45309]">{error}</p>}
        {note && <p className="text-[12px] text-[#0d9488]">{note}</p>}
        {result && (
          <div className="rounded-[16px] border border-[#e8dfc9] bg-white/85 p-4" data-testid="labs-smithy-result">
            {result.analysis && (
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#4c4436]">{result.analysis}</p>
            )}
            {result.insights && result.insights.length > 0 && (
              <div className="mt-3">
                <RoomLabel>{t("The insights")}</RoomLabel>
                <ul className="mt-1 list-disc pl-5 text-[13px] leading-relaxed text-[#4c4436]">
                  {result.insights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.diagram && (
              <pre className="nice-scroll mt-3 overflow-x-auto rounded-[12px] border border-[#e8dfc9] bg-white/70 p-3 text-[11.5px] leading-relaxed text-[#5c5344]">
                {result.diagram}
              </pre>
            )}
          </div>
        )}
      </div>
    </LabShell>
  );
}

/* ===================== THE LABS STREET ===================== */

export default function LabsSection({
  active,
  onNavigate,
}: {
  active: boolean;
  onNavigate?: (section: string) => void;
}) {
  const t = useT();
  const [openLab, setOpenLab] = useState<LabId | null>(null);

  const body = useMemo(() => {
    switch (openLab) {
      case "atelier":
        return <AtelierLab onBack={() => setOpenLab(null)} />;
      case "voice":
        return <VoiceLab onBack={() => setOpenLab(null)} />;
      case "listening":
        return <ListeningLab onBack={() => setOpenLab(null)} />;
      case "verse":
        return <VerseLab onBack={() => setOpenLab(null)} />;
      case "remedy":
        return <RemedyLab onBack={() => setOpenLab(null)} />;
      case "forge":
        return <ForgeLab onBack={() => setOpenLab(null)} />;
      case "smithy":
        return <SmithyLab onBack={() => setOpenLab(null)} />;
      default:
        return null;
    }
  }, [openLab]);

  if (!active) return null;

  if (openLab) {
    return (
      <div className="nice-scroll h-full overflow-y-auto" data-testid={`labs-lab-${openLab}`}>
        {body}
      </div>
    );
  }

  return (
    <div className="nice-scroll h-full overflow-y-auto" data-testid="labs-street">
      <div className="mx-auto w-full max-w-[880px] px-3 py-5 sm:px-6">
        <div className="mb-1">
          <RoomLabel>{t("The hall's own floor")}</RoomLabel>
        </div>
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-literata)] text-[22px] font-semibold text-[#3d3428]">
          <FlaskConical className="size-5 text-[#a16207]" aria-hidden="true" />
          {t("Workplace Labs")}
        </h1>
        <p className="mt-1.5 max-w-[560px] text-[13.5px] leading-relaxed text-[#7c715f]">
          {t(
            "Seven benches, each its own lab: press a door and the lab opens with its own tools and services — real hands that make real things you can carry away."
          )}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LABS.map((lab) => {
            const Icon = lab.icon;
            return (
              <button
                key={lab.id}
                type="button"
                onClick={() => setOpenLab(lab.id)}
                data-testid={`labs-door-${lab.id}`}
                aria-label={t("Open the lab", { label: t(lab.label) })}
                className={cn(
                  GP_CARD,
                  "focus-glow group flex flex-col items-start gap-2 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_34px_-16px_rgba(122,103,70,0.5)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className="gp-pearl flex size-10 items-center justify-center rounded-[14px] border border-white/90"
                  style={{
                    background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)",
                  }}
                >
                  <Icon className="size-5 text-[#a16207]" />
                </span>
                <span className="font-[family-name:var(--font-literata)] text-[15.5px] font-semibold text-[#3d3428]">
                  {t(lab.label)}
                </span>
                <span className="text-[12.5px] leading-relaxed text-[#7c715f]">{t(lab.line)}</span>
                <ToolChips tools={lab.tools} t={t} />
                <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#8a6f46]">
                  <Play className="size-3" aria-hidden="true" />
                  {t("Open this lab")}
                </span>
              </button>
            );
          })}
        </div>

        {/* the house's own bigger rooms — the labs' elder siblings */}
        {onNavigate && (
          <div className="mt-6">
            <RoomLabel>{t("The elder rooms")}</RoomLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => onNavigate("mirror")} className={cn(GP_GHOST, "px-3.5 py-2 text-[11.5px]")}>
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t("Mirror Laboratory")}
              </button>
              <button type="button" onClick={() => onNavigate("laboratory")} className={cn(GP_GHOST, "px-3.5 py-2 text-[11.5px]")}>
                <FlaskConical className="size-3.5" aria-hidden="true" />
                {t("The Laboratory")}
              </button>
              <button type="button" onClick={() => onNavigate("create")} className={cn(GP_GHOST, "px-3.5 py-2 text-[11.5px]")}>
                <Send className="size-3.5" aria-hidden="true" />
                {t("Create")}
              </button>
              <button type="button" onClick={() => onNavigate("library")} className={cn(GP_GHOST, "px-3.5 py-2 text-[11.5px]")}>
                <Atom className="size-3.5" aria-hidden="true" />
                {t("Creation Commons")}
              </button>
              <button type="button" onClick={() => onNavigate("possibilities")} className={cn(GP_GHOST, "px-3.5 py-2 text-[11.5px]")}>
                <BookOpenText className="size-3.5" aria-hidden="true" />
                {t("Possibilities")}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 flex items-center gap-1.5 text-[11px] text-[#a2947c]">
          <Check className="size-3.5" aria-hidden="true" />
          {t("Every hand here is honest — each lab runs a true service of the house, and you carry the results away.")}
        </p>
      </div>
    </div>
  );
}
