# Système multilingue du site CAPRI

Français (langue par défaut), créole ayisyen (HT) et anglais (EN), actifs
depuis le lancement. Architecture prête pour l'espagnol sans reconstruction
du site.

## Fichiers

```
assets/i18n/fr.json   ← langue par défaut, source de vérité
assets/i18n/ht.json
assets/i18n/en.json
assets/i18n/i18n.js   ← moteur (chargement, application, persistance)
```

Chaque fichier `{lang}.json` a la même forme : `{ "page": { "clé": "texte" } }`.
Les trois fichiers contiennent strictement le même ensemble de clés — c'est
vérifié par le script de génération (voir plus bas) et par les tests.

## Comment ça marche dans `index.html`

Chaque élément traduisible porte un attribut `data-i18n*` :

- `data-i18n="page.clé"` — remplace `el.textContent`. Cas le plus courant.
- `data-i18n-html="page.clé"` — remplace `el.innerHTML`. Réservé aux rares
  éléments dont le contenu français d'origine mélangeait du texte et des
  balises inline (`<em>`, `<b>`, `<br>`) qu'aucune traduction ne pouvait
  ignorer sans perdre du sens (ex. le titre d'accueil, les encarts du
  Catalogue). Le contenu vient uniquement des fichiers de traduction CAPRI,
  jamais d'une saisie visiteur.
- `data-i18n-placeholder`, `data-i18n-aria-label`, `data-i18n-content` —
  mêmes principes pour les attributs `placeholder`, `aria-label` et le
  `content` de la balise meta description.

Le HTML garde le texte français **en clair** comme contenu par défaut (donc
la page reste correcte même si `i18n.js` ne se charge pas) ; le script
remplace ce contenu une fois la langue déterminée et les traductions
chargées.

Certains fragments de texte français n'étaient rattachés à aucune balise
propre (ex. « — autorité de tutelle... » juste après un lien, dans la
rubrique Coopération). Ils ont été entourés d'un `<span data-i18n="...">`
ajouté uniquement à cette fin — le lien voisin garde sa propre clé
indépendante.

## Sélecteur de langue

Un seul élément, `#langSwitch` (3 boutons `FR` / `HT` / `EN`), placé comme
dernier enfant de `<nav id="nav">` — le même `<nav>` qui sert à la fois de
barre de navigation desktop et de menu plein écran mobile (juste restylé par
media query). Il n'y a donc qu'une seule instance dans le DOM : pas de
duplication, pas de bouton qui apparaît deux fois, rien qui recouvre le
contenu en mobile.

## Détection de la langue initiale

Dans l'ordre : `localStorage` (`capri_lang`) → paramètre d'URL `?lang=` →
`navigator.language` du visiteur → français par défaut.

Après un choix (clic sur un bouton), la langue est mémorisée dans
`localStorage`, `<html lang>` est mis à jour, et l'URL reçoit `?lang=xx`
(sans recharger la page ni casser le bouton retour) — sauf pour le français,
qui reste l'URL « propre » sans paramètre.

## SEO

`hreflang` déclarés statiquement dans `<head>` pour `fr` (défaut), `ht`,
`en` et `x-default`. Le `<title>` et la meta description changent avec la
langue active.

## Document institutionnel (PDF)

La présentation publique de CAPRI reste en français pour cette première
phase. Quand la langue active n'est pas le français, une note discrète
(`#pdfLangNote`, clé `about.b02`) apparaît sous le bouton pour l'indiquer
clairement, dans la langue active.

## Claire Heureuse

Le sélecteur de langue du site et Claire sont **indépendants** : Claire
détecte la langue de chaque question posée (voir `assets/claire/`) et
répond dans cette langue-là, quelle que soit la langue affichée sur le
reste du site à ce moment. Les textes fixes de l'interface de Claire
(message d'accueil, boutons rapides, note) suivent en revanche le
sélecteur de langue du site, comme le reste de la page.

## Ajouter l'espagnol (ou toute autre langue) plus tard

1. Créer `assets/i18n/es.json` avec exactement les mêmes clés que
   `fr.json` (toutes les traductions).
2. Ajouter `"es"` au tableau `SUPPORTED_LANGS` dans `i18n.js`.
3. Ajouter un bouton `<button class="lang-btn" data-lang="es">ES</button>`
   dans `#langSwitch`.
4. Ajouter la balise `<link rel="alternate" hreflang="es" ...>` dans
   `<head>` (déjà présente en commentaire, prête à décommenter).

Aucune autre modification n'est nécessaire — ni de `index.html` au-delà de
ces deux petits ajouts, ni de reconstruction du site.

## Enrichir une traduction existante

Modifier directement la valeur dans `fr.json` / `ht.json` / `en.json`, aux
mêmes clés dans les trois fichiers. Aucune modification de `index.html` ni
de `i18n.js` n'est nécessaire pour changer un texte déjà couvert.

## Limite connue

Les clés sont générées automatiquement (`page.001`, `page.002`, …) plutôt
que nommées (`nav.home`) : cela a permis de couvrir tout le site de façon
fiable et vérifiable (voir Tests), au prix d'une lisibilité un peu moindre
pour un humain qui ouvrirait `fr.json` sans contexte. Le texte français —
qui est la clé de lecture naturelle — reste toutefois la valeur associée à
chaque clé, ce qui rend le fichier consultable malgré tout.

## Tests

`node assets/i18n/tests/test.js` (voir ce dossier) — charge la page réelle
dans un DOM simulé (jsdom), applique i18n.js tel qu'il tourne dans un
navigateur, et vérifie : langue française par défaut, application correcte
de chaque type de traduction (texte, HTML, attributs), persistance
`localStorage`, synchronisation de l'URL, mise à jour du titre et de la
meta description, indépendance de Claire, et retour au français.
