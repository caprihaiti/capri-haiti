/*
 * Position GPS requise pour tout pointage — la validation réelle se fait
 * côté serveur (voir validate_punch_geofence() dans schema.sql), ceci ne
 * fait que demander la position à l'appareil avec des messages clairs.
 */
window.CapriGeo = (function () {
  "use strict";

  function getPosition() {
    return new Promise(function (resolve, reject) {
      if (!("geolocation" in navigator)) {
        reject(new Error("Cet appareil ne permet pas la géolocalisation — le pointage n'est pas possible."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        function (err) {
          var msg = "Impossible d'obtenir votre position.";
          if (err.code === err.PERMISSION_DENIED) msg = "Localisation refusée — autorisez-la pour ce site dans les réglages de votre navigateur pour pouvoir pointer.";
          else if (err.code === err.POSITION_UNAVAILABLE) msg = "Position indisponible — vérifiez que le GPS de l'appareil est activé.";
          else if (err.code === err.TIMEOUT) msg = "La localisation a pris trop de temps — réessayez.";
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  return { getPosition: getPosition };
})();
