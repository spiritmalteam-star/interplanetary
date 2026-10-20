import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* THE HOUSE BUTTON — the shadcn contract kept (variants, sizes, asChild,
   buttonVariants() string consumers), wearing the control dialect: the
   solid primary for the everyday hand, the scope-aware crystal CTA for
   the house's invitations, glass outline/secondaries, spring press,
   once-per-hover sheen. Old-school flat greys retire. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "btn-solid",
        primary:
          "btn-primary focus-visible:ring-[color-mix(in_srgb,var(--scope-a,var(--gd))_45%,transparent)]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 active:scale-[0.97] focus-visible:ring-destructive/30 dark:bg-destructive/70",
        outline:
          "border hairline bg-[var(--glass-bg-soft)] hover:border-[var(--hairline-hover)] hover:glow-sm hover:bg-[color-mix(in_srgb,var(--foreground)_4%,var(--glass-bg-soft))]",
        secondary:
          "border hairline bg-[var(--glass-bg-strong)] text-foreground hover:border-[var(--hairline-hover)] hover:glow-sm",
        ghost:
          "hover:bg-foreground/5 hover:text-foreground dark:hover:bg-foreground/8",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-11 px-7 text-[15px] has-[>svg]:px-5",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
