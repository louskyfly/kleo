# Maquette Kléo

Prototype statique, sans dépendance ni build. Ouvrir `index.html` ou servir le dossier :

```bash
npx serve .
```

## Écrans

| Route | Écran |
| --- | --- |
| `#/library` | Bibliothèque, héros, séances |
| `#/import` | Dépôt de documents et réglages |
| `#/generate` | Génération animée |
| `#/editor` | Éditeur (plan / aperçu / blocs) |
| `#/viewer/0` … `8` | Mode séance, page par page |

## Interactions de la démo

- **Import** : glisser-déposer, sélection de fichiers, ajout de lien, retrait d'un document.
- **Générer** : lance la séquence puis ouvre l'éditeur.
- **Éditeur** : choisir une page, onglets Bloc / Design / Accès, ajouter un bloc, publier.
- **Mode séance** : frise cliquable, carte à points chauds, cartes à retourner, quiz avec feedback, dépôt de devoir, sommaire, notes enseignant, plein écran.
- **Tactile** : glisser horizontalement pour tourner les pages ; cibles ≥ 44 px.
- **Clavier** : `←` `→`, `Échap`, `⌘K` pour la recherche.

## Limites assumées

- Aucune IA réelle : la séance de démonstration est écrite en dur dans `app.js`.
- Le dépôt de fichier et le partage sont simulés (pas de serveur).
- Les visuels sont en CSS/SVG ; la carte est générée à partir de Natural Earth (domaine public), via `world-atlas`.

## Design

Papier (`#F7F2E7`) et encre (`#152420`), accents terre cuite (`#B8542F`) et safran (`#D9A441`). Titres en Fraunces, interface en Inter. Les slides utilisent des unités de conteneur (`cqw`) pour rester identiques à l'écran et dans l'éditeur.
