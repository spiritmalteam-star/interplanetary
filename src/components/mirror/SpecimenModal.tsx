"use client";

import { useState } from "react";
import { NotebookPen, Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import {
  findFaunaSpecimen,
  findFloraSpecimen,
  specimenImage,
} from "@/lib/data/biology";
import { useT } from "@/lib/i18n";
import type { FaunaSpecimen, FloraSpecimen, SpecimenKind } from "@/lib/mirror-types";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";

/* ---------------- shared bits ---------------- */

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok";
}) {
  return (
    <span
      className={cn(
        "mono-label rounded-full border px-2.5 py-1 text-[8.5px]",
        tone === "ok" &&
          "border-[var(--ok)]/30 bg-[color-mix(in_srgb,var(--ok)_8%,transparent)] text-[var(--ok)]",
        tone === "neutral" && "hairline text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-2.5 py-2">
      <p className="mono-label text-[7px] text-muted-foreground/80">{label}</p>
      <p className="mt-1 text-[11px] leading-snug text-foreground/90">{value}</p>
    </div>
  );
}

function SpecimenHero({
  kind,
  artIndex,
  name,
}: {
  kind: SpecimenKind;
  artIndex: number;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const t = useT();

  return (
    <div
      className="relative mx-5 h-40 overflow-hidden rounded-xl border hairline sm:mx-6"
      style={{
        boxShadow:
          "0 12px 40px -18px color-mix(in srgb, var(--ok) 35%, transparent)",
      }}
    >
      {failed ? (
        <div
          className="size-full"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, var(--ok) 18%, transparent), transparent 70%)",
          }}
        />
      ) : (
        <img
          src={specimenImage(kind, artIndex)}
          alt={t("AI-rendered scene impression of the {name}", { name })}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 55%, color-mix(in srgb, var(--card) 62%, transparent) 100%)",
        }}
      />
      <span className="mono-label absolute bottom-2 left-3 rounded-full border hairline bg-[var(--glass-bg-strong)] px-2 py-0.5 text-[7.5px] text-muted-foreground">
        {t("AI visualization · impressionistic")}
      </span>
    </div>
  );
}

/* ---------------- specimen body (one field-record view per kind) ---------------- */

type SpecimenBodyProps =
  | { kind: "fauna"; specimen: FaunaSpecimen }
  | { kind: "flora"; specimen: FloraSpecimen };

function SpecimenBody({ kind, specimen: s }: SpecimenBodyProps) {
  const closeModal = useMirror((s) => s.closeModal);
  const askMirror = useMirror((s) => s.askMirror);
  const t = useT();

  const classLabel =
    kind === "fauna" ? t(s.className) : t(s.lineage);

  const statFields: { label: string; value: string }[] =
    kind === "fauna"
      ? [
          { label: t("Habitat"), value: s.habitat },
          { label: t("Diet"), value: s.diet },
          { label: t("Temperament"), value: s.temperament },
          { label: t("Size"), value: s.size },
          { label: t("Lifespan"), value: s.lifespan },
        ]
      : [
          { label: t("Habitat"), value: s.habitat },
          { label: t("Bloom cycle"), value: s.bloomCycle },
          { label: t("Scent"), value: s.scent },
          { label: t("Height"), value: s.height },
          { label: t("Properties"), value: s.properties },
        ];

  const askQuestion = () => {
    closeModal();
    void askMirror(
      t(
        "Please tell me about the specimen {name} (registry {no}, {group} of the {origin}) — its nature, its field traits, and what its presence mirrors back to us.",
        { name: s.name, no: s.registryNo, group: classLabel, origin: s.originName }
      )
    );
  };

  return (
    <>
      <SpecimenHero kind={kind} artIndex={s.artIndex} name={s.name} />

      {/* chips */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 sm:px-6">
        <Chip tone="ok">{classLabel}</Chip>
        <Chip>{t(s.rarity)}</Chip>
      </div>

      <div className="nice-scroll max-h-[min(60vh,540px)] space-y-5 overflow-y-auto px-5 pb-4 pt-4 sm:px-6">
        {/* origin */}
        <section>
          <h4 className="mono-label text-[8.5px] text-[var(--ok)]">
            {t("Origin civilization")}
          </h4>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">
            {s.originName}
          </p>
          <p className="mt-1 text-[11px] italic leading-relaxed text-muted-foreground">
            {s.originWorld}
          </p>
        </section>

        {/* stat grid */}
        <div className="grid grid-cols-2 gap-2">
          {statFields.map((f) => (
            <Stat key={f.label} label={f.label} value={f.value} />
          ))}
        </div>

        {/* field traits — exactly 4 */}
        <section>
          <h4 className="mono-label text-[8.5px] text-[var(--ok)]">
            {t("Field traits")}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {s.traits.map((trait, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                  style={{ background: "var(--ok)" }}
                  aria-hidden="true"
                />
                <span className="text-[12px] leading-relaxed text-foreground/85">
                  {trait}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* field note */}
        <div className="rounded-xl border hairline bg-[color-mix(in_srgb,var(--ok)_6%,transparent)] p-3.5">
          <h4 className="mono-label flex items-center gap-1.5 text-[8px] text-[var(--ok)]">
            <NotebookPen className="size-3" aria-hidden="true" />
            {t("Field note")}
          </h4>
          <p className="mt-2 font-serif text-[13.5px] italic leading-relaxed text-foreground/90">
            “{s.note}”
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={askQuestion}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <Sparkles className="size-3.5 text-[var(--ok)]" aria-hidden="true" />
          {t("Ask the Mirror about {name}", { name: s.name })}
        </button>
      </div>
    </>
  );
}

/* ---------------- shell (self-gating) ---------------- */

export function SpecimenModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();

  const isSpecimen = modal?.type === "specimen";
  const kind = isSpecimen ? modal.kind : null;
  const id = isSpecimen ? modal.id : null;

  const fauna = isSpecimen && kind === "fauna" && id ? findFaunaSpecimen(id) : undefined;
  const flora = isSpecimen && kind === "flora" && id ? findFloraSpecimen(id) : undefined;
  const specimen = fauna ?? flora;

  const open = isSpecimen && !!kind && !!id;

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={specimen?.name ?? t("Specimen not found")}
      description={specimen?.registryNo}
      widthClass="sm:max-w-[560px]"
    >
      {fauna ? (
        <SpecimenBody key={fauna.id} kind="fauna" specimen={fauna} />
      ) : flora ? (
        <SpecimenBody key={flora.id} kind="flora" specimen={flora} />
      ) : null}
    </ModalShell>
  );
}
