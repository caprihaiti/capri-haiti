/*
 * Barre latérale partagée par les pages de LASER-ROBOT.
 */
window.LaserShell = (function () {
  "use strict";

  var NAV = [
    { key: "dashboard", href: "dashboard.html", label: "Registre des candidats", icon: "🗂️" },
    { key: "account", href: "account.html", label: "Mon compte", icon: "🪪" }
  ];

  function renderSidebar(profile, activeKey) {
    var shell = document.getElementById("appShell");

    var topbar = document.createElement("div");
    topbar.className = "app-topbar";
    topbar.innerHTML =
      '<button type="button" class="app-menu-btn" id="laserMenuBtn" aria-label="Ouvrir le menu">☰</button>' +
      '<span class="app-topbar-brand">LASER-ROBOT</span>';
    shell.insertBefore(topbar, shell.firstChild);

    var backdrop = document.createElement("div");
    backdrop.className = "app-sidebar-backdrop";
    shell.insertBefore(backdrop, shell.firstChild);

    var sidebar = document.createElement("aside");
    sidebar.className = "app-sidebar";

    var brand = document.createElement("div");
    brand.className = "app-brand";
    brand.innerHTML =
      "<div>LASER-ROBOT<br><small>Évaluation présidentielle — CAPRI</small></div>" +
      '<button type="button" class="app-sidebar-close" id="laserSidebarClose" aria-label="Fermer le menu">✕</button>';
    sidebar.appendChild(brand);

    var nav = document.createElement("nav");
    nav.className = "app-nav";
    NAV.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      a.appendChild(document.createTextNode(item.icon + "  " + item.label));
      if (item.key === activeKey) a.className = "active";
      nav.appendChild(a);
    });
    sidebar.appendChild(nav);

    var userBox = document.createElement("div");
    userBox.className = "app-user";
    userBox.innerHTML =
      '<div class="app-user-name">' + escapeHtml(profile.full_name) + "</div>" +
      '<div class="app-user-role">' + escapeHtml(window.LaserAuth.roleLabel(profile.role)) + "</div>" +
      '<button type="button" id="laserLogoutBtn">Se déconnecter</button>';
    sidebar.appendChild(userBox);

    shell.insertBefore(sidebar, shell.firstChild);
    document.getElementById("laserLogoutBtn").addEventListener("click", function () {
      window.LaserAuth.signOut();
    });

    function openMenu() { sidebar.classList.add("open"); backdrop.classList.add("open"); }
    function closeMenu() { sidebar.classList.remove("open"); backdrop.classList.remove("open"); }
    document.getElementById("laserMenuBtn").addEventListener("click", openMenu);
    document.getElementById("laserSidebarClose").addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
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
