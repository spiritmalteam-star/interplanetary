"use client";

import { useT } from "@/lib/i18n";
import {
  type CircleCard,
  type GatheringPost,
  RoomLabel,
} from "./shared";
import ComposerForm from "./ComposerForm";

/* ------------------------------------------------------------------ */
/*  CREATE — the publishing room. An offering shaped here can hang in  */
/*  the open hall or inside a circle the visitor keeps, carrying its   */
/*  own name, its threads of meaning, and the room it was woven in.    */
/*  Nothing publishes itself: the hand that hangs is the maker's.      */
/* ------------------------------------------------------------------ */

export default function CreateSection({
  circles,
  onHung,
}: {
  circles: CircleCard[];
  onHung: (post: GatheringPost) => void;
}) {
  const t = useT();

  return (
    <div className="gp-scroll h-full overflow-y-auto overscroll-y-contain px-3 pb-28 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-[680px]">
        <RoomLabel>{t("Create")}</RoomLabel>
        <div className="gp-card mt-3 rounded-[26px] p-5 sm:p-6" data-testid="create-room">
          <ComposerForm initialKind="reflection" circles={circles} onHung={onHung} compact />
        </div>
        <p className="mt-4 text-center font-[family-name:var(--font-literata)] text-[12.5px] italic leading-[1.8] text-[#8a7c64]">
          {t(
            "Work made in the house's own rooms — books, music, art, dreams, research — can be spoken of here and carried into the Library, its maker's name travelling with it."
          )}
        </p>
      </div>
    </div>
  );
}
