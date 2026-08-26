// CAPRI Courrier — réception des événements Resend (livré / ouvert / rejeté)
// pour mettre à jour le suivi d'accusé de réception dans courrier_recipients.
//
// Déploiement : supabase functions deploy resend-webhook --no-verify-jwt
// (--no-verify-jwt est nécessaire : cet endpoint est appelé par Resend, pas
// par un utilisateur du portail, donc il ne porte pas de jeton Supabase —
// c'est la signature Svix ci-dessous qui authentifie l'appelant à la place.)
//
// Une fois déployée, configurer l'URL de la fonction comme endpoint de
// webhook dans le tableau de bord Resend (Webhooks → Add Endpoint), pour les
// événements : email.delivered, email.opened, email.bounced,
// email.delivery_delayed. Resend fournit alors un secret de signature
// (commence par "whsec_") à enregistrer comme secret RESEND_WEBHOOK_SECRET.
//
// Secrets requis : RESEND_WEBHOOK_SECRET (recommandé — sans lui, les
// événements sont acceptés sans vérification de signature).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function verifySvixSignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const secretBytes = base64ToBytes(secret.startsWith("whsec_") ? secret.slice(6) : secret);
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = bytesToBase64(new Uint8Array(sigBuffer));

  const candidates = svixSignature.split(" ").map((s) => s.split(",")[1]).filter(Boolean);
  return candidates.includes(expected);
}

Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

    if (webhookSecret) {
      const valid = await verifySvixSignature(req, rawBody, webhookSecret);
      if (!valid) return new Response("Signature invalide.", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type: string = event?.type || "";
    const messageId: string | undefined = event?.data?.email_id;
    if (!messageId) return new Response("ok");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return new Response("Configuration serveur incomplète.", { status: 500 });
    const admin = createClient(supabaseUrl, serviceRoleKey);

    let patch: Record<string, unknown> | null = null;
    if (type === "email.delivered") patch = { status: "livre", delivered_at: new Date().toISOString() };
    else if (type === "email.opened") patch = { status: "ouvert", opened_at: new Date().toISOString() };
    else if (type === "email.bounced" || type === "email.delivery_delayed") patch = { status: "echec" };

    if (patch) {
      await admin.from("courrier_recipients").update(patch).eq("resend_message_id", messageId);
    }

    return new Response("ok");
  } catch (e) {
    return new Response("Erreur : " + (e instanceof Error ? e.message : "inconnue"), { status: 500 });
  }
});
