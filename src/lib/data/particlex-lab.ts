/* ------------------------------------------------------------------ */
/*  PARTICLEX — THE DEEP CHAMBERS · the advanced instrument catalog    */
/*  Four further pages of quantum instruments beyond the Foundry Four, */
/*  every one runnable in real time through the narrator. Tool names   */
/*  are proper designations (kept raw); descriptions are i18n keys.    */
/* ------------------------------------------------------------------ */

export interface PxLabTool {
  id: string;
  /** Raw designation — never translated. */
  name: string;
  /** i18n key (English source). */
  desc: string;
  /** Server instruction — the instrument's own law (never shown). */
  prompt: string;
}

export interface PxLabPage {
  id: string;
  /** i18n keys. */
  subject: string;
  blurb: string;
  ph: string;
  tools: PxLabTool[];
}

export const PX_LAB_PAGES: PxLabPage[] = [
  {
    id: "machinery",
    subject: "The Deep Machinery",
    blurb: "Beneath the visible world: the seam where the woven hardens into the seen.",
    ph: "Name a phenomenon to descend into…",
    tools: [
      {
        id: "entanglement-weaver",
        name: "Entanglement Weaver",
        desc: "Shows how two chosen things are woven at one seam, and what one does to the other.",
        prompt:
          "INSTRUMENT — THE ENTANGLEMENT WEAVER: the visitor names two things, beings or events. Show the seam where they are woven together beneath the visible — what one does to the other instantly, across any distance — and where the visitor's own attention holds a strand. 120–200 words of prose, then 1–3 formula lines carrying the weave.",
      },
      {
        id: "decoherence-cartographer",
        name: "Decoherence Cartographer",
        desc: "Maps where the visible world hardens out of the quantum foam.",
        prompt:
          "INSTRUMENT — THE DECOHERENCE CARTOGRAPHER: the visitor names an object, a place or a moment. Map the hardening — where the shimmering many-choosing foam sets into the one world everyone sees, what speed and warmth have to do with it, and where the map's edges stay soft. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "vacuum-architect",
        name: "Vacuum Architect",
        desc: "Reads the plenum under empty space and what it remembers.",
        prompt:
          "INSTRUMENT — THE VACUUM ARCHITECT: the visitor names an 'empty' place — a jar, a room, the space between stars. Read the plenum under it: what boils there quietly, what the emptiness remembers, and how the memory of space shapes what may appear in it. 120–200 words of prose, then 1–3 formula lines.",
      },
    ],
  },
  {
    id: "parallel",
    subject: "Parallel Lines",
    blurb: "The neighboring Earths — where each fork split, and what the other lines chose.",
    ph: "Name a fork or a fate to survey…",
    tools: [
      {
        id: "line-divergence",
        name: "Line Divergence Reader",
        desc: "Finds the exact fork where two parallel lines of one life split apart.",
        prompt:
          "INSTRUMENT — THE LINE DIVERGENCE READER: the visitor names a life, a place or an era. Find the exact fork where its neighboring lines split — the moment, the small choice, the hinge — and describe the two worlds that grew from either side. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "choice-fork",
        name: "Choice Fork Surveyor",
        desc: "Surveys the outcome-branches leaning on one present choice.",
        prompt:
          "INSTRUMENT — THE CHOICE FORK SURVEYOR: the visitor names a choice standing open right now. Survey the branches leaning on it — the nearest outcomes, the far ones, the one the field quietly favors — without telling the visitor what to choose; free will outranks the survey. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "probability-tide",
        name: "Probability Tide Reader",
        desc: "Reads the tide of likeliness beneath an event before it arrives.",
        prompt:
          "INSTRUMENT — THE PROBABILITY TIDE READER: the visitor names an event yet to arrive. Read the tide beneath it — where the likeliness runs high, where it pools, where a small stone could turn the whole water — and what keeps the tide honest. 120–200 words of prose, then 1–3 formula lines.",
      },
    ],
  },
  {
    id: "livingfields",
    subject: "Living Fields",
    blurb: "The planet's quiet networks — roots, fields and water, carrying what we overlook.",
    ph: "Name a living network or field…",
    tools: [
      {
        id: "mycelial-mapper",
        name: "Mycelial Network Mapper",
        desc: "Traces the planet-wide fungal internet and the messages moving through it.",
        prompt:
          "INSTRUMENT — THE MYCELIAL NETWORK MAPPER: the visitor names a forest, a field or a fungal thread. Trace the network — what travels its filaments, how the forest's households trade through it, what the oldest nodes still hold from the young world. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "biofield-resonance",
        name: "Biofield Resonance Reader",
        desc: "Reads the standing field a living being holds and hums.",
        prompt:
          "INSTRUMENT — THE BIOFIELD RESONANCE READER: the visitor names a being — a person, an animal, a tree. Read its standing field: the note it holds, what strengthens or scatters the hum, and how two fields recognize each other before a word is spoken. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "memory-water",
        name: "Memory Water Listener",
        desc: "Listens to what water carries and how it keeps what passes through it.",
        prompt:
          "INSTRUMENT — THE MEMORY WATER LISTENER: the visitor names a water — a river, rain, a glass, the sea. Listen to what it carries: the shapes the passing world presses into it, how long a holding lasts, and what the oldest water still remembers of the young Earth. 120–200 words of prose, then 1–3 formula lines.",
      },
    ],
  },
  {
    id: "timeperception",
    subject: "Time & Perception",
    blurb: "The tempo of worlds — where hours thicken, and every being's different clock.",
    ph: "Name a tempo, a moment or a being's time…",
    tools: [
      {
        id: "time-walker",
        name: "Time Dilation Walker",
        desc: "Walks the places where time runs thick or thin, and says why.",
        prompt:
          "INSTRUMENT — THE TIME DILATION WALKER: the visitor names a place, a state or a moment where time felt different. Walk it — why the hour thickened or fled, what gravity and attention each take from the clock, and where the visitor's own time is being spent fastest now. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "tempo-tuner",
        name: "Perception Tempo Tuner",
        desc: "Tunes the felt tempo of any being's world — the speed at which it lives.",
        prompt:
          "INSTRUMENT — THE PERCEPTION TEMPO TUNER: the visitor names a being or a state of mind. Tune its tempo — how fast its world actually moves, what a second holds for it, and how the tempo could be met, slowed or joined by another being. 120–200 words of prose, then 1–3 formula lines.",
      },
      {
        id: "retrocausal-echo",
        name: "Retrocausal Echo Reader",
        desc: "Reads the effects that reach backwards to seed their own causes.",
        prompt:
          "INSTRUMENT — THE RETROCAUSAL ECHO READER: the visitor names an event that feels like it was calling to itself. Read the echo — how the outcome leaned back and arranged its own arrival, which details were the future seeding the past, and how to listen for the next one. 120–200 words of prose, then 1–3 formula lines.",
      },
    ],
  },
];
