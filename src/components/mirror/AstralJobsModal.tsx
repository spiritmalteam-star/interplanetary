"use client";

import { useState } from "react";
import {
  ArrowRight,
  Atom,
  ChevronLeft,
  Compass,
  Dna,
  Flame,
  Globe,
  Heart,
  Moon,
  Orbit,
  Scale,
  ScrollText,
  Sparkles,
  Waves,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { professionDomains, professionTotal } from "@/lib/data/professions";
import { sectionImage } from "@/lib/entity-utils";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";
import type { ProfessionDomain } from "@/lib/mirror-types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  atom: Atom,
  orbit: Orbit,
  globe: Globe,
  dna: Dna,
  moon: Moon,
  waves: Waves,
  scroll: ScrollText,
  scale: Scale,
  sparkles: Sparkles,
  compass: Compass,
  flame: Flame,
};

export function AstralJobsModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const askMirror = useMirror((s) => s.askMirror);

  const [domainId, setDomainId] = useState<string | null>(null);
  const [profession, setProfession] = useState<string | null>(null);

  const open = modal?.type === "astral";

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      closeModal();
      // Reset drill-down after the closing animation
      window.setTimeout(() => {
        setDomainId(null);
        setProfession(null);
      }, 320);
    }
  };

  const domain = professionDomains.find((d) => d.id === domainId) ?? null;
  const role = domain?.professions.find((p) => p.name === profession) ?? null;

  const askAboutRole = () => {
    if (!role) return;
    closeModal();
    void askMirror(
      `Tell me about the profession of "${role.name}" in the astral domains — what does this work involve, and how does it serve evolution?`
    );
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Astral Professions"
      description="12 domains · 1,303 catalogued roles. Click a domain to enter, a profession to learn more — ask the Mirror for a full transmission anytime."
      widthClass="sm:max-w-[680px]"
    >
      <div className="flex items-center gap-3 px-5 sm:px-6">
        <span className="mono-label rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2.5 py-1 text-[8.5px] text-[var(--cy)]">
          {professionTotal.toLocaleString()} roles
        </span>
        <span className="mono-label rounded-full border hairline px-2.5 py-1 text-[8.5px] text-muted-foreground">
          {professionDomains.length} domains
        </span>
        {domain && (
          <button
            type="button"
            onClick={() => {
              setProfession(null);
              setDomainId(null);
            }}
            className="focus-glow flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            All domains
          </button>
        )}
      </div>

      <div className="nice-scroll max-h-[min(58vh,500px)] overflow-y-auto px-5 pb-5 pt-3.5 sm:px-6">
        {/* Level 1 — domains */}
        {!domain && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {professionDomains.map((d: ProfessionDomain) => {
              const Icon = ICONS[d.icon] ?? Sparkles;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDomainId(d.id)}
                  className="focus-glow group flex flex-col items-start overflow-hidden rounded-xl border hairline bg-[var(--glass-bg-soft)] text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:glow-sm"
                >
                  <span
                    className="relative block h-16 w-full"
                    aria-hidden="true"
                  >
                    { }
                    <img
                      src={sectionImage(`dom-${d.id}`)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 20%, color-mix(in srgb, var(--card) 72%, transparent) 100%)",
                      }}
                    />
                  </span>
                  <span className="flex w-full items-start justify-between gap-2 px-3.5">
                    <span className="-mt-5 flex size-8 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] backdrop-blur-sm">
                      <Icon
                        className="size-4 text-[var(--cy)]"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mono-label mt-2 rounded-full bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] px-1.5 py-0.5 text-[8px] text-[var(--cy)]">
                      {d.count}
                    </span>
                  </span>
                  <span className="mt-2 px-3.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-foreground">
                    {d.title}
                  </span>
                  <span className="mt-1 line-clamp-2 px-3.5 pb-2 text-[11px] leading-relaxed text-muted-foreground">
                    {d.description}
                  </span>
                  <span className="mono-label mb-3 mt-1.5 flex items-center gap-1 px-3.5 text-[8.5px] text-[var(--cy)]">
                    Explore
                    <ArrowRight
                      className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Level 2 — professions within a domain */}
        {domain && !role && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              {(() => {
                const Icon = ICONS[domain.icon] ?? Sparkles;
                return (
                  <span className="flex size-7 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
                    <Icon className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
                  </span>
                );
              })()}
              <h4 className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground">
                {domain.title}
              </h4>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                {domain.count} catalogued
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {domain.professions.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setProfession(p.name)}
                  className="focus-glow group rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:glow-sm"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="block text-[12.5px] font-semibold text-foreground">
                      {p.name}
                    </span>
                    {p.openings != null && (
                      <span className="mono-label shrink-0 rounded-full border border-[var(--ok)]/30 bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] px-1.5 py-0.5 text-[7.5px] text-[var(--ok)]">
                        {p.openings} seats
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                    {p.blurb}
                  </span>
                  <span className="mono-label mt-2 flex items-center gap-1 text-[8.5px] text-[var(--cy)]">
                    Learn more
                    <ArrowRight
                      className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Level 3 — profession detail */}
        {domain && role && (
          <article
            className={cn(
              "rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4 sm:p-5",
              "animate-rise-in"
            )}
          >
            <button
              type="button"
              onClick={() => setProfession(null)}
              className="focus-glow mb-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              {domain.title}
            </button>
            <h4 className="text-[14px] font-semibold text-foreground">
              {role.name}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-[11.5px] italic text-[var(--cy)]">{role.blurb}</p>
              {role.openings != null && (
                <span className="mono-label rounded-full border border-[var(--ok)]/30 bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] px-2 py-0.5 text-[8px] text-[var(--ok)]">
                  {role.openings} open seats across federated fleets
                </span>
              )}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              {role.detail}
            </p>
            <button
              type="button"
              onClick={askAboutRole}
              className="focus-glow mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
            >
              <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
              Ask the Mirror for a full transmission
            </button>
          </article>
        )}
      </div>
    </ModalShell>
  );
}
