"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Cog,
  FlaskConical,
  Globe,
  HeartPulse,
  Home,
  Hourglass,
  Music,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { etechFamilies, etechTotal, type ETechFamily } from "@/lib/data/etstech";
import { sectionImage } from "@/lib/entity-utils";
import { ModalShell } from "./ModalShell";
import { LightboxButton } from "./LightboxModal";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  zap: Zap,
  pulse: HeartPulse,
  radio: Radio,
  rocket: Rocket,
  flask: FlaskConical,
  brain: Brain,
  cog: Cog,
  globe: Globe,
  hourglass: Hourglass,
  shield: ShieldCheck,
  music: Music,
};

/* ---------------- level 1 — the families of use ---------------- */

function FamilyGrid({ onOpen }: { onOpen: (family: ETechFamily) => void }) {
  const t = useT();
  return (
    <div className="animate-rise-in">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {etechFamilies.map((family) => {
          const Icon = ICONS[family.icon] ?? Sparkles;
          return (
            <button
              key={family.id}
              type="button"
              onClick={() => onOpen(family)}
              className="focus-glow group flex flex-col items-start rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:glow-sm"
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
                  <Icon className="size-4 text-[var(--cy)]" aria-hidden="true" />
                </span>
                <span className="mono-label mt-1 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] px-1.5 py-0.5 text-[8px] text-[var(--cy)]">
                  {t("{n} artifacts", { n: family.items.length })}
                </span>
              </span>
              <span className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-foreground">
                {family.title}
              </span>
              <span className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                {family.description}
              </span>
              <span className="mono-label mt-2 flex items-center gap-1 text-[8.5px] text-[var(--cy)]">
                {t("Explore")}
                <ChevronRight
                  className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- level 2 — the artifacts of one family ---------------- */

function ArtifactRow({
  family,
  techId,
  onOpen,
}: {
  family: ETechFamily;
  techId: string;
  onOpen: () => void;
}) {
  const item = family.items.find((i) => i.id === techId)!;
  const t = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("Open {name}", { name: item.name })}
      className="focus-glow group w-full rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:glow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border hairline">
          <img
            src={sectionImage(`tech-${item.id}`)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <LightboxButton
            src={sectionImage(`tech-${item.id}`)}
            alt={t("AI-rendered scene impression of the {name}", { name: item.name })}
          />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[12.5px] font-semibold leading-snug text-foreground">
            {item.name}
          </h4>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {item.blurb}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1 border-t hairline pt-2">
        <span className="mono-label flex items-center gap-1 text-[8.5px] text-muted-foreground/70 transition-colors duration-300 group-hover:text-[var(--cy)]">
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

function FamilyDetail({
  family,
  onBack,
  onOpenArtifact,
}: {
  family: ETechFamily;
  onBack: () => void;
  onOpenArtifact: (techId: string) => void;
}) {
  const t = useT();
  const Icon = ICONS[family.icon] ?? Sparkles;

  return (
    <div className="animate-rise-in">
      <button
        type="button"
        onClick={onBack}
        className="focus-glow mono-label mb-3 inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[8.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        {t("All families")}
      </button>

      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
          <Icon className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
        </span>
        <h4 className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground">
          {family.title}
        </h4>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
          {t("{n} catalogued", { n: family.items.length })}
        </span>
      </div>

      <p className="mb-3 text-[11px] italic leading-relaxed text-muted-foreground/80">
        {t(
          "The {n} artifacts of the {family} family — open any one for its full record and its own AI-rendered impression.",
          { n: family.items.length, family: family.title }
        )}
      </p>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {family.items.map((item) => (
          <ArtifactRow
            key={item.id}
            family={family}
            techId={item.id}
            onOpen={() => onOpenArtifact(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- level 3 — one artifact's full record ---------------- */

function ArtifactDetail({
  family,
  techId,
  onBack,
}: {
  family: ETechFamily;
  techId: string;
  onBack: () => void;
}) {
  const item = family.items.find((i) => i.id === techId)!;
  const askMirror = useMirror((s) => s.askMirror);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();
  const [heroFailed, setHeroFailed] = useState(false);

  const ask = () => {
    closeModal();
    void askMirror(
      t(
        "Please tell me about the ET technology \"{name}\" — what it does, how it works, and how it could serve humanity.",
        { name: item.name }
      )
    );
  };

  return (
    <div className="animate-rise-in space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="focus-glow mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[8.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        {family.title}
      </button>

      {!heroFailed && (
        <figure className="relative m-0">
          <div className="relative h-44 overflow-hidden rounded-xl border hairline shadow-[0_0_40px_-14px_color-mix(in_srgb,var(--cy)_30%,transparent)] sm:h-52">
            <img
              src={sectionImage(`tech-${item.id}`)}
              alt={t("AI-rendered scene impression of the {name}", { name: item.name })}
              className="size-full object-cover"
              onError={() => setHeroFailed(true)}
            />
            <LightboxButton
              src={sectionImage(`tech-${item.id}`)}
              alt={t("AI-rendered scene impression of the {name}", { name: item.name })}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 45%, color-mix(in srgb, var(--card) 72%, transparent) 100%)",
              }}
            />
          </div>
          <figcaption className="mono-label absolute bottom-2 left-3 rounded-full border hairline bg-[var(--glass-bg-strong)] px-2 py-0.5 text-[7.5px] text-muted-foreground">
            {t("AI visualization · impressionistic")}
          </figcaption>
        </figure>
      )}

      <div>
        <span className="mono-label rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2 py-0.5 text-[8.5px] text-[var(--cy)]">
          {family.title}
        </span>
        <h3 className="mt-2 text-[15px] font-semibold uppercase tracking-[0.06em] text-foreground">
          {item.name}
        </h3>
        <p className="mt-1.5 text-[11.5px] italic leading-relaxed text-[var(--cy)]">
          {item.blurb}
        </p>
      </div>

      <p className="text-[12.5px] leading-relaxed text-foreground/85">{item.detail}</p>

      <button
        type="button"
        onClick={ask}
        className="focus-glow mono-label inline-flex items-center gap-1.5 rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-3 py-1.5 text-[8.5px] text-[var(--cy)] transition-opacity hover:opacity-80"
      >
        <Sparkles className="size-3" aria-hidden="true" />
        {t("Ask the Mirror")}
      </button>
    </div>
  );
}

/* ---------------- archive body — family / artifact switch ----------------
   Mounted inside the dialog subtree: Radix unmounts it on close, so the
   drill-down state resets naturally whenever the modal closes or reopens. */

function ETechArchive() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [techId, setTechId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Return the panel to the top when the view changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [familyId, techId]);

  const family = etechFamilies.find((f) => f.id === familyId) ?? null;

  return (
    <div
      ref={scrollRef}
      className="nice-scroll max-h-[min(60vh,520px)] overflow-y-auto px-5 pb-5 pt-3 sm:px-6"
      aria-label="ETs Tech archive"
    >
      {!family ? (
        <FamilyGrid
          onOpen={(f) => {
            setFamilyId(f.id);
            setTechId(null);
          }}
        />
      ) : techId ? (
        <ArtifactDetail
          family={family}
          techId={techId}
          onBack={() => setTechId(null)}
        />
      ) : (
        <FamilyDetail
          family={family}
          onBack={() => setFamilyId(null)}
          onOpenArtifact={(id) => setTechId(id)}
        />
      )}
    </div>
  );
}

/* ---------------- modal shell ---------------- */

export function ETTechModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();

  const open = modal?.type === "etstech";

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={t("Extraterrestrial Technologies")}
      description={t(
        "{n} technologies across {m} families of use. Open a family, then any artifact — every one carries its own AI-rendered impression.",
        { n: etechTotal, m: etechFamilies.length }
      )}
      widthClass="sm:max-w-[720px]"
    >
      <div className="flex items-center gap-3 px-5 pb-1 sm:px-6">
        <span className="mono-label rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2.5 py-1 text-[8.5px] text-[var(--cy)]">
          {t("{n} artifacts", { n: etechTotal })}
        </span>
        <span className="mono-label rounded-full border hairline px-2.5 py-1 text-[8.5px] text-muted-foreground">
          {t("{n} families", { n: etechFamilies.length })}
        </span>
      </div>
      <ETechArchive />
    </ModalShell>
  );
}
