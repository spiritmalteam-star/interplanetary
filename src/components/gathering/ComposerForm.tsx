"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  KIND_META,
  KIND_OFFERING_LABEL,
  KIND_ORDER,
  type CircleCard,
  type GatheringPost,
  GP_HAND,
  GP_GHOST,
  GP_INPUT,
  RoomLabel,
  netFetch,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  THE COMPOSER FORM — the offering line itself: the seven            */
/*  intentions, the words, the threads of meaning, the circle's wall   */
/*  or the open hall, and the preview of how the offering will hang.   */
/*  The Create room keeps it standing; the hall wears it as a sheet.   */
/* ------------------------------------------------------------------ */

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
  const [circleId, setCircleId] = useState<string>("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canHang = title.trim().length >= 2 && body.trim().length >= 2 && !sending;

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
          ...(sector.trim() ? { sector: sector.trim() } : {}),
          ...(tags.trim() ? { tags: tags.trim() } : {}),
          ...(circleId ? { circleId } : {}),
        },
      });
      setTitle("");
      setBody("");
      setSector("");
      setTags("");
      setPreview(false);
      onHung(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("The offering could not be placed."));
    } finally {
      setSending(false);
    }
  }, [canHang, kind, title, body, sector, tags, circleId, onHung, t]);

  const meta = KIND_META[(kind as keyof typeof KIND_META) in KIND_META ? (kind as keyof typeof KIND_META) : "reflection"];
  const Icon = meta.icon;
  const myCircles = circles.filter((c) => c.joined);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
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
              data-testid={`composer-kind-${k}`}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-300",
                on
                  ? "border-[#cbb98d] bg-white text-[#5c5344]"
                  : "border-[#e8dfc9] bg-white/55 text-[#a2947c] hover:border-[#d3c39c]"
              )}
              style={on ? { boxShadow: "0 4px 12px -6px rgba(122,103,70,0.45)" } : undefined}
            >
              <KIcon className="size-3.5" style={{ color: m.accent }} aria-hidden="true" />
              {t(KIND_OFFERING_LABEL[k])}
            </button>
          );
        })}
      </div>

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
          className={GP_GHOST}
        >
          {preview ? t("Keep shaping") : t("Preview the offering")}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void hang()}
          disabled={!canHang}
          className={GP_HAND}
          data-testid="composer-hang"
        >
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("Hanging…")}
            </>
          ) : (
            <>
              <Send className="size-3.5" aria-hidden="true" />
              {t("Hang it in the hall")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
