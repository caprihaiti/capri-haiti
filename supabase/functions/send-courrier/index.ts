// CAPRI Courrier — envoi d'un courrier officiel par courriel via Resend.
//
// Cette fonction tourne côté serveur (Supabase Edge Function) précisément
// parce que la clé API Resend ne doit jamais atteindre le navigateur : le
// portail (portal/courrier.html) l'appelle avec le jeton de session de la
// personne connectée, et c'est ici — pas côté client — qu'on vérifie que
// cette personne est bien Direction ou Conseil d'administration avant
// d'envoyer quoi que ce soit.
//
// Déploiement : supabase functions deploy send-courrier
// Secrets requis (Supabase → Project Settings → Edge Functions → Secrets) :
//   RESEND_API_KEY         — clé API du compte Resend
//   COURRIER_FROM_ADDRESS  — optionnel, ex. "CAPRI <courrier@capri-haiti.org>"
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà fournis automatiquement
// à toute Edge Function par Supabase — rien à configurer pour ceux-là.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Méthode non supportée." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentification requise." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("COURRIER_FROM_ADDRESS") || "CAPRI <courrier@capri-haiti.org>";
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Configuration serveur incomplète." }, 500);
    if (!resendApiKey) return json({ error: "RESEND_API_KEY n'est pas configuré sur cette fonction." }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Identifie l'appelant à partir de son jeton, pour vérifier son rôle —
    // ne jamais se fier à un rôle envoyé par le client lui-même.
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
    if (userErr || !userData?.user) return json({ error: "Session invalide ou expirée." }, 401);

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", userData.user.id)
      .single();
    if (profileErr || !profile) return json({ error: "Profil introuvable." }, 403);
    if (!["direction", "conseil_administration"].includes(profile.role)) {
      return json({ error: "Seuls Direction et le Conseil d'administration peuvent envoyer un courrier officiel." }, 403);
    }

    const payload = await req.json();
    const subject = String(payload.subject || "").trim();
    const body = String(payload.body || "").trim();
    const recipients: Array<{ email?: string; user_id?: string }> = Array.isArray(payload.recipients) ? payload.recipients : [];
    if (!subject || !body) return json({ error: "Objet et message sont obligatoires." }, 400);
    if (!recipients.length) return json({ error: "Au moins un(e) destinataire est requis(e)." }, 400);

    const { data: courrier, error: cErr } = await admin
      .from("courrier_messages")
      .insert({ subject, body, sender_id: profile.id })
      .select()
      .single();
    if (cErr) return json({ error: cErr.message }, 500);

    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const email = String(r.email || "").trim();
      if (!email) continue;

      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + resendApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [email],
            subject,
            html: body,
            tags: [{ name: "courrier_id", value: courrier.id }],
          }),
        });
        const result = await resp.json().catch(() => ({}));

        if (resp.ok && result.id) {
          await admin.from("courrier_recipients").insert({
            courrier_id: courrier.id,
            user_id: r.user_id || null,
            email,
            resend_message_id: result.id,
            status: "envoye",
            sent_at: new Date().toISOString(),
          });
          sent++;
        } else {
          await admin.from("courrier_recipients").insert({
            courrier_id: courrier.id,
            user_id: r.user_id || null,
            email,
            status: "echec",
          });
          failed++;
        }
      } catch (_e) {
        await admin.from("courrier_recipients").insert({
          courrier_id: courrier.id,
          user_id: r.user_id || null,
          email,
          status: "echec",
        });
        failed++;
      }
    }

    return json({ courrier_id: courrier.id, sent, failed });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inattendue." }, 500);
  }
});
