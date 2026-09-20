"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ModalShell — shared glassmorphic dialog shell.
 * Centered, backdrop-blurred, fade+scale entrance, ESC/backdrop close,
 * body scroll lock (Radix), near-fullscreen sheet on mobile.
 */
export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  widthClass = "sm:max-w-[580px]",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  widthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "glass-strong top-[50%] gap-0 overflow-hidden rounded-2xl border hairline p-0 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] duration-300",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          // Mobile: full-screen sheet
          "max-md:inset-x-0 max-md:top-0 max-md:h-dvh max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0",
          widthClass
        )}
      >
        <div className="pr-12 pl-5 pt-5 pb-4 sm:pl-6">
          <DialogTitle className="text-[16px] font-semibold leading-snug tracking-[0.01em] text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
