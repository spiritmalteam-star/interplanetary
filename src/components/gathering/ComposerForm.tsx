"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Film, ImagePlus, Loader2, Send, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  EVIDENCE_LABEL,
  EVIDENCE_LEVELS,
  KIND_META,
  KIND_OFFERING_LABEL,
  KIND_ORDER,
  type CircleCard,
  type GatheringPost,
  GP_ICON_BTN,
  GP_INPUT,
  RoomLabel,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE COMPOSER FORM — the offering line itself: the intentions, the  */
/*  words, a picture or a film hung beside them, the threads of        */
/*  meaning, the circle's wall or the open hall, and the preview of    */
/*  how the offering will hang. Every hand is a small icon — the       */
/*  visitor learns them once and they never crowd the line again.      */
/* ------------------------------------------------------------------ */

const IMAGE_MAX = 8 * 1024 * 1024; // 8 MB
const VIDEO_MAX = 48 * 1024 * 1024; // 48 MB

/* the kinds that may honestly wear an evidence label */
const EPISTEMIC_KINDS: string[] = [
  "discovery",
  "finding",
  "hypothesis",
  "experiment",
  "question",
  "discussion",
];

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

export default function ComposerForm({
  initialKind,
  circles,
  onHung,
  compact = false,
}: {
  initialKind: string;
  circles: CircleCard[];
  onHung: (post: GatheringPost) => void;
  compact?: boolean;
}) {
  const t = useT();
  const [kind, setKind] = useState<string>(initialKind);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sector, setSector] = useState("");
  const [tags, setTags] = useState("");
  const [epistemic, setEpistemic] = useState("");
  const [circleId, setCircleId] = useState<string>("");
  const [media, setMedia] = useState<{ url: string; type: string; name: string | null } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const canHang = title.trim().length >= 2 && body.trim().length >= 2 && !sending && !uploading;

  const attach = useCallback(
    async (file: File | undefined | null, type: "image" | "video") => {
      if (!file) return;
      const cap = type === "image" ? IMAGE_MAX : VIDEO_MAX;
      if (file.size > cap) {
        setError(
          type === "image"
            ? t("The picture is too heavy — 8 MB is the most the shelf may carry.")
            : t("The film is too heavy — 48 MB is the most the shelf may carry.")
        );
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const payload = type === "image" ? await weavePictureDown(file) : file;
        const base = file.name.replace(/\.[^.]*$/, "") || "offering";
        const ext =
          payload === file ? (file.name.match(/\.[^.]*$/)?.[0] ?? "") : ".jpg";
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
        setMedia({ url: data.url, type: data.type ?? type, name: data.name ?? null });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("The shelf could not receive the file."));
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
      }
    },
    [t]
  );

  const hang = useCallback(async () => {
    if (!canHang) return;
    setSending(true);
    setError(null);
    try {
      const data = await netFetch<{ post: GatheringPost }>("/api/gathering", {
        method: "POST",
        body: {
          kind,
          title: title.trim(),
          body: body.trim(),
          ...(EPISTEMIC_KINDS.includes(kind) && epistemic ? { epistemic } : {}),
          ...(sector.trim() ? { sector: sector.trim() } : {}),
          ...(tags.trim() ? { tags: tags.trim() } : {}),
          ...(circleId ? { circleId } : {}),
          ...(media ? { mediaUrl: media.url, mediaType: media.type, mediaName: media.name } : {}),
        },
      });
      setTitle("");
      setBody("");
      setSector("");
      setTags("");
      setEpistemic("");
      setMedia(null);
      setPreview(false);
      onHung(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The offering could not be placed."));
    } finally {
      setSending(false);
    }
  }, [canHang, kind, title, body, sector, tags, epistemic, circleId, media, onHung, t]);

  const meta =
    KIND_META[(kind as keyof typeof KIND_META) in KIND_META ? (kind as keyof typeof KIND_META) : "reflection"];
  const Icon = meta.icon;
  const myCircles = circles.filter((c) => c.joined);

  const mediaBlock = media ? (
    <div className="mt-3">
      {media.type === "video" ? (
        <video
          src={media.url}
          controls
          preload="metadata"
          className="max-h-[280px] w-full rounded-[16px] border border-[#e4d9bd] object-contain"
        />
      ) : (
         
        <img
          src={media.url}
          alt={media.name ?? t("The offering's own picture")}
          className="max-h-[280px] w-full rounded-[16px] border border-[#e4d9bd] object-cover"
        />
      )}
      <div className="mt-1.5 flex items-center gap-2">
        <span className="truncate text-[10.5px] text-[#a2947c]">
          {media.name ?? (media.type === "video" ? t("A film") : t("A picture"))}
        </span>
        <button
          type="button"
          onClick={() => setMedia(null)}
          aria-label={t("Take the attachment back")}
          title={t("Take the attachment back")}
          className="focus-glow rounded-full p-1 text-[#a2947c] transition-colors duration-300 hover:text-[#b45309]"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div>
      {/* the intentions — small icon hands, learned once */}
      <div className="flex flex-wrap gap-1.5">
        {KIND_ORDER.map((k) => {
          const m = KIND_META[k];
          const KIcon = m.icon;
          const on = kind === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={on}
              aria-label={t(KIND_OFFERING_LABEL[k])}
              title={t(KIND_OFFERING_LABEL[k])}
              data-testid={`composer-kind-${k}`}
              className={cn(
                "focus-glow flex size-9 items-center justify-center rounded-full border transition-all duration-300",
                on
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
              style={on ? { boxShadow: "0 4px 12px -6px rgba(122,103,70,0.45)" } : undefined}
            >
              <KIcon
                className="size-4"
                style={{ color: on ? m.accent : undefined }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* the knowledge distinction — only where an honest label can land */}
      {EPISTEMIC_KINDS.includes(kind) && (
        <div className="mt-3">
          <label
            htmlFor="composer-epistemic"
            className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#8a6f46]"
          >
            {t("the knowledge distinction")}
          </label>
          <select
            id="composer-epistemic"
            value={epistemic}
            onChange={(e) => setEpistemic(e.target.value)}
            data-testid="gath-composer-epistemic"
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder={t("Give the offering its name…")}
        aria-label={t("Give the offering its name…")}
        data-testid="composer-title"
        className="mt-4 w-full rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-3 font-[family-name:var(--font-literata)] text-[14.5px] font-semibold text-[#3d3428] outline-none transition-colors duration-300 placeholder:font-normal placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        rows={compact ? 5 : 7}
        placeholder={t(
          "Speak the offering itself — a reflection, a story of a creation, a dream, a discovery, a question…"
        )}
        aria-label={t("Speak the offering itself")}
        data-testid="composer-body"
        className="gp-scroll mt-2.5 w-full resize-none rounded-[16px] border border-[#e4d9bd] bg-white/80 px-4 py-3 text-[13.5px] leading-[1.75] text-[#4c4436] outline-none transition-colors duration-300 placeholder:text-[#b3a68d] focus:border-[#cbb98d]"
      />

      {/* the attachment hands — one small picture, one short film */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          aria-label={t("Attach a picture")}
          title={t("Attach a picture")}
          data-testid="composer-attach-image"
          className={cn(GP_ICON_BTN, "size-9")}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={uploading}
          aria-label={t("Attach a short film")}
          title={t("Attach a short film")}
          data-testid="composer-attach-video"
          className={cn(GP_ICON_BTN, "size-9")}
        >
          <Film className="size-4" aria-hidden="true" />
        </button>
        {uploading && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8a6f46]">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t("Carrying it to the shelf…")}
          </span>
        )}
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

      {mediaBlock}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          maxLength={120}
          placeholder={t("Threads of meaning… (comma-separated, optional)")}
          aria-label={t("Threads of meaning… (comma-separated, optional)")}
          data-testid="composer-tags"
          className="min-w-0 flex-1 rounded-[16px] border border-[#eee5d0] bg-white/60 px-4 py-2.5 text-[12.5px] text-[#5c5344] outline-none transition-colors duration-300 placeholder:text-[#bfb398] focus:border-[#cbb98d]"
        />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <input
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          maxLength={24}
          placeholder={t("Woven in… (a room's name, optional)")}
          aria-label={t("Woven in… (a room's name, optional)")}
          className="min-w-0 flex-1 rounded-[16px] border border-[#eee5d0] bg-white/60 px-4 py-2.5 text-[12.5px] text-[#5c5344] outline-none transition-colors duration-300 placeholder:text-[#bfb398] focus:border-[#cbb98d]"
        />
        {myCircles.length > 0 && (
          <select
            value={circleId}
            onChange={(e) => setCircleId(e.target.value)}
            aria-label={t("Hang inside a circle")}
            className="min-w-0 flex-1 rounded-[16px] border border-[#eee5d0] bg-white/80 px-3 py-2.5 text-[12.5px] text-[#5c5344] outline-none transition-colors duration-300 focus:border-[#cbb98d]"
          >
            <option value="">{t("The open hall")}</option>
            {myCircles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <AnimatePresence initial={false}>
        {preview && (
          <motion.div
            key="preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <RoomLabel>{t("as it will hang")}</RoomLabel>
              <div className="gp-card mt-2 rounded-[22px] p-4">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center rounded-[12px] border border-white/90"
                    style={{ background: "linear-gradient(150deg,#fffdf8 0%,#f6efdd 100%)" }}
                  >
                    <Icon className="size-4" style={{ color: meta.accent }} />
                  </span>
                  <p className="font-[family-name:var(--font-literata)] text-[14px] font-semibold text-[#3d3428] [overflow-wrap:anywhere]">
                    {title.trim() || t("Give the offering its name…")}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                  {body.trim() || t("Speak the offering itself")}
                </p>
                {media && media.type !== "video" ? (
                   
                  <img
                    src={media.url}
                    alt={media.name ?? t("The offering's own picture")}
                    className="mt-3 max-h-[240px] w-full rounded-[14px] border border-[#e8dfc9] object-cover"
                  />
                ) : media ? (
                  <video
                    src={media.url}
                    controls
                    preload="metadata"
                    className="mt-3 max-h-[240px] w-full rounded-[14px] border border-[#e8dfc9] object-contain"
                  />
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-3 text-center text-[12px] font-medium text-[#b45309]" role="alert">
          {error}
        </p>
      )}

      <div className={cn("flex items-center gap-2.5", compact ? "mt-3" : "mt-4")}>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
          aria-label={preview ? t("Keep shaping") : t("Preview the offering")}
          title={preview ? t("Keep shaping") : t("Preview the offering")}
          className={cn(GP_ICON_BTN, "size-11", preview && "border-[#cbb98d] text-[#5c5344]")}
        >
          <Eye className="size-4" aria-hidden="true" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void hang()}
          disabled={!canHang}
          aria-label={t("Hang it in the hall")}
          title={t("Hang it in the hall")}
          className="focus-glow gp-pearl flex size-11 shrink-0 items-center justify-center rounded-full border border-white/90 text-[#8a6f46] transition-all duration-300 hover:brightness-[1.03] disabled:opacity-45"
          style={{
            background: "linear-gradient(150deg,#fffdf8 0%,#f3ead6 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 18px -8px rgba(122,103,70,0.45)",
          }}
          data-testid="composer-hang"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
