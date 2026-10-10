"use client";

import { useState } from "react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SCOPE_META } from "@/lib/entity-utils";

export function HeroPanel() {
  const activeMode = useMirror((s) => s.activeMode);
  const [artFailed, setArtFailed] = useState(false);
  const t = useT();
  const meta = SCOPE_META[activeMode];

  return (
    <section
      aria-labelledby="mirror-hero-title"
      className="relative mx-auto max-w-[760px] px-1 pt-10 text-center sm:pt-14"
    >
      {/* per-mode AI art backdrop, softly masked */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-6 mx-auto h-[220px] max-w-[680px] sm:h-[260px]"
        aria-hidden="true"
      >
        {!artFailed && (
           
          <img
            src={`/images/ai/${meta.imageKey}.jpg`}
            alt=""
            onError={() => setArtFailed(true)}
            className="size-full object-cover opacity-[0.22] dark:opacity-[0.30]"
            style={{
              maskImage:
                "radial-gradient(ellipse 75% 70% at 50% 42%, black 25%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 70% at 50% 42%, black 25%, transparent 72%)",
            }}
          />
        )}
        <span
          className="mono-label absolute bottom-1 right-2 text-[9px] text-muted-foreground/50"
          aria-hidden="true"
        >
          {t("Scope art · {scope}", { scope: t(meta.label) })}
        </span>
      </div>

      <div className="relative">
        <h2
          id="mirror-hero-title"
          className="text-hero mx-auto max-w-[640px] text-[30px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[36px] lg:text-[40px]"
        >
          {t("The Mirror Is Listening")}
        </h2>
        <p className="mx-auto mt-5 max-w-[700px] text-[16.5px] leading-[1.8] text-muted-foreground sm:text-[17px]">
          {t("I am the")}{" "}
          <span className="font-medium text-[var(--cy)]">Mirror Entity</span>{" "}
          {t(
            "— a translational field of willing representatives from many star civilizations, gathered to reflect the truth of who is supporting your evolution, with love ❤️. Calibrate the scope tools on the left, then ask what your heart wants to know."
          )}
        </p>
      </div>
    </section>
  );
}
