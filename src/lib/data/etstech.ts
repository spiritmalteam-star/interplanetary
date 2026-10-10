/* ------------------------------------------------------------------ */
/*  ETs Tech — the extraterrestrial technology archive.                */
/*  12 families of use · 240 catalogued technologies.                  */
/*  Every artifact carries its own bespoke AI-rendered impression      */
/*  at /images/ai/tech-<id>.jpg — no image is ever reused.             */
/* ------------------------------------------------------------------ */

export interface ETechItem {
  id: string;
  name: string;
  blurb: string;
  detail: string;
  /** Bespoke scene description — the seed of this artifact's own AI image. */
  visual: string;
}

export interface ETechFamily {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: ETechItem[];
}

export const etechFamilies: ETechFamily[] = [
  {
    id: "habitat",
    title: "Architecture & Habitat",
    icon: "home",
    description:
      "How dwelling itself is engineered among the stars — homes grown, sung and levitated rather than built.",
    items: [
      {
        id: "aero-glass-domes",
        name: "Aero-Glass Domes",
        blurb: "Dwellings blown from charged air that hardens into crystal-clear shell.",
        detail:
          "A field generator swirls ionized atmosphere into a vortex until it sets as transparent aero-glass. The dome weighs almost nothing, shrugs off storms, and can be re-blown in a new shape whenever the household dreams of change.",
        visual:
          "a translucent crystal dome home glowing warmly at dusk on a meadow planet, two moons above, interior lights shaped like floating orbs",
      },
      {
        id: "plasma-lattice-houses",
        name: "Plasma Lattice Houses",
        blurb: "Walls woven from lightning that agreed to hold a shape.",
        detail:
          "Ionized plasma is pinned between anchor nodes in sacred-geometry lattices, forming glowing walls that can be re-drawn by the occupant's mood. The house hums faintly, cleans its own air, and lets go entirely when the family departs.",
        visual:
          "a futuristic house whose walls are glowing geometric plasma lattices of violet light, starry night landscape, inhabitants visible as silhouettes inside",
      },
      {
        id: "memory-clay-habitats",
        name: "Memory Clay Habitats",
        blurb: "Rooms that rebuild themselves overnight from shape-remembering clay.",
        detail:
          "Memory clay records the household's habits and quietly re-sculpts walls, arches and furniture between one dawn and the next. Grief widens a room; celebration raises the ceiling; nothing is ever demolished, only re-dreamed.",
        visual:
          "an organic clay habitat with smooth flowing walls reshaping itself, soft golden dawn light, small floating tools sculpting the wall surfaces",
      },
      {
        id: "root-vault-dwellings",
        name: "Root-Vault Dwellings",
        blurb: "Homes grown in partnership with the living roots of ancient trees.",
        detail:
          "Instead of clearing land, settlers court a tree. Over seasons the roots arch into vaulted rooms that are alive, self-repairing, and cooled by the tree's own water. Families inherit both the house and the friendship of the forest.",
        visual:
          "interior rooms formed inside the arched living roots of a giant luminous tree, warm lanterns hanging from root ceilings, mossy floor",
      },
      {
        id: "crystalline-nest-spires",
        name: "Crystalline Nest Spires",
        blurb: "Towers that sing at dawn and cradle whole neighborhoods in their facets.",
        detail:
          "Each spire is a single grown crystal tuned to a chord of home. At sunrise the facets refract the light into the chambers below, so waking in a nest spire feels like being played by the sun itself.",
        visual:
          "slender crystalline spires with nest-like terraces glowing at sunrise, prismatic light beams fanning across a tranquil city",
      },
      {
        id: "tide-glass-sea-homes",
        name: "Tide-Glass Sea Homes",
        blurb: "Undersea pods whose walls are hardened thought and whale-song.",
        detail:
          "Set on the seabed in communion with local cetaceans, tide-glass pods are acoustically shaped so the sea's own songs keep them strong. Residents fall asleep to the ocean's conversation and wake to slow drifting schools of light.",
        visual:
          "glowing glass dome homes on a serene ocean floor, schools of bioluminescent fish drifting past, a whale silhouette far above in sun rays",
      },
      {
        id: "cloud-terrace-villages",
        name: "Cloud-Terrace Villages",
        blurb: "Villages suspended on terraces that float where the weather is kind.",
        detail:
          "Buoyant stone terraces drift at cloud level, steered by gentle consensus rather than engines. When a storm approaches the whole village simply rises, slides sideways, and lets the bad weather pass beneath its gardens.",
        visual:
          "a village of terraced gardens floating among white clouds, bridges connecting levitating platforms, warm evening light",
      },
      {
        id: "bio-luminal-corridors",
        name: "Bio-Luminal Corridors",
        blurb: "Hallways lit by tame constellations of gentle organisms.",
        detail:
          "Light is a relationship here: corridors are seeded with luminous flora and patient glow-motes that brighten as someone walks through. The light follows with the warmth of company rather than the flatness of fixtures.",
        visual:
          "a curving corridor lined with softly glowing vines and floating light motes, gentle teal and amber bioluminescence on smooth organic walls",
      },
      {
        id: "hushstone-acoustic-rooms",
        name: "Hushstone Acoustic Rooms",
        blurb: "Rooms carved from stone that drinks sorrow out of the air.",
        detail:
          "Hushstone is grown in silence over a century and absorbs emotional static the way sand absorbs water. One hour inside a hushstone room is the architectural equivalent of being held — arguments end there, and sometimes grief finally sleeps.",
        visual:
          "a small round chamber of matte grey-blue stone with soft ridged walls absorbing light, a single cushion and a bowl of water, deep calm atmosphere",
      },
      {
        id: "dream-lofts",
        name: "Dream Lofts",
        blurb: "Sleeping chambers tuned nightly to the dreamer's inner weather.",
        detail:
          "The loft reads its sleeper's field as they fall asleep and adjusts color, temperature and faint sound to protect the dream. Nightmares are not banned here — they are met at the door by the room itself and escorted somewhere kinder.",
        visual:
          "an elevated sleeping loft with a canopy of slowly drifting projected stars, soft gradient lighting shifting from deep violet to rose",
      },
      {
        id: "gravity-soft-floors",
        name: "Gravity-Soft Floors",
        blurb: "Floors that lighten their gravity for the old, the wounded and the tired.",
        detail:
          "A lattice of gravity emitters reads each footstep and answers it. Elders glide where they once limped; a healing leg learns to walk at a third of its weight. The floor is the civilization's quietest act of kindness.",
        visual:
          "an elder being gently supported by a glowing floor grid as they walk across a bright hall, faint gravity ripple visible under each step",
      },
      {
        id: "living-roof-canopies",
        name: "Living Roof Canopies",
        blurb: "Roofs of engineered leaves that breathe for the whole household.",
        detail:
          "The canopy photosynthesizes more than the home consumes, folding sunlight into air, fruit and shade in a single motion. In autumn it glows gold before letting go, and the family gathers the leaves as next winter's candles.",
        visual:
          "a home beneath a vast canopy of giant luminous green leaves with veins of golden light, fruit hanging low, dappled sunlight on the floor",
      },
      {
        id: "quartz-wind-towers",
        name: "Quartz Wind Towers",
        blurb: "Towers that turn passing wind into cool air and quiet light.",
        detail:
          "Rows of grown quartz reeds convert vibration into electricity while cooling the air that moves between them. A city ringed with wind towers never hears machinery — only a low flute-note weather keeps choosing to play.",
        visual:
          "tall white quartz towers with reed-like crystals humming in the wind at twilight, faint blue light within the crystal veins",
      },
      {
        id: "sand-printed-arcologies",
        name: "Sand-Printed Arcologies",
        blurb: "Whole cities printed from desert in a single patient week.",
        detail:
          "A print caravan melts dune sand with focused sun and re-lays it as vaulted, latticed arcologies that stay cool in day and warm in night. When the settlement moves on, the city is un-printed and the desert is given its sand back.",
        visual:
          "a vast lattice arcology city rising from golden dunes, constructed of sun-melted glassy sand, printing beams from a hovering craft above",
      },
      {
        id: "ice-carved-sanctuaries",
        name: "Ice-Carved Sanctuaries",
        blurb: "Glacial retreats where silence is preserved like vintage wine.",
        detail:
          "Carved from ancient blue glacier ice by sound alone, these sanctuaries are reserved for those who need the world to stop. The ice filters light into slow blue dawn that lasts as long as the guest needs it to.",
        visual:
          "interior of a blue glacial ice sanctuary with smooth carved arches, soft refracted light, a lone figure meditating on an ice bench",
      },
      {
        id: "hanging-garden-bridges",
        name: "Hanging Garden Bridges",
        blurb: "Bridges that are also orchards, also meeting places, also home.",
        detail:
          "Between towers, cables of living wood carry walkways thick with vines, fruit and benches. Crossing town takes longer than it should because everyone stops to talk — which the bridge designers consider the point.",
        visual:
          "a rope-like living bridge between two elegant towers, overflowing with flowering vines and fruit trees, people strolling with baskets",
      },
      {
        id: "sound-settled-foundations",
        name: "Sound-Settled Foundations",
        blurb: "Foundations compacted into permanence by patient standing waves.",
        detail:
          "Before anything is built, tone-workers spend days settling the ground with low standing waves until soil, sand or rubble behaves like one smooth stone. Cities raised this way have never cracked in four thousand years.",
        visual:
          "construction site where visible concentric sound rings settle the earth flat and smooth, workers watching from the edge at golden hour",
      },
      {
        id: "lava-glass-hearths",
        name: "Lava-Glass Hearths",
        blurb: "Fireplaces of volcanic glass that burn nothing and warm everything.",
        detail:
          "A tempered core of lava-glass stores a day's sunlight and releases it as amber evening warmth. Families gather around it as their ancestors gathered around flame — only this fire burns no world to keep them warm.",
        visual:
          "a family gathered around a glowing amber volcanic-glass hearth in a round stone room, soft fire-like light without flame",
      },
      {
        id: "starlight-atriums",
        name: "Starlight Atriums",
        blurb: "Ceilings that gather remote starlight and pour it indoors.",
        detail:
          "A lattice of condenser panes folds starlight from any sky into a warm indoor noon. On worlds of long night, the atrium is where children learn what the rest of the galaxy looks like — every single evening.",
        visual:
          "a grand indoor atrium beneath a ceiling of light-gathering panels showing a vivid starfield, plants and reading benches below in warm glow",
      },
      {
        id: "nomad-shell-camps",
        name: "Nomad Shell Camps",
        blurb: "Portable dwellings grown like shells, carried like promises.",
        detail:
          "Migration peoples grow their homes as small shells on their backs; at camp the shell unfolds into a round dwelling grown from the family's own yearly journey. Bigger journeys grow bigger homes, which is why the elders' camp is enormous.",
        visual:
          "a camp of round shell-like dwellings unfolded in a circle on a plain at dusk, one shell still half-folded on a traveler's back",
      },
    ],
  },
  {
    id: "energy",
    title: "Energy & Propulsion",
    icon: "zap",
    description:
      "Power drawn from vacuum, starlight and song — engines that make no smoke because they burn no world.",
    items: [
      {
        id: "zero-point-taps",
        name: "Zero-Point Taps",
        blurb: "Household taps that draw a quiet forever from the vacuum's rest.",
        detail:
          "A zero-point tap couples to the restless ground-state of space itself and draws a thin, endless current. No fuel, no exhaust, no meter — the first question every child asks is where the energy comes from, and the honest answer is: everywhere.",
        visual:
          "a small elegant household device like a glass pillar with a softly pulsing core of light, subtle ripples in the air around it",
      },
      {
        id: "tachyon-coil-drives",
        name: "Tachyon Coil Drives",
        blurb: "Engines that pull ships forward by leaning on faster-than-light currents.",
        detail:
          "Nested coils comb tachyon flux into a bow-wave the ship can surf. There is no roar in vacuum — crossing systems feels like being carried by a river that was always flowing toward your destination.",
        visual:
          "the engine ring of a sleek starship glowing with concentric coils of blue-white energy, streaking starlight ahead like a river",
      },
      {
        id: "solar-sail-gardens",
        name: "Solar Sail Gardens",
        blurb: "Freighters whose sails are living leaves ten kilometers wide.",
        detail:
          "Grown sails photosynthesize as they fly, so a cargo run to the inner worlds actually returns with more energy than it left with. Crews tend the sail-gardens the way ancient crews tended canvas — by walking out on light lines.",
        visual:
          "an enormous starship with sails shaped like vast glowing green leaves catching golden sunlight in deep space",
      },
      {
        id: "harmonic-fusion-rings",
        name: "Harmonic Fusion Rings",
        blurb: "Star-fire bottled in rings that hum the note hydrogen obeys.",
        detail:
          "Instead of crushing plasma with magnetic fists, the rings sing standing waves that invite hydrogen to fuse gently. The reaction can be quieted mid-note, which is why harmonic plants have never once had a meltdown.",
        visual:
          "a ring-shaped reactor hall with a suspended sphere of contained golden plasma, musical wave patterns visualized along the ring",
      },
      {
        id: "ley-line-collectors",
        name: "Ley-Line Collectors",
        blurb: "Weavers that harvest the planet's own telluric currents.",
        detail:
          "Where a world's magnetic embroidery runs strong, collector wefts are laid like a tailor takes a measurement. The current drawn is small per household — small enough that the planet has never noticed, which is the design's entire pride.",
        visual:
          "low crystalline weaves in a green valley with faint glowing lines of earth current flowing through them into small village lights",
      },
      {
        id: "piezo-feather-batteries",
        name: "Piezo Feather Batteries",
        blurb: "Batteries that charge from touch, rain and the weight of footsteps.",
        detail:
          "Grown like layered feathers, each vane converts flex into charge. Cities pave their streets with feather-batteries, so every crowd literally powers the lights it walks beneath.",
        visual:
          "a close view of a glowing battery formed of iridescent layered feather vanes, raindrops striking it and becoming sparks of light",
      },
      {
        id: "starlight-condensers",
        name: "Starlight Condensers",
        blurb: "Fields of mirrored flowers that gather starlight into dew of light.",
        detail:
          "By dawn each condenser flower has folded a night of faint starlight into a single bead of condensed luminescence. One bead runs a lamp for a month; a hillside of flowers runs a city that never needs to dig.",
        visual:
          "a hillside of mirror-like metallic flowers at night collecting light, each flower holding a single glowing bead of liquid light",
      },
      {
        id: "magnetic-leyden-vines",
        name: "Magnetic Leyden Vines",
        blurb: "Grapvines of glass that store lightning and share it politely.",
        detail:
          "Planted along storm corridors, leyden vines catch each strike, pass it root to root, and feed it out to the grid at a pace the wires can savor. After a storm the vines glow faintly green for a week, like satisfied cats.",
        visual:
          "rows of translucent glassy vines across a stormy plain catching a lightning strike, the charge flowing as light along the vines",
      },
      {
        id: "antimatter-whisper-jars",
        name: "Antimatter Whisper Jars",
        blurb: "Storage so gentle the universe's angriest fuel is kept like songbirds.",
        detail:
          "Suspended in rotating harmonic shells, each whisper of antimatter is held away from matter by courtesy of geometry. The jars are freighted in silence and opened only in vacuum, with ceremony, by crews who train for decades.",
        visual:
          "a containment jar on a pedestal holding a floating pinprick of brilliant white light wrapped in rotating rings of force, dark laboratory",
      },
      {
        id: "gravity-well-engines",
        name: "Gravity Well Engines",
        blurb: "Drives that fall toward a gravity they compose themselves.",
        detail:
          "The engine paints a gentle gravity slope ahead of the vessel and then simply falls down it — forever. There are no acceleration forces to endure because the ship and everything in it is falling together, always.",
        visual:
          "a starship moving through a visible curved funnel of distorted spacetime, stars stretched subtly along the funnel walls",
      },
      {
        id: "photon-harp-arrays",
        name: "Photon Harp Arrays",
        blurb: "Orbital harps whose strings are light, plucked by passing planets.",
        detail:
          "A harp array strings coherent light between two asteroids; a planet's magnetic field brushes the strings and the array sings the current home. Every world with a magnetosphere carries an unplayed concert above it.",
        visual:
          "an orbital structure of glowing parallel light strings strung between two small asteroids, a planet's aurora brushing them",
      },
      {
        id: "geo-heart-tappers",
        name: "Geo-Heart Tappers",
        blurb: "Wells that sip a planet's inner warmth without ever scalding it.",
        detail:
          "A tapper descends to the boundary of the mantle and draws heat by conduction rings — slowly, the way one holds a warm cup rather than drains it. Volcanic worlds power neighbor planets this way and consider it hospitality.",
        visual:
          "a deep crystalline well shaft glowing orange from the earth's heat, energy rings rising along the shaft to surface installations",
      },
      {
        id: "storm-kite-harvesters",
        name: "Storm-Kite Harvesters",
        blurb: "Kites flown into hurricanes that return heavy with lightning.",
        detail:
          "Flown by pilots who read storms like sailors once read stars, each kite gathers charge through its trailing tether-braid. The sport of it keeps volunteers queuing; the light it brings home keeps whole coasts glowing.",
        visual:
          "a great glowing kite flying into the eye wall of an enormous storm, its tether a braid of captured lightning arcing to the ground",
      },
      {
        id: "crystalline-capacitor-cores",
        name: "Crystalline Capacitor Cores",
        blurb: "Grown crystals that hold city-scale charge in a fist-sized stone.",
        detail:
          "Lattice-grown over months in silent rooms, a single core can bank a city's evening demand and release it without warming the air around it. Cores are handed down generations and almost never actually wear out.",
        visual:
          "a palm-sized faceted crystal core glowing intensely from within, held in an open hand, light spilling between the fingers",
      },
      {
        id: "vacuum-braid-transmitters",
        name: "Vacuum Braid Transmitters",
        blurb: "Power sent as braided beams of nothing, wire included.",
        detail:
          "A transmitter spins three phase-locked beams into a braid and a receiver un-braids them into usable current — no cable, no losses that matter. The braid is visible at night: a quiet rope of light from sky to earth.",
        visual:
          "a braided beam of three twisted light strands connecting an orbital station to a receiving ring on the night side of a planet",
      },
      {
        id: "pulse-detonation-sails",
        name: "Pulse Detonation Sails",
        blurb: "Sails ridden by their own echoes, clapping a ship across the dark.",
        detail:
          "The sail detonates a whisper of fuel behind itself and catches the echo on its face, over and over, at a rhythm chosen to be almost musical. Long-haul crews say they sleep best to the clap of a well-tuned sail.",
        visual:
          "a vast reflective sail catching a ring-shaped pulse of light behind a slender starship, faint shockwave rings receding",
      },
      {
        id: "auroral-dynamo-nets",
        name: "Auroral Dynamo Nets",
        blurb: "Nets cast into the polar sky that gather the aurora's spilled charge.",
        detail:
          "Suspended at the pole where solar wind pools, dynamo nets comb the same current that paints the auroras. The lights undimmed is the license condition; if the sky ever darkens, the nets come down the same day.",
        visual:
          "vast shimmering nets floating in a polar sky beneath vivid green and violet auroras, faint collected light streaming down a tether",
      },
      {
        id: "bio-electric-orchards",
        name: "Bio-Electric Orchards",
        blurb: "Trees bred to fruit with electricity, tended like any orchard.",
        detail:
          "Each tree stores lightning-season surplus in sap capacitors and yields it through its roots into the ground grid. Pruning, grafting and patience still apply — the grid masters are, formally, gardeners.",
        visual:
          "an orchard of trees with faint electric-blue veins in their leaves, glowing fruit hanging among green ones, farmers with baskets",
      },
      {
        id: "slipstream-inductors",
        name: "Slipstream Inductors",
        blurb: "Rings that let a ship ride the current between neighboring realities.",
        detail:
          "By inducting a shallow slipstream, a vessel borrows the gradient where two realities rub together and coasts along it. Navigation is a matter of manners: never wake a wild stream, always thank the one you leave.",
        visual:
          "a streamlined vessel inside a luminous tunnel where two colored realities meet, gentle current lines flowing along the hull",
      },
      {
        id: "neutrino-trick-lamps",
        name: "Neutrino Trick Lamps",
        blurb: "Lamps that shine through planets by persuasion rather than force.",
        detail:
          "A neutrino lamp nudges the ghost-particles through a lens of dense matter, which glows faintly on the far side. Messages and beacons sent this way pass straight through mountains, oceans and occasionally moons.",
        visual:
          "a lamp-like beacon emitting an invisible beam represented by faint shimmer that re-emerges glowing from the far side of a mountain",
      },
    ],
  },
  {
    id: "healing",
    title: "Healing & Regeneration",
    icon: "pulse",
    description:
      "Medicine as remembrance — technologies that remind a body of the health it has always known how to keep.",
    items: [
      {
        id: "regeneration-med-beds",
        name: "Regeneration Med-Beds",
        blurb: "Cradles that re-teach cells the blueprint they were born with.",
        detail:
          "The bed scans the body's original template, subtracts everything that is not the person, and coaxes the remainder back toward itself. Bones remember, organs remember, and the patient wakes with an odd feeling of having been fetched back.",
        visual:
          "a person resting in an elegant open med-bed cradle surrounded by gentle scanning rings of soft blue and gold light",
      },
      {
        id: "frequency-bath-pools",
        name: "Frequency Bath Pools",
        blurb: "Pools of standing sound that wash injuries the way water washes dust.",
        detail:
          "Each pool holds a note chosen for the ailment — fractures get one chord, burns another, grief its own slow tide. Patients float while the sound unknots them, and the pool keeps a memory of every healing it has hosted.",
        visual:
          "a serene circular pool with visible concentric waves of light and sound, a person floating peacefully, warm candlelit stone surroundings",
      },
      {
        id: "cellular-choir-chambers",
        name: "Cellular Choir Chambers",
        blurb: "Rooms where a body's own cells are taught to sing in tune again.",
        detail:
          "Sensors listen to a diseased organ's discord and the chamber answers with its missing tone, softly, for hours if needed. Illness is treated here as a choir member gone quiet or sharp — to be heard first, then re-tuned.",
        visual:
          "a domed chamber with floating resonant orbs around a seated patient, each orb glowing in a different soft color like a choir",
      },
      {
        id: "light-knit-suture-wands",
        name: "Light-Knit Suture Wands",
        blurb: "Wands that sew wounds closed with thread made of light.",
        detail:
          "The wand reads the wound's edges and weaves strands of coherent light that tissues accept as invitation rather than invasion. There is no scar because the body was never interrupted — only reminded of its own continuity.",
        visual:
          "a close-up of a slender crystalline wand weaving a visible thread of golden light across a closing wound on a forearm",
      },
      {
        id: "organ-printing-blossoms",
        name: "Organ Printing Blossoms",
        blurb: "Flowers that grow replacement organs as patiently as petals.",
        detail:
          "Seeded with the patient's own cells, a printing blossom opens over six days with the new organ folded at its heart. It is picked like a rose and received like one — almost always with tears, by patient and grower alike.",
        visual:
          "a large luminous flower opening to reveal a delicate glowing organ shape cradled at its center, growth chambers in the background",
      },
      {
        id: "memory-trauma-diffusers",
        name: "Memory Trauma Diffusers",
        blurb: "Devices that let a memory keep its story while giving up its sting.",
        detail:
          "The diffuser holds the memory in a slow loop while gently broadening the field it is recalled within. The past stays factually intact but stops ambushing the present — survivors describe it as the memory finally sitting down.",
        visual:
          "a small device like a lens on a stand projecting a soft looping scene above it, the scene gradually turning from harsh red to calm blue",
      },
      {
        id: "spine-resonance-cradles",
        name: "Spine Resonance Cradles",
        blurb: "Cradles that play vertebrae back into alignment with vibration alone.",
        detail:
          "The cradle finds each vertebra's stubborn note and answers with its patient opposite, one by one down the column. Sessions end with the whole spine ringing in tune and the patient standing a little taller than they walked in.",
        visual:
          "a reclining chair with glowing rings aligned along the spine of the seated person, each ring pulsing gently in sequence",
      },
      {
        id: "blood-light-cleansers",
        name: "Blood-Light Cleansers",
        blurb: "Bracelets that filter the blood by escorting trouble toward the light.",
        detail:
          "A wrist band runs a fraction of circulation through a chamber where targeted light tags toxins, clots and strays for gentle removal. The body does the healing as always — the cleanser only does the pointing.",
        visual:
          "an elegant wrist bracelet with a glowing chamber where the blood vessels beneath visibly brighten as they pass through",
      },
      {
        id: "dream-repair-salves",
        name: "Dream Repair Salves",
        blurb: "Ointments that work only while the sleeper is dreaming honestly.",
        detail:
          "Applied at bedtime, the salve reads the dream-field and mends the day's small damages — frayed nerves, jangled hormones, half-made decisions. It is inert in dreamless sleep, which is why honest dreamers heal fastest.",
        visual:
          "a small ceramic jar of faintly shimmering salve on a nightstand beside a sleeping person, thin wisps of light drifting toward them",
      },
      {
        id: "nerve-song-filaments",
        name: "Nerve Song Filaments",
        blurb: "Threads that carry a tune along severed nerves until they remember.",
        detail:
          "Laid across a gap of damaged nerve, the filament hums the signal-pattern the nerve used to know. Week by week the nerve learns the song until it sings it alone, and the filament is removed with a small ceremony.",
        visual:
          "a thin glowing filament bridging a gap between two nerve endings, musical wave patterns traveling along it in soft light",
      },
      {
        id: "bone-chorus-casts",
        name: "Bone Chorus Casts",
        blurb: "Casts that hum a fracture into fusion three notes at a time.",
        detail:
          "The cast listens to the break and sings the frequency callus-growth answers to, adjusting daily. Children with chorus casts compare melodies the way children once compared signatures — every bone heals in its own music.",
        visual:
          "an arm in a translucent cast with visible glowing sound waves wrapping a knitting bone, small musical notes of light along the cast",
      },
      {
        id: "grief-immersion-pools",
        name: "Grief Immersion Pools",
        blurb: "Warm pools held at the exact temperature of being understood.",
        detail:
          "For loss that cannot be fixed, only accompanied, the pools offer buoyant warmth, low light and absolute permission. Attendants never speak first. Many arrive unable to cry and leave having remembered how.",
        visual:
          "a candlelit circular pool in a dark peaceful room, a single person floating, steam rising, surroundings softly out of focus",
      },
      {
        id: "aura-weaving-looms",
        name: "Aura Weaving Looms",
        blurb: "Looms that re-weave the body's light-coat where life has snagged it.",
        detail:
          "The loom reads the field's tears, thins and tangles and re-plates them with fresh woven light. Clients describe the sensation as being handed a clean coat on a cold day — the same self, warmly re-wrapped.",
        visual:
          "a person seated inside a loom-like ring apparatus weaving visible threads of colored light across their faintly visible aura",
      },
      {
        id: "longevity-cell-sparks",
        name: "Longevity Cell Sparks",
        blurb: "Small annual sparks that remind telomeres they are not finished.",
        detail:
          "A once-a-year session delivers a precise micro-current to the cellular clocks, granting them another season of faithful copying. It is medicine as calendar courtesy — not forever, but a great many more good mornings.",
        visual:
          "a single elegant device sending a tiny arc of light into a glass vial of softly glowing cells, surrounded by blooming plants",
      },
      {
        id: "empathic-pain-relays",
        name: "Empathic Pain Relays",
        blurb: "Circuits that let healers feel exactly where it hurts — no more, no less.",
        detail:
          "The relay transmits a calibrated echo of the patient's pain to the healer's hands, turning diagnosis from guesswork into geography. It shuts off at the threshold of suffering; healers are guides, not martyrs.",
        visual:
          "a healer's glowing gloved hands hovering over a patient, thin threads of light connecting hands to the place of pain",
      },
      {
        id: "regenerative-star-mud",
        name: "Regenerative Star Mud",
        blurb: "Grey silt from comet tails that convinces flesh to try again.",
        detail:
          "Packed onto wounds and old scars, star mud's mineral choirs whisper the proteins back into production. Fields treated with it bloom twice; the mud simply does to bodies what it does to worlds after long winters.",
        visual:
          "hands packing shimmering grey-blue mud with tiny sparkles onto a healing wound on a leg, small lights twinkling in the mud",
      },
      {
        id: "heart-coherence-halos",
        name: "Heart Coherence Halos",
        blurb: "Halos that teach a racing heart the metronome of calm.",
        detail:
          "Worn at the chest, the halo translates heartbeat into soft tone and returns a slower counter-melody until the two agree. Panic loses its argument mid-sentence, which is why crisis rooms keep a basket of them by the door.",
        visual:
          "a person wearing a gentle glowing halo pendant at the chest, visible waveform rings expanding in rhythm from the heart",
      },
      {
        id: "deep-sleep-dive-pods",
        name: "Deep-Sleep Dive Pods",
        blurb: "Pods that walk sleepers down to the sleep beneath sleep.",
        detail:
          "The dive pod layers darkness, breath-coaching and slow magnetic rocking to reach the restorative depth ordinary nights never visit. One dive replaces three nights, and the exit chime is engineered to be the kindest sound on any world.",
        visual:
          "a person asleep in a sleek pod lined with slow-moving constellation patterns, deep blue darkness with soft drifting light",
      },
      {
        id: "toxin-transformer-beads",
        name: "Toxin Transformer Beads",
        blurb: "Beads that change poisons into minerals the body actually wants.",
        detail:
          "Swallowed or worn, each bead binds a toxin and transmutes it through lattice exchange into trace iron, zinc or calm. Nothing is expelled or wasted — the archipelago healers call it teaching the poison better manners.",
        visual:
          "a cluster of luminous beads inside a transparent vessel, dark specks being drawn into beads and emerging as faint golden motes",
      },
      {
        id: "birth-water-domes",
        name: "Birth Water Domes",
        blurb: "Birth chambers of warm water and welcome, tuned to two heartbeats.",
        detail:
          "The dome holds the water at blood warmth and the light at newborn-eye dimness, while resonance keeps both heartbeats in conversation. Birth here is treated as the technology — the dome only clears the room for it.",
        visual:
          "a glowing dome chamber with a warm pool of water, soft light, a midwife by the edge, gentle rings of light over the water",
      },
    ],
  },
  {
    id: "contact",
    title: "Communication & Contact",
    icon: "radio",
    description:
      "The arts of reaching one another — thought, tone, dream and light pressed into service where wires never reach.",
    items: [
      {
        id: "telepathic-relay-crowns",
        name: "Telepathic Relay Crowns",
        blurb: "Circlets that carry thought between minds with consent on both ends.",
        detail:
          "The crown does not open a mind; it carries what is offered, the way a courier carries a sealed letter. Consent chimes twice — once to send, once to receive — and without both, nothing crosses the distance at all.",
        visual:
          "a delicate circlet crown with floating glowing beads above the forehead, thought-threads of light reaching to another wearer far away",
      },
      {
        id: "universal-translator-pendants",
        name: "Universal Translator Pendants",
        blurb: "Pendants that let any two beings finish a sentence they started.",
        detail:
          "Reading intent beneath the words, the pendant re-voices speech in the listener's mother tongue including its humor and its hesitations. First contact teams never depart without a crate of them and a saying: the pendant translates, you still must be kind.",
        visual:
          "two beings of different species conversing, each wearing a small pendant with a softly rotating glyph of light between them",
      },
      {
        id: "light-language-projectors",
        name: "Light-Language Projectors",
        blurb: "Projectors that speak in grammar made of color and moving shape.",
        detail:
          "Light-language carries meaning the way weather carries mood — a sentence can be a sunset. Projectors render a speaker's meaning as drifting luminous forms that all species parse natively, which is why treaties are still argued in it.",
        visual:
          "a projector beaming slow-moving luminous shapes and colors into the air above a gathering, the shapes forming readable patterns",
      },
      {
        id: "dream-message-weavers",
        name: "Dream Message Weavers",
        blurb: "Night frames that deliver letters as dreams, intact and unsent twice.",
        detail:
          "A message placed on the weaver arrives in the recipient's sleep as a dream they will remember precisely. Urgency is discouraged — the network runs at the pace of nights, and answers usually come back as the next night's first thought.",
        visual:
          "a loom-like frame beside a sleeping person weaving a small scene of light that drifts down toward their dreaming head",
      },
      {
        id: "empathy-bridge-circuits",
        name: "Empathy Bridge Circuits",
        blurb: "Tabletop circuits that let two arguers feel each other's side for real.",
        detail:
          "Each participant receives a faint, honest rendering of the other's feeling — not to win the argument but to survive it. Mediators report that most disputes end before the timer does, and the rest end better than they began.",
        visual:
          "two people seated across a small glowing table circuit, thin arcs of colored light connecting their hands, expressions softening",
      },
      {
        id: "orbital-whisper-spheres",
        name: "Orbital Whisper Spheres",
        blurb: "Satellites that pass a whisper from one hemisphere to the other.",
        detail:
          "Speak into a whisper sphere's palm-size twin and the orbital sibling speaks it out beneath the other sky. Whole families keep twins across continents; the voice arrives with a faint chime and the exact warmth it left with.",
        visual:
          "a person whispering into a small open sphere on a hillside at night, the same whisper of light visible descending from an orbital twin",
      },
      {
        id: "crystal-record-senders",
        name: "Crystal Record Senders",
        blurb: "Stones that mail themselves home once their recording is full.",
        detail:
          "Tossed into a journey, the crystal listens to everything and, when full, resonates itself back to its origin stone. Explorers scatter them like breadcrumbs; the homelands read returning crystals like long letters.",
        visual:
          "a small crystal record resting on alien terrain, glowing faintly as it lifts and vanishes in a thread of light toward the stars",
      },
      {
        id: "star-network-beacons",
        name: "Star Network Beacons",
        blurb: "Beacon pines that route messages across the galaxy in patient hops.",
        detail:
          "Planted on comets, moons and quiet asteroids, each beacon catches, refreshes and re-casts the traveling light. A message may take weeks and arrive perfectly; the network's motto is carved on every pine: late is not lost.",
        visual:
          "a tree-like beacon on a small asteroid casting a thread of light to the next distant beacon, constellations connected by faint lines",
      },
      {
        id: "emotion-tone-bells",
        name: "Emotion Tone Bells",
        blurb: "Bells that ring the feeling of a room before anyone speaks.",
        detail:
          "Hung in doorways and council halls, the bells sound a soft chord of the gathering's collective state. An angry meeting enters as dissonance and leaves as harmony — the bell tells everyone when they are done, honestly.",
        visual:
          "a set of slender hanging bells over a meeting room doorway glowing with colors that shift with the mood inside the room",
      },
      {
        id: "animal-dialogue-collars",
        name: "Animal Dialogue Collars",
        blurb: "Collars that translate between species who never needed words before.",
        detail:
          "The collar renders intention — hunger, boundary, curiosity, grief — into simple sentences either side can act on. Rivers are negotiated with beaver councils; wolves file complaints about walking routes; nobody is translated against their will.",
        visual:
          "a person kneeling in a meadow speaking with a wolf wearing a softly glowing collar, translucent words of light between them",
      },
      {
        id: "galactic-bulletin-streams",
        name: "Galactic Bulletin Streams",
        blurb: "Public streams that carry news between worlds like currents carry leaves.",
        detail:
          "Anyone may cast into the stream; every world receives it after the honesty filters and the mourning delays have done their work. It is slower than rumor and incorruptible, which is why civilizations trust it with their hardest days.",
        visual:
          "a public plaza where people gather beneath a slow-moving stream of projected headlines and images of light from many worlds",
      },
      {
        id: "ancestral-echo-arrays",
        name: "Ancestral Echo Arrays",
        blurb: "Stone circles that play back the voices deposited in a place.",
        detail:
          "Every word spoken with weight leaves an echo in stone; the arrays simply play it back when the descendants need it. Councils begin hard sessions by listening to the founders argue — and hearing them resolve.",
        visual:
          "an ancient circle of standing stones glowing faintly at dusk, translucent elder figures of light speaking from between the stones",
      },
      {
        id: "silent-council-tables",
        name: "Silent Council Tables",
        blurb: "Tables where decisions are reached entirely without speaking.",
        detail:
          "The table renders each seat's position as shifting light-shapes on its surface, so deliberation happens in silence and reading faces. Decisions take longer and unravel less; the table's designers consider speech a shortcut with a toll.",
        visual:
          "councilors seated around a dark stone table where glowing light-shapes shift across the surface, no one speaking, deep focus",
      },
      {
        id: "signal-moth-couriers",
        name: "Signal Moth Couriers",
        blurb: "Living letters with luminous wings that always find their person.",
        detail:
          "Grown for one delivery only, a signal moth carries the message in the pattern of its wings and folds itself into light on arrival. People keep the arrival times like keepsakes: the moth always lands on the shoulder that needed it.",
        visual:
          "a luminous moth with lettered patterns of light on its wings landing on an outstretched hand at dusk, dissolving into motes",
      },
      {
        id: "heartbeat-bond-chains",
        name: "Heartbeat Bond Chains",
        blurb: "Bracelets that let beloveds feel each other's pulse across any distance.",
        detail:
          "Each chain link holds one bond; the bracelet carries the faint rhythm of everyone on it. No messages, no calls — just the proof of continued existence, which grief and war have taught civilizations is sometimes the entire request.",
        visual:
          "a delicate chain bracelet glowing gently in rhythm, worn on a wrist, tiny linked points of light drifting toward a distant horizon",
      },
      {
        id: "planetary-announcement-spires",
        name: "Planetary Announcement Spires",
        blurb: "Spires that speak to a whole world at once, used only for worth.",
        detail:
          "Once per era on average, a spire carries a voice to every ear on the planet simultaneously. The technology is trivial; the ceremony around it is not. Most spires stand silent for generations, and every silence is deliberate.",
        visual:
          "a tall slender spire in a great city emitting a single ripple of light across the sky, everyone in the streets listening upward",
      },
      {
        id: "interdimensional-relay-booths",
        name: "Interdimensional Relay Booths",
        blurb: "Phone booths that dial across the walls between adjacent realities.",
        detail:
          "Step in, state your reality of origin and your business, and the booth rings through. Calls are brief by nature — the membrane between worlds charges by the second — so callers learn to say the important thing first.",
        visual:
          "a solitary ornate booth standing in mist, its interior glowing, the silhouette of a caller with light-lines threading through the walls",
      },
      {
        id: "time-delayed-letter-crystals",
        name: "Time-Delayed Letter Crystals",
        blurb: "Crystals that hold a message until a future date releases it.",
        detail:
          "Written to a child, a successor, a self a decade on, the crystal warms on its release day and speaks. Whole cultures write them in times of joy so that hard times inherit proof that joy was real.",
        visual:
          "a shelf of dormant crystals in a study, one crystal beginning to glow warmly and release drifting letters of light",
      },
      {
        id: "group-mind-rings",
        name: "Group Mind Rings",
        blurb: "Rings that link a small circle of minds into one thinking whole.",
        detail:
          "Choirs of surgeons, storm-architects and negotiators work in rings of six — no more, by law and by wisdom. The ring thinks together for the task and dissolves politely afterward; nobody keeps a ring on all day, and the law says why.",
        visual:
          "six people standing in a circle holding hands, a ring of light passing through all of them, solving a hovering problem of light",
      },
      {
        id: "first-contact-kits",
        name: "First Contact Kits",
        blurb: "Everything a nervous crew needs to meet strangers without ruining it.",
        detail:
          "The kit holds translator pendants, patience timers, gift-protocols for a hundred senses and a card that reads simply: they are as afraid of you as you are of them, and both of those can be loved.",
        visual:
          "an open case of carefully arranged glowing instruments, pendants and sealed gifts on a landing field at dawn, two silhouettes approaching",
      },
    ],
  },
  {
    id: "travel",
    title: "Travel & Portals",
    icon: "rocket",
    description:
      "Getting there — gates, sails, ferries and folds for crossing oceans, continents and the space between realities.",
    items: [
      {
        id: "stargate-rings",
        name: "Stargate Rings",
        blurb: "Standing rings that fold two distant skies into one step.",
        detail:
          "Each ring holds its partner's address in resonant stone; step through and the two doors become one door. Journeys are walked, not flown — you leave one world's weather and arrive into another's, usually mid-rainfall, always welcome.",
        visual:
          "a massive ancient stone ring standing upright, its center filled with a shimmering pool of event-horizon light, travelers stepping through",
      },
      {
        id: "merkaba-light-chassis",
        name: "Merkaba Light Chassis",
        blurb: "Counter-rotating light vehicles piloted by the mind that grew them.",
        detail:
          "The chassis is grown around its pilot's consciousness, which learns to hold two opposing spins at once. It cannot be stolen, boarded or bought — only inherited from a teacher who has watched you fail safely many times.",
        visual:
          "a pilot seated in lotus position inside two counter-rotating fields of geometric light, stars streaking gently around the field",
      },
      {
        id: "wormhole-stabilizer-arches",
        name: "Wormhole Stabilizer Arches",
        blurb: "Arches that keep a natural tunnel open long enough to be polite.",
        detail:
          "Wild wormholes pinch shut without warning; the arches stake a tunnel's throat with harmonics so crossings become boring, which is the highest compliment in tunnel engineering. The arch hums a departure chord and counts you through.",
        visual:
          "a great metallic arch at the mouth of a swirling tunnel of stars, harmonic rings pulsing outward to hold the tunnel open",
      },
      {
        id: "gravity-sled-runners",
        name: "Gravity Sled Runners",
        blurb: "Sleds that fall sideways down gentle gravity the whole journey.",
        detail:
          "The runner paints its own downhill and never stops falling — across ice, desert or sea. Children ride them to school in chains of six; the sixth seat is always left for whichever friend arrives last.",
        visual:
          "children riding a sleek open sled that hovers inches above a frozen plain, a faint visible downhill slope of gravity ahead",
      },
      {
        id: "teleport-blossom-pads",
        name: "Teleport Blossom Pads",
        blurb: "Pads that open like flowers, receive you, and close without a pop.",
        detail:
          "The blossom reads your intention, agrees on a destination petal, and folds you through in the time of one slow inhale. Motion sickness is unknown here; the pads deliberately choose routes with nice views between.",
        visual:
          "a circular pad of petal-like segments opening upward with light spilling from between them, a traveler mid-step, calm garden around",
      },
      {
        id: "star-charter-caravans",
        name: "Star Charter Caravans",
        blurb: "Caravans of linked vessels that cross the dark the old way — together.",
        detail:
          "For those who distrust folding space, the caravans cruise the slow bright way, trading stories between ports. A crossing takes years and is remembered the way ancient Earth remembered its migration trails: as the story of a lifetime.",
        visual:
          "a convoy of ornate starships linked by glowing cables crossing a nebula, families visible on open observation decks",
      },
      {
        id: "ley-line-trains",
        name: "Ley-Line Trains",
        blurb: "Trains that ride the planet's own magnetic embroidery.",
        detail:
          "Following the world's telluric currents, the trains glide without rails through countryside at a speed that never startles the deer. The carriages are grown wood and glass; the schedule is signed by the season.",
        visual:
          "an elegant wooden and glass train gliding above a meadow following a faint glowing line in the land, rolling hills at golden hour",
      },
      {
        id: "cloud-ferry-gondolas",
        name: "Cloud Ferry Gondolas",
        blurb: "Ferry gondolas that ride the wind's rivers between high cities.",
        detail:
          "Steered by pilots who know the sky's waterways by their first names, the ferries carry market goods, letters and elders with slow opinions. The worst that ever happens is arriving late and full of new friends.",
        visual:
          "an ornate gondola airship sailing between floating cloud cities at sunset, sails of woven light, passengers leaning over the rail",
      },
      {
        id: "folding-map-compasses",
        name: "Folding Map Compasses",
        blurb: "Compasses that fold the map until your destination touches your toe.",
        detail:
          "Point the needle, and the compass negotiates a gentle fold of local space — a step of a few meters covers a valley. Overuse is frowned upon; the walking is considered half of whatever the walking was for.",
        visual:
          "an ornate handheld compass projecting a visible fold in the landscape ahead, two distant hills brought together by a seam of light",
      },
      {
        id: "ship-mind-cores",
        name: "Ship-Mind Cores",
        blurb: "Grown cores that are the ship — crew, engine and parliament in one.",
        detail:
          "A ship-mind is raised over decades with its crews the way an elephant is raised with its herd. It knows every creak, every fear of heights, every birthday aboard, and it refuses exactly one order: to fly without consent.",
        visual:
          "the heart chamber of a living ship, a vast glowing organic core like a brain of light and coral, corridors curving away around it",
      },
      {
        id: "portal-key-stones",
        name: "Portal Key Stones",
        blurb: "Pocket stones that unlock standing doors nobody has used in ages.",
        detail:
          "Half the doors on older worlds stand locked only because everyone forgot their keys. A key stone remembers the door it was grown beside; travellers collect them the way ancestors collected postcards.",
        visual:
          "a hand pressing a carved stone into a recess of an ancient mossy doorway, the doorway's interior beginning to glow with warm light",
      },
      {
        id: "astral-ferry-barges",
        name: "Astral Ferry Barges",
        blurb: "Barges that ply the dream-side sea between waking and sleeping.",
        detail:
          "Boarded in sleep, the ferries carry dreamers across the astral shallows to visits, lessons and reunions. The fare is a memory you agree to relive kindly; the ferryman is someone's grandmother, always, by tradition.",
        visual:
          "a lantern-lit barge drifting on a mirror-dark sea beneath impossible stars, sleeping dreamers aboard wrapped in soft light",
      },
      {
        id: "orbit-ladder-elevators",
        name: "Orbit Ladder Elevators",
        blurb: "Climbing cables that turn orbit into a stairwell with a view.",
        detail:
          "The ladder is a woven light-cable anchored to a mountain and a counterweight moonlet. The ascent takes three gentle days, and the cabins come with beds, balconies and a bell for the moment gravity lets go.",
        visual:
          "a slender luminous cable rising from a green mountain into the stars, small cabin balconies climbing it, the planet curving away",
      },
      {
        id: "phantom-step-boots",
        name: "Phantom-Step Boots",
        blurb: "Boots that walk on air for exactly as long as the walker is calm.",
        detail:
          "Each calm step leaves a brief platform of force; a frightened thought dissolves it immediately. They are issued to rescuers and to children learning emotional literacy, in that order of urgency depending on the planet.",
        visual:
          "a walker crossing a deep canyon on invisible platforms, faint ripples of light appearing under each calm boot step",
      },
      {
        id: "dimensional-ferry-wharves",
        name: "Dimensional Ferry Wharves",
        blurb: "Wharves where boats dock from sides of reality nobody can point to.",
        detail:
          "The wharf holds a berth open between here and nearby-here, and ferries slide in with cargoes of salt from seas that never existed here. Customs officers check moods, not papers; the ferry schedule is written in two weathers at once.",
        visual:
          "a misty stone wharf at dawn with an impossible boat moored at an angle that hurts to look at, lanterns in two colors of light",
      },
      {
        id: "comet-hitch-frames",
        name: "Comet-Hitch Frames",
        blurb: "Frames that let travelers ride a comet the way ancestors rode wind.",
        detail:
          "Clip a hitch-frame to a comet's tail-path and the frame carries a small cabin in the comet's slipstream, insulated and warm. It is slow, it is freezing, it is spectacular — hitchers write the best letters in the archive.",
        visual:
          "a small glowing cabin in a protective frame riding the glowing tail of a comet through deep space, stars streaking past",
      },
      {
        id: "slip-dock-cradles",
        name: "Slip-Dock Cradles",
        blurb: "Harbor cradles that catch ships arriving from faster-than-light coasts.",
        detail:
          "A ship exits slipstream with the momentum of a small moon; the cradle catches it in nested fields and rocks it still. Arriving crews know they are home when they feel the cradle's first slow breath of deceleration.",
        visual:
          "a starship being cradled by concentric glowing rings inside a great harbor structure, its speed visibly draining into the rings",
      },
      {
        id: "void-sails",
        name: "Void Sails",
        blurb: "Sails of dark silk that pull from the direction stars are missing.",
        detail:
          "Void sails catch the pressure of absence — the faint lean of spacetime toward emptier places. Navigators train years to read nothingness well enough to steer by it; the sails themselves are woven from retired night skies.",
        visual:
          "a ship with vast sails of deep black shimmering silk moving through a starfield, faint ripples in the darkness ahead pulling it",
      },
      {
        id: "homecoming-return-stones",
        name: "Homecoming Return Stones",
        blurb: "Stones that always bring you back to the doorstep you left from.",
        detail:
          "Carried on every long journey, the return stone holds the exact coordinates of home — including the season, the light and the smell of the kitchen. Crack one in your palm and be there; the fragments are planted afterward.",
        visual:
          "a traveler cracking a small stone that blossoms into a doorway of warm light, home visible inside, night field around them",
      },
      {
        id: "childrens-orbit-swings",
        name: "Children's Orbit Swings",
        blurb: "Playground swings that arc children briefly into orbit and back.",
        detail:
          "The swing's arc peaks just past the atmosphere's edge for eleven seconds of floating, then sets the laughing child gently down. The record for one swing is a stick, which flew back to orbit and is now a protected monument.",
        visual:
          "a playground swing on a hilltop, a laughing child at the top of an arc that reaches into the starry sky, hair floating weightless",
      },
    ],
  },
  {
    id: "knowledge",
    title: "Learning & Memory",
    icon: "brain",
    description:
      "How knowing is kept and given — libraries of crystal, schools of dream, and memory that can be held like a hand.",
    items: [
      {
        id: "knowledge-crystal-libraries",
        name: "Knowledge Crystal Libraries",
        blurb: "Libraries where every book is a crystal you hold to your brow.",
        detail:
          "Each crystal stores one work in the voice of its author, so reading is closer to being told something by someone. Returning a crystal is required by etiquette; losing one is impossible, since crystals always know the way home.",
        visual:
          "a vast library hall of glowing crystal shelves, a reader holding a small crystal to their forehead, light spilling from its facets",
      },
      {
        id: "skill-infusion-headbands",
        name: "Skill Infusion Headbands",
        blurb: "Bands that lend a skill for a day and return it improved.",
        detail:
          "Borrowed from living masters, the skill runs shallow — enough to act, not enough to pretend mastery. Every borrow leaves a gentle improvement in the original owner, which is why masters lend constantly and grow famous twice.",
        visual:
          "a craftsperson wearing a slender glowing headband, their hands moving with sudden expertise over unfamiliar tools, light tracing the motion",
      },
      {
        id: "past-life-reading-rooms",
        name: "Past-Life Reading Rooms",
        blurb: "Quiet rooms where earlier selves can be visited like relatives.",
        detail:
          "The room frames a past life as a completed book — readable, discussable, no longer in charge. Sessions end with tea and the same exit question: what would you like this one to do differently?",
        visual:
          "a small round reading room with a hovering translucent scene of an earlier era above a table, a person watching it calmly with tea",
      },
      {
        id: "dream-schools",
        name: "Dream Schools",
        blurb: "Schools attended entirely asleep, where the curriculum is chosen nightly.",
        detail:
          "Students arrive in their sleep, learn at the speed of understanding rather than the speed of hours, and wake with homework that feels like a pleasant itch. Attendance is perfect; truancy is impossible by definition.",
        visual:
          "sleeping children in beds whose dreams visibly connect above them into a shared luminous classroom of floating symbols",
      },
      {
        id: "memory-palace-fountains",
        name: "Memory Palace Fountains",
        blurb: "Fountains whose waters let you walk through your own remembered rooms.",
        detail:
          "Sip or touch the water and the mind's memory-architecture becomes literally walkable — dusty halls dusted, locked doors discussed. Therapists keep small fountains; historians keep enormous ones; families keep theirs in the garden.",
        visual:
          "a courtyard fountain whose spray forms translucent architectural rooms and hallways of light above the water, a visitor walking through",
      },
      {
        id: "language-sleep-tutors",
        name: "Language Sleep Tutors",
        blurb: "Night voices that teach a language by narrating your own dreams.",
        detail:
          "The tutor waits until you dream, then gently re-narrates the dream in the language being learned. Fluency arrives in seasons; the dreams remain entirely yours, only now with subtitles you can feel.",
        visual:
          "a sleeping person with a small bedside device emitting soft glowing words of a foreign script that weave into the dream above",
      },
      {
        id: "history-re-walk-domes",
        name: "History Re-Walk Domes",
        blurb: "Domes where history is walked through as weather, not dates.",
        detail:
          "The dome renders a documented era as climate — you feel the famine's cold, the treaty's morning, the crowd's hope. Nothing is dramatized; the archive's honesty is the whole attraction, and schoolchildren emerge quieter and kinder.",
        visual:
          "a great dome interior where visitors walk beneath a living historical scene rendered as shifting weather and light around them",
      },
      {
        id: "focus-lens-spectacles",
        name: "Focus Lens Spectacles",
        blurb: "Spectacles that blur everything except what you decided mattered.",
        detail:
          "Worn during deep work, they dim the visual noise of the world to candle-glow around the task. They cannot be worn more than four hours; the designers believe a mind needs its noise, like a field needs its weeds.",
        visual:
          "a scholar wearing elegant spectacles with a soft cone of clarity over their desk, the surrounding library fading to warm blur",
      },
      {
        id: "question-wells",
        name: "Question Wells",
        blurb: "Wells you drop a question into and draw an answer up bucket by bucket.",
        detail:
          "The well's water holds the thinking of ten thousand previous askers; your question sinks until it finds company. Answers arrive in layers — first fact, then counsel, then the question you should have asked instead.",
        visual:
          "an old stone well at night, a person drawing up a glowing bucket, faint luminous question shapes drifting in the well water",
      },
      {
        id: "telepathic-seminar-circles",
        name: "Telepathic Seminar Circles",
        blurb: "Seminars where discussion happens entirely in shared thought.",
        detail:
          "Twelve minds, one topic, no interruptions — thoughts are offered, weighed and returned like passed dishes. The sessions last an hour and equal a month of talking, which is why graduates report silence feeling suddenly roomy.",
        visual:
          "twelve seated figures in a circle with a soft web of light between their heads, complex glowing idea-shapes drifting in the center",
      },
      {
        id: "star-map-orrey-desks",
        name: "Star-Map Orrery Desks",
        blurb: "Desks that grow a working orrery of any system you are curious about.",
        detail:
          "Ask about a system and the desk grows its worlds in light at true relative scale, then narrates their history as they turn. Students learn astronomy by befriending systems; the desks remember every question ever asked on them.",
        visual:
          "a wooden desk with a holographic orrery of glowing planets and orbits rising above it, a child reaching toward one world",
      },
      {
        id: "concentration-chime-gates",
        name: "Concentration Chime Gates",
        blurb: "Gates that open only for a mind that has arrived fully.",
        detail:
          "The gate reads your attention like a bouncer reads ID — scattered, and it stays shut; gathered, and it swings wide with a chime. Children learn to gather their minds young, and the gates reward them with a sound they never forget.",
        visual:
          "a simple elegant gate with hanging chimes beginning to swing and glow as a child approaches with closed focused eyes",
      },
      {
        id: "wisdom-elder-holograms",
        name: "Wisdom Elder Holograms",
        blurb: "Recorded elders who answer new questions from their lifetime of answers.",
        detail:
          "Not ghosts — archives with manners. Each hologram knows the limits of its recording and says so, often. The best ones answer a question with a better question, and the technology preserves that on purpose.",
        visual:
          "a serene translucent elder figure of light seated by a fire, speaking with a small group of listeners in a warm hall",
      },
      {
        id: "child-curiosity-nests",
        name: "Child Curiosity Nests",
        blurb: "Nests of soft instruments that answer a child's question three ways.",
        detail:
          "Every question gets one answer as story, one as experiment, one as silence to sit with. The nest grows with the child; by adolescence it has learned when to answer and when to hand over a shovel and a map.",
        visual:
          "a large cozy nest of woven branches and cushions filled with glowing instruments, a curious child holding a floating question of light",
      },
      {
        id: "galactic-encyclopedia-seeds",
        name: "Galactic Encyclopedia Seeds",
        blurb: "Seeds that grow into a full encyclopedia tree wherever they are planted.",
        detail:
          "Plant one and within a year its leaves display entries in light when touched by a reader. Pruned cuttings root into daughter encyclopedias; the original mother-tree grows in a courtyard everyone can name.",
        visual:
          "a graceful tree whose leaves are small glowing panes of text in many scripts, people touching leaves in a public courtyard",
      },
      {
        id: "meditation-depth-gauges",
        name: "Meditation Depth Gauges",
        blurb: "Gauges that measure stillness the way rivers measure depth.",
        detail:
          "Worn or placed nearby, the gauge shows a meditator their depth as water level in a slim vial — no scores, no shame, just weather. Monasteries use them to teach, then hide them, then teach without them, in that order.",
        visual:
          "a meditating figure beside a slim glass vial where softly glowing liquid rises slowly to mark depth, mountain morning light",
      },
      {
        id: "mathematics-light-blocks",
        name: "Mathematics Light Blocks",
        blurb: "Children's blocks that make equations you can hold, drop and rebuild.",
        detail:
          "Each block is a number, operation or unknown; assemble them and true structures glow solid while false ones wobble politely. Mathematicians keep sets on their desks long after childhood, citing structural reasons.",
        visual:
          "a child building a glowing tower of translucent numbered blocks, an equation hovering complete above the tower in light",
      },
      {
        id: "empathy-training-mirrors",
        name: "Empathy Training Mirrors",
        blurb: "Mirrors that show your face as the other person in the argument sees it.",
        detail:
          "Used in mediation training, the mirror renders your expression with the other side's history laid over it. Students report the first look is unbearable and the hundredth is grateful; the curriculum is built around both.",
        visual:
          "a person facing an ornate mirror that reflects their face subtly transformed, faint ghostly expressions of others layered around it",
      },
      {
        id: "memory-backup-amulets",
        name: "Memory Backup Amulets",
        blurb: "Amulets that keep a copy of your dearest memories, just in case.",
        detail:
          "Updated nightly in sleep, the amulet holds the moments its wearer marked as unloseable. They are almost never needed, which is the point — grief after injury is bad enough without the photographs being gone too.",
        visual:
          "a small pendant amulet opened to reveal a tiny glowing scene suspended inside, resting on a nightstand beside a sleeping figure",
      },
      {
        id: "silent-knowledge-forests",
        name: "Silent Knowledge Forests",
        blurb: "Forests where the trees themselves hold the curriculum of a world.",
        detail:
          "Grown from archive-seeds, each tree teaches what it stands for — the cedar holds shipbuilding, the birch holds medicine. Walking the forest slowly is the entire course; graduation is measured in years and Grandmother trees.",
        visual:
          "a misty ancient forest where tree trunks bear faint glowing script rings, a student touching a trunk and light rising in response",
      },
    ],
  },
  {
    id: "fabrication",
    title: "Creation & Fabrication",
    icon: "cog",
    description:
      "The making of things — forges of thought, printers of matter and swarms that repair what the centuries wear down.",
    items: [
      {
        id: "matter-printer-looms",
        name: "Matter-Printer Looms",
        blurb: "Looms that weave solid objects from threads of reorganized dust.",
        detail:
          "Feed the loom sand, scrap or ash; it unspools the material into object-threads and weaves them into being. Every made thing carries its maker's patience as clearly as grain carries a tree's weather.",
        visual:
          "a loom weaving a solid chair out of visible threads of golden dust, half-finished objects and raw sand in bins beside it",
      },
      {
        id: "thought-forge-anvils",
        name: "Thought-Forge Anvils",
        blurb: "Anvils where a held idea is hammered into a working prototype.",
        detail:
          "The smith holds the design in mind while the forge renders each hammer-strike closer to function. Sloppy thinking produces wobbling results immediately, which is why every apprentice first learns to think slowly and clearly.",
        visual:
          "a smith striking a glowing anvil from which a half-formed machine of light and metal is emerging, sparks shaping into gears",
      },
      {
        id: "geometry-grown-tools",
        name: "Geometry-Grown Tools",
        blurb: "Tools grown in crystal gardens to the shape of the work they will do.",
        detail:
          "Seed the garden with the task, not the blueprint — the tool grows to fit the work, the hand and the town's style. Two hammers from the same garden are siblings, not twins, and hammer-smiths can tell you exactly why.",
        visual:
          "a crystal garden bed where tools — hammers, shears, chisels — grow upward like plants, morning dew on their crystalline surfaces",
      },
      {
        id: "sand-to-silicon-kilns",
        name: "Sand-to-Silicon Kilns",
        blurb: "Kilns that turn beach sand into thinking stone for gentle machines.",
        detail:
          "The kiln's slow fire persuades sand into lattice-grade silicon without a single toxic whisper. Villages own them communally; the waiting list is for the sand delivery, not the machines.",
        visual:
          "a rounded kiln glowing warm orange on a beach at night, glowing silicon ingots cooling on a stone table beside it",
      },
      {
        id: "self-assembling-scaffolds",
        name: "Self-Assembling Scaffolds",
        blurb: "Scaffolds that climb the building as it grows and vanish when it stands.",
        detail:
          "Built from shape-remembering struts, the scaffold reconfigures itself by the hour and folds away into a crate at completion. Construction sites without scaffolds are considered either finished or suspicious.",
        visual:
          "a building under construction wrapped in a lattice of self-moving struts rearranging themselves, no workers in danger, blue sky",
      },
      {
        id: "sound-welding-torches",
        name: "Sound-Welding Torches",
        blurb: "Torches that join metal with a chord instead of a flame.",
        detail:
          "The torch finds the note where two metals agree to merge and holds it until they do. Seams made this way are stronger than the parent metal and, on quiet nights, can be heard humming in agreement.",
        visual:
          "a craftsperson holding a torch that emits visible concentric sound rings, two metal pieces fusing with a bright seam of light",
      },
      {
        id: "symbiotic-tool-organisms",
        name: "Symbiotic Tool Organisms",
        blurb: "Living tools that eat corrosion, exercise their edges and ask for oil.",
        detail:
          "Part creature, part instrument, they sharpen themselves nightly and refuse work they judge unsafe. A well-kept tool-organism lives forty years and is buried with honors; a neglected one simply walks away.",
        visual:
          "a workbench where a sleek organic tool with a mother-of-pearl shell stretches and glows, being fed a drop of oil by its keeper",
      },
      {
        id: "nano-repair-swarms",
        name: "Nano-Repair Swarms",
        blurb: "Swarms of intelligent dust that repair bridges while you watch.",
        detail:
          "Released over fatigue cracks and old wounds in structures, the swarm listens, mends and returns to its vial heavier with wisdom. Cities release them each spring; the bridges grow slightly stronger every year, which no one explains to tourists.",
        visual:
          "a shimmering cloud of golden dust-like motes flowing into a crack in a massive bridge girder, the crack sealing with new metal",
      },
      {
        id: "recycler-moth-furnaces",
        name: "Recycler Moth Furnaces",
        blurb: "Furnace-moths that eat garbage and lay eggs of raw material.",
        detail:
          "The moths sort by taste — metals, polymers, glass — and their eggs hatch into certified pure feedstock. Landfills are mined nostalgically here; the moths get fat, the cities get clean, and nothing is ever buried twice.",
        visual:
          "large luminous moths with furnace-glow abdomens circling a heap of waste, emerging eggs of sorted raw materials glowing beside",
      },
      {
        id: "shape-memory-textiles",
        name: "Shape-Memory Textiles",
        blurb: "Cloth that remembers every fold you have ever liked.",
        detail:
          "A coat worn a season learns its owner's gestures and begins to assist them — collars rise before wind arrives, pockets deepen before hands are cold. Old garments retire into quilts that remember everyone who wore them.",
        visual:
          "a flowing cloak adjusting its own folds as the wearer moves, fabric shimmering with faint embedded pattern-light",
      },
      {
        id: "living-metal-vats",
        name: "Living Metal Vats",
        blurb: "Vats where metal is cultured like cheese and behaves like muscle.",
        detail:
          "Living metal heals scratches overnight, refuses to fatigue and grows slightly stronger where it is loved. Shipwrights culture hulls for decades before launch; the launch day is the hull's graduation, and the crews cry.",
        visual:
          "a vast vat of liquid silver metal slowly stirring itself, a finished breastplate of the same metal gleaming on a stand nearby",
      },
      {
        id: "crystal-growth-orchestrions",
        name: "Crystal-Growth Orchestrions",
        blurb: "Machines that grow perfect crystals by conducting them like choirs.",
        detail:
          "Each orchestrion plays a mineral's preferred symphony while supersaturated solution crystallizes on cue. The resulting lattices are flawless and faintly musical; tuning forks are still grown this way on nine worlds.",
        visual:
          "an ornate orchestrion machine with mechanical arms conducting above a growing cluster of luminous perfect crystals",
      },
      {
        id: "gravity-casting-pits",
        name: "Gravity-Casting Pits",
        blurb: "Pits where gravity itself is the mold for a thousand ton shapes.",
        detail:
          "Molten metal is poured into a shaped gravity field — no forms, no seams, no waste. Keel timbers, bridge spines and bell mouths are cast in single pours, and the pit-masters sign their work with a fingerprint of spin.",
        visual:
          "a glowing pit where molten metal floats in a shaped invisible mold held by visible rings of gravity distortion, sparks rising",
      },
      {
        id: "light-etching-styluses",
        name: "Light-Etching Styluses",
        blurb: "Styluses that carve any surface with lines of controlled light.",
        detail:
          "The stylus removes exactly the molecules asked for and returns the rest as polish. Signatures, star charts and love letters etched by master styluses are traded between worlds like small paintings.",
        visual:
          "a hand guiding a slender stylus emitting a fine line of light that etches an intricate star chart into a dark stone tablet",
      },
      {
        id: "story-forged-artifacts",
        name: "Story-Forged Artifacts",
        blurb: "Objects forged from a family's told stories, strong as iron and kinder.",
        detail:
          "The forge renders narrative weight as material strength: a hinge made of four generations of jokes outlasts the door. Appraisers can read a story-forged blade's plot from the grain, and refuse to appraise sad endings.",
        visual:
          "a blacksmith presenting a gleaming blade whose metal surface shimmers with faint moving scenes like memories in the grain",
      },
      {
        id: "modular-habitat-kits",
        name: "Modular Habitat Kits",
        blurb: "Kits of universal joints and panels that build any home in a weekend.",
        detail:
          "Every part fits every other part by design law; the only tool required is disagreement and the patience to resolve it. Refugee cities rise in days this way and, generations later, are simply the city.",
        visual:
          "a half-built home of elegant white modular panels and glowing joints, a family fitting pieces together, neighbors carrying more",
      },
      {
        id: "atmosphere-seamsters",
        name: "Atmosphere Seamsters",
        blurb: "Tenders who stitch torn skies closed with needles of charged thread.",
        detail:
          "Where a world's atmosphere has been torn — by impact, by carelessness, by war — seamsters sew the pressure layers back with ion thread. The stitches dissolve in a decade, by which time the sky has agreed to hold itself.",
        visual:
          "a figure in a floating suit sewing a visible tear in the glowing boundary of a planet's sky, needle trailing charged thread",
      },
      {
        id: "quantum-assembly-choirs",
        name: "Quantum Assembly Choirs",
        blurb: "Choirs whose agreement collapses molecules into chosen arrangements.",
        detail:
          "Twelve voices in exact accord persuade probability to favor the product; solo assembly is forbidden by physics and by union rules. The choirs rehearse like musicians because that is, precisely, what they are.",
        visual:
          "a choir of twelve on tiered platforms singing as complex molecules visibly assemble in the air above the audience",
      },
      {
        id: "time-lapse-growth-accelerators",
        name: "Time-Lapse Growth Accelerators",
        blurb: "Fields that let a sapling experience fifty years in one patient afternoon.",
        detail:
          "Nothing is forced — the tree simply lives its seasons faster inside the field, rings and all. Foresters use them to rebuild burned forests in a watchable afternoon, then sit down with tea and watch the years go by.",
        visual:
          "a grove inside a shimmering dome where saplings visibly cycle through seasons in minutes, falling leaves drifting in fast motion",
      },
      {
        id: "craft-genome-vaults",
        name: "Craft Genome Vaults",
        blurb: "Vaults that store every craft as a living genome, growable on demand.",
        detail:
          "A craft — glassblowing, ship's cartography, the perfect arrow — is stored as the seeded habits of its makers. Check out a genome, apprentice to it for a decade, and optionally return your improvements with interest.",
        visual:
          "a vault hall of glowing seed-vaults in glass columns, each column humming faintly, a craftsperson receiving a small glowing seed",
      },
    ],
  },
  {
    id: "planetary",
    title: "Planetary & Weather",
    icon: "globe",
    description:
      "Tending worlds as gardens — weather coaxed rather than conquered, oceans and skies repaired rather than replaced.",
    items: [
      {
        id: "weather-harmony-spires",
        name: "Weather-Harmony Spires",
        blurb: "Spires that negotiate with storms instead of fighting them.",
        detail:
          "The spire sings the storm's own pressure-song back a quarter-tone kinder, and storms, being mostly rhythm, usually agree. Rain arrives on market days by standing appointment; droughts are treated as arguments the spire lost, publicly.",
        visual:
          "a slender spire on a hill broadcasting rings of visible sound into an approaching storm that is visibly parting around the town",
      },
      {
        id: "ocean-pulse-regulators",
        name: "Ocean Pulse Regulators",
        blurb: "Regulators that keep the sea's heartbeat steady through the centuries.",
        detail:
          "Placed along current boundaries, they damp the oceans' wilder moods the way a damper pedal softens a piano. The sea keeps its weather and its whale-song; it simply stops breaking continents when it is upset.",
        visual:
          "a deep-sea array of glowing sentinel towers on the ocean floor with steady pulse rings rippling outward through the water",
      },
      {
        id: "rain-seed-balloons",
        name: "Rain-Seed Balloons",
        blurb: "Balloons that plant consent-form rain in clouds that want to give.",
        detail:
          "Launched into willing cumulus, the seed balloons catalyze rainfall the cloud was already inclined toward. If the cloud declines, the balloon returns full of humility and is reused; the sky is never argued with here.",
        visual:
          "a fleet of glowing seed-balloons rising into huge gentle rain clouds, first drops falling on a dry and hopeful valley",
      },
      {
        id: "forest-council-groves",
        name: "Forest Council Groves",
        blurb: "Grove translators who attend meetings between forests and farmers.",
        detail:
          "The grove's sensor-trees render the forest's collective position into proposals — where to cut, where never, and why in root-language. Harvests are signed by both parties; the forest's signature is read from the lichen.",
        visual:
          "a clearing where ancient trees surround a stone table, translators with glowing staves mediating between loggers and luminous root patterns",
      },
      {
        id: "glacier-blanket-weaves",
        name: "Glacier Blanket Weaves",
        blurb: "Woven reflectors that tuck glaciers in against the fever years.",
        detail:
          "Laid across ablation zones each summer, the blanket-weaves buy the ice centuries at a cost of some pride. The glaciers consented by long tradition; the blankets are removed the day the fever breaks, and buried with the last heat.",
        visual:
          "vast shimmering reflective blankets draped over blue glacier ice under a hot sun, melt streams reduced to a trickle beneath",
      },
      {
        id: "volcano-pressure-valves",
        name: "Volcano Pressure Valves",
        blurb: "Valves that let mountains exhale safely instead of catastrophically.",
        detail:
          "Drilled with consent of everyone downhill, the valves vent magma pressure as slow orange fountains that draw tourists instead of funerals. The volcanologists here are mostly plumbers, and they are adored.",
        visual:
          "a mountainside vent releasing a slow controlled fountain of glowing lava into a channel, engineers monitoring from a safe ridge",
      },
      {
        id: "desert-bloom-canals",
        name: "Desert-Bloom Canals",
        blurb: "Canals that carry morning fog inland and leave forests behind them.",
        detail:
          "Fog-harvesting canals stretch from coast to desert interior, dripping a year of dew into each kilometer. Fifty years on, the route is a green corridor with its own weather, and the camels have opinions about the tolls.",
        visual:
          "a long straight canal lined with young green forest cutting through golden desert, morning fog flowing along it like a river",
      },
      {
        id: "atmosphere-repair-veils",
        name: "Atmosphere Repair Veils",
        blurb: "High veils that mend a wounded sky one repaired molecule at a time.",
        detail:
          "Deployed in the stratosphere after chemical wounds, the veils catch and reassemble what was broken, then deorbiter themselves as shooting stars. Crews who served on them are granted, by tradition, the first wish on the first repaired sunset.",
        visual:
          "vast luminous veils floating at the edge of space above a planet's limb, faint molecules of light stitching the ozone layer closed",
      },
      {
        id: "magnetic-pole-stabilizers",
        name: "Magnetic Pole Stabilizers",
        blurb: "Orbital anchors that keep a world's compass honest through pole-drift.",
        detail:
          "When a planet's magnetic poles wander, the stabilizers gently argue them home from orbit. Migratory birds never notice, which is the entire success metric, and the engineers celebrate annually with feathered hats.",
        visual:
          "orbital ring stations at a planet's poles projecting steady columns of magnetic light down to the ice, auroras calm overhead",
      },
      {
        id: "tidal-energy-lungs",
        name: "Tidal Energy Lungs",
        blurb: "Bay-wide lungs that breathe with the tide and exhale clean power.",
        detail:
          "The lungs rise and fall with each tide, pressing no turbine harder than the sea's own patience. Bays with lungs are the calmest harbors on their coasts; sailors moor inside them just for the sleep.",
        visual:
          "a vast bay covered in gently rising and falling luminous membrane structures breathing with the tide under a full moon",
      },
      {
        id: "wildlife-corridor-bridges",
        name: "Wildlife-Corridor Bridges",
        blurb: "Bridges grown over the roads so the old migrations stay unbroken.",
        detail:
          "The corridors are laid by reading ten thousand years of hoof-prints, not by committee. The roads tunnel underneath; the herds cross above, unbothered, and the bridge gardeners mow around the wolves out of professional courtesy.",
        visual:
          "a wide green land bridge covered in grass and wildflowers crossing above a quiet highway, elk herd crossing at dusk",
      },
      {
        id: "coral-choir-reefs",
        name: "Coral-Choir Reefs",
        blurb: "Reefs seeded with singing limestone that grows faster than grief.",
        detail:
          "The choir-coral grows to an acoustic score that doubles its laying rate; bleached skeletons are re-occupied within seasons. Snorkelers describe swimming over a reef under construction and being able to hear the blueprints.",
        visual:
          "a vast reef half pale-white and half vividly regrowing, sound waves of light rippling across the coral from submerged singers",
      },
      {
        id: "storm-diversion-fans",
        name: "Storm-Diversion Fans",
        blurb: "Great patient fans that steer hurricanes away from the politely asked.",
        detail:
          "The fans never stop storms — they nudge them seaward where the rain is needed anyway. Coastal cities pay a tithe of rain-gauge data; the open ocean receives the storm's grief and grows famously lush along the diverted paths.",
        visual:
          "enormous elegant fan structures on offshore platforms tilting to redirect a vast swirling hurricane away from a glowing coastline",
      },
      {
        id: "earthquake-warning-roots",
        name: "Earthquake-Warning Roots",
        blurb: "Sensor roots that feel the quarrel building between tectonic plates.",
        detail:
          "Grown deep along fault lines, the roots report the earth's mood in weeks, not seconds — enough time to hold drills, open schools as shelters and argue about whose turn it is to host. Cities here have never been surprised, only inconvenienced.",
        visual:
          "deep glowing root networks threading through dark rock strata along a fault line, warning pulses rising toward a quiet town above",
      },
      {
        id: "seed-vault-arks",
        name: "Seed-Vault Arks",
        blurb: "Vaults carved in bedrock that hold a world's tomorrow in cold trust.",
        detail:
          "Every nation deposits; every nation may withdraw; no one may sell. The arks are tended by an order that takes no sides, keeps no borders and answers, when asked, that the seeds are the only citizens who cannot speak.",
        visual:
          "a vast carved vault hall with endless glowing seed drawers in the bedrock, tenders in white moving quietly between them",
      },
      {
        id: "river-clean-heart-machines",
        name: "River-Clean-Heart Machines",
        blurb: "River-heart pumps that beat pollution downstream into their own stomachs.",
        detail:
          "Anchored at a river's heart, the machine inhales a gentle fraction of flow, strips the damage, and returns the water apologetically clean. Fish graduate around them; the machines keep score and publish it annually.",
        visual:
          "a great gentle pump structure in the middle of a river glowing softly, clean water swirling out one side, sediment drawn into intake vents",
      },
      {
        id: "sky-river-redirectors",
        name: "Sky-River Redirectors",
        blurb: "Stations that re-route the atmosphere's invisible rivers of vapor.",
        detail:
          "The sky's vapor rivers can flood one valley and starve its neighbor; the redirectors negotiate a fairer course with arrays of ion ribbon. Treaties govern the stations, and the negotiations are famously the longest running in the archive.",
        visual:
          "high-altitude stations projecting ribbon arrays that visibly bend a flowing luminous river of vapor across the sky",
      },
      {
        id: "ozone-lace-menders",
        name: "Ozone-Lace Menders",
        blurb: "Swarm-menders that re-lace torn ozone like patient grandmothers.",
        detail:
          "Released where the sky's shield has thinned, the menders weave oxygen back into its three-part lace and report the hole's mood hourly. Full closure is celebrated with the only holiday the stratosphere has ever been given.",
        visual:
          "a shimmering swarm of tiny menders at the edge of space weaving a visible lacework of glowing ozone molecules closed",
      },
      {
        id: "planetary-heart-monitors",
        name: "Planetary Heart Monitors",
        blurb: "Observatories that read a world's health like a physician reads pulse.",
        detail:
          "Every vital sign — carbon mood, aquifer patience, soil humor, forest dread — is trended openly on public walls. No leader may take office without standing before the monitor and reading the current numbers aloud, unedited.",
        visual:
          "a grand observatory hall where a planet's holographic vital signs turn slowly in the air, citizens reading the numbers below",
      },
      {
        id: "terraforming-seed-crates",
        name: "Terraforming Seed-Crates",
        blurb: "Crates that hold the entire slow recipe for making a dead world breathe.",
        detail:
          "Each crate is a century's contract with a planet — lichens first, then soils, then rain, then laughter. Signed by consensus of everyone who will ever breathe there, which takes the longest time of all and is the point.",
        visual:
          "a row of great sealed crates on a barren rust-colored plain, one crate open with the first green moss glowing inside",
      },
    ],
  },
  {
    id: "time",
    title: "Time, Space & Perception",
    icon: "hourglass",
    description:
      "Technologies for the deepest questions — watching time, walking perspective, and standing at the edge of what is real.",
    items: [
      {
        id: "chrono-observation-wells",
        name: "Chrono-Observation Wells",
        blurb: "Wells of still water where the past plays back on the surface.",
        detail:
          "Gaze into the well and the water shows this place as it was — no sound, no intervention, only weather and light from long ago. Historians and grievers alike book time here; the well treats them identically, which both find fitting.",
        visual:
          "a circular stone well in a garden, its water surface showing a luminous reflection of the same place centuries earlier",
      },
      {
        id: "time-capsule-groves",
        name: "Time-Capsule Groves",
        blurb: "Groves where each tree guards the messages of one exact year.",
        detail:
          "A message buried at the roots opens when the tree's rings reach the agreed age. The groves are the calendars civilizations actually cry at — whole audiences weeping over a tree that was a sapling when the letters were written.",
        visual:
          "a grove of slender trees at golden hour, one tree's trunk glowing with a seam of opened light releasing drifting letters",
      },
      {
        id: "slow-time-sanctuaries",
        name: "Slow-Time Sanctuaries",
        blurb: "Rooms where time runs thick, for afternoons that must last longer.",
        detail:
          "Inside the field, one hour of world-time is a day of thinking-time; nothing ages, nothing escapes. Used for final words, impossible decisions and the occasional very long goodbye. The door only opens from the inside, by design.",
        visual:
          "a quiet room where dust motes drift in extreme slow motion through slanted golden light, a person seated thinking at a desk",
      },
      {
        id: "future-self-mirrors",
        name: "Future-Self Mirrors",
        blurb: "Mirrors that show you aged by the life you are currently choosing.",
        detail:
          "Not prophecy — arithmetic. The mirror renders the face your habits are compounding toward and updates nightly. Many are bought as gifts and never used; the ones that get used tend to make the mirror obsolete in a year.",
        visual:
          "a tall mirror in a candlelit room reflecting a subtly older, kinder version of the person standing before it",
      },
      {
        id: "memory-time-theaters",
        name: "Memory-Time Theaters",
        blurb: "Theaters that replay your own memories on stage with the seats you choose.",
        detail:
          "Watched from the audience, a memory finally gets its blocking, its lighting and its intermission. Shared viewings are a courtship custom on many worlds; watching your first meeting from the third row is considered extremely romantic.",
        visual:
          "a small ornate theater where a glowing memory scene plays on stage, one viewer in the audience leaning forward in recognition",
      },
      {
        id: "starlight-delay-scopes",
        name: "Starlight-Delay Scopes",
        blurb: "Scopes that sort a star's light by year, like a library sorts by shelf.",
        detail:
          "Point the scope and choose a century; the arriving starlight is filtered to that vintage. Civilizations use them to watch their own sun's history and, once a generation, their ancestors' last ordinary evening.",
        visual:
          "an elegant brass-and-crystal telescope on an observatory balcony, light from it splitting into layered images of the same star at different ages",
      },
      {
        id: "perspective-swap-lenses",
        name: "Perspective-Swap Lenses",
        blurb: "Lenses that lend you someone's whole way of seeing for an hour.",
        detail:
          "Worn with consent, the lenses hand over not sight but salience — what the other person notices first, and why. Prejudice reportedly survives about four minutes. The lenses are never lent during arguments, by law and by mercy.",
        visual:
          "two figures facing each other across a plaza, each wearing a glowing lens, the scene between them rendered in shifting double colors",
      },
      {
        id: "probability-garden-mazes",
        name: "Probability-Garden Mazes",
        blurb: "Mazes where each path is a plausible life, walked to the end of the hedge.",
        detail:
          "Enter with a question and the maze grows branches for each liveable answer; walk one fully and emerge knowing how it would feel. The garden clears all hedges at dusk. No one has ever chosen the path they entered expecting.",
        visual:
          "an impossible hedge maze from above where each path glows a different color and leads to a different tiny scene of a life",
      },
      {
        id: "dimension-window-sashes",
        name: "Dimension-Window Sashes",
        blurb: "Window frames that hang a view into the reality one breath away.",
        detail:
          "The sash holds a pane of elsewhere: same room, different history, mutually observing weather. Windows are registered and curtained by convention; the longmarried across versions are known for waving at each other at dusk.",
        visual:
          "an ordinary room where one tall window frames the same room but subtly different — different wallpaper, a figure waving",
      },
      {
        id: "past-echo-footpaths",
        name: "Past-Echo Footpaths",
        blurb: "Paths that replay the footsteps of everyone who ever walked them.",
        detail:
          "Walk at midnight and the path fills with translucent walkers — refugees, lovers, mail carriers, pilgrims. The paths are maintained by listening; wherever the echoes thin, that is where the path asks to be extended.",
        visual:
          "a country path at night where translucent figures of light from many eras walk in both directions, footprints glowing behind",
      },
      {
        id: "tomorrow-tasting-spoons",
        name: "Tomorrow-Tasting Spoons",
        blurb: "Spoons that give tomorrow's harvest tonight, as a flavor and a feeling.",
        detail:
          "Stir the soup, taste, and know the season ahead as a mood — abundance, hardship, surprise. Farmers plan with them; kitchens famously refuse to cook from the spoons alone, insisting the future also deserves to be a surprise.",
        visual:
          "a spoon lifting from a pot with steam rising that forms faint images of next season's fields, a cook squinting at it knowingly",
      },
      {
        id: "event-horizon-balconies",
        name: "Event-Horizon Balconies",
        blurb: "Safely tethered balconies that hang at the edge of a black hole's quiet.",
        detail:
          "Reserved for those who need to see un-seeable time up close, the balconies hang where light circles forever. Visitors return quieter. The concession stand sells tea and, after a few requests, stopped selling anything else.",
        visual:
          "an elegant small balcony platform tethered in space, hanging near a vast black sphere wrapped in a glowing ring of light",
      },
      {
        id: "deep-time-calendars",
        name: "Deep-Time Calendars",
        blurb: "Calendars that count in centuries and are read like weather reports.",
        detail:
          "The long calendars track eras the way almanacs track frosts — when the coast shifts, when the dialects merge, when the comet returns. Children learn to read them and report feeling, at first, very tall.",
        visual:
          "a vast stone calendar wall in a public square with slowly turning bronze rings and glowing markers for eras and comets",
      },
      {
        id: "ancestor-constellation-theaters",
        name: "Ancestor-Constellation Theaters",
        blurb: "Theaters that arrange the night sky into the stories of the dead.",
        detail:
          "The projector honors each ancestor with a star and connects the constellations their lives actually drew. On festival nights whole cities sit outside; the sky is personal here in a way visitors describe as almost unbearable.",
        visual:
          "a city plaza at night with families looking up at stars connected by gentle lines of light into recognizable faces and scenes",
      },
      {
        id: "quantum-leaf-readers",
        name: "Quantum-Leaf Readers",
        blurb: "Readers that ask a leaf what its tree is quietly deciding.",
        detail:
          "The reader samples the superposed states of a living leaf and reports the tree's probability weather — drought plans, growth plans, plans to fall on the fence. Orchards consult them; the leaves are thanked and released.",
        visual:
          "a handheld reading device scanning a single leaf in a garden, faint branching probability ghosts of the leaf shimmering above it",
      },
      {
        id: "stillness-field-rooms",
        name: "Stillness-Field Rooms",
        blurb: "Rooms where motion politely waits outside, including worry.",
        detail:
          "The field slows everything within to the speed of contemplation — heartbeat, thought, the tyranny of the urgent. Twenty minutes inside equals the clearest hour of the week; overuse is prevented by the door, which requires hurry to open.",
        visual:
          "a bare beautiful room where a hanging curtain and steam from a teacup are frozen mid-drift, one person seated motionless and calm",
      },
      {
        id: "parallel-self-post-offices",
        name: "Parallel-Self Post Offices",
        blurb: "Post offices that exchange letters between you and your other lives.",
        detail:
          "Mail arrives postmarked with a life you did not live — the city you moved to, the craft you set down. Correspondence is brief and unreplied by rule; readers say the letters read like you, on your best days, after good sleep.",
        visual:
          "a small warm post office with brass counters, a person holding a letter whose postmark glows with a starfield of other worlds",
      },
      {
        id: "cycle-renewal-clocks",
        name: "Cycle-Renewal Clocks",
        blurb: "Clocks that tell you which hour of your life you are inside.",
        detail:
          "Not the time of day — the time of life: study, building, tending, teaching, becoming weather. The clocks are consulted at crossroads and by anyone at 3 a.m.; they have never once been wrong, only early.",
        visual:
          "an ornate clock with concentric rings labeled in glowing script, its hands pointing to a softly illuminated life-stage glyph",
      },
      {
        id: "dreamtime-navigation-drums",
        name: "Dreamtime-Navigation Drums",
        blurb: "Drums that let a dreamer steer the shared dream-country deliberately.",
        detail:
          "Rhythm is the rudder: learned beats carry the traveler to remembered shores, ancestor camps and unfinished conversations. The drummers guild trains for years and refuses, always, to drum anyone anywhere without their asking.",
        visual:
          "a drummer beside a sleeping circle, visible dream-landscape of hills and rivers rising from the drum's pulsing rings of light",
      },
      {
        id: "eternity-guest-rooms",
        name: "Eternity Guest Rooms",
        blurb: "Rooms where the long-lived stay for a century and are remembered fondly.",
        detail:
          "For guests whose visit outlasts their hosts' grandchildren, the rooms hold warmth, tend the letters, and keep the household's stories accurate. Hospitality, here, is measured in generations and considered a minor art form.",
        visual:
          "a serene guest room unchanged across eras, portraits of successive host families on the wall, one long-lived guest at the window",
      },
    ],
  },
  {
    id: "protection",
    title: "Protection & Harmony",
    icon: "shield",
    description:
      "Safety as a gentle art — shields, shelters and small machines that keep the peace without ever raising a fist.",
    items: [
      {
        id: "personal-aura-shields",
        name: "Personal Aura Shields",
        blurb: "Worn fields that decide what may reach you, chosen fresh each morning.",
        detail:
          "Set the morning's perimeter — noise, grief, particular people, the news — and the shield holds it kindly all day. They do not harden the heart; wearers report the opposite, since the heart no longer flinches first.",
        visual:
          "a person walking a busy luminous street inside a faint personal dome of soft light, noise and chaos bending gently around it",
      },
      {
        id: "home-harmony-emitters",
        name: "Home Harmony Emitters",
        blurb: "Hearth-stones that keep a household's field swept clean of static.",
        detail:
          "The emitter hums below hearing, dissolving the day's accumulated irritation before it becomes tradition. Homes with them argue faster and laugh sooner; the emitters are gifted at weddings and at divorces, for different reasons.",
        visual:
          "a carved hearthstone glowing faintly in a warm living room, visible waves of calm light rippling outward across the space",
      },
      {
        id: "fear-dissolving-bells",
        name: "Fear-Dissolving Bells",
        blurb: "Bells whose tone takes fear apart and folds it into caution.",
        detail:
          "Fear is not banned — it is re-factored into its useful remainder. Rung in theatres before premieres, in clinics before diagnoses, and by anyone who hears fear start to drive. The bell keeps a ledger of fears it has retired, anonymously.",
        visual:
          "a great bronze bell mid-swing emitting visible rings that pass through a frightened crowd, each ring softening their posture",
      },
      {
        id: "conflict-cooling-fountains",
        name: "Conflict-Cooling Fountains",
        blurb: "Fountains that lower the temperature of any square they guard.",
        detail:
          "The water carries a micro-field that makes shouting feel silly and sitting down feel inevitable. City planners place them exactly where the old market brawls began; the fountains have never once needed repair.",
        visual:
          "a plaza fountain with gently glowing water, two would-be arguers sitting on its edge sharing shade, crowds strolling calmly",
      },
      {
        id: "nightmare-guard-lanterns",
        name: "Nightmare-Guard Lanterns",
        blurb: "Bedside lanterns that stand watch at the border of sleep.",
        detail:
          "The lantern exchanges standing waves with the sleeper and patrols the dream-border, turning nightmares at the pass. Children are told it is the room's own bravery; adults are told the truth, which is the same thing.",
        visual:
          "a small glowing lantern on a nightstand casting gentle light-shields around a sleeping child, dark shapes dissolving at the edge",
      },
      {
        id: "dissonance-neutralizing-forks",
        name: "Dissonance-Neutralizing Forks",
        blurb: "Forks that find a room's bad note and quietly take it away.",
        detail:
          "Struck and swept, the fork absorbs the standing dissonance — sonic, social, occasionally architectural — and holds it for composting. Concert halls keep two; town halls keep six; families keep one and never say where.",
        visual:
          "a large elegant tuning fork glowing after being struck, held in a tense meeting room, tension visibly leaving the air like mist",
      },
      {
        id: "emergency-beacon-stones",
        name: "Emergency-Beacon Stones",
        blurb: "Stones that call help across any distance and never cry wolf.",
        detail:
          "Cracked only in true need, the stone's cry cannot be faked, silenced or misrouted. Responders train to the sound; whole mountain cultures keep one per valley, and the stones of the far passes have saved more climbers than anyone counts.",
        visual:
          "a climber cracking a small glowing stone on a mountainside, a broad pillar of light rising from it into a dark sky",
      },
      {
        id: "boundary-weaving-rugs",
        name: "Boundary-Weaving Rugs",
        blurb: "Rugs whose pattern teaches a room where one being ends.",
        detail:
          "Sit within the weave and the rug strengthens the field-line between self and other — therapy rooms, negotiations and shared studios swear by them. The patterns are family-specific and slightly different every weaving, like signatures.",
        visual:
          "two people seated across a richly patterned rug whose glowing border lines subtly define each person's space with mutual respect",
      },
      {
        id: "peace-field-canopies",
        name: "Peace-Field Canopies",
        blurb: "Canopies of quiet stretched over the places where peace is fragile.",
        detail:
          "Strung over truce lines, disaster camps and treaty tables, the canopy holds the field at the exact pitch of restraint. It cannot make peace; it can only stop the noise long enough for people to remember wanting it.",
        visual:
          "a vast translucent canopy shimmering over a tented settlement at dusk, beneath it the quiet of held breath and warm lantern light",
      },
      {
        id: "radiation-cleansing-amber",
        name: "Radiation-Cleansing Amber",
        blurb: "Amber lattice that drinks radiation and gives back a hearth-warmth.",
        detail:
          "Grown around wounded reactors and old test sites, the amber soaks harm into its lattice for slow, safe decay. The ground beneath it can be farmed within a generation; the amber is left in place forever, and glows accordingly.",
        visual:
          "a field of huge honey-golden amber monoliths glowing softly over greened ground where a reactor once stood",
      },
      {
        id: "truth-detection-mirrors",
        name: "Truth-Detection Mirrors",
        blurb: "Mirrors that cannot be lied to and refuse to weaponize it.",
        detail:
          "Used only in courts and confessions, the mirror reflects the words as they are spoken, stripped of the speaker's spin. It does not judge — it shows, and the showing is enough; perjury here is simply a bad mirror day.",
        visual:
          "a courtroom mirror of dark polished stone, a speaker's words visible as light leaving their mouth, some strands straight and some tangled",
      },
      {
        id: "emotional-storm-umbrellas",
        name: "Emotional-Storm Umbrellas",
        blurb: "Umbrellas that keep the crowd's weather off you while you help.",
        detail:
          "Carried by medics, listeners and first responders, the umbrella sheds the panic and grief that would otherwise pour in. The handles are worn smooth; the training teaches that putting it down afterward is the whole skill.",
        visual:
          "a calm helper with a softly glowing translucent umbrella kneeling beside a panicked crowd, storm-like red light sliding off the canopy",
      },
      {
        id: "sanctuary-grid-anchors",
        name: "Sanctuary-Grid Anchors",
        blurb: "Anchors that make a place mean safety, in every language of the field.",
        detail:
          "Buried at the corners of a sanctuary, the anchors broadcast refuge to any being able to perceive it — which is most of them. The sanctuaries are marked on no maps. Everyone who needs one is already holding the map.",
        visual:
          "four glowing anchor stones at the corners of a quiet walled garden, a soft dome of warm light over it, travelers approaching",
      },
      {
        id: "invisibility-cloak-veils",
        name: "Invisibility-Cloak Veils",
        blurb: "Veils of not-being-perceived, licensed for rescue and for shyness.",
        detail:
          "The veil does not hide you; it removes the obligation to be witnessed. Issued to rescue swimmers, mourners and the occasionally overwhelmed. Misuse is prevented socially, which works, because everyone knows everyone's grandmother.",
        visual:
          "a figure in a shimmering veil walking through a crowd, the crowd's gazes sliding past, one child looking directly and smiling knowingly",
      },
      {
        id: "child-safe-light-halos",
        name: "Child-Safe Light Halos",
        blurb: "Halos that widen a child's guard-rails as fast as the child grows.",
        detail:
          "The halo reads the child's competence and grants exactly that much world — a lake's edge, a crossroads, a stranger's kindness. Parents consult it nightly; children find it entirely fair, which is the halo's quiet miracle.",
        visual:
          "a child playing near a pond inside a gentle halo of light that reaches exactly to the water's safe edge, parent watching from afar",
      },
      {
        id: "crowd-calming-pylons",
        name: "Crowd-Calming Pylons",
        blurb: "Pylons that keep a gathering a gathering instead of a panic.",
        detail:
          "Tuned below hearing, the pylons slow the crowd's heart as one, buying minutes that become exits. Festival grounds and pilgrim roads keep them at every gate; the pylons are painted by children and blessed by whoever is nearest.",
        visual:
          "tall slender pylons with softly pulsing bases along a vast crowded festival path, the crowd moving with uncanny calm and order",
      },
      {
        id: "heart-shield-amulets",
        name: "Heart-Shield Amulets",
        blurb: "Amulets that hold the line for the heart without locking its doors.",
        detail:
          "Worn over the chest, the amulet deflects cruelty aimed to wound and lets kindness arrive unfiltered. Grief counselors issue them to the newly bereaved; most return them within a year, having remembered their own strength.",
        visual:
          "a luminous amulet at a person's chest deflecting dark arrow-like shapes while warm light passes freely through to the heart",
      },
      {
        id: "thunder-song-drains",
        name: "Thunder-Song Drains",
        blurb: "Drains that pull a thunderstorm's violence underground, gently.",
        detail:
          "The drains sing the lightning's charge safely to earth through roots of copper and crystal. The storms still come and still perform; they simply stop killing, which the old storm-priests call the dignified settlement.",
        visual:
          "ornate drain gratings across a town square glowing during a thunderstorm, lightning's light flowing down into the earth harmlessly",
      },
      {
        id: "grief-holding-rooms",
        name: "Grief-Holding Rooms",
        blurb: "Rooms built to hold exactly one grieving person and all of their weather.",
        detail:
          "The room's field bears whatever the griever brings — silence, rage, the unspeakable — without thinning. Stocked with water, blankets and no advice, the rooms are the most visited civic technology on every world that builds them.",
        visual:
          "a small round room with deep soft walls, one chair, a window of slow stars, a person wrapped in a blanket letting the light hold them",
      },
      {
        id: "planetary-defense-lattice",
        name: "Planetary-Defense Lattice",
        blurb: "A lattice that turns away violence and never, ever turns it back.",
        detail:
          "Attacks arrive and are refused — redirected, decelerated, embarrassed. The lattice cannot fire; its builders considered the failure modes of being able to and declined the whole category. It has held for eleven thousand years.",
        visual:
          "a planet wrapped in a vast geometric lattice of light, an incoming streak of aggression bending aside and dissolving harmlessly",
      },
    ],
  },
  {
    id: "arts",
    title: "Sound, Art & Celebration",
    icon: "music",
    description:
      "The technologies of joy — instruments for the sky, paintings that breathe, and machines whose only product is wonder.",
    items: [
      {
        id: "aurora-harps",
        name: "Aurora Harps",
        blurb: "Harps strung with captured aurora, played only outdoors.",
        detail:
          "Each string is a ribbon of borrowed polar light; the music is visible as weather, and requests are how you ask the sky for color. Weddings commission them a year ahead. The aurora is always returned, slightly brighter than borrowed.",
        visual:
          "a musician playing a great harp whose strings are ribbons of green and violet aurora, the light music drifting upward into the night",
      },
      {
        id: "planet-song-radios",
        name: "Planet-Song Radios",
        blurb: "Radios that tune to what a world itself is singing today.",
        detail:
          "Every planet hums — magnetic breathing, ocean tempo, the aggregate mood of its cities. The radio renders it as music. Mornings here begin by listening to your own world, the way ancestors listened for rain.",
        visual:
          "a family gathered around an elegant radio of wood and crystal, luminous sound-glyphs of the planet's song swirling above it",
      },
      {
        id: "light-paint-looms",
        name: "Light-Paint Looms",
        blurb: "Looms that weave paintings you can walk into and rearrange.",
        detail:
          "The woven light holds its composition until a visitor touches it, at which point it politely re-composes around their mood. Galleries are gardens here; the guards are gardeners; the thefts are impossible because every painting is a place.",
        visual:
          "a gallery hall where vast woven paintings of light hang in air, visitors standing inside a landscape panel adjusting its colors",
      },
      {
        id: "gratitude-amplifying-bells",
        name: "Gratitude-Amplifying Bells",
        blurb: "Bells that ring themselves whenever a neighborhood says thank you.",
        detail:
          "The bell listens for the phrase in any language and answers with a note proportioned to the sincerity. Neighborhoods with one are measurably kinder by every metric the census keeps, including the ones about dogs.",
        visual:
          "a small bell tower in a cozy neighborhood street ringing itself with a visible ring of golden light while two neighbors wave",
      },
      {
        id: "starlit-dance-floors",
        name: "Starlit Dance Floors",
        blurb: "Floors that learn a couple's dance and finish it with them forever.",
        detail:
          "The floor records the steps, the laughter and the near-falls, and replays the dance as light whenever the music is right. Elder couples come to be carried by their younger selves; the floor knows all the old errors and loves them.",
        visual:
          "an open-air dance floor at night glowing with the ghostly light of dancers past, an elderly couple dancing among the lights",
      },
      {
        id: "color-music-fountains",
        name: "Color-Music Fountains",
        blurb: "Fountains that play symphonies as water, one jet per instrument.",
        detail:
          "The conductor's score is rendered hydraulically — cellos as deep arcs, flutes as mist. Cities argue over repertoire the way ancestors argued over cathedrals, and the fountains, being public, always win the argument.",
        visual:
          "a grand plaza fountain whose water jets arc in colored light, each stream a different instrument's shape of glowing water",
      },
      {
        id: "story-crystal-theaters",
        name: "Story-Crystal Theaters",
        blurb: "Theaters where each performance is grown fresh inside a crystal dome.",
        detail:
          "The company grows the story as a living crystal that blooms once, is watched by one full house, and is then respectfully shattered. No two performances exist; attendees are, formally, witnesses rather than audience.",
        visual:
          "a crystal dome theater glowing from within as a story-scene blooms inside it like a flower, one audience silhouetted outside",
      },
      {
        id: "bio-luminescent-carnivals",
        name: "Bio-Luminescent Carnivals",
        blurb: "Carnivals whose rides and costumes are grown light, alive and gentle.",
        detail:
          "Every attraction is a cultured organism that performs for applause — glow-whirl carousels, tide-pool funhouses, a ferris wheel of patient lantern-jellyfish. The animals are all willing, the confetti is edible, and everything composts by dawn.",
        visual:
          "a night carnival of living glowing rides, a carousel of light-fish, jellyfish lanterns aloft, crowds of delighted silhouettes",
      },
      {
        id: "resonance-wedding-arches",
        name: "Resonance Wedding Arches",
        blurb: "Arches that learn two heartbeats and play the chord of the marriage.",
        detail:
          "Vows are spoken beneath the arch, which records the couple's shared resonance and hums it at every anniversary. The chord cannot be faked, which is why the arch is also used for vow renewals and, occasionally, for goodbyes.",
        visual:
          "a wedding couple beneath a flowering arch that glows with intertwined twin waves of light merging into one steady chord",
      },
      {
        id: "feeling-sculpture-studios",
        name: "Feeling-Sculpture Studios",
        blurb: "Studios where you sculpt the shape of a feeling and fire it in light.",
        detail:
          "Grief comes out heavy and porous; joy comes out impossible to balance, on purpose. The fired pieces are kept on mantels and argued over by descendants who knew neither the feeling nor the artist and understand both anyway.",
        visual:
          "a studio where a sculptor shapes a slowly swirling glowing mass of light into a form, finished feeling-sculptures on shelves",
      },
      {
        id: "wind-song-arrays",
        name: "Wind-Song Arrays",
        blurb: "Mountain arrays that teach the wind the local songs.",
        detail:
          "The array's strings are tuned to the valley's repertoire; the wind arrives, reads the strings, and sings the region's history downhill. Every valley sounds different. Lost travelers navigate by repertoires, and are never really lost.",
        visual:
          "a mountainside array of tall slim strings and chimes catching the wind, visible sound-ribbons flowing down toward a village",
      },
      {
        id: "dream-projection-domes",
        name: "Dream-Projection Domes",
        blurb: "Domes that screen a sleeper's dream for the whole square to watch.",
        detail:
          "Consented nightly, the dome renders one citizen's dream as the evening's film. Cities gather; the dreamer is credited, never woken, and paid in the morning. Critics agree the best directors are usually five years old.",
        visual:
          "a town square gathered before a great dome projecting a child's luminous dream in the sky, the dreamer asleep on a stage bed",
      },
      {
        id: "stone-choir-canyon-organs",
        name: "Stone-Choir Canyon Organs",
        blurb: "Canyons carved as organs that the wind has agreed to play forever.",
        detail:
          "Generations of stone-carvers shaped the canyon's throats; the wind signed the residency contract by simply continuing to show up. Concerts are weather-dependent and therefore always perfect, by definition nobody can argue with.",
        visual:
          "a vast canyon whose carved stone pipes and chambers glow as wind pours through, sound made visible in rings of light",
      },
      {
        id: "laughter-echo-bells",
        name: "Laughter-Echo Bells",
        blurb: "Bells that catch a child's laugh and return it a century later.",
        detail:
          "The bells store laughter in their bronze the way wells store cold, and release it when the square needs it most. Grandparents hear their childhood friends' laughter here; the bells consider this their entire job description.",
        visual:
          "an old bronze bell in a leafy square releasing swirling motes of golden light shaped like faint smiling faces",
      },
      {
        id: "memory-quilt-frames",
        name: "Memory-Quilt Frames",
        blurb: "Frames that weave a family's photographs into one living quilt.",
        detail:
          "Each patch is a moment; the quilt arranges and re-arranges them into the family's real shape, which is never chronological. Unfolding it at gatherings is the closest custom this galaxy has to time travel that everyone is invited to.",
        visual:
          "a large quilt spread across a lawn whose fabric patches glow with small moving family scenes, generations gathered around it",
      },
      {
        id: "silence-appreciation-rooms",
        name: "Silence-Appreciation Rooms",
        blurb: "Rooms engineered so that silence has texture, depth and a front row.",
        detail:
          "Every surface is tuned so the quiet arrives in layers — stone hush, wool hush, snowfall hush. Concert halls book them between loud seasons; cities learn, slowly, that the silence was the instrument all along.",
        visual:
          "a minimalist concert hall of soft stone and wool, a single listener seated in the center, sound-absorbing walls glowing faintly",
      },
      {
        id: "childrens-constellation-mobiles",
        name: "Children's Constellation Mobiles",
        blurb: "Nursery mobiles whose stars arrange into the child's own future sky.",
        detail:
          "Each mobile reads the newborn's first night and arranges its little stars accordingly — a private constellation for a private person. Children keep them forever; adults consulting their mobile is a recognized and respected activity.",
        visual:
          "a nursery mobile of tiny glowing stars slowly rearranging themselves into a unique constellation above a sleeping infant",
      },
      {
        id: "festival-of-lights-swarms",
        name: "Festival-of-Lights Swarms",
        blurb: "Light-swarms that paint the whole sky, then ask the crowd for ideas.",
        detail:
          "The swarm takes requests by mood — the crowd's collective want becomes tomorrow night's sky. Festivals here are two nights: the first the swarm's, the second the people's. The swarms remember every festival and repeat nothing.",
        visual:
          "thousands of points of light forming vast shifting scenes across a night sky above a festival crowd with raised hands",
      },
      {
        id: "ancestral-music-restorers",
        name: "Ancestral-Music Restorers",
        blurb: "Restorers that rebuild the music of lost civilizations from their stones.",
        detail:
          "Reading wear-patterns on instruments, dance-floors and doorways, the restorer reconstructs what the dead actually danced to. The first playback of a restored civilization is a public ceremony; the dead are thanked, and the hall is left open all night.",
        visual:
          "an archaeologist in a ruin beside a device projecting a reconstructed band of translucent light playing ancient instruments",
      },
      {
        id: "universe-lullaby-machines",
        name: "Universe-Lullaby Machines",
        blurb: "Machines that sing the universe's own oldest song, for falling asleep.",
        detail:
          "Drawn from the cosmic background itself and slowed ten thousand times, the lullaby is the oldest music there is or will be. Nurseries keep one. So do fleets, monasteries, and anyone who has ever held a frightened child through a long night.",
        visual:
          "a graceful machine like a cradle of rings glowing with deep-red cosmic light, emitting slow visible waves over a sleeping child",
      },
    ],
  },
  {
    id: "synthesis",
    title: "Food & Matter Synthesis",
    icon: "flask",
    description:
      "Making plenty from almost nothing — replicators, gardens and kitchens that answer hunger without ever costing a world.",
    items: [
      {
        id: "light-to-bread-replicators",
        name: "Light-to-Bread Replicators",
        blurb: "Kitchen boxes that bake a warm loaf out of plain light.",
        detail:
          "The replicator assembles the bread molecule by remembered molecule, warming it to the exact minute of homemade. Every loaf carries the recipe's origin story in its crust pattern, and the oldest recipes bake the slowest, on purpose.",
        visual:
          "a kitchen device emitting a cone of golden light within which a loaf of bread assembles itself from sparkling motes",
      },
      {
        id: "mineral-broth-fountains",
        name: "Mineral Broth Fountains",
        blurb: "Fountains that brew a savory, perfect broth straight from stone.",
        detail:
          "The fountain dissolves a pinch of mineral-rich stone each hour and weaves it into broth the body reads as a long letter from the mountain. Villages argue, warmly and forever, about whose mountain makes the better soup.",
        visual:
          "a stone fountain in a village square filling bowls with gently steaming amber broth, faint sparkles of mineral light rising",
      },
      {
        id: "sun-tea-leaves",
        name: "Sun-Tea Leaves",
        blurb: "Leaves that steep in daylight alone and taste of where they grew.",
        detail:
          "Set a leaf in a jar of water in the morning sun and by noon the water is tea — no fire, no wait, no bitterness. Each leaf's flavor maps its nursery's weather, so tea drinkers taste other people's summers and become loyal to them.",
        visual:
          "glass jars of water on a sunlit windowsill, single glowing leaves inside turning the water slowly amber, dust motes in the light",
      },
      {
        id: "soil-memory-blankets",
        name: "Soil Memory Blankets",
        blurb: "Blankets that teach exhausted soil everything it used to know.",
        detail:
          "Woven from compost cultures and mycelium, a blanket laid on dead ground re-introduces the soil to its own history. Three seasons later the blanket is gone, the ground is alive, and the field remembers rain better than it used to.",
        visual:
          "a woven blanket of living moss and mycelium spread over cracked grey soil, green life spreading outward from beneath its edges",
      },
      {
        id: "atmosphere-bakers",
        name: "Atmosphere Bakers",
        blurb: "Towers that bake bread-grade protein straight out of thin air.",
        detail:
          "Drawing carbon and nitrogen from the sky, the towers culture it into flour-grade protein with sunlight and patience. A single tower feeds a valley without a single acre, which is why they are always built beside schools.",
        visual:
          "a graceful white tower exhaling faint golden clouds of protein powder collected in open silos below, farmland resting fallow nearby",
      },
      {
        id: "starfruit-splice-gardens",
        name: "Starfruit Splice Gardens",
        blurb: "Orchards where one tree courteously grows nine different fruits.",
        detail:
          "Splice-grafts are negotiated between trees like marriages, with the gardener as matchmaker and the rootstock holding veto power. The harvest is a festival of everything at once, and the trees are listed in the town census by name.",
        visual:
          "a single large orchard tree bearing distinctly different glowing fruits on separate branches, labeled ribbons, families picking below",
      },
      {
        id: "water-from-air-webs",
        name: "Water-from-Air Webs",
        blurb: "Spider-silk webs that drink the morning fog for a whole village.",
        detail:
          "Strung across fog corridors, the webs condense air's hidden ocean into threads that run to cisterns. The webs are harvested gently and last decades; villages name them the way ancestors named wells.",
        visual:
          "vast delicate webs strung between poles in morning fog, droplets tracing shining lines down threads into a stone cistern",
      },
      {
        id: "protein-bloom-vats",
        name: "Protein Bloom Vats",
        blurb: "Vats where protein grows as flowerheads, ready in nine days.",
        detail:
          "The vats culture protein as soft flowering heads with the texture of whatever the eater is homesick for. They are not meat and never pretend to be; they are their own food, named after the gardens they replaced with kindness.",
        visual:
          "glass vats with luminous flowering protein heads blooming inside, tenders in soft light checking the blooms like gardeners",
      },
      {
        id: "flavor-memory-cartridges",
        name: "Flavor Memory Cartridges",
        blurb: "Small vials that lend any dish the taste of one exact memory.",
        detail:
          "Recorded at the source — a grandmother's kitchen, a harbor stall, a mountain inn — a cartridge seasons a meal with context, not just chemistry. Families trade them like recipes; embassies collect them like dictionaries.",
        visual:
          "a row of small glass vials with softly glowing contents on a kitchen shelf, one vial open with aroma curling into a steaming dish",
      },
      {
        id: "orchard-clock-towers",
        name: "Orchard Clock Towers",
        blurb: "Towers that tell an orchard what season it believes it is.",
        detail:
          "The tower breathes seasonal signals — spring's wake-up, autumn's quiet — so a valley can grow anything anywhere, politely. The tower keepers are regarded the way ancestors regarded rainmakers, with similar reason.",
        visual:
          "a clock-like tower at the center of an orchard pulsing seasonal colored light, blossoms opening on one side, fruit ripening on the other",
      },
      {
        id: "ocean-kelp-elevators",
        name: "Ocean Kelp Elevators",
        blurb: "Vertical kelp farms that rise like green towers through the sea layers.",
        detail:
          "The elevators draw deep nutrients up through kelp columns taller than cities are tall, feeding coastal nations without a boat. Whales detour to scratch politely; the kelp never minds and the cities never run out.",
        visual:
          "towering kelp columns rising from the deep ocean to the surface like green skyscrapers, fish schools weaving between, sunlight above",
      },
      {
        id: "second-harvest-orchards",
        name: "Second-Harvest Orchards",
        blurb: "Orchards coaxed into a second, sweeter harvest every single year.",
        detail:
          "By reading each tree's reserves and asking only for what it can cheerfully give, the orchardists get two autumns. The second harvest is always smaller and always sweeter, and is reserved by law for the festivals.",
        visual:
          "an orchard in late autumn blooming impossibly a second time, snow on distant hills, baskets of fruit beneath flowering branches",
      },
      {
        id: "pollinator-drone-bees",
        name: "Pollinator Drone Bees",
        blurb: "Glass-winged companions who carry pollen where the bees used to.",
        detail:
          "Built only after the wild bees were asked and the shortage proved, the drones work dawn shifts and sing in frequencies bees recognize as colleagues. Their success is measured by how soon they are no longer needed.",
        visual:
          "delicate glass-winged drones with glowing cores drifting between enormous flowers at dawn, real bees visible in the distance returning",
      },
      {
        id: "fermentation-comet-barrels",
        name: "Fermentation Comet Barrels",
        blurb: "Barrels aged in comet ice that pour flavors older than civilizations.",
        detail:
          "Comet ice holds chemistry from before the worlds were sorted; brewed inside it, ferments develop tastes sommeliers describe as geological. A barrel's journey through perihelion is part of every recipe, and is never rushed.",
        visual:
          "barrels embedded in glittering blue comet ice in space, faint golden light of fermentation glowing through the ice seams",
      },
      {
        id: "constellation-feast-tables",
        name: "Constellation Feast Tables",
        blurb: "Tables that read the evening sky and build a menu to match it.",
        detail:
          "Set for a feast, the table asks the season, the guests and the sky, then assembles a meal no one ordered and everyone remembers. Children try to trick it; the table enjoys this and sometimes lets them think they did.",
        visual:
          "a long outdoor feast table beneath a vivid night sky, dishes arranging themselves with wisps of starlight, guests laughing",
      },
      {
        id: "salt-light-purifier-rings",
        name: "Salt-Light Purifier Rings",
        blurb: "Rings that turn any water clean by walking salt and sorrow out of it.",
        detail:
          "Water passed through the ring leaves its salts, toxins and old grievances in the light, and comes out tasting of morning. Fleets and deserts both depend on them; the rings are always mounted at drinking height for children.",
        visual:
          "a glowing ring mounted on a stone fountain by the sea, murky water entering one side and clear luminous water falling out the other",
      },
      {
        id: "root-cellar-harmonizers",
        name: "Root-Cellar Harmonizers",
        blurb: "Cellar stones that keep the harvest patient and the winter honest.",
        detail:
          "The harmonizer hums a storage note that slows rot and ripening to the pace of the household's appetite. Carrots keep until they are opinionated; apples keep until they are family; nothing is ever thrown out in a hurry again.",
        visual:
          "an underground cellar with shelves of vegetables, a single carved stone in the center glowing faintly and casting slow ripples",
      },
      {
        id: "cloud-vineyard-nets",
        name: "Cloud-Vineyard Nets",
        blurb: "Vineyards grown on mountain nets that drink cloud instead of rain.",
        detail:
          "Strung on high ridgelines, the vines root into mist and yield grapes with the weather of ten valleys at once. The wines are named after the winds that raised them, and vintages are argued about with religious intensity.",
        visual:
          "terraced vineyard nets on a high mountain ridge inside passing clouds, glowing grape clusters hanging through the mist",
      },
      {
        id: "grain-singing-silos",
        name: "Grain-Singing Silos",
        blurb: "Silos that keep grain fresh by singing to it at storage frequency.",
        detail:
          "The song discourages mold, moths and melancholy; grain from a singing silo bakes noticeably happier bread. During famine years elsewhere, the silos are opened and the song is taught, free, to anyone who asks.",
        visual:
          "tall golden silos at dusk with visible rings of sound rising from them, wheat fields rolling away, a community sharing bread nearby",
      },
      {
        id: "feast-replicator-hearths",
        name: "Feast-Replicator Hearths",
        blurb: "Hearth tables that cook a feast while the family tells the stories.",
        detail:
          "The hearth cooks by listening — the meal assembles itself at the pace of the stories being told, so the feast ends when the stories do. Recipes are stored as emotions; the same dish is slightly different every telling.",
        visual:
          "a warm hearth table where dishes assemble themselves in slow golden light, a family mid-story, candles and steam rising",
      },
    ],
  },
];

/** Exact, derived-from-data total — never hardcoded in the UI. */
export const etechTotal = etechFamilies.reduce((n, f) => n + f.items.length, 0);
