/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — THE MULTILINGUAL DOOR LAW                          */
/*  The doors used to hear only English: a visitor asking in German,  */
/*  French, Spanish, Italian, Greek, Turkish or Albanian found the    */
/*  chambers silent. This file carries EVERY supported tongue into    */
/*  the request law — the frames ("kannst du öffnen", "peux-tu        */
/*  montrer", "μπορείς να δείξεις"), the request verbs, the question  */
/*  words, the guards (negation, reported speech, the speaker's own   */
/*  remembered making), the finite clause verbs that keep ordinary    */
/*  statements ordinary — and the doors' own names as the sidebar     */
/*  speaks them in each language ("Gestalten", "Traumbuch",           */
/*  "Lichtcodes", "Quantenwelt", "Κώδικες Φωτός", "Işık Kodları"…).   */
/*                                                                    */
/*  Everything here is pure — regex sources and word lists, no        */
/*  imports, no I/O — safe on client and server, and shared by the    */
/*  chamber gate (artifact-intent) and both image gates               */
/*  (visual-intent, visualization).                                   */
/*                                                                    */
/*  THE UNICODE BOUNDARY LAW — the ASCII \b never meets Greek,        */
/*  Turkish or umlaut letters (they are non-word characters to it),   */
/*  so every tongue-born group is wrapped in uWord():                 */
/*  (?<![\\p{L}\\p{M}]) … (?![\\p{L}\\p{M}]) and compiled with the u      */
/*  flag. The same lookarounds are safe for ASCII words too — they    */
/*  behave exactly like \b wherever \b worked before.                 */
/* ------------------------------------------------------------------ */

/** Unicode-safe word wrapper — the boundary the ASCII \b cannot give. */
export function uWord(alternatives: string): string {
  return `(?<![\\p{L}\\p{M}])(?:${alternatives})(?![\\p{L}\\p{M}])`;
}

/* ------------------------------------------------------------------ */
/*  THE EXPLICIT REQUEST FRAMES — one breath per tongue: the polite    */
/*  "can you open…", the imperative "give me…", the desire "I want…",  */
/*  the shared "let us…", the carried "take me…".                      */
/* ------------------------------------------------------------------ */
export const REQUEST_FRAMES_I18N: RegExp[] = [
  /* German — kannst du öffnen · Öffne das Traumbuch · Gib mir ein Gedicht ·
     Ich möchte manifestieren · Lass uns weben · Bring mich in die Schmiede */
  new RegExp(uWord("kannst du (?:bitte )?(?:öffnen|zeigen|geben|bringen|erstellen|machen|bauen|schreiben|zeichnen|lesen|spielen|singen|weben|kreieren|erschaff[\\p{L}\\p{M}]*)"), "iu"),
  new RegExp(uWord("(?:öffne|zeig(?:e)?|gib|bring(?:e)?|erstell(?:e)?|mach(?:e)?|bau(?:e)?|schreib(?:e)?|zeichne|singe|lies|spiel(?:e)?|webe|kreiere|erschaff[\\p{L}\\p{M}]*) [\\s\\S]{0,24}?" + uWord("(?:ein|eine|einen|den|die|das|mein|meine|meinen|etwas|mir)")), "iu"),
  new RegExp(uWord("ich (?:möchte|möcht|will|würde gerne|brauche|wünsche)"), "iu"),
  new RegExp(uWord("lass uns"), "iu"),
  new RegExp(uWord("bring mich"), "iu"),

  /* French — peux-tu montrer · Ouvre le livre · Donne-moi un poème ·
     Je veux manifester · Créons · Emmène-moi */
  new RegExp(uWord("peux?-tu (?:s'il te pla[îi]t )?(?:ouvrir|montrer|donner|apporter|créer|faire|construire|écrire|dessiner|lire|jouer|chanter|tisser|inventer)"), "iu"),
  new RegExp(uWord("(?:ouvre|montre|donne|apporte|crée?|fais|écris|dessine|lis|joue|chante|tisse)\\s*[- ]\\s*(?:moi\\s+)?|(?:ouvre|montre|donne|apporte|crée?|fais|écris|dessine|lis|joue|chante|tisse) (?:moi |nous )?(?:un |une |le |la |les |mon |ma |mes |quelque chose)"), "iu"),
  new RegExp(uWord("je (?:veux|voudrais|souhaite|désire|aimerais|necessite)"), "iu"),
  new RegExp(uWord("(?:créons|ouvrons|tissons)"), "iu"),
  new RegExp(uWord("emmène?-?moi|conduis-?moi"), "iu"),

  /* Spanish — ¿puedes abrir…? · Abre el libro · Dame un poema ·
     Quiero manifestar · Vamos a tejer · Llévame */
  new RegExp(uWord("puedes (?:por favor )?(?:abrir|mostrar|dar|traer|crear|hacer|construir|escribir|dibujar|leer|tocar|cantar|tejer|inventar)"), "iu"),
  new RegExp(uWord("(?:abre|muestra|dame|trae|crea|haz|escribe|dibuja|lee|toca|canta|teje) (?:me |nos )?(?:un |una |el |la |los |las |mi |algo )"), "iu"),
  new RegExp(uWord("(?:quiero|desear[íi]a|me gustar[íi]a|necesito|deseo)"), "iu"),
  new RegExp(uWord("vamos a"), "iu"),
  new RegExp(uWord("ll[ée]vame|tr[áa]eme"), "iu"),

  /* Italian — puoi aprire…? · Apri il libro · Dammi una poesia ·
     Voglio manifestare · Facciamo · Portami */
  new RegExp(uWord("puoi (?:per favore )?(?:aprire|mostrare|dare|portare|creare|fare|costruire|scrivere|disegnare|leggere|suonare|cantare|intrecciare|inventare)"), "iu"),
  new RegExp(uWord("(?:apri|mostra|dammi|dai|porta|crea|fai|scrivi|disegna|leggi|suona|canta|intreccia) (?:mi |ci )?(?:un |una |il |lo |la |i |gli |le |mio |mia |qualcosa )"), "iu"),
  new RegExp(uWord("(?:voglio|vorrei|desidero|ho bisogno|desidererei)"), "iu"),
  new RegExp(uWord("facciamo"), "iu"),
  new RegExp(uWord("portami"), "iu"),

  /* Greek — μπορείς να δείξεις…; · Άνοιξε το βιβλίο · Δώσε μου ένα ποίημα ·
     Θέλω να εκδηλώσω · Πάμε */
  new RegExp(uWord("μπορείς να (?:σε παρακαλώ )?(?:ανοίξεις|δείξεις|δώσεις|φέρεις|φτιάξεις|γράψεις|ζωγραφίσεις|διαβάσεις|παίξεις|τραγουδήσεις|πλέξεις)"), "iu"),
  new RegExp(uWord("(?:άνοιξε|δείξε|δείξέ|δώσε|δώσέ|φέρε|φτιάξε|γράψε|ζωγράφισε|διάβασε|παίξε|τραγούδησε) (?:μου |μας )?(?:ένα |μια |την |τον |το |τα |μου |κάτι )"), "iu"),
  new RegExp(uWord("(?:θέλω|επιθυμώ|χρειάζομαι|θα ήθελα)"), "iu"),
  new RegExp(uWord("ας (?:ανοίξουμε|φτιάξουμε|δούμε|πλέξουμε)"), "iu"),
  new RegExp(uWord("πάμε (?:στο|στην|στον)"), "iu"),

  /* Turkish — açar mısın · Traumbuch değil: Rüya Kitabı'nı aç · Bana bir şiir ver ·
     Tezahür etmek istiyorum · Haydi */
  new RegExp(uWord("(?:açar mısın|açabilir misin|gösterir misin|verir misin|yapar mısın|getirir misin)"), "iu"),
  new RegExp(uWord("(?:aç|göster|ver|getir|yap|oluştur|yaz|çiz|oku|çal|söyle|dokumak|başlat) (?:bana |bize )?(?:bir |şu |bu |benim |bir tane )"), "iu"),
  new RegExp(uWord("(?:istiyorum|isterim|rica ediyorum|sevinirim|lazım)"), "iu"),
  new RegExp(uWord("haydi"), "iu"),

  /* Albanian — mund të hapësh…? · Hap librin · Jep mua një poezi ·
     Dua të manifestoj · Le ta vegojmë */
  new RegExp(uWord("mund të (?:të lutem )?(?:hapësh|tregosh|jepësh|krijojësh|bësh|shkruash|vizatosh|lexosh|luash|këndosh|thuresh)"), "iu"),
  new RegExp(uWord("(?:hap|trego|më trego|jep|jepu|krijo|bëj|shkruaj|vizato|lexo|luaj|këndo|thuaj) (?:mua |mu |na )?(?:një |nje |të |timin |time |tëndin |diçka )"), "iu"),
  new RegExp(uWord("(?:dua|dëshiroj|kam nevojë|kam nevoje|do të doja)"), "iu"),
  new RegExp(uWord("le ta (?:hapim|vështrojmë|thuajmë)"), "iu"),
];

/* ------------------------------------------------------------------ */
/*  THE REQUEST VERBS — the words that may stand close before a        */
/*  door's name in every tongue ("Öffne die Lichtcodes", "montre les   */
/*  codes de lumière", "Işık Kodları'nı göster").                      */
/* ------------------------------------------------------------------ */
export const REQUEST_VERBS_I18N: string[] = [
  /* German */
  "öffne", "öffnen", "öffnest", "zeig", "zeige", "zeigen", "gib", "geben",
  "bring", "bringen", "erstelle", "erstellen", "mach", "mache", "machen",
  "bau", "baue", "bauen", "schreib", "schreiben", "zeichne", "zeichnen",
  "lies", "lesen", "spiel", "spiele", "spielen", "sing", "singe", "singen",
  "webe", "weben", "beginne", "beginnen", "starte", "starten", "zieh",
  "ziehe", "ziehen", "hole", "holen", "wünsche", "wünsch", "brauche",
  "brauch", "hilf", "erfinde", "erfinden", "erschaffe", "erschaffen",
  "entwerfe", "entwerfen", "manifestiere", "manifestieren", "gestalte",
  "gestalten", "kreiere", "kreieren", "summoniere",
  /* French */
  "ouvre", "ouvrir", "montre", "montrer", "donne", "donner", "apporte",
  "apporter", "crée", "créer", "fais", "faire", "construis", "construire",
  "écris", "écrire", "dessine", "dessiner", "lis", "lire", "joue", "jouer",
  "chante", "chanter", "tisse", "tisser", "commence", "commencer", "tire",
  "tirer", "prends", "prendre", "souhaite", "désire", "aide", "invente",
  "inventer", "conçois", "concevoir", "manifester", "créez", "montrez",
  "donnez", "ouvrez", "emmène",
  /* Spanish */
  "abre", "abrir", "muestra", "mostrar", "dame", "dar", "trae", "traer",
  "crea", "crear", "haz", "hacer", "construye", "construir", "escribe",
  "escribir", "dibuja", "dibujar", "lee", "leer", "toca", "tocar", "canta",
  "cantar", "teje", "tejer", "empieza", "comenzar", "saca", "sacar",
  "tira", "tirar", "toma", "tomar", "deseo", "desear", "necesito",
  "necesitar", "ayuda", "ayudar", "inventa", "inventar", "concibe",
  "concebir", "muéstrame", "llévame", "manifestar", "quiero",
  /* Italian */
  "apri", "aprire", "mostra", "mostrare", "dammi", "dai", "porta",
  "portare", "crea", "creare", "fai", "fare", "costruisci", "costruire",
  "scrivi", "scrivere", "disegna", "disegnare", "leggi", "leggere",
  "suona", "suonare", "canta", "cantare", "intreccia", "intrecciare",
  "inizia", "cominciare", "tira", "tirare", "prendi", "prendere",
  "desidero", "desiderare", "bisogno", "aiuto", "aiutare", "inventa",
  "inventare", "concepisce", "concepire", "portami", "manifestare", "voglio",
  /* Greek */
  "άνοιξε", "ανοίγω", "ανοίξεις", "δείξε", "δείχνω", "δώσε", "δίνω",
  "φέρε", "φέρνω", "φτιάξε", "φτιάχνω", "δημιούργησε", "δημιουργώ",
  "γράψε", "γράψω", "ζωγράφισε", "ζωγραφίζω", "διάβασε", "διαβάζω",
  "παίξε", "παίζω", "τραγούδησε", "τραγουδώ", "ύφαινε", "ύφαινω",
  "ξεκίνα", "τράβα", "τραβήξω", "θέλω", "επιθυμώ", "χρειάζομαι",
  "βοήθα", "βοηθώ", "εφευρίσκω", "σχεδίασε", "εκδηλώνω", "εκδηλώσω",
  /* Turkish */
  "aç", "açmak", "göster", "göstermek", "ver", "vermek", "getir",
  "getirmek", "yap", "yapmak", "oluştur", "oluşturmak", "yaz", "yazmak",
  "çiz", "çizmek", "oku", "okumak", "çal", "çalmak", "söyle", "söylemek",
  "dokumak", "başla", "başlamak", "çek", "çekmek", "al", "almak",
  "yardım", "yardım et", "icat et", "tasarla", "yarat", "yaratmak",
  "tezahür et", "manifeste et", "istiyorum",
  /* Albanian */
  "hap", "hapur", "trego", "treguar", "jep", "dhënie", "krijo", "krijuar",
  "bëj", "bërë", "shkruaj", "shkruar", "vizato", "vizatuar", "lexo",
  "lexuar", "luaj", "luajtur", "këndo", "kënduar", "fillo", "filloj",
  "tërheq", "merr", "marrë", "dua", "dëshiroj", "ndihmë", "ndihmo",
  "shpik", "shpikje", "krijoj", "manifestoj",
];

/* ------------------------------------------------------------------ */
/*  QUESTION WORDS — a bare naming never begins like this, in any      */
/*  tongue ("warum manifestieren", "pourquoi les codes", "τι είναι     */
/*  κβαντικός", "kuantum nedir").                                      */
/* ------------------------------------------------------------------ */
export const INTERROGATIVE_I18N: string = [
  /* German */
  "warum", "wieso", "weshalb", "wie", "was", "wann", "wo", "woher",
  "wohin", "wer", "wem", "wen", "welche", "welcher", "welches",
  /* French */
  "pourquoi", "comment", "quand", "où", "quel", "quelle", "quels",
  "quelles", "quoi", "qui",
  /* Spanish */
  "cómo", "cuándo", "dónde", "quién", "quiénes", "cuál", "cuáles",
  /* Italian */
  "perché", "perchè", "come", "cosa", "quando", "dove", "chi", "quale",
  "quali", "quanto",
  /* Greek */
  "γιατί", "γιατι", "πώς", "πως", "πότε", "ποτε", "πού", "ποιος",
  "ποια", "ποιο", "ποιες", "ποιοι", "πόσο",
  /* Turkish */
  "neden", "niçin", "niye", "nasıl", "nerede", "nereden", "nereye",
  "kim", "kime", "kimi", "hangi", "hangisi", "kaç",
  /* Albanian */
  "pse", "çfarë", "cfare", "kur", "ku", "kush", "kujt", "cilat", "cili",
  "cila",
].join("|");

/* ------------------------------------------------------------------ */
/*  NEGATION — the words that decline, in every tongue.                */
/* ------------------------------------------------------------------ */
export const NEGATION_WORDS_I18N: string = [
  /* German */
  "kein", "keine", "keiner", "nicht", "ohne",
  /* French */
  "sans", "aucun", "aucune",
  /* Spanish */
  "sin", "tampoco",
  /* Italian */
  "non", "senza", "nessun", "nessuna",
  /* Greek */
  "όχι", "χωρίς", "κανένα", "κανείς",
  /* Turkish */
  "değil", "yok", "olmadan", "asla", "hayır", "istemiyorum",
  /* Albanian */
  "jo", "pa", "asnë", "asnjë", "s'dua", "nuk dua",
].join("|");

/* ------------------------------------------------------------------ */
/*  REPORTED SPEECH — someone else's ask, in every tongue.             */
/* ------------------------------------------------------------------ */
export const REPORTED_SPEECH_I18N: string = [
  /* German */
  "erzählte", "erzählt", "sagte", "sagt", "empfahl", "empfiehlt",
  "lehrt", "lehre", "schrieb", "schreibt", "bat", "bittet",
  /* French */
  "racontait", "raconte", "disait", "dit", "enseignait", "enseigne",
  "écrivait", "écrit", "conseillait", "conseille", "demandait",
  /* Spanish */
  "contaba", "cuenta", "decía", "dice", "enseñaba", "enseña",
  "escribía", "escribe", "recomendaba", "recomienda", "pedía", "pide",
  /* Italian */
  "raccontava", "racconta", "diceva", "dice", "insegnava", "insegna",
  "scriveva", "scrive", "consigliava", "consiglia", "chiedeva", "chiede",
  /* Greek */
  "διηγήθηκε", "διηγείται", "είπε", "λέει", "δίδαξε", "διδάσκει",
  "έγραψε", "γράφει", "συμβούλεψε", "συμβουλεύει", "ζήτησε",
  /* Turkish */
  "anlattı", "anlatır", "söyledi", "söyler", "öğretti", "öğretir",
  "yazdı", "yazar", "tavsiye etti", "tavsiye eder", "isti", "ister",
  /* Albanian */
  "tregoi", "tregon", "tha", "thotë", "mësoi", "mëson", "shkroi",
  "shkruan", "këshilloi", "këshillon", "kërkoi",
].join("|");

/* ------------------------------------------------------------------ */
/*  SELF NARRATION — the speaker's OWN remembered making.              */
/* ------------------------------------------------------------------ */
export const SELF_NARRATION_I18N: string = [
  /* German — ich habe ein Buch geschrieben · ich habe gezeichnet */
  "ich habe [\\s\\S]{0,24}?(?:geschrieben|gemacht|erstellt|gezeichnet|gelesen|gewebt|gebaut|entworfen|erfunden|gemalt|erschaffen)",
  /* French — j'ai écrit · j'ai dessiné */
  "j'ai [\\s\\S]{0,24}?(?:écrit|fait|créé|dessiné|lu|construit|inventé|peint|tissé)",
  /* Spanish — he escrito · dibujé */
  "he [\\s\\S]{0,24}?(?:escrito|hecho|creado|dibujado|leído|construido|inventado|pintado|tejido)",
  "\\b(?:dibujé|pinté|escrib[íi])",
  /* Italian — ho scritto · disegnai */
  "ho [\\s\\S]{0,24}?(?:scritto|fatto|creato|disegnato|letto|costruito|inventato|dipinto|intrecciato)",
  "\\b(?:disegnai|dipinsi|scrissi)",
  /* Greek — έχω γράψει · έγραψα · ζωγράφιζα */
  "(?:έχω|ειχα|είχα) [\\s\\S]{0,24}?(?:γράψει|κάνει|δημιουργήσει|ζωγραφίσει|διαβάσει|χτίσει)",
  "\\b(?:έγραψα|ζωγράφιζα|δημιούργησα|έφτιαξα|διαβάζα)",
  /* Turkish — yazdım · çizdim */
  "\\b(?:yazdım|çizdim|yaptım|oluşturdum|okudum|yarattım|tasarladım|icat ettim)",
  /* Albanian — kam shkruar · shkrova */
  "(?:kam|kisha) [\\s\\S]{0,24}?(?:shkruar|krijuar|vizatuar|lexuar|ndërtuar)",
  "\\b(?:shkrova|krijova|vizatova|lexova)",
].join("|");

/* ------------------------------------------------------------------ */
/*  REMEMBERED TIME — the sentence sitting in the past, every tongue.  */
/* ------------------------------------------------------------------ */
export const PAST_CONTEXT_I18N: string = [
  /* German */
  "als ich (?:jung|klein|ein kind|ein kind war|jung war)", "früher",
  "in meiner kindheit", "letztes jahr", "letzten sommer", "letzten winter",
  /* French */
  "quand j'étais", "l'année dernière", "la semaine dernière",
  "petite?", "plus jeune", "dans mon enfance",
  /* Spanish */
  "cuando era (?:pequeñ|niñ|joven)", "el año pasado", "de niñ",
  "en mi infancia",
  /* Italian */
  "quando ero (?:piccol|bambin|giovane)", "l'anno scorso",
  "da bambin", "nella mia infanzia",
  /* Greek */
  "όταν ήμουν (?:μικρ|νεαρ|παιδί)", "πέρυσι", "πέρσι",
  "στα παιδικά", "στην παιδική",
  /* Turkish */
  "geçen (?:yıl|yaz|kış|hafta)", "çocukken", "çocuğumda", "eskiden",
  "küçükken",
  /* Albanian */
  "kur isha (?:i vogël|e vogël|i ri|vogël)", "vitin e kaluar",
  "fëmijëri", "kur isha fëmijë",
].join("|");

/* ------------------------------------------------------------------ */
/*  FUTURE NARRATION — the speaker's own someday-making, every tongue. */
/* ------------------------------------------------------------------ */
export const FUTURE_NARRATION_I18N: string = [
  /* German */
  "ich werde [\\s\\S]{0,24}?(?:schreiben|malen|zeichnen|erschaffen|bauen|erfinden|webe?n|lesen|öffnen|machen|kreieren)",
  /* French */
  "je vais [\\s\\S]{0,16}?(?:écrire|dessiner|peindre|créer|faire|construire|inventer|tisser)",
  "j'écrirai|je dessinerai|je créerai",
  /* Spanish */
  "voy a [\\s\\S]{0,16}?(?:escribir|dibujar|pintar|crear|hacer|construir|inventar|tejer)",
  "escribiré|dibujaré|crearé",
  /* Italian */
  "sto per [\\s\\S]{0,16}?(?:scrivere|disegnare|dipingere|creare|fare|costruire|inventare|intrecciare)",
  "scriverò|disegnerò|creerò",
  /* Greek */
  "θα [\\s\\S]{0,8}?(?:γράψω|ζωγραφίσω|δημιουργήσω|φτιάξω|χτίσω|πλέξω)",
  /* Turkish */
  "(?:yazacağım|çizeceğim|yapacağım|oluşturacağım|yaratacağım|tasarlayacağım)",
  /* Albanian */
  "do ta [\\s\\S]{0,12}?(?:shkruaj|vizatoj|krijoj|bëj|ndërtoj)",
  "do të shkruaj|do të krijoj",
].join("|");

/* ------------------------------------------------------------------ */
/*  FINITE CLAUSE VERBS — the mark of an ordinary STATEMENT, in every  */
/*  tongue ("das Buch ist auf dem Tisch", "el libro está en la mesa",  */
/*  "το βιβλίο είναι στο τραπέζι"). Only conjugated statement forms    */
/*  stand here; the bare imperatives belong to the request verbs,      */
/*  and the request gate weighs them FIRST — a request never loses     */
/*  its verb to the clause law.                                        */
/* ------------------------------------------------------------------ */
export const CLAUSE_VERBS_I18N: string = [
  /* German */
  "ist", "sind", "war", "waren", "bin", "bist", "hat", "habe", "haben",
  "hatte", "wird", "wurde", "werden", "würde", "macht", "machen",
  "bringt", "hilft", "fühlt", "heißt", "bedeutet", "kommt", "geht",
  "bleibt", "sagt", "weiß", "denkt", "wollte", "möchte", "kann",
  "konnte", "soll", "sollte", "darf", "mag", "gibt", "zeigt", "liest",
  "spielt", "singt", "schreibt", "zeichnet", "öffnet", "erstellt",
  "erzählt", "hört", "liebe", "liebt", "fühle", "kenne",
  /* French */
  "est", "sont", "était", "étaient", "suis", "étais", "sera", "serait",
  "seront", "avons", "avez", "ont", "avais", "aura", "avait", "fait",
  "font", "aide", "aident", "semble", "veut", "veux", "voulait",
  "peut", "peux", "pourrait", "doit", "dois", "pourra", "dit", "disent",
  "pense", "sait", "connaît", "aime", "adore", "vais", "vas", "va",
  "allons", "allez", "vont", "allait", "lit", "voit", "entend",
  /* Spanish */
  "son", "era", "eran", "fue", "fueron", "está", "estan", "estás",
  "estaba", "soy", "eres", "he", "has", "hemos", "han", "había",
  "será", "sería", "hace", "hacen", "hacía", "ayudan", "parece",
  "quieren", "querría", "pueden", "puedo", "debe", "debo", "dan",
  "dicen", "pienso", "piensa", "conozco", "amo", "ama", "vamos",
  "iban", "leen", "ven", "oye",
  /* Italian */
  "era", "erano", "fui", "stato", "ho", "hai", "abbiamo", "hanno",
  "avevo", "sarà", "sarebbe", "saranno", "fanno", "faceva", "aiutano",
  "sembra", "vuole", "vuoi", "vogliono", "può", "posso", "puoi",
  "deve", "devo", "danno", "mostrano", "aprono", "suonano", "cantano",
  "scrivono", "disegnano", "leggono", "vedo", "vedi", "vede", "dico",
  "dicono", "penso", "conosco", "amo", "andiamo", "vanno", "andava",
  "sente",
  /* Greek */
  "είμαι", "ειμαι", "είσαι", "έχω", "έχει", "έχουν", "είχα", "θα είναι",
  "κάνει", "κάνουν", "βοηθά", "βοηθάει", "μοιάζει", "θέλει", "μπορώ",
  "μπορεί", "μπορούν", "πρέπει", "δίνει", "δίνουν", "δείχνει",
  "δείχνουν", "ανοίγει", "ανοίγουν", "παίζει", "παίζουν", "τραγουδά",
  "γράφει", "γράφουν", "ζωγραφίζει", "διαβάζει", "διαβάζουν", "βλέπω",
  "βλέπει", "λέω", "λέει", "λένε", "σκέφτομαι", "ξέρω", "αγαπώ",
  "αγαπά", "πηγαίνω", "πηγαίνει", "ήμουν",
  /* Turkish */
  "değil", "olur", "olmaz", "oldu", "olmuş", "yapar", "yapıyor",
  "yapmalı", "eder", "ediyor", "ister", "istiyor", "olabilir",
  "verir", "veriyor", "gösterir", "gösteriyor", "açar", "açıyor",
  "çalar", "çalıyor", "söyler", "söylüyor", "yazar", "yazıyor",
  "çizer", "çiziyor", "okur", "okuyor", "seviyor", "sever", "gidiyor",
  "gider", "biliyor", "bilir", "düşünüyor", "düşünür", "duyuyor",
  /* Albanian */
  "është", "eshte", "janë", "jane", "ishte", "ishin", "kam", "kemi",
  "kanë", "kishin", "bën", "bëjnë", "ndihmon", "duket", "duan",
  "mund", "duhet", "japin", "tregojnë", "hapin", "luajnë", "këndon",
  "shkruan", "shkruajnë", "vizaton", "vizatojnë", "lexon", "lexojnë",
  "shoh", "sheh", "thotë", "mendoj", "din", "adhuron", "shkon",
].join("|");

/* ------------------------------------------------------------------ */
/*  THE DOORS' OWN NAMES — as the sidebar speaks them in every         */
/*  tongue. These are the words the visitor reads, and the words       */
/*  they ask with.                                                     */
/* ------------------------------------------------------------------ */

/** The Book door — das Buch · le livre · el libro · il libro ·
    το βιβλίο · kitap · libri — and the Dream Book's own names. */
export const BOOK_NAMES_I18N: string = [
  /* German */
  "traumbuch", "bücher", "buch", "märchen", "märchenbuch",
  /* French */
  "livre des rêves", "livres", "livre", "conte", "contes",
  /* Spanish */
  "libro de los sueños", "libros", "libro", "cuento", "cuentos",
  /* Italian */
  "libro dei sogni", "libri", "libro", "racconto", "racconti",
  /* Greek */
  "βιβλίο των ονείρων", "βιβλία", "βιβλίο", "παραμύθι", "παραμύθια",
  /* Turkish */
  "rüya kitabı", "rüya kitabını", "kitaplar", "kitap", "masal",
  /* Albanian */
  "libri i ëndrrave", "librin e ëndrrave", "libr[\\p{L}\\p{M}]*", "përrallë[\\p{L}\\p{M}]*",
].join("|");

/** The Akashic door — the records, the past lives, the Library. */
export const AKASHIC_NAMES_I18N: string = [
  /* German */
  "akascha", "akasha", "akascha-chroniken", "chroniken", "vorleben",
  "früheres leben", "frühere leben", "früheren leben", "vorheriges leben",
  /* French */
  "akashique", "akasha", "chroniques", "vies antérieures",
  "vie antérieure", "vie passée", "vies passées",
  /* Spanish */
  "akáshica", "akashica", "crónicas", "vidas pasadas", "vida pasada",
  /* Italian */
  "akashica", "akashiche", "cronache", "vite passate", "vita passata",
  /* Greek */
  "ακάσικα", "ακάσικη", "ακάσικες", "ακάσα", "ακάσικο", "χρονικά",
  "προηγούμενες ζωές", "προηγούμενη ζωή", "παλαιότερες ζωές",
  /* Turkish */
  "akashik[\\p{L}\\p{M}]*", "kayıtlar[\\p{L}\\p{M}]*", "önceki hayatlar[\\p{L}\\p{M}]*", "geçmiş hayatlar[\\p{L}\\p{M}]*",
  "önceki yaşamlar[\\p{L}\\p{M}]*", "karmik kayıtlar[\\p{L}\\p{M}]*",
  /* Albanian */
  "akashike", "akashika", "regjistrimet", "jetët e mëparshme",
  "jeta e mëparshme",
].join("|");

/** The Manifesting door — the sidebar's own labels ("Gestalten",
    "Manifester", "Manifesta", "Εκδήλωση", "Tezahür", "Manifesto")
    plus the verbs of intention. */
export const MANIFEST_NAMES_I18N: string = [
  /* German */
  "manifestier[\\p{L}\\p{M}]*", "manifestation", "manifest", "gestalten",
  "gestaltung", "absichten?", "anziehung", "anziehen",
  /* French */
  "manifester", "manifestation", "manifeste", "intentions?",
  "attirer", "attirance",
  /* Spanish */
  "manifestar", "manifestación", "manifesta[\\p{L}\\p{M}]*", "manifestaciones",
  "intención", "intenciones", "atraer",
  /* Italian */
  "manifestare", "manifestazione", "manifesta[\\p{L}\\p{M}]*", "intenzione",
  "intenzioni", "attrarre",
  /* Greek */
  "εκδήλωση", "εκδηλώ[\\p{L}\\p{M}]*", "πρόθεση", "προθέσεις", "προσελκύω",
  "έλκω",
  /* Turkish */
  "tezahür[\\p{L}\\p{M}]*", "manifestasyon", "niyet[\\p{L}\\p{M}]*", "tecelli", "çekmek",
  /* Albanian */
  "manifestim[\\p{L}\\p{M}]*", "manifesto[\\p{L}\\p{M}]*", "intentim", "qëllim", "tërheq",
].join("|");

/** The Forge door — die Schmiede · la forge · la forja · la forgia ·
    το Χυτήριο · Dökümhane · Farko — and the inventing verbs. */
export const FORGE_NAMES_I18N: string = [
  /* German */
  "schmiede", "erfindung", "erfindungen", "erfinden", "erfindet",
  "konstruieren", "entwurf",
  /* French */
  "forge", "invention", "inventions", "inventer",
  /* Spanish */
  "forja", "invención", "invenciones", "inventar",
  /* Italian */
  "forgia", "invenzione", "invenzioni", "inventare",
  /* Greek */
  "χυτήριο", "εφεύρεση", "εφευρέσεις", "εφευρίσκω", "εφευρέτης",
  /* Turkish */
  "dökümhane[\\p{L}\\p{M}]*", "icat[\\p{L}\\p{M}]*", "mucit",
  /* Albanian */
  "farko", "furra", "shpikje", "shpikja",
].join("|");

/** The Poem door — das Gedicht · le poème · el poema · la poesia ·
    το ποίημα · şiir · poezi. */
export const POEM_NAMES_I18N: string = [
  /* German */
  "gedichte?", "gedichtband", "reim", "rätsel", "wiegenlied",
  /* French */
  "poèmes?", "poésie", "devinette", "berceuse",
  /* Spanish */
  "poemas?", "poesía", "adivinanza", "canción de cuna",
  /* Italian */
  "poesia", "poemi?", "indovinello", "ninna nanna",
  /* Greek */
  "ποίημα[\\p{L}\\p{M}]*", "ποίηση", "γρίφος", "νανούρισμα", "στίχοι?",
  /* Turkish */
  "şiir[\\p{L}\\p{M}]*", "bilmece", "ninni", "mısra",
  /* Albanian */
  "poezi", "poemë", "enigmë", "këngë gjumi", "vargje?",
].join("|");

/** The Light Codes door — Lichtcodes · codes de lumière · códigos
    de luz · codici di luce · Κώδικες Φωτός · Işık Kodları · Kodat
    e Dritës — and the sound-healing words around them. */
export const CODES_NAMES_I18N: string = [
  /* German */
  "licht-?codes?", "klangbad", "klangschalen?", "klangheilung",
  "heilklang", "klangreise",
  /* French */
  "codes? de lumière", "code de lumière", "bain sonore", "soins sonores",
  /* Spanish */
  "códigos? de luz", "codigo de luz", "cuenco tibetano", "baño de sonido",
  /* Italian */
  "codici di luce", "codice di luce", "bagno sonoro",
  /* Greek */
  "κώδικες φωτός", "κώδικα φωτός", "κωδικό φωτός", "ηχητικό λουτρό",
  "ηχητικά λουτρά",
  /* Turkish */
  "ışık kodlar[\\p{L}\\p{M}]*", "ışık kodu", "ses banyosu", "şifa sesleri",
  "frekans[\\p{L}\\p{M}]*",
  /* Albanian */
  "kodave të dritës", "kodat e dritës", "koda e dritës",
  "tinguj të shërimit", "frekuencat",
].join("|");

/** The Quantum door — Quantenwelt · Monde Quantique · Mundo Cuántico ·
    Mondo Quantistico · Κβαντικός Κόσμος · Kuantum Dünya · Botë Kuantike. */
export const QUANTUM_NAMES_I18N: string = [
  /* German */
  "quanten[\\p{L}\\p{M}]*", "verschränkung", "überlagerung", "multiversum",
  "wellenfunktion", "parallelwelten",
  /* French */
  "quantique", "quantum", "intrication", "multivers", "superposition",
  /* Spanish */
  "cuántic[\\p{L}\\p{M}]*", "entrelazamiento", "superposición", "multiverso",
  /* Italian */
  "quantistic[\\p{L}\\p{M}]*", "sovrapposizione", "multiverso", "entanglement",
  /* Greek */
  "κβαντικ[\\p{L}\\p{M}]*", "κβαντικής", "διεμπλοκή", "υπέρθεση", "πολυσύμπαν",
  /* Turkish */
  "kuantum[\\p{L}\\p{M}]*", "kuantik", "dolanıklık", "süperpozisyon",
  "çoklu evren", "paralel evren",
  /* Albanian */
  "kuantik[\\p{L}\\p{M}]*", "ngërç kuantik",
].join("|");

/** The Evolve Med door — Heilmittel · remède · remedio · rimedio ·
    γιατρικό · çare · ilaç. */
export const REMEDY_NAMES_I18N: string = [
  /* German */
  "heilmittel", "heilung", "heilverfahren", "heilprotokoll", "apotheke",
  /* French */
  "remèdes?", "guérison", "apothicaire",
  /* Spanish */
  "remedios?", "sanación", "herbolaria", "botica",
  /* Italian */
  "rimedi?", "guarigione", "speziale", "erboristeria",
  /* Greek */
  "γιατρικό", "θεραπεία", "θεραπεί[\\p{L}\\p{M}]*", "φάρμακο", "φαρμακείο",
  /* Turkish */
  "çare[\\p{L}\\p{M}]*", "ilaç[\\p{L}\\p{M}]*", "şifa[\\p{L}\\p{M}]*", "şifacı",
  /* Albanian */
  "ilaç[\\p{L}\\p{M}]*", "mjekim", "shërim", "barishte",
].join("|");

/** The translated connectors — "about/of/on" after a door's name
    ("ein Buch über das Meer", "un poème sur la mer", "deniz hakkında
    bir kitap"). */
export const CONNECTOR_I18N: string = [
  "über", "von", "sur", "à propos", "sobre", "su", "di", "περί",
  "για", "σχετικά με", "hakkında", "hakkında bir", "për", "rreth",
].join("|");

/** The music nouns of every tongue — the Sound Gift must hear them
    ("spiel Musik", "mets de la musique", "müzik aç", "luaj muzikë"). */
export const MUSIC_NOUNS_I18N: string = [
  "musik", "lied", "lieder", "melodie", "musique", "chanson", "música",
  "canción", "musica", "canzone", "μουσική", "τραγούδι", "müzik",
  "şarkı", "muzikë", "këngë", "melodi", "μελωδία",
].join("|");

/* ------------------------------------------------------------------ */
/*  THE IMAGE GATE'S OWN TONGUES — the atelier must hear "zeige mir    */
/*  ein Bild", "muestra una imagen", "μια εικόνα", "bir resim çiz"     */
/*  exactly as it hears "show me a picture".                           */
/* ------------------------------------------------------------------ */

/** The visual objects of every tongue. */
export const VISUAL_OBJECTS_I18N: string = [
  /* German */
  "bilder?", "bild", "gemälde", "zeichnungen?", "fotos?", "abbildung",
  /* French */
  "dessins?", "peintures?", "images?", "photos?", "visuels?",
  /* Spanish */
  "imágenes?", "imagen", "dibujos?", "fotos?",
  /* Italian */
  "immagini?", "immagine", "disegni?", "dipinti?", "foto",
  /* Greek */
  "εικόνα", "εικόνες", "ζωγραφιές?", "φωτογραφίες?", "σκιτσο",
  /* Turkish */
  "resim[\\p{L}\\p{M}]*", "görsel[\\p{L}\\p{M}]*", "çizim[\\p{L}\\p{M}]*", "fotoğraf[\\p{L}\\p{M}]*",
  /* Albanian */
  "imazh[\\p{L}\\p{M}]*", "vizatime?", "foto", "fotografi",
].join("|");

/** The visual ask-verbs of every tongue. */
export const VISUAL_ASK_VERBS_I18N: string = [
  /* German */
  "zeig", "zeige", "zeigen", "zeichne", "zeichnen", "mal", "male",
  "malen", "erschaff", "erschaffe", "erschaffen", "generier", "gib",
  "erstell", "stelle dar", "darstell",
  /* French */
  "montre", "montrer", "dessine", "dessiner", "peins", "peindre",
  "crée", "créer", "génère", "générer", "donne", "reproduis",
  /* Spanish */
  "muestra", "mostrar", "dibuja", "dibujar", "pinta", "pintar",
  "crea", "crear", "genera", "generar", "reproduce", "imagina",
  /* Italian */
  "mostra", "mostrare", "disegna", "disegnare", "dipingi", "dipingere",
  "crea", "creare", "genera", "generare", "riproduci", "immagina",
  /* Greek */
  "δείξε", "δείχνεις", "ζωγράφισε", "ζωγράφιζε", "φτιάξε", "δημιούργησε",
  "δώσε", "απεικόνισε",
  /* Turkish */
  "göster", "çiz", "çizin", "yap", "oluştur", "üret", "resmet",
  "tasarla", "canlandır",
  /* Albanian */
  "trego", "vizato", "krijo", "prodho", "jep", "paraqit", "imagjino",
].join("|");

/** The visual meta-words — "Bildgenerator", "générateur d'images",
    "εικόνα δημιουργός" — machinery talk, never a request. */
export const VISUAL_META_I18N: string = [
  "bildgenerat[\\p{L}\\p{M}]+", "bild-?tool", "bild-?funktion", "bild-?sektion",
  "générateurs? d'images",
  "creador de imágenes?", "generatore di immagini",
  "δημιουργός εικόνων", "εικόνα δημιουργό[\\p{L}\\p{M}]*",
  "görsel oluştur[\\p{L}\\p{M}]*", "resim oluşturucu", "krijues imazhesh",
].join("|");

/** The visual negation nouns — the artifact nouns of the image gate,
    in every tongue. */
export const VISUAL_NEGATION_OBJECTS_I18N: string = VISUAL_OBJECTS_I18N;

/** The possessives of every tongue — "meine Bilder", "mes dessins",
    "mis dibujos", "le mie immagini", "benim resimlerim", "imazhet
    e mia" — referencing, not requesting. */
export const POSSESSIVE_I18N: string = [
  "mein(?:e|em|en)?", "mon", "ma", "mes", "mi(?:s)?", "mia", "miei",
  "mie", "mio", "benim", "μου", "im", "e imja", "e mia",
].join("|");

/** The "you" words of every tongue — a bare ask addressed to the
    mirror stays a bare ask; a sentence addressed to the VISITOR
    ("breathe and visualize your light") never wakes the atelier. */
export const YOU_WORDS_I18N: string = [
  "du", "dich", "dir", "dein(?:e|en|em)?", "tu", "ton", "ta", "tes",
  "te", "tú", "tu", "tus", "ti", "tuo", "tua", "tuoi", "tue", "εσύ",
  "σου", "εσένα", "sen", "seni", "senin", "sana", "ti", "tyre", "tënde",
].join("|");

/** The explicit "what does it look like" of every tongue. */
export const VISUAL_EXPLICIT_ASK_I18N: string = [
  "wie sieht [\\s\\S]{0,80}? aus", "à quoi (?:ressemble|pourrait ressembler)",
  "cómo (?:se ve|sería|luciría)", "come (?:appare|sarebbe)",
  "πώς (?:μοιάζει|φαίνεται)", "nasıl (?:görünür|görünüyor)",
  "si (?:duket|dukët)",
].join("|");

/** The form frames — "als Bild", "comme image", "como imagen",
    "come immagine", "ως εικόνα", "resim olarak", "si imazh". */
export const VISUAL_FORM_FRAMES_I18N: string = [
  "als (?:ein )?(?:bild|gemälde|zeichnung|abbildung)",
  "comme (?:une? )?(?:image|dessin|peinture|photo|visuel)",
  "como (?:una? )?(?:imagen|dibujo|pintura|foto|visual)",
  "come (?:una? )?(?:immagine|disegno|pittura|foto|visuale)",
  "ως εικόνα", "σε μορφή εικόνας",
  "resim olarak", "görsel olarak",
  "si imazh", "në formë imazhi",
].join("|");

/** The polite words of every tongue — trimmed from bare asks. */
export const POLITE_WORDS_I18N: string =
  "bitte|s'il (?:te|vous) pla[îi]t|por favor|per favore|per piacere|σε παρακαλώ|parakalō|lütfen|të lutem|ju lutem";

/** The OTHER chambers' objects, in every tongue — the cross-door law
    must hold when the visitor writes German or Greek. */
export const OTHER_DOOR_OBJECTS_I18N: string = [
  /* German */
  "kart[\\p{L}\\p{M}]+", "buch", "gedicht", "chroniken", "heilmittel", "remedies",
  "übertragung", "licht-?codes?", "sigill?e?", "absichten?", "formel",
  "erfindung", "traumbuch",
  /* French */
  "cartes?", "livre", "poème", "poésie", "chroniques", "remède",
  "transmission", "codes? de lumière", "intention", "formule", "invention",
  /* Spanish */
  "cartas?", "libro", "poema", "poesía", "crónicas", "remedio",
  "transmisión", "códigos? de luz", "intención", "fórmula", "invención",
  /* Italian */
  "carte", "libro", "poesia", "poema", "cronache", "rimedio",
  "trasmissione", "codici di luce", "intenzione", "formula", "invenzione",
  /* Greek */
  "κάρτα", "κάρτες", "βιβλίο", "ποίημα", "χρονικά", "γιατρικό",
  "μετάδοση", "κώδικες φωτός", "πρόθεση", "τύπος", "εφεύρεση",
  /* Turkish */
  "kart", "kitap", "şiir", "kayıtlar", "çare", "iletim", "ışık kodları",
  "niyet", "formül", "icat",
  /* Albanian */
  "kartë", "karta", "libër", "poezi", "regjistrimet", "ilaç",
  "transmetim", "kodave të dritës", "qëllim", "formulë", "shpikje",
].join("|");

/* ------------------------------------------------------------------ */
/*  THE QUANTUM'S INSTRUMENTS — Formel · formule · fórmula · formula ·
    τύπος · formül · formulë — and the Perception Glass in every
    tongue.                                                            */
/* ------------------------------------------------------------------ */
export const FORMULA_TOOL_I18N: string =
  "formel[\\p{L}\\p{M}]*|formulas?|formule|fórmula|φόρμουλα|τύπο[\\p{L}\\p{M}]*|formül[\\p{L}\\p{M}]*|formulë";

export const PERCEPTION_TOOL_I18N: string =
  "wahrnehmung[\\p{L}\\p{M}]*|perceiv[\\p{L}\\p{M}]+|perception|percepción|percezione|αντίληψη[\\p{L}\\p{M}]*|algı[\\p{L}\\p{M}]*|perceptim[\\p{L}\\p{M}]*";

/* ------------------------------------------------------------------ */
/*  THE SOUND GIFT — the light-codes mode tuner hears every tongue.    */
/* ------------------------------------------------------------------ */
export const LIGHT_CODES_MODES_I18N: {
  mode: string;
  words: string;
}[] = [
  {
    mode: "other-stars",
    words:
      "stern[\\p{L}\\p{M}]*|planet|arctur|plejad|sirius|vega|andromed|innere erde|zivilisation|galaxie|kosmisch|étoile|planète|civilisation|galaxie|estrella|planeta|civilización|galaxia|stella|pianeta|civiltà|galassia|αστέρ[\\p{L}\\p{M}]*|πλανήτ[\\p{L}\\p{M}]*|γαλαξί[\\p{L}\\p{M}]*|gezegen|yıldız|galaksi|yjet|gallaksi",
  },
  {
    mode: "calming-frequencies",
    words:
      "ruhig|schlaf|entspann|erdung|boden|atem[\\p{L}\\p{M}]*|angst|panik|beruhig|calme|dormir|repos|détend|ancre|respire|anxi|panique|apais|calma|dormir|descans|relaj|tierra|respir|ansied|pánico|calm|calma|dormire|ripos|rilass|terra|respir|ansi|panico|ηρεμ[\\p{L}\\p{M}]*|ύπνο|κοιμ[\\p{L}\\p{M}]*|χαλάρ[\\p{L}\\p{M}]*|γείωσ[\\p{L}\\p{M}]*|αναπνο[\\p{L}\\p{M}]*|αγχ[\\p{L}\\p{M}]*|panik|sakin|uyku|dinlen|rahat|toprak|nefes|kaygı|qetë|gjumë|pushim|relaks|tokë|frymëmarrje|ankth",
  },
  {
    mode: "restorative",
    words:
      "heil|trauer|loslass|erhol|spannung|emotional|schwer|stille|guér|chagrin|libér|tension|émotion|lourd|sanar|duelo|liber|tensión|emocion|pesado|guarig|dolore|rilasc|tensione|emozion|pesante|θεραπε[\\p{L}\\p{M}]*|λύπη|αποδέσμευ[\\p{L}\\p{M}]*|ένταση|συναισ[\\p{L}\\p{M}]*|βαρύ|iyileş[\\p{L}\\p{M}]*|keder|bırak[\\p{L}\\p{M}]*|gergin|duygusal|ağır|shër[\\p{L}\\p{M}]*|hutim|lirim|tension|ndjenjë|rëndë",
  },
  {
    mode: "reprogramming",
    words:
      "affirm|muster|glaub|mantra|ich bin|ich lasse|ich vertraue|affirm|croire|mantra|je suis|je libère|afirm|creer|mantra|yo soy|suélto|afferm|credere|mantra|io sono|lascio andare|επιβεβαίω[\\p{L}\\p{M}]*|πίστη|μαντρα|είμαι|αφήνω|afirm|inanç|mantra|afirmim|besim|mantra",
  },
];
