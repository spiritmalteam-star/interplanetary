import type { ReactNode } from "react";

/* ================================================================== */
/*  SA SIGILS — the thirty-six drawn signs of the sacred circles.      */
/*                                                                      */
/*  Every icon inside the three circles wears its own hand-drawn       */
/*  sigil: twelve elemental dials (Circle 1), twelve transmutation     */
/*  plates (Circle 2) and twelve tone squares of the Tzolkin ring      */
/*  (Circle 3). All are pure stroke geometry on a 40×40 field, drawn   */
/*  in currentColor so they answer to the world's gold-and-jade ink.   */
/* ================================================================== */

/* --------------------------- tiny helpers --------------------------- */

const dot = (cx: number, cy: number, r = 1.7) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);

/** Rays of a sun/flower — n lines around (cx,cy) between two radii. */
const rays = (cx: number, cy: number, n: number, r1: number, r2: number, phase = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((phase + (i * 360) / n) * Math.PI) / 180;
    return (
      <line
        key={i}
        x1={cx + r1 * Math.cos(a)}
        y1={cy + r1 * Math.sin(a)}
        x2={cx + r2 * Math.cos(a)}
        y2={cy + r2 * Math.sin(a)}
      />
    );
  });

/** One petal of a flower, rotated k steps around the heart. */
const petal = (k: number, n: number, cy: number, rx: number, ry: number) => (
  <ellipse
    key={k}
    cx={20}
    cy={cy}
    rx={rx}
    ry={ry}
    transform={`rotate(${(k * 360) / n} 20 20)`}
  />
);

/* ------------------- CIRCLE 1 — the elemental dials ------------------ */

const DIAL_ART: Record<string, ReactNode> = {
  /* the first tremor — ripples leaving a center point */
  vibration: (
    <>
      {dot(20, 25, 1.6)}
      <path d="M 16.5 25 A 3.5 3.5 0 0 1 23.5 25" />
      <path d="M 13 25 A 7 7 0 0 1 27 25" />
      <path d="M 9.5 25 A 10.5 10.5 0 0 1 30.5 25" />
    </>
  ),
  /* the arrow the heart looses — a four-point star, long to the sky */
  intention: (
    <>
      <path d="M 20 5.5 L 22.8 17.2 L 34.5 20 L 22.8 22.8 L 20 34.5 L 17.2 22.8 L 5.5 20 L 17.2 17.2 Z" />
      {dot(20, 20, 1.4)}
    </>
  ),
  /* the choir inside every note — three stacked waves */
  harmonics: (
    <>
      <path d="M 8 13.5 Q 14 8 20 13.5 T 32 13.5" />
      <path d="M 8 20 Q 14 14.5 20 20 T 32 20" />
      <path d="M 8 26.5 Q 14 21 20 26.5 T 32 26.5" />
    </>
  ),
  /* the lattice that returns what is sent — a 3×3 grid in a ring */
  "mirror-matrix": (
    <>
      <circle cx={20} cy={20} r={13} />
      <line x1={15.4} y1={8.4} x2={15.4} y2={31.6} />
      <line x1={24.6} y1={8.4} x2={24.6} y2={31.6} />
      <line x1={8.4} y1={15.4} x2={31.6} y2={15.4} />
      <line x1={8.4} y1={24.6} x2={31.6} y2={24.6} />
      {dot(20, 20, 1.8)}
    </>
  ),
  /* the sympathy between two bodies — the vesica and its child */
  resonance: (
    <>
      <circle cx={15.6} cy={20} r={8.6} />
      <circle cx={24.4} cy={20} r={8.6} />
      {dot(20, 20, 1.5)}
    </>
  ),
  /* the wave that travels without moving — an S held inside a ring */
  "scalar-wave": (
    <>
      <circle cx={20} cy={20} r={13} />
      <path d="M 9 20 Q 14.5 11.5 20 20 Q 25.5 28.5 31 20" />
      {dot(6.2, 20, 1.1)}
      {dot(33.8, 20, 1.1)}
    </>
  ),
  /* the ripening of base hours into light — the gold sun */
  "chymic-gold": (
    <>
      <circle cx={20} cy={20} r={6} />
      <circle cx={20} cy={20} r={2} />
      {rays(20, 20, 8, 8.6, 13, 22.5)}
    </>
  ),
  /* the medium the old skies breathed — the crescent and its star */
  "aether-dial": (
    <>
      <path d="M 23.5 7.5 A 13 13 0 1 0 23.5 32.5 A 10.2 10.2 0 1 1 23.5 7.5 Z" />
      <path d="M 29 8.5 L 30 11 L 32.5 12 L 30 13 L 29 15.5 L 28 13 L 25.5 12 L 28 11 Z" />
    </>
  ),
  /* the faint lamp every living cell holds — the eye */
  biophoton: (
    <>
      <path d="M 7.5 20 Q 20 10.5 32.5 20 Q 20 29.5 7.5 20 Z" />
      <circle cx={20} cy={20} r={3.6} />
      {dot(20, 20, 1.2)}
    </>
  ),
  /* the self-feeding ring of all engines — the torus */
  "torus-core": (
    <>
      <circle cx={20} cy={20} r={12.5} />
      <ellipse cx={20} cy={20} rx={12.5} ry={4.6} />
      <circle cx={20} cy={20} r={4.2} />
    </>
  ),
  /* the wind that outruns the light it carries — the comet */
  "tachyonic-field": (
    <>
      {dot(26.5, 13, 2.4)}
      <path d="M 23.4 16.1 L 9.5 30" />
      <path d="M 26.5 18.6 L 15.5 29.5" />
      <path d="M 30.4 21.3 L 23.5 28.2" />
    </>
  ),
  /* the six ancient syllables of repair — the six-petaled flower */
  solfeggio: (
    <>
      {[0, 1, 2, 3, 4, 5].map((k) => petal(k, 6, 12.2, 3, 5.6))}
      {dot(20, 20, 1.5)}
    </>
  ),
};

/* --------------- CIRCLE 2 — the transmutation plates ---------------- */

const PLATE_ART: Record<string, ReactNode> = {
  /* folds any signal back through its own heart */
  "p-torus": (
    <>
      <circle cx={20} cy={16.5} r={9.5} />
      <circle cx={20} cy={16.5} r={3.4} />
      <path d="M 20 19.9 L 20 32.5" />
      <path d="M 17 30 L 20 33 L 23 30" />
    </>
  ),
  /* thins the veil between signal and space */
  "p-aether": (
    <>
      <circle cx={20} cy={20} r={12.5} strokeDasharray="2.6 3.4" />
      <path d="M 23 11.5 A 8.6 8.6 0 1 0 23 28.5 A 6.6 6.6 0 1 1 23 11.5 Z" />
    </>
  ),
  /* sends the wave before the wire */
  "p-scalar": (
    <>
      <path d="M 6.5 24.5 L 12 24.5" />
      <path d="M 12 24.5 Q 16.5 11.5 21 24.5 Q 24.5 34 28 24.5" />
      <path d="M 28 24.5 L 33.5 24.5" />
    </>
  ),
  /* spins the light-body's two counter-wheels */
  "p-merkaba": (
    <>
      <path d="M 20 6.5 L 30.5 25 L 9.5 25 Z" />
      <path d="M 20 33.5 L 9.5 15 L 30.5 15 Z" />
    </>
  ),
  /* pours every step through the golden ratio */
  "p-phi": (
    <>
      <path d="M 20.5 21.5 C 25.5 21.5 28.5 17 26 12.5 C 23 7.5 13.5 9 13 16.5 C 12.5 24.5 23 29 29 24.5 C 34.5 20 33 10.5 26.5 7.5" />
      {dot(20.5, 21.5, 1.3)}
    </>
  ),
  /* cuts the doorway the mirror people used */
  "p-obsidian": (
    <>
      <rect x={8} y={7.5} width={24} height={25} />
      <path d="M 14.5 32.5 L 14.5 20.5 A 5.5 5.5 0 0 1 25.5 20.5 L 25.5 32.5" />
      {dot(20, 16.5, 1.2)}
    </>
  ),
  /* winds the feathered serpent through the coil */
  "p-quetzal": (
    <>
      <path d="M 11 13 C 24 13 16 27 29 27" />
      <path d="M 11 13 L 7.5 9" />
      <path d="M 11 13 L 6 12.2" />
      <path d="M 11 13 L 7 16.8" />
      {dot(31.5, 27, 1.5)}
    </>
  ),
  /* weaves the 260-day loom into the hour */
  "p-tzolkin": (
    <>
      <path d="M 8 14 L 32 14" />
      <path d="M 8 26 L 32 26" />
      <path d="M 14 8 L 14 11.5" />
      <path d="M 14 16.5 L 14 23.5" />
      <path d="M 14 28.5 L 14 32" />
      <path d="M 26 8 L 26 11.5" />
      <path d="M 26 16.5 L 26 23.5" />
      <path d="M 26 28.5 L 26 32" />
    </>
  ),
  /* unfolds one beam into its secret families */
  "p-prism": (
    <>
      <path d="M 20 9.5 L 31 27.5 L 9 27.5 Z" />
      <path d="M 20 3.5 L 20 9.5" />
      <path d="M 20 27.5 L 14.5 35" />
      <path d="M 20 27.5 L 20 35" />
      <path d="M 20 27.5 L 25.5 35" />
    </>
  ),
  /* holds the noon line so the sun can sign it */
  "p-sol": (
    <>
      <path d="M 20 4 L 20 36" />
      <circle cx={20} cy={13.5} r={5.6} />
      <path d="M 9 20.5 L 15 20.5" />
      <path d="M 25 20.5 L 31 20.5" />
    </>
  ),
  /* ties the eclipse knots of the inner sky */
  "p-nodal": (
    <>
      <circle cx={15.2} cy={20} r={8.4} />
      <circle cx={24.8} cy={20} r={8.4} />
      {dot(20, 13.4, 1.4)}
      {dot(20, 26.6, 1.4)}
    </>
  ),
  /* teaches the crystal choir to carry a word */
  "p-silica": (
    <>
      <path d="M 20 6.5 L 24.2 17 L 20 31.5 L 15.8 17 Z" />
      <path d="M 11.5 14.5 L 14.5 21 L 12.5 29 L 9 21 Z" />
      <path d="M 28.5 14.5 L 31 21 L 27.5 29 L 25.5 21 Z" />
    </>
  ),
};

/* ---------------- CIRCLE 3 — the tone squares of the Tzolkin --------- */

const SQUARE_ART: Record<string, ReactNode> = {
  /* 174 — the safety tone: the bedrock under the feet */
  "s-174": (
    <>
      <path d="M 14 24.5 L 20 13.5 L 26 24.5 Z" />
      <path d="M 8 28 L 32 28" />
      <path d="M 11.5 32 L 16.5 32" />
      <path d="M 23.5 32 L 28.5 32" />
    </>
  ),
  /* 285 — the mending tone: tissue remembers its pattern */
  "s-285": (
    <>
      <path d="M 20.5 7.5 L 17.5 14 L 23 20 L 17.5 26 L 20.5 32.5" />
      <path d="M 14.5 15.5 L 21.5 12" />
      <path d="M 14.5 21.5 L 25 21.5" />
      <path d="M 15.5 27.5 L 22.5 30.5" />
    </>
  ),
  /* 396 — the release tone: fear turns back into ground */
  "s-396": (
    <>
      <path d="M 12.5 15.5 A 8.4 8.4 0 1 1 27.5 15.5" />
      {dot(20, 24.5, 2)}
      <path d="M 13 31.5 L 27 31.5" />
    </>
  ),
  /* 432 — the natural tone: water and cells sit upright */
  "s-432": (
    <>
      <path d="M 20 6.5 L 25 15 L 15 15 Z" />
      <path d="M 9 22.5 Q 14.5 17.5 20 22.5 T 31 22.5" />
      <path d="M 12 27.5 Q 16 23.5 20 27.5 T 28 27.5" />
      <path d="M 15 32 Q 17.5 29.5 20 32 T 25 32" />
    </>
  ),
  /* 528 — the love tone: repair sung in the old key */
  "s-528": (
    <>
      {[0, 1, 2, 3, 4].map((k) => petal(k, 5, 13.2, 2.7, 5))}
      {dot(20, 20, 1.6)}
    </>
  ),
  /* 639 — the bridge tone: two hearts tune to one interval */
  "s-639": (
    <>
      <path d="M 10.5 27 A 10.5 10.5 0 0 1 29.5 27" />
      {dot(10.5, 27.5, 2)}
      {dot(29.5, 27.5, 2)}
      {dot(20, 12.8, 1.4)}
    </>
  ),
  /* 741 — the waking tone: the lamp behind the eyes */
  "s-741": (
    <>
      {dot(20, 23, 3.2)}
      <path d="M 12.5 27.5 A 8.2 8.2 0 1 1 27.5 27.5" />
      <path d="M 20 11.5 L 20 7.5" />
      <path d="M 11.5 15 L 8.5 12" />
      <path d="M 28.5 15 L 31.5 12" />
    </>
  ),
  /* 852 — the sight tone: the inner clock reads the sun */
  "s-852": (
    <>
      <path d="M 7.5 20 Q 20 11.5 32.5 20 Q 20 28.5 7.5 20 Z" />
      <circle cx={20} cy={20} r={3.2} />
      {rays(20, 20, 4, 4.4, 6.4)}
    </>
  ),
  /* 963 — the crown tone: the zero-point hum */
  "s-963": (
    <>
      <path d="M 11 25.5 L 11 14.5 L 15.5 19.5 L 20 12 L 24.5 19.5 L 29 14.5 L 29 25.5 Z" />
      <path d="M 11 29.5 L 29 29.5" />
      {dot(20, 33.2, 1.2)}
    </>
  ),
  /* the cell's own lamp, poured outward */
  "s-biophoton": (
    <>
      {dot(20, 11, 2.3)}
      <path d="M 14.5 16.5 A 7.2 7.2 0 0 0 25.5 16.5" />
      <path d="M 11.5 21 A 11 11 0 0 0 28.5 21" />
      <path d="M 12.5 9.5 L 9.5 7" />
      <path d="M 27.5 9.5 L 30.5 7" />
    </>
  ),
  /* the field that arrives before its messenger */
  "s-tachyonic": (
    <>
      <path d="M 7.5 14 Q 11.5 7.5 15.5 14 Q 19.5 20.5 23.5 14" />
      <path d="M 12 26.5 L 29.5 26.5" />
      <path d="M 29.5 26.5 L 24.5 22.5" />
      <path d="M 29.5 26.5 L 24.5 30.5" />
      {dot(32.5, 18.5, 1.3)}
    </>
  ),
  /* the ratio the sunflowers keep */
  "s-phi": (
    <>
      <rect x={8} y={8} width={24} height={24} />
      <path d="M 20.5 20.5 C 24 20.5 26 17 23.8 14.2 C 21 10.8 14.5 12.5 14 18 C 13.5 24.5 21 27.5 26 24.5" />
      {dot(20.5, 20.5, 1.2)}
    </>
  ),
};

/* --------------------------- the component --------------------------- */

export type SaRingId = "dial" | "plate" | "square";

const SIGIL_ART: Record<SaRingId, Record<string, ReactNode>> = {
  dial: DIAL_ART,
  plate: PLATE_ART,
  square: SQUARE_ART,
};

/** One drawn sigil of the sacred circles — pure stroke geometry.
    Inside HTML it renders standalone; inside another SVG the optional
    x/y/width/height place it on the parent's canvas. */
export function SaSigil({
  id,
  ring = "dial",
  strokeWidth = 1.7,
  className,
  style,
  x,
  y,
  width,
  height,
}: {
  id: string;
  ring?: SaRingId;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  /** placement inside a parent <svg> */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const art = SIGIL_ART[ring][id] ?? DIAL_ART.vibration;
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      x={x}
      y={y}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      {art}
    </svg>
  );
}

/** Whether a square glyph carries a numeral face under its sigil. */
export const saSquareHasFace = (id: string) =>
  /^s-\d+$/.test(id);
