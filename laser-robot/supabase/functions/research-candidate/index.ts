// LASER-ROBOT — recherche automatique de sources officielles pour un candidat.
//
// Tourne côté serveur (Supabase Edge Function) précisément parce que la clé
// API Anthropic ne doit jamais atteindre le navigateur. Appelée par
// candidate.html avec le jeton de session de la personne connectée ; la
// vérification du rôle (admin/reviewer) se fait ICI, pas côté client.
//
// Principe non négociable (voir REVUE_CLAUDE.md) : cette fonction ne
// renvoie que des PROPOSITIONS sourcées, jamais rien d'écrit directement en
// base comme "vérifié". Le client affiche chaque élément avec sa source et
// un bouton d'ajout explicite ; tout reste au statut "Non vérifié" jusqu'à
// ce qu'un réviseur humain lise la source et le confirme — exactement comme
// une preuve ajoutée à la main. Rien n'est jamais inventé : le modèle est
// instruit de ne rapporter que ce qu'une recherche web réelle a trouvé, et
// de signaler explicitement ce qu'il n'a pas pu vérifier.
//
// Déploiement : supabase functions deploy research-candidate
// Secrets requis (Supabase → Project Settings → Edge Functions → Secrets) :
//   ANTHROPIC_API_KEY        — clé API Anthropic (console.anthropic.com)
//   LASER_RESEARCH_MODEL     — optionnel, ex. "claude-sonnet-5-5" (défaut)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà fournis automatiquement
// à toute Edge Function par Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVIDENCE_TYPES = [
  "Document officiel / source primaire", "Programme ou engagement public", "Déclaration du candidat",
  "Fait documenté", "Allégation attribuée", "Sanction administrative", "Enquête en cours",
  "Recommandation de poursuite", "Décision judiciaire définitive",
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const REPORT_TOOL = {
  name: "report_findings",
  description: "Rapporte les résultats de la recherche sur ce candidat, uniquement des éléments trouvés via une recherche web réelle, jamais inventés.",
  input_schema: {
    type: "object",
    properties: {
      identity: {
        type: "object",
        description: "Faits biographiques trouvés. Laisser un champ à null si non trouvé ou si les sources se contredisent.",
        properties: {
          birth_date: { type: ["string", "null"], description: "Format YYYY-MM-DD, ou null si inconnu/contesté." },
          birthplace: { type: ["string", "null"] },
          nationality: { type: ["string", "null"] },
          biography: { type: ["string", "null"], description: "Fonctions publiques déjà occupées, avec dates si connues." },
          photo_url: { type: ["string", "null"], description: "URL directe d'une photographie publique du candidat (ex. Wikimedia Commons, site gouvernemental officiel, agence de presse) — uniquement un lien d'image réel et stable, jamais inventé. Laisser null si aucune source fiable d'image n'est trouvée." },
          photo_source: { type: ["string", "null"], description: "Nom de la source de la photo (ex. 'Wikimedia Commons', 'Présidence d'Haïti')." },
          contested_notes: { type: ["string", "null"], description: "Signale ici toute contradiction entre sources trouvées (ex. lieu de naissance contesté, ou incertitude sur l'identité de la personne sur la photo si le nom est courant)." },
        },
        required: ["birth_date", "birthplace", "nationality", "biography", "photo_url", "photo_source", "contested_notes"],
      },
      evidence: {
        type: "array",
        description: "Chaque élément documentaire trouvé, avec sa source réelle.",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            evidence_type: { type: "string", enum: EVIDENCE_TYPES },
            source_name: { type: "string", description: "Nom de l'organisme ou du média source." },
            source_url: { type: "string", description: "URL réelle de la source, vide si indisponible." },
            publication_date: { type: ["string", "null"], description: "Format YYYY-MM-DD si connu, sinon null." },
            summary: { type: "string", description: "Résumé neutre et factuel, sans qualifier le candidat de bon ou mauvais." },
            caution: { type: ["string", "null"], description: "Précision importante, ex. 'accusation administrative, pas une condamnation judiciaire'." },
          },
          required: ["title", "evidence_type", "source_name", "source_url", "publication_date", "summary", "caution"],
        },
      },
      not_found: {
        type: "array",
        items: { type: "string" },
        description: "Liste courte de ce qui a été cherché mais n'a pas pu être confirmé par une source fiable.",
      },
    },
    required: ["identity", "evidence", "not_found"],
  },
};

const SYSTEM_PROMPT = `Tu assistes un outil citoyen de vérification de candidats présidentiels en Haïti (LASER-ROBOT, projet CAPRI). Règles absolues :
- Ne jamais inventer, deviner ou extrapoler une information. Si une recherche ne confirme rien, dis-le dans "not_found".
- Chercher uniquement des sources officielles ou primaires : communiqués de gouvernements (Canada, États-Unis, Haïti), Nations Unies, ULCC, CSCCA, décisions de justice, grands médias réputés en dernier recours.
- Distinguer rigoureusement : fait documenté / déclaration du candidat / allégation attribuée / sanction administrative / enquête en cours / décision judiciaire définitive. Une sanction administrative (gel d'avoirs, interdiction de visa) n'est PAS une condamnation judiciaire — ne jamais les confondre.
- Rester complètement neutre : ne jamais qualifier le candidat de bon, mauvais, compétent ou incompétent. Rapporte des faits sourcés, pas des conclusions.
- Toujours fournir l'URL réelle de la source quand elle existe.
- Pour la photo (photo_url) : ne proposer qu'une URL d'image directe et réelle trouvée via la recherche (Wikimedia Commons, site officiel gouvernemental, agence de presse reconnue). Si le nom du candidat est courant ou si tu n'es pas raisonnablement certain que la photo trouvée représente bien cette personne précise (et pas un homonyme), laisser photo_url à null et l'expliquer dans contested_notes plutôt que de proposer une image incertaine.
- Utilise la recherche web autant que nécessaire avant de répondre.
- Termine TOUJOURS en appelant l'outil report_findings avec tes résultats structurés.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Méthode non supportée." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentification requise." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const model = Deno.env.get("LASER_RESEARCH_MODEL") || "claude-sonnet-5-5";
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Configuration serveur incomplète." }, 500);
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY n'est pas configuré sur cette fonction." }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Identifie l'appelant à partir de son jeton, pour vérifier son rôle —
    // ne jamais se fier à un rôle envoyé par le client lui-même.
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
    if (userErr || !userData?.user) return json({ error: "Session invalide ou expirée." }, 401);

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, role, active")
      .eq("id", userData.user.id)
      .single();
    if (profileErr || !profile || !profile.active) return json({ error: "Profil introuvable ou inactif." }, 403);
    if (!["admin", "reviewer"].includes(profile.role)) {
      return json({ error: "Seuls admin et reviewer peuvent lancer une recherche." }, 403);
    }

    const payload = await req.json();
    const candidateId = String(payload.candidate_id || "").trim();
    const fullName = String(payload.full_name || "").trim();
    if (!candidateId || !fullName) return json({ error: "candidate_id et full_name sont requis." }, 400);

    const userPrompt = `Recherche le candidat présidentiel haïtien suivant : "${fullName}".
Cherche en priorité : sanctions administratives (Canada, États-Unis/OFAC, Union européenne), mentions dans les rapports du comité de sanctions de l'ONU sur Haïti, rapports de l'ULCC ou de la CSCCA (ex. dossier PetroCaribe), décisions de justice, faits biographiques de base (date de naissance, lieu de naissance, fonctions publiques déjà occupées), et une photographie publique fiable de cette personne précise. Signale toute contradiction entre sources.`;

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        tools: [
          { type: "web_search_20250305", name: "web_search", max_uses: 8 },
          REPORT_TOOL,
        ],
        tool_choice: { type: "auto" },
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => "");
      return json({ error: "Erreur API Anthropic : " + anthropicResp.status + " " + errText.slice(0, 500) }, 502);
    }

    const result = await anthropicResp.json();
    const content: Array<Record<string, unknown>> = Array.isArray(result.content) ? result.content : [];
    const reportBlock = content.find((b) => b.type === "tool_use" && b.name === "report_findings");

    if (!reportBlock) {
      const textBlock = content.find((b) => b.type === "text");
      return json({
        error: "Le modèle n'a pas produit de résultat structuré.",
        raw_text: textBlock ? textBlock.text : null,
      }, 502);
    }

    await admin.from("audit_log").insert({
      actor_id: profile.id, username: null,
      action: "recherche_automatique", entity_type: "candidate", entity_id: candidateId,
      details: "Recherche de sources via research-candidate",
    });

    return json({ findings: reportBlock.input });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inattendue." }, 500);
  }
});
