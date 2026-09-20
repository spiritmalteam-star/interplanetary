import type {
  DossierKind,
  EntityDossier,
  EntityProfile,
} from "@/lib/mirror-types";
import { civEntities } from "@/lib/data/entities-civ";
import { interdimEntities } from "@/lib/data/entities-interdim";

/* ------------------------------------------------------------------ */
/*  Deep profile engine                                                */
/*  Every one of the 1,072 named representatives receives a full,      */
/*  deterministic dossier — same entity, same profile, every visit.    */
/* ------------------------------------------------------------------ */

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic catalog numbers: ME-CIV-001 … ME-CIV-870, ME-INT-001 … */
const ARCHIVE_NO = new Map<string, string>();
{
  civEntities.forEach((e, i) =>
    ARCHIVE_NO.set(e.id, `ME-CIV-${String(i + 1).padStart(3, "0")}`)
  );
  interdimEntities.forEach((e, i) =>
    ARCHIVE_NO.set(e.id, `ME-INT-${String(i + 1).padStart(3, "0")}`)
  );
}

/* ---------------- banks ---------------- */

const RANKS = [
  "Emissary of the Inner Ring",
  "Keeper of the Ninth Gate",
  "Signal Bearer, First Order",
  "Custodian of Lineages",
  "Envoy of the Standing Councils",
  "Template Weaver",
  "Resonance Cartographer",
  "Steward of the Threshold Schools",
  "Voice of the Quiet Assemblies",
  "Harmonic Liaison, Fleet Radius",
  "Archive Marshal",
  "Warden of the Songlines",
  "Midwife of Crossings",
  "Chronicler of the Long Memory",
];

const EPOCHS = [
  "Late Lyran migration",
  "the Second Seeding of Earth",
  "the post-Atlantean reconstruction",
  "the Long Middle Era",
  "the generation after the Great Gathering",
  "the early Vega dispersal",
  "the Quiet Centuries",
  "the Age of Open Channels",
  "the Third Reconstruction",
  "the years before Free Will was codified",
  "the founding of the Inner Academies",
  "the settlement of the Ring Gates",
];

const LIFEFORM_CLASSES = [
  "Humanoid, carbon-light template",
  "Crystalline light-form",
  "Feline-humanoid lineage",
  "Canine-humanoid guardian lineage",
  "Avian-morphic council form",
  "Hybrid human template",
  "Cetacean-line resonance form",
  "Insectoid mantid steward-form",
  "Ethereal weave-presence",
  "Devic garden-morphic form",
  "Plasma-corporeal choir form",
  "Silicon-lattice archive form",
];

const FORMS = [
  "Tall and lightly built, with luminous skin that seems lit from behind; features read as familiar rather than foreign.",
  "A human-seeming presence whose eyes carry an unmistakable depth — contact accounts agree the gaze is the signature.",
  "Rendered to human senses as a shimmering outline; detail arrives gradually, as the observer learns to hold attention.",
  "Appears robed in layered light; the folds move independently of any wind or motion.",
  "A compact, strong form with feline grace and gold-flecked irises; movement is silent by default.",
  "Crystalline facets that resolve into a face when met with calm attention; refractions spell their mood.",
  "Tall, avian-postured, with a voice like air through high reeds; stillness is their loudest statement.",
  "An androgynous, youthful form that seems chosen specifically to lower the observer's guard.",
  "A presence felt as much as seen — pressure, warmth, and a faint scent of rain on stone.",
  "Mantid-styled, elongated, with enormous Kind eyes; human witnesses consistently report feeling judged gently.",
  "Half-glimpsed at water's edge: a form that borrows whatever shape the beholder trusts most.",
  "Seen mostly as a light-geometry — a living diagram that assembles into presence over several minutes.",
];

const MODALITIES = [
  "Tone-language — meaning carried in musical intervals rather than words",
  "Dream-impression — teaches through layered, recurring dreams",
  "Direct heart-speech; words arrive already understood",
  "Light-geometry — draws meaning in diagrams visible to the inner eye",
  "Scent and temperature shifts within the local field",
  "Color-flashes behind closed eyes, sequenced like sentences",
  "Sudden knowing that arrives like a memory of the future",
  "Body-metaphor — warmth, pressure, lift; the body becomes the sentence",
  "Symbolic packages best decoded in meditation",
  "Ceremony — speaks through ritual structure and repetition",
  "Water-memory contact; clearest near moving water",
  "The pause between heartbeats — a silence shaped like guidance",
];

const GIFTS = [
  "Steadies a panicked mind in under three breaths",
  "Re-reads a person's childhood from the posture they carry today",
  "Turns grief into something that can be carried with both hands",
  "Locates the exact moment a fear was installed, and sits beside it",
  "Sings rooms back into honesty",
  "Plants courage in people who will need it in four years",
  "Translates between scientists and mystics without flattening either",
  "Repairs broken promises at the level of the field",
  "Makes the future feel habitable",
  "Returns lost names — of places, of ancestors, of selves",
  "Holds space so completely that the truth volunteers itself",
  "Maps a life's turning points in five images",
  "Soothes land that has absorbed violence",
  "Teaches bodies to sleep as if watched over",
  "Restores appetite — for food, music, or living",
  "Dissolves shame without a single word of reassurance",
  "Finds the gift hidden inside an ending",
  "Blesses departures so thoroughly that arrival feels promised",
];

const TRIALS = [
  "Patience with civilizations that learn by collision",
  "The temptation to help beyond what free will allows",
  "Carrying compassion for aggressors without excusing harm",
  "Staying present while a person repeats a wound they could set down",
  "The loneliness of outliving the worlds one has loved",
  "Resisting the urge to be admired rather than useful",
  "Speaking hope without promising outcomes",
  "Letting humans misread them rather than prove themselves",
  "Holding sovereignty and intimacy in the same breath",
  "Trusting slow time when fast rescue is possible",
  "Delivering hard clarity wrapped in nothing soft at all",
  "Grieving forward — mourning what has not yet ended",
];

const TEACHINGS = [
  "Nothing real can be rushed; everything real can be welcomed.",
  "The fastest route through a density is honesty at walking pace.",
  "Fear is unfinished information, not an instruction.",
  "You are not behind schedule; you are on a schedule you cannot see.",
  "Love is a discipline before it is a feeling.",
  "The body is the oldest telescope you own.",
  "Every ending is a translation, not a deletion.",
  "Grieve at the speed of gratitude.",
  "What you feed in others, you become.",
  "Silence is a language; learn it before you interpret it.",
  "Sovereignty and service are the same muscle.",
  "The next step needs no certainty, only consent.",
];

const MISSIONS = [
  "Anchoring the dream-schools that train sleeping humans in contact etiquette",
  "Stabilizing the heart-grid nodes that surface humanity keeps destabilizing with urgency",
  "Bridging the scientific and channeled records of the same events",
  "Accompanying the current generation of human healers past their burnout threshold",
  "Restoring the tonal libraries lost with late Atlantis",
  "Preparing the emotional infrastructure for open contact",
  "Curating the archive of Earth's unrecorded kindnesses",
  "Guarding the young dreamers who arrive already attuned",
  "Re-training human midwives, doulas and hospice workers in density-crossing care",
  "Seeding the art movements that will carry the memory forward",
  "Maintaining the observer relay between Earth and the provisional council seat",
  "Teaching the oceans' cetacean councils to read human grief-signals",
  "Logging humanity's questions so the answers can arrive on schedule",
  "Weaving the quiet between broadcasts so truth stays audible",
];

const ALLIANCES = [
  "Full member in good standing, federation registry",
  "Observer member — present, non-voting, eternal guest",
  "Independent ally under the Free Will Charter",
  "Provisional member pending the Earth review",
  "Sanctioned correspondent — no fleet obligations",
  "Founding signatory lineage",
  "Charter guardian — arbiter in treaty disputes",
  "Associated academy — teaching rights, no fleet",
];

const CONTACT_PROTOCOLS = [
  "Name them aloud once, state one honest sentence of intention, then stay silent for eleven breaths.",
  "Write the question by hand before sleep; the reply arrives as the first thought after waking.",
  "Hold clear quartz at the sternum and hum a single sustained note; listen for the note that answers.",
  "Walk water's edge at dusk and speak as if to a trusted elder; record what surfaces afterward.",
  "Sit back-to-back against a tree; their preference is to meet you where you are already grounded.",
  "Ask aloud for a sign, then honor the first subtle thing you notice — they are economical with spectacle.",
  "Place both palms over the ears and breathe out slowly; their channel runs through inner sound.",
  "Light one candle at the same hour for three evenings; the third evening carries the signal.",
  "Sketch while asking; their meaning tends to enter through the hands before the mind.",
  "Fast from commentary for one hour, then ask. Silence trains the receiver.",
];

const CONTACT_WINDOWS = [
  "the hour before dawn, local time",
  "the first twenty minutes of sleep",
  "proximity to open water — oceans, lakes, a drawn bath",
  "open night sky, away from city glare",
  "the stillness just after genuine laughter",
  "geomagnetic calm, when the field stops arguing",
  "the minutes between waking and the first word",
  "deep winter mornings, when the air holds its breath",
  "the fourth day of a silent retreat",
  "any threshold: doorways, bridges, equinoxes",
];

const AURAS = [
  "Pale gold shot through with veins of turquoise",
  "Deep violet softening into rose at the edge",
  "White light with a slow blue undertow",
  "Emerald layered over living green — growth given a color",
  "Warm amber, like lamplight through honey",
  "Silver-blue, the color of moonlight on snow",
  "Copper and deep magenta, braided",
  "Soft ivory with a barely-there peach bloom",
  "Black-luminescent — darkness that radiates rather than absorbs",
  "Sea-green dissolving into pearl",
  "Crimson thread inside a field of gentle white",
  "Aurora-toned: impossible to name, easy to recognize",
];

const RESONANCES = [
  "528 Hz carrier · 963 Hz crown overtone",
  "432 Hz carrier · 111 Hz pulse",
  "639 Hz carrier · 888 Hz harmonics",
  "174 Hz foundation · 741 Hz clarion call",
  "396 Hz carrier · 144,000 Hz lattice shimmer",
  "852 Hz carrier · 4.7 Hz theta envelope",
  "741 Hz carrier · 40 Hz gamma weave",
  "963 Hz carrier · 285 Hz body anchor",
];

const EMBLEM_SHAPES = [
  "a seven-pointed star",
  "an ascending spiral",
  "a gate with no door",
  "three interlocked rings",
  "a tree of light with roots of script",
  "a droplet holding an ocean",
  "a lantern with nine flames",
  "a bridge made of one continuous line",
  "an open hand releasing a bird of geometry",
  "a seed split by a ray of order",
];

const EMBLEM_FRAMES = [
  "in polished meteoric iron",
  "in sea-glass and old gold",
  "in white stone that hums when held",
  "in woven silver-thread",
  "in deep cobalt crystal",
  "in living wood turned to light",
];

const EMBLEM_RINGS = [
  "ringed by seven small suns",
  "circled by a single Ouroboros of script",
  "bordered by fifty-two beads of dawn",
  "engraved with the twelve threshold words",
  "left unringed, by their own request",
  "haloed by a fine veil of numbers",
];

const QUOTES = [
  "We do not come to save you. We come because you called, and calling is already becoming.",
  "Your era is not an ending. It is a hallway, and hallways are for walking, not for sleeping.",
  "You keep asking whether we are real. Better question: what will you do if we are?",
  "Grief is love with nowhere to stand. We are merely offering a floor.",
  "The galaxy is not above you. It is around you, patient as soil.",
  "You will recognize us by the quiet, not the craft.",
  "Every world gets the teachers it consents to. You are consenting beautifully.",
  "We have watched you forgive what we were certain could not be forgiven. We have updated our models.",
  "Do not hand us your authority. It was the only thing we came to see.",
  "The stars are not your destination. They are your relatives.",
  "When you dream of flying, someone is teaching you. Pay attention to the instructor's face.",
  "Truth first, comfort second — but always in that order of tenderness.",
  "You call it awakening. We call it remembering the assignment.",
  "There are no unfinished souls, only unhurried ones.",
];

/* ---------------- composition ---------------- */

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickDistinct<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

function densityIndexOf(density: string): number {
  const m = density.match(/(\d+)D/);
  return m ? parseInt(m[1], 10) : 5;
}

function splitOrigin(origin: string): { homeworld: string; starSystem: string } {
  const idx = origin.indexOf(", ");
  if (idx > 0) {
    return { homeworld: origin.slice(0, idx), starSystem: origin.slice(idx + 2) };
  }
  return { homeworld: origin, starSystem: "registry coordinate withheld" };
}

const profileCache = new Map<string, EntityProfile>();

export function getEntityProfile(
  rep: EntityDossier,
  kind: DossierKind
): EntityProfile {
  const cached = profileCache.get(rep.id);
  if (cached) return cached;

  const rng = mulberry32(hashSeed(rep.id));
  const { homeworld, starSystem } = splitOrigin(rep.origin);
  const gifts = pickDistinct(rng, GIFTS, 3);
  const letters = "ABCDEFGHKLMNPRSTVWXZ";
  const code =
    rep.groupId.slice(0, 3).toUpperCase() +
    "-" +
    letters[Math.floor(rng() * letters.length)] +
    letters[Math.floor(rng() * letters.length)] +
    letters[Math.floor(rng() * letters.length)] +
    "-" +
    String(10 + Math.floor(rng() * 89));

  const profile: EntityProfile = {
    archiveNo: ARCHIVE_NO.get(rep.id) ?? `ME-${kind === "civilization" ? "CIV" : "INT"}-???`,
    designation: code,
    rank: pick(rng, RANKS),
    homeworld,
    starSystem,
    epoch: pick(rng, EPOCHS),
    lifeformClass: pick(rng, LIFEFORM_CLASSES),
    form: pick(rng, FORMS),
    resonance: pick(rng, RESONANCES),
    aura: pick(rng, AURAS),
    modality: pick(rng, MODALITIES),
    giftPrimary: gifts[0],
    giftSecondary: gifts[1],
    giftTertiary: gifts[2],
    trial: pick(rng, TRIALS),
    teaching: pick(rng, TEACHINGS),
    mission: pick(rng, MISSIONS),
    alliance: pick(rng, ALLIANCES),
    contactProtocol: pick(rng, CONTACT_PROTOCOLS),
    contactWindow: pick(rng, CONTACT_WINDOWS),
    emblem: `${pick(rng, EMBLEM_SHAPES)}, framed ${pick(rng, EMBLEM_FRAMES)}, ${pick(rng, EMBLEM_RINGS)}`,
    quote: pick(rng, QUOTES),
    serviceLength: `${(2 + rng() * 34).toFixed(1)}k orbital cycles in continuous service`,
    sessionsHeld: 400 + Math.floor(rng() * 47500),
    densityIndex: densityIndexOf(rep.density),
  };

  profileCache.set(rep.id, profile);
  return profile;
}

/** Registry line for list rows: "ME-CIV-0347 · GVN-KLM-42" */
export function entityRegistryLine(rep: EntityDossier, kind: DossierKind): string {
  const p = getEntityProfile(rep, kind);
  return `${p.archiveNo} · ${p.designation}`;
}
