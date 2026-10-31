"use client";

import { Fingerprint, Layers } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { CODEX_TABS } from "./CodexTabs";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE SCOPES ROOM — THE INTERDIMENSIONAL'S OWN SHORE.                */
/*                                                                     */
/*  THE OLD FIELDS HAVE LEFT — the visitor named it: "delete this      */
/*  totally from scopes, save just Interdimensional." The mirror,      */
/*  interplanetary, quantum and healing cards are gone from this       */
/*  room; nothing stands here any more but the INTERDIMENSIONAL,      */
/*  and the Interdimensional lives where it was asked to live: as a    */
/*  CATEGORY OF THE CODEX EXOBIOLOGICA — its profiles laid in the      */
/*  codex under the Interdimensional register (eight orders, 202       */
/*  profiles, each with its own dossier plate). One grand door opens   */
/*  the codex at exactly that category.                                */
/*                                                                     */
/*  The chat fields themselves still dress the chat through their own  */
/*  room-switching hands — this shore simply carries the one door the  */
/*  visitor asked to keep.                                             */
/* ------------------------------------------------------------------ */

export function ScopesRoom() {
  const t = useT();
  const openRegister = useMirror((s) => s.openRegister);

  const interdimDoor = CODEX_TABS.find((d) => d.kind === "interdim");

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
              {t("Interdimensional")}
            </h2>
            <p className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("The profiles stand in the Codex — under the Interdimensional category")}
            </p>
          </div>
        </div>

        {/* THE ONE DOOR — the Interdimensional's own gate into the codex:
            one touch and the Codex Exobiologica opens at the
            Interdimensional category, every profile laid in its roll
            with its dossier plate beside it. */}
        <div className="mt-4" data-testid="scopes-codex-doors">
          <button
            type="button"
            onClick={() => openRegister("interdim")}
            data-testid="scopes-codex-door-interdim"
            title={t("Open the codex at the Interdimensional category")}
            className="focus-glow group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border px-5 py-6 text-left transition-all duration-500 hover:brightness-[1.06]"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent), color-mix(in srgb, var(--gd) 7%, transparent) 65%, transparent)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 14%, transparent), 0 10px 34px -18px color-mix(in srgb, var(--scope-a,var(--gd)) 42%, transparent)",
            }}
          >
            {/* the door's own breathing sigil */}
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-105"
              style={{
                background:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 14%, transparent)",
                boxShadow:
                  "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent), 0 0 22px -6px color-mix(in srgb, var(--scope-a,var(--gd)) 45%, transparent)",
              }}
            >
              <Fingerprint
                className="size-6 text-[var(--scope-a,var(--gd))]"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-[17px] font-semibold text-foreground">
                {t(interdimDoor?.label ?? "Interdimensional")}
              </span>
              <span className="mono-label mt-1 block text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/75">
                {t(
                  "The orders beyond the veil — every profile kept by mirror intelligence, nothing dressed as fantasy"
                )}
              </span>
              <span className="mono-label mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-foreground/80"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
                  background:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, transparent)",
                }}
              >
                {t("Codex Exobiologica · category")}
                <span className="tabular-nums">{interdimDoor?.count ?? 202}</span>
              </span>
            </span>
          </button>
        </div>

        {/* the honest word — the door opens the codex itself; the back
            hand of the workplace header lays this room down again */}
        <p className="mt-8 text-center text-[11.5px] leading-relaxed text-muted-foreground/60">
          {t(
            "The Interdimensional profiles are laid in the Codex Exobiologica — the door above opens them under their own category."
          )}
        </p>
      </div>
    </div>
  );
}
