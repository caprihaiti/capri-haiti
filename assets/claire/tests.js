/*
 * Tests de recette pour Claire Heureuse.
 * Exécution : node assets/claire/tests.js   (depuis la racine du dépôt)
 *
 * Charge knowledge-base.js et engine.js tels qu'ils s'exécutent dans le
 * navigateur (via `window`), sans dépendance npm, pour rester simple à
 * relancer par n'importe quel collaborateur du dépôt.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dir = __dirname;
const sandbox = {};
sandbox.window = sandbox;
sandbox.console = console;
vm.createContext(sandbox);

["knowledge-base.js", "engine.js"].forEach((file) => {
  const code = fs.readFileSync(path.join(dir, file), "utf8");
  vm.runInContext(code, sandbox, { filename: file });
});

const ClaireEngine = sandbox.ClaireEngine;
const CAPRI_KB = sandbox.CAPRI_KB;

let pass = 0, fail = 0;

// expectTopicId: un id de CAPRI_KB attendu, ou le littéral "NO_MATCH" pour
// vérifier que Claire admet honnêtement ne pas savoir (repli, pas d'entrée
// inventée).
function check(question, expectLang, expectTopicId) {
  const r = ClaireEngine.answer(question);
  const langOk = r.lang === expectLang;
  const topicOk = expectTopicId === "NO_MATCH" ? r.matched === false : r.id === expectTopicId;
  const ok = langOk && topicOk;
  ok ? pass++ : fail++;
  console.log(
    (ok ? "OK   " : "ÉCHEC") +
    `  [${r.lang}${expectLang && r.lang !== expectLang ? ` attendu:${expectLang}` : ""}]` +
    `  id=${r.id || "(aucun)"}` +
    (!topicOk ? ` attendu:${expectTopicId}` : "") +
    `  — "${question}"`
  );
  console.log("       → " + r.text);
}

console.log("=== Base de connaissances : " + CAPRI_KB.length + " entrées chargées ===\n");

console.log("--- Questions de recette (français) ---");
check("Qu'est-ce que CAPRI ?", "fr", "identite");
check("Quels services propose CAPRI ?", "fr", "services");
check("CAPRI travaille-t-il avec les Vice-délégations ?", "fr", "delegations_vice_delegations");
check("Quels sont vos domaines d'intervention ?", "fr", "champs_intervention");
check("CAPRI intervient-il dans l'éducation ?", "fr", "secteurs_supplementaires");
check("Comment travailler avec CAPRI ?", "fr", "presenter_projet");

console.log("\n--- Menm kesyon yo an kreyòl ayisyen ---");
check("Kisa CAPRI ye ?", "ht", "identite");
check("Ki sèvis CAPRI ofri ?", "ht", "services");

console.log("\n--- Gouvernance interne : réponse honnête dédiée (accès contrôlé), pas d'invention ---");
check("Comment CAPRI est dirigée ?", "fr", "gouvernance_interne");
check("Kilès ki direktè jeneral CAPRI kounye a ?", "ht", "gouvernance_interne");

console.log("\n--- Questions volontairement hors base (doivent déclencher le repli honnête) ---");
check("Quel est le prix d'un billet d'avion pour Miami ?", "fr", "NO_MATCH");
check("Est-ce que CAPRI a signé un accord avec la Banque mondiale ?", "fr", "NO_MATCH");

console.log(`\n=== Résultat : ${pass} test(s) réussi(s), ${fail} échec(s) ===`);
if (fail > 0) process.exitCode = 1;
