"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  MIRROR GLASS — the compact primitives (directive §5).              */
/*                                                                     */
/*  Reusable liquid-glass controls wearing the shared --mg-* tokens    */
/*  and the mg- material classes (see globals.css): milky translucent  */
/*  depth, a conic silver rim, one restrained light sweep, inset       */
/*  shadows and a tactile press. Compact sizes only — the house has    */
/*  no room for oversized controls. Nothing existing is retrofitted    */
/*  by these primitives; they stand ready for the surfaces that        */
/*  claim them (main chat, scopes' tools, future rooms).               */
/*                                                                     */
/*  THE LAWS: readable contrast in both skies (milky vanilla and       */
/*  crystal night), a solid fallback where blur is absent, reduced     */
/*  motion rests the sweep and the press, and every control is a       */
/*  real accessible element (button/input/textarea) — never a styled   */
/*  div wearing a costume.                                             */
/* ------------------------------------------------------------------ */

/* ------------------------- the glass button ------------------------ */

const glassButtonVariants = cva(
  cn(
    "mg-material mg-sweepable mg-press mg-focusable",
    "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden",
    "rounded-full font-medium text-[var(--mg-ink)]",
    "disabled:pointer-events-none disabled:opacity-50"
  ),
  {
    variants: {
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-10 px-5 text-sm",
        lg: "h-11 px-6 text-[15px]",
        icon: "size-9 p-0",
      },
      tone: {
        /* the quiet default — the material alone speaks */
        neutral: "",
        /* the warm emphasis — gold ink inside, for the primary hand */
        gold: "border-[color-mix(in_srgb,var(--gd)_45%,transparent)] text-[color-mix(in_srgb,var(--gd)_75%,var(--mg-ink))]",
        /* the danger hand — destructive ink, still restrained */
        danger:
          "border-[color-mix(in_srgb,var(--destructive)_45%,transparent)] text-[color-mix(in_srgb,var(--destructive)_80%,var(--mg-ink))]",
      },
    },
    defaultVariants: { size: "default", tone: "neutral" },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, size, tone, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(glassButtonVariants({ size, tone }), className)}
      {...props}
    />
  )
);
GlassButton.displayName = "GlassButton";

/* ------------------------- the glass input ------------------------- */

const glassFieldBase =
  "mg-material mg-focusable w-full rounded-2xl bg-transparent text-[15px] text-[var(--mg-ink)] placeholder:text-[var(--mg-ink-faint)] transition-colors duration-300 focus-visible:outline-none";

export const GlassInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(glassFieldBase, "h-11 px-4", className)} {...props} />
));
GlassInput.displayName = "GlassInput";

export const GlassTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(glassFieldBase, "min-h-24 resize-none px-4 py-3 leading-relaxed", className)}
    {...props}
  />
));
GlassTextarea.displayName = "GlassTextarea";

/* ------------------------- the glass card -------------------------- */

export function GlassCard({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "mg-material rounded-3xl",
        interactive && "mg-sweepable mg-press mg-focusable cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------ the glass tabs --------------------------- */
/*  A compact segmented navigation: one material rail, the chosen      */
/*  segment rises on a stronger veil. Real buttons, roving tabindex    */
/*  handled by the consumer's own keyboard law.                        */

export function GlassTabs({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "mg-material inline-flex items-center gap-1 rounded-full p-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassTab({
  className,
  selected,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected || undefined}
      className={cn(
        "mg-focusable relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300",
        selected
          ? "bg-[var(--mg-surface-strong)] text-[var(--mg-ink)] shadow-[inset_0_1px_0_var(--mg-edge),0_4px_14px_-10px_var(--mg-drop)]"
          : "text-[var(--mg-ink-soft)] hover:text-[var(--mg-ink)]",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------ the glass panel -------------------------- */
/*  The dialog/menu/popover surface: one shared material, compact      */
/*  radius, ready for Radix content wrappers to wear.                  */

export function GlassPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mg-material overflow-hidden rounded-3xl text-[var(--mg-ink)]",
        className
      )}
      {...props}
    />
  );
}
