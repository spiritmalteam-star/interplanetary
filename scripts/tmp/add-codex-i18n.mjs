/* Task 43 — appends the 21 Codex keys to all 7 dictionaries.
   Style: 2-space indent, double quotes, trailing commas, one
   comment block per file, inserted just before the final `};`.
   One-off migration script (scripts/tmp). */
import { readFileSync, writeFileSync } from "node:fs";

const DICTS = "/home/z/my-project/src/lib/i18n/dicts";
const COMMENT = "/* ---- additions: Task 43 — the Codex, the fourth book ---- */";

const K = {
  vol: "A Volume Waiting for Its Ink",
  door: "A book is a door that has learned to wait.",
  sub: "A compact volume of the laboratory",
  sealLine: "A golden seal closes every section — one line to carry with you.",
  bound: "Bound in dawn-rose, standing beside its three companions",
  codex: "Codex",
  compact: "Compact does not mean small — it means nothing wasted.",
  folds: "Each chapter folds into sections that open only on request.",
  typed:
    "Every chapter is typed and folded. A chapter opens only when it is asked for, and the slim rail above turns the volume to any chapter without a long scroll. When the text that belongs here arrives, it is inscribed chapter by chapter — and the book fills itself.",
  four:
    "Four books stand on the laboratory shelf — the Manifest, the Akashic Library, the Star Play deck, and now this one. The Codex keeps its chapters folded, so a reader never wanders far to find a line.",
  read: "How to Read It",
  open: "Open the Codex — the compact volume of the laboratory",
  binding: "The binding",
  chapters: "The chapters of the Codex",
  travel: "The chapters travel the rail; each leaf opens and folds",
  leaves: "The leaves",
  pages: "The pages",
  rail: "The rail",
  holds:
    "The shelf holds the Manifest, the Akashic Library and the Star Play deck. This fourth spine was bound at the seeker's request — a codex: one volume meant to carry many inscriptions inside a single cover.",
  sigil:
    "The slim rail at the top of the volume carries every chapter by its sigil. Choose one and the book turns to it — no wandering, no lost place.",
  voice:
    "The voice of the laboratory can read any open chapter aloud.",
};

const T = {
  sq: {
    [K.vol]: "Një vëllim që pret menyrën e vet",
    [K.door]: "Një libër është një derë që ka mësuar të presë.",
    [K.sub]: "Një vëllim kompakt i laboratorit",
    [K.sealLine]: "Një vulë e artë mbyll çdo ndarje — një rresht për ta mbajtur me vete.",
    [K.bound]: "I lidhur në trëndafilin e agimit, pranë tre shokëve të tij",
    [K.codex]: "Codex",
    [K.compact]: "Kompakt nuk do të thotë i vogël — do të thotë se asgjë nuk humbet.",
    [K.folds]: "Çdo kapitull paloset në ndarje që hapen vetëm kur kërkohet.",
    [K.typed]:
      "Çdo kapitull është i shtypur dhe i palosur. Një kapitull hapet vetëm kur i kërkohet, dhe shiriti i hollë sipër e kthen vëllimin në çdo kapitull pa rrëshqitje të gjatë. Kur të vijë teksti që i përket këtu, ai do të shkruhet kapitull pas kapitulli — dhe libri e mbush veten.",
    [K.four]:
      "Katër libra qëndrojnë në raftin e laboratorit — Manifesto, Biblioteka Akashike, pakoja Star Play, dhe tani ky. Codex i mban kapitujt e palosur, kështu që lexuesi nuk endet kurrë larg për të gjetur një rresht.",
    [K.read]: "Si ta lexosh",
    [K.open]: "Hap Codex-in — vëllimin kompakt të laboratorit",
    [K.binding]: "Lidhja",
    [K.chapters]: "Kapitujt e Codex-it",
    [K.travel]: "Kapitujt udhëtojnë nëpër shirit; çdo faqe hapet dhe paloset",
    [K.leaves]: "Gjethet",
    [K.pages]: "Faqet",
    [K.rail]: "Shiriti",
    [K.holds]:
      "Rafti mban Manifeston, Bibliotekën Akashike dhe pakon Star Play. Kurrizi i katërt u lidh me kërkesën e kërkuesit — një kodeks: një vëllim i destinuar të mbajë shumë mbishkrime brenda një kopertine të vetme.",
    [K.sigil]:
      "Shiriti i hollë në krye të vëllimit mban çdo kapitull me simbolin e tij. Zgjidh një dhe libri kthehet në të — pa endje, pa vend të humbur.",
    [K.voice]: "Zëri i laboratorit mund ta lexojë me zë të lartë çdo kapitull të hapur.",
  },
  it: {
    [K.vol]: "Un volume in attesa del suo inchiostro",
    [K.door]: "Un libro è una porta che ha imparato ad aspettare.",
    [K.sub]: "Un volume compatto del laboratorio",
    [K.sealLine]: "Un sigillo dorato chiude ogni sezione — una riga da portare con te.",
    [K.bound]: "Rilegato in rosa dell'alba, accanto ai suoi tre compagni",
    [K.codex]: "Codex",
    [K.compact]: "Compatto non significa piccolo — significa che niente va sprecato.",
    [K.folds]: "Ogni capitolo si ripiega in sezioni che si aprono solo su richiesta.",
    [K.typed]:
      "Ogni capitolo è composto e ripiegato. Un capitolo si apre solo quando gli viene chiesto, e la sottile barra in alto conduce il volume a qualunque capitolo senza lunghi scorrimenti. Quando arriverà il testo che appartiene qui, verrà inscritto capitolo dopo capitolo — e il libro si riempirà da sé.",
    [K.four]:
      "Quattro libri si ergono sullo scaffale del laboratorio — Manifesta, la Biblioteca Akashica, il mazzo Star Play, e ora questo. Il Codex tiene i suoi capitoli ripiegati, così il lettore non vaga mai lontano per trovare una riga.",
    [K.read]: "Come leggerlo",
    [K.open]: "Apri il Codex — il volume compatto del laboratorio",
    [K.binding]: "La legatura",
    [K.chapters]: "I capitoli del Codex",
    [K.travel]: "I capitoli percorrono la barra; ogni foglio si apre e si ripiega",
    [K.leaves]: "I fogli",
    [K.pages]: "Le pagine",
    [K.rail]: "La barra",
    [K.holds]:
      "Lo scaffale custodisce Manifesta, la Biblioteca Akashica e il mazzo Star Play. Questo quarto dorso è stato rilegato su richiesta del cercatore — un codex: un volume destinato a custodire molte iscrizioni dentro un'unica copertina.",
    [K.sigil]:
      "La sottile barra in cima al volume porta ogni capitolo col suo sigillo. Scegline uno e il libro si volge verso di esso — senza vagabondaggi, senza luoghi perduti.",
    [K.voice]: "La voce del laboratorio può leggere ad alta voce qualunque capitolo aperto.",
  },
  el: {
    [K.vol]: "Ένας τόμος που περιμένει το μελάνι του",
    [K.door]: "Ένα βιβλίο είναι μια πόρτα που έμαθε να περιμένει.",
    [K.sub]: "Ένας συμπαγής τόμος του εργαστηρίου",
    [K.sealLine]: "Μια χρυσή σφραγίδα κλείνει κάθε ενότητα — μια γραμμή να κρατάς μαζί σου.",
    [K.bound]: "Δεμένος στο ροζ της αυγής, δίπλα στους τρεις συντρόφους του",
    [K.codex]: "Codex",
    [K.compact]: "Συμπαγής δεν σημαίνει μικρός — σημαίνει ότι τίποτα δεν πάει χαμένο.",
    [K.folds]: "Κάθε κεφάλαιο διπλώνεται σε ενότητες που ανοίγουν μόνο κατόπιν αιτήματος.",
    [K.typed]:
      "Κάθε κεφάλαιο είναι στοιχειοθετημένο και διπλωμένο. Ένα κεφάλαιο ανοίγει μόνο όταν του ζητηθεί, και η λεπτή ράγα ψηλά γυρνά τον τόμο σε οποιοδήποτε κεφάλαιο χωρίς μεγάλη κύλιση. Όταν έρθει το κείμενο που ανήκει εδώ, θα χαράσσεται κεφάλαιο το κεφάλαιο — και το βιβλίο γεμίζει μόνο του.",
    [K.four]:
      "Τέσσερα βιβλία στέκονται στο ράφι του εργαστηρίου — η Εκδήλωση, η Ακάσικη Βιβλιοθήκη, η τράπουλα Star Play, και τώρα αυτό. Ο Codex κρατά τα κεφάλαιά του διπλωμένα, ώστε ο αναγνώστης δεν περιπλανιέται ποτέ μακριά για να βρει μια γραμμή.",
    [K.read]: "Πώς να το διαβάσεις",
    [K.open]: "Άνοιξε τον Codex — τον συμπαγή τόμο του εργαστηρίου",
    [K.binding]: "Το δέσιμο",
    [K.chapters]: "Τα κεφάλαια του Codex",
    [K.travel]: "Τα κεφάλαια ταξιδεύουν στη ράγα· κάθε φύλλο ανοίγει και διπλώνει",
    [K.leaves]: "Τα φύλλα",
    [K.pages]: "Οι σελίδες",
    [K.rail]: "Η ράγα",
    [K.holds]:
      "Το ράφι κρατά την Εκδήλωση, την Ακάσικη Βιβλιοθήκη και την τράπουλα Star Play. Αυτή η τέταρτη ράχη δέθηκε κατόπιν αιτήματος του αναζητητή — ένας κώδικας: ένας τόμος που προορίζεται να κρατήσει πολλές επιγραφές μέσα σε ένα μόνο εξώφυλλο.",
    [K.sigil]:
      "Η λεπτή ράγα στην κορυφή του τόμου κρατά κάθε κεφάλαιο με το σύμβολό του. Διάλεξε ένα και το βιβλίο γυρνά σε εκείνο — χωρίς περιπλάνηση, χωρίς χαμένο μέρος.",
    [K.voice]: "Η φωνή του εργαστηρίου μπορεί να διαβάσει δυνατά οποιοδήποτε ανοιχτό κεφάλαιο.",
  },
  de: {
    [K.vol]: "Ein Band, das auf seine Tinte wartet",
    [K.door]: "Ein Buch ist eine Tür, die gelernt hat zu warten.",
    [K.sub]: "Ein kompaktes Band des Labors",
    [K.sealLine]: "Ein goldenes Siegel verschließt jeden Abschnitt — ein Satz, den du mitträgst.",
    [K.bound]: "Gebunden in Morgenrose, neben seinen drei Gefährten",
    [K.codex]: "Codex",
    [K.compact]: "Kompakt heißt nicht klein — es heißt, dass nichts vergeudet wird.",
    [K.folds]: "Jedes Kapitel faltet sich in Abschnitte, die sich nur auf Wunsch öffnen.",
    [K.typed]:
      "Jedes Kapitel ist gesetzt und gefaltet. Ein Kapitel öffnet sich nur, wenn darum gebeten wird, und die schlanke Leiste oben bringt das Band zu jedem Kapitel, ohne langes Scrollen. Wenn der Text, der hier hingehört, ankommt, wird er Kapitel für Kapitel eingeschrieben — und das Buch füllt sich von selbst.",
    [K.four]:
      "Vier Bücher stehen im Laborregal — Gestalten, die Akasha-Bibliothek, das Kartenspiel Star Play, und nun dieses. Der Codex hält seine Kapitel gefaltet, sodass ein Leser nie weit wandert, um einen Satz zu finden.",
    [K.read]: "Wie du es liest",
    [K.open]: "Öffne den Codex — das kompakte Band des Labors",
    [K.binding]: "Der Einband",
    [K.chapters]: "Die Kapitel des Codex",
    [K.travel]: "Die Kapitel wandern die Leiste entlang; jedes Blatt öffnet und faltet sich",
    [K.leaves]: "Die Blätter",
    [K.pages]: "Die Seiten",
    [K.rail]: "Die Leiste",
    [K.holds]:
      "Das Regal birgt Gestalten, die Akasha-Bibliothek und das Kartenspiel Star Play. Dieser vierte Rücken wurde auf Wunsch des Suchenden gebunden — ein Codex: ein Band, das viele Inschriften in einem einzigen Umschlag tragen soll.",
    [K.sigil]:
      "Die schlanke Leiste am Kopf des Bandes trägt jedes Kapitel mit seinem Siegel. Wähle eines, und das Buch wendet sich dorthin — kein Umherirren, kein verlorener Ort.",
    [K.voice]: "Die Stimme des Labors kann jedes offene Kapitel laut vorlesen.",
  },
  fr: {
    [K.vol]: "Un volume qui attend son encre",
    [K.door]: "Un livre est une porte qui a appris à attendre.",
    [K.sub]: "Un volume compact du laboratoire",
    [K.sealLine]: "Un sceau doré ferme chaque section — une ligne à porter avec vous.",
    [K.bound]: "Relié en rose de l'aube, debout auprès de ses trois compagnons",
    [K.codex]: "Codex",
    [K.compact]: "Compact ne veut pas dire petit — cela veut dire que rien n'est gaspillé.",
    [K.folds]: "Chaque chapitre se plie en sections qui ne s'ouvrent que sur demande.",
    [K.typed]:
      "Chaque chapitre est composé et plié. Un chapitre ne s'ouvre que lorsqu'on le lui demande, et la fine barre en haut mène le volume à n'importe quel chapitre sans long défilement. Quand le texte qui appartient ici arrivera, il sera inscrit chapitre après chapitre — et le livre se remplira de lui-même.",
    [K.four]:
      "Quatre livres se dressent sur le rayon du laboratoire — Manifester, la Bibliothèque Akashique, le jeu Star Play, et maintenant celui-ci. Le Codex garde ses chapitres pliés, si bien qu'un lecteur ne s'égare jamais loin pour trouver une ligne.",
    [K.read]: "Comment le lire",
    [K.open]: "Ouvrez le Codex — le volume compact du laboratoire",
    [K.binding]: "La reliure",
    [K.chapters]: "Les chapitres du Codex",
    [K.travel]: "Les chapitres voyagent le long de la barre ; chaque feuille s'ouvre et se plie",
    [K.leaves]: "Les feuillets",
    [K.pages]: "Les pages",
    [K.rail]: "La barre",
    [K.holds]:
      "Le rayon porte Manifester, la Bibliothèque Akashique et le jeu Star Play. Ce quatrième dos a été relié à la demande du chercheur — un codex : un volume destiné à porter de nombreuses inscriptions sous une seule couverture.",
    [K.sigil]:
      "La fine barre au sommet du volume porte chaque chapitre avec son sceau. Choisissez-en un et le livre s'y rend — sans errance, sans lieu perdu.",
    [K.voice]: "La voix du laboratoire peut lire à voix haute n'importe quel chapitre ouvert.",
  },
  es: {
    [K.vol]: "Un volumen que espera su tinta",
    [K.door]: "Un libro es una puerta que aprendió a esperar.",
    [K.sub]: "Un volumen compacto del laboratorio",
    [K.sealLine]: "Un sello dorado cierra cada sección — una línea para llevar contigo.",
    [K.bound]: "Encuadernado en rosa del alba, de pie junto a sus tres compañeros",
    [K.codex]: "Codex",
    [K.compact]: "Compacto no significa pequeño — significa que nada se desperdicia.",
    [K.folds]: "Cada capítulo se pliega en secciones que se abren solo a petición.",
    [K.typed]:
      "Cada capítulo está compuesto y plegado. Un capítulo se abre solo cuando se le pide, y la barra delgada de arriba lleva el volumen a cualquier capítulo sin largos desplazamientos. Cuando llegue el texto que pertenece aquí, quedará inscrito capítulo a capítulo — y el libro se llenará por sí solo.",
    [K.four]:
      "Cuatro libros se alzan en el estante del laboratorio — Manifesta, la Biblioteca Akáshica, la baraja Star Play, y ahora este. El Codex mantiene sus capítulos plegados, así el lector nunca vaga lejos para encontrar una línea.",
    [K.read]: "Cómo leerlo",
    [K.open]: "Abre el Codex — el volumen compacto del laboratorio",
    [K.binding]: "La encuadernación",
    [K.chapters]: "Los capítulos del Codex",
    [K.travel]: "Los capítulos viajan por la barra; cada hoja se abre y se pliega",
    [K.leaves]: "Las hojas",
    [K.pages]: "Las páginas",
    [K.rail]: "La barra",
    [K.holds]:
      "El estante custodia Manifesta, la Biblioteca Akáshica y la baraja Star Play. Este cuarto lomo fue encuadernado a petición del buscador — un códice: un volumen destinado a custodiar muchas inscripciones dentro de una sola cubierta.",
    [K.sigil]:
      "La barra delgada en la cima del volumen lleva cada capítulo con su sello. Elige uno y el libro se vuelve hacia él — sin vagar, sin lugar perdido.",
    [K.voice]: "La voz del laboratorio puede leer en voz alta cualquier capítulo abierto.",
  },
  tr: {
    [K.vol]: "Mürekkebini bekleyen bir cilt",
    [K.door]: "Bir kitap, beklemeyi öğrenmiş bir kapıdır.",
    [K.sub]: "Laboratuvarın kompakt cildi",
    [K.sealLine]: "Altın bir mühür her bölümü kapatır — yanında taşıman için bir satır.",
    [K.bound]: "Şafak pembesine ciltlenmiş, üç arkadaşının yanında duruyor",
    [K.codex]: "Codex",
    [K.compact]: "Kompakt olmak küçük olmak demek değildir — hiçbir şeyin boşa gitmediği demektir.",
    [K.folds]: "Her bölüm, yalnızca istendiğinde açılan kısımlara katlanır.",
    [K.typed]:
      "Her bölüm dizilmiş ve katlanmıştır. Bir bölüm yalnızca kendisinden istendiğinde açılır ve üstteki ince ray, cildi uzun bir kaydırma olmadan her bölüme taşır. Buraya ait olan metin geldiğinde, bölüm bölüm yazılacak — ve kitap kendini dolduracak.",
    [K.four]:
      "Dört kitap laboratuvar rafında duruyor — Tezahür, Akasha Kütüphanesi, Star Play destesi ve şimdi bu. Codex, bölümlerini katı tutar; böylece okuyucu bir satır bulmak için asla çok uzağa gitmez.",
    [K.read]: "Nasıl okunur",
    [K.open]: "Codex’i aç — laboratuvarın kompakt cildi",
    [K.binding]: "Ciltleme",
    [K.chapters]: "Codex’in bölümleri",
    [K.travel]: "Bölümler ray boyunca yol alır; her yaprak açılır ve katlanır",
    [K.leaves]: "Yapraklar",
    [K.pages]: "Sayfalar",
    [K.rail]: "Ray",
    [K.holds]:
      "Raf, Tezahür’ü, Akasha Kütüphanesi’ni ve Star Play destesini tutar. Bu dördüncü sırt, arayanın isteği üzerine ciltlendi — bir kodeks: tek bir kapak içinde pek çok yazıyı taşımak için tasarlanmış bir cilt.",
    [K.sigil]:
      "Cildin tepesindeki ince ray her bölümü kendi mührüyle taşır. Birini seç ve kitap ona döner — ne sapan ne kayıp bir yer.",
    [K.voice]: "Laboratuvarın sesi, açık olan her bölümü yüksek sesle okuyabilir.",
  },
};

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

for (const [lang, entries] of Object.entries(T)) {
  const path = `${DICTS}/${lang}.ts`;
  const src = readFileSync(path, "utf8");

  if (src.includes(COMMENT)) {
    console.log(`${lang}: already patched, skipping`);
    continue;
  }

  const idx = src.lastIndexOf("};");
  if (idx === -1) throw new Error(`${lang}: no closing };`);

  const lines = Object.entries(entries).map(
    ([k, v]) => `  "${esc(k)}": "${esc(v)}",`
  );
  const block = `\n  ${COMMENT}\n${lines.join("\n")}\n`;
  const next = src.slice(0, idx) + block + src.slice(idx);

  writeFileSync(path, next);
  console.log(`${lang}: +${lines.length} entries`);
}

console.log("done");
