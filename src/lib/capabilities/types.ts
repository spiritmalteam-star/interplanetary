/* ------------------------------------------------------------------ */
/*  THE UNIVERSAL CAPABILITY CONTRACTS — Stage 1 of the engine.        */
/*                                                                     */
/*  Every specialized tool Mirror Entity may wield is registered as    */
/*  one contract: what it is, what it accepts and returns, where it    */
/*  runs, what it costs, how it reports progress and failure — and    */
/*  its HONEST status: available, unavailable, or disabled. The        */
/*  engine never claims an ability whose dependencies are not real.    */
/*  (Directive 02: "Treat these as capability contracts.")             */
/* ------------------------------------------------------------------ */

/** Where the capability's work actually happens. */
export type CapabilityRuntime =
  | "server" // the application server (LLM, TTS, video sky)
  | "browser" // the visitor's own device (canvas recording, assembly)
  | "server+browser"; // a workflow whose steps cross both

/** The honest cost of one invocation. */
export interface CapabilityCost {
  /** free = the house's own sky at conversation pace; metered = counts
   *  against the energy law; heavy = long jobs, GPU-grade behind it. */
  tier: "free" | "metered" | "heavy";
  note: string;
}

/** The contract every capability declares. */
export interface CapabilityContract {
  /** Unique id — dotted, stable, versioned by the field below. */
  id: string;
  name: string;
  description: string;
  /** The operations this capability supports. */
  operations: string[];
  /** The shape of what it accepts (a small TS type, validated at the door). */
  input: { kind: "object"; fields: Record<string, string> };
  /** The shape of what it returns. */
  output: { kind: "object"; fields: Record<string, string> };
  /** Permissions a caller needs before this may run. */
  permissions: string[];
  runtime: CapabilityRuntime;
  /** What must truly exist for this to work (services, browser APIs). */
  dependencies: string[];
  hardware: "cpu" | "gpu-behind-service";
  cost: CapabilityCost;
  timeoutMs: number;
  /** Whether progress reporting is part of the contract. */
  progress: boolean;
  cancellable: boolean;
  retries: number;
  version: string;
  status: "available" | "unavailable" | "disabled";
  /** Why an unavailable or disabled capability stands as it does —
   *  always the truth, never a placeholder promise. */
  note?: string;
}

/** A step inside a workflow plan — one capability invocation. */
export interface WorkflowStep {
  id: string;
  capability: string;
  title: string;
  /** Where the step runs: server routes drive themselves; browser
   *  steps are driven by the visitor's own studio. */
  runner: "server" | "browser";
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  note?: string;
}

/** A planned workflow — Understand → Plan → Select → Execute → Validate → Connect. */
export interface WorkflowPlan {
  workflow: string;
  title: string;
  synopsis: string;
  steps: WorkflowStep[];
  /** The storyboard for video workflows (scenes carry their own specs). */
  scenes?: VideoSceneSpec[];
}

/** One scene of a planned video — grounded in the workflow's own words. */
export interface VideoSceneSpec {
  id: string;
  heading: string;
  /** The words the house's voice will speak over this scene. */
  narration: string;
  /** The few words printed on screen. */
  onScreenText: string;
  /** Which registered scene template renders this scene. */
  visual: {
    template:
      | "spiral"
      | "wavefield"
      | "helix"
      | "orbits"
      | "pyramids"
      | "neural"
      | "lattice"
      | "blueprint"
      | "curves";
    labels: string[];
    accent: string;
  };
  /** For the generative mode: the clip prompt (and its task result). */
  clipPrompt?: string;
  clipTaskId?: string;
  clipUrl?: string;
}

/** The input the video workflow accepts. */
export interface VideoWorkflowInput {
  topic: string;
  /** How many scenes to plan (3–6; the film stays 15–40 seconds). */
  sceneCount?: number;
  /** "motion" = programmatic scenes (guaranteed); "generative" = one
   *  sky-made clip per scene (slower, metered, experimental). */
  mode?: "motion" | "generative";
  /** The conversation the making was born from. */
  sourceConvId?: string;
  sourceBranch?: string;
  narrationVoice?: string;
}
