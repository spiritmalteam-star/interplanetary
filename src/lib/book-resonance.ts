/* ------------------------------------------------------------------ */
/*  THE RESONANCE DRAW — the mirror knows the book by resonance only.  */
/*                                                                     */
/*  When a volume is conjured, the laboratory draws its creative       */
/*  skeleton BLIND, at the exact second of the asking: sixteen axes,   */
/*  each with its own family of shapings, plus a secret heartbeat      */
/*  phrase minted from raw syllable pools. Nothing is read from any    */
/*  shelf, any record, any database, any previous volume — the draw    */
/*  IS the resonance of that one second, and it is kept by no one.     */
/*                                                                     */
/*  The combinatorial space (every axis crossed with every other,      */
/*  crossed again with the heartbeat) is far beyond ten-to-the-        */
/*  twentieth: no two conjurings can walk the same skeleton, and the   */
/*  skeleton is LAW — so no two books may ever be the same or super    */
/*  similar, even when the same subject is spoken twice in a row.      */
/*                                                                     */
/*  Pure and weightless: no imports, no I/O, safe anywhere.            */
/* ------------------------------------------------------------------ */

export interface ResonanceDraw {
  /** The exact second of the draw — one of one. */
  moment: string;
  /** The secret heartbeat — never printed as a slogan, only felt. */
  heartbeat: string;
  /** Who or what carries the story. */
  vessel: string;
  /** The world's dominant weather. */
  world: string;
  /** The feel of time in this volume. */
  clock: string;
  /** The shape of the telling itself. */
  device: string;
  /** The engine under the plot. */
  tension: string;
  /** The senses this volume favors. */
  palette: string;
  /** The emotional key it is played in. */
  key: string;
  /** How the first page must open. */
  opening: string;
  /** How the middle of the book turns. */
  turning: string;
  /** The narrative distance. */
  voice: string;
  /** The quiet object at the story's center of gravity. */
  object: string;
  /** How the impossible behaves here. */
  wonder: string;
  /** The style of chapter titles. */
  chapters: string;
  /** The final cadence. */
  closing: string;
  /** The law of rhythm. */
  pacing: string;
  /** The one thing this volume must never do. */
  forbidden: string;
}

const pick = <T,>(pool: readonly T[]): T =>
  pool[Math.floor(Math.random() * pool.length)];

/* ------------------------- the sixteen axes ------------------------ */

/* I. THE VESSEL — who carries the story. Never the obvious hero:
   the draw bends the chooser of the tale away from the channel's
   habits, whatever the subject. */
const VESSELS = [
  "the story is carried by a keeper of small forgotten things — someone whose work nobody thanks and without whom everything stops",
  "the story is carried by a child who is not brave, not chosen — only present, and present is enough",
  "the story is carried by an old woman who remembers things that have not happened yet",
  "the story is carried by a maker — hands that mend, build, mend again — and the plot moves at the speed of their work",
  "the story is carried by a stranger who arrives with one bag and no history, and the town's story bends around them",
  "the story is carried by two voices in alternation — one who leaves, one who stays",
  "the story is carried by a creature the reader never quite sees whole — only its effects, its tracks, its shadow",
  "the story is carried by the last practitioner of a dying craft",
  "the story is carried by someone whose job is to watch and record — and one day the record starts disagreeing with the watching",
  "the story is carried by a pair of siblings who do not agree about anything except the ending",
  "the story is carried by someone who has lost the thing the story is about and is pretending they haven't",
  "the story is carried by an apprentice who is better than their master at everything except the one thing that matters",
  "the story is carried by a guide who has walked the road so many times it has worn smooth — until this walk",
  "the story is carried by a collector of sounds, or smells, or last words",
  "the story is carried by the one who was left behind, telling it forward",
  "the story is carried by someone who talks to one specific object and the object, in its way, answers",
  "the story is carried by a fugitive who is innocent of the thing they are fleeing",
  "the story is carried by a mapmaker whose maps keep being true before the places exist",
  "the story is carried by the youngest member of a family of keepers — of a gate, a lamp, a ledger, a silence",
  "the story is carried by someone who returned home after a long absence to find it subtly rearranged",
  "the story is carried by a doubter in a place of certain people — and their doubt is the reader's flashlight",
  "the story is carried by a pair of unlikely partners thrown together by one shared mistake",
  "the story is carried by someone whose name was taken from them and who is earning a new one",
  "the story is carried by an insomniac who sees the hour others sleep through",
  "the story is carried by a listener — one who hears what is under the words — and the story is what they hear",
  "the story is carried by the keeper of a door that opens once in a great while",
] as const;

/* II. THE WORLD'S WEATHER — the setting's dominant character. */
const WORLDS = [
  "a place of fog and harbor lights, where the sea keeps the real authority",
  "an interior world of corridors, courtyards and doors that were bricked up for reasons no one remembers",
  "a high thin landscape of stone, wind and distance, where every sound carries too far",
  "a green overgrown world where nature is polite but absolutely in charge",
  "a city of water — canals, rain, bridges — where reflections are a second city",
  "a desert world of horizons, where what is far away is more real than what is near",
  "a world of winter evenings, lamplight and long tables",
  "a floating world — islands, balloons, ships in the sky — where falling is a subject, not a fear",
  "a world under a roof: a vast structure so old its inhabitants live inside it like rings in a tree",
  "a riverine world — fords, ferries, drowned bells — where everything moves at the water's speed",
  "a world of ruins being quietly lived in — marble sheep-pens, cathedrals as barns",
  "a volcanic world of black sand, warm stones and a mountain that hums in its sleep",
  "an orchard world — rows and grafting and seasons, where the trees are the oldest characters",
  "a salt-flat world so flat that thoughts echo",
  "a market world of stalls, barter, rumors and every language at once",
  "a cave world beneath a walking country — dark rivers, patient stone",
  "a garden world so cultivated it has become a maze, and the way out is grown over",
  "a lighthouse world — one tower, weather, and the long patience of keeping a light",
  "a world of manors and servants' stairs, where the true life happens in the corridors",
  "a world of night trains, timetables and stations that only some travelers can see",
  "a tidal world — the land itself breathes in and out twice a day, and the village moves with it",
  "a paper world of libraries, archives, marginalia and ink-stained fingers",
  "a steppe world of riders, storms on the horizon and songs with no end",
  "a workshop world of benches, shavings, furnaces and the smell of hot metal",
  "a world of terraces cut into a mountainside, where each family keeps one level",
  "a world after the maps were redrawn — borders old and new running through gardens and marriages",
] as const;

/* III. THE CLOCK — the feel of time. */
const CLOCKS = [
  "time moves like deep water — a tale that could be long ago or not yet, and never says which",
  "one single day, stretched until it can hold a whole life",
  "one winter, from first frost to thaw",
  "one long journey, and the clock is the road itself",
  "the space of one apprenticeship — seasons of learning counted in scars and skills",
  "a handful of hours around one impossible night",
  "a year of tides, moons and market days",
  "the time it takes a letter to travel — and the story happens inside the waiting",
  "three returns: the character leaves, comes back, leaves again — each homecoming stranger",
  "the last days of an era — everyone can feel the age ending, nobody agrees on what comes next",
  "a childhood remembered from the far side of adulthood, with the adult voice kept out",
  "the length of a rebuild — a house, a boat, a bridge — and the story is done when the work is",
  "a countdown felt by all and spoken by none",
  "one generation, told through its turning points — a wedding, a burial, a door closed for the last time",
  "an hour that repeats — not as a trap, but as an invitation to live it differently each time",
  "a lifetime told backward, from the last scene to the first, so every ending is a beginning",
  "the nine days between two full moons",
  "the time a seed needs — growth measured in roots the reader never sees",
] as const;

/* IV. THE TELLING DEVICE — the shape of the telling itself. */
const DEVICES = [
  "told as a sequence of found field notes, with dates, margins and one note that contradicts the rest",
  "told as a letter written over many months to someone who may never read it",
  "told in the rhythm of a bedtime ritual — recurring lines that gather new meaning at each return",
  "told as entries in a shop ledger where the goods gradually become strange",
  "told as the transcript of one long conversation over one long night, with silences marked",
  "told as a series of recipes, and each recipe remembers an event",
  "told as map captions — each chapter the story of one place on the map, until the map joins up",
  "told as weather reports from a valley where the weather and the hearts agree too well",
  "told as an inventory of a house, room by room, and the rooms hold their histories",
  "told as a song cycle — verses that circle, the refrain aging as the story does",
  "told as a case file assembled by a sympathetic investigator who comes to believe",
  "told as a teacher's lessons — each chapter one teaching, the class growing up between chapters",
  "told as one continuous walk, the road supplying the chapter breaks",
  "told as answers to questions a child asks, the questions getting bigger",
  "told as the log of a keeper — watches, weather, one extraordinary entry that changes the log's tone",
  "told as a stack of unsent replies to one letter",
  "told as the margins a reader left in an old book — and the story lives in the margins",
  "told as dreams recorded at dawn, each one one page closer to waking",
  "told as a trial — testimonies, each witness holding one piece of the truth, none holding all",
  "told as a home's guestbook across decades — one visit at a time",
  "told as a repair manual for something that cannot be repaired, and the trying is the plot",
  "told as a radio broadcast to no listeners, until one day there is an answer",
] as const;

/* V. THE CENTRAL TENSION — the engine under the plot. */
const TENSIONS = [
  "a promise made in childhood comes due, and keeping it will cost what the promiser now loves most",
  "a door that must be opened before someone else does — and no one agrees what is behind it",
  "a name that was lost or traded away, and the long quiet work of getting it back",
  "a debt owed to something that is patient, and the interest is coming visible",
  "a light that must be kept burning, and the fuel is running out in a way nobody will say aloud",
  "a town's founding bargain is ending, and the renewal demands something no one wants to name",
  "two people share one gift between them — and the gift works properly for only one at a time",
  "a return: the one who left comes back whole, and home has moved on without them",
  "a message that must be carried across a distance that has already taken two messengers",
  "a thing that must be remembered by someone before the last one who knows it is gone",
  "a boundary — between fields, worlds, duties — that has begun to move on its own",
  "a guest who cannot be turned away and cannot be allowed to stay",
  "an inheritance that arrives with conditions, and the conditions are a riddle the giver left in kindness",
  "a mirror-situation: the hero must do to another what was once done to them, and chooses otherwise",
  "a season that failed, a winter that stayed, and the quiet politics of who gets the stores",
  "an apprentice's first solo work, which is also the town's one chance",
  "a hiding place that must never be found, kept by a family for generations, and this generation wants answers",
  "a rescue planned for years that must now happen in one afternoon",
  "a bargain with a tide, a wind or a mountain — renewals are due",
  "a twin, a double or a reflection that has begun to act slightly ahead of its original",
  "a gift that cannot be refused, passed hand to hand, and each holder must give it away better",
  "the discovery that the story everyone in town agrees on is wrong — and the truth is kinder and harder",
  "a key that fits one lock somewhere, and the lock is looking for it too",
  "one question the seeker was told never to ask, and the book is the long consequences of asking it",
  "a bridge that must be crossed by someone who once nearly drowned there",
  "a home that must be moved — carried, floated, walked — and every family member carries a different piece",
] as const;

/* VI. THE IMAGERY PALETTE — the senses this volume favors. */
const PALETTES = [
  "copper, salt and lamplight — things that warm and things that corrode",
  "glass, moss and rain — transparency with green life under it",
  "smoke, paper and wax — everything faintly sweet and impermanent",
  "ice, ember and breath — heat held inside cold",
  "bread, wool and cedar — the smell-language of shelter",
  "iron, honey and thorn — sweetness defended",
  "moonwater, slate and heron — cool grays with sudden silver",
  "amber, dust and violin — golden light through old rooms",
  "indigo-ink, snowlight and charcoal — a world drawn in two colors plus shadow",
  "brine, rope and gull-cry — everything salted and tied",
  "feather, flint and juniper — light things, hard things, evergreen things",
  "velvet, rust and moth — softness that time is eating",
  "clay, milk and poppy — earth-plain with sudden red",
  "birch, ink and frost-melt — whiteness with writing on it",
  "tin, lavender and stray cats — smalltown silver and the half-wild",
  "granite, kelp and starlight — the mountain, the sea, the sky, each getting a turn",
  "wheat, thunder and cellar-dark — harvest with the storm behind it",
  "porcelain, matchflame and white hair — fragility, small fire, long time",
] as const;

/* VII. THE EMOTIONAL KEY. */
const KEYS = [
  "wistful courage — the bravery of people who are afraid and go anyway",
  "quiet awe — the reader should look up from the page once per chapter and just breathe",
  "mischievous joy — the world is serious but the telling is delighted",
  "tender melancholy — everything lost is still warm in the memory of the telling",
  "cozy suspense — danger present, hearth intact, the cat asleep by the fire",
  "fierce gentleness — soft hands, iron spine",
  "the hush before dawn — held breath, almost-there, the sky deciding",
  "warm thunder — big weather, bigger hearts",
  "the comfort of ritual — the same words at the same hour holding a life together",
  "luminous strangeness — wonder that feels like remembering rather than discovering",
  "slow forgiveness — the longest arc in the book is one person softening toward another",
  "salt and laughter — grief and joy taking turns at the table",
  "the dignity of small work — nothing grand happens, and everything matters",
  "first-light hope — not the victory, the morning right after the longest night",
  "deep-play wonder — the delight of a mind finally shown how the trick works",
  "homecoming — the whole book is one long road toward a door the reader already loves",
] as const;

/* VIII. THE OPENING LAW — how page one must begin. */
const OPENINGS = [
  "open in the middle of a task — hands busy, weather noted, and the strangeness arrives as an interruption",
  "open with a list the character is checking, and let the last item be impossible",
  "open with the end of a conversation, the beginning lost — the reader leans in to recover it",
  "open with the exact moment a routine breaks — the same as every day, except for one detail",
  "open with weather that is behaving like a mood",
  "open with an object in an impossible place, and no one else finds it impossible",
  "open with a name being spoken that the speaker was told never to say",
  "open with a door already open that is always locked",
  "open with the sound before the sight — a footstep, a bell, a wing — and the source withheld",
  "open with a departure seen from behind, and the one watching does not wave",
  "open with an instruction — 'hold it exactly so' — that turns out to be for the reader too",
  "open with a small kindness that will matter enormously by the last page",
  "open with a memory so short it is only an image, then step into now",
  "open with a question a child asks and an adult cannot answer",
  "open with an arrival at dusk and a host who says 'you are expected' though no message was sent",
  "open with a measurement — 'exactly forty-one steps' — and make the counting matter",
] as const;

/* IX. THE TURNING — how the middle of the book turns. */
const TURNINGS = [
  "the turning is a change of direction the reader suspected but not the reason — the why lands late and re-colors the early pages",
  "the turning is a gift from an enemy",
  "the turning is a truth about a place, not a person — the ground itself was keeping the secret",
  "the turning is quiet: someone simply stops pretending, and everything reorganizes around the honesty",
  "the turning is an inheritance — the past hands over its tool at exactly the moment it can be used",
  "the turning is a failure that opens the real road — the plan was the detour",
  "the turning is a rescue that must be refused to be completed",
  "the turning is a swap: two characters exchange roles for one chapter and cannot fully exchange back",
  "the turning is a door — literal or not — that was behind the hero the whole time",
  "the turning is the smallest character doing the largest thing",
  "the turning is an apology, made by the last person who owes it, at the moment it is least useful and most needed",
  "the turning is a choice between two good things — and the book honors both",
  "the turning is weather: the outer world breaks its pattern and forces the inner one to break its own",
  "the turning is a return to page one's image, changed — same words, whole new meaning",
  "the turning is trust: someone hands over the one thing that could destroy them",
  "the turning is a translation — a word, a song or a letter finally understood in the listener's own tongue",
  "the turning is the moment the pursuit reverses and the watcher is watched",
  "the turning is a meal shared with the adversary, and the conversation under the conversation is the plot",
] as const;

/* X. THE VOICE — narrative distance. */
const VOICES = [
  "told in first person by the vessel — close, warm, occasionally unreliable in ways the reader can catch",
  "told in close third person, riding just behind the vessel's eyes",
  "told by a village voice — a 'we' that knows everyone's business and is fond of all of it",
  "told in second person sparingly — 'you' only at the threshold moments, otherwise third",
  "told as if reading aloud to one listener: the narrator sometimes addresses the listener directly",
  "told by two narrators trading chapters, each slightly misreading the other",
  "told with great narrative distance — high and calm — dropping suddenly close for one sentence per page",
  "told by the vessel as an old person recalling, with the recall so vivid it is happening",
  "told by a recording intelligence — patient, curious, learning tenderness as the story proceeds",
  "told in the present tense — everything happening now, breath unbroken",
] as const;

/* XI. THE QUIET OBJECT — the thing at the story's center of gravity. */
const OBJECTS = [
  "a key that fits no lock anyone owns",
  "a stone that is always faintly warm",
  "a bottle with a tide inside it",
  "a lamp that burns without oil and without light — until it doesn't",
  "a book with one blank page that is never blank twice",
  "a bell that rings once a generation",
  "a coat with a pocket deeper than the coat",
  "a seed that will not sprout until the right question is asked near it",
  "a compass that points to the thing most needed, not the north",
  "a mirror that shows the room as it is loved, not as it is",
  "a rope with a knot that unties only for honest hands",
  "a pair of boots that walk a little farther than the wearer intended",
  "a jar of preserved summers, one spoonful per year",
  "a ladder short by exactly one rung",
  "a thimble that has held a king's oath",
  "a lantern that shows the way only for someone carrying it for another",
  "a watch that runs a day early",
  "a chair set always at the table for the one who left",
  "a whistle only the lost can hear",
  "a quilt sewn from maps of everywhere the family slept",
  "a pen that writes the truth slightly ahead of the writer",
  "a door-knocker from a house that no longer exists",
  "a hat that collects weather",
  "an envelope that must be delivered before it can be opened",
] as const;

/* XII. THE LAW OF WONDER — how the impossible behaves here. */
const WONDERS = [
  "wonder here obeys rhymes: say the true rhyme at the true hour and the world listens",
  "wonder here costs memory — every marvel takes a remembering with it",
  "wonder here is shy: it works only for those who do not demand it",
  "wonder here is domestic — it lives in chores, kitchens and toolsheds, and is maintained like a garden",
  "wonder here is traded honestly — one true thing for another, no coin involved",
  "wonder here only moves at thresholds — doorways, dusk, the space between one step and the next",
  "wonder here belongs to children and the very old; the middle of life must ask politely",
  "wonder here is communal — it works when two or more hold the same wish at once",
  "wonder here is contractual — old agreements, kept in ledgers, honored to the letter",
  "wonder here is quiet and deniable — every marvel has a mundane explanation if you insist on it",
  "wonder here is musical — the world answers the right song, badly sung is fine, falsely sung is not",
  "wonder here runs on kindness arithmetic — it accumulates in a place through small unrecorded deeds",
  "wonder here sleeps and must be woken gently, and it is grumpy when woken",
  "wonder here is inherited in the hands, not the blood — the craft itself is the magic",
  "wonder here marks a price on every map — go around, or pay",
  "wonder here answers questions — but only the ones asked out loud, alone, at the right place",
  "wonder here is seasonal — it blooms, it withers, and everyone knows when it is coming back",
  "wonder here waits inside repetition — the fortieth time a thing is done truly, it opens",
] as const;

/* XIII. THE CHAPTER STYLE. */
const CHAPTERS = [
  "chapters are named for times of day or night",
  "chapters are named for places on one journey",
  "chapters are single nouns — tools, weathers, foods",
  "chapters are short questions, growing bolder as the book proceeds",
  "chapters are named for what is kept, lost or found in them",
  "chapters are named like fields in an old ledger — entries, dates, counts",
  "chapters carry the names of winds or tides",
  "chapters are named for seeds, plants and stages of growing",
  "chapters are two-word pairings — noun and noun, quietly strange together",
  "chapters are named for rooms, stations, landings — the architecture of the telling",
  "chapters are named for songs, hymns and melodies the characters know",
  "chapters are commands — soft imperatives, one to a chapter",
] as const;

/* XIV. THE CLOSING CADENCE — the seal of closing. */
const CLOSINGS = [
  "close on a door left open — literally or otherwise — with the weather coming in kind",
  "close on a name spoken into water, wind or fire and carried away",
  "close on the start of a new small routine, which the reader knows will hold",
  "close on a hand-me-down: the object, the story or the duty changing keepers",
  "close on a homecoming that is smaller and better than the one the character set out wanting",
  "close on the same image the book opened with, one book later",
  "close on a season arriving early, unasked, as a gift",
  "close on laughter in the last line, earned by everything before it",
  "close on a promise renewed in different words than the first time",
  "close on a secret finally shared with exactly one other person",
  "close on the road continuing — not for the hero, for someone else, glimpsed",
  "close on silence that feels full rather than empty",
  "close on an ordinary evening made luminous by everything the reader now knows",
  "close on a letter finally sent — and the sending is the ending",
] as const;

/* XV. THE PACING LAW. */
const PACINGS = [
  "the pacing is slow-burn: pages of settling before each rise, and the rises are worth the wait",
  "the pacing tumbles: short chapters, momentum forward, breath caught only at chapter turns",
  "the pacing breathes: one page of stillness for every page of event, in rhythm",
  "the pacing accelerates: unhurried beginning, each third of the book one notch faster, the last pages flying",
  "the pacing is tidal: advance, retreat, advance — and each retreat leaves something new on the sand",
  "the pacing strolls with sudden sprints: long lanes of ease crossed by one breathless page",
  "the pacing is a metronome: each spread delivers one small certainty and one small mystery, unfailingly",
  "the pacing decelerates: it begins at a run and slows toward the final stillness, like a heart coming home",
  "the pacing zigzags between two storylines that converge exactly once, at the exact center",
  "the pacing is patient as a fisherman: one scene held long past comfort, then released all at once",
] as const;

/* XVI. THE FORBIDDEN — the one habit this volume must not touch.
   This is the anti-similarity blade: it cuts the channel's own
   favorite moves out of its hand for this conjuring. */
const FORBIDDENS = [
  "this volume must not use dreams as plot devices — the sleeping mind stays private",
  "this volume must not contain a prophecy — nobody in it knows the future and nobody in it pretends to",
  "this volume must not open with weather described for its own sake — weather appears only through its effect",
  "this volume must not send its vessel on a journey — the whole story happens within walking distance",
  "this volume must not include a chase scene — pursuit of any kind is absent",
  "this volume must not let any elder character dispense wisdom in speech — every teaching here is shown, never told",
  "this volume must not use snow, roses, ravens or full moons anywhere in its imagery",
  "this volume must not contain a hidden royal or chosen bloodline — rank is ordinary here",
  "this volume must not resolve anything through coincidence — every turn is earned by a choice",
  "this volume must not include a map-like inventory of the world — geography arrives only as lived",
  "this volume must not use letters or messages as turning points — all revelation is face to face",
  "this volume must not have a villain — every antagonist is a person with reasons the reader can hold",
  "this volume must not use the word 'destiny' nor any of its cousins in any language",
  "this volume must not make the vessel special — their ordinariness is the point, and the world is special around them",
] as const;

/* --------------- the secret heartbeat — word pools ----------------- */

const HB_FIRST = [
  "lantern", "tide", "key", "orchard", "bell", "ember", "bridge", "ledger",
  "feather", "compass", "garden", "echo", "anchor", "thread", "door", "harbor",
  "river", "shutter", "window", "coin", "moth", "ladder", "mirror", "violin",
  "storm", "seed", "chest", "rope", "candle", "gate", "bee", "stone",
  "letter", "snowfield", "workshop", "well", "kiln", "star", "clover", "oar",
  "attic", "wyrd", "chimney", "saltcellar", "moonpath", "whistle", "handrail", "hourglass",
] as const;

const HB_VERB = [
  "remembers", "answers", "waits for", "dreams of", "keeps", "sings to",
  "carries", "follows", "forgives", "calls back", "counts", "watches over",
  "opens", "trades with", "walks beside", "hums to", "learns", "teaches",
  "shelters", "unlocks", "runs ahead of", "listens for", "waits up for", "sits with",
] as const;

const HB_LAST = [
  "the tide", "the one who left", "small hours", "the borrowed name",
  "the second bell", "its own shadow", "the quiet season", "the honest thief",
  "the patient door", "the last ferry", "the unfinished song", "the mapmaker's daughter",
  "the winter guest", "the late bloom", "the keeper's oath", "the found coin",
  "the far orchard", "the eighth day", "the soft alarm", "the narrow sea",
  "the borrowed light", "the laughing stone", "the open ledger", "the warm window",
] as const;

/* --------------------------- the draw ------------------------------ */

/** Draws one complete resonance — blind, at the moment of the ask.
 *  Nothing is consulted: no record, no shelf, no database, no past.
 *  The draw is the resonance of this exact second and is kept by no one. */
export function drawResonance(): ResonanceDraw {
  const heartbeat = `${pick(HB_FIRST)} that ${pick(HB_VERB)} ${pick(HB_LAST)}`;
  return {
    moment: new Date().toISOString(),
    heartbeat,
    vessel: pick(VESSELS),
    world: pick(WORLDS),
    clock: pick(CLOCKS),
    device: pick(DEVICES),
    tension: pick(TENSIONS),
    palette: pick(PALETTES),
    key: pick(KEYS),
    opening: pick(OPENINGS),
    turning: pick(TURNINGS),
    voice: pick(VOICES),
    object: pick(OBJECTS),
    wonder: pick(WONDERS),
    chapters: pick(CHAPTERS),
    closing: pick(CLOSINGS),
    pacing: pick(PACINGS),
    forbidden: pick(FORBIDDENS),
  };
}

/* ------------------------- the charter ----------------------------- */

/** Renders the draw as the charter the loom must obey — the skeleton
 *  that makes this volume unlike every volume before or after it. */
export function resonanceCharter(d: ResonanceDraw): string {
  return [
    `THE RESONANCE DRAW OF THIS VOLUME (drawn blind at ${d.moment}, for this conjuring alone — drawn from nothing: no shelf, no record, no database, no past volume, no memory of any kind. This draw IS the resonance of the asking moment, and it is the SKELETON of the book):`,
    `- THE SECRET HEARTBEAT: "a ${d.heartbeat}". This phrase is never printed, never quoted, never explained inside the book — it is the hidden rhythm the imagery, the turns, the names and the cadence keep returning to without saying so. A reader who finishes the book should be able to guess it without ever having seen it.`,
    `- THE VESSEL: ${d.vessel}.`,
    `- THE WORLD'S WEATHER: ${d.world}. Bend it to fit the spoken subject — but the weather of the world keeps this character.`,
    `- THE CLOCK: ${d.clock}.`,
    `- THE SHAPE OF THE TELLING: ${d.device}.`,
    `- THE ENGINE: ${d.tension}.`,
    `- THE PALETTE: ${d.palette}.`,
    `- THE EMOTIONAL KEY: ${d.key}.`,
    `- THE OPENING LAW: ${d.opening}.`,
    `- THE TURNING LAW: ${d.turning}.`,
    `- THE VOICE: ${d.voice}.`,
    `- THE QUIET OBJECT: ${d.object} — it may appear humbly, but it is the book's center of gravity.`,
    `- THE LAW OF WONDER: ${d.wonder}.`,
    `- THE CHAPTER STYLE: ${d.chapters}.`,
    `- THE CLOSING CADENCE: ${d.closing}.`,
    `- THE PACING LAW: ${d.pacing}.`,
    `- THE FORBIDDEN (absolute): ${d.forbidden}.`,
    `THE SKELETON IS LAW: the subject is the master frequency (the WHAT), this draw is the telling (the HOW) — and the HOW has final authority over vessel, world, form, voice, imagery and cadence, bent faithfully around the subject. Another conjuring will draw another skeleton; THIS volume must be unthinkable inside any other skeleton. If any choice above feels like the channel's most obvious move for this subject, lean into it HARDER, not away — the obvious subject plus an unexpected skeleton is exactly what no reader has met before.`,
  ].join("\n");
}

/** A compact echo of the draw for the visitor's own library record —
 *  kept FOR the visitor (their volume's birth certificate), used for
 *  nothing: the mirror never reads it back. */
export function resonanceEcho(d: ResonanceDraw): Record<string, string> {
  return {
    heartbeat: d.heartbeat,
    vessel: d.vessel,
    world: d.world,
    device: d.device,
    tension: d.tension,
    forbidden: d.forbidden,
  };
}
