"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  THE REALM'S LIGHT HAND — the sun/moon that turned the crown now    */
/*  lives indoors (the visitor's own room, beside the purse): one      */
/*  touch turns the realm, deep space ⟷ daylight, the contrast         */
/*  breathing under the finger.                                        */
/*                                                                     */
/*  THE TWO FACES OF THE HAND — the icons are drawn by the theme's     */
/*  own class, never by the client's memory of it: server and client   */
/*  carve the same face, and the water never breaks (no hydration      */
/*  drift).                                                            */
/* ------------------------------------------------------------------ */

export function RealmLightToggle({
  label,
  testId = "realm-light-toggle",
}: {
  label?: string;
  testId?: string;
}) {
  const { setTheme } = useTheme();
  const word = label ?? "Toggle the light";
  return (
    <button
      type="button"
      onClick={() => {
        const root = document.documentElement;
        const dark = root.classList.contains("dark");
        root.classList.add("theme-anim");
        const next = dark ? "light" : "dark";
        setTheme(next);
        /* THE SESSION'S OWN WORD — the choice rides the visit: the
           website's default stays the vanilla daylight at every fresh
           arrival, and the blue crystal waits through this visit only. */
        try {
          window.sessionStorage.setItem("mirror-entity-realm-session", next);
        } catch {
          /* the session's keeping stays closed — the realm's state carries */
        }
        window.setTimeout(() => root.classList.remove("theme-anim"), 560);
      }}
      aria-label={word}
      title={word}
      data-testid={testId}
      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border text-[var(--scope-a,var(--gd))] transition-all duration-300 after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
        backgroundColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, var(--background))",
      }}
    >
      <Sun className="hidden size-3 dark:block" aria-hidden="true" />
      <Moon className="block size-3 dark:hidden" aria-hidden="true" />
    </button>
  );
}
