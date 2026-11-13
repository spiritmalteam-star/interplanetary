"use client";

import { ArrowRight, Feather, Handshake, ShieldCheck, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  type EvidenceLevel,
  EVIDENCE_LABEL,
  EVIDENCE_LEVELS,
  EvidenceChip,
  GP_CARD,
  RoomLabel,
} from "./shared";

/* ------------------------------------------------------------------ */
/*  GUIDELINES — the trust the gathering runs on, written plainly and  */
/*  kept honestly. The loop, the evidence ladder, what the gathering   */
/*  is, how care is practiced here, and the one law above all.         */
/*  Static: every word below is a promise, not a fetch.                */
/* ------------------------------------------------------------------ */

const LOOP_WORDS = [
  "Explore",
  "Share",
  "Connect",
  "Discuss",
  "Test",
  "Learn",
  "Refine",
  "Explore again",
];

const EVIDENCE_SENTENCE: Record<EvidenceLevel, string> = {
  established: "Held up by independent, replicated evidence.",
  preliminary: "Suggestive results — replication still pending.",
  hypothesis: "A proposed explanation, open to test.",
  personal: "One person's lived experience — real, and not general.",
  philosophical: "An interpretation of meaning, not a measured fact.",
  creative: "Speculation and imagination — welcome, and labeled.",
  disputed: "Voices disagree — read the tension, not a verdict.",
};

const WHAT_ROWS: Array<{ icon: LucideIcon; text: string }> = [
  {
    icon: Feather,
    text: "People share what they discover through Mirror Entity — reviewed and edited before it is published.",
  },
  {
    icon: Handshake,
    text: "No fabricated members, comments or activity — every presence is a real one.",
  },
  {
    icon: ShieldCheck,
    text: "M.E. assists and suggests — it never ranks people, never claims enlightenment levels, never posts without a human hand.",
  },
  {
    icon: Feather,
    text: "AI-generated works carry their source with them — attribution stays with the maker.",
  },
];

const SAFETY_ROWS: string[] = [
  "Reporting — the report hand sits on every offering, echo and message; the moderation queue reads them.",
  "Blocking — quiet walls; blocked presences cannot reach you.",
  "Spam and flood gates — gentle limits, not shadows.",
  "Dangerous experiments — the Laboratory's safety review refuses harmful procedures.",
  "Appeals — a report can be answered; writes reach the team.",
];

export default function GuidelinesSection({ active = true }: { active?: boolean }) {
  const t = useT();
  void active;

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain pb-24">
      <div className="mx-auto max-w-[860px] px-4 pt-4 sm:px-6 sm:pt-6">
        <RoomLabel>{t("the gathering · guidelines")}</RoomLabel>
        <h2 className="mt-1.5 font-[family-name:var(--font-cinzel)] text-[20px] font-semibold text-[#3d3428]">
          {t("How the Gathering Holds")}
        </h2>
        <p className="mt-2 max-w-[640px] font-[family-name:var(--font-literata)] text-[13px] italic leading-[1.8] text-[#8a7c64]">
          {t("The trust this place runs on — written plainly, kept honestly.")}
        </p>

        {/* ---------- the loop ---------- */}
        <div className={cn(GP_CARD, "mt-5 p-6")}>
          <RoomLabel>{t("The loop")}</RoomLabel>
          <div className="mt-3 flex flex-wrap items-center gap-y-2" data-testid="gath-guidelines-loop">
            {LOOP_WORDS.map((word, i) => (
              <span key={word} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors duration-300",
                    i === LOOP_WORDS.length - 1
                      ? "border-[#cbb98d] bg-white text-[#8a6f46]"
                      : "border-[#e4d9bd] bg-white/55 text-[#5c5344]"
                  )}
                >
                  {t(word)}
                </span>
                {i < LOOP_WORDS.length - 1 && (
                  <ArrowRight className="size-3 shrink-0 text-[#a2947c]" aria-hidden="true" />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ---------- the evidence ladder ---------- */}
        <div className={cn(GP_CARD, "mt-4 p-6")}>
          <RoomLabel>{t("The evidence ladder")}</RoomLabel>
          <div className="mt-3 flex flex-col gap-2.5">
            {EVIDENCE_LEVELS.map((level) => (
              <div
                key={level}
                className="flex items-start gap-3"
                aria-label={t(EVIDENCE_LABEL[level])}
              >
                <span className="mt-0.5 w-[168px] shrink-0">
                  <EvidenceChip level={level} />
                </span>
                <p className="min-w-0 flex-1 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.7] text-[#5c5344]">
                  {t(EVIDENCE_SENTENCE[level])}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3.5 font-[family-name:var(--font-literata)] text-[12px] italic text-[#8a7c64]">
            {t("Nothing here is called verified because people agreed with it.")}
          </p>
        </div>

        {/* ---------- what the gathering is ---------- */}
        <div className={cn(GP_CARD, "mt-4 p-6")}>
          <RoomLabel>{t("What the gathering is")}</RoomLabel>
          <ul className="mt-3 flex flex-col gap-2.5">
            {WHAT_ROWS.map((row) => (
              <li key={row.text} className="flex items-start gap-2.5">
                <row.icon
                  className="mt-0.5 size-4 shrink-0 text-[#8a6f46]"
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.7] text-[#5c5344]">
                  {t(row.text)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- safety and care ---------- */}
        <div className={cn(GP_CARD, "mt-4 p-6")}>
          <RoomLabel>{t("Safety and care")}</RoomLabel>
          <ul className="mt-3 flex flex-col gap-2.5">
            {SAFETY_ROWS.map((row) => (
              <li key={row} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#cbb98d]" />
                <p className="min-w-0 flex-1 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.7] text-[#5c5344]">
                  {t(row)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- the one law above all ---------- */}
        <p className="mx-auto mt-7 max-w-[560px] text-center font-[family-name:var(--font-literata)] text-[14px] italic leading-[1.85] text-[#5c5344]">
          {t(
            "An idea shared today can become a meaningful collaboration tomorrow. Nothing here is worth a trust broken."
          )}
        </p>
      </div>
    </div>
  );
}
