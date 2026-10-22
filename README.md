# STRATE α 0.2 — Le monde devient vivant

**Jouer : https://zhugg.github.io/SortieANY/**

Un clicker sandbox biologique en pixel art, dans une palette ivoire, mauve, prune, menthe et ambre. La version 0.2 refond le moteur et la progression ; elle commence une nouvelle partie. L’ancienne sauvegarde α 0.1 reste exportable dans les options, sans importer ses acquis.

## Six strates, six architectures

1. **Le berceau** : bassins ouverts, roche sauge, lumière et photosynthèse.
2. **Les jardins inversés** : racines suspendues, voûtes et teintes mauves.
3. **La faille bleue** : colonnes verticales, ardoise et courants.
4. **La mémoire des sols** : terrasses sédimentaires ocres et matière organique.
5. **Les cathédrales** : géodes, arches et cristaux violets.
6. **Le cœur du monde** : cheminées cuivrées, chaleur et gaz.

## Jouer et évoluer

- Cliquer dans le monde ou sur **Stimuler** produit de l’énergie et accélère la branche sélectionnée à proximité.
- Les adaptations sont propres à chaque lignée et visibles sur ses cellules : membranes, flagelles, segments, glandes, pigments et organes pulsants. Les paliers 1, 3 et 5 changent l’anatomie ; un aperçu avant/après accompagne les achats.
- Les divisions découvrent des mutations. Stabilisez-les pour ouvrir d’autres branches ; deux mutations stabilisées donnent accès à l’hybridation de traits héritables.
- **Oxygéner** libère des bulles après Chloroplastes niveau 1 ; **Dissoudre** ouvre les roches après Glandes sécrétrices niveau 1 ; **Tisser** forme des biofilms après Adhésion niveau 1. Les capacités exigent proximité, ressources et récupération.
- Les premiers **Filtrants** deviennent disponibles à 30 minutes de simulation avec Adhésion niveau 2 ; les **Foreurs** à 35 minutes avec Glandes niveau 2 ; les **Tisseurs** à 40 minutes avec Adhésion niveau 2. Un œuf éclot après 60 secondes, puis grandit jusqu’au stade adulte. Les adultes disposent d’une capacité spécifique dans l’inspecteur.
- Brouteurs et chasseurs sauvages se nourrissent, se déplacent, se reproduisent et retournent au milieu à leur mort.

**Commandes :** molette ou flèches pour descendre, glisser pour déplacer la vue, Maj + molette pour zoomer, Alt + clic pour inspecter, P pour la pause, Espace pour stimuler, 1/2/3 pour les biocapacités, Échap pour annuler leur ciblage. L’atlas et la minicarte déplacent directement la vue.

## Physique et biologie

Le terrain mesure 256 × 1 536 unités, sur une grille rocheuse de 128 × 768. L’eau et les gaz utilisent une grille de 32 × 192 dont les passages tiennent compte des faces rocheuses, même lorsqu’une paroi est plus fine que cette grille.

L’eau descend, se répartit latéralement, remplit les bassins et transporte nutriments, oxygène dissous, carbone, déchets et chaleur. Les transferts conservent les quantités. Les sources, les échanges avec l’atmosphère et les réactions biologiques sont explicites. Les gaz comprennent O₂, CO₂, gaz anaérobies et composant inerte. Des poches remontent, déplacent l’eau, se dissolvent et s’accumulent sous les plafonds. Les biofilms freinent les échanges ; les sécrétions des foreurs modifient réellement le terrain. Le modèle reste une fiction biologique et une approximation de fluides adaptée au jeu.

Les cellules cherchent de la nourriture, évitent les prédateurs, adhèrent et partagent leurs réserves selon leurs adaptations. Les organismes possèdent santé, réserves, habitat, génération et stades œuf/juvénile/adulte/cadavre. Une extinction de la lignée relance des spores sans retirer les améliorations acquises dans cette partie.

## Son et assets Fal

Trois planches bitmap ont été générées avec `fal-ai/flux-2/klein/9b`, puis détourées, réduites et harmonisées dans la palette du jeu. Huit effets de 1,5 s et une ambiance bouclable de 20 s proviennent de `fal-ai/elevenlabs/sound-effects/v2`. Les assets sont servis par GitHub Pages, sans appel à Fal pendant le jeu.

Le plafond autorisé est **2 €**, essais compris. Au tarif vérifié lors de la génération : 3 × 1,048576 mégapixels × 0,006 USD, plus 32 secondes × 0,002 USD, soit **0,082874368 USD estimés**. La conversion de référence de la BCE du 21 octobre 2026 (1 EUR = 1,1234 USD) donne environ **0,074 €**, hors éventuels frais de conversion. Aucune génération supplémentaire ni reprise facturée n’a été lancée. Il s’agit d’une estimation tarifaire, pas d’un relevé de facturation. [Référence BCE](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.eu.html).

Les modèles, prompts et identifiants de génération figurent dans `assets/provenance.json`. La validation locale constate des atlas RGBA de 288 × 72 et des MP3 stéréo à 44,1 kHz (1,515 s et 20,036 s avec padding d’encodage). Volume général, effets, ambiance et sourdine sont réglables. Le son commence après une interaction ; quatre effets simultanés au maximum.

## Sauvegarde et développement

La partie α 0.2 utilise IndexedDB. Export/import JSON complets incluent terrain modifié, eau, gaz, biofilms, organismes et génotypes. Les gains hors ligne utilisent le dernier rendement sauvegardé, sur 24 heures maximum ; l’écologie et les déblocages chronologiques restent en pause pendant l’absence.

Le projet local sert `dist/`. Dans GitHub Pages, son contenu est publié à la racine du dépôt. Aucune installation de dépendance n’est nécessaire.

```sh
npm start
npm run check
npm test
node tests/benchmark.mjs
```

Le calcul tourne dans un Web Worker : horloge du monde 12 Hz, fluides 4 Hz, cellules réparties en six cohortes à 2 Hz avec compensation du temps, organismes 2 Hz. Le rendu vise 30 images/s et ne dessine que les éléments visibles. Plafonds : 20 000 cellules et 128 organismes. Les vitesses ×2/×4 demandent davantage de calcul et peuvent ralentir sur une machine limitée.

Les 18 tests couvrent architectures, déterminisme, transferts conservatifs, parois, gaz, biofilms, excavation, coûts et récupération des capacités, achats propres aux lignées, multicellularité, croissance, reproduction, prédation, décomposition, hérédité, extinction, import/export et absence protégée.

Mesure locale après chauffe, population initiale de 10 000 cellules et 128 organismes : 83 ms de calcul moyen, 73 ms médian et 199 ms au 95e percentile. Ces mesures dépendent de la machine et de sa charge ; ce ne sont pas une garantie de cadence. Les pics de calcul sont isolés du rendu.
