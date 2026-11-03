// LASER-ROBOT — recherche automatique de sources officielles pour un candidat.
//
// Tourne côté serveur (Supabase Edge Function) précisément parce que la clé
// API Anthropic ne doit jamais atteindre le navigateur. Appelée par
// candidate.html avec le jeton de session de la personne connectée —
// n'importe quel compte actif (lecteur compris, pas seulement admin/
// reviewer) peut déclencher une recherche : c'est l'outil public de
// LASER-ROBOT, un citoyen qui consulte un candidat peut lancer la recherche
// lui-même et obtenir directement une fiche documentée.
//
// Principe non négociable (voir REVUE_CLAUDE.md) : chaque élément trouvé est
// enregistré au statut "Non vérifié" — jamais "Vérifié" — exactement comme
// si quelqu'un l'avait ajouté à la main. Un champ d'identité déjà renseigné
// (par une recherche précédente ou une correction d'un réviseur) n'est
// JAMAIS écrasé : seuls les champs encore vides sont complétés. Rien n'est
// jamais inventé : le modèle est instruit de ne rapporter que ce qu'une
// recherche web réelle a trouvé, et de signaler explicitement ce qu'il n'a
// pas pu vérifier. Un réviseur humain reste seul habilité à faire passer un
// critère ou un élément au statut "Vérifié" ou "Contesté".
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
            related_criterion_id: { type: ["string", "null"], description: "L'identifiant exact (ex. « C014 ») du critère de la charte nationale (liste fournie dans le message) qui correspond le plus directement à cet élément. Ne remplir que si la correspondance est claire et spécifique — jamais une supposition approximative. Laisser null si aucun critère ne correspond nettement." },
          },
          required: ["title", "evidence_type", "source_name", "source_url", "publication_date", "summary", "caution", "related_criterion_id"],
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
- Pour le statut d'enregistrement d'une candidature (le candidat est-il officiellement enregistré, encore en lice, contesté ou rejeté), consulte en priorité le site officiel du Conseil Électoral Provisoire (CEP) : www.cephaiti.ht — c'est la source primaire faisant autorité en la matière. Si une information contredit ce que montre cephaiti.ht, signale la contradiction dans "contested_notes" plutôt que de la passer sous silence.
- Chercher uniquement des sources officielles ou primaires : www.cephaiti.ht (Haïti), communiqués de gouvernements (Canada, États-Unis, Haïti), Nations Unies, ULCC, CSCCA, décisions de justice, grands médias réputés en dernier recours.
- Distinguer rigoureusement : fait documenté / déclaration du candidat / allégation attribuée / sanction administrative / enquête en cours / décision judiciaire définitive. Une sanction administrative (gel d'avoirs, interdiction de visa) n'est PAS une condamnation judiciaire — ne jamais les confondre.
- Important et spécifique à Haïti : l'absence de poursuite ou de condamnation judiciaire n'est PAS une preuve d'innocence ou de probité — le système judiciaire haïtien est largement reconnu (rapports ONU, presse, organisations de la société civile) comme sujet à l'impunité, à l'influence politique et à un manque chronique de moyens, y compris pour des dossiers où des preuves documentées existent par ailleurs (rapports CSCCA, ULCC). Quand "not_found" ne rapporte aucune procédure judiciaire, ne JAMAIS formuler cela comme une forme de disculpation ou de "dossier propre" — le présenter strictement comme : aucune procédure judiciaire n'a été trouvée à ce jour par cette recherche, sans que cela ne permette de conclure quoi que ce soit sur la réalité des faits sous-jacents.
- Rester complètement neutre : ne jamais qualifier le candidat de bon, mauvais, compétent ou incompétent. Rapporte des faits sourcés, pas des conclusions.
- Toujours fournir l'URL réelle de la source quand elle existe.
- Pour la photo (photo_url) : ne proposer qu'une URL d'image directe et réelle trouvée via la recherche (Wikimedia Commons, site officiel gouvernemental, agence de presse reconnue). Si le nom du candidat est courant ou si tu n'es pas raisonnablement certain que la photo trouvée représente bien cette personne précise (et pas un homonyme), laisser photo_url à null et l'expliquer dans contested_notes plutôt que de proposer une image incertaine.
- Utilise la recherche web autant que nécessaire avant de répondre.
- Pour chaque élément documentaire (evidence), le message te fournit la liste complète des 78 critères de la charte nationale (répartis en 22 domaines). Indique dans related_criterion_id l'identifiant exact du critère le plus directement concerné, uniquement si le lien est clair et spécifique — jamais par approximation ou pour « remplir » un domaine. S'il n'y a pas de correspondance nette, laisser related_criterion_id à null : un critère non documenté doit rester non documenté plutôt que de recevoir une correspondance forcée.
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
    if (profile.role === "pending" || !["admin", "reviewer", "lecteur"].includes(profile.role)) {
      return json({ error: "Ce compte n'a pas encore accès à l'outil." }, 403);
    }

    const payload = await req.json();
    const candidateId = String(payload.candidate_id || "").trim();
    const fullName = String(payload.full_name || "").trim();
    if (!candidateId || !fullName) return json({ error: "candidate_id et full_name sont requis." }, 400);

    const { data: existingCandidate, error: candErr } = await admin
      .from("candidates")
      .select("id, full_name, birth_date, birthplace, nationality, biography, photo_url")
      .eq("id", candidateId)
      .single();
    if (candErr || !existingCandidate) return json({ error: "Candidat introuvable." }, 404);

    // La recherche n'est lancée qu'une seule fois par candidat — une fois la
    // biographie renseignée, tout le monde (admin, réviseur ou simple
    // lecteur) voit exactement la même fiche déjà documentée, sans relancer
    // l'API à chaque consultation. Seul un réviseur qui modifie la fiche à
    // la main (bouton « Modifier ») peut changer ce qui est affiché.
    if (existingCandidate.biography) {
      return json({ already_researched: true, candidate: existingCandidate });
    }

    // La charte nationale (22 domaines, 78 critères) est le référentiel unique
    // de toute évaluation dans LASER-ROBOT. On la transmet en entier au modèle
    // pour que chaque élément documentaire soit rattaché, quand c'est justifié,
    // à un critère précis — sinon l'automatisation ne ferait que trouver des
    // preuves sans jamais les relier à la grille que le scanner affiche
    // réellement (voir trg_seed_assessments dans schema.sql).
    const { data: criteriaList } = await admin
      .from("criteria")
      .select("id, domain_id, title")
      .order("id");
    const criteriaIds = new Set((criteriaList || []).map((c) => c.id));
    const criteriaPromptText = (criteriaList || [])
      .map((c) => c.id + " (" + c.domain_id + ") — " + c.title)
      .join("\n");

    const userPrompt = `Recherche le candidat présidentiel haïtien suivant : "${fullName}".
Vérifie d'abord son statut d'enregistrement auprès du Conseil Électoral Provisoire sur www.cephaiti.ht (candidature enregistrée, encore en lice, contestée ou rejetée). Cherche ensuite en priorité : sanctions administratives (Canada, États-Unis/OFAC, Union européenne), mentions dans les rapports du comité de sanctions de l'ONU sur Haïti, rapports de l'ULCC ou de la CSCCA (ex. dossier PetroCaribe), décisions de justice, faits biographiques de base (date de naissance, lieu de naissance, fonctions publiques déjà occupées), et une photographie publique fiable de cette personne précise. Signale toute contradiction entre sources.

Voici les 78 critères de la charte nationale (22 domaines), pour relier chaque élément documentaire trouvé au critère exact qu'il concerne via related_criterion_id (uniquement en cas de correspondance claire) :
${criteriaPromptText}`;

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

    const findings = reportBlock.input as {
      identity?: Record<string, unknown>;
      evidence?: Array<Record<string, unknown>>;
      not_found?: string[];
    };

    // Enregistrement automatique : seuls les champs d'identité encore vides
    // sont complétés (on n'écrase jamais une donnée déjà présente, qu'elle
    // vienne d'une recherche précédente ou d'une correction manuelle). La
    // photo n'est appliquée que si l'URL est une image http(s) valide.
    const identity = findings.identity || {};
    const identityUpdate: Record<string, string> = {};
    (["birth_date", "birthplace", "nationality", "biography"] as const).forEach((field) => {
      const value = identity[field];
      if (!existingCandidate[field] && typeof value === "string" && value.trim()) {
        identityUpdate[field] = value.trim();
      }
    });
    const photoUrl = identity.photo_url;
    if (!existingCandidate.photo_url && typeof photoUrl === "string" && /^https?:\/\//.test(photoUrl)) {
      identityUpdate.photo_url = photoUrl;
    }
    if (Object.keys(identityUpdate).length > 0) {
      await admin.from("candidates").update(identityUpdate).eq("id", candidateId);
    }

    // Éléments documentaires : on évite les doublons si la fonction est
    // relancée (par sécurité — en pratique une recherche ne se relance pas
    // une fois la biographie déjà renseignée, voir plus haut).
    const { data: existingEvidence } = await admin
      .from("evidence").select("title").eq("candidate_id", candidateId);
    const existingTitles = new Set((existingEvidence || []).map((e) => (e.title || "").toLowerCase().trim()));
    const evidenceToInsert = (findings.evidence || [])
      .filter((ev) => ev && typeof ev.title === "string" && !existingTitles.has(ev.title.toLowerCase().trim()))
      .map((ev) => {
        const rawCriterionId = ev.related_criterion_id;
        const criterionId = (typeof rawCriterionId === "string" && criteriaIds.has(rawCriterionId)) ? rawCriterionId : null;
        return {
          candidate_id: candidateId,
          criterion_id: criterionId,
          title: ev.title,
          evidence_type: ev.evidence_type,
          source_name: typeof ev.source_name === "string" ? ev.source_name : null,
          source_url: (typeof ev.source_url === "string" && /^https?:\/\//.test(ev.source_url)) ? ev.source_url : null,
          publication_date: typeof ev.publication_date === "string" && ev.publication_date ? ev.publication_date : null,
          summary: typeof ev.summary === "string" ? ev.summary : null,
          verification_status: "Non vérifié",
          created_by: profile.id,
        };
      });
    if (evidenceToInsert.length > 0) {
      await admin.from("evidence").insert(evidenceToInsert);
    }

    // Rattachement automatique à la grille des 78 critères (assessments) :
    // c'est cette table, pas "evidence", que le scanner affiche réellement.
    // Sans cette étape, une recherche peut trouver des preuves solides et le
    // scan continuerait pourtant à montrer 78/78 "À documenter" — exactement
    // le défaut signalé ("li dwe otomatik pou tout kandida yo séprement").
    // Règles conservatrices, non négociables :
    //   - on ne touche jamais un critère déjà sorti de son état par défaut
    //     "À documenter" (une correction manuelle de réviseur prime toujours) ;
    //   - on n'attribue jamais "Vérifié" ni "Contesté" automatiquement — seul
    //     un réviseur humain peut faire passer un critère à ces statuts ;
    //   - le statut choisi reflète uniquement le type d'élément documentaire,
    //     jamais un jugement sur le fond.
    const CONCERNING_EVIDENCE_TYPES = new Set([
      "Allégation attribuée", "Sanction administrative", "Enquête en cours",
      "Recommandation de poursuite", "Décision judiciaire définitive",
    ]);
    const byCriterion = new Map<string, { concerning: boolean; lines: string[] }>();
    evidenceToInsert.forEach((ev) => {
      if (!ev.criterion_id) return;
      const entry = byCriterion.get(ev.criterion_id) || { concerning: false, lines: [] };
      if (CONCERNING_EVIDENCE_TYPES.has(ev.evidence_type as string)) entry.concerning = true;
      if (ev.summary) entry.lines.push("• " + ev.summary + " (source : " + (ev.source_name || "non précisée") + ", " + ev.evidence_type + ").");
      byCriterion.set(ev.criterion_id, entry);
    });

    let assessmentsUpdated = 0;
    for (const [criterionId, entry] of byCriterion.entries()) {
      const status = entry.concerning ? "Allégation grave documentée" : "Documenté";
      const analysis = entry.lines.join("\n") +
        "\n(Rattachement automatique par la recherche assistée — à vérifier par un réviseur humain.)";
      const { data: updatedRows } = await admin
        .from("assessments")
        .update({ status, analysis })
        .eq("candidate_id", candidateId)
        .eq("criterion_id", criterionId)
        .eq("status", "À documenter")
        .select("id");
      assessmentsUpdated += (updatedRows || []).length;
    }

    await admin.from("audit_log").insert({
      actor_id: profile.id, username: null,
      action: "recherche_automatique", entity_type: "candidate", entity_id: candidateId,
      details: "Recherche de sources via research-candidate — " + Object.keys(identityUpdate).length +
        " champ(s) d'identité complété(s), " + evidenceToInsert.length + " élément(s) ajouté(s) (Non vérifié), " +
        assessmentsUpdated + " critère(s) rattaché(s) automatiquement.",
    });

    return json({
      findings,
      saved: {
        identity_fields: Object.keys(identityUpdate),
        evidence_added: evidenceToInsert.length,
        assessments_updated: assessmentsUpdated,
      },
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inattendue." }, 500);
  }
});
