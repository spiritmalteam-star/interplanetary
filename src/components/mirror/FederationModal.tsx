"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
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
import { sceneImageFor, sceneImageForDistinct } from "@/lib/profile-visuals";
import { distinctChains, ProfileFigure } from "./ProfileBits";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";
import type {
  FederationBodyProfile,
  FederationCard,
  PrincipleProfile,
  TreatyProfile,
} from "@/lib/mirror-types";

type Tab = "bodies" | "treaties" | "principles";

const TABS: { id: Tab; label: string }[] = [
  { id: "bodies", label: "Bodies" },
  { id: "treaties", label: "Treaties" },
  { id: "principles", label: "Principles" },
];

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** Per-tab intro lines. Counts are derived from the data arrays — never hardcoded. */
function tabIntro(tab: Tab): { key: string; params: Record<string, string | number> } {
  switch (tab) {
    case "bodies":
      return {
        key: "The governing and coordinating bodies of the galactic family — {n} at present. Open any entry to view its full record and emblem.",
        params: { n: federationBodies.length },
      };
    case "treaties":
      return {
        key: "The {n} accords that hold the federation together — and hold it back from us. Open any entry to view its full record and emblem.",
        params: { n: federationTreaties.length },
      };
    case "principles":
      return {
        key: "The {n} operating principles every signatory civilization is asked to keep. Open any entry to view its full record and emblem.",
        params: { n: federationPrinciples.length },
      };
  }
}

/** The per-tab "Ask the Mirror" prompt, interpolated with the item's name. */
function askPromptFor(tab: Tab, name: string, t: TranslateFn): string {
  if (tab === "bodies") {
    return t(
      "Please tell me about the {name} of the Galactic Federation — their role, their members, and how they relate to Earth right now.",
      { name }
    );
  }
  if (tab === "treaties") {
    return t(
      "Please explain \"{name}\" of the Galactic Federation — what it protects, and why it matters for humanity.",
      { name }
    );
  }
  return t(
    "Please teach me the principle of \"{name}\" as the Galactic Federation holds it — how can a human being practice it this week?",
    { name }
  );
}

function DiamondBullet() {
  return (
    <span
      className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
      style={{ background: "var(--cy)" }}
      aria-hidden="true"
    />
  );
}

/* ---------------- list view — each card is an openable record ---------------- */

function CardRow({ card, onOpen }: { card: FederationCard; onOpen: () => void }) {
  const t = useT();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("Open {name}", { name: card.name })}
      className="focus-glow group w-full rounded-xl border hairline bg-[var(--glass-bg-soft)] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:glow-sm"
    >
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
            <h4 className="text-[15.5px] font-semibold uppercase tracking-[0.08em] text-foreground">
              {card.name}
            </h4>
            <span className="mono-label shrink-0 rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2 py-0.5 text-[10.5px] text-[var(--cy)]">
              {t(card.badge)}
            </span>
          </div>
          <p className="mono-label mt-1.5 text-[10.5px] text-[var(--pk)]/90">
            {t(card.label)}
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[15px] leading-relaxed text-foreground/80">
        {card.description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t hairline pt-2.5">
        <span className="mono-label flex items-center gap-1.5 text-[10.5px] text-muted-foreground/80">
          <Users className="size-3 text-muted-foreground/70" aria-hidden="true" />
          {t(card.footer)}
        </span>
        <span className="mono-label flex shrink-0 items-center gap-1 text-[10.5px] text-muted-foreground/70 transition-colors duration-300 group-hover:text-[var(--cy)]">
          {t("Full dossier")}
          <ChevronRight
            className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </button>
  );
}

/* ---------------- detail view — the item's full record ---------------- */

function CardDetail({
  card,
  tab,
  onBack,
}: {
  card: FederationCard;
  tab: Tab;
  onBack: () => void;
}) {
  const askMirror = useMirror((s) => s.askMirror);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();

  // Deep dossiers are keyed by name; lookups may miss and are rendered only when present.
  const body: FederationBodyProfile | undefined =
    tab === "bodies" ? federationBodyProfiles[card.name] : undefined;
  const treaty: TreatyProfile | undefined =
    tab === "treaties" ? federationTreatyProfiles[card.name] : undefined;
  const principle: PrincipleProfile | undefined =
    tab === "principles" ? federationPrincipleProfiles[card.name] : undefined;
  const hasDossier = Boolean(body || treaty || principle);

  const ask = () => {
    closeModal();
    void askMirror(askPromptFor(tab, card.name, t));
  };

  /* the page's three plates — emblem first, no image ever twice */
  const emblem = card.imageKey ? sectionImage(card.imageKey) : null;
  const milieuScene = card.imageKey
    ? sceneImageFor(card.imageKey, "milieu")
    : null;
  const kinScene = card.imageKey
    ? sceneImageForDistinct(card.imageKey, "kin", [
        milieuScene!,
        emblem!,
      ])
    : null;
  const chambersScene = card.imageKey
    ? sceneImageForDistinct(card.imageKey, "chambers", [
        milieuScene!,
        kinScene!,
        emblem!,
      ])
    : null;
  const plates = emblem
    ? distinctChains([
        [emblem, milieuScene!],
        [kinScene!, milieuScene!],
        [chambersScene!, milieuScene!],
      ])
    : null;

  return (
    <div className="animate-rise-in space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="focus-glow mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        {t("Back to the federation record")}
      </button>

      {/* the lead plate — the emblem, the record wrapping around */}
      {plates && (
        <ProfileFigure
          sources={plates[0]}
          alt={t("AI-rendered emblem impression of the {name}", { name: card.name })}
          variant="lead"
          testid="federation-gallery"
        />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono-label rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2 py-0.5 text-[10.5px] text-[var(--cy)]">
          {t(card.badge)}
        </span>
        <span className="mono-label rounded-full border border-[var(--pk)]/30 bg-[color-mix(in_srgb,var(--pk)_8%,transparent)] px-2 py-0.5 text-[10.5px] text-[var(--pk)]">
          {t(card.label)}
        </span>
      </div>

      <div>
        <h3 className="text-[16.5px] font-semibold uppercase tracking-[0.06em] text-foreground">
          {card.name}
        </h3>
        <p className="mono-label mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground/80">
          <Users className="size-3 text-muted-foreground/70" aria-hidden="true" />
          {t(card.footer)}
        </p>
      </div>

      <p className="text-[14.5px] leading-relaxed text-foreground/85">{card.description}</p>

      {/* the second plate — the milieu, wrapped by the dossier */}
      {plates && (
        <ProfileFigure
          sources={plates[1]}
          alt={t("The milieu of the {name} — an impressionistic scene", { name: card.name })}
          side="left"
          testid="federation-gallery-milieu"
        />
      )}

      {hasDossier && (
        <div className="clear-both space-y-4 rounded-xl border hairline bg-[color-mix(in_srgb,var(--cy)_4%,transparent)] p-4">
          <h4 className="mono-label text-[10px] text-[var(--cy)]">{t("Full dossier")}</h4>

          {body && (
            <>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Mandate")}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
                  {body.mandate}
                </p>
              </section>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-lg border hairline px-2.5 py-2">
                  <MapPin className="mt-0.5 size-3 shrink-0 text-[var(--pk)]" aria-hidden="true" />
                  <div>
                    <p className="mono-label text-[9px] text-muted-foreground">{t("Seat")}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-foreground/85">{body.seat}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border hairline px-2.5 py-2">
                  <CalendarClock className="mt-0.5 size-3 shrink-0 text-[var(--pk)]" aria-hidden="true" />
                  <div>
                    <p className="mono-label text-[9px] text-muted-foreground">{t("Founded")}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-foreground/85">{body.founded}</p>
                  </div>
                </div>
              </div>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Fleet & assets")}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">{body.fleet}</p>
              </section>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Jurisdiction")}</h5>
                <ul className="mt-1.5 space-y-1.5">
                  {body.jurisdiction.map((j, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <DiamondBullet />
                      <span className="text-[14px] leading-relaxed text-foreground/85">{j}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Relation to Earth")}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
                  {body.earthRelation}
                </p>
              </section>
            </>
          )}

          {treaty && (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="mono-label text-[10px] text-muted-foreground">
                  {t("Signed")} · <span className="text-foreground/80">{treaty.signed}</span>
                </span>
                <span className="mono-label text-[10px] text-muted-foreground">
                  {t("Signatories")} · <span className="text-foreground/80">{treaty.signatories}</span>
                </span>
              </div>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Clauses")}</h5>
                <ul className="mt-1.5 space-y-1.5">
                  {treaty.clauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <DiamondBullet />
                      <span className="text-[14px] leading-relaxed text-foreground/85">{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Effect")}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">{treaty.effect}</p>
              </section>
            </>
          )}

          {principle && (
            <>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Codified")}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
                  {principle.codified}
                </p>
              </section>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Clauses")}</h5>
                <ul className="mt-1.5 space-y-1.5">
                  {principle.clauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <DiamondBullet />
                      <span className="text-[14px] leading-relaxed text-foreground/85">{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h5 className="mono-label text-[10px] text-[var(--cy)]">{t("Practice")}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
                  {principle.practice}
                </p>
              </section>
            </>
          )}
        </div>
      )}

      {/* the third plate — the chambers, before the closing invitation */}
      {plates && (
        <ProfileFigure
          sources={plates[2]}
          alt={t("The chambers of the {name} — an impressionistic scene", { name: card.name })}
          testid="federation-gallery-chambers"
        />
      )}

      <button
        type="button"
        onClick={ask}
        className="focus-glow mono-label inline-flex items-center gap-1.5 rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-3 py-1.5 text-[10.5px] text-[var(--cy)] transition-opacity hover:opacity-80"
      >
        <Sparkles className="size-3" aria-hidden="true" />
        {t("Ask the Mirror")}
      </button>
    </div>
  );
}

/* ---------------- archive body — tabs + list/detail switch ----------------
   Mounted inside the dialog subtree: Radix unmounts it on close, so the
   list/detail state resets naturally whenever the modal closes or reopens. */

function FederationArchive() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("bodies");
  const [selected, setSelected] = useState<FederationCard | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Return the panel to the top when the view or section changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, selected]);

  const cards =
    tab === "bodies"
      ? federationBodies
      : tab === "treaties"
        ? federationTreaties
        : federationPrinciples;

  const intro = tabIntro(tab);

  return (
    <div>
      <div className="flex gap-1.5 px-5 sm:px-6" role="tablist" aria-label={t("Federation archive sections")}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setSelected(null);
            }}
            className={cn(
              "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.14em] transition-all duration-300",
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
        ref={scrollRef}
        className="nice-scroll encyc-body max-h-[min(60vh,520px)] overflow-y-auto px-5 pb-5 pt-3 sm:px-6"
        role="tabpanel"
        aria-label={tab}
      >
        {selected ? (
          <CardDetail
            key={selected.name}
            card={selected}
            tab={tab}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="animate-rise-in">
            <p className="mb-3 text-[13px] italic text-muted-foreground/80">
              {t(intro.key, intro.params)}
            </p>
            <div className="space-y-3">
              {cards.map((card) => (
                <CardRow key={card.name} card={card} onOpen={() => setSelected(card)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- modal shell ---------------- */

export function FederationModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();

  const open = modal?.type === "federation";

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={t("Galactic Federation & Interstellar Treaties")}
      description={t(
        "How diplomatic, interplanetary, and inter-reality governance actually works. Open any item for its full dossier — ask the Mirror for a transmission anytime."
      )}
      widthClass="sm:max-w-[680px]"
    >
      <FederationArchive />
    </ModalShell>
  );
}
