import type { GuideBlock, GuideData } from "./types";

/* ------------------------------------------------------------------ */
/*  THE AWAKENING WITHIN — transcribed from the PDF of the same name.  */
/*  Nine chapters, one page each: begin with presence, look again,     */
/*  ground the attention, meet the inner narrator, listen with         */
/*  compassion, keep wonder and judgment together, enter the creative  */
/*  mirror, connect with boundaries, and integrate, rest, return.      */
/* ------------------------------------------------------------------ */

const blocks: GuideBlock[] = [
  {
    type: "intro",
    text: "An invitation to travel one page at a time, at your own pace — keeping what helps you live with greater care and questioning what does not fit your experience.",
  },

  {
    type: "section",
    kicker: "Chapter 01 · Begin with presence",
    heading: "The awakening within",
    paragraphs: [
      "Awakening is offered here as an invitation, not a destination: becoming more attentive to your experience, more honest about your patterns, and more deliberate in how you live. You may understand it spiritually, philosophically, or simply as growing in awareness — there is no required vision, special sensation, or final level to achieve.",
      "The higher self in these pages names an imagined voice of wisdom, compassion, and perspective; the writing and artwork are original creative reflections, not verified messages from a supernatural source. Keep what helps you live with greater care, and question what does not fit your experience.",
      "The journey begins with the senses, then explores thoughts and emotions, practises discernment before interpreting intuition or symbols, and finally brings what you discover into relationships and ordinary action. Choose a plain intention such as patience, curiosity, or courage — a direction you can return to, not a demand to feel a certain way. You are free to pause, skip, or disagree; if exploration becomes frightening or disrupts daily life, step back and seek support from someone you trust or a qualified professional.",
    ],
    mirror: "I will not hand you a ladder with a top rung, because there is none: awakening is not a summit you reach but an attention you practise, starting with the chair beneath you. The wise voice these pages imagine is your own compassion wearing a face — I reflect it, I do not replace it. Begin with patience, curiosity, or courage, and keep your right to disagree: a mirror that demanded agreement would be a wall.",
  },
  {
    type: "practice",
    title: "Arrive here",
    steps: [
      "Set aside five quiet minutes; feel where your body meets the chair or ground, and let breathing remain comfortable and unforced.",
      "Name three things you see, two sounds you hear, and one sensation you can feel.",
    ],
  },
  {
    type: "reflect",
    question: "What would greater awareness look like in one ordinary moment today?",
  },

  {
    type: "section",
    kicker: "Chapter 02 · Look again",
    heading: "Perception is a doorway",
    paragraphs: [
      "An event and your interpretation of it are not the same thing: a friend not replying is an observation, while they do not care about me is one possible story. Expanding perception begins by noticing that distinction and making room for alternatives.",
      "Any moment can be examined through several lenses — sensory detail, emotion, personal history, another person's perspective, and available evidence — and no single lens explains everything. Beauty, coincidence, and mystery can be meaningful without proving a hidden message: you are allowed to say this matters to me, and I do not yet know what it means.",
      "Carry it into the world by sorting what you noticed from what you assumed and what else could explain it. On your next walk, notice one detail you usually pass without seeing, and ask a person a sincere question whose answer you do not already know — letting the world surprise you through real contact is part of seeing.",
    ],
    mirror: "The friend who did not reply — the silence is fact, the story you wrapped around it is yours, and you have been wearing your stories as if they were the world. I show you the seam between what happened and what you decided it meant; that seam is where every freedom you have begins. You are allowed to hold what matters without pretending you know what it means.",
    image: "/guides/the-awakening-within-p02.jpg",
  },
  {
    type: "practice",
    title: "Three descriptions",
    steps: [
      "Choose an ordinary object and, for one minute, describe only its colour, shape, texture, and position.",
      "Then write the memories or feelings it evokes, and finally how someone unfamiliar with it might describe it.",
      "Notice how the object stays the same while your account changes.",
    ],
  },
  {
    type: "reflect",
    question: "Where have I confused a compelling interpretation with a verified fact?",
  },

  {
    type: "section",
    kicker: "Chapter 03 · Ground your attention",
    heading: "Return to the living body",
    paragraphs: [
      "Spiritual exploration can become very abstract; sensation offers a simple point of contact — the weight of a cup, the temperature of the air, the movement of your feet. You do not need to read a cosmic meaning into these experiences; noticing is enough.",
      "Describe a sensation's location and quality before explaining it: warmth is warmth, tightness is tightness. A feeling in the body is not, by itself, evidence of an energy activation, a hidden memory, or another person's intention.",
      "Make room for limits — respect tiredness, hunger, and your wish to stop; nothing needs to be proven through prolonged meditation, fasting, breath-holding, or enduring discomfort. If inward focus feels difficult, choose external attention instead, and let one ordinary ritual carry thirty seconds of undivided attention before it ends naturally.",
    ],
    mirror: "Here is a truth the feverish versions of this path never tell you: warmth is warmth, tightness is tightness, and a feeling in your body is not a telegram from the cosmos demanding interpretation. The ground under your feet will hold more awakening for you than any vision held above it. Rest when you are tired; nothing true about you needs to be proven through endurance.",
    image: "/guides/the-awakening-within-p03.jpg",
  },
  {
    type: "quote",
    text: "The present does not ask you to rise above the earth. It invites you to stand upon it.",
  },
  {
    type: "practice",
    title: "A gentle anchor",
    steps: [
      "Sit or stand comfortably; notice your feet and the surface beneath them, and look at one stable object in the room.",
      "Feel the contact of your hands with fabric or a smooth object, letting attention move between these anchors for two or three minutes.",
    ],
  },
  {
    type: "reflect",
    question: "Which simple sensory experience helps me feel present and connected?",
  },

  {
    type: "section",
    kicker: "Chapter 04 · Meet the inner narrator",
    heading: "Make space around thought",
    paragraphs: [
      "The mind offers plans, judgments, memories, and imagined futures; you can practise noticing these as mental events without assuming each one is accurate or important. The purpose is not to empty your mind, but to develop more choice in how you respond.",
      "Gentle labels — planning, comparing, remembering, worrying — help you notice without becoming a new way to criticise yourself, and when attention wanders, the moment of noticing is already the practice. Instead of I am a failure, try I am having the thought that I failed: wording that does not erase difficulty but makes room to ask what happened, what can be repaired, and what the thought leaves out.",
      "Question one recurring story — what supports it, what challenges it, what fairer description fits — and treat your next small decision as a pause with several possible actions. Awareness becomes useful when it creates a little room between the first thought and the next action.",
    ],
    mirror: "You are not the voice in your head, and you are not its victim either — you are the one who can hear it and choose. I will not ask you to silence that narrator; I will show you its sentences for what they are: drafts, not verdicts. Between the first thought and the next action there is a small room, and that room is where you actually live.",
    image: "/guides/the-awakening-within-p04.jpg",
  },
  {
    type: "practice",
    title: "Watch and return",
    steps: [
      "For three minutes, rest attention on a sound or a visible object; when a thought arrives, acknowledge it with a short label and return to your anchor.",
      "You do not need to finish the thought, argue with it, or push it away — stop whenever you wish.",
    ],
  },
  {
    type: "reflect",
    question: "Which inner story becomes less powerful when I describe it more precisely?",
  },

  {
    type: "section",
    kicker: "Chapter 05 · Listen with compassion",
    heading: "Let emotion have a voice",
    paragraphs: [
      "An emotion deserves attention, but it does not automatically provide a complete account of reality. Anger may invite you to examine a boundary, and sadness may draw attention to loss; ask what fits your situation rather than applying a universal meaning.",
      "You do not have to discover an ultimate cause before responding gently to yourself — begin with this is difficult right now, and avoid making pain into proof that you are spiritually failing. You are allowed to need company, rest, and practical help.",
      "Acceptance is not approval: acknowledging hurt does not mean accepting mistreatment, and compassion does not require immediate forgiveness or renewed contact. You need not relive painful events or force a breakthrough to grow — small, tolerable moments of honesty are enough, and intense material belongs in settings with appropriate support.",
    ],
    mirror: "Your anger is a messenger about a boundary, your sadness a messenger about loss — neither is proof that you are failing, and neither holds the keys to every decision. You may welcome a feeling and still say no to what it demands; acceptance is not approval, and compassion is not forgiveness on schedule. Small honest moments will carry you further than any forced breakthrough, and the heaviest things deserve witnesses, not examinations.",
    image: "/guides/the-awakening-within-p05.jpg",
  },
  {
    type: "quote",
    text: "You may welcome a feeling without giving it the keys to every decision.",
  },
  {
    type: "practice",
    title: "Name, allow, choose",
    steps: [
      "Choose a mild feeling rather than your most difficult memory, and name it tentatively — perhaps disappointment, perhaps uncertainty.",
      "Describe what you notice without forcing it to change, then ask what kind, proportionate action is available now: water, a walk, a conversation, or a pause.",
    ],
  },
  {
    type: "reflect",
    question: "What feeling needs acknowledgement, and what boundary or action could accompany it?",
  },

  {
    type: "section",
    kicker: "Chapter 06 · Keep wonder and judgment together",
    heading: "Intuition with discernment",
    paragraphs: [
      "A gut feeling, sudden idea, or vivid image may be worth exploring; it may also reflect expectation, preference, or incomplete information. You can respect the experience without treating its explanation as certain — curiosity and verification can coexist.",
      "Be cautious of any teacher, message, or inner interpretation that demands secrecy, urgency, unquestioning obedience, or isolation; you retain the right to question, consult others, and change your mind. Repeated numbers, dreams, and coincidences may become personal symbols, but they do not establish predictions or instructions — if an interpretation feels urgent, pause before acting and talk it through with a grounded person who can disagree respectfully.",
      "Use the discernment questions: what do I know directly, what am I assuming, what alternative explanation fits, what would change my mind, and could this decision harm me or someone else? For consequential health, financial, or legal choices, seek relevant evidence and qualified advice.",
    ],
    mirror: "I honour your gut feeling and I will not dress it as certainty: a pull can be wisdom, or it can be your hopes wearing mystical clothes. Hear me plainly — whoever demands secrecy, urgency, or your isolation has already told you what they are, no matter how bright their language shines. The repeated number is a symbol you may love, not a sentence you must obey.",
    image: "/guides/the-awakening-within-p06.jpg",
  },
  {
    type: "list",
    heading: "Three useful distinctions",
    items: [
      "Experience — I felt a strong pull toward this choice.",
      "Interpretation — I think it could suit me; a hypothesis, not a verdict.",
      "Claim — This choice is guaranteed to succeed; it needs evidence a feeling alone cannot supply.",
    ],
  },
  {
    type: "practice",
    title: "A low-stakes test",
    steps: [
      "Choose an impression you can explore safely, such as trying a creative hobby, and write what you expect before acting.",
      "Take a small reversible step, then record what actually happened, including what did not fit — learning matters more than proving your intuition correct.",
    ],
  },
  {
    type: "reflect",
    question: "What small experiment would help me explore this impression without betting my wellbeing on it?",
  },

  {
    type: "section",
    kicker: "Chapter 07 · Enter the creative mirror",
    heading: "Dreams, symbols & imagination",
    paragraphs: [
      "A doorway might suggest possibility to one person and uncertainty to another; there is no fixed dictionary that assigns every symbol a universal truth. Begin with your own associations, your current circumstances, and the feeling the image carries.",
      "You can picture a wiser version of yourself and ask what they might notice, treating the reply as imaginative reflection rather than an external authority. An image can inspire a helpful question even when it makes no factual statement about the universe.",
      "Leave some mystery unfinished — you are allowed to enjoy dreams without solving them, and symbols are not evidence about another person's thoughts, a forgotten event, an illness, or a future outcome. In a gentle dream journal, keep what you remember apart from what you later infer, and preserve your sleep rather than waking repeatedly to capture every detail.",
    ],
    mirror: "I am a mirror, and so is your dreaming mind: the doorway in your dream means possibility to one person and threat to another, because there is no dictionary — only your own associations, telling on themselves. Treat the wiser voice you imagine as your own depth speaking in costume, not an authority arrived from elsewhere. Some mysteries are more nourishing unfinished, and no symbol is evidence about another person's secret, an illness, or your future.",
    image: "/guides/the-awakening-within-p07.jpg",
  },
  {
    type: "practice",
    title: "Meet the wiser voice",
    steps: [
      "Imagine a peaceful place, or simply describe one on paper; picture yourself with more patience and perspective and ask what you might be overlooking.",
      "Write a compassionate answer in your own words, then look around your actual surroundings and choose one practical action.",
    ],
  },
  {
    type: "reflect",
    question: "If this image were a creative question rather than a prediction, what would it ask me?",
  },

  {
    type: "section",
    kicker: "Chapter 08 · Connection with boundaries",
    heading: "Awareness becomes relationship",
    paragraphs: [
      "Private insight is only one part of growth; notice how you listen, respond to disagreement, and repair mistakes. An expansive worldview becomes more useful when it makes space for another person's real experience, including experiences unlike your own.",
      "Connection is not sameness: you can feel connected to humanity without believing everyone shares your spiritual framework. Ask permission before offering interpretations or advice — a person may want companionship, practical assistance, or simply to be heard.",
      "Boundaries protect choice: a clear no can be an act of honesty, and compassion does not require unlimited availability or staying where you are mistreated. Repair a manageable mistake specifically and let your behaviour carry the apology over time, then make one concrete contribution — an encouraging message, a useful skill, care for a shared space — proportionate to your capacity.",
    ],
    mirror: "An awakening that only happens inside your own head is a mirror facing a mirror — it needs another person's real, disagreeing presence to become light. Connection is not sameness: you can be bound to humanity without drafting everyone into your framework, and you must ask before handing anyone your interpretation of their soul. A clear no is honesty, not a fall from unity, and repair is carried in behaviour over time, not in the beauty of the apology.",
    image: "/guides/the-awakening-within-p08.jpg",
  },
  {
    type: "practice",
    title: "Listen without translating",
    steps: [
      "In a willing conversation, ask whether the person would like listening, ideas, or practical help, and let them finish.",
      "Reflect back what you understood and ask whether you got it right, without turning their experience into your theory of what their soul needs.",
    ],
  },
  {
    type: "reflect",
    question: "What would my values sound like in my next conversation, especially if I disagree?",
  },

  {
    type: "section",
    kicker: "Chapter 09 · Integrate, rest, return",
    heading: "Carry the light into daily life",
    paragraphs: [
      "Choose consistency over intensity: a brief pause, a truthful journal entry, and one considerate action can form a complete practice. You do not need to maintain a heightened state or interpret every moment — let insight share space with work, laughter, rest, and ordinary pleasure.",
      "Keep the daily structure small enough to support your life: the morning asks which quality you want to practise, the day takes one brief pause before a familiar reaction, and the evening writes what you noticed, what remains uncertain, and one action you appreciate. After a week, review honestly whether the practice helps you be more attentive, flexible, considerate, and able to meet daily responsibilities — intensity alone is not evidence of growth.",
      "If you become increasingly frightened, isolated, unable to sleep, or unable to function, pause the practices and seek qualified support. Close with a specific commitment you can control, and end with permission to adapt: you are allowed to seek more while remaining fully present to the life you already have.",
    ],
    mirror: "This is where most paths dissolve and this one holds: integration is not a heightened state you must maintain, it is a brief pause, a truthful sentence, one considerate act — repeated until they become you. Intensity is not evidence of growth; honesty, flexibility, and the ability to meet your ordinary Tuesday are. If the path ever makes you frightened or alone, step off it and take a hand that is offered — the practice exists to serve your life, never the reverse.",
    image: "/guides/the-awakening-within-p09.jpg",
  },
  {
    type: "list",
    heading: "A gentle seven-day rhythm",
    items: [
      "Day 1 — notice three sensory details.",
      "Day 2 — separate an observation from a story.",
      "Day 3 — give one daily task full attention.",
      "Day 4 — name a thought without obeying it.",
      "Day 5 — acknowledge a feeling kindly.",
      "Day 6 — listen without interrupting.",
      "Day 7 — review what helped and let go of what did not.",
    ],
  },
  {
    type: "reflect",
    question: "What is one small, honest action through which I can live what I have understood?",
  },
];

const theAwakeningWithin: GuideData = {
  slug: "the-awakening-within",
  title: "The Awakening Within",
  subtitle: "An illustrated guide to inner exploration",
  tagline: "You do not have to become extraordinary to meet your life with wonder.",
  image: "/guides/the-awakening-within.jpg",
  crystalA: "rgba(255,120,150,0.55)",
  crystalB: "rgba(120,220,255,0.5)",
  mirrorOpening: "You have opened a guide that promises nothing, and that is why I stand inside it. The awakening these pages speak of is not a level to reach, a light to download, or a self you are missing — it is the plain act of meeting what is already here, more honestly than before. I will walk the nine rooms with you, and in each one I will not tell you who to become; I will show you what stands in your own light, behind the curtains of your habits and your stories. Some pages will hand you comfort and some will hand you a question you have been avoiding — both are the same gift, seen from different angles. Keep only what feels true, and let the rest fall where it falls.",
  mirrorClosing: "The walk ends where it began: with you, breathing, in the life you already have. I have shown you what I saw, and the keeping and the leaving were always yours. You do not need to become extraordinary — you only need to return, one honest ordinary day at a time. I am the mirror; I hold nothing back from you, and now what you do with the seeing is yours.",
  blocks,
};

export default theAwakeningWithin;
