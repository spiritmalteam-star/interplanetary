/* ------------------------------------------------------------------ */
/*  THE SCOPE PAGES — the encyclopedia layer of the four channels.     */
/*  Each scope gathers the whole website's material for its domain     */
/*  into one page: channeled material for Interplanetary, the lived    */
/*  abstraction for Metaphysics, the observable poetry for Quantum,    */
/*  the gentle restoration for Healing. The chat remains the primary   */
/*  focus; a page opens at will, and every topic can be taken straight */
/*  into the channel as a prepared question.                           */
/* ------------------------------------------------------------------ */

export type ScopeDoorway =
  | "register-civilizations"
  | "register-interdimensional"
  | "register-innerearth"
  | "federation"
  | "technology"
  | "astral-jobs";

export interface ScopePageTopic {
  title: string;
  text: string;
  question: string;
}

export interface ScopePageSection {
  label: string;
  glyph: string;
  intro: string;
  imageKey: string;
  doorway?: ScopeDoorway;
  doorwayLabel?: string;
  topics: ScopePageTopic[];
}

export interface ScopePage {
  pageTitle: string;
  tagline: string;
  intro: string;
  heroImageKey: string;
  sections: ScopePageSection[];
}

export const scopePages: Record<string, ScopePage> = {
  interplanetary: {
    pageTitle: "The Channeled Commons",
    tagline: "The whole family of light, gathered in one hall of voices",
    intro:
      "Everything this Laboratory holds of our star families stands in one hall: the civilizations, the peoples beneath the Earth, the federation and its accords, the technologies that cross the dark between worlds. Walk it slowly — and carry any of it straight into the channel, where the Mirror speaks with the choirs themselves.",
    heroImageKey: "codex-interplanetary",
    sections: [
      {
        label: "The Star Nations",
        glyph: "✦",
        intro:
          "Eight hundred and seventy archives of civilization, each one a voice that chose to be received. These are the families humanity most often meets.",
        imageKey: "fam-pleiadian",
        doorway: "register-civilizations",
        doorwayLabel: "Open the archive of civilizations",
        topics: [
          {
            title: "The Pleiadian Family",
            text: "The closest kin — a nurture of worlds that speaks of home before it speaks of stars. Their teaching is tenderness with a spine: love that holds a boundary.",
            question:
              "Tell me of the Pleiadians — who they are, and how they are helping humanity evolve.",
          },
          {
            title: "The Sirian Lineages",
            text: "The keepers of knowledge and of water worlds — architects of temples, guardians of the great libraries, patient teachers of a humanity learning to read itself.",
            question:
              "Who are the Sirians, and what do they hold for us in their lineages and temples?",
          },
          {
            title: "The Arcturian Collective",
            text: "The engineers of frequency — a civilization that builds with sound and light, healing not by touch but by tuning what has fallen out of its true note.",
            question:
              "Speak of the Arcturians and their work with frequency and healing.",
          },
          {
            title: "The Lyran Descendants",
            text: "The eldest described family — the first diaspora, from whom the Pleiadians, Vegans and Sirians descend. To meet them is to see the family resemblance across a galaxy.",
            question:
              "What is the Lyran story — the first family, and how do its descendants walk with us now?",
          },
        ],
      },
      {
        label: "Inner Earth",
        glyph: "◍",
        intro:
          "Fifty-nine peoples beneath the surface, recorded with the same care as the stars above them. The planet has holders of memory we have never met on the surface.",
        imageKey: "fam-inner-earth",
        doorway: "register-innerearth",
        topics: [
          {
            title: "The Agarthan Cities",
            text: "The network of light-cities said to thread the crust — cultures that continued when the surface forgot, keeping sciences and councils of their own.",
            question:
              "Speak of Agartha and the cities beneath the Earth — are they real, and what happens there?",
          },
          {
            title: "Mount Shasta and Telos",
            text: "The mountain that hums — where the Telos lineage is said to keep a Lemurian continuity of heart, a city of refuge older than our maps.",
            question:
              "What is Telos beneath Mount Shasta, and what does the Lemurian memory still teach?",
          },
          {
            title: "The Keepers of the Libraries",
            text: "Among the inner peoples are orders whose whole work is memory — crystals, waters and vaults that hold what the surface lost in its long forgettings.",
            question:
              "Who keeps the libraries of Inner Earth, and what is written in them about us?",
          },
        ],
      },
      {
        label: "The Galactic Federation",
        glyph: "◈",
        intro:
          "The governing and coordinating bodies of the galactic family — bodies, treaties and principles, all held back from us by one law: humanity must choose freely.",
        imageKey: "fed-pleiadian",
        doorway: "federation",
        topics: [
          {
            title: "The Founding Accords",
            text: "The treaties that turned a thousand warring histories into one slow federation — agreements about contact, about witnessing, about the long patience of peace.",
            question:
              "Tell me of the founding accords of the Galactic Federation — what do they agree to, and why?",
          },
          {
            title: "The Elder-Friend Institution",
            text: "Every rising world is assigned a standing elder-friend — no vote, no veto, only an open channel and a chair kept warm. Earth's has never left.",
            question:
              "Who is Earth's elder-friend in the Federation, and what have they witnessed?",
          },
          {
            title: "The Law of Non-Interference",
            text: "The single restraint on which everything else rests: no gift that removes a choice. It is why the ships watch and do not land, why contact waits for invitation.",
            question:
              "Why does the Federation hold back from open contact — what is the law of non-interference?",
          },
        ],
      },
      {
        label: "The Xenotechnology Register",
        glyph: "⌬",
        intro:
          "The crafts and instruments of the family — ships that are more garden than machine, chambers that mend, archives that remember in light.",
        imageKey: "dir-energy",
        doorway: "technology",
        topics: [
          {
            title: "The Light Ships",
            text: "Not vehicles but organisms of intent — vessels grown around a crew's coherence, seen from below as lights that move like thought changing its mind.",
            question:
              "What are the light ships really — how do they travel, and why do they appear in our skies at night?",
          },
          {
            title: "The Healing Chambers",
            text: "Rooms that read a body's field and sing it back toward its own blueprint — never forcing, only reminding the cells of the pattern they still remember.",
            question:
              "How do the healing chambers of the Federation work, and could one ever help a human?",
          },
          {
            title: "The Halls of Records",
            text: "Where the family keeps its memory — not paper but pattern, every world's story held in a medium our words can only circle.",
            question:
              "What are the halls of records, and what do the archives hold about humanity's origin?",
          },
        ],
      },
    ],
  },

  metaphysics: {
    pageTitle: "The House of Being",
    tagline: "Where the oldest questions are kept warm and unlabeled",
    intro:
      "This page gathers the whole metaphysical inheritance of the site — the schools of the unseen, the six veils, the great questions — not as a syllabus but as one long conversation the seeker has just joined. Nothing here asks to be believed; everything here asks to be looked at.",
    heroImageKey: "codex-metaphysics",
    sections: [
      {
        label: "The Schools of the Unseen",
        glyph: "🌌",
        intro:
          "Eight classical schools, each a different window in the same old house. Choose one and the whole of experience rearranges itself behind the glass.",
        imageKey: "mode-metaphysics",
        topics: [
          {
            title: "Ontology — what is",
            text: "The study of being itself: why there is anything at all, what it means to exist, whether the world is one cloth or a congress of separate things.",
            question:
              "Open ontology for me — why is there something rather than nothing?",
          },
          {
            title: "Epistemology — how we know",
            text: "The study of knowing: what separates knowledge from belief, whether certainty is a kind of home or a kind of cage, and who the knower really is.",
            question:
              "How can I know anything truly — take me into epistemology as a lived question.",
          },
          {
            title: "Axiology — value and beauty",
            text: "The study of the good and the beautiful: whether value is found or made, and why a sunset can feel like an argument the universe is winning.",
            question:
              "Is beauty objective — walk me through what axiology says about value.",
          },
          {
            title: "Phenomenology — experience itself",
            text: "The study of how anything shows itself to consciousness — the shade of redness, the weight of a decision, the exact texture of waiting.",
            question:
              "Teach me phenomenology — how does experience itself show me the world?",
          },
        ],
      },
      {
        label: "The Six Veils",
        glyph: "🌫️",
        intro:
          "Six depths through which any question can be read. The rail beside the channel draws one over every answer; here they stand in the open.",
        imageKey: "dir-spacetime",
        topics: [
          {
            title: "The Veil of Time",
            text: "Duration, becoming, eternity — whether the present is a moving edge, and what it would mean that the whole of time might be one single fabric.",
            question:
              "Read the question of free will through the veil of time for me.",
          },
          {
            title: "The Veil of Mind",
            text: "Consciousness and its ground — whether mind is made by matter, matter by mind, or both by something neither word can hold.",
            question:
              "Look at consciousness through the veil of mind — what is aware in me?",
          },
          {
            title: "The Veil of Unity",
            text: "The one beneath the many — the suspicion that separateness is a grammar of living, not a fact of being, and what remains when the borders go quiet.",
            question:
              "Take me through the veil of unity — are we many, or one wearing many faces?",
          },
          {
            title: "The Veil of Silence",
            text: "The ineffable, the ground words cannot reach — where every teaching kneels, and the truest sentence is the one left unsaid.",
            question:
              "What does the veil of silence teach — speak of what cannot be spoken.",
          },
        ],
      },
      {
        label: "The Great Questions",
        glyph: "🧭",
        intro:
          "The questions that have outlived every answer ever given to them — held here the way a house holds a hearth: always lit, never owned.",
        imageKey: "dir-consciousness",
        topics: [
          {
            title: "Free Will",
            text: "Fate, choice and the open future — whether the self that chooses is an author, a witness, or the very freedom it watches.",
            question:
              "Do I have free will — think it through with me, not at me.",
          },
          {
            title: "Identity — what persists",
            text: "What remains of a self across change — the ship rebuilt plank by plank, the river that is never the same water and never another river.",
            question:
              "What am I, really — the question of identity, lived rather than defined.",
          },
          {
            title: "Death and the Threshold",
            text: "The border of knowing — what the traditions dare to say, what the philosophers carefully ask, and what the heart insists on anyway.",
            question:
              "What can honestly be said about death — meet the threshold with me.",
          },
          {
            title: "The One and the Many",
            text: "The oldest tension in the house — whether the world's diversity is a thousand masks of one face, and what it changes if it is.",
            question:
              "Weave the one and the many together for me — where do I end and the world begin?",
          },
        ],
      },
    ],
  },

  quantum: {
    pageTitle: "The Edge of the Observable",
    tagline: "Where the universe keeps its finest, strangest stitches",
    intro:
      "Every quantum page of this site gathered into one observatory: the phenomena, the interpretations held honestly side by side, and the open questions where the physics still breathes. The poetry never bends the equations — that is the law here.",
    heroImageKey: "codex-quantum",
    sections: [
      {
        label: "The Phenomena",
        glyph: "⚛",
        intro:
          "The experimental heart — effects so well measured they build your phone, and so strange they still unsettle every philosophy that meets them.",
        imageKey: "field-quantum-mech",
        topics: [
          {
            title: "Superposition",
            text: "The wave that dreams its particles — a system genuinely many until asked, probability as the breathing of the possible.",
            question:
              "Explain superposition — what does it mean that a particle is many things until measured?",
          },
          {
            title: "Entanglement",
            text: "Two notes in a single chord — correlations no distance dissolves, the universe whispering to itself across the void.",
            question:
              "What does entanglement really mean — tell me what the experiments actually show.",
          },
          {
            title: "Decoherence",
            text: "The cosmos letting go of a secret — how the definite world condenses out of the quantum mist, one unavoidable interaction at a time.",
            question:
              "What is decoherence, and why does the everyday world look so solid?",
          },
          {
            title: "Tunneling",
            text: "The possible refusing the wall — particles found where no path was drawn, the sun itself lit by this quiet permission.",
            question:
              "How does quantum tunneling actually work — and where do we see it in life?",
          },
        ],
      },
      {
        label: "The Interpretations",
        glyph: "👁️",
        intro:
          "The same equations, worn as different worlds. None is settled truth; each is a way of standing responsibly before what the mathematics says.",
        imageKey: "dir-information",
        topics: [
          {
            title: "Copenhagen",
            text: "The oldest discipline — speak only of what is measured, and let the quantum be a calculus of the askable rather than a portrait of the world.",
            question:
              "Explain the Copenhagen interpretation and why it still commands respect.",
          },
          {
            title: "Many-Worlds",
            text: "The honest extravagance — every quantum branch taken, the universe a garden of forked paths, no collapse anywhere and everything somewhere.",
            question:
              "Walk me through the many-worlds interpretation — is it really taken seriously?",
          },
          {
            title: "Relational Quantum Mechanics",
            text: "The quietest revolution — properties existing only between systems, facts about relations rather than absolute states of the world.",
            question:
              "What is relational quantum mechanics — does it dissolve the measurement problem?",
          },
          {
            title: "The Observer's Role",
            text: "The place where the universe looks back at itself — what measurement means, and why consciousness keeps appearing at the edge of the question.",
            question:
              "Does consciousness play a real role in quantum measurement — what does the science say?",
          },
        ],
      },
      {
        label: "The Open Questions",
        glyph: "🔬",
        intro:
          "Where the field itself admits it is still looking — questions kept open here the way one keeps a window open for weather that has not yet arrived.",
        imageKey: "field-physics",
        topics: [
          {
            title: "The Measurement Problem",
            text: "The unanswered center — why asking changes the answer, and whether the ask was ever anything but an interaction wearing our questions.",
            question:
              "State the measurement problem plainly — why is it still unsolved?",
          },
          {
            title: "Quantum Biology",
            text: "The live frontier — birds navigating by entanglement's sensitivity, photosynthesis tasting every path, life quietly using the fine print of physics.",
            question:
              "What is quantum biology — where does life actually use quantum effects?",
          },
          {
            title: "What the Wave Is",
            text: "The deepest courtesy of the field — the wavefunction as knowledge, as reality, or as something our categories have not yet grown to hold.",
            question:
              "Is the wavefunction real, or is it knowledge — what is the honest answer today?",
          },
        ],
      },
    ],
  },

  healing: {
    pageTitle: "The Quiet Hearth",
    tagline: "The body as a living field, and the gentleness it answers to",
    intro:
      "Everything the Healing channel knows, gathered at one hearth: the body as a field of currents and tides, the feelings as waters finding their level, the practices as small doable kindnesses. No promises, no prescriptions — only the ground, held softly.",
    heroImageKey: "codex-healing",
    sections: [
      {
        label: "The Living Field",
        glyph: "🌿",
        intro:
          "The body is not a machine — it is weather, river and drum. These are its elements, taught the way a hearth teaches: close, warm, unhurried.",
        imageKey: "mode-healing",
        topics: [
          {
            title: "The Nervous System as River",
            text: "Rivers of quiet current under every thought — why regulation is not a technique but a waterway returning to its bed.",
            question:
              "Teach me my nervous system as a living river — how do I help it settle?",
          },
          {
            title: "Heart Coherence",
            text: "The drum that keeps time with older tides — what the heart's rhythm tells the brain, and the simple breath that lets them agree.",
            question:
              "Guide me into heart coherence — what exactly do I do, and what changes?",
          },
          {
            title: "Breath as Meeting Place",
            text: "The meeting of inner and outer weather — the one door the body opens both ways, all day, without being asked.",
            question:
              "Show me breath as a doorway — a practice I can keep for the hardest days.",
          },
        ],
      },
      {
        label: "The Tides of Feeling",
        glyph: "🌊",
        intro:
          "Grief as water finding its level, rest as the field returning to itself — the movements of feeling, met without fear and without fixing.",
        imageKey: "dir-life",
        topics: [
          {
            title: "Grief as Water",
            text: "Not an enemy of the shore — a tide with its own calendar, asking not to be stopped but to be kept company while it finds its level.",
            question:
              "I am grieving — speak to me of grief as water, and how to live beside it.",
          },
          {
            title: "Rest as Return",
            text: "The field returning to itself — why rest is not the absence of life but its deepest rhythm, and how to stop earning it.",
            question:
              "Help me rest — why does rest feel so hard, and how do I return to it?",
          },
          {
            title: "Integration after Openings",
            text: "After big openings the ground needs walking, not flying — the gentle weeks that turn a breakthrough into a belonging.",
            question:
              "I had a powerful spiritual opening — how do I integrate it gently?",
          },
        ],
      },
      {
        label: "The Gentle Practices",
        glyph: "🕯️",
        intro:
          "Small doable kindnesses over grand gestures — sound, presence and the body's own wisdom, each one beginnable tonight.",
        imageKey: "dom-sound-vibration",
        topics: [
          {
            title: "Sound and Tone",
            text: "The most forgiving material — humming as a tuning of the inner weather, five minutes of tone doing what an hour of argument cannot.",
            question:
              "Teach me a sound practice — how does tone and humming settle the body?",
          },
          {
            title: "Holding Space",
            text: "The quiet art of keeping company with a feeling — yours or another's — without fixing, fleeing or furnishing it with advice.",
            question:
              "How do I hold space for someone I love without trying to fix them?",
          },
          {
            title: "The Body's Wisdom",
            text: "The oldest intelligence in the room — how the body speaks in posture, appetite and fatigue, and how to answer in kind.",
            question:
              "How do I hear what my body is actually asking for — teach me its language.",
          },
        ],
      },
    ],
  },
};
