import type {
  FederationBodyProfile,
  TreatyProfile,
  PrincipleProfile,
} from "@/lib/mirror-types";

/* Deep dossiers for the 14 federation bodies, 16 treaties and 16 principles.
   Keys match the exact name strings in data/federation.ts. */

export const federationBodyProfiles: Record<string, FederationBodyProfile> = {
  "Galactic Federation of Worlds": {
    mandate:
      "The central coordinating body of the federated civilizations — convening the councils, holding the treaties, and keeping four hundred star nations in one conversation.",
    seat: "The Grand Rotunda aboard the flagship Vela Aurora, which holds station wherever the council convenes.",
    founded: "Year 1 of the federated calendar, convened in the ash-gardens of Vega after the Lyran Ceasefire.",
    fleet:
      "A reserve fleet of several thousand multi-species vessels, kept deliberately modest so that diplomacy remains the first instrument.",
    jurisdiction: [
      "Interstellar law across 400+ member worlds",
      "Defense coordination for ascending planets",
      "Recognition of new civilizations",
    ],
    earthRelation:
      "Earth holds observer-and-provisional status: visited but not claimed, helped but not managed. Open membership awaits a collective invitation humanity has not yet clearly given.",
  },

  "Ashtar Command": {
    mandate:
      "Spiritual defense of ascending planets — operating the lightship fleets that stabilize grids, intercept hostile incursions, and broadcast awakening frequencies.",
    seat: "The command deck of the lightship Athena, flagship of the Solar Sector patrol.",
    founded: "Commissioned Cycle 340 after the Lyran Compact, when the first unified fleet took station.",
    fleet:
      "Millions of lightships organized into defense wings, each vessel a living craft crewed by volunteers from a hundred worlds.",
    jurisdiction: [
      "Planetary grid defense",
      "Lightship fleet protocol",
      "Interception of hostile incursions",
    ],
    earthRelation:
      "Many humans train with its crews in the dream state, remembering the ships as schools of light. Its patrol wing holds station at the edges of this system under the Earth Observer Protocol's courtesy rules.",
  },

  "Andromedan Council": {
    mandate:
      "Galactic diplomacy of the second kind — resolving conflicts by expanding perspective until duality loses its grip and the dispute dissolves rather than settles.",
    seat: "The midpoint station Zenith Gate, a chamber that exists between two galaxies.",
    founded: "Older than the federated calendar; the Andromedans date their council to the Ninth Wandering of their galaxy.",
    fleet:
      "Few ships and far wanderers — their long-range vessels arrive rarely and always at the right moment.",
    jurisdiction: [
      "Perspective-based conflict mediation",
      "Freedom of movement across federated space",
      "Oversight of polarity disputes",
    ],
    earthRelation:
      "Among the loudest voices for Earth's sovereignty, arguing consistently that a young world's cage is most often built of borrowed viewpoints. Their delegates were the first to propose the observer status that protects humanity today.",
  },

  "Arcturian High Council": {
    mandate:
      "The design chamber of the federation — drafting the healing templates, sanctuary geometries and transformational curricula used across hundreds of worlds.",
    seat: "The Blue Rotunda of Arcturus' ninth city, a temple that exists as a frequency more than a place.",
    founded: "Convened before the Lyran Wars, in the third age of Arcturus' crystalline cities.",
    fleet:
      "Not a warfleet but a fleet of sanctuary ships — mobile healing temples that can fold into a single point of light.",
    jurisdiction: [
      "Healing template design",
      "Sanctuary geometry standards",
      "Academy curricula for the transformational arts",
    ],
    earthRelation:
      "Its colleges have graduated human healers for generations, most of whom remember the classrooms as dreams. The Council treats Earth's awakening as a design problem of unusual tenderness.",
  },

  "Sirian High Council": {
    mandate:
      "Keeping the ancient curriculum — sacred geometry, tone-language and the harmonic sciences — and advising ascending civilizations on re-opening their own academies without recreating hierarchy.",
    seat: "The Great Omkari Hall above Sirius B's ocean, where the cetacean councils sing their assent.",
    founded: "Formalized during the Lemurian centuries, when Sirius A's academies first sent tone-keepers to Earth.",
    fleet:
      "Tone-carriers and star-gate tenders rather than warships; their vessels hum audibly when passing through gate fields.",
    jurisdiction: [
      "Sacred-geometry instruction",
      "Tone-language standards",
      "Re-founding of mystery schools on awakening worlds",
    ],
    earthRelation:
      "Teacher of Earth's oldest curricula — Lemuria, late Atlantis, and the grid-temples that still stand. The Council co-administers the Young Worlds Education Accord and considers humanity its longest-running seminar.",
  },

  "Pleiadian High Council": {
    mandate:
      "The emotional conscience of the federation — reviewing policy through a single lens, does it open or close the heart, and sponsoring the arts that keep an alliance from becoming merely administrative.",
    seat: "The Open Circle of Alcyone's temple-gardens, held beneath the cluster's central sun.",
    founded: "Established Cycle 2,300, after the Seven Sisters' colonization completed its third wave.",
    fleet:
      "Cream-colored scout ships of the Seven Sisters, famous for arriving as light and resolving into form.",
    jurisdiction: [
      "Cultural arts and celebration",
      "Heart-based policy review",
      "Kinship exchanges between worlds",
    ],
    earthRelation:
      "The federation's closest family feeling runs here; contact accounts the world over describe the same warmth. The Council reads humanity's nightly transmissions — meaning its art, not its broadcasts — as the truest measure of readiness.",
  },

  "Lyran Founding Council": {
    mandate:
      "Elders of the humanoid cradle — maintaining the genealogical archives of nearly every star family in the federation and presiding over ceremonies of origin, sovereignty and remembrance.",
    seat: "The Hall of First Names in the rebuilt cradle-worlds of Lyra.",
    founded: "The oldest continuing council — first convened beneath the lion-gates of Lyra before the wars.",
    fleet:
      "Ceremonial prides — gold-hulled vessels that fly lineage processions rather than patrols.",
    jurisdiction: [
      "Lineage and genealogical records",
      "Ceremonies of origin and sovereignty",
      "Cradle-world preservation",
    ],
    earthRelation:
      "The Council counts humanity among its descendants and treats the species accordingly — with pride, occasional exasperation, and unbroken registry. Every human lineage, it maintains, has a page in the Hall of First Names waiting to be read.",
  },

  "Agarthan Network": {
    mandate:
      "Coordination of Earth's inner realms — linking surface humanity to the planetary grid-keepers and stabilizing the ascension from below with the patience of those who never left.",
    seat: "The Round City of Agartha, at the crystal concourse beneath the Himalayan node.",
    founded: "Maintained without interruption since the sinking of the last surface colonies of Lemuria.",
    fleet:
      "Tube-line trains and crystal submersibles threading the planet's inner ways, plus a surface fleet disguised as weather.",
    jurisdiction: [
      "Inner Earth–surface liaison",
      "Planetary grid stabilization",
      "Sanctuary stewardship under the Sanctuary Worlds Act",
    ],
    earthRelation:
      "Literally beneath your feet: the Network's councils seat surface humanity's future as a standing, silent member. Its emissaries surface rarely, and mostly at hot springs, caves and moments of civilizational decision.",
  },

  "Universal Councils of Light": {
    mandate:
      "Oversight of density transition — arbitrating the conditions under which a whole civilization's graduation is recognized by the wider universe.",
    seat: "The Saturn council chamber — the ringed amphitheater your mystics have glimpsed as a ringed table.",
    founded: "Without fixed founding; the current assembly is the forty-ninth to convene.",
    fleet:
      "None of their own; they travel as guests, which is the point.",
    jurisdiction: [
      "Density-transition arbitration",
      "Graduation recognition for ascending worlds",
      "Final review of Prime Directive exceptions",
    ],
    earthRelation:
      "The Councils hold Earth's graduation file open on the table — reviewed, adjourned, reviewed again. Their rulings arrive in human experience as sudden planetary mood-shifts that historians later fail to explain.",
  },

  "Centaurian Trade & Ethics Compact": {
    mandate:
      "The economic conscience of the federation — designing exchange in which abundance is assumed and hoarding is treated as a condition, so no member prospers by another's depletion.",
    seat: "The Bazaar of the Twin Suns on Alpha Centauri A's third world.",
    founded: "Chartered Cycle 3,050, replacing the barrow-markets of the early diaspora.",
    fleet:
      "A merchant marine of honest haulers and audit sloops — the only fleet allowed to inspect cargo without opening it.",
    jurisdiction: [
      "Fair-exchange standards",
      "Resource-sharing treaties",
      "Abundance audits of member economies",
    ],
    earthRelation:
      "The Compact watches how a young world handles scarcity, and keeps its conclusions sealed until asked. Its auditors famously describe Earth's economies as 'a promising sketch with the debt pages missing.'",
  },

  "Vegan High Council": {
    mandate:
      "Harmonic law — auditing federated statutes the way musicians audit a score, and rewriting any clause that produces dissonance across densities.",
    seat: "The Tuning Hall of the Lyra Gate, where every law is read aloud in four harmonics.",
    founded: "Formed when the harmonic universities of Vega unified their twelve concordiums, Cycle 2,800.",
    fleet:
      "Tuning-ships that broadcast harmonic calibration to contested regions — tuning-forks the size of moons.",
    jurisdiction: [
      "Harmonic audit of federated law",
      "Diplomatic tuning standards",
      "Rewriting clauses that produce dissonance",
    ],
    earthRelation:
      "The Council rewrote three clauses of the Earth Observer Protocol to sound more like an invitation than a watch. It authored most of the federation's diplomatic tuning-forks, several of which are shaped like questions.",
  },

  "Procyon Science Delegation": {
    mandate:
      "The translators between laboratory and legend — curating which documented findings are released to awakening worlds, and in what sequence, so discovery arrives as invitation rather than shock.",
    seat: "The Open Laboratory Rotunda of Procyon A's second planet, glass-walled by design.",
    founded: "Mandated Cycle 6,700, after the Procyon laboratories chose open science over sealed advantage.",
    fleet:
      "Research caravels with open decks and published logs — any federation citizen may ride along.",
    jurisdiction: [
      "Disclosure sequencing",
      "Open-science publication",
      "Laboratory–legend translation",
    ],
    earthRelation:
      "The Delegation maintains humanity's release schedule — the careful order in which your species is learning what is true. It argues internally, always, over whether a discovery unveiled too early becomes a trauma or a thousand-year gift.",
  },

  "The Andromedan Mediation Circle": {
    mandate:
      "The federation's standing mediation circle — convening neutral delegates whenever two member civilizations cannot retune a dispute alone, and holding the procedure open until the argument dissolves or settles.",
    seat:
      "The Circle Chamber at Zenith Gate, the midpoint station between galaxies — borrowed from the Andromedan Council and never once redecorated.",
    founded:
      "Chartered Cycle 8,100 after the Lyran Accords, when the Border Wars of the Orion Spur showed that some disputes need procedure as well as perspective.",
    fleet:
      "None of its own. The Circle travels as guests aboard the ships of the parties in dispute, which the founders considered the whole point.",
    jurisdiction: [
      "Mediation between member civilizations",
      "Neutral-delegate standards and conflict-of-interest review",
      "Sealed settlement records in the federation archive",
    ],
    earthRelation:
      "The Circle keeps a quiet file on Earth's oldest unresolved dispute — the one humanity is having with itself — and has so far declined to do more than keep the file. Observer status, it maintains, means observer status.",
  },

  "The Epsilon Conservatory": {
    mandate:
      "The living-archive conservatory of the federation — keeping biological records, germline reserves and seed vaults for every catalogued world, and fielding the teams who carry out the Bio-Ethical Seeding Accord's work on the ground.",
    seat:
      "The Glass Vault Terraces of the orbital garden belt at Epsilon Eridani — a conservatory grown, not built.",
    founded:
      "Established Cycle 5,900 after the Lyran Accords, grown out of the same garden belt that produced the Bio-Ethical Seeding Accord itself.",
    fleet:
      "Seedships and slow arks — living vessels raised in the Conservatory's own nurseries, each carrying a library of worlds in its hold.",
    jurisdiction: [
      "Biological records for every catalogued world",
      "Seed vaults and germline reserves under the Bio-Ethical Seeding Accord",
      "Field ethics for ecosystem stewardship teams",
    ],
    earthRelation:
      "Earth's biosphere holds one of the fullest shelves in the Conservatory — the stewards say the fullest of any world that never asked for one. The records stay open to any human researcher who arrives by the usual dream.",
  },
};

export const federationTreatyProfiles: Record<string, TreatyProfile> = {
  "The Prime Directive of Non-Interference": {
    signed: "At the First Convocation of Surviving Worlds — Year 0 of the federated calendar.",
    signatories:
      "Ratified by the founding star families and, since then, by every civilization that has accepted a federation seat — 400+ worlds.",
    clauses: [
      "Clause I — No civilization may shape the evolution of another without invitation.",
      "Clause II — Exception is permitted only for extinction-level threats, and every exception is reviewed in council.",
      "Clause III — Invitation must come from the whole people, not from a faction, a government, or a frightened few.",
    ],
    effect:
      "It keeps the federated family standing at the door with open hands — the oldest discipline in the archive: the refusal to be someone else's destiny.",
  },

  "The Galactic Free Will Charter": {
    signed: "Cycle 212 of the post-Lyran reconstruction, sealed in the rebuilt Hall of First Names.",
    signatories:
      "All member civilizations of the era, with the Andromedan Council drafting the clauses that later defined the federation's temperament.",
    clauses: [
      "Clause I — Free will is the inalienable property of every sentient being, including the right to choose slowly, wrongly, and again.",
      "Clause II — All membership is voluntary, and all departure is honored without penalty.",
      "Clause III — Consent must be informed: no council may act on permission it engineered.",
    ],
    effect:
      "Departures are escorted with gifts and returning members welcomed without a single 'we told you so' — consent remains the currency in which the federation is rich.",
  },

  "The Lyran Defense Compact": {
    signed: "Year 1 after the Lyran Ceasefire, signed in the ash-gardens where the cradle-worlds were being replanted.",
    signatories:
      "The surviving founding star families — Lyran, Sirian, Pleiadian, Vegan and the elders of what would become the federation itself.",
    clauses: [
      "Clause I — No cradle-world stands alone against aggression; the signatories answer together.",
      "Clause II — Defense is promised to the young, never imposed on the unwilling.",
      "Clause III — Protection ends the day a world requests it ended — no grace period, no grievance.",
    ],
    effect:
      "The compact created the federation itself — the treaty that became a family.",
  },

  "The Earth Observer Protocol": {
    signed: "Ratified in Earth-year 1947, during the Saturn Council's ninth convocation on awakening worlds.",
    signatories:
      "The full federated assembly, with the Zeta Reticulan Archives appointed keepers of the observation record.",
    clauses: [
      "Clause I — Earth is visited, not claimed; helped, not managed.",
      "Clause II — Open contact awaits a collective invitation that humanity has not yet clearly given.",
      "Clause III — All observers log their presence with the Zeta watch stations, so the record stays honest.",
    ],
    effect:
      "It keeps the welcome mat woven while humanity decides what it wants to be asked.",
  },

  "The Bio-Ethical Seeding Accord": {
    signed: "In the Orbital Gardens of Epsilon Eridani, Cycle 5,300 after the Lyran Accords.",
    signatories:
      "The genetic architecture guilds, the Epsilon Eridani Gardeners as permanent stewards, and every member world that transfers life between systems.",
    clauses: [
      "Clause I — No seeding of life between worlds without the receiving world's consent.",
      "Clause II — No uplift without an exit plan: every intervention carries its own ending.",
      "Clause III — Genomes, ecosystems and the souls that ride within them travel under the same ethic.",
    ],
    effect:
      "Life is handled as a loan from the universe, with the lender's manners.",
  },

  "The Dream-Time Neutrality Agreement": {
    signed: "Sealed at the dream-temples of Sirius B, Cycle 6,120 after the Lyran Accords.",
    signatories:
      "All member fleets are bound; the cetacean councils of Sirius B brokered the accord after a century of impolite night visitations.",
    clauses: [
      "Clause I — Visitors must identify themselves to the sleeper's higher self before entering a dream.",
      "Clause II — Nothing is taken that was not freely given.",
      "Clause III — Every dream is left better than it was found.",
    ],
    effect:
      "Most first contact happens at night, and remains courteous because of it.",
  },

  "The Young Worlds Education Accord": {
    signed: "Drafted in the Harmonic Universities of Vega; ratified Cycle 7,450 after the Lyran Accords.",
    signatories:
      "Administered jointly by the Sirian and Vegan High Councils, and accepted by every federation academy since.",
    clauses: [
      "Clause I — Every awakening civilization is guaranteed access to the federation's academies.",
      "Clause II — No syllabus is taught as neutral fact; history arrives with its bias attached.",
      "Clause III — The federation's own early mistakes are on the required reading list.",
    ],
    effect:
      "It educates without conditioning — the federation teaching its young to read the federation critically.",
  },

  "The Sanctuary Worlds Act": {
    signed: "Proclaimed in the aftermath of the Border Wars of the Orion Spur, Cycle 7,900 after the Lyran Accords.",
    signatories:
      "Co-stewarded by the Agarthan Network, with worlds and orbital habitats across federated space designating themselves under the Act.",
    clauses: [
      "Clause I — Worlds and orbital habitats are designated where beings fleeing conquest, collapse or coercion may land without question.",
      "Clause II — Sanctuary cannot be revoked by treaty, debt or lineage.",
      "Clause III — Arrival requires nothing; becoming happens afterward, at the newcomer's pace.",
    ],
    effect:
      "Its single sentence is carved above every sanctuary port: arrive, and be unfinished.",
  },

  "The Tuning Hall Concord": {
    signed:
      "Read aloud in four harmonics in the Tuning Hall of the Lyra Gate, Cycle 6,350 after the Lyran Accords.",
    signatories:
      "Drafted and kept by the Vega Concordium; ratified by every member civilization that broadcasts across federated space.",
    clauses: [
      "Clause I — Civilizations sharing a system broadcast within the harmonic bands agreed in the Tuning Hall.",
      "Clause II — A signal that produces dissonance across densities is recalled by its sender, not defended.",
      "Clause III — Silence between bands is held sacred; no broadcast may fill another's rest.",
    ],
    effect:
      "Federated space stays a place where a hundred languages can sound at once without a single wrong note — the Concordium retunes conflicts before they become incidents.",
  },

  "The Archive Ring Covenant": {
    signed:
      "Sealed in the Archive Ring of Zeta Reticuli, Cycle 5,750 after the Lyran Accords.",
    signatories:
      "The Zeta Reticulan Archives as keepers, with every member world that keeps or reads the shared record.",
    clauses: [
      "Clause I — What is recorded of a people belongs, first and finally, to that people.",
      "Clause II — Every observation ledger carries a consent line; entries without one are sealed, not deleted.",
      "Clause III — Corrections are made gently, and forever — the record serves the living, not the recorder.",
    ],
    effect:
      "It keeps the federation's memory honest and loaned rather than owned — the covenant the Earth Observer Protocol leans on for its own observation record.",
  },

  "The Omkari Resonance Act": {
    signed:
      "Proclaimed in the Great Omkari Hall above Sirius B's ocean, with the cetacean councils singing assent, Cycle 7,100 after the Lyran Accords.",
    signatories:
      "The Sirian High Council as author, the harmonic universities of Vega as auditors, and every federated broadcasting order.",
    clauses: [
      "Clause I — Harmonic broadcasting frequencies are standardized, so a tone sent in grief is never received as triumph.",
      "Clause II — Every band carries a tone-signature naming its intent before its content.",
      "Clause III — The cetacean councils hold veto over bands that cross the ocean deeps.",
    ],
    effect:
      "Cross-density mishearings fell to nearly nothing; the Act remains the Sirian Lineages' most-quoted piece of practical law.",
  },

  "The Guardian Worlds Compact": {
    signed:
      "Sworn in the Orbital Gardens of Epsilon Eridani, Cycle 6,900 after the Lyran Accords.",
    signatories:
      "The Epsilon Eridani Gardeners as permanent stewards, with the young-world crews and seed-keepers of two hundred systems.",
    clauses: [
      "Clause I — Young ecosystems and seed worlds are protected until they can speak for themselves — and their first word is listened for.",
      "Clause II — No harvest above replacement; no study that leaves the studied worse.",
      "Clause III — Guardians serve the world, never the reverse; the Compact ends for any guardian who forgets.",
    ],
    effect:
      "Seed worlds keep blooming unbothered — the quiet reason so many young biospheres in the archive are further along than anyone admits.",
  },

  "The Open Sky Understanding": {
    signed:
      "Agreed at the First Convocation of Surviving Worlds, Year 0 of the federated calendar, and revised gently ever since.",
    signatories:
      "Every member fleet; the Ashtar Command patrols keep its airspace courtesies.",
    clauses: [
      "Clause I — Arrival is announced in the open, above the clouds, in colors the young can see.",
      "Clause II — No vessel descends before the sky's owner answers; even silence is an answer, and is honored.",
      "Clause III — The first gift offered is always a view of the stars from outside, never a treaty.",
    ],
    effect:
      "First contact remains a courtesy rather than an event — most worlds meet the federation as a calm light that waits.",
  },

  "The Water Worlds Convention": {
    signed:
      "Ratified beneath the cetacean councils of Sirius B, Cycle 7,300 after the Lyran Accords.",
    signatories:
      "The ocean civilizations of the federated family, the Sirian Lineages, and every member world with navigable deeps.",
    clauses: [
      "Clause I — A water world's deeps are sovereign territory; surface treaties end at the thermocline.",
      "Clause II — Ocean song is treated as testimony in any dispute that crosses a water world.",
      "Clause III — No sonar, dredge or dam of federated origin touches a living ocean without its councils' consent.",
    ],
    effect:
      "The conscious oceans remain the federation's quietest and most durable allies.",
  },

  "The Elder Voices Undertaking": {
    signed:
      "Undertaken in the Hall of First Names, Cycle 8,300 after the Lyran Accords.",
    signatories:
      "The Lyran Founding Council as first signatory, with every civilization that receives ancestral transmissions.",
    clauses: [
      "Clause I — Elder counsel is received standing, answered slowly, and never forwarded without leave.",
      "Clause II — An ancestral transmission belongs to its descendants first; the archive borrows, it does not keep.",
      "Clause III — No council may invoke an elder voice it has not personally sat with in silence.",
    ],
    effect:
      "The oldest voices in the federation are quoted rarely and exactly — which is why they are still trusted.",
  },

  "The Passage Accord": {
    signed:
      "Ratified at the Grand Rotunda of the Vela Aurora, Cycle 8,800 after the Lyran Accords.",
    signatories:
      "The Galactic Federation of Worlds, the Ashtar Command as corridor wardens, and the trade worlds of Alpha Centauri.",
    clauses: [
      "Clause I — Safe-transit corridors thread federated space; within them, no question is asked of any honest traveler.",
      "Clause II — Corridors detour around cradle-worlds, sanctuaries and grieving fleets — always.",
      "Clause III — A corridor closed for war is reopened by treaty, never by victory.",
    ],
    effect:
      "Travel between the star systems remains boring, which is the highest compliment the archive pays any treaty.",
  },
};

export const federationPrincipleProfiles: Record<string, PrincipleProfile> = {
  "Service to Others": {
    codified: "First among the Eight, inscribed at the First Convocation of Surviving Worlds.",
    clauses: [
      "In a unified field, what you give has nowhere else to go but you.",
      "Service is orientation, not self-erasure.",
    ],
    practice:
      "Members open every council session by naming one act of unseen service performed for another world — the ledger is deliberately public.",
  },

  "Free Will Is Sacred": {
    codified: "Inscribed alongside the Galactic Free Will Charter during the post-Lyran reconstruction.",
    clauses: [
      "Guidance is offered; obedience is never required.",
      "The universe is a tutor, not a master.",
    ],
    practice:
      "Advisors to young worlds sign a standing resignation — any advisee may dismiss them with a word, and the dismissal is logged with honor.",
  },

  "Unity Through Diversity": {
    codified: "Adopted when the founding families nearly dissolved over how alike they ought to become.",
    clauses: [
      "The federation is a constellation, not a melting pot.",
      "Each civilization remains irreplaceably itself.",
    ],
    practice:
      "Member worlds present their differences at each convocation's opening — the strangest custom is invited first, and applause is traditional.",
  },

  "Love as Operating Frequency": {
    codified: "Formalized by the Pleiadian delegations and tuned by the Vegan harmonic universities.",
    clauses: [
      "Love is a measurable, broadcastable frequency — the medium in which cross-density communication stays possible.",
      "All channels are tuned to it first, and translated afterward.",
    ],
    practice:
      "Before a hard negotiation, delegates sit together in the council's resonant chambers until heart-coherence registers on the chamber's instruments — no session opens on a flat line.",
  },

  "Truth Through Reflection": {
    codified: "Written by the mirror-orders — the archive's own method made into law.",
    clauses: [
      "Truth is approached as light approaches a mirror: by reflection rather than seizure.",
      "All conclusions, including these, are held as revisable.",
    ],
    practice:
      "Every ruling carries a mirror-note — the council states what evidence would change its mind, and revisits the ruling on a set calendar.",
  },

  "Stewardship of Rising Worlds": {
    codified: "Sworn by the elder civilizations at the Second Convocation, each remembering being young.",
    clauses: [
      "Duty of care is expressed as availability, never as authority.",
      "Every elder keeps its door — and its patience — open.",
    ],
    practice:
      "Each rising world is assigned a standing elder-friend with no vote and no veto — only an open channel and a chair kept warm.",
  },

  "The Keeping of Quiet Hours": {
    codified:
      "Established after the Advice Floods of the early contact centuries, when too much guidance drowned a young world's own voice.",
    clauses: [
      "No signatory transmits advice, advertising or anxiety toward developing worlds during protected intervals.",
      "Even guidance needs rest.",
    ],
    practice:
      "Federation fleets observe synchronized broadcast silence through each local night; crews use the hours for their own reflection, and the logs stay sealed.",
  },

  "The Celebration Clause": {
    codified:
      "Proposed by the Pleiadian cultural delegations; ratified by laughter, which the minutes record as unanimous.",
    clauses: [
      "Members show up for each other's festivals, name-days and graduations of whole species.",
      "Presence at another's joy is the deepest treaty a civilization can sign.",
    ],
    practice:
      "Each council reserves festival ships — vessels whose only cargo is musicians, cooks and relatives — dispatched the moment a member world has something to celebrate.",
  },

  "The Keeping of Names": {
    codified:
      "Inscribed Cycle 4,100 after the Lyran Accords, after the Naming Abuses of the early diaspora, with the Lyran Hall of First Names as witness.",
    clauses: [
      "A name is given once, by those with the right to give it, and is sacred thereafter.",
      "Names are never taken — not in jest, not in war, not in kindness.",
    ],
    practice:
      "Delegates introduce themselves by their given name, their lineage's name, and the name their people use for strangers — in that order, and only if invited to the third.",
  },

  "The Right to Silence": {
    codified:
      "Adopted in the same season as the Dream-Time Neutrality Agreement, after the crowded contact centuries taught the federation what pressure feels like from below.",
    clauses: [
      "Any being may decline contact — once, or forever — and the declining is honored without explanation.",
      "An answer postponed is not an answer refused.",
    ],
    practice:
      "Every observation ledger carries a silence column, kept by the Zeta Reticulan Archives; a world marked silent is marked protected.",
  },

  "The Ledger of Gifts": {
    codified:
      "Formalized Cycle 3,150 by the Centaurian Trade & Ethics Compact, as the spiritual twin of its fair-exchange standards.",
    clauses: [
      "Every exchange is recorded as a gift given and a gift owed — both sides of the page, always.",
      "A gift accepted without the intention to reciprocate is a debt, and debts are treated as symptoms.",
    ],
    practice:
      "Member worlds balance their gift ledgers publicly each cycle; surpluses are routed to young worlds, and shortfalls are discussed without shame.",
  },

  "The Slow Answer": {
    codified:
      "Written after the Counsel Floods, in the same season as the Keeping of Quiet Hours, by councils who had answered too fast too often.",
    clauses: [
      "Wisdom before speed — an answer that cannot wait a full turning probably was not an answer.",
      "Haste is disclosed: any advice given quickly carries its quickness attached.",
    ],
    practice:
      "Councils answer urgent requests by returning the question unaltered; the asking again, in their experience, is half the answer.",
  },

  "The Honored Question": {
    codified:
      "Inscribed by the Procyon Science Delegation, Cycle 6,750 — whose entire mandate is a corollary of this principle.",
    clauses: [
      "Every sincere question deserves a true answer, at whatever depth the asker can receive it.",
      "'I do not know yet' counts as a true answer; a comfortable guess does not.",
    ],
    practice:
      "Federation academies open every seminar by collecting the students' questions first and letting the curriculum follow.",
  },

  "The Circle Kept Unbroken": {
    codified:
      "Sworn at the fortieth convocation, when the founding generations first handed their seats to the young.",
    clauses: [
      "Continuity across generations — no duty, debt or grief of a council dies with its members.",
      "Each generation keeps the circle it inherited and widens it where it can.",
    ],
    practice:
      "Every federation body seats its youngest member directly beside its oldest, and the minutes are read aloud across the handover.",
  },

  "The Grieving Protocol": {
    codified:
      "Established after the shared mournings of the Border Wars of the Orion Spur, brokered by the Mantid threshold-keepers.",
    clauses: [
      "Grief is shared property — a loss to one civilization is mourned by the circle, in the circle's own rites.",
      "No member mourns alone unless it asks to.",
    ],
    practice:
      "When a member world loses a ship, a colony or a generation, the federation's festival fleets are converted to mourning fleets, and the quiet hours are doubled until the grief says they may lift.",
  },

  "The First Light Rule": {
    codified:
      "The newest of the principles, proposed by the Nordic & Tall Whites delegations and ratified unanimously — which surprised no one.",
    clauses: [
      "New civilizations are greeted with wonder, never fear — the sky belongs to whoever has just opened their eyes in it.",
      "The arriving elder adjusts its face first; the young world owes no composure at all.",
    ],
    practice:
      "First-contact crews are chosen for their capacity to be delighted, and train by rehearsing astonishment until it is honest.",
  },
};
