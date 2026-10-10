"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import { META_ENTITIES } from "@/lib/data/meta-science";
import { useMirror } from "@/lib/mirror-store";
import { useMetaScience } from "@/lib/meta-science-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ModalShell } from "../ModalShell";

/* ------------------------------------------------------------------ */
/*  THE ENTITY SELECTOR — Meta Science carries no sidebar register:    */
/*  the bar's button opens this selector instead. One press tunes the  */
/*  channel to one mind; CROSS FUSION weaves two or more minds into    */
/*  one fused intelligence that answers at the intersection of their   */
/*  fields. Same glass dialog shell as every register of the house.    */
/* ------------------------------------------------------------------ */

export function EntitySelectorModal() {
  const modal = useMirror((s) => s.modal);
  const openModal = useMirror((s) => s.openModal);
  const closeModal = useMirror((s) => s.closeModal);
  const tuneChannel = useMirror((s) => s.tuneChannel);
  const activeEntity = useMetaScience((s) => s.activeEntity);
  const openEntity = useMetaScience((s) => s.openEntity);
  const closeEntity = useMetaScience((s) => s.closeEntity);
  const fusionMode = useMetaScience((s) => s.fusionMode);
  const fusionKeys = useMetaScience((s) => s.fusionKeys);
  const toggleFusionMode = useMetaScience((s) => s.toggleFusionMode);
  const toggleFusionMember = useMetaScience((s) => s.toggleFusionMember);
  const resetFusion = useMetaScience((s) => s.resetFusion);
  const t = useT();

  const open = modal?.type === "entity-selector";

  /* Leaving the modal abandons an unfinished fusion pick. */
  useEffect(() => {
    if (!open && fusionKeys.length > 0) resetFusion();
  }, [open]);

  const choose = (key: string) => {
    const entity = META_ENTITIES.find((e) => e.key === key);
    if (!entity) return;
    if (fusionMode) {
      toggleFusionMember(key);
      return;
    }
    openEntity(key);
    tuneChannel(`${entity.name} · ${entity.domain}`);
  };

  const applyFusion = () => {
    const picked = fusionKeys
      .map((k) => META_ENTITIES.find((e) => e.key === k))
      .filter((e): e is (typeof META_ENTITIES)[number] => Boolean(e));
    if (picked.length < 2) return;
    closeEntity();
    tuneChannel(picked.map((e) => e.name).join(" × "));
    resetFusion();
    closeModal();
  };

  const untune = () => {
    closeEntity();
    resetFusion();
    tuneChannel(null);
  };

  const fusedNames = fusionKeys
    .map((k) => META_ENTITIES.find((e) => e.key === k)?.name)
    .filter(Boolean)
    .join(" × ");

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => (o ? openModal({ type: "entity-selector" }) : closeModal())}
      title={t("Choose the entity")}
      description={
        fusionMode
          ? t("Select two or more entities, then fuse them into one mind.")
          : t("Twelve minds of the deeper laboratory — choose the one this channel speaks as.")
      }
      widthClass="sm:max-w-[640px]"
    >
      {/* Cross Fusion toggle */}
      <div className="px-5 sm:px-6">
        <button
          type="button"
          onClick={toggleFusionMode}
          data-testid="entity-fusion-toggle"
          aria-pressed={fusionMode}
          className={cn(
            "focus-glow flex h-10 w-full items-center gap-2.5 rounded-xl border px-3.5 text-[13.5px] font-medium transition-all duration-300",
            fusionMode
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={{
            borderColor: fusionMode
              ? "color-mix(in srgb, #d946ef 55%, transparent)"
              : "var(--hairline)",
            background: fusionMode
              ? "color-mix(in srgb, #d946ef 12%, transparent)"
              : "transparent",
          }}
        >
          <Sparkles
            className="size-4 shrink-0"
            aria-hidden="true"
            style={{ color: fusionMode ? "#d946ef" : undefined }}
          />
          <span className="flex-1 text-left">{t("Cross Fusion")}</span>
          {fusionMode && (
            <span
              className="block size-1.5 rotate-45 rounded-[1px]"
              style={{ background: "#d946ef", boxShadow: "0 0 8px #d946ef" }}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* the twelve entities */}
      <div
        className="nice-scroll mt-4 max-h-[52vh] overflow-y-auto px-5 pb-2 sm:px-6"
        data-testid="entity-selector-list"
      >
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {META_ENTITIES.map((entity) => {
            const picked = fusionKeys.includes(entity.key);
            const tuned = !fusionMode && activeEntity === entity.key;
            const active = picked || tuned;
            return (
              <li key={entity.key}>
                <button
                  type="button"
                  onClick={() => choose(entity.key)}
                  data-testid={`entity-card-${entity.key}`}
                  aria-pressed={picked || tuned}
                  className={cn(
                    "focus-glow group relative flex w-full flex-col items-center gap-2 rounded-xl border px-2.5 py-3.5 text-center transition-all duration-300 hover:-translate-y-0.5",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{
                    borderColor: active
                      ? `color-mix(in srgb, ${entity.accent} 55%, transparent)`
                      : "var(--hairline)",
                    background: active
                      ? `color-mix(in srgb, ${entity.accent} 10%, transparent)`
                      : "transparent",
                    boxShadow: active
                      ? `0 0 18px -8px color-mix(in srgb, ${entity.accent} 60%, transparent)`
                      : undefined,
                  }}
                >
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full"
                      style={{ background: entity.accent }}
                      aria-hidden="true"
                    >
                      <Check className="size-2.5 text-white" />
                    </motion.span>
                  )}
                  <span
                    className="relative size-12 overflow-hidden rounded-full border"
                    style={{
                      borderColor: `color-mix(in srgb, ${entity.accent} 40%, transparent)`,
                    }}
                    aria-hidden="true"
                  >
                    <img
                      src={entity.image}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </span>
                  <span className="min-w-0 w-full">
                    <span className="block truncate text-[12.5px] font-semibold tracking-[0.06em]">
                      {entity.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] leading-snug opacity-75">
                      {entity.domain}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* bottom actions — fusion apply / untune */}
      <div className="flex items-center gap-2 px-5 pt-3 pb-5 sm:px-6">
        {fusionMode && fusionKeys.length >= 2 ? (
          <button
            type="button"
            onClick={applyFusion}
            data-testid="entity-fuse-apply"
            className="focus-glow flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white transition-all duration-300 hover:-translate-y-px"
            style={{
              background:
                "linear-gradient(100deg, #d946ef, #22d3ee)",
              boxShadow: "0 8px 24px -10px rgba(217, 70, 239, 0.6)",
            }}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {t("Fuse")} — {fusedNames}
          </button>
        ) : (
          <button
            type="button"
            onClick={untune}
            data-testid="entity-untune"
            className="focus-glow flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border hairline text-[13.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
            {t("The whole laboratory")}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
