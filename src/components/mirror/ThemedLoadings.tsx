/* ------------------------------------------------------------------ */
/*  THE LITTLE KEEPERS — one themed ink companion per world, drawn in  */
/*  the same quiet ink as the little visitor (AlienLoading): a         */
/*  knowing eye above the Akashic tome, the Mirror's own hand-glass,   */
/*  the quantum atom, the helix of life, and the little forge.         */
/*  Pure ink (currentColor) in both skies; motion comes from the       */
/*  keeper classes in globals.css.                                     */
/* ------------------------------------------------------------------ */

export function AkashicLoading({ className }: { className?: string }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? "size-24 text-foreground sm:size-28"}
      >
        {/* stars keeping watch */}
        <g fill="currentColor" stroke="none">
          <path className="alien-star" d="M20 30 L21.1 32.9 L24 34 L21.1 35.1 L20 38 L18.9 35.1 L16 34 L18.9 32.9 Z" />
          <path className="alien-star alien-star-2" d="M98 22 L99.1 24.9 L102 26 L99.1 27.1 L98 30 L96.9 27.1 L94 26 L96.9 24.9 Z" />
          <path className="alien-star alien-star-3" d="M94 62 L94.9 64.1 L97 65 L94.9 65.9 L94 68 L93.1 65.9 L91 65 L93.1 64.1 Z" />
        </g>

        {/* the knowing eye — hovering above the tome */}
        <g className="animate-float-y">
          <g className="ak-eye">
            <path d="M40 44 Q60 28 80 44 Q60 60 40 44 Z" />
            <circle cx="60" cy="44" r="7" />
            <circle cx="60" cy="44" r="2.6" fill="currentColor" stroke="none" />
            <circle cx="57.6" cy="41.6" r="0.9" fill="var(--background)" stroke="none" />
          </g>
          {/* quiet rays of knowing */}
          <path d="M60 24 L60 19" strokeWidth="1.1" opacity="0.5" />
          <path d="M38 32 L34.5 28.5" strokeWidth="1.1" opacity="0.4" />
          <path d="M82 32 L85.5 28.5" strokeWidth="1.1" opacity="0.4" />
        </g>

        {/* runes rising like incense from the spine */}
        <g className="ak-rune">
          <circle cx="60" cy="74" r="2.6" />
        </g>
        <g className="ak-rune ak-rune-2">
          <path d="M52 78 L54.5 82.5 L49.5 82.5 Z" />
        </g>
        <g className="ak-rune ak-rune-3">
          <path d="M68 80 L68 85 M65.5 82.5 L70.5 82.5" />
        </g>

        {/* the open tome */}
        <path d="M60 84 C50 77 36 76 26 80 L26 96 C36 92 50 93 60 100" />
        <path d="M60 84 C70 77 84 76 94 80 L94 96 C84 92 70 93 60 100" />
        {/* lines of the record, breathing */}
        <path className="ak-line" d="M34 84 C42 81.5 50 82 56 85" strokeWidth="1.1" />
        <path className="ak-line ak-line-2" d="M34 89 C42 86.5 50 87 56 90" strokeWidth="1.1" />
        <path className="ak-line ak-line-3" d="M86 84 C78 81.5 70 82 64 85" strokeWidth="1.1" />
        <path className="ak-line ak-line-4" d="M86 89 C78 86.5 70 87 64 90" strokeWidth="1.1" />
      </svg>
    </div>
  );
}

export function ManifestLoading({ className }: { className?: string }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? "size-24 text-foreground sm:size-28"}
      >
        {/* sparks around the rim */}
        <g fill="currentColor" stroke="none">
          <path className="alien-star" d="M32 20 L33.1 22.9 L36 24 L33.1 25.1 L32 28 L30.9 25.1 L28 24 L30.9 22.9 Z" />
          <path className="alien-star alien-star-2" d="M90 30 L91.1 32.9 L94 34 L91.1 35.1 L90 38 L88.9 35.1 L86 34 L88.9 32.9 Z" />
          <circle className="mf-pulse" cx="88" cy="66" r="1.6" />
          <circle className="mf-pulse mf-pulse-2" cx="30" cy="60" r="1.4" />
        </g>

        {/* the hand mirror — glass, rim, handle */}
        <g className="animate-float-y">
          <circle cx="60" cy="46" r="25" />
          <circle cx="60" cy="46" r="20.5" strokeWidth="1" opacity="0.45" />
          <path d="M54 70.5 C53 78 53 86 54.5 95" strokeWidth="1.4" />
          <path d="M66 70.5 C67 78 67 86 65.5 95" strokeWidth="1.4" />
          <circle cx="60" cy="98.5" r="2.6" />
          <path d="M56 95 Q60 97.5 64 95" strokeWidth="1" opacity="0.5" />

          {/* the sheen of light crossing the glass */}
          <clipPath id="mf-glass-clip">
            <circle cx="60" cy="46" r="20.5" />
          </clipPath>
          <g clipPath="url(#mf-glass-clip)">
            <path
              className="mf-sheen"
              d="M46 62 L62 26"
              strokeWidth="3.2"
              opacity="0.55"
            />
          </g>

          {/* the small presence living in the glass */}
          <g className="alien-blink">
            <ellipse cx="54" cy="43" rx="1.9" ry="2.8" fill="currentColor" stroke="none" />
            <ellipse cx="66" cy="43" rx="1.9" ry="2.8" fill="currentColor" stroke="none" />
          </g>
          <path d="M55 50.5 Q60 53.5 65 50.5" strokeWidth="1.3" />
        </g>
      </svg>
    </div>
  );
}

export function QuantumLoading({ className }: { className?: string }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? "size-24 text-foreground sm:size-28"}
      >
        {/* quiet waves in the field */}
        <path
          className="qc-wave"
          d="M18 100 Q28 94 38 100"
          strokeWidth="1.1"
          strokeDasharray="4 5"
        />
        <path
          className="qc-wave qc-wave-2"
          d="M82 22 Q92 16 102 22"
          strokeWidth="1.1"
          strokeDasharray="4 5"
        />

        {/* the nucleus — breathing */}
        <g className="qc-nucleus" style={{ transformOrigin: "60px 58px" }}>
          <circle cx="60" cy="58" r="4.2" fill="currentColor" stroke="none" opacity="0.9" />
          <circle cx="56.5" cy="55" r="1.6" fill="var(--background)" stroke="none" />
        </g>

        {/* three orbits, each on its own line and its own time */}
        <g className="qc-orbit" style={{ transformOrigin: "60px 58px" }}>
          <ellipse cx="60" cy="58" rx="31" ry="12" opacity="0.55" />
          <circle cx="29" cy="58" r="2.4" fill="currentColor" stroke="none" />
        </g>
        <g
          className="qc-orbit qc-orbit-2"
          style={{ transformOrigin: "60px 58px", transform: "rotate(60deg)" }}
        >
          <ellipse cx="60" cy="58" rx="31" ry="12" opacity="0.4" />
          <circle cx="29" cy="58" r="2.1" fill="currentColor" stroke="none" />
        </g>
        <g
          className="qc-orbit qc-orbit-3"
          style={{ transformOrigin: "60px 58px", transform: "rotate(-60deg)" }}
        >
          <ellipse cx="60" cy="58" rx="31" ry="12" opacity="0.4" />
          <circle cx="29" cy="58" r="2.1" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

export function HelixLoading({ className }: { className?: string }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? "size-24 text-foreground sm:size-28"}
      >
        {/* little cells drifting past */}
        <g className="hx-cell">
          <circle cx="22" cy="42" r="4" opacity="0.7" />
          <circle cx="22" cy="42" r="1.1" fill="currentColor" stroke="none" />
        </g>
        <g className="hx-cell hx-cell-2">
          <circle cx="97" cy="76" r="3.2" opacity="0.6" />
          <circle cx="97" cy="76" r="0.9" fill="currentColor" stroke="none" />
        </g>

        {/* the helix of life — breathing as one */}
        <g className="animate-float-y">
          <path d="M44 22 C78 36 44 52 60 60 C76 68 44 84 60 96" />
          <path d="M76 22 C42 36 76 52 60 60 C44 68 76 84 60 96" />
          {/* the rungs — the meeting places, catching light in turn */}
          <line className="hx-rung" x1="50" y1="31" x2="70" y2="31" strokeWidth="1.1" />
          <line className="hx-rung hx-rung-2" x1="53" y1="42" x2="67" y2="42" strokeWidth="1.1" />
          <line className="hx-rung hx-rung-3" x1="55" y1="52" x2="65" y2="52" strokeWidth="1.1" />
          <line className="hx-rung hx-rung-4" x1="55" y1="68" x2="65" y2="68" strokeWidth="1.1" />
          <line className="hx-rung hx-rung-5" x1="53" y1="78" x2="67" y2="78" strokeWidth="1.1" />
          <line className="hx-rung" x1="50" y1="89" x2="70" y2="89" strokeWidth="1.1" />
          {/* the quiet pulse at the crossing */}
          <circle className="hx-beat" cx="60" cy="60" r="3" fill="currentColor" stroke="none" />
          <circle cx="60" cy="60" r="7" strokeWidth="1" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}

export function ForgeLoading({ className }: { className?: string }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? "size-24 text-foreground sm:size-28"}
      >
        {/* sparks leaping at every strike */}
        <g className="fg-spark" style={{ ["--fg-dx" as string]: "4px" }}>
          <path d="M60 62 L60 58" strokeWidth="1.3" />
          <circle cx="60" cy="55.5" r="1.2" fill="currentColor" stroke="none" />
        </g>
        <g className="fg-spark fg-spark-2" style={{ ["--fg-dx" as string]: "-6px" }}>
          <path d="M57 62 L54 58" strokeWidth="1.3" />
          <circle cx="52.5" cy="55.5" r="1.1" fill="currentColor" stroke="none" />
        </g>
        <g className="fg-spark fg-spark-3" style={{ ["--fg-dx" as string]: "7px" }}>
          <path d="M63 62 L66 58" strokeWidth="1.3" />
          <circle cx="67.5" cy="55.5" r="1.1" fill="currentColor" stroke="none" />
        </g>

        {/* the hammer, tapping */}
        <g className="fg-tap">
          <rect x="56" y="30" width="24" height="12" rx="2.5" />
          <path d="M56 33 L50 33 L50 39 L56 39" />
          <path d="M68 42 L74 58" strokeWidth="1.4" />
        </g>

        {/* the ember on the anvil face */}
        <g className="animate-float-y">
          <ellipse className="fg-ember" cx="60" cy="72" rx="5" ry="2.2" fill="currentColor" stroke="none" opacity="0.7" />
        </g>

        {/* the patient anvil */}
        <path d="M30 80 Q30 75 38 75 L86 75 Q94 75 91.5 80.5 Q90 83.5 84 84.5 L72 85.5 L72 90 L60 90 L60 85.5 C52 85.5 44 84 40 82 L30 82 Z" />
        <path d="M44 90 L76 90 L76 94 L44 94 Z" strokeWidth="1.3" />

        {/* a gear resting beside, turning slowly */}
        <g className="fg-gear" style={{ transformOrigin: "94px 96px" }}>
          <circle cx="94" cy="96" r="4.5" strokeWidth="1.2" />
          <path d="M94 90 L94 92 M94 100 L94 102 M88 96 L90 96 M98 96 L100 96 M89.8 91.8 L91.2 93.2 M96.8 98.8 L98.2 100.2 M98.2 91.8 L96.8 93.2 M91.2 98.8 L89.8 100.2" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}
