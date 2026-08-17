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
| **Punch/Lunch In-Out** | `pointage.html` | Pointage géolocalisé + historique 30 jours + heures calculées |
| **Tasks & Missions** | `tasks.html` | Créer, assigner, suivre une tâche (statut, priorité, progression) |
| **CAPRI Meet** | `meet.html` | Visioconférence intégrée (Jitsi Meet) — salle Conseil, salle Équipe, ou réunion nommée |

### Pointage géolocalisé — configurer l'adresse du bureau

Chaque Punch In/Out, pause et « sortie temporaire » exige la position GPS de
l'appareil, **vérifiée côté serveur** (pas seulement dans le navigateur — une
position ne peut pas être falsifiée) contre l'adresse enregistrée dans la
table `office_locations`. Tant que cette adresse n'est pas ajustée, elle
pointe sur un emplacement générique à Port-au-Prince — **à corriger avant
usage réel** :

1. Trouver les coordonnées exactes du bureau : Google Maps → clic droit sur
   le point exact → les deux premiers nombres affichés (ex.
   `18.540123, -72.335456`) sont lat/lng.
2. Supabase → **Table Editor** → table `office_locations` → ouvrir la ligne
   → remplacer `lat`, `lng`, et ajuster `radius_m` (rayon en mètres autour du
   point — 100 à 150 m convient pour un bâtiment de bureau, plus pour un
   grand terrain).
3. Sauvegarder. Effet immédiat, aucun redéploiement nécessaire.

Seuls les comptes `direction` et `conseil_administration` peuvent modifier
cette table (RLS). Plusieurs lieux peuvent être ajoutés plus tard (une ligne
par site) — le système retient toujours le plus proche.

**Installer le portail comme app sur le téléphone (PWA)** : ouvrir
`https://capri-haiti.org/portal/` dans Chrome (Android) ou Safari (iPhone) →
menu **⋮ → Installer l'application** (Android) ou **Partager → Sur l'écran
d'accueil** (iOS). L'icône CAPRI apparaît alors sur l'écran d'accueil comme
une vraie app, sans passer par un app store.

## Ce qui est prévu (schéma déjà en place, interfaces à venir)

`documents` / `document_versions` / `approvals` (**CAPRI Docs** + **CAPRI
Sign** — Projet → En révision → Validé → Adopté → Archivé, avec circuit
d'approbation), `meetings` / `resolutions` (**CAPRI Board** — une
résolution de CA pourra générer automatiquement des tâches via
`tasks.source_type = 'resolution'`), `projects` / `kpis` (**CAPRI
Projects** + **CAPRI Performance** — diagnostic → recommandations → plan
d'action → implémentation → évaluation → suivi, avec baseline/cible/écart
par indicateur), `partners` / `partner_interactions` (**CAPRI Partners**),
`channels` / `messages` (**CAPRI Messenger**, à activer avec Supabase
Realtime), `audit_log` (**CAPRI Secure Vault**, alimente aussi
**CAPRI Institutional Pulse**).

**CAPRI Meet** (construit) : plutôt que reconstruire une visioconférence
(signalisation WebRTC, serveurs TURN/STUN…), intègre **Jitsi Meet** (gratuit,
open-source, infrastructure publique `meet.jit.si`) via son widget
embarquable. Limite à connaître : une salle est protégée uniquement par le
fait de connaître son nom (pas de compte requis côté Jitsi) — pour une
réunion sensible, verrouiller la salle avec un mot de passe une fois entré
(icône bouclier dans la barre d'outils) et transmettre ce mot de passe par
un canal séparé du lien. Une intégration plus poussée (serveur Jitsi
autohébergé, salles permanentes par mandat) reste possible plus tard si le
volume de réunions le justifie.

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
- Les autres tables sont créées sans RLS actif tant qu'aucune interface ne
  les utilise réellement — elles seront verrouillées module par module, au
  moment de construire chaque interface, pas avant (une politique d'accès
  écrite sans écran réel pour la tester est une politique non vérifiée).
- Aucune donnée de démonstration : tant que `config.js` n'est pas rempli,
  les pages affichent un avertissement en console et rien ne fonctionne —
  pas de faux contenu qui pourrait passer pour réel.

## Prochaines étapes suggérées

1. Remplir `config.js`, exécuter `schema.sql`, créer le premier compte
   administrateur (`direction` ou `conseil_administration`).
2. Inviter 2-3 personnes à créer un compte, leur attribuer un rôle, tester
   Punch/Lunch et Tasks en conditions réelles une semaine.
3. Choisir le prochain module (Docs+Sign, ou Board, ou Meet+Messenger)
   selon ce qui manque le plus au quotidien.
