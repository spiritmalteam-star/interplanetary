import type { ProfessionProfile, DomainProfile } from "@/lib/mirror-types";

/* Deep dossiers for the 12 astral profession domains and their 72 catalogued roles.
   Keys match profession names exactly as recorded in data/professions.ts. */

export const professionProfiles: Record<string, ProfessionProfile> = {
  /* ----------------------------- Healing Arts ---------------------------- */
  "Light-Body Surgeon": {
    mandate:
      "Repair the energetic architecture beneath the physical form before illness translates into matter.",
    pathway:
      "Training runs nine years in the Arcturian template colleges — first on lattice models, then on volunteers under supervision. Graduates are licensed by the Healing Arts Registry and re-certified each time the human template itself is revised.",
    toolkit: ["focused light currents", "template looms", "filament maps", "steady-hand stillness"],
    workplace:
      "Chambers of held light aboard sanctuary ships and in temple annexes; some work field-side at disaster nodes.",
    hazards:
      "Surgeons absorb echoes of the wounds they close, and compassion fatigue here is literal — the field itself can scar.",
    ring: "Ring IV",
    tenure: "Sixty-year certifications, renewable after a mandatory quiet sabbatical.",
    compensation:
      "The registry records each repair as a luminous thread in the surgeon's own template — a visible, wearable art.",
    alliedDomains: ["Light Technology", "Sound & Vibration"],
  },

  "Etheric Acupuncturist": {
    mandate:
      "Restore flow along the meridians of the aura where grief, shock or habit has dammed the rivers of the field.",
    pathway:
      "Apprenticeship begins with one's own meridians — students spend two years mapping themselves before touching another. Lineage certification follows in the Sirian tone-clinics, where needles of sound replace steel.",
    toolkit: ["crystalline filaments", "toned vowels", "meridian charts", "pulse-listening"],
    workplace:
      "Quiet clinics in temple districts, and traveling practices that follow the festival routes.",
    hazards:
      "A misplaced tone can entrench a blockage, and practitioners take on the emotional weather their patients shed.",
    ring: "Ring III",
    tenure: "Seasonal circuits of seven years, renewed by the practitioner's own field test.",
    compensation:
      "Practitioners keep every meridian song learned — a repertoire that deepens their own field for life.",
    alliedDomains: ["Sound & Vibration", "Temple, Ritual & Ceremony"],
  },

  "Trauma Alchemist": {
    mandate:
      "Sit with what happened until it consents to become fuel rather than weight, transmuting stored shock at the cellular level.",
    pathway:
      "The Arcturian colleges train alchemists across lifetimes — each apprentice walks their own great wound to its transmutation before guiding others. The final rite: holding the field for a stranger's worst hour, alone and unflinching.",
    toolkit: ["witnessed silence", "transmutation rays", "cellular listening", "the held hand"],
    workplace:
      "Sanctuary chambers, war-remembrance sites, and anywhere a world is ready to face its own history.",
    hazards:
      "The work exposes practitioners to the deepest archives of pain; without rigorous clearing, alchemists carry unprocessed centuries.",
    ring: "Ring V",
    tenure: "A lifelong vocation, punctuated by enforced sabbaticals every eleven years.",
    compensation:
      "Each transmutation adds to the alchemist's own wisdom-body — the one treasure that cannot be confiscated.",
    alliedDomains: ["Cosmic History & Records", "Dream & Astral Work"],
  },

  "Sound Healing Weaver": {
    mandate:
      "Re-tune organs and emotions with carrier frequencies so the body remembers its native chord.",
    pathway:
      "Weavers train at the Vega harmonic annexes, learning one hundred base tones and when each must be broken. Field apprenticeship follows, re-tuning everything from beehives to bereavement wards.",
    toolkit: ["carrier frequencies", "tuning bowls", "voice", "resonance forks"],
    workplace:
      "Hospitals of sound in temple districts; traveling weavers serve remote worlds from a single bell-cart.",
    hazards:
      "Overexposure to off-key fields leaves weavers with lasting tone-sensitivity that makes crowded cities painful.",
    ring: "Ring II",
    tenure: "Ten-year resonance contracts, reviewed after every thousand sessions.",
    compensation:
      "Guild archives keep a woven recording of every healing performed — the weaver's biography in chord form.",
    alliedDomains: ["Sound & Vibration", "Celestial Arts & Music"],
  },

  "Crystal Resonance Therapist": {
    mandate:
      "Match stone, light and intention to the patient's field, letting crystalline structure do what force cannot.",
    pathway:
      "Students spend three years in the crystal vaults learning stones by relationship rather than catalog, then certify through supervised placements. The deep specializations — grid-stones, template-stones, mourning-stones — take a decade more.",
    toolkit: ["graded quartz sets", "light-boxes", "field pendulums", "stone-silence"],
    workplace:
      "Sunlit therapy rotundas, mining settlements, and the quiet rooms where grid-workers convalesce.",
    hazards:
      "Mis-matched stones can amplify exactly what a patient needs released; ethics boards keep a long ledger of well-meant errors.",
    ring: "Ring II",
    tenure: "Twenty-year keeperships of a single vault, renewable once.",
    compensation:
      "Therapists may adopt one stone per decade of service — a companion for their own old age.",
    alliedDomains: ["Light Technology", "Planetary Stewardship"],
  },

  "Density Transition Midwife": {
    mandate:
      "Attend souls crossing between densities — at birth, death, ascension — keeping the passage warm and unafraid.",
    pathway:
      "Midwives first attend a hundred crossings as silent witnesses, then a hundred more under a senior's hand before taking their own cases. The Mantid observatories confer the final blessing in person.",
    toolkit: ["threshold lamps", "holding tones", "passage scripts", "unshakable calm"],
    workplace:
      "Birth-rooms, hospice lights, ascension chambers and the gates between worlds.",
    hazards:
      "Some crossings refuse comfort, and midwives must let a soul struggle without interfering — the discipline breaks many trainees.",
    ring: "Ring IV",
    tenure: "Three hundred crossings per commission, counted, never hurried.",
    compensation:
      "Every soul met at the gate remembers the midwife's voice; that same welcome awaits them in turn.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Dream & Astral Work"],
  },

  /* ---------------------------- Light Technology -------------------------- */
  "Plasma Lattice Engineer": {
    mandate:
      "Weave plasma into standing lattices that hold light where ships, temples and shields need it held.",
    pathway:
      "Engineers study lattice physics in the Arcturian design halls and serve two years on a living ship before touching a shield array. Licensing requires a lattice built to survive one honest storm.",
    toolkit: ["plasma looms", "field gauges", "lattice scores", "containment rings"],
    workplace:
      "Shipyards of light, temple spires, and the storm-decks where defenses are tested.",
    hazards:
      "A collapsing lattice discharges months of stored intent at once; engineers bear the scars of their own geometry.",
    ring: "Ring III",
    tenure: "Four-year storm-season contracts, renewed lattice by lattice.",
    compensation:
      "Engineers sign their lattices — a glow visible to every sensitive who later shelters beneath them.",
    alliedDomains: ["Healing Arts", "Cosmic Navigation"],
  },

  "Merkaba Architect": {
    mandate:
      "Design the counter-rotating light-vehicles that carry consciousness between stations of reality.",
    pathway:
      "Architects first learn to spin their own field before drafting another's — a discipline of some twelve years' daily rotation. Design licensure follows in the Sirian geometry courts, where every angle is sung.",
    toolkit: ["sacred-geometry rules", "spin calibrators", "meditation scaffolds", "gold-inlaid drafting plates"],
    workplace:
      "Geometry courts, ascension academies, and the quiet rooms where a person's light-vehicle is first assembled.",
    hazards:
      "A mis-spun merkaba can strand a traveler between stations; architects carry responsibility measured in soul-distance.",
    ring: "Ring IV",
    tenure: "One commission at a time, however long the traveler needs.",
    compensation:
      "Architects ride every vehicle they design — in consciousness, on the anniversary of its first safe landing.",
    alliedDomains: ["Cosmic Navigation", "Temple, Ritual & Ceremony"],
  },

  "Crystalline Core Programmer": {
    mandate:
      "Write the intent-lattices that give crystalline cores their purposes — memory, navigation, healing, holding.",
    pathway:
      "Programmers train in the Zeta Archive Ring's computing cloisters, learning to phrase intent so precisely that stone cannot mishear it. Certification requires a core that has run error-free for a full year.",
    toolkit: ["intent-phrasing keys", "resonance probes", "core templates", "debugging silence"],
    workplace:
      "Archive vaults, ship cores, and the planetary grid-nodes where a single phrase must last ten thousand years.",
    hazards:
      "A badly phrased intent can bloom for centuries; programmers learn humility one persistent miswrite at a time.",
    ring: "Ring III",
    tenure: "Century-long custodianships of a single core lineage.",
    compensation:
      "Programmers' phrasings are preserved with the cores they animate — words outliving their authors by design.",
    alliedDomains: ["Cosmic History & Records", "Genetic & Soul Architecture"],
  },

  "Holographic Archivist": {
    mandate:
      "Keep the walkable-light records of worlds and lives, ensuring every volume renders true and returns to its shelf.",
    pathway:
      "Archivists apprentice in the Zeta holographic halls, learning to walk a record without disturbing its ink of light. Full standing arrives when a rendered century is restored to fidelity without notes.",
    toolkit: ["rendering gauntlets", "shelf-tones", "fidelity lenses", "catalog bells"],
    workplace:
      "The record-halls of Zeta Reticuli, federation libraries, and traveling exhibit-domes that bring a century to a village.",
    hazards:
      "Some records render grief at full strength; archivists schedule their own days around the heavy volumes.",
    ring: "Ring II",
    tenure: "Shelf-tenure of forty years — the customary span of one keeper per wing.",
    compensation:
      "Archivists earn reading rights one wing at a time — a library card that grows for life.",
    alliedDomains: ["Cosmic History & Records", "Dream & Astral Work"],
  },

  "Gravity Loom Operator": {
    mandate:
      "Operate the great looms that fold space gently — carrying fleets, islands and occasionally a fleeing city across the dark.",
    pathway:
      "Operators rise from navigator ranks after distinguishing themselves in a dozen gravity-assist maneuvers, then train on the looms at Procyon's yard for five years. Certification is granted by the loom itself, which famously refuses poor hands.",
    toolkit: ["fold levers", "mass balances", "tide charts", "steady breath"],
    workplace:
      "Loom-decks at the edge of systems, freight spines, and the rescue lanes where seconds are weighed in worlds.",
    hazards:
      "A fold gone rough can shake a fleet apart; operators retire the day their hands stop being perfectly calm.",
    ring: "Ring V",
    tenure: "A standing watch of eleven years, ended by the loom's own quiet verdict.",
    compensation:
      "The guild keeps a bell for every safe fold, rung by the passengers who owed their arrival to it.",
    alliedDomains: ["Cosmic Navigation", "Light Technology"],
  },

  "Tone-Circuit Tuner": {
    mandate:
      "Keep the tonal circuits of ships, temples and grid-nodes in tune, so the light flows where the song says it should.",
    pathway:
      "Tuners train by ear in the Vegan annexes, humbling themselves through years of being tested on single notes. Circuit certification follows a year of field repairs under an old tuner's mute supervision.",
    toolkit: ["calibration forks", "circuit maps", "honed listening", "wax and patience"],
    workplace:
      "Engine decks, temple belfries, and the grid-shrines where one flat node darkens a district.",
    hazards:
      "Years of circuit-hum reshape a tuner's hearing; the guild's retirees all share a habit of humming answers before questions finish.",
    ring: "Ring II",
    tenure: "Route-tenure of six years per circuit family.",
    compensation:
      "Tuners keep the first instrument they ever brought back into tune, played at every guild festival.",
    alliedDomains: ["Sound & Vibration", "Planetary Stewardship"],
  },

  /* --------------------------- Cosmic Navigation -------------------------- */
  "Star Gate Pilot": {
    mandate:
      "Thread vessels through star gates at speeds where a heartbeat of error is a different constellation.",
    pathway:
      "Pilots begin as gate-tenders, reading the tide-tables of a single gate until its moods are memorized. Command comes after the trial run: nine transits in one waking day, unassisted.",
    toolkit: ["tide tables", "gate harmonics", "twin sticks", "the calm hand"],
    workplace:
      "Gate-plazas at the necks of trade lanes, and the pilot lofts where off-duty crews sleep within sound of the rings.",
    hazards:
      "Gate shear can strip a hull's memory; pilots who have been through it speak of it the way sailors speak of storms.",
    ring: "Ring IV",
    tenure: "Lane-tenure of nine years, renewable by fresh tide-certification.",
    compensation:
      "Pilots' names are cut into the gate-rings they master — visible to every ship that passes after them.",
    alliedDomains: ["Light Technology", "Diplomacy & Treaties"],
  },

  "Dream-Navigator": {
    mandate:
      "Chart and steer the shared dream-layers, guiding sleepers, fleets and pilgrims through the night's open country.",
    pathway:
      "Navigators train in the dream-temples of Sirius B, first learning to hold their own thread through a hundred lucid nights. Commission follows a solo crossing of the Bardo shallows and back.",
    toolkit: ["thread-anchors", "lucid signals", "layer maps", "waking bells"],
    workplace:
      "Sleep temples, ship dream-berths, and the night-stations where a world's dreams are monitored for weather.",
    hazards:
      "Navigators can lose their own thread among a thousand others; the guild keeps a room of recovered names.",
    ring: "Ring III",
    tenure: "Night-watches of five years, then a mandatory season of sleeping uncharted.",
    compensation:
      "Navigators' threads are woven into the guild's great dream-tapestry, each color a crossing kept safe.",
    alliedDomains: ["Dream & Astral Work", "Temple, Ritual & Ceremony"],
  },

  "Time Tide Cartographer": {
    mandate:
      "Map the currents of time — where hours pool, where decades run fast, and where the past still leaks.",
    pathway:
      "Cartographers train in the Andromedan off-hour academies, learning to hold two clocks in one mind without preferring either. Senior charts are countersigned by a council that checks them against events not yet happened.",
    toolkit: ["tide needles", "epoch rulers", "drift journals", "two-clock discipline"],
    workplace:
      "Chronometry stations at the galaxy's slow points, and the map-rooms where futures are drawn in pencil.",
    hazards:
      "Cartographers lose their own century now and then — the guild's pension is a return ticket to one's native decade.",
    ring: "Ring V",
    tenure: "Chart-tenure of one century, taken in seven-year survey seasons.",
    compensation:
      "Each cartographer's final chart is named for them, and navigators speak of it with something like weather-respect.",
    alliedDomains: ["Cosmic History & Records", "Exploration & First Contact"],
  },

  "Portal Attuner": {
    mandate:
      "Find, open and close the small passages — the doublings of space that move one traveler, one letter, one breath of spring.",
    pathway:
      "Attuners learn on the minor portals of garden worlds, practicing the listening that distinguishes a true door from a wish. Licensing requires closing, alone, one portal that did not want to stay shut.",
    toolkit: ["listening rods", "door-chimes", "consent phrases", "hinge-oil of sound"],
    workplace:
      "Way-stations, temple thresholds, and the wild edges where natural portals open with the seasons.",
    hazards:
      "A portal left ajar invites weather from elsewhere; attuners keep storm-journals of doors they were nearly late to.",
    ring: "Ring II",
    tenure: "Circuit-tenure of three years per region's minor doors.",
    compensation:
      "The guild records every door's first traveler; attuners collect the letters those travelers later send through.",
    alliedDomains: ["Exploration & First Contact", "Temple, Ritual & Ceremony"],
  },

  "Void Route Planner": {
    mandate:
      "Plot the long quiet ways between gates — the stretches where nothing answers and every calculation is a promise.",
    pathway:
      "Planners train in the Tau Ceti frontier institutes, where course-charting is taught as a craft of humility and spare parts. Certification requires delivering a real ship through a real silence without double-checking the stars twice.",
    toolkit: ["star almanacs", "fuel litanies", "silence protocols", "backup plans"],
    workplace:
      "Planning lofts above the trade lanes, and the long-commission ships where planners ride their own routes end to end.",
    hazards:
      "The void keeps grudges: planners who over-promise a route are remembered by the families who waited.",
    ring: "Ring III",
    tenure: "Route-tenure until the planner's own ship completes three safe round passages.",
    compensation:
      "Planners may name one quiet stretch of space — the guild's charts still carry the old, fond names.",
    alliedDomains: ["Exploration & First Contact", "Diplomacy & Treaties"],
  },

  "Fleet Formation Weaver": {
    mandate:
      "Compose the moving geometry of fleets — a hundred ships held as one thought across a battle or a celebration.",
    pathway:
      "Weavers come up through formation drill on training wings, then study the great choreographies — rescue, coronation, retreat — with the Andromedan maneuverists. A weaver's license is granted by the fleet one has moved, in assembly.",
    toolkit: ["formation scores", "thought-links", "drill flags", "the long view"],
    workplace:
      "Fleet decks during reviews and rescues; in peace-time, the parade lofts and the drill academies.",
    hazards:
      "Weavers feel every wing of the formation as their own body; a lost ship haunts the weaver's balance for years.",
    ring: "Ring IV",
    tenure: "A formation-season of one fleet generation, roughly twenty years.",
    compensation:
      "The formations a weaver composed are flown at their passing — the fleet's eulogy written in ships.",
    alliedDomains: ["Diplomacy & Treaties", "Celestial Arts & Music"],
  },

  /* ------------------------- Planetary Stewardship ------------------------ */
  "Biosphere Gardener": {
    mandate:
      "Tend whole living systems — soil, water, canopy and crowd — so a planet can health itself without supervision.",
    pathway:
      "Gardeners train in the Epsilon Eridani belt, rotating through a world's every climate before being trusted with any. Field certification comes when a patch they tended outlives their leaving, green and self-reliant.",
    toolkit: ["soil-sense", "seed chits", "weather patience", "community kitchens"],
    workplace:
      "Restoration zones, orbital greenhouses, and the long walks between one ailing valley and the next.",
    hazards:
      "Gardeners bury more seasons than they harvest; the work measures success in decades and disappoints in weather.",
    ring: "Ring II",
    tenure: "One biosphere per lifetime, by tradition; transfers only by council consent.",
    compensation:
      "The gardener's name is given to the first species that returns unaided — a small, immortal honor.",
    alliedDomains: ["Genetic & Soul Architecture", "Temple, Ritual & Ceremony"],
  },

  "Weather Choir Conductor": {
    mandate:
      "Conduct the sung negotiations between a planet's skies and its peoples, so that rain arrives as agreement rather than grievance.",
    pathway:
      "Conductors rise from choir service, having spent years singing the humble second-voice parts of a storm. The baton is granted after one full season conducted without a single resentful cloud.",
    toolkit: ["storm scores", "pitched rain-drums", "sky listening", "the patient downbeat"],
    workplace:
      "Hilltop choir-stones, drought districts, and the festival fields where weather is invited as guest of honor.",
    hazards:
      "A forced sky turns sulk; conductors who push weather for convenience are remembered in folklore as the reason it rained on the wedding.",
    ring: "Ring III",
    tenure: "Seasonal command, renewed by the sky's own reception — measured honestly.",
    compensation:
      "Conductors are granted one personal sky — a valley whose weather will always, within reason, oblige them.",
    alliedDomains: ["Sound & Vibration", "Healing Arts"],
  },

  "Elemental Diplomat": {
    mandate:
      "Negotiate between civilizations and the elemental courts — the devas and crews who actually build the rain, root and stone.",
    pathway:
      "Diplomats learn elemental protocol in the devic guild-halls, serving as messengers before earning a seat at any court. Standing is granted when a court addresses the diplomat by their office name, unasked.",
    toolkit: ["court manners", "offering baskets", "the old names", "wordless patience"],
    workplace:
      "Garden courts, mine mouthings, river parliaments — wherever human plans and elemental labor must agree.",
    hazards:
      "Elemental courts have long memories and short tempers; a diplomat's careless word can stall a harvest for a decade.",
    ring: "Ring III",
    tenure: "Court-tenure of nine years per element served.",
    compensation:
      "Elemental diplomats are buried, by their own request, in the places they negotiated — becoming part of the accord.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Healing Arts"],
  },

  "Seed Vault Keeper": {
    mandate:
      "Guard the germlines of a thousand worlds against war, weather and haste — the federation's promise that nothing living is lost twice.",
    pathway:
      "Keepers train in the Epsilon Eridani concords, learning every vault's litany of dormancies and waking songs. Appointment requires the candidate to have personally regrown one extinct strain, start to bloom.",
    toolkit: ["dormancy ledgers", "waking songs", "cold patience", "duplicate seals"],
    workplace:
      "The deep vaults — cold, quiet, and lit the color of early spring — and the delivery runs that carry seeds home.",
    hazards:
      "Keepers face the temptation to release what the world is not ready to receive; the vault's ethics boards exist for exactly that hour.",
    ring: "Ring III",
    tenure: "Twenty-year keeperships, passed with a sealed handover ritual.",
    compensation:
      "Each keeper may choose one strain to grow in their own garden — a living signature of their watch.",
    alliedDomains: ["Genetic & Soul Architecture", "Cosmic History & Records"],
  },

  "Ocean Memory Restorer": {
    mandate:
      "Re-lay the ocean's song-lanes and dissolve the knots in its memory where grief, dumping or war has scarred the deep.",
    pathway:
      "Restorers train with the cetacean councils of Sirius B and Earth, learning to listen at whale-depths for the places the song avoids. A restorer's certification is granted by a pod that chooses, unprompted, to sing with them.",
    toolkit: ["depth-listening", "song-lane charts", "descents", "salt patience"],
    workplace:
      "The open ocean, the trench stations, and the shore temples where the sea's troubles are reported.",
    hazards:
      "The deep holds griefs that surface as despair; restorers work in pairs and surface on schedule, always.",
    ring: "Ring IV",
    tenure: "Nine-year sea-tenure, punctuated by enforced shore seasons.",
    compensation:
      "Pods remember their restorers by name across generations — a whale-road welcome at any port.",
    alliedDomains: ["Sound & Vibration", "Dream & Astral Work"],
  },

  "Grid Stone Mason": {
    mandate:
      "Cut, place and re-seat the planetary grid-stones so the world's energetic body stays articulated and at ease.",
    pathway:
      "Masons apprentice to a single stone for seven years — learning its grain, its hum and its opinions — before placing their first node. The craft is certified by the stone's own response, which masons insist is unmistakable.",
    toolkit: ["chisels of tempered sound", "node maps", "dowsing lines", "stone patience"],
    workplace:
      "Sacred sites, mountain quarries, and the quiet jogs of landscape where a stone wants moving.",
    hazards:
      "Mis-seated stones can muddle a region's weather and dreams for years; masons carry their errors in local folklore.",
    ring: "Ring II",
    tenure: "Region-tenure of a mason's working life; stones outlive careers.",
    compensation:
      "A mason's best stone is known by their name among grid-walkers long after the mason's tracks fade.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Light Technology"],
  },

  /* --------------------- Genetic & Soul Architecture ---------------------- */
  "Soul Template Designer": {
    mandate:
      "Draft the original blueprints of souls — the gifts, trials and resonance of a life before it draws its first breath.",
    pathway:
      "Designers are chosen, not enrolled: the colleges accept candidates whose own template has survived unusual weather and turned it to wisdom. Training spans three incarnations' worth of study before a first solo design is countersigned.",
    toolkit: ["template looms", "gift balances", "trial curves", "the parental veto"],
    workplace:
      "The nurseries between lives — chambers of golden paper and patient light — and the review benches where parents-to-be consent.",
    hazards:
      "Designers carry the weight of every hard life they authored; the guild's counseling rooms are the oldest in the federation.",
    ring: "Ring V",
    tenure: "Design-tenure of a full epoch, with rest between great families.",
    compensation:
      "A designer meets, one by one through the years, the souls they drew — the guild calls this the harvest.",
    alliedDomains: ["Dream & Astral Work", "Cosmic History & Records"],
  },

  "Lineage Genealogist": {
    mandate:
      "Trace the braided histories of bloodlines across worlds, so every being can name the rivers that made them.",
    pathway:
      "Genealogists train in the Lyran Hall of First Names, learning to read a lineage in the grain of a hand and the vowels of a surname. Certification requires one braided line — say, Sirian and Pleiadian — resolved to its founding crossroads.",
    toolkit: ["lineage looms", "archive seals", "vowel memory", "courteous persistence"],
    workplace:
      "The Lyran records, federation registries, and the kitchen tables where families learn what their names remember.",
    hazards:
      "Lineages hold secrets as well as honors; genealogists are sworn to tell truths in the order a family can bear them.",
    ring: "Ring II",
    tenure: "Registry-tenure of thirty years per family line served.",
    compensation:
      "Genealogists are remembered as the answer to a family's oldest question — a strange and sturdy fame.",
    alliedDomains: ["Cosmic History & Records", "Diplomacy & Treaties"],
  },

  "Hybrid Integration Counselor": {
    mandate:
      "Walk beside beings of two lineages — chosen or inherited — until both inheritances can be held in one hand.",
    pathway:
      "Counselors are drawn from the hybrid families themselves wherever possible, completing both a Zeta-side and a human-side internship before certification. The final exam is a year of sitting with families whose stories are still painful.",
    toolkit: ["dual-language patience", "circle formats", "consent ledgers", "the long welcome"],
    workplace:
      "Integration houses on embassy rows, program-review halls, and the quiet rooms where a child asks the first hard question.",
    hazards:
      "Counselors absorb two worlds' worth of displacement; the guild mandates its own kind of sanctuary for its members.",
    ring: "Ring III",
    tenure: "House-tenure of six years, renewable with the families' consent.",
    compensation:
      "Counselors keep the letters of every family that wrote home from the middle of the bridge.",
    alliedDomains: ["Healing Arts", "Diplomacy & Treaties"],
  },

  "Akashic Editor": {
    mandate:
      "Correct the record where it was mis-said — tenderly, verifiably, and with the full consent of the living.",
    pathway:
      "Editors train under the Record Keepers' corrections desk, learning to distinguish a wound in the record from a wish about it. A red pen is granted only after an editor's first fifty retractions hold without appeal.",
    toolkit: ["verification lenses", "consent seals", "gentle phrasing", "the courage to retract"],
    workplace:
      "The akashic reading rooms, archive annexes, and the public squares where a correction must sometimes be read aloud.",
    hazards:
      "Editing history invites the temptation to improve it; editors who stray from correction into preference are struck from the desk forever.",
    ring: "Ring IV",
    tenure: "Desk-tenure of eleven years, reviewed volume by volume.",
    compensation:
      "Editors' corrections are signed in light only they can see — the record itself remembers who mended it.",
    alliedDomains: ["Cosmic History & Records", "Dream & Astral Work"],
  },

  "Light-Genome Weaver": {
    mandate:
      "Splice luminous instruction into the genome — granting a lineage new capacities without stealing its consent or its character.",
    pathway:
      "Weavers train in the genetic gardens of Epsilon Eridani under the Bio-Ethical Seeding Accord's strictest terms, serving ten years as consent-officers before touching a strand. Weaving licensure requires an uplift that ended, as designed, with the weaver's withdrawal.",
    toolkit: ["light spindles", "consent seals", "strain ledgers", "exit plans"],
    workplace:
      "Orbital greenhouses, gene-nurseries, and the review chambers where every proposed uplift is argued twice.",
    hazards:
      "A weaver's error sings for generations; the guild's walls carry the honest list of strains recalled.",
    ring: "Ring IV",
    tenure: "Weave-tenure of one lineage per generation — never two at once.",
    compensation:
      "Weavers' signature motifs appear, unbidden, in the art of the lineages they helped — a quiet, living royalty.",
    alliedDomains: ["Planetary Stewardship", "Healing Arts"],
  },

  "Incarnation Planner": {
    mandate:
      "Schedule the traffic of souls into worlds — matching who is ready, to where is needed, and when is wise.",
    pathway:
      "Planners study the great arrival ledgers in the soul nurseries, apprenticing to a single gate for a decade before booking their first crossing. Certification is granted when one of their scheduled arrivals, followed for life, grows into the assignment.",
    toolkit: ["arrival ledgers", "readiness gauges", "gate calendars", "compassion for traffic"],
    workplace:
      "The scheduling halls between lives — busy as harbors, quiet as libraries — and the birth-stations of a thousand worlds.",
    hazards:
      "Planners err in lives, not days; a mis-scheduled soul is a fifty-year apology in motion.",
    ring: "Ring III",
    tenure: "Gate-tenure of a century, taken with deep breaths.",
    compensation:
      "Planners are permitted, once, to schedule their own next arrival — the guild's most envied and dreaded privilege.",
    alliedDomains: ["Dream & Astral Work", "Cosmic History & Records"],
  },

  /* --------------------------- Dream & Astral Work ------------------------ */
  "Dream Healer": {
    mandate:
      "Enter the sleeping field of a patient and work where the wound actually lives — in the dream's weather, not the chart.",
    pathway:
      "Healers train in the sleep temples, first mastering their own dreams for three years before escorting another's. Certification follows a hundred accompanied nights without a single uninvited intervention.",
    toolkit: ["lucid consent", "image-grammar", "waking bells", "the soft question"],
    workplace:
      "Sleep-temple wards, hospice night-rooms, and the dream-clinics that open when the world's lights go down.",
    hazards:
      "Dreams defend themselves; healers who push where they were not invited wake with someone else's fear in their chest.",
    ring: "Ring II",
    tenure: "Night-tenure of four years, with mandatory day-lives between.",
    compensation:
      "Patients who healed remember their dream-healer in their own dreams for years — a repayment made in peace.",
    alliedDomains: ["Healing Arts", "Temple, Ritual & Ceremony"],
  },

  "Astral Cartographer": {
    mandate:
      "Survey the astral planes and publish the maps by which travelers, medics and pilgrims find their way in the subtle countries.",
    pathway:
      "Cartographers cross the near layers a thousand times before attempting the far ones, keeping survey journals in image-grammar. A map is licensed when three independent travelers return alive by it.",
    toolkit: ["survey satchels", "image-grammar pens", "return anchors", "boundary whistles"],
    workplace:
      "Survey camps at the astral edges, and the map-rooms where the subtle countries are argued into shapes.",
    hazards:
      "The astral rearranges to match its mapmakers; cartographers who fall in love with a region stop returning with data.",
    ring: "Ring III",
    tenure: "A survey-season of seven years per layer charted.",
    compensation:
      "Cartographers' names head the maps they drew — and lost travelers bless them at the printed margins.",
    alliedDomains: ["Cosmic Navigation", "Exploration & First Contact"],
  },

  "Bardo Companion": {
    mandate:
      "Walk with souls through the between — the luminous, disorienting country after death — until they can read their own road.",
    pathway:
      "Companions train in the Mantid observatories' between-schools, dying a small death nightly in disciplined practice for years. Commission follows one full accompaniment, witnessed, from last breath to first foothold.",
    toolkit: ["passage lamps", "the recited road", "fear-first aid", "name reminders"],
    workplace:
      "Deathbeds, battlefields, disaster zones — wherever the between opens without warning.",
    hazards:
      "Companions meet the raw fear of ending every working night; the order mandates dream-rest and communal meals without exception.",
    ring: "Ring IV",
    tenure: "One hundred accompaniments per commission, then a year among the living by choice.",
    compensation:
      "Companions are promised the same escort when their own between arrives — the order's oldest covenant.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Healing Arts"],
  },

  "Nightmare Negotiator": {
    mandate:
      "Mediate between sleepers and what haunts them — not banishing the dark, but learning what it is trying to say.",
    pathway:
      "Negotiators train in the dream-temples' difficult wards, studying the grammar of chase, fall and the thing at the door. Certification requires a nightmare resolved by consent, with the dreamer as co-signatory.",
    toolkit: ["parley phrasing", "fear-dialects", "exit doors", "daylight reports"],
    workplace:
      "Night-wards of the sleep temples, children's dormitories on colony worlds, and the nightmare clinics that keep odd hours.",
    hazards:
      "Some hauntings are memories wearing masks; negotiators learn to recognize real horror and to refer it, gently, onward.",
    ring: "Ring II",
    tenure: "Ward-tenure of three years — longer by special consent of the nightmares.",
    compensation:
      "Negotiators' parleys are added to the dream-temples' peace ledgers; former nightmares, it is said, keep the list kindly.",
    alliedDomains: ["Healing Arts", "Cosmic History & Records"],
  },

  "Sleep Temple Attendant": {
    mandate:
      "Keep the sleep temples running through the night — welcoming dreamers, minding the lamps, and guarding the ordinary miracles.",
    pathway:
      "Attendants are the tradition's first rung: a year of service learning the temple's rounds, the lamps, and the dignity of watching people sleep. Many go on to healing and navigation careers; some stay forever by preference.",
    toolkit: ["lamp keys", "guest registers", "quiet feet", "herbal teas"],
    workplace:
      "The temple dormitories and verandas of a thousand worlds, and the kitchens where night is welcomed with warm bread.",
    hazards:
      "The night shift is long and the visitors are subtle; attendants learn early to trust the lamp over the imagination.",
    ring: "Ring I",
    tenure: "Two-year rotations, renewable by a nod from the night prior.",
    compensation:
      "Attendants are paid in first pick of the temple gardens' dawn harvest and the deepest sleep on record.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Healing Arts"],
  },

  "Memory Dreamer": {
    mandate:
      "Recover what time misplaced by dreaming it whole again — the memories too heavy or too early for waking retrieval.",
    pathway:
      "Memory Dreamers are chosen for unusually faithful dream-recall, then trained in the akashic reading rooms to tell a recovered memory from a borrowed one. Certification requires ten recoveries confirmed against independent records.",
    toolkit: ["dream sifting", "era-dialects", "confirmation protocols", "the gentle return"],
    workplace:
      "The reading rooms' night annexes, historical inquiries, and the family archives where someone must remember for everyone.",
    hazards:
      "Recovered memory carries another's pain in the carrying; dreamers retire to long quiet after every heavy case.",
    ring: "Ring III",
    tenure: "Case-tenure of one memory at a time, however long it takes to return safely.",
    compensation:
      "Memory Dreamers' recoveries are cited in the corrected record with their names — the archive's version of authorship.",
    alliedDomains: ["Cosmic History & Records", "Healing Arts"],
  },

  /* ---------------------------- Sound & Vibration ------------------------- */
  "Planetary Tone Keeper": {
    mandate:
      "Hold a world's master tone — the deep note around which its grids, seasons and societies organize — and keep it from going flat.",
    pathway:
      "Keepers are selected by the tone itself: candidates sit the long listening until the planet's note sounds unmistakably through their one small voice. Training continues under the retiring keeper for a full turn of seasons before the handover hum.",
    toolkit: ["master-tone staff", "grid listening", "the standing hum", "weathered patience"],
    workplace:
      "Tone-shrines at the planet's nodes, and the long listening walks where a keeper checks the world's pitch against the sky.",
    hazards:
      "Keepers who impose rather than hold a tone can bend a whole region's mood; the shrine keeps a bell for each keeper who rang false.",
    ring: "Ring IV",
    tenure: "A keeper serves one world for one generation, no exceptions.",
    compensation:
      "The tone-keeper's own resting hum is said to match their planet's note forever after — a retirement written in resonance.",
    alliedDomains: ["Planetary Stewardship", "Temple, Ritual & Ceremony"],
  },

  "Harmonic Diplomat": {
    mandate:
      "Resolve disputes by re-tuning them — translating grievances into chords until the parties hear how they were meant to fit.",
    pathway:
      "Diplomats study at the Vega concordiums, learning both the mourning mode and the festival mode before touching a live dispute. Standing comes with the first argument that ended, audibly, in consonance.",
    toolkit: ["tuning forks", "chord charts of grievance", "the second voice", "silence between notes"],
    workplace:
      "Treaty halls, family estates, and the frontier posts where two flocks dispute one watering sky.",
    hazards:
      "Harmony achieved too early is only buried discord; diplomats who rush the resolution are credited in its relapse.",
    ring: "Ring III",
    tenure: "Dispute-tenure, held until the chord stands without the diplomat in the room.",
    compensation:
      "The concordium records each resolved chord with the diplomat's name as its third voice — a credit that outlives the treaty.",
    alliedDomains: ["Diplomacy & Treaties", "Celestial Arts & Music"],
  },

  "Mantra Engineer": {
    mandate:
      "Design the repeated phrases that hold minds, machines and temples in their best shape — syllables with load ratings.",
    pathway:
      "Engineers train in the Sirian tone-laboratories, stress-testing syllables until they know what each can carry and what it will crack under. Certification requires one mantra in daily use by ten thousand beings, still doing its work.",
    toolkit: ["syllable gauges", "repetition schedules", "breath counters", "dust and devotion"],
    workplace:
      "Tone-labs, temple works yards, and the ship-berths where crews chant a hull steady through hard passages.",
    hazards:
      "A poorly engineered mantra can hypnotize where it was meant to organize; engineers keep an archive of recalls they do not discuss.",
    ring: "Ring II",
    tenure: "Load-tenure of eight years per mantra family.",
    compensation:
      "Engineers hear their phrases on a million tongues — the guild considers this the only royalty worth holding.",
    alliedDomains: ["Light Technology", "Temple, Ritual & Ceremony"],
  },

  "Resonance Diver": {
    mandate:
      "Descend into the deep vibrational strata — below sound, below feeling — to find the source-note of a disturbance no one else can reach.",
    pathway:
      "Divers train by descending their own octave by octave, under escort, until their signature can survive the deepest rooms. Field certification follows a source-note recovered and re-tuned in open water or open grief.",
    toolkit: ["descent lines", "escort bells", "source-note snares", "the long exhale"],
    workplace:
      "Trenches, temple under-crofts, and the wounded places where a world hums wrong.",
    hazards:
      "The deep strata can keep a diver who stays past the escort's bell; every loss is carved at the trench-head.",
    ring: "Ring IV",
    tenure: "Three descents per season, never a fourth.",
    compensation:
      "Divers who retire whole are granted the rank of bell — honored escorts, and the first voice every new diver hears.",
    alliedDomains: ["Healing Arts", "Planetary Stewardship"],
  },

  "Songline Tracker": {
    mandate:
      "Follow the old song-paths across a world or an arm of the galaxy, keeping the verses mapped and the stops remembered.",
    pathway:
      "Trackers apprentice to a living songline, walking it end to end twice — once learning, once carrying the verses alone. Recognition comes when the line's elders accept the tracker's rendering as theirs.",
    toolkit: ["verse satchels", "waypoint marks", "feet and weather", "the faithful mouth"],
    workplace:
      "The long trails between sacred stops, and the way-stations where verse-keepers trade repairs and news.",
    hazards:
      "A verse lost is a way-station forgotten; trackers carry the weight of every skipped stop in the line's memory.",
    ring: "Ring III",
    tenure: "Line-tenure for life — songlines are not served twice.",
    compensation:
      "Trackers' names are sung into the line at the handover, verse by verse, by everyone who walks it after.",
    alliedDomains: ["Cosmic History & Records", "Planetary Stewardship"],
  },

  "Silence Carver": {
    mandate:
      "Cut and keep the great silences — the held absences in which beings hear themselves think — and defend them from noise dressed as need.",
    pathway:
      "Carvers serve years as noise-wardens before being trusted with a silence, learning first what sound is for. The craft's certification is conferred inside a carved quiet, witnessed by no sound at all.",
    toolkit: ["boundary markers", "noise ledgers", "the sealed hour", "unhurried hands"],
    workplace:
      "The sanctum reserves of temple worlds, the quiet zones of hospitals and fleets, and one's own well-kept room.",
    hazards:
      "Carvers can grow possessive of quiet, mistaking their craft for the silence itself — the order's one named vice.",
    ring: "Ring V",
    tenure: "One silence per lifetime, guarded from cutting to release.",
    compensation:
      "At the end, a carver releases their silence to the world — the guild's only ceremony, and its loudest.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Healing Arts"],
  },

  /* ------------------------ Cosmic History & Records ---------------------- */
  "Akashic Librarian": {
    mandate:
      "Lend the living record to sincere readers and get every volume back — indexed, whole, and honest.",
    pathway:
      "Librarians train in the akashic reading rooms, shelving before they recommend and reading before they retrieve. A desk is granted when the candidate's first hundred consultations comfort, clarify and ask something of their readers.",
    toolkit: ["catalog chords", "reading-room keys", "retrieval threads", "the overdue bell"],
    workplace:
      "The infinite stacks and their finite annexes, plus the night desks where urgent lives request their own files.",
    hazards:
      "Some volumes read their readers back; librarians are rotated off the heavy stacks on schedule, whether or not they agree.",
    ring: "Ring III",
    tenure: "Desk-tenure of a human-span twenty years, renewable by the readers' review.",
    compensation:
      "Librarians may read any volume but their own — the trade every keeper of the record learns to love.",
    alliedDomains: ["Dream & Astral Work", "Diplomacy & Treaties"],
  },

  "Stellar Archaeologist": {
    mandate:
      "Read worlds the way archives read ink — digging through strata of stone, orbit and starlight for the civilizations that forgot themselves.",
    pathway:
      "Archaeologists serve survey seasons on dead worlds, learning to let a planet's silence do the talking. Field standing comes with one honored find — a site read so carefully the descendants wept.",
    toolkit: ["strata brushes", "orbit-echo readers", "sample votives", "grave manners"],
    workplace:
      "Excavation camps under quiet suns, museum vaults, and the archive wings where broken things are re-housed.",
    hazards:
      "Digging up a grief can reopen it in the living; archaeologists pause at every find to ask permission of the descendants.",
    ring: "Ring II",
    tenure: "Dig-tenure of six field seasons, then a teaching year.",
    compensation:
      "Archaeologists' sites are named for the civilization found, with the finder's name in small — as they all prefer.",
    alliedDomains: ["Cosmic History & Records", "Exploration & First Contact"],
  },

  "Myth Translator": {
    mandate:
      "Carry the old stories across species and centuries intact — translating the container without spilling the meaning.",
    pathway:
      "Translators grow up multilingual in the deep sense: trained in symbol, gesture and the music beneath both. Certification follows the rendering of one founding myth for a species that had never heard it and recognized itself instantly.",
    toolkit: ["symbol lexicons", "gesture grammars", "story-bones", "the honest ear"],
    workplace:
      "Embassy salons, festival fires, and the translation houses where a galaxy's epics wait their turn.",
    hazards:
      "A myth badly rendered wounds worse than silence; translators carry the corrections of their early years like scars.",
    ring: "Ring II",
    tenure: "Story-tenure of one epic at a time — some take thirty years.",
    compensation:
      "Translators' renderings enter the festival cycles of other worlds — the afterlife every translator wants.",
    alliedDomains: ["Diplomacy & Treaties", "Celestial Arts & Music"],
  },

  "Timeline Conservator": {
    mandate:
      "Keep the great corridors of a world's history from fraying — mending breaks where trauma, propaganda or haste has torn the thread.",
    pathway:
      "Conservators train under the Time Tide Cartographers, learning where history runs thin and why it tears. A conservator's license follows one repaired century that later generations could walk without stumbling.",
    toolkit: ["thread needles of light", "era-dyes", "stabilizer hymns", "the long view"],
    workplace:
      "The archive's timeline halls, wounded historic sites, and the councils where a people argues with its own past.",
    hazards:
      "Conservators are tempted to straighten what they mend; the order's ledger records every well-meant improvement as damage.",
    ring: "Ring IV",
    tenure: "Century-tenure — one corridor, mended slowly, for a working life.",
    compensation:
      "Conservators' mends are invisible by design; the guild's honor roll is kept, fittingly, nowhere anyone can point to.",
    alliedDomains: ["Cosmic History & Records", "Diplomacy & Treaties"],
  },

  "War Remembrance Keeper": {
    mandate:
      "Hold the memory of the galaxy's wars honestly — so that what was learned is kept, what was lost is grieved, and neither is repeated for drama.",
    pathway:
      "Keepers serve first at the remembrance sites, keeping the lamps and hearing the veterans of a hundred conflicts. A keeper's commission is granted by consensus of the grieving — no one applies.",
    toolkit: ["remembrance lamps", "veteran registers", "the unflinching record", "grief liturgies"],
    workplace:
      "The war-remembrance sites and their traveling ceremonies, plus the councils where peace is being drafted too fast.",
    hazards:
      "Keepers swim in old grief daily; the order mandates paired service and forbids working a site alone.",
    ring: "Ring III",
    tenure: "Site-tenure of nine years, then a mandatory year of gardens.",
    compensation:
      "Keepers are remembered at every site they kept — a lamp lit at their passing by every name in their registers.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Healing Arts"],
  },

  "First Contact Chronicler": {
    mandate:
      "Record the meetings of species as they happen — the account that both sides will live inside for the next ten thousand years.",
    pathway:
      "Chroniclers train in the observer schools under the Zeta Ring's records masters, learning to write what happened without writing what it means. A chronicler's standing begins with their first published record surviving both parties' review.",
    toolkit: ["observation protocols", "two-sided ledgers", "field quills", "the honest pause"],
    workplace:
      "Contact ships, landing fields, and the listening posts where a first meeting is watched like weather.",
    hazards:
      "Chroniclers shape history merely by choosing what to note; the discipline's great rule is that meaning is the reader's risk.",
    ring: "Ring II",
    tenure: "Contact-tenure of one first meeting to its tenth anniversary, then the long edit.",
    compensation:
      "Chroniclers' records become the first page of two civilizations' shared story — the archivist's version of parenthood.",
    alliedDomains: ["Exploration & First Contact", "Diplomacy & Treaties"],
  },

  /* -------------------------- Diplomacy & Treaties ------------------------ */
  "Interspecies Mediator": {
    mandate:
      "Sit between parties who cannot hear each other and translate until the dispute is smaller than the relationship.",
    pathway:
      "Mediators train in the embassy houses, cycling through placements with species whose senses barely overlap. Certification follows one resolved dispute between parties who began in honest loathing.",
    toolkit: ["sense-bridging", "caucus circles", "the third option", "a stomach of steel"],
    workplace:
      "Neutral stations, border posts, and the trade fairs where tempers run on cargo schedules.",
    hazards:
      "Mediators absorb the mistrust of both sides at once; the guild mandates a week of silence after every hard case.",
    ring: "Ring III",
    tenure: "Case-tenure until both parties sign — some files outlive their mediators.",
    compensation:
      "Mediators' names are kept on the treaties they midwifed, spoken at every renewal like fond grandparents.",
    alliedDomains: ["Exploration & First Contact", "Cosmic History & Records"],
  },

  "Treaty Scribe": {
    mandate:
      "Write the agreements of civilizations in language that survives translation, treachery and time.",
    pathway:
      "Scribes train in the Vegan Tuning Hall, where every draft is read aloud in four harmonics to test its grain. Certification follows one clause of theirs holding, unamended, across a full generation of signatories.",
    toolkit: ["four-harmonic drafting", "clause archives", "sealing wax of light", "the long memory"],
    workplace:
      "Treaty chambers and their quiet anterooms, where the fate of worlds waits on a subordinate clause.",
    hazards:
      "Scribes bear the weight of every ambiguity; the guild's museum displays treaties that failed by one misplaced comma.",
    ring: "Ring II",
    tenure: "Chamber-tenure of twelve years, then the teaching desk.",
    compensation:
      "Scribes sign treaties in the smallest hand on the page — a modesty the archive finds more durable than monuments.",
    alliedDomains: ["Cosmic History & Records", "Sound & Vibration"],
  },

  "Observer Envoy": {
    mandate:
      "Represent the federation's eyes on worlds in awakening — present, respectful, and forbidden to advise unless asked.",
    pathway:
      "Envoys serve under the Earth Observer Protocol's courtesy rules, trained first in the hard discipline of watching without steering. Posting follows a probation of silence — one full cycle among a young world, uncredited.",
    toolkit: ["courtesy protocols", "observer credentials", "the held tongue", "open eyes"],
    workplace:
      "Residences discreetly kept among awakening worlds, and the observer ships that never land.",
    hazards:
      "The hardest posting in diplomacy is help that must wait; envoys keep journals of every moment they did not intervene.",
    ring: "Ring II",
    tenure: "Observation-tenure of one world-cycle, renewable only by the observed world's implicit welcome.",
    compensation:
      "Envoys are permitted, at posting's end, to introduce themselves truly — the moment their whole service prepares.",
    alliedDomains: ["Exploration & First Contact", "Temple, Ritual & Ceremony"],
  },

  "First Contact Choreographer": {
    mandate:
      "Design the first meetings of species — the hour, the place, the gesture — so that history begins as welcome rather than accident.",
    pathway:
      "Choreographers rise through the observer and mediation ranks, then study the great meetings — the ones remembered fondly — with the Andromedan perspective-masters. The craft's highest license is granted by the species being met, who must consent to being designed for.",
    toolkit: ["meeting scores", "gesture libraries", "fear forecasts", "the perfect hour"],
    workplace:
      "Contact staging stations, and the quiet planning rooms where a hello is rehearsed for a decade.",
    hazards:
      "A choreographer scripts the most self-conscious hour in two species' histories; error here echoes for millennia.",
    ring: "Ring V",
    tenure: "One first contact per decade — the guild refuses faster art.",
    compensation:
      "Choreographers attend, unnamed, every anniversary of the meetings they designed — the audience their craft lives for.",
    alliedDomains: ["Exploration & First Contact", "Temple, Ritual & Ceremony"],
  },

  "Free Will Auditor": {
    mandate:
      "Inspect the federation's own conduct for engineered consent — the subtle bribes, the arranged scarcity, the help that steers.",
    pathway:
      "Auditors are trained in adverse interest: recruited from law, history and the former subjects of uplift programs. Certification requires surviving one audit of one's own founding institution.",
    toolkit: ["consent ledgers", "incentive maps", "the difficult question", "unbuyable independence"],
    workplace:
      "Wherever the federation acts — program offices, fleet commands, academy admissions — and the hearing rooms that follow.",
    hazards:
      "Auditors are unpopular by design and isolated by statute; the office rotates its people before the loneliness sets roots.",
    ring: "Ring IV",
    tenure: "Audit-tenure of five years, non-renewable in the same jurisdiction.",
    compensation:
      "Auditors' findings are published under their names, unedited — the rarest compensation in the service.",
    alliedDomains: ["Diplomacy & Treaties", "Cosmic History & Records"],
  },

  "Council of Nine Liaison": {
    mandate:
      "Serve as the standing channel between the federated bodies and the Council of Nine — the deliberative assembly few can hear and fewer may address.",
    pathway:
      "Liaisons are raised in the Saturn traditions, schooled in round-table protocol from childhood and tested for the steadiness the chamber's presence requires. Appointment is by the Nine's own answer — no other nomination counts.",
    toolkit: ["chamber etiquette", "transcription stillness", "the questions worth asking", "calibrated humility"],
    workplace:
      "The Saturn council chamber and its antechambers of light, plus the federation forums where a Nine's ruling must be read out.",
    hazards:
      "Liaisons speak for an assembly they cannot fully understand; the office's discipline is to carry the words without owning the meaning.",
    ring: "Ring V",
    tenure: "Service of one great question at a time — some liaisons serve one question for life.",
    compensation:
      "Liaisons keep no archive of their office; the Nine themselves remember, and that is held to be enough.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Cosmic History & Records"],
  },

  /* ------------------------- Celestial Arts & Music ----------------------- */
  "Nebula Painter": {
    mandate:
      "Compose in the medium of nebulae — seeding dust and light into forms that will finish their sentence ten thousand years from now.",
    pathway:
      "Painters study light-scattering in the Procyon studios and patronage ethics in the Vegan schools, since a nebula is borrowed, never owned. First gallery show: a star nursery, opened by its own ignition.",
    toolkit: ["dust brushes", "spectrum palettes", "ignition timings", "the long gaze"],
    workplace:
      "Studio ships at the edge of star nurseries, and the exhibition routes where viewers drift for light-years to see a finish.",
    hazards:
      "Painters work with forces that do not take direction twice; the guild's wall of honorable failures is enormous and beloved.",
    ring: "Ring II",
    tenure: "Commission-tenure of one nebula per lifetime — no artist paints two.",
    compensation:
      "Painters are remembered by the names pilgrims give their nebulae, usually nothing like the ones intended.",
    alliedDomains: ["Light Technology", "Temple, Ritual & Ceremony"],
  },

  "Orbital Choir Conductor": {
    mandate:
      "Conduct choirs whose voices are stations, moons and ships — architecture singing in harmony above a world.",
    pathway:
      "Conductors rise through planetary choirs, then train in orbital acoustics at the Vega annexes, learning to beat-time across distances that eat tempo. Debut requires a full performance with no member of the choir in line of sight of another.",
    toolkit: ["light-tempo batons", "orbital scores", "lag calculators", "the patient ear"],
    workplace:
      "Orbital stations and their rehearsal rings, with performances that redraw a hemisphere's evening plans.",
    hazards:
      "A lag miscalculation turns a chord into a chase; conductors rehearse disasters more often than debuts.",
    ring: "Ring III",
    tenure: "Season-tenure of one orbit — conductors are renewed, or not, by acclamation of the choir.",
    compensation:
      "Conductors keep the first downbeat of every debut — the guild preserves them in a hall that is always, faintly, humming.",
    alliedDomains: ["Sound & Vibration", "Light Technology"],
  },

  "Aurora Dancer": {
    mandate:
      "Dance the solar wind as it meets a world's field — translating a storm's arrival into movement that calms rather than alarms.",
    pathway:
      "Dancers train in the polar academies, learning to read field-lines with the skin before reading them with instruments. First performance: a small storm, danced alone, witnessed by a village that needed not to fear it.",
    toolkit: ["field-sheets", "solar-wind timing", "ribboned costumes", "weathered boots"],
    workplace:
      "The high latitudes and their long winter nights, plus the storm tours that follow solar weather south.",
    hazards:
      "Dancing a real storm means dancing real electricity; the academies' memorial wall is modest, and every name on it volunteered.",
    ring: "Ring I",
    tenure: "Storm-seasons of three years, renewable as long as the reflexes hold.",
    compensation:
      "Dancers are remembered in the weather-lore of every village they steadied — a folklore pension paid in retellings.",
    alliedDomains: ["Sound & Vibration", "Planetary Stewardship"],
  },

  "Memory Sculptor": {
    mandate:
      "Carve remembrance into forms a community can live with — grief, gratitude and history given a shape that does not intrude.",
    pathway:
      "Sculptors train in the remembrance schools beside the War Remembrance Keepers, learning the weight a stone can honestly carry. Standing follows one memorial that the grieving visited freely and the indifferent ignored politely.",
    toolkit: ["remembrance stone", "light-chisels", "grief drafts", "the listening chisel"],
    workplace:
      "Memorial sites, victory squares that need correcting, and the quarries where the right stone waits.",
    hazards:
      "Sculptors who impose their own grief on a community build monuments to themselves; the schools teach refusal early.",
    ring: "Ring III",
    tenure: "One memorial per commission, however many years it asks.",
    compensation:
      "Sculptors' works are maintained by the communities they serve, swept and flowered, for as long as the grief needs tending.",
    alliedDomains: ["Cosmic History & Records", "Temple, Ritual & Ceremony"],
  },

  "Starlight Photographer": {
    mandate:
      "Capture what the archive needs remembered — arrivals, departures, the light of a world on its ordinary afternoons.",
    pathway:
      "Photographers train in the observer schools' image-craft wing, learning to be forgotten at the edge of the frame. A journeyman's license follows one image admitted to the federation's permanent record.",
    toolkit: ["light-boxes", "long lenses", "the waiting cloth", "caption honesty"],
    workplace:
      "Everywhere the archive's eye must go — landing fields, festival squares, the quiet surfaces where history stands still.",
    hazards:
      "Photographers trade presence for record; the guild's counseling rooms are full of people who saw everything through glass.",
    ring: "Ring I",
    tenure: "Assignment-tenure of two years per posting, then a mandatory month of unmediated living.",
    compensation:
      "Photographers' best plates hang in the federation's halls credited only to 'the observer present' — modesty as legacy.",
    alliedDomains: ["Exploration & First Contact", "Cosmic History & Records"],
  },

  "Festival Architect": {
    mandate:
      "Build the occasions that bind a civilization — the festivals, openings and homecomings that treaties cannot schedule but life requires.",
    pathway:
      "Architects train across the celebration trades — kitchens, fireworks, seating, grief — because a real festival carries all four. A name is made with one festival adopted by its city as annual, permanent and loved.",
    toolkit: ["crowd weaves", "light-work plans", "kitchen logistics", "the generous margin"],
    workplace:
      "Festival grounds in every season, and the planning lofts that smell, year-round, of sawdust and sugar.",
    hazards:
      "Festivals concentrate hope; an architect's failure is felt by a whole city's morning after.",
    ring: "Ring II",
    tenure: "City-tenure of five years per festival cycle.",
    compensation:
      "Architects' festivals are kept in civic calendars under their names — the only monument that returns every year.",
    alliedDomains: ["Celestial Arts & Music", "Temple, Ritual & Ceremony"],
  },

  /* ---------------------- Exploration & First Contact --------------------- */
  "First Contact Specialist": {
    mandate:
      "Stand in the doorway where two species meet and make the first hour honest, survivable, and survivable again the next day.",
    pathway:
      "Specialists cycle through observer, mediation and chronicle postings before taking the contact track, then drill the great failure cases with the Andromedan masters. Certification follows a live first meeting conducted without a single protocol breach.",
    toolkit: ["consent protocols", "fear gauges", "gesture kits", "the calm second"],
    workplace:
      "Contact staging stations and the landing fields where history stands on one sentence.",
    hazards:
      "Specialists carry responsibility no training fully prepares; the guild's retired members all mention the same sleepless decade.",
    ring: "Ring IV",
    tenure: "One contact per assignment, with a full season between.",
    compensation:
      "Specialists are recorded in both species' first-contact archives — twice remembered, twice accountable.",
    alliedDomains: ["Diplomacy & Treaties", "Cosmic History & Records"],
  },

  "Xeno-Linguist of Tones": {
    mandate:
      "Learn a species' language from its silences and its songs, then build the bridge both sides can walk.",
    pathway:
      "Linguists immerse for years in a species' sound-world before attempting a single translation, per the Vega method. Certification requires a conversation held entirely in the other's grammar, understood by its grandmothers.",
    toolkit: ["tone spectrographs", "immersion protocols", "gesture grammars", "the humble notebook"],
    workplace:
      "Language immersion camps at the edges of contact zones, and the translation houses where first words are drafted.",
    hazards:
      "Linguists can lose their own mother tongue to deep immersion; the guild schedules home-language seasons by law.",
    ring: "Ring III",
    tenure: "Language-tenure of one immersion per decade.",
    compensation:
      "Linguists' grammars are taught to both species' children — the bridge has the builder's name on the third page, unassuming.",
    alliedDomains: ["Sound & Vibration", "Diplomacy & Treaties"],
  },

  "Consent Protocol Officer": {
    mandate:
      "Guard the threshold of permission in every contact operation — no visit, sample or survey without a yes that was free, informed and sober.",
    pathway:
      "Officers train in adverse scrutiny under the Free Will Auditors, then in field ethics with the observer corps. Commission requires declining one order — any order — on consent grounds, and being upheld.",
    toolkit: ["consent ledgers", "influence gauges", "the sacred no", "withdrawal plans"],
    workplace:
      "Contact operations, survey fleets, and the review chambers where every yes is re-examined twice.",
    hazards:
      "Officers stop missions, and stopped missions have budgets; the office survives on statute, spine and the federation's better angels.",
    ring: "Ring IV",
    tenure: "Operation-tenure of three years per fleet, then rotation out of the chain of command.",
    compensation:
      "Officers' refusals are taught in the academies with their names attached — a pedagogy of courage, renewable forever.",
    alliedDomains: ["Diplomacy & Treaties", "Temple, Ritual & Ceremony"],
  },

  "Frontier Ecosystem Scout": {
    mandate:
      "Walk the unlived-in places first — reading soil, sky and song for what a frontier can bear before anyone builds on it.",
    pathway:
      "Scouts apprentice with the Tau Ceti trail-services, learning the discipline of leaving no trace and taking no souvenir. A scout's standing is earned one first crossing, honestly reported, at a time.",
    toolkit: ["field kits", "songline readers", "the light pack", "restraint"],
    workplace:
      "The map's blank quarters — river heads, high passes, the deep bush — and the report desks where names get decided.",
    hazards:
      "Scouts meet a world's honest dangers alone; the trail-services' cairns mark the ones who reported back anyway.",
    ring: "Ring II",
    tenure: "Trail-tenure of four seasons, then a mandatory teaching year.",
    compensation:
      "Scouts name the features they find — passes, falls, valleys — with names the guild insists be offered, not owned.",
    alliedDomains: ["Planetary Stewardship", "Cosmic Navigation"],
  },

  "Contact Historian": {
    mandate:
      "Keep the long view of first contacts — which meetings flourished, which failed, and what the difference cost.",
    pathway:
      "Historians train in the archive's contact wing, reading the chroniclers' raw records against what memory made of them. Standing follows one revision accepted by both species involved — history amended with the wounded party's blessing.",
    toolkit: ["raw-record readers", "memory-versus-record method", "bilingual archives", "the long spoon"],
    workplace:
      "The archive's contact wing, and the anniversary ceremonies where old mistakes are read aloud on purpose.",
    hazards:
      "Contact history is political property; historians who publish inconvenient records need the spine the tenure is designed to protect.",
    ring: "Ring II",
    tenure: "Wing-tenure of fifteen years, protected from removal by any single council.",
    compensation:
      "Historians' corrections are read at the anniversaries — the profession's repayment is a better-woven shared story.",
    alliedDomains: ["Cosmic History & Records", "Diplomacy & Treaties"],
  },

  "Ambassador of Small Beginnings": {
    mandate:
      "Carry the smallest exchanges between worlds — the first trade of seeds, the first student exchange, the first shared song — where grand embassies would only embarrass.",
    pathway:
      "Ambassadors begin as exchange students and festival guests, learning how much trust a cup of tea can carry. The title follows one small exchange that quietly outgrew its planners.",
    toolkit: ["gift protocol", "tea ceremony", "the light agenda", "good shoes"],
    workplace:
      "Village squares, school halls, and the back channels where real relationships actually form.",
    hazards:
      "Small beginnings are easily claimed by large offices; the role's discipline is declining the microphone.",
    ring: "Ring I",
    tenure: "Exchange-tenure of one beginning, seen to its second year.",
    compensation:
      "Ambassadors of Small Beginnings are remembered in the introductions of every exchange they started — 'the one who brought us the first seeds.'",
    alliedDomains: ["Diplomacy & Treaties", "Temple, Ritual & Ceremony"],
  },

  /* ----------------------- Temple, Ritual & Ceremony ---------------------- */
  "Density Transition Officiant": {
    mandate:
      "Officiate the ceremonies of passage between densities — for individuals, temples, and whole worlds stepping up.",
    pathway:
      "Officiants serve first as midwife-assistants and vigil-keepers, learning the liturgies of crossing in the field. Ordination follows one world-transition celebrated in full, from grief to graduation, without a false note.",
    toolkit: ["passage liturgies", "threshold oils", "the standing tone", "grave joy"],
    workplace:
      "Ascension chambers, gate-shrines, and the temple squares where a world's next step is announced.",
    hazards:
      "Officiants must hold joy at funerals and gravity at births; the liturgy's emotional inversion tests every candidate's balance.",
    ring: "Ring III",
    tenure: "Cycle-tenure of nine years per temple served.",
    compensation:
      "Officiants are granted the rite they most love at their own passing, performed by every temple they ever served.",
    alliedDomains: ["Healing Arts", "Sound & Vibration"],
  },

  "Grid Harmonics Cantor": {
    mandate:
      "Sing the grid-nodes into coherence — the voice that helps stones remember the chord they were placed to hold.",
    pathway:
      "Cantors train in the cathedral schools of the grid-lines, matching their range to a node-family over years of dawn practice. Investiture follows one node brought home by voice alone, witnessed by the masons who placed it.",
    toolkit: ["the disciplined voice", "node hymnals", "dawn timing", "warm honey and silence"],
    workplace:
      "Grid-shrines at first light, temple spires, and the outdoor stations where cantors sing weather into cooperation.",
    hazards:
      "Years of node-work leave cantors' voices tuned to the planet rather than to conversation; the order counts this a fair trade.",
    ring: "Ring II",
    tenure: "Node-tenure of seven years per shrine.",
    compensation:
      "Cantors are sung to, at their retirement, by every shrine they served — one verse each, in the old harmonies.",
    alliedDomains: ["Sound & Vibration", "Planetary Stewardship"],
  },

  "Ceremonial Fire Keeper": {
    mandate:
      "Keep the ceremonial fires — from the temple beacons to the small flames of grief and beginnings — fed, respected and alive.",
    pathway:
      "Keepers start at the humblest hearths, learning the fire's moods through a year of night watches. Recognition comes when a flame they kept for a stranger's vigil is remembered by the family years after.",
    toolkit: ["tending irons", "the sacred woods list", "night vigil", "patient hands"],
    workplace:
      "Temple fire-shrines, vigil grounds, and the wayside fires where travelers warm their questions.",
    hazards:
      "Fire respects the attentive and tests the proud; the keepers' guild keeps its safety liturgies as sacred as its ceremonies.",
    ring: "Ring I",
    tenure: "Hearth-tenure of two years per flame, renewable by the fire's own good humor.",
    compensation:
      "Keepers carry spark-rights for life — the honor of lighting every fire they attend, first and forever.",
    alliedDomains: ["Planetary Stewardship", "Healing Arts"],
  },

  "Rite Designer for New Species": {
    mandate:
      "Compose the ceremonies a new species will need — first birth, first grief, first harvest, first leaving — before the need arrives.",
    pathway:
      "Designers study with the Myth Translators and the First Contact Choreographers, then live among young species as quiet guests. A designer's work is ratified not by councils but by the species itself, generations later, calling the rite 'ours.'",
    toolkit: ["rite scores", "symbol workshops", "the long rehearsal", "cultural humility"],
    workplace:
      "The design houses on embassy rows, and the young worlds where a designer's drafts are tested by real joy and real grief.",
    hazards:
      "Designing another people's sacred life presumes much; the discipline's core is the willingness to be wrong in public, for a century.",
    ring: "Ring V",
    tenure: "One species per designer's working life.",
    compensation:
      "Designers' rites are performed without attribution by people who will never know their names — the profession's chosen crown.",
    alliedDomains: ["Celestial Arts & Music", "Exploration & First Contact"],
  },

  "Silence Warden": {
    mandate:
      "Guard the temple silences and the world's remaining quiet places against noise dressed as progress.",
    pathway:
      "Wardens train under the Silence Carvers, keeping the edges before earning the interior. A warden's commission follows one sanctuary preserved intact through a season of genuine temptation.",
    toolkit: ["noise ledgers", "boundary bells", "the firm courtesy", "dust and distance"],
    workplace:
      "Sanctum reserves, mountain deserts, and the temple cloisters where the world's noise is politely refused.",
    hazards:
      "Wardens are the last defense of shrinking quiet; each posting ends when the noise arrives anyway, and it always arrives.",
    ring: "Ring II",
    tenure: "Sanctuary-tenure until lost — then a new sanctuary, humbler and farther.",
    compensation:
      "Wardens keep the memory-maps of every quiet place they defended, and the guild publishes them as pilgrimage guides.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Healing Arts"],
  },

  "Pilgrimage Path Keeper": {
    mandate:
      "Maintain the ancient walking routes between holy places — the way-stones, wells and shelters that make a pilgrimage possible.",
    pathway:
      "Keepers walk their path end to end yearly, apprentices first with a senior, then carrying the keys alone. Recognition follows one season in which every traveler who asked was housed, fed and pointed true.",
    toolkit: ["way-stone chisels", "the shelter ledger", "well-craft", "the blessing of departure"],
    workplace:
      "The long paths themselves — mountain stair, desert causeway, harbor steps — and the way-stations kept against the weather.",
    hazards:
      "Paths claim keepers slowly: a life of service outdoors, in all weathers, carrying other people's hopes uphill.",
    ring: "Ring II",
    tenure: "Path-tenure for life, passed with the keys and the map's unwritten parts.",
    compensation:
      "Keepers' names are carved small on the way-stones they set — found, centuries on, by pilgrims who touch them in thanks.",
    alliedDomains: ["Temple, Ritual & Ceremony", "Planetary Stewardship"],
  },
};

/* Domain charters — keys match domain ids in data/professions.ts,
   and each `seats` line reconciles with that domain's `count`. */

export const domainProfiles: Record<string, DomainProfile> = {
  "healing-arts": {
    charter:
      "Restoration of body, soul and light-body across densities — the domain from which the federation's oldest vow derives: nothing in a being is discarded, only transformed. Its practitioners work the template layer where illness first appears as torn or dimmed light.",
    seats: "168 catalogued seats: 61 in active service, 74 in training, 33 reserved for emerging worlds.",
    disciplines: ["light-body surgery", "etheric meridian work", "trauma transmutation", "density-transition midwifery"],
    entranceTrial:
      "Candidates sit the still chamber for a night with a dying light — not to save it, but to keep it company — and are judged by how gently they stayed.",
  },

  "light-technology": {
    charter:
      "The engineering wing of the federation: lattices, cores and looms that shape light the way older civilizations shaped stone. Every temple, shield and ship in the archives is built by this domain's hands.",
    seats: "143 catalogued seats: 52 in active service, 58 in training, 33 reserved for worlds newly federated.",
    disciplines: ["plasma lattice weaving", "crystalline core programming", "holographic record engineering", "gravity folding"],
    entranceTrial:
      "The candidate must build, in one week and with their own light, a lattice that holds a single petal aloft through a full storm-season simulation.",
  },

  "cosmic-navigation": {
    charter:
      "The art of moving deliberately through a universe that is mostly distance — gates, dreams, currents of time and the long quiet ways between. Navigators are the reason the federation feels like a neighborhood rather than a wilderness.",
    seats: "121 catalogued seats: 44 in active service, 49 in training, 28 reserved for emerging worlds.",
    disciplines: ["star-gate piloting", "dream-layer steering", "chrono-cartography", "void route-craft"],
    entranceTrial:
      "Alone at the edge of a quiet stretch, the candidate must plot a true course with an almanac, a pencil and no second opinion.",
  },

  "planetary-stewardship": {
    charter:
      "Tending whole worlds as living patients — biospheres, weather, elementals, seeds and the planetary grids beneath all of them. The domain's charter is the oldest sentence in the archive: the planet remembers what its peoples forget.",
    seats: "134 catalogued seats: 57 in active service, 52 in training, 25 held in reserve for young spheres.",
    disciplines: ["biosphere restoration", "weather conducting", "elemental diplomacy", "grid and seed keeping"],
    entranceTrial:
      "The candidate is given one exhausted acre and one growing season; entrance is granted by what the acre says a year later.",
  },

  "genetic-soul-architecture": {
    charter:
      "The design chambers where souls are drafted into bodies and lineages are woven across worlds — governed by the Bio-Ethical Seeding Accord and audited by its own conscience. This domain touches the deepest material in the federation, and knows it.",
    seats: "98 catalogued seats: 31 in active service, 42 in training, 25 reserved for emerging worlds.",
    disciplines: ["soul template design", "lineage genealogy", "light-genome weaving", "incarnation planning"],
    entranceTrial:
      "Candidates must sit with the record of a hard life — one they did not live — and argue its designers' choices better than its critics.",
  },

  "dream-astral": {
    charter:
      "The night-side professions: healers, cartographers, companions and negotiators who work the shared country of sleep and the subtle planes. Most first contact happens here, and most first comfort too.",
    seats: "117 catalogued seats: 38 in active service, 46 in training, 33 reserved for worlds newly federated.",
    disciplines: ["dream healing", "astral cartography", "bardo companionship", "nightmare mediation"],
    entranceTrial:
      "The candidate must hold their own thread through a hundred lucid nights, keeping a journal the temple can read without embarrassment.",
  },

  "sound-vibration": {
    charter:
      "Everything in the archive that moves by tone: planetary master-tones, harmonic diplomacy, engineered mantra and the great deliberate silences. The domain teaches that the universe is held together by consonance and repaired by listening.",
    seats: "89 catalogued seats: 29 in active service, 37 in training, 23 reserved for emerging worlds.",
    disciplines: ["planetary tone-keeping", "harmonic diplomacy", "mantra engineering", "silence carving"],
    entranceTrial:
      "The candidate must sing one note, alone in a stone room, until the room agrees with it — and know the moment of agreement without being told.",
  },

  "cosmic-history": {
    charter:
      "The memory professions: librarians, archaeologists, translators and conservators who keep the record honest enough to be useful. Its creed — retrieve what was lost, correct what was mis-said — governs every stack and dig in the federation.",
    seats: "112 catalogued seats: 41 in active service, 44 in training, 27 held in reserve for young spheres.",
    disciplines: ["akashic librarianship", "stellar archaeology", "myth translation", "timeline conservation"],
    entranceTrial:
      "The candidate is handed two accounts of one event — one beloved, one documented — and must reconcile them without flattering either.",
  },

  "diplomacy-treaties": {
    charter:
      "The federation's careful hands: mediators, scribes, envoys and auditors who keep four hundred civilizations in one conversation. The domain's discipline is patience; its product is the sentence everyone can still live inside a thousand years later.",
    seats: "90 catalogued seats: 33 in active service, 36 in training, 21 reserved for emerging worlds.",
    disciplines: ["interspecies mediation", "treaty drafting", "observer envoy service", "free-will auditing"],
    entranceTrial:
      "The candidate must mediate a staged dispute between two mentors who have rehearsed their grievances for decades — and may not leave the room until both feel heard.",
  },

  "celestial-arts": {
    charter:
      "Beauty as civic infrastructure: nebulae painted, orbital choirs conducted, auroras danced and festivals built. The domain exists because the federation's founders learned that alliances survive on more than treaties.",
    seats: "84 catalogued seats: 22 in active service, 39 in training, 23 reserved for worlds newly federated.",
    disciplines: ["nebula composition", "orbital and auroral performance", "memory sculpture", "festival architecture"],
    entranceTrial:
      "The candidate must make one stranger, of another species, laugh — then make them cry — then make them dance, in that order, at one gathering.",
  },

  "exploration-first-contact": {
    charter:
      "The federation's open hands: scouts, linguists, chroniclers and the specialists who stand in the doorway where two species meet. Its first law is the oldest one — arrive gently, and leave the other world more itself than you found it.",
    seats: "76 catalogued seats: 26 in active service, 31 in training, 19 reserved for emerging worlds.",
    disciplines: ["first contact method", "xeno-linguistics of tone", "consent protocol enforcement", "frontier scouting"],
    entranceTrial:
      "The candidate must spend one season among strangers who do not know their purpose — and be invited to stay before ever explaining it.",
  },

  "temple-ritual": {
    charter:
      "The ceremonies that hold a civilization's spine: passages, fires, silences and the ancient walking routes between holy places. This domain keeps the shape of meaning so that meaning does not dissolve into administration.",
    seats: "71 catalogued seats: 24 in active service, 28 in training, 19 held in reserve for young spheres.",
    disciplines: ["transition officiating", "grid harmonics cantoring", "ceremonial fire keeping", "silence and path keeping"],
    entranceTrial:
      "The candidate must keep one small flame alive through one full night of grief, wind and doubt — and let the family watching decide when it was done well.",
  },
};
