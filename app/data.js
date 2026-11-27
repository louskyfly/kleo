/* ============================================================
   Clio v2 — données, schémas et persistance
   Aucune dépendance, compatible file:// et GitHub Pages.
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'kleo.sessions.v2';
  let counter = 0;
  const uid = (p = 'id') => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;
  const now = () => new Date().toISOString();
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const SUBJECTS = {
    histoire: { label: 'Histoire', className: 'cover-1', accent: '#B8542F' },
    geo: { label: 'Géographie', className: 'cover-2', accent: '#1E4A41' },
    emc: { label: 'EMC', className: 'cover-3', accent: '#2E5E8C' }
  };

  const PAGE_TYPES = {
    cover: { label: 'Couverture', icon: 'i-star', description: 'Titre, accroche, durée.' },
    objectives: { label: 'Objectifs', icon: 'i-check', description: 'Ce que les élèves vont apprendre.' },
    timeline: { label: 'Frise chronologique', icon: 'i-timeline', description: 'Des dates cliquables.' },
    map: { label: 'Carte interactive', icon: 'i-map', description: 'Des lieux à explorer.' },
    flipcards: { label: 'Cartes à retourner', icon: 'i-cards', description: 'Mémoriser des notions.' },
    document: { label: 'Étude de document', icon: 'i-doc', description: 'Une source et des questions.' },
    quiz: { label: 'Quiz', icon: 'i-quiz', description: 'Questions, réponses et score.' },
    deposit: { label: 'Dépôt de devoir', icon: 'i-upload', description: 'Une consigne et un rendu.' },
    synthesis: { label: 'Synthèse', icon: 'i-check', description: 'Trois points à retenir.' }
  };

  /* ------------------------------------------------------------
     Contenu de démonstration
     ------------------------------------------------------------ */
  function seedPages() {
    return [
      {
        id: 'p_cover', kind: 'cover', name: 'Couverture', minutes: 2,
        note: "Accueillir la classe. Laisser 30 secondes pour observer la couverture et formuler une hypothèse : « Que va-t-on apprendre ? »",
        data: {
          kicker: 'Séance 2 · Histoire · 4e',
          title: 'Des Lumières',
          accent: 'à la Révolution',
          lede: "Comment les idées nouvelles du XVIIIe siècle bouleversent-elles l’ordre politique et social en Europe ?",
          meta: ['55 minutes', '4 documents', 'Classe de 4e B']
        }
      },
      {
        id: 'p_obj', kind: 'objectives', name: 'Objectifs', minutes: 3,
        note: "Lire les trois objectifs à voix haute. Faire reformuler l'objectif 2 par un élève. Annoncer l'activité finale : l'analyse de document.",
        data: {
          kicker: 'Ce que vous allez apprendre',
          title: 'Trois objectifs,',
          accent: 'une enquête.',
          meta: '3 minutes',
          items: [
            { title: 'Situer les idées des Lumières', text: 'Replacer les grands textes et les grandes dates de 1748 à 1804 sur une frise.' },
            { title: 'Expliquer une rupture', text: 'Comprendre comment les Lumières préparent la Révolution française.' },
            { title: 'Analyser un document', text: 'Prélever des informations dans un texte de 1789 et les mettre en relation.' }
          ],
          skills: ['Se repérer dans le temps', 'Analyser un document', 'Argumenter'],
          question: "En quoi les Lumières sont-elles une révolution des idées avant d’être une révolution politique ?"
        }
      },
      {
        id: 'p_tl', kind: 'timeline', name: 'Frise — 1748-1804', minutes: 10,
        note: "Projeter la frise, demander aux élèves de repérer deux ruptures. Cliquer sur 1789 et faire lire la fiche. Ne pas dérouler les six événements : en choisir trois.",
        data: {
          kicker: 'Repères chronologiques',
          title: 'Les idées neuves,',
          accent: 'de 1748 à 1804.',
          meta: 'Cliquez sur une date',
          events: [
            { year: '1748', label: "De l'esprit des lois", title: 'Montesquieu sépare les pouvoirs', text: "Le philosophe critique la monarchie absolue et propose de distinguer les pouvoirs législatif, exécutif et judiciaire pour éviter le despotisme.", source: 'Montesquieu, De l’esprit des lois, 1748', quote: '« Il faut que, par la disposition des choses, le pouvoir arrête le pouvoir. »', tags: ['Séparation des pouvoirs', 'Critique de l’absolutisme'] },
            { year: '1751', label: "L'Encyclopédie", title: 'Diderot et d’Alembert publient le premier volume', text: "L'Encyclopédie rassemble et diffuse les savoirs nouveaux. Elle devient le symbole de l'esprit des Lumières et un outil de critique de l'ordre établi.", source: 'Encyclopédie, tome I, 1751', quote: '« Une encyclopédie doit changer la façon commune de penser. »', tags: ['Diffusion des savoirs', 'Esprit critique'] },
            { year: '1762', label: 'Du contrat social', title: 'Rousseau pense la souveraineté du peuple', text: "Rousseau affirme que la légitimité politique vient du peuple. La volonté générale fonde la loi, et non le droit divin du roi.", source: 'Rousseau, Du contrat social, 1762', quote: '« L’homme est né libre, et partout il est dans les fers. »', tags: ['Souveraineté du peuple', 'Volonté générale'] },
            { year: '1776', label: 'Indépendance américaine', title: 'Les colonies proclament leurs droits', text: "La Déclaration d'indépendance des États-Unis reprend les idées de liberté et d'égalité. Elle inspire les révolutionnaires français.", source: 'Déclaration d’indépendance des États-Unis, 4 juillet 1776', quote: '« Tous les hommes sont créés égaux. »', tags: ['Liberté', 'Égalité'] },
            { year: '1789', label: 'Révolution française', title: 'Les droits de l’homme sont proclamés', text: "Le 26 août 1789, l'Assemblée nationale adopte la Déclaration des droits de l'homme et du citoyen. Elle pose la liberté, l'égalité et la souveraineté nationale.", source: 'Déclaration des droits de l’homme et du citoyen, 1789', quote: '« Les hommes naissent et demeurent libres et égaux en droits. »', tags: ['Droits naturels', 'Souveraineté nationale', 'Fin des privilèges'] },
            { year: '1804', label: 'Code civil', title: 'Napoléon fixe un droit commun', text: "Le Code civil unifie le droit français. Il conserve certaines conquêtes révolutionnaires, notamment l'égalité civile, mais renforce l'autorité du pouvoir.", source: 'Code civil des Français, 1804', quote: '« Tout Français jouira des droits civils. »', tags: ['Droit commun', 'Héritage révolutionnaire'] }
          ]
        }
      },
      {
        id: 'p_map', kind: 'map', name: 'Carte des idées', minutes: 8,
        note: "Faire situer Paris et Londres. Question : pourquoi les idées circulent-elles mieux dans certaines villes ? Introduire la notion d'espace public.",
        data: {
          kicker: 'Géographie des Lumières',
          title: 'Où circulent',
          accent: 'les idées ?',
          meta: 'Europe, vers 1750',
          places: [
            { name: 'Paris', x: 222, y: 272, kicker: 'Capitale des Lumières', text: "Salons, académies, cafés : les idées se discutent et se diffusent. L'Encyclopédie y est publiée malgré la censure.", tag: 'Rayonnement intellectuel', tags: ['Salons', 'Académies', 'Censure'], question: 'Pourquoi la censure royale ne suffit-elle pas à arrêter l’Encyclopédie ?', fact: '1751 · Premier volume de l’Encyclopédie' },
            { name: 'Londres', x: 208, y: 241, kicker: 'Monarchie parlementaire', text: "Le roi gouverne avec un Parlement. Ce modèle politique nourrit la réflexion de Montesquieu et de Voltaire.", tag: 'Modèle politique', tags: ['Parlement', 'Libertés', 'Presse'], question: 'En quoi le Parlement limite-t-il le pouvoir du roi ?', fact: '1688 · Déclaration des droits' },
            { name: 'Amsterdam', x: 243, y: 235, kicker: 'Imprimerie et tolérance', text: "Les Provinces-Unies accueillent les livres interdits en France. Les idées circulent par le commerce et l'édition.", tag: 'Circulation des livres', tags: ['Édition', 'Commerce', 'Tolérance'], question: 'Pourquoi les livres interdits sont-ils imprimés ici ?', fact: '1685 · Refuge des huguenots' },
            { name: 'Ferney', x: 248, y: 302, kicker: 'Voltaire en retrait', text: "Installé près de Genève, Voltaire écrit, correspond avec toute l'Europe et intervient dans les affaires judiciaires.", tag: 'Réseaux épistolaires', tags: ['Correspondance', 'Engagement'], question: 'Comment Voltaire intervient-il dans l’espace public européen ?', fact: '1763 · Traité sur la tolérance' },
            { name: 'Vienne', x: 324, y: 280, kicker: 'Despote éclairé', text: "Joseph II réforme l'Empire : tolérance religieuse, abolition du servage. Les Lumières inspirent aussi les souverains.", tag: 'Réformes', tags: ['Tolérance', 'Réformes', 'Empire'], question: 'Peut-on être à la fois despote et éclairé ?', fact: '1781 · Patente de tolérance' }
          ]
        }
      },
      {
        id: 'p_cards', kind: 'flipcards', name: 'Les idées des Lumières', minutes: 8,
        note: "Laisser les élèves retourner les cartes par deux. Consigne : reformuler chaque idée en une phrase, sans lire la citation.",
        data: {
          kicker: 'Les quatre idées',
          title: 'Retournez les cartes',
          accent: 'pour comprendre.',
          meta: 'Touchez une carte',
          cards: [
            { title: 'La raison', sub: 'Penser par soi-même plutôt que répéter.', quote: '« Ose penser par toi-même. »', cite: 'Kant, Qu’est-ce que les Lumières ?, 1784' },
            { title: 'La tolérance', sub: 'Accepter les croyances et les opinions d’autrui.', quote: '« Nous sommes tous pétris de faiblesse et d’erreurs ; pardonnons-nous réciproquement nos sottises. »', cite: 'Voltaire, Traité sur la tolérance, 1763' },
            { title: 'La séparation des pouvoirs', sub: 'Empêcher un seul pouvoir de tout décider.', quote: '« Il faut que, par la disposition des choses, le pouvoir arrête le pouvoir. »', cite: 'Montesquieu, De l’esprit des lois, 1748' },
            { title: 'La souveraineté du peuple', sub: 'La loi vient du peuple, non du roi.', quote: '« L’homme est né libre, et partout il est dans les fers. »', cite: 'Rousseau, Du contrat social, 1762' }
          ]
        }
      },
      {
        id: 'p_doc', kind: 'document', name: 'Étude de document', minutes: 12,
        note: "Lecture silencieuse 2 min, puis trois prises de parole. Guider avec les quatre points d'observation. Le zoom sert à montrer la mention « privilèges ».",
        data: {
          kicker: 'Étude de document',
          title: 'Qu’est-ce que',
          accent: 'le tiers état ?',
          meta: 'Sieyès · janvier 1789',
          quote: "Qu’est-ce que le tiers état ? Tout. Qu’a-t-il été jusqu’à présent dans l’ordre politique ? Rien. Que demande-t-il ? À être quelque chose.",
          source: 'Emmanuel-Joseph Sieyès, Qu’est-ce que le tiers état ?, janvier 1789.',
          stamp: 'Archives · 1789',
          points: [
            { q: 'Qui parle ?', a: 'Un membre du clergé, élu du tiers état.' },
            { q: 'Que dénonce-t-il ?', a: 'Le poids des privilèges et l’absence de représentation.' },
            { q: 'Que demande-t-il ?', a: 'Une place politique pour les 98 % de la population.' },
            { q: 'Pourquoi est-ce une rupture ?', a: 'La souveraineté n’est plus celle du roi seul.' }
          ],
          vocab: { term: 'Tiers état', def: 'l’immense majorité de la population, qui ne bénéficie d’aucun privilège.' },
          takeaway: 'Avec Sieyès, le tiers état ne demande plus une place : il affirme qu’il est la nation.'
        }
      },
      {
        id: 'p_quiz', kind: 'quiz', name: 'Quiz de vérification', minutes: 6,
        note: "Répondre individuellement sur ardoise ou à main levée. Ne pas dévoiler la réponse avant d'avoir relevé les hypothèses.",
        data: {
          kicker: 'Vérifions',
          title: 'Trois questions',
          accent: 'pour ancrer.',
          meta: '6 minutes',
          questions: [
            { q: 'Quel principe Montesquieu défend-il dans De l’esprit des lois ?', options: ['La séparation des pouvoirs', 'Le droit divin des rois', 'L’égalité des fortunes'], correct: 0, good: 'Oui. Montesquieu veut séparer les pouvoirs pour empêcher le despotisme.', bad: 'Pas tout à fait. Montesquieu critique la monarchie absolue et propose de séparer les pouvoirs.' },
            { q: 'En 1789, quel texte proclame les droits naturels et imprescriptibles ?', options: ['Le Code civil', 'La Déclaration des droits de l’homme et du citoyen', 'Du contrat social'], correct: 1, good: 'Exact. Adoptée le 26 août 1789, elle fonde la liberté et l’égalité devant la loi.', bad: 'Non : le Code civil date de 1804. En 1789, c’est la Déclaration des droits de l’homme et du citoyen.' },
            { q: 'Qui dirige la publication de l’Encyclopédie ?', options: ['Voltaire et Rousseau', 'Diderot et d’Alembert', 'Montesquieu et Kant'], correct: 1, good: 'Bien vu. Diderot et d’Alembert en sont les principaux maîtres d’œuvre.', bad: 'Ce sont Diderot et d’Alembert qui dirigent l’Encyclopédie à partir de 1751.' }
          ]
        }
      },
      {
        id: 'p_deposit', kind: 'deposit', name: 'Dépôt de devoir', minutes: 4,
        note: "Expliquer le format attendu : un paragraphe de 10 lignes, avec une citation du texte. Rappeler l'échéance et le dépôt depuis Fichiers sur iPad.",
        data: {
          kicker: 'À rendre',
          title: 'Votre analyse',
          accent: 'du document.',
          meta: 'Avant vendredi 20 h',
          promptTitle: 'Un paragraphe de 10 lignes, une citation.',
          prompt: "Expliquez en quoi le texte de Sieyès annonce une rupture politique. Appuyez-vous sur au moins une phrase du document.",
          deadline: 'Échéance : vendredi 28 novembre, 20 h',
          formats: 'PDF, JPG ou HEIC · 20 Mo maximum',
          privacy: 'Seul votre professeur voit votre copie',
          checklist: ['Une phrase qui répond à la question', 'Une citation entre guillemets', 'Une explication personnelle'],
          rubric: [{ label: 'Réponse à la question', points: '4 pts' }, { label: 'Citation du texte', points: '3 pts' }, { label: 'Explication personnelle', points: '3 pts' }]
        }
      },
      {
        id: 'p_synth', kind: 'synthesis', name: 'Synthèse', minutes: 2,
        note: "Faire dire les trois points à retenir sans le support. Terminer par la question de transition vers la séance suivante.",
        data: {
          kicker: 'Synthèse',
          title: 'Trois choses',
          accent: 'à retenir.',
          meta: '2 minutes',
          items: [
            { title: 'Les Lumières sont un mouvement européen.', text: 'Des philosophes confrontent les savoirs, la religion et le pouvoir absolu à la raison.' },
            { title: 'Les idées circulent et se diffusent.', text: 'Salons, correspondances, livres imprimés à l’étranger : un espace public se forme.' },
            { title: '1789 transforme les idées en droits.', text: 'La Déclaration des droits de l’homme et du citoyen inscrit la liberté et l’égalité dans la loi.' }
          ],
          ctaTitle: 'Et maintenant ?',
          ctaText: 'Relisez la frise, puis testez-vous. La séance suivante portera sur les transformations politiques de 1789 à 1799.',
          ctaButton: 'Refaire le quiz',
          links: ['Fiche de révision', 'Revenir au début', 'Partager la séance']
        }
      }
    ];
  }

  function seedSession() {
    return {
      id: 's_lumieres',
      title: 'Des Lumières à la Révolution',
      subject: 'histoire',
      level: '4e',
      duration: 55,
      theme: 'Le XVIIIe siècle, expansions, Lumières et révolutions',
      coverWord: '1789',
      status: 'Brouillon',
      template: 'decouverte',
      attachments: ['Chapitre_Lumieres_v3.docx', 'extrait_Encyclopedie.pdf', 'carte_europe_1750.jpg', 'evaluation_Lumieres.docx'],
      createdAt: now(),
      updatedAt: now(),
      pages: seedPages()
    };
  }

  /* ------------------------------------------------------------
     Structures de séance et projets invités
     ------------------------------------------------------------ */
  const TEMPLATES = {
    decouverte: { label: 'Découverte', description: 'Repères, frise, quiz', pages: ['cover', 'objectives', 'timeline', 'quiz', 'synthesis'] },
    analyse: { label: 'Analyse de document', description: 'Source, observation, quiz', pages: ['cover', 'objectives', 'document', 'quiz', 'synthesis'] },
    enquete: { label: 'Enquête', description: 'Carte, document, quiz', pages: ['cover', 'objectives', 'map', 'document', 'quiz', 'synthesis'] },
    revision: { label: 'Révision', description: 'Cartes, quiz, synthèse', pages: ['cover', 'objectives', 'flipcards', 'quiz', 'synthesis'] },
    evaluation: { label: 'Évaluation', description: 'Quiz et synthèse', pages: ['cover', 'quiz', 'synthesis'] },
    blank: { label: 'Page blanche', description: 'Une couverture à compléter', pages: ['cover'] }
  };

  const PROJECTS = [{
    id: 'proj_egypte',
    title: 'Mystère en Égypte',
    subtitle: "L'enquête du professeur Désiré",
    subject: 'histoire',
    level: '6e',
    duration: 60,
    questions: 30,
    acts: 5,
    description: "Le professeur Désiré a disparu. Les élèves remontent sa piste du Caire à Gizeh, lisent les documents, résolvent les énigmes et répondent sur leur copie. Un projet d'enquête interactif pour entrer dans l'Antiquité égyptienne.",
    url: 'https://yhglasalle.github.io/mystere-en-egypte/',
    teacherUrl: 'https://yhglasalle.github.io/mystere-en-egypte/prof.html',
    cover: 'projects/mystere-en-egypte.png',
    tags: ['Enquête', 'Antiquité', 'Égypte', 'Documents'],
    credit: 'D’après l’enquête de Julien Ferrand (2018) · adaptation 2026',
    phases: [
      { title: 'Prologue', detail: 'Le Caire, le journal' },
      { title: 'I · L’envol', detail: 'Aéroport d’Orléans' },
      { title: 'II · Le Caire', detail: 'Avion, carte, hôtel' },
      { title: 'III · Le musée', detail: 'Ankh, Osiris, papyrus d’Hunefer' },
      { title: 'IV · Gizeh', detail: 'Tablette, guide, pyramide' },
      { title: 'V · La pyramide', detail: 'Sarcophage, coordonnées, finale' }
    ]
  }, {
    id: 'proj_grece',
    title: 'Le monde des cités grecques',
    subtitle: 'Sur la piste de Théodoros',
    subject: 'histoire',
    level: '6e',
    duration: 60,
    questions: 19,
    acts: 6,
    description: "Un voyage en Grèce tourne à l'enquête : Théodoros, le guide, a disparu. Les élèves suivent sa piste de Patras à Delphes, Athènes et au cap Sounion, lisent les documents, résolvent les énigmes et répondent sur leur feuille. Une enquête pour entrer dans le monde des cités grecques.",
    url: 'https://yhglasalle.github.io/enquete-cites-grecques/',
    teacherUrl: 'https://yhglasalle.github.io/enquete-cites-grecques/prof.html',
    cover: 'projects/cites-grecques.png',
    tags: ['Jeu de piste', 'Grèce antique', 'Cité', 'Mythologie', 'Méditerranée'],
    credit: 'D’après l’enquête de Yannick Sanchez (2019, rév. 2026) · adaptation 2026',
    phases: [
      { title: 'Prologue', detail: 'Le concours et le départ' },
      { title: 'I · Le voyage', detail: 'Montpellier, Ravenne, Patras' },
      { title: 'II · La chambre vide', detail: 'Le message de Théodoros' },
      { title: 'III · Delphes', detail: 'Sanctuaire, jeux, Pythie' },
      { title: 'IV · Athènes', detail: 'Acropole, cité, musée' },
      { title: 'V · Le musée', detail: 'Sphinx, Œdipe, Poséidon' },
      { title: 'VI · Le cap', detail: 'Sounion, la mer, la fin' }
    ]
  }, {
    id: 'proj_regimes',
    title: 'URSS de Staline / Allemagne nazie',
    subtitle: 'Le contrôle de troisième, en binôme',
    subject: 'histoire',
    level: '3e',
    duration: 60,
    questions: 12,
    acts: 1,
    description: "Quatre dossiers documentaires, une boîte à outils des mécanismes, un tri comparatif, une carte mentale sourcée et une conclusion. Les binômes envoient leur copie au professeur depuis l'application, qui la corrige avec barème et points.",
    url: 'https://yhglasalle.github.io/enquete-regimes-totalitaires/',
    teacherUrl: 'https://yhglasalle.github.io/enquete-regimes-totalitaires/',
    session: true,
    cover: 'projects/enquete-regimes.jpg',
    tags: ['Contrôle', 'Carte mentale', 'Sources', 'Binôme'],
    credit: 'Application d’enquête · 2026',
    phases: [
      { title: 'Briefing', detail: 'Mission et consignes' },
      { title: 'Enquête', detail: 'Quatre dossiers, douze questions' },
      { title: 'Mécanismes', detail: 'Six affirmations à attribuer' },
      { title: 'Comparer', detail: 'Douze éléments à trier' },
      { title: 'Carte', detail: 'Carte mentale sourcée' },
      { title: 'Envoi', detail: 'Copie transmise au professeur' }
    ]
  }];

  /* ------------------------------------------------------------
     Modèles de pages
     ------------------------------------------------------------ */
  const DEFAULT_PLACES = [
    [222, 272], [208, 241], [243, 235], [248, 302], [324, 280], [300, 210], [340, 250], [190, 300]
  ];

  function defaultData(kind) {
    const base = { kicker: '', title: 'Nouvelle page', accent: '', meta: '' };
    switch (kind) {
      case 'cover':
        return { kicker: 'Séance · Histoire · 4e', title: 'Titre de la séance', accent: '', lede: 'Écrivez ici la question qui guide la séance.', meta: ['55 minutes', 'Classe de 4e'] };
      case 'objectives':
        return { ...base, kicker: 'Objectifs', title: 'Ce que vous allez', accent: 'apprendre.', meta: '3 minutes', items: [{ title: 'Premier objectif', text: 'Décrivez ce que les élèves sauront faire.' }], skills: ['Compétence 1'], question: '' };
      case 'timeline':
        return { ...base, kicker: 'Repères', title: 'Les dates', accent: 'à retenir.', meta: 'Cliquez sur une date', events: [{ year: '1789', label: 'Un événement', title: 'Titre de l’événement', text: 'Expliquez ce qui se passe.', source: '', quote: '', tags: [] }] };
      case 'map':
        return {
          ...base, kicker: 'Carte', title: 'Où', accent: 'circulent les idées ?', meta: 'Europe',
          places: [
            { name: 'Paris', x: 222, y: 272, kicker: 'Un lieu', text: 'Décrivez ce lieu et son rôle.', tag: 'À retenir', tags: ['Notion'], question: 'Quelle question poser ?', fact: 'Une date · un repère' },
            { name: 'Londres', x: 208, y: 241, kicker: 'Un autre lieu', text: 'Décrivez ce lieu et son rôle.', tag: 'À retenir', tags: ['Notion'], question: 'Quelle question poser ?', fact: 'Une date · un repère' }
          ]
        };
      case 'flipcards':
        return { ...base, kicker: 'Notions', title: 'Retournez les cartes', accent: 'pour comprendre.', meta: 'Touchez une carte', cards: [{ title: 'Notion 1', sub: 'Une phrase pour l’expliquer.', quote: '« Une citation. »', cite: 'Auteur, œuvre, date' }, { title: 'Notion 2', sub: 'Une phrase pour l’expliquer.', quote: '« Une citation. »', cite: 'Auteur, œuvre, date' }] };
      case 'document':
        return { ...base, kicker: 'Étude de document', title: 'Un document', accent: 'à analyser.', meta: 'Source · date', quote: 'Recopiez ici l’extrait à étudier.', source: 'Auteur, titre, date.', stamp: 'Document', points: [{ q: 'Qui parle ?', a: 'Réponse attendue.' }, { q: 'Que dit le texte ?', a: 'Réponse attendue.' }], vocab: { term: 'Mot clé', def: 'sa définition.' }, takeaway: 'Ce qu’il faut retenir de ce document.' };
      case 'quiz':
        return { ...base, kicker: 'Quiz', title: 'Vérifions', accent: 'les acquis.', meta: '3 minutes', questions: [{ q: 'Posez votre première question.', options: ['La bonne réponse', 'Une autre réponse', 'Une troisième réponse'], correct: 0, good: 'Bonne réponse !', bad: 'Ce n’est pas la bonne réponse.' }] };
      case 'deposit':
        return { ...base, kicker: 'À rendre', title: 'Votre travail', accent: 'à déposer.', meta: 'Avant la prochaine séance', promptTitle: 'Ce que vous devez produire', prompt: 'Décrivez le travail attendu.', deadline: 'Échéance : à préciser', formats: 'PDF, JPG ou HEIC · 20 Mo maximum', privacy: 'Seul votre professeur voit votre copie', checklist: ['Une production lisible'], rubric: [{ label: 'Qualité de la réponse', points: '10 pts' }] };
      case 'synthesis':
        return { ...base, kicker: 'Synthèse', title: 'Trois choses', accent: 'à retenir.', meta: '2 minutes', items: [{ title: 'Premier point.', text: 'Ce qu’il faut retenir.' }], ctaTitle: 'Et maintenant ?', ctaText: 'Proposez la suite du travail.', ctaButton: 'Refaire le quiz', links: ['Fiche de révision', 'Revenir au début'] };
      default:
        return base;
    }
  }

  function createPage(kind) {
    return {
      id: uid('p'),
      kind,
      name: PAGE_TYPES[kind] ? PAGE_TYPES[kind].label : 'Page',
      minutes: kind === 'timeline' || kind === 'document' ? 10 : 5,
      note: '',
      data: defaultData(kind)
    };
  }

  function createSession(opts = {}) {
    const subject = opts.subject || 'histoire';
    const level = opts.level || '4e';
    const title = (opts.title || 'Nouvelle séance').trim() || 'Nouvelle séance';
    const template = TEMPLATES[opts.template] ? opts.template : 'decouverte';
    const pages = TEMPLATES[template].pages.map((kind) => createPage(kind));
    pages[0].data.kicker = `Séance · ${SUBJECTS[subject].label} · ${level}`;
    pages[0].data.title = title;
    pages[0].data.accent = '';
    pages[0].data.lede = 'Écrivez ici la question qui guide la séance.';
    return {
      id: uid('s'),
      title,
      subject,
      level,
      duration: opts.duration || 55,
      theme: opts.theme || '',
      coverWord: level.toUpperCase(),
      status: 'Brouillon',
      template,
      attachments: opts.attachments || [],
      createdAt: now(),
      updatedAt: now(),
      pages
    };
  }

  /* ------------------------------------------------------------
     Schémas de formulaire
     ------------------------------------------------------------ */
  const F = (k, label, type = 'text', extra = {}) => ({ k, label, type, ...extra });
  const SCHEMAS = {
    cover: {
      fields: [
        F('kicker', 'Surtitre', 'text', { placeholder: 'Séance 2 · Histoire · 4e' }),
        F('title', 'Titre — première ligne'),
        F('accent', 'Titre — seconde ligne (italique)'),
        F('lede', 'Accroche', 'textarea', { rows: 3 }),
        F('meta', 'Informations (une par ligne)', 'lines', { rows: 3, placeholder: '55 minutes\n4 documents\nClasse de 4e B' })
      ]
    },
    objectives: {
      fields: [
        F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'),
        F('meta', 'Durée affichée'), F('question', 'Question de la séance', 'textarea', { rows: 2 })
      ],
      lists: [
        { key: 'items', label: 'Objectifs', add: 'Ajouter un objectif', title: (o, i) => `Objectif ${i + 1}`, fields: [F('title', 'Intitulé'), F('text', 'Explication', 'textarea', { rows: 2 })] },
        { key: 'skills', label: 'Compétences (une par ligne)', lines: true, placeholder: 'Se repérer dans le temps\nAnalyser un document' }
      ]
    },
    timeline: {
      fields: [F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Indication')],
      lists: [{
        key: 'events', label: 'Événements', add: 'Ajouter un événement', title: (e, i) => `${e.year || 'Date'} · ${e.label || 'Événement'}`,
        fields: [F('year', 'Année', 'text', { half: true }), F('label', 'Étiquette', 'text', { half: true }), F('title', 'Titre de la fiche'), F('text', 'Explication', 'textarea', { rows: 3 }), F('quote', 'Citation (facultative)'), F('source', 'Source (facultative)'), F('tags', 'Mots-clés (séparés par des virgules)', 'csv')]
      }]
    },
    map: {
      fields: [F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Indication')],
      lists: [{
        key: 'places', label: 'Lieux', add: 'Ajouter un lieu', title: (p) => p.name || 'Lieu',
        fields: [F('name', 'Nom', 'text', { half: true }), F('kicker', 'Sous-titre', 'text', { half: true }), F('text', 'Description', 'textarea', { rows: 2 }), F('tag', 'Étiquette'), F('tags', 'Mots-clés (virgules)', 'csv'), F('question', 'Question'), F('fact', 'Repère / date')]
      }]
    },
    flipcards: {
      fields: [F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Indication')],
      lists: [{
        key: 'cards', label: 'Cartes', add: 'Ajouter une carte', title: (c) => c.title || 'Carte',
        fields: [F('title', 'Notion'), F('sub', 'Explication courte', 'textarea', { rows: 2 }), F('quote', 'Citation', 'textarea', { rows: 2 }), F('cite', 'Auteur, œuvre, date')]
      }]
    },
    document: {
      fields: [
        F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Source · date'),
        F('quote', 'Citation du document', 'textarea', { rows: 4 }),
        F('source', 'Référence complète', 'textarea', { rows: 2 }),
        F('stamp', 'Tampon (facultatif)'),
        F('vocab.term', 'Vocabulaire — mot'),
        F('vocab.def', 'Vocabulaire — définition', 'textarea', { rows: 2 }),
        F('takeaway', 'À retenir', 'textarea', { rows: 2 })
      ],
      lists: [{ key: 'points', label: 'Points d’observation', add: 'Ajouter un point', title: (p, i) => `Point ${i + 1}`, fields: [F('q', 'Question'), F('a', 'Réponse attendue', 'textarea', { rows: 2 })] }]
    },
    quiz: {
      fields: [F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Durée affichée')],
      custom: 'quiz'
    },
    deposit: {
      fields: [
        F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Échéance affichée'),
        F('promptTitle', 'Consigne — titre'), F('prompt', 'Consigne', 'textarea', { rows: 3 }),
        F('deadline', 'Échéance'), F('formats', 'Formats acceptés'), F('privacy', 'Confidentialité'),
        F('checklist', 'Checklist (une par ligne)', 'lines', { rows: 3 })
      ],
      lists: [{ key: 'rubric', label: 'Barème', add: 'Ajouter un critère', title: (r) => r.label || 'Critère', fields: [F('label', 'Critère'), F('points', 'Points', 'text', { half: true })] }]
    },
    synthesis: {
      fields: [F('kicker', 'Surtitre'), F('title', 'Titre'), F('accent', 'Fin du titre (italique)'), F('meta', 'Durée affichée'), F('ctaTitle', 'Encadré — titre'), F('ctaText', 'Encadré — texte', 'textarea', { rows: 3 }), F('ctaButton', 'Bouton principal'), F('links', 'Liens secondaires (un par ligne)', 'lines', { rows: 3 })],
      lists: [{ key: 'items', label: 'Points à retenir', add: 'Ajouter un point', title: (o, i) => `Point ${i + 1}`, fields: [F('title', 'Titre'), F('text', 'Explication', 'textarea', { rows: 2 })] }]
    }
  };

  /* ------------------------------------------------------------
     Persistance
     ------------------------------------------------------------ */
  let memory = null;
  function hasStorage() {
    try { const k = '__kleo_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; }
  }
  const canStore = hasStorage();

  function loadSessions() {
    if (memory) return clone(memory);
    if (!canStore) { memory = [seedSession()]; return clone(memory); }
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const seed = [seedSession()];
        localStorage.setItem(KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return [seedSession()];
      return parsed;
    } catch (e) {
      return [seedSession()];
    }
  }

  function saveSessions(list) {
    memory = clone(list);
    if (!canStore) return true;
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }

  function getSession(list, id) { return list.find((s) => s.id === id) || list[0]; }

  function encodeSession(session) {
    const json = JSON.stringify(session);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeSession(str) {
    try {
      const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const session = JSON.parse(new TextDecoder().decode(bytes));
      if (!session || !Array.isArray(session.pages)) return null;
      session.id = uid('s');
      session.updatedAt = now();
      return session;
    } catch (e) { return null; }
  }

  window.KleoData = {
    KEY, SUBJECTS, PAGE_TYPES, SCHEMAS, DEFAULT_PLACES, TEMPLATES, PROJECTS,
    uid, clone, now, seedSession, createSession, createPage, defaultData,
    loadSessions, saveSessions, getSession, encodeSession, decodeSession, canStore
  };
})();
