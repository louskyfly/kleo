# Recherche — ce que fait vraiment Genially

*Visite du 22 novembre 2026. Captures dans `docs/research/`.*

## 1. Positionnement

Genially est un **outil auteur** de contenus interactifs, utilisé massivement par les enseignants d'histoire-géographie pour trois usages :

- le **diaporama de séance** (le plus fréquent) ;
- l'**image ou la carte interactive** (points cliquables sur un document) ;
- le **parcours gamifié** (escape game, quiz, révision).

Le site ne vend pas « une présentation » : il vend **du contenu qui se comporte comme un site web** (une URL par création, navigation, zones cliquables, fenêtres, quiz, intégrations).

### Ce que montrent les captures

| Capture | Enseignement |
| --- | --- |
| `genially-accueil.png` | L'accueil pose une question d'intention (« Que voulez-vous créer ? »), pas un catalogue d'outils. Les preuves sociales et les chiffres arrivent après. |
| `genially-modeles.png` | Galerie en grille serrée, filtres par usage (jeux, IA, formulaires, quiz, diaporamas…) et par public. Chaque vignette est un **exemple immédiatement ouvrable**, pas une promesse. |
| `genially-viewer-frise.png` | Le spectateur est dans une **scène plein écran** : flèche de page sur le bord, barre de progression en bas à gauche, menu et plein écran en bas à droite. Les repères chronologiques sont des zones cliquables, pas du texte. |
| `genially-viewer-emc.png` | Une page = une idée. Texte court, grands titres, un document, une interaction. La densité reste faible même sur des sujets lourds. |
| `genially-ia.png` | L'IA est présentée comme une **accélération** (générer, réécrire, résumer, traduire, illustrer, créer un quiz), pas comme le produit. |

## 2. Anatomie du produit

### A. Création
- Choix entre **modèle** et **page blanche** ; plus de 1 500 modèles classés par usage.
- Éditeur WYSIWYG par glisser-déposer, calques, pages de tailles différentes.
- Import PDF, PowerPoint, Google Slides, Canva.
- IA : génération d'une création complète, jeux, images interactives, réécriture, traduction, synthèse vocale.

### B. Briques de contenu
- Texte, image, forme, ligne, icône, GIF, vidéo, audio, iframe, tableau, graphique.
- **Composants** : cartes à retourner, memory, minuteur, dés, randomiseur, carrousel, galerie, menu de navigation, comparateur avant/après, visualisation de données.
- **Interactions sans code** : zone cliquable (même invisible), infobulle, fenêtre modale, cliquer pour révéler, glisser-déposer, dessiner, animation au clic/survol, transition de page, lien interne/externe, déblocage programmé.
- **Quiz** : choix unique/multiple, vrai-faux, sélection d'image, tri, texte à trous, réponse courte/longue, sondage, feedback immédiat, chronomètre, banque de questions, embranchements.

### C. Diffusion
- Lien public, iframe, QR, Google Classroom / Teams, SCORM 1.2, LTI 1.3.
- Visionneuse hors ligne (Windows, macOS, iOS, Android).
- Présentation en direct avec classement et participation par code à 6 chiffres.
- Tableau de bord : vues, pages vues, interactions, réponses.

### D. Qualité
- WCAG 2.1 AA, texte alternatif, hiérarchie des titres, ordre de lecture, indicateurs d'interactivité pulsés, zoom, descriptions de liens.

## 3. Patterns d'expérience à retenir

1. **Intention avant outil.** On demande ce que l'on veut créer, pas quel bloc insérer.
2. **Exemple avant tutoriel.** Les modèles sont des démonstrations jouables.
3. **Une page = une idée.** Les meilleures créations d'enseignants tiennent ce contrat, même si l'outil ne l'impose pas.
4. **La navigation est invisible mais toujours là** : flèche de bord, progression, sommaire.
5. **L'interactivité est signalée** : point pulsé, curseur, micro-animation. Sur iPad, c'est indispensable.
6. **Le mode lecture est plein écran**, sans chrome d'application, pour projeter en classe.
7. **Le mode enseignant reste distinct** du mode élève (notes, minuteur, commandes).

## 4. Limites — et donc notre angle

| Limite de Genially | Réponse Kléo |
| --- | --- |
| Page blanche : il faut savoir designer pour obtenir un résultat propre. | **Le document est l'entrée.** Kléo propose une mise en page éditoriale déjà bonne, que l'on ajuste. |
| Aucune compréhension du programme scolaire. | **Structuration par intent** : matière, niveau, thème, durée, type de séance (découverte, analyse, révision, évaluation). |
| L'IA agit sur le texte, pas sur la **structure pédagogique**. | L'IA produit un **plan de séance** (pages + blocs + interactions), pas une suite de diapositives. |
| Textes longs collés tels quels : illisibles sur iPad. | **Règles de découpe** : 1 idée par page, 40–60 mots par bloc, 3–5 blocs max, documents mis en scène. |
| Accessibilité présente, mais à activer élément par élément. | **Accessibilité par défaut** : contrastes, cibles 48 px, ordre de lecture, alternatives textuelles, navigation clavier. |
| Adaptation tactile possible, mais pensée souris. | **Tactile d'abord** : glisser pour tourner, zones ≥ 44 px, pas d'interaction au survol seul. |
| Prix et complexité croissants pour les fonctions utiles. | Périmètre clair : séance, documents, classe, partage. |

## 5. Les dix fonctionnalités que Kléo doit reprendre

1. Boutons et zones cliquables menant à une page ou à un lien externe.
2. Cartes à retourner et cartes cliquables.
3. Frise chronologique interactive.
4. Carte / image à points chauds.
5. Dépôt de documents et de liens dans une séance.
6. Analyse de document guidée (ce qu'il faut observer).
7. Quiz avec feedback immédiat.
8. Sommaire et navigation plein écran.
9. Partage par lien et QR, mode élève / mode enseignant.
10. Accessibilité et tactile par défaut.

## 6. Décisions issues de la recherche

- **Document-first**, pas canvas-first : on ne remplace pas Genially comme outil de design, on remplace le travail de mise en forme.
- **Un modèle de séance fort** (couverture, objectifs, repères, documents, activité, quiz, dépôt, synthèse) plutôt qu'une bibliothèque infinie de gabarits.
- **Éditeur à trois colonnes** (plan / aperçu / réglages), familier aux utilisateurs de Genially, mais avec des blocs pédagogiques nommés en clair.
- **Mode séance plein écran** avec sommaire, progression, notes enseignant et gestes tactiles.
- **La sobriété comme valeur** : papier, encre, un accent. On doit pouvoir projeter la séance dans une classe lumineuse et la lire sur un iPad.
