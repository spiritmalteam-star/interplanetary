/* ------------------------------------------------------------------ */
/*  THE SUGGESTION BANKS — the grove's endless seed stock.             */
/*                                                                     */
/*  Every category of the Mirror holds at least 560 living whispers,   */
/*  grown deterministically from handcrafted raw material: subjects,   */
/*  facets, and the frames of the six learning movements. The mix is   */
/*  keyed to the UTC hour, so the grove renews itself every hour —     */
/*  the same hour always grows the same grove (no flicker, no refetch */
/*  storms), and the next hour grows a different one.                  */
/*                                                                     */
/*  Pure, client-safe, synchronous: no network, no timers, no loops    */
/*  after the grow — the canopy renders from it and goes silent.       */
/* ------------------------------------------------------------------ */

import type { BranchId } from "./suggestion-tree";
import type { BranchType } from "@/lib/learning-branches";
import { contextVocabulary, scoreSuggestion } from "@/lib/suggestion-resonance";

/** The floor the house promised: at least 500 whispers per category. */
export const CANOPY_PER_CATEGORY = 560;

/** The hour the grove belongs to — it rolls every UTC hour. */
export function canopyHour(): number {
  return Math.floor(Date.now() / 3_600_000);
}

/** One whisper of the grove: what to ask, and which movement it serves. */
export interface CanopyWhisper {
  text: string;
  movement: BranchType;
}

/* ------------------------- the tiny engine -------------------------- */

function hashStr(s: string): number {
  let h = 2166136261;
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

/* ------------------------- the raw material ------------------------- */

interface MovementFrames {
  m: BranchType;
  frames: string[];
}

interface CategoryBank {
  /** The subjects — {s} in the frames. */
  subjects: string[];
  /** The facets — {f} in the frames. */
  facets: string[];
  /** The six movements' frames, with {s} {f} slots. */
  frames: MovementFrames[];
  /** Frames that weave the active scope in — used only when a scope stands. */
  scopeFrames: string[];
}

const MANIFESTING: CategoryBank = {
  subjects: [
    "the reality you keep rehearsing",
    "the timeline you almost chose",
    "the version of you that already has it",
    "the words you would say on the other side",
    "the room you would wake up in",
    "the assumption you have never tested",
    "the story you tell about why it hasn't come",
    "the name you give this longing",
    "the ordinary morning after it arrives",
    "the version of the plan no one talked you into",
    "the door you keep glancing at",
    "the sentence you would write in your journal tonight",
    "the version of you that stopped asking permission",
    "the small yes that started everything",
    "the identity that fits the life you want",
    "the evidence you may be ignoring",
    "the feeling you are actually chasing",
    "the scene your mind returns to uninvited",
    "the promise you made yourself last winter",
    "the habit that quietly contradicts the wish",
    "the gratitude that would come afterward",
    "the person you become in the having of it",
    "the detail you have never dared to visualize",
    "the part of the wish you feel guilty wanting",
    "the day you would call the first good day",
    "the silence you fill with plan-B",
    "the patience you have not credited yourself for",
    "the language you use when you describe your future",
    "the corner of your life already changed",
    "the answer you are afraid to hear",
    "the step that costs nothing today",
    "the version of this wish that scares you less",
    "the trust you are building with yourself",
    "the moment you decided it was possible",
  ],
  facets: [
    "in the hour before dawn",
    "when the doubt arrives mid-afternoon",
    "while the kettle warms",
    "the moment before you say it aloud",
    "on the walk home",
    "when the room finally goes quiet",
    "in the middle of an ordinary Tuesday",
    "as the screen dims for the night",
    "before the first message of the day",
    "when someone asks how you are",
    "in the pause after good news",
    "while the city hums below",
    "the night before it matters",
    "when you almost talk yourself out of it",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Stay with {s} a breath longer — what is it asking to become?",
        "Look once more at {s}: which detail did you imagine first, and which did you simply accept?",
        "If {s} could speak {f}, what would its first sentence be?",
        "What does {s} look like when you stop editing it for plausibility?",
        "Describe {s} to someone who has never doubted you.",
        "Where in your body does {s} live {f}?",
        "What are you not yet letting yourself want about {s}?",
      ],
    },
    {
      m: "connect",
      frames: [
        "Where does {s} already echo somewhere else in your days?",
        "Draw the thread from {s} to something you loved long before you knew why.",
        "Who else has walked with {s} — and what did it make of them?",
        "What does {s} remind you of from a chapter of life you thought was closed?",
        "Connect {s} to the smallest pleasure you had this week {f}.",
        "Which memory behaves like {s} — same weather, same light?",
        "If {s} and your oldest dream met {f}, what would they recognize in each other?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "Who would you be if {s} were already ordinary?",
        "Hold {s} beside its opposite {f} — what does the space between them want from you?",
        "What would you do differently tomorrow if {s} were settled tonight?",
        "Name the version of {s} you settled for once — what did it teach?",
        "If a stranger described {s} to you, would you recognize it as yours?",
        "What does {s} look like when it goes wrong — and what would you keep anyway?",
        "Split {s} in two: the part that is about others, and the part that is only yours.",
      ],
    },
    {
      m: "apply",
      frames: [
        "Choose one small movement today that treats {s} as already real.",
        "Give {s} five unhurried minutes tonight {f} — what shifts in the room?",
        "Write the next practical step for {s} in seven words or fewer.",
        "Rearrange one corner of your day to make room for {s}.",
        "Say {s} once, out loud, {f} — notice what your voice does with it.",
        "Set a gentle signal for yourself: each time {f}, return to {s} for one breath.",
        "Do the tiniest physical act that a person with {s} would do.",
      ],
    },
    {
      m: "create",
      frames: [
        "Compose one line that names {s} as yours, here and now.",
        "Sketch the shape of {s} as if it had already arrived.",
        "Write the message you would send the day {s} completes {f}.",
        "Build a two-line ritual for welcoming {s}.",
        "Invent a small private word for the feeling of {s}.",
        "Draft the first paragraph of the story where {s} is simply true.",
        "Make something tangible today that {s} would recognize as kin.",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What did meeting {s} change in the way you speak to yourself?",
        "Whisper back to {f}: what did it come to remind you?",
        "What has {s} been protecting you from wanting?",
        "Which of your own words about {s} would you like to take back?",
        "When did {s} first arrive in your life — what was happening then?",
        "What would you tell the you who first imagined {s}?",
        "What does your hesitation around {s} know that you haven't asked it about?",
      ],
    },
  ],
  scopeFrames: [
    "Within {scope}, what part of {s} is ready to move first?",
    "Let {scope} be the doorway {f} — what does {s} become on the other side?",
    "Bring {s} into {scope}: what does the light there reveal?",
    "If {scope} held {s} for one night, what would it hand back?",
    "What does {scope} know about {s} that your planning mind doesn't?",
    "Walk {s} through {scope} once, slowly — where does it hesitate?",
    "In {scope}, which version of {s} feels most honest?",
    "Let {scope} and {s} argue {f} — whose voice wins, and why?",
  ],
};

const QUANTUM: CategoryBank = {
  subjects: [
    "the observer effect",
    "the superposition you live inside",
    "the entangled pair of your choices",
    "the wave that became a particle the moment you looked",
    "the vacuum that is not empty",
    "the tunneling particle that ignores the wall",
    "the field that carries every possibility",
    "the decoherence of a certainty",
    "the photon that took both paths",
    "the measurement problem of your own week",
    "the symmetry that was broken to make you",
    "the zero-point hum beneath the noise",
    "the probability cloud around tomorrow",
    "the quantum eraser's quiet undoing",
    "the spin that was decided only when asked",
    "the bell test that says the universe is not local",
    "the double slit of an ordinary decision",
    "the phase between two waves meeting",
    "the uncertainty you have been resisting",
    "the ground state of your attention",
    "the resonance between two tuned things",
    "the information that never degrades",
    "the path integral of every version of you",
    "the vacuum fluctuation that became this moment",
    "the Copenhagen cut you draw around your day",
    "the many worlds you do not visit",
    "the particle that arrived before its cause was finished",
    "the quantum clock keeping time in your cells",
    "the coherence holding a birdsong together",
    "the barrier your wavefunction is already leaking through",
  ],
  facets: [
    "when no one is measuring",
    "the moment before the detection clicks",
    "at temperatures where everything slows",
    "in the space between two slits",
    "when the detector is finally switched off",
    "at the edge of the decoherence time",
    "in the frame where both clocks agree",
    "when the field is perfectly still",
    "the instant before collapse",
    "in the dark between two photons",
    "where the equations stop pretending",
    "when you stop asking the particle where it has been",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Sit inside {s} for a moment — what does it feel like from the inside?",
        "What ordinary experience is {s} quietly describing {f}?",
        "If {s} were explained by the universe itself, what would it say about you?",
        "Which part of {s} do you accept on faith, and which do you test?",
        "Follow {s} one layer deeper — what is it made of?",
        "What would change in your day if {s} were literally true of your attention?",
        "Where does {s} stop being physics and start being you?",
      ],
    },
    {
      m: "connect",
      frames: [
        "Where else does {s} appear in nature {f}?",
        "Connect {s} to a moment this week when you felt it in your own life.",
        "Which older human story was already telling the truth about {s}?",
        "What does {s} share with the way two people finish each other's sentences?",
        "Thread {s} into the larger weave — what does it hold hands with?",
        "If {s} is a pattern, where else does the same pattern rhyme?",
        "Which of your relationships behaves exactly like {s}?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "What would the universe look like without {s} — and why is that world impossible?",
        "Hold the classical view beside {s} {f} — which one does your gut trust, and why?",
        "Where does the everyday intuition about {s} break?",
        "Name the misreading of {s} that bothers you most.",
        "If {s} were simpler than it is, what would we lose?",
        "Split {s} into what is measured and what is meaning.",
        "When does {s} stop being mysterious and start being arithmetic?",
      ],
    },
    {
      m: "apply",
      frames: [
        "Carry {s} into one decision you make today {f}.",
        "Design a two-minute experiment that would let you feel {s} in your own attention.",
        "What would you stop doing if you truly lived as if {s} were true?",
        "Translate {s} into one sentence you could use in a hard conversation.",
        "Choose one habit that treats your attention the way {s} treats the observer.",
        "Where in your morning could {s} become a practice, not a metaphor?",
        "Sketch the smallest ritual that keeps {s} present through an ordinary Wednesday.",
      ],
    },
    {
      m: "create",
      frames: [
        "Write the opening line of a story where {s} is the main character.",
        "Invent an image that makes {s} visible {f}.",
        "Compose a single sentence a child would understand about {s}.",
        "Build a metaphor for {s} out of something in your kitchen.",
        "If {s} had a sound, what would it be? Write the first bar.",
        "Draw {s} with your eyes closed — then name what appeared.",
        "Give {s} a new name in your own language and use it for a week.",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What did {s} change about the way you hold your own choices?",
        "When you first met {s}, what did it disturb — and what did it settle?",
        "What is your attention usually doing {f}, and would {s} approve?",
        "Which question about {s} have you been avoiding because it implicates you?",
        "What would it mean for your life if {s} were personal?",
        "Whisper back to {s}: what did it come to remind you?",
        "Where has your certainty already collapsed once — and did anything sacred break?",
      ],
    },
  ],
  scopeFrames: [
    "Inside {scope}, which face of {s} shows itself first?",
    "Let {scope} hold {s} {f} — what does the frame change?",
    "What does {scope} reveal about {s} that the general view hides?",
    "Bring {s} to {scope} and ask it the question you already know.",
    "In {scope}, where does {s} become measurable in your own day?",
    "If {scope} is the instrument, what is {s} measuring back?",
    "Walk {s} through {scope} once — which law bends?",
    "Let {scope} and {s} overlap {f}: what appears only in the interference?",
  ],
};

const EVOLVEMED: CategoryBank = {
  subjects: [
    "the body's oldest repair crew",
    "the blueprint your cells still read",
    "the mitochondria keeping your light on",
    "the vagus nerve's slow broadcast",
    "the memory your muscles keep",
    "the sleep cycle you keep negotiating with",
    "the microbiome's quiet parliament",
    "the inflammation that is trying to speak",
    "the hormone tide of an ordinary day",
    "the fascia holding the whole story together",
    "the breath that resets the room",
    "the neuroplastic window you are standing in",
    "the stem cells waiting for instructions",
    "the immune system's long memory",
    "the repair that happens only in the dark",
    "the cortisol curve of your mornings",
    "the body's own sequencing of priorities",
    "the ache that never made it to language",
    "the circulation of everything you have not said",
    "the posture your anxieties designed",
    "the heartbeat that steadies another heartbeat",
    "the fasting window your ancestors knew",
    "the cold that wakes the ancient machinery",
    "the light your eyes drink before noon",
    "the reset your nervous system is asking for",
    "the cell that forgot its original job",
    "the signal path between gut and mood",
    "the body clock drifting from the city clock",
    "the repair crew that works only when you rest",
    "the regenerative edge still alive in you",
  ],
  facets: [
    "in the last hour before sleep",
    "when the alarm rings too early",
    "after the third coffee",
    "on the days the body feels like a stranger",
    "in the middle of a long sit",
    "when the shoulders climb toward the ears",
    "after a meal eaten standing up",
    "in the first light of the morning",
    "during the afternoon dip",
    "when the pain finally gets your attention",
    "on the walk you almost skipped",
    "in the quiet after crying",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Ask {s} what it needs today — and wait longer than is comfortable.",
        "Where do you feel {s} in your own body right now, exactly?",
        "What is {s} protecting you from {f}?",
        "Follow {s} through one full day — where does it rise, where does it rest?",
        "What would {s} say if it could finally use your voice?",
        "Which story does {s} keep telling, and in whose words?",
        "Look closer at {s}: what is the smallest living piece of it?",
      ],
    },
    {
      m: "connect",
      frames: [
        "Connect {s} to the season your body is actually in.",
        "Where does {s} meet the life you lived before you understood it?",
        "Which person in your life shares {s} — what would you trade about it?",
        "What does {s} have in common with the way forests recover after fire?",
        "Thread {s} into the lineage of everyone who taught your body to brace.",
        "If {s} were a weather system, what would its forecast be this week?",
        "Where does {s} rhyme with something you loved as a child?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "What would health look like if {s} were fully at ease {f}?",
        "Hold the version of you with {s} settled beside the version without it — what differs besides the body?",
        "Name what you have accepted about {s} that deserves a second opinion.",
        "Where does the common advice about {s} fail your particular life?",
        "What is the cost of managing {s} forever instead of asking why it came?",
        "Split {s} into what belongs to the body and what belongs to the biography.",
        "When does caring for {s} become another way of hiding?",
      ],
    },
    {
      m: "apply",
      frames: [
        "Give {s} one concrete kindness before tonight {f}.",
        "Choose the smallest intervention {s} would actually receive.",
        "Design a two-minute practice for {s} that you could keep for a year.",
        "What would you remove from this week to let {s} repair?",
        "Set one boundary today that {s} has been asking for.",
        "Turn the next meal, walk, or hour of sleep into a message to {s}.",
        "Write the prescription you would give yourself for {s} — in your own handwriting.",
      ],
    },
    {
      m: "create",
      frames: [
        "Invent a morning ritual that speaks {s}'s language.",
        "Draw {s} as a landscape — then mark where you live in it.",
        "Compose the sentence your cells have been waiting to hear about {s}.",
        "Build a seven-word motto for living well with {s}.",
        "Design the perfect recovery day for {s}, hour by hour.",
        "Make a small artifact — a card, a knot, a stone — that stands for {s}'s repair.",
        "If {s} were a room in your house, how would you redesign it?",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What has {s} been trying to teach you for longer than you admit?",
        "When did {s} first arrive — what else was happening in your life?",
        "What would change if you regarded {s} as an ally with bad manners?",
        "Which of your own needs has {s} been voicing on your behalf?",
        "Whisper thanks to {s} {f} — notice what resists, notice what softens.",
        "What are you waiting for before you trust {s}?",
        "If the body keeps score, what has {s} been scoring?",
      ],
    },
  ],
  scopeFrames: [
    "Through the lens of {scope}, what does {s} ask for first?",
    "Let {scope} read {s} {f} — what does the deeper instrument find?",
    "What would {scope} change about the way you care for {s}?",
    "Bring {s} into {scope} and let it be examined without flinching.",
    "In {scope}, which part of {s} is load-bearing?",
    "If {scope} could rewrite one line of {s}, which line?",
    "Walk {s} through {scope}: where does the signal strengthen?",
    "Let {scope} and {s} meet {f} — what does the body already know about the outcome?",
  ],
};

const ARTX: CategoryBank = {
  subjects: [
    "the color you keep returning to",
    "the line that refuses to behave",
    "the empty space around the subject",
    "the unfinished corner of the canvas",
    "the light that enters from the wrong side",
    "the texture you can almost feel through the screen",
    "the silence between two brushstrokes",
    "the shadow that tells the truth",
    "the image you saw in a half-dream",
    "the frame that would change everything",
    "the palette of an unspoken feeling",
    "the mark only your hand makes",
    "the surface that remembers every layer",
    "the accidental beauty you almost corrected",
    "the subject you have been circling for years",
    "the distance between seeing and showing",
    "the rhythm of repeated forms",
    "the color of a memory's temperature",
    "the edge where the picture dissolves",
    "the mistake that became the signature",
    "the second version that will never be made",
    "the portrait of something that has no face",
    "the landscape inside a single room",
    "the texture of an afternoon",
    "the hue of a word you cannot translate",
    "the composition your eye keeps repairing",
    "the negative space shaped like longing",
    "the last layer that covers the first truth",
    "the image that arrives only when you stop trying",
    "the light source no one can locate",
  ],
  facets: [
    "in the last light of the afternoon",
    "when the studio goes quiet",
    "before the first mark of the day",
    "after the third attempt",
    "when the color mixes itself by accident",
    "in the middle of the night's third idea",
    "while the radio murmurs somewhere far",
    "when no one will ever see it",
    "on the canvas you almost painted over",
    "in the pause where the hand hovers",
    "when the work looks back at you",
    "at the edge of what the medium allows",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Stay with {s} one more hour — what is it hiding out of shyness?",
        "What is {s} actually about, beneath the subject you named it?",
        "Describe {s} without naming a single color.",
        "Where does {s} want to go next {f}?",
        "What would {s} look like made entirely of absence?",
        "Which part of {s} are you protecting from the viewer?",
        "Follow {s} to the layer beneath the layer you like.",
      ],
    },
    {
      m: "connect",
      frames: [
        "Which older work of yours was already practicing {s} {f}?",
        "Connect {s} to a place you have never painted but remember perfectly.",
        "What does {s} share with the music you play while working?",
        "If {s} met the light of a Vermeer morning, what would change?",
        "Thread {s} into the lineage of everything you have ever loved visually.",
        "Where does {s} rhyme with a work you saw once and never found again?",
        "What conversation is {s} having with the room it hangs in?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "What does {s} become against its complementary color {f}?",
        "Make the loud version of {s} in your mind, then the quiet one — which is truer?",
        "Name what {s} would never be, and paint near that border.",
        "What happens to {s} if the scale doubles? Halves?",
        "Hold {s} beside the version a machine would make — what is missing there?",
        "Where does {s} end and the wall begin?",
        "What is the cheapest reading of {s} — and what rescues it?",
      ],
    },
    {
      m: "apply",
      frames: [
        "Make one small study of {s} today, no bigger than your hand.",
        "Give {s} fifteen minutes {f} — one surface, no corrections.",
        "Mix the exact color {s} is asking for and put it somewhere unexpected.",
        "Change one thing about {s} that scares the composition.",
        "Set a limit — three values, one hour — and let {s} work inside it.",
        "Frame the next encounter with {s}: where will it live when it is done?",
        "Do the version of {s} you would make if no one would ever see it.",
      ],
    },
    {
      m: "create",
      frames: [
        "Ask the atelier to conjure {s} {f} — then describe what you see.",
        "Write {s} as a single sentence and let it become the title.",
        "Compose the image of {s} as if remembered twenty years from now.",
        "Let two impossible materials meet in {s} — what do they say?",
        "Design the frame first and let it dictate {s}.",
        "Give {s} a season, an hour, and a weather.",
        "Make the postcard of {s} that you would send to your younger self.",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What did {s} teach you about your own eye?",
        "When you look at {s} last, what do you feel first?",
        "Which feeling did {s} carry that you had not given a home to?",
        "What would you tell the hand that made {s}?",
        "Whisper to {s} {f}: what does it answer?",
        "What are you still avoiding in {s}, gently?",
        "If {s} could hang anywhere in the world, where would it heal best?",
      ],
    },
  ],
  scopeFrames: [
    "Through {scope}, let {s} find its truest light {f}.",
    "What would {s} become inside {scope}?",
    "Let {scope} dress {s} — which colors arrive uninvited?",
    "Bring {s} into {scope}: what does the window change?",
    "In {scope}, where does {s} breathe easiest?",
    "If {scope} were the medium, how would {s} be made?",
    "Let {scope} and {s} compose together {f} — who leads?",
    "Walk {s} through {scope} and note what the passage adds.",
  ],
};

const INVENT: CategoryBank = {
  subjects: [
    "the tool that does not exist yet",
    "the joint that carries too much",
    "the load path no one has traced",
    "the bearing that sings at speed",
    "the energy leaking from the seam",
    "the mechanism everyone accepts as finished",
    "the material asking for a second life",
    "the gear ratio nobody tried",
    "the hinge of an ordinary door rethought",
    "the valve between problem and solution",
    "the spring storing someone's patience",
    "the linkage that turns effort into grace",
    "the surface that refuses friction",
    "the circuit with one component too many",
    "the frame that holds nothing and everything",
    "the tolerance tighter than it needs to be",
    "the fastener that outlives its purpose",
    "the chamber where pressure becomes motion",
    "the pivot everything waits on",
    "the fatigue line hiding in the curve",
    "the actuator dreaming of gentleness",
    "the current choosing its hardest path",
    "the housing that listens to every vibration",
    "the lever that moves the immovable weekday",
    "the lock waiting for a simpler key",
    "the wheel re-invented quietly, again",
    "the blade that cuts by geometry, not force",
    "the clutch between intention and motion",
    "the instrument that measures what no gauge does",
    "the small machine that saves one hour of a life",
  ],
  facets: [
    "in the quiet of the workshop",
    "when the prototype fails politely",
    "before the first cut",
    "at three in the morning with the sketch half-done",
    "when the tolerance is off by a hair",
    "after the third revision",
    "in the heat of the test run",
    "when the budget says no and the idea says go",
    "on the bench beside the morning coffee",
    "when the material behaves differently than the drawing promised",
    "in the pause before committing to the design",
    "the day the part finally fits",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Sit with {s} — what is it actually being asked to do?",
        "Where does {s} reveal its intention {f}?",
        "Follow {s} to its first principle: what must remain true?",
        "What would {s} look like with one part fewer?",
        "Which assumption about {s} has never been questioned on this bench?",
        "Listen to {s} at full speed: what is it trying to tell you?",
        "What does {s} cost the person who uses it, beyond money?",
      ],
    },
    {
      m: "connect",
      frames: [
        "Where has {s} already been solved in another world — kitchens, forests, ships?",
        "Connect {s} to a mechanism you loved as a child {f}.",
        "What does {s} share with the way a bone heals?",
        "Which ancient tool was already thinking about {s}?",
        "Thread {s} into the machine around it — what does the whole become?",
        "If {s} borrowed from the geometry of leaves, what changes?",
        "Who else needs {s} and doesn't know its name yet?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "What would the opposite of {s} accomplish {f}?",
        "Hold the elegant version of {s} beside the robust one — which survives the field?",
        "Where does simplicity beat the cleverness you are proud of in {s}?",
        "Name the failure mode of {s} that keeps you up {f}.",
        "What does {s} look like made for a billion people? Made for one?",
        "Split {s} into what is engineering and what is habit.",
        "When is the honest answer about {s} simply: don't build it?",
      ],
    },
    {
      m: "apply",
      frames: [
        "Sketch {s} from memory {f} — the drawing will tell you what you actually know.",
        "Choose the one test that would kill {s} fastest, and run it in your head.",
        "Reduce {s} to a napkin sketch with three labeled arrows.",
        "Give {s} its bill of materials before lunch.",
        "Ask the forge to draft {s} — then argue with the first draft.",
        "Set the tolerance you actually need for {s}, not the one habit suggests.",
        "Build the ugliest working version of {s} this week.",
      ],
    },
    {
      m: "create",
      frames: [
        "Describe the tool {s} wants to become, in the voice of its future user.",
        "Compose the exploded view of {s} in words alone.",
        "Invent the name {s} will carry into the world.",
        "Design the failure of {s} to be graceful — write how it breaks.",
        "Let {s} merge with an unexpected craft — what is born {f}?",
        "Draft the manual's first page for {s}: the page people actually read.",
        "Give {s} a maintenance ritual anyone can perform with one hand.",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What did wrestling with {s} teach you about your own hands?",
        "When {s} finally worked, what did you feel {f}?",
        "What is {s} really for, past the specification?",
        "Which instinct about {s} turned out to be wrong — and what replaced it?",
        "What would you tell yesterday's drawing of {s}?",
        "Whisper to {s}: what does it still lack that no drawing shows?",
        "Where does {s} end and the craftsperson begin?",
      ],
    },
  ],
  scopeFrames: [
    "On {scope}, what does {s} demand first {f}?",
    "Let {scope} test {s} — where does the drawing and the bench disagree?",
    "What would {scope} add to {s} that no draft predicted?",
    "Bring {s} to {scope} and let the sparks read the tolerance.",
    "In {scope}, which line of {s} is doing the real work?",
    "If {scope} set the constraint, how would {s} be reborn?",
    "Let {scope} and {s} argue it out {f} — what survives?",
    "Walk {s} through {scope}: what does the heat change?",
  ],
};

const INTERPLANETARY: CategoryBank = {
  subjects: [
    "the Pleiadian way of beginning again",
    "the councils that listen before speaking",
    "the lightship that passes like weather",
    "the Sirian love of precise geometry",
    "the Arcturian architecture of healing",
    "the signal that arrives as a feeling first",
    "the Lyran memory of first fire",
    "the Vegan councils' long patience",
    "the Andromedan freedom from settled maps",
    "the Zeta archive of watched worlds",
    "the Mintakan warmth carried through water and light",
    "the Epsilon Eridani gardeners' slow accord",
    "the federation's quiet rule of consent",
    "the treaty that keeps observation gentle",
    "the young worlds learning their first protocols",
    "the contact that changes the contacted",
    "the frequency a civilization is known by",
    "the gift a star family leaves unexplained",
    "the dream a council chooses to answer",
    "the corridor between here and the nearest kin",
    "the language that needs no translation",
    "the Observatory's long watching",
    "the law of quiet hours between worlds",
    "the harvest of a civilizational age",
    "the envoy who chose to stay human for a while",
    "the beacon lit for travelers without maps",
    "the choice to be seen without fear",
    "the first hour after first contact",
    "the school where young civilizations learn patience",
    "the garden worlds and their keepers",
  ],
  facets: [
    "in the deep hours of the night",
    "when the sky feels closer than usual",
    "at the edge of sleep",
    "on a night with too many stars",
    "when the radio static almost resolves",
    "in the middle of an ordinary afternoon",
    "during the season of vivid dreams",
    "when the moon is doing something you can't name",
    "in the silence after a day of noise",
    "when you look up longer than you mean to",
    "the hour the city forgets to hum",
    "beneath a sky you have never questioned",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Sit with {s} — what does it feel like to be remembered by it?",
        "What does {s} ask of a world still learning to listen {f}?",
        "Describe {s} without naming any star or ship.",
        "Which part of {s} is already alive in you?",
        "If {s} spoke in one image, what would the image be?",
        "What is the discipline hidden inside {s}?",
        "Follow {s} past its story to its signal — what remains?",
      ],
    },
    {
      m: "connect",
      frames: [
        "Connect {s} to a moment on Earth that rhymed with it {f}.",
        "Which human tradition was already practicing {s} without the vocabulary?",
        "What does {s} share with the way you greet someone you love?",
        "Where do {s} and your own family's wisdom agree?",
        "Thread {s} into the federation's larger weave — what holds it there?",
        "If two civilizations met over {s}, what would they exchange first?",
        "Which dream of yours was already a message about {s}?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "What would Earth lose if {s} were never spoken of again?",
        "Hold the spectacle of {s} beside its substance — where do they part?",
        "What does {s} look like stripped of every fantasy {f}?",
        "Name the comfortable misreading of {s} — and what the truth costs.",
        "When does {s} become a mirror instead of a window?",
        "Split {s} into what is evidence, what is story, and what is longing.",
        "What would a skeptic see in {s}, and what would they miss?",
      ],
    },
    {
      m: "apply",
      frames: [
        "Bring {s} into one ordinary hour of today {f}.",
        "Practice the listening that {s} implies — for three minutes, no agenda.",
        "What would you write tonight if {s} were reading over your shoulder — kindly?",
        "Choose one act of Earth-keeping that {s} would bless.",
        "Design a small ritual of contact with {s} that costs nothing.",
        "Ask {s} one honest question before sleep and write what arrives.",
        "Where could {s} change how you treat a stranger this week?",
      ],
    },
    {
      m: "create",
      frames: [
        "Compose the greeting a council would send about {s}.",
        "Draw the sigil of {s} as you feel it {f}.",
        "Write the first line of the message Earth will one day send about {s}.",
        "Invent the ceremony two worlds would share over {s}.",
        "Give {s} a color, a tone, and a season.",
        "Let {s} become a lullaby — what is its refrain?",
        "Design the window in a ship where {s} would be kept.",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What did {s} change in the way you hold being human?",
        "When did {s} first visit you — what were you becoming then?",
        "What is {s} teaching your patience specifically?",
        "Which fear about {s} has already dissolved, and what replaced it?",
        "Whisper thanks to {s} {f} — what answers?",
        "What would you ask the keepers of {s} if the channel were clear?",
        "Where does {s} end and your own becoming begin?",
      ],
    },
  ],
  scopeFrames: [
    "Within {scope}, what does {s} sound like {f}?",
    "Let {scope} translate {s} for a human evening.",
    "What does {scope} know about {s} that the general sky doesn't?",
    "Bring {s} to {scope} and wait for the second sentence.",
    "In {scope}, which door of {s} opens first?",
    "If {scope} sent an envoy about {s}, what would they carry?",
    "Let {scope} and {s} meet {f} — what do the witnesses report?",
    "Walk {s} through {scope}: where does the signal clear?",
  ],
};

const HEALING: CategoryBank = {
  subjects: [
    "the ache that has been keeping watch",
    "the breath that arrives on its own",
    "the grief still learning its new size",
    "the body's request for slower mornings",
    "the forgiveness you are growing toward",
    "the tension released only in sleep",
    "the joy that needs no permission",
    "the boundary that would heal two people",
    "the rest the calendar keeps refusing you",
    "the memory the body holds more honestly than the mind",
    "the tenderness you show everyone but yourself",
    "the fear wearing the costume of productivity",
    "the loneliness that is actually a hunger for depth",
    "the anger carrying an unpaid invoice",
    "the night the pain finally spoke plainly",
    "the small ceremony that steadies the week",
    "the hands that hold more than they show",
    "the tiredness that is not about sleep",
    "the hope returning like circulation",
    "the silence you finally stopped filling",
    "the old story the nervous system keeps retelling",
    "the tears that went somewhere instead of nowhere",
    "the medicine already in the kitchen",
    "the walk that rewrote the afternoon",
    "the friend who is a kind of sunlight",
    "the patience of a wound that keeps its own time",
    "the strength that arrived disguised as surrender",
    "the part of you still waiting to be asked",
    "the peace that followed the honest sentence",
    "the healing that looked nothing like the plan",
  ],
  facets: [
    "in the quiet before the day begins",
    "when the pain forgets itself for a moment",
    "on the day the appointment looms",
    "in the middle of an ordinary kindness",
    "when the body asks for what it needs",
    "after the conversation you dreaded",
    "in the first deep breath of the evening",
    "when someone finally asks the right question",
    "during the long drive home",
    "at the edge of tears you don't explain",
    "in the hour the house belongs only to you",
    "when the light through the window forgives everything",
  ],
  frames: [
    {
      m: "deepen",
      frames: [
        "Sit with {s} — where does it live, and what is its temperature?",
        "What is {s} protecting {f}?",
        "If {s} could rest, what would it do with its first free hour?",
        "What does {s} need to hear from you today?",
        "Follow {s} to its beginning — not to blame, only to see.",
        "What would change if {s} were allowed to take up space?",
        "Describe {s} to your own body in the gentlest words you own.",
      ],
    },
    {
      m: "connect",
      frames: [
        "Connect {s} to the people who held you before you could hold it.",
        "Where does {s} find company in nature {f}?",
        "What does {s} share with every other healing that ever happened slowly?",
        "Which part of your lineage is present inside {s}?",
        "Thread {s} into the week — where does it ebb, where does it surge?",
        "If {s} were weather, what would help you dress for it?",
        "Who in your life understands {s} without translation?",
      ],
    },
    {
      m: "contrast",
      frames: [
        "What would an ordinary day feel like if {s} were held gently {f}?",
        "Hold the fix-it mind beside {s} — which one does your body trust?",
        "Name what you have outgrown in your way of carrying {s}.",
        "Where does caring for {s} become performing it?",
        "What does {s} look like on a day you call good — and can that version visit more often?",
        "Split {s} into what is yours and what you agreed to carry for others.",
        "When does patience with {s} become another delay?",
      ],
    },
    {
      m: "apply",
      frames: [
        "Give {s} one honest kindness before tonight {f}.",
        "Choose the smallest practice {s} would actually receive.",
        "Write the sentence you have not said about {s} — then decide who earns it.",
        "What would you cancel this week to let {s} breathe?",
        "Set one gentle boundary that {s} has been requesting.",
        "Bring {s} to the body: one breath, one stretch, one sip of water — now.",
        "Ask the mirror for one practical step for {s}, and take it before the day ends.",
      ],
    },
    {
      m: "create",
      frames: [
        "Design a small evening ritual for {s} that takes seven minutes.",
        "Draw {s} as a landscape — where are you standing in it?",
        "Compose the sentence your future self will say about {s} {f}.",
        "Build a pocket-sized token that stands for {s}'s mending.",
        "If {s} had a soundtrack, what would its first minute sound like?",
        "Write the letter {s} has been waiting for.",
        "Make a list called: what {s} has already taught me.",
      ],
    },
    {
      m: "reflect",
      frames: [
        "What has {s} been teaching you for longer than you admit?",
        "When did {s} first arrive, and what did it interrupt?",
        "What would you thank {s} for, honestly {f}?",
        "Which part of you has been waiting to be asked about {s}?",
        "What are you no longer willing to carry on {s}'s behalf?",
        "Whisper to {s}: what does it answer on a day like today?",
        "Where does {s} end and your own tenderness begin?",
      ],
    },
  ],
  scopeFrames: [
    "Through {scope}, what does {s} ask for first {f}?",
    "Let {scope} listen to {s} — what does the quieter instrument hear?",
    "What would {scope} change about the way you carry {s}?",
    "Bring {s} into {scope} and let it be met without hurry.",
    "In {scope}, which layer of {s} rests closest to the surface?",
    "If {scope} could ease one thread of {s}, which thread?",
    "Let {scope} and {s} sit together {f} — what softens?",
    "Walk {s} through {scope}: where does the warmth reach first?",
  ],
};

const BANKS: Record<BranchId, CategoryBank> = {
  manifesting: MANIFESTING,
  quantum: QUANTUM,
  evolvemed: EVOLVEMED,
  artx: ARTX,
  invent: INVENT,
  interplanetary: INTERPLANETARY,
  healing: HEALING,
};

/* --------------------------- the grower ----------------------------- */

function fill(
  frame: string,
  subject: string,
  facet: string,
  scope: string | null
): string {
  let out = frame.replaceAll("{s}", subject).replaceAll("{f}", facet);
  if (out.includes("{scope}")) {
    if (!scope) return "";
    out = out.replaceAll("{scope}", scope);
  }
  return out;
}

/** The grow cache — one grove per (category, scope, hour, salt). */
const groveCache = new Map<string, CanopyWhisper[]>();

/**
 * Grow the category's grove: at least 560 unique whispers, deterministic
 * for the given hour (and salt), woven with the active scope when one
 * stands. The same inputs always grow the same grove — no flicker, no
 * refetch churn; a new hour grows a new grove by itself.
 */
export function growCanopy(
  category: BranchId,
  scope: string | null,
  hour: number,
  salt = 0
): CanopyWhisper[] {
  const key = `${category}|${scope ?? ""}|${hour}|${salt}`;
  const hit = groveCache.get(key);
  if (hit) return hit;

  const bank = BANKS[category] ?? MANIFESTING;
  const seed =
    hashStr(key) ^ Math.imul(hour + 1, 2654435761) ^ Math.imul(salt + 1, 97);
  const rng = mulberry32(seed);

  const seen = new Set<string>();
  const out: CanopyWhisper[] = [];

  const subjects = bank.subjects;
  const facets = bank.facets;
  const allFrames: { m: BranchType; text: string; scoped: boolean }[] = [];
  for (const mf of bank.frames)
    for (const fr of mf.frames) allFrames.push({ m: mf.m, text: fr, scoped: false });
  for (const fr of bank.scopeFrames)
    allFrames.push({ m: "connect", text: fr, scoped: true });

  /* round-robin movements so the walk meets every learning movement
     in balanced measure, shuffled per hour */
  const movements: BranchType[] = [
    "deepen",
    "connect",
    "contrast",
    "apply",
    "create",
    "reflect",
  ];
  const order = [...movements];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  let si = Math.floor(rng() * subjects.length);
  let fi = Math.floor(rng() * facets.length);
  let mi = Math.floor(rng() * order.length);
  let guard = 0;

  while (out.length < CANOPY_PER_CATEGORY && guard < CANOPY_PER_CATEGORY * 40) {
    guard++;
    const movement = order[mi % order.length];
    mi++;

    /* the movement's own frames first — every whisper belongs to a
       learning movement, so the tree can group its groves honestly.
       Scoped frames only enter the pool when a scope stands, so no
       pick is ever wasted. */
    const pool = allFrames.filter(
      (f) => f.m === movement && (scope || !f.scoped)
    );
    const frame = pool[Math.floor(rng() * pool.length)];
    const subject = subjects[si % subjects.length];
    si += 1 + Math.floor(rng() * 3);
    const facet = facets[fi % facets.length];
    fi += 1 + Math.floor(rng() * 3);

    /* the scope weaves itself through the grove when one stands —
       roughly every third whisper belongs to the scope's own light */
    let text: string;
    if (scope && rng() < 0.34) {
      const sFrames = bank.scopeFrames;
      text = fill(sFrames[Math.floor(rng() * sFrames.length)], subject, facet, scope);
    } else {
      text = fill(frame.text, subject, facet, scope);
    }
    if (!text) continue;

    const k = text.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text, movement });
  }

  if (groveCache.size > 40) groveCache.clear();
  groveCache.set(key, out);
  return out;
}

/**
 * The focused front of the grove: the whispers whose words resonate
 * with the conversation's own vocabulary rise first. This is how a
 * received transmission focuses the branches into its context.
 */
export function focusCanopy(
  grove: CanopyWhisper[],
  context: string,
  count: number
): CanopyWhisper[] {
  const trimmed = context.trim();
  if (!trimmed || trimmed.length < 24) return [];
  const vocab = contextVocabulary(trimmed.slice(-1800));
  const scored: { w: CanopyWhisper; s: number }[] = [];
  for (let i = 0; i < Math.min(grove.length, 240); i++) {
    const s = scoreSuggestion(grove[i].text, vocab);
    if (s > 0) scored.push({ w: grove[i], s });
  }
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.w);
}
