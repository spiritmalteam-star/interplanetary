"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Package, Sparkles } from "lucide-react";
import { useMirror, type ChatMessage } from "@/lib/mirror-store";
import type { Scope } from "@/lib/mirror-types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Exchange, LoadingTransmission } from "./TransmissionView";

/* ------------------------------------------------------------------ */
/*  THE CREATION ROOM — the room of the makings.                       */
/*                                                                     */
/*  Three laws keep it instant and calm:                               */
/*                                                                     */
/*  1. THE NEWEST WORK STANDS AT THE TOP — the room opens focused on   */
/*     the latest exchange (query, answer, artifact in full), and      */
/*     every earlier work follows beneath in newest-to-oldest order,   */
/*     so the visitor proceeds downward through their own history.     */
/*                                                                     */
/*  2. THE ROOM NEVER FREEZES — only ONE full exchange is mounted at   */
/*     first breath: the newest. Every earlier work rests as a light   */
/*     compact card (a line and a chip — no images, no bodies) until   */
/*     its own hand unfolds it, one at a time. No tall image pile, no  */
/*     whole-thread mount, no blocked frame.                           */
/*                                                                     */
/*  3. THE SHELL ARRIVES FIRST — while the channel is still forming,   */
/*     the room shows its gentle forming view instead of nothing, so   */
/*     a slow answer never reads as a frozen app.                      */
/* ------------------------------------------------------------------ */

/** The compact chip's own words for every kind of making. */
const MAKING_LABELS: Record<string, string> = {
  akashic: "Akashic record",
  manifest: "Manifest ritual",
  forge: "Forge strike",
  book: "Dream book",
  poem: "Poem",
  codes: "Light codes",
  quantum: "Quantum reveal",
  remedy: "Remedy",
};

function WorkCard({
  message,
  scope,
  index,
}: {
  message: ChatMessage;
  scope: Scope;
  index: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const makingLabel = message.sideArtifact
    ? MAKING_LABELS[message.sideArtifact.kind]
    : null;
  const hasVisual = Boolean(message.artifact || message.visual);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border hairline bg-[var(--glass-bg-soft)] transition-colors duration-300",
        open && "border-[var(--hairline-hover)]"
      )}
      data-testid="creation-room-earlier"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="creation-room-earlier-toggle"
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-medium text-foreground/85">
            {message.query || t("An unnamed whisper")}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
            {message.text.replace(/\s+/g, " ").slice(0, 120)}
          </span>
        </span>
        {(makingLabel || hasVisual) && (
          <span className="mono-label flex shrink-0 items-center gap-1 rounded-full border hairline px-2 py-0.5 text-[10px] text-muted-foreground">
            {hasVisual ? (
              <Sparkles className="size-2.5" aria-hidden="true" />
            ) : (
              <Package className="size-2.5" aria-hidden="true" />
            )}
            {t(makingLabel ?? "A painting")}
          </span>
        )}
      </button>
      {/* the unfolded work — mounted only when its own hand asks for it */}
      {open && (
        <div className="border-t hairline px-1 pb-1">
          <Exchange
            message={message}
            index={index}
            scope={scope}
            animate={false}
          />
        </div>
      )}
    </div>
  );
}

export function CreationRoom() {
  const activeMode = useMirror((s) => s.activeMode);
  const session = useMirror((s) => s.sessions[s.activeMode]);
  const t = useT();

  const scope: Scope = activeMode;
  const messages = session.messages;
  const latest = messages.length > 0 ? messages[messages.length - 1] : null;
  /* the earlier works — newest to oldest, so the walk proceeds downward */
  const earlier = useMemo(
    () => (messages.length > 1 ? messages.slice(0, -1).reverse() : []),
    [messages]
  );

  /* the unhurried forming phrases — the same rhythm the thread keeps */
  const [formingPhase, setFormingPhase] = useState(0);
  useEffect(() => {
    if (session.status !== "loading") return;
    const id = window.setInterval(
      () => setFormingPhase((p) => (p + 1) % 4),
      2400
    );
    return () => window.clearInterval(id);
  }, [session.status]);

  /* the newest work owns the frame on arrival — and only when the
     room's content actually grows, never on the room's first breath */
  const topRef = useRef<HTMLDivElement | null>(null);
  const baselineLen = useRef<number | null>(null);
  useEffect(() => {
    if (baselineLen.current === null) {
      baselineLen.current = messages.length;
      return;
    }
    if (messages.length > baselineLen.current) {
      baselineLen.current = messages.length;
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages.length]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-1 pb-6 pt-5 sm:pt-6">
      {/* the newest work — the room's own focus, at the very top */}
      <div ref={topRef} aria-hidden="true" className="h-px scroll-mt-2" />

      {session.status === "loading" && !latest && (
        <LoadingTransmission query={session.activeQuery} phase={formingPhase} />
      )}

      {latest && (
        <Exchange
          message={latest}
          index={messages.length - 1}
          scope={scope}
          animate={session.status !== "loading"}
          retryDisabled={session.status === "loading"}
        />
      )}

      {session.status === "loading" && latest && (
        <div className="mt-6">
          <LoadingTransmission query={session.activeQuery} phase={formingPhase} />
        </div>
      )}

      {/* the earlier works — a quiet shelf beneath the newest, newest
          first, each resting as a line until its own hand unfolds it */}
      {earlier.length > 0 && (
        <section className="mt-8" aria-label={t("Earlier works")}>
          <div className="mb-3 flex items-center gap-3">
            <p className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground/80">
              {t("Earlier works")}
            </p>
            <span className="h-px flex-1 bg-gradient-to-r from-[var(--hairline)] to-transparent" aria-hidden="true" />
            <span className="mono-label text-[10px] text-muted-foreground/60">
              {t("{n} kept", { n: earlier.length })}
            </span>
          </div>
          <div className="space-y-2">
            {earlier.map((m, i) => (
              <WorkCard key={m.id} message={m} scope={scope} index={earlier.length - 1 - i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
