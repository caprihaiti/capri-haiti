# PWOTEKSYON 509 — Vue situationnelle Haïti

## Statut

Cadrage d’intégration — version 0.1.

Cette composante adapte à PWOTEKSYON 509 des principes techniques du projet open source [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view), sans importer automatiquement ses données, ses clés, ses modèles ni ses fonctions de suivi de cibles.

Porteur : **CAPRI – Centre d’Appui au Renforcement des Pouvoirs et des Réformes Institutionnelles**.

## Finalité

Fournir aux opérateurs publics habilités une vue géospatiale commune pour :

- suivre les séismes, cyclones, précipitations, incendies et autres risques naturels ;
- visualiser les routes, ponts, ports, aéroports, hôpitaux, abris et infrastructures critiques ;
- agréger les alertes validées de PWOTEKSYON 509 sans afficher de données personnelles ;
- préparer et suivre une réponse d’urgence, une assistance humanitaire ou une protection civile ;
- documenter la source, l’heure de mise à jour et le niveau de confiance de chaque couche.

La vue situationnelle est un outil d’aide à la décision. Elle ne constitue ni une autorisation d’intervention, ni une preuve judiciaire, ni une garantie de sécurité.

## Capacités de la première phase

### Carte et navigation

- globe ou carte 2D/3D centrée sur Haïti ;
- recherche par département, commune, localité ou coordonnées ;
- dessin de zones, itinéraires et périmètres de vigilance ;
- partage d’une vue sans inclure de données nominatives ;
- mode faible débit et affichage mobile.

### Couches publiques prioritaires

- séismes : USGS ou source institutionnelle validée ;
- cyclones et météo : NHC, NOAA ou source officielle validée ;
- incendies : NASA FIRMS, sous réserve des conditions d’utilisation ;
- routes et infrastructures : OpenStreetMap et données publiques haïtiennes validées ;
- alertes DPC et informations publiques des autorités haïtiennes ;
- zones générales d’incident publiées par PWOTEKSYON 509 après validation humaine.

Chaque couche doit afficher : source, date/heure, fraîcheur, couverture, limites connues et conditions de réutilisation.

### Tableau opérateur

- activation et désactivation des couches ;
- filtres par période, territoire, catégorie et statut ;
- journal des consultations et modifications ;
- annotation d’une situation par un opérateur habilité ;
- export d’un rapport agrégé, sans données personnelles par défaut ;
- confirmation humaine avant toute diffusion publique.

## Garde-fous obligatoires

PWOTEKSYON 509 ne doit pas utiliser cette composante pour :

- rechercher une personne nommément ;
- reconnaître un visage, un iris, une plaque ou une démarche ;
- suivre les déplacements d’un individu ;
- classer une personne comme membre présumé d’un groupe armé ;
- publier l’identité, la photographie ou la position précise d’une victime, d’un témoin ou d’un suspect ;
- brancher automatiquement des caméras publiques, des lecteurs de plaques ou des flux privés ;
- déclencher automatiquement une interpellation, une opération coercitive ou une alerte publique.

Les données humanitaires, médicales et de réunification familiale restent séparées des données de sécurité. Les accès sont nominatifs, limités, journalisés et révocables.

## Architecture proposée

1. **Client cartographique PWOTEKSYON 509**  
   Interface web responsive. Le moteur 3D sera choisi après un test comparatif CesiumJS/MapLibre et une vérification des licences, coûts et performances en Haïti.

2. **Passerelle de données**  
   Connecteurs serveur vers les seules sources approuvées. Normalisation des formats, cache, contrôle de fraîcheur et limitation des requêtes.

3. **Registre des sources**  
   Pour chaque source : propriétaire, licence, finalité autorisée, fréquence, attribution, durée de conservation et responsable CAPRI.

4. **Service d’alertes**  
   Sépare les signalements non vérifiés, les incidents en vérification et les avis publics validés.

5. **Audit et sécurité**  
   Authentification renforcée, rôles, journalisation, chiffrement, révocation des accès, sauvegarde et procédure d’incident.

## Réutilisation du projet God's Eye View

Le code amont est publié sous licence MIT. L’avis de copyright et la licence devront être conservés pour toute portion réutilisée. La licence MIT ne couvre pas automatiquement les données, modèles 3D et services tiers : chaque élément doit faire l’objet d’un examen séparé dans le registre des sources.

Règles d’intégration :

- épingler une version ou un commit amont audité ;
- ne pas copier les clés API ou fichiers de configuration ;
- supprimer les jeux de données incompatibles avec un usage institutionnel ;
- conserver les attributions obligatoires ;
- effectuer une revue de sécurité et de dépendances avant déploiement ;
- maintenir les adaptations CAPRI dans un module isolé afin de faciliter les mises à jour.

## Phasage

### Phase 1 — démonstrateur sans données sensibles

- carte centrée sur Haïti ;
- séismes, météo/cyclones, incendies et infrastructures publiques ;
- scénarios fictifs PWOTEKSYON 509 ;
- filtres, légende, source et fraîcheur ;
- tests mobile, ordinateur et faible débit.

### Phase 2 — pilote institutionnel

Sous réserve d’un accord écrit avec les institutions concernées :

- comptes opérateurs et rôles ;
- alertes DPC et incidents validés ;
- journal d’audit ;
- tableau de coordination ;
- protocole de publication et de retrait.

### Phase 3 — production

Après évaluation juridique, protection des données, cybersécurité, tests indépendants et validation institutionnelle :

- hébergement durci ;
- supervision ;
- plan de continuité ;
- engagements de service ;
- formation et support.

## Décisions requises avant développement

- institution responsable et responsables de traitement ;
- données et sources autorisées ;
- moteur cartographique et budget des services ;
- règles de validation des alertes ;
- politique d’accès, conservation, correction et suppression ;
- environnement d’hébergement ;
- protocole de coopération CAPRI–institutions.

## Critères d’acceptation du démonstrateur

- aucune donnée personnelle ou flux privé ;
- toutes les couches portent une source et une date ;
- les scénarios fictifs sont visiblement identifiés ;
- aucune fonction de recherche ou de suivi d’individu ;
- fonctionnement sur mobile et ordinateur ;
- comportement utilisable en connexion limitée ;
- journal des dépendances, licences et attributions ;
- revue juridique et sécurité documentée avant tout pilote réel.
