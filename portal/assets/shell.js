/*
 * Barre latérale partagée par toutes les pages du portail. Les modules non
 * encore construits (Phase 2/3) apparaissent grisés — visibles pour donner
 * le cap de l'écosystème, désactivés jusqu'à leur tour.
 */
window.CapriShell = (function () {
  "use strict";

  var NAV = [
    { group: "Écosystème", items: [
      { key: "desk", href: "desk.html", label: "CAPRI Desk", icon: "🏠" },
    ]},
    { group: "Travail", items: [
      { key: "pointage", href: "pointage.html", label: "Punch / Lunch", icon: "🕒" },
      { key: "tasks", href: "tasks.html", label: "Tasks & Missions", icon: "✅" },
    ]},
    { group: "À venir", items: [
      { key: "meet", href: null, label: "CAPRI Meet", icon: "🎥" },
      { key: "messenger", href: null, label: "CAPRI Messenger", icon: "💬" },
      { key: "docs", href: null, label: "CAPRI Docs", icon: "📄" },
      { key: "sign", href: null, label: "CAPRI Sign", icon: "✍️" },
      { key: "board", href: null, label: "CAPRI Board", icon: "🏛️" },
      { key: "performance", href: null, label: "CAPRI Performance", icon: "📊" },
      { key: "projects", href: null, label: "CAPRI Projects", icon: "🗂️" },
      { key: "academy", href: null, label: "CAPRI Academy", icon: "🎓" },
      { key: "partners", href: null, label: "CAPRI Partners", icon: "🤝" },
      { key: "vault", href: null, label: "Secure Vault", icon: "🔒" },
    ]},
  ];

  function renderSidebar(profile, activeKey) {
    var shell = document.getElementById("appShell");
    var sidebar = document.createElement("aside");
    sidebar.className = "app-sidebar";

    var brand = document.createElement("div");
    brand.className = "app-brand";
    brand.innerHTML = "CAPRI<br><small>Digital Ecosystem</small>";
    sidebar.appendChild(brand);

    var nav = document.createElement("nav");
    nav.className = "app-nav";
    NAV.forEach(function (group) {
      var label = document.createElement("div");
      label.className = "app-nav-label";
      label.textContent = group.group;
      nav.appendChild(label);
      group.items.forEach(function (item) {
        var a = document.createElement("a");
        a.textContent = item.icon + "  " + item.label;
        if (item.href) {
          a.href = item.href;
          if (item.key === activeKey) a.className = "active";
        } else {
          a.href = "#";
          a.className = "disabled";
          a.title = "Module à venir";
        }
        nav.appendChild(a);
      });
    });
    sidebar.appendChild(nav);

    var userBox = document.createElement("div");
    userBox.className = "app-user";
    userBox.innerHTML =
      '<div class="app-user-name">' + escapeHtml(profile.full_name) + "</div>" +
      '<div class="app-user-role">' + escapeHtml(window.CapriAuth.roleLabel(profile.role)) + "</div>" +
      '<button type="button" id="capriLogoutBtn">Se déconnecter</button>';
    sidebar.appendChild(userBox);

    shell.insertBefore(sidebar, shell.firstChild);
    document.getElementById("capriLogoutBtn").addEventListener("click", function () {
      window.CapriAuth.signOut();
    });
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
