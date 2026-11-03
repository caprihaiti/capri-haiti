/*
 * Barre latérale partagée par les pages de LASER-ROBOT.
 */
window.LaserShell = (function () {
  "use strict";

  var NAV = [
    { key: "accueil", href: "accueil.html", label: "Accueil", icon: "home" },
    { key: "tableaudebord", href: "tableau-de-bord.html", label: "Tableau de bord", icon: "chart" },
    { key: "dashboard", href: "dashboard.html", label: "Candidats", icon: "folder" },
    { key: "scanner", href: "scanner.html", label: "Scanner", icon: "scan" },
    { key: "referentiel", href: "referentiel.html", label: "Analyses", icon: "book" },
    { key: "comparateur", href: "comparateur.html", label: "Comparateur", icon: "compare" },
    { key: "rapports", href: "rapports.html", label: "Rapports", icon: "report" },
    { key: "account", href: "account.html", label: "Paramètres", icon: "settings" }
  ];

  // En-tête institutionnel CAPRI-Haïti + navigation horizontale (remplace
  // l'ancienne barre latérale) — reprend la maquette fournie : marque CAPRI
  // à gauche, identité LASER-ROBOT au centre, lien capri-haiti.org et
  // sélecteur de langue à droite, puis une barre de navigation complète.
  function renderSidebar(profile, activeKey) {
    var shell = document.getElementById("appShell");
    var main = shell.querySelector(".app-main");

    var header = document.createElement("div");
    header.className = "app-topheader";
    header.innerHTML =
      '<div class="app-topheader-brand">' +
        '<img class="mark avatar-mark" src="assets/avatar-laser-robot-icon.webp" alt="Avatar LASER-ROBOT" title="LASER-ROBOT — assistant visuel technologique, jamais un arbitre autonome des candidatures">' +
        '<div class="names"><b>CAPRI-HAÏTI</b><small>Centre d\'Appui à la Performance et au Renforcement Institutionnel</small></div>' +
      '</div>' +
      '<div class="app-topheader-product">' +
        '<div class="wordmark">LASER-ROBOT</div>' +
        '<div class="tagline">Système indépendant de vérification documentaire et d\'analyse des candidatures présidentielles en Haïti</div>' +
      '</div>' +
      '<div class="app-topheader-right">' +
        '<span class="flag-swatch" aria-hidden="true"><i></i><i></i></span>' +
        '<a class="app-topheader-link" href="https://capri-haiti.org" target="_blank" rel="noopener noreferrer">capri-haiti.org</a>' +
        '<span class="lang-toggle"><button type="button" class="active">FR</button><button type="button" title="Kreyòl — bientôt sur l\'ensemble de l\'application">KR</button></span>' +
      '</div>';
    shell.insertBefore(header, main);

    var nav = document.createElement("nav");
    nav.className = "app-navbar";
    nav.innerHTML = NAV.map(function (item) {
      return '<a href="' + item.href + '" class="' + (item.key === activeKey ? "active" : "") + '">' +
        icon(item.icon, 16) + '<span>' + escapeHtml(item.label) + '</span></a>';
    }).join("") +
      '<span class="app-navbar-right">' +
        '<span class="app-navbar-user">' + escapeHtml(window.LaserAuth.roleLabel(profile.role)) + '</span>' +
        '<button type="button" class="logout" id="laserLogoutBtn">Se déconnecter</button>' +
      '</span>';
    shell.insertBefore(nav, main);

    document.getElementById("laserLogoutBtn").addEventListener("click", function () {
      window.LaserAuth.signOut();
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function icon(name, size) {
    return window.LaserIcons ? window.LaserIcons.svg(name, size) : "";
  }

  function toast(message, isError) {
    var t = document.createElement("div");
    t.className = "toast" + (isError ? " error" : "");
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

  return { renderSidebar: renderSidebar, toast: toast };
})();
