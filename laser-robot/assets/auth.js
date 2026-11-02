/*
 * LASER ID — sessions et rôles de LASER-ROBOT.
 * Toute page protégée commence par :
 *
 *   LaserAuth.requireSession().then(({ user, profile }) => { ... });
 *
 * Si personne n'est connecté, retour à index.html. Si le compte est encore
 * 'pending' (aucun rôle attribué par un administrateur), un écran d'attente
 * s'affiche à la place de l'application.
 */
window.LaserAuth = (function () {
  "use strict";

  var ROLE_LABELS = {
    admin: "Administrateur",
    reviewer: "Réviseur",
    lecteur: "Lecteur",
    pending: "En attente d'approbation"
  };

  function sb() {
    if (!window.laserSupabase) throw new Error("Supabase non initialisé — voir laser-robot/assets/config.js");
    return window.laserSupabase;
  }

  async function getProfile(userId) {
    var res = await sb().from("profiles").select("*").eq("id", userId).single();
    if (res.error) throw res.error;
    return res.data;
  }

  async function requireSession(minRoles) {
    var { data } = await sb().auth.getSession();
    var session = data && data.session;
    if (!session) {
      window.location.href = resolveBasePath("index.html");
      return new Promise(function () {}); // ne résout jamais : on quitte la page
    }
    var profile = await getProfile(session.user.id);
    if (profile.role === "pending") {
      renderPendingScreen(profile);
      return new Promise(function () {});
    }
    if (!profile.active) {
      renderInactiveScreen();
      return new Promise(function () {});
    }
    if (minRoles && minRoles.indexOf(profile.role) === -1) {
      renderForbiddenScreen();
      return new Promise(function () {});
    }
    return { user: session.user, profile: profile };
  }

  function resolveBasePath(page) {
    var path = window.location.pathname;
    var idx = path.indexOf("/laser-robot/");
    var base = idx !== -1 ? path.slice(0, idx + "/laser-robot/".length) : "./";
    return base + page;
  }

  function renderPendingScreen(profile) {
    document.body.innerHTML =
      '<div class="laser-gate"><div class="laser-gate-card">' +
      "<h1>Compte en attente d'approbation</h1>" +
      "<p>Bonjour " + escapeHtml(profile.full_name) + ", votre compte a bien été créé, mais aucun rôle ne vous a encore été attribué.</p>" +
      "<p>Contactez un administrateur de LASER-ROBOT pour activer votre accès.</p>" +
      '<button type="button" onclick="LaserAuth.signOut()">Se déconnecter</button>' +
      "</div></div>";
  }

  function renderInactiveScreen() {
    document.body.innerHTML =
      '<div class="laser-gate"><div class="laser-gate-card">' +
      "<h1>Compte désactivé</h1>" +
      "<p>Cet accès a été désactivé. Contactez un administrateur de LASER-ROBOT.</p>" +
      '<button type="button" onclick="LaserAuth.signOut()">Se déconnecter</button>' +
      "</div></div>";
  }

  function renderForbiddenScreen() {
    document.body.innerHTML =
      '<div class="laser-gate"><div class="laser-gate-card">' +
      "<h1>Accès réservé</h1>" +
      "<p>Votre rôle ne permet pas d'accéder à cette page.</p>" +
      '<a href="dashboard.html">← Retour au tableau de bord</a>' +
      "</div></div>";
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  async function signOut() {
    await sb().auth.signOut();
    window.location.href = resolveBasePath("index.html");
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || role;
  }

  return {
    requireSession: requireSession,
    getProfile: getProfile,
    signOut: signOut,
    roleLabel: roleLabel,
    resolveBasePath: resolveBasePath
  };
})();
