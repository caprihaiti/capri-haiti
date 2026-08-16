/*
 * Test de recette du système multilingue CAPRI.
 *
 * Usage : depuis assets/i18n/tests/  ->  npm install && npm test
 * (nécessite jsdom, déclaré en devDependency ici seulement — ce dossier de
 * test n'affecte en rien le site statique publié.)
 *
 * Charge la vraie page index.html dans un DOM simulé, exécute i18n.js et
 * les scripts de Claire exactement comme un navigateur le ferait, puis
 * vérifie le comportement observable : langue par défaut, application de
 * chaque type de traduction, persistance, synchronisation d'URL,
 * indépendance de Claire vis-à-vis du sélecteur de langue du site.
 */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..", ".."); // assets/i18n/tests -> racine du dépôt
const html = fs.readFileSync(path.join(REPO, "index.html"), "utf8");

(async () => {
  const dom = new JSDOM(html, {
    url: "https://capri-haiti.org/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // Isoler ce test du navigateur.language de la machine qui l'exécute : on
  // simule un visiteur sans préférence de langue reconnue par le site, pour
  // vérifier précisément le repli sur le français par défaut.
  Object.defineProperty(window.navigator, "language", { value: "es-ES" });

  // Pas de réseau dans cet environnement de test : lire les fichiers JSON
  // directement depuis le dépôt plutôt que de faire un vrai fetch() HTTP.
  window.fetch = async (url) => {
    const p = path.join(REPO, url.replace(/^\.?\//, ""));
    const data = fs.readFileSync(p, "utf8");
    return { json: async () => JSON.parse(data) };
  };

  const scripts = [
    "assets/i18n/i18n.js",
    "assets/claire/knowledge-base.js",
    "assets/claire/engine.js",
  ];
  for (const rel of scripts) {
    window.eval(fs.readFileSync(path.join(REPO, rel), "utf8"));
  }

  // Attendre que le moteur ait réellement appliqué une langue, plutôt qu'un
  // délai fixe : dans ce bac à sable, jsdom tente aussi (et échoue, en vain)
  // de charger les balises <script src> via un vrai réseau, ce qui peut
  // retarder l'évènement DOMContentLoaded bien au-delà d'un court délai fixe.
  async function waitFor(cond, timeoutMs) {
    const start = Date.now();
    while (!cond()) {
      if (Date.now() - start > timeoutMs) throw new Error("waitFor: délai dépassé");
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  // documentElement.lang="fr" is already present in the raw HTML source, so
  // it's true before any JS runs — wait instead for something JS-only adds:
  // the .active class on a language button, proof applyLanguage() has run.
  await waitFor(() => {
    var btn = window.document.querySelector(".lang-btn.active");
    return !!(window.CapriI18n && btn);
  }, 5000);

  const doc = window.document;
  let allOk = true;
  function check(label, cond) {
    console.log((cond ? "OK   " : "ÉCHEC") + "  " + label);
    allOk = allOk && !!cond;
  }

  check("html[lang] = fr par défaut", doc.documentElement.lang === "fr");
  check("nav Accueil (FR)", doc.querySelector('[data-i18n="global.004"]').textContent === "Accueil");
  check("hero h1 contient 'fortes, performantes'", doc.querySelector("h1").innerHTML.includes("fortes, performantes et durables"));
  check("bouton FR actif par défaut", doc.querySelector('.lang-btn[data-lang="fr"]').classList.contains("active"));
  check("note PDF cachée en FR", doc.getElementById("pdfLangNote").hidden === true);

  window.CapriI18n.setLang("ht");
  await new Promise((r) => setTimeout(r, 50));
  check("html[lang] = ht après changement", doc.documentElement.lang === "ht");
  check("nav Akèy (HT)", doc.querySelector('[data-i18n="global.004"]').textContent === "Akèy");
  check("hero h1 traduit en HT", doc.querySelector("h1").innerHTML.includes("ki fò, ki pèfòmant e ki dirab"));
  check("bloc Catalogue Service->Sèvis traduit", doc.querySelector('[data-i18n-html="catalog.b01"]').innerHTML.includes("Sèvis 1"));
  check("fragment span Coopération traduit (b01)", doc.querySelector('[data-i18n="coop.b01"]').textContent.includes("otorite tutèl"));
  check("note PDF visible en HT", doc.getElementById("pdfLangNote").hidden === false);
  check("texte note PDF en HT", doc.getElementById("pdfLangNote").textContent === "Dokiman disponib an fransè.");
  check("choix persisté dans localStorage", window.localStorage.getItem("capri_lang") === "ht");
  check("URL mise à jour avec ?lang=ht", window.location.search.includes("lang=ht"));
  check("bouton HT actif, FR non", doc.querySelector('.lang-btn[data-lang="ht"]').classList.contains("active") && !doc.querySelector('.lang-btn[data-lang="fr"]').classList.contains("active"));
  check("document.title mis à jour en HT", doc.title.indexOf("Sant Apui") !== -1);

  window.CapriI18n.setLang("en");
  await new Promise((r) => setTimeout(r, 50));
  check("nav Home (EN)", doc.querySelector('[data-i18n="global.004"]').textContent === "Home");
  check("meta description mise à jour (EN)", doc.querySelector('meta[name="description"]').getAttribute("content").startsWith("CAPRI supports Haitian"));
  check("URL mise à jour avec ?lang=en", window.location.search.includes("lang=en"));

  const claireFr = window.ClaireEngine.answer("Qu'est-ce que CAPRI ?");
  check("Claire répond en FR à une question FR", claireFr.lang === "fr" && claireFr.id === "identite");
  const claireHt = window.ClaireEngine.answer("Kisa CAPRI ye ?");
  check("Claire répond en HT à une question HT", claireHt.lang === "ht" && claireHt.id === "identite");

  window.CapriI18n.setLang("fr");
  await new Promise((r) => setTimeout(r, 50));
  check("retour au FR retire ?lang= de l'URL", !window.location.search.includes("lang="));

  console.log("\n" + (allOk ? "TOUS LES TESTS ONT RÉUSSI" : "CERTAINS TESTS ONT ÉCHOUÉ"));
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error("TEST INTERROMPU :", e); process.exit(1); });
