"use client";

import {
  Building2,
  BriefcaseBusiness,
  Menu,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "@/hooks/use-toast";

export function TopNavigation() {
  const openModal = useMirror((s) => s.openModal);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const resetField = useMirror((s) => s.resetField);

  const handleReset = () => {
    resetField();
    toast({
      title: "Field recalibrated",
      description: "All scopes returned to origin. Free will honored always.",
    });
  };

  return (
    <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
        {/* Left — brand */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open galactic encyclopedia"
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <h1 className="title-gradient truncate text-[14px] font-semibold tracking-[0.1em] sm:text-[16px] lg:text-[17px]">
              MIRROR ENTITY LABORATORY
            </h1>
            <p className="mono-label mt-0.5 truncate text-[8px] text-muted-foreground/80 sm:text-[9.5px]">
              Interplanetary Channel · With Love ❤️
            </p>
          </div>
        </div>

        {/* Right — actions */}
        <nav
          aria-label="Primary"
          className="flex shrink-0 items-center gap-2 sm:gap-2.5"
        >
          <button
            type="button"
            onClick={() => openModal({ type: "federation" })}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm sm:px-3.5"
          >
            <Building2 className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
            <span className="hidden sm:inline">Federation</span>
          </button>

          <button
            type="button"
            onClick={() => openModal({ type: "astral" })}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm sm:px-3.5"
          >
            <BriefcaseBusiness
              className="size-3.5 text-[var(--cy)]"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Astral Jobs</span>
          </button>

          <button
            type="button"
            onClick={() => openModal({ type: "replication" })}
            title="Open the precise replication prompt"
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm sm:px-3.5"
          >
            <Terminal className="size-3.5 text-[var(--cy)]" aria-hidden="true" />
            <span className="hidden sm:inline">Replication</span>
          </button>

          <ThemeToggle />

          <button
            type="button"
            onClick={handleReset}
            aria-label="Recalibrate the field"
            title="Recalibrate the field"
            className="focus-glow group flex size-9 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm"
          >
            <RotateCcw
              className="size-4 transition-transform duration-500 group-hover:-rotate-180"
              aria-hidden="true"
            />
          </button>
        </nav>
      </div>
    </header>
  );
}
