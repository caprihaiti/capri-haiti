/*
 * CAPRI — Moteur de réponse de Claire Heureuse
 * ==============================================
 * Ce fichier ne contient AUCUNE connaissance sur CAPRI : il sait seulement
 * (1) détecter si la question est posée en français ou en créole haïtien,
 * (2) trouver, dans window.CAPRI_KB (voir knowledge-base.js), l'entrée dont
 *     les mots-clés correspondent le mieux à la question,
 * (3) renvoyer une réponse honnête « je ne sais pas » quand aucune entrée
 *     ne correspond, plutôt que d'inventer une réponse.
 *
 * Interface : window.ClaireEngine.answer(question) → { lang, text, matched, id }
 * L'interface visuelle de Claire (dans index.html) n'a besoin de connaître
 * que cette seule fonction. Enrichir Claire = ajouter des entrées dans
 * knowledge-base.js ; changer sa façon de comprendre = modifier ce fichier.
 * Aucun des deux ne nécessite de toucher à index.html.
 */
window.ClaireEngine = (function () {
  "use strict";

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // retire les accents
      .replace(/['’‘]/g, "'")
      .trim();
  }

  // Mots-outils qui n'existent, à l'écrit, que dans une seule des deux
  // langues (orthographes distinctes) — sert uniquement à choisir la
  // langue de réponse, pas à comprendre le sujet de la question.
  var HT_TOKENS = ["kisa", "kijan", "kouman", "poukisa", "eske", "kile", "kilès",
    "tanpri", "souple", "zafè", "kapab", "kapav", "w", "yo", "mwen", "nou",
    "gen", "pa", "ak", "nan", "pou", "sou", "fè", "sèvis", "peyi", "bagay",
    "dwe", "kounye", "jodi", "kote", "ki"];
  var FR_TOKENS = ["le", "la", "les", "des", "du", "un", "une", "est", "êtes",
    "es", "vous", "nous", "avec", "pour", "dans", "sur", "que", "qui",
    "quel", "quels", "quelle", "quelles", "comment", "pourquoi",
    "travaillez", "proposez", "souhaite", "souhaitons", "pouvez", "votre",
    "vos", "notre", "nos", "c'est", "ainsi"];

  function detectLang(rawText) {
    var norm = normalize(rawText);
    var tokens = norm.split(/[^a-z']+/).filter(Boolean);
    var htScore = 0, frScore = 0;
    tokens.forEach(function (tok) {
      if (HT_TOKENS.indexOf(tok) !== -1) htScore++;
      if (FR_TOKENS.indexOf(tok) !== -1) frScore++;
    });
    if (htScore > frScore) return "ht";
    if (frScore > htScore) return "fr";
    return "fr"; // langue par défaut du site quand aucun signal net
  }

  function scoreEntry(entry, normQuestion) {
    var total = 0;
    (entry.keywords || []).forEach(function (kw) {
      var nk = normalize(kw);
      if (nk && normQuestion.indexOf(nk) !== -1) {
        total += nk.length; // une expression plus longue/spécifique pèse plus
      }
    });
    return total;
  }

  function bestMatch(question) {
    var kb = window.CAPRI_KB || [];
    var normQuestion = normalize(question);
    var best = null, bestScore = 0;
    for (var i = 0; i < kb.length; i++) {
      var s = scoreEntry(kb[i], normQuestion);
      if (s > bestScore) {
        bestScore = s;
        best = kb[i];
      }
    }
    return best;
  }

  var GREETING_TOKENS = ["bonjou", "bonjour", "bonswa", "bonsoir", "salut", "alo", "hello"];
  var GREETING = {
    fr: "Bonjour ! Heureuse de vous accueillir. Je peux vous renseigner sur l'identité de CAPRI, ses services, sa méthode, ses champs d'intervention ou la manière de le contacter.",
    ht: "Bonjou ! Kontan akeyi w. Mwen ka enfòme w sou idantite CAPRI, sèvis li yo, metòd li, domèn entèvansyon li yo oswa fason pou kontakte l."
  };
  var FALLBACK = {
    fr: "Je n'ai pas d'information suffisamment fiable pour répondre précisément à cette question. Pour une réponse personnalisée, écrivez à contact@capri-haiti.org, appelez CAPRI au +509 37 06 1335 ou consultez la page Contact.",
    ht: "Mwen pa gen ase enfòmasyon fyab pou m reponn kesyon sa a presizeman. Pou yon repons pèsonalize, ekri nan contact@capri-haiti.org, rele CAPRI nan +509 37 06 1335 oswa konsilte paj Kontak la."
  };

  /**
   * Répond à une question de visiteur.
   * Priorité : (1) un vrai sujet reconnu dans la base de connaissances,
   * (2) sinon une simple salutation, (3) sinon la réponse honnête de repli.
   * Ne renvoie jamais un texte qui ne provient pas de knowledge-base.js.
   */
  function answer(question) {
    var lang = detectLang(question);
    var normQuestion = normalize(question);

    var match = bestMatch(question);
    if (match) {
      return { lang: lang, text: match[lang] || match.fr, matched: true, id: match.id };
    }

    var isGreeting = GREETING_TOKENS.some(function (w) {
      return normQuestion.indexOf(normalize(w)) !== -1;
    });
    if (isGreeting) {
      return { lang: lang, text: GREETING[lang], matched: true, id: "greeting" };
    }

    return { lang: lang, text: FALLBACK[lang], matched: false, id: null };
  }

  return {
    normalize: normalize,
    detectLang: detectLang,
    bestMatch: bestMatch,
    answer: answer
  };
})();
