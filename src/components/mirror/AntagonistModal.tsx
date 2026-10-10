"use client";

import { useMemo } from "react";
import { ArrowLeft, MessageCircle, SunMoon } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { antagonists } from "@/lib/data/antagonists";
import { entityImage } from "@/lib/entity-utils";
import { FactTile, ProfileFigure, ProfileSection } from "./ProfileBits";
import { ModalShell } from "./ModalShell";

/**
 * AntagonistModal — the full dossier page of one of the non-positive-oriented
 * beings: its portrait as the lead plate,
 * the at-a-glance facts, and the four archive sections — where they
 * operate, how they appear, their role in the whole, what they mirror.
 * The register is held without anger: antagonist is a role, valid and
 * necessary, one pole of the turning of evolution and duality.
 */
export function AntagonistModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const askAboutAntagonist = useMirror((s) => s.askAboutAntagonist);
  const t = useT();

  const open = modal?.type === "antagonist";
  const being = useMemo(
    () => (open ? antagonists.find((b) => b.id === modal.id) ?? null : null),
    [open, modal]
  );

  const title = being?.name ?? t("Antagonist dossier");
  const description = being
    ? t("One of the antagonist roles of the living archive")
    : undefined;

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={title}
      description={description}
      widthClass="sm:max-w-[620px]"
    >
      {being && (
        <AntagonistBody
          id={being.id}
          name={being.name}
          origin={being.origin}
          density={being.density}
          form={being.form}
          role={being.role}
          lesson={being.lesson}
          onConsult={() => {
            closeModal();
            askAboutAntagonist(being.name);
          }}
        />
      )}
    </ModalShell>
  );
}

function AntagonistBody({
  id,
  name,
  origin,
  density,
  form,
  role,
  lesson,
  onConsult,
}: {
  id: string;
  name: string;
  origin: string;
  density: string;
  form: string;
  role: string;
  lesson: string;
  onConsult: () => void;
}) {
  const t = useT();

  return (
    <div className="nice-scroll encyc-body max-h-[min(64vh,560px)] space-y-5 overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
      <button
        type="button"
        onClick={() => useMirror.getState().closeModal()}
        data-testid="antagonist-back"
        className="focus-glow group inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-[var(--hairline-hover)] hover:text-foreground"
      >
        <ArrowLeft
          className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        {t("Back to the register")}
      </button>

      {/* the lead plate — the being's own portrait, text wrapping around */}
      <ProfileFigure
        sources={[entityImage(id), "/images/ai/dir-consciousness.jpg"]}
        alt={t("Impression of {name}", { name })}
        variant="lead"
        testid="antagonist-gallery"
      />

      {/* identity chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono-label rounded-full border border-[var(--gd)]/30 bg-[color-mix(in_srgb,var(--gd)_8%,transparent)] px-2.5 py-1 text-[10.5px] text-[var(--gd)]">
          {t("Antagonist role")}
        </span>
        <span className="mono-label rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground">
          {t("Non-positive oriented")}
        </span>
        <span className="mono-label rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground">
          {density}
        </span>
      </div>

      {/* at a glance */}
      <section className="clear-both">
        <h4 className="mono-label text-[10.5px] text-[var(--gd)]">
          {t("At a glance")}
        </h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <FactTile label={t("Being")} value={name} />
          <FactTile
            label={t("Register")}
            value={t("{n} antagonist roles · part of the whole", {
              n: antagonists.length,
            })}
          />
        </div>
      </section>

      {/* the four archive sections */}
      <ProfileSection index="01" label={t("where they operate")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{origin}</p>
      </ProfileSection>

      <ProfileSection index="02" label={t("how they appear")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{form}</p>
      </ProfileSection>

      <ProfileSection index="03" label={t("their role in the whole")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{role}</p>
      </ProfileSection>

      <ProfileSection index="04" label={t("what they mirror")} tone="gd">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">{lesson}</p>
      </ProfileSection>

      {/* the duality note — held without anger */}
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--gd)_22%,transparent)] bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] px-4 py-3.5">
        <h4 className="mono-label flex items-center gap-1.5 text-[10px] text-[var(--gd)]">
          <SunMoon className="size-3" aria-hidden="true" />
          {t("a note on duality")}
        </h4>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/80">
          {t(
            "The archive holds them without anger: antagonist is a role, not a verdict. Duality is the engine of evolution — every wheel needs both poles to turn. These presences carry the challenging pole, valid and needed, and the whole is not whole without them."
          )}
        </p>
      </div>

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
        <SunMoon className="size-3" aria-hidden="true" />
        {t("The antagonist register — the balancing half of the archive")}
      </p>
    </div>
  );
}
