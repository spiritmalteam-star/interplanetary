/* ------------------------------------------------------------------ */
/*  WINDOW PRESENTATIONS — the mini-website experience of every        */
/*  window: when a field is pressed, the scope orients AND the chat    */
/*  frame itself becomes a small living presentation of what the       */
/*  window is about — visuals, motion, interaction — and one X         */
/*  returns to the beginning of the conversation.                      */
/*  Every string is an i18n key (English source).                      */
/* ------------------------------------------------------------------ */

export interface PresentationChapter {
  title: string;
  text: string;
}

export interface WindowPresentationData {
  id: string;
  /** The quiet line beneath the window's name. */
  subtitle: string;
  /** The label of the begin button. */
  chapters: PresentationChapter[];
}

/** ParticleX — the eight windows over the areas of existence. */
export const pxPresentations: Record<string, WindowPresentationData> = {
  formulas: {
    id: "formulas",
    subtitle: "the formulas that run reality",
    chapters: [
      {
        title: "Everything holds a line",
        text: "Look at anything that keeps its shape — a cup, a friendship, a Tuesday — and beneath it runs a line: a compact equation, quietly solving itself again and again. Reality is not solid; it is arithmetic that keeps agreeing with itself.",
      },
      {
        title: "The terms that feed each other",
        text: "Every formula has terms — attention, belief, frequency, memory — and each term feeds the others. Move one and the whole line re-solves. This is why a single changed habit can redraw a life: the equation has no choice but to balance.",
      },
      {
        title: "Reading your own line",
        text: "The window opens fully when you recognize your own terms in the script. The formula that runs your days is not hidden from you — it is only unwritten on paper. Here you learn to read it, and then, gently, to edit it.",
      },
    ],
  },
  perception: {
    id: "perception",
    subtitle: "how every being perceives reality",
    chapters: [
      {
        title: "No two worlds alike",
        text: "The room you sit in is not one room. The bee folds it into hexagons of urgency, the cat pours through it as rivers of warm and cold, the oak drinks it as a slow century of light. Each life grinds its own lens — and so lives in its own universe.",
      },
      {
        title: "The senses vote first",
        text: "Before the mind has an opinion, the senses have already voted on what is real. A being receives only the signals its body can catch — everything else passes through the world like wind through an open window, real, unregistered.",
      },
      {
        title: "Standing in another's field",
        text: "This window lets you stand inside foreign fields: the whale's song-distance, the moss's patient hour, the eagle's mathematics of height. What you learn there changes the way you walk back into your own.",
      },
    ],
  },
  emotions: {
    id: "emotions",
    subtitle: "where feelings are manufactured",
    chapters: [
      {
        title: "The foundry under the heart",
        text: "Feelings are not weather that happens to you; they are forged. Under the heart runs a quiet foundry where signal, memory and field are poured together — and a feeling is the shape that comes out of the mould this time.",
      },
      {
        title: "Assembly, not accident",
        text: "Watch the assembly line: a body-state arrives, a memory recognizes it, a field of meaning names it — and grief, joy or dread is complete. Every ingredient is real; every mixture is unique. No two beings ever forge the same feeling twice.",
      },
      {
        title: "Taking the maker's seat",
        text: "Once the foundry is seen, you are no longer only the smith's product — you are the smith's apprentice. The signals can be chosen, the memories re-read, the field re-tuned. The making of emotions becomes a craft you may practice.",
      },
    ],
  },
  belief: {
    id: "belief",
    subtitle: "the engines that vote reality into place",
    chapters: [
      {
        title: "Machines, not opinions",
        text: "A belief is not a thought you think — it is an engine that thinks for you. Invisible, tireless, it decides which of all possible worlds gets rendered, and then hands you the finished room as if it had always stood there.",
      },
      {
        title: "The election of the real",
        text: "Reality holds more candidates than any one life can house. Beliefs are the ballots: private, constant, decisive. Yours are voting right now — on what you notice, what you permit, what you walk toward and what you cannot see at all.",
      },
      {
        title: "Inspecting the engines",
        text: "Here the engines are opened on the bench. You will find ones you installed in childhood, ones you inherited, ones that no longer serve the world you are choosing. An engine, once seen, may be retired — and a truer one set in its place.",
      },
    ],
  },
  quantum: {
    id: "quantum",
    subtitle: "the raw machinery beneath the visible",
    chapters: [
      {
        title: "The workshop under the floor",
        text: "Beneath the visible world there is a workshop. Down there, things hold many answers at once, touch each other across any distance, and wait — for a question, an eye, a hand — before they agree to be any one thing at all.",
      },
      {
        title: "Superposition and the seam",
        text: "The rendered universe is still being woven, and the seams show in places: a particle undecided, two histories braided, a measurement that does not discover but selects. The floor of the world is thinner than it looks.",
      },
      {
        title: "Why the machinery matters",
        text: "This is not a distant craft. The machinery under the floor runs the floor you stand on — every stone, every cell, every thought. To see it working is to see how much of the solid world is agreement, freshly renewed each instant.",
      },
    ],
  },
  parallel: {
    id: "parallel",
    subtitle: "the same product on many parallel lines",
    chapters: [
      {
        title: "One cup, many Earths",
        text: "Every human product exists on many lines at once. The same cup sits on a thousand neighboring Earths — same purpose, different formula: thrown differently, priced differently, drunk from at different hours of a different history.",
      },
      {
        title: "The divergence of one rule",
        text: "Lines do not separate by catastrophe; they separate by one small rule drifting — a tolerance, a taboo, a price of tin. Trace any object to its line's rules and you can see exactly where your world forked from the one beside it.",
      },
      {
        title: "Reading your line's rules",
        text: "The catalog of parallels is also a mirror: it shows what your line chose without ever announcing the choice. Once the rules are visible, some of them may be re-written — and your line quietly becomes a neighboring one.",
      },
    ],
  },
  mycelia: {
    id: "mycelia",
    subtitle: "the network that arrived with the stars",
    chapters: [
      {
        title: "The oldest traveler",
        text: "Before roots, before rain had a name, the network was already falling — stardust seed riding the dark between worlds. The mycelial web did not evolve here first; it arrived, and found a young planet waiting for a nervous system.",
      },
      {
        title: "The treaty with the ground",
        text: "On this world the network signed its treaty: threads to roots, minerals to sugar, stone to life. Every forest since has walked on that signature. What looks like soil is a marketplace older than animals, still trading through the night.",
      },
      {
        title: "The web beneath your feet",
        text: "This window listens downward: to the signals threading a forest floor, the decisions made without brains, the memory held in chemistry. The oldest intelligence on Earth is not above the ground. It is the ground.",
      },
    ],
  },
  vibration: {
    id: "vibration",
    subtitle: "pyramids, frequency and the standing stones",
    chapters: [
      {
        title: "Instruments of stone",
        text: "The monuments were not only tombs and calendars — they were instruments. Mass and chamber placed like strings on a harp: pyramids, circles and standing stones built to hold a note, the way a bell holds its strike long after the hand lets go.",
      },
      {
        title: "The note that stays",
        text: "A standing wave is a note that refuses to travel — it stays, folded in place, humming in the stone. Tune a chamber rightly and everything inside it begins to entrain: water, air, body, attention. The old builders knew what a room could do to a mind.",
      },
      {
        title: "Reading the frequencies",
        text: "Here you learn to read the sites as instruments: their chambers as resonance boxes, their alignments as tuning, their stillness as a long sustained tone. What they were tuned to do — and what they are still quietly doing — is the window's revelation.",
      },
    ],
  },
};

/** Evolve Med — the four vector windows of the biocompiler. */
export const emPresentations: Record<string, WindowPresentationData> = {
  genome: {
    id: "genome",
    subtitle: "genetic circuits, base sequences, epigenetic motifs",
    chapters: [
      {
        title: "Life as a writable script",
        text: "The first window opens on the oldest text in the world: four letters, endless sentence. Here the script is not read but drafted — circuits designed as precise base sequences, genomes written from nothing, motifs laid over the letters to tune them without touching them.",
      },
      {
        title: "Gates woven of strands",
        text: "Logic lives in the strand: a riboswitch that opens only for one molecule, a cascade that silences a gene until two signals agree. The thread of life is a computer that was computing long before we learned to compile for it.",
      },
      {
        title: "The archive of the thread",
        text: "DNA holds more than plans — it holds libraries. Whole archives folded into the thread, indexed, error-corrected, readable for millennia. In this window, memory itself becomes a molecule you may write into.",
      },
    ],
  },
  engines: {
    id: "engines",
    subtitle: "sequences folded into working machines",
    chapters: [
      {
        title: "The fold is the machine",
        text: "A sequence is only a spell; the fold is the magic. In the second window, chains become machines: proteins that walk, switches that flip, nanomachines that grip a cancer cell by its own armor and pull the lever.",
      },
      {
        title: "The elegant removal",
        text: "Some medicine is addition; the best is subtraction. Molecular glues and PROTACs teach the cell's own shredder to recognize a traitor — and the disease machine is dismantled by the body itself, quietly, from inside.",
      },
      {
        title: "Rewriting without breaking",
        text: "The editing instruments work like restorers of manuscripts: a wrong letter lifted, a toxic repeat smoothed, a silenced gene un-muted — the text left stronger for the repair. Precision here is not a virtue; it is the whole craft.",
      },
    ],
  },
  medworld: {
    id: "medworld",
    subtitle: "scale, delivery and clinical viability",
    chapters: [
      {
        title: "From bench to batch",
        text: "A working sequence is a manuscript; the med-world is the printing press. Scale-up, purity, dose, batch — the long road from something true to something a clinic can hold in its hands. This window honors that road.",
      },
      {
        title: "The couriers",
        text: "Every therapy needs a courier: a lipid shell, a viral postman, a cell-free vessel. Delivery is where cures have historically gone to die — and where this engine designs like a fleet commander: right cargo, right harbor, right hour.",
      },
      {
        title: "The long clinics of the future",
        text: "Radical longevity, senolytics, bioprinted organs, organs-on-chips — the far shelves of the med-world. Here the engine translates everything it compiles into the living clinic: not what could exist, but what could be held, dosed and survived.",
      },
    ],
  },
  interface: {
    id: "interface",
    subtitle: "where tissue answers code in real time",
    chapters: [
      {
        title: "The living responds",
        text: "The last window is a conversation: tissue that answers code in real time. A sensor cell reports; a compiler replies; the loop closes in milliseconds. The boundary between program and organism thins until it is only a protocol.",
      },
      {
        title: "Reading the body's wire",
        text: "Every spike, wave and hormone is a message already in transit. Here the messages are read live — neural, immune, metabolic — and steered: a memory gated, a flare quieted, a rhythm re-set, all from outside, all in the body's own grammar.",
      },
      {
        title: "Where code becomes wetware",
        text: "The interface's far shore is translation: digital architecture into living tissue and back. Weights of a network mirrored in a lattice of cells; a thought-shaped signal written into a wound. The two languages were always one; this window teaches both.",
      },
    ],
  },
};
