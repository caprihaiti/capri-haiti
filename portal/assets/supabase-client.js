/*
 * Initialise le client Supabase partagé par tout l'écosystème CAPRI.
 * Dépend de config.js (window.CAPRI_SUPABASE_URL / CAPRI_SUPABASE_ANON_KEY)
 * et de la librairie Supabase chargée en <script> avant ce fichier.
 */
(function () {
  "use strict";
  if (!window.supabase || !window.supabase.createClient) {
    console.error("CAPRI: la librairie Supabase (supabase-js) n'a pas pu se charger.");
    return;
  }
  if (window.CAPRI_SUPABASE_URL.indexOf("REMPLACER_PAR") === 0) {
    console.warn("CAPRI: config.js n'est pas encore rempli avec vos identifiants Supabase — voir portal/README.md.");
  }
  window.capriSupabase = window.supabase.createClient(
    window.CAPRI_SUPABASE_URL,
    window.CAPRI_SUPABASE_ANON_KEY
  );
})();
