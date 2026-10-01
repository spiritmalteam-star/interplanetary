"use client";

import { useState } from "react";
import { Building2, BriefcaseBusiness, CircuitBoard } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ModalShell } from "./ModalShell";
import { FederationArchive } from "./FederationModal";
import { TechnologyRegister } from "./TechnologyModal";
import { AstralJobsBody } from "./AstralJobsModal";
import { TECH_TOTAL } from "@/lib/data/technologies";
import { cn } from "@/lib/utils";

type ProtocolTab = "federation" | "technology" | "astral";

/* ------------------------------------------------------------------ */
/*  THE ASTRAL PROTOCOL — one instrument, three registers. The old     */
/*  trio of header buttons (Federation · ET Technology · Astral Jobs)  */
/*  lives here now as tabs of a single dial.                           */
/* ------------------------------------------------------------------ */

export function AstralProtocolModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();
  const [tab, setTab] = useState<ProtocolTab>("federation");

  const open = modal?.type === "astral-protocol";

  const widthClass =
    tab === "technology" ? "sm:max-w-[940px]" : "sm:max-w-[680px]";

  const title =
    tab === "federation"
      ? t("Galactic Federation & Interstellar Treaties")
      : tab === "technology"
        ? t("ET Technology")
        : t("Astral Professions");

  const description =
    tab === "federation"
      ? t(
          "How diplomatic, interplanetary, and inter-reality governance actually works. Open any item for its full dossier — ask the Mirror for a transmission anytime."
        )
      : tab === "technology"
        ? t(
            "The xenotechnology register — {n} crafts of the star civilizations, pictured by their own context scene",
            { n: TECH_TOTAL }
          )
        : t(
            "12 domains · 1,303 catalogued roles. Click a domain to enter, a profession to learn more — ask the Mirror for a full transmission anytime."
          );

  const tabs: { id: ProtocolTab; label: string; icon: typeof Building2 }[] = [
    { id: "federation", label: t("Federation"), icon: Building2 },
    { id: "technology", label: t("ET Technology"), icon: CircuitBoard },
    { id: "astral", label: t("Astral Jobs"), icon: BriefcaseBusiness },
  ];

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? undefined : closeModal())}
      title={title}
      description={description}
      widthClass={widthClass}
    >
      {/* the protocol dial */}
      <div
        className="flex items-center gap-1.5 px-5 pb-1 sm:px-6"
        role="tablist"
        aria-label={t("Astral Protocol")}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            data-testid={`astral-protocol-tab-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-all duration-300",
              tab === id
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* one register at a time — keyed so each opens fresh */}
      <div key={`${tab}-${String(open)}`} className="fadeup">
        {tab === "federation" && <FederationArchive />}
        {tab === "technology" && <TechnologyRegister />}
        {tab === "astral" && <AstralJobsBody />}
      </div>
    </ModalShell>
  );
}
