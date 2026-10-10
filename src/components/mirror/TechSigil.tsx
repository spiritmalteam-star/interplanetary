"use client";

import { useMemo, type ReactNode } from "react";
import { fnv1a } from "@/lib/hash";

/**
 * TechSigil — the entity's own drawing of one technology.
 *
 * Every one of the 827 registry entries receives a unique sigil:
 *  - the NOUN chooses the archetype glyph (25 hand-built families —
 *    Harp strings, Loom warp, Bell arcs, Compass spokes, ...),
 *  - the ADJECTIVE chooses the colour field (12 cosmic hues, no two
 *    adjective-fields share one),
 *  - the registry id seeds rotation, dash rhythms, constellation
 *    stars and glyph counts — so no two sigils ever coincide.
 *
 * Layered over the adjective's AI-painted context scene, each of the
 * 827 technologies carries its own unmistakable picture.
 */

/* Twelve cosmic hues — deliberately none of them plain blue/indigo. */
const HUES = [168, 152, 130, 95, 62, 45, 30, 18, 350, 325, 290, 268];

export function techHue(adjective: string): number {
  return HUES[fnv1a(adjective) % HUES.length];
}

interface Seed {
  a: number; // rotation
  b: number; // glyph variation
  c: number; // rhythm / counts
  d: number; // constellation
}

function seedOf(id: string): Seed {
  return {
    a: fnv1a(id + "rot") % 360,
    b: fnv1a(id + "glyph"),
    c: fnv1a(id + "rhythm"),
    d: fnv1a(id + "stars"),
  };
}

const dot = (x: number, y: number, r: number, key: string, o = 0.9) => (
  <circle key={key} cx={x} cy={y} r={r} fill="currentColor" opacity={o} />
);

const line = (x1: number, y1: number, x2: number, y2: number, key: string, w = 1.5, o = 0.85) => (
  <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} opacity={o} />
);

/* ------------------------------------------------------------------ */
/*  The twenty-five noun-archetype glyphs                              */
/* ------------------------------------------------------------------ */

function nounGlyph(noun: string, s: Seed): ReactNode {
  const g: ReactNode[] = [];
  const k = `g-${noun}`;

  switch (noun) {
    case "Resonator": {
      g.push(
        <circle key="c1" cx={50} cy={50} r={9} />,
        <circle key="c2" cx={50} cy={50} r={17} opacity={0.7} />,
        <circle key="c3" cx={50} cy={50} r={25} opacity={0.45} />,
        dot(50, 50, 2.4, "core")
      );
      for (let i = 0; i < 4; i++) {
        const ang = ((s.b % 90) + i * 90) * (Math.PI / 180);
        g.push(
          line(50 + Math.cos(ang) * 27, 50 + Math.sin(ang) * 27, 50 + Math.cos(ang) * 33, 50 + Math.sin(ang) * 33, `t${i}`)
        );
      }
      break;
    }
    case "Loom": {
      for (let i = 0; i < 5; i++) g.push(line(30 + i * 10, 26, 30 + i * 10, 74, `w${i}`, 1.2, 0.7));
      const amp = 2 + (s.c % 4);
      g.push(
        <path key="weft" d={`M26 ${36 + (s.b % 8)} Q38 ${36 + (s.b % 8) - amp} 50 ${36 + (s.b % 8)} T74 ${36 + (s.b % 8)}`} fill="none" />,
        <path key="weft2" d={`M26 ${60 - (s.b % 6)} Q38 ${60 - (s.b % 6) + amp} 50 ${60 - (s.b % 6)} T74 ${60 - (s.b % 6)}`} fill="none" opacity={0.7} />,
        <circle key="h1" cx={38} cy={20} r={3} fill="none" />,
        <circle key="h2" cx={62} cy={20} r={3} fill="none" />
      );
      break;
    }
    case "Chalice": {
      g.push(
        <path key="cup" d="M32 30 Q50 54 68 30" fill="none" />,
        line(50, 45, 50, 64, "stem"),
        <path key="base" d="M38 68 Q50 74 62 68" fill="none" />,
        dot(50, 20, 2.2, "star")
      );
      break;
    }
    case "Compass": {
      g.push(<circle key="ring" cx={50} cy={50} r={24} fill="none" />);
      for (let i = 0; i < 8; i++) {
        const ang = ((s.b % 45) + i * 45) * (Math.PI / 180);
        g.push(
          line(50 + Math.cos(ang) * 8, 50 + Math.sin(ang) * 8, 50 + Math.cos(ang) * 22, 50 + Math.sin(ang) * 22, `sp${i}`, 1.2, i % 2 ? 0.5 : 0.9)
        );
      }
      g.push(
        <path key="n" d="M50 22 L54 30 L50 38 L46 30 Z" fill="none" />,
        dot(50, 50, 2, "hub")
      );
      break;
    }
    case "Lattice": {
      for (let r = 0; r < 3; r++) {
        const y = 32 + r * 14;
        g.push(<path key={`z${r}`} d={`M28 ${y} L36 ${y - 8} L44 ${y} L52 ${y - 8} L60 ${y} L68 ${y - 8} L76 ${y}`} fill="none" opacity={0.85 - r * 0.2} />);
      }
      g.push(line(30, 68, 70, 30, "d1", 1.2, 0.5), line(30, 30, 70, 68, "d2", 1.2, 0.5));
      break;
    }
    case "Bloom": {
      const petals = 6 + (s.b % 3);
      for (let i = 0; i < petals; i++) {
        g.push(
          <ellipse key={`p${i}`} cx={50} cy={31} rx={6} ry={13} fill="none" transform={`rotate(${(i * 360) / petals + (s.c % 30)} 50 50)`} />
        );
      }
      g.push(<circle key="cc" cx={50} cy={50} r={4.5} fill="none" />, <circle key="co" cx={50} cy={50} r={36} fill="none" strokeDasharray="1 6" opacity={0.5} />);
      break;
    }
    case "Forge": {
      g.push(
        <path key="tri" d="M50 26 L70 64 L30 64 Z" fill="none" />,
        line(24, 71, 76, 71, "anvil", 2),
        dot(42, 18, 1.4, "s1"), dot(52, 14, 1.8, "s2"), dot(60, 20, 1.2, "s3")
      );
      break;
    }
    case "Lens": {
      g.push(
        <path key="vesica" d="M36 50 Q50 18 64 50 Q50 82 36 50 Z" fill="none" />,
        line(50, 16, 50, 84, "focal", 1.1, 0.45),
        dot(50, 24, 1.3, "r1"), dot(50, 76, 1.3, "r2")
      );
      break;
    }
    case "Harp": {
      const strings = 4 + (s.b % 4);
      g.push(
        <path key="frame" d="M30 74 Q28 30 64 22" fill="none" />,
        line(24, 76, 66, 76, "base", 2)
      );
      for (let i = 0; i < strings; i++) {
        const x = 34 + i * (30 / (strings - 1));
        g.push(line(x, 76, Math.min(62, x + 4), 26 + i * 3, `st${i}`, 1, 0.75));
      }
      break;
    }
    case "Vault": {
      const pts = (r: number) =>
        Array.from({ length: 7 }, (_, i) => {
          const a = ((s.b % 51) + (i * 360) / 7) * (Math.PI / 180);
          return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
        }).join(" ");
      g.push(
        <polygon key="o" points={pts(30)} fill="none" />,
        <polygon key="i" points={pts(17)} fill="none" opacity={0.7} />,
        dot(50, 50, 2.6, "k", 0.95)
      );
      break;
    }
    case "Seed": {
      const turns = 2.5;
      const steps = 40;
      const d = Array.from({ length: steps }, (_, i) => {
        const t = (i / (steps - 1)) * turns * 2 * Math.PI;
        const r = 3 + (i / steps) * 24;
        return `${i === 0 ? "M" : "L"}${50 + Math.cos(t + s.c) * r},${50 + Math.sin(t + s.c) * r}`;
      }).join(" ");
      g.push(
        <path key="sp" d={d} fill="none" />,
        <path key="l1" d="M46 22 Q40 12 30 14" fill="none" opacity={0.7} />,
        <path key="l2" d="M54 22 Q60 12 70 14" fill="none" opacity={0.7} />
      );
      break;
    }
    case "Bridge": {
      g.push(
        line(34, 30, 34, 66, "t1"), line(66, 30, 66, 66, "t2"),
        line(24, 66, 76, 66, "deck", 2),
        <path key="cat" d="M34 42 Q50 58 66 42" fill="none" />
      );
      for (let i = 1; i < 4; i++) {
        const x = 34 + i * 8;
        g.push(line(x, 42 + i * 2.6, x, 66, `h${i}`, 0.9, 0.5));
        g.push(line(100 - x, 42 + i * 2.6, 100 - x, 66, `h${i}r`, 0.9, 0.5));
      }
      break;
    }
    case "Kiln": {
      g.push(
        <rect key="ch" x={34} y={38} width={32} height={30} rx={4} fill="none" />,
        line(60, 38, 60, 26, "chim"),
        <path key="fl" d="M50 62 Q44 52 50 46 Q56 52 50 62" fill="none" />,
        dot(40, 32, 1.1, "v1", 0.6), dot(44, 30, 1.1, "v2", 0.6)
      );
      break;
    }
    case "Mirror": {
      g.push(
        <circle key="m" cx={50} cy={42} r={19} fill="none" />,
        <path key="glint" d="M42 34 Q48 30 54 32" fill="none" opacity={0.8} />,
        line(50, 61, 50, 78, "handle", 2.4),
        dot(50, 82, 2, "pommel")
      );
      break;
    }
    case "Cradle": {
      g.push(
        <path key="outer" d="M26 56 Q50 24 74 56" fill="none" />,
        <path key="inner" d="M34 56 Q50 36 66 56" fill="none" opacity={0.7} />,
        line(50, 58, 50, 66, "string", 1),
        dot(50, 69, 2, "star"),
        <path key="rocker" d="M28 72 Q50 80 72 72" fill="none" />
      );
      break;
    }
    case "Array": {
      g.push(<rect key="f" x={26} y={26} width={48} height={48} rx={8} fill="none" opacity={0.6} />);
      const active = s.b % 9;
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const x = 36 + c * 14, y = 36 + r * 14;
          g.push(idx === active ? <circle key={`n${idx}`} cx={x} cy={y} r={5} fill="none" /> : dot(x, y, 2, `n${idx}`, 0.8));
        }
      break;
    }
    case "Bell": {
      g.push(
        <path key="body" d="M36 58 Q36 34 50 30 Q64 34 64 58" fill="none" />,
        line(31, 58, 69, 58, "lip", 2),
        dot(50, 64, 2.2, "clapper"),
        <path key="s1" d="M26 44 Q19 50 26 58" fill="none" opacity={0.5} />,
        <path key="s2" d="M74 44 Q81 50 74 58" fill="none" opacity={0.5} />
      );
      break;
    }
    case "Garden": {
      g.push(line(26, 70, 74, 70, "ground", 1.6));
      const xs = [38, 50, 62];
      xs.forEach((x, i) => {
        const top = 36 + ((s.b + i * 5) % 8);
        g.push(
          <path key={`st${i}`} d={`M${x} 70 Q${x + (i - 1) * 3} ${52 + top / 2} ${x} ${top}`} fill="none" />,
          dot(x, top - 3, 1.8, `bl${i}`)
        );
        g.push(
          <path key={`lf${i}`} d={`M${x} ${top + 12} Q${x - 7} ${top + 8} ${x - 9} ${top + 14}`} fill="none" opacity={0.6} />,
          <path key={`lfr${i}`} d={`M${x} ${top + 16} Q${x + 7} ${top + 12} ${x + 9} ${top + 18}`} fill="none" opacity={0.6} />
        );
      });
      break;
    }
    case "Antenna": {
      g.push(
        line(50, 74, 50, 34, "mast"),
        dot(50, 30, 2.2, "tip"),
        <path key="a1" d="M40 40 Q33 50 40 60" fill="none" opacity={0.7} />,
        <path key="a2" d="M32 35 Q21 50 32 65" fill="none" opacity={0.45} />,
        <path key="a3" d="M60 40 Q67 50 60 60" fill="none" opacity={0.7} />,
        <path key="a4" d="M68 35 Q79 50 68 65" fill="none" opacity={0.45} />
      );
      break;
    }
    case "Chronometer": {
      g.push(<circle key="dial" cx={50} cy={52} r={26} fill="none" />);
      for (let i = 0; i < 12; i++) {
        const ang = (i * 30 * Math.PI) / 180;
        g.push(line(50 + Math.cos(ang) * 22, 52 + Math.sin(ang) * 22, 50 + Math.cos(ang) * 26, 52 + Math.sin(ang) * 26, `tk${i}`, 1.1, 0.6));
      }
      const hA = ((s.b % 12) * 30 - 90) * (Math.PI / 180);
      const mA = ((s.c % 60) * 6 - 90) * (Math.PI / 180);
      g.push(
        line(50, 52, 50 + Math.cos(hA) * 12, 52 + Math.sin(hA) * 12, "hour", 2),
        line(50, 52, 50 + Math.cos(mA) * 19, 52 + Math.sin(mA) * 19, "min", 1.2),
        dot(50, 52, 2, "pin"),
        dot(50, 22, 2.4, "crown")
      );
      break;
    }
    case "Choir": {
      g.push(
        <path key="a1" d="M34 60 Q50 44 66 60" fill="none" />,
        <path key="a2" d="M27 50 Q50 27 73 50" fill="none" opacity={0.7} />,
        <path key="a3" d="M20 40 Q50 10 80 40" fill="none" opacity={0.45} />,
        dot(38, 68, 1.6, "n1"), dot(50, 71, 1.9, "n2"), dot(62, 68, 1.6, "n3")
      );
      break;
    }
    case "Cistern": {
      g.push(
        <path key="jar" d="M35 30 Q28 50 35 66 Q50 74 65 66 Q72 50 65 30" fill="none" />,
        <path key="water" d="M37 50 Q44 55 50 50 Q57 45 63 50" fill="none" opacity={0.8} />,
        line(50, 22, 50, 26, "fall", 1),
        dot(50, 19, 1.6, "drop")
      );
      break;
    }
    case "Reliquary": {
      g.push(
        <polygon key="oct" points="40,22 60,22 72,40 72,60 60,78 40,78 28,60 28,40" fill="none" />,
        <path key="gem" d="M50 40 L58 50 L50 60 L42 50 Z" fill="none" />,
        line(50, 30, 50, 36, "r1", 1, 0.6), line(50, 64, 50, 70, "r2", 1, 0.6),
        line(34, 50, 40, 50, "r3", 1, 0.6), line(60, 50, 66, 50, "r4", 1, 0.6)
      );
      break;
    }
    case "Beacon": {
      g.push(
        <path key="tower" d="M42 70 L46 36 H54 L58 70 Z" fill="none" />,
        <path key="cap" d="M44 36 L50 26 L56 36" fill="none" />,
        line(36, 70, 64, 70, "base", 2),
        line(30, 30, 38, 34, "beam1", 1.4, 0.7), line(70, 30, 62, 34, "beam2", 1.4, 0.7),
        dot(50, 20, 1.8, "star")
      );
      break;
    }
    case "Plough": {
      const stars: [number, number][] = [
        [28, 40], [38, 36], [47, 39], [55, 44],
        [64, 46], [70, 56], [78, 62],
      ];
      g.push(
        <polyline key="line" points={stars.map((p) => p.join(",")).join(" ")} fill="none" opacity={0.6} />
      );
      stars.forEach((p, i) => g.push(dot(p[0], p[1], i === 1 ? 2.4 : 1.7, `st${i}`)));
      g.push(<path key="hor" d="M24 74 Q50 68 76 74" fill="none" opacity={0.4} />);
      break;
    }
    default:
      g.push(<circle key="fb" cx={50} cy={50} r={24} fill="none" />, dot(50, 50, 2, "c"));
  }

  return <g key={k} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{g}</g>;
}

/* ------------------------------------------------------------------ */
/*  The sigil                                                          */
/* ------------------------------------------------------------------ */

export function TechSigil({
  entry,
  className,
}: {
  entry: { id: string; noun: string; adjective: string };
  className?: string;
}) {
  const svg = useMemo(() => {
    const s = seedOf(entry.id);
    const hue = techHue(entry.adjective);
    const stars = 5 + (s.d % 4);
    const dash = `${1 + (s.c % 3)} ${4 + (s.d % 7)}`;
    const constell: ReactNode[] = [];
    for (let i = 0; i < stars; i++) {
      const ang = (s.a + i * 137.508) * (Math.PI / 180);
      const r = 39 + (s.c % 3);
      constell.push(
        dot(
          50 + Math.cos(ang) * r,
          50 + Math.sin(ang) * r,
          0.9 + ((s.d >> i) % 3) * 0.4,
          `cs${i}`,
          0.8
        )
      );
    }
    return (
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Entity sigil for ${entry.adjective} ${entry.noun}`}
        className={className}
        style={{ color: `hsl(${hue} 72% 70%)` }}
      >
        {/* colour field */}
        <circle cx={50} cy={50} r={35} fill="currentColor" opacity={0.05} />
        {/* counter-rotating registry rings */}
        <g transform={`rotate(${s.a} 50 50)`}>
          <circle cx={50} cy={50} r={44} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray={dash} opacity={0.5} />
          {constell}
        </g>
        <g transform={`rotate(${-s.a * 0.6} 50 50)`}>
          <circle cx={50} cy={50} r={40} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.3} />
        </g>
        {/* the noun-archetype glyph, kept upright */}
        {nounGlyph(entry.noun, s)}
      </svg>
    );
  }, [entry.id, entry.noun, entry.adjective, className]);

  return svg;
}
