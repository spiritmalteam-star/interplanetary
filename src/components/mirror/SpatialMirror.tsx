"use client";

/* ------------------------------------------------------------------ */
/*  THE SPATIAL ROOM — THE LIVING FIELD.                               */
/*                                                                     */
/*  The visitor plants one thought; the room answers with a field of   */
/*  living branches — suggestions, branches, creations, links,         */
/*  continuations and questions — each one a small star standing in    */
/*  the category's own light, growing in the category's own direction. */
/*                                                                     */
/*  THE CATEGORY LAW. One dropdown rules the whole field: choosing a   */
/*  category turns every branch toward that category's own direction  */
/*  (the cosmos bursts radially, the canopy grows upward, the story    */
/*  flows right, the lens folds in twins, the dream spirals down, the  */
/*  spirit rises narrow then wide, the craft weaves sideways) and      */
/*  dresses every branch in that category's own colour. The thought    */
/*  stays; only its weather changes.                                   */
/*                                                                     */
/*  THE FITTING LAW. The field reads the room it stands in: a tall     */
/*  stage lets the categories draw their full directions on an         */
/*  elliptical ring; a short stage gathers the first bloom into two    */
/*  staggered horizons above and below the seed, so no star ever       */
/*  crowds another and the room can never scroll sideways. Deeper      */
/*  generations fan out from their parent's own heading, always        */
/*  clamped inside the frame.                                          */
/*                                                                     */
/*  THE QUIET ROOM LAW. Nothing here moves by itself. No interval, no  */
/*  render loop, no physics: the field is drawn once, the branch       */
/*  positions are plain transforms, and the only motion is the CSS     */
/*  transition that carries the field from one category's weather to   */
/*  another, or the one rise a new branch makes when it is grown. The  */
/*  reduced-motion hand lays even that down.                           */
/*                                                                     */
/*  THE GENEROUS HAND LAW. Every node opens with a touch and offers    */
/*  its full thought; from any open node the visitor may grow deeper   */
/*  (three children in the field's direction). The field keeps at     */
/*  most ninety-six living branches — enough to wander, never enough   */
/*  to weigh a browser down.                                           */
/* ------------------------------------------------------------------ */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  CornerDownRight,
  Feather,
  HelpCircle,
  Link2,
  Palette,
  RotateCcw,
  Sparkles,
  Split,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE FIELD'S TYPES — the six kinds of star the field grows.         */
/* ------------------------------------------------------------------ */

type FieldNodeType =
  | "suggestion"
  | "branch"
  | "creation"
  | "link"
  | "continuation"
  | "question";

const TYPE_META: Record<
  FieldNodeType,
  { icon: LucideIcon; hue: string; label: string }
> = {
  suggestion: { icon: Sparkles, hue: "#fbbf24", label: "Suggestion" },
  branch: { icon: Split, hue: "#4ade80", label: "Branch" },
  creation: { icon: Palette, hue: "#f472b6", label: "Creation" },
  link: { icon: Link2, hue: "#38bdf8", label: "Link" },
  continuation: { icon: CornerDownRight, hue: "#a78bfa", label: "Continuation" },
  question: { icon: HelpCircle, hue: "#f87171", label: "Question" },
};

const ALL_TYPES: FieldNodeType[] = [
  "suggestion",
  "branch",
  "creation",
  "link",
  "continuation",
  "question",
];

/* ------------------------------------------------------------------ */
/*  THE FIELD'S CATEGORIES — one dropdown, one weather. Each category  */
/*  carries its own accent (the branches' colour), its companion light */
/*  and the direction the branches grow toward.                        */
/* ------------------------------------------------------------------ */

type CategoryKey =
  | "cosmos"
  | "nature"
  | "story"
  | "science"
  | "dream"
  | "spirit"
  | "craft";

interface FieldCategory {
  key: CategoryKey;
  label: string;
  accent: string;
  second: string;
  /** how the category's weather moves — spoken, not shown */
  drift: string;
}

const CATEGORIES: FieldCategory[] = [
  {
    key: "cosmos",
    label: "Cosmos",
    accent: "#a78bfa",
    second: "#22d3ee",
    drift: "a radiant burst in every direction",
  },
  {
    key: "nature",
    label: "Nature",
    accent: "#34d399",
    second: "#a3e635",
    drift: "a canopy growing toward the light",
  },
  {
    key: "story",
    label: "Story",
    accent: "#e6c887",
    second: "#fb7185",
    drift: "a river flowing to the right",
  },
  {
    key: "science",
    label: "Science",
    accent: "#22d3ee",
    second: "#a78bfa",
    drift: "twin paths folding upward",
  },
  {
    key: "dream",
    label: "Dream",
    accent: "#e879f9",
    second: "#fbbf24",
    drift: "a spiral drifting downward",
  },
  {
    key: "spirit",
    label: "Spirit",
    accent: "#eab308",
    second: "#fde68a",
    drift: "a fountain rising narrow, then wide",
  },
  {
    key: "craft",
    label: "Craft",
    accent: "#fb923c",
    second: "#2dd4bf",
    drift: "a lattice weaving from hand to hand",
  },
];

/* ------------------------------------------------------------------ */
/*  THE FIELD'S NODES — one branch is a thought with a place.          */
/* ------------------------------------------------------------------ */

interface FieldNode {
  id: number;
  parent: number | null;
  type: FieldNodeType;
  gen: number;
  text: string;
}

interface FieldPoint {
  x: number;
  y: number;
}

const MAX_NODES = 96;
const FIRST_BLOOM = 8;
const GROW_BLOOM = 3;

/* ------------------------------------------------------------------ */
/*  THE SEEDED HAND — one deterministic maker: the same seed, the      */
/*  same regrow, the same field. No hydration surprise, no drift.      */
/* ------------------------------------------------------------------ */

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length) % arr.length];

/* ------------------------------------------------------------------ */
/*  THE WORD BANKS — the field speaks from the house's own ink:        */
/*  imaginative nouns, textures and turns that weave the visitor's     */
/*  seed into every star it grows.                                     */
/* ------------------------------------------------------------------ */

const NOUNS = [
  "lantern-keeper", "tide-organ", "glass moth", "seed vault", "storm choir",
  "hour garden", "bone flute", "ember fox", "paper river", "salt cathedral",
  "moth library", "iron garden", "whisper foundry", "candle observatory",
  "cartographer's compass", "rain archive", "dawn kiln", "feather engine",
  "moon ledger", "quiet bell foundry", "velvet aqueduct", "tin astronomer",
  "harbor of small gods", "pocket glacier", "psalm of hinges", "clockmaker's meadow",
  "field of patient bells", "orchard of unfinished songs", "salt-miner's star chart",
  "wind that remembers names", "brass nightingale", "doorway of first snow",
  "archive of unspent light", "garden of folded maps", "cathedral of small tides",
] as const;

const ADJECTIVES = [
  "patient", "amber", "unwritten", "tidal", "midnight", "borrowed", "golden",
  "half-remembered", "unhurried", "salt-stung", "velvet", "iron", "wandering",
  "sun-warmed", "quiet", "restless", "moth-grey", "river-bright", "unspoken",
  "harrowed", "shimmering", "green-hidden", "ember-lit", "first-frost",
  "luminous", "grace-worn", "clockwork", "fathomless", "hand-bound",
] as const;

const VERBS = [
  "remember", "unfold", "hum", "wait", "listen", "shine", "drift", "answer",
  "unfold its wings", "keep its promise", "sing to the tide", "hold its breath",
  "count the hours", "gather the rain", "mend what tore", "carry the dawn",
  "learn the wind's name", "write in the frost", "trade shadows with the moon",
  "bloom out of season", "keep the ember alive", "fold the map anew",
] as const;

const TAILS = [
  "and see what answers", "before the tide turns", "once, and then again",
  "the way old friends do", "until the frost agrees", "where the map ends",
  "the way harbors wait", "while the hour listens", "as the ember remembers",
  "the way rivers keep their word",
] as const;

const IMAGE_TAILS = [
  "— the kind of light that makes maps honest",
  "— small, but impossible to put down",
  "— it hums when the house is asleep",
  "— half instrument, half doorway",
  "— it keeps one season of its own",
  "— built from everything the tide returned",
  "— it only works when nobody watches",
  "— the hinge of some larger weather",
] as const;

/* the visitor's own words stay inside every star: pull the seed's
   living nouns out and weave them through the bank */
function seedWords(seed: string): string[] {
  const words = seed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return [...new Set(words)].slice(0, 6);
}

function makeText(
  type: FieldNodeType,
  rng: () => number,
  seeds: readonly string[]
): string {
  const noun = pick(rng, NOUNS);
  const adj = pick(rng, ADJECTIVES);
  const verb = pick(rng, VERBS);
  const tail = pick(rng, TAILS);
  const image = pick(rng, IMAGE_TAILS);
  const s = seeds.length > 0 ? pick(rng, seeds) : pick(rng, ["thought", "wonder", "echo"]);
  switch (type) {
    case "suggestion":
      return pick(rng, [
        `Let the ${s} ${verb} — ${tail}.`,
        `Give the ${adj} ${noun} a voice, then listen ${tail}.`,
        `Turn the ${noun} toward the ${s}; keep the ${adj} half.`,
        `Start smaller: one ${adj} ${noun}, and let it ${verb}.`,
        `Ask the ${noun} what the ${s} forgot.`,
      ]);
    case "branch":
      return pick(rng, [
        `Split the thought — one half ${verb}s, the other keeps the ${adj} silence.`,
        `Two roads from here: the ${adj} one, and the one the ${noun} guards.`,
        `The ${s} forks at the ${noun}: take both, one after another.`,
        `Grow a limb toward the ${adj} ${noun} and let it ${verb}.`,
      ]);
    case "creation":
      return pick(rng, [
        `Make a small ${adj} ${noun} ${image}.`,
        `Compose the ${noun}'s hymn — one verse for every ${adj} hour.`,
        `Draw the map of the ${adj} ${noun}; leave one region blank ${tail}.`,
        `Build a tiny machine that lets the ${s} ${verb} ${tail}.`,
        `Invent the ${noun}'s quiet twin ${image}.`,
      ]);
    case "link":
      return pick(rng, [
        `This star ties back to the ${noun} at the root — the ${adj} thread still hums.`,
        `A hidden path joins the ${s} to the ${adj} ${noun}.`,
        `Same current, two rivers: the ${noun} remembers the ${s}.`,
        `Bind the ${adj} ${noun} to the seed; watch the field lean.`,
      ]);
    case "continuation":
      return pick(rng, [
        `The ${s} answered — and the ${noun} began to ${verb}…`,
        `Then the ${adj} ${noun} woke, and it ${tail}…`,
        `One page on, the ${noun} had already learned the ${s}'s name…`,
        `The field leans ${tail}: the ${adj} ${noun} stirs first…`,
      ]);
    case "question":
      return pick(rng, [
        `What if the ${noun} could ${verb} the ${s}?`,
        `Who taught the ${adj} ${noun} to ${verb}?`,
        `Where does the ${noun} keep its ${adj} secret?`,
        `What remains of the ${s} when the ${noun} forgets?`,
        `Is the ${adj} ${noun} a memory, or a promise ${tail}?`,
      ]);
  }
}

/* ------------------------------------------------------------------ */
/*  THE FIELD'S GEOMETRY — every category draws its own directions on  */
/*  the ring (a tall stage); the unit circle: 0° = right, -90° = up.   */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

const rad = (deg: number): number => (deg * Math.PI) / 180;

/** the category's own heading for a first-bloom star, in degrees */
function bloomHeading(cat: FieldCategory, index: number, count: number): number {
  const mid = (count - 1) / 2;
  switch (cat.key) {
    case "cosmos":
      /* the golden burst — evenly around the whole sky */
      return (index / count) * 360 - 90;
    case "nature":
      /* the canopy — everything reaches for the light */
      return -150 + (index / Math.max(1, count - 1)) * 120;
    case "story":
      /* the river — the tale flows to the right */
      return -60 + (index / Math.max(1, count - 1)) * 120;
    case "science": {
      /* the twin lens — mirrored pairs folding upward */
      const side = index % 2 === 0 ? 1 : -1;
      return -90 + side * (18 + Math.floor(index / 2) * 32);
    }
    case "dream":
      /* the spiral — a wide sweep that begins low and turns */
      return 30 + (index / count) * 300;
    case "spirit": {
      /* the fountain — narrow at the root, wide as it rises */
      const spread = 56;
      return -90 + (count === 1 ? 0 : ((index - mid) / mid) * (spread / 2));
    }
    case "craft":
      /* the lattice — stars weave out sideways from the seed */
      return (index % 2 === 0 ? -30 : 30) + Math.floor(index / 2) * 12;
  }
}

/* ------------------------------------------------------------------ */
/*  THE ROOM                                                           */
/* ------------------------------------------------------------------ */

export function SpatialMirror() {
  const t = useT();
  const reduceMotion = useReducedMotion();

  const [catKey, setCatKey] = useState<CategoryKey>("cosmos");
  const cat = useMemo(
    () => CATEGORIES.find((c) => c.key === catKey) ?? CATEGORIES[0],
    [catKey]
  );

  /* the field's frame — measured, never assumed (the field fits its
     own room by measure, so nothing can scroll sideways) */
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  /* the living field */
  const [seed, setSeed] = useState("");
  const [planted, setPlanted] = useState<string | null>(null);
  const [nodes, setNodes] = useState<FieldNode[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [regen, setRegen] = useState(0);
  const idRef = useRef(1);
  const [draftError, setDraftError] = useState(false);

  /* THE MEASURE — one observer, rAF-batched, disconnected on leave */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSize({ w: Math.round(box.width), h: Math.round(box.height) });
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  THE GROWING HANDS                                                */
  /* ---------------------------------------------------------------- */

  const growFrom = useCallback(
    (parent: FieldNode, count: number, rng: () => number, seeds: readonly string[]) => {
      setNodes((prev) => {
        if (prev.length >= MAX_NODES) return prev;
        const fresh: FieldNode[] = [];
        for (let i = 0; i < count && prev.length + fresh.length < MAX_NODES; i++) {
          /* the seed's first bloom offers every kind of star in turn —
             the double-mod keeps the walk safe even from a borrowed id */
          const type =
            parent.gen === 0
              ? ALL_TYPES[
                  (((parent.id + i) % ALL_TYPES.length) + ALL_TYPES.length) %
                    ALL_TYPES.length
                ]
              : pick(rng, ALL_TYPES.filter((ty) => ty !== parent.type));
          fresh.push({
            id: idRef.current++,
            parent: parent.id,
            type,
            gen: parent.gen + 1,
            text: makeText(type, rng, seeds),
          });
        }
        return [...prev, ...fresh];
      });
    },
    []
  );

  const plantSeed = useCallback(
    (thought: string) => {
      const clean = thought.trim().slice(0, 140);
      if (!clean) return;
      const seeds = seedWords(clean);
      const rng = mulberry32(hashString(`${clean}::${regen}`));
      const rootId = idRef.current++;
      const root: FieldNode = {
        id: rootId,
        parent: null,
        type: "suggestion",
        gen: 0,
        text: clean,
      };
      setNodes([root]);
      setOpenId(null);
      setPlanted(clean);
      /* the first bloom is grown from the root's own place — the
         borrowed id (-1) keeps the children tied to the seed's point */
      const first: FieldNode = { ...root, id: -1 };
      setTimeout(() => growFrom(first, FIRST_BLOOM, rng, seeds), 0);
    },
    [growFrom, regen]
  );

  const regrow = useCallback(() => {
    if (!planted) return;
    const nonce = regen + 1;
    setRegen(nonce);
    setOpenId(null);
    const seeds = seedWords(planted);
    const rng = mulberry32(hashString(`${planted}::${nonce}`));
    const rootId = idRef.current++;
    const root: FieldNode = {
      id: rootId,
      parent: null,
      type: "suggestion",
      gen: 0,
      text: planted,
    };
    setNodes([root]);
    const first: FieldNode = { ...root, id: -1 };
    setTimeout(() => growFrom(first, FIRST_BLOOM, rng, seeds), 0);
  }, [growFrom, planted, regen]);

  const growDeeper = useCallback(
    (node: FieldNode) => {
      const seeds = planted ? seedWords(planted) : [];
      const rng = mulberry32(
        hashString(`${planted ?? ""}::${node.id}::${nodes.length}::${regen}`)
      );
      growFrom(node, GROW_BLOOM, rng, seeds);
      setOpenId(null);
    },
    [growFrom, nodes.length, planted, regen]
  );

  const canGrowDeeper = nodes.length < MAX_NODES;

  /* ---------------------------------------------------------------- */
  /*  THE LAYOUT — pure measure. A tall stage draws the category's     */
  /*  full direction on an elliptical ring; a short stage gathers the  */
  /*  first bloom into two staggered horizons; deeper stars fan out    */
  /*  from their parent's own heading, always inside the frame.        */
  /* ---------------------------------------------------------------- */

  const layout = useMemo(() => {
    const points = new Map<number, FieldPoint>();
    const segs: { from: FieldPoint; to: FieldPoint; gen: number }[] = [];
    if (size.w < 80 || size.h < 80 || nodes.length === 0) return { points, segs };

    const origin: FieldPoint = { x: size.w / 2, y: size.h / 2 - 4 };
    const padX = 96;
    const padTop = 60;
    const padBottom = 116;
    const tall = size.h >= 460;
    const Rx = Math.max(120, size.w / 2 - padX);
    const Ry = Math.max(70, size.h / 2 - 96);
    const bandY = clamp(size.h * 0.24, 56, 132);

    points.set(nodes[0].id, origin);

    const byParent = new Map<number, FieldNode[]>();
    for (const n of nodes) {
      if (n.gen === 0) continue;
      const key = n.parent ?? -1;
      const arr = byParent.get(key) ?? [];
      arr.push(n);
      byParent.set(key, arr);
    }

    /* THE FIRST BLOOM — the seed's own constellation */
    const firstBloom = byParent.get(-1) ?? [];
    firstBloom.forEach((n, i) => {
      let p: FieldPoint;
      if (tall) {
        /* the ring — the category's full direction, drawn on an ellipse */
        const a = bloomHeading(cat, i, firstBloom.length);
        p = {
          x: clamp(origin.x + Math.cos(rad(a)) * Rx, padX, size.w - padX),
          y: clamp(origin.y + Math.sin(rad(a)) * Ry, padTop, size.h - padBottom),
        };
      } else {
        /* the horizons — staggered above and below the seed, spread wide */
        const top = i % 2 === 0;
        const per = Math.ceil(firstBloom.length / 2);
        const rowIdx = Math.floor(i / 2);
        const span = size.w - padX * 2;
        const x =
          padX +
          span * ((rowIdx + 0.5 + (top ? 0 : 0.5 / per)) / per);
        const y = origin.y + (top ? -bandY : bandY * 0.92);
        p = { x: clamp(x, padX, size.w - padX), y: clamp(y, padTop, size.h - padBottom) };
      }
      points.set(n.id, p);
      segs.push({ from: origin, to: p, gen: 1 });
    });

    /* THE DEEPER STARS — each one fans out from its parent's own
       heading, near enough to read, far enough to breathe. The clamp
       keeps them clear of the header's words and the soil's hands. */
    const ordered = nodes
      .filter((n) => n.gen > 1)
      .sort((a, b) => a.gen - b.gen);
    for (const n of ordered) {
      const siblings = byParent.get(n.parent ?? -1) ?? [n];
      const idx = Math.max(0, siblings.findIndex((s) => s.id === n.id));
      const parentPoint = points.get(n.parent ?? nodes[0].id) ?? origin;
      const mid = (siblings.length - 1) / 2;
      /* the fan opens around the direction the parent already faces */
      const outward =
        Math.atan2(parentPoint.y - origin.y, parentPoint.x - origin.x) *
        (180 / Math.PI);
      const genSpan = n.gen === 2 ? 38 : 30;
      const a = outward + (siblings.length === 1 ? 0 : (idx - mid) * genSpan);
      const dist = clamp(Math.min(size.w, size.h) * 0.2, 84, 128);
      const p = {
        x: clamp(parentPoint.x + Math.cos(rad(a)) * dist, padX + 14, size.w - padX - 14),
        y: clamp(parentPoint.y + Math.sin(rad(a)) * dist, padTop + 44, size.h - padBottom),
      };
      points.set(n.id, p);
      segs.push({ from: parentPoint, to: p, gen: n.gen });
    }

    return { points, segs };
  }, [cat, nodes, size.h, size.w]);

  /* the open node's own card — clamped inside the frame */
  const openNode = openId !== null ? nodes.find((n) => n.id === openId) ?? null : null;
  const cardStyle = useMemo<CSSProperties | null>(() => {
    if (!openNode || size.w < 80) return null;
    const p = layout.points.get(openNode.id);
    if (!p) return null;
    const cardW = 252;
    const cardH = 200;
    const left = clamp(p.x - cardW / 2, 10, Math.max(10, size.w - cardW - 10));
    const top = clamp(p.y + 30, 56, Math.max(56, size.h - cardH - 12));
    return { left, top, width: cardW };
  }, [layout.points, openNode, size.h, size.w]);

  /* ---------------------------------------------------------------- */
  /*  THE PAINT                                                        */
  /* ---------------------------------------------------------------- */

  const nodeMotion = reduceMotion
    ? undefined
    : "transform 520ms cubic-bezier(.22,.8,.36,1)";

  const groundStyle: CSSProperties = {
    background: `radial-gradient(ellipse 70% 55% at 50% 42%, color-mix(in srgb, ${cat.accent} 14%, transparent), transparent 68%), radial-gradient(ellipse 55% 45% at 82% 110%, color-mix(in srgb, ${cat.second} 9%, transparent), transparent 60%), radial-gradient(ellipse 45% 35% at 10% -8%, color-mix(in srgb, ${cat.accent} 7%, transparent), transparent 62%)`,
    transition: reduceMotion ? "none" : "background 600ms ease",
  };

  const linkPath = (from: FieldPoint, to: FieldPoint): string => {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cx = mx - dy * 0.14;
    const cy = my + dx * 0.14;
    return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  };

  const fieldReady = planted !== null && nodes.length > 0 && size.w > 80;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-testid="spatial-mirror"
      ref={frameRef}
    >
      {/* the category's own weather — two still lights, one breath */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={groundStyle} />

      {/* THE ROOM'S HEADER — the field's name, the category's hand, the regrow hand */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-2.5 sm:px-5 sm:pt-3">
        <div className="min-w-0 flex-1">
          <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("The Spatial Room")}
          </p>
          <h1 className="truncate text-[14px] font-semibold tracking-tight text-foreground sm:text-[15px]">
            {t("The Living Field")}
            {planted ? (
              <span className="ml-2 hidden font-normal text-muted-foreground md:inline">
                — {planted}
              </span>
            ) : null}
          </h1>
        </div>

        {/* THE CATEGORY HAND — one dropdown that turns the whole field
            toward the category's direction and dresses it in its colour */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="spatial-category"
              className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors duration-300 hover:bg-foreground/5"
              style={{
                borderColor: `color-mix(in srgb, ${cat.accent} 42%, transparent)`,
                color: cat.accent,
                background: `color-mix(in srgb, ${cat.accent} 10%, transparent)`,
              }}
              aria-label={t("The field's category")}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ background: cat.accent, boxShadow: `0 0 8px color-mix(in srgb, ${cat.accent} 70%, transparent)` }}
              />
              {t(cat.label)}
              <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[248px]">
            <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("Turn the field's weather")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CATEGORIES.map((c) => (
              <DropdownMenuItem
                key={c.key}
                onClick={() => setCatKey(c.key)}
                data-testid={`spatial-cat-${c.key}`}
                className="items-start gap-2.5 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ background: c.accent, boxShadow: `0 0 8px color-mix(in srgb, ${c.accent} 60%, transparent)` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-tight">{t(c.label)}</span>
                  <span className="block text-[10.5px] leading-snug text-muted-foreground">
                    {t(c.drift)}
                  </span>
                </span>
                {c.key === catKey ? (
                  <span className="mt-0.5 text-[10px] font-medium" style={{ color: c.accent }}>
                    {t("now")}
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* THE REGROW HAND — the same seed, a new field */}
        {planted ? (
          <button
            type="button"
            onClick={regrow}
            data-testid="spatial-regrow"
            aria-label={t("Regrow the field")}
            title={t("Regrow the field")}
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      {/* THE FIELD — one svg of living links beneath the stars */}
      {fieldReady && (
        <div className="absolute inset-0 z-10">
          {size.w > 80 && layout.segs.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={size.w}
              height={size.h}
              viewBox={`0 0 ${size.w} ${size.h}`}
              fill="none"
              aria-hidden="true"
            >
              {layout.segs.map((s, i) => (
                <path
                  key={i}
                  d={linkPath(s.from, s.to)}
                  stroke={cat.accent}
                  strokeOpacity={clamp(0.4 - s.gen * 0.05, 0.14, 0.4)}
                  strokeWidth={clamp(1.6 - s.gen * 0.16, 0.7, 1.6)}
                  strokeLinecap="round"
                  style={{ transition: reduceMotion ? "none" : "stroke 600ms ease" }}
                />
              ))}
            </svg>
          )}

          {/* the stars — plain transforms, no loops, no shadows chasing */}
          {nodes.map((n) => {
            const p = layout.points.get(n.id);
            if (!p) return null;
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            const isRoot = n.gen === 0;
            const open = n.id === openId;
            return (
              <div
                key={n.id}
                className="absolute left-0 top-0"
                style={{
                  transform: `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`,
                  transition: nodeMotion,
                  zIndex: open ? 18 : isRoot ? 14 : 12 - Math.min(6, n.gen),
                }}
              >
                <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : n.id)}
                    data-testid="spatial-node"
                    aria-expanded={open}
                    aria-label={`${t(meta.label)}: ${n.text.slice(0, 80)}`}
                    className={cn(
                      "focus-glow flex items-center justify-center rounded-full border bg-card/95 shadow-lg transition-[background-color,border-color,box-shadow] duration-300",
                      isRoot ? "size-12" : "size-9"
                    )}
                    style={{
                      borderColor: `color-mix(in srgb, ${isRoot ? cat.accent : meta.hue} ${open ? 75 : 45}%, transparent)`,
                      boxShadow: open
                        ? `0 0 0 4px color-mix(in srgb, ${meta.hue} 16%, transparent), 0 8px 22px -10px color-mix(in srgb, ${meta.hue} 55%, transparent)`
                        : undefined,
                    }}
                  >
                    <Icon
                      className={cn(isRoot ? "size-5" : "size-4")}
                      aria-hidden="true"
                      style={{ color: isRoot ? cat.accent : meta.hue }}
                    />
                  </button>
                  <span
                    className={cn(
                      "pointer-events-none max-w-[124px] break-words text-center text-[10.5px] leading-snug line-clamp-2 sm:max-w-[150px] sm:text-[11px]",
                      isRoot ? "font-medium text-foreground" : "text-foreground/75"
                    )}
                  >
                    {n.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* THE OPEN STAR'S CARD — the full thought, and the deeper hand */}
      {openNode && cardStyle ? (
        <div
          role="dialog"
          aria-label={t(TYPE_META[openNode.type].label)}
          data-testid="spatial-card"
          className="absolute z-20 rounded-2xl border hairline bg-[var(--glass-bg)] p-3.5 shadow-xl"
          style={cardStyle}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `color-mix(in srgb, ${TYPE_META[openNode.type].hue} 14%, transparent)`,
              }}
            >
              {(() => {
                const I = TYPE_META[openNode.type].icon;
                return <I className="size-3.5" style={{ color: TYPE_META[openNode.type].hue }} aria-hidden="true" />;
              })()}
            </span>
            <span className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">
              {t(TYPE_META[openNode.type].label)}
              {openNode.gen > 0 ? ` · ${t("depth")} ${openNode.gen}` : ""}
            </span>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label={t("Close")}
              className="focus-glow ml-auto flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-foreground/90">
            {openNode.text}
          </p>
          {canGrowDeeper ? (
            <button
              type="button"
              onClick={() => growDeeper(openNode)}
              data-testid="spatial-grow"
              className="focus-glow mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-300 hover:bg-foreground/5"
              style={{
                borderColor: `color-mix(in srgb, ${cat.accent} 42%, transparent)`,
                color: cat.accent,
              }}
            >
              <Split className="size-3.5" aria-hidden="true" />
              {t("Grow from here")}
            </button>
          ) : (
            <p className="mt-2.5 text-center text-[10.5px] text-muted-foreground">
              {t("The field stands full — ninety-six living branches.")}
            </p>
          )}
        </div>
      ) : null}

      {/* THE PLANTING HAND — the seed's own soil, always at hand */}
      <form
        className="absolute inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-5 sm:pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!seed.trim()) {
            setDraftError(true);
            return;
          }
          setDraftError(false);
          plantSeed(seed);
          setSeed("");
        }}
      >
        <div className="mx-auto w-full max-w-[560px]">
          {!planted ? (
            <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5">
              {[
                t("a city that dreams in tide"),
                t("the last cartographer of winds"),
                t("a garden that grows clocks"),
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => plantSeed(ex)}
                  data-testid="spatial-example"
                  className="focus-glow rounded-full border hairline bg-[var(--glass-bg)] px-3 py-1.5 text-[11.5px] italic text-muted-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          ) : null}
          <div
            className="flex items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)] px-2 py-1.5 shadow-lg"
            style={{
              borderColor: seed.trim()
                ? `color-mix(in srgb, ${cat.accent} 38%, transparent)`
                : undefined,
            }}
          >
            <Feather
              className="ml-1.5 size-4 shrink-0"
              aria-hidden="true"
              style={{ color: cat.accent }}
            />
            <input
              value={seed}
              onChange={(e) => {
                setSeed(e.target.value);
                setDraftError(false);
              }}
              maxLength={140}
              data-testid="spatial-seed"
              aria-label={t("Plant a thought")}
              placeholder={t("Plant a thought — the field will grow it…")}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={!seed.trim()}
              data-testid="spatial-plant"
              className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium text-background transition-opacity duration-200 disabled:opacity-35"
              style={{ background: cat.accent }}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("Plant")}
            </button>
          </div>
          <p
            className="mt-1.5 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70"
            aria-live="polite"
          >
            {draftError
              ? t("Whisper a thought first — even one word will do.")
              : planted
                ? t("Touch a star to open it · grow a branch deeper · turn the weather above")
                : t("Plant a thought and the field grows suggestions, branches, creations, links, continuations and questions")}
          </p>
        </div>
      </form>
    </div>
  );
}
