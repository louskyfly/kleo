# Kléo v2 — application

Application statique, sans dépendance ni build. Ouvrir `index.html` ou servir le dossier.

```bash
npx serve .
```

## Routes

| Route | Écran |
| --- | --- |
| `#/library` | Bibliothèque : séances, projets invités, filtres |
| `#/import` | Nouvelle séance : documents, structure, réglages |
| `#/generate` | Transition de préparation |
| `#/editor` | Éditeur de la séance courante |
| `#/viewer/0…n` | Mode séance |
| `#/partage/<données>` | Import d'une séance partagée, puis lecture |
| `#/prof` | Panneau d'accès professeur (code 2026) |
| `#/join/<code>` | Séance publiée par QR |

## Séances et projets

- **Séances** : objets éditables, stockés dans `localStorage`.
- **Projets** : ressources statiques dans `data.js` (`PROJECTS`). « Mystère en Égypte » est une enquête 6e hébergée sur `yhglasalle.github.io/mystere-en-egypte`. La fiche affiche la structure ; le bouton lance le jeu dans un nouvel onglet.
- **Structures** : `TEMPLATES` dans `data.js` (découverte, analyse, enquête, révision, évaluation, page blanche).

## Modèle de données

```js
session = {
  id, title, subject: 'histoire' | 'geo' | 'emc', level, duration,
  theme, coverWord, status, template,
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

## Classe, verrou et QR

- `live.js` gère la porte d'accès, la publication de séance et les QR.
- Broker : `wss://test.mosquitto.org:8081/mqtt` (public, messages retenus).
- Sujet du verrou : `kleo/live/7d3f9a1c/gate` ; séances : `kleo/live/7d3f9a1c/session/<code>`.
- Code professeur : `2026` (`TEACHER_CODE` dans `live.js`).
- Publier une séance depuis `#/prof` crée un code à 5 caractères et un QR vers `#/join/<code>`.
- Le verrou est global : fermé, tous les élèves voient « Séance fermée ».
- Ce n'est pas une sécurité forte : le code et les sujets sont dans le client, et le broker est public. Ne pas y publier de données personnelles.
- `vendor/mqtt.min.js` (MQTT.js, MIT) et `vendor/qrcode.min.js` (qrcodejs, MIT).

## Tests manuels utiles

1. Modifier le titre d'une page, recharger : la modification est conservée.
2. Ajouter une question, une réponse, cocher la bonne : l'aperçu et le quiz joué suivent.
3. Ajouter une page, la dupliquer, la déplacer, la supprimer.
4. Partager le lien, l'ouvrir dans un autre navigateur : la séance est importée.
5. Exporter le `.json` puis le réimporter.
6. Ouvrir la fiche « Mystère en Égypte » et lancer l'enquête.
7. Créer une séance avec chaque structure (découverte, analyse, enquête, révision, évaluation).
8. Panneau → publier une séance → ouvrir le lien `#/join/<code>` dans un autre navigateur.
9. Panneau → fermer l'accès → recharger le lien élève : « Séance fermée ».

## Limites

- Pas de backend, de comptes ni de synchronisation.
- Les documents joints ne sont pas analysés.
- Le lien de partage peut être long (la séance entière y est encodée).
- Le dépôt de devoir est une démonstration.
