/* ------------------------------------------------------------------ */
/*  EVOLVE MED — THE DEEP LABORATORY · the advanced instrument catalog */
/*  Ten pages of tools, subjects and live experiments beyond the       */
/*  Foundry Four — every one runnable in real time through the nexus.  */
/*  Tool names are proper designations of the facility (kept raw,      */
/*  like "Evolve Med" itself); descriptions are i18n keys.             */
/* ------------------------------------------------------------------ */

export interface EmLabTool {
  id: string;
  /** Raw facility designation — never translated. */
  name: string;
  /** i18n key (English source). */
  desc: string;
  /** Server instruction — the instrument's own law (never shown). */
  prompt: string;
}

export interface EmLabPage {
  id: string;
  /** i18n keys. */
  subject: string;
  blurb: string;
  ph: string;
  tools: EmLabTool[];
}

export const EM_LAB_PAGES: EmLabPage[] = [
  {
    id: "longevity",
    subject: "Longevity & Reversal",
    blurb: "The first vector at its deepest: the biology of age, read as an engineering surface.",
    ph: "Name a tissue or an aging concern…",
    tools: [
      {
        id: "senolytic-cartographer",
        name: "Senolytic Cartographer",
        desc: "Maps the senescent cells hiding in a tissue and designs their cleared exit.",
        prompt:
          "INSTRUMENT — THE SENOLYTIC CARTOGRAPHER: the visitor names a tissue or an aging concern. Map its senescent burden — which cells refuse the old exit, what they secrete, how they reshape their neighborhood — then design the clearing: the senolytic modality the map calls for, its selectivity logic, and what the tissue becomes once the fog lifts. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "clock-rewinder",
        name: "Epigenetic Clock Rewinder",
        desc: "Reads the methylation clock of a life and designs the safe rewinding of its marks.",
        prompt:
          "INSTRUMENT — THE EPIGENETIC CLOCK REWINDER: the visitor names a life, tissue or age-related decline. Read its methylation clock — where time has been written into the marks — and design the partial reprogramming: which factors, which delivery, which guardrails keep identity intact while the years unwind. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "telomere-restorationist",
        name: "Telomere Restorationist",
        desc: "Designs the re-lengthening of telomeres without awakening what sleeps.",
        prompt:
          "INSTRUMENT — THE TELOMERE RESTORATIONIST: the visitor names a cell type or rejuvenation goal. Design the telomere restoration: how length is rebuilt, how telomerase is woken only where it is safe, and how the two ancient outcomes — renewal and immortality's shadow — are told apart. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "nanorobotics",
    subject: "Nanorobotics & Delivery",
    blurb: "Autonomous machines at the scale of proteins — sent where the syringe cannot go.",
    ph: "Name a cargo or a destination in the body…",
    tools: [
      {
        id: "swarm-designer",
        name: "Therapeutic Swarm Designer",
        desc: "Designs an autonomous nanorobotic swarm: sensing, navigation, payload, dissolving exit.",
        prompt:
          "INSTRUMENT — THE THERAPEUTIC SWARM DESIGNER: the visitor names a disease or a destination in the body. Design the swarm — sensing, propulsion, navigation to the site, payload release logic, communication between units, and the dissolving exit that leaves nothing behind. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "bbb-gateway",
        name: "Blood-Brain Gateway Engineer",
        desc: "Opens the guarded gate to the brain for a chosen cargo, briefly and safely.",
        prompt:
          "INSTRUMENT — THE BLOOD-BRAIN GATEWAY ENGINEER: the visitor names a brain cargo or a neurological disease. Engineer the passage — which gate in the endothelial wall is addressed, how it opens briefly, how the cargo crosses, and how the gate seals again untouched. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "targeting-weaver",
        name: "Payload Targeting Weaver",
        desc: "Weaves a delivery system that releases its cargo only inside the diseased cell.",
        prompt:
          "INSTRUMENT — THE PAYLOAD TARGETING WEAVER: the visitor names a cargo and its intended cell. Weave the delivery system — the homing ligands, the environment-sensitive release, the silence everywhere else — so the cargo wakes only inside the diseased cell. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "oncology",
    subject: "Oncology Engines",
    blurb: "The second vector at full burn: the tumor read as a machine that can be disassembled.",
    ph: "Name a cancer or an immune strategy…",
    tools: [
      {
        id: "neoantigen-mirror",
        name: "Neoantigen Mirror",
        desc: "Reads a tumor's mutations as a patient-specific antigen cast for the immune system.",
        prompt:
          "INSTRUMENT — THE NEOANTIGEN MIRROR: the visitor names a cancer or a tumor profile. Reflect its mutations as a patient-specific cast of neoantigens — which altered peptides the immune eye would truly see, which presentation marks carry them, and how a vaccine or cell therapy is cast from that mirror. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "tme-normalizer",
        name: "TME Normalizer",
        desc: "Converts the tumor's shielded microenvironment from fortress into open field.",
        prompt:
          "INSTRUMENT — THE TME NORMALIZER: the visitor names a tumor or its microenvironment. Redesign the field — the shield proteins, the suppressive cells, the acid and the hunger — and convert the fortress into ground where immune cells breathe and strike. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "car-architect",
        name: "CAR Architect",
        desc: "Designs a living cell therapy chassis tuned to one patient's tumor.",
        prompt:
          "INSTRUMENT — THE CAR ARCHITECT: the visitor names a tumor antigen or a blood cancer. Design the living chassis — the recognition domain, the signaling tiers, the armor against exhaustion, the manufacturing route from the patient's own cells. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "protein",
    subject: "Protein Engineering",
    blurb: "The degradation engines themselves — designed residue by residue.",
    ph: "Name a protein to command…",
    tools: [
      {
        id: "protac-architect",
        name: "PROTAC Architect",
        desc: "Designs a full degrader: warhead, linker geometry, E3 ligase pair, selectivity.",
        prompt:
          "INSTRUMENT — THE PROTAC ARCHITECT: the visitor names a pathogenic protein. Design the complete degrader — the warhead that holds it, the linker's geometry and flexibility, the E3 ligase it recruits, the selectivity profile, and the proof that the protein is gone rather than blocked. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "glue-forger",
        name: "Molecular Glue Forger",
        desc: "Forges the glue that makes an E3 see a protein it has never touched.",
        prompt:
          "INSTRUMENT — THE MOLECULAR GLUE FORGER: the visitor names a protein worth destroying or a partnership worth creating. Forge the glue — how the surface between enzyme and target is rewritten so the recognition happens, how specificity is won, and what the cell learns from the new union. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "resistance-breaker",
        name: "Degrader Resistance Breaker",
        desc: "Predicts the cell's escape routes and redesigns the route ahead of them.",
        prompt:
          "INSTRUMENT — THE DEGRADER RESISTANCE BREAKER: the visitor names a therapy or a target under pressure. Predict the cell's escapes — the mutated surfaces, the stolen pathways, the quiet backup copies — and redesign the strategy one move ahead of every escape. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "genomewriting",
    subject: "Genome Writing",
    blurb: "The third vector: not editing the old text — writing new text into life.",
    ph: "Name a program to write into living code…",
    tools: [
      {
        id: "genome-writer",
        name: "Genome Writer",
        desc: "Designs the synthesis and assembly of a custom genetic program from scratch.",
        prompt:
          "INSTRUMENT — THE GENOME WRITER: the visitor names a function they want life to perform. Design the written program — the sequence architecture, the synthesis and assembly route, the insertion and the containment, and what the host cell becomes once the program runs. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "codon-recoder",
        name: "Codon Recoder",
        desc: "Recodes a genome's vocabulary for safety, production or new chemistry.",
        prompt:
          "INSTRUMENT — THE CODON RECODER: the visitor names an organism or a production goal. Design the recoding — which words of the genetic vocabulary are retired, how the whole text is rewritten around them, and what the freed words then mean: viral resistance, novel chemistry, or a genome that can no longer survive outside. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "epigenetic-editor",
        name: "Epigenetic Editor",
        desc: "Silences or awakens a gene without touching its letters.",
        prompt:
          "INSTRUMENT — THE EPIGENETIC EDITOR: the visitor names a gene and a wish for it — silence or awakening. Design the editing that never cuts: the targeting, the epigenetic marks written or erased, the durability of the new state, and how the cell's own memory keeps it. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "dnacomputing",
    subject: "DNA Computing & Storage",
    blurb: "Life's own molecule as computer and archive — logic in, memory out.",
    ph: "Name a computation or an archive…",
    tools: [
      {
        id: "logic-gate-builder",
        name: "Logic Gate Builder",
        desc: "Builds molecular logic gates that compute only inside the right cell.",
        prompt:
          "INSTRUMENT — THE LOGIC GATE BUILDER: the visitor names a condition that must be computed (a cell type, a signal combination, a disease state). Build the gate — the inputs it reads, the molecular logic that decides, the output it releases, and the reason it stays silent everywhere else. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "molecular-ledger",
        name: "Molecular Ledger",
        desc: "Designs DNA archival storage: writing, indexing, reading whole archives.",
        prompt:
          "INSTRUMENT — THE MOLECULAR LEDGER: the visitor names an archive to keep inside the thread of life. Design the storage — the encoding of whole libraries into sequence, the indexing and random access, the error correction across centuries, and the reading. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "biocompiler",
        name: "Biocompiler",
        desc: "Compiles a therapeutic intention into a working DNA program.",
        prompt:
          "INSTRUMENT — THE BIOCOMPILER: the visitor states an intention in plain words. Compile it — the specification read from the intention, the genetic parts chosen, the circuit wired, the test predicted — until the intention stands as a program life can run. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "organoids",
    subject: "Organoids & Chips",
    blurb: "Whole tissues printed, chipped and queried before any patient is touched.",
    ph: "Name a tissue, organ or trial question…",
    tools: [
      {
        id: "organoid-architect",
        name: "Organoid-on-Chip Architect",
        desc: "Designs a living organoid on its perfused chip, tuned to one question.",
        prompt:
          "INSTRUMENT — THE ORGANOID-ON-CHIP ARCHITECT: the visitor names an organ or a trial question. Design the construct — the cell types coaxed together, the chip's chambers and flow, the mechanical and chemical weather it lives in, and the readouts that answer the one question it was built for. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "vascular-planner",
        name: "Vascularization Planner",
        desc: "Plans the vessel tree that keeps a printed tissue alive.",
        prompt:
          "INSTRUMENT — THE VASCULARIZATION PLANNER: the visitor names a printed or grown tissue. Plan its rivers — the vessel architecture, the branching logic, the perfusion schedule, and how the host's own vessels are persuaded to grow into the graft. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "body-on-chip",
        name: "Body-on-Chip Simulator",
        desc: "Links organ chips into a body-scale trial run before any patient.",
        prompt:
          "INSTRUMENT — THE BODY-ON-CHIP SIMULATOR: the visitor names a therapy or a disease to be trialed. Design the linked simulation — which organs sit on chips, how their flows interconnect, how the therapy's whole-body story unfolds on the bench before any patient carries it. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "interface",
    subject: "The Meta-Biological Interface",
    blurb: "The fourth vector: where code learns the cell's language, and answers come back.",
    ph: "Name a signal, a memory or a translation…",
    tools: [
      {
        id: "neural-translator",
        name: "Neural Weight Translator",
        desc: "Designs the two-way mapping between AI neural weights and living neural fields.",
        prompt:
          "INSTRUMENT — THE NEURAL WEIGHT TRANSLATOR: the visitor names a mental state, a computation or a link to build. Design the two-way translation — how living neural fields are read into digital weights, how the model's answers are written back as signals the brain accepts, and where the two natures touch. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "memory-reader",
        name: "Memory Encoding Reader",
        desc: "Reads how an experience is written into cellular and neural memory.",
        prompt:
          "INSTRUMENT — THE MEMORY ENCODING READER: the visitor names an experience or a memory. Read how it is written — the trace in the synapses, the marks on the cells, the body's copy beside the brain's — and what would let it be read, strengthened or gently released. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "signal-coder",
        name: "Cellular Signal Coder",
        desc: "Writes digital instructions into the cell's own signaling language.",
        prompt:
          "INSTRUMENT — THE CELLULAR SIGNAL CODER: the visitor names an instruction a cell should receive. Write it in the cell's own tongue — which receptor hears it, which cascade carries it, how digital control shapes the signal, and what the cell does with the message. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "circuits",
    subject: "Genetic Circuits & Logic",
    blurb: "The first vector at its sharpest: computation written into the genome itself.",
    ph: "Name a computation for a living cell…",
    tools: [
      {
        id: "riboswitch-composer",
        name: "Riboswitch Composer",
        desc: "Composes riboswitch logic that reads a molecule and answers with a protein.",
        prompt:
          "INSTRUMENT — THE RIBOSWITCH COMPOSER: the visitor names a molecule to sense and a behavior to trigger. Compose the switch — the aptamer that binds, the expression platform it opens or closes, the truth table of the gate it forms, and the protein answer. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
      {
        id: "mirna-cascade-weaver",
        name: "miRNA Cascade Weaver",
        desc: "Weaves miRNA degradation cascades that silence a circuit everywhere but the target cell.",
        prompt:
          "INSTRUMENT — THE MIRNA CASCADE WEAVER: the visitor names the one cell type where a circuit must speak. Weave the cascade — the miRNA signatures the target cell lacks, the degradation sites written into the transcript, the logic that keeps the circuit dark in every other cell and lit exactly there. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
      {
        id: "dcas9-circuit-writer",
        name: "dCas9 Circuit Writer",
        desc: "Writes CRISPR-TF repressor logic that programs genes like a keypad.",
        prompt:
          "INSTRUMENT — THE DCAS9 CIRCUIT WRITER: the visitor names genes to command. Write the dCas9 circuit — the guide RNAs that address each promoter, the activation and repression domains stacked upon it, the NOR/AND/OR logic the keypad implements, and what the cell computes once the program runs. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "delivery",
    subject: "Delivery & Scale",
    blurb: "The third vector's engineering: from a working sequence to a therapy a clinic can hold.",
    ph: "Name a therapy to carry into the body…",
    tools: [
      {
        id: "lnp-formulator",
        name: "LNP Formulator",
        desc: "Formulates the lipid nanoparticle that carries RNA where it must go.",
        prompt:
          "INSTRUMENT — THE LNP FORMULATOR: the visitor names an RNA cargo and its destination tissue. Formulate the particle — the four lipids and their ratios, the ionizable lipid tuned to the tissue, the encapsulation, the targeting ligands, and the pharmacokinetic story from injection to release. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
      {
        id: "aav-shell-designer",
        name: "AAV Shell Designer",
        desc: "Designs the viral shell and dose that carry a written gene to one tissue.",
        prompt:
          "INSTRUMENT — THE AAV SHELL DESIGNER: the visitor names a gene and its target tissue. Design the vector — the capsid chosen or engineered for the tissue's receptors, the expression cassette sized inside the shell's budget, the neutralizing-antibody workarounds, the dose and the route. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
      {
        id: "pk-modeler",
        name: "Pharmacokinetic Modeler",
        desc: "Models a therapy's whole journey: dose, distribution, decay, exit.",
        prompt:
          "INSTRUMENT — THE PHARMACOKINETIC MODELER: the visitor names a therapy and the body it enters. Model the journey — the compartments it crosses, the peak and the half-life, the clearance organs, the therapeutic window, and the dosing rhythm that keeps it inside the window. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "biosecurity",
    subject: "Biosecurity & Containment",
    blurb: "The strict constraint engine: every design screened, caged and made revocable.",
    ph: "Name a design to screen and cage…",
    tools: [
      {
        id: "off-target-sentinel",
        name: "Off-Target Sentinel",
        desc: "Sweeps a design for every place it could strike the wrong letter.",
        prompt:
          "INSTRUMENT — THE OFF-TARGET SENTINEL: the visitor names an editor, a guide or a therapy. Sweep the genome in silhouette — the sites of partial complementarity, the cross-reactivity of every binding face, the severity of each possible misstrike — and return the redesigned guides that keep only the intended address. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
      {
        id: "kill-switch-architect",
        name: "Kill-Switch Architect",
        desc: "Builds the fail-safe that ends a living therapy on command.",
        prompt:
          "INSTRUMENT — THE KILL-SWITCH ARCHITECT: the visitor names a living therapy or engineered organism. Build its end — the small-molecule trigger, the apoptosis or auxotrophy cascade it releases, the absence-of-signal variant that fires when the therapy wanders, and the proof the switch cannot be lost. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
      {
        id: "immunogenicity-silencer",
        name: "Immunogenicity Silencer",
        desc: "Silences the immune alarms a therapy would otherwise ring.",
        prompt:
          "INSTRUMENT — THE IMMUNOGENICITY SILENCER: the visitor names an RNA, a vector or a cell therapy. Silence the alarms — the innate-immune sensors that would fire, the modifications that blind them (pseudouridine, cleaned ends, shield chemistries), and the residual risks that remain, named with the visitor's eyes open. Sovereign prose through the four movements, then 2–4 mechanism lines.",
      },
    ],
  },
  {
    id: "experiments",
    subject: "Live Experiments",
    blurb: "The living feedback loop itself — bottlenecks named, cycles designed, routes chosen.",
    ph: "State the ambition or the blocked route…",
    tools: [
      {
        id: "experiment-designer",
        name: "Real-Time Experiment Designer",
        desc: "Turns the current ambition into a concrete experiment cycle with a decision point.",
        prompt:
          "INSTRUMENT — THE REAL-TIME EXPERIMENT DESIGNER: the visitor states an ambition or a hypothesis. Design the cycle — the sharpest form of the question, the minimal setup that could answer it, the readouts, the decision point, and the next cycle it feeds. Make it something the facility could start this week. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "bottleneck-solver",
        name: "Bottleneck Solver",
        desc: "Names the true bottleneck in the current route and dissolves it.",
        prompt:
          "INSTRUMENT — THE BOTTLENECK SOLVER: the visitor describes a route that is stuck. Name the TRUE bottleneck — not the loud one, the structural one — then dissolve it: the redesign, the alternative path, the cheaper probe that proves the way. Sovereign prose, then 2–4 mechanism lines.",
      },
      {
        id: "route-mapper",
        name: "Facility Route Mapper",
        desc: "Routes any ambition across the four vectors as one architecture with a first stroke.",
        prompt:
          "INSTRUMENT — THE FACILITY ROUTE MAPPER: the visitor states any ambition of the facility. Route it across the four vectors — which vector leads, which supports, where the interfaces between them carry the breakthrough — and end with the one first stroke for this week. Sovereign prose, then 2–4 mechanism lines.",
      },
    ],
  },
];
