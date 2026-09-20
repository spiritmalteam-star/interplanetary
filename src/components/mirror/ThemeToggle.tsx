"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-anim");
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-anim"), 560);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle between deep space and daylight laboratory"
      title="Toggle theme"
      className="focus-glow group flex size-9 items-center justify-center rounded-full border hairline bg-transparent text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm"
    >
      {/* CSS-driven swap avoids hydration mismatch and effect state */}
      <Sun
        className="hidden size-4 transition-transform duration-500 group-hover:rotate-45 dark:block"
        aria-hidden="true"
      />
      <Moon
        className="size-4 transition-transform duration-500 group-hover:-rotate-12 dark:hidden"
        aria-hidden="true"
      />
    </button>
  );
}
