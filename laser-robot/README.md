# LASER-ROBOT — Plateforme documentaire d'évaluation présidentielle

Application web privée de CAPRI, appliquant la même charte nationale (22
domaines / 78 critères) à chaque candidat, sans biais, sans score global,
sans classement, sans recommandation de vote.

Même modèle d'architecture que le portail interne CAPRI (`/portal/`) —
pages statiques + Supabase (Postgres + Auth + Row Level Security) — mais
sur un **projet Supabase totalement indépendant**. Aucune table partagée,
aucune donnée commune : les informations sur les candidats ne doivent
jamais se trouver dans la même base que les données internes du personnel
CAPRI (pointage, tâches, messagerie…).

**Statut actuel : privé, non public, non déployé sur capri-haiti.org.**
Ce dossier prépare une mise en ligne éventuelle ; il ne la déclenche pas.

## Installation (une fois, ~10 minutes)

1. **Créer un projet Supabase gratuit, dédié à LASER-ROBOT** —
   https://supabase.com → *Start your project* → *New Project*. Ne pas
   réutiliser le projet du portail interne CAPRI.
2. **Exécuter le schéma** — Supabase → *SQL Editor* → coller le contenu de
   `schema.sql` → *Run*. (Peut être relancé sans risque, tout est en
   `IF NOT EXISTS`.)
3. **Charger la charte nationale** — toujours dans le *SQL Editor*, coller
   le contenu de `seed_domains_criteria.sql` → *Run*. Les 22 domaines et 78
   critères apparaissent dans les tables `domains` / `criteria`. (Généré
   automatiquement depuis `charte_nationale.xlsx` — voir le script, pas à
   éditer à la main ; relancer sans risque si la charte évolue.)
4. **Configurer les clés** — Supabase → *Settings → API* → copier *Project
   URL* et *anon public key* dans `assets/config.js` :
   ```js
   window.LASER_SUPABASE_URL = "https://xxxxx.supabase.co";
   window.LASER_SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   Ce sont des clés **publiques**, faites pour être exposées côté client —
   la sécurité réelle vient des politiques RLS de `schema.sql`, pas du
   secret de ces valeurs.
5. **Créer le premier compte administrateur** — ouvrir `index.html`, onglet
   *Créer un compte*. Le compte est créé avec le rôle `pending` (aucun
   accès). Aller ensuite dans Supabase → *Table Editor* → `profiles` →
   modifier la ligne → mettre `role` à `admin`. Tous les comptes suivants
   s'approuvent de la même façon — volontaire : personne ne peut
   s'auto-attribuer un accès à des dossiers de candidats.
6. **Servir les fichiers** — n'importe quel serveur de fichiers statiques
   suffit en local (ex. `npx serve .` depuis ce dossier, ou l'extension
   Live Server). Rien à compiler, rien à installer côté serveur.

## Rôles

| Rôle | Peut lire | Peut créer/modifier | Gère les comptes |
|---|---|---|---|
| `pending` | rien | rien | non |
| `lecteur` | candidats, grille, preuves, audit | non | non |
| `reviewer` | tout | candidats, évaluations, preuves | non |
| `admin` | tout | tout | oui (via Table Editor Supabase) |

`lecteur` existe dès maintenant pour préparer un futur accès public, **sans
rendre le site public** : il reste derrière une connexion, comme les
autres rôles.

## Ce qui est construit

- **Registre des candidats** (`dashboard.html`) — création (réviseur/admin),
  liste pour tous les rôles approuvés.
- **Fiche candidat** (`candidate.html`) — identité, grille des 78 critères
  groupée par domaine avec formulaire d'évaluation en ligne, registre des
  éléments documentaires avec ajout de preuve et réponse du candidat.
- **Scanner** (`scan.html`) — visualisation animée des 78 critères. Affiche
  **uniquement** des états déjà posés par un réviseur humain : vert =
  uniquement `Vérifié`, rouge = uniquement `Allégation grave documentée`, tout le reste
  (y compris l'absence d'évaluation) = gris neutre. Ne calcule jamais de
  verdict.
- **Mise à jour groupée** (`bulk.html`) — saisir ou corriger les 78
  évaluations d'un candidat en une fois (texte, un critère par ligne,
  `ID|STATUT|NOTE|ANALYSE`), pré-rempli avec l'état actuel.
- **Mon compte** (`account.html`) — changement de mot de passe. Mot de
  passe oublié géré par le flux natif de Supabase Auth (courriel).

## Sécurité (Row Level Security — voir `schema.sql`)

- Un compte créé par auto-inscription reçoit le rôle `pending` (aucun
  accès) tant qu'un administrateur ne lui attribue pas un rôle réel.
- **Personne ne peut s'auto-promouvoir** : un déclencheur serveur
  (`guard_profiles_role_update`) bloque toute tentative de modifier son
  propre rôle ou son propre état actif, même par une requête directe à
  l'API Supabase — vérifié par un test automatisé (voir plus bas).
- `reviewer_id` et `reviewed_at` sur chaque évaluation sont posés par un
  déclencheur serveur à partir de l'identité réelle de la session — jamais
  par une valeur envoyée par le navigateur.
- Les 78 évaluations d'un nouveau candidat sont créées automatiquement par
  un déclencheur (identiques pour tous, sans traitement de faveur).
- Le journal d'audit (`audit_log`) est alimenté par des déclencheurs
  serveur sur chaque création/modification de candidat, évaluation ou
  preuve — un client ne peut pas l'oublier ni le contourner. Seule la
  consultation du scanner (une lecture) est journalisée explicitement par
  la page, avec une politique qui n'autorise qu'un utilisateur à journaliser
  sa propre consultation.
- Les liens de source (`source_url`, `photo_url`) sont contraints en base
  (`http://`/`https://` uniquement) — bloque une source `javascript:...` au
  niveau de la base, pas seulement dans l'interface.
- Aucune suppression n'est permise depuis le client (aucune politique
  `DELETE`) — conservation intégrale des dossiers et du journal.

Ces politiques ont été testées contre un vrai PostgreSQL local (schéma +
RLS + déclencheurs, avec une simulation des 4 rôles) avant d'être livrées
— deux anomalies réelles ont été trouvées et corrigées pendant ces tests
(voir `RAPPORT_REVUE_LASER_ROBOT.md` du dossier de revue initial pour le
détail de la méthode).

## Garanties éditoriales à respecter

- « Non vérifié » et « À documenter » sont des états de travail, pas des
  conclusions.
- Distinguer fait documenté, déclaration, allégation attribuée, sanction
  administrative, enquête en cours, recommandation de poursuite et décision
  judiciaire définitive (liste contrôlée en base, `evidence_type`).
- Donner au candidat la possibilité de répondre et conserver sa réponse
  sans l'effacer du dossier.
- Toute note est facultative, attribuée à un évaluateur humain identifié
  par le serveur, et doit être justifiée par des éléments cités. Aucun
  classement, aucune recommandation de vote.

## Structure

- `index.html`, `reset-password.html` : connexion / inscription / mot de
  passe oublié.
- `dashboard.html` : registre des candidats.
- `candidate.html?id=…` : fiche candidat, grille des 78 critères, preuves.
- `scan.html?id=…` : scanner.
- `bulk.html?id=…` : mise à jour groupée.
- `account.html` : changement de mot de passe.
- `assets/` : configuration Supabase, client, authentification, barre
  latérale, styles.
- `schema.sql` : schéma complet + sécurité (RLS).
- `seed_domains_criteria.sql` : les 22 domaines et 78 critères, générés
  depuis `charte_nationale.xlsx`.

## Avant toute publication sur capri-haiti.org

- Décision explicite du porteur de projet requise (voir mandat initial,
  `REVUE_CLAUDE.md`).
- Vérifier les quotas d'envoi de courriel du plan Supabase utilisé
  (confirmation d'inscription, réinitialisation de mot de passe).
- Revalider les politiques RLS après tout ajout de table ou de colonne —
  une table créée sans politique explicite est inaccessible par défaut
  (RLS activée), ce qui est le comportement sûr, mais à vérifier au cas par
  cas.
- Le dossier des 78 critères déjà rédigé pour un candidat réel peut être
  importé directement via `bulk.html`, une fois le compte réviseur créé.
