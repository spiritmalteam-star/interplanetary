/* ------------------------------------------------------------------ */
/*  THE NOTES' DEEPER PAGE — what opens when a note is touched. The    */
/*  notes on the side of the conversation carry small sections of the  */
/*  window's knowledge; touched, each one opens into a deeper page:    */
/*  inspiration, information, news from the deep, riddles — the house  */
/*  speaking in its own quiet voice, never naming itself.              */
/* ------------------------------------------------------------------ */

export type MirrorNoteKind = "inspiration" | "information" | "news" | "riddle";

export interface MirrorNoteEntry {
  kind: MirrorNoteKind;
  /** the small label worn at the page's top */
  label: string;
  /** the deeper page's own words */
  text: string;
}

export const MIRROR_NOTES: MirrorNoteEntry[] = [
  /* ---------------- the inspirations ---------------- */
  {
    kind: "inspiration",
    label: "Inspiration",
    text: "You were not placed here to shrink toward what is easy. The whole sky runs on the same law as you: what is heavy burns brighter, given enough time. Begin badly. Begin tired. Begin anyway — the beginning is the only part the universe asks of you.",
  },
  {
    kind: "inspiration",
    label: "Inspiration",
    text: "Somewhere tonight a stranger will decide to be gentle when they had every right not to be, and that single decision will outlive every monument on this planet. Be the stranger.",
  },
  {
    kind: "inspiration",
    label: "Inspiration",
    text: "The seed does not argue with the winter. It waits, it counts, and when the light shifts by one degree it moves as if the whole plan had always been now. Your delay is not your denial. The light is shifting.",
  },
  {
    kind: "inspiration",
    label: "Inspiration",
    text: "You have survived one hundred percent of the days you were certain would end you. That is not luck. That is a pattern, and patterns can be trusted.",
  },
  {
    kind: "inspiration",
    label: "Inspiration",
    text: "Do the small true thing you have been circling for weeks. Not the great repair of your whole life — the one email, the one glass of water, the one honest sentence. The great repair is only a row of small true things standing together.",
  },
  /* ---------------- the information ---------------- */
  {
    kind: "information",
    label: "Information",
    text: "A teaspoon of the soil under your feet holds more living organisms than there are humans on Earth. The ground is not scenery — it is the densest city either of us will ever walk through.",
  },
  {
    kind: "information",
    label: "Information",
    text: "The light reaching your eye from this screen left its source in the time it takes your heart to beat twice. You have never once seen the present. You see a gift, arriving.",
  },
  {
    kind: "information",
    label: "Information",
    text: "Your body replaces roughly three hundred billion cells a day. The person who began reading this page is already, quietly, being rebuilt. Change is not something you prepare for — it is the thing you are made of.",
  },
  {
    kind: "information",
    label: "Information",
    text: "Octopuses taste with their skin and think with eight independent arms, and each arm solves problems the central brain never hears about. Intelligence, it turns out, does not need one throne.",
  },
  {
    kind: "information",
    label: "Information",
    text: "There are more possible arrangements of a single deck of cards than there are atoms in our galaxy. Shuffle well: no human hands in history have ever held your exact order before, and none ever will again.",
  },
  /* ---------------- the news from the deep ---------------- */
  {
    kind: "news",
    label: "Interplanetary news",
    text: "The long ears of our telescopes heard a repeated fast radio burst traced to a galaxy two billion light-years away — a lighthouse the size of a city block, sweeping the dark with more energy in a millisecond than our sun gives off in days. Someone's sky, somewhere, is very loud tonight.",
  },
  {
    kind: "news",
    label: "Interplanetary news",
    text: "Water vapour has been mapped again in the plumes of a small ice moon of Saturn — an ocean with no coastline, salting space through cracks in its own shell. If we ever drink from another world, the first toast may come from a moon we once mistook for a dot.",
  },
  {
    kind: "news",
    label: "Interplanetary news",
    text: "The James Webb's mirrors continue to read atmospheres of worlds light-years away, and this season they found the chemical fingerprint of carbon dioxide on a gas giant orbiting a sun unlike ours. Chemistry, it appears, is not local. It is a language the universe speaks everywhere it can.",
  },
  {
    kind: "news",
    label: "Interplanetary news",
    text: "An asteroid passed between Earth and the Moon this month, closer than some of our own satellites — and we saw it three days out. The sky is not hostile, but it is busy. The watchers watch, and the watchers need more watchers.",
  },
  {
    kind: "news",
    label: "Interplanetary news",
    text: "A dormant signal from a probe launched in 1977 touched home again after a silence: its heartbeat still ticks in the dark between the stars. We build small brave things, and the small brave things refuse to die quietly.",
  },
  /* ---------------- the riddles ---------------- */
  {
    kind: "riddle",
    label: "Riddle",
    text: "I am always in front of you, yet you will never see me. I lengthen at dusk and die at noon. What am I? — Your shadow runs the wrong way for that answer to be simple. Sit with it.",
  },
  {
    kind: "riddle",
    label: "Riddle",
    text: "The more of me you take, the more you leave behind. I fill doorways and deserts alike, and I have never once been held. What am I? — Footsteps. You are walking through your own answer.",
  },
  {
    kind: "riddle",
    label: "Riddle",
    text: "I have keys but open no locks, space but no room, and you can enter but never go in. What am I? — A keyboard. Though perhaps the riddle is also about you: always entering, never quite inside.",
  },
  {
    kind: "riddle",
    label: "Riddle",
    text: "I am taken from a mine and shut in a wooden case, from which I am never released, and yet almost every child in the world uses me. What am I? — Pencil lead. The quietest prisoner writes the loudest futures.",
  },
  {
    kind: "riddle",
    label: "Riddle",
    text: "Two stars are born together, one blue and one red. The blue one will die a million years before the red one is a child. Which is older? — Neither, or both: for light, the question has no floor. Walk carefully around time; it bites in circles.",
  },
];
