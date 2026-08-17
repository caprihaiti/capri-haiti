/*
 * Enregistre le service worker pour rendre le portail installable comme app
 * sur le téléphone (Android : menu ⋮ → « Installer l'application » ;
 * iOS Safari : Partager → « Sur l'écran d'accueil »).
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* silencieux : l'app marche sans */ });
  });
}
