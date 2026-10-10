"use client";

/* ------------------------------------------------------------------ */
/*  THE WORLDS' DOORS — the whole sidebar, one touch away, living      */
/*  inside the main chat. A quiet row of golden sigils beneath the     */
/*  thread: every world of the laboratory opens from the very place    */
/*  the visitor is already speaking, without hunting for the rail.     */
/* ------------------------------------------------------------------ */

import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { WorldSigil, type WorldSigilKey } from "./WorldSigils";

export function WorldDoors() {
  const t = useT();
  const openMirrorOS = useMirror((s) => s.openMirrorOS);
  const openAkashic = useMirror((s) => s.openAkashic);
  const openInvent = useMirror((s) => s.openInvent);
  const openDreamBook = useMirror((s) => s.openDreamBook);
  const openLightCodes = useMirror((s) => s.openLightCodes);
  const openParticleX = useMirror((s) => s.openParticleX);
  const openEvolveMed = useMirror((s) => s.openEvolveMed);
  const openModal = useMirror((s) => s.openModal);

  const doors: {
    key: string;
    label: string;
    aria: string;
    sigil: WorldSigilKey;
    action: () => void;
    testId: string;
  }[] = [
    {
      key: "mirroros",
      label: t("Manifest"),
      aria: t("Open the Mirror OS — Reality Guidance"),
      sigil: "mirroros",
      action: openMirrorOS,
      testId: "door-mirroros",
    },
    {
      key: "akashic",
      label: t("Akashic"),
      aria: t("Open the Akashic Library — records of the ancient one"),
      sigil: "akashic",
      action: openAkashic,
      testId: "door-akashic",
    },
    {
      key: "starplay",
      label: t("Star Play"),
      aria: t("Open Star Play — the Mirror's arcana deck"),
      sigil: "starplay",
      action: () => openModal({ type: "starplay" }),
      testId: "door-starplay",
    },
    {
      key: "invent",
      label: t("Invent"),
      aria: t("Open Invent — the Forge, the invention workshop of the Mirror"),
      sigil: "invent",
      action: openInvent,
      testId: "door-invent",
    },
    {
      key: "dreambook",
      label: t("Dream Book"),
      aria: t("Open the Dream Book — tales woven from resonance"),
      sigil: "dreambook",
      action: openDreamBook,
      testId: "door-dreambook",
    },
    {
      key: "lightcodes",
      label: t("Light Codes"),
      aria: t("Open Light Codes — sound transmissions through Mirror Entity"),
      sigil: "lightcodes",
      action: openLightCodes,
      testId: "door-lightcodes",
    },
    {
      key: "particlex",
      label: t("ParticleX"),
      aria: t("Open ParticleX — the quantum narrator of the laboratory"),
      sigil: "particlex",
      action: openParticleX,
      testId: "door-particlex",
    },
    {
      key: "evolvemed",
      label: t("Evolve Med"),
      aria: t(
        "Open Evolve Med — the evolutionary medical nexus of the laboratory"
      ),
      sigil: "evolvemed",
      action: openEvolveMed,
      testId: "door-evolvemed",
    },
  ];

  return (
    <nav
      aria-label={t("The worlds' doors")}
      data-testid="world-doors"
      className="nice-scroll mb-1.5 flex items-center gap-1.5 overflow-x-auto pb-1"
    >
      <span
        className="mono-label shrink-0 select-none pl-1 pr-0.5 text-[8.5px] uppercase tracking-[0.24em] text-muted-foreground/55"
        aria-hidden="true"
      >
        {t("Worlds")}
      </span>
      {doors.map((d) => (
        <button
          key={d.key}
          type="button"
          onClick={d.action}
          aria-label={d.aria}
          title={d.aria}
          data-testid={d.testId}
          className="group flex shrink-0 items-center gap-1.5 rounded-full border hairline bg-[var(--glass-bg)] py-1 pl-1.5 pr-2.5 shadow-[0_2px_14px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:shadow-[0_6px_20px_-10px_rgba(0,0,0,0.55)]"
        >
          <span className="flex size-6 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <WorldSigil world={d.sigil} />
          </span>
          <span className="text-[12px] leading-none text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
            {d.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
