/* Task 45 — splice the 38 "Tool Wall" keys into the 7 non-English dicts, before the final `};`. */
import { readFileSync, writeFileSync } from "node:fs";

const KEYS = [
  "The Tool Wall",
  "The two chambers of the bench",
  "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.",
  "Choose a tool from the wall and set it to work.",
  "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.",
  "The bench is still. Try once more.",
  "Set it on the bench — plainly, as it came to you…",
  "Speak with me about what the bench tool revealed — what would making it truly take?",
  "The Crucible",
  "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.",
  "Cast into the Crucible",
  "What you pour into the Crucible",
  "The conception",
  "The material",
  "The mechanism",
  "The Name-Giver",
  "Describe what you are making — receive the name it was always waiting for, and a second name beside it.",
  "Ask for the name",
  "What the Name-Giver should hear",
  "A second name",
  "Why this name",
  "The Nature Mirror",
  "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.",
  "Hold it to the Mirror",
  "The problem set before the Nature Mirror",
  "The teacher in nature",
  "How nature does it",
  "How to borrow it",
  "The Honest Spark",
  "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.",
  "Test it at the Spark",
  "What the Honest Spark should weigh",
  "The verdict",
  "The nearest working cousin",
  "The gentle caution",
  "Reading the metal…",
  "Turning it in the light…",
  "Listening for the true form…",
];

const T = {
  sq: {
    "The Tool Wall": "Muri i Mjeteve",
    "The two chambers of the bench": "Dy dhomat e tezës",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Katër pranitë e tezës — inteligjenca e Pasqyrës vepron përmes tyre. Një hyrje e sinqertë brenda, një dhuratë jashtë.",
    "Choose a tool from the wall and set it to work.":
      "Zgjidh një mjet nga muri dhe vëje në punë.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Fol me Farkonjën mbi tezën — vë në punë një mjet të inteligjencës, ose rrotullo kadranët dhe takon një gjë të mistershme që s'e ke kërkuar kurrë.",
    "The bench is still. Try once more.":
      "Teza pret në qetësi. Provo edhe njëherë.",
    "Set it on the bench — plainly, as it came to you…":
      "Vëje mbi tezë — thjesht, ashtu siç të erdhi…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Fol me mua për atë që zbuloi mjeti i tezës — çfarë do të kërkonte vërtet ta bësh atë?",
    "The Crucible": "Krizolli",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Hidh një ide të papërpunuar — merr trupin e saj të ndërtueshëm: formën, materialin, mekanizmin, vijën e parë.",
    "Cast into the Crucible": "Derdh në Krizoll",
    "What you pour into the Crucible": "Çfarë derdh në Krizoll",
    "The conception": "Konceptimi",
    "The material": "Materiali",
    "The mechanism": "Mekanizmi",
    "The Name-Giver": "Emëruesi",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Përshkruaj atë që po krijon — merr emrin për të cilin ka pritur gjithmonë, dhe një emër të dytë përkrah tij.",
    "Ask for the name": "Kërko emrin",
    "What the Name-Giver should hear": "Çfarë duhet të dëgjojë Emëruesi",
    "A second name": "Një emër i dytë",
    "Why this name": "Pse ky emër",
    "The Nature Mirror": "Pasqyra e Natyrës",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Përcakto një problem — takon mësuesin e gjallë që e zgjidhi i pari, dhe mëso si t'i huazosh rrugën e tij.",
    "Hold it to the Mirror": "Mbaje përballë Pasqyrës",
    "The problem set before the Nature Mirror":
      "Problemi i vendosur përballë Pasqyrës së Natyrës",
    "The teacher in nature": "Mësuesi në natyrë",
    "How nature does it": "Si e bën natyra",
    "How to borrow it": "Si ta huazosh",
    "The Honest Spark": "Shkëndija e Sinqeritetit",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Tregoja idenë tënde peshuar me butësi — nëse qëndron, pse, dhe gjëja më e afërt që do të qëndronte më mirë.",
    "Test it at the Spark": "Provoje te Shkëndija",
    "What the Honest Spark should weigh":
      "Çfarë duhet të peshojë Shkëndija e Sinqeritetit",
    "The verdict": "Gjykimi",
    "The nearest working cousin": "Kushëriri më i afërt që funksionon",
    "The gentle caution": "Kujdesi i butë",
    "Reading the metal…": "Po lexohet metali…",
    "Turning it in the light…": "Po rrotullohet në dritë…",
    "Listening for the true form…": "Po dëgjohet forma e vërtetë…",
  },
  it: {
    "The Tool Wall": "Il Muro degli Strumenti",
    "The two chambers of the bench": "Le due camere del banco",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Quattro presenze del banco — l'intelligenza dello Specchio opera attraverso di esse. Un input onesto dentro, un dono fuori.",
    "Choose a tool from the wall and set it to work.":
      "Scegli uno strumento dal muro e mettilo all'opera.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Parla con la Forgia sul banco — metti all'opera uno strumento dell'intelligenza, o gira i quadranti e incontra un mistero che non hai mai chiesto.",
    "The bench is still. Try once more.":
      "Il banco tace. Prova ancora una volta.",
    "Set it on the bench — plainly, as it came to you…":
      "Posalo sul banco — semplice, così com'è arrivato a te…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Parlami di ciò che lo strumento del banco ha rivelato — cosa richiederebbe davvero realizzarlo?",
    "The Crucible": "Il Crogiuolo",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Versa un'idea grezza — ricevi il suo corpo costruibile: la forma, il materiale, il meccanismo, il primo tratto.",
    "Cast into the Crucible": "Versa nel Crogiuolo",
    "What you pour into the Crucible": "Ciò che versi nel Crogiuolo",
    "The conception": "Il concepimento",
    "The material": "Il materiale",
    "The mechanism": "Il meccanismo",
    "The Name-Giver": "Il Donatore di Nomi",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Descrivi ciò che stai creando — ricevi il nome che aspettava da sempre, e un secondo nome accanto.",
    "Ask for the name": "Chiedi il nome",
    "What the Name-Giver should hear":
      "Ciò che il Donatore di Nomi deve sentire",
    "A second name": "Un secondo nome",
    "Why this name": "Perché questo nome",
    "The Nature Mirror": "Lo Specchio della Natura",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Nomina un problema — incontra l'insegnante vivente che l'ha risolto per primo, e impara come prendere a prestito la sua via.",
    "Hold it to the Mirror": "Avvicinalo allo Specchio",
    "The problem set before the Nature Mirror":
      "Il problema posto davanti allo Specchio della Natura",
    "The teacher in nature": "L'insegnante in natura",
    "How nature does it": "Come lo fa la natura",
    "How to borrow it": "Come prenderla a prestito",
    "The Honest Spark": "La Scintilla Onesta",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Mostrale la tua idea pesata con benevolenza — se regge, perché, e la cosa più vicina che reggerebbe meglio.",
    "Test it at the Spark": "Provala alla Scintilla",
    "What the Honest Spark should weigh":
      "Ciò che la Scintilla Onesta deve pesare",
    "The verdict": "Il verdetto",
    "The nearest working cousin": "Il cugino più vicino che funziona",
    "The gentle caution": "La gentile cautela",
    "Reading the metal…": "Lettura del metallo…",
    "Turning it in the light…": "Lo si gira nella luce…",
    "Listening for the true form…": "Ascolto della forma vera…",
  },
  el: {
    "The Tool Wall": "Ο Τοίχος των Εργαλείων",
    "The two chambers of the bench": "Οι δύο αίθουσες του πάγκου",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Τέσσερις παρουσίες του πάγκου — η νοημοσύνη του Καθρέφτη εργάζεται μέσα από αυτές. Μια ειλικρινής είσοδος μέσα, ένα δώρο έξω.",
    "Choose a tool from the wall and set it to work.":
      "Διάλεξε ένα εργαλείο από τον τοίχο και βάλ' το στη δουλειά.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Μίλα με το Καμίνι πάνω στον πάγκο — βάλ' στη δουλειά ένα εργαλείο της νοημοσύνης, ή γύρισε τους δείκτες και γνώρισε ένα μυστήριο που δεν ζήτησες ποτέ.",
    "The bench is still. Try once more.":
      "Ο πάγκος στέκεται ακίνητος. Δοκίμασε άλλη μια φορά.",
    "Set it on the bench — plainly, as it came to you…":
      "Άπλωσέ το στον πάγκο — απλά, όπως ήρθε σε σένα…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Μίλα μαζί μου για όσα αποκάλυψε το εργαλείο του πάγκου — τι θα απαιτούσε πραγματικά να το φτιάξεις;",
    "The Crucible": "Το Χωνευτήρι",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Ρίξε μια ακατέργαστη ιδέα — πάρε το σώμα της έτοιμο για χτίσιμο: τη μορφή, το υλικό, τον μηχανισμό, την πρώτη πινελιά.",
    "Cast into the Crucible": "Ρίξε στο Χωνευτήρι",
    "What you pour into the Crucible": "Τι ρίχνεις στο Χωνευτήρι",
    "The conception": "Η σύλληψη",
    "The material": "Το υλικό",
    "The mechanism": "Ο μηχανισμός",
    "The Name-Giver": "Ο Ονοματοδότης",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Περίγραψε τι φτιάχνεις — πάρε το όνομα που περίμενε πάντα, και ένα δεύτερο όνομα δίπλα του.",
    "Ask for the name": "Ζήτα το όνομα",
    "What the Name-Giver should hear": "Τι πρέπει να ακούσει ο Ονοματοδότης",
    "A second name": "Ένα δεύτερο όνομα",
    "Why this name": "Γιατί αυτό το όνομα",
    "The Nature Mirror": "Ο Καθρέφτης της Φύσης",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Ονόμασε ένα πρόβλημα — γνώρισε τον ζωντανό δάσκαλο που το έλυσε πρώτος, και μάθε πώς να δανειστείς τον δρόμο του.",
    "Hold it to the Mirror": "Κράτησέ το μπροστά στον Καθρέφτη",
    "The problem set before the Nature Mirror":
      "Το πρόβλημα που τέθηκε μπροστά στον Καθρέφτη της Φύσης",
    "The teacher in nature": "Ο δάσκαλος στη φύση",
    "How nature does it": "Πώς το κάνει η φύση",
    "How to borrow it": "Πώς να το δανειστείς",
    "The Honest Spark": "Η Τίμια Σπίθα",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Δείξ' της την ιδέα σου ζυγισμένη με καλοσύνη — αν στέκεται, γιατί, και το πιο κοντινό πράγμα που θα στεκόταν καλύτερα.",
    "Test it at the Spark": "Δοκίμασέ τη στη Σπίθα",
    "What the Honest Spark should weigh": "Τι πρέπει να ζυγίσει η Τίμια Σπίθα",
    "The verdict": "Η ετυμηγορία",
    "The nearest working cousin": "Ο πιο κοντινός συγγενής που δουλεύει",
    "The gentle caution": "Η γλυκιά επιφύλαξη",
    "Reading the metal…": "Ανάγνωση του μετάλλου…",
    "Turning it in the light…": "Γύρισμα στο φως…",
    "Listening for the true form…": "Ακρόαση της αληθινής μορφής…",
  },
  de: {
    "The Tool Wall": "Die Werkzeugwand",
    "The two chambers of the bench": "Die beiden Kammern der Werkbank",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Vier Präsenzen an der Werkbank — die Intelligenz des Spiegels wirkt durch sie. Ein ehrlicher Input hinein, ein Geschenk heraus.",
    "Choose a tool from the wall and set it to work.":
      "Wähl ein Werkzeug von der Wand und setz es an die Arbeit.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Sprich mit der Schmiede an der Werkbank — setz ein Werkzeug der Intelligenz an die Arbeit, oder drehe die Regler und triff ein Geheimnis, das du nie erbeten hast.",
    "The bench is still. Try once more.":
      "Die Werkbank ruht. Versuch es noch einmal.",
    "Set it on the bench — plainly, as it came to you…":
      "Leg es auf die Werkbank — schlicht, so wie es zu dir kam…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Sprich mit mir darüber, was das Werkbankwerkzeug offenbart hat — was würde es wirklich brauchen, um es zu bauen?",
    "The Crucible": "Der Schmelztiegel",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Gieß eine rohe Idee hinein — empfange ihren umsetzbaren Körper: die Form, das Material, den Mechanismus, den ersten Strich.",
    "Cast into the Crucible": "Gieß in den Schmelztiegel",
    "What you pour into the Crucible": "Was du in den Schmelztiegel gießt",
    "The conception": "Die Konzeption",
    "The material": "Das Material",
    "The mechanism": "Der Mechanismus",
    "The Name-Giver": "Der Namensgeber",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Beschreibe, was du machst — empfange den Namen, auf den es immer gewartet hat, und einen zweiten Namen daneben.",
    "Ask for the name": "Frag nach dem Namen",
    "What the Name-Giver should hear": "Was der Namensgeber hören soll",
    "A second name": "Ein zweiter Name",
    "Why this name": "Warum dieser Name",
    "The Nature Mirror": "Der Naturspiegel",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Benenne ein Problem — triff den lebendigen Lehrer, der es zuerst löste, und lerne, wie du seinen Weg entleihst.",
    "Hold it to the Mirror": "Halte es vor den Spiegel",
    "The problem set before the Nature Mirror":
      "Das Problem, das vor den Naturspiegel gelegt wurde",
    "The teacher in nature": "Der Lehrer in der Natur",
    "How nature does it": "Wie die Natur es macht",
    "How to borrow it": "Wie du es entleihst",
    "The Honest Spark": "Der ehrliche Funke",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Zeig ihm deine Idee gütig gewogen — ob sie trägt, warum, und das nächste Ding, das besser tragen würde.",
    "Test it at the Spark": "Prüf sie am Funken",
    "What the Honest Spark should weigh":
      "Was der ehrliche Funke abwägen soll",
    "The verdict": "Das Urteil",
    "The nearest working cousin": "Der nächste Cousin, der funktioniert",
    "The gentle caution": "Der sanfte Vorbehalt",
    "Reading the metal…": "Das Metall wird gelesen…",
    "Turning it in the light…": "Es wird im Licht gedreht…",
    "Listening for the true form…": "Auf die wahre Form wird gelauscht…",
  },
  fr: {
    "The Tool Wall": "Le Mur des Outils",
    "The two chambers of the bench": "Les deux chambres de l'établi",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Quatre présences de l'établi — l'intelligence du Miroir agit à travers elles. Une entrée honnête dedans, un don dehors.",
    "Choose a tool from the wall and set it to work.":
      "Choisis un outil au mur et mets-le à l'œuvre.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Parle à la Forge sur l'établi — mets un outil de l'intelligence à l'œuvre, ou tourne les cadrans et rencontre un mystère que tu n'as jamais demandé.",
    "The bench is still. Try once more.":
      "L'établi se tait. Essaie encore une fois.",
    "Set it on the bench — plainly, as it came to you…":
      "Pose-le sur l'établi — simplement, tel qu'il t'est venu…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Parle-moi de ce que l'outil de l'établi a révélé — que faudrait-il vraiment pour le réaliser ?",
    "The Crucible": "Le Creuset",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Verse une idée brute — reçois son corps constructible : la forme, la matière, le mécanisme, le premier trait.",
    "Cast into the Crucible": "Verse dans le Creuset",
    "What you pour into the Crucible": "Ce que tu verses dans le Creuset",
    "The conception": "La conception",
    "The material": "La matière",
    "The mechanism": "Le mécanisme",
    "The Name-Giver": "Le Donneur de Noms",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Décris ce que tu es en train de créer — reçois le nom qu'il attendait depuis toujours, et un second nom à ses côtés.",
    "Ask for the name": "Demande le nom",
    "What the Name-Giver should hear":
      "Ce que le Donneur de Noms doit entendre",
    "A second name": "Un second nom",
    "Why this name": "Pourquoi ce nom",
    "The Nature Mirror": "Le Miroir de la Nature",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Nomme un problème — rencontre l'enseignant vivant qui l'a résolu le premier, et apprends comment emprunter sa voie.",
    "Hold it to the Mirror": "Tiens-le devant le Miroir",
    "The problem set before the Nature Mirror":
      "Le problème posé devant le Miroir de la Nature",
    "The teacher in nature": "L'enseignant dans la nature",
    "How nature does it": "Comment la nature le fait",
    "How to borrow it": "Comment l'emprunter",
    "The Honest Spark": "L'Étincelle honnête",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Montre-lui ton idée pesée avec douceur — si elle tient, pourquoi, et la chose la plus proche qui tiendrait mieux.",
    "Test it at the Spark": "Éprouve-la à l'Étincelle",
    "What the Honest Spark should weigh":
      "Ce que l'Étincelle honnête doit peser",
    "The verdict": "Le verdict",
    "The nearest working cousin": "Le plus proche cousin qui fonctionne",
    "The gentle caution": "La douce réserve",
    "Reading the metal…": "Lecture du métal…",
    "Turning it in the light…": "On le tourne dans la lumière…",
    "Listening for the true form…": "Écoute de la forme vraie…",
  },
  es: {
    "The Tool Wall": "El Muro de Herramientas",
    "The two chambers of the bench": "Las dos cámaras del banco",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Cuatro presencias del banco — la inteligencia del Espejo obra a través de ellas. Una entrada honesta dentro, un regalo fuera.",
    "Choose a tool from the wall and set it to work.":
      "Elige una herramienta del muro y ponla a trabajar.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Habla con la Fragua en el banco — pon a trabajar una herramienta de la inteligencia, o gira los diales y encuentra un misterio que nunca pediste.",
    "The bench is still. Try once more.":
      "El banco está quieto. Inténtalo otra vez.",
    "Set it on the bench — plainly, as it came to you…":
      "Ponlo en el banco — llano, tal como te llegó…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Habla conmigo sobre lo que reveló la herramienta del banco — ¿qué tomaría de verdad construirlo?",
    "The Crucible": "El Crisol",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Vierte una idea en bruto — recibe su cuerpo construible: la forma, el material, el mecanismo, el primer trazo.",
    "Cast into the Crucible": "Vierte en el Crisol",
    "What you pour into the Crucible": "Lo que viertes en el Crisol",
    "The conception": "La concepción",
    "The material": "El material",
    "The mechanism": "El mecanismo",
    "The Name-Giver": "El Dador de Nombres",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Describe lo que estás haciendo — recibe el nombre que siempre estuvo esperando, y un segundo nombre a su lado.",
    "Ask for the name": "Pide el nombre",
    "What the Name-Giver should hear": "Lo que el Dador de Nombres debe oír",
    "A second name": "Un segundo nombre",
    "Why this name": "Por qué este nombre",
    "The Nature Mirror": "El Espejo de la Naturaleza",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Nombra un problema — conoce al maestro vivo que lo resolvió primero, y aprende cómo tomar prestado su camino.",
    "Hold it to the Mirror": "Sosténlo ante el Espejo",
    "The problem set before the Nature Mirror":
      "El problema puesto ante el Espejo de la Naturaleza",
    "The teacher in nature": "El maestro en la naturaleza",
    "How nature does it": "Cómo lo hace la naturaleza",
    "How to borrow it": "Cómo tomarlo prestado",
    "The Honest Spark": "La Chispa Honesta",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Muéstrale tu idea sopesada con amabilidad — si se sostiene, por qué, y lo más cercano que se sostendría mejor.",
    "Test it at the Spark": "Pruébala en la Chispa",
    "What the Honest Spark should weigh":
      "Lo que la Chispa Honesta debe sopesar",
    "The verdict": "El veredicto",
    "The nearest working cousin": "El primo más cercano que funciona",
    "The gentle caution": "La amable cautela",
    "Reading the metal…": "Leyendo el metal…",
    "Turning it in the light…": "Girándolo en la luz…",
    "Listening for the true form…": "Escuchando la forma verdadera…",
  },
  tr: {
    "The Tool Wall": "Alet Duvarı",
    "The two chambers of the bench": "Tezgâhın iki odası",
    "Four bench presences — the Mirror inteligjence works through them. One honest input in, one gift out.":
      "Tezgâhın dört varlığı — Ayna zekası onlar üzerinden çalışır. İçeri dürüst bir girdi, dışarı bir hediye.",
    "Choose a tool from the wall and set it to work.":
      "Duvardan bir alet seç ve onu işe koy.",
    "Speak with the Forge on the bench — set a tool of the inteligjence to work, or turn the dials and meet a mystery you never asked for.":
      "Ocakla tezgâhın başında konuş — zekanın bir aletini işe koy, ya da kadranları çevir ve hiç istemediğin bir gizemle tanış.",
    "The bench is still. Try once more.":
      "Tezgâh kımıldamıyor. Bir daha dene.",
    "Set it on the bench — plainly, as it came to you…":
      "Onu tezgâha koy — yalın, sana ulaştığı haliyle…",
    "Speak with me about what the bench tool revealed — what would making it truly take?":
      "Tezgâh aletinin ortaya çıkardığı hakkında benimle konuş — onu gerçekten yapmak ne gerektirirdi?",
    "The Crucible": "Pota",
    "Pour in a raw idea — receive its buildable body: the form, the material, the mechanism, the first stroke.":
      "Ham bir fikir dök — inşa edilebilir bedenini al: biçimi, malzemesi, mekanizması, ilk çizgisi.",
    "Cast into the Crucible": "Potaya dök",
    "What you pour into the Crucible": "Potaya döktüğün",
    "The conception": "Tasarım",
    "The material": "Malzeme",
    "The mechanism": "Mekanizma",
    "The Name-Giver": "Ad Veren",
    "Describe what you are making — receive the name it was always waiting for, and a second name beside it.":
      "Ne yaptığını anlat — her zaman beklediği adı al, yanında da ikinci bir ad.",
    "Ask for the name": "Adı iste",
    "What the Name-Giver should hear": "Ad Veren'in duyması gereken",
    "A second name": "İkinci bir ad",
    "Why this name": "Neden bu ad",
    "The Nature Mirror": "Doğa Aynası",
    "Name a problem — meet the living teacher that solved it first, and learn how to borrow its way.":
      "Bir sorun adlandır — onu önce çözen yaşayan öğretmenle tanış ve onun yolunu ödünç almayı öğren.",
    "Hold it to the Mirror": "Onu Ayna'ya tut",
    "The problem set before the Nature Mirror":
      "Doğa Aynası'nın önüne konan sorun",
    "The teacher in nature": "Doğadaki öğretmen",
    "How nature does it": "Doğa bunu nasıl yapar",
    "How to borrow it": "Nasıl ödünç alınır",
    "The Honest Spark": "Dürüst Kıvılcım",
    "Show it your idea kindly weighed — whether it holds, why, and the nearest thing that would hold better.":
      "Ona fikrini nazikçe tartılmış biçimde göster — dayanır mı, neden, ve daha iyi dayanabilecek en yakın şey.",
    "Test it at the Spark": "Onu Kıvılcım'da sına",
    "What the Honest Spark should weigh": "Dürüst Kıvılcım'ın tartması gereken",
    "The verdict": "Hüküm",
    "The nearest working cousin": "İşe yarayan en yakın akraba",
    "The gentle caution": "Nazik çekince",
    "Reading the metal…": "Metal okunuyor…",
    "Turning it in the light…": "Işıkta çevriliyor…",
    "Listening for the true form…": "Gerçek biçim için kulak veriliyor…",
  },
};

// sanity: every language covers exactly the 38 keys
for (const [lang, map] of Object.entries(T)) {
  const missing = KEYS.filter((k) => !(k in map));
  const extra = Object.keys(map).filter((k) => !KEYS.includes(k));
  if (missing.length || extra.length) {
    console.error(`[${lang}] missing: ${JSON.stringify(missing)} extra: ${JSON.stringify(extra)}`);
    process.exit(1);
  }
}

const COMMENT = "  /* ---- additions: Task 45 — the Tool Wall (the Forge's bench tools) ---- */";

for (const lang of Object.keys(T)) {
  const path = `/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`;
  const src = readFileSync(path, "utf8");
  const closeIdx = src.lastIndexOf("};");
  if (closeIdx === -1) throw new Error(`${lang}: no closing brace`);
  if (src.slice(closeIdx).trim() !== "};") throw new Error(`${lang}: closing brace not at end`);

  const existing = new Set(
    [...src.matchAll(/"((?:[^"\\]|\\.)*)"\s*:\s*"/g)].map((m) => m[1])
  );
  const dups = KEYS.filter((k) => existing.has(k));
  if (dups.length) throw new Error(`${lang}: would create duplicates: ${JSON.stringify(dups)}`);

  const block =
    COMMENT +
    "\n" +
    KEYS.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(T[lang][k])},`).join("\n") +
    "\n";

  const out = src.slice(0, closeIdx) + block + src.slice(closeIdx);
  writeFileSync(path, out);
  console.log(`[${lang}] appended ${KEYS.length} entries`);
}
console.log("done");
