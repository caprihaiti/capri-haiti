/*
 * CAPRI — Fiches de Termes de Référence (TdR)
 * ==========================================================================
 * Ce fichier ne contient AUCUN texte : les fiches vivent dans
 * assets/i18n/{fr,ht,en}.json, sous la page "tdr" — mêmes trois langues et
 * même mécanisme que le reste du site. Ce script sait seulement ouvrir/
 * fermer la fenêtre et y injecter le contenu de la fiche demandée, dans la
 * langue actuellement affichée.
 *
 * Deux familles de fiches, un seul rendu générique :
 *  - "individuel" (les 5 sièges du Conseil d'administration) : le nom du
 *    titulaire (ex. "Jean Wagner GUILLAUME") reste écrit en dur dans
 *    index.html à côté du bouton .seat-tdr — un nom de personne ne se
 *    traduit pas — avec mission/responsabilites/limites/redevabilite.
 *  - "organe" (Comité d'éthique, Conseil scientifique, Direction exécutive,
 *    les 4 Pôles, Observatoire, Suivi-évaluation, Administration et
 *    conformité, Réseau d'experts, Cellules de mission) : ouverts depuis un
 *    bouton .org-tdr-btn à l'intérieur d'une carte .org-node/.org-pole dont
 *    le <h3> sert d'en-tête de fiche, avec des champs plus riches
 *    (positionnement, attributions, composition, mode de désignation,
 *    fonctionnement, relations, livrables) reflétant la matrice TdR
 *    standardisée de l'organigramme.
 * Un champ absent ne rend simplement pas sa section — aucune fiche n'a
 * besoin de renseigner tous les champs.
 */
(function () {
  "use strict";

  var overlay = document.getElementById("tdrOverlay");
  if (!overlay) return; // page sans organigramme (sécurité)

  var modal = overlay.querySelector(".tdr-modal");
  var closeBtn = document.getElementById("tdrClose");
  var nameEl = document.getElementById("tdrName");
  var titleEl = document.getElementById("tdrTitle");
  var bodyEl = document.getElementById("tdrBody");

  var currentPositionId = null;
  var currentSeatLi = null; // référence live vers le <li> du siège ouvert,
  // pour relire son nom/titre déjà traduits par i18n.js à chaque rendu.

  function t(key) {
    return (window.CapriI18n && window.CapriI18n.t(key)) || "";
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function renderSection(titleText, contentNodes) {
    var section = el("div", { class: "tdr-section" });
    section.appendChild(el("h4", null, [titleText]));
    contentNodes.forEach(function (n) { section.appendChild(n); });
    return section;
  }

  function renderList(items) {
    var ul = el("ul");
    items.forEach(function (item) { ul.appendChild(el("li", null, [item])); });
    return ul;
  }

  function renderExtraBox(title, text) {
    var box = el("div", { class: "tdr-extra" });
    box.appendChild(el("h5", null, [title]));
    box.appendChild(el("p", null, [text]));
    return box;
  }

  // Lit le nom/titre à afficher en en-tête de la fiche depuis l'élément
  // source (déjà traduit par i18n.js) : un <li> de siège individuel
  // (.seat-name/.seat-title) ou une carte d'organe (son <h3>).
  function readHeader(sourceEl) {
    if (!sourceEl) return { name: "", title: "" };
    var seatName = sourceEl.querySelector(".seat-name");
    var seatTitle = sourceEl.querySelector(".seat-title");
    if (seatName && seatTitle) {
      return { name: seatName.textContent.trim(), title: seatTitle.textContent.trim() };
    }
    var h3 = sourceEl.querySelector("h3");
    return { name: h3 ? h3.textContent.trim() : "", title: "" };
  }

  function render() {
    var pos = t("tdr." + currentPositionId);
    if (!pos || typeof pos !== "object") return;

    if (currentSeatLi) {
      var header = readHeader(currentSeatLi);
      nameEl.textContent = header.name;
      titleEl.textContent = header.title;
      titleEl.style.display = header.title ? "" : "none";
    }

    bodyEl.innerHTML = "";
    var isOrgane = pos.type === "organe";

    // Dispositions communes aux membres du Conseil — seulement pour les
    // fiches individuelles des 5 sièges du CA, pas pour les organes.
    if (!isOrgane) {
      bodyEl.appendChild(renderSection(t("tdr.section_commun"), [el("p", null, [t("tdr.commun_texte")])]));
    }

    // Positionnement dans l'organigramme (organes)
    if (pos.positionnement) {
      bodyEl.appendChild(renderSection(t("tdr.section_positionnement"), [el("p", null, [pos.positionnement])]));
    }

    // Mission générale
    bodyEl.appendChild(renderSection(t("tdr.section_mission"), [el("p", null, [pos.mission || ""])]));

    // Responsabilités / Attributions principales
    var attrList = pos.attributions || pos.responsabilites;
    if (attrList && attrList.length) {
      var attrLabel = pos.attributions ? t("tdr.section_attributions") : t("tdr.section_resp");
      bodyEl.appendChild(renderSection(attrLabel, [renderList(attrList)]));
    }

    // Composition (organes)
    if (pos.composition) {
      var compNodes = Array.isArray(pos.composition) ? [renderList(pos.composition)] : [el("p", null, [pos.composition])];
      bodyEl.appendChild(renderSection(t("tdr.section_composition"), compNodes));
    }

    // Mode de désignation (organes collégiaux)
    if (pos.mode_designation) {
      bodyEl.appendChild(renderSection(t("tdr.section_designation"), [el("p", null, [pos.mode_designation])]));
    }

    // Fonctionnement (organes)
    if (pos.fonctionnement) {
      bodyEl.appendChild(renderSection(t("tdr.section_fonctionnement"), [el("p", null, [pos.fonctionnement])]));
    }

    // Relations avec les autres organes
    if (pos.relations) {
      bodyEl.appendChild(renderSection(t("tdr.section_relations"), [el("p", null, [pos.relations])]));
    }

    // Limites d'autorité/indépendance (individus) ou distinctions et
    // limites de mandat (organes) — intro + liste + encarts "principe"
    var limitesNodes = [];
    if (pos.limites_intro) limitesNodes.push(el("p", null, [pos.limites_intro]));
    if (pos.limites && pos.limites.length) limitesNodes.push(renderList(pos.limites));
    (pos.extra || []).forEach(function (box) {
      limitesNodes.push(renderExtraBox(box.title, box.text));
    });
    if (limitesNodes.length) {
      var limLabel = isOrgane ? t("tdr.section_limites_organe") : t("tdr.section_limites");
      bodyEl.appendChild(renderSection(limLabel, limitesNodes));
    }

    // Redevabilité (absente pour certains postes de contrôle — non affichée si vide)
    if (pos.redevabilite) {
      bodyEl.appendChild(renderSection(t("tdr.section_redevabilite"), [el("p", null, [pos.redevabilite])]));
    }

    // Livrables et indicateurs (organes)
    if (pos.livrables && pos.livrables.length) {
      bodyEl.appendChild(renderSection(t("tdr.section_livrables"), [renderList(pos.livrables)]));
    }
  }

  function open(positionId, seatLi) {
    currentPositionId = positionId;
    currentSeatLi = seatLi;
    render();
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    currentPositionId = null;
  }

  document.querySelectorAll(".seat-tdr, .org-tdr-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var source = btn.closest("li") || btn.closest(".org-node, .org-pole");
      open(btn.getAttribute("data-tdr"), source);
    });
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  // Si le visiteur change la langue du site pendant que la fiche est ouverte,
  // on la re-rend dans la nouvelle langue plutôt que de la laisser obsolète.
  if (window.CapriI18n) {
    window.CapriI18n.onChange(function () {
      if (currentPositionId) render();
    });
  }
})();
