/*
 * LASER-ROBOT — jeu d'icônes institutionnel (SVG en ligne, trait simple).
 * Remplace les émojis dans la navigation et les actions principales : rendu
 * identique sur tous les systèmes, sobre, cohérent avec l'identité
 * « plateforme institutionnelle de référence » plutôt qu'applicative/ludique.
 */
window.LaserIcons = (function () {
  "use strict";

  var PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5"/>',
    folder: '<path d="M3 7a1 1 0 0 1 1-1h4.3a1 1 0 0 1 .8.4l1.2 1.6H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M4 16v3a1 1 0 0 0 1 1h3M20 8V5a1 1 0 0 0-1-1h-3M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M4 12h16"/><circle cx="12" cy="12" r="3.2"/>',
    compare: '<path d="M8 3v18M16 3v18"/><path d="M4 8h4M4 16h4M16 8h4M16 16h4"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
    report: '<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M9 12.5h6M9 16h6M9 9h3"/>',
    user: '<circle cx="12" cy="8" r="3.3"/><path d="M5.5 20.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m19 19-4.3-4.3"/>',
    upload: '<path d="M12 15.5V5M8 9l4-4 4 4"/><path d="M5 16.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5"/>',
    volume: '<path d="M4 9.5h3.2L12 6v12l-4.8-3.5H4z"/><path d="M16.2 9a4 4 0 0 1 0 6"/>',
    mute: '<path d="M4 9.5h3.2L12 6v12l-4.8-3.5H4z"/><path d="m16 9 4 6M20 9l-4 6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.9M6.5 7.6A16.4 16.4 0 0 0 2.5 12S6 18.5 12 18.5a9.9 9.9 0 0 0 3.1-.5"/><path d="M9.5 12a2.6 2.6 0 0 0 3.7 2.3"/>',
    check: '<path d="M4 12.5 9.5 18 20 6"/>',
    warning: '<path d="M12 3.5 21.5 20h-19Z"/><path d="M12 9.5v4.2"/><circle cx="12" cy="16.7" r="0.6" fill="currentColor" stroke="none"/>',
    close: '<path d="M5 5l14 14M19 5 5 19"/>',
    menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
    print: '<path d="M6 8.5V4h12v4.5"/><path d="M6 17.5H4.8A1.8 1.8 0 0 1 3 15.7v-4.4A1.8 1.8 0 0 1 4.8 9.5h14.4A1.8 1.8 0 0 1 21 11.3v4.4a1.8 1.8 0 0 1-1.8 1.8H18"/><path d="M6 14h12v6.5H6z"/>',
    shield: '<path d="M12 3.5 19 6v6c0 5-3.2 7.7-7 8.5-3.8-.8-7-3.5-7-8.5V6Z"/><path d="m9 12 2.3 2.3L15.5 10"/>'
  };

  function svg(name, size) {
    var body = PATHS[name] || PATHS.warning;
    var s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  return { svg: svg };
})();
