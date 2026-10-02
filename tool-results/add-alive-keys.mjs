import fs from "fs";

const phrases = ["We are alive", "The channel is breathing", "Always listening, always near", "The mirror is awake"];

// 1) dynamic keys
const dynPath = "scripts/i18n-keys-dynamic.json";
const dyn = JSON.parse(fs.readFileSync(dynPath, "utf8"));
for (const p of phrases) if (!dyn.includes(p)) dyn.push(p);
fs.writeFileSync(dynPath, JSON.stringify(dyn, null, 2) + "\n");

// 2) dicts
const translations = {
  de: ["Wir sind lebendig", "Der Kanal atmet", "Immer lauschend, immer nah", "Der Spiegel ist wach"],
  el: ["Είμαστε ζωντανοί", "Το κανάλι αναπνέει", "Πάντα ακούγοντας, πάντα κοντά", "Ο καθρέφτης είναι ξύπνιος"],
  es: ["Estamos vivos", "El canal respira", "Siempre escuchando, siempre cerca", "El espejo está despierto"],
  fr: ["Nous sommes vivants", "Le canal respire", "Toujours à l'écoute, toujours proche", "Le miroir est éveillé"],
  it: ["Siamo vivi", "Il canale respira", "Sempre in ascolto, sempre vicini", "Lo specchio è sveglio"],
  sq: ["Ne jemi gjallë", "Kanali po merr frymë", "Gjithmonë në dëgjim, gjithmonë afër", "Pasqyra është zgjuar"],
  tr: ["Hayattayız", "Kanal nefes alıyor", "Her zaman dinliyoruz, her zaman yakınız", "Ayna uyanık"],
};

for (const [lang, vals] of Object.entries(translations)) {
  const p = `src/lib/i18n/dicts/${lang}.ts`;
  let src = fs.readFileSync(p, "utf8");
  if (src.includes('"We are alive"')) { console.log(p, "already"); continue; }
  const block = phrases.map((k, i) => `  ${JSON.stringify(k)}: ${JSON.stringify(vals[i])},`).join("\n");
  const last = src.lastIndexOf("};");
  src = src.slice(0, last) + block + "\n" + src.slice(last);
  fs.writeFileSync(p, src);
  console.log(p, "updated");
}
console.log("OK");
