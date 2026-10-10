/* ------------------------------------------------------------------ */
/*  THE THREE SCOPES OF THE ONE HOUSE                                  */
/*  Interplanetary · Meta Science · Heal Evolution all live in the     */
/*  same frame (nav · sidebar · content · composer). Each scope only   */
/*  changes the light of the house: its accent color, its bar          */
/*  elements, its sidebar register and the spirit of the shared chat.  */
/* ------------------------------------------------------------------ */

import type { Mode } from "@/lib/mirror-types";

export type ScopeId = "interplanetary" | "metascience" | "healevolution";

export interface ScopeTheme {
  id: ScopeId;
  /** The accent color of this scope's light (CSS color value). */
  accent: string;
  /** Scope name (kept in English across languages, like the archive). */
  label: string;
  /** i18n key of the subtitle shown in the top bar. */
  subtitleKey: string;
  /** Which glyph the scope wears in the bar. */
  icon: "globe" | "flask" | "activity";
  /** The scope-world background painted behind the shared content
      column while this scope is active (null → the calm observatory). */
  world: string | null;
}

export const SCOPE_THEMES: Record<ScopeId, ScopeTheme> = {
  interplanetary: {
    id: "interplanetary",
    accent: "var(--cy)",
    label: "Interplanetary",
    subtitleKey: "Interplanetary Channel · With Love ❤️",
    icon: "globe",
    world: null,
  },
  metascience: {
    id: "metascience",
    accent: "#d946ef",
    label: "Meta Science",
    subtitleKey: "Meta Science · The Deeper Laboratory",
    icon: "flask",
    world:
      "radial-gradient(ellipse at 20% 0%, rgba(34, 211, 238, 0.10), transparent 50%)," +
      "radial-gradient(ellipse at 80% 10%, rgba(217, 70, 239, 0.10), transparent 50%)," +
      "radial-gradient(ellipse at 50% 100%, rgba(16, 185, 129, 0.08), transparent 50%)," +
      "linear-gradient(180deg, #050510 0%, #0a0a1f 60%, #050510 100%)",
  },
  healevolution: {
    id: "healevolution",
    accent: "#34d399",
    label: "Heal Evolution",
    subtitleKey: "Heal Evolution · The Evolution Laboratory",
    icon: "activity",
    world:
      "radial-gradient(ellipse at 18% 0%, rgba(16, 185, 129, 0.10), transparent 52%)," +
      "radial-gradient(ellipse at 82% 8%, rgba(14, 165, 233, 0.09), transparent 52%)," +
      "radial-gradient(ellipse at 50% 100%, rgba(168, 85, 247, 0.07), transparent 55%)," +
      "linear-gradient(180deg, #060b16 0%, #0a1428 55%, #060b16 100%)",
  },
};

/** The metaphysics / quantum / healing veil channels are voices of the
    interplanetary commons — they wear the house's original light. */
export function scopeThemeFor(mode: Mode): ScopeTheme {
  if (mode === "metascience") return SCOPE_THEMES.metascience;
  if (mode === "healevolution") return SCOPE_THEMES.healevolution;
  return SCOPE_THEMES.interplanetary;
}
