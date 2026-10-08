# Au fil du Rhône

Assistant mobile pour trois cyclistes : Lyon / ViaRhôna vers le nord / Lyon, deux nuits, départ vendredi 13 h. Application statique sans compte ni clé API, publiée dans le dépôt dashboard-badges sur GitHub Pages.

## Fonctions

- Carte Leaflet avec trois GPX officiels France Vélo Tourisme / ViaRhôna récupérés le 8 octobre 2026, inversés vers le nord. Distance calculée par Haversine, demi-tour ajustable et export GPX des trois jours.
- Points d’eau du relevé public Fontaine Eau Potable / OpenStreetMap, filtrés à 2 km à vol d’oiseau du parcours. Fonctionnement, accès et potabilité à vérifier sur place. Relevé intégré si disponible, rafraîchissement Overpass avec repli et mémoire locale.
- Prévisions Open-Meteo, localité sélectionnable, dates du voyage, cache daté et gestion des dates hors prévisions. Pas de valeurs météo fabriquées.
- Gares de sortie, liens vers les recherches SNCF et le site TER : horaires, prix et accès hors parcours à vérifier.
- Notes de bivouac, checklist et assistant pratique déterministe. Les nuits sont des secteurs de recherche, aucun emplacement autorisé n’est prétendu confirmé. Les notes restent dans localStorage sur l’appareil.
- Fiche et GPX mis en cache par service worker. Tuiles de carte et données actualisées demandent une connexion. Aucun téléchargement massif de tuiles.

## Développement

Servir le dossier via un serveur HTTP statique. Aucun build requis. `node prepare.mjs` régénère les données à partir des GPX officiels et d’un éventuel `data/water-raw.json`.

## Sources et licences

- Tracés : https://www.viarhona.com/itineraire ; crédit France Vélo Tourisme / ViaRhôna, sans garantie de déviation ou état du terrain.
- Carte et points d’eau : © OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL). Tuiles selon https://operations.osmfoundation.org/policies/tiles/.
- Leaflet 1.9.4, licence BSD-2-Clause, https://leafletjs.com.
- Prévisions : Open-Meteo, CC BY 4.0, https://open-meteo.com.
- Conditions vélos : SNCF TER Auvergne-Rhône-Alpes, à reconsulter avant le départ.
- Polices : Google Fonts Barlow Condensed et DM Sans avec repli système.

Le déploiement remplace l’ancienne page d’entrée et son service worker en conservant l’historique Git. Le nouveau service worker retire uniquement ses anciens caches et les caches connus de l’ancienne application vmach-badges, sans toucher aux autres applications du domaine.

Le relevé intégré des fontaines provient de https://fontaineeaupotable.fr/wp-json/kosm/v1/markers ; chaque point renvoie à sa fiche source. Attribution Fontaine Eau Potable / OpenStreetMap.
