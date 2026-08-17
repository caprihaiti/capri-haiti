/*
 * CAPRI — Fiches de Termes de Référence (TdR) du Conseil d'administration
 * ==========================================================================
 * Ce fichier ne contient AUCUN texte : les fiches (mission, responsabilités,
 * limites, redevabilité) vivent dans assets/i18n/{fr,ht,en}.json, sous la
 * page "tdr" — mêmes trois langues et même mécanisme que le reste du site.
 * Ce script sait seulement ouvrir/fermer la fenêtre et y injecter le
 * contenu de la fiche demandée, dans la langue actuellement affichée.
 *
 * Le nom des titulaires (ex. "Jean Wagner GUILLAUME") reste écrit en dur
 * dans index.html, à côté du bouton — un nom de personne ne se traduit pas.
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

  function render() {
    var pos = t("tdr." + currentPositionId);
    if (!pos || typeof pos !== "object") return;

    if (currentSeatLi) {
      nameEl.textContent = currentSeatLi.querySelector(".seat-name").textContent.trim();
      titleEl.textContent = currentSeatLi.querySelector(".seat-title").textContent.trim();
    }

    bodyEl.innerHTML = "";

    // Dispositions communes (rappel, en tête de chaque fiche)
    bodyEl.appendChild(renderSection(t("tdr.section_commun"), [el("p", null, [t("tdr.commun_texte")])]));

    // Mission générale
    bodyEl.appendChild(renderSection(t("tdr.section_mission"), [el("p", null, [pos.mission || ""])]));

    // Responsabilités principales
    if (pos.responsabilites && pos.responsabilites.length) {
      bodyEl.appendChild(renderSection(t("tdr.section_resp"), [renderList(pos.responsabilites)]));
    }

    // Limites d'autorité et d'indépendance (intro + liste + encarts "principe")
    var limitesNodes = [];
    if (pos.limites_intro) limitesNodes.push(el("p", null, [pos.limites_intro]));
    if (pos.limites && pos.limites.length) limitesNodes.push(renderList(pos.limites));
    (pos.extra || []).forEach(function (box) {
      limitesNodes.push(renderExtraBox(box.title, box.text));
    });
    if (limitesNodes.length) {
      bodyEl.appendChild(renderSection(t("tdr.section_limites"), limitesNodes));
    }

    // Redevabilité (absente pour certains postes de contrôle — non affichée si vide)
    if (pos.redevabilite) {
      bodyEl.appendChild(renderSection(t("tdr.section_redevabilite"), [el("p", null, [pos.redevabilite])]));
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

  document.querySelectorAll(".seat-tdr").forEach(function (btn) {
    btn.addEventListener("click", function () {
      open(btn.getAttribute("data-tdr"), btn.closest("li"));
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
