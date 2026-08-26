# CAPRI Digital Ecosystem — portail interne

Portail réservé au personnel CAPRI (pas le site public `caprihaiti.github.io/capri-haiti`,
qui reste séparé). Une seule identité (**CAPRI ID**) pour l'ensemble des
modules, sur une seule base de données relationnelle — c'est ce qui permet
à un module futur comme **CAPRI Institutional Pulse** de croiser les
données de plusieurs modules sans que rien n'ait besoin d'être reconstruit.

## Installation (une fois, ~5 minutes)

1. **Créer un projet Supabase gratuit** — https://supabase.com → *Start your
   project* → *New Project* (région conseillée : East US, la plus proche
   d'Haïti).
2. **Exécuter le schéma** — Supabase → *SQL Editor* → coller le contenu de
   `schema.sql` → *Run*. (Peut être relancé sans risque, tout est en
   `IF NOT EXISTS`.)
3. **Configurer les clés** — Supabase → *Settings → API* → copier *Project
   URL* et *anon public key* dans `assets/config.js` :
   ```js
   window.CAPRI_SUPABASE_URL = "https://xxxxx.supabase.co";
   window.CAPRI_SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   Ce sont des clés **publiques**, faites pour être exposées côté client —
   la sécurité réelle vient des politiques RLS de `schema.sql`, pas du
   secret de ces valeurs.
4. **Créer le premier compte administrateur** — ouvrir `portal/index.html`,
   onglet *Créer un compte*. Le compte est créé avec le rôle `pending`
   (aucun accès). Aller ensuite dans Supabase → *Table Editor* → `profiles`
   → modifier la ligne → mettre `role` à `direction` ou
   `conseil_administration`. Tous les comptes suivants s'approuvent de la
   même façon — c'est volontaire : personne ne peut s'auto-attribuer un
   rôle sensible.

## Ce qui est construit (Phase 1)

| Module | Page | Ce qu'il fait |
|---|---|---|
| **CAPRI ID** | `index.html` | Connexion / création de compte, rôles |
| **CAPRI Desk** | `desk.html` | Tableau de bord personnel : statut du jour, tâches actives, pointage rapide |
| **Punch/Lunch In-Out** | `pointage.html` | Pointage complet + historique 30 jours + heures calculées |
| **Tasks & Missions** | `tasks.html` | Créer, assigner, suivre une tâche (statut, priorité, progression) |
| **CAPRI Meet** | `meet.html` | Visioconférence intégrée (Jitsi Meet) — salle Conseil, salle Équipe, ou réunion nommée |
| **CAPRI Messenger** | `messenger.html` | Messagerie interne privée — conversations directes ou de groupe, en temps réel (Supabase Realtime) |
| **CAPRI Docs** | `docs.html` | Dépôt de documents internes (Supabase Storage, bucket privé) — visibilité par défaut réservée au Conseil d'administration et à la Direction, ouvrable à toute l'équipe document par document |
| **CAPRI Courrier** | `courrier.html` | Courrier électronique officiel (Direction/CA) — envoi par courriel via Resend, avec suivi de livraison et d'ouverture. Nécessite une configuration Edge Functions séparée, voir plus bas |

**Installer le portail comme app sur le téléphone (PWA)** : ouvrir
`https://capri-haiti.org/portal/` dans Chrome (Android) ou Safari (iPhone) →
menu **⋮ → Installer l'application** (Android) ou **Partager → Sur l'écran
d'accueil** (iOS). L'icône CAPRI apparaît alors sur l'écran d'accueil comme
une vraie app, sans passer par un app store.

## CAPRI Courrier — configuration (Resend + Edge Functions)

CAPRI Courrier envoie de vrais courriels — contrairement au reste du
portail, ça ne peut pas se faire uniquement avec `schema.sql` et
`config.js` : il faut un compte chez un fournisseur d'envoi transactionnel
(**Resend**, choisi pour sa simplicité) et deux petites fonctions serveur
(*Supabase Edge Functions*) qui gardent la clé Resend hors du navigateur.

1. **Créer un compte Resend** — https://resend.com (plan gratuit largement
   suffisant pour le volume de CAPRI).
2. **Vérifier le domaine `capri-haiti.org`** — Resend → *Domains* → *Add
   Domain* → suivre les instructions pour ajouter les enregistrements DNS
   (SPF/DKIM) indiqués, dans le panneau où le domaine est géré (ex.
   Squarespace → Settings → Domains → capri-haiti.org → DNS Settings).
   Sans domaine vérifié, Resend n'autorise pas l'envoi depuis
   `courrier@capri-haiti.org`.
3. **Activer le suivi d'ouverture** — Resend → *Domains* → le domaine →
   activer *Open Tracking* (et *Click Tracking* si souhaité).
4. **Créer une clé API** — Resend → *API Keys* → *Create API Key* (droits
   *Sending access* suffisent).
5. **Installer la CLI Supabase** si ce n'est pas déjà fait, puis se lier au
   projet : `supabase link --project-ref <id-du-projet>` (l'id est dans
   l'URL du tableau de bord Supabase).
6. **Déployer les deux fonctions** :
   ```
   supabase functions deploy send-courrier
   supabase functions deploy resend-webhook --no-verify-jwt
   ```
   (`--no-verify-jwt` est nécessaire pour `resend-webhook` : c'est Resend
   qui l'appelle, pas une personne connectée au portail — la vérification
   d'authenticité se fait par signature Svix à l'intérieur de la fonction.)
7. **Configurer les secrets** — Supabase → *Project Settings → Edge
   Functions → Secrets* :
   - `RESEND_API_KEY` — la clé créée à l'étape 4.
   - `COURRIER_FROM_ADDRESS` — optionnel, ex.
     `CAPRI <courrier@capri-haiti.org>` (sinon cette valeur par défaut est
     utilisée).
   - `RESEND_WEBHOOK_SECRET` — voir étape 8 (fortement recommandé, sinon
     `resend-webhook` accepte les événements sans vérifier qu'ils viennent
     bien de Resend).
8. **Configurer le webhook Resend** — Resend → *Webhooks* → *Add Endpoint* →
   coller l'URL de la fonction déployée (affichée après le déploiement,
   de la forme `https://<projet>.supabase.co/functions/v1/resend-webhook`)
   → cocher les événements `email.delivered`, `email.opened`,
   `email.bounced`, `email.delivery_delayed` → Resend affiche alors un
   secret de signature (`whsec_...`) à copier dans `RESEND_WEBHOOK_SECRET`
   (étape 7).

Une fois ces étapes faites, `courrier.html` (visible dans le menu du
portail pour Direction/CA) envoie réellement les courriels et affiche leur
statut (Envoyé → Livré → Ouvert) au fur et à mesure que Resend notifie le
webhook.

## Ce qui est prévu (schéma déjà en place, interfaces à venir)

`documents` / `document_versions` / `approvals` (**CAPRI Docs** + **CAPRI
Sign** — Projet → En révision → Validé → Adopté → Archivé, avec circuit
d'approbation), `meetings` / `resolutions` (**CAPRI Board** — une
résolution de CA pourra générer automatiquement des tâches via
`tasks.source_type = 'resolution'`), `projects` / `kpis` (**CAPRI
Projects** + **CAPRI Performance** — diagnostic → recommandations → plan
d'action → implémentation → évaluation → suivi, avec baseline/cible/écart
par indicateur), `partners` / `partner_interactions` (**CAPRI Partners**),
`audit_log` (**CAPRI Secure Vault**, alimente aussi **CAPRI Institutional
Pulse**).

**CAPRI Institutional Pulse** : une fois Board, Tasks, Projects et
Performance construits, ce sera des **vues SQL** qui croisent ces tables
par date/statut (Activité → Exécution → Retards → Décisions → Risques →
Performance → Résultats) — pas un 13ᵉ module séparé.

**Claire Heureuse AI** intégrée à l'écosystème (au-delà du chatbot public) :
naturellement la dernière étape, une fois qu'il y a de vraies données
(tâches, réunions, résolutions, documents) sur lesquelles elle peut
répondre selon les droits d'accès de chacun.

## Sécurité

- Row Level Security (RLS) activée sur `profiles`, `time_entries`, `tasks`,
  `task_attachments` dès la Phase 1 — chacun voit son propre travail ;
  `direction` et `conseil_administration` voient plus largement.
- RLS activée sur `channels`, `channel_members`, `messages` (CAPRI
  Messenger) : chacun ne voit et n'écrit que dans les conversations dont il
  est membre — vérifié via une fonction `is_channel_member()` plutôt qu'une
  politique auto-référente sur `channel_members`, plus sûre et plus simple à
  auditer.
- RLS activée sur `documents`, `document_versions`, et sur le bucket de
  stockage `capri-docs` lui-même (`storage.objects`) : par défaut réservés
  à `direction`/`conseil_administration`, avec une bascule `visibility`
  par document pour l'ouvrir à toute l'équipe au cas par cas. Le bucket est
  **privé** — les fichiers ne sont accessibles que via une URL signée à
  courte durée de vie générée après vérification du rôle, jamais par une
  URL publique directe.
- Les autres tables sont créées sans RLS actif tant qu'aucune interface ne
  les utilise réellement — elles seront verrouillées module par module, au
  moment de construire chaque interface, pas avant (une politique d'accès
  écrite sans écran réel pour la tester est une politique non vérifiée).
- Aucune donnée de démonstration : tant que `config.js` n'est pas rempli,
  les pages affichent un avertissement en console et rien ne fonctionne —
  pas de faux contenu qui pourrait passer pour réel.
- **CAPRI Meet** utilise l'infrastructure publique `meet.jit.si` : une salle
  est protégée uniquement par le fait de connaître son nom (pas de compte
  requis côté Jitsi). Pour une réunion sensible (ex. séance du Conseil),
  verrouiller la salle avec un mot de passe une fois entré — icône bouclier
  « Sécurité » dans la barre d'outils — et transmettre ce mot de passe par
  un canal séparé du lien de réunion.

## Prochaines étapes suggérées

1. Remplir `config.js`, exécuter `schema.sql`, créer le premier compte
   administrateur (`direction` ou `conseil_administration`).
2. Inviter 2-3 personnes à créer un compte, leur attribuer un rôle, tester
   Punch/Lunch et Tasks en conditions réelles une semaine.
3. Choisir le prochain module (Docs+Sign, ou Board, ou Meet+Messenger)
   selon ce qui manque le plus au quotidien.
