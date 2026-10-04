"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import type { SceneKind } from "@/lib/data/scope-notes";

/* ------------------------------------------------------------------ */
/*  INK SCENES — the drawn 3D animations of the note stickers.         */
/*  Each scene is a small perspective stage rendered in the window's   */
/*  own ink (var(--scope-a)): pure CSS-3D, monochrome, breathing.      */
/*  They visualize the information a note carries — never decorate it. */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

/** The window's ink at a given strength. */
const mix = (pct: number) =>
  `color-mix(in srgb, var(--scope-a) ${pct}%, transparent)`;

/* ----------------------------- the stage --------------------------- */

/** A small perspective stage every scene is drawn upon. */
function Stage({
  children,
  tilt = 0,
}: {
  children: React.ReactNode;
  tilt?: number;
}) {
  return (
    <div
      className="relative h-[118px] w-full overflow-hidden rounded-lg border hairline"
      style={{
        perspective: "620px",
        background: `color-mix(in srgb, var(--scope-a) 4%, transparent)`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ transform: tilt ? `rotateX(${tilt}deg)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

/** Centers children in the stage, preserving 3d. */
function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
      {children}
    </div>
  );
}

/* --------------------------- the scenes ---------------------------- */

/** terms — floating glyph tiles around a humming line. */
function TermsScene() {
  const tiles: { g: string; x: number; y: number; z: number }[] = [
    { g: "Σ", x: -64, y: -22, z: 18 },
    { g: "✦", x: 58, y: -26, z: -14 },
    { g: "◉", x: -46, y: 26, z: -20 },
    { g: "⚛", x: 52, y: 24, z: 16 },
  ];
  return (
    <Stage>
      <Center>
        <motion.span
          className="absolute h-px w-44"
          style={{
            background: `linear-gradient(90deg, transparent, ${mix(70)}, transparent)`,
          }}
          animate={{ scaleX: [0.65, 1, 0.65], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {tiles.map((tile, i) => (
          <motion.span
            key={i}
            className="absolute flex size-7 items-center justify-center rounded-[5px] border text-[12px] text-[var(--scope-a)]"
            style={{
              left: `calc(50% + ${tile.x - 14}px)`,
              top: `calc(50% + ${tile.y - 14}px)`,
              borderColor: mix(35),
              background: mix(6),
              z: tile.z,
            }}
            animate={{ y: [0, -7, 0], rotateY: [-14, 14, -14] }}
            transition={{
              duration: 3.1 + i * 0.65,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {tile.g}
          </motion.span>
        ))}
      </Center>
    </Stage>
  );
}

/** feed — a ring of nodes passing their pulse to the center. */
function FeedScene() {
  const nodes: [number, number][] = [
    [0, -36],
    [36, 0],
    [0, 36],
    [-36, 0],
  ];
  return (
    <Stage>
      <Center>
        <div className="relative size-28 [transform-style:preserve-3d]">
          {nodes.map(([x, y], i) => (
            <span
              key={`l-${i}`}
              className="absolute h-px"
              style={{
                left: `calc(50% + ${x * 0.5}px)`,
                top: `calc(50% + ${y * 0.5}px)`,
                width: Math.abs(x) > Math.abs(y) ? 36 : 1,
                height: Math.abs(x) > Math.abs(y) ? 1 : 36,
                background: mix(24),
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          {nodes.map(([x, y], i) => (
            <motion.span
              key={`p-${i}`}
              className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
              style={{ background: mix(85) }}
              animate={{
                x: [x * 0.86, 0],
                y: [y * 0.86, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.9,
                repeat: Infinity,
                ease: "easeIn",
                delay: i * 0.48,
              }}
            />
          ))}
          {nodes.map(([x, y], i) => (
            <motion.span
              key={`n-${i}`}
              className="absolute size-2.5 rounded-full border"
              style={{
                left: `calc(50% + ${x - 5}px)`,
                top: `calc(50% + ${y - 5}px)`,
                borderColor: mix(55),
                background: mix(8),
              }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          ))}
          <motion.span
            className="absolute left-1/2 top-1/2 size-4 rounded-full"
            style={{
              background: mix(65),
              x: "-50%",
              y: "-50%",
            }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </Center>
    </Stage>
  );
}

/** field — ripples widening across a foreign perception ground. */
function FieldScene() {
  return (
    <Stage tilt={16}>
      <Center>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute size-16 rounded-full border"
            style={{ borderColor: mix(40) }}
            animate={{ scale: [0.35, 2], opacity: [0.75, 0] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 1.05,
            }}
          />
        ))}
        <motion.span
          className="absolute size-2.5 rounded-full"
          style={{ background: mix(80) }}
          animate={{ scale: [1, 1.45, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span
          className="absolute h-px w-36"
          style={{
            top: "calc(50% + 44px)",
            left: "calc(50% - 72px)",
            background: `linear-gradient(90deg, transparent, ${mix(35)}, transparent)`,
          }}
        />
      </Center>
    </Stage>
  );
}

/** lenses — stacked discs grinding their own worlds. */
function LensesScene() {
  return (
    <Stage>
      <Center>
        <div
          className="relative size-24"
          style={{ transform: "rotateX(62deg)", transformStyle: "preserve-3d" }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: mix(28 + i * 16),
                z: (i - 1) * 17,
              }}
              animate={{ rotate: i % 2 ? -360 : 360 }}
              transition={{
                duration: 7 + i * 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <span
                className="absolute left-1/2 top-0 size-1 rounded-full"
                style={{
                  background: mix(85),
                  transform: "translate(-50%, -50%)",
                }}
              />
            </motion.span>
          ))}
          <span
            className="absolute left-1/2 top-1/2 h-[52px] w-px"
            style={{
              background: mix(30),
              transform: "translate(-50%, -50%) rotateX(-62deg)",
            }}
          />
        </div>
      </Center>
    </Stage>
  );
}

/** foundry — droplets poured into the breathing vessel. */
function FoundryScene() {
  return (
    <Stage>
      <Center>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute top-2 size-1.5 rounded-full"
            style={{ left: `${40 + i * 7}%`, background: mix(80) }}
            animate={{ y: [0, 54], opacity: [0, 1, 0], scaleY: [1, 1.7] }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
              ease: "easeIn",
              delay: i * 0.42,
            }}
          />
        ))}
        <motion.span
          className="absolute bottom-3 h-9 w-20 rounded-b-full rounded-t-md border"
          style={{ borderColor: mix(45) }}
          animate={{ scaleY: [1, 1.08, 1] }}
          transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute bottom-4 h-4 w-14 rounded-full"
          style={{ background: mix(20) }}
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
        />
      </Center>
    </Stage>
  );
}

/** gears — the invisible engines, opened on the bench. */
function GearsScene() {
  return (
    <Stage>
      <Center>
        <div
          className="relative size-28"
          style={{ transform: "rotateX(56deg)", transformStyle: "preserve-3d" }}
        >
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-dashed"
            style={{ borderColor: mix(50) }}
            animate={{ rotate: 360 }}
            transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-4 rounded-full border-2 border-dashed"
            style={{ borderColor: mix(38) }}
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute right-0 top-1 size-9 rounded-full border-2 border-dashed"
            style={{ borderColor: mix(30) }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 size-3 rounded-full"
            style={{
              background: mix(70),
              x: "-50%",
              y: "-50%",
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </Center>
    </Stage>
  );
}

/** waves — an undulating plane of possibility. */
function WavesScene() {
  const cols = 9;
  const rows = 4;
  return (
    <Stage tilt={50}>
      <Center>
        <div
          className="grid [transform-style:preserve-3d]"
          style={{ gridTemplateColumns: `repeat(${cols}, 10px)`, gap: "7px 9px" }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return (
              <motion.span
                key={i}
                className="size-1 rounded-full"
                style={{ background: mix(72) }}
                animate={{ z: [0, 13, 0], opacity: [0.45, 1, 0.45] }}
                transition={{
                  duration: 2.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (col + row) * 0.28,
                }}
              />
            );
          })}
        </div>
      </Center>
    </Stage>
  );
}

/** planes — the same object resting on many parallel layers. */
function PlanesScene() {
  return (
    <Stage>
      <Center>
        <div
          className="relative size-32"
          style={{ transform: "rotateX(56deg)", transformStyle: "preserve-3d" }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-x-1 top-1/2 h-10 -translate-y-1/2 rounded-md border"
              style={{
                borderColor: mix(26 + i * 13),
                background: mix(4),
                z: i * 19,
              }}
              animate={{ x: [0, i % 2 ? 7 : -7, 0] }}
              transition={{
                duration: 4.2 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span
                className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
                style={{
                  background: mix(72),
                  transform: "translate(-50%, -50%)",
                }}
              />
            </motion.span>
          ))}
        </div>
      </Center>
    </Stage>
  );
}

/** network — the web beneath, decisions threading without brains. */
const NET_NODES: [number, number][] = [
  [-46, -26],
  [38, -34],
  [4, 4],
  [-34, 30],
  [44, 22],
];
const NET_EDGES: [number, number][] = [
  [0, 2],
  [1, 2],
  [2, 3],
  [1, 4],
  [0, 3],
];
function NetworkScene() {
  return (
    <Stage>
      <Center>
        <div className="relative size-32 [transform-style:preserve-3d]">
          {NET_EDGES.map(([a, b], i) => {
            const [ax, ay] = NET_NODES[a];
            const [bx, by] = NET_NODES[b];
            const cx = (ax + bx) / 2;
            const cy = (ay + by) / 2;
            const len = Math.hypot(bx - ax, by - ay);
            const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
            return (
              <span
                key={`e-${i}`}
                className="absolute h-px"
                style={{
                  left: `calc(50% + ${cx}px)`,
                  top: `calc(50% + ${cy}px)`,
                  width: len,
                  background: mix(22),
                  transform: `translate(-50%, -50%) rotate(${ang}deg)`,
                }}
              />
            );
          })}
          {[0, 1, 2].map((k) => {
            const [a, b] = NET_EDGES[k];
            const [ax, ay] = NET_NODES[a];
            const [bx, by] = NET_NODES[b];
            return (
              <motion.span
                key={`p-${k}`}
                className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
                style={{ background: mix(85) }}
                animate={{ x: [ax, bx], y: [ay, by], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: k * 0.85,
                }}
              />
            );
          })}
          {NET_NODES.map(([x, y], i) => (
            <motion.span
              key={`n-${i}`}
              className="absolute size-2 rounded-full border"
              style={{
                left: `calc(50% + ${x - 4}px)`,
                top: `calc(50% + ${y - 4}px)`,
                borderColor: mix(52),
                background: i === 2 ? mix(55) : mix(6),
              }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.34,
              }}
            />
          ))}
        </div>
      </Center>
    </Stage>
  );
}

/** pyramid — the instrument of stone holding its note. */
function PyramidScene() {
  return (
    <Stage tilt={12}>
      <Center>
        <motion.svg
          viewBox="0 0 64 56"
          className="h-[76px] w-[86px]"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <path
            d="M32 5 L59 51 L5 51 Z"
            fill={mix(5)}
            stroke={mix(65)}
            strokeWidth="1.2"
          />
          <path
            d="M32 5 L32 51"
            stroke={mix(32)}
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <path
            d="M5 51 L59 51"
            stroke={mix(55)}
            strokeWidth="1"
          />
        </motion.svg>
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute size-20 rounded-full border"
            style={{
              borderColor: mix(38),
              top: "calc(50% + 26px)",
              left: "calc(50% - 40px)",
            }}
            animate={{ scale: [0.5, 1.5], opacity: [0.6, 0] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 1.4,
            }}
          />
        ))}
      </Center>
    </Stage>
  );
}

/** helix — the thread of life, computing in four letters. */
function HelixScene() {
  const rows = 9;
  return (
    <Stage>
      <Center>
        <motion.div
          className="relative h-[100px] w-[70px]"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: rows }).map((_, i) => {
            const y = 4 + i * 11;
            const x = Math.sin(i * 0.78) * 26;
            return (
              <div
                key={i}
                className="absolute left-1/2"
                style={{
                  top: y,
                  transformStyle: "preserve-3d",
                }}
              >
                <span
                  className="absolute size-1.5 rounded-full"
                  style={{
                    left: x - 3,
                    background: mix(88),
                  }}
                />
                <span
                  className="absolute size-1.5 rounded-full"
                  style={{
                    left: -x - 3,
                    background: mix(55),
                  }}
                />
                {i % 2 === 0 && Math.abs(x) > 6 && (
                  <span
                    className="absolute h-px"
                    style={{
                      left: Math.min(-x, x),
                      width: 2 * Math.abs(x),
                      top: 2.5,
                      background: mix(24),
                    }}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </Center>
    </Stage>
  );
}

/** fold — the chain folding itself into a machine. */
function FoldScene() {
  const seg = (
    depth: number,
    delay: number,
    fold: number
  ): React.ReactNode => (
    <motion.div
      className="absolute left-full top-0 size-full"
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
      }}
      animate={{ rotateY: [0, fold, 0] }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
        times: [0, 0.42, 1],
      }}
    >
      <span
        className="absolute inset-0 border"
        style={{
          borderColor: mix(46),
          background: mix(6 + depth * 5),
        }}
      />
      {depth < 2 ? seg(depth + 1, delay + 0.35, -fold * 0.9) : null}
    </motion.div>
  );
  return (
    <Stage>
      <Center>
        <motion.div
          className="relative size-11 w-14"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
          }}
          animate={{ rotateY: [0, 62, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.42, 1],
          }}
        >
          <span
            className="absolute inset-0 border"
            style={{ borderColor: mix(46), background: mix(6) }}
          />
          {seg(1, 0.35, 78)}
        </motion.div>
      </Center>
    </Stage>
  );
}

/** fleet — couriers riding their orbits around the harbor. */
function FleetScene() {
  return (
    <Stage>
      <Center>
        <div className="relative size-28 [transform-style:preserve-3d]">
          {(
            [
              { inset: "inset-4", dur: 6.5, tilt: 64, reverse: false },
              { inset: "inset-0", dur: 11, tilt: 56, reverse: true },
            ] as const
          ).map((ring, i) => (
            <span
              key={i}
              className={`absolute ${ring.inset}`}
              style={{
                transform: `rotateX(${ring.tilt}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <motion.span
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: mix(40) }}
                animate={{ rotate: ring.reverse ? -360 : 360 }}
                transition={{
                  duration: ring.dur,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <span
                  className="absolute left-1/2 top-0 size-1.5 rounded-full"
                  style={{
                    background: mix(90),
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </motion.span>
            </span>
          ))}
          <motion.span
            className="absolute left-1/2 top-1/2 size-5 rounded-full border"
            style={{
              borderColor: mix(60),
              background: mix(16),
              x: "-50%",
              y: "-50%",
            }}
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </Center>
    </Stage>
  );
}

/** loop — the circuit where tissue answers code. */
function LoopScene() {
  return (
    <Stage>
      <Center>
        <div
          className="relative h-20 w-40"
          style={{ transform: "rotateX(46deg)", transformStyle: "preserve-3d" }}
        >
          <span
            className="absolute inset-0 rounded-xl border"
            style={{ borderColor: mix(42) }}
          />
          <motion.span
            className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
            style={{ background: mix(90) }}
            animate={{
              x: [-72, 72, 72, -72, -72],
              y: [-32, -32, 32, 32, -32],
            }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "linear" }}
          />
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 size-3 rounded-[4px] border"
              style={{
                [i === 0 ? "left" : "right"]: -6,
                borderColor: mix(62),
                background: mix(14),
                y: "-50%",
              }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.15,
              }}
            />
          ))}
        </div>
      </Center>
    </Stage>
  );
}

/** vote — the ballots of the real, flipping in the dark. */
function VoteScene() {
  const glyphs = ["✦", "◉", "Σ", "⚛", "✳", "◬"];
  return (
    <Stage>
      <Center>
        <div
          className="grid grid-cols-3 gap-2"
          style={{ transform: "rotateX(26deg)", transformStyle: "preserve-3d" }}
        >
          {glyphs.map((g, i) => (
            <motion.span
              key={i}
              className="relative size-8 rounded-[5px] border"
              style={{
                borderColor: mix(34),
                background: mix(5),
                transformStyle: "preserve-3d",
              }}
              animate={{ rotateY: [0, 180, 180, 0] }}
              transition={{
                duration: 5.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.85,
                times: [0, 0.25, 0.75, 1],
              }}
            >
              <span
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden" }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-[11px] text-[var(--scope-a)]"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {g}
              </span>
            </motion.span>
          ))}
        </div>
      </Center>
    </Stage>
  );
}

/** orbit — the machinery beneath: one core, two crossings. */
function OrbitScene() {
  return (
    <Stage>
      <Center>
        <motion.div
          className="relative size-24"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: [60, 66, 60] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: mix(32) }}
          />
          <motion.span
            className="absolute inset-0 [transform-style:preserve-3d]"
            animate={{ rotate: 360 }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute left-1/2 top-0 size-1.5 rounded-full"
              style={{
                background: mix(90),
                transform: "translate(-50%, -50%)",
              }}
            />
          </motion.span>
          <span
            className="absolute inset-3 rounded-full border border-dashed"
            style={{ borderColor: mix(26) }}
          />
          <motion.span
            className="absolute inset-3 [transform-style:preserve-3d]"
            animate={{ rotate: -360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute left-1/2 top-0 size-1 rounded-full"
              style={{
                background: mix(65),
                transform: "translate(-50%, -50%)",
              }}
            />
          </motion.span>
          <motion.span
            className="absolute left-1/2 top-1/2 size-3.5 rounded-full"
            style={{
              background: mix(72),
              x: "-50%",
              y: "-50%",
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </Center>
    </Stage>
  );
}

/* --------------------------- the registry -------------------------- */

export const SCENES: Record<SceneKind, ComponentType> = {
  terms: TermsScene,
  feed: FeedScene,
  field: FieldScene,
  lenses: LensesScene,
  foundry: FoundryScene,
  gears: GearsScene,
  waves: WavesScene,
  planes: PlanesScene,
  network: NetworkScene,
  pyramid: PyramidScene,
  helix: HelixScene,
  fold: FoldScene,
  fleet: FleetScene,
  loop: LoopScene,
  vote: VoteScene,
  orbit: OrbitScene,
};

/** Easing shared by the sticker entrances. */
export const STICKER_EASE = EASE;
