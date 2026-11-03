/*
 * Initialise le client Supabase de LASER-ROBOT.
 * Dépend de config.js (window.LASER_SUPABASE_URL / LASER_SUPABASE_ANON_KEY)
 * et de la librairie Supabase chargée en <script> avant ce fichier.
 */
(function () {
  "use strict";
  if (!window.supabase || !window.supabase.createClient) {
    console.error("LASER-ROBOT : la librairie Supabase (supabase-js) n'a pas pu se charger.");
    return;
  }
  if (window.LASER_SUPABASE_URL.indexOf("REMPLACER_PAR") === 0) {
    console.warn("LASER-ROBOT : config.js n'est pas encore rempli avec vos identifiants Supabase — voir laser-robot/README.md.");
  }
  window.laserSupabase = window.supabase.createClient(
    window.LASER_SUPABASE_URL,
    window.LASER_SUPABASE_ANON_KEY
  );
})();
