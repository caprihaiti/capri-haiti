/*
 * Barre latérale partagée par toutes les pages du portail. Les modules non
 * encore construits (Phase 2/3) apparaissent grisés — visibles pour donner
 * le cap de l'écosystème, désactivés jusqu'à leur tour.
 */
window.CapriShell = (function () {
  "use strict";

  var unreadBadgeEl = null;
  var notifRealtimeChannel = null;
  var baseTitle = document.title;

  var NAV = [
    { group: "Écosystème", items: [
      { key: "desk", href: "desk.html", label: "CAPRI Desk", icon: "🏠" },
      { key: "profil", href: "profil.html", label: "Mon profil", icon: "🪪" },
    ]},
    { group: "Travail", items: [
      { key: "pointage", href: "pointage.html", label: "Punch / Lunch", icon: "🕒" },
      { key: "tasks", href: "tasks.html", label: "Tasks & Missions", icon: "✅" },
      { key: "meet", href: "meet.html", label: "CAPRI Meet", icon: "🎥" },
      { key: "messenger", href: "messenger.html", label: "CAPRI Messenger", icon: "💬" },
      { key: "courrier", href: "courrier.html", label: "CAPRI Courrier", icon: "✉️" },
      { key: "docs", href: "docs.html", label: "CAPRI Docs", icon: "📄" },
      { key: "institutionnel", href: "institutionnel.html", label: "Institutionnel", icon: "🏛️" },
      { key: "epas", href: "epas.html", label: "CAPRI ePAS", icon: "📈" },
    ]},
    { group: "À venir", items: [
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

    // Barre du haut, visible seulement sur petit écran (téléphone) : la
    // sidebar elle-même se transforme alors en tiroir masqué par défaut —
    // sans ceci, il n'y avait tout simplement aucun moyen de naviguer entre
    // les pages du portail sur mobile.
    var topbar = document.createElement("div");
    topbar.className = "app-topbar";
    topbar.innerHTML =
      '<button type="button" class="app-menu-btn" id="capriMenuBtn" aria-label="Ouvrir le menu">☰</button>' +
      '<span class="app-topbar-brand">CAPRI</span>';
    shell.insertBefore(topbar, shell.firstChild);

    var backdrop = document.createElement("div");
    backdrop.className = "app-sidebar-backdrop";
    shell.insertBefore(backdrop, shell.firstChild);

    var sidebar = document.createElement("aside");
    sidebar.className = "app-sidebar";

    var brand = document.createElement("div");
    brand.className = "app-brand";
    brand.innerHTML =
      "<div>CAPRI<br><small>Digital Ecosystem</small></div>" +
      '<button type="button" class="app-sidebar-close" id="capriSidebarClose" aria-label="Fermer le menu">✕</button>';
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
        a.appendChild(document.createTextNode(item.icon + "  " + item.label));
        if (item.href) {
          a.href = item.href;
          if (item.key === activeKey) a.className = "active";
        } else {
          a.href = "#";
          a.className = "disabled";
          a.title = "Module à venir";
        }
        if (item.key === "messenger") {
          var badge = document.createElement("span");
          badge.className = "app-nav-badge";
          a.appendChild(badge);
          unreadBadgeEl = badge;
        }
        nav.appendChild(a);
      });
    });
    sidebar.appendChild(nav);

    var userBox = document.createElement("div");
    userBox.className = "app-user";
    userBox.innerHTML =
      (profile.avatar_url ? '<img class="app-user-avatar" src="' + escapeHtml(profile.avatar_url) + '" alt="">' : "") +
      '<div class="app-user-name">' + escapeHtml(profile.full_name) + "</div>" +
      (profile.title ? '<div class="app-user-title">' + escapeHtml(profile.title) + "</div>" : "") +
      '<div class="app-user-role">' + escapeHtml(window.CapriAuth.roleLabel(profile.role)) + "</div>" +
      '<button type="button" id="capriLogoutBtn">Se déconnecter</button>';
    sidebar.appendChild(userBox);

    // Proposer l'activation des notifications du navigateur une seule fois
    // (tant que l'utilisateur n'a ni accepté ni refusé) — jamais de demande
    // automatique sans geste explicite.
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      var notifBtn = document.createElement("button");
      notifBtn.type = "button";
      notifBtn.className = "app-notif-btn";
      notifBtn.textContent = "🔔 Activer les notifications";
      notifBtn.addEventListener("click", function () {
        Notification.requestPermission().then(function (perm) {
          notifBtn.remove();
          if (perm === "granted") toast("Notifications activées.");
        });
      });
      userBox.appendChild(notifBtn);
    }

    shell.insertBefore(sidebar, shell.firstChild);
    document.getElementById("capriLogoutBtn").addEventListener("click", function () {
      window.CapriAuth.signOut();
    });

    function openMenu() { sidebar.classList.add("open"); backdrop.classList.add("open"); }
    function closeMenu() { sidebar.classList.remove("open"); backdrop.classList.remove("open"); }
    document.getElementById("capriMenuBtn").addEventListener("click", openMenu);
    document.getElementById("capriSidebarClose").addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);

    startNotifications(profile);
  }

  // ---- Badge de messages non lus + notification navigateur -----------------
  // Actif sur toutes les pages du portail (pas seulement CAPRI Messenger),
  // puisque renderSidebar() est appelé au chargement de chacune d'elles.

  function startNotifications(profile) {
    if (!window.capriSupabase) return;
    refreshUnreadBadge();
    if (notifRealtimeChannel) return; // déjà abonné (navigation entre pages sans rechargement complet)
    notifRealtimeChannel = window.capriSupabase
      .channel("capri-notif-" + profile.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, function (payload) {
        if (payload.new.sender_id === profile.id) return;
        // Déjà en train de regarder cette conversation précise : pas besoin
        // de badge ni de notification (messenger.html expose activeChannelId).
        if (!document.hidden && window.activeChannelId === payload.new.channel_id) return;
        refreshUnreadBadge();
        showDesktopNotification(payload.new);
      })
      .subscribe();
  }

  function refreshUnreadBadge() {
    if (!window.capriSupabase) return;
    window.capriSupabase.rpc("unread_message_count").then(function (res) {
      if (res.error) return;
      renderUnreadBadge(res.data || 0);
    });
  }

  function renderUnreadBadge(count) {
    if (unreadBadgeEl) {
      unreadBadgeEl.textContent = count > 99 ? "99+" : String(count);
      unreadBadgeEl.style.display = count > 0 ? "inline-block" : "none";
    }
    document.title = count > 0 ? "(" + (count > 99 ? "99+" : count) + ") " + baseTitle : baseTitle;
  }

  async function showDesktopNotification(message) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    var senderName = "Nouveau message";
    try {
      var { data } = await window.capriSupabase.from("profiles").select("full_name").eq("id", message.sender_id).single();
      if (data && data.full_name) senderName = data.full_name;
    } catch (e) { /* tant pis, on garde le libellé générique */ }
    var n = new Notification(senderName + " — CAPRI Messenger", {
      body: (message.body || "").slice(0, 140),
      tag: "capri-msg-" + message.channel_id,
    });
    n.onclick = function () {
      window.focus();
      if (!/messenger\.html$/.test(window.location.pathname)) window.location.href = "messenger.html";
      n.close();
    };
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

  return { renderSidebar: renderSidebar, toast: toast, refreshUnreadBadge: refreshUnreadBadge };
})();
