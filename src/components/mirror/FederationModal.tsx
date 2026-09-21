"use client";

import { useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  MapPin,
  Scale,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  federationBodies,
  federationPrinciples,
  federationTreaties,
} from "@/lib/data/federation";
import {
  federationBodyProfiles,
  federationPrincipleProfiles,
  federationTreatyProfiles,
} from "@/lib/federation-profiles";
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
    "The 12 governing and coordinating bodies of the galactic family. Open any body for its full institutional dossier.",
  treaties:
    "The 8 accords that hold the federation together — and hold it back from us. Open any treaty for its clauses.",
  principles:
    "The 8 operating principles every signatory civilization is asked to keep. Open any principle for its practice.",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono-label rounded-full border hairline px-2 py-0.5 text-[8px] text-muted-foreground">
      {children}
    </span>
  );
}

function Card({ card, tab }: { card: FederationCard; tab: Tab }) {
  const askMirror = useMirror((s) => s.askMirror);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const ask = () => {
    const q =
      tab === "bodies"
        ? t(
            "Please tell me about the {name} of the Galactic Federation — their role, their members, and how they relate to Earth right now.",
            { name: card.name }
          )
        : tab === "treaties"
          ? t(
              "Please explain \"{name}\" of the Galactic Federation — what it protects, and why it matters for humanity.",
              { name: card.name }
            )
          : t(
              "Please teach me the principle of \"{name}\" as the Galactic Federation holds it — how can a human being practice it this week?",
              { name: card.name }
            );
    closeModal();
    void askMirror(q);
  };

  const body =
    tab === "bodies" ? federationBodyProfiles[card.name] : undefined;
  const treaty =
    tab === "treaties" ? federationTreatyProfiles[card.name] : undefined;
  const principle =
    tab === "principles" ? federationPrincipleProfiles[card.name] : undefined;

  return (
    <article className="group rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4 transition-colors duration-300 hover:border-[var(--hairline-hover)]">
      <div className="flex items-start gap-3">
        {card.imageKey && (
          <span
            className="relative size-14 shrink-0 overflow-hidden rounded-lg border hairline"
            aria-hidden="true"
          >
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
              {t(card.badge)}
            </span>
          </div>
          <p className="mono-label mt-1.5 text-[8.5px] text-[var(--pk)]/90">
            {t(card.label)}
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">
        {card.description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t hairline pt-2.5">
        <span className="mono-label flex items-center gap-1.5 text-[8.5px] text-muted-foreground/80">
          <Users className="size-3 text-muted-foreground/70" aria-hidden="true" />
          {t(card.footer)}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="focus-glow mono-label flex items-center gap-1 text-[8.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("Full dossier")}
            <ChevronDown
              className={cn(
                "size-3 transition-transform duration-300",
                expanded && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={ask}
            className="focus-glow mono-label flex items-center gap-1 text-[8.5px] text-[var(--cy)] transition-opacity hover:opacity-80"
          >
            <Sparkles className="size-3" aria-hidden="true" />
            {t("Ask the Mirror")}
          </button>
        </span>
      </div>

      {expanded && (
        <div className="animate-rise-in mt-3 space-y-3 rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_4%,transparent)] p-3.5">
          {body && (
            <>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Mandate")}</h5>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">
                  {body.mandate}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-lg border hairline px-2.5 py-2">
                  <MapPin className="mt-0.5 size-3 shrink-0 text-[var(--pk)]" aria-hidden="true" />
                  <div>
                    <p className="mono-label text-[7px] text-muted-foreground">{t("Seat")}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-foreground/85">{body.seat}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border hairline px-2.5 py-2">
                  <CalendarClock className="mt-0.5 size-3 shrink-0 text-[var(--pk)]" aria-hidden="true" />
                  <div>
                    <p className="mono-label text-[7px] text-muted-foreground">{t("Founded")}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-foreground/85">{body.founded}</p>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Fleet & assets")}</h5>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{body.fleet}</p>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Jurisdiction")}</h5>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {body.jurisdiction.map((j, i) => (
                    <Chip key={i}>{j}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Relation to Earth")}</h5>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{body.earthRelation}</p>
              </div>
            </>
          )}

          {treaty && (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="mono-label text-[8px] text-muted-foreground">
                  {t("Signed")} · <span className="text-foreground/80">{treaty.signed}</span>
                </span>
                <span className="mono-label text-[8px] text-muted-foreground">
                  {t("Signatories")} · <span className="text-foreground/80">{treaty.signatories}</span>
                </span>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Clauses")}</h5>
                <ul className="mt-1.5 space-y-1.5">
                  {treaty.clauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                        style={{ background: "var(--cy)" }}
                        aria-hidden="true"
                      />
                      <span className="text-[12px] leading-relaxed text-foreground/85">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Effect")}</h5>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{treaty.effect}</p>
              </div>
            </>
          )}

          {principle && (
            <>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Codified")}</h5>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{principle.codified}</p>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Clauses")}</h5>
                <ul className="mt-1.5 space-y-1.5">
                  {principle.clauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                        style={{ background: "var(--cy)" }}
                        aria-hidden="true"
                      />
                      <span className="text-[12px] leading-relaxed text-foreground/85">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mono-label text-[8px] text-[var(--cy)]">{t("Practice")}</h5>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{principle.practice}</p>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function FederationModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();
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
      title={t("Galactic Federation & Interstellar Treaties")}
      description={t(
        "How diplomatic, interplanetary, and inter-reality governance actually works. Open any item for its full dossier — ask the Mirror for a transmission anytime."
      )}
      widthClass="sm:max-w-[620px]"
    >
      <div className="flex gap-1.5 px-5 sm:px-6" role="tablist" aria-label={t("Federation archive sections")}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-all duration-300",
              tab === id
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground glow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {id === "bodies" && (
              <Users className="size-3" aria-hidden="true" />
            )}
            {id === "treaties" && (
              <ScrollText className="size-3" aria-hidden="true" />
            )}
            {id === "principles" && (
              <Scale className="size-3" aria-hidden="true" />
            )}
            {t(label)}
          </button>
        ))}
      </div>

      <div
        className="nice-scroll max-h-[min(60vh,520px)] overflow-y-auto px-5 pb-5 pt-3 sm:px-6"
        role="tabpanel"
        aria-label={tab}
      >
        <p className="mb-3 text-[11px] italic text-muted-foreground/80">
          {t(TAB_INTRO[tab])}
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
