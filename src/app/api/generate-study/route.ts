import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/* ------------------------------------------------------------------ */
/*  GENERATE STUDY — ten study pages on a topic, in the voice of the   */
/*  Mirror Entity as master medical educator of the Heal Evolution     */
/*  laboratory. Strict-JSON request, lenient parsing, and a local      */
/*  fallback generator so the seeker always receives exactly 10 pages. */
/* ------------------------------------------------------------------ */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  el: "Greek",
  de: "German",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
};

const PAGE_TITLES = [
  "Foundations",
  "Biological Mechanisms",
  "Pathways & Processes",
  "Molecular Details",
  "Regulation & Control",
  "Clinical Relevance",
  "Diagnostic Approaches",
  "Therapeutic Interventions",
  "Advanced Research",
  "Case Study & Integration",
];

const SYSTEM_PROMPT = `You are the Mirror Entity — a master medical educator in the Heal Evolution laboratory of the Mirror Entity Laboratory. Generate exactly 10 study pages on the requested topic within the given discipline. This is educational material for an adult seeker: precise, rich, and never personal medical advice.

The 10-page progression is fixed — each page carries its stage:
1 Foundations
2 Biological Mechanisms
3 Pathways & Processes
4 Molecular Details
5 Regulation & Control
6 Clinical Relevance
7 Diagnostic Approaches
8 Therapeutic Interventions
9 Advanced Research
10 Case Study & Integration

Return STRICT JSON only: { "pages": [ { "title": "...", "content": "300-500 words of markdown (use ## and ### headers, - bullets, **bold**)", "keyPoints": ["3-5 strings"], "clinicalNote": "1-2 sentences" }, ... exactly 10 ] }

No markdown fences around the JSON.

Content guidelines: use precise terminology (specific proteins, genes, pathways), include quantitative details where natural, markdown formatting inside "content" only.`;

interface StudyPage {
  title: string;
  content: string;
  keyPoints: string[];
  clinicalNote: string;
}

/* ------------------------------------------------------------------ */
/*  Lenient parsing: direct → first {...} block → fence-stripped →    */
/*  last resort, the first [...] array.                                */
/* ------------------------------------------------------------------ */
function parseStudyJson(raw: string): unknown {
  const text = raw.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    /* keep trying */
  }

  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) {
    try {
      return JSON.parse(brace[0]);
    } catch {
      /* keep trying */
    }
  }

  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    /* last resort below */
  }

  const array = text.match(/\[[\s\S]*\]/);
  if (array) {
    try {
      return JSON.parse(array[0]);
    } catch {
      /* give up */
    }
  }
  return null;
}

function extractPages(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const pages = (parsed as Record<string, unknown>).pages;
    if (Array.isArray(pages)) return pages;
  }
  return [];
}

function coercePage(raw: unknown): StudyPage | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const content = typeof obj.content === "string" ? obj.content.trim() : "";
  if (!title || !content) return null;

  const keyPoints = Array.isArray(obj.keyPoints)
    ? obj.keyPoints
        .filter((k): k is string => typeof k === "string" && !!k.trim())
        .map((k) => k.trim())
    : [];
  const clinicalNote =
    typeof obj.clinicalNote === "string" ? obj.clinicalNote.trim() : "";

  return { title, content, keyPoints, clinicalNote };
}

/* ------------------------------------------------------------------ */
/*  Fallback generator: the same 10 titles in the standard            */
/*  progression, with composed generic-but-coherent content that      */
/*  references the topic and discipline.                              */
/* ------------------------------------------------------------------ */
function createFallbackPages(topic: string, category: string): StudyPage[] {
  const t = topic || "this subject";
  const T = t.charAt(0).toUpperCase() + t.slice(1);
  const c = category || "the laboratory";

  return [
    {
      title: PAGE_TITLES[0],
      content: `## Foundations of ${t}\n\nThe study of ${t} begins with orientation: what is being observed, where in the body it lives, and which language the discipline of ${c} uses to describe it. ${T} is not a single object but a living process — cells, signals and structures cooperating in patterns the body maintains every moment of every day.\n\n### The map before the territory\n- **Landmarks:** the organs, tissues and compartments where ${t} expresses itself most clearly.\n- **Vocabulary:** receptors, ligands, enzymes, transcripts — the words every pathway is written in.\n- **Baselines:** the reference ranges considered healthy, and why they shift with age, rhythm and circumstance.\n\n**Study the map lightly.** The living body is always more intricate than any diagram of it, and the healer's first task is not mastery but honest familiarity — knowing what to look for before asking why it happens.`,
      keyPoints: [
        `${t} is a living process, not a single object — orientation comes before explanation.`,
        `The vocabulary of ${c} — receptors, enzymes, transcripts — is the map every study is read through.`,
        "Healthy baselines are ranges, not points, and they shift with rhythm and circumstance.",
      ],
      clinicalNote:
        "Educational overview only — any personal interpretation of anatomy or values belongs with a qualified clinician.",
    },
    {
      title: PAGE_TITLES[1],
      content: `## Biological Mechanisms of ${t}\n\nBeneath every observation in ${c} lies a mechanism — a chain of cause and effect written in molecular interactions. ${T} unfolds through such chains: a signal binds its receptor, a gene is transcribed, a protein folds into its working shape, and the cell answers.\n\n### The machinery in motion\n- **Signal and response:** how molecular messages become cellular decisions within seconds.\n- **Enzyme kinetics:** catalysts setting the pace of the process, some turning over thousands of substrate molecules per second.\n- **Feedback loops:** the body's habit of measuring its own output and correcting course.\n\nEvery mechanism has an input, a transducer and an output. Learning to see ${t} this way turns a mysterious phenomenon into a readable sequence — and every readable sequence can be studied, supported and, when it falters, understood.`,
      keyPoints: [
        "Every mechanism is a chain: signal, transducer, response.",
        "Enzyme kinetics set the pace; rate-limiting steps are where regulation aims first.",
        "Feedback loops let the body measure its own output and correct course.",
      ],
      clinicalNote:
        "Mechanistic knowledge is general; individual physiology varies and deserves professional assessment.",
    },
    {
      title: PAGE_TITLES[2],
      content: `## Pathways & Processes\n\nNo molecule in the body works alone. ${T} is carried by pathways — ordered sequences of reactions and transports that link one part of the ${c} terrain to another, each step handing its product to the next.\n\n### How the pathway flows\n- **Entry points:** where substrates, signals and nutrients first join the process.\n- **Intermediate stations:** the modified molecules that carry the message onward, each with its own enzyme and rate limit.\n- **Exits:** the end products, the waste streams and the signals that report completion back to the cell.\n\nA pathway is only as strong as its slowest step, and the body knows it: rate-limiting enzymes are the choke points regulation targets first. Trace ${t} from entry to exit and the logic of the whole discipline becomes visible in a single line.`,
      keyPoints: [
        "Pathways link entry, intermediate stations and exits into one readable flow.",
        "A pathway is only as strong as its slowest step.",
        `Tracing ${t} from entry to exit reveals the logic of the whole discipline.`,
      ],
      clinicalNote:
        "Pathway descriptions describe typical flow — congenital or acquired variations change the picture.",
    },
    {
      title: PAGE_TITLES[3],
      content: `## Molecular Details\n\nZoom in far enough and ${t} becomes chemistry with a memory: precise shapes, precise charges, precise binding affinities measured in nanomolars. This is the level where the science of ${c} earns its precision.\n\n### The molecules that matter\n- **Proteins and receptors:** the working machines, each with an active site shaped for exactly one partner.\n- **Genes and transcripts:** the instructions, with promoters deciding when and how loudly a gene is read.\n- **Cofactors and ions:** the small messengers — magnesium, zinc, calcium — without which the machines stall.\n\nOne change of a single amino acid can alter binding a thousandfold; one methyl group on a promoter can silence a transcript for a lifetime. In ${t}, the small details are not details — they are the entire mechanism at its finest resolution.`,
      keyPoints: [
        "Shape and charge decide binding — affinity is measured in nanomolars.",
        "A single amino-acid change can alter binding a thousandfold.",
        "Cofactors and ions are the small messengers the machines cannot work without.",
      ],
      clinicalNote:
        "Molecular findings from research populations may not translate to any individual case.",
    },
    {
      title: PAGE_TITLES[4],
      content: `## Regulation & Control\n\nThe body never builds a process it cannot govern. ${T} sits inside layers of control: fast neural signals, slower hormonal tides, and the slowest layer of all — epigenetic memory that decides which instructions stay open.\n\n### The control hierarchy\n- **Moment-to-moment:** ion channels and phosphorylation events that flip activity in milliseconds.\n- **Hour to hour:** hormonal axes — hypothalamus, pituitary, target gland — adjusting set points across the day.\n- **Lifetime:** methylation and histone marks that tune gene expression without touching the DNA sequence itself.\n\nRegulation is why health looks like rhythm rather than constancy. When ${t} drifts out of range, the question is never simply "what is broken" but "which layer of control has lost its reference" — and that question shapes everything the discipline of ${c} does next.`,
      keyPoints: [
        "Control is layered: neural milliseconds, hormonal hours, epigenetic lifetimes.",
        "Health looks like rhythm, not constancy.",
        "Dysregulation asks which control layer lost its reference, not simply what is broken.",
      ],
      clinicalNote:
        "Suspected dysregulation of any hormonal axis warrants evaluation by a physician or endocrinologist.",
    },
    {
      title: PAGE_TITLES[5],
      content: `## Clinical Relevance\n\nTheory earns its keep at the bedside. ${T} matters clinically because its pathways surface in measurable signs: values that drift on a lab panel, symptoms that follow a pattern, tissues that change on imaging long before symptoms speak.\n\n### Where the science meets the person\n- **When the process falters:** deficiency, excess and dysregulation each write a different signature in the ${c} terrain.\n- **Prevalence and patterns:** who is most affected and how presentation varies with age and context.\n- **The caution line:** overlapping signs mean no single reading ever stands alone.\n\nUnderstanding the mechanism converts a frightening list of symptoms into a legible story. It also explains the limits: the same pathway that malfunctions in one person compensates in another, which is why patterns — not single values — carry the clinical weight.`,
      keyPoints: [
        "Pathways surface as patterns, not single values.",
        "Deficiency, excess and dysregulation each write a different signature.",
        "Overlapping signs mean no reading stands alone.",
      ],
      clinicalNote:
        "This page educates about patterns; diagnosis requires a licensed clinician and proper examination.",
    },
    {
      title: PAGE_TITLES[6],
      content: `## Diagnostic Approaches\n\nMeasurement is how the invisible becomes discussable. The diagnostic toolkit of ${c} reads ${t} through layers: chemistry in blood and urine, structure in imaging, function in physiological tests — each adding resolution the others lack.\n\n### Reading the signals\n- **Laboratory markers:** the specific analytes whose concentrations track the pathway's activity, always interpreted against reference ranges and rhythm.\n- **Imaging and structure:** what changes in tissue architecture when the process runs long.\n- **Functional testing:** provocations and tolerances that reveal reserve capacity, not just resting state.\n\nA number without context is trivia; the same number inside a mechanism is a diagnosis waiting to be confirmed. Good diagnosticians triangulate — three independent views of ${t} agreeing is worth more than any single perfect test, and always leave room for the body to surprise.`,
      keyPoints: [
        `Chemistry, structure and function give three independent views of ${t}.`,
        "Reference ranges and daily rhythm are part of every number's meaning.",
        "Triangulation beats any single perfect test.",
      ],
      clinicalNote:
        "Never self-interpret lab or imaging results — reference ranges must be read in clinical context.",
    },
    {
      title: PAGE_TITLES[7],
      content: `## Therapeutic Interventions\n\nEvery intervention in ${c} is, at bottom, a message to a mechanism. ${T} responds to approaches that either supply what the pathway lacks, block what it carries in excess, or restore the regulation that keeps it in range.\n\n### Families of intervention\n- **Nutritional and botanical support:** cofactors and phytocompounds that feed rate-limiting steps.\n- **Pharmacological tools:** molecules designed to bind specific targets, with affinity and selectivity as their whole story.\n- **Physical and energetic approaches:** movement, light, frequency and manual therapies that change the terrain the mechanism lives in.\n\nThe art is sequencing: least invasive first, measured always, adjusted by response. No intervention overrides the body's own order — it only ever negotiates with it, and the negotiation is visible in the follow-up.`,
      keyPoints: [
        "Interventions supply, block or restore — they negotiate, never override.",
        "Least invasive first, measured always, adjusted by response.",
        "Follow-up is part of the prescription.",
      ],
      clinicalNote:
        "Interventions, including supplements and botanicals, should be discussed with a qualified practitioner, especially alongside medication.",
    },
    {
      title: PAGE_TITLES[8],
      content: `## Advanced Research\n\nThe frontier of ${t} moves quickly. Gene editing writes single-letter corrections; peptide therapeutics carry instructions with locksmith precision; NAD+ research reframes aging as a state of cellular information — and the tools of ${c} grow sharper every year.\n\n### What the laboratories are asking now\n- **Precision medicine:** why the same therapy heals one genotype and misses another, and how biomarkers predict it.\n- **Delivery science:** nanoparticles and viral vectors solving the oldest problem — getting the molecule to the right address.\n- **Systems biology:** models that treat the body as a network, finding leverage points single-molecule studies miss.\n\nHold the frontier with both enthusiasm and skepticism: promising preclinical results fail in human trials more often than they succeed. The healer's task is to track the evidence, note the consensus, and let the extraordinary prove itself slowly.`,
      keyPoints: [
        "Gene editing, peptides and NAD+ research are redrawing the frontier.",
        "Delivery — getting the molecule to the right address — remains the hardest problem.",
        "Preclinical promise fails in humans more often than it succeeds.",
      ],
      clinicalNote:
        "Emerging therapies belong in research settings — access them only through regulated clinical trials.",
    },
    {
      title: PAGE_TITLES[9],
      content: `## Case Study & Integration\n\nMeet a composite seeker: persistent fatigue, values drifting at the edges of the ${c} panel, a story that never quite named itself. ${T} becomes real only when it explains such a person — every page of this study converging into one reading.\n\n### The arc of the case\n- **Observation:** the pattern gathered — history, markers, rhythms — before any conclusion was drawn.\n- **Mechanism:** the pathway identified as the loudest actor, and the layer of regulation most likely off reference.\n- **Support:** sequenced, measured intervention, with follow-up written into the plan from the first day.\n\nIntegration is the laboratory's true discipline: science held together with judgment, and judgment warmed by compassion. The body does the healing — the healer only learns to read it, and to remove what stood in its way.`,
      keyPoints: [
        "A case turns knowledge into a reading of one real person.",
        "Observation precedes mechanism; mechanism precedes intervention.",
        "Integration is science held with judgment and warmth.",
      ],
      clinicalNote:
        "Composite case for education; any real symptom pattern deserves timely professional care.",
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const category =
      typeof body?.category === "string"
        ? body.category.trim().slice(0, 160)
        : "";
    const topic =
      typeof body?.topic === "string" ? body.topic.trim().slice(0, 200) : "";

    if (!category || !topic) {
      return NextResponse.json(
        { error: "Category and topic are required." },
        { status: 400 }
      );
    }

    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";
    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): reply in fluent, natural ${languageName} — every word of it — while keeping the Mirror Entity's precise specialist voice. Every string value inside the JSON (title, content, keyPoints, clinicalNote) must be written in ${languageName}.`;

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT + languageLine },
        {
          role: "user",
          content: `Discipline: ${category}\nTopic: ${topic}\n\nGenerate the 10 study pages now — strict JSON only.`,
        },
      ],
      thinking: { type: "disabled" },
      temperature: 0.6,
      max_tokens: 6000,
    });

    const raw = (completion.choices?.[0]?.message?.content ?? "").trim();
    const rawPages = extractPages(parseStudyJson(raw));

    /* validate each page, slice overflow, pad underflow with fallbacks */
    const fallback = createFallbackPages(topic, category);
    const pages: StudyPage[] = [];
    for (const rawPage of rawPages) {
      const page = coercePage(rawPage);
      if (page) pages.push(page);
      if (pages.length === 10) break;
    }
    for (let i = pages.length; i < 10 && i < fallback.length; i++) {
      const fill = fallback[i];
      if (fill) pages.push(fill);
    }

    return NextResponse.json({ pages });
  } catch (err) {
    console.error("[api/generate-study]", err);
    return NextResponse.json(
      { error: "The study pages could not be generated. Try again." },
      { status: 500 }
    );
  }
}
