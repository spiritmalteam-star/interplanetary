"use client";

import { useMemo } from "react";
import { ArrowLeft, MessageCircle, Mountain } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { innerEarth } from "@/lib/data/inner-earth";
import { sceneImageFor, sceneImageForDistinct } from "@/lib/profile-visuals";
import {
  ContextNote,
  distinctChains,
  FactTile,
  ProfileFigure,
  ProfileSection,
} from "./ProfileBits";
import { ModalShell } from "./ModalShell";

/**
 * SpeciesModal — the full encyclopedia page of one of the 59 peoples
 * beneath the Earth: its own painting blended into the text as plates
 * (never an image twice), the at-a-glance facts, and the three
 * archive sections — dwelling, form, mirror.
 */
export function SpeciesModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const askAboutInnerEarth = useMirror((s) => s.askAboutInnerEarth);
  const t = useT();

  const open = modal?.type === "species";
  const species = useMemo(
    () => (open ? innerEarth.find((s) => s.id === modal.id) ?? null : null),
    [open, modal]
  );

  const title = species?.name ?? t("Species dossier");
  const description = species
    ? t("A people of the Inner Earth register")
    : undefined;

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={title}
      description={description}
      widthClass="sm:max-w-[620px]"
    >
      {species && (
        <SpeciesBody
          id={species.id}
          name={species.name}
          hall={species.hall}
          form={species.form}
          gift={species.gift}
          onConsult={() => {
            closeModal();
            askAboutInnerEarth(species.name);
          }}
        />
      )}
    </ModalShell>
  );
}

function SpeciesBody({
  id,
  name,
  hall,
  form,
  gift,
  onConsult,
}: {
  id: string;
  name: string;
  hall: string;
  form: string;
  gift: string;
  onConsult: () => void;
}) {
  const t = useT();

  /* the page's three plates — own painting first, no image ever twice */
  const realmsScene = sceneImageFor(id, "realms");
  const hallScene = sceneImageForDistinct(id, "hall", [
    realmsScene,
    "/images/ai/fam-inner-earth.jpg",
  ]);
  const plates = distinctChains([
    [`/images/ai/inner-earth/ie-${id}.jpg`, "/images/ai/fam-inner-earth.jpg"],
    [realmsScene, "/images/ai/fam-inner-earth.jpg"],
    [hallScene, "/images/ai/dir-matter.jpg"],
  ]);

  return (
    <div className="nice-scroll encyc-body max-h-[min(64vh,560px)] space-y-5 overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
      <button
        type="button"
        onClick={() => useMirror.getState().closeModal()}
        data-testid="species-back"
        className="focus-glow group inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-[var(--hairline-hover)] hover:text-foreground"
      >
        <ArrowLeft
          className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        {t("Back to the register")}
      </button>

      {/* the lead plate — the people's own painting, text wrapping around */}
      <ProfileFigure
        sources={plates[0]}
        alt={t("Impression of {name}", { name })}
        variant="lead"
        testid="species-gallery"
      />

      {/* identity chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono-label rounded-full border border-[var(--gd)]/30 bg-[color-mix(in_srgb,var(--gd)_8%,transparent)] px-2.5 py-1 text-[10.5px] text-[var(--gd)]">
          {t("Species dossier")}
        </span>
        <span className="mono-label rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground">
          {t("Inner Earth")}
        </span>
      </div>

      {/* at a glance */}
      <section className="clear-both">
        <h4 className="mono-label text-[10.5px] text-[var(--gd)]">
          {t("At a glance")}
        </h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <FactTile label={t("People")} value={name} />
          <FactTile
            label={t("Register")}
            value={t("59 peoples beneath the surface")}
          />
        </div>
      </section>

      {/* the three archive sections */}
      <ProfileSection index="01" label={t("where they dwell")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{hall}</p>
      </ProfileSection>

      {/* the second plate — a scene of the deep realms */}
      <ProfileFigure
        sources={plates[1]}
        alt={t("The Inner Earth realms")}
        side="left"
        testid="species-gallery-realms"
      />

      <ProfileSection index="02" label={t("how they appear")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{form}</p>
      </ProfileSection>

      <ProfileSection index="03" label={t("what they mirror")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{gift}</p>
      </ProfileSection>

      {/* the third plate — the hall where they are met */}
      <ProfileFigure
        sources={plates[2]}
        alt={t("A hall scene from the deep archive")}
        testid="species-gallery-hall"
      />

      <ContextNote tone="gd" className="clear-both" />

      <button
        type="button"
        onClick={onConsult}
        className="focus-glow clear-both flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--gd)_35%,transparent)] bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] px-4 py-2.5 text-[13.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
      >
        <MessageCircle className="size-3.5 text-[var(--gd)]" aria-hidden="true" />
        {t("Consult the Mirror")}
      </button>

      {/* the register mark */}
      <p className="mono-label flex items-center justify-center gap-1.5 pb-1 text-center text-[9px] text-muted-foreground/60">
        <Mountain className="size-3" aria-hidden="true" />
        {t("Inner Earth register — the deep halls of the archive")}
      </p>
    </div>
  );
}
