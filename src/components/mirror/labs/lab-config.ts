import {
  AlertTriangle,
  Ban,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Cog,
  Flag,
  Lightbulb,
  Repeat,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  THE LABS' OWN SHELF — one honest config for every lab in the       */
/*  house: the Invention Lab (the forge's bench, thick blue) and the   */
/*  Manifesting Lab (the manifest room's path, thick dark pink).       */
/*  Both benches are the same shared canvas wearing different lights   */
/*  and different words — the kinds, the templates, the labels.        */
/*                                                                     */
/*  THE LIGHT'S LAW — a lab never hardcodes its own hue: the canvas,   */
/*  the pills and the glass surfaces all style against                 */
/*  `var(--scope-a)`, the accent the workspace frame already wears     */
/*  (invent #1d4ed8 · manifest #be185d). The only colors a lab owns    */
/*  are its kinds' accents and the statuses' own truth.                */
/* ------------------------------------------------------------------ */

/** the three standings of a piece — the small cycle every node wears */
export type LabNodeStatus = "draft" | "active" | "done";

export const LAB_STATUSES: LabNodeStatus[] = ["draft", "active", "done"];

export const STATUS_META: Record<
  LabNodeStatus,
  { label: string; icon: LucideIcon; color: string }
> = {
  /* the lab's own standing light dresses the active piece */
  draft: { label: "Draft", icon: CircleDashed, color: "#9aa0a6" },
  active: {
    label: "Active",
    icon: CircleDot,
    color: "var(--scope-a, var(--gd))",
  },
  done: { label: "Done", icon: CircleCheck, color: "#34d399" },
};

export type LabPieceData = {
  kind: string;
  /** the piece's name — short, plain */
  name: string;
  /** the piece's note — what it means, how it works, what it proves */
  note: string;
  /** the piece's standing on the bench */
  status: LabNodeStatus;
};

export type LabKindMeta = { label: string; icon: LucideIcon; accent: string };

/** a starter blueprint — a small pre-seeded graph, laid in one tap */
export type LabTemplate = {
  id: string;
  label: string;
  hint: string;
  nodes: { kind: string; name: string; dx: number; dy: number }[];
  /** bonds between template nodes, by index (source supports target) */
  bonds: [number, number][];
};

export type LabConfig = {
  /** the lab's own name — "invent" | "manifest" */
  id: "invent" | "manifest";
  /** the device's own keep for this lab's bench */
  draftKey: string;
  /** the word the lab calls its surface — "bench" | "path" */
  surfaceWord: string;
  kinds: Record<string, LabKindMeta>;
  kindOrder: string[];
  defaultKind: string;
  defaultNames: Record<string, string>;
  maxNodes: number;
  maxEdges: number;
  /** the empty surface's own invitation */
  empty: { title: string; body: string };
  /** the toolbar's labels */
  toolbar: {
    add: string;
    templates: string;
    map: string;
    export: string;
    exportFile: string;
    clear: string;
    clearArmed: string;
    draftLamp: string;
    summary: string;
    askBench: string;
  };
  /** the bench summary panel's own headings */
  summary: {
    title: string;
    pieces: string;
    bonds: string;
    ask: string;
    filter: string;
    empty: string;
  };
  /** the node editor's ask hand */
  askPiece: string;
  /** the chat-side lay chips (Lay it on the bench / the path) */
  lay: { chip: string; done: string; toast: string };
  /** the restore toast's body */
  restoreToast: string;
  /** test ids' prefix — "invention" keeps the forge's old ids */
  testPrefix: string;
  templates: LabTemplate[];
};

/* ------------------------------------------------------------------ */
/*  THE INVENTION LAB — the forge's bench. Four kinds of pieces:       */
/*  idea amber · component lavender · evidence cyan · risk rose.       */
/* ------------------------------------------------------------------ */

export const INVENT_LAB: LabConfig = {
  id: "invent",
  draftKey: "mirror-invent-canvas-v1",
  surfaceWord: "bench",
  kinds: {
    idea: { label: "Idea", icon: Lightbulb, accent: "#fcd34d" },
    component: { label: "Component", icon: Cog, accent: "#c4b5fd" },
    evidence: { label: "Evidence", icon: Search, accent: "#67e8f9" },
    risk: { label: "Risk", icon: AlertTriangle, accent: "#fb7185" },
  },
  kindOrder: ["idea", "component", "evidence", "risk"],
  defaultKind: "idea",
  defaultNames: {
    idea: "New idea",
    component: "New component",
    evidence: "New evidence",
    risk: "New risk",
  },
  maxNodes: 120,
  maxEdges: 240,
  empty: {
    title: "The bench is empty",
    body: "Add a spark — an idea, a component, a proof, a risk — and connect what supports what. Or lay down a starter blueprint.",
  },
  toolbar: {
    add: "Add piece",
    templates: "Blueprints",
    map: "The bench's small map",
    export: "Export",
    exportFile: "invention-lab.json",
    clear: "Clear the bench",
    clearArmed: "Tap again to erase the whole bench",
    draftLamp: "Draft · this device",
    summary: "The bench's summary",
    askBench: "Ask the Mirror about the bench",
  },
  summary: {
    title: "The bench",
    pieces: "pieces",
    bonds: "bonds",
    ask: "Ask the Mirror about the bench",
    filter: "Filter the bench…",
    empty: "No pieces match",
  },
  askPiece: "Ask about this piece",
  lay: {
    chip: "Lay it on the bench",
    done: "Laid on the bench",
    toast: "Laid on the bench — the lab is open.",
  },
  restoreToast:
    "The Invention Lab kept your bench on this device — nothing travels to a server.",
  testPrefix: "invention",
  templates: [
    {
      id: "simple-machine",
      label: "Simple machine",
      hint: "A spark, a mechanism, a frame — and the part that wears",
      nodes: [
        { kind: "idea", name: "The spark", dx: 0, dy: -120 },
        { kind: "component", name: "The mechanism", dx: -150, dy: 20 },
        { kind: "component", name: "The frame", dx: 150, dy: 20 },
        { kind: "risk", name: "The worn part", dx: 0, dy: 160 },
      ],
      bonds: [
        [1, 0],
        [2, 1],
        [3, 1],
      ],
    },
    {
      id: "process",
      label: "Process",
      hint: "A goal, three steps, and the check that proves it",
      nodes: [
        { kind: "idea", name: "The goal", dx: 0, dy: -140 },
        { kind: "component", name: "Step one", dx: -170, dy: 0 },
        { kind: "component", name: "Step two", dx: 0, dy: 0 },
        { kind: "component", name: "Step three", dx: 170, dy: 0 },
        { kind: "evidence", name: "The check", dx: 0, dy: 140 },
      ],
      bonds: [
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 3],
      ],
    },
    {
      id: "research-plan",
      label: "Research plan",
      hint: "A question, a method, what to observe — and the bias to watch",
      nodes: [
        { kind: "idea", name: "The question", dx: 0, dy: -130 },
        { kind: "component", name: "The method", dx: -150, dy: 10 },
        { kind: "evidence", name: "The observation", dx: 150, dy: 10 },
        { kind: "risk", name: "The bias", dx: 0, dy: 150 },
      ],
      bonds: [
        [1, 0],
        [2, 0],
        [3, 2],
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  THE MANIFESTING LAB — the manifest room's path. Four kinds:        */
/*  intention pink · milestone amber · practice teal · blocker rose.   */
/* ------------------------------------------------------------------ */

export const MANIFEST_LAB: LabConfig = {
  id: "manifest",
  draftKey: "mirror-manifest-canvas-v1",
  surfaceWord: "path",
  kinds: {
    intention: { label: "Intention", icon: Sparkles, accent: "#f9a8d4" },
    milestone: { label: "Milestone", icon: Flag, accent: "#fbbf24" },
    practice: { label: "Practice", icon: Repeat, accent: "#5eead4" },
    blocker: { label: "Blocker", icon: Ban, accent: "#fb7185" },
  },
  kindOrder: ["intention", "milestone", "practice", "blocker"],
  defaultKind: "intention",
  defaultNames: {
    intention: "New intention",
    milestone: "New milestone",
    practice: "New practice",
    blocker: "New blocker",
  },
  maxNodes: 120,
  maxEdges: 240,
  empty: {
    title: "The path is empty",
    body: "Lay down an intention, the milestones that mark it, the practices that carry it — and the blockers to be honest about. Or start from a blueprint.",
  },
  toolbar: {
    add: "Add piece",
    templates: "Blueprints",
    map: "The path's small map",
    export: "Export",
    exportFile: "manifesting-path.json",
    clear: "Clear the path",
    clearArmed: "Tap again to erase the whole path",
    draftLamp: "Draft · this device",
    summary: "The path's summary",
    askBench: "Ask the Mirror about the path",
  },
  summary: {
    title: "The path",
    pieces: "pieces",
    bonds: "bonds",
    ask: "Ask the Mirror about the path",
    filter: "Filter the path…",
    empty: "No pieces match",
  },
  askPiece: "Ask about this piece",
  lay: {
    chip: "Lay it on the path",
    done: "Laid on the path",
    toast: "Laid on the path — the lab is open.",
  },
  restoreToast:
    "The Manifesting Lab kept your path on this device — nothing travels to a server.",
  testPrefix: "manifest-lab",
  templates: [
    {
      id: "weekly-intention",
      label: "Weekly intention",
      hint: "One wish, one daily act, the first sign — and the old habit",
      nodes: [
        { kind: "intention", name: "This week I…", dx: 0, dy: -120 },
        { kind: "practice", name: "The small daily act", dx: -150, dy: 20 },
        { kind: "milestone", name: "The first sign", dx: 150, dy: 20 },
        { kind: "blocker", name: "The old habit", dx: 0, dy: 160 },
      ],
      bonds: [
        [1, 0],
        [0, 2],
        [3, 1],
      ],
    },
    {
      id: "milestone-ladder",
      label: "Milestone ladder",
      hint: "The wish, and the three marks that prove the walk",
      nodes: [
        { kind: "intention", name: "The wish", dx: 0, dy: -140 },
        { kind: "milestone", name: "First step", dx: 0, dy: -20 },
        { kind: "milestone", name: "Halfway", dx: 0, dy: 100 },
        { kind: "milestone", name: "The arrival", dx: 0, dy: 220 },
      ],
      bonds: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
    },
    {
      id: "daily-practice",
      label: "Daily practice",
      hint: "What I want, the morning and evening acts, one full week",
      nodes: [
        { kind: "intention", name: "What I want", dx: 0, dy: -140 },
        { kind: "practice", name: "Morning act", dx: -160, dy: 0 },
        { kind: "practice", name: "Evening act", dx: 160, dy: 0 },
        { kind: "milestone", name: "One full week", dx: 0, dy: 140 },
      ],
      bonds: [
        [1, 0],
        [2, 0],
        [3, 1],
        [3, 2],
      ],
    },
  ],
};

export const LAB_CONFIGS: Record<"invent" | "manifest", LabConfig> = {
  invent: INVENT_LAB,
  manifest: MANIFEST_LAB,
};

export function isLabStatus(v: unknown): v is LabNodeStatus {
  return v === "draft" || v === "active" || v === "done";
}
