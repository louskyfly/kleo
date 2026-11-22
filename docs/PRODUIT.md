# Spécification produit — Kléo v0.1

## 1. Promesse

> Déposer un cours, obtenir une séance.

Kléo prend des documents scolaires bruts (PDF, DOCX, TXT, photos, liens) et produit une **séance interactive structurée**, lisible sur iPad, modifiable sans compétence de design.

**Ce que Kléo fait** : découper, hiérarchiser, illustrer, mettre en page, rendre interactif, vérifier l'accessibilité.
**Ce que Kléo ne fait pas** : inventer le propos historique. Le professeur valide et peut tout éditer.

## État livré — v2 (client)

La v2 transforme la maquette en outil auteur utilisable :

- bibliothèque persistante (localStorage) : créer, dupliquer, renommer, supprimer, filtrer ;
- éditeur de 9 types de pages avec formulaires réels et aperçu immédiat ;
- constructeur de quiz : questions, réponses, bonne réponse, corrections, vrai/faux, score ;
- mode séance data-driven : sommaire, notes, minuteur, score, tactile et clavier ;
- partage par lien autonome, export/import `.json` ;
- édition iPad en tiroir.

Ce qui reste hors de la v2 : comptes et synchronisation, analysis réelle des PDF/DOCX, génération IA du plan, dépôt de copies côté serveur, export PDF/SCORM.

## 2. Utilisateurs

| Persona | Besoin | Contrainte |
| --- | --- | --- |
| Professeur d'histoire-géo-EMC (collège/lycée) | Gagner 2 à 4 h de mise en forme par séance | Ne pas apprendre un logiciel de design |
| Élève de 6e à la terminale | Comprendre, manipuler, rendre un travail | iPad de classe, réseau variable |
| Coordonnateur / formateur | Réutiliser, partager, décliner | Cohérence visuelle, accessibilité |

## 3. Parcours cible

1. **Déposer** — glisser des fichiers ou coller des liens.
2. **Cadrer** — matière, niveau, durée, intention (découverte, analyse, révision, évaluation).
3. **Générer** — Kléo produit un plan de 6 à 14 pages et un premier design.
4. **Ajuster** — éditeur : plan, aperçu, réglages ; blocs déplaçables ; accessibilité contrôlée.
5. **Faire vivre** — mode séance plein écran, tactile, avec sommaire et notes enseignant.
6. **Partager** — lien, QR, PDF ; suivi des dépôts.

## 4. Périmètre fonctionnel

### P0 — indispensable à la v1
- Import multi-fichiers (PDF texte, DOCX, TXT/MD, JPG/PNG/HEIC) + liens.
- Extraction du texte, OCR des images, détection des titres, dates, documents iconographiques.
- Génération d'un **plan de séance** conforme au programme choisi.
- Bibliothèque de blocs pédagogiques (voir §5).
- Éditeur visuel simple : réordonner, remplacer un bloc, changer un style, prévisualiser.
- Mode séance : plein écran, clavier, tactile, sommaire, progression.
- Partage par lien, mode élève / enseignant.
- Accessibilité : contrastes AA, cibles ≥ 44 px, navigation clavier, alt text, ordre de lecture.

### P1 — confort et classe
- Dépôt de devoirs par les élèves + suivi.
- Quiz noté, feedback par question, export des résultats.
- Modèles par thème du programme (6e → terminale).
- Bibliothèque de documents de classe réutilisables.
- Export PDF imprimable et SCORM.
- Co-édition et commentaires.

### P2 — plus tard
- Synthèse vocale, version DYS, traduction.
- Parcours différenciés générés depuis la même séance.
- Mode présentation en direct avec les appareils des élèves.

## 5. Taxonomie des blocs

| Bloc | Rôle | Interaction |
| --- | --- | --- |
| `cover` | Ouvrir la séance : titre, accroche, durée | Bouton « Commencer » |
| `objectives` | Annoncer 2–4 objectifs et les compétences | Rien (lecture) |
| `timeline` | Repères chronologiques | Clic sur un événement → fiche détaillée |
| `map` | Situer des lieux / circulations | Points chauds → détail |
| `flipcards` | Mémoriser des notions | Carte qui se retourne |
| `document` | Étudier une source | Zoom, points d'observation |
| `quote` | Citer et commenter | Mise en avant |
| `compare` | Confronter deux documents | Curseur ou colonnes |
| `quiz` | Vérifier la compréhension | Choix, feedback immédiat |
| `deposit` | Rendre un travail | Dépôt de fichier (iPad) |
| `link` | Ouvrir une ressource externe | Bouton / vignette |
| `synthesis` | Trois points à retenir | Boutons de révision |

Les blocs sont **sémantiques**, pas graphiques : l'IA choisit `timeline` parce que le contenu est daté, pas parce qu'une frise est jolie.

## 6. Pipeline IA

```
Documents ──▶ 1. Extraction ──▶ 2. Analyse ──▶ 3. Plan ──▶ 4. Rédaction ──▶ 5. Design ──▶ 6. Contrôles ──▶ Séance
                texte/OCR        matière,        pages +       blocs          tokens,        a11y, faits,
                titres, dates    niveau,         intentions    courts         mise en page   densité
                                 thème
```

1. **Extraction** — PDF (couche texte sinon OCR), DOCX, images (OCR + légende), liens (titre, description, vignette). Conserver la **provenance** de chaque fragment.
2. **Analyse** — classification : matière (histoire / géo / EMC), niveau, thème du programme, type de séance. Extraction des entités : dates, lieux, personnes, notions, documents.
3. **Plan** — JSON strict : 6–14 pages, chacune avec un rôle et 1–4 blocs. Contrainte : une idée par page, 40–60 mots par bloc de texte.
4. **Rédaction** — reformulation fidèle, titres courts, légendes, questions. **Aucune date ou citation ajoutée sans source** ; sinon marquée `a_verifier`.
5. **Design** — le plan est rendu par un moteur de mise en page, pas par le modèle : la cohérence visuelle ne dépend pas de la génération.
6. **Contrôles** — densité, contraste, longueur des titres, ordre de lecture, cibles tactiles, citations sourcées, liens valides.

### Contrat de données (extrait)

```json
{
  "title": "Des Lumières à la Révolution",
  "subject": "histoire",
  "level": "4e",
  "duration": 55,
  "programme": "Le XVIIIe siècle, expansions, Lumières et révolutions",
  "sources": [{ "id": "doc-1", "name": "Chapitre_Lumieres.docx" }],
  "pages": [
    {
      "id": "p3",
      "role": "reperes",
      "title": "Les idées neuves, de 1748 à 1804",
      "blocks": [
        {
          "type": "timeline",
          "events": [
            { "year": 1748, "label": "De l'esprit des lois", "source": "doc-1", "detail": "…" }
          ]
        }
      ]
    }
  ]
}
```

## 7. Design system

- **Papier & encre** : fond `#F7F2E7`, surface `#FFFCF6`, encre `#152420`, trait `#E6DECF`.
- **Accents** : terre cuite `#B8542F` (repères, kickers), safran `#D9A441` (signalétique), vert profond `#1E4A41` (couverture).
- **Typographie** : Fraunces (titres), Inter (interface et corps). Titres 44–64 px en projection, corps ≥ 16 px.
- **Densité** : 3 à 5 blocs par page, 60 mots max par bloc, marges généreuses.
- **Formes** : rayon 18–28 px, ombres basses, filets fins, aucune décoration qui concurrence le document.

## 8. Accessibilité & tactile

- Cible tactile ≥ 44 × 44 px, espacement ≥ 8 px.
- Contraste texte ≥ 4,5:1, grands titres ≥ 3:1.
- Navigation clavier complète (`Tab`, `←` `→`, `Échap`), focus visible.
- Alternatives textuelles sur les documents et les cartes.
- Aucune information portée par la couleur seule : le quiz ajoute une icône et un texte.
- Interactions au survol **doublées** d'un clic.
- `prefers-reduced-motion` respecté ; animations ≤ 300 ms.

## 9. Architecture technique proposée

| Couche | Choix | Raison |
| --- | --- | --- |
| Front | Next.js 15 + TypeScript + Tailwind | App + rendu public des séances, SEO, simplicité de déploiement |
| Éditeur | React + dnd-kit | Réordonnancement accessible |
| Rendu des pages | Composants React par bloc | Design cohérent, pas de HTML généré librement |
| Base | Postgres (Supabase) + RLS | Comptes, séances, classes, dépôts |
| Fichiers | Supabase Storage / S3 | PDF, images, copies d'élèves |
| Extraction | `pdfjs-dist`, `mammoth`, OCR (Tesseract/API) | Couvre les documents réels des professeurs |
| IA | LLM avec sorties structurées (JSON Schema) | Plan fiable, coût maîtrisé |
| Partage | URL courte + QR, export PDF via Playwright | Usage en classe |
| Déploiement | Vercel | Itérations rapides |

## 10. Roadmap

| Étape | Livrable | Durée indicative |
| --- | --- | --- |
| 0 | Application cliente v2 : bibliothèque, éditeur, quiz, partage (fait) | — |
| 1 | Backend, comptes et synchronisation | 1–2 semaines |
| 2 | Import réel + extraction | 1 semaine |
| 3 | Génération IA + contrat JSON | 1–2 semaines |
| 4 | Comptes, partage, dépôt élève | 1 semaine |
| 5 | Tests en classe, accessibilité, export | en continu |

## 11. Risques

- **Fidélité historique** : toute date, citation ou chiffre doit être relié à un extrait source ; sinon marqué à vérifier. Le professeur valide.
- **Documents scannés médiocres** : OCR à faible confiance → demander confirmation plutôt que d'inventer.
- **Surcharge cognitive** : le moteur de mise en page doit refuser de tout afficher ; mieux vaut une page de plus qu'une page illisible.
- **Confidentialité** : documents et copies d'élèves privés par défaut, pas d'entraînement sur les données.
- **Coût IA** : générer un plan, puis rédiger page par page ; cache par document.

## 12. Indicateurs

- Temps entre le dépôt et la première séance utilisable (objectif < 3 min).
- Taux de pages conservées sans modification.
- Nombre de séances réellement projetées (et non seulement créées).
- Temps de mise en forme économisé déclaré par l'enseignant.
