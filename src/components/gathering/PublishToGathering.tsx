"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Check,
  CircleDot,
  Globe2,
  Link2,
  Loader2,
  Lock,
  Music,
  PenLine,
  Users2,
  X,
} from "lucide-react";
import { GP_CARD, GP_HAND, GP_GHOST, GP_INPUT, netFetch, type CircleCard } from "./shared";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  THE PUBLICATION PANEL — one light sheet that carries a completed   */
/*  work from its room into the hall. The work is never copied: the    */
/*  offering remembers its birthplace and keeps its maker's name.      */
/*                                                                     */
/*  Everything arrives pre-filled; a generic transmission asks for a   */
/*  title (required) and offers an optional introduction and question; */
/*  a specialized creation brings its own metadata and forces nothing. */
/*  The audience is chosen; a preview stands before the one explicit   */
/*  hand that publishes. Publishing again hangs nothing twice.         */
/* ------------------------------------------------------------------ */

export interface PublishPayload {
  sourcePortal: string;
  sourceId?: string | null;
  refKind?: "library" | "music" | null;
  suggestedTitle?: string;
  preview?: string;
  cover?: string | null;
  refUrl?: string | null;
  recentSector?: string | null;
  titleHint?: string | null;
  generic?: boolean;
  contentTypeLabel?: string;
}

const PORTAL_LABELS: Record<string, string> = {
  artx: "ArtX",
  music: "Music",
  lightcodes: "Music",
  book: "Book",
  dreambook: "DreamBook",
  hyperx: "HyperX",
  observatory: "HyperX",
  channeling: "Channeling",
  invent: "Invent",
  manifest: "Manifest",
  quantum: "Quantum",
  healx: "HealX",
};

type Visibility = "public" | "circle" | "connections" | "draft";

const AUDIENCES: Array<{ key: Visibility; label: string; hint: string; icon: LucideIcon }> = [
  { key: "public", label: "Public", hint: "The open hall — anyone may read", icon: Globe2 },
  { key: "circle", label: "Circle", hint: "Only a circle you belong to", icon: Users2 },
  { key: "connections", label: "Connections", hint: "Only the makers you are connected with", icon: Link2 },
  { key: "draft", label: "Private draft", hint: "Only you — visible to no one else", icon: Lock },
];

export default function PublishToGathering({
  payload,
  open,
  onClose,
  onPublished,
}: {
  payload: PublishPayload | null;
  open: boolean;
  onClose: () => void;
  onPublished?: (result: { postId: string; deduplicated: boolean }) => void;
}) {
  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [question, setQuestion] = useState("");
  const [inviteHands, setInviteHands] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [circleId, setCircleId] = useState("");
  const [circles, setCircles] = useState<CircleCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ postId: string; deduplicated: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* the panel's first breath — everything pre-filled from the source */
  useEffect(() => {
    if (!open || !payload) return;
    setTitle(payload.suggestedTitle ?? "");
    setIntroduction("");
    setQuestion("");
    setInviteHands(false);
    setVisibility("public");
    setCircleId("");
    setDone(null);
    setError(null);
  }, [open, payload]);

  /* the circles the maker may hang inside */
  useEffect(() => {
    if (!open || visibility !== "circle" || circles.length > 0) return;
    void (async () => {
      try {
        const data = await netFetch<{ circles: CircleCard[] }>("/api/network/circles?mine=1&take=40");
        setCircles(data.circles);
      } catch {
        /* the select stays honest — empty means no circle audience */
      }
    })();
  }, [open, visibility, circles.length]);

  const portalLabel = useMemo(
    () => (payload ? PORTAL_LABELS[payload.sourcePortal] ?? payload.sourcePortal : ""),
    [payload]
  );
  const typeLabel = payload?.contentTypeLabel ?? "Reflection / Transmission";

  if (!open || !payload || typeof document === "undefined") return null;

  const publish = async () => {
    if (busy) return;
    setError(null);
    const finalTitle = title.trim();
    if (!finalTitle && payload.generic) {
      setError("Give the offering a name.");
      return;
    }
    if (!finalTitle && !payload.preview?.trim()) {
      setError("An offering needs at least a title or a few words.");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        sourcePortal: payload.sourcePortal,
        title: finalTitle || payload.suggestedTitle || "An offering without a name",
        visibility,
      };
      if (payload.sourceId && payload.refKind) {
        body.sourceId = payload.sourceId;
        body.refKind = payload.refKind;
      }
      if (payload.recentSector) {
        body.recentSector = payload.recentSector;
        if (payload.titleHint) body.titleHint = payload.titleHint;
      }
      if (payload.preview) body.body = payload.preview;
      if (payload.cover) body.cover = payload.cover;
      if (payload.refUrl) body.refUrl = payload.refUrl;
      if (payload.generic) {
        if (introduction.trim()) body.introduction = introduction.trim();
        if (question.trim()) body.question = question.trim();
        if (inviteHands) body.tags = "reflections, collaboration";
      }
      if (visibility === "circle") body.circleId = circleId;

      const res = await netFetch<{ postId: string; deduplicated: boolean }>("/api/publications", {
        method: "POST",
        body,
      });
      setDone(res);
      onPublished?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The publication house is momentarily quiet.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publish to the Gathering"
      data-testid="publication-panel"
      className="fixed inset-0 z-[96] flex items-end justify-center bg-[rgba(46,38,24,0.32)] p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className={`gp-scroll max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-[26px] border border-white/85 bg-[linear-gradient(165deg,#fffef9_0%,#f7f0de_100%)] p-5 shadow-[0_30px_80px_-30px_rgba(60,48,26,0.5)] sm:rounded-[26px] sm:p-6 ${GP_CARD}`}
      >
        {/* the crown */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-cinzel)] text-[16px] font-semibold tracking-wide text-[#3d3428]">
              Publish to the Gathering
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#a2947c]">
              <span className="rounded-full border border-[#e4d9bd] bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#8a6f46]">
                {typeLabel}
              </span>
              <span>born in {portalLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e4d9bd] bg-white/70 text-[#7c715f] transition-colors hover:text-[#3d3428]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {done ? (
          /* ---- the hung offering's own truth ---- */
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <span
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full border border-white/90"
              style={{ background: "linear-gradient(150deg,#fffdf8 0%,#f0e6cf 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px -3px rgba(122,103,70,0.4)" }}
            >
              {done.deduplicated ? <CircleDot className="size-5 text-[#8a6f46]" aria-hidden="true" /> : <Check className="size-5 text-[#8a6f46]" aria-hidden="true" />}
            </span>
            <p className="font-[family-name:var(--font-cinzel)] text-[15px] font-semibold text-[#3d3428]">
              {done.deduplicated ? "This work already hangs in the hall." : "The offering hangs in the hall."}
            </p>
            <button type="button" onClick={onClose} className={`${GP_HAND} min-h-[44px] px-6`}>
              Return
            </button>
          </div>
        ) : (
          <>
            {/* ---- the offering's face (preview) ---- */}
            <div className="mt-4 flex gap-3 rounded-[18px] border border-[#eadfc4] bg-white/70 p-3">
              {payload.cover ? (
                 
                <img
                  src={payload.cover}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-[12px] border border-white/90 object-cover"
                />
              ) : payload.refUrl && payload.refKind === "music" ? (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] border border-white/90 bg-[linear-gradient(150deg,#fffdf8,#f0e6cf)]">
                  <Music className="size-6 text-[#8a6f46]" aria-hidden="true" />
                </span>
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] border border-white/90 bg-[linear-gradient(150deg,#fffdf8,#f0e6cf)]">
                  <BookOpen className="size-6 text-[#8a6f46]" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="line-clamp-1 text-[13px] font-semibold text-[#4c4436]">
                  {payload.suggestedTitle || "An offering without a name"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-[#a2947c]">
                  {payload.preview || "The work speaks for itself."}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#b3a68d]">
                  original preserved in {portalLabel} · attribution kept
                </p>
              </div>
            </div>

            {/* ---- the generic transmission's own questions ---- */}
            {payload.generic && (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="pub-title" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">
                    Title <span className="text-[#b3542f]">*</span>
                  </label>
                  <input
                    id="pub-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={140}
                    placeholder="Name this transmission"
                    className={GP_INPUT}
                    data-testid="publication-title"
                  />
                </div>
                <div>
                  <label htmlFor="pub-intro" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">
                    Introduction <span className="normal-case tracking-normal text-[#b3a68d]">(optional)</span>
                  </label>
                  <textarea
                    id="pub-intro"
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value.slice(0, 600))}
                    rows={2}
                    placeholder="A few words to open the offering"
                    className={`${GP_INPUT} resize-none`}
                  />
                </div>
                <div>
                  <label htmlFor="pub-question" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">
                    A question for the hall <span className="normal-case tracking-normal text-[#b3a68d]">(optional)</span>
                  </label>
                  <input
                    id="pub-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
                    maxLength={300}
                    placeholder="What might the hall reflect back?"
                    className={GP_INPUT}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-[14px] border border-[#e4d9bd] bg-white/60 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={inviteHands}
                    onChange={(e) => setInviteHands(e.target.checked)}
                    className="size-4 accent-[#a16207]"
                  />
                  <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#5c5344]">
                    <PenLine className="size-3.5 text-[#8a6f46]" aria-hidden="true" />
                    Invite reflections and collaborators
                  </span>
                </label>
              </div>
            )}
            {!payload.generic && (
              <div className="mt-4">
                <label htmlFor="pub-title-spec" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">
                  Title
                </label>
                <input
                  id="pub-title-spec"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={140}
                  placeholder="The work's own name"
                  className={GP_INPUT}
                  data-testid="publication-title"
                />
              </div>
            )}

            {/* ---- the audience ---- */}
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a2947c]">Audience</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Audience">
                {AUDIENCES.map((a) => {
                  const AIcon = a.icon;
                  const on = visibility === a.key;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setVisibility(a.key)}
                      data-testid={`publication-audience-${a.key}`}
                      className={`focus-glow flex items-start gap-2 rounded-[14px] border px-3 py-2.5 text-left transition-all duration-200 ${
                        on
                          ? "border-[#cbb98d] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_-8px_rgba(122,103,70,0.4)]"
                          : "border-[#e4d9bd] bg-white/50 hover:border-[#d3c39c]"
                      }`}
                    >
                      <AIcon className={`mt-0.5 size-4 shrink-0 ${on ? "text-[#8a6f46]" : "text-[#b3a68d]"}`} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className={`block text-[12px] font-semibold ${on ? "text-[#4c4436]" : "text-[#7c715f]"}`}>{a.label}</span>
                        <span className="block text-[10px] leading-snug text-[#b3a68d]">{a.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {visibility === "circle" && (
                <select
                  value={circleId}
                  onChange={(e) => setCircleId(e.target.value)}
                  aria-label="Choose the circle"
                  className={`${GP_INPUT} mt-2`}
                  data-testid="publication-circle-select"
                >
                  <option value="">Choose the circle…</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-[12px] border border-[#e8c9b0] bg-[#fdf1e7] px-3 py-2 text-[12px] text-[#9a4f21]">
                {error}
              </p>
            )}

            {/* ---- the one explicit hand ---- */}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button type="button" onClick={onClose} disabled={busy} className={`${GP_GHOST} min-h-[44px] px-5`}>
                Not yet
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={busy}
                data-testid="publication-confirm"
                className={`${GP_HAND} min-h-[44px] px-6`}
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                Hang it in the hall
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
