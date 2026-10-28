"use client";

import { Atom, HeartPulse, Layers, Sparkles } from "lucide-react";
import { useMirror, type LandingScopeKey } from "@/lib/mirror-store";
import { SCOPE_META, SCOPE_ORDER } from "@/lib/mirror/workspaces";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE SCOPES ROOM — the fields' own workplace's body. The crown's    */
/*  Scopes hand opens the independent scopes window and the fields'    */
/*  subcategories render here: one card per field, the field's own     */
/*  light inside, the chosen one marked. A chosen field dresses the    */
/*  whole chat in its light and the back hand (the window header's     */
/*  arrow) returns to the main landing chat.                           */
/*                                                                     */
/*  THE ROOMS' OWN SHORE — the deep rooms rest here alone now: the     */
/*  Manifest, the Quantum and the HealX keep their own cards and open  */
/*  their rooms in one touch (their marks left the crown and the       */
/*  InDream rail — the visitor named the scopes as their home).        */
/* ------------------------------------------------------------------ */

export function ScopesRoom() {
  const t = useT();
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  const closeScopes = useMirror((s) => s.closeScopes);
  const openToolTab = useMirror((s) => s.openToolTab);

  const pickScope = (key: LandingScopeKey) => {
    /* every field is its own world — the choice dresses the whole chat,
       and the room returns the visitor to the main chat landing wearing
       the field's light */
    setLandingScope(key);
    closeScopes();
  };

  const openManifest = () => {
    openToolTab("mirroros");
    closeScopes();
  };

  /* THE DEEP ROOMS' OWN DOORS — the two laboratories rest at the
     scopes' shore; one touch opens each room in the workplace window. */
  const openRoom = (key: "quantum" | "healx") => {
    openToolTab(key);
    closeScopes();
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

        {/* THE FIELDS — one card each, the field's own light worn inside.
            The ArtX card's old place carries the MANIFEST card now: the
            shaping room, opened in one touch. */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {SCOPE_ORDER.map((key) => {
            if (key === "artx") {
              /* THE MANIFEST CARD — opens the Manifest room itself */
              const accent = "#be185d";
              return (
                <button
                  key="manifest-maker"
                  type="button"
                  onClick={openManifest}
                  aria-haspopup="dialog"
                  title={t("Open the Manifest room")}
                  data-testid="scopes-room-manifest"
                  className="focus-glow group relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300"
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
                      background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 45%, transparent)`,
                    }}
                  >
                    <Sparkles
                      className="size-3.5"
                      style={{ color: accent }}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-foreground">
                      {t("Manifest")}
                    </span>
                    <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      {t("The shaping of intentions")}
                    </span>
                  </span>
                </button>
              );
            }
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

        {/* THE DEEP ROOMS' OWN SHORE — the Quantum and the HealX rest
            here alone now (their marks left the crown and the InDream
            rail): one touch opens each room in the workplace window. */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => openRoom("quantum")}
            aria-haspopup="dialog"
            title={t("Open the Quantum room")}
            data-testid="scopes-room-quantum"
            className="focus-glow group relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300"
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
                background: "color-mix(in srgb, #a78bfa 16%, transparent)",
                boxShadow: "inset 0 0 0 1px color-mix(in srgb, #a78bfa 45%, transparent)",
              }}
            >
              <Atom className="size-3.5 text-[#a78bfa]" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-foreground">
                {t("Quantum")}
              </span>
              <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                {t("The deep room of reality")}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => openRoom("healx")}
            aria-haspopup="dialog"
            title={t("Open the HealX room")}
            data-testid="scopes-room-healx"
            className="focus-glow group relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300"
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
                background: "color-mix(in srgb, #2dd4bf 16%, transparent)",
                boxShadow: "inset 0 0 0 1px color-mix(in srgb, #2dd4bf 45%, transparent)",
              }}
            >
              <HeartPulse className="size-3.5 text-[#2dd4bf]" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-foreground">
                {t("HealX")}
              </span>
              <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                {t("The evolved medical field")}
              </span>
            </span>
          </button>
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
