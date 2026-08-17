/*
 * Service worker minimal du portail CAPRI — permet l'installation comme app
 * (PWA) sur le téléphone. Stratégie « réseau d'abord » : la version en ligne
 * est toujours préférée tant qu'il y a une connexion (jamais de JS périmé
 * après une mise à jour) ; le cache ne sert qu'en secours hors-ligne.
 */
var CACHE_NAME = "capri-portal-v1";
var PRECACHE = [
  "index.html",
  "desk.html",
  "pointage.html",
  "tasks.html",
  "meet.html",
  "assets/portal.css",
  "assets/icons/icon-192.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .catch(function () { /* précache best-effort, ne bloque jamais l'install */ })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // laisse passer Supabase, Jitsi, CDN tels quels

  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return res;
      })
      .catch(function () { return caches.match(event.request); })
  );
});
