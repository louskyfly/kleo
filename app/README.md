# Kléo v2 — application

Application statique, sans dépendance ni build. Ouvrir `index.html` ou servir le dossier.

```bash
npx serve .
```

## Routes

| Route | Écran |
| --- | --- |
| `#/library` | Bibliothèque |
| `#/import` | Nouvelle séance : documents, titre, réglages |
| `#/generate` | Transition de préparation |
| `#/editor` | Éditeur de la séance courante |
| `#/viewer/0…n` | Mode séance |
| `#/partage/<données>` | Import d'une séance partagée, puis lecture |

## Modèle de données

```js
session = {
  id, title, subject: 'histoire' | 'geo' | 'emc', level, duration,
  theme, coverWord, status,
  attachments: ['fichier.pdf'],
  pages: [{
    id, kind, name, minutes, note,
    data: { /* champs propres au type de page */ }
  }]
}
```

Types de pages : `cover`, `objectives`, `timeline`, `map`, `flipcards`, `document`, `quiz`, `deposit`, `synthesis`.
Les schémas de formulaire sont dans `data.js` (`SCHEMAS`), le rendu dans `slides.js`.

## Persistance

- Clé localStorage : `kleo.sessions.v2`.
- Enregistrement automatique après chaque modification (220 ms).
- Aucun serveur : les données restent sur l'appareil.
- Export/import `.json` pour transférer une séance.
- Lien de partage : la séance est encodée en base64 URL dans le fragment.

## Édition sur iPad

- Le plan est une bande horizontale.
- Le bouton **Éditer** ouvre le panneau de contenu en tiroir.
- Les cibles tactiles font au moins 44 px.
- Le mode séance se tourne au doigt.

## Tests manuels utiles

1. Modifier le titre d'une page, recharger : la modification est conservée.
2. Ajouter une question, une réponse, cocher la bonne : l'aperçu et le quiz joué suivent.
3. Ajouter une page, la dupliquer, la déplacer, la supprimer.
4. Partager le lien, l'ouvrir dans un autre navigateur : la séance est importée.
5. Exporter le `.json` puis le réimporter.

## Limites

- Pas de backend, de comptes ni de synchronisation.
- Les documents joints ne sont pas analysés.
- Le lien de partage peut être long (la séance entière y est encodée).
- Le dépôt de devoir est une démonstration.
