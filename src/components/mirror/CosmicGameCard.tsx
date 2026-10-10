"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { getGame, type GameInstance } from "@/lib/cosmic-games";
import { GameBoard } from "./GamePatterns";

/* ------------------------------------------------------------------ */
/*  CosmicGameCard — one of the Mirror's two hundred games, surfaced   */
/*  inside a finished exchange. Quiet ink frame, one invitation, one   */
/*  playable archetype, one line reminding the visitor that the deck   */
/*  is vast. Dismissable; the game keeps its state for the session.    */
/* ------------------------------------------------------------------ */

export function CosmicGameCard({
  instance,
  testIdPrefix,
}: {
  instance: GameInstance;
  testIdPrefix: string;
}) {
  const t = useT();
  const [hidden, setHidden] = useState(false);
  const game = useMemo(() => getGame(instance.gameId), [instance.gameId]);

  if (!game || hidden) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      aria-label={game.name}
      data-testid={`${testIdPrefix}-card`}
      className="mt-8 rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_65%,transparent)] bg-[color-mix(in_srgb,var(--hairline)_7%,transparent)] px-5 py-5 sm:px-7"
    >
      {/* header — the offer, named */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="mono-label text-[9.5px] uppercase tracking-[0.26em]"
            style={{ color: "color-mix(in srgb, var(--scope-a) 80%, white)" }}
          >
            {t("The Mirror offers a game")}
          </p>
          <h3 className="mt-1.5 font-serif text-[19px] leading-snug text-foreground">
            {game.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label={t("Let it pass")}
          title={t("Let it pass")}
          data-testid={`${testIdPrefix}-dismiss`}
          className="focus-glow -mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* the invitation */}
      <p className="mt-2.5 max-w-[520px] text-[13.5px] italic leading-relaxed text-muted-foreground">
        {game.invocation}
      </p>

      {/* the playable board */}
      <div className="mt-5">
        <GameBoard
          payload={game.payload}
          instance={instance}
          testIdPrefix={`${testIdPrefix}-board`}
        />
      </div>

      {/* the catalog hint — curiosity, kept honest */}
      <p className="mono-label mt-6 border-t border-[color-mix(in_srgb,var(--hairline)_45%,transparent)] pt-3 text-center text-[9px] uppercase tracking-[0.24em] text-muted-foreground/50">
        {t("one of two hundred — the Laboratory keeps the rest")}
      </p>
    </motion.section>
  );
}
