"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useMirror, findDossier } from "@/lib/mirror-store";
import { entityImage, groupImage, findEntity } from "@/lib/entity-utils";
import { ModalShell } from "./ModalShell";
import { cn } from "@/lib/utils";

/* ---------------- shared bits ---------------- */

function Field({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <section>
      <h4 className="mono-label text-[8.5px] text-[var(--cy)]">{label}</h4>
      <p
        className={cn(
          "mt-1.5 text-[12.5px] leading-relaxed",
          accent ? "text-foreground/90" : "text-foreground/85"
        )}
      >
        {value}
      </p>
    </section>
  );
}

function ContextNote() {
  return (
    <div className="rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
      <h4 className="mono-label text-[8px] text-[var(--gd)]">Context note</h4>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        This dossier reflects channeled tradition and worldbuilding within the
        Mirror archive. It is offered for reflection and wonder — not as
        established science.
      </p>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "cy" | "pk";
}) {
  return (
    <span
      className={cn(
        "mono-label rounded-full border px-2.5 py-1 text-[8.5px]",
        tone === "cy" &&
          "border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] text-[var(--cy)]",
        tone === "pk" &&
          "border-[var(--pk)]/30 bg-[color-mix(in_srgb,var(--pk)_8%,transparent)] text-[var(--pk)]",
        tone === "neutral" && "hairline text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- entity (individual) dossier ---------------- */

function EntityDossier({
  kind,
  id,
}: {
  kind: "civilization" | "interdim";
  id: string;
}) {
  const openModal = useMirror((s) => s.openModal);
  const closeModal = useMirror((s) => s.closeModal);
  const askMirror = useMirror((s) => s.askMirror);

  const rep = useMemo(() => findEntity(kind, id), [kind, id]);
  const entry = useMemo(
    () => (rep ? findDossier(kind, rep.groupId) : null),
    [rep, kind]
  );

  if (!entry || !rep) return null;

  const askQuestion = () => {
    closeModal();
    void askMirror(
      kind === "civilization"
        ? `Please tell me about ${rep.name}, one of the ${entry.name} — their nature, their work, and how they support humanity right now.`
        : `Please introduce ${rep.name} of the ${entry.name} — what is their presence like, and how can one respectfully connect with their field?`
    );
  };

  return (
    <>
      <div className="nice-scroll max-h-[min(56vh,500px)] space-y-4 overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
        {/* portrait */}
        <div className="flex items-center gap-4">
          <span
            className="relative size-20 shrink-0 overflow-hidden rounded-full border-2"
            style={{ borderColor: "color-mix(in srgb, var(--cy) 35%, transparent)" }}
          >
            { }
            <img
              src={entityImage(rep.id)}
              alt={`AI-rendered portrait impression of ${rep.name}`}
              loading="lazy"
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-snug text-foreground/90">
              {rep.name}
            </p>
            <p className="mt-1 text-[11.5px] italic leading-relaxed text-muted-foreground">
              {rep.origin}
            </p>
            <button
              type="button"
              onClick={() =>
                openModal({ type: "dossier", kind, id: entry.id })
              }
              className="focus-glow mt-2 inline-flex items-center gap-1 rounded-full border hairline px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" aria-hidden="true" />
              Back to {entry.name}
            </button>
          </div>
        </div>

        <Field label="Specialty" value={rep.specialty} accent />
        <Field label="Density band" value={rep.density} />
        <Field label="Signs of resonance" value={rep.signal} />

        <ContextNote />
      </div>

      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={askQuestion}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          Ask the Mirror about {rep.name}
        </button>
      </div>
    </>
  );
}

/* ---------------- group dossier ---------------- */

function GroupDossierBody({
  kind,
  id,
}: {
  kind: "civilization" | "interdim";
  id: string;
}) {
  const entry = useMemo(() => findDossier(kind, id), [kind, id]);
  const openModal = useMirror((s) => s.openModal);
  const [showAll, setShowAll] = useState(false);

  if (!entry) return null;

  const kindLabel =
    kind === "civilization" ? "Civilization dossier" : "Interdimensional dossier";
  const shown = showAll ? entry.representatives : entry.representatives.slice(0, 24);

  return (
    <>
      {/* banner */}
      <div className="relative mx-5 h-28 overflow-hidden rounded-xl sm:mx-6">
        { }
        <img
          src={groupImage(kind, entry.id)}
          alt={`AI-rendered scene impression of the ${entry.name}`}
          loading="lazy"
          className="size-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, color-mix(in srgb, var(--card) 78%, transparent) 100%)",
          }}
        />
        <span className="mono-label absolute bottom-2 left-3 rounded-full border hairline bg-[var(--glass-bg-strong)] px-2 py-0.5 text-[7.5px] text-muted-foreground">
          AI visualization · impressionistic
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 sm:px-6">
        <Badge tone="cy">{kindLabel}</Badge>
        <Badge>{entry.count} named representatives</Badge>
        <Badge tone="pk">{entry.range}</Badge>
      </div>

      <div className="nice-scroll max-h-[min(48vh,430px)] space-y-4 overflow-y-auto px-5 pb-4 pt-4 sm:px-6">
        <Field label="Essence" value={entry.essence} accent />
        <Field label="Role in human awakening" value={entry.role} />
        <Field label="Signs of resonance" value={entry.signal} />

        {/* representatives */}
        <section>
          <div className="flex items-center justify-between">
            <h4 className="mono-label text-[8.5px] text-[var(--cy)]">
              Named representatives
            </h4>
            {entry.representatives.length > 24 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="focus-glow rounded-full border hairline px-2.5 py-1 text-[9.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {showAll ? "Show fewer" : `Show all ${entry.count}`}
              </button>
            )}
          </div>
          <ul className="nice-scroll mt-2 max-h-64 space-y-0.5 overflow-y-auto rounded-xl border hairline p-1.5">
            {shown.map((rep) => (
              <li key={rep.id}>
                <button
                  type="button"
                  onClick={() =>
                    openModal({ type: "entity", kind, id: rep.id })
                  }
                  className="focus-glow group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_8%,transparent)]"
                >
                  <span
                    className="size-7 shrink-0 overflow-hidden rounded-full border hairline"
                    aria-hidden="true"
                  >
                    { }
                    <img
                      src={entityImage(rep.id)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-foreground/80 transition-colors group-hover:text-[var(--cy)]">
                    {rep.name}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-muted-foreground/60">
                    {rep.density}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <ContextNote />
      </div>

      <div className="border-t hairline px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            const q =
              kind === "civilization"
                ? `Who are the ${entry.name}, and how are they supporting humanity right now?`
                : `Please introduce the ${entry.name} — what is their nature, and how can one respectfully connect with their field?`;
            useMirror.getState().closeModal();
            useMirror.getState().askMirror(q);
          }}
          className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
          Ask the Mirror about the {entry.name}
        </button>
      </div>
    </>
  );
}

/* ---------------- shell ---------------- */

export function DossierModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);

  const isEntity = modal?.type === "entity";
  const isGroup = modal?.type === "dossier";
  const kind = modal && (isEntity || isGroup) ? modal.kind : null;
  const id = modal && (isEntity || isGroup) ? modal.id : null;

  const groupEntry =
    kind && !isEntity ? findDossier(kind, id as string) : null;
  const open = (isGroup && !!groupEntry) || (isEntity && !!kind && !!id);

  let title = "Dossier";
  let description: string | undefined;
  if (isGroup && groupEntry) {
    title = groupEntry.name;
    description = groupEntry.origin;
  } else if (isEntity && kind && id) {
    const rep = findEntity(kind, id);
    title = rep?.name ?? "Representative";
    description = rep
      ? `A named representative — ${rep.origin}`
      : "A named representative of the archive";
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={title}
      description={description}
      widthClass="sm:max-w-[560px]"
    >
      {isEntity && kind && id ? (
        <EntityDossier kind={kind} id={id} />
      ) : isGroup && kind && id ? (
        <GroupDossierBody kind={kind} id={id} />
      ) : null}
    </ModalShell>
  );
}
