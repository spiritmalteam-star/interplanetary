"use client";

import { BookOpen, Hammer, Layers, Music, ScrollText, Sparkles } from "lucide-react";
import { useMirror, type LandingScopeKey, type ToolTabKey } from "@/lib/mirror-store";
import { SCOPE_META, SCOPE_ORDER } from "@/lib/mirror/workspaces";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE SCOPES ROOM — the fields' own workplace. The crown's Scopes    */
/*  hand opens this room instead of a dropdown: the five fields stand  */
/*  as full cards, and the five makers ride beside them, so the        */
/*  visitor jumps between the tools (InDream) and the scopes with one  */
/*  touch. A chosen field dresses the whole chat in its light and the  */
/*  workplace lays itself down — the main chat landing stands again.   */
/* ------------------------------------------------------------------ */

/* THE FIVE MAKERS — the same shelf the InDream workplace carries, so
   book maker, akashic, music, invent and manifest are reachable from
   inside the scopes room too (the jump works in both directions). */
const MAKERS: {
  key: ToolTabKey;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { key: "dreambook", label: "Book", icon: BookOpen },
  { key: "lightcodes", label: "Music", icon: Music },
  { key: "akashic", label: "Akashic", icon: ScrollText },
  { key: "mirroros", label: "Manifest", icon: Sparkles },
  { key: "invent", label: "Invent", icon: Hammer },
];

export function ScopesRoom() {
  const t = useT();
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  const openToolTab = useMirror((s) => s.openToolTab);
  const closeWorkspace = useMirror((s) => s.closeWorkspace);

  const pickScope = (key: LandingScopeKey) => {
    /* every field is its own world — the choice dresses the whole chat,
       and the room returns the visitor to the main chat landing wearing
       the field's light */
    setLandingScope(key);
    closeWorkspace();
  };

  return (
    <div
      className="nice-scroll h-full overflow-y-auto overscroll-contain"
      data-testid="scopes-room"
    >
      <div className="mx-auto w-full max-w-[720px] px-4 pb-10 pt-4 sm:px-6">
        {/* the room's own quiet head */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, transparent)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
            }}
          >
            <Layers className="size-4 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-[16px] font-semibold text-foreground">
              {t("Scopes")}
            </h2>
            <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("The field the chat wears")}
            </p>
          </div>
        </div>

        {/* THE FIELDS — one card each, the field's own light worn inside */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SCOPE_ORDER.map((key) => {
            const s = SCOPE_META[key];
            const focused = landingScope === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => pickScope(key)}
                aria-pressed={focused}
                title={t(s.spirit)}
                data-testid={`scopes-room-field-${key}`}
                className="focus-glow group relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300"
                style={
                  focused
                    ? {
                        background: `color-mix(in srgb, ${s.accent} 10%, transparent)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${s.accent} 45%, transparent)`,
                      }
                    : {
                        borderColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 20%, var(--hairline))",
                        background: "var(--glass-bg-soft, transparent)",
                      }
                }
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${s.accent} 16%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${s.accent} 45%, transparent)`,
                  }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: s.accent,
                      boxShadow: `0 0 8px 0 color-mix(in srgb, ${s.accent} 75%, transparent)`,
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-foreground">
                    {t(s.label)}
                  </span>
                  <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t(s.spirit)}
                  </span>
                </span>
                {focused && (
                  <span
                    className="mono-label shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.14em]"
                    style={{
                      color: s.accent,
                      borderColor: `color-mix(in srgb, ${s.accent} 40%, transparent)`,
                      background: `color-mix(in srgb, ${s.accent} 9%, transparent)`,
                    }}
                  >
                    {t("Here")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* THE MAKERS — the InDream shelf, one touch away: book maker,
            akashic, music, invent and manifest jump straight into their
            rooms (the workplace turns the page; the scopes room remains
            a standing tab of the same window) */}
        <p className="mono-label mt-6 px-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
          {t("The makers")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MAKERS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => openToolTab(m.key)}
                data-testid={`scopes-room-maker-${m.key}`}
                className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] text-muted-foreground transition-colors duration-300 hover:text-foreground"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 24%, transparent)",
                  background: "var(--glass-bg-soft, transparent)",
                }}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {t(m.label)}
              </button>
            );
          })}
        </div>

        {/* the honest word — the back hand of the workplace header lays
            the whole room down and the main chat landing stands again */}
        <p className="mt-8 text-center text-[11.5px] leading-relaxed text-muted-foreground/60">
          {t(
            "Choose a field and the chat wears its light — the arrow at the top returns to the chat."
          )}
        </p>
      </div>
    </div>
  );
}
