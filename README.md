# STRATE

Un jeu incremental de cellules en pixel art, dans une palette ivoire, mauve, prune, menthe et ambre.

## Jouer

GitHub Pages : https://zhugg.github.io/SortieANY/

- Cliquez dans le monde ou sur **Stimuler** pour produire de l’énergie et accélérer votre colonie.
- Achetez les améliorations : impulsion, métabolisme, division, automatisation, membrane et recherche.
- Utilisez la molette pour descendre, Maj + molette pour zoomer, ou faites glisser le terrain. La minicarte et les six strates sont aussi cliquables.
- **Alt + clic** inspecte une cellule proche. Les vues Nutriments, Oxygène et Chaleur révèlent le milieu.
- Les divisions découvrent sept mutations. Stabilisez-les pour débloquer de nouvelles branches ; deux mutations stabilisées ouvrent l’éditeur génétique.
- **Implanter** crée une colonie à la position sélectionnée, dans la limite de profondeur de vos membranes.
- **P** met en pause ; **Espace** stimule. Les options permettent d’exporter, importer et recréer le monde.

## Simulation

Carte procédurale de 256 × 1 536 unités, six strates, sept espèces, jusqu’à 20 000 cellules individuelles. La simulation tourne dans un Web Worker à pas fixe (12 Hz, vitesse ×1/×2/×4). Le métabolisme individuel est réparti en trois cohortes à 4 Hz, avec compensation du temps écoulé. Les substances diffusent sur une grille plus grossière ; terrain et cellules ont des représentations distinctes. Des listes spatiales contiguës limitent les interactions de prédation et de symbiose à 32 voisins par cellule.

Les cellules possèdent âge, réserves, santé, génération, traits héritables et métabolisme. La photosynthèse, la consommation de nutriments et d’oxygène, les déchets, la décomposition, la prédation, les divisions et le stress thermique interagissent. Le modèle est une fiction biologique cohérente, pas un modèle scientifique validé.

Les niveaux achetés sont permanents. Une extinction relance la lignée à partir de spores de secours. Les gains hors ligne utilisent le dernier rendement sauvegardé, sur 24 heures maximum, sans évolution ni crise pendant l’absence.

## Développement

Les fichiers du jeu sont servis directement. Aucun serveur applicatif, aucune installation de dépendances. Dans le projet local, les fichiers à servir sont regroupés dans `dist/` ; dans le dépôt GitHub Pages, ils sont publiés à la racine.

```sh
npm start
npm run check
npm test
```

Ouvrir http://127.0.0.1:4173/. Les sauvegardes utilisent `localStorage` et peuvent être exportées en JSON. Les polices Google sont facultatives : les polices système prennent le relais en leur absence.

Pour GitHub Pages, publier le **contenu de `dist/` à la racine** de `main`, avec `.nojekyll`. Le fichier `sw.js` retire l’ancien service worker de SortieANY afin que les anciens visiteurs reçoivent le jeu.

## Vérifications

Les tests couvrent : déterminisme, accessibilité des strates, stimulation, achats, divisions, recyclage, automatisation, mutations, génétique, profondeur, extinction, validation des imports, sauvegardes et gains hors ligne.

La cible est 10 000 cellules sur navigateur PC. Le plafond de 20 000 est une limite de population, pas une garantie de fréquence sur tous les appareils. Les boutons ×2/×4 augmentent la cadence demandée ; le moteur limite le rattrapage pour préserver l’interface sur les machines lentes.

Version alpha 0.1. La sauvegarde est locale à l’appareil et au navigateur.
