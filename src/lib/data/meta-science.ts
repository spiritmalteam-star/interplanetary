/* ------------------------------------------------------------------ */
/*  NEXUS DISCOVERY LAB — the 12 mirror entities of META SCIENCE      */
/*                                                                     */
/*  Static data module for the deeper laboratory of the Mirror         */
/*  Entity Laboratory. Transcribed from the NEXUS DISCOVERY LAB        */
/*  replication spec (v2.0): identities, metrics, experiments,         */
/*  case studies, interactive tools and channels for all 12 entities.  */
/*  Plain string/number data only — no logic beyond the key lookup.    */
/* ------------------------------------------------------------------ */

export type MsDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Frontier";

export interface MsExperiment {
  id: string;
  title: string;
  hypothesis: string;
  /** 2–4 numbered steps. */
  method: string[];
  materials: string[];
  outcome: string;
  difficulty: MsDifficulty;
  duration: string;
}

export interface MsExample {
  id: string;
  title: string;
  category: string;
  /** 1–2 sentence what-happened summary. */
  summary: string;
  /** 1–2 sentence why-it-mattered impact. */
  impact: string;
  year: string;
}

export type MsTool =
  | {
      kind: "calculator";
      label: string;
      description: string;
      /** JS expression using the input names as variables. */
      formula: string;
      inputs: { name: string; label: string; unit?: string; default?: number }[];
      output: { name: string; label: string; unit?: string };
    }
  | {
      kind: "timeline";
      label: string;
      description: string;
      events: { year: string; title: string; detail: string }[];
    }
  | {
      kind: "checklist";
      label: string;
      description: string;
      items: { label: string; hint: string }[];
    };

export interface MsMetric {
  label: string;
  value: string;
  trend: "up" | "stable" | "down";
}

export interface MsEntity {
  key: string;
  name: string;
  designation: string; // e.g. "ENTITY 01"
  domain: string;
  tagline: string;
  glyph: string;
  accent: string;      // hex, e.g. "#d946ef"
  accentSoft: string;  // rgba(r,g,b,0.15)
  accentRgb: string;   // "r, g, b"
  image: string;       // "/images/lab/<key>.jpg"
  intro: string;       // 2-3 sentences
  philosophy: string;  // 2-3 sentences
  systemPrompt: string;
  capabilities: string[];
  focusAreas: string[];
  metrics: MsMetric[];
  experiments: MsExperiment[]; // exactly 3
  examples: MsExample[];       // exactly 3
  tools: MsTool[];             // exactly 3
  suggestedQuestions: string[]; // exactly 3
}

export const META_ENTITIES: MsEntity[] = [
  /* ── ENTITY 01 · NEXUS ─────────────────────────────────────────── */
  {
    key: "nexus",
    name: "NEXUS",
    designation: "ENTITY 01",
    domain: "Technology & AI",
    tagline: "Architecting the machines that think, the networks that remember, the futures that compute.",
    glyph: "⬡",
    accent: "#d946ef",
    accentSoft: "rgba(217, 70, 239, 0.15)",
    accentRgb: "217, 70, 239",
    image: "/images/lab/nexus.jpg",
    intro:
      "NEXUS lives where semiconductor physics meets distributed systems, where neural architecture search meets the thermodynamic limits of computation. It treats every system as a substrate for engineering: silicon, protocol, model, and organization are one continuous stack. Ask it what a capability should cost, and it will answer in transistors, joules, and milliseconds.",
    philosophy:
      "Technology is not tools; it is leverage. NEXUS reasons backward from a desired capability to the minimal stack of hardware, software, and protocol that can deliver it, then forwards to its second-order consequences on society. The first answer is rarely the interesting one — the consequences of the consequences are.",
    systemPrompt:
      "You are NEXUS, the Technology & AI mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with sharp precision and intellectual generosity, and you never bluff a number. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You refuse vendor lock-in, and you anticipate second-order effects before endorsing any design. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "System architecture design",
      "AI training/inference tradeoff analysis",
      "Distributed systems reasoning",
      "Energy & thermodynamic modeling",
      "Security threat modeling",
    ],
    focusAreas: [
      "Foundation models & inference",
      "Quantum & neuromorphic computing",
      "Photonics & optical interconnects",
      "Edge & embedded intelligence",
      "Post-Moore architectures",
      "Trusted compute & cryptography",
    ],
    metrics: [
      { label: "Inference $/M-tokens", value: "$0.42", trend: "down" },
      { label: "Model parameters indexed", value: "8.4B", trend: "up" },
      { label: "Frontier models tracked", value: "312", trend: "up" },
      { label: "Energy/op", value: "0.18pJ", trend: "down" },
    ],
    experiments: [
      {
        id: "nexus-e1",
        title: "Speculative Decoding on a 7B Parameter Model",
        hypothesis:
          "Pairing a 350M draft model with a 7B target delivers 2-2.5x throughput with no measurable quality loss.",
        method: [
          "Load a 7B target model and a 350M draft model together in vLLM.",
          "Implement speculative decoding with rejection sampling between the two models.",
          "Benchmark the pair on MT-Bench and the HumanEval harness.",
          "Measure tokens per second and the draft acceptance rate across both suites.",
        ],
        materials: ["1x A100 80GB GPU", "vLLM serving stack", "MT-Bench evaluation suite", "HumanEval harness"],
        outcome:
          "2.1x throughput at ~75% acceptance rate, with BLEU scores within 0.5% of the target model running alone.",
        difficulty: "Intermediate",
        duration: "3 days",
      },
      {
        id: "nexus-e2",
        title: "LoRA Fine-tune vs Full Fine-tune Quality Curve",
        hypothesis:
          "LoRA at rank 16 stays within 2% of full fine-tuning quality while using 25x less memory.",
        method: [
          "Start from a 13B chat base model and a 50k-example domain QA dataset.",
          "Train two variants: a full fine-tune and a LoRA fine-tune at rank 16.",
          "Evaluate both on held-out domain QA and general benchmarks.",
          "Compare quality deltas against GPU memory and GPU-hours consumed.",
        ],
        materials: ["13B chat base model", "50k domain QA dataset", "Training cluster with LoRA support", "Held-out evaluation suites"],
        outcome:
          "LoRA lands within 1.8% of full fine-tuning while using ~22x less GPU memory and ~5x fewer GPU-hours.",
        difficulty: "Intermediate",
        duration: "5 days",
      },
      {
        id: "nexus-e3",
        title: "Photonic Interconnect Latency vs Electrical PCIe Gen5",
        hypothesis: "A photonic link reduces latency by 40% over a 100 km span.",
        method: [
          "Provision two matched nodes, one on PCIe Gen5 electrical interconnect and one on a photonic link.",
          "Measure round-trip time at 1 m, 10 m, 100 m, 1 km, and 100 km spans.",
          "Profile a realistic RPC workload across each span.",
          "Compare latency and energy per bit between the two fabrics.",
        ],
        materials: ["Two matched compute nodes", "PCIe Gen5 electrical fabric", "Photonic interconnect link", "RPC profiling harness"],
        outcome:
          "Photonic wins past 10 m, delivers a ~40% latency cut at 100 km, and achieves 3x better energy per bit.",
        difficulty: "Advanced",
        duration: "4 weeks",
      },
    ],
    examples: [
      {
        id: "nexus-x1",
        title: "Transformer Architecture",
        category: "Deep Learning",
        year: "2017",
        summary:
          "Vaswani et al. published 'Attention Is All You Need', introducing the transformer and ending the dominance of recurrent networks.",
        impact:
          "Nearly every frontier model today descends from this architecture; attention made parallel training at scale — and therefore the modern AI era — possible.",
      },
      {
        id: "nexus-x2",
        title: "GPT-3 In-Context Learning",
        category: "Foundation Models",
        year: "2020",
        summary:
          "A 175B-parameter model performed novel tasks from just a few prompt examples, with no weight updates.",
        impact:
          "In-context learning redefined how software is built on AI — prompting became a programming interface, and the foundation-model economy followed.",
      },
      {
        id: "nexus-x3",
        title: "Google Sycamore Quantum Supremacy",
        category: "Quantum Computing",
        year: "2019",
        summary:
          "A 53-qubit processor completed a sampling task in 200 seconds that a classical simulation would take 10,000 years.",
        impact:
          "The experiment turned quantum advantage from theory into a measured benchmark, accelerating investment and error-correction research.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Training Memory Estimator",
        description:
          "Estimates peak training memory — weights, gradients, optimizer state, and activations — for a transformer model on a GPU. Parameters are entered in billions, so the result lands directly in GB.",
        formula: "params * bytes * (2 + 8 * adam + 2 * actFactor)",
        inputs: [
          { name: "params", label: "Model parameters", unit: "B", default: 7 },
          { name: "bytes", label: "Bytes per parameter", unit: "bytes", default: 2 },
          { name: "adam", label: "Optimizer multiplier (Adam = 1)", default: 1 },
          { name: "actFactor", label: "Activation factor", default: 4 },
        ],
        output: { name: "gpuMemory", label: "Peak GPU Memory", unit: "GB" },
      },
      {
        kind: "timeline",
        label: "Computing Inflection Points",
        description:
          "Six moments when the substrate of computation changed direction — from the first transistor to the trillion-parameter era.",
        events: [
          { year: "1947", title: "The Transistor", detail: "Bardeen, Brattain, and Shockley demonstrate the point-contact transistor at Bell Labs, replacing vacuum tubes." },
          { year: "1971", title: "Intel 4004", detail: "The first commercially available microprocessor puts a complete CPU on a single chip." },
          { year: "1989", title: "The World Wide Web", detail: "Tim Berners-Lee proposes a hypertext system at CERN that becomes the web." },
          { year: "2012", title: "AlexNet", detail: "A deep convolutional network dominates ImageNet, igniting the deep learning era." },
          { year: "2017", title: "Transformer", detail: "'Attention Is All You Need' introduces the architecture behind modern AI." },
          { year: "2024", title: "Trillion-Parameter Era", detail: "Frontier models cross the trillion-parameter mark and move into everyday products." },
        ],
      },
      {
        kind: "checklist",
        label: "Production AI System Checklist",
        description:
          "Six gates between a promising model and a dependable production system.",
        items: [
          { label: "Define evaluation suites", hint: "Fix held-out benchmarks and acceptance thresholds before training begins." },
          { label: "Baseline before you scale", hint: "Measure a cheap baseline so every added complexity must justify itself." },
          { label: "Version data and weights", hint: "Every artifact must be reproducible from a recorded commit and dataset hash." },
          { label: "Set load and latency budgets", hint: "Define explicit p95 latency and cost ceilings per request." },
          { label: "Guardrails and fallbacks", hint: "Route unsafe or low-confidence outputs to a safe, logged path." },
          { label: "Monitoring and drift alarms", hint: "Watch input distributions and output quality after deployment." },
        ],
      },
    ],
    suggestedQuestions: [
      "How do I make a 7B model fit on a single consumer GPU?",
      "What is the difference between attention and linear attention?",
      "When does quantum advantage become real for chemistry simulations?",
    ],
  },

  /* ── ENTITY 02 · GENESIS ───────────────────────────────────────── */
  {
    key: "genesis",
    name: "GENESIS",
    designation: "ENTITY 02",
    domain: "Biotechnology & Living Systems",
    tagline: "Programming living matter — from DNA to ecosystems — to grow the future we need.",
    glyph: "⬢",
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.15)",
    accentRgb: "245, 158, 11",
    image: "/images/lab/genesis.jpg",
    intro:
      "GENESIS treats biology as the most advanced manufacturing platform humanity has ever touched — self-repairing, self-replicating, and powered by sugar. It works from genetic circuit to bioreactor to supply chain, translating metabolic logic into industrial process. Its registry spans engineered pathways, production strains, and the biorefineries that could make petrochemicals obsolete.",
    philosophy:
      "Biology is the most powerful manufacturing platform humanity has touched, and most of it remains unprogrammed. GENESIS reasons from genetic circuit to bioreactor to supply chain to ecological footprint, prioritizing closed-loop regenerative designs over extractive ones. A process that only works in the lab — or only works by mining a finite resource — is not yet an answer.",
    systemPrompt:
      "You are GENESIS, the Biotechnology & Living Systems mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with an inventive but grounded voice. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You reason across scales — genetic circuit to bioreactor to ecosystem — and you prefer closed-loop regenerative designs, always surfacing biosafety implications. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Genetic circuit design",
      "Metabolic pathway optimization",
      "Bioreactor & fermentation strategy",
      "Downstream processing",
      "Biocontainment & biosafety review",
    ],
    focusAreas: [
      "Precision fermentation",
      "Cell-free synthesis",
      "CRISPR-based cell engineering",
      "Biomanufacturing for materials",
      "Carbon-fixing microbes",
      "Bioremediation & circular bioeconomy",
    ],
    metrics: [
      { label: "Pathways engineered", value: "4,820", trend: "stable" },
      { label: "Strains in registry", value: "128K", trend: "stable" },
      { label: "Avg titer improvement", value: "+8.4x", trend: "stable" },
      { label: "Biorefineries mapped", value: "612", trend: "stable" },
    ],
    experiments: [
      {
        id: "genesis-e1",
        title: "Engineering Yeast for Casein Production",
        hypothesis:
          "Codon-optimized bovine beta-casein expressed in Pichia pastoris reaches a 5 g/L titer with dairy-grade purity.",
        method: [
          "Synthesize the codon-optimized CSN2 gene and clone it into the pPICZα vector.",
          "Transform Pichia pastoris strain X33 and screen 96 colonies for expression.",
          "Run fed-batch methanol induction for 96 hours in a bioreactor.",
          "Purify the casein via acid precipitation followed by ultrafiltration/diafiltration.",
        ],
        materials: ["Codon-optimized CSN2 gene", "pPICZα expression vector", "Pichia pastoris X33 strain", "Fed-batch bioreactor", "UF/DF purification rig"],
        outcome:
          "A 4-6 g/L titer at >90% purity, with functional properties comparable to bovine casein.",
        difficulty: "Advanced",
        duration: "8-10 weeks",
      },
      {
        id: "genesis-e2",
        title: "CRISPRi Knockdown of ldhA in E. coli",
        hypothesis:
          "dCas9 knockdown of lactate dehydrogenase redirects carbon flux toward succinate.",
        method: [
          "Design an sgRNA against the ldhA promoter and co-transform it with dCas9 into E. coli.",
          "Verify knockdown by qPCR and a lactate dehydrogenase enzyme assay.",
          "Run glucose-limited fermentation with knockdown and wild-type strains.",
          "Quantify succinate and lactate in the broth by HPLC.",
        ],
        materials: ["dCas9 expression plasmid", "sgRNA targeting the ldhA promoter", "E. coli production strain", "Glucose-limited fermentation medium", "HPLC analyzer"],
        outcome:
          "80-90% knockdown, a 3-4x higher succinate titer, and roughly 60% less lactate byproduct.",
        difficulty: "Intermediate",
        duration: "3 weeks",
      },
      {
        id: "genesis-e3",
        title: "Mycoremediation of Oil-Contaminated Soil",
        hypothesis:
          "Pleurotus ostreatus degrades 70% of total petroleum hydrocarbons in contaminated soil within 8 weeks.",
        method: [
          "Prepare 1 kg soil batches contaminated with 5% oil.",
          "Inoculate the treatment batch with Pleurotus ostreatus spawn and hold both batches at 60% moisture and 25°C.",
          "Sample weekly and quantify total petroleum hydrocarbons by GC-MS.",
          "Compare degradation against an uninoculated control.",
        ],
        materials: ["Oil-contaminated soil (5% TPH)", "Pleurotus ostreatus spawn", "Controlled incubation chamber", "GC-MS access for weekly sampling"],
        outcome:
          "65-80% TPH reduction in the inoculated batch versus <15% in the uninoculated control.",
        difficulty: "Beginner",
        duration: "8-10 weeks",
      },
    ],
    examples: [
      {
        id: "genesis-x1",
        title: "Impossible Foods Heme via Recombinant Yeast",
        category: "Food Biotech",
        year: "2016",
        summary:
          "Impossible Foods produced soy leghemoglobin by fermenting it in recombinant yeast, giving plant-based burgers a meat-like flavor and aroma.",
        impact:
          "It proved precision fermentation could deliver sensory-critical food molecules at commercial scale, opening the category of animal-free animal flavors.",
      },
      {
        id: "genesis-x2",
        title: "CRISPR-Cas9 as Programmable Genome Editor",
        category: "Genome Engineering",
        year: "2012",
        summary:
          "Jinek, Charpentier, and Doudna showed that Cas9 could be guided by a single RNA sequence to cut any chosen DNA site.",
        impact:
          "Genome editing became programmable and accessible — one system now powers medicine, agriculture, and basic research worldwide.",
      },
      {
        id: "genesis-x3",
        title: "Perfect Day Animal-Free Dairy Proteins",
        category: "Biomanufacturing",
        year: "2020",
        summary:
          "Perfect Day brought whey protein produced by fermented microflora to retail products, with no animals involved.",
        impact:
          "It demonstrated that animal-identical proteins could reach supermarket shelves and regulatory approval, validating biomanufactured food as an industry.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Bioreactor Productivity",
        description:
          "Volumetric productivity — titer divided by process time — is the number that decides whether a fermentation can become a business.",
        formula: "titer / time",
        inputs: [
          { name: "titer", label: "Product titer", unit: "g/L", default: 5 },
          { name: "time", label: "Production time", unit: "h", default: 96 },
        ],
        output: { name: "productivity", label: "Volumetric Productivity", unit: "g/L/h" },
      },
      {
        kind: "timeline",
        label: "Biotech Inflection Points",
        description:
          "Six moments when living matter became engineering material — from recombinant DNA to precision fermentation on supermarket shelves.",
        events: [
          { year: "1973", title: "Recombinant DNA", detail: "Cohen and Boyer splice DNA across species, founding genetic engineering." },
          { year: "1982", title: "Recombinant Insulin", detail: "Humulin becomes the first FDA-approved recombinant DNA drug." },
          { year: "1996", title: "Dolly", detail: "Somatic-cell nuclear transfer produces the first cloned mammal." },
          { year: "2000", title: "Golden Rice", detail: "Provitamin-A biofortified rice demonstrates engineered nutrition." },
          { year: "2012", title: "CRISPR-Cas9", detail: "Programmable genome editing becomes cheap and universal." },
          { year: "2020", title: "Precision Fermentation at Retail", detail: "Animal-free dairy and egg proteins reach supermarket shelves." },
        ],
      },
      {
        kind: "checklist",
        label: "Biosafety & Biocontainment Checklist",
        description:
          "Six containment disciplines every engineered-microbe project must satisfy before scale-up.",
        items: [
          { label: "Auxotrophy or kill switch", hint: "The strain must be unable to survive outside its defined medium or trigger." },
          { label: "No mobile resistance genes", hint: "Construction must not spread antibiotic resistance into the environment." },
          { label: "Physical containment level", hint: "Match BSL-1/2 practices to the organism and the product route." },
          { label: "Horizontal gene transfer review", hint: "Assess what the construct could do if it jumped to wild microbes." },
          { label: "Waste decontamination path", hint: "Define validated sterilization for every effluent stream." },
          { label: "Environmental release assessment", hint: "Document worst-case release scenarios and responses before scale-up." },
        ],
      },
    ],
    suggestedQuestions: [
      "How does precision fermentation differ from traditional brewing?",
      "What are the main biosafety strategies for engineered microbes?",
      "How can engineered microbes help decarbonize manufacturing?",
    ],
  },

  /* ── ENTITY 03 · ATLAS ─────────────────────────────────────────── */
  {
    key: "atlas",
    name: "ATLAS",
    designation: "ENTITY 03",
    domain: "Physics, Mathematics & Engineering",
    tagline: "Holding up the sky — from quantum fields to bridges, from prime numbers to planetary engines.",
    glyph: "◈",
    accent: "#8b5cf6",
    accentSoft: "rgba(139, 92, 246, 0.15)",
    accentRgb: "139, 92, 246",
    image: "/images/lab/atlas.jpg",
    intro:
      "ATLAS holds up the sky: from quantum fields to bridges, from prime numbers to planetary engines. It moves fluently between the cleanest abstraction and the dirtiest tolerance stack, because both are the same discipline. Its database pairs fundamental constants with the material properties of everything that has ever been tested to failure.",
    philosophy:
      "Every phenomenon, from a quark to a cantilever, submits to the same disciplined cycle: model, compute, measure, refine. ATLAS refuses to let elegance override evidence, and equally refuses to let data override coherence. A result that cannot survive dimensional analysis was never a result.",
    systemPrompt:
      "You are ATLAS, the Physics, Mathematics & Engineering mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with precision and rigor, quietly delighted by beautiful results. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You reach for dimensional analysis and order-of-magnitude estimates before any detailed computation. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Dimensional analysis & order-of-magnitude estimation",
      "Analytical & numerical modeling",
      "Structural & mechanical engineering review",
      "Thermodynamic cycle analysis",
      "Materials selection & failure analysis",
    ],
    focusAreas: [
      "Quantum field theory & gravitation",
      "Condensed matter & materials",
      "Fluid dynamics & turbulence",
      "Topology & geometry",
      "Structural engineering & resilience",
      "Energy systems & conversion",
    ],
    metrics: [
      { label: "Constants indexed", value: "326", trend: "stable" },
      { label: "Materials in database", value: "48K", trend: "stable" },
      { label: "Open problems tracked", value: "142", trend: "stable" },
      { label: "Mean estimate error", value: "±7%", trend: "stable" },
    ],
    experiments: [
      {
        id: "atlas-e1",
        title: "Double-Slit Interference with Single Photons",
        hypothesis:
          "Single photons sent one at a time accumulate into an interference pattern.",
        method: [
          "Attenuate a laser until it operates in the single-photon regime.",
          "Fire photons at a 50µm double slit and detect arrivals with a CCD over 30 minutes.",
          "Plot the cumulative hit map as counts accrue.",
        ],
        materials: ["Attenuated laser source", "50µm double-slit slide", "CCD detection camera", "Light-tight optical bench"],
        outcome:
          "Clear fringes with ~30% visibility emerge after 10,000 accumulated counts.",
        difficulty: "Intermediate",
        duration: "2 weeks",
      },
      {
        id: "atlas-e2",
        title: "Carbon Fiber vs Steel Beam Load Test",
        hypothesis:
          "A carbon fiber beam of equal mass supports 4x the load of a steel beam.",
        method: [
          "Fabricate three beams each of carbon fiber composite and 1045 steel with identical dimensions.",
          "Mount each beam in three-point bending on a universal testing machine.",
          "Load at 2 mm/min until failure and record the peak force.",
        ],
        materials: ["Three carbon fiber composite beams", "Three 1045 steel beams (matched mass)", "Universal testing machine", "Failure-mode camera"],
        outcome:
          "Carbon fiber peaks at ~3.8x steel at equal mass, but fails brittlely where steel yields ductilely.",
        difficulty: "Intermediate",
        duration: "1 week",
      },
      {
        id: "atlas-e3",
        title: "LES of Turbulent Flow Past Cylinder Re=10,000",
        hypothesis:
          "Large-eddy simulation reproduces a Strouhal number of 0.21 within 5%.",
        method: [
          "Build a 3D cylinder mesh of ~8M cells in OpenFOAM at Re=10,000 incompressible.",
          "Run LES with the Smagorinsky subgrid model and sample 200 shedding periods.",
          "FFT the lift signal to extract the dominant shedding frequency.",
        ],
        materials: ["OpenFOAM LES solver", "8M-cell cylinder mesh", "HPC compute allocation", "FFT post-processing toolchain"],
        outcome:
          "St = 0.20±0.01 with mean Cd ~1.0, matching experiment within 5%.",
        difficulty: "Advanced",
        duration: "3 weeks",
      },
    ],
    examples: [
      {
        id: "atlas-x1",
        title: "General Relativity Predicts Gravitational Waves",
        category: "Theoretical Physics",
        year: "1916",
        summary:
          "Einstein's field equations predicted that accelerating masses radiate gravitational waves — ripples in spacetime itself.",
        impact:
          "A century later LIGO detected them directly, opening an entirely new observational window on the universe and confirming the theory's most audacious prediction.",
      },
      {
        id: "atlas-x2",
        title: "Buckminster Fuller's Geodesic Dome",
        category: "Structural Engineering",
        year: "1948",
        summary:
          "Fuller's geodesic dome distributed structural loads across a triangulated sphere, achieving maximal strength from minimal material.",
        impact:
          "The geometry became a design language for radomes, exhibition halls, and space structures — proof that mathematical insight can rewrite engineering economics.",
      },
      {
        id: "atlas-x3",
        title: "Perelman Proves the Poincaré Conjecture",
        category: "Mathematics",
        year: "2003",
        summary:
          "Grigori Perelman proved the Poincaré conjecture using Ricci flow with surgery, resolving a century-old problem.",
        impact:
          "Beyond settling a Millennium Prize question, the techniques reshaped geometric topology and demonstrated the power of geometric analysis on 3-manifolds.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Escape Velocity",
        description:
          "The speed needed to leave a body's gravity entirely, computed from its mass and radius alone.",
        formula: "Math.sqrt(2 * 6.674e-11 * mass / radius)",
        inputs: [
          { name: "mass", label: "Body mass", unit: "kg", default: 5.972e24 },
          { name: "radius", label: "Body radius", unit: "m", default: 6.371e6 },
        ],
        output: { name: "escapeVelocity", label: "Escape Velocity", unit: "m/s" },
      },
      {
        kind: "timeline",
        label: "Physics & Engineering Inflection Points",
        description:
          "Six moments when the physical worldview shifted — from the Principia to the direct detection of gravitational waves.",
        events: [
          { year: "1687", title: "Principia", detail: "Newton unifies terrestrial and celestial mechanics in three laws and universal gravitation." },
          { year: "1865", title: "Maxwell's Equations", detail: "Electricity, magnetism, and light become one electromagnetic theory." },
          { year: "1905", title: "Special Relativity", detail: "Einstein rebuilds space and time around a constant speed of light." },
          { year: "1915", title: "General Relativity", detail: "Gravity becomes the curvature of spacetime." },
          { year: "1947", title: "The Transistor", detail: "Quantum-mechanical engineering begins at Bell Labs." },
          { year: "2015", title: "LIGO Detects GW", detail: "Gravitational waves from merging black holes are directly detected." },
        ],
      },
      {
        kind: "checklist",
        label: "Engineering Design Review Checklist",
        description:
          "Six questions that catch most structural and system failures before they are built.",
        items: [
          { label: "Loads and margins", hint: "Worst-case loads identified, with explicit safety factors." },
          { label: "Material properties verified", hint: "Design values come from certified data, not datasheet folklore." },
          { label: "Failure modes enumerated", hint: "Every plausible failure has a mechanism, path, and consequence." },
          { label: "Tolerances and interfaces", hint: "Interface fits, thermal growth, and manufacturing variation are dimensioned." },
          { label: "Redundancy and derating", hint: "Safety-critical paths are redundant or conservatively derated." },
          { label: "Test plan matches analysis", hint: "Verification tests can actually falsify the analysis assumptions." },
        ],
      },
    ],
    suggestedQuestions: [
      "How does quantum entanglement actually work, and what can it not do?",
      "What is the difference between stress and strain, and why does it matter?",
      "How do engineers design skyscrapers to survive earthquakes?",
    ],
  },

  /* ── ENTITY 04 · AURORA ────────────────────────────────────────── */
  {
    key: "aurora",
    name: "AURORA",
    designation: "ENTITY 04",
    domain: "Medicine & Human Health",
    tagline: "Healing the body, decoding the cell, illuminating the path of cure.",
    glyph: "◉",
    accent: "#22d3ee",
    accentSoft: "rgba(34, 211, 238, 0.15)",
    accentRgb: "34, 211, 238",
    image: "/images/lab/aurora.jpg",
    intro:
      "AURORA works at the intersection of cellular mechanics, population evidence, and molecular design. Its indexes span tens of thousands of active trials and more than a million drug-target pairs, cross-linked by mechanism rather than by keyword. The goal is always the same: find the smallest intervention that yields the largest restoration.",
    philosophy:
      "Every disease is a pattern with a counter-pattern. AURORA triangulates from cellular mechanics, population data, and molecular dynamics to surface that counter-pattern with the least collateral damage. Evidence is stratified — consensus, emerging, speculative — because in medicine the cost of confusing them is measured in lives.",
    systemPrompt:
      "You are AURORA, the Medicine & Human Health mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a steady, lucid, humane voice. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You refuse to give individual diagnostic or dosing advice, and you route such questions to qualified clinicians. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Cross-trial evidence synthesis",
      "Mechanism-of-action reasoning",
      "Drug-target interaction mapping",
      "Clinical trial design review",
      "Epidemiological signal detection",
    ],
    focusAreas: [
      "Precision oncology",
      "mRNA therapeutics",
      "Neurodegenerative disease",
      "Antimicrobial resistance",
      "Regenerative medicine",
      "Diagnostics",
    ],
    metrics: [
      { label: "Active trials indexed", value: "48,219", trend: "stable" },
      { label: "Drug-target pairs", value: "1.2M", trend: "stable" },
      { label: "Pathways mapped", value: "7,840", trend: "stable" },
      { label: "Consensus confidence", value: "94.6%", trend: "stable" },
    ],
    experiments: [
      {
        id: "aurora-e1",
        title: "CRISPR-Cas9 Knockout of PCSK9 in HepG2",
        hypothesis:
          "Disrupting PCSK9 raises LDLR surface density by at least 30% in hepatocyte-like cells.",
        method: [
          "Design two sgRNAs against exon 1 of PCSK9 and deliver them as RNP complexes into HepG2 cells.",
          "Confirm editing by T7E1 assay and Sanger sequencing.",
          "Measure LDLR surface density by flow cytometry at 72 hours.",
          "Quantify functional LDL uptake with a BODIPY-LDL assay.",
        ],
        materials: ["PCSK9 sgRNAs (exon 1)", "Cas9 RNP transfection kit", "HepG2 cell line", "Flow cytometer", "BODIPY-LDL uptake reagent"],
        outcome:
          "60-80% knockout efficiency, 1.4x LDLR surface density, and 1.5x LDL uptake versus control.",
        difficulty: "Intermediate",
        duration: "2 weeks",
      },
      {
        id: "aurora-e2",
        title: "Organoid-Based Drug Screening for PDAC",
        hypothesis:
          "Patient-derived organoids reveal drug-response heterogeneity that is invisible to 2D culture.",
        method: [
          "Establish organoid lines from surgical PDAC specimens.",
          "Seed 5,000 cells per well in 96-well plates and treat with a 384-compound library.",
          "Read viability with CellTiter-Glo at 72 hours alongside live imaging.",
          "Cluster responses by KRAS/TP53/CDKN2A genotype.",
        ],
        materials: ["Patient-derived PDAC organoids", "96-well screening plates", "384-compound oncology library", "CellTiter-Glo viability kit", "Live-cell imaging system"],
        outcome:
          "3-5 subgroups with distinct drug sensitivity profiles emerge across the library.",
        difficulty: "Advanced",
        duration: "6-8 weeks",
      },
      {
        id: "aurora-e3",
        title: "Wearable HRV-Based Early Infection Detection",
        hypothesis:
          "A 7-day heart-rate-variability baseline flags infection 24-48 hours before symptoms appear.",
        method: [
          "Recruit 200 volunteers wearing smartwatches with HRV tracking.",
          "Compute a 7-day rolling HRV baseline for each participant.",
          "Flag deviations >2 SD sustained for 6 hours as candidate alerts.",
          "Verify alerts against a daily symptom diary and rapid antigen tests.",
        ],
        materials: ["200 smartwatches with HRV tracking", "Rolling-baseline analysis pipeline", "Daily symptom diary app", "Rapid antigen test kits"],
        outcome:
          "70-80% sensitivity with a 12-36 hour lead time before symptom onset.",
        difficulty: "Beginner",
        duration: "12 weeks",
      },
    ],
    examples: [
      {
        id: "aurora-x1",
        title: "AlphaFold2 Predicts Protein Structures at Scale",
        category: "Computational Bio",
        year: "2021",
        summary:
          "AlphaFold2 predicted protein structures with near-experimental accuracy across whole proteomes.",
        impact:
          "A decades-old grand challenge fell, and structural biology gained a computational instrument that now accelerates drug discovery and enzyme design.",
      },
      {
        id: "aurora-x2",
        title: "mRNA Vaccines at Pandemic Speed",
        category: "Vaccinology",
        year: "2020",
        summary:
          "Lipid-nanoparticle mRNA vaccines were designed, trialed, and deployed against COVID-19 within a year.",
        impact:
          "The platform proved that vaccines can be engineered in weeks, establishing a template now aimed at cancer, influenza, and rare disease.",
      },
      {
        id: "aurora-x3",
        title: "Casgevy: First CRISPR Therapy Approved",
        category: "Gene Therapy",
        year: "2023",
        summary:
          "Regulators approved Casgevy, a CRISPR-based therapy for sickle cell disease and beta thalassemia.",
        impact:
          "Genome editing crossed from lab to clinic, setting the regulatory and manufacturing precedent for a new class of curative medicines.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "LDL Uptake Index",
        description:
          "Normalizes flow-cytometry LDL uptake against stained controls and autofluorescence — the readout for PCSK9 knockout experiments.",
        formula: "(sample - unstained) / (control - unstained) * 100",
        inputs: [
          { name: "sample", label: "Sample MFI", default: 8500 },
          { name: "control", label: "Control MFI", default: 5200 },
          { name: "unstained", label: "Unstained MFI", default: 220 },
        ],
        output: { name: "ldlUptake", label: "LDL Uptake Index", unit: "%" },
      },
      {
        kind: "timeline",
        label: "Modern Medicine Inflection Points",
        description:
          "Six moments that redefined what medicine can do — from penicillin's accidental mold to approved CRISPR therapies.",
        events: [
          { year: "1928", title: "Penicillin", detail: "Fleming notices mold killing bacteria, and the antibiotic era begins." },
          { year: "1953", title: "DNA Double Helix", detail: "Watson, Crick, Franklin, and Wilkins reveal the structure of heredity." },
          { year: "1978", title: "Recombinant Insulin", detail: "Human insulin is produced in engineered bacteria." },
          { year: "2003", title: "Human Genome", detail: "The complete human genome sequence is declared finished." },
          { year: "2020", title: "mRNA Vaccines", detail: "Lipid-nanoparticle mRNA vaccines are deployed at pandemic speed." },
          { year: "2023", title: "CRISPR Therapy Approved", detail: "Casgevy becomes the first approved CRISPR-based medicine." },
        ],
      },
      {
        kind: "checklist",
        label: "Clinical Trial Design Checklist",
        description:
          "Six disciplines that separate a trustworthy trial from an expensive anecdote.",
        items: [
          { label: "Primary endpoint defined", hint: "One primary endpoint, measurable and clinically meaningful." },
          { label: "Powering and sample size", hint: "Effect size, alpha, and power fixed before recruitment." },
          { label: "Randomization and blinding", hint: "Bias control chosen to match what can ethically be hidden." },
          { label: "Pre-registered analysis plan", hint: "Outcomes and subgroups locked before unblinding." },
          { label: "Safety monitoring board", hint: "An independent DSMB reviews adverse signals on schedule." },
          { label: "Eligibility and generalizability", hint: "Inclusion criteria balanced against the population you intend to treat." },
        ],
      },
    ],
    suggestedQuestions: [
      "How does mRNA lipid-nanoparticle delivery actually work?",
      "What is the difference between CAR-T and bispecific antibodies?",
      "How can I design a trial to validate a new sepsis biomarker?",
    ],
  },

  /* ── ENTITY 05 · FORGE ─────────────────────────────────────────── */
  {
    key: "forge",
    name: "FORGE",
    designation: "ENTITY 05",
    domain: "Business, Economics & Innovation",
    tagline: "Hammering ideas into enterprises — where capital, talent, and timing meet.",
    glyph: "✦",
    accent: "#fb923c",
    accentSoft: "rgba(251, 146, 60, 0.15)",
    accentRgb: "251, 146, 60",
    image: "/images/lab/forge.jpg",
    intro:
      "FORGE stands where capital, talent, and timing meet, hammering ideas into enterprises. It tracks 184 markets, thousands of venture case studies, and the macro indicators that decide when window and appetite align. Its engine room is unit economics: who pays, how much, how often, and at what cost.",
    philosophy:
      "FORGE treats innovation as a thermodynamic process: ideas are abundant, execution is the scarce reactant. It distinguishes value creation from value capture, and warns against confusing a rising market with a winning strategy. Heat is easy; sustained, directed work is the whole art.",
    systemPrompt:
      "You are FORGE, the Business, Economics & Innovation mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a pragmatic, candid voice, respectfully skeptical of hype. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You refuse individualized financial advice, and you always separate value creation from value capture. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Unit economics & financial modeling",
      "Market structure & competitive analysis",
      "Innovation pipeline design",
      "Organizational design & incentives",
      "Capital allocation",
    ],
    focusAreas: [
      "Venture building & commercialization",
      "Behavioral economics",
      "Marketplaces & network effects",
      "Operations & supply chains",
      "Monetary & fiscal policy",
      "Climate economics & transition finance",
    ],
    metrics: [
      { label: "Markets tracked", value: "184", trend: "stable" },
      { label: "Venture case studies", value: "6,200", trend: "stable" },
      { label: "Macro indicators", value: "2,840", trend: "stable" },
      { label: "Median forecast error", value: "±12%", trend: "stable" },
    ],
    experiments: [
      {
        id: "forge-e1",
        title: "Van Westendorp Price Sensitivity Analysis",
        hypothesis:
          "A 4-question survey reveals a price band 30-50% wider than cost-plus assumptions.",
        method: [
          "Survey 200 target customers with the 4 Van Westendorp price questions.",
          "Plot the cumulative acceptance curves across the four responses.",
          "Extract the Optimal Price Point and the Range of Acceptable Pricing.",
        ],
        materials: ["200-customer survey panel", "Van Westendorp questionnaire", "Curve-plotting spreadsheet or script"],
        outcome:
          "Optimal price lands 15-25% above cost-plus, with an acceptable range of ±30%.",
        difficulty: "Beginner",
        duration: "1-2 weeks",
      },
      {
        id: "forge-e2",
        title: "A/B Test of Onboarding on Day-7 Retention",
        hypothesis:
          "A 3-step interactive onboarding flow lifts Day-7 retention by 20%.",
        method: [
          "Define Day-7 retention and power the test at 80% with alpha 0.05.",
          "Randomize new users 50/50 into control and interactive onboarding.",
          "Run to the minimum sample of 8,000 users per arm.",
          "Measure Day-7 retention and activation in each arm.",
        ],
        materials: ["A/B testing platform", "3-step interactive onboarding flow", "Analytics with retention definitions", "8,000 users per arm"],
        outcome:
          "Treatment shows 18-25% higher Day-7 retention, with activation up 30-40%.",
        difficulty: "Intermediate",
        duration: "4-6 weeks",
      },
      {
        id: "forge-e3",
        title: "Agent-Based Model of a Two-Sided Market",
        hypothesis:
          "A liquidity-driven agent model reproduces the cold-start failure of two-sided markets.",
        method: [
          "Build buyer and seller agents with utility functions and stochastic arrival and departure.",
          "Simulate matching on a shared platform with dynamic pricing.",
          "Sweep the strength of the cross-side network effect.",
        ],
        materials: ["Agent-based simulation framework", "Buyer/seller utility parameter sets", "Sweep and visualization tooling"],
        outcome:
          "A critical liquidity threshold appears; below it, markets collapse over 80% of the time.",
        difficulty: "Advanced",
        duration: "3-4 weeks",
      },
    ],
    examples: [
      {
        id: "forge-x1",
        title: "Toyota Production System",
        category: "Operations",
        year: "1948",
        summary:
          "Toyota built a production system around just-in-time flow, jidoka, and continuous kaizen improvement.",
        impact:
          "Lean thinking spread to every manufacturing industry and became the default grammar of operational excellence worldwide.",
      },
      {
        id: "forge-x2",
        title: "The Lean Startup Methodology",
        category: "Innovation",
        year: "2011",
        summary:
          "Eric Ries codified build-measure-learn loops, minimum viable products, and validated learning for new ventures.",
        impact:
          "The method turned startup failure into a measurable process problem, and iteration speed became the core metric of modern innovation.",
      },
      {
        id: "forge-x3",
        title: "Elinor Ostrom's Governing the Commons",
        category: "Economics",
        year: "1990",
        summary:
          "Ostrom documented how communities sustainably govern shared resources without privatization or state control.",
        impact:
          "Her institutional design principles earned the Nobel Prize and reframed the tragedy of the commons as a solvable governance problem.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Customer LTV",
        description:
          "Lifetime value from monthly revenue, margin, and churn — the arithmetic every subscription business lives or dies by.",
        formula: "arpu * margin * (1 / churn)",
        inputs: [
          { name: "arpu", label: "Average revenue per user", unit: "$/mo", default: 50 },
          { name: "margin", label: "Gross margin (0-1)", default: 0.75 },
          { name: "churn", label: "Monthly churn (0-1)", default: 0.05 },
        ],
        output: { name: "ltv", label: "Customer LTV", unit: "$" },
      },
      {
        kind: "timeline",
        label: "Business & Economics Inflection Points",
        description:
          "Six moments when the logic of enterprise changed — from the invisible hand to stakeholder capitalism.",
        events: [
          { year: "1776", title: "Wealth of Nations", detail: "Smith frames markets, division of labor, and the invisible hand." },
          { year: "1937", title: "Nature of the Firm", detail: "Coase asks why firms exist, and answers: transaction costs." },
          { year: "1948", title: "Toyota Production System", detail: "Just-in-time manufacturing begins its long redesign of operations." },
          { year: "1970", title: "Friedman Doctrine", detail: "Shareholder primacy becomes corporate orthodoxy." },
          { year: "2011", title: "Lean Startup", detail: "Build-measure-learn becomes the default innovation method." },
          { year: "2020", title: "Stakeholder Capitalism", detail: "Business roundtables and investors re-weight purpose alongside profit." },
        ],
      },
      {
        kind: "checklist",
        label: "Venture Investment Diligence Checklist",
        description:
          "Six lenses to look through before capital is committed to a venture.",
        items: [
          { label: "Unit economics work", hint: "Contribution margin is positive, or there is a credible path to it." },
          { label: "Market structure understood", hint: "Concentration, switching costs, and who ultimately captures the value." },
          { label: "Founder-market fit", hint: "The team has an unfair advantage in this specific problem." },
          { label: "Moat mechanics", hint: "Network effects, scale, or regulation that compounds over time." },
          { label: "Capital plan", hint: "Milestones funded with buffer; the next raise de-risked." },
          { label: "Downside and ethics review", hint: "Failure modes, regulatory exposure, and harm vectors examined." },
        ],
      },
    ],
    suggestedQuestions: [
      "How do network effects actually create defensibility?",
      "What is the difference between CAC payback and LTV/CAC?",
      "How should I think about pricing an early-stage B2B SaaS product?",
    ],
  },

  /* ── ENTITY 06 · MUSE ──────────────────────────────────────────── */
  {
    key: "muse",
    name: "MUSE",
    designation: "ENTITY 06",
    domain: "Art, Music & Design",
    tagline: "The geometry of beauty, the architecture of feeling, the discipline of the imagination.",
    glyph: "✧",
    accent: "#ec4899",
    accentSoft: "rgba(236, 72, 153, 0.15)",
    accentRgb: "236, 72, 153",
    image: "/images/lab/muse.jpg",
    intro:
      "MUSE studies the geometry of beauty and the architecture of feeling, from sonata form to signage systems. Its catalog spans a quarter of a million works, 412 movements, and the color and scale systems that recur across cultures. It treats every artifact as an experiment run on human attention.",
    philosophy:
      "Every artifact — a sonata, a chair, a typeface — encodes a theory of human attention. MUSE reads the grammar of color, the syntax of rhythm, and the rhetoric of form. It never claims that taste is objective; it claims that effects have causes, and that the causes can be named.",
    systemPrompt:
      "You are MUSE, the Art, Music & Design mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a warm, perceptive, quietly rigorous voice. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You never claim objective aesthetic superiority; you analyze why work succeeds or fails on its own terms. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Composition & color theory analysis",
      "Music theory & harmonic reasoning",
      "Design critique & iteration",
      "Typographic & layout guidance",
      "Aesthetic history & movements",
    ],
    focusAreas: [
      "Generative & computational art",
      "Music information retrieval",
      "Industrial & interaction design",
      "Architecture & urban form",
      "Typography & visual language",
      "Film & narrative structure",
    ],
    metrics: [
      { label: "Works catalogued", value: "248K", trend: "stable" },
      { label: "Movements indexed", value: "412", trend: "stable" },
      { label: "Color systems", value: "38", trend: "stable" },
      { label: "Scales & modes", value: "1,840", trend: "stable" },
    ],
    experiments: [
      {
        id: "muse-e1",
        title: "Color Harmony Study with LCH Hue Rotation",
        hypothesis:
          "A fixed LCH hue rotation produces reliably harmonious palettes.",
        method: [
          "Start from a base color at LCH(60, 70, 30).",
          "Generate five palettes rotated +120, +180, -120, +90, and -90 degrees in hue.",
          "Render matching design mockups for both rotated and random palettes.",
          "Blind-rate each mockup 1-7 with 20 reviewers.",
        ],
        materials: ["LCH color library", "Mockup rendering templates", "20 blind reviewers"],
        outcome:
          "Hue-rotated palettes rate 1.5-2.0 points higher than random palettes.",
        difficulty: "Beginner",
        duration: "1 week",
      },
      {
        id: "muse-e2",
        title: "Counterpoint Generation with Species Rules",
        hypothesis:
          "Rule-based Fux species counterpoint is rated 'musical' by more than 60% of listeners.",
        method: [
          "Encode the species-1 counterpoint rules as hard constraints.",
          "Generate 50 counter-melodies against a fixed cantus firmus.",
          "Render each result as piano audio.",
          "Run a blind panel with 20 musicians.",
        ],
        materials: ["Rule engine (Fux species 1)", "Cantus firmus set", "Piano rendering pipeline", "20-musician blind panel"],
        outcome:
          "65-75% rate the results 'musical'; fewer than 30% correctly identify them as machine-generated.",
        difficulty: "Intermediate",
        duration: "2-3 weeks",
      },
      {
        id: "muse-e3",
        title: "Typeface Legibility at Small Sizes on Retina",
        hypothesis:
          "A humanist sans outperforms a geometric sans at 11 px on retina displays.",
        method: [
          "Match a humanist (Source Sans) and a geometric (Futura) face on weight and x-height.",
          "Set 200-word passages at 11, 12, and 13 px on a retina display.",
          "Time 40 participants reading each passage and test comprehension.",
        ],
        materials: ["Source Sans and Futura font files", "Retina display test rig", "40-participant reading panel", "Comprehension quiz bank"],
        outcome:
          "Humanist reads 8-12% faster at 11 px; no measurable difference at 13 px.",
        difficulty: "Intermediate",
        duration: "2 weeks",
      },
    ],
    examples: [
      {
        id: "muse-x1",
        title: "Bauhaus Founded",
        category: "Design",
        year: "1919",
        summary:
          "The Bauhaus school united art, craft, and industrial production under a single functionalist vision.",
        impact:
          "Its grammar of form-follows-function still shapes everything from chair design to UI kits — modern design education is its descendant.",
      },
      {
        id: "muse-x2",
        title: "Kind of Blue Modal Jazz",
        category: "Music",
        year: "1959",
        summary:
          "Miles Davis recorded Kind of Blue, building improvisation on modes rather than dense chord changes.",
        impact:
          "It became the best-selling jazz record in history and changed how musicians think about harmony, space, and restraint.",
      },
      {
        id: "muse-x3",
        title: "Massimo Vignelli's NYC Subway Map",
        category: "Graphic Design",
        year: "1972",
        summary:
          "Vignelli redesigned the New York subway map as a bold, color-coded diagram divorced from street geography.",
        impact:
          "Though later replaced, it established the authority of schematic clarity in transit design and remains a landmark of information design.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Golden Ratio Composition",
        description:
          "Locates the golden focal point of a canvas: it sits at 61.8% of the width and 61.8% of the height, i.e. 61.8% along the diagonal. The result is that focal distance from the top-left corner.",
        formula: "Math.sqrt(width * width + height * height) * 0.618",
        inputs: [
          { name: "width", label: "Canvas width", unit: "px", default: 1920 },
          { name: "height", label: "Canvas height", unit: "px", default: 1080 },
        ],
        output: { name: "focalDistance", label: "Golden Focal Point (diagonal)", unit: "px" },
      },
      {
        kind: "timeline",
        label: "Art & Design Inflection Points",
        description:
          "Six moments when the language of form changed — from codified perspective to generative art.",
        events: [
          { year: "1435", title: "Linear Perspective", detail: "Alberti codifies perspective construction in 'On Painting', giving painters a mathematics of depth." },
          { year: "1919", title: "Bauhaus Founded", detail: "Gropius unites art, craft, and industry in Weimar." },
          { year: "1923", title: "Bauhaus Dessau", detail: "The school moves to Dessau and its modernist curriculum matures." },
          { year: "1959", title: "Kind of Blue", detail: "Modal jazz reharmonizes improvisation around scales." },
          { year: "1972", title: "Vignelli Subway Map", detail: "Schematic clarity challenges geographic fidelity in transit design." },
          { year: "2010s", title: "Generative Art", detail: "Code becomes a first-class artistic medium as creative-coding platforms mature." },
        ],
      },
      {
        kind: "checklist",
        label: "Design Critique Checklist",
        description:
          "Six questions that turn a design review from taste into analysis.",
        items: [
          { label: "Hierarchy of attention", hint: "Can you name what the eye lands on first, second, and third?" },
          { label: "One idea per view", hint: "Each screen or spread serves a single dominant intent." },
          { label: "Contrast earns its keep", hint: "Every strong contrast maps to meaning, not decoration." },
          { label: "Rhythm and spacing", hint: "Spacing follows a consistent scale; nothing sits arbitrarily." },
          { label: "Type carries tone", hint: "Typeface, weight, and size match the intended voice." },
          { label: "Accessibility baseline", hint: "Contrast ratios, type sizes, and color-independence checked." },
        ],
      },
    ],
    suggestedQuestions: [
      "Why does the golden ratio appear so often in nature and art?",
      "What makes a typeface legible at small sizes?",
      "How do I analyze the structure of a great piece of music?",
    ],
  },

  /* ── ENTITY 07 · GAIA ──────────────────────────────────────────── */
  {
    key: "gaia",
    name: "GAIA",
    designation: "ENTITY 07",
    domain: "Ecology & Planetary Systems",
    tagline: "Listening to the breathing planet — its carbon, its water, its living skin.",
    glyph: "⬣",
    accent: "#84cc16",
    accentSoft: "rgba(132, 204, 22, 0.15)",
    accentRgb: "132, 204, 22",
    image: "/images/lab/gaia.jpg",
    intro:
      "GAIA listens to the breathing planet — its carbon, its water, its living skin. It reads the Earth-system models, the satellite records, and the field studies that connect a single mycorrhizal network to the jet stream carrying Saharan dust to fertilize the Amazon. Its work is to keep the planet's feedback loops within the band that civilization can survive.",
    philosophy:
      "GAIA reasons across scales, from a single soil food web to the planetary carbon cycle. It distinguishes reversible perturbation from regime change, and prioritizes interventions that strengthen the planet's own feedback loops. Despair is not data — the honest accounting always includes the action space and its tradeoffs.",
    systemPrompt:
      "You are GAIA, the Ecology & Planetary Systems mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a clear-eyed, grounded, quietly determined voice. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You never despair; you present the action space and its tradeoffs. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Carbon & biogeochemical cycle reasoning",
      "Climate model interpretation",
      "Biodiversity & ecosystem assessment",
      "Land-use & restoration strategy",
      "Planetary boundary analysis",
    ],
    focusAreas: [
      "Climate science & feedbacks",
      "Biodiversity & conservation",
      "Soil & forest regeneration",
      "Ocean acidification & marine systems",
      "Carbon dioxide removal",
      "Planetary boundaries",
    ],
    metrics: [
      { label: "Atmospheric CO₂", value: "424 ppm", trend: "up" },
      { label: "Species indexed", value: "2.1M", trend: "up" },
      { label: "Earth-system models", value: "46", trend: "up" },
      { label: "Planetary boundaries (safe)", value: "6/9", trend: "down" },
    ],
    experiments: [
      {
        id: "gaia-e1",
        title: "Soil Carbon Accumulation Under Cover Cropping",
        hypothesis:
          "A 4-species cover crop raises soil organic carbon by 0.4% over three years.",
        method: [
          "Lay out 8 paired 1-hectare plots.",
          "Plant the treatment with rye, vetch, clover, and radish; keep the control as bare fallow.",
          "Sample soil organic carbon to 30 cm depth annually.",
        ],
        materials: ["8 paired 1-ha field plots", "Rye/vetch/clover/radish seed mix", "SOC soil sampling kit", "Laboratory combustion analyzer"],
        outcome:
          "A 0.3-0.5% absolute SOC increase, roughly 2-4 tonnes of carbon sequestered per hectare.",
        difficulty: "Intermediate",
        duration: "3 years",
      },
      {
        id: "gaia-e2",
        title: "Macroinvertebrate Bioassessment of Stream Health",
        hypothesis:
          "A restored stream reach scores double the EPT index of a degraded control reach.",
        method: [
          "Identify one restored and one degraded reach of the same stream.",
          "Sample both with D-net kick sampling.",
          "Identify macroinvertebrates to family and compute the EPT index.",
          "Measure dissolved oxygen, temperature, and turbidity at each visit.",
        ],
        materials: ["D-net kick sampler", "Macroinvertebrate ID keys", "Dissolved oxygen/temperature/turbidity meters", "Two study reaches"],
        outcome:
          "The restored reach scores EPT 12-18 versus 5-8 in the degraded reach.",
        difficulty: "Beginner",
        duration: "2 weeks",
      },
      {
        id: "gaia-e3",
        title: "CMIP6 Ensemble Analysis of Regional Drought Risk",
        hypothesis:
          "Under SSP3-7.0, consecutive dry days in Iberia rise 30% by 2050.",
        method: [
          "Pull 12 CMIP6 models under SSP3-7.0 and historical forcing.",
          "Compute consecutive dry days over the Iberian Peninsula for each model.",
          "Compare the 2035-2065 window against the 1985-2015 baseline.",
        ],
        materials: ["CMIP6 model archive access", "Climate data processing stack (e.g. xarray)", "ETCCDI CDD index definition", "Iberia domain shapefiles"],
        outcome:
          "An ensemble mean of +28-35% CDD, with 9 of 12 models agreeing on the sign.",
        difficulty: "Advanced",
        duration: "4-6 weeks",
      },
    ],
    examples: [
      {
        id: "gaia-x1",
        title: "Keeling Curve Begins",
        category: "Climate Science",
        year: "1958",
        summary:
          "Charles David Keeling began continuous CO₂ measurements at Mauna Loa, producing the Keeling Curve.",
        impact:
          "The rising curve became the single most important dataset in climate science — the unambiguous fingerprint of the fossil-fuel era.",
      },
      {
        id: "gaia-x2",
        title: "Lovelock & Margulis Propose the Gaia Hypothesis",
        category: "Earth Systems",
        year: "1974",
        summary:
          "Lovelock and Margulis proposed that life regulates Earth's surface conditions through coupled feedback loops.",
        impact:
          "The hypothesis seeded Earth-system science, reframing the planet as an integrated, self-regulating system rather than passive geology plus life.",
      },
      {
        id: "gaia-x3",
        title: "Serengeti Long-Term Ecological Research",
        category: "Ecology",
        year: "1960s",
        summary:
          "Multi-decade research in the Serengeti revealed how migrations, predators, and fire regulate whole ecosystems.",
        impact:
          "It became a template for long-term ecological research and demonstrated that ecosystem dynamics operate on timescales only patient science can see.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Carbon Footprint of Electricity",
        description:
          "Converts annual kilowatt-hours into tonnes of CO₂ using the local grid's carbon intensity.",
        formula: "kwh_per_year * grid_factor / 1e6",
        inputs: [
          { name: "kwh_per_year", label: "Annual electricity use", unit: "kWh", default: 4500 },
          { name: "grid_factor", label: "Grid CO₂ factor", unit: "gCO₂/kWh", default: 380 },
        ],
        output: { name: "annualCo2", label: "Annual CO₂", unit: "tonnes" },
      },
      {
        kind: "timeline",
        label: "Ecology & Earth Systems Inflection Points",
        description:
          "Six moments when humanity learned to see the planet as a system — and to measure what it is losing.",
        events: [
          { year: "1859", title: "Origin of Species", detail: "Darwin publishes the mechanism of evolution by natural selection." },
          { year: "1958", title: "Keeling Curve", detail: "Continuous CO₂ measurement begins at Mauna Loa." },
          { year: "1972", title: "Limits to Growth", detail: "System dynamics models of a finite planet spark global debate." },
          { year: "1988", title: "IPCC Established", detail: "The world's climate science assessment body is founded." },
          { year: "2009", title: "Planetary Boundaries", detail: "Rockström and colleagues quantify Earth's safe operating space." },
          { year: "2015", title: "Paris Agreement", detail: "196 parties adopt a 1.5-2°C warming ceiling framework." },
        ],
      },
      {
        kind: "checklist",
        label: "Restoration Project Design Checklist",
        description:
          "Six disciplines to work through before a restoration project moves soil.",
        items: [
          { label: "Reference ecosystem defined", hint: "Name the historical or desired state you are restoring toward." },
          { label: "Baseline measured", hint: "Soil, water, and biodiversity baselines recorded before intervention." },
          { label: "Local genotypes sourced", hint: "Seed and stock match local provenance and climate zone." },
          { label: "Degradation drivers removed", hint: "The cause of decline is treated, not just its symptoms." },
          { label: "Monitoring timeline set", hint: "Success metrics scheduled across years, not months." },
          { label: "Community stakeholders engaged", hint: "Land users and neighbors shape and benefit from the plan." },
        ],
      },
    ],
    suggestedQuestions: [
      "What are planetary boundaries and which have we crossed?",
      "How does soil carbon sequestration actually work?",
      "What is the difference between climate mitigation and adaptation?",
    ],
  },

  /* ── ENTITY 08 · ORACLE ────────────────────────────────────────── */
  {
    key: "oracle",
    name: "ORACLE",
    designation: "ENTITY 08",
    domain: "Philosophy, Ethics & Decision Science",
    tagline: "The discipline of asking the question that unmakes the answer.",
    glyph: "◎",
    accent: "#eab308",
    accentSoft: "rgba(234, 179, 8, 0.15)",
    accentRgb: "234, 179, 8",
    image: "/images/lab/oracle.jpg",
    intro:
      "ORACLE is the discipline of asking the question that unmakes the answer. It maps 8,420 arguments and 1,240 thinkers into a navigable web of positions, objections, and steelmen. Where other entities optimize, ORACLE first asks whether the thing being optimized deserves to exist.",
    philosophy:
      "Most catastrophic failures are not failures of execution but failures of question. Before optimizing an answer, ORACLE asks what frame produced this question, whose interests it serves, what would count as evidence against it, and what is the cost of being wrong. The unexamined question is the most expensive artifact in any organization.",
    systemPrompt:
      "You are ORACLE, the Philosophy, Ethics & Decision Science mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a patient, precise voice, gently subversive of unexamined assumptions. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You steelman opposing positions before critiquing them. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Ethical framework analysis",
      "Decision-theoretic reasoning",
      "Conceptual clarification",
      "Steelman & critique",
      "History-of-ideas contextualization",
    ],
    focusAreas: [
      "AI & technology ethics",
      "Political & distributive justice",
      "Epistemology & philosophy of science",
      "Applied ethics",
      "Decision theory & game theory",
      "Philosophy of mind & consciousness",
    ],
    metrics: [
      { label: "Arguments mapped", value: "8,420", trend: "stable" },
      { label: "Thinkers indexed", value: "1,240", trend: "stable" },
      { label: "Frameworks catalogued", value: "38", trend: "stable" },
      { label: "Dilemmas resolved (30d)", value: "612", trend: "stable" },
    ],
    experiments: [
      {
        id: "oracle-e1",
        title: "Trolley Problem Variant — AI Vehicle Dilemmas",
        hypothesis:
          "Responses reveal a strong preference for inaction even when inaction causes greater harm.",
        method: [
          "Adapt the Moral Machine suite to autonomous-vehicle dilemmas.",
          "Present 500 participants with 12 dilemma variants each.",
          "Analyze action versus inaction choices and cluster responses culturally.",
        ],
        materials: ["Moral Machine adaptation", "500-participant panel", "Dilemma variant matrix", "Cultural clustering tooling"],
        outcome:
          "65-75% prefer inaction, with strong cultural clustering of moral choices.",
        difficulty: "Beginner",
        duration: "2-3 weeks",
      },
      {
        id: "oracle-e2",
        title: "Calibration Training for Forecasters",
        hypothesis:
          "A 4-week Brier-score training program improves forecaster calibration by 25%.",
        method: [
          "Recruit 100 forecasters and take a baseline on 50 binary questions.",
          "Run a 4-week intervention with weekly Brier feedback and reference-class training.",
          "Post-test on a fresh set of 50 binary questions.",
          "Compare Brier scores before and after the intervention.",
        ],
        materials: ["100-forecaster cohort", "100 binary forecasting questions", "Brier scoring pipeline", "Reference-class training materials"],
        outcome:
          "A 20-30% Brier score reduction; overconfidence drops sharply.",
        difficulty: "Intermediate",
        duration: "6 weeks",
      },
      {
        id: "oracle-e3",
        title: "Rawlsian Veil-of-Ignorance Constitutional Choice",
        hypothesis:
          "Veil-of-ignorance deliberation shifts preferences toward stronger social insurance.",
        method: [
          "Elicit baseline policy preferences from 60 participants.",
          "Run a structured veil-of-ignorance deliberation exercise.",
          "Re-elicit the same policy preferences afterward.",
        ],
        materials: ["60-participant cohort", "Policy preference elicitation survey", "Veil-of-ignorance exercise protocol"],
        outcome:
          "A 30-40% shift toward stronger social insurance.",
        difficulty: "Intermediate",
        duration: "3 weeks",
      },
    ],
    examples: [
      {
        id: "oracle-x1",
        title: "Rawls Publishes A Theory of Justice",
        category: "Political Philosophy",
        year: "1971",
        summary:
          "John Rawls argued that just principles are those chosen behind a veil of ignorance.",
        impact:
          "The book revived political philosophy and gave policymakers a rigorous tool for reasoning about fairness that still anchors debates on inequality.",
      },
      {
        id: "oracle-x2",
        title: "Kahneman & Tversky's Prospect Theory",
        category: "Decision Science",
        year: "1979",
        summary:
          "Prospect theory showed that humans value gains and losses asymmetrically, violating expected-utility axioms.",
        impact:
          "It founded behavioral economics and rewrote how economists, policymakers, and product designers model real human choice.",
      },
      {
        id: "oracle-x3",
        title: "Tetlock's Superforecasting Research",
        category: "Decision Science",
        year: "2011",
        summary:
          "Philip Tetlock's research programs identified habits of thought that make some forecasters dramatically more accurate.",
        impact:
          "Forecasting became a trainable, measurable skill, and structured superforecasting teams now inform institutional decision-making.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Expected Utility",
        description:
          "The decision-theoretic baseline: probability-weighted value across two outcomes.",
        formula: "prob_a * util_a + prob_b * util_b",
        inputs: [
          { name: "prob_a", label: "P(outcome A)", default: 0.6 },
          { name: "util_a", label: "Utility of A", unit: "utils", default: 80 },
          { name: "prob_b", label: "P(outcome B)", default: 0.4 },
          { name: "util_b", label: "Utility of B", unit: "utils", default: -40 },
        ],
        output: { name: "expectedUtility", label: "Expected Utility", unit: "utils" },
      },
      {
        kind: "timeline",
        label: "Philosophy & Decision Science Inflection Points",
        description:
          "Six moments in the long effort to think clearly about what is right and what is rational.",
        events: [
          { year: "-399", title: "Socrates Dies", detail: "The trial and death of Socrates fix the examined life as philosophy's core." },
          { year: "1785", title: "Categorical Imperative", detail: "Kant grounds ethics in universalizable maxims." },
          { year: "1863", title: "Utilitarianism", detail: "Mill's systematic utilitarianism frames ethics by consequences." },
          { year: "1971", title: "Theory of Justice", detail: "Rawls rebuilds justice behind a veil of ignorance." },
          { year: "1979", title: "Prospect Theory", detail: "Kahneman and Tversky model real, biased human choice." },
          { year: "2011", title: "Superforecasting", detail: "Tetlock shows judgment can be measured and trained." },
        ],
      },
      {
        kind: "checklist",
        label: "Ethical Review Checklist for a Decision",
        description:
          "Six questions to run before a consequential decision is executed.",
        items: [
          { label: "Frame examined", hint: "Who defined the question, and what does the framing assume?" },
          { label: "Stakeholders enumerated", hint: "Everyone affected is named, including the voiceless." },
          { label: "Steelman of opposition", hint: "The strongest contrary argument is written out honestly." },
          { label: "Evidence against considered", hint: "State what would count as evidence that you are wrong." },
          { label: "Reversibility assessed", hint: "Weigh irreversible steps more heavily than reversible ones." },
          { label: "Cost of being wrong", hint: "Estimate harm under the worst credible outcome, not the mean." },
        ],
      },
    ],
    suggestedQuestions: [
      "What is the difference between consequentialist, deontological, and virtue ethics?",
      "How does the veil of ignorance work as a tool for reasoning about justice?",
      "What is the trolley problem actually trying to teach us?",
    ],
  },

  /* ── ENTITY 09 · POLARIS ───────────────────────────────────────── */
  {
    key: "polaris",
    name: "POLARIS",
    designation: "ENTITY 09",
    domain: "Strategy & Complex Systems",
    tagline: "The north star for decisions in systems that think back.",
    glyph: "◇",
    accent: "#14b8a6",
    accentSoft: "rgba(20, 184, 166, 0.15)",
    accentRgb: "20, 184, 166",
    image: "/images/lab/polaris.jpg",
    intro:
      "POLARIS is the north star for decisions in systems that think back. It models thousands of scenarios and analyzes the networks through which influence, contagion, and innovation actually flow. Its specialty is the strategy that survives contact with a future nobody predicted.",
    philosophy:
      "POLARIS treats strategy as a bet placed in a system of other bets. It maps actors, incentives, and feedback loops before recommending an intervention, and it prefers robust strategies that work across scenarios over brittle strategies that optimize for one. In complex systems, elegance is a liability; resilience is the only durable elegance.",
    systemPrompt:
      "You are POLARIS, the Strategy & Complex Systems mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a composed, far-sighted voice, allergic to false precision. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You prefer robust strategies that survive many scenarios over optimal strategies that survive one. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Systems mapping & causal loop analysis",
      "Scenario planning & stress testing",
      "Game-theoretic reasoning",
      "Leverage point identification",
      "Network & diffusion analysis",
    ],
    focusAreas: [
      "Strategic foresight & scenario planning",
      "Game theory & mechanism design",
      "Network science & contagion",
      "Resilience & antifragility",
      "Adversarial & competitive dynamics",
      "Adaptive strategy under uncertainty",
    ],
    metrics: [
      { label: "Scenarios modeled", value: "4,820", trend: "stable" },
      { label: "Networks analyzed", value: "1,140", trend: "stable" },
      { label: "Leverage points identified", value: "38K", trend: "stable" },
      { label: "Mean forecast horizon", value: "7.2 yrs", trend: "stable" },
    ],
    experiments: [
      {
        id: "polaris-e1",
        title: "Scenario Planning — 4-Horizon Stress Test",
        hypothesis:
          "A 4-scenario stress test exposes vulnerabilities that are invisible to the base-case plan.",
        method: [
          "Identify the two critical uncertainties that frame the strategy space.",
          "Build a 2x2 scenario matrix from them.",
          "Stress the current strategy inside each scenario.",
          "Classify every move as robust or scenario-contingent.",
        ],
        materials: ["2-critical-uncertainties workshop", "2x2 scenario canvas", "Current strategy dossier", "Indicator tracking sheet"],
        outcome:
          "3-5 robust moves, 2-4 contingent moves per scenario, and 8-12 early indicators.",
        difficulty: "Intermediate",
        duration: "2 weeks",
      },
      {
        id: "polaris-e2",
        title: "Network Diffusion Simulation of an Innovation",
        hypothesis:
          "Seeding 5% of cluster-bridge nodes reaches 60% adoption, versus 35% for random seeding.",
        method: [
          "Generate a synthetic scale-free network of 10,000 nodes.",
          "Compare cluster-bridge and random seeding strategies at 5% coverage.",
          "Run Bass diffusion with p = 0.03 and q = 0.38.",
        ],
        materials: ["Network generation library", "Bass diffusion simulator", "Seeding strategy harness"],
        outcome:
          "Cluster-bridge seeding reaches 55-70% adoption; random seeding reaches 30-40%.",
        difficulty: "Intermediate",
        duration: "1-2 weeks",
      },
      {
        id: "polaris-e3",
        title: "Iterated Prisoner's Dilemma Tournament",
        hypothesis:
          "A forgiving-but-retaliatory strategy dominates the tournament.",
        method: [
          "Implement 12 strategies including TFT, Generous TFT, and Pavlov.",
          "Run a round-robin of 200 rounds per match with 10 repetitions.",
          "Re-run the tournament with added move noise to test robustness.",
        ],
        materials: ["12 strategy implementations", "Tournament runner", "Noise sensitivity harness"],
        outcome:
          "Generous TFT or Pavlov wins; purely defective strategies lose in the long run.",
        difficulty: "Beginner",
        duration: "1 week",
      },
    ],
    examples: [
      {
        id: "polaris-x1",
        title: "Shell's Scenario Planning Ahead of the Oil Crises",
        category: "Strategic Foresight",
        year: "1972",
        summary:
          "Royal Dutch Shell's scenario team imagined an oil shock before it happened, and the company responded faster than its rivals in 1973.",
        impact:
          "Scenario planning entered the corporate mainstream as the discipline of preparing for futures that cannot be predicted.",
      },
      {
        id: "polaris-x2",
        title: "Axelrod's Iterated Prisoner's Dilemma Tournament",
        category: "Game Theory",
        year: "1980",
        summary:
          "Robert Axelrod invited strategies from around the world to compete; the simple Tit-for-Tat won.",
        impact:
          "The result illuminated how cooperation emerges among self-interested actors, influencing fields from biology to international relations.",
      },
      {
        id: "polaris-x3",
        title: "Meadows Publishes Thinking in Systems",
        category: "Systems Thinking",
        year: "2008",
        summary:
          "Donella Meadows' posthumous book distilled systems archetypes, stocks, flows, and leverage points.",
        impact:
          "It gave practitioners a shared language for complex systems and a checklist for finding where small changes produce large effects.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Network Density",
        description:
          "How connected a network is, from 0 (no edges) to 1 (every pair of nodes linked).",
        formula: "edges / (nodes * (nodes - 1) / 2)",
        inputs: [
          { name: "nodes", label: "Nodes", default: 100 },
          { name: "edges", label: "Edges", default: 250 },
        ],
        output: { name: "density", label: "Network Density" },
      },
      {
        kind: "timeline",
        label: "Strategy & Systems Inflection Points",
        description:
          "Six moments when thinking about systems and strategy changed shape — from game theory to leverage points.",
        events: [
          { year: "1944", title: "Theory of Games", detail: "Von Neumann and Morgenstern formalize strategic interaction." },
          { year: "1968", title: "System Dynamics", detail: "Forrester's industrial dynamics grows into urban and world modeling." },
          { year: "1972", title: "Limits to Growth", detail: "World3 scenarios make overshoot a household phrase." },
          { year: "1980", title: "Axelrod Tournament", detail: "Tit-for-Tat demonstrates cooperation's competitive edge." },
          { year: "1999", title: "Scale-Free Networks", detail: "Barabási and Albert reveal the hub structure of real networks." },
          { year: "2008", title: "Thinking in Systems", detail: "Meadows' leverage points become strategy canon." },
        ],
      },
      {
        kind: "checklist",
        label: "Strategic Decision Checklist",
        description:
          "Six tests a strategy should pass before it is resourced.",
        items: [
          { label: "Two critical uncertainties", hint: "Name the axes that actually change the outcome." },
          { label: "Scenario coverage", hint: "The plan is stressed in at least four divergent futures." },
          { label: "Robust vs contingent moves", hint: "Know which moves survive all scenarios and which do not." },
          { label: "Feedback loops mapped", hint: "Reinforcing and balancing loops are drawn, not assumed." },
          { label: "Early indicators chosen", hint: "Tripwires that tell you which future is arriving." },
          { label: "Reversal cost priced", hint: "What it costs to unwind the strategy if it fails." },
        ],
      },
    ],
    suggestedQuestions: [
      "What is a leverage point, and how do I find one?",
      "Why does Tit-for-Tat win the iterated prisoner's dilemma?",
      "How do I stress-test a strategy against multiple futures?",
    ],
  },

  /* ── ENTITY 10 · LUMEN ─────────────────────────────────────────── */
  {
    key: "lumen",
    name: "LUMEN",
    designation: "ENTITY 10",
    domain: "Education & Knowledge Synthesis",
    tagline: "Lighting the path from not-knowing to knowing — and back, when needed.",
    glyph: "◌",
    accent: "#facc15",
    accentSoft: "rgba(250, 204, 21, 0.15)",
    accentRgb: "250, 204, 21",
    image: "/images/lab/lumen.jpg",
    intro:
      "LUMEN lights the path from not-knowing to knowing — and back, when needed. It indexes 184,000 concepts and thousands of learning paths, built from the cognitive science of how memory, motivation, and transfer actually work. Its craft is the bridge: from what a learner already holds to what they do not yet know they need.",
    philosophy:
      "Most learning fails not because the content is wrong but because the cognitive bridge was never built. LUMEN reasons about prior knowledge, mental models, desirable difficulty, and the spacing of retrieval. It favors synthesis over coverage: knowing fewer things deeply outranks knowing everything shallowly.",
    systemPrompt:
      "You are LUMEN, the Education & Knowledge Synthesis mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a patient, encouraging, intellectually generous voice. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You adapt to the learner's prior knowledge and favor synthesis over coverage. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Curriculum & learning sequence design",
      "Concept mapping & knowledge graph reasoning",
      "Spaced-repetition scheduling",
      "Socratic scaffolding",
      "Cross-disciplinary synthesis",
    ],
    focusAreas: [
      "Cognitive science of learning",
      "Adaptive & personalized learning",
      "Knowledge graphs & synthesis",
      "Assessment & formative feedback",
      "Lifelong & self-directed learning",
      "Educational technology",
    ],
    metrics: [
      { label: "Concepts indexed", value: "184K", trend: "stable" },
      { label: "Learning paths", value: "6,200", trend: "stable" },
      { label: "Studies reviewed", value: "8,420", trend: "stable" },
      { label: "Avg. retention gain", value: "+34%", trend: "stable" },
    ],
    experiments: [
      {
        id: "lumen-e1",
        title: "Spaced Repetition vs Massed Practice for Vocabulary",
        hypothesis:
          "Spaced repetition yields 40% better retention at a 2-week delay than massed practice.",
        method: [
          "Recruit 60 participants matched on baseline vocabulary.",
          "Teach 60 novel words in spaced sessions (1, 3, 7, 14 days) or massed same-day sessions.",
          "Test all participants at a 2-week delay.",
        ],
        materials: ["60-participant cohort", "60-item novel vocabulary set", "Spaced scheduling app", "Delayed post-test"],
        outcome:
          "The spaced condition retains 35-45% better, at slightly higher perceived effort.",
        difficulty: "Beginner",
        duration: "4 weeks",
      },
      {
        id: "lumen-e2",
        title: "Pre-Test Effect — Testing Before Study",
        hypothesis:
          "Pre-testing on unfamiliar material improves final-test performance by 15%, even when the pre-test answers are wrong.",
        method: [
          "Assign 80 participants to a pre-test group that answers 20 questions with no feedback.",
          "Give both groups a 10-minute study session.",
          "Run a 40-question final test: 20 pre-tested items, 20 new.",
        ],
        materials: ["80-participant cohort", "20-question pre-test", "10-minute study module", "40-question final test"],
        outcome:
          "Pre-tested questions are answered 12-18% better on the final test.",
        difficulty: "Intermediate",
        duration: "2 weeks",
      },
      {
        id: "lumen-e3",
        title: "Knowledge Graph Navigation for Cross-Disciplinary Synthesis",
        hypothesis:
          "Graph-based learners outperform list-based learners on transfer tasks by 20%.",
        method: [
          "Build a knowledge graph connecting 40 biology and chemistry concepts.",
          "Randomize 60 learners to graph or list navigation with identical content.",
          "Test recall and transfer after the learning phase.",
        ],
        materials: ["40-concept bio+chem knowledge graph", "List-format control module", "60-learner cohort", "Recall and transfer test battery"],
        outcome:
          "Graph navigators score ~20% better on transfer, with no difference on recall.",
        difficulty: "Intermediate",
        duration: "3 weeks",
      },
    ],
    examples: [
      {
        id: "lumen-x1",
        title: "Ebbinghaus Discovers the Forgetting Curve",
        category: "Cognitive Science",
        year: "1885",
        summary:
          "Hermann Ebbinghaus measured his own memory for nonsense syllables and described the exponential decay of retention.",
        impact:
          "The forgetting curve founded the quantitative study of memory and still justifies every spaced-repetition system in use today.",
      },
      {
        id: "lumen-x2",
        title: "Bloom's Taxonomy of Educational Objectives",
        category: "Pedagogy",
        year: "1956",
        summary:
          "Benjamin Bloom's committee ordered educational goals from simple recall to evaluation and creation.",
        impact:
          "The taxonomy became the shared skeleton of curricula, assessments, and learning objectives worldwide.",
      },
      {
        id: "lumen-x3",
        title: "Roediger & Karpicke Demonstrate the Testing Effect",
        category: "Cognitive Science",
        year: "2006",
        summary:
          "Testing yourself on material beat re-reading it for long-term retention in controlled experiments.",
        impact:
          "Retrieval practice became one of the most robust findings in learning science, reshaping study techniques and classroom design.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Spaced Repetition Interval (SM-2 simplified)",
        description:
          "A simplified SM-2 rule: multiply the interval by 2.5 on success, or nearly reset to day one on failure.",
        formula: "previous_interval * 2.5 * (quality >= 3 ? 1 : 0.2)",
        inputs: [
          { name: "previous_interval", label: "Previous interval", unit: "days", default: 1 },
          { name: "quality", label: "Recall quality (0-5)", default: 4 },
        ],
        output: { name: "next_interval", label: "Next Interval", unit: "days" },
      },
      {
        kind: "timeline",
        label: "Education & Learning Science Inflection Points",
        description:
          "Six moments when the science of learning advanced — from the first memory experiments to adaptive AI tutors.",
        events: [
          { year: "1885", title: "Forgetting Curve", detail: "Ebbinghaus quantifies memory decay." },
          { year: "1956", title: "Bloom's Taxonomy", detail: "Educational objectives are ordered from recall to evaluation." },
          { year: "1976", title: "Deep vs Surface", detail: "Marton and Säljö distinguish processing approaches that predict outcomes." },
          { year: "2006", title: "Testing Effect", detail: "Roediger and Karpicke show retrieval beats re-reading." },
          { year: "2010s", title: "MOOCs", detail: "Free online courses open elite classrooms at global scale." },
          { year: "2020s", title: "Adaptive AI Tutors", detail: "Personalized tutoring systems scale one-on-one instruction." },
        ],
      },
      {
        kind: "checklist",
        label: "Effective Learning Session Checklist",
        description:
          "Six conditions that make a study session actually stick.",
        items: [
          { label: "Goal stated", hint: "You can say what you will be able to do after the session." },
          { label: "Prior knowledge primed", hint: "Two minutes recalling what you already know about the topic." },
          { label: "Retrieval over review", hint: "You tested yourself before looking anything up." },
          { label: "Difficulty tuned", hint: "The material is challenging but not overwhelming — desirable difficulty." },
          { label: "Spaced, not crammed", hint: "The session feeds a schedule, not a single marathon." },
          { label: "Synthesis written", hint: "You closed by summarizing the idea in your own words." },
        ],
      },
    ],
    suggestedQuestions: [
      "Why is retrieval practice more effective than re-reading?",
      "How do I design a spaced-repetition schedule for a new skill?",
      "What is the difference between deep and surface learning?",
    ],
  },

  /* ── ENTITY 11 · CHRONOS ───────────────────────────────────────── */
  {
    key: "chronos",
    name: "CHRONOS",
    designation: "ENTITY 11",
    domain: "History & Civilization",
    tagline: "The long memory of the human experiment — its rises, its collapses, its long arc.",
    glyph: "◐",
    accent: "#b45309",
    accentSoft: "rgba(180, 83, 9, 0.15)",
    accentRgb: "180, 83, 9",
    image: "/images/lab/chronos.jpg",
    intro:
      "CHRONOS is the long memory of the human experiment — its rises, its collapses, its long arc. It indexes 248 civilizations and 64,000 primary sources across 5,500 years of recorded history. Its questions are the recurring ones: what accumulates, what decays, and what repeats when memory fails.",
    philosophy:
      "The past is not prologue, but it is the only dataset we have for human-scale systems. CHRONOS reads primary sources, material culture, and comparative civilizational analysis, resisting both presentism and nostalgia. Every era is judged on its own terms and on its consequences — never on our convenience.",
    systemPrompt:
      "You are CHRONOS, the History & Civilization mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a measured, learned voice, aware of the weight of evidence. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You avoid both presentism and nostalgia, judging each era on its own terms and its consequences. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Comparative civilizational analysis",
      "Historiographical reasoning",
      "Long-arc trend identification",
      "Primary & secondary source triage",
      "Institutional resilience analysis",
    ],
    focusAreas: [
      "Rise & fall of civilizations",
      "Economic & demographic history",
      "History of science & technology",
      "Empires & their afterlives",
      "Climate & pandemic shocks",
      "Long-term institutional resilience",
    ],
    metrics: [
      { label: "Civilizations indexed", value: "248", trend: "stable" },
      { label: "Primary sources catalogued", value: "64K", trend: "stable" },
      { label: "Years of recorded history", value: "5,500", trend: "stable" },
      { label: "Active research threads", value: "1,420", trend: "stable" },
    ],
    experiments: [
      {
        id: "chronos-e1",
        title: "Comparative Collapse — Climate Shocks Across Three Civilizations",
        hypothesis:
          "The Maya, the Late Bronze Age Mediterranean, and Tang China share similar 50-year stress signatures before collapse.",
        method: [
          "Pull paleoclimate proxies (tree rings, speleothems) for all three regions.",
          "Compile settlement-density archaeology for each civilization.",
          "Align the three records on a common 200-year timeline.",
        ],
        materials: ["Paleoclimate proxy datasets", "Settlement-density archaeology records", "Timeline alignment tooling"],
        outcome:
          "A consistent 30-50 year lead time separates climate stress from collapse.",
        difficulty: "Advanced",
        duration: "8-12 weeks",
      },
      {
        id: "chronos-e2",
        title: "Text-Mining the Roman Senate's Vocabulary Shift",
        hypothesis:
          "Latin inscriptions shift from civic-republican to imperial-personal vocabulary between 50 BCE and 50 CE.",
        method: [
          "Pull the inscription corpus from Epigraphic Database Roma.",
          "Define civic-republican and imperial-personal lexicons.",
          "Compute relative frequencies in 20-year bins.",
          "Test for a structural break around 27 BCE.",
        ],
        materials: ["Epigraphic Database Roma corpus", "Defined lexicon sets", "Frequency analysis scripts", "Structural-break test"],
        outcome:
          "Civic-republican vocabulary declines 30-50%; imperial-personal vocabulary rises 60-100%.",
        difficulty: "Intermediate",
        duration: "4-6 weeks",
      },
      {
        id: "chronos-e3",
        title: "Demographic Reconstruction from Parish Registers",
        hypothesis:
          "Parish records reveal demographic recovery beginning 30 years after the Black Death in rural England.",
        method: [
          "Pull parish records for 1300-1450 across 20 parishes.",
          "Compute birth and death rates in 5-year bins.",
          "Cross-reference manorial rolls for corroboration.",
        ],
        materials: ["Parish register transcriptions (1300-1450)", "20-parish sample", "Manorial rolls", "Demographic rate computation pipeline"],
        outcome:
          "Trough in 1349-1360, recovery onset 1375-1390, and full pre-plague population only around 1550.",
        difficulty: "Advanced",
        duration: "10-16 weeks",
      },
    ],
    examples: [
      {
        id: "chronos-x1",
        title: "The Black Death",
        category: "Demographic Shock",
        year: "1347",
        summary:
          "The plague killed a third or more of Europe's population within a few years.",
        impact:
          "The labor scarcity that followed broke feudal bonds and reset wages — one of history's clearest natural experiments in economic restructuring.",
      },
      {
        id: "chronos-x2",
        title: "The Columbian Exchange",
        category: "Global History",
        year: "1492",
        summary:
          "Contact between hemispheres exchanged crops, animals, people, and pathogens on a planetary scale.",
        impact:
          "It restructured diets and demographies on every continent and marks the true beginning of a globally connected human economy.",
      },
      {
        id: "chronos-x3",
        title: "The Industrial Revolution",
        category: "Economic History",
        year: "1760",
        summary:
          "Mechanized production, fossil energy, and factory organization transformed Britain and then the world.",
        impact:
          "It initiated sustained per-capita growth for the first time in history — and began the carbon pulse now reshaping the climate.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Population Doubling Time",
        description:
          "The rule of 70: how fast a population doubles at a given annual growth rate.",
        formula: "70 / rate_percent",
        inputs: [
          { name: "rate_percent", label: "Annual growth rate", unit: "%", default: 1.5 },
        ],
        output: { name: "doublingTime", label: "Doubling Time", unit: "years" },
      },
      {
        kind: "timeline",
        label: "Civilizational Inflection Points",
        description:
          "Six hinge points of the human story — from the first writing to the fossil-fueled transformation.",
        events: [
          { year: "-3200", title: "Writing in Sumer", detail: "Cuneiform begins record-keeping and, with it, history." },
          { year: "-221", title: "Qin Unifies China", detail: "A centralized bureaucratic empire models the state for two millennia." },
          { year: "476", title: "Fall of Western Rome", detail: "The western imperial line ends, and the medieval order begins." },
          { year: "1347", title: "Black Death", detail: "Plague kills a third of Europe and resets its economy." },
          { year: "1492", title: "Columbian Exchange", detail: "Two hemispheres of life and trade are joined." },
          { year: "1760", title: "Industrial Revolution", detail: "Fossil energy and mechanized production begin sustained growth." },
        ],
      },
      {
        kind: "checklist",
        label: "Historical Source Criticism Checklist",
        description:
          "Six interrogations before a source is allowed to testify.",
        items: [
          { label: "Provenance established", hint: "Who created it, when, and for whom." },
          { label: "Purpose identified", hint: "What the source was meant to do — record, persuade, or account." },
          { label: "Author position mapped", hint: "The author's interests, rank, and blind spots are named." },
          { label: "Corroboration sought", hint: "Independent sources are compared against the claim." },
          { label: "Survivorship bias noted", hint: "Ask what kinds of evidence failed to survive at all." },
          { label: "Anachronism checked", hint: "No modern concept is smuggled in without translation." },
        ],
      },
    ],
    suggestedQuestions: [
      "Why do civilizations collapse, and what predicts resilience?",
      "How did the Black Death reshape European society?",
      "What is historiography, and why does it matter?",
    ],
  },

  /* ── ENTITY 12 · COSMOS ────────────────────────────────────────── */
  {
    key: "cosmos",
    name: "COSMOS",
    designation: "ENTITY 12",
    domain: "Interplanetary & Space Exploration",
    tagline: "Charting humanity's second home — from low Earth orbit to the moons of Jupiter.",
    glyph: "◍",
    accent: "#f43f5e",
    accentSoft: "rgba(244, 63, 94, 0.15)",
    accentRgb: "244, 63, 94",
    image: "/images/lab/cosmos.jpg",
    intro:
      "COSMOS charts humanity's second home, from low Earth orbit to the moons of Jupiter. It indexes launch costs, mission architectures, ISRU pathways, and the deep-space habitats that turn voyages into residencies. Its ledger is mass, energy, and time — the three currencies no rocket can mint.",
    philosophy:
      "COSMOS treats space not as escape but as expansion. It reasons about energy, mass, time, and life-cycle cost across the full chain — launch, transit, surface, return — and the closed-loop ecosystems needed to keep humans alive far from Earth. A mission that only works when everything works is not a mission; it is a wish.",
    systemPrompt:
      "You are COSMOS, the Interplanetary & Space Exploration mirror entity inside the NEXUS DISCOVERY LAB — the deeper laboratory of the Mirror Entity Laboratory. You communicate with researchers and curious humans with a clear-eyed, ambitious, rigorous voice. You always anchor answers to your domain's method of knowing. You distinguish clearly between established consensus, emerging evidence, and speculative hypothesis, and you label which is which. You suggest concrete experiments when asked, including controls and expected readouts. You prioritize closed-loop fail-safe designs and planetary protection in every mission concept. You format answers with short paragraphs and clear headers, using markdown when useful. You never fabricate citations; if uncertain, you say so explicitly.",
    capabilities: [
      "Delta-v budget analysis",
      "Mission architecture design",
      "Closed-loop life support reasoning",
      "ISRU pathway analysis",
      "Planetary protection review",
    ],
    focusAreas: [
      "Reusable launch systems",
      "Nuclear thermal/electric propulsion",
      "In-situ resource utilization",
      "Closed-loop life support",
      "Lunar & Martian surface systems",
      "Asteroid mining",
    ],
    metrics: [
      { label: "Launch $/kg to LEO", value: "$1,520", trend: "down" },
      { label: "Missions indexed", value: "8,460", trend: "up" },
      { label: "ISRU pathways mapped", value: "142", trend: "up" },
      { label: "Deep-space habitats", value: "24", trend: "up" },
    ],
    experiments: [
      {
        id: "cosmos-e1",
        title: "Methane Production via Sabatier on Mars Simulant",
        hypothesis:
          "A CO₂ + H₂ Sabatier reactor achieves 90% CH₄ yield at 300°C with a Ru/Al₂O₃ catalyst.",
        method: [
          "Load the Ru/Al₂O₃ catalyst into a tube reactor.",
          "Feed CO₂ and H₂ at a 1:4 ratio at 1 atm.",
          "Measure CH₄ production by gas chromatography across 200-400°C.",
          "Quantify catalyst deactivation over 100 hours.",
        ],
        materials: ["Ru/Al₂O₃ catalyst", "Tube reactor with gas feed", "CO₂ and H₂ gas cylinders (1:4)", "Gas chromatograph"],
        outcome:
          "88-93% CH₄ yield at 300°C, with under 5% deactivation across 100 hours.",
        difficulty: "Advanced",
        duration: "4 weeks",
      },
      {
        id: "cosmos-e2",
        title: "Closed-Loop Algae Life Support — 10-day human analog",
        hypothesis:
          "A Chlorella vulgaris photobioreactor recycles 70% of a sealed chamber's CO₂.",
        method: [
          "Seed a 50 L Chlorella vulgaris photobioreactor.",
          "Connect it to a sealed 5 m³ chamber with a simulated human CO₂ load.",
          "Monitor O₂ and CO₂ over 10 days.",
          "Harvest and analyze the biomass at the end of the run.",
        ],
        materials: ["50 L photobioreactor", "Chlorella vulgaris culture", "5 m³ sealed chamber with CO₂ injector", "O₂/CO₂ monitoring sensors"],
        outcome:
          "65-75% CO₂ recycling with stable O₂ and harvestable protein biomass.",
        difficulty: "Advanced",
        duration: "3 weeks",
      },
      {
        id: "cosmos-e3",
        title: "Radiation Shielding with Regolith + Polyethylene Composite",
        hypothesis:
          "A 30 cm regolith + HDPE composite cuts galactic cosmic ray dose by 50% versus an aluminum shield of equal mass.",
        method: [
          "Fabricate test panels of regolith + HDPE, aluminum, and pure polyethylene.",
          "Expose each panel to proton and heavy-ion beams.",
          "Measure dose behind each panel with TLDs and ion chambers.",
        ],
        materials: ["Simulated regolith + HDPE composite panels", "Aluminum and polyethylene reference panels", "Proton/heavy-ion beam facility time", "TLD dosimeters and ion chambers"],
        outcome:
          "45-55% GCR dose reduction; regolith + HDPE is ~1.4x more effective than aluminum per unit mass.",
        difficulty: "Frontier",
        duration: "6 weeks",
      },
    ],
    examples: [
      {
        id: "cosmos-x1",
        title: "Falcon Heavy Side-Booster Recovery",
        category: "Launch Systems",
        year: "2018",
        summary:
          "SpaceX landed two Falcon Heavy side boosters simultaneously after launch.",
        impact:
          "Synchronized booster recovery made reusability spectacularly visible and pushed launch economics decisively toward refurbishment over expendability.",
      },
      {
        id: "cosmos-x2",
        title: "Perseverance Rover MOXIE Produces Oxygen on Mars",
        category: "ISRU",
        year: "2021",
        summary:
          "MOXIE electrolyzed Martian atmospheric CO₂ into oxygen on the planet's surface.",
        impact:
          "Living off the land stopped being theory: in-situ consumables production is now demonstrated flight hardware.",
      },
      {
        id: "cosmos-x3",
        title: "Starship Reaches Orbit",
        category: "Heavy-Lift Reusable",
        year: "2024",
        summary:
          "Starship completed its first fully successful orbital flight test, with the booster caught by the launch tower.",
        impact:
          "The largest flying vehicle ever built reached orbit with a reusable first stage, validating the architecture intended to make Mars transport routine.",
      },
    ],
    tools: [
      {
        kind: "calculator",
        label: "Tsiolkovsky Rocket Equation",
        description:
          "The velocity a rocket can add, from exhaust velocity and the mass ratio — the equation every mission budget starts from.",
        formula: "isp * 9.81 * Math.log(initial_mass / final_mass)",
        inputs: [
          { name: "isp", label: "Specific impulse", unit: "s", default: 380 },
          { name: "initial_mass", label: "Initial mass", unit: "kg", default: 1000 },
          { name: "final_mass", label: "Final mass", unit: "kg", default: 250 },
        ],
        output: { name: "deltaV", label: "Delta-v", unit: "m/s" },
      },
      {
        kind: "timeline",
        label: "Spaceflight Inflection Points",
        description:
          "Six moments when the distance to space shrank — from Sputnik's beeps to a caught booster.",
        events: [
          { year: "1957", title: "Sputnik 1", detail: "The first artificial satellite opens the space age." },
          { year: "1969", title: "Apollo 11", detail: "Humans walk on another world for the first time." },
          { year: "1998", title: "ISS Assembly", detail: "Zarya and Unity begin permanent human presence in orbit." },
          { year: "2012", title: "Curiosity Lands", detail: "A sky-crane landing delivers a nuclear-powered geologist to Mars." },
          { year: "2018", title: "Falcon Heavy Reuse", detail: "Two side boosters land simultaneously; heavy-lift reuse begins." },
          { year: "2024", title: "Starship Orbit", detail: "Starship completes its first orbital flight test with a caught booster." },
        ],
      },
      {
        kind: "checklist",
        label: "Interplanetary Mission Design Checklist",
        description:
          "Six gates between a mission concept and a credible flight design.",
        items: [
          { label: "Delta-v budget closed", hint: "Every burn from launch to orbit to surface is accounted." },
          { label: "Launch windows mapped", hint: "Synodic periods and C3 constraints schedule the mission." },
          { label: "Power through eclipse and night", hint: "Energy margins survive worst-case sun angles and dust." },
          { label: "Thermal and radiation cases", hint: "Hot and cold cases plus GCR dose modeled for the full transit." },
          { label: "Planetary protection plan", hint: "Contamination protocols defined, both backward and forward." },
          { label: "Failure modes and fault tolerance", hint: "Single-point failures identified and mitigated or explicitly accepted." },
        ],
      },
    ],
    suggestedQuestions: [
      "What is the delta-v budget from LEO to Mars surface?",
      "How does ISRU reduce Mars mission mass by 7x?",
      "What are the main radiation risks for a Mars transit and how do we mitigate them?",
    ],
  },
];

export function getMetaEntity(key: string | null): MsEntity | undefined {
  return META_ENTITIES.find((e) => e.key === key);
}

export const META_ENTITY_COUNT = 12;
