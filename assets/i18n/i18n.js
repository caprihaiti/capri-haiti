/*
 * CAPRI — Moteur de traduction du site (FR par défaut, HT, EN)
 * ================================================================
 * Architecture : ce fichier ne contient AUCUN texte du site. Il sait
 * seulement (1) charger les fichiers de traduction assets/i18n/{lang}.json,
 * (2) appliquer la langue choisie à tous les éléments marqués data-i18n*,
 * (3) mémoriser le choix du visiteur.
 *
 * Pour ajouter l'espagnol plus tard : ajouter "es" à SUPPORTED_LANGS,
 * créer assets/i18n/es.json (mêmes clés que fr.json/ht.json/en.json) et
 * ajouter un bouton ES dans le sélecteur (#langSwitch, dans index.html).
 * Aucune autre modification n'est nécessaire — aucune reconstruction du site.
 */
(function () {
  "use strict";

  var SUPPORTED_LANGS = ["fr", "ht", "en"];
  var DEFAULT_LANG = "fr";
  var STORAGE_KEY = "capri_lang";

  var LANG_LABELS = { fr: "Français", ht: "Kreyòl ayisyen", en: "English" };
  var META_TITLE = {
    fr: "CAPRI — Centre d'Appui à la Performance et au Renforcement Institutionnel",
    ht: "CAPRI — Sant Apui pou Pèfòmans ak Ranfòsman Enstitisyonèl",
    en: "CAPRI — Center for Institutional Performance and Strengthening"
  };

  var translations = {}; // { fr: {...}, ht: {...}, en: {...} }
  var currentLang = DEFAULT_LANG;

  function detectInitialLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage indisponible (mode privé, etc.) — on continue */ }

    var url = new URL(window.location.href);
    var qLang = url.searchParams.get("lang");
    if (qLang && SUPPORTED_LANGS.indexOf(qLang) !== -1) return qLang;

    var nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (nav && SUPPORTED_LANGS.indexOf(nav) !== -1) return nav;

    return DEFAULT_LANG;
  }

  function resolve(lang, fullKey) {
    var dot = fullKey.indexOf(".");
    if (dot === -1) return undefined;
    var pg = fullKey.slice(0, dot), sub = fullKey.slice(dot + 1);
    var pack = translations[lang];
    if (!pack || !pack[pg]) return undefined;
    return pack[pg][sub];
  }

  function applyLanguage(lang) {
    if (!translations[lang]) return; // pas encore chargé
    currentLang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = resolve(lang, key);
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      var val = resolve(lang, key);
      if (val !== undefined) el.innerHTML = val; // contenu propre à CAPRI, jamais une saisie visiteur
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var val = resolve(lang, el.getAttribute("data-i18n-placeholder"));
      if (val !== undefined) el.setAttribute("placeholder", val);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var val = resolve(lang, el.getAttribute("data-i18n-aria-label"));
      if (val !== undefined) el.setAttribute("aria-label", val);
    });
    document.querySelectorAll("[data-i18n-content]").forEach(function (el) {
      var val = resolve(lang, el.getAttribute("data-i18n-content"));
      if (val !== undefined) el.setAttribute("content", val);
    });

    if (META_TITLE[lang]) document.title = META_TITLE[lang];

    // Note « document disponible en français » sur la présentation publique
    var pdfNote = document.getElementById("pdfLangNote");
    if (pdfNote) pdfNote.hidden = (lang === "fr");

    document.querySelectorAll("#langSwitch .lang-btn").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }

    var url = new URL(window.location.href);
    if (lang === DEFAULT_LANG) url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1) return;
    if (translations[lang]) { applyLanguage(lang); return; }
    loadLang(lang).then(function () { applyLanguage(lang); });
  }

  function loadLang(lang) {
    if (translations[lang]) return Promise.resolve();
    return fetch("assets/i18n/" + lang + ".json")
      .then(function (r) { return r.json(); })
      .then(function (data) { translations[lang] = data; })
      .catch(function (err) {
        console.error("CAPRI i18n: échec de chargement de", lang, err);
      });
  }

  function init() {
    var initial = detectInitialLang();
    Promise.all(SUPPORTED_LANGS.map(loadLang)).then(function () {
      applyLanguage(initial);
    });

    document.querySelectorAll("#langSwitch .lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exposée pour debug / extension future (ex. ajout futur de l'espagnol).
  window.CapriI18n = { setLang: setLang, getLang: function () { return currentLang; }, SUPPORTED_LANGS: SUPPORTED_LANGS };
})();
