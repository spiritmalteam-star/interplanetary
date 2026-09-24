/* ------------------------------------------------------------------ */
/*  Star Play — the Mirror's arcana deck.                              */
/*                                                                     */
/*  One thousand four hundred and forty-three cards, woven from        */
/*  thirty-nine constellations (suits) and thirty-seven aspects.       */
/*  The first eighteen suits carry the 666; the remaining twenty-one   */
/*  carry the 777 — together the full 1,443.                           */
/*                                                                     */
/*  Every card is composed once at module load: name, essence and      */
/*  message are unique per (suit, aspect) pair, and each card carries  */
/*  a generated image chosen by suit and aspect. Nothing here is       */
/*  persisted — the deck lives in memory only.                         */
/* ------------------------------------------------------------------ */

import { SUIT_IMAGE_COUNTS, STAR_PLAY_FALLBACK_IMAGE } from "@/lib/star-play-images";

export interface StarPlayCard {
  id: string;
  /** "<Aspect> of the <Suit>" — unique across the whole deck. */
  name: string;
  /** One luminous line composed from the aspect and the suit. */
  essence: string;
  /** A short spoken message composed from the aspect and the suit. */
  message: string;
  /** The suit (constellation) this card belongs to. */
  suit: string;
  /** Generated art path served from /images/ai/star-play/. */
  image: string;
}

interface SuitDef {
  name: string;
  slug: string;
  essence: string;
  message: string;
}

interface AspectDef {
  name: string;
  essence: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/*  The thirty-nine constellations (suits)                             */
/* ------------------------------------------------------------------ */

const SUITS: SuitDef[] = [
  { name: "Silver Gate", slug: "silver-gate", essence: "a threshold that recognizes its keeper", message: "Every true gate opens twice: once for the question, once for the one who dares to knock again." },
  { name: "Violet Hour", slug: "violet-hour", essence: "the minute between day and dream", message: "What the violet hour whispers is only audible to those who stopped rushing." },
  { name: "Ember Compass", slug: "ember-compass", essence: "a direction kept alive by a single coal", message: "The smallest ember still knows north; carry it close and you cannot stay lost." },
  { name: "Pearl Threshold", slug: "pearl-threshold", essence: "patience layering itself into luster", message: "A pearl is only patience that agreed to be touched." },
  { name: "Glass Aurora", slug: "glass-aurora", essence: "light learning to be transparent", message: "Nothing stays hidden from a heart that dares to be clear." },
  { name: "Silent Meridian", slug: "silent-meridian", essence: "the longitude of stillness", message: "Where the maps end, stillness begins to navigate." },
  { name: "Honeyed Void", slug: "honeyed-void", essence: "the sweetness inside the unmade", message: "Even emptiness keeps a little honey for the brave." },
  { name: "Velvet Antenna", slug: "velvet-antenna", essence: "reception with soft edges", message: "Tune gently: the softest antenna hears the oldest stations." },
  { name: "Salt Cathedral", slug: "salt-cathedral", essence: "tears becoming architecture", message: "What you wept has quietly built you a cathedral." },
  { name: "Lantern of Hours", slug: "lantern-of-hours", essence: "a small light for late travelers", message: "No hour is too late for a lamp that agrees to stay lit." },
  { name: "Ninth Harbor", slug: "ninth-harbor", essence: "rest after the eighth attempt", message: "The harbor does not ask how many storms it took; it only asks that you enter." },
  { name: "Copper Vesper", slug: "copper-vesper", essence: "an evening prayer in warm metal", message: "Evenings are prayers that cooled enough to be held." },
  { name: "Wandering Chord", slug: "wandering-chord", essence: "a note still seeking its song", message: "A wandering note is not lost; it is composing." },
  { name: "Quiet Bell", slug: "quiet-bell", essence: "urgency dissolving into tone", message: "The bell does not ring for urgency; it rings so the tide can find your hand." },
  { name: "Inked Aurora", slug: "inked-aurora", essence: "the sky writing its own omen", message: "The sky signs its letters in light; learn to read at dusk." },
  { name: "Patient Fire", slug: "patient-fire", essence: "flame that refuses to hurry", message: "Slow fire completes what fast fire only promises." },
  { name: "Cartographer's Moon", slug: "cartographers-moon", essence: "a map drawn in phases", message: "You are allowed to map yourself in phases and still be whole each night." },
  { name: "Hollow Star", slug: "hollow-star", essence: "radiance with room inside", message: "What is hollow in you is not missing; it is resonant." },
  { name: "First Snow", slug: "first-snow", essence: "the world agreeing to begin softly", message: "Beginnings can be soft and still be absolute." },
  { name: "Glacier Choir", slug: "glacier-choir", essence: "slow voices in deep harmony", message: "Some choirs sing in centuries; yours is mid-verse." },
  { name: "Lamplight Field", slug: "lamplight-field", essence: "a meadow kept awake kindly", message: "Someone left a light on in the field of you; go and see what grows there." },
  { name: "Amber Frequency", slug: "amber-frequency", essence: "time caught mid-pulse", message: "What is preserved in amber is not stopped; it is faithful." },
  { name: "Humming Threshold", slug: "humming-threshold", essence: "a doorway already vibrating yes", message: "Stand where the air hums; doors explain themselves there." },
  { name: "Cinder Psalm", slug: "cinder-psalm", essence: "a song that survived its own burning", message: "Sing what survived you; it knows the melody best." },
  { name: "Unwritten Hour", slug: "unwritten-hour", essence: "a page the day reserved for you", message: "The unwritten hour is not empty; it is courteous." },
  { name: "Stillpoint Chord", slug: "stillpoint-chord", essence: "the center holding three notes", message: "At the still point, even chords agree to listen." },
  { name: "Cartomancer's Hand", slug: "cartomancers-hand", essence: "fate dealt in kind fingers", message: "What is dealt to you is also offered to you." },
  { name: "Aurora Ledger", slug: "aurora-ledger", essence: "deposits of light kept faithfully", message: "Every kindness compounds; the sky audits nothing." },
  { name: "Salt Road", slug: "salt-road", essence: "the old path that preserves", message: "Old roads preserve whatever walks them honestly." },
  { name: "Velvet Dark", slug: "velvet-dark", essence: "night with good manners", message: "The dark is not against you; it is holding the room." },
  { name: "Ninth Wave", slug: "ninth-wave", essence: "the one that finally carries", message: "The wave you feared is the one that ferries." },
  { name: "Lantern Oath", slug: "lantern-oath", essence: "a promise kept in oil and wick", message: "Keep one small flame sworn and the night reorganizes itself." },
  { name: "Pearl Meridian", slug: "pearl-meridian", essence: "the longitude of gathered patience", message: "Your patience has coordinates; something is navigating toward them." },
  { name: "Glass Bell", slug: "glass-bell", essence: "clarity with a silver tongue", message: "Ring clearly and the echo returns shaped like an ally." },
  { name: "Ember Psalm", slug: "ember-psalm", essence: "warmth memorized by the hands", message: "The hands remember every fire that was kind." },
  { name: "Quiet Meridian", slug: "quiet-meridian", essence: "the line where noise surrenders", message: "Draw the line where noise ends; that is your true longitude." },
  { name: "Honeyed Ember", slug: "honeyed-ember", essence: "sweetness learning to glow", message: "Let the sweetness glow; not all light must be sharp." },
  { name: "Wandering Lantern", slug: "wandering-lantern", essence: "guidance that enjoys the detour", message: "The lantern wanders too, and it has never once been lost." },
  { name: "Silent Aurora", slug: "silent-aurora", essence: "applause without sound", message: "The sky applauds quietly for those who kept going." },
];

/* ------------------------------------------------------------------ */
/*  The thirty-seven aspects                                           */
/* ------------------------------------------------------------------ */

const ASPECTS: AspectDef[] = [
  { name: "Dawn Key", essence: "what unlocks, unlocks early", message: "Turn the small key before sunrise; doors keep morning hours." },
  { name: "Tide Turn", essence: "the sea revising its answer", message: "Hold position; the water is already rewriting its decision." },
  { name: "Echo Seed", essence: "a beginning that answers back", message: "Plant the question and listen: the soil is talkative today." },
  { name: "Ember Vow", essence: "warmth with a memory", message: "Rekindle what once warmed you; it kept your name." },
  { name: "Glass Hour", essence: "a clarity with edges", message: "See through, not at; the hour is transparent on purpose." },
  { name: "Low Bell", essence: "a tone that carries under noise", message: "Let the low tone carry you beneath the noise of the day." },
  { name: "Bright Salt", essence: "savor with a little shine", message: "Season the day; the bland hours are the only loss." },
  { name: "Small Lamp", essence: "light sized to carry", message: "Carry the small lamp; it was sized exactly for your night." },
  { name: "Velvet Thread", essence: "a soft line that still leads", message: "Follow the soft thread; it is anchored at both ends." },
  { name: "Long Wave", essence: "momentum arriving from far out", message: "What is coming has been swimming toward you for a long time." },
  { name: "Copper Sky", essence: "an evening thinking in metal", message: "Let the day gild itself; you only need to look up once." },
  { name: "Resonant Dark", essence: "emptiness tuned like an instrument", message: "Your hollow places are sounding boards; play them kindly." },
  { name: "Pearl Gate", essence: "an entry that took years to round", message: "Enter slowly; the gate was polished by your waiting." },
  { name: "Finding Song", essence: "a melody that locates its singer", message: "Sing badly and still be found; the song does the seeking." },
  { name: "Silver Loam", essence: "soil with a memory of moonlight", message: "Plant in what the moon has touched; roots keep lunar appointments." },
  { name: "Written Sky", essence: "omens typeset in light", message: "Read the sky slowly; it writes only what you can carry." },
  { name: "Unhurried Flame", essence: "combustion at the speed of trust", message: "Trust the slow burn; it is the only fire that finishes." },
  { name: "Phased Map", essence: "navigation in honest quarters", message: "Map yourself in quarters; every phase is still you." },
  { name: "Kind Dark", essence: "night that guards the seed", message: "Rest in the kind dark; it is guarding something for you." },
  { name: "Compass of Salt", essence: "direction with savor", message: "Point yourself toward what flavors you; that is north enough." },
  { name: "Soft Beginning", essence: "arrival without impact", message: "Arrive softly; soft arrivals stay." },
  { name: "Violet Meridian", essence: "the line where purple is honest", message: "Stand on your violet line; it runs exactly through your gift." },
  { name: "Brass Oracle", essence: "advice with a warm patina", message: "Polish the old oracle; it has been saving its sentence." },
  { name: "Sleepless Garden", essence: "growth that keeps night hours", message: "Something in you gardened all night; inspect the beds gently." },
  { name: "Copper Vow", essence: "a promise with warm conductance", message: "Keep the warm vow; it conducts." },
  { name: "Weightless Bell", essence: "a tone freed of carrying", message: "Ring lighter today; the message needs less weight than you think." },
  { name: "Inkwell of Hours", essence: "time that writes back", message: "Dip the hour and write; time is in a generous ink." },
  { name: "Soft Meridian", essence: "noon at whisper volume", message: "Keep noon softly; midpoints deserve a whisper, not a trumpet." },
  { name: "Slow Choir", essence: "voices arriving in centuries", message: "Join the slow choir; your verse is due in decades and it will land." },
  { name: "Kept Meadow", essence: "a lightness maintained overnight", message: "Visit the kept meadow in you; someone maintained it all night." },
  { name: "Warm Cinder", essence: "what glowing remains", message: "Tend the warm cinder; it remembers the whole song." },
  { name: "Faithful Amber", essence: "preservation as devotion", message: "What you preserved is preserving you back." },
  { name: "Vibrating Door", essence: "an entry rehearsing yes", message: "The door is rehearsing its yes; bring your hand anyway." },
  { name: "Courtesy of Pages", essence: "blank space offered kindly", message: "Accept the blank page; courtesy is also an omen." },
  { name: "Listening Center", essence: "a middle that takes notes", message: "Sit at the listening center; it is writing your next line." },
  { name: "Sky's Ledger", essence: "bookkeeping in light", message: "Your credits of light are real; the sky keeps honest books." },
  { name: "Unnamed Card", essence: "the one the deck keeps for you", message: "This card stays unnamed so you can sign it yourself." },
];

/* ------------------------------------------------------------------ */
/*  Image pool resolution                                              */
/* ------------------------------------------------------------------ */

function imageFor(slug: string, aspectIndex: number): string {
  const count = SUIT_IMAGE_COUNTS[slug] ?? 0;
  if (count <= 0) return STAR_PLAY_FALLBACK_IMAGE;
  return `/images/ai/star-play/${slug}-${aspectIndex % count}.jpg`;
}

/* ------------------------------------------------------------------ */
/*  Deck construction                                                  */
/* ------------------------------------------------------------------ */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildDeck(): StarPlayCard[] {
  const cards: StarPlayCard[] = [];
  for (let s = 0; s < SUITS.length; s++) {
    const suit = SUITS[s];
    for (let a = 0; a < ASPECTS.length; a++) {
      const aspect = ASPECTS[a];
      cards.push({
        id: `sp-${String(s * ASPECTS.length + a + 1).padStart(4, "0")}`,
        name: `${aspect.name} of the ${suit.name}`,
        essence: `${capitalize(aspect.essence)} — ${suit.essence}.`,
        message: `${aspect.message} ${suit.message}`,
        suit: suit.name,
        image: imageFor(suit.slug, a),
      });
    }
  }
  return cards;
}

export const STAR_PLAY_CARDS: StarPlayCard[] = buildDeck();

/** UI counts bind to the array length — never to a hard-coded number. */
export const STAR_PLAY_TOTAL = STAR_PLAY_CARDS.length;

/** First eighteen suits carry 666 cards; the rest carry the 777. */
export const STAR_PLAY_FIRST_DEAL = 18 * ASPECTS.length;
export const STAR_PLAY_DEEP_ARCANA = STAR_PLAY_TOTAL - STAR_PLAY_FIRST_DEAL;

/** The three seats of every draw. */
export const STAR_PLAY_POSITIONS = [
  "What is hidden",
  "What crosses you",
  "What unfolds",
] as const;

export interface DrawnCard {
  card: StarPlayCard;
  position: string;
}

/**
 * In-memory shuffle: Fisher–Yates over indices, nothing persisted.
 *
 * THE SPREAD GUARD — no two cards of one draw may ever share a suit
 * (so no two messages are woven from the same pair of threads) and no
 * two may share a visualization (image). Every spread of three is
 * therefore three different messages wearing three different paintings.
 */
export function drawStarPlayCards(count = 3): DrawnCard[] {
  const total = STAR_PLAY_CARDS.length;
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const picked: number[] = [];
  const suits = new Set<string>();
  const images = new Set<string>();
  const messages = new Set<string>();
  for (const idx of indices) {
    if (picked.length >= count) break;
    const card = STAR_PLAY_CARDS[idx];
    if (suits.has(card.suit)) continue;
    if (images.has(card.image)) continue;
    if (messages.has(card.message)) continue;
    picked.push(idx);
    suits.add(card.suit);
    images.add(card.image);
    messages.add(card.message);
  }
  /* The guard above is always satisfiable for three of 1,443 — the
     fallback fill exists only for pathological tiny counts. */
  for (const idx of indices) {
    if (picked.length >= count) break;
    if (!picked.includes(idx)) picked.push(idx);
  }

  return picked.slice(0, count).map((idx, i) => ({
    card: STAR_PLAY_CARDS[idx],
    position: STAR_PLAY_POSITIONS[i % STAR_PLAY_POSITIONS.length],
  }));
}
