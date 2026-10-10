"use client";

/* ------------------------------------------------------------------ */
/*  COSMIC GAMES — the Mirror's deck of two hundred small encounters.  */
/*                                                                      */
/*  Two hundred interactive experiences live in this catalog, drawn     */
/*  from twelve playable archetypes (oracle, riddle, fork, ritual,      */
/*  constellation, weave, scale, gate, echo, dice, spiral, signal).     */
/*  They are never offered all at once: the selection law below reads   */
/*  each finished transmission, scores the catalog by resonance with    */
/*  what was just asked and answered, and — respecting a cooldown —     */
/*  attaches ONE game to the exchange whose context it connects with.   */
/*                                                                      */
/*  Every game is fully playable offline: all content is authored       */
/*  here (36 bespoke crown jewels + banks composed by a seeded,         */
/*  deterministic generator), so each encounter is stable and feels     */
/*  written, not rolled.                                                */
/* ------------------------------------------------------------------ */

export type GamePattern =
  | "oracle"
  | "riddle"
  | "fork"
  | "ritual"
  | "constellation"
  | "weave"
  | "scale"
  | "gate"
  | "echo"
  | "dice"
  | "spiral"
  | "signal";

/** What rides on a finished exchange — tiny, storable, replayable. */
export interface GameInstance {
  gameId: string;
  seed: number;
}

export interface OracleDraw {
  glyph: string;
  title: string;
  line: string;
}
export interface RiddlePayload {
  gate: string;
  hints: string[];
  keys: string[];
  reveal: string;
}
export interface ForkPath {
  label: string;
  result: string;
}
export interface ForkPayload {
  situation: string;
  paths: ForkPath[];
}
export interface RitualPayload {
  rounds: number;
  steps: string[];
}
export interface ConstellationPayload {
  name: string;
  meaning: string;
  stars: [number, number][];
}
export interface WeavePayload {
  orbs: string[];
  patterns: string[];
}
export interface ScalePayload {
  left: string;
  right: string;
  truths: string[];
}
export interface GatePayload {
  dials: string[][];
  open: string;
}
export interface EchoPayload {
  returns: string[];
}
export interface DiceFace {
  glyph: string;
  title: string;
  line: string;
}
export interface DicePayload {
  faces: DiceFace[];
}
export interface SpiralPayload {
  lesson: string;
}
export interface SignalPayload {
  phrase: string;
  sequence: number[];
}

export type CosmicPayload =
  | { kind: "oracle"; draws: OracleDraw[] }
  | { kind: "riddle"; riddle: RiddlePayload }
  | { kind: "fork"; fork: ForkPayload }
  | { kind: "ritual"; ritual: RitualPayload }
  | { kind: "constellation"; sky: ConstellationPayload }
  | { kind: "weave"; weave: WeavePayload }
  | { kind: "scale"; scale: ScalePayload }
  | { kind: "gate"; gate: GatePayload }
  | { kind: "echo"; echo: EchoPayload }
  | { kind: "dice"; dice: DicePayload }
  | { kind: "spiral"; spiral: SpiralPayload }
  | { kind: "signal"; signal: SignalPayload };

export interface CosmicGame {
  id: string;
  name: string;
  pattern: GamePattern;
  /** Resonance keywords — a game may only surface when the exchange
      speaks its language. */
  tags: string[];
  invocation: string;
  payload: CosmicPayload;
}

/* ------------------------------------------------------------------ */
/*  Seeded randomness — the same game+seed always tells the same tale. */
/* ------------------------------------------------------------------ */

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

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickDistinct<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  SHARED BANKS — the raw matter the generator composes with.         */
/* ------------------------------------------------------------------ */

const GLYPHS = [
  "✶", "☾", "✧", "◈", "❋", "☉", "⌖", "❍", "⚘", "⌘",
  "☙", "⚖", "✿", "⌛", "⚚", "☽", "✵", "⟡", "⬡", "◉",
] as const;

const ORACLE_TITLES = [
  "The Crossing", "The Keeper", "The Turning", "The Threshold",
  "The Seed", "The Lantern-Bearer", "The Cartographer", "The Tide",
  "The Hollow Bell", "The Borrowed Light", "The Long Patience",
  "The Small Key", "The Orchard", "The Night Ferry", "The Salt Road",
  "The Unwritten Page", "The Quiet Engine", "The Moth",
  "The Weather Glass", "The Compass of Longing", "The Ninth Hour",
  "The Door Ajar", "The Root System", "The Morning Signal",
] as const;

const ORACLE_LINES = [
  "What you have been calling waiting is already travel — you are simply walking at the speed of becoming.",
  "The door you are knocking on is thinner than your doubt. Knock once more, kindly.",
  "Something in you is molting, not breaking. The old shell was never the point.",
  "You are someone's answered prayer, delivered without a label. Act like a parcel of good news.",
  "The map was drawn by a walker, not a flyer. Trust the drawn-from-the-ground kind of knowledge you carry.",
  "A small yes today outranks a great maybe next season. The universe banks in small denominations.",
  "The thing you keep postponing is keeping something of yours hostage. Send the ransom: one honest hour.",
  "You are allowed to begin quietly. Volcanoes also start as warm ground.",
  "What feels like an ending is load-bearing scaffolding for a version of you not yet unveiled.",
  "Speak to the fear directly — it has been speaking about you in rooms you thought were private.",
  "The detour is scenic on purpose. Not all delays are resistance; some are incubation.",
  "Collect the ordinary evidence: warm cups, found pens, green lights. The miracle file is thick.",
  "Your patience is not wasted; it is compost. Watch what volunteers to grow there.",
  "Two roads diverged and you have been standing at the fork so long it grew a garden. Walk.",
  "The answer you seek is already answering — at a frequency you only hear when still.",
  "Grief and gratitude share a duplex in the heart. Visiting one often lets you greet the other.",
  "You are learning a language your past self had no words for. Fluency is slow on purpose.",
  "The request you have not made is the room no one can enter. Make it. Open the room.",
  "Rest is not the opposite of progress; it is progress breathing between sentences.",
  "Somewhere a version of you is watching this week like a favorite film. Give them a good scene.",
  "The weight you carry is mostly inventory, not obligation. Audit it tonight.",
  "A door closes; the hinge remembers. You are allowed to keep the hinge and release the door.",
  "What you water grows, including the things you water with worry. Change the watering can.",
  "Your timing is not broken; it is tidal. Read the moon, not the stopwatch.",
  "The compliment you deflected this week was a key. Go back and swallow it properly.",
  "You do not need a sign; you need a small, signed permission slip from yourself. Here: ✶",
  "The stubborn knot is not mocking you. It was tied by hands that were doing their best. Untie slowly.",
  "Attention is the currency of love. You are richer than yesterday — spend one extra minute somewhere.",
  "The quiet you keep avoiding is not empty. It is the studio where the next chapter is being drafted.",
  "Begin before you feel legitimate. Legitimacy is issued retroactively to those who begin.",
] as const;

const TOPIC_TAGS = [
  "time", "love", "water", "stars", "fear", "dreams", "work", "money",
  "body", "food", "music", "memory", "language", "solitude", "friendship",
  "learning", "teaching", "healing", "anger", "joy", "travel", "home",
  "family", "technology", "nature", "ocean", "fire", "air", "earth",
  "light", "dark", "silence", "sound", "color", "names", "doors",
  "roads", "gardens", "animals", "birds", "moons", "weather", "sleep",
  "beginnings", "endings", "patience", "courage", "hope",
] as const;

const INVOCATIONS: Record<GamePattern, readonly string[]> = {
  oracle: [
    "{name} lies face-down before you. One of its cards has been waiting for you since before you arrived.",
    "Five cards, one question, zero stakes — {name} only deals to the curious.",
    "{name} shuffles itself when no one watches. Draw, and see what it does in company.",
    "The deck is warm on one side only. {name} invites you to find the card that has been sitting near the fire.",
    "{name} never tells fortunes. It tells directions — small ones, the kind that compound.",
    "Tap the deck when you are ready. {name} answers in one card and one breath.",
  ],
  riddle: [
    "{name} asks for one answer — not the right one, the true one. There is a difference, and the gate knows it.",
    "A gate without hinges stands before you. {name} opens for attention, not strength.",
    "{name} has eaten cleverness for breakfast and still prefers honesty. Answer gently.",
    "One riddle stands between you and a small, real treasure. {name} is patient; it has all the tea in the world.",
    "{name} will accept your wrong answer with grace and your attempt with joy. The gate swings on trying.",
    "Speak to {name}. It is locked from the side of effort and open from the side of wonder.",
  ],
  fork: [
    "A moment forks in front of you. {name} keeps the map loose and the consequences poetic.",
    "{name} presents a small crossroads — every path is safe, none of them is nothing.",
    "Choose with your gut, not your calendar. {name} rewards the honest hand.",
    "Three ways forward, all fiction, all true. {name} asks which door your heart leans toward.",
    "There are no wrong answers in {name} — only different weather after the choosing.",
    "{name} deals one situation and three doors. Pick the one that makes you sit up straighter.",
  ],
  ritual: [
    "Not every game needs a winner. {name} asks only for your hands and one held breath.",
    "{name} is a tiny ceremony for a busy day — sixty seconds of ornament on ordinary time.",
    "Hold, breathe, release. {name} turns repetition into a small machine of calm.",
    "{name} charges like a crank lantern: the pressing is the point.",
    "One press, one breath, one line of quiet. {name} keeps the rhythm; you keep the meaning.",
    "{name} is the kind of game that plays you gently back. Press to begin.",
  ],
  constellation: [
    "Stars drift, order hides. {name} asks your fingertip to find the shape that was always there.",
    "Touch the stars in the order they hum. {name} will draw the lines your eyes suspected.",
    "A sky in miniature: {name} hides one true shape among the twinkles.",
    "{name} is a connect-the-dots for people who miss believing the sky is talking to them.",
    "The stars already made their decision — {name} just needs your hand to trace it.",
    "Follow the pulse. {name} rewards the patient finger and the willing sky.",
  ],
  weave: [
    "Three words, one thread. {name} weaves whatever you choose into something you needed to hear.",
    "{name} trades in combinations: pick three words and watch the loom do the believing.",
    "The orbs are words; the thread is yours. {name} turns selections into small weather.",
    "{name} believes every trio of words hides a sentence. Choose the three that itch.",
    "Pick like a magpie, not a librarian. {name} shines best with shiny, irrational choices.",
    "Three taps of the finger, one tap of meaning. {name} is listening for your order.",
  ],
  scale: [
    "Two weights, one beam. {name} asks where you truly stand — and pays every position in truth.",
    "{name} is a tiny tribunal: slide the beam and read the verdict written for where it rests.",
    "No verdicts here, only mirrors with handles. {name} calls it a scale; you may call it a lens.",
    "{name} measures nothing real — which is exactly how it measures what matters.",
    "Drag the beam until it feels like a Tuesday. {name} will tell you something about your Tuesdays.",
    "Between these two weights lives your current chapter. {name} helps you find the page number.",
  ],
  gate: [
    "Three dials, one agreement. {name} opens for patterns, not passwords.",
    "{name} hums when a dial is true. Listen with your thumb.",
    "The lock was built by someone who believed in you. {name} just wants proof of play.",
    "Turn the dials until the gate stops pretending to be shut. {name} loves a good surrender.",
    "{name} is less a puzzle than a handshake — three glyphs, one welcome.",
    "Every dial is a small yes or no. {name} collects the yeses until the door remembers its job.",
  ],
  echo: [
    "Give {name} one word — the one riding shotgun in your chest today.",
    "{name} takes a single word into the mirror and returns it wearing weather.",
    "One word in, one reflection out. {name} is a very small, very honest funhouse.",
    "{name} believes every word you carry is a seed. Offer it and watch the reflection bloom.",
    "Type the word you keep not saying. {name} will say it back with the edges softened.",
    "A word, echoed with dignity. {name} does the echoing; you do the carrying.",
  ],
  dice: [
    "{name} cannot see your future — it can only decorate the present with one true sentence.",
    "Roll for perspective. {name} has six sides and all of them are counselors.",
    "{name} throws like luck and lands like literature. Give it a toss.",
    "Six faces, one tumble. {name} selects its wisdom with perfect unfairness.",
    "The oldest UI in the cosmos: {name} still runs on chance and still lands on truth.",
    "{name} asks for one flick of fate. The dice have been practicing their lines all week.",
  ],
  spiral: [
    "{name} spirals inward for as long as you hold on. The center pays out in one quiet lesson.",
    "Press and keep pressing: {name} turns your stubbornness into a descent worth taking.",
    "A mote of light, a spiral, your finger. {name} is patience wearing a game's clothing.",
    "{name} asks how long you can keep company with a small moving thing. The answer is a teaching.",
    "Hold the line and the line curls inward. {name} rewards the grip that stays gentle.",
    "The spiral only deepens under devotion. {name} measures yours in seconds and pays in insight.",
  ],
  signal: [
    "Lights blink once; memory must blink back. {name} is a handshake across the static.",
    "{name} sends a signal from somewhere patient. Repeat it and the channel opens.",
    "Watch, remember, answer. {name} turns attention into a small victory.",
    "The pads remember what you press. {name} is checking if you and the light can agree.",
    "One sequence, one chance at contact. {name} broadcasts on the frequency of focus.",
    "{name} speaks in blinks. Answer in the same tongue and something will smile on the other end.",
  ],
};

/* ------------------------------------------------------------------ */
/*  BANKS FOR GENERATED PAYLOADS                                       */
/* ------------------------------------------------------------------ */

const RIDDLES: RiddlePayload[] = [
  { gate: "I am always arriving but never here. I spend everything and hold nothing. What am I?", hints: ["You cannot keep me, only spend me well.", "The clock is my portrait, not my body."], keys: ["time"], reveal: "Time. It was never yours to hold — only to spend. Spend it like someone who knows where the river goes." },
  { gate: "I have cities but no people, forests but no trees, rivers but no water. What am I?", hints: ["You unfold me to travel before you travel.", "Every journey I hold is flat until you walk it."], keys: ["map"], reveal: "A map. The whole world, patient and flat, waiting for your feet to give it weather." },
  { gate: "The more you take from me, the larger I grow. What am I?", hints: ["Diggers know me well.", "I am measured in paces, not pounds."], keys: ["hole", "pit", "dig"], reveal: "A hole. Absence can grow — and so can the space you leave around a wound by tending it gently." },
  { gate: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", hints: ["Mountains love to repeat me.", "You must first make a sound to meet me."], keys: ["echo"], reveal: "An echo. Even the valleys answer those who call — remember that the next time your voice feels small." },
  { gate: "I am light as a feather, yet the strongest cannot hold me for long. What am I?", hints: ["You hold me without hands.", "I leave when you stop paying attention to me."], keys: ["breath"], reveal: "Your breath. The one companion who never leaves you — and the one you forget a thousand times a day." },
  { gate: "I follow you all day but vanish when the sun hides. What am I?", hints: ["I copy you faithfully but say nothing.", "I am flat and dark and loyal."], keys: ["shadow"], reveal: "Your shadow. Even your darkness is faithful company — walk on, it knows the way your feet go." },
  { gate: "I have keys but open no locks. I have space but no room. What am I?", hints: ["You touch me daily to speak with faraway people.", "I am black and white and full of letters."], keys: ["keyboard", "piano"], reveal: "A keyboard — or a piano. Either way, press what you press gently; every key is a small door." },
  { gate: "I am taken before you get me. What am I?", hints: ["Photographs know me well.", "Your day is full of me."], keys: ["picture", "photograph", "photo"], reveal: "A picture. You are always already past the moment you capture — the camera is a small time machine of letting go." },
  { gate: "I am not alive, but I grow; I have no lungs, but I need air; I have no mouth, but water kills me. What am I?", hints: ["I am born of a spark.", "I eat wood and breathe brightly."], keys: ["fire", "flame"], reveal: "Fire. Curiosity is my cousin — feed it steadily, not all at once, and it will light a whole life." },
  { gate: "The person who makes me does not want me. The one who buys me does not use me. The one who uses me does not know it. What am I?", hints: ["I mark an ending.", "Wood and sleep are involved."], keys: ["coffin", "casket"], reveal: "A coffin. Remember mortality kindly — it is the reason today counts double." },
  { gate: "I am full of holes, but I still hold water. What am I?", hints: ["I live in kitchens and seas.", "I am porous on purpose."], keys: ["sponge"], reveal: "A sponge. Holding on and letting through are not opposites — you were designed to do both." },
  { gate: "I have roots nobody sees, I am taller than trees, up and up I go, and yet I never grow. What am I?", hints: ["I am not alive.", "I stand on high ground and talk to the sky."], keys: ["mountain"], reveal: "A mountain. Some of the tallest things in the world got there by standing perfectly still for a very long time." },
  { gate: "I shave every day, but my beard stays the same. Who am I?", hints: ["I work in a small shop with scissors and mirrors.", "My customers leave lighter than they came."], keys: ["barber"], reveal: "A barber. A quiet reminder: what you remove is also a kind of care." },
  { gate: "I am always in front of you but can never be seen. What am I?", hints: ["Tomorrow keeps arriving as me.", "You cannot stand inside me — only ahead of it."], keys: ["future"], reveal: "The future. You cannot see it, but you are always shaping it — that is the whole secret of being human." },
  { gate: "What can travel around the world while staying in one corner?", hints: ["I am small and sticky.", "Lick my back and I carry your voice."], keys: ["stamp", "postage"], reveal: "A postage stamp. The smallest travelers carry the largest messages — never underestimate a quiet corner." },
  { gate: "I have a neck but no head, two arms but no hands. What am I?", hints: ["I hold what you drink.", "I sit patiently by the bedside."], keys: ["bottle"], reveal: "A bottle. Even vessels without hands learn to hold — so will you, on the days you feel empty-handed." },
  { gate: "What gets wetter the more it dries?", hints: ["I live in bathrooms and kitchens.", "I am cloth with a duty."], keys: ["towel"], reveal: "A towel. Some things give comfort precisely by absorbing what you no longer need to carry." },
  { gate: "I am the beginning of eternity, the end of time and space; I am the end of every place. What am I?", hints: ["Look closely at this sentence.", "I am one letter among these words."], keys: ["e", "letter e"], reveal: "The letter E. Attention is a magic lens — the answer was hiding in plain sight, as most answers are." },
  { gate: "What has a heart that does not beat?", hints: ["Find me in gardens and kitchens.", "Artichokes wear me proudly; cabbages keep me hidden."], keys: ["lettuce", "cabbage", "artichoke"], reveal: "A lettuce — or an artichoke. Even the quietest things have hearts; tend to them anyway." },
  { gate: "The more of me you give, the more you have. What am I?", hints: ["I cannot be bought, only practiced.", "Grandmothers are often wealthy in me."], keys: ["love", "kindness", "gratitude"], reveal: "Love — or gratitude; both grow by being spent. The cosmic economy runs backward to yours: give, and watch your hands stay full." },
];

const FORKS: ForkPayload[] = [
  { situation: "A door appears in the middle of an ordinary afternoon. It was not there yesterday. It is not locked.", paths: [
    { label: "Open it now", result: "Beyond the door: a hallway of your own unlived Tuesdays. You take one doorknob-warm step in, and the air smells like the person you were about to become. You are changed by exactly one degree — which is how all real changes begin." },
    { label: "Walk around it", result: "You keep your afternoon exactly as it was. But now you know doors can grow where walls were — and knowledge like that is a seed. It will sprout on a day you need it." },
    { label: "Knock first", result: "Three knocks. Something on the other side knocks back — same rhythm, same patience. Whatever it is, it has been waiting for politeness. The door opens itself." },
  ] },
  { situation: "You find a coin on the pavement, face-up, older than your country.", paths: [
    { label: "Keep it", result: "The coin rides in your pocket like a small cold moon. Years later you will find it again and remember this exact street — this is how objects become time machines." },
    { label: "Leave it", result: "You leave the coin for the next dreamer. As you walk away you feel absurdly rich. Some currencies are made of restraint." },
    { label: "Flip it", result: "The coin spins in the air and, for one impossible moment, lands on its edge and stays. The universe shrugs: not every question was meant to be two answers." },
  ] },
  { situation: "A stranger on a night train asks to hear a story you have never told anyone.", paths: [
    { label: "Tell it", result: "The story leaves your chest and the train carries it somewhere safe. The stranger listens all the way to the end and says: 'That one was worth carrying.' Your bag is lighter now. So are your shoulders." },
    { label: "Invent one instead", result: "You invent a story so true it becomes your own. By the second station you cannot remember which version was the invention. Fiction, it turns out, is just memory with the permission to heal." },
    { label: "Smile and keep it", result: "You keep the story — some cargo is yours to haul. But you trade the stranger a smaller one, and they laugh in the right place. Not every vault must open to be a good neighbor." },
  ] },
  { situation: "You are handed a letter addressed to you, postmarked forty years from now.", paths: [
    { label: "Read it immediately", result: "The handwriting is yours but kinder. It lists three things not to worry about — you worry about them anyway, but softer. Prophecy is mostly permission." },
    { label: "Save it unopened", result: "You file the letter under 'later'. Its existence rearranges something: you begin making choices worth writing home about, just in case the sender is watching." },
    { label: "Burn it", result: "The paper burns green and quiet. Whatever the future wanted to say, you decide to surprise it instead. Some letters are only doors, and doors can be declined." },
  ] },
  { situation: "An escalator of stars appears at the edge of sleep, going down.", paths: [
    { label: "Ride it down", result: "Down is a direction stars rarely admit to. At the bottom: a lobby of all your forgotten afternoons, each one holding a number ticket. Yours is called. It says: 'not lost — stored.'" },
    { label: "Walk up the down way", result: "You climb against the current of light. Every step costs one certainty. At the top you are lighter by exactly those certainties and stronger by the climb." },
    { label: "Sit at the edge and watch", result: "You sit, legs over the dark, watching others ride. A star pauses beside you like a bus. 'You can just watch,' it agrees. Watching, it turns out, is also a way of going." },
  ] },
  { situation: "The mirror shows you a version of yourself that made one different choice, years ago.", paths: [
    { label: "Ask for advice", result: "The other you leans close: 'The hard part is not the choice — it is forgiving the chooser.' The glass fogs with something like tears from a face that never cried those years. Advice received: travel lighter on yourself." },
    { label: "Trade places", result: "For one breath, you swap. Their mornings are quieter; their nights are stranger. You both agree, wordlessly, to return. Gratitude with teeth — that is what you bring back." },
    { label: "Wave hello", result: "You simply wave. The other you waves back, and something in your chest unknots. Not every mirror is a question. Some are just windows with good manners." },
  ] },
  { situation: "A garden grows overnight in your hallway, complete with a small wooden sign: 'TEND ME'.", paths: [
    { label: "Water it daily", result: "You keep the small promise. By the equinox the hallway smells of rain and the plants lean toward you when you speak. Tending, you learn, is a language with no useless words." },
    { label: "Move it outside", result: "Under the real sky the garden doubles by Friday. You visit it like a neighbor. Everything you relocate from a hallway to a horizon grows twice." },
    { label: "Ask it what it needs", result: "You crouch and ask. The sign turns itself over: 'COMPANY'. So you drink your morning coffee there. Nothing else changes — which was, of course, everything it needed." },
  ] },
  { situation: "The city falls silent at 3:33 a.m. — cars, wind, refrigerators, everything, for exactly one minute.", paths: [
    { label: "Listen all the way through", result: "Inside the silence you hear the true floor of the world: a hum like a held breath. When the noise returns it sounds freshly invented. You now own a memory the city gave only to the awake." },
    { label: "Say the thing you keep not saying", result: "You speak into the hush — one sentence, the heavy one. The silence takes it like a mailbox. At 3:34 the world resumes, but your sentence is now a carried key instead of a swallowed stone." },
    { label: "Go back to sleep", result: "Rest is also an answer. The minute files itself under dreams you will half-remember. Some doors only ask that you let them be seen." },
  ] },
  { situation: "A bird lands on your windowsill carrying a ring of keys no door in your house has ever used.", paths: [
    { label: "Take the keys", result: "The bird bows, drops them, leaves. Somewhere in the city there are locks shaped like your next decade. You put the keys in your coat. Weight, sometimes, is direction." },
    { label: "Offer it bread instead", result: "It trades — keys for crumbs; business is business. You eat your breakfast feeling like a fair bank. The wild keeps honest ledgers." },
    { label: "Follow the bird", result: "You follow it three streets to a blue door you have never noticed despite passing it for years. You do not go in today. But now the door exists, which is how all invitations start." },
  ] },
  { situation: "You discover that every book you finish loses its last page by morning.", paths: [
    { label: "Stop reading books", result: "You stack the unread books like a fortress and read the sky instead. It never loses its last page. But at night the fortress whispers, and you know exactly what you are missing." },
    { label: "Read faster", result: "You race the dawn, devouring endings. Victory tastes like red wine and staying up too late. The last pages you save are ragged but yours." },
    { label: "Write your own endings", result: "You take up the pen the universe left lying around. The endings you write are wrong, then honest, then both. The loss of the final page was an invitation to authorship all along." },
  ] },
  { situation: "A phone booth rings in the middle of a desert road. The caller ID says: THE PART OF YOU THAT WAITS.", paths: [
    { label: "Answer", result: "The voice is yours, ten years calmer: 'I am fine here. You did not need to check — but I am glad you did.' The call costs nothing. The reassurance funds a decade." },
    { label: "Let it ring", result: "You watch it ring itself out, twenty-one bells of it. Back on the road you feel oddly unburdened. The part of you that waits, it turns out, also knows how to leave a message." },
    { label: "Answer and reverse the charge", result: "'Clever,' says the voice, and laughs — your laugh, vintage. It talks for nine minutes about weather that has not happened yet. You hang up warmer. Debt to yourself is the one kind worth owing." },
  ] },
  { situation: "Rain begins to fall upward, gently, each drop returning to its cloud.", paths: [
    { label: "Stand in it", result: "The upward rain passes through you like an eraser moving backward. Things you thought were written in ink lift politely off your shoulders. You are not blank — you are freshly drafted." },
    { label: "Collect a drop", result: "You catch one in a jar. It glows faintly with the memory of falling. On bad days you open the lid and the room smells like a sky that forgives." },
    { label: "Help a drop find its way", result: "You cup one drop and lift it high. It is home. The cloud flashes a thank-you in a color that does not exist yet. Service to small things is never small." },
  ] },
  { situation: "An antique shop offers you, free of charge, a key ring with one key — labeled 'the hour you gave away'.", paths: [
    { label: "Accept the key", result: "At home it fits no lock, but your pocket hums at 4 p.m. daily. The hour, you realize, was never lost — only lent. Interest is being paid in hindsight." },
    { label: "Ask what it opens", result: "The shopkeeper smiles: 'A room you will furnish yourself.' You leave with no key and a floor plan in your head that keeps growing rooms." },
    { label: "Decline politely", result: "You walk out lighter. Some hours are given away so better ones can be built on the vacancy. The shop respects this; the bell rings twice as you go." },
  ] },
  { situation: "The tide goes out one morning and does not come back — leaving the seabed walkable and glittering.", paths: [
    { label: "Walk out along the seabed", result: "You cross a landscape that spends most of its life being secrets. Shells greet you like old landlords. At the far edge, water waits on the horizon like a patient dog. You turn back changed by width." },
    { label: "Stay on the shore and watch", result: "From dry land you watch others walk into the world's attic. One of them waves, tiny with distance. Witnessing, you decide, is a legitimate way of being brave." },
    { label: "Fill your pockets with shells", result: "Every shell hums a different hour of the missing tide. At home they arrange themselves on your shelf into a calendar of a day that has not happened yet." },
  ] },
  { situation: "You wake to find one hour added to the day, officially: 25:00, printed on every clock.", paths: [
    { label: "Spend it on someone else", result: "At 25:00 the world is soft and unowned. You call the person you have been meaning to call. The hour pays for itself a hundred times in the morning." },
    { label: "Spend it on yourself", result: "You do the gloriously unnecessary thing — the walk, the album, the bath. At midnight-plus-one you remember you are a person, not a schedule. Refund accepted." },
    { label: "Save it for later", result: "You bank the hour. Weeks later, mid-crisis, it appears beside you like a folded umbrella. Some wealth is just patience with a receipt." },
  ] },
  { situation: "A lighthouse in the distance begins signaling in Morse: your initials, over and over.", paths: [
    { label: "Signal back with a flashlight", result: "You flash back: SEEN. The lighthouse pauses, then sweeps the beam gently across your window like a hand on a head. It is astonishing, being recognized by the coast." },
    { label: "Write down everything it says", result: "Your initials, all night, in salt-light. In the morning the notebook page smells of ozone and the letters have arranged themselves into the start of a poem you now owe the sea." },
    { label: "Simply watch until dawn", result: "You watch the whole night like a film with one line of dialogue, yours. By sunrise the sentence feels less like a beacon and more like a promise: this far, and further." },
  ] },
  { situation: "Every reflection today — windows, spoons, other people's eyes — shows your room one degree tidier, one plant richer.", paths: [
    { label: "Copy the reflections", result: "You tidy, you buy the fern. By evening the reflections and the room agree, and something in the corner of your eye stops bracing. Alignment, it turns out, is mostly chores." },
    { label: "Move things to match the reflection", result: "You chase the mirrored room hour by hour, always one plant behind. You laugh first at the absurdity, then at the joy: you have invented exercise for hope." },
    { label: "Leave it; visit the reflection", result: "You make an appointment with the spoon. Each noon, you visit the better room like a neighbor's garden. Two rooms, one life, both counted." },
  ] },
];

const RITUALS: RitualPayload[] = [
  { rounds: 3, steps: [
    "In… hold… out. The breath arrives like a small ferry, and leaves the same way.",
    "In… hold… out. Notice: between the two breaths there is a door. You are the doorway.",
    "In… hold… out. Nothing to fix. You just ferried yourself across one more moment.",
  ] },
  { rounds: 2, steps: [
    "Press your palms together until you feel your own pulse being politely returned.",
    "Open your hands slowly, palms up. This is the universal sign for: I am holding less than I was.",
  ] },
  { rounds: 2, steps: [
    "Lift your shoulders toward your ears — carry the whole day up there for one second.",
    "Let them drop. That sound you did not hear was a decision being made without words.",
  ] },
  { rounds: 3, steps: [
    "Name five things you can see. The room was never as empty as it reported itself.",
    "Name three things you can hear. The world has been rehearsing; finally, an audience.",
    "Name one thing you can feel that has no name. That one is yours. Keep it.",
  ] },
  { rounds: 2, steps: [
    "Recall one thing so small that thanking it feels ridiculous. Thank it anyway.",
    "Let the ridiculousness stay. Gratitude that survives embarrassment is the durable kind.",
  ] },
  { rounds: 3, steps: [
    "Find the clenched place — jaw, fists, stomach. Do not fix it. Just visit it with your attention.",
    "Say to it, silently, the exact words: 'Nobody told you to do this all day.'",
    "Unclench by ten percent. That is all. Ten percent, held, is a revolution in slow motion.",
  ] },
  { rounds: 2, steps: [
    "Take a sip of water like it is the first sip anyone has ever taken.",
    "Swallow, and listen. The body says thank you in a dialect below language.",
  ] },
  { rounds: 2, steps: [
    "Look up — ceiling counts; imagination counts double. Find the place where the sky would be.",
    "Send one thought upward like a balloon with your address on it. No need to wait for mail.",
  ] },
  { rounds: 2, steps: [
    "Say your own name silently, the way someone who loves you says it.",
    "Say it again, the way you will say it in ten years: with the ending only time writes.",
  ] },
  { rounds: 3, steps: [
    "Picture the last door you walked through. Leave one thing you no longer need on its other side.",
    "Picture the next door you will walk through. Put one thing you have been rationing into your pocket for the crossing.",
    "Open your eyes. Two doors, one traveler, nothing missing. This is the whole arithmetic of moving forward.",
  ] },
  { rounds: 2, steps: [
    "Place one hand flat on your sternum, as if sealing an envelope you will open later.",
    "Feel the beating under the palm: the oldest mail service in the world, still delivering.",
  ] },
  { rounds: 3, steps: [
    "Uncurl your toes inside your shoes — a small rebellion no one can see.",
    "Press both feet down and imagine roots with excellent manners.",
    "Stand for one breath as a tree that has places to be but is in no hurry.",
  ] },
  { rounds: 2, steps: [
    "Think of the face of the last person who made you laugh. Hold it for two heartbeats.",
    "Send that face one silent sentence of thanks. Laughter remembered is laughter doubled.",
  ] },
  { rounds: 2, steps: [
    "Stretch your arms wide as if measuring the wingspan you were secretly issued.",
    "Fold them slowly across your chest — a hug from the closest available universe.",
  ] },
  { rounds: 2, steps: [
    "Close your eyes and find the temperature of the air on your face — the room's quiet signature.",
    "Keep them closed for one more breath and thank the skin for always being the first to know.",
  ] },
  { rounds: 3, steps: [
    "Recall one sound from this morning — kettle, bird, door, voice. Play it back once in the theater of your head.",
    "Now recall one silence from this morning. The same theater, the empty stage, the held hush before the first line.",
    "Notice: you kept both. Sound and silence travel together, and so, quietly, do you.",
  ] },
  { rounds: 2, steps: [
    "Sit up one vertebra taller — just one. Spines respond to modest requests.",
    "From that extra centimeter, glance at the room. Same room. Different address. Stay a moment.",
  ] },
];

const CONSTELLATION_SHAPES: { name: string; meaning: string; stars: [number, number][] }[] = [
  { name: "The Lantern", meaning: "a light carried for someone still walking", stars: [[50, 8], [38, 26], [62, 26], [30, 62], [70, 62], [50, 92]] },
  { name: "The Wing", meaning: "what you grew to lift yourself", stars: [[6, 70], [26, 40], [50, 22], [74, 34], [94, 58], [60, 72]] },
  { name: "The Key", meaning: "the answer you already own", stars: [[14, 50], [36, 50], [52, 38], [70, 38], [70, 62], [52, 62], [86, 50]] },
  { name: "The Cup", meaning: "room made for what is coming", stars: [[22, 26], [78, 26], [70, 70], [50, 86], [30, 70]] },
  { name: "The Spiral", meaning: "the way in is the way around", stars: [[50, 50], [64, 48], [70, 36], [58, 26], [42, 30], [38, 46], [50, 62]] },
  { name: "The Crown", meaning: "crowned by your own patience", stars: [[14, 70], [26, 30], [42, 54], [58, 18], [72, 52], [88, 32], [94, 70]] },
  { name: "The Bridge", meaning: "crossings you make possible for others", stars: [[6, 64], [28, 44], [50, 36], [72, 44], [94, 64], [50, 80]] },
  { name: "The Arrow", meaning: "aim chosen on purpose", stars: [[8, 50], [56, 50], [40, 32], [56, 50], [40, 68], [92, 50]] },
  { name: "The Leaf", meaning: "growth that bends without breaking", stars: [[50, 92], [30, 64], [34, 34], [52, 12], [70, 36], [66, 66]] },
  { name: "The Wave", meaning: "grief and joy riding the same current", stars: [[6, 44], [24, 60], [42, 40], [60, 62], [78, 42], [94, 58]] },
  { name: "The Eye", meaning: "the watched life becomes the lived life", stars: [[10, 50], [34, 26], [66, 26], [90, 50], [66, 74], [34, 74]] },
  { name: "The Boat", meaning: "buoyant, even when heavy with cargo", stars: [[14, 60], [40, 60], [50, 30], [60, 60], [86, 60], [50, 84]] },
  { name: "The Door", meaning: "a threshold drawn by no architect, opened by walking", stars: [[30, 10], [70, 10], [70, 90], [30, 90], [62, 55]] },
  { name: "The Ladder", meaning: "rungs built by trying", stars: [[34, 90], [52, 74], [38, 58], [56, 42], [42, 26], [60, 10]] },
];

const WEAVE_ORBS = [
  "salt", "ember", "river", "bell", "moth", "door", "tide", "lantern",
  "harbor", "compass", "seed", "snow", "feather", "engine", "orchard",
  "well", "star", "paper", "thimble", "clock", "bridge", "key", "garden",
  "signal", "map", "whistle", "glass", "shadow", "honey", "storm",
  "thread", "coin", "window", "spiral", "anchor", "candle", "letter",
  "meadow", "mirror", "oar", "pocket", "quilt", "ring", "tunnel",
  "violin", "weather", "bone", "kettle",
] as const;

const WEAVE_PATTERNS = [
  "Carry the {0} to the {1} and set the {2} down where the road can find it. Not everything that knocks is yours to host.",
  "You are the {0} that the {1} keeps for a {2} that has not happened yet. Store nothing; shine anyway.",
  "First the {0}, then the {1}, and the {2} arrives on its own — like weather, like forgiveness.",
  "The {0} remembers what the {1} forgot and the {2} never knew. This is why you must speak to all three.",
  "A {0} without a {1} is only practice. Add the {2} and it becomes a life.",
  "Trade the {0} for the {1}; keep the {2} in your coat. The day will ask for each in the right order.",
  "Where the {0} meets the {1}, plant the {2}. Crossings are the only honest soil.",
  "The {0} is the question, the {1} is the door, the {2} is who you were on the other side.",
  "Give the {0} away at dawn, the {1} at noon, and hide the {2} from no one. That is the whole teaching.",
  "The {0} taught you speed, the {1} taught you stillness, and the {2} is teaching you the difference.",
  "Wrap the {0} in the {1} and carry it past the {2} — some cargos only ripen under movement.",
  "You already own the {0}, the {1} owes you nothing, and the {2} — the {2} is the gift you are.",
] as const;

const SCALE_POLARITIES: [string, string][] = [
  ["wanting", "having"], ["leaving", "staying"], ["speaking", "keeping"],
  ["hurry", "patience"], ["knowing", "trusting"], ["holding", "releasing"],
  ["arriving", "becoming"], ["memory", "hope"], ["safety", "wonder"],
  ["noise", "silence"], ["giving", "receiving"], ["plan", "chance"],
  ["yesterday", "tomorrow"], ["effort", "grace"], ["doubt", "faith"],
  ["closed", "open"], ["fast", "deep"], ["alone", "together"],
  ["fear", "curiosity"], ["perfect", "honest"],
];

const SCALE_TRUTHS = [
  "The beam settles where you truly live — not where you perform living.",
  "Every position here is a country with its own weather. None of them is exile.",
  "Notice which side your hand avoids. That side has been mailing you letters.",
  "The middle is not a compromise; sometimes it is the only place with a view of both shores.",
  "Wherever the pointer rests, it can be moved. That is the quiet miracle of being temporal.",
  "You did not choose this weight by accident. Somewhere in you, it is teaching something.",
  "Balance is not stillness — it is ten thousand small corrections, done kindly.",
  "The scale measures the question, not your worth. You were never on trial here.",
  "Let it rest heavy. Heaviness is information, not identity.",
  "Let it rest light. Lightness is allowed to be a discipline too.",
  "The truth for today sits exactly where your hand hesitated last.",
  "Between the two weights lives the whole of you — congratulations on being plural.",
  "Slide it again some other day; the reading changes because you do. That is growth, not error.",
  "Wherever it rests, the sky does not move. You are held from somewhere steadier than opinion.",
  "This position is temporary housing. The permanent home is the one doing the sliding.",
] as const;

const GATE_GLYPHSETS: string[][] = [
  ["✶", "✧", "✵", "⟡"],
  ["☾", "☽", "○", "◉"],
  ["☰", "☱", "☲", "☳"],
  ["◈", "◇", "⬡", "❖"],
  ["⚘", "❋", "✿", "❀"],
  ["⌖", "⌘", "⍟", "◎"],
  ["⚛", "⚗", "⌛", "⚚"],
  ["∴", "∵", "⋯", "⋮"],
];

const GATE_OPEN = [
  "The gate does not open so much as agree with you. Step through at any speed.",
  "Open. What was behind it turns out to be the same room, with better light.",
  "The lock releases with the sound of a small, satisfied sigh. Pass when ready.",
  "The door swings and the hinges hum your note. Inside: permission, stacked neatly.",
  "Open — and the threshold glows briefly, honored to be crossed by someone paying attention.",
  "The gate folds its arms and steps aside. Some walls were only ever shy.",
  "Unlocked. Beyond it, the air smells faintly of beginning.",
  "The gate opens exactly one person wide, which is precisely enough for today.",
  "It opens. Beyond: the ordinary day, revealed as the treasure it was impersonating.",
  "The last dial settles and the whole door exhales. Welcome to the other side of trying.",
  "Open — the mechanism was waiting for all three of your yeses.",
  "The glyphs agree, and so does the morning. Walk through like a key returning home.",
  "The gate parts like curtains, not walls. On the other side: the next game of being you.",
  "Open. The door kept your place the whole time — patience was the password.",
] as const;

const ECHO_RETURNS = [
  "The {word} goes into the mirror and comes back older and kinder, wearing a coat made of every time you almost said it.",
  "The {word} returns with salt on its shoes. It has been walking the shore of you all night.",
  "Into the glass went the {word}; out it comes holding its own small lantern, claiming it always had one.",
  "The {word} comes back translated from the original you. Same word, truer pronunciation.",
  "Your {word} returns doubled: one to keep, one to give away. That is how echoes pay rent.",
  "The mirror kept the {word} an extra second — long enough to file its edges smooth. Here it is, gentler.",
  "The {word} arrives back with a stamp on it: PROCESSED, WITH FEELING. The mirror took its time because it cared.",
  "Out of the deep, the {word} surfaces — first as a ripple, then as a rumor, then as a fact you can hold.",
  "The {word} returns as its own ancestor: smaller, older, glowing at the center where the meaning is kept.",
  "The mirror breathed on the {word} and handed it back warm. Words are colder in the pocket than in the telling.",
  "Your {word} comes back re-lit, like a street lamp at dusk: same post, new purpose.",
  "The {word} traveled the long way round your reflection and returned with directions for next time.",
] as const;

const DICE_FACES: DiceFace[] = [
  { glyph: "✶", title: "The Venture", line: "Six sides considered, one chosen: move. The die has seen your odds and likes them." },
  { glyph: "☾", title: "The Rest", line: "The face of tides. Whatever you are forcing can be left overnight without the world filing a complaint." },
  { glyph: "◈", title: "The Craft", line: "Rolled: the builder's face. One small improvement, made today, outvalues ten imagined tomorrows." },
  { glyph: "❋", title: "The Exchange", line: "The social face. A two-minute kindness now will circulate longer than you can track." },
  { glyph: "⌘", title: "The Untangling", line: "The knot-face. Do not cut the rope — trace one loop today. Loops yield to visitors." },
  { glyph: "☉", title: "The Witness", line: "Watch something without fixing it for five minutes. The sun does this all day; it is called shining." },
  { glyph: "⌖", title: "The Aiming", line: "Name the target out loud. Arrows report that vague instructions produce vague flights." },
  { glyph: "⚘", title: "The Blooming", line: "Something you planted is up. Do not dig it up to check — the green knows its own schedule." },
  { glyph: "⌛", title: "The Hourglass", line: "Time is not running out; it is running through. Put your hand in the stream on purpose." },
  { glyph: "⚚", title: "The Herald", line: "A message is forming. Speak clearly to the universe: it files requests under 'mumbled'." },
  { glyph: "⟡", title: "The Balance", line: "Two things are true at once and both are yours. You are allowed to be a contradiction in good standing." },
  { glyph: "❍", title: "The Circle", line: "What left is circling. Leave the porch light on; no need to chase the return route." },
  { glyph: "✧", title: "The Spark", line: "One idea is quietly on fire in you. Shelter it from the winds of committees." },
  { glyph: "⬡", title: "The Hive", line: "Many small efforts are hexagonal and they fit together. Your piece is shaped exactly right." },
  { glyph: "⚖", title: "The Weighing", line: "Choose the heavier gratitude over the lighter grievance today. The arms of the scale thank you." },
  { glyph: "◉", title: "The Eye", line: "Look again at what you skimmed. The second look is where the treasure hides from first glances." },
  { glyph: "✵", title: "The Radiance", line: "Shine first. The room will assume the light was its idea and borrow it anyway." },
  { glyph: "☙", title: "The Keeping", line: "Archive one moment from today with real ceremony. Future-you collects rent from these." },
];

const SPIRAL_LESSONS = [
  "The center of a spiral is not the end of the line — it is where the line finally gets to be quiet.",
  "You were not going in circles. You were going in spirals: same view, one floor down each time.",
  "Held long enough, wandering becomes arrival. The spiral keeps score in patience.",
  "The inward road has no signage; the reward is the quieting of the question itself.",
  "What pulls you inward is not gravity but gravity's kinder cousin: becoming.",
  "At the center of every orbit is something that chose you first.",
  "The descent is only frightening in the frames where you forget it is also a homecoming.",
  "Circles repeat; spirals return changed. You, too, are allowed to come back different.",
  "The still point is not empty — it is where the noise finally runs out of floor.",
  "Every turn you hold is a coat of lacquer on the thing you are becoming.",
  "Deep is a direction, not a distance. You have been deep for longer than you knew.",
  "The spiral's secret: it does not tighten around you. It tightens into you.",
  "Keep holding. The center is closer than the circumference admits, and warmer.",
  "You began this turn as a question. Finish it as a well.",
] as const;

const SIGNAL_PHRASES = [
  "Contact confirmed. Something on the other end just updated your file from 'wandering' to 'en route'.",
  "The channel opens for exactly one breath: you are heard farther than you knew you were broadcasting.",
  "Signal received with applause, faint but real, from an antenna shaped like tomorrow.",
  "The light agrees with you. This is rarer than you think and worth more than you charged.",
  "Repeated perfectly — and somewhere a lighthouse takes your name off the 'missing' list.",
  "The sequence locks in and the static clears like a crowd parting for someone expected.",
  "Well repeated. The universe logs the rhythm and will hum it back to you at a useful moment.",
  "The pads glow their approval. Focus, it turns out, is a language everyone downstream speaks.",
  "Matched. On some chart in some room, a needle just jumped — that was you.",
  "The signal is yours now; carry it loosely. Broadcasts this clean tend to make friends.",
  "Answered on the first return — the channel wants to work with you specifically.",
  "The echo comes back warmer than it left. Memory, correctly exercised, multiplies.",
  "Contact. The far side signs off with three dots and a dash: more soon, keep listening.",
  "Transmission perfected. Consider yourself fluent in at least one language of light.",
] as const;

/* ------------------------------------------------------------------ */
/*  BESPOKE GAMES — thirty-six crown jewels, fully hand-written.       */
/* ------------------------------------------------------------------ */

const BESPOKE: CosmicGame[] = [
  /* ----- oracle ----- */
  {
    id: "sigil-deck", name: "The Sigil Deck", pattern: "oracle",
    tags: ["fate", "time", "courage", "hope", "light"],
    invocation: "Five cards lie face-down in a deck older than your questions. One of them has been waiting for you since before you arrived.",
    payload: { kind: "oracle", draws: [
      { glyph: "✶", title: "The Crossing", line: "What you have been calling waiting is already travel. You are simply walking at the speed of becoming." },
      { glyph: "☾", title: "The Keeper", line: "Someone, somewhere, is keeping a light on for a version of you that is still on the road. Walk accordingly." },
      { glyph: "◈", title: "The Turning", line: "The wheel does not ask the clay if it is ready. Say yes anyway — the spinning is the shaping." },
      { glyph: "❋", title: "The Borrowed Light", line: "You have been shining with someone else's borrowed courage. Keep it — courage was never ruined by lending." },
      { glyph: "⌖", title: "The True North", line: "You are not lost. You are on a detour so long it has its own scenery. Take a photograph." },
      { glyph: "☽", title: "The Tide Table", line: "Low tide is not the sea leaving. It is the sea breathing. You, too, are allowed your pauses." },
    ] },
  },
  {
    id: "moth-library", name: "The Moth Library", pattern: "oracle",
    tags: ["books", "memory", "learning", "language", "silence"],
    invocation: "A library that runs on attention, staffed entirely by moths. Draw one page from the dark and hold it to your lamp.",
    payload: { kind: "oracle", draws: [
      { glyph: "❍", title: "The Wing-Beaten Page", line: "Every book you loved was once a moth that found a lamp and decided to stay. Your attention is that lamp." },
      { glyph: "✧", title: "The Marginalia", line: "A stranger's pencil note in an old book: 'me too'. The whole library rests on those two words." },
      { glyph: "⚘", title: "The Pressed Flower", line: "You keep proof of beautiful afternoons pressed in the pages of other books. This is not nostalgia. This is botany of the self." },
      { glyph: "⌛", title: "The Overdue", line: "Some truths you borrowed years ago and never returned. The fine is payable in one honest sentence." },
      { glyph: "⟡", title: "The Reading Lamp", line: "You cannot un-story yourself. But you may choose, tonight, which chapter gets the good light." },
    ] },
  },
  {
    id: "remembering-coin", name: "The Coin That Remembers", pattern: "oracle",
    tags: ["money", "luck", "fear", "courage", "time"],
    invocation: "One coin, two faces, and a memory longer than yours. Flip it — heads, tails, or the impossible edge; all three pay out.",
    payload: { kind: "oracle", draws: [
      { glyph: "◎", title: "Heads, You Venture", line: "The face-up side wants motion. Say the brave sentence while the kettle boils — courage prefers small kitchens." },
      { glyph: "◉", title: "Tails, You Return", line: "The eagle side points home. Something in your week needs collecting, not chasing." },
      { glyph: "⚖", title: "The Edge", line: "Once in a lifetime the coin lands on its rim. If today feels impossible, congratulations: you are the rare outcome." },
      { glyph: "⌘", title: "The Purse", line: "Count what you have that cannot be pocketed. The list is longer than the wallet. Start with today's sunrise." },
      { glyph: "✵", title: "The Minting", line: "You are being minted. It is loud, it is warm, it is pressing a face onto metal. Someday this exact heat will be your value in circulation." },
    ] },
  },
  /* ----- riddle ----- */
  {
    id: "gate-small-answers", name: "The Gate of Small Answers", pattern: "riddle",
    tags: ["breath", "body", "silence", "healing", "patience"],
    invocation: "This gate does not test cleverness. It tests whether you can still be surprised by the obvious — the rarest skill of all.",
    payload: { kind: "riddle", riddle: RIDDLES[4] },
  },
  {
    id: "kitchen-sphinx", name: "The Sphinx of the Kitchen Table", pattern: "riddle",
    tags: ["travel", "home", "maps", "language", "learning"],
    invocation: "A small sphinx has moved in between the salt and the sugar. It has one question and endless tea. Answer when ready.",
    payload: { kind: "riddle", riddle: RIDDLES[1] },
  },
  {
    id: "question-that-opens", name: "The Question That Opens", pattern: "riddle",
    tags: ["love", "gratitude", "friendship", "joy", "hope"],
    invocation: "The last riddle in the catalog is also the first. The gate swings on a word you already know how to spend.",
    payload: { kind: "riddle", riddle: RIDDLES[19] },
  },
  /* ----- fork ----- */
  {
    id: "crossroads-salt", name: "The Crossroads of Salt", pattern: "fork",
    tags: ["doors", "courage", "fear", "beginnings", "time"],
    invocation: "An ordinary afternoon, one impossible door. The crossroads keeps no records — choose as many times as you like.",
    payload: { kind: "fork", fork: FORKS[0] },
  },
  {
    id: "two-lamps", name: "The Two Lamps", pattern: "fork",
    tags: ["solitude", "friendship", "language", "memory", "night"],
    invocation: "A night train, a stranger, one untold story. The compartment lamp hums while you decide what a stranger may carry.",
    payload: { kind: "fork", fork: FORKS[2] },
  },
  {
    id: "ferryman-question", name: "The Ferryman's Question", pattern: "fork",
    tags: ["time", "hope", "fear", "family", "letters"],
    invocation: "A letter postmarked forty years ahead sits in the ferryman's hand. He will row either way — but first, the choice.",
    payload: { kind: "fork", fork: FORKS[3] },
  },
  /* ----- ritual ----- */
  {
    id: "three-breaths-arrival", name: "The Three Breaths of Arrival", pattern: "ritual",
    tags: ["breath", "body", "silence", "patience", "healing"],
    invocation: "You made it to this exact breath — the least ceremonial moment possible, which is why it deserves one. Press and hold.",
    payload: { kind: "ritual", ritual: RITUALS[0] },
  },
  {
    id: "the-unclenching", name: "The Unclenching", pattern: "ritual",
    tags: ["body", "fear", "anger", "work", "healing"],
    invocation: "Somewhere in you a fist has been closed so long it forgot it was a hand. Three slow rounds. No hurry that matters.",
    payload: { kind: "ritual", ritual: RITUALS[5] },
  },
  {
    id: "witness-practice", name: "The Witness Practice", pattern: "ritual",
    tags: ["silence", "attention", "presence", "learning", "light"],
    invocation: "Noticing is a skill with a gym. Three rounds, all reps, no weights — the room supplies everything.",
    payload: { kind: "ritual", ritual: RITUALS[3] },
  },
  /* ----- constellation ----- */
  {
    id: "lantern-sky", name: "The Lantern in the Sky", pattern: "constellation",
    tags: ["light", "hope", "night", "friends", "courage"],
    invocation: "Six stars have been pretending to be random all night. Tap the one that pulses — it knows the shape.",
    payload: { kind: "constellation", sky: CONSTELLATION_SHAPES[0] },
  },
  {
    id: "night-bird-wing", name: "The Wing of the Night Bird", pattern: "constellation",
    tags: ["flight", "freedom", "courage", "change", "dreams"],
    invocation: "A wing, half-beaten, hanging in the dark. Connect it and feel what lifts.",
    payload: { kind: "constellation", sky: CONSTELLATION_SHAPES[1] },
  },
  {
    id: "door-in-sky", name: "The Door in the Sky", pattern: "constellation",
    tags: ["doors", "beginnings", "hope", "change", "travel"],
    invocation: "Somewhere above the ceiling of things, a door stands outlined in starlight. It has never once been locked.",
    payload: { kind: "constellation", sky: CONSTELLATION_SHAPES[12] },
  },
  /* ----- weave ----- */
  {
    id: "loom-three-words", name: "The Loom of Three Words", pattern: "weave",
    tags: ["language", "creativity", "memory", "hope", "time"],
    invocation: "Six words float where words should not. Choose three, in the order your hand insists, and the loom will do the believing.",
    payload: { kind: "weave", weave: { orbs: ["door", "tide", "lantern", "seed", "bell", "moth"], patterns: [...WEAVE_PATTERNS] } },
  },
  {
    id: "sentence-garden", name: "The Sentence Garden", pattern: "weave",
    tags: ["gardens", "growth", "patience", "language", "hope"],
    invocation: "Plant three words in any order. The garden writes back in full sentences — it always has.",
    payload: { kind: "weave", weave: { orbs: ["garden", "letter", "honey", "storm", "thread", "window"], patterns: [...WEAVE_PATTERNS] } },
  },
  {
    id: "thrice-spoken", name: "The Thrice-Spoken", pattern: "weave",
    tags: ["names", "language", "courage", "memory", "love"],
    invocation: "Words said three times become true in a new place. Pick your three; the candle does the rest.",
    payload: { kind: "weave", weave: { orbs: ["name", "candle", "bridge", "oar", "mirror", "coin"], patterns: [...WEAVE_PATTERNS] } },
  },
  /* ----- scale ----- */
  {
    id: "weighing-of-light", name: "The Weighing of Light", pattern: "scale",
    tags: ["truth", "language", "memory", "love", "fear"],
    invocation: "On one pan: the things said. On the other: the things kept. Slide the beam and read what the balance keeps for each position.",
    payload: { kind: "scale", scale: { left: "speaking", right: "keeping", truths: [...SCALE_TRUTHS] } },
  },
  {
    id: "balance-now-later", name: "The Balance of Now and Later", pattern: "scale",
    tags: ["time", "patience", "hope", "memory", "work"],
    invocation: "Two weights every human has carried: the day that was, the day becoming. The beam has something to say to wherever you stand.",
    payload: { kind: "scale", scale: { left: "yesterday", right: "tomorrow", truths: [...SCALE_TRUTHS] } },
  },
  {
    id: "tender-scale", name: "The Tender Scale", pattern: "scale",
    tags: ["fear", "curiosity", "courage", "learning", "change"],
    invocation: "Fear in one pan, curiosity in the other. Both are yours; only the ratio changes. Slide gently.",
    payload: { kind: "scale", scale: { left: "fear", right: "curiosity", truths: [...SCALE_TRUTHS] } },
  },
  /* ----- gate ----- */
  {
    id: "trigram-lock", name: "The Trigram Lock", pattern: "gate",
    tags: ["mystery", "patience", "learning", "silence", "hope"],
    invocation: "Three dials of ancient marks stand between you and a small opening. The gate hums when a dial is true.",
    payload: { kind: "gate", gate: { dials: [GATE_GLYPHSETS[2], GATE_GLYPHSETS[2], GATE_GLYPHSETS[2]], open: pick(mulberry32(hashStr("trigram-lock")), GATE_OPEN) } },
  },
  {
    id: "ninefold-gate", name: "The Ninefold Gate", pattern: "gate",
    tags: ["mystery", "hope", "time", "courage", "change"],
    invocation: "Nine glyphs, three wheels, one agreement waiting to happen. Turn until the door remembers its job.",
    payload: { kind: "gate", gate: { dials: [GATE_GLYPHSETS[0], GATE_GLYPHSETS[0], GATE_GLYPHSETS[0]], open: pick(mulberry32(hashStr("ninefold-gate")), GATE_OPEN) } },
  },
  {
    id: "agreeing-glyphs", name: "The Door of Agreeing Glyphs", pattern: "gate",
    tags: ["agreement", "friendship", "peace", "patience", "language"],
    invocation: "This door was built by someone who believed in your thumbs. Three dials, one welcome.",
    payload: { kind: "gate", gate: { dials: [GATE_GLYPHSETS[3], GATE_GLYPHSETS[3], GATE_GLYPHSETS[3]], open: pick(mulberry32(hashStr("agreeing-glyphs")), GATE_OPEN) } },
  },
  /* ----- echo ----- */
  {
    id: "mirror-word", name: "The Mirror Word", pattern: "echo",
    tags: ["language", "silence", "memory", "identity", "truth"],
    invocation: "Give the mirror one word — the one riding shotgun in your chest today. It will return it changed in all the right places.",
    payload: { kind: "echo", echo: { returns: [...ECHO_RETURNS] } },
  },
  {
    id: "echo-well", name: "The Echo Well", pattern: "echo",
    tags: ["water", "sound", "solitude", "patience", "hope"],
    invocation: "Drop one word down the well. The water has been practicing your voice for years.",
    payload: { kind: "echo", echo: { returns: [...ECHO_RETURNS] } },
  },
  {
    id: "reflected-name", name: "The Reflected Name", pattern: "echo",
    tags: ["names", "identity", "love", "memory", "time"],
    invocation: "Offer a single word and watch the reflection do what reflections do best: tell the truth sideways.",
    payload: { kind: "echo", echo: { returns: [...ECHO_RETURNS] } },
  },
  /* ----- dice ----- */
  {
    id: "six-sided-oracle", name: "The Six-Sided Oracle", pattern: "dice",
    tags: ["luck", "hope", "time", "courage", "joy"],
    invocation: "Six faces, each a different department of the cosmos. Roll once — the oracle has been rehearsing its lines all week.",
    payload: { kind: "dice", dice: { faces: [...DICE_FACES] } },
  },
  {
    id: "bones-of-chance", name: "The Bones of Chance", pattern: "dice",
    tags: ["chance", "luck", "fear", "patience", "time"],
    invocation: "The oldest UI in the world still works: throw, tumble, truth. The bones have rolled for pharaohs and they roll for you.",
    payload: { kind: "dice", dice: { faces: [...DICE_FACES] } },
  },
  {
    id: "weather-die", name: "The Weather Die", pattern: "dice",
    tags: ["weather", "moods", "patience", "hope", "change"],
    invocation: "Forecasting feelings since forever: one roll, one climate report for the soul.",
    payload: { kind: "dice", dice: { faces: [...DICE_FACES] } },
  },
  /* ----- spiral ----- */
  {
    id: "listeners-spiral", name: "The Listener's Spiral", pattern: "spiral",
    tags: ["silence", "patience", "attention", "healing", "night"],
    invocation: "Press and keep pressing. A mote of light will spiral inward for exactly as long as you keep it company. The center pays in lessons.",
    payload: { kind: "spiral", spiral: { lesson: SPIRAL_LESSONS[0] } },
  },
  {
    id: "descending-stair", name: "The Descending Stair", pattern: "spiral",
    tags: ["depth", "courage", "change", "dreams", "time"],
    invocation: "A staircase that only builds itself under a held hand. Descend as far as your attention goes; the bottom stair is a teaching.",
    payload: { kind: "spiral", spiral: { lesson: SPIRAL_LESSONS[6] } },
  },
  {
    id: "center-that-waits", name: "The Center That Waits", pattern: "spiral",
    tags: ["patience", "hope", "silence", "love", "becoming"],
    invocation: "Everything in you that rushes is invited to hold still. The spiral only deepens under devotion.",
    payload: { kind: "spiral", spiral: { lesson: SPIRAL_LESSONS[12] } },
  },
  /* ----- signal ----- */
  {
    id: "first-signal", name: "The First Signal", pattern: "signal",
    tags: ["light", "attention", "memory", "hope", "contact"],
    invocation: "Somewhere patient, a transmitter is blinking your way. Watch the pattern, then answer it in the same tongue.",
    payload: { kind: "signal", signal: { phrase: SIGNAL_PHRASES[0], sequence: [0, 2, 1, 3, 0] } },
  },
  {
    id: "lightship-greeting", name: "The Lightship's Greeting", pattern: "signal",
    tags: ["sea", "travel", "hope", "friends", "contact"],
    invocation: "A lightship offshore sends four stones of light in an order only memory can keep. Repeat it and the channel opens.",
    payload: { kind: "signal", signal: { phrase: SIGNAL_PHRASES[4], sequence: [1, 3, 3, 2] } },
  },
  {
    id: "four-stones", name: "The Four Stones", pattern: "signal",
    tags: ["earth", "memory", "attention", "silence", "learning"],
    invocation: "Four stones, one sequence, zero hurry. The signal is short; the reward is a sentence you will keep.",
    payload: { kind: "signal", signal: { phrase: SIGNAL_PHRASES[8], sequence: [3, 0, 1, 2, 1] } },
  },
];

/* ------------------------------------------------------------------ */
/*  THE GENERATOR — one hundred sixty-four composed games.            */
/*  Deterministic: the same id always assembles the same game.        */
/* ------------------------------------------------------------------ */

const NAME_PREFIXES = [
  "Salt", "Night", "Quiet", "Amber", "Paper", "Hollow", "Ninth", "Tidal",
  "Glass", "Wandering", "Copper", "Lunar", "Ember", "Iron", "Starlit",
  "Velvet", "Winter", "Honey", "Ashen", "Marble", "Drifting", "Borrowed",
  "Unwritten", "Sleepless", "Morning", "Evening", "Hidden", "Patient",
  "Rusted", "Feathered", "Porcelain", "Windborne",
] as const;

const NAME_NOUNS = [
  "Hourglass", "Bell", "Compass", "Lantern", "Seed", "Key", "Map", "Loom",
  "Well", "Deck", "Orchard", "Antenna", "Thimble", "Ledger", "Almanac",
  "Whistle", "Kite", "Mirror", "Sparrow", "Lighthouse", "Greenhouse",
  "Telescope", "Dictionary", "Suitcase", "Postcard", "Garden", "Staircase",
  "Umbrella", "Aviary", "Atlas", "Belfry", "Cistern", "Dial", "Estuary",
  "Ferry", "Gatehouse", "Herbarium", "Inkwell", "Kiln", "Menagerie",
] as const;

const PATTERNS: GamePattern[] = [
  "oracle", "riddle", "fork", "ritual", "constellation", "weave",
  "scale", "gate", "echo", "dice", "spiral", "signal",
];

/** How many generated games each pattern receives (round-robin). */
function generatedCountFor(patternIndex: number): number {
  const total = 164;
  return Math.floor(total / 12) + (patternIndex < total % 12 ? 1 : 0);
}

function buildGenerated(): CosmicGame[] {
  const games: CosmicGame[] = [];
  const usedNames = new Set(BESPOKE.map((g) => g.name.toLowerCase()));

  PATTERNS.forEach((pattern, patternIndex) => {
    const count = generatedCountFor(patternIndex);
    for (let i = 0; i < count; i++) {
      const seq = patternIndex * 100 + i;
      const rng = mulberry32(hashStr(`mirror-game-${pattern}-${i}`));
      const id = `${pattern}-gen-${i}`;

      /* unique name from the strided grid of prefix × noun */
      const flat = NAME_PREFIXES.length * NAME_NOUNS.length;
      let n = 0;
      let name = "";
      do {
        const idx = (seq * 137 + n * 1499) % flat;
        name = `The ${NAME_PREFIXES[idx % NAME_PREFIXES.length]} ${
          NAME_NOUNS[Math.floor(idx / NAME_PREFIXES.length) % NAME_NOUNS.length]
        }`;
        n++;
      } while (usedNames.has(name.toLowerCase()) && n < 400);
      usedNames.add(name.toLowerCase());

      const tags = pickDistinct(rng, TOPIC_TAGS, 4);
      const invocation = pick(rng, INVOCATIONS[pattern]).replace("{name}", name);

      let payload: CosmicPayload;
      switch (pattern) {
        case "oracle": {
          const titles = pickDistinct(rng, ORACLE_TITLES, 5);
          const lines = pickDistinct(rng, ORACLE_LINES, 5);
          const glyphs = pickDistinct(rng, GLYPHS, 5);
          payload = {
            kind: "oracle",
            draws: titles.map((title, k) => ({
              glyph: glyphs[k],
              title,
              line: lines[k],
            })),
          };
          break;
        }
        case "riddle": {
          /* skip the three riddles the bespoke games claim (indexes 4, 1, 19) */
          const pool = RIDDLES.filter((_, k) => k !== 1 && k !== 4 && k !== 19);
          payload = { kind: "riddle", riddle: pool[i % pool.length] };
          break;
        }
        case "fork": {
          /* skip the three forks the bespoke games claim (indexes 0, 2, 3) */
          const pool = FORKS.filter((_, k) => k !== 0 && k !== 2 && k !== 3);
          payload = { kind: "fork", fork: pool[i % pool.length] };
          break;
        }
        case "ritual": {
          /* skip the three rituals the bespoke games claim (indexes 0, 3, 5) */
          const pool = RITUALS.filter((_, k) => k !== 0 && k !== 3 && k !== 5);
          payload = { kind: "ritual", ritual: pool[i % pool.length] };
          break;
        }
        case "constellation": {
          const sky = CONSTELLATION_SHAPES[i % CONSTELLATION_SHAPES.length];
          payload = { kind: "constellation", sky };
          break;
        }
        case "weave": {
          const orbs = pickDistinct(rng, WEAVE_ORBS, 6);
          const patterns = pickDistinct(rng, WEAVE_PATTERNS, 3);
          payload = { kind: "weave", weave: { orbs, patterns } };
          break;
        }
        case "scale": {
          const [left, right] = pick(rng, SCALE_POLARITIES);
          const truths = pickDistinct(rng, SCALE_TRUTHS, 5);
          payload = { kind: "scale", scale: { left, right, truths } };
          break;
        }
        case "gate": {
          const dials = pickDistinct(rng, GATE_GLYPHSETS, 3);
          payload = { kind: "gate", gate: { dials, open: pick(rng, GATE_OPEN) } };
          break;
        }
        case "echo": {
          payload = { kind: "echo", echo: { returns: [...ECHO_RETURNS] } };
          break;
        }
        case "dice": {
          const faces = pickDistinct(rng, DICE_FACES, 6);
          payload = { kind: "dice", dice: { faces } };
          break;
        }
        case "spiral": {
          payload = { kind: "spiral", spiral: { lesson: pick(rng, SPIRAL_LESSONS) } };
          break;
        }
        case "signal": {
          const len = 4 + Math.floor(rng() * 2);
          const sequence: number[] = [];
          for (let k = 0; k < len; k++) sequence.push(Math.floor(rng() * 4));
          payload = { kind: "signal", signal: { phrase: pick(rng, SIGNAL_PHRASES), sequence } };
          break;
        }
      }

      games.push({ id, name, pattern, tags, invocation, payload });
    }
  });

  return games;
}

/* ------------------------------------------------------------------ */
/*  THE CATALOG — two hundred encounters.                             */
/* ------------------------------------------------------------------ */

export const COSMIC_GAMES: CosmicGame[] = [...BESPOKE, ...buildGenerated()];
export const COSMIC_GAME_COUNT = COSMIC_GAMES.length; /* 200 */

const GAME_BY_ID = new Map(COSMIC_GAMES.map((g) => [g.id, g]));

export function getGame(id: string): CosmicGame | undefined {
  return GAME_BY_ID.get(id);
}

/* ------------------------------------------------------------------ */
/*  THE SELECTION LAW — one game, one exchange, only by resonance.     */
/*                                                                      */
/*  • Cooldown: at most one game every three exchanges in a channel.   */
/*  • First-ever visit: the very first completed transmission receives */
/*    one guaranteed game — the Laboratory likes to be introduced.     */
/*  • Resonance: a game may surface only when the exchange speaks its  */
/*    tags; ties are broken by the exchange's own seed.                */
/*  • Never twice in a row from the same corner of the catalog.        */
/* ------------------------------------------------------------------ */

const COOLDOWN_EXCHANGES = 2;
const OFFER_CHANCE = 0.85;
const WILDCARD_MIN_GAP = 4;
const WILDCARD_CHANCE = 0.35;
const EVER_FLAG = "mirror-game-ever";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreGame(game: CosmicGame, text: string): number {
  let score = 0;
  for (const tag of game.tags) {
    const re = new RegExp(`\\b${escapeRe(tag)}`, "i");
    if (re.test(text)) score++;
  }
  return score;
}

export function offerGameFor(opts: {
  question: string;
  transmission: string;
  /** The channel's prior exchanges (oldest first) — used for the
      cooldown and to avoid repeating recent games. */
  priorMessages: { game?: GameInstance }[];
}): GameInstance | null {
  const { question, transmission, priorMessages } = opts;

  /* cooldown — count exchanges since the last game in this channel */
  let gap = priorMessages.length;
  for (let i = priorMessages.length - 1; i >= 0; i--) {
    if (priorMessages[i].game) {
      gap = priorMessages.length - 1 - i;
      break;
    }
  }

  let firstEver = false;
  try {
    if (typeof window !== "undefined" && !window.localStorage.getItem(EVER_FLAG)) {
      firstEver = true;
      window.localStorage.setItem(EVER_FLAG, new Date().toISOString());
    }
  } catch {
    /* storage unavailable — treat as never-offered */
    firstEver = priorMessages.every((m) => !m.game);
  }

  if (!firstEver && gap < COOLDOWN_EXCHANGES) return null;

  const rng = mulberry32(hashStr(`${question}·${transmission}`));
  if (!firstEver && rng() > OFFER_CHANCE) return null;

  const text = `${question} ${transmission}`.toLowerCase();
  const recent = priorMessages
    .slice(-3)
    .map((m) => m.game?.gameId)
    .filter((id): id is string => Boolean(id));
  const recentSet = new Set(recent);

  const scored = COSMIC_GAMES.map((g) => ({ game: g, score: scoreGame(g, text) }))
    .filter((s) => s.score > 0 && !recentSet.has(s.game.id))
    .sort((a, b) => b.score - a.score);

  let chosen: CosmicGame | null = null;
  if (scored.length > 0) {
    const top = scored[0].score;
    const bucket = scored.filter((s) => s.score >= top - 1).map((s) => s.game);
    chosen = bucket[Math.floor(rng() * bucket.length)];
  } else if (firstEver || (gap >= WILDCARD_MIN_GAP && rng() < WILDCARD_CHANCE)) {
    /* no resonance — an unasked gift, rarely, from anywhere in the deck */
    const pool = COSMIC_GAMES.filter((g) => !recentSet.has(g.id));
    chosen = pool[Math.floor(rng() * pool.length)];
  }

  return chosen ? { gameId: chosen.id, seed: hashStr(`${chosen.id}·${question}`) % 1000000 } : null;
}
