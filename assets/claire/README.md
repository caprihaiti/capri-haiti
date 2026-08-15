# Claire Heureuse — architecture

Claire est un moteur de correspondance mots-clés → réponse, **pas** un modèle
d'IA générative : elle ne peut jamais produire une phrase qu'un humain n'a
pas écrite et validée à l'avance. C'est un choix délibéré, adapté à un site
statique GitHub Pages sans serveur : aucune donnée de visiteur n'est
collectée, aucune clé d'API n'est exposée, et chaque réponse possible peut
être relue avant publication.

## Trois couches séparées

```
index.html (interface)  →  engine.js (compréhension)  →  knowledge-base.js (savoir CAPRI)
```

- **`knowledge-base.js`** — `window.CAPRI_KB`, un tableau d'entrées
  `{ id, keywords: [...], fr: "...", ht: "..." }`. C'est la SEULE source de
  vérité sur ce que Claire "sait". Rien ailleurs ne doit contenir de texte
  informatif sur CAPRI destiné à Claire.
- **`engine.js`** — `window.ClaireEngine.answer(question)`. Ne connaît rien
  sur CAPRI ; sait seulement détecter la langue (français / créole haïtien)
  et choisir l'entrée de `CAPRI_KB` dont les mots-clés correspondent le
  mieux à la question posée.
- **`index.html`** — l'interface (bulle de discussion, bouton, historique).
  `claireReply(question)` y appelle uniquement
  `window.ClaireEngine.answer(question).text`. L'interface n'a plus aucune
  connaissance ni logique linguistique codée en dur.

## Enrichir Claire (le cas le plus fréquent)

Ajouter un sujet = ajouter une entrée à `CAPRI_KB` dans `knowledge-base.js`,
avec des mots-clés (français + créole mélangés, sans accent obligatoire —
`engine.js` normalise avant de comparer) et une réponse `fr` et `ht`
strictement équivalentes. **Ne rien inventer** : chaque réponse doit pouvoir
être retrouvée dans le site public ou le Document-Cadre institutionnel de
CAPRI. Aucune modification de `engine.js` ni de `index.html` n'est
nécessaire pour ce cas.

## Comment Claire répond

1. Elle cherche dans `CAPRI_KB` l'entrée dont les mots-clés correspondent le
   mieux (plus une expression-clé est longue/spécifique, plus elle pèse).
2. Si rien ne correspond mais que le message ressemble à une salutation,
   elle salue et propose ses grands thèmes.
3. Sinon, elle répond honnêtement qu'elle n'a pas d'information fiable sur
   ce point et oriente vers `contact@capri-haiti.org` / le téléphone / la
   page Contact — elle ne complète jamais un trou par une réponse plausible
   mais non vérifiée.

## Langue

`engine.js` détecte français vs créole haïtien à partir de mots-outils dont
l'orthographe diffère entre les deux langues (ex. *kisa/kijan/eske* en
créole, *quels/comment/avec* en français) — pas d'API externe, pas de
dépendance. Par défaut (aucun signal net), Claire répond en français, la
langue par défaut du site.

## Limites connues (honnêtes, pas cachées)

- Correspondance par mots-clés, pas de compréhension du sens : une
  reformulation trop éloignée du vocabulaire de `CAPRI_KB` peut ne rien
  trouver et déclencher la réponse de repli.
- Le message d'accueil initial (avant toute question) reste fixe en
  français dans `index.html`, car la langue du visiteur n'est pas encore
  connue à ce moment.
- Pas de mémoire de conversation : chaque question est traitée
  indépendamment des précédentes.
- Détection de langue par mots-outils : une question très courte sans mot
  outil distinctif (ex. un seul mot) retombe sur le français par défaut.

## Tests

Voir `tests.js` dans ce dossier (exécutable avec `node assets/claire/tests.js`
depuis la racine du dépôt) — vérifie les questions de recette officielles
(français/créole) et confirme que les questions hors base déclenchent bien
la réponse de repli plutôt qu'une réponse inventée.
