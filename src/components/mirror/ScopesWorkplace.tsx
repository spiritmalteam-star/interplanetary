"use client";

import { ArrowLeft } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ScopesRoom } from "./ScopesRoom";

/* ------------------------------------------------------------------ */
/*  THE SCOPES WORKPLACE — the fields' own independent room. The       */
/*  crown's Scopes hand opens THIS window directly (never a tab of     */
/*  InDream): the five fields' subcategories render here, the chosen   */
/*  one marked, and the one back hand at the row's left lays the room  */
/*  down so the main chat landing stands again.                        */
/* ------------------------------------------------------------------ */
export function ScopesWorkplace() {
  const view = useMirror((s) => s.view);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const closeScopes = useMirror((s) => s.closeScopes);
  const t = useT();

  /* the same standing law as every room: the window lives over the
     chat, in both of its gears (docked and fullscreen) */
  const open =
    activeToolTab === "scopes" &&
    (view === "observatory" || view === "transmission");

  if (!open) return null;

  return (
    <div
      data-testid="scopes-workplace"
      data-workplace="true"
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col overflow-hidden rounded-none border bg-background shadow-[0_24px_70px_-30px_rgba(0,0,0,0.6)]"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 25%, var(--hairline))",
      }}
    >
      {/* THE WORKPLACE HEADER — the one back hand at the row's very
          left (the same place every room wears it): one touch lays the
          scopes down and the main chat landing stands again. */}
      <div className="relative z-10 flex h-9 shrink-0 items-center gap-2 overflow-x-auto px-1">
        <button
          type="button"
          onClick={closeScopes}
          aria-label={t("Back to the chat")}
          title={t("Back to the chat")}
          data-testid="scopes-workspace-back"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
        </button>
        <span className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {t("Scopes")}
        </span>
      </div>

      {/* the identity strip — the same slim line of the house's light
          every workplace wears under its header */}
      <div
        aria-hidden="true"
        className="h-px shrink-0"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--scope-a,var(--gd)) 45%, transparent), color-mix(in srgb, var(--scope-a,var(--gd)) 18%, transparent) 42%, transparent 100%)",
        }}
      />

      {/* THE FIELDS — the scopes' own subcategories fill the room */}
      <div className="relative min-h-0 flex-1">
        <ScopesRoom />
      </div>
    </div>
  );
}
