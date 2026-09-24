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
  { name: "Silver Gate", slug: "silver-gate", essence: "a threshold that recognizes its keeper", message: "You arrive at a door you have circled for years, and tonight it remembers your hand. Walk through; the room on the other side has been keeping your chair warm." },
  { name: "Violet Hour", slug: "violet-hour", essence: "the minute between day and dream", message: "Between the day and the dream there is a quiet minute that belongs only to you. Sit inside it and you will hear how kindly your life has been waiting." },
  { name: "Ember Compass", slug: "ember-compass", essence: "a direction kept alive by a single coal", message: "One coal of certainty still glows where you thought everything had burned. Cup your hands around it and begin again; it has never once forgotten the direction of your home." },
  { name: "Pearl Threshold", slug: "pearl-threshold", essence: "patience layering itself into luster", message: "What you have carried patiently is rounding itself into something luminous. Let it finish; nothing precious was ever hurried into shine." },
  { name: "Glass Aurora", slug: "glass-aurora", essence: "light learning to be transparent", message: "You have been learning to be clear the way sky is clear — not empty, just honest. Tonight your transparency becomes the very light others steer by." },
  { name: "Silent Meridian", slug: "silent-meridian", essence: "the longitude of stillness", message: "Where every map of your life runs out, a deeper navigation begins. Stand still at that edge and feel it quietly taking your bearings." },
  { name: "Honeyed Void", slug: "honeyed-void", essence: "the sweetness inside the unmade", message: "Even the emptiness you feared has been keeping something sweet for you. Reach into the unwritten dark with an open hand and taste what patience makes." },
  { name: "Velvet Antenna", slug: "velvet-antenna", essence: "reception with soft edges", message: "The softest part of you is the part that hears the oldest stations. Lower your armor like an arrow lowered into still water, and listen to what returns." },
  { name: "Salt Cathedral", slug: "salt-cathedral", essence: "tears becoming architecture", message: "Every tear you thought was lost has gone somewhere, and it has been building. Walk inside what you have wept and see how high the ceilings are." },
  { name: "Lantern of Hours", slug: "lantern-of-hours", essence: "a small light for late travelers", message: "Somewhere in your late hours a small lamp is still lit, and it is lit for you. Go to it; no night has ever been too far gone for a light that agreed to stay." },
  { name: "Ninth Harbor", slug: "ninth-harbor", essence: "rest after the eighth attempt", message: "You have counted the storms, but the harbor never did. Enter now, exactly as you are, ropes frayed and sails tired — rest was the destination all along." },
  { name: "Copper Vesper", slug: "copper-vesper", essence: "an evening prayer in warm metal", message: "The evening cools your day into something you can finally hold. Let what is ending be a prayer; warmth remembers everything it touched." },
  { name: "Wandering Chord", slug: "wandering-chord", essence: "a note still seeking its song", message: "The part of you that has not found its song is not lost — it is composing. Every detour you regret is a bar of music only you could have written." },
  { name: "Quiet Bell", slug: "quiet-bell", essence: "urgency dissolving into tone", message: "Nothing in you needs to ring louder today. Let one low tone move through your tide, and feel how much finds shore on its own." },
  { name: "Inked Aurora", slug: "inked-aurora", essence: "the sky writing its own omen", message: "The sky has been signing its letters to you in light. Learn to read at dusk, and the ordinary evening becomes a correspondence you answer." },
  { name: "Patient Fire", slug: "patient-fire", essence: "flame that refuses to hurry", message: "What is slow in you is not behind; it is thorough. Trust the flame that refused to hurry — it completes what quick fire only promised." },
  { name: "Cartographer's Moon", slug: "cartographers-moon", essence: "a map drawn in phases", message: "You are allowed to map yourself in phases and still be whole each night. Draw today's coast honestly; the moon will vouch for the rest." },
  { name: "Hollow Star", slug: "hollow-star", essence: "radiance with room inside", message: "The hollow in you is not a missing piece; it is a resonating chamber. Anything true you place inside it will sound like a bell for years." },
  { name: "First Snow", slug: "first-snow", essence: "the world agreeing to begin softly", message: "Something in your life is beginning again, softly, the way the world agrees to whiteness. Let it start quiet; gentle beginnings are still absolute." },
  { name: "Glacier Choir", slug: "glacier-choir", essence: "slow voices in deep harmony", message: "The slow voices in you are singing in centuries, and they have not skipped a verse. You are mid-song in a harmony much older than your hurry." },
  { name: "Lamplight Field", slug: "lamplight-field", essence: "a meadow kept awake kindly", message: "Someone left a light on in the field of you, and the grass grew toward it all night. Walk out and see what has been tended while you slept." },
  { name: "Amber Frequency", slug: "amber-frequency", essence: "time caught mid-pulse", message: "What you preserved is not frozen; it is faithful. Time caught mid-pulse still beats for whoever returns to hold it." },
  { name: "Humming Threshold", slug: "humming-threshold", essence: "a doorway already vibrating yes", message: "There is a doorway in your days that vibrates faintly with yes. Stand where the air hums and it will explain everything doors never say." },
  { name: "Cinder Psalm", slug: "cinder-psalm", essence: "a song that survived its own burning", message: "What survived its own burning in you still knows the melody. Sing from the cinders today; that voice is the one nothing can take." },
  { name: "Unwritten Hour", slug: "unwritten-hour", essence: "a page the day reserved for you", message: "The day has set aside a page with your name on it. The unwritten hour is not empty — it is courteous, and it waits the way good hosts wait." },
  { name: "Stillpoint Chord", slug: "stillpoint-chord", essence: "the center holding three notes", message: "At your center three notes have agreed to listen to each other. Visit that stillness and bring your noise; it is the only place noise learns to sing." },
  { name: "Cartomancer's Hand", slug: "cartomancers-hand", essence: "fate dealt in kind fingers", message: "What is dealt to you is also offered to you. Take it with kind fingers, and the game turns from fate into conversation." },
  { name: "Aurora Ledger", slug: "aurora-ledger", essence: "deposits of light kept faithfully", message: "Every kindness you have spent is still on deposit in the sky's honest books. Tonight the interest arrives as light; accept the audit of a generous universe." },
  { name: "Salt Road", slug: "salt-road", essence: "the old path that preserves", message: "The old road under you preserves whatever walks it honestly. Your worn shoes are becoming a path someone will follow home." },
  { name: "Velvet Dark", slug: "velvet-dark", essence: "night with good manners", message: "The dark around you is not against you; it is holding the room. Let night keep the door and the quiet keep the time — you are safe enough to soften." },
  { name: "Ninth Wave", slug: "ninth-wave", essence: "the one that finally carries", message: "The wave you feared is the one that ferries. Stop swimming against your life; let the deep water carry you the last stretch in." },
  { name: "Lantern Oath", slug: "lantern-oath", essence: "a promise kept in oil and wick", message: "Keep one small flame sworn, no matter how the winds negotiate. The night reorganizes itself around anyone who keeps a promise of light." },
  { name: "Pearl Meridian", slug: "pearl-meridian", essence: "the longitude of gathered patience", message: "Your patience has coordinates, and something faithful is navigating toward them. Hold your longitude a little longer; arrival is already adjusting its sails." },
  { name: "Glass Bell", slug: "glass-bell", essence: "clarity with a silver tongue", message: "Ring clearly today, even if your voice shakes. The echo that returns will be shaped like an ally, and it will know your name." },
  { name: "Ember Psalm", slug: "ember-psalm", essence: "warmth memorized by the hands", message: "Your hands remember every fire that was ever kind to them. Warm them at that memory now; gratitude is a fuel that never runs dry." },
  { name: "Quiet Meridian", slug: "quiet-meridian", essence: "the line where noise surrenders", message: "Draw the line where the noise ends and stand on it like a coastline. That quiet longitude is the truest address you own." },
  { name: "Honeyed Ember", slug: "honeyed-ember", essence: "sweetness learning to glow", message: "Let the sweetness in you glow without apology; not all light must be sharp to be strong. Warmth, too, is a form of brilliance." },
  { name: "Wandering Lantern", slug: "wandering-lantern", essence: "guidance that enjoys the detour", message: "The light that guides you enjoys the detour, and it has never once been lost. Follow it the long way home; the long way is where the wild flowers keep their secrets." },
  { name: "Silent Aurora", slug: "silent-aurora", essence: "applause without sound", message: "The sky is applauding quietly for you — for the years you kept going when no one watched. Stand in the silence and let it land; you have earned this color." },
];

/* ------------------------------------------------------------------ */
/*  The thirty-seven aspects                                           */
/* ------------------------------------------------------------------ */

const ASPECTS: AspectDef[] = [
  { name: "Dawn Key", essence: "what unlocks, unlocks early", message: "Turn the small key before sunrise; doors keep morning hours for those who rise to meet them. What unlocks early stays unlocked all day." },
  { name: "Tide Turn", essence: "the sea revising its answer", message: "Hold your position a moment longer; the water is already rewriting its answer. What stood against you is beginning to carry you." },
  { name: "Echo Seed", essence: "a beginning that answers back", message: "Plant the question and stay to listen — the soil is talkative today. Everything you begin honestly answers back." },
  { name: "Ember Vow", essence: "warmth with a memory", message: "Rekindle what once warmed you; it kept your name through the cold years. Old flames remember exactly how to be gentle." },
  { name: "Glass Hour", essence: "a clarity with edges", message: "See through things today, not merely at them. The hour is transparent on purpose, and so, suddenly, are you." },
  { name: "Low Bell", essence: "a tone that carries under noise", message: "Let the low tone carry you beneath the noise of the day. The deepest sounds arrive last and stay longest." },
  { name: "Bright Salt", essence: "savor with a little shine", message: "Season the hours; a bland day is the only real loss. A little shine on the ordinary keeps the soul interested." },
  { name: "Small Lamp", essence: "light sized to carry", message: "Carry the small lamp; it was sized exactly for your night. You were never meant to hold a lighthouse, only the next step." },
  { name: "Velvet Thread", essence: "a soft line that still leads", message: "Follow the soft thread even though it seems too gentle to bear weight. It is anchored at both ends, and one of them is home." },
  { name: "Long Wave", essence: "momentum arriving from far out", message: "What is coming has been swimming toward you for a long time. Turn to face the water; recognition halves the waiting." },
  { name: "Copper Sky", essence: "an evening thinking in metal", message: "Let the day gild itself while you simply look up once. Evenings think in warm metal, and tonight they are minting you patience." },
  { name: "Resonant Dark", essence: "emptiness tuned like an instrument", message: "Your hollow places are sounding boards, not wounds. Play them kindly and the dark returns music." },
  { name: "Pearl Gate", essence: "an entry that took years to round", message: "Enter slowly; the gate was polished by your waiting. Years of patience have rounded every edge you would have cut yourself on." },
  { name: "Finding Song", essence: "a melody that locates its singer", message: "Sing badly and be found anyway; the song does the seeking. Perfection was never the condition of being heard." },
  { name: "Silver Loam", essence: "soil with a memory of moonlight", message: "Plant in what the moon has touched; roots keep lunar appointments. What grows in silvered soil grows with the tide in it." },
  { name: "Written Sky", essence: "omens typeset in light", message: "Read the sky slowly; it writes only what you can carry. The omens are typeset in light for exactly your weight." },
  { name: "Unhurried Flame", essence: "combustion at the speed of trust", message: "Trust the slow burn; it is the only fire that finishes. What warms at the speed of trust never burns the house down." },
  { name: "Phased Map", essence: "navigation in honest quarters", message: "Map yourself in quarters like the moon, and forgive each phase its shadow. Every quarter is still entirely you." },
  { name: "Kind Dark", essence: "night that guards the seed", message: "Rest in the kind dark tonight; it is guarding something for you. Seeds know what the day does not." },
  { name: "Compass of Salt", essence: "direction with savor", message: "Point yourself toward what flavors you; that is north enough. A life seasoned truly never needs a better map." },
  { name: "Soft Beginning", essence: "arrival without impact", message: "Arrive softly at what is starting; soft arrivals stay. Impact shatters what patience glazes into permanence." },
  { name: "Violet Meridian", essence: "the line where purple is honest", message: "Stand on your violet line and do not step off it for anyone. It runs exactly through your gift, from horizon to horizon." },
  { name: "Brass Oracle", essence: "advice with a warm patina", message: "Polish the old oracle; it has been saving its sentence for you. Wisdom wears patina because it has been loved into usefulness." },
  { name: "Sleepless Garden", essence: "growth that keeps night hours", message: "Something in you gardened all night; inspect the beds gently. Morning reveals what devotion does while the self sleeps." },
  { name: "Copper Vow", essence: "a promise with warm conductance", message: "Keep the warm vow; it conducts. Promises made in warmth carry current through the coldest years." },
  { name: "Weightless Bell", essence: "a tone freed of carrying", message: "Ring lighter today; the message needs less weight than you think. What is true travels best unburdened." },
  { name: "Inkwell of Hours", essence: "time that writes back", message: "Dip the hour and write; time is in a generous ink. What you set down today will still be legible in mercy." },
  { name: "Soft Meridian", essence: "noon at whisper volume", message: "Keep noon softly; midpoints deserve a whisper, not a trumpet. The middle of anything holds more than the start." },
  { name: "Slow Choir", essence: "voices arriving in centuries", message: "Join the slow choir; your verse is due in decades and it will land. Voices that take centuries are never out of tune." },
  { name: "Kept Meadow", essence: "a lightness maintained overnight", message: "Visit the kept meadow in you; someone maintained it all night. Gratitude is the gate, and it is already open." },
  { name: "Warm Cinder", essence: "what glowing remains", message: "Tend the warm cinder; it remembers the whole song. From almost-ash, the next fire learns humility." },
  { name: "Faithful Amber", essence: "preservation as devotion", message: "What you preserved is preserving you back. Devotion, like amber, keeps the warmth of the moment it caught." },
  { name: "Vibrating Door", essence: "an entry rehearsing yes", message: "The door is rehearsing its yes; bring your hand anyway. Courage is simply knocking while it still hums with possibility." },
  { name: "Courtesy of Pages", essence: "blank space offered kindly", message: "Accept the blank page as the courtesy it is. Emptiness, offered kindly, is also an omen — of room." },
  { name: "Listening Center", essence: "a middle that takes notes", message: "Sit at the listening center of yourself; it is writing your next line. Stillness takes better notes than striving ever will." },
  { name: "Sky's Ledger", essence: "bookkeeping in light", message: "Your credits of light are real; the sky keeps honest books. Nothing kind you have done has gone unrecorded." },
  { name: "Unnamed Card", essence: "the one the deck keeps for you", message: "What stays unnamed in you is waiting for your signature, not your explanation. Pick up the pen of your days and sign yourself in." },
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
