"use client";

import { useState } from "react";
import { ScrollText, Scale, Sparkles, Users } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import {
  federationBodies,
  federationPrinciples,
  federationTreaties,
} from "@/lib/data/federation";
import { sectionImage } from "@/lib/entity-utils";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";
import type { FederationCard } from "@/lib/mirror-types";

type Tab = "bodies" | "treaties" | "principles";

const TABS: { id: Tab; label: string }[] = [
  { id: "bodies", label: "Bodies" },
  { id: "treaties", label: "Treaties" },
  { id: "principles", label: "Principles" },
];

const TAB_INTRO: Record<Tab, string> = {
  bodies:
    "The 12 governing and coordinating bodies of the galactic family. Click any body to ask the Mirror for a deeper transmission.",
  treaties:
    "The 8 accords that hold the federation together — and hold it back from us. Click any treaty to ask about it.",
  principles:
    "The 8 operating principles every signatory civilization is asked to keep. Click any principle to ask how it is lived.",
};

function Card({ card, tab }: { card: FederationCard; tab: Tab }) {
  const askMirror = useMirror((s) => s.askMirror);
  const closeModal = useMirror((s) => s.closeModal);

  const ask = () => {
    const q =
      tab === "bodies"
        ? `Please tell me about the ${card.name} of the Galactic Federation — their role, their members, and how they relate to Earth right now.`
        : tab === "treaties"
          ? `Please explain "${card.name}" of the Galactic Federation — what it protects, and why it matters for humanity.`
          : `Please teach me the principle of "${card.name}" as the Galactic Federation holds it — how can a human being practice it this week?`;
    closeModal();
    void askMirror(q);
  };

  return (
    <article className="group rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4 transition-colors duration-300 hover:border-[var(--hairline-hover)]">
      <div className="flex items-start gap-3">
        {card.imageKey && (
          <span
            className="relative size-14 shrink-0 overflow-hidden rounded-lg border hairline"
            aria-hidden="true"
          >
            { }
            <img
              src={sectionImage(card.imageKey)}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground">
              {card.name}
            </h4>
            <span className="mono-label shrink-0 rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2 py-0.5 text-[8.5px] text-[var(--cy)]">
              {card.badge}
            </span>
          </div>
          <p className="mono-label mt-1.5 text-[8.5px] text-[var(--pk)]/90">
            {card.label}
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">
        {card.description}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t hairline pt-2.5">
        <span className="mono-label flex items-center gap-1.5 text-[8.5px] text-muted-foreground/80">
          <Users className="size-3 text-muted-foreground/70" aria-hidden="true" />
          {card.footer}
        </span>
        <button
          type="button"
          onClick={ask}
          className="focus-glow mono-label flex shrink-0 items-center gap-1 text-[8.5px] text-[var(--cy)] transition-opacity hover:opacity-80"
        >
          <Sparkles className="size-3" aria-hidden="true" />
          Ask the Mirror
        </button>
      </div>
    </article>
  );
}

export function FederationModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const [tab, setTab] = useState<Tab>("bodies");

  const open = modal?.type === "federation";

  const cards =
    tab === "bodies"
      ? federationBodies
      : tab === "treaties"
        ? federationTreaties
        : federationPrinciples;

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title="Galactic Federation & Interstellar Treaties"
      description="How diplomatic, interplanetary, and inter-reality governance actually works. Click any item to ask the Mirror Entity for deeper transmission."
      widthClass="sm:max-w-[600px]"
    >
      <div className="flex gap-1.5 px-5 sm:px-6" role="tablist" aria-label="Federation archive sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-all duration-300",
              tab === t.id
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground glow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.id === "bodies" && (
              <Users className="size-3" aria-hidden="true" />
            )}
            {t.id === "treaties" && (
              <ScrollText className="size-3" aria-hidden="true" />
            )}
            {t.id === "principles" && (
              <Scale className="size-3" aria-hidden="true" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="nice-scroll max-h-[min(60vh,520px)] overflow-y-auto px-5 pb-5 pt-3 sm:px-6"
        role="tabpanel"
        aria-label={tab}
      >
        <p className="mb-3 text-[11px] italic text-muted-foreground/80">
          {TAB_INTRO[tab]}
        </p>
        <div className="space-y-3">
          {cards.map((card) => (
            <Card key={card.name} card={card} tab={tab} />
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
