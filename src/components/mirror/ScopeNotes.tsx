"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SCENES } from "./InkScenes";
import { MirrorNoteZoom } from "./MirrorNoteZoom";
import { MIRROR_NOTES } from "@/lib/data/mirror-notes";
import type { ScopeNote } from "@/lib/data/scope-notes";

/* ------------------------------------------------------------------ */
/*  SCOPE NOTES — the note stickers of one window, pinned INTO the     */
/*  conversation. Each sticker carries a section of the window's       */
/*  knowledge and its own drawn 3D ink animation. The cluster lives    */
/*  inside the chat flow — it scrolls with the messages and is never   */
/*  an overlay on the frame.                                           */
/*                                                                     */
/*  THE TOUCHED NOTE — a note is not decoration: touched, any sticker  */
/*  opens into its deeper page (a full-screen reading room carrying    */
/*  inspiration, information, signals from the deep and riddles — the  */
/*  house's own quiet voice, never naming itself).                     */
/*                                                                     */
/*  THE CONTRAST LAW — the notes read in the dark as well as in the    */
/*  light: the words wear the foreground at its full strength now      */
/*  (the old grey-on-glass met the night and lost).                    */
/* ------------------------------------------------------------------ */

/** The resting tilt of each sticker — pinned by hand, never straight. */
const STICKER_TILTS = [-1.5, 1.2, -0.9, 1.5, -1.1, 0.9];

export function ScopeNotes({
  glyph,
  name,
  notes,
}: {
  glyph: string;
  name: string;
  notes: ScopeNote[];
}) {
  const t = useT();
  /* the deeper page this visit is reading (an index into MIRROR_NOTES) */
  const [reading, setReading] = useState<number | null>(null);

  return (
    <div className="ml-0 sm:ml-11" data-testid="scope-notes">
      {/* the pinning line */}
      <div className="mb-3 flex items-center gap-2 pl-0.5">
        <StickyNote
          className="size-3.5 shrink-0 text-[var(--scope-a)]"
          aria-hidden="true"
        />
        <p className="mono-label text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground/90">
          {t("Notes from this window")}
          <span className="mx-1.5 text-[var(--scope-a)]" aria-hidden="true">
            ·
          </span>
          <span className="normal-case tracking-normal">
            {glyph} {t(name)}
          </span>
        </p>
      </div>

      {/* the stickers — dropped in one by one, pinned at a hand tilt;
          each one opens into its deeper page when touched */}
      <div className="flex max-w-[540px] flex-col gap-5">
        {notes.map((note, i) => {
          const Scene = SCENES[note.scene];
          const tilt = STICKER_TILTS[i % STICKER_TILTS.length];
          /* the deeper page this sticker opens — spread across the
             whole shelf so different stickers open different pages */
          const deeperPage = (i * 7 + 3) % MIRROR_NOTES.length;
          return (
            <motion.button
              key={`${note.scene}-${note.title}`}
              type="button"
              initial={{ opacity: 0, y: -28, rotate: tilt * 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 130,
                damping: 15,
                delay: 0.12 + i * 0.16,
              }}
              data-testid="scope-note"
              onClick={() => setReading(deeperPage)}
              aria-label={`${t(note.title)} — ${t("Open the note's deeper page")}`}
              title={t("Open the note's deeper page")}
              className="focus-glow relative block w-full cursor-zoom-in rounded-[4px] border hairline bg-[var(--glass-bg)] px-4 pb-4 pt-5 text-left shadow-[0_14px_30px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-colors duration-300 hover:border-[var(--hairline-hover)]"
            >
              {/* the tape holding the note to the conversation */}
              <span
                aria-hidden="true"
                className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 -rotate-3 rounded-[2px] border hairline"
                style={{
                  background:
                    "color-mix(in srgb, var(--scope-a) 10%, var(--glass-bg))",
                  backdropFilter: "blur(2px)",
                }}
              />

              {/* the drawn 3D animation of this section */}
              {Scene ? <Scene /> : null}

              {/* the information — full-strength words, readable in the dark */}
              <h4 className="ink-hand mt-3.5 text-[16.5px] font-semibold leading-snug text-[var(--scope-a)]">
                {t(note.title)}
              </h4>
              <p className="mt-1.5 text-[14.5px] leading-[1.75] text-foreground">
                {t(note.text)}
              </p>

              {/* the touch hint — a quiet mark, the page that waits */}
              <span
                aria-hidden="true"
                className="mono-label mt-3 block text-[8.5px] uppercase tracking-[0.2em] text-foreground/70"
              >
                {t("Touch — the note opens further")}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* the deeper page — full-screen, turning, high-contrast */}
      <MirrorNoteZoom
        index={reading}
        onIndexChange={setReading}
        onClose={() => setReading(null)}
      />
    </div>
  );
}
