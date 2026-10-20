"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Feather,
  Film,
  Globe,
  ImagePlus,
  Link2,
  Loader2,
  Lock,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Users,
  UsersRound,
  Wand2,
  X,
} from "lucide-react";
import { LANGUAGES, useT, useUiLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  EVIDENCE_LABEL,
  EVIDENCE_LEVELS,
  KIND_META,
  KIND_OFFERING_LABEL,
  KIND_ORDER,
  type CircleCard,
  type GatheringPost,
  type MeState,
  EvidenceChip,
  GP_CARD,
  GP_GHOST,
  GP_HAND,
  GP_ICON_BTN,
  GP_INPUT,
  MakerMark,
  RoomLabel,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE COMPOSER'S OWN STREET — Create, the universal door.            */
/*                                                                     */
/*  Six honest steps, one offering:                                    */
/*    1 · INTENT   — choose the offering's kind, or simply begin       */
/*                   writing and let the words suggest it;             */
/*    2 · WORDS    — the title, the body, the threads of meaning, the  */
/*                   tongue, and who may read it. Autosaved on the     */
/*                   maker's own bench after every pause;              */
/*    3 · VISUAL   — no image, the maker's own, or a matching picture  */
/*                   painted on request — consent first, style chosen, */
/*                   the engine's work always labeled;                 */
/*    4 · PREVIEW  — the offering as it will hang, alt text in the     */
/*                   maker's own hand;                                 */
/*    5 · HANG     — published exactly once, under an idempotency      */
/*                   key, however many times the hand retries;         */
/*    6 · DONE     — the canonical link, the share, the hall's door.   */
/*                                                                     */
/*  Nothing is auto-published; nothing is painted without a yes; the   */
/*  draft survives refreshes, journeys and dead batteries.             */
/* ------------------------------------------------------------------ */

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Array<{ n: Step; label: string }> = [
  { n: 1, label: "Intent" },
  { n: 2, label: "Words" },
  { n: 3, label: "Visual" },
  { n: 4, label: "Preview" },
  { n: 5, label: "Hang" },
  { n: 6, label: "Done" },
];

/* the kinds that may honestly wear an evidence label */
const EPISTEMIC_KINDS: string[] = [
  "discovery",
  "finding",
  "hypothesis",
  "experiment",
  "question",
  "discussion",
];

/* the composer's visual doors */
type VisualChoice = "none" | "upload" | "generate";

/* the style dresses the atelier paints in */
const COVER_STYLES: Array<{ key: string; label: string; note: string }> = [
  { key: "editorial", label: "Scientific Editorial", note: "Museum-plate linework, cream ground" },
  { key: "ethereal-pearl", label: "Ethereal Pearl", note: "Ivory light, champagne-gold accents" },
  { key: "observatory", label: "Cosmic Observatory", note: "Quiet sky, brass and glass, lantern glow" },
  { key: "diagram", label: "Conceptual Diagram", note: "Geometric abstraction, thin strokes" },
  { key: "book-cover", label: "Minimal Book Cover", note: "One symbol, generous negative space" },
  { key: "music-atmosphere", label: "Music Atmosphere", note: "Sound made of soft light" },
  { key: "custom", label: "My own direction", note: "Speak the picture yourself" },
];

const RATIOS: Array<{ key: string; label: string }> = [
  { key: "1:1", label: "Square · 1:1" },
  { key: "4:5", label: "Portrait · 4:5" },
  { key: "16:9", label: "Wide · 16:9" },
  { key: "9:16", label: "Story · 9:16" },
];

/* the words a draft carries */
interface DraftState {
  kind: string;
  title: string;
  body: string;
  tags: string;
  epistemic: string;
  circleId: string;
  language: string;
  visibility: string;
  media: { url: string; type: string; name: string | null } | null;
  altText: string;
  aiMedia: boolean;
  aiStyle: string | null;
}

const EMPTY_DRAFT: DraftState = {
  kind: "reflection",
  title: "",
  body: "",
  tags: "",
  epistemic: "",
  circleId: "",
  language: "en",
  visibility: "public",
  media: null,
  altText: "",
  aiMedia: false,
  aiStyle: null,
};

/* the bench's own shape on the wire — media arrives as three fields */
type ApiDraft = Omit<DraftState, "media"> & {
  mediaUrl: string | null;
  mediaType: string | null;
  mediaName: string | null;
  revision: number;
  updatedAt?: string;
};

const IMAGE_MAX = 8 * 1024 * 1024; // 8 MB

/* a large picture is woven down before the climb — smaller to carry,
   just as honest to look at; gifs keep their motion untouched */
async function weavePictureDown(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size <= 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.82)
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/* the words' own hint — what the text reads like, offered gently */
function inferKind(title: string, body: string): string | null {
  const text = `${title} ${body}`.toLowerCase();
  if (!text.trim()) return null;
  if (/(hypothes|might it be that|theory of mine)/.test(text)) return "hypothesis";
  if (/(experiment|measure|observe and record|trial)/.test(text)) return "experiment";
  if (/(discovered|discovery|found that|breakthrough)/.test(text)) return "discovery";
  if (/(dream|i dreamed|in the dream)/.test(text)) return "dream";
  if (/(song|melody|composition|music)/.test(text)) return "music";
  if (/(book|chapter|manuscript)/.test(text)) return "book";
  if (/(intention|vow|purpose|pledge)/.test(text)) return "intention";
  if (/(collaborat|together|join me|looking for)/.test(text)) return "collaboration";
  if (text.trim().endsWith("?") || /(wonder|question|why does|what if)/.test(text)) return "question";
  return null;
}

export default function CreateRoom({
  active,
  me,
  circles,
  onOpenHall,
  onPublishWork,
}: {
  active: boolean;
  me: MeState | null;
  circles: CircleCard[];
  onOpenHall: () => void;
  onPublishWork: () => void;
}) {
  const t = useT();
  const uiLang = useUiLanguage((s) => s.language);

  const [step, setStep] = useState<Step>(1);
  const maxStepRef = useRef<Step>(1);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const kindChosenRef = useRef(false);

  /* the bench — the draft that survives journeys */
  const [bench, setBench] = useState<{ revision: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const skipSaveRef = useRef(true);

  /* the visual's own hands */
  const [visual, setVisual] = useState<VisualChoice>("none");
  const [genStyle, setGenStyle] = useState("ethereal-pearl");
  const [genRatio, setGenRatio] = useState("4:5");
  const [customNote, setCustomNote] = useState("");
  const [genConsent, setGenConsent] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  /* the hanging */
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [hung, setHung] = useState<GatheringPost | null>(null);
  const [copied, setCopied] = useState(false);
  const publishKeyRef = useRef<string>(
    `pk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
  );

  const myCircles = useMemo(() => circles.filter((c) => c.joined), [circles]);

  /* the bench's first read — one breath when the street opens */
  useEffect(() => {
    if (!active || hydrated) return;
    let alive = true;
    (async () => {
      try {
        const data = await netFetch<{ draft: ApiDraft | null }>(
          "/api/gathering/drafts"
        );
        if (!alive) return;
        if (data.draft && ((data.draft.title ?? "").trim().length > 0 || (data.draft.body ?? "").trim().length > 0)) {
          setBench({ revision: data.draft.revision });
        }
      } catch {
        /* an empty bench is a quiet bench */
      } finally {
        if (alive) {
          setDraft((d) => ({ ...d, language: d.language === "en" ? uiLang : d.language }));
          skipSaveRef.current = false;
          setHydrated(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, hydrated, uiLang]);

  /* resume the bench — the words come home */
  const resumeBench = useCallback(async () => {
    try {
      const data = await netFetch<{ draft: ApiDraft | null }>("/api/gathering/drafts");
      if (!data.draft) {
        setBench(null);
        return;
      }
      const d = data.draft;
      setDraft({
        kind: d.kind,
        title: d.title ?? "",
        body: d.body ?? "",
        tags: d.tags ?? "",
        epistemic: d.epistemic ?? "",
        circleId: d.circleId ?? "",
        language: d.language ?? "en",
        visibility: d.visibility ?? "public",
        media: d.mediaUrl
          ? { url: d.mediaUrl, type: d.mediaType ?? "image", name: d.mediaName ?? null }
          : null,
        altText: d.altText ?? "",
        aiMedia: d.aiMedia ?? false,
        aiStyle: d.aiStyle ?? null,
      });
      if (d.kind) kindChosenRef.current = true;
      setVisual(d.mediaUrl ? (d.aiMedia ? "generate" : "upload") : "none");
      skipSaveRef.current = true;
      window.setTimeout(() => {
        skipSaveRef.current = false;
      }, 1500);
      setBench(null);
      setStep(2);
      maxStepRef.current = 2;
    } catch {
      /* the bench keeps its silence */
    }
  }, []);

  const discardBench = useCallback(async () => {
    setBench(null);
    try {
      await netFetch("/api/gathering/drafts", { method: "DELETE" });
    } catch {
      /* a cleared bench needs no news */
    }
  }, []);

  /* the autosave hand — every pause rests the words on the bench */
  useEffect(() => {
    if (!hydrated || step === 6) return;
    const hasWords = draft.title.trim().length > 0 || draft.body.trim().length > 0;
    if (!hasWords) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      if (skipSaveRef.current) return;
      setSavingDraft(true);
      netFetch<{ draft: { revision: number } }>("/api/gathering/drafts", {
        method: "PUT",
        body: {
          kind: draft.kind,
          title: draft.title,
          body: draft.body,
          tags: draft.tags,
          epistemic: draft.epistemic,
          circleId: draft.circleId,
          language: draft.language,
          visibility: draft.visibility,
          mediaUrl: draft.media?.url ?? null,
          mediaType: draft.media?.type ?? null,
          mediaName: draft.media?.name ?? null,
          altText: draft.altText,
          aiMedia: draft.aiMedia,
          aiStyle: draft.aiStyle,
        },
      })
        .then((data) => setBench({ revision: data.draft.revision }))
        .catch(() => {
          /* a missed save is followed by the next one */
        })
        .finally(() => setSavingDraft(false));
    }, 1200);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [draft, hydrated, step]);

  /* the words' own hint — offered once, never imposed */
  const hint = useMemo(() => {
    if (kindChosenRef.current) return null;
    return inferKind(draft.title, draft.body);
  }, [draft.title, draft.body]);

  const goto = useCallback((next: Step) => {
    maxStepRef.current = Math.max(maxStepRef.current, next) as Step;
    setStep(next);
  }, []);

  const canHang = draft.title.trim().length >= 2 && draft.body.trim().length >= 2 && !publishing;

  /* the upload hand — the maker's own picture or film */
  const attach = useCallback(
    async (file: File | undefined | null, type: "image" | "video") => {
      if (!file) return;
      if (file.size > IMAGE_MAX && type === "image") {
        setGenError(t("The picture is too heavy — 8 MB is the most the shelf may carry."));
        return;
      }
      setGenError(null);
      setUploading(true);
      try {
        const payload = type === "image" ? await weavePictureDown(file) : file;
        const base = file.name.replace(/\.[^.]*$/, "") || "offering";
        const ext = payload === file ? (file.name.match(/\.[^.]*$/)?.[0] ?? "") : ".jpg";
        const form = new FormData();
        form.append("file", new File([payload], `${base}${ext}`, { type: payload.type || file.type }));
        const res = await fetch("/api/gathering/upload", { method: "POST", body: form });
        const data = (await res.json().catch(() => null)) as {
          url?: string;
          type?: string;
          name?: string;
          error?: string;
        } | null;
        if (!res.ok || !data?.url) {
          throw new Error(data?.error || t("The shelf could not receive the file."));
        }
        setDraft((d) => ({
          ...d,
          media: { url: data.url!, type: data.type ?? type, name: data.name ?? null },
          aiMedia: false,
          aiStyle: null,
          altText: "",
        }));
        setVisual("upload");
      } catch (err) {
        setGenError(err instanceof Error ? err.message : t("The shelf could not receive the file."));
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
      }
    },
    [t]
  );

  /* the painter's hand — consent first, then the brush */
  const paint = useCallback(async () => {
    if (!genConsent) return;
    setGenLoading(true);
    setGenError(null);
    try {
      const data = await netFetch<{
        cover: { url: string; engine: string; altText: string; aiLabel: string };
      }>("/api/gathering/cover", {
        method: "POST",
        body: {
          consent: true,
          title: draft.title.trim(),
          body: draft.body.trim(),
          kind: draft.kind,
          tags: draft.tags.split(",").map((s) => s.trim()).filter(Boolean),
          style: genStyle,
          ratio: genRatio,
          customNote: genStyle === "custom" ? customNote : undefined,
        },
      });
      setDraft((d) => ({
        ...d,
        media: { url: data.cover.url, type: "image", name: null },
        altText: data.cover.altText,
        aiMedia: true,
        aiStyle: genStyle,
      }));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : t("The atelier could not be reached."));
    } finally {
      setGenLoading(false);
    }
  }, [draft, genConsent, genRatio, genStyle, customNote, t]);

  const dropPicture = useCallback(() => {
    setDraft((d) => ({ ...d, media: null, altText: "", aiMedia: false, aiStyle: null }));
    setVisual("none");
  }, []);

  /* the hanging hand — published exactly once */
  const hang = useCallback(async () => {
    if (!canHang) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const data = await netFetch<{ post: GatheringPost; existing?: boolean }>("/api/gathering", {
        method: "POST",
        body: {
          kind: draft.kind,
          title: draft.title.trim(),
          body: draft.body.trim(),
          ...(EPISTEMIC_KINDS.includes(draft.kind) && draft.epistemic
            ? { epistemic: draft.epistemic }
            : {}),
          ...(draft.tags.trim() ? { tags: draft.tags.trim() } : {}),
          ...(draft.circleId ? { circleId: draft.circleId } : {}),
          ...(!draft.circleId && draft.visibility ? { visibility: draft.visibility } : {}),
          ...(draft.language ? { language: draft.language } : {}),
          ...(draft.media && draft.media.type === "image" && draft.altText.trim()
            ? { altText: draft.altText.trim() }
            : {}),
          ...(draft.media ? { aiMedia: draft.aiMedia } : {}),
          ...(draft.aiStyle ? { aiStyle: draft.aiStyle } : {}),
          ...(draft.media
            ? {
                mediaUrl: draft.media.url,
                mediaType: draft.media.type,
                mediaName: draft.media.name,
              }
            : {}),
          publishKey: publishKeyRef.current,
        },
      });
      setHung(data.post);
      setBench(null);
      goto(6);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : t("The offering could not be placed."));
    } finally {
      setPublishing(false);
    }
  }, [canHang, draft, goto, t]);

  /* begin another — a clean bench, a fresh key */
  const beginAnother = useCallback(() => {
    publishKeyRef.current = `pk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    kindChosenRef.current = false;
    setDraft({ ...EMPTY_DRAFT, language: draft.language, visibility: "public" });
    setVisual("none");
    setHung(null);
    setGenConsent(false);
    setPublishError(null);
    maxStepRef.current = 1;
    setStep(1);
    void (async () => {
      try {
        await netFetch("/api/gathering/drafts", { method: "DELETE" });
      } catch {
        /* the bench clears on its own time */
      }
    })();
  }, [draft.language]);

  const copyLink = useCallback(async () => {
    if (!hung) return;
    const url = `${window.location.origin}/?room=gathering&post=${hung.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: hung.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      /* the visitor may hold the link another way */
    }
  }, [hung]);

  const meta = KIND_META[(draft.kind as keyof typeof KIND_META) in KIND_META ? (draft.kind as keyof typeof KIND_META) : "reflection"];
  const KindIcon = meta.icon;

  const visibilityOptions = useMemo(
    () => [
      { key: "public", label: "The open hall", note: "Everyone wandering the gathering", icon: Globe },
      { key: "connections", label: "Connections only", note: "The makers you are bound to", icon: Users },
      { key: "unlisted", label: "Quiet link", note: "Only those holding the link", icon: Link2 },
      { key: "private", label: "Private to me", note: "Your words, your eyes alone", icon: Lock },
    ],
    []
  );

  const activeFiltersLabel = (v: string) => visibilityOptions.find((o) => o.key === v)?.label ?? v;

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-28">
      <div className="mx-auto max-w-[820px] px-4 pt-4 sm:px-6 sm:pt-6">
        <RoomLabel>{t("the gathering · create")}</RoomLabel>

        {/* ---------- the stepper — six honest steps ---------- */}
        <nav
          aria-label={t("The composer's six steps")}
          data-testid="create-stepper"
          className="gp-scroll mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {STEP_LABELS.map(({ n, label }) => {
            const reached = n <= maxStepRef.current;
            const on = step === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => reached && n !== 6 && goto(n)}
                disabled={!reached || n === 6}
                aria-current={on ? "step" : undefined}
                data-testid={`create-step-${n}`}
                className={cn(
                  "focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
                  on
                    ? "border-[#cbb98d] bg-white text-[#5c5344]"
                    : reached
                      ? "border-[#e4d9bd] bg-white/60 text-[#7c715f] hover:border-[#d3c39c]"
                      : "border-[#eee5d0] bg-white/40 text-[#bfb398]"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4.5 items-center justify-center rounded-full border text-[9px]",
                    on
                      ? "border-[#cbb98d] bg-[#faf5e6] text-[#8a6f46]"
                      : "border-[#e4d9bd] text-[#a2947c]"
                  )}
                >
                  {n}
                </span>
                {t(label)}
              </button>
            );
          })}
        </nav>

        {/* ---------- the bench's own banner ---------- */}
        {step === 1 && bench && (
          <div
            className={cn(GP_CARD, "mt-3 flex flex-wrap items-center gap-2.5 rounded-[18px] p-4")}
            data-testid="create-bench"
          >
            <Sparkles className="size-4 shrink-0 text-[#a16207]" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-[12.5px] text-[#5c5344]">
              {t("A draft rests on your bench — revision")} {bench.revision}
            </p>
            <button
              type="button"
              onClick={() => void resumeBench()}
              className={cn(GP_HAND, "min-h-[40px] px-4 py-2 text-[12px]")}
              data-testid="create-resume"
            >
              {t("Resume the words")}
            </button>
            <button
              type="button"
              onClick={() => void discardBench()}
              className={cn(GP_GHOST, "min-h-[40px] px-4 py-2 text-[12px]")}
            >
              {t("Discard it")}
            </button>
          </div>
        )}

        <div className={cn(GP_CARD, "mt-3 rounded-[24px] p-5 sm:p-6")}>
          <AnimatePresence mode="wait" initial={false}>
            {/* ==================== 1 · INTENT ==================== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-[family-name:var(--font-literata)] text-[15.5px] font-semibold text-[#3d3428]">
                  {t("What are you bringing to the gathering?")}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8a7c64]">
                  {t("Choose its intention — or simply begin writing, and the words will suggest it.")}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {KIND_ORDER.map((k) => {
                    const m = KIND_META[k];
                    const KIcon = m.icon;
                    const on = draft.kind === k && kindChosenRef.current;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          kindChosenRef.current = true;
                          setDraft((d) => ({ ...d, kind: k }));
                          goto(2);
                        }}
                        data-testid={`create-kind-${k}`}
                        className={cn(
                          "focus-glow flex items-center gap-2.5 rounded-[16px] border px-3 py-2.5 text-left transition-all duration-300",
                          on
                            ? "border-[#cbb98d] bg-white shadow-[0_6px_16px_-8px_rgba(122,103,70,0.45)]"
                            : "border-[#e8dfc9] bg-white/55 hover:border-[#d3c39c] hover:bg-white/75"
                        )}
                      >
                        <KIcon className="size-4 shrink-0" style={{ color: m.accent }} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#5c5344]">
                          {t(KIND_OFFERING_LABEL[k])}
                        </span>
                        {on && <Check className="size-3.5 shrink-0 text-[#8a6f46]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      kindChosenRef.current = true;
                      setDraft((d) => ({ ...d, kind: "reflection" }));
                      goto(2);
                    }}
                    className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}
                    data-testid="create-skip-intent"
                  >
                    <Feather className="size-3.5" aria-hidden="true" />
                    {t("Skip — I'll just start writing")}
                  </button>
                  <span className="text-[11px] italic text-[#a2947c]">
                    {t("a finished work hangs through the publish picker")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onPublishWork}
                  className={cn(GP_GHOST, "mt-3 min-h-[44px] w-full px-4 text-[12px]")}
                  data-testid="create-publish-work"
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {t("Bring a finished work from the house's rooms")}
                </button>
              </motion.div>
            )}

            {/* ==================== 2 · WORDS ==================== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-literata)] text-[15.5px] font-semibold text-[#3d3428]">
                    {t("Speak the offering")}
                  </h2>
                  <span
                    className="mono-label shrink-0 text-[8px] uppercase tracking-[0.16em] text-[#a2947c]"
                    data-testid="create-draft-status"
                  >
                    {savingDraft
                      ? t("saving…")
                      : bench
                        ? `${t("draft saved")} · ${t("rev")} ${bench.revision}`
                        : ""}
                  </span>
                </div>

                {/* the kind's own hint — offered, never imposed */}
                {hint && kindChosenRef.current && draft.kind === "reflection" && hint !== "reflection" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[14px] border border-[#e8dfc9] bg-[#faf5e6] px-3 py-2">
                    <span className="text-[11.5px] text-[#7c715f]">
                      {t("This reads like")} <strong className="font-semibold">{t(KIND_META[hint as keyof typeof KIND_META] ? KIND_OFFERING_LABEL[hint as keyof typeof KIND_META] : "A reflection")}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, kind: hint }))}
                      className={cn(GP_GHOST, "min-h-[36px] px-3 py-1 text-[11px]")}
                      data-testid="create-apply-hint"
                    >
                      {t("Wear that name")}
                    </button>
                  </div>
                )}

                {/* the honest label — only where an honest label can land */}
                {EPISTEMIC_KINDS.includes(draft.kind) && (
                  <div className="mt-4">
                    <label
                      htmlFor="create-epistemic"
                      className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                    >
                      {t("the knowledge distinction")}
                    </label>
                    <select
                      id="create-epistemic"
                      value={draft.epistemic}
                      onChange={(e) => setDraft((d) => ({ ...d, epistemic: e.target.value }))}
                      data-testid="create-epistemic"
                      className={cn(GP_INPUT, "mt-1.5")}
                    >
                      <option value="">{t("Label this honestly — optional")}</option>
                      {EVIDENCE_LEVELS.map((lv) => (
                        <option key={lv} value={lv}>
                          {t(EVIDENCE_LABEL[lv])}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-[#a2947c]">
                      {t("Nothing is called verified because people agreed with it.")}
                    </p>
                  </div>
                )}

                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  maxLength={120}
                  placeholder={t("Give the offering its name…")}
                  aria-label={t("Give the offering its name…")}
                  data-testid="create-title"
                  className="mt-4 w-full rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-3 font-[family-name:var(--font-literata)] text-[14.5px] font-semibold text-[#3d3428] outline-none transition-colors duration-300 placeholder:font-normal placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
                />
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                  maxLength={4000}
                  rows={8}
                  placeholder={t(
                    "Speak the offering itself — a reflection, a story of a creation, a dream, a discovery, a question…"
                  )}
                  aria-label={t("Speak the offering itself")}
                  data-testid="create-body"
                  className="gp-scroll mt-2.5 w-full resize-none rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-3 text-[13.5px] leading-[1.75] text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
                />

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={draft.tags}
                    onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                    maxLength={120}
                    placeholder={t("Threads of meaning… (comma-separated, optional)")}
                    aria-label={t("Threads of meaning… (comma-separated, optional)")}
                    data-testid="create-tags"
                    className={cn(GP_INPUT)}
                  />
                  <select
                    value={draft.language}
                    onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
                    aria-label={t("The offering's own tongue")}
                    data-testid="create-language"
                    className={cn(GP_INPUT)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {t("Language")}: {l.native}
                      </option>
                    ))}
                  </select>
                </div>

                {/* who may read */}
                <div className="mt-4">
                  <RoomLabel>{t("who may read it")}</RoomLabel>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("who may read it")}>
                    {visibilityOptions.map((o) => {
                      const OIcon = o.icon;
                      const on = draft.visibility === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setDraft((d) => ({ ...d, visibility: o.key }))}
                          data-testid={`create-vis-${o.key}`}
                          className={cn(
                            "focus-glow flex flex-col items-start gap-1 rounded-[14px] border px-3 py-2.5 text-left transition-all duration-300",
                            on
                              ? "border-[#cbb98d] bg-white shadow-[0_6px_16px_-8px_rgba(122,103,70,0.4)]"
                              : "border-[#e8dfc9] bg-white/55 hover:border-[#d3c39c]"
                          )}
                        >
                          <OIcon className={cn("size-4", on ? "text-[#a16207]" : "text-[#a2947c]")} aria-hidden="true" />
                          <span className="text-[11.5px] font-semibold text-[#5c5344]">{t(o.label)}</span>
                          <span className="text-[9.5px] leading-snug text-[#a2947c]">{t(o.note)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {myCircles.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2.5">
                      <UsersRound className="size-4 shrink-0 text-[#8a6f46]" aria-hidden="true" />
                      <select
                        value={draft.circleId}
                        onChange={(e) => setDraft((d) => ({ ...d, circleId: e.target.value }))}
                        aria-label={t("Hang inside a circle")}
                        className={cn(GP_INPUT, "flex-1")}
                      >
                        <option value="">{t("Not a circle — the wider room above decides")}</option>
                        {myCircles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => goto(1)}
                    className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}
                  >
                    {t("Back to the intent")}
                  </button>
                  <button
                    type="button"
                    onClick={() => goto(3)}
                    disabled={draft.title.trim().length < 2 || draft.body.trim().length < 2}
                    className={cn(GP_HAND, "min-h-[44px] px-5 text-[12px]")}
                    data-testid="create-next-visual"
                  >
                    {t("Next — the visual")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== 3 · VISUAL ==================== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-[family-name:var(--font-literata)] text-[15.5px] font-semibold text-[#3d3428]">
                  {t("A picture beside the words — or none at all")}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8a7c64]">
                  {t("No image is the honest default. Bring your own, or ask the atelier to paint one — only ever with your yes.")}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("The offering's visual")}>
                  {(
                    [
                      { key: "none", label: "No image", note: "The words carry themselves", icon: X },
                      { key: "upload", label: "My own picture", note: "From your shelf, up to 8 MB", icon: ImagePlus },
                      { key: "generate", label: "Paint a matching one", note: "The atelier, on your consent", icon: Wand2 },
                    ] as Array<{ key: VisualChoice; label: string; note: string; icon: typeof X }>
                  ).map((o) => {
                    const OIcon = o.icon;
                    const on = visual === o.key;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setVisual(o.key)}
                        data-testid={`create-visual-${o.key}`}
                        className={cn(
                          "focus-glow flex flex-col items-start gap-1 rounded-[14px] border px-3.5 py-3 text-left transition-all duration-300",
                          on
                            ? "border-[#cbb98d] bg-white shadow-[0_6px_16px_-8px_rgba(122,103,70,0.4)]"
                            : "border-[#e8dfc9] bg-white/55 hover:border-[#d3c39c]"
                        )}
                      >
                        <OIcon className={cn("size-4", on ? "text-[#a16207]" : "text-[#a2947c]")} aria-hidden="true" />
                        <span className="text-[12px] font-semibold text-[#5c5344]">{t(o.label)}</span>
                        <span className="text-[9.5px] leading-snug text-[#a2947c]">{t(o.note)}</span>
                      </button>
                    );
                  })}
                </div>

                {visual === "upload" && (
                  <div className="mt-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading}
                        className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}
                        data-testid="create-upload-image"
                      >
                        <ImagePlus className="size-3.5" aria-hidden="true" />
                        {t("Choose a picture")}
                      </button>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploading}
                        className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}
                        data-testid="create-upload-video"
                      >
                        <Film className="size-3.5" aria-hidden="true" />
                        {t("Choose a short film")}
                      </button>
                      {uploading && (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8a6f46]">
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          {t("Carrying it to the shelf…")}
                        </span>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => void attach(e.target.files?.[0], "image")}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => void attach(e.target.files?.[0], "video")}
                    />
                  </div>
                )}

                {visual === "generate" && (
                  <div className="mt-3.5 rounded-[16px] border border-[#e8dfc9] bg-white/60 p-4" data-testid="create-atelier">
                    <RoomLabel>{t("the atelier's styles")}</RoomLabel>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {COVER_STYLES.map((s) => {
                        const on = genStyle === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setGenStyle(s.key)}
                            aria-pressed={on}
                            data-testid={`create-style-${s.key}`}
                            className={cn(
                              "focus-glow rounded-[12px] border px-2.5 py-2 text-left transition-all duration-300",
                              on
                                ? "border-[#cbb98d] bg-white"
                                : "border-[#e8dfc9] bg-white/55 hover:border-[#d3c39c]"
                            )}
                          >
                            <span className="block text-[11px] font-semibold text-[#5c5344]">{t(s.label)}</span>
                            <span className="mt-0.5 block text-[9px] leading-snug text-[#a2947c]">{t(s.note)}</span>
                          </button>
                        );
                      })}
                    </div>

                    {genStyle === "custom" && (
                      <input
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        maxLength={200}
                        placeholder={t("Speak the picture — mood, place, symbols…")}
                        aria-label={t("Speak the picture — mood, place, symbols…")}
                        className={cn(GP_INPUT, "mt-2.5")}
                      />
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <label htmlFor="create-ratio" className="mono-label text-[9px] uppercase tracking-[0.2em] text-[#8a6f46]">
                        {t("shape")}
                      </label>
                      <select
                        id="create-ratio"
                        value={genRatio}
                        onChange={(e) => setGenRatio(e.target.value)}
                        data-testid="create-ratio"
                        className={cn(GP_INPUT, "w-auto min-w-[140px] flex-none py-1.5")}
                      >
                        {RATIOS.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* THE CONSENT GATE — no picture without a yes */}
                    <label
                      className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-[#e4d9bd] bg-white/70 px-3 py-2.5"
                      data-testid="create-consent-row"
                    >
                      <input
                        type="checkbox"
                        checked={genConsent}
                        onChange={(e) => setGenConsent(e.target.checked)}
                        data-testid="create-consent"
                        className="mt-0.5 size-4 accent-[#a16207]"
                      />
                      <span className="text-[11.5px] leading-relaxed text-[#5c5344]">
                        {t(
                          "I agree: a picture will be generated from my own words, labeled as AI-made, and I can discard it. Nothing is painted without this yes."
                        )}
                      </span>
                    </label>

                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => void paint()}
                        disabled={!genConsent || genLoading || draft.media?.url.startsWith("/api/visual/") === true}
                        className={cn(GP_HAND, "min-h-[44px] px-5 text-[12px]")}
                        data-testid="create-generate"
                      >
                        {genLoading ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Wand2 className="size-3.5" aria-hidden="true" />
                        )}
                        {genLoading
                          ? t("The atelier paints…")
                          : draft.media && draft.aiMedia
                            ? t("Paint it again")
                            : t("Paint the picture")}
                      </button>
                      <span className="text-[10.5px] italic text-[#a2947c]">
                        {t("While the house stands open a painted picture costs nothing; when credits return, the price is shown here first.")}
                      </span>
                    </div>
                  </div>
                )}

                {/* the picture that stands — upload or painted */}
                {draft.media && (
                  <div className="mt-3.5">
                    {draft.media.type === "video" ? (
                      <video
                        src={draft.media.url}
                        controls
                        preload="metadata"
                        className="max-h-[280px] w-full rounded-[16px] border border-[#e4d9bd] object-contain"
                      />
                    ) : (
                      <img
                        src={draft.media.url}
                        alt={draft.altText || draft.title || t("The offering's own picture")}
                        className="max-h-[280px] w-full rounded-[16px] border border-[#e4d9bd] object-cover"
                      />
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {draft.aiMedia && (
                        <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
                          {t("AI-generated illustration")}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={dropPicture}
                        className="focus-glow ml-auto flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-[#a2947c] transition-colors duration-300 hover:text-[#b45309]"
                        data-testid="create-drop-picture"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        {t("Take the picture back")}
                      </button>
                    </div>
                  </div>
                )}

                {genError && (
                  <p className="mt-3 text-[12px] font-medium text-[#b45309]" role="alert">
                    {genError}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-2.5">
                  <button type="button" onClick={() => goto(2)} className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}>
                    {t("Back to the words")}
                  </button>
                  <button
                    type="button"
                    onClick={() => goto(4)}
                    className={cn(GP_HAND, "min-h-[44px] px-5 text-[12px]")}
                    data-testid="create-next-preview"
                  >
                    {t("Next — the preview")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== 4 · PREVIEW ==================== */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-[family-name:var(--font-literata)] text-[15.5px] font-semibold text-[#3d3428]">
                  {t("As it will hang")}
                </h2>
                <div className="gp-card mt-3.5 rounded-[22px] p-4 sm:p-5" data-testid="create-preview-card">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      aria-hidden="true"
                      className="flex size-8 items-center justify-center rounded-[12px] border border-white/90"
                      style={{ background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)" }}
                    >
                      <KindIcon className="size-4" style={{ color: meta.accent }} />
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {draft.epistemic && <EvidenceChip level={draft.epistemic} />}
                      {draft.aiMedia && (
                        <span className="mono-label rounded-full border border-[#e4d9bd] bg-[#faf5e6] px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[#8a6f46]">
                          {t("AI-generated illustration")}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-2.5 font-[family-name:var(--font-literata)] text-[15.5px] font-semibold leading-snug text-[#3d3428] [overflow-wrap:anywhere]">
                    {draft.title.trim() || t("Give the offering its name…")}
                  </h3>
                  <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                    {draft.body.trim() || t("Speak the offering itself")}
                  </p>
                  {draft.media && draft.media.type === "image" && (
                    <img
                      src={draft.media.url}
                      alt={draft.altText || draft.title}
                      className="mt-3 max-h-[300px] w-full rounded-[14px] border border-[#e8dfc9] object-cover"
                    />
                  )}
                  {draft.media && draft.media.type === "video" && (
                    <video
                      src={draft.media.url}
                      controls
                      preload="metadata"
                      className="mt-3 max-h-[300px] w-full rounded-[14px] border border-[#e8dfc9] object-contain"
                    />
                  )}
                  {draft.tags.trim() && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {draft.tags.split(",").slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#e8dfc9] bg-white/55 px-2 py-0.5 text-[10px] text-[#8a7c64]"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2.5 border-t border-[#eadfca]/70 pt-3">
                    <MakerMark name={me?.name ?? "·"} size={28} />
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold text-[#5c5344]">
                        {me?.name ?? "…"}
                      </p>
                      <p className="text-[10px] text-[#a2947c]">
                        {draft.circleId
                          ? t("hung inside a circle")
                          : t(activeFiltersLabel(draft.visibility))}
                        {draft.language ? ` · ${draft.language.toUpperCase()}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* the alt text — the maker's own hand, always correctable */}
                {draft.media && draft.media.type === "image" && (
                  <div className="mt-3.5">
                    <label
                      htmlFor="create-alt"
                      className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
                    >
                      {t("the picture's description (alt text)")}
                    </label>
                    <textarea
                      id="create-alt"
                      value={draft.altText}
                      onChange={(e) => setDraft((d) => ({ ...d, altText: e.target.value }))}
                      maxLength={300}
                      rows={2}
                      placeholder={t("Describe the picture honestly — screen readers will read your words.")}
                      aria-label={t("Describe the picture honestly — screen readers will read your words.")}
                      data-testid="create-alt"
                      className="gp-scroll mt-1.5 w-full resize-none rounded-[14px] border border-[#e4d9bd] bg-white/80 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
                    />
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
                  <button type="button" onClick={() => goto(3)} className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}>
                    {t("Back to the visual")}
                  </button>
                  <button
                    type="button"
                    onClick={() => goto(5)}
                    className={cn(GP_HAND, "min-h-[44px] px-5 text-[12px]")}
                    data-testid="create-next-hang"
                  >
                    {t("Next — hang it")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== 5 · HANG ==================== */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-[family-name:var(--font-literata)] text-[15.5px] font-semibold text-[#3d3428]">
                  {t("One honest hanging")}
                </h2>
                <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-[#7c715f]">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#5f7a52]" aria-hidden="true" />
                    {t("Published once, under your own key — a retry can never hang it twice.")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#5f7a52]" aria-hidden="true" />
                    {t("Your words stay your words — nothing is translated, nothing is altered.")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#5f7a52]" aria-hidden="true" />
                    {draft.aiMedia
                      ? t("The painted picture travels labeled as AI-made, with your description.")
                      : t("The offering carries no painted picture.")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#5f7a52]" aria-hidden="true" />
                    {draft.circleId
                      ? t("It hangs inside your circle's wall.")
                      : `${t("It hangs")}: ${t(activeFiltersLabel(draft.visibility))}.`}
                  </li>
                </ul>

                {publishError && (
                  <p className="mt-3 text-[12px] font-medium text-[#b45309]" role="alert" data-testid="create-publish-error">
                    {publishError}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
                  <button type="button" onClick={() => goto(4)} className={cn(GP_GHOST, "min-h-[44px] px-4 text-[12px]")}>
                    {t("Back to the preview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void hang()}
                    disabled={!canHang}
                    className="focus-glow gp-pearl flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/90 px-6 text-[12.5px] font-semibold text-[#8a6f46] transition-all duration-300 hover:brightness-[1.03] disabled:opacity-45"
                    style={{
                      background: "linear-gradient(150deg,#fffdf8 0%,#f3ead6 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 18px -8px rgba(122,103,70,0.45)",
                    }}
                    data-testid="create-publish"
                  >
                    {publishing ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="size-4" aria-hidden="true" />
                    )}
                    {t("Hang it in the hall")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== 6 · DONE ==================== */}
            {step === 6 && hung && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                data-testid="create-success"
              >
                <div className="flex flex-col items-center py-2 text-center">
                  <span
                    aria-hidden="true"
                    className="gp-pearl flex size-14 items-center justify-center rounded-[20px] border border-white/90"
                    style={{
                      background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 6px 16px -6px rgba(122,103,70,0.5)",
                    }}
                  >
                    <Check className="size-6 text-[#5f7a52]" />
                  </span>
                  <h2 className="mt-3.5 font-[family-name:var(--font-literata)] text-[16px] font-semibold text-[#3d3428]">
                    {t("The offering hangs in the hall")}
                  </h2>
                  <p className="mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-[#8a7c64]">
                    {t("Its words belong to it now — echoes may answer, resonance may gather, and your bench is already clear.")}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={onOpenHall}
                      className={cn(GP_HAND, "min-h-[44px] px-5 text-[12px]")}
                      data-testid="create-view-hall"
                    >
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {t("Walk the hall")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className={cn(GP_GHOST, "min-h-[44px] px-5 text-[12px]")}
                      data-testid="create-copy-link"
                    >
                      <Link2 className="size-3.5" aria-hidden="true" />
                      {copied ? t("Link copied") : t("Copy the link")}
                    </button>
                    <button
                      type="button"
                      onClick={beginAnother}
                      className={cn(GP_GHOST, "min-h-[44px] px-5 text-[12px]")}
                      data-testid="create-begin-another"
                    >
                      <Feather className="size-3.5" aria-hidden="true" />
                      {t("Begin another")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* the honest note under the card */}
        <p className="mt-3 text-center text-[11px] italic leading-relaxed text-[#a2947c]">
          {t("Drafts are yours alone — saved after every pause, kept until you publish or discard.")}
        </p>
      </div>
    </div>
  );
}
