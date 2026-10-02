/* The little visitor — when a transmission is forming, a cute cryptic
   saucer descends onto the page: a big-eyed passenger blinking slowly
   under a glass dome, rim lights patrolling the hull, tiny antennae
   listening sideways, cryptic glyphs rising through the beam while
   strange stars keep watch. Drawn in ink only — it belongs to the
   book reader in both of its hours. */

export function AlienLoading() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-24 text-foreground sm:size-28"
      >
        <defs>
          <linearGradient id="alien-beam-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the beam — quiet light pouring from the hull */}
        <polygon
          className="alien-beam"
          points="47,44 73,44 87,112 33,112"
          fill="url(#alien-beam-fade)"
          stroke="none"
        />

        {/* cryptic glyphs rising through the beam */}
        <g className="alien-glyph">
          <circle cx="47" cy="93" r="3.4" />
          <circle cx="47" cy="93" r="0.9" fill="currentColor" stroke="none" />
        </g>
        <g className="alien-glyph alien-glyph-2">
          <path d="M60 90.5 L62.6 95.5 L57.4 95.5 Z" />
          <circle cx="60" cy="93.6" r="0.8" fill="currentColor" stroke="none" />
        </g>
        <g className="alien-glyph alien-glyph-3">
          <path d="M70.5 94.5 L73 97 L75.5 94.5" />
          <circle cx="73" cy="90.6" r="0.8" fill="currentColor" stroke="none" />
        </g>

        {/* strange stars keeping watch */}
        <g fill="currentColor" stroke="none">
          <path className="alien-star" d="M22 26 L23.1 28.9 L26 30 L23.1 31.1 L22 34 L20.9 31.1 L18 30 L20.9 28.9 Z" />
          <path className="alien-star alien-star-2" d="M97 18 L98.1 20.9 L101 22 L98.1 23.1 L97 26 L95.9 23.1 L93 22 L95.9 20.9 Z" />
          <path className="alien-star alien-star-3" d="M27 86 L27.9 88.1 L30 89 L27.9 89.9 L27 92 L26.1 89.9 L24 89 L26.1 88.1 Z" />
          <path className="alien-star alien-star-4" d="M95 76 L95.9 78.1 L98 79 L95.9 79.9 L95 82 L94.1 79.9 L92 79 L94.1 78.1 Z" />
        </g>

        {/* the craft — everything aboard breathes together */}
        <g className="animate-float-y">
          {/* side antennae, listening */}
          <path d="M37.5 45.5 C34.5 42.5 33 40 32.5 37" />
          <circle className="alien-tip" cx="32.2" cy="35.3" r="1.5" fill="currentColor" stroke="none" />
          <path d="M82.5 45.5 C85.5 42.5 87 40 87.5 37" />
          <circle className="alien-tip alien-tip-2" cx="87.8" cy="35.3" r="1.5" fill="currentColor" stroke="none" />

          {/* hull — an opaque ink dish that the beam pours from */}
          <ellipse className="alien-hull" cx="60" cy="48" rx="23.5" ry="6" />

          {/* glass dome */}
          <path className="alien-glass" d="M42.5 46 A17.5 17.5 0 0 1 77.5 46" />
          <path d="M49.5 33 Q52 28.5 57.5 26.8" strokeWidth="1.1" opacity="0.35" />

          {/* the passenger */}
          <ellipse className="alien-skin" cx="60" cy="38" rx="8.5" ry="9" />
          <g className="alien-blink">
            <ellipse cx="56.5" cy="37.2" rx="2.6" ry="3.9" fill="currentColor" stroke="none" />
            <ellipse cx="63.5" cy="37.2" rx="2.6" ry="3.9" fill="currentColor" stroke="none" />
            <circle className="alien-glint" cx="55.6" cy="35.8" r="0.85" stroke="none" />
            <circle className="alien-glint" cx="62.6" cy="35.8" r="0.85" stroke="none" />
          </g>
          <path d="M56.8 43.4 Q60 45.8 63.2 43.4" strokeWidth="1.3" />

          {/* rim lights patrolling the hull */}
          <circle className="alien-light" cx="44" cy="48.6" r="1.4" fill="currentColor" stroke="none" />
          <circle className="alien-light alien-light-2" cx="60" cy="50.4" r="1.4" fill="currentColor" stroke="none" />
          <circle className="alien-light alien-light-3" cx="76" cy="48.6" r="1.4" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </div>
  );
}
