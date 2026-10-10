"use client";

import { motion } from "framer-motion";
import { META_ENTITIES, getMetaEntity } from "@/lib/data/meta-science";
import { useMetaScience } from "@/lib/meta-science-store";
import { useT } from "@/lib/i18n";
import { EntityPod, HOW_STEPS, hexToRgb } from "../meta/MsHub";
import { MsDetail } from "../meta/MsDetail";
import { MsParticles } from "../meta/MsParticles";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the deeper laboratory as a scope. The same world    */
/*  (forced-dark holographic identity, ms-* classes are global) now    */
/*  lives INSIDE the one shared house: the shell paints the lab's      */
/*  dark holographic light behind the whole content column, the nav,   */
/*  sidebar and composer keep standing, and this scope contributes     */
/*  its content — no boot screen, no boxed panel, no page of its own.  */
/* ------------------------------------------------------------------ */

export function MetaScienceScope() {
  const t = useT();
  const activeEntity = useMetaScience((s) => s.activeEntity);
  const openEntity = useMetaScience((s) => s.openEntity);
  const closeEntity = useMetaScience((s) => s.closeEntity);

  const entity = activeEntity ? getMetaEntity(activeEntity) : null;

  return (
    <div className="relative overflow-hidden" data-testid="metascience-scope">
      {entity ? (
        <motion.div
          key={`entity-${entity.key}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <MsDetail entity={entity} onBack={closeEntity} />
        </motion.div>
      ) : (
        <motion.div
          key="hub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* ---------- decorative layers ---------- */}
          <div className="ms-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
          <MsParticles accentRgb="120, 200, 255" density={60} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 top-4 size-56 rounded-full bg-cyan-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 top-24 size-64 rounded-full bg-fuchsia-500/10 blur-3xl"
          />

          {/* ---------- hero ---------- */}
          <section className="relative px-4 pb-8 pt-8 text-center sm:px-6">
            <span className="ms-glass-soft ms-font-display inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[9.5px] uppercase tracking-[0.2em] text-white/60">
              <span className="ms-pulse inline-block size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              {t("Mirror Entity Network · 12 channels online")}
            </span>

            <h2
              className="ms-font-display mx-auto mt-4 bg-clip-text text-3xl font-bold tracking-[0.08em] text-transparent sm:text-5xl"
              style={{
                backgroundImage: "linear-gradient(100deg, #22d3ee, #d946ef 48%, #10b981)",
              }}
              data-testid="ms-scope-title"
            >
              NEXUS DISCOVERY LAB
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-[13px] text-white/60">
              {t(
                "Twelve specialized mirror intelligences guide humanity's path of discovery across twelve frontiers — each with its own experiments, landmark case studies, working tools and a direct channel to its mind."
              )}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {[
                t("12 mirror entities"),
                t("36 experiments"),
                t("36 case studies"),
                t("36 tools"),
                t("live AI channel"),
              ].map((chip) => (
                <span
                  key={chip}
                  className="ms-glass-soft ms-font-display rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/65"
                >
                  {chip}
                </span>
              ))}
            </div>
          </section>

          {/* ---------- entity grid ---------- */}
          <div className="relative grid grid-cols-1 gap-4 px-4 pb-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            {META_ENTITIES.map((e, i) => (
              <EntityPod key={e.key} entity={e} index={i} onEngage={openEntity} />
            ))}
          </div>

          {/* ---------- how the lab works ---------- */}
          <section className="relative border-t border-white/8 px-4 py-8 sm:px-6">
            <h3 className="ms-font-display text-center text-lg font-bold uppercase tracking-[0.14em] text-white/90">
              {t("How the Lab Works")}
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {HOW_STEPS.map((step) => (
                <div
                  key={step.n}
                  className="ms-holo ms-glass relative overflow-hidden rounded-xl p-4"
                  style={{ "--ms-rgb": hexToRgb(step.color) } as React.CSSProperties}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-5 -top-5 size-20 rounded-full blur-2xl"
                    style={{ background: `${step.color}22` }}
                  />
                  <span className="ms-font-display text-xl font-bold" style={{ color: step.color }}>
                    {step.n}
                  </span>
                  <h4 className="mt-2 text-[13.5px] font-semibold text-white/90">
                    {t(step.key)}
                  </h4>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/55">
                    {t(step.body)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
