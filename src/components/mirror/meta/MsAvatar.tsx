"use client";

import { motion } from "framer-motion";
import type { MsEntity } from "@/lib/data/meta-science";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the holographic avatar. Rotating conic rings, a     */
/*  counter-turning dashed ring, a glass body with the entity's glow,  */
/*  the portrait and the glyph hovering inside.                        */
/* ------------------------------------------------------------------ */

const SIZES = {
  sm: { box: "size-16", glyph: "text-lg" },
  md: { box: "size-28", glyph: "text-2xl" },
  lg: { box: "size-44", glyph: "text-4xl" },
  xl: { box: "h-72 w-56", glyph: "text-5xl" },
} as const;

export function MsAvatar({
  entity,
  size = "md",
  active = true,
}: {
  entity: MsEntity;
  size?: keyof typeof SIZES;
  active?: boolean;
}) {
  const s = SIZES[size];
  const style = {
    "--ms-accent": entity.accent,
    "--ms-rgb": entity.accentRgb,
  } as React.CSSProperties;

  return (
    <div
      className={cn("relative shrink-0", s.box)}
      style={style}
      data-testid={`ms-avatar-${entity.key}`}
    >
      {/* outer conic ring */}
      <div
        aria-hidden="true"
        className="ms-spin-slow absolute -inset-2 rounded-full opacity-70"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${entity.accent} 80deg, transparent 160deg, ${entity.accent} 240deg, transparent 320deg)`,
          WebkitMask:
            "radial-gradient(circle, transparent 59%, black 62%, black 100%)",
          mask: "radial-gradient(circle, transparent 59%, black 62%, black 100%)",
        }}
      />
      {/* counter dashed ring */}
      <div
        aria-hidden="true"
        className="ms-spin-slower absolute -inset-1 rounded-full opacity-50"
        style={{
          border: `1px dashed ${entity.accent}`,
        }}
      />
      {/* body */}
      <motion.div
        animate={active ? { y: [0, -4, 0] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="ms-glow relative h-full w-full overflow-hidden rounded-2xl ms-glass"
      >
        {size === "xl" ? (
          <>
            <img
              src={entity.image}
              alt={t_alt(entity)}
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-90"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/3"
              style={{
                background: `linear-gradient(180deg, transparent, ${entity.accentSoft})`,
              }}
            />
            {/* scan line */}
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
              <div
                className="ms-scan absolute inset-x-0 h-12"
                style={{
                  background: `linear-gradient(180deg, transparent, ${entity.accent}55, transparent)`,
                }}
              />
            </div>
            <span
              aria-hidden="true"
              className={cn(
                "ms-font-display ms-text-glow absolute left-3 top-3 font-bold",
                s.glyph
              )}
              style={{ color: entity.accent }}
            >
              {entity.glyph}
            </span>
          </>
        ) : (
          <>
            <img
              src={entity.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-55"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 42%, ${entity.accentSoft}, rgba(5,5,16,0.55) 75%)`,
              }}
            />
            <span
              aria-hidden="true"
              className={cn(
                "ms-font-display ms-text-glow ms-flicker absolute inset-0 flex items-center justify-center font-bold",
                s.glyph
              )}
              style={{ color: entity.accent }}
            >
              {entity.glyph}
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
}

function t_alt(entity: MsEntity): string {
  return `Holographic portrait of ${entity.name}, the ${entity.domain} mirror entity`;
}
