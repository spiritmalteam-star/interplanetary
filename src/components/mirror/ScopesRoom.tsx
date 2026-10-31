"use client";

import { Fingerprint, Layers } from "lucide-react";
import { useMirror, type LandingScopeKey } from "@/lib/mirror-store";
import { SCOPE_META, SCOPE_ORDER } from "@/lib/mirror/workspaces";
import { CODEX_TABS } from "./CodexTabs";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE SCOPES ROOM — the fields' own workplace's body. The crown's    */
/*  Scopes hand opens the independent scopes window and the fields'    */
/*  subcategories render here: one card per field, the field's own     */
/*  light inside, the chosen one marked. A chosen field dresses the    */
/*  whole chat in its light and the back hand (the window header's     */
/*  arrow) returns to the main landing chat.                           */
/*                                                                     */
/*  THE FIELDS RESTORED (the visitor named the mistake): the Mirror,   */
/*  Interplanetary, Quantum and HealX stand here again, one card       */
/*  each. THE INTERDIMENSIONAL IS DELETED FROM THE SHORE — it lives    */
/*  where it was asked to live: INSIDE the Codex Exobiologica, next    */
/*  to the Hyperspace wing, as its own full category (the shore's     */
/*  codex doors carry the other three registers only).                 */
/* ------------------------------------------------------------------ */

export function ScopesRoom() {
  const t = useT();
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  const closeScopes = useMirror((s) => s.closeScopes);
  const openRegister = useMirror((s) => s.openRegister);

  const pickScope = (key: LandingScopeKey) => {
    /* every field is its own world — the choice dresses the whole chat,
       and the room returns the visitor to the main chat landing wearing
       the field's light */
    setLandingScope(key);
    closeScopes();
  };

  /* the codex doors minus the Interdimensional — the subtle orders'
     register stands inside the codex itself now, next to Hyperspace */
  const shoreDoors = CODEX_TABS.filter((d) => d.kind !== "interdim");

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

        {/* THE FIELDS — one card each, the field's own light worn inside.
            Every family wears its own card; nothing else stands here. */}
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

        {/* THE CODEX — the atlas' own registers: three doors stand at
            the scopes' shore (the Interdimensional is NOT among them —
            it lives inside the codex, next to the Hyperspace wing, as
            its own full category), and one touch opens the codex at
            that category. */}
        <div className="mt-7" data-testid="scopes-codex-doors">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "color-mix(in srgb, var(--gd) 10%, transparent)",
                boxShadow:
                  "inset 0 0 0 1px color-mix(in srgb, var(--gd) 30%, transparent)",
              }}
            >
              <Fingerprint className="size-4 text-[var(--gd)]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-[16px] font-semibold text-foreground">
                {t("The Codex")}
              </h2>
              <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
                {t(
                  "The atlas' own registers — the Interdimensional lives inside, beside Hyperspace"
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {shoreDoors.map((door) => (
              <button
                key={door.kind}
                type="button"
                onClick={() => openRegister(door.kind)}
                data-testid={`scopes-codex-door-${door.kind}`}
                title={t("Open the codex at this register")}
                className="focus-glow group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 20%, var(--hairline))",
                  background: "var(--glass-bg-soft, transparent)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      "color-mix(in srgb, var(--gd) 12%, transparent)",
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in srgb, var(--gd) 35%, transparent)",
                  }}
                >
                  <Fingerprint
                    className="size-3.5 text-[var(--gd)] transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-foreground">
                    {t(door.label)}
                  </span>
                  <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t("Open the codex at this register")}
                  </span>
                </span>
                <span className="mono-label shrink-0 tabular-nums text-[9.5px] text-muted-foreground/70">
                  {door.count}
                </span>
              </button>
            ))}
          </div>
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
