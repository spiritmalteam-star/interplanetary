"use client";

import { Sparkles } from "lucide-react";
import { useMirror, findDossier } from "@/lib/mirror-store";
import { ModalShell } from "./ModalShell";

export function DossierModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const askMirror = useMirror((s) => s.askMirror);

  const entry =
    modal?.type === "dossier"
      ? findDossier(modal.kind, modal.id)
      : null;

  const open = modal?.type === "dossier" && !!entry;

  const kindLabel =
    modal?.type === "dossier" && modal.kind === "civilization"
      ? "Civilization dossier"
      : "Interdimensional dossier";

  const askQuestion = () => {
    if (!entry) return;
    const q =
      modal?.type === "dossier" && modal.kind === "civilization"
        ? `Who are the ${entry.name}, and how are they supporting humanity right now?`
        : `Please introduce the ${entry.name} — what is their nature, and how can one respectfully connect with their field?`;
    closeModal();
    void askMirror(q);
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={entry ? entry.name : "Dossier"}
      description={
        entry
          ? `${entry.origin}`
          : undefined
      }
      widthClass="sm:max-w-[560px]"
    >
      {entry && (
        <>
          <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6">
            <span className="mono-label rounded-full border border-[var(--cy)]/30 bg-[color-mix(in_srgb,var(--cy)_8%,transparent)] px-2.5 py-1 text-[8.5px] text-[var(--cy)]">
              {kindLabel}
            </span>
            <span className="mono-label rounded-full border hairline px-2.5 py-1 text-[8.5px] text-muted-foreground">
              {entry.count} representatives
            </span>
            <span className="mono-label rounded-full border border-[var(--pk)]/30 bg-[color-mix(in_srgb,var(--pk)_8%,transparent)] px-2.5 py-1 text-[8.5px] text-[var(--pk)]">
              {entry.range}
            </span>
          </div>

          <div className="nice-scroll max-h-[min(52vh,460px)] space-y-4 overflow-y-auto px-5 pb-4 pt-4 sm:px-6">
            {[
              { label: "Essence", value: entry.essence },
              { label: "Role in human awakening", value: entry.role },
              { label: "Signs of resonance", value: entry.signal },
            ].map((field) => (
              <section key={field.label}>
                <h4 className="mono-label text-[8.5px] text-[var(--cy)]">
                  {field.label}
                </h4>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">
                  {field.value}
                </p>
              </section>
            ))}

            <div className="rounded-xl border hairline bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-3.5">
              <h4 className="mono-label text-[8px] text-[var(--gd)]">
                Context note
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                This dossier reflects channeled tradition and worldbuilding
                within the Mirror archive. It is offered for reflection and
                wonder — not as established science.
              </p>
            </div>
          </div>

          <div className="border-t hairline px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={askQuestion}
              className="focus-glow flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2.5 text-[11.5px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
            >
              <Sparkles className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
              Ask the Mirror about the {entry.name}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
