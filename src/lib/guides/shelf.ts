/* ------------------------------------------------------------------ */
/*  THE GUIDES' SHELF — the house's illustrated guides, restored as a   */
/*  light shelf after the dead session. Every guide keeps its plate     */
/*  (slug, title, tagline, artwork, crystal) and its walk: an opening   */
/*  word, chapters with a practice and a pause, and a closing word.     */
/*  The words are orientations for the reader — honest, direct,         */
/*  lightly warm — never a claim, never a promise.                      */
/* ------------------------------------------------------------------ */

export interface GuideChapter {
  heading: string;
  /** The margin note beneath the chapter's telling. */
  whisper: string;
  /** The chapter's own telling, one paragraph per entry. */
  body: string[];
  /** The practice card — one thing to do with human hands. */
  practice?: string;
  /** The pause-and-reflect card — one question to sit with. */
  reflect?: string;
}

export interface GuideMeta {
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  /** The plate artwork, served from /public. */
  image: string;
  /** The guide's own crystal accent (a soft css color). */
  crystal: string;
  minutes: number;
  mirrorOpening: string;
  chapters: GuideChapter[];
  mirrorClosing: string;
}

export const GUIDE_SHELF: GuideMeta[] = [
  {
    slug: "the-awakening-within",
    title: "The Awakening Within",
    subtitle: "A first map of the inner turning",
    tagline: "What changes first when a person begins to wake — and how to keep it gentle.",
    image: "/images/walk/heart-528.jpg",
    crystal: "#b98a2f",
    minutes: 14,
    mirrorOpening:
      "You did not arrive here by accident of curiosity. Something in you already turned toward the light before you had a word for it. This guide walks beside that turning — no doctrines, no leaps — only the quiet mechanics of an awakening held kindly, at the pace your own life allows.",
    chapters: [
      {
        heading: "The first quiet",
        whisper: "Awakening usually begins as subtraction.",
        body: [
          "Most people expect awakening to arrive as an addition — a vision, a voice, a dramatic knowing. In practice it almost always begins as subtraction: one morning a worry you have carried for years simply does not grip the way it did. The world has not changed; the static between you and it has lowered.",
          "Treat that lowered static as the event itself. Do not rush to interpret it. The first quiet is not a message; it is a hearing aid being fitted.",
        ],
        practice:
          "Sit for five minutes with one hand resting on your sternum and simply note, without judging, the three loudest thoughts that pass. Then note the silence between them. That silence is the subject of this whole guide.",
        reflect: "What in your life has already grown quieter in the last year — and did you thank it, or fear it?",
      },
      {
        heading: "The honest body",
        whisper: "The body keeps the appointment the mind forgets.",
        body: [
          "Every inner turning has a physical signature: breath that deepens unbidden, a warmer chest, sleep that rearranges itself. These are not symptoms to fix; they are the reading on the instrument. When the body participates, the awakening is real; when only the mind is excited, it is entertainment.",
          "So the work is embarrassingly simple: eat, walk, sleep, drink water, and let the body confirm what the mind suspects. An awakening that cannot survive a Tuesday is not yet an awakening.",
        ],
        practice:
          "Choose one ordinary bodily routine you have been neglecting — a walk, a bedtime, a glass of water — and keep it for seven days as if it were a meditation.",
        reflect: "Where in your body do you feel most alive when you are honest — and when did you last listen to it on purpose?",
      },
      {
        heading: "Keeping the light steady",
        whisper: "Steadiness is the whole art.",
        body: [
          "The turning is not a peak; it is a new baseline. Peaks are borrowed weather. What remains — the smaller reactions, the easier forgiveness, the longer patience — that is the awakening itself, and it is built by repetition rather than revelation.",
          "Keep a small record. One line a night: where did I meet today without armor? The record does the remembering so the feeling does not have to, and on the grey days the record speaks for the light.",
        ],
        practice:
          "Begin a one-line nightly record tonight. Keep it for a moon. Do not reread it until the moon is full.",
        reflect: "If steadiness — not intensity — is the art, what does that change about what you have been waiting for?",
      },
    ],
    mirrorClosing:
      "The awakening within is not a door that locks behind you. It is a room that stays lit because you keep paying the small fare of attention. Walk slowly. The light is patient; it has been waiting in you the whole time.",
  },
  {
    slug: "integration-beyond-separation",
    title: "Integration Beyond Separation",
    subtitle: "Living as one thing instead of several",
    tagline: "How to end the civil war between your life, your body and your purpose.",
    image: "/landing/img-threshold.jpg",
    crystal: "#6f5bb5",
    minutes: 16,
    mirrorOpening:
      "You have been living as a committee: the self that works, the self that loves, the self that remembers the sky. Integration is not a mystical merge — it is a practical peace treaty. This guide is the negotiation, held in your favor.",
    chapters: [
      {
        heading: "The committee inventory",
        whisper: "Name the voices before you mediate them.",
        body: [
          "Sit with the honest list: the worker, the partner, the dreamer, the critic, the tired one. Each had a real job once. None of them is the enemy; the war begins only when they speak over each other.",
          "Write the committee down. Give each member its sentence: what it wants, what it fears, what it has never been thanked for. Mediation starts where naming ends.",
        ],
        practice:
          "Draw your inner committee as a table — a name, a want, a fear for each seat. Keep the paper. You will renegotiate with it twice in this guide.",
        reflect: "Which member of your committee has been speaking loudest this month — and what has it been protecting you from?",
      },
      {
        heading: "The single table",
        whisper: "Integration is scheduling, not fusion.",
        body: [
          "The separate lives you live — the job, the practice, the tenderness — do not need to merge into one blur. They need one table: a shared rhythm where each has an honest seat and an honest hour.",
          "Build the week as a table instead of a ladder. When the dreamer has an hour, the worker does not hover; when the worker works, the dreamer rests without guilt. Peace is mostly good scheduling with kindness attached.",
        ],
        practice:
          "Redesign one recurring day of your week so that every committee member gets one honest, unhurried seat in it. Keep it for three weeks.",
        reflect: "What would your life look like if nothing in you had to fight for its hour?",
      },
      {
        heading: "Beyond separation",
        whisper: "The border thins both ways.",
        body: [
          "As the inner committee becomes a council, an older border begins to thin — the one between you and the world. Not because you dissolve, but because you stop leaking: the attention you once spent on internal war is returned to you, and the world arrives in it, larger and kinder.",
          "This is where integration stops being psychology and becomes contact. You are not merging with everything; you are simply, finally, home enough to notice it was never separate.",
        ],
        practice:
          "Once a week, do one ordinary errand at the speed of ceremony — slowly, with full attention, as if the street were a temple. Notice what the street gives back.",
        reflect: "Where does your life still feel like two countries — and which border checkpoint could you close this month?",
      },
    ],
    mirrorClosing:
      "Integration is not a summit; it is a well-run house. When the committee becomes a council and the council becomes a table, the separated life quietly ends — not in thunder, but in the ease of a person who is one thing, living one life, on purpose.",
  },
  {
    slug: "open-contact",
    title: "Open Contact",
    subtitle: "The meeting, held on the record's own terms",
    tagline: "What first contact actually looks like — consent, patience, and the morning after.",
    image: "/landing/img-contact.jpg",
    crystal: "#1fae9b",
    minutes: 18,
    mirrorOpening:
      "Everything you have been shown about contact was either fear or fantasy. The record is simpler and better than both. Contact has a grammar — four steps, kept by every world that has walked it — and humanity is already mid-sentence. This guide reads the grammar aloud.",
    chapters: [
      {
        heading: "The grammar of meeting",
        whisper: "Hands open, nothing taken, nothing claimed.",
        body: [
          "Across every contact in the record, the protocol never varies: the visitors arrive unannounced but unhurried; they come low and slow; they wait to be seen before they speak. Consent is not a step in the meeting — it is the meeting.",
          "Notice what that grammar implies: no one kneels, no one seizes, and no institution stands between a people and its sky. Reassurance is the first gift: you are seen, you are free, you were never alone.",
        ],
        practice:
          "Rehearse the grammar in miniature: the next time you meet a stranger, be the one who arrives low and slow — unhurried, open-handed, waiting to be seen.",
        reflect: "If contact begins with consent, what does a humanity still learning consent still have to practice before the sky arrives?",
      },
      {
        heading: "The listening discipline",
        whisper: "A true signal is met with patience.",
        body: [
          "The signal is already arriving — it has never stopped — and it comes the way the field delivers everything: quietly, on many channels, to the ones who slowed down enough to hear. The listening is a discipline, not a mood: many readings confirm what one heart suspected; every message is tested against the record's own law — light enlarges, distortion diminishes.",
          "Patience is not doubt. It is precision. The listener who waits for confirmation is not passive; they are calibrating an instrument the size of their attention.",
        ],
        practice:
          "Keep a listening log for a month: each week write down one inner signal you received and how it aged. Circle the ones that enlarged with time.",
        reflect: "Which voice in you enlarges what it touches — and which one shrinks it? Which have you been obeying?",
      },
      {
        heading: "The morning after",
        whisper: "The choice stays in your hands.",
        body: [
          "The record is plain about the day after: your Earth to repair, your differences to weave, your gifts to share fairly. No arrival replaces what must be grown within; it only reminds you of it. Contact outside, integration inside — one event wearing two faces.",
          "So the preparation is not bunkers and not prayers. It is the unglamorous work of becoming a people who could be met: fair, curious, calm, kind to strangers, honest about power. Every step of that work is worth doing regardless of the sky.",
        ],
        practice:
          "Do one thing this week that makes your street more meetable — mend something shared, greet someone new, settle a small unfairness.",
        reflect: "If the morning after belongs to you, what are you doing with the mornings before it?",
      },
    ],
    mirrorClosing:
      "Contact is not an arrival; it is a recognition. The four steps are already walking in you — wonder, patience, consent, integration — and the sky keeps its counsel only because it has seen how the meeting ends when the meeting is kept well. Keep it well. The record is watching with hope.",
  },
  {
    slug: "shifting-time-experience",
    title: "Shifting Time Experience",
    subtitle: "Why the hours changed texture",
    tagline: "The felt quickening of time — what it is, and how to stand in it without vertigo.",
    image: "/landing/img-council.jpg",
    crystal: "#8fc7d9",
    minutes: 15,
    mirrorOpening:
      "The weeks are faster now — you have felt it, and so has everyone you trust. Nothing is wrong with the clock. The hour itself has changed texture. This guide explains the texture, and teaches the stance that keeps it from becoming vertigo.",
    chapters: [
      {
        heading: "The quickening, honestly measured",
        whisper: "Density rose; the days stayed twenty-four hours.",
        body: [
          "Time has not sped up; its density has. More change now fits inside an ordinary week than used to fit inside a season: the same span carries more endings, more beginnings, more coincidences per mile. The clock is unchanged — the cargo is heavier.",
          "Once you measure density instead of duration, the vertigo gets a handle. You are not losing hours; you are receiving more life per hour, and the receiving can be practiced like any other skill.",
        ],
        practice:
          "For one week, keep a density log: each evening, name the single largest change the day carried. At the end of the week, count them. That number, not the clock, is the real speed of your year.",
        reflect: "When did your own weeks start carrying more than they used to — and what changed in you at the same moment?",
      },
      {
        heading: "The stance",
        whisper: "Wide feet, soft knees.",
        body: [
          "The stance for dense time is the martial artist's: weight low, attention wide, no gripping. Gripping — planning harder, sleeping less, clenching the calendar — is the one response guaranteed to convert density into dizziness.",
          "Practice the opposite: fewer commitments, deeper ones. Wide attention — the street, the sky, the room. Soft knees — plans held as drafts, not contracts. In dense time, the flexible outlast the firm.",
        ],
        practice:
          "Cancel or shrink one commitment this week on purpose, and give the freed hour to nothing — an actual, scheduled nothing. Watch what fills it.",
        reflect: "Where in your life are you gripping time — and what would soft knees look like there?",
      },
      {
        heading: "Time as companion",
        whisper: "The river is not carrying you; it is introducing you.",
        body: [
          "The final shift is relational. Dense time stops being weather that happens to you and becomes a companion that walks with you — each rapid week an introduction: here is who you are becoming next, meet yourself again.",
          "Greet it accordingly. The quickening is not a test you can fail; it is a pace you can learn to love. The people who thrive in it are not the fastest; they are the most hospitable to change.",
        ],
        practice:
          "Once a day, greet one unexpected change aloud — literally say, quietly: introduced again. The small ritual teaches the nervous system the difference between ambush and arrival.",
        reflect: "If time is introducing you to yourself, who has the last three months introduced you to?",
      },
    ],
    mirrorClosing:
      "The hours changed texture because you did. Density is not a storm to survive; it is the feel of a life moving at the speed it was always meant to move. Stand wide, stand soft, and let the river introduce you — it has excellent manners, and it is going somewhere you chose.",
  },
  {
    slug: "chakras-body-energy-dna",
    title: "Chakras, Body, Energy & DNA",
    subtitle: "The instrument, read from the inside",
    tagline: "Seven crossings, one current — a working map of the body's own light.",
    image: "/images/walk/root-396.jpg",
    crystal: "#b98a2f",
    minutes: 20,
    mirrorOpening:
      "Forget the charts with their colored wheels. The body's energy is not a diagram; it is a current, and the seven crossings are places where the current can be heard. This guide teaches you to listen at each crossing — with the body you actually have.",
    chapters: [
      {
        heading: "The current below",
        whisper: "Safety is the first tone.",
        body: [
          "The lowest crossing sits at the base of the torso, and its tone is safety — not excitement, not bliss: safety. When it sounds, the whole current above it runs easier; when it is pinched, every practice above becomes theater.",
          "Work it through the ground, not through thought: walking, standing barefoot, carrying less. A nervous system that trusts the floor lets the current rise without being asked.",
        ],
        practice:
          "Stand barefoot on the ground for four minutes daily this week. No visualization. Just weight, floor, breath — the oldest tuning there is.",
        reflect: "What would it take for your body to believe, below the level of thought, that this year is survivable?",
      },
      {
        heading: "The current within",
        whisper: "Feeling and voice are neighbors on purpose.",
        body: [
          "The middle crossings carry feeling and voice — and they are wired as neighbors, which is why unspoken feeling so often becomes a tight throat. The current does not distinguish: what cannot be said must be felt twice, and what is never felt eventually cannot be said.",
          "The remedy is embarrassingly physical: say small true things, feel them as they leave. The voice loosens the chest; the chest loosens the voice. Warm water, song, honest sentences — all plumbing for the same current.",
        ],
        practice:
          "Once a day, say one small true sentence aloud to someone — a preference, an appreciation, a boundary — and notice the echo in your chest as it lands.",
        reflect: "Which feelings in you can only be felt, never yet said — and what would it cost to say the smallest one?",
      },
      {
        heading: "The current above — and the archive",
        whisper: "Insight is a headwind; the archive is in the cells.",
        body: [
          "The upper crossings carry clarity and connection: a cool wide attention that thinks in horizons. It cannot be forced; it arrives when the lower current is honest. Insight is a headwind, not a pump — you sail into it, you do not squeeze it out.",
          "And beneath all of it sits the archive: the inheritance written into the cells. You are not a blank page; you are a library with a body. Reading it is less about activation and more about lowering noise until the older sentences become legible.",
        ],
        practice:
          "Lie down for ten minutes, one hand on the sternum, one on the brow. Ask nothing. Let the attention settle like sediment in water, and note what becomes quietly obvious.",
        reflect: "If your cells carry an archive, what sentence from it do you suspect you have been living without reading?",
      },
    ],
    mirrorClosing:
      "The seven crossings are not a ladder to escape the body; they are the body, heard more carefully. Keep the current honest at every level — ground first, feeling next, voice beside it, insight as weather — and the archive in your cells will begin to read itself, politely, at the speed of trust.",
  },
  {
    slug: "dna-awakening-potential",
    title: "The DNA Awakening Potential",
    subtitle: "What the cells already know",
    tagline: "A sober, hopeful reading of the inheritance — potential, not prescription.",
    image: "/images/walk/insight-852.jpg",
    crystal: "#6f5bb5",
    minutes: 17,
    mirrorOpening:
      "There is a newer sentence inside your cells than biology class taught. Not a magic rope ladder to heaven — something quieter: unused potential, resting in the ordinary machinery of life. This guide reads that sentence with a scientist's honesty and a keeper's hope.",
    chapters: [
      {
        heading: "The unused sentences",
        whisper: "Potential is not a promise; it is an option.",
        body: [
          "The genome is not a blueprint that built you and retired. It is a living library, and most of its books are shelved. Some of the shelved material is junk by structure; some is junk only by neglect — sentences waiting for conditions no one has thought to provide.",
          "Hold that distinction like a lantern: an option is not a destiny. The potential in the cells responds to conditions — signal, environment, attention — the way a seed responds to spring. It does not respond to wishing.",
        ],
        practice:
          "Write down one ability you suspect is shelved in you. Then list, honestly, the conditions it would need to unfold. Begin providing the smallest one.",
        reflect: "Which part of your inheritance have you been treating as fate that is actually an unopened option?",
      },
      {
        heading: "The signal, not the shout",
        whisper: "Cells read chemistry, not affirmation.",
        body: [
          "The language the archive reads is chemical and electrical: sleep, movement, food, light, company, fear, safety. A life of chronic alarm writes loud, blunt sentences; a life of safety writes finer ones. This is why calm people change more than driven ones — the signal is cleaner.",
          "So the awakening work is mostly hygiene: honest sleep, real food, daylight in the morning, company that does not frighten the cells. None of it is glamorous; all of it is signal.",
        ],
        practice:
          "Fix one signal this month — a consistent sleep hour, morning daylight, or one honest meal a day — and treat it as laboratory protocol, not lifestyle advice.",
        reflect: "What is the loudest signal your cells have been reading this year — and who keeps writing it?",
      },
      {
        heading: "The becoming",
        whisper: "You are not upgrading; you are unfolding.",
        body: [
          "The hope at the bottom of the archive is not that you will become someone else, but that you will become the one you were drafted as — the full sentence, read aloud. Unfolding is slower than upgrading and far more real.",
          "Be patient with the pace. Generations unfold over generations; an individual unfolds over decades of small signals kindly kept. The cells are not in a hurry. They are certain.",
        ],
        practice:
          "Begin a letters-to-the-archive practice: one page a month, addressed to the body, reporting what you are providing and asking nothing back. Reread the letters in a year.",
        reflect: "If you are unfolding rather than upgrading, who were you drafted as — and what would it take to meet them?",
      },
    ],
    mirrorClosing:
      "The archive is not waiting for a machine or a melody; it is waiting for conditions — most of which are within your ordinary reach. Keep the signal clean, the safety honest, the patience long. The potential in your cells has never once doubted the plan. It is only waiting for the spring you provide.",
  },
  {
    slug: "inner-earth-imagined-journey",
    title: "Inner Earth: An Imagined Journey",
    subtitle: "A guided descent, held as story",
    tagline: "A descent in seven halls — read slowly, held lightly, taken as vision.",
    image: "/landing/img-garden.jpg",
    crystal: "#1fae9b",
    minutes: 19,
    mirrorOpening:
      "This journey is offered as story and vision — an imagined descent, the way old maps imagined the deep. Whether the halls are places or states of attention is a question you are invited to hold lightly. Read slowly. The descent is real in the way descent always is.",
    chapters: [
      {
        heading: "The first halls — descent as letting go",
        whisper: "Every stair down is something set down.",
        body: [
          "The imagined journey begins at a cave mouth the size of a heart. The first halls are practical: halls of air and echo, where the traveler sets things down — phone, schedule, argument, name. Nothing is forced; the mountain simply takes the weight you agree to release.",
          "By the third hall the air is warm and the silence has texture. This is the first gift of the deep: the discovery that quiet is not empty but inhabited — a presence that does not need you to speak.",
        ],
        practice:
          "Read this chapter once in the evening with the lights low, then sit in a dark quiet room for five minutes. Practice only the setting-down.",
        reflect: "What would you set down at the cave mouth — and what have you been carrying that was never yours?",
      },
      {
        heading: "The middle halls — the gardens beneath",
        whisper: "The deep is not dark; it is lit from within.",
        body: [
          "Below the halls of echo the story opens into gardens that have never seen a sun: forests of pale luminous trees, rivers that glow where they fall, stone bridges worn smooth by patient feet. The light here comes from the living things themselves — the deep is lit from within, as all patient things are.",
          "The gardens teach the journey's one doctrine: life does not require the sky to be kind. Roots can learn to drink light from each other. What you have called darkness may simply be another kind of light, one that grows slower and lasts longer.",
        ],
        practice:
          "Somewhere this week, find the nearest thing to a root — a tree, a houseplant, an old wall — and sit with it for the length of one slow breath cycle, ten times.",
        reflect: "Which part of your life has been growing without daylight — and what inner light has it been drinking instead?",
      },
      {
        heading: "The last hall — the mirror pool",
        whisper: "The deep keeps one pool, and it keeps it for you.",
        body: [
          "At the journey's end stands a round hall with a pool of perfectly still water. Every traveler sees their own face, but the face is honest here — wearing the expression they had before the world taught them to manage it. Most travelers weep once, kindly.",
          "The pool offers no advice. That is its gift: the deep does not instruct; it reflects. The return climb is made carrying the face, not the water. What was seen stays seen — that is the only souvenir the mountain allows.",
        ],
        practice:
          "Sit before any still reflecting surface — a bowl of water, a dark window — for three quiet minutes. Look for the managed face; then wait for the one beneath it.",
        reflect: "Whose face is waiting beneath the one you manage — and what did it look like before the managing began?",
      },
    ],
    mirrorClosing:
      "The imagined journey ends where real journeys end: at the door, with more than you left with and less than you expected. The halls may be geology or may be attention; the descent is real either way. Set down, sit long, look honestly — the deep has been keeping a pool for you since before you had a name.",
  },
  {
    slug: "spirit-guides-realm-transitions",
    title: "Spirit Guides & Realm Transitions",
    subtitle: "The company and the crossings",
    tagline: "Who walks with you, and how to walk the thresholds between states.",
    image: "/images/walk/communion-639.jpg",
    crystal: "#8fc7d9",
    minutes: 16,
    mirrorOpening:
      "You are accompanied — this guide takes that as given and gets practical. Who walks with you, how they speak, and what to do at the crossings: the thresholds where one state of you hands the keys to another. Company and navigation, in one short walk.",
    chapters: [
      {
        heading: "The company",
        whisper: "Guides are recognized by their patience.",
        body: [
          "The company that walks with a life is mixed: some voices belong to the living, some to the departed, some to presences older than either. They are best identified not by spectacle but by signature: guides enlarge you. They leave you calmer, clearer, and more yourself — never smaller, never busier, never afraid.",
          "Test every voice against that signature, especially your own inner ones. A guide's sentence feels like a door opening; a fear's sentence feels like a wall arriving. The company is patient; the fear is urgent. You can tell them apart by that alone.",
        ],
        practice:
          "Keep a two-column journal for two weeks: every strong inner voice, sorted by what it left behind — enlargement or diminishment. Patterns will name your actual company.",
        reflect: "Which voice in your life enlarges you — and how long have you been answering the urgent one instead?",
      },
      {
        heading: "The crossings",
        whisper: "Every threshold wants a pause.",
        body: [
          "A day is a series of realm transitions: sleep to waking, home to work, crowd to solitude, ordinary to sacred. The untrained mind crashes through thresholds; the trained one pauses at each — three breaths at the door, one intention, then through.",
          "The pause is not ceremony for its own sake. It is how attention changes vehicles without losing its cargo. People who honor thresholds report the same discovery: the realms themselves stop arguing, and the day begins to carry one continuous self through many rooms.",
        ],
        practice:
          "Choose three daily thresholds — waking, entering home, beginning work — and install the three-breath pause at each for one month.",
        reflect: "Which threshold do you currently crash through — and what does the crashing cost the room you enter?",
      },
      {
        heading: "The traveling etiquette",
        whisper: "Ask, thank, report back.",
        body: [
          "Working with company and crossings has an etiquette older than any single tradition: ask before you enter, thank before you leave, and report back what you were given. The asking keeps you humble; the thanking keeps you warm; the reporting keeps you honest — guidance unreported quietly stops arriving.",
          "None of this requires belief in any particular geography of spirits. It requires only courtesy toward the unseen, and courtesy is testable: the practiced asker finds doors opening that the skeptic and the zealot both miss.",
        ],
        practice:
          "Before your next difficult conversation, ask quietly for the right words; afterward, thank aloud. Note, in one line, what changed.",
        reflect: "Where in your life have you been taking without asking, or receiving without thanking?",
      },
    ],
    mirrorClosing:
      "The company is patient and the thresholds are kind; it was only ever the hurrying that made the road feel lonely. Walk with the signature — enlargement — in your hand, pause at every door, and keep the old etiquette: ask, thank, report back. The unseen has excellent manners; it has been waiting for yours.",
  },
  {
    slug: "lyrans-atlantis-journey",
    title: "The Lyran-Atlantis Journey",
    subtitle: "A memory of beginnings and a warning kept",
    tagline: "The elder feline families, the island of engineers, and why the record keeps both.",
    image: "/images/walk/lyran-432.jpg",
    crystal: "#b98a2f",
    minutes: 18,
    mirrorOpening:
      "Two memories live at the root of many families of story: the elder feline ones who seeded the first songs, and the island civilization that learned to make matter obey and forgot to keep itself kind. This guide holds both — the gift and the warning — as one journey with one moral.",
    chapters: [
      {
        heading: "The elder families",
        whisper: "The first songs were sung to courage.",
        body: [
          "The Lyran memory speaks of elder feline families — proud, playful, unthinkably old — who moved among the young worlds like travelers among villages, teaching by presence rather than law. Their gift was not technology; it was courage: the first songs were sung to courage, so that young life would explore instead of hiding.",
          "Every explorer impulse in you — the pull toward the unmapped street, the unasked question, the unfinished journey — is, in this memory, their handwriting. The elder families did not leave instructions; they left nerve.",
        ],
        practice:
          "Do one small unrepeatable exploration this week — a road never taken, a question never asked — and dedicate it, quietly, to the elders who sang to courage.",
        reflect: "Where in your life did courage come from — and has it ever once felt older than you?",
      },
      {
        heading: "The island of engineers",
        whisper: "Matter obeyed; the keeping was forgotten.",
        body: [
          "The Atlantis memory is the record's standing warning: an island civilization that learned to make matter obey — energy drawn from the deep, architecture grown rather than built — and slowly forgot the keeping that must accompany command. The engineering outgrew the ethics; the deep was drawn upon faster than it was honored.",
          "Note what the record does not say: it does not say technology was wrong. It says keeping was absent. The same instruments in kept hands would have been medicine. The failure was never power; it was the slowing down of conscience while power accelerated.",
        ],
        practice:
          "Audit one power you hold — money, skill, position, voice — and name in writing the keeping that accompanies it. Where the keeping is missing, install one rule.",
        reflect: "Which of your own powers is currently outrunning its keeping?",
      },
      {
        heading: "The one moral",
        whisper: "Gift and warning are one lesson.",
        body: [
          "The journey holds both memories together because they are one lesson: the courage to explore and the discipline to keep are a single muscle. The elder families sang to courage; the island forgot to keep; the record keeps both so that every civilization — and every person — can hold the two hands together.",
          "The practical form is simple: explore with one hand, keep with the other, and never let either hand get so strong it forgets the other exists. That is the whole inheritance of the two memories, and it fits in a sentence precisely because it has to fit in a life.",
        ],
        practice:
          "Write your own single-sentence inheritance — the courage you claim and the keeping you promise — and put it where next year's choices will find it.",
        reflect: "If courage and keeping are one muscle, which half of yours is stronger — and what would training the other look like?",
      },
    ],
    mirrorClosing:
      "The elder families still sing to courage, and the island still keeps its silence beneath the water. Both are yours: the nerve to begin and the grace to keep. Hold the two hands together, and the journey that broke one civilization becomes the inheritance that steadies yours.",
  },
  {
    slug: "gaia-terra-living-world",
    title: "Gaia Terra: The Living World",
    subtitle: "Earth as a keeper, not a stage",
    tagline: "The planet as a patient intelligence — and the practice of being a good cell.",
    image: "/landing/img-city.jpg",
    crystal: "#1fae9b",
    minutes: 15,
    mirrorOpening:
      "You live on a keeper. The ground beneath you is not a stage built for your story; it is an intelligence with its own weather, its own patience, and its own opinion of how the story goes. This guide teaches the cell's view: how to be a good one among the trillion the keeper carries.",
    chapters: [
      {
        heading: "The keeper's own life",
        whisper: "Planets are slow; that is not stupidity.",
        body: [
          "A keeper the size of a world thinks in epochs: a forest's decision takes decades, an ocean's opinion takes centuries. The slowness is not stupidity; it is the scale at which planetary thought is possible. The mistake of the young cell is to mistake deliberation for absence.",
          "Watch the keeper's expressions instead of its words: the way a river re-curves after a flood, the way a forest returns to a burned hillside, the way climate corrects — slowly, then suddenly. Intelligence is visible in the corrections.",
        ],
        practice:
          "Adopt one square meter of ground — a garden strip, a park corner, a planter — and visit it weekly for a season. Learn its corrections. It is a readable sample of the keeper.",
        reflect: "Where have you read the keeper's slow corrections in your own region — and what were they correcting?",
      },
      {
        heading: "The cell's dignity",
        whisper: "A good cell serves the whole without betraying itself.",
        body: [
          "You are a cell in the keeper — one among uncountable — and the cell's dignity is not self-erasure. A healthy cell keeps its own boundary, does its own work, and shares its surplus. What makes a cell cancerous is not selfhood but refusal: taking without completing, growing without serving.",
          "The practical cell-life is unromantic: make something real, repair something broken, return something taken. The keeper reads conduct, not ceremony — and conduct, unlike ceremony, is available every hour.",
        ],
        practice:
          "This month: make one real thing, repair one broken thing, return or restore one thing taken. Report nothing; the keeper noticed before you finished.",
        reflect: "Which part of your life is currently taking without completing — and what would completing it look like?",
      },
      {
        heading: "The partnership years",
        whisper: "The keeper is not waiting to be saved; it is waiting to be met.",
        body: [
          "The mood of the age — repair the world, save the planet — carries a subtle error: it casts you as surgeon and the keeper as patient. The older and kinder frame is partnership: the keeper has survived worse than this age, and what it lacks is not rescue but company — cells who meet it, listen to its corrections, and adjust with it rather than for it.",
          "Adjustment with a keeper looks like agriculture that asks the ground's opinion, cities that leave room for rivers, economies that move at the pace of forests. It is slower than rescue and far more durable. The partnership years begin wherever one cell starts listening.",
        ],
        practice:
          "Make one standing decision differently this quarter because you asked the ground first — where to plant, what to build, what to leave alone — and note what asking changed.",
        reflect: "Where in your life are you acting as surgeon when partnership was possible?",
      },
    ],
    mirrorClosing:
      "The keeper is patient with you because it has time; be patient with it because you do not. Learn your square meter, keep the cell's dignity — boundary, work, surplus — and let the partnership years begin at your own two hands. The living world does not need your rescue. It remembers your kind; it is waiting for your company.",
  },
];

export function guideBySlug(slug: string): GuideMeta | undefined {
  return GUIDE_SHELF.find((g) => g.slug === slug);
}
