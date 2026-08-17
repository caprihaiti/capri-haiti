/*
 * CAPRI ID — sessions et rôles partagés par tous les modules du portail.
 * Toute page protégée du portail commence par :
 *
 *   CapriAuth.requireSession().then(({ user, profile }) => { ... });
 *
 * Si personne n'est connecté, l'utilisateur est renvoyé vers portal/index.html.
 * Si le compte est encore 'pending' (pas de rôle assigné par un
 * administrateur), on affiche un message d'attente plutôt que l'application.
 */
window.CapriAuth = (function () {
  "use strict";

  var ROLE_LABELS = {
    conseil_administration: "Conseil d'administration",
    direction: "Direction",
    employe: "Employé",
    consultant: "Consultant",
    partenaire: "Partenaire",
    invite: "Invité",
    pending: "En attente d'approbation"
  };

  function sb() {
    if (!window.capriSupabase) throw new Error("Supabase non initialisé — voir portal/assets/config.js");
    return window.capriSupabase;
  }

  async function getProfile(userId) {
    var res = await sb().from("profiles").select("*").eq("id", userId).single();
    if (res.error) throw res.error;
    return res.data;
  }

  async function requireSession() {
    var { data } = await sb().auth.getSession();
    var session = data && data.session;
    if (!session) {
      window.location.href = resolvePortalPath("index.html");
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
    return { user: session.user, profile: profile };
  }

  function resolvePortalPath(page) {
    // Permet aux pages du portail de se retrouver entre elles quelle que
    // soit la profondeur du chemin (portal/index.html, portal/desk.html…).
    var path = window.location.pathname;
    var portalIdx = path.indexOf("/portal/");
    var base = portalIdx !== -1 ? path.slice(0, portalIdx + "/portal/".length) : "./";
    return base + page;
  }

  function renderPendingScreen(profile) {
    document.body.innerHTML =
      '<div class="capri-gate"><div class="capri-gate-card">' +
      "<h1>Compte en attente d'approbation</h1>" +
      "<p>Bonjour " + escapeHtml(profile.full_name) + ", votre compte CAPRI ID a bien été créé, mais aucun rôle ne vous a encore été attribué.</p>" +
      "<p>Contactez un administrateur de l'écosystème CAPRI pour activer votre accès.</p>" +
      '<button type="button" onclick="CapriAuth.signOut()">Se déconnecter</button>' +
      "</div></div>";
  }

  function renderInactiveScreen() {
    document.body.innerHTML =
      '<div class="capri-gate"><div class="capri-gate-card">' +
      "<h1>Compte désactivé</h1>" +
      "<p>Cet accès a été désactivé. Contactez un administrateur de l'écosystème CAPRI.</p>" +
      '<button type="button" onclick="CapriAuth.signOut()">Se déconnecter</button>' +
      "</div></div>";
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  async function signOut() {
    await sb().auth.signOut();
    window.location.href = resolvePortalPath("index.html");
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || role;
  }

  return {
    requireSession: requireSession,
    getProfile: getProfile,
    signOut: signOut,
    roleLabel: roleLabel,
    resolvePortalPath: resolvePortalPath
  };
})();
