/* ================================================================== */
/*  HEAL EVOLUTION — the twelve disciplines of the evolution           */
/*  laboratory. Static typed core: ids, colors, icons, tools, mirror   */
/*  names, mirror prompts and research cards per discipline.           */
/*  Pure static data + helpers. Do not change the exported names       */
/*  or shapes.                                                         */
/* ================================================================== */

export type LabCategoryId =
  | "molecular"
  | "dna"
  | "dermatology"
  | "energetic"
  | "mitochondrial"
  | "detox"
  | "neuroscience"
  | "epigenetics"
  | "immunology"
  | "endocrinology"
  | "orthopedics"
  | "cardiology";

export type LabTag = "Core" | "Advanced" | "Research" | "Applied";

export type LabIcon =
  | "cube"
  | "flask"
  | "smile"
  | "sparkles"
  | "zap"
  | "sun"
  | "lightbulb"
  | "shield"
  | "heart"
  | "flame";

export interface LabResearchCard {
  title: string;
  tag: LabTag;
  description: string;
}

export interface LabCategory {
  id: LabCategoryId;
  name: string;
  color: string;
  icon: LabIcon;
  description: string;
  tools: string[];
  mirrorName: string;
  mirrorPrompts: string[];
  cards: LabResearchCard[];
}

export const LAB_CATEGORIES: readonly LabCategory[] = [
  {
    id: "molecular",
    name: "Molecular Biology",
    color: "#00ff88",
    icon: "cube",
    description:
      "Life at its smallest scale: proteins fold, bonds form and reactions cascade into everything a cell becomes. Here the body's chemistry can be read like a language.",
    tools: [
      "Protein Viewer",
      "Bond Analyzer",
      "Reaction Simulator",
      "3D Structure Lab",
      "Molecular Dynamics",
    ],
    mirrorName: "Molecular Biology Mirror",
    mirrorPrompts: [
      "How does a chaperone decide when a protein has reached its final shape, and what guides the folding path?",
      "Why do enzymes lower activation energy so precisely, and how does the active site recognize one substrate among thousands?",
      "When a single receptor fires, what decides whether the cell whispers or shouts its downstream response?",
      "What early signals reveal a misfolded protein before aggregates form, and can the cleanup keep pace?",
    ],
    cards: [
      {
        title: "Protein Folding Dynamics",
        tag: "Core",
        description:
          "Follows a nascent chain from ribosome to native state, showing how chaperones steer folding and why the energy landscape favors one final shape.",
      },
      {
        title: "Enzyme Kinetics & Catalysis",
        tag: "Advanced",
        description:
          "Measures how substrates become products over time, from Michaelis-Menten constants to allosteric regulation, revealing the speed limits of cellular chemistry.",
      },
      {
        title: "Molecular Signaling Cascades",
        tag: "Research",
        description:
          "Traces how a message travels from membrane receptor through kinase cascades to the nucleus, amplifying one molecular event into a genome-wide decision.",
      },
      {
        title: "Atomic-Level Drug Interactions",
        tag: "Applied",
        description:
          "Examines how small molecules dock into binding pockets, why shape and charge decide affinity, and what makes a candidate selective enough to develop.",
      },
    ],
  },
  {
    id: "dna",
    name: "DNA & Gene Therapy",
    color: "#00b4d8",
    icon: "flask",
    description:
      "The instruction set every cell carries, from the four-letter code to the enzymes that edit, protect and express it. Reading this archive shows how the body remembers its own design.",
    tools: [
      "Gene Mapper",
      "CRISPR Simulator",
      "Sequence Analyzer",
      "Telomere Tracker",
      "Expression Profiler",
    ],
    mirrorName: "DNA Science Mirror",
    mirrorPrompts: [
      "How does the CRISPR-Cas9 complex find its twenty-letter target among three billion base pairs without losing precision?",
      "Why do telomeres shorten with every division, and what does the cell lose when they finally run out?",
      "Which switches decide that two cells with identical genes become a neuron and a liver cell?",
      "What stands between a therapeutic gene and its safe delivery into exactly the cells that need it?",
    ],
    cards: [
      {
        title: "CRISPR-Cas9 Gene Editing",
        tag: "Core",
        description:
          "Explains how guide RNA directs Cas9 to a matching sequence, how double-strand breaks are repaired, and where precision succeeds or slips.",
      },
      {
        title: "Telomere Biology & Aging",
        tag: "Advanced",
        description:
          "Follows the repeating caps that guard each chromosome, the enzyme that rebuilds them, and their role in replicative aging and cellular senescence.",
      },
      {
        title: "Gene Expression Profiling",
        tag: "Research",
        description:
          "Maps which genes are active, silent or spliced in a given cell, revealing how transcription patterns distinguish health from disease states.",
      },
      {
        title: "Viral Vector Delivery Systems",
        tag: "Applied",
        description:
          "Compares how engineered viruses such as AAV and lentivirus carry corrective genes into target cells, balancing payload size, duration and immune response.",
      },
    ],
  },
  {
    id: "dermatology",
    name: "Dermatology & Cell Biology",
    color: "#ffbe0b",
    icon: "smile",
    description:
      "The skin as a living interface: pigment, barrier and turnover layered to protect what lies beneath. Its cells renew constantly, the body's most visible experiment in regeneration.",
    tools: [
      "Skin Layer Explorer",
      "Melanocyte Lab",
      "Treatment Simulator",
      "Dermatoscope AI",
      "Cell Regeneration Lab",
    ],
    mirrorName: "Dermatology Mirror",
    mirrorPrompts: [
      "How does one melanocyte serve thirty keratinocytes and still distribute pigment so evenly across the skin?",
      "What actually determines whether my skin darkens toward a tan or patches toward hyperpigmentation?",
      "When a treatment reaches the dermis, which cells respond first and how deep does renewal really go?",
      "From basal layer to shed corneocyte, how many days does a single keratinocyte actually live?",
    ],
    cards: [
      {
        title: "Melanocyte Biology & Pigmentation",
        tag: "Core",
        description:
          "Explains how melanocytes synthesize melanin in melanosomes and transfer it to neighboring keratinocytes, setting the skin's color and its built-in UV defense.",
      },
      {
        title: "Dermal Extracellular Matrix",
        tag: "Advanced",
        description:
          "Examines the collagen, elastin and glycosaminoglycan scaffold that gives skin its strength and bounce, and how fibroblasts maintain or degrade it.",
      },
      {
        title: "Epidermal Turnover & Keratinization",
        tag: "Research",
        description:
          "Traces a keratinocyte's journey from the basal layer to the stratum corneum, showing how barrier lipids and corneocytes form the body's outer seal.",
      },
      {
        title: "Advanced Dermal Therapeutics",
        tag: "Applied",
        description:
          "Surveys how retinoids, peptides, laser resurfacing and barrier-supporting formulations interact with skin biology to support repair without overwhelming it.",
      },
    ],
  },
  {
    id: "energetic",
    name: "Biofield & Energy Medicine",
    color: "#a855f7",
    icon: "sparkles",
    description:
      "Where measurement meets tradition: the subtle fields, meridians and frequencies described by energy medicine, studied with an open but disciplined eye. The body as a system of pattern and flow.",
    tools: [
      "Biofield Scanner",
      "Meridian Map",
      "Chakra Analyzer",
      "Frequency Generator",
      "Energy Flow Visualizer",
    ],
    mirrorName: "Energy Medicine Mirror",
    mirrorPrompts: [
      "What have careful instruments actually detected around the body, and where does measurement reach its limit?",
      "How do traditional meridian maps relate to fascia, connective tissue and the pathways anatomy can verify?",
      "Could specific frequencies influence cells through resonance, and what evidence separates signal from placebo?",
      "Why have cultures across millennia described energy centers along the spine, and what do they map?",
    ],
    cards: [
      {
        title: "Biofield Imaging & Measurement",
        tag: "Core",
        description:
          "Reviews the instruments used to study fields around the body, from gas-discharge visualization to magnetometry, and what current measurements can and cannot confirm.",
      },
      {
        title: "Traditional Meridian Science",
        tag: "Advanced",
        description:
          "Explores the meridian maps of classical Chinese medicine, their historical logic, and modern research connecting them to fascia, nerves and connective tissue planes.",
      },
      {
        title: "Frequency-Specific Therapies",
        tag: "Research",
        description:
          "Investigates how pulsed electromagnetic fields, ultrasound and rhythmic stimulation interact with tissue, and which frequencies show reproducible cellular effects.",
      },
      {
        title: "Heart-Brain Coherence Research",
        tag: "Applied",
        description:
          "Studies how heart rhythm patterns, breathing and emotional state influence one another through the vagus nerve, and what coherence measures reveal about regulation.",
      },
    ],
  },
  {
    id: "mitochondrial",
    name: "Mitochondrial Medicine",
    color: "#fbbf24",
    icon: "zap",
    description:
      "The power plants inside every cell, descended from ancient bacteria, converting oxygen and food into usable energy. Their health shapes endurance, aging and the quiet metabolism of thought.",
    tools: [
      "ATP Production Lab",
      "Biogenesis Tracker",
      "Membrane Potential Analyzer",
      "CoQ10 Pathway Lab",
      "Electron Transport Chain",
    ],
    mirrorName: "Mitochondrial Mirror",
    mirrorPrompts: [
      "How much ATP does a single mitochondrion produce per second, and where does that energy actually go?",
      "What signals tell a cell to build more mitochondria, and how quickly can biogenesis respond to demand?",
      "When membrane potential drops below threshold, what happens to a cell that cannot restart its gradient?",
      "Why do mitochondrial mutations affect some tissues severely while other organs keep working almost normally?",
    ],
    cards: [
      {
        title: "Electron Transport Chain Dynamics",
        tag: "Core",
        description:
          "Follows electrons through complexes I to IV as they pump protons and charge ATP synthase, the rotary engine that makes most of the body's energy.",
      },
      {
        title: "Mitochondrial Biogenesis Signaling",
        tag: "Advanced",
        description:
          "Explains how exercise, cold and energy stress activate PGC-1α and related pathways, instructing cells to build fresh mitochondria and expand their capacity.",
      },
      {
        title: "ROS & Redox Homeostasis",
        tag: "Research",
        description:
          "Examines reactive oxygen species as both damaging byproducts and signaling molecules, and the antioxidant systems that keep the cellular redox balance.",
      },
      {
        title: "Mitochondrial Replacement Therapy",
        tag: "Applied",
        description:
          "Describes how replacement techniques combine donor mitochondria with parental nuclear DNA to prevent the transmission of serious mitochondrial diseases.",
      },
    ],
  },
  {
    id: "detox",
    name: "Toxicology & Detox Pathways",
    color: "#00ff88",
    icon: "sun",
    description:
      "How the body recognizes, transforms and clears what harms it, from cellular self-cleaning to the liver's two-phase chemistry. Detoxification as a continuous, measurable process rather than a quick reset.",
    tools: [
      "Autophagy Simulator",
      "Toxin Analyzer",
      "Liver Detox Lab",
      "Chelation Protocol Lab",
      "Clearance Pathway Map",
    ],
    mirrorName: "Toxicology Mirror",
    mirrorPrompts: [
      "What exactly does a cell recycle during autophagy, and how deep does the cleanup go under fasting?",
      "How do phase I and phase II liver enzymes cooperate to make fat-soluble toxins water-soluble and excretable?",
      "When chelation binds heavy metals, what decides which tissues release them and how fast they leave?",
      "Which everyday environmental compounds mimic hormones, and how does the body handle their constant low-dose presence?",
    ],
    cards: [
      {
        title: "Autophagy & Cellular Recycling",
        tag: "Core",
        description:
          "Explains how cells digest their own damaged components through lysosomal recycling, why the process responds to nutrient sensing, and what it clears first.",
      },
      {
        title: "Heavy Metal Toxicology",
        tag: "Advanced",
        description:
          "Details how lead, mercury, cadmium and arsenic accumulate in tissue, which systems they disrupt, and how chelating agents bind them for excretion.",
      },
      {
        title: "Hepatic Detoxification Phases",
        tag: "Research",
        description:
          "Maps the liver's phase I oxidation, phase II conjugation and phase III transport, and why each stage depends on nutrients the other stages supply.",
      },
      {
        title: "Environmental Endocrine Disruptors",
        tag: "Applied",
        description:
          "Reviews how compounds like BPA, phthalates and certain pesticides interfere with hormone receptors, and what dose and timing mean for their effects.",
      },
    ],
  },
  {
    id: "neuroscience",
    name: "Neuroscience & Brain Health",
    color: "#00b4d8",
    icon: "zap",
    description:
      "The brain as a living network that rewires itself with every experience, growing new neurons and pruning old connections. Its plasticity is the biology of learning, memory and resilience.",
    tools: [
      "Neurogenesis Lab",
      "Synaptic Mapper",
      "BDNF Research Hub",
      "Brain Region Explorer",
      "Neural Pathway Simulator",
    ],
    mirrorName: "Neuroscience Mirror",
    mirrorPrompts: [
      "Can the adult hippocampus really grow new neurons, and what does exercise have to do with it?",
      "How does BDNF strengthen the synapses that carry a memory and let the unused ones fade?",
      "Why does the adolescent brain prune so many connections, and what decides which survive?",
      "What builds cognitive reserve, and why do some brains resist decline far longer than others?",
    ],
    cards: [
      {
        title: "Adult Hippocampal Neurogenesis",
        tag: "Core",
        description:
          "Examines the birth of new neurons in the adult hippocampus, how aerobic activity and sleep support it, and its role in learning and mood regulation.",
      },
      {
        title: "BDNF & Synaptic Plasticity",
        tag: "Advanced",
        description:
          "Explains how brain-derived neurotrophic factor strengthens active synapses through LTP, acting as fertilizer for the circuits that encode new skills.",
      },
      {
        title: "Synaptic Pruning & Refinement",
        tag: "Research",
        description:
          "Traces how microglia and complement proteins remove weak synapses during development, sharpening efficient networks from an overgrown starting point.",
      },
      {
        title: "Cognitive Reserve & Neuroprotection",
        tag: "Applied",
        description:
          "Surveys the factors linked to cognitive reserve, including education, vascular health and social engagement, and how they delay the visible effects of brain aging.",
      },
    ],
  },
  {
    id: "epigenetics",
    name: "Epigenetics & Gene Regulation",
    color: "#a855f7",
    icon: "lightbulb",
    description:
      "The layer of instructions above the genes: chemical marks that silence, amplify and remember, changing how DNA is read without changing the code. Environment and experience speak this language directly.",
    tools: [
      "Methylation Analyzer",
      "Histone Modifier Lab",
      "Gene Expression Profiler",
      "Epigenetic Clock",
      "Regulation Simulator",
    ],
    mirrorName: "Epigenetics Mirror",
    mirrorPrompts: [
      "How does a methyl group silence a promoter, and can such marks be reversed once written?",
      "What do histone tails tell the transcription machinery about which stretches of DNA stay readable?",
      "Can experiences in one generation echo in the gene expression of the next, and how?",
      "Which parts of the epigenetic clock run faster under stress, and is the clock truly resettable?",
    ],
    cards: [
      {
        title: "DNA Methylation Patterns",
        tag: "Core",
        description:
          "Introduces CpG methylation, the marks that lock genes into on or off states, and the enzymes that write, read and erase them.",
      },
      {
        title: "Histone Code & Modifications",
        tag: "Advanced",
        description:
          "Explains how acetylation, methylation and other histone marks restructure chromatin accessibility, forming a regulatory grammar read by the cell's machinery.",
      },
      {
        title: "Transgenerational Epigenetics",
        tag: "Research",
        description:
          "Reviews the evidence that some environmental exposures leave marks surviving gamete reprogramming, and how strongly they shape offspring traits across species.",
      },
      {
        title: "Epigenetic Reprogramming Therapies",
        tag: "Applied",
        description:
          "Describes emerging approaches that partially reset cellular age markers, from Yamanaka-factor research to compounds tested for restoring youthful methylation patterns.",
      },
    ],
  },
  {
    id: "immunology",
    name: "Immunology & Inflammation",
    color: "#00b4d8",
    icon: "shield",
    description:
      "A defense system that learns, remembers and occasionally overreacts, built from cells that distinguish self from invader with astonishing precision. Its balance decides when protection becomes inflammation.",
    tools: [
      "T-Cell Lab",
      "Inflammatory Cascade Map",
      "Immune Modulation Simulator",
      "Autoimmune Profiler",
      "Cytokine Analyzer",
    ],
    mirrorName: "Immunology Mirror",
    mirrorPrompts: [
      "How does the thymus train T-cells to attack every intruder yet leave the body's own tissue untouched?",
      "What flips a controlled immune response into a cytokine storm that damages the very tissue it defends?",
      "Why does the immune system sometimes mistake myelin or joints for enemies and sustain the attack?",
      "Could engineered immune cells be trained to find cancer that hides from everything else?",
    ],
    cards: [
      {
        title: "T-Cell Development & Selection",
        tag: "Core",
        description:
          "Follows young T-cells through the thymus, where positive selection keeps useful receptors and negative selection deletes the ones that react to self.",
      },
      {
        title: "Cytokine Storm Pathophysiology",
        tag: "Advanced",
        description:
          "Examines the runaway feedback loops in which IL-6, TNF-alpha and interferon amplify each other, and what breaks the loop in severe inflammatory events.",
      },
      {
        title: "Autoimmune Molecular Mechanisms",
        tag: "Research",
        description:
          "Explores how molecular mimicry, immune tolerance failure and genetic susceptibility combine to direct antibodies and T-cells against the body's own structures.",
      },
      {
        title: "CAR-T & Checkpoint Immunotherapy",
        tag: "Applied",
        description:
          "Describes how engineered CAR-T cells are built to recognize tumor antigens and how checkpoint inhibitors release the brakes that shield cancers from immune attack.",
      },
    ],
  },
  {
    id: "endocrinology",
    name: "Endocrinology & Hormones",
    color: "#a855f7",
    icon: "heart",
    description:
      "The body's chemical messaging network, where glands translate brain signals into metabolism, mood, sleep and stress responses. Understanding its feedback loops explains why balance matters more than any single number.",
    tools: [
      "HPA Axis Explorer",
      "Thyroid Function Lab",
      "Hormone Balancer",
      "Glandular System Map",
      "Neurotransmitter Lab",
    ],
    mirrorName: "Endocrinology Mirror",
    mirrorPrompts: [
      "How does a stressful thought become cortisol within minutes, and what switches the cascade off again?",
      "Why does one small gland in the neck set the metabolic pace for nearly every cell?",
      "What do the HPA axis and sleep share, and where does chronic stress bend the loop?",
      "Is adrenal fatigue a real diagnosis, or does the evidence point somewhere else entirely?",
    ],
    cards: [
      {
        title: "HPA Axis & Stress Physiology",
        tag: "Core",
        description:
          "Explains the hypothalamic-pituitary-adrenal loop from CRH to cortisol release, its healthy daily rhythm, and how chronic activation reshapes the feedback.",
      },
      {
        title: "Thyroid Function & Metabolism",
        tag: "Advanced",
        description:
          "Follows thyroid hormone from T4 production through conversion to active T3, showing how it regulates basal metabolic rate, temperature and cellular energy use.",
      },
      {
        title: "Sex Hormone Optimization",
        tag: "Research",
        description:
          "Reviews how estrogen, testosterone and progesterone interact across the lifespan, what testing reveals about their rhythms, and the lifestyle factors that influence them.",
      },
      {
        title: "Adrenal Insufficiency Protocols",
        tag: "Applied",
        description:
          "Distinguishes the well-documented physiology of adrenal insufficiency from popular fatigue narratives, describing how cortisol deficiency is actually diagnosed and managed.",
      },
    ],
  },
  {
    id: "orthopedics",
    name: "Orthopedics & Structural",
    color: "#00ff88",
    icon: "flame",
    description:
      "The living framework: bone that remodels under load, cartilage that cushions every step, collagen woven for strength. Structure here is not static but a constant negotiation between stress and repair.",
    tools: [
      "Bone Biology Lab",
      "Cartilage Explorer",
      "Joint Mechanics Simulator",
      "Collagen Synthesis Lab",
      "Structural Analysis Tool",
    ],
    mirrorName: "Orthopedics Mirror",
    mirrorPrompts: [
      "How do osteoblasts and osteoclasts negotiate the skeleton, rebuilding it bone cell by bone cell?",
      "Why does articular cartilage heal so poorly once damaged, given the joints it protects?",
      "What forces travel through a knee during a simple walk, and how does cartilage spread them?",
      "Which nutrients and signals does a fibroblast need to weave collagen with correct alignment?",
    ],
    cards: [
      {
        title: "Bone Remodeling Cycle",
        tag: "Core",
        description:
          "Explains the lifelong partnership of osteoclasts resorbing and osteoblasts rebuilding bone, guided by mechanical load, hormones and calcium signaling.",
      },
      {
        title: "Articular Cartilage Biology",
        tag: "Advanced",
        description:
          "Examines the avascular, low-cell cartilage layer that lets joints glide with almost no friction, and why its sparse chondrocytes repair damage so reluctantly.",
      },
      {
        title: "Collagen Synthesis Pathways",
        tag: "Research",
        description:
          "Traces collagen from gene transcription through vitamin-C-dependent hydroxylation to the triple helix and the cross-linked fibers that give tissue its tensile strength.",
      },
      {
        title: "Stem Cell Cartilage Repair",
        tag: "Applied",
        description:
          "Surveys how mesenchymal stem cells and scaffold technologies are being studied to regrow cartilage, including what has worked in the lab versus the clinic.",
      },
    ],
  },
  {
    id: "cardiology",
    name: "Cardiology & Circulation",
    color: "#00b4d8",
    icon: "heart",
    description:
      "The circulation as a single intelligent circuit: endothelium sensing flow, pressure adapting beat by beat, nitric oxide adjusting every vessel. Cardiovascular health is written in these small daily signals.",
    tools: [
      "Endothelial Biology Lab",
      "Hemodynamics Simulator",
      "Cardiac Output Analyzer",
      "Nitric Oxide Pathway Lab",
      "Arterial Health Tracker",
    ],
    mirrorName: "Cardiology Mirror",
    mirrorPrompts: [
      "How does the endothelium sense blood flow and tell each artery how wide to open?",
      "What keeps blood moving from heartbeat to fingertip, and where does pressure drop fastest?",
      "Why is nitric oxide called the guardian of the vessels, and how does production decline with age?",
      "Could an artery in the middle of forming a plaque still be guided back?",
    ],
    cards: [
      {
        title: "Endothelial Function & NO Signaling",
        tag: "Core",
        description:
          "Explains how the endothelial lining releases nitric oxide to relax vessels, regulate pressure and prevent adhesion, and why its health underlies the whole circulation.",
      },
      {
        title: "Hemodynamic Principles",
        tag: "Advanced",
        description:
          "Covers the physics of circulation, including Poiseuille's law, laminar and turbulent flow, and how vessel radius dominates resistance far more than viscosity.",
      },
      {
        title: "Atherosclerosis Pathogenesis",
        tag: "Research",
        description:
          "Follows plaque formation from endothelial injury through LDL retention and macrophage foam cells to fibrous cap growth, the long quiet arc of arterial disease.",
      },
      {
        title: "Regenerative Cardiology",
        tag: "Applied",
        description:
          "Reviews research into repairing heart tissue after injury, from cardiac progenitor cells to engineered patches, and what current evidence honestly supports.",
      },
    ],
  },
];

export const LAB_CATEGORY_COUNT = LAB_CATEGORIES.length;

export const LAB_TOOL_COUNT = LAB_CATEGORIES.reduce(
  (n, c) => n + c.tools.length,
  0
);

export function getLabCategory(id: string): LabCategory | undefined {
  return LAB_CATEGORIES.find((c) => c.id === id);
}
