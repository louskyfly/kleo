/* ============================================================
   Kléo — maquette interactive
   Aucune dépendance. État, routage, contenu de la séance.
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');

  /* ------------------------------------------------------------
     Contenu de la séance
     ------------------------------------------------------------ */
  const PAGES = [
    { kind: 'cover', title: 'Couverture', icon: 'i-star', minutes: 2,
      note: "Accueillir la classe. Laisser 30 secondes pour observer la couverture et formuler une hypothèse : « Que va-t-on apprendre ? »" },
    { kind: 'objectives', title: 'Objectifs', icon: 'i-check', minutes: 3,
      note: "Lire les trois objectifs à voix haute. Faire reformuler l'objectif 2 par un élève. Annoncer l'activité finale : l'analyse de document." },
    { kind: 'timeline', title: 'Frise — 1748-1804', icon: 'i-timeline', minutes: 10,
      note: "Projeter la frise, demander aux élèves de repérer deux ruptures. Cliquer sur 1789 et faire lire la fiche. Ne pas dérouler les six événements : en choisir trois." },
    { kind: 'map', title: 'Carte des idées', icon: 'i-map', minutes: 8,
      note: "Faire situer Paris et Londres. Question : pourquoi les idées circulent-elles mieux dans certaines villes ? Introduire la notion d'espace public." },
    { kind: 'flipcards', title: 'Les idées des Lumières', icon: 'i-cards', minutes: 8,
      note: "Laisser les élèves retourner les cartes par deux. Consigne : reformuler chaque idée en une phrase, sans lire la citation." },
    { kind: 'document', title: 'Étude de document', icon: 'i-doc', minutes: 12,
      note: "Lecture silencieuse 2 min, puis trois prises de parole. Guider avec les quatre points d'observation. Le zoom sert à montrer la mention « privilèges »." },
    { kind: 'quiz', title: 'Quiz de vérification', icon: 'i-quiz', minutes: 6,
      note: "Répondre individuellement sur ardoise ou à main levée. Ne pas dévoiler la réponse avant d'avoir relevé les hypothèses." },
    { kind: 'deposit', title: 'Dépôt de devoir', icon: 'i-upload', minutes: 4,
      note: "Expliquer le format attendu : un paragraphe de 10 lignes, avec une citation du texte. Rappeler l'échéance et le dépôt depuis Fichiers sur iPad." },
    { kind: 'synthesis', title: 'Synthèse', icon: 'i-check', minutes: 2,
      note: "Faire dire les trois points à retenir sans le support. Terminer par la question de transition vers la séance suivante." }
  ];

  const EVENTS = [
    { year: '1748', label: "De l'esprit des lois", title: 'Montesquieu sépare les pouvoirs',
      text: "Le philosophe critique la monarchie absolue et propose de distinguer le pouvoir législatif, exécutif et judiciaire pour éviter le despotisme.",
      source: 'Montesquieu, De l’esprit des lois, 1748',
      quote: "« Il faut que, par la disposition des choses, le pouvoir arrête le pouvoir. »" },
    { year: '1751', label: "L'Encyclopédie", title: 'Diderot et d’Alembert publient le premier volume',
      text: "L'Encyclopédie rassemble et diffuse les savoirs nouveaux. Elle devient le symbole de l'esprit des Lumières et un outil de critique de l'ordre établi.",
      source: 'Encyclopédie, tome I, 1751',
      quote: "« Une encyclopédie doit changer la façon commune de penser. »" },
    { year: '1762', label: 'Du contrat social', title: 'Rousseau pense la souveraineté du peuple',
      text: "Rousseau affirme que la légitimité politique vient du peuple. La volonté générale fonde la loi, et non le droit divin du roi.",
      source: 'Rousseau, Du contrat social, 1762',
      quote: "« L’homme est né libre, et partout il est dans les fers. »" },
    { year: '1776', label: 'Indépendance américaine', title: 'Les colonies proclament leurs droits',
      text: "La Déclaration d'indépendance des États-Unis reprend les idées de liberté et d'égalité. Elle inspire les révolutionnaires français.",
      source: 'Déclaration d’indépendance des États-Unis, 4 juillet 1776',
      quote: "« Tous les hommes sont créés égaux. »" },
    { year: '1789', label: 'Révolution française', title: 'Les droits de l’homme sont proclamés',
      text: "Le 26 août 1789, l'Assemblée nationale adopte la Déclaration des droits de l'homme et du citoyen. Elle pose la liberté, l'égalité et la souveraineté nationale.",
      source: 'Déclaration des droits de l’homme et du citoyen, 1789',
      quote: "« Les hommes naissent et demeurent libres et égaux en droits. »" },
    { year: '1804', label: 'Code civil', title: 'Napoléon fixe un droit commun',
      text: "Le Code civil unifie le droit français. Il conserve certaines conquêtes révolutionnaires, notamment l'égalité civile, mais renforce l'autorité du pouvoir.",
      source: 'Code civil des Français, 1804',
      quote: "« Tout Français jouira des droits civils. »" }
  ];

  const EVENT_TAGS = {
    '1748': ['Séparation des pouvoirs', 'Critique de l’absolutisme'],
    '1751': ['Diffusion des savoirs', 'Esprit critique'],
    '1762': ['Souveraineté du peuple', 'Volonté générale'],
    '1776': ['Liberté', 'Égalité'],
    '1789': ['Droits naturels', 'Souveraineté nationale', 'Fin des privilèges'],
    '1804': ['Droit commun', 'Héritage révolutionnaire']
  };

  const PLACES = [
    { name: 'Paris', x: 222, y: 272, kicker: 'Capitale des Lumières',
      text: "Salons, académies, cafés : les idées se discutent et se diffusent. L'Encyclopédie y est publiée malgré la censure.",
      tag: 'Rayonnement intellectuel', tags: ['Salons', 'Académies', 'Censure'],
      question: 'Pourquoi la censure royale ne suffit-elle pas à arrêter l’Encyclopédie ?',
      fact: '1751 · Premier volume de l’Encyclopédie' },
    { name: 'Londres', x: 208, y: 241, kicker: 'Monarchie parlementaire',
      text: "Le roi gouverne avec un Parlement. Ce modèle politique nourrit la réflexion de Montesquieu et de Voltaire.",
      tag: 'Modèle politique', tags: ['Parlement', 'Libertés', 'Presse'],
      question: 'En quoi le Parlement limite-t-il le pouvoir du roi ?',
      fact: '1688 · Déclaration des droits' },
    { name: 'Amsterdam', x: 243, y: 235, kicker: 'Imprimerie et tolérance',
      text: "Les Provinces-Unies accueillent les livres interdits en France. Les idées circulent par le commerce et l'édition.",
      tag: 'Circulation des livres', tags: ['Édition', 'Commerce', 'Tolérance'],
      question: 'Pourquoi les livres interdits sont-ils imprimés ici ?',
      fact: '1685 · Refuge des huguenots' },
    { name: 'Ferney', x: 248, y: 302, kicker: 'Voltaire en retrait',
      text: "Installé près de Genève, Voltaire écrit, correspond avec toute l'Europe et intervient dans les affaires judiciaires.",
      tag: 'Réseaux épistolaires', tags: ['Correspondance', 'Engagement'],
      question: 'Comment Voltaire intervient-il dans l’espace public européen ?',
      fact: '1763 · Traité sur la tolérance' },
    { name: 'Vienne', x: 324, y: 280, kicker: 'Despote éclairé',
      text: "Joseph II réforme l'Empire : tolérance religieuse, abolition du servage. Les Lumières inspirent aussi les souverains.",
      tag: 'Réformes', tags: ['Tolérance', 'Réformes', 'Empire'],
      question: 'Peut-on être à la fois despote et éclairé ?',
      fact: '1781 · Patente de tolérance' }
  ];

  const IDEAS = [
    { num: '01', title: 'La raison', sub: 'Penser par soi-même plutôt que répéter.', quote: "« Ose penser par toi-même. »", cite: 'Kant, Qu’est-ce que les Lumières ?, 1784' },
    { num: '02', title: 'La tolérance', sub: 'Accepter les croyances et les opinions d’autrui.', quote: "« Nous sommes tous pétris de faiblesse et d’erreurs ; pardonnons-nous réciproquement nos sottises. »", cite: 'Voltaire, Traité sur la tolérance, 1763' },
    { num: '03', title: 'La séparation des pouvoirs', sub: 'Empêcher un seul pouvoir de tout décider.', quote: "« Il faut que, par la disposition des choses, le pouvoir arrête le pouvoir. »", cite: 'Montesquieu, De l’esprit des lois, 1748' },
    { num: '04', title: 'La souveraineté du peuple', sub: 'La loi vient du peuple, non du roi.', quote: "« L’homme est né libre, et partout il est dans les fers. »", cite: 'Rousseau, Du contrat social, 1762' }
  ];

  const QUIZ = [
    { q: 'Quel principe Montesquieu défend-il dans De l’esprit des lois ?',
      options: ['La séparation des pouvoirs', 'Le droit divin des rois', 'L’égalité des fortunes'],
      correct: 0,
      good: 'Oui. Montesquieu veut séparer les pouvoirs pour empêcher le despotisme.',
      bad: 'Pas tout à fait. Montesquieu critique la monarchie absolue et propose de séparer les pouvoirs.' },
    { q: 'En 1789, quel texte proclame les droits naturels et imprescriptibles ?',
      options: ['Le Code civil', 'La Déclaration des droits de l’homme et du citoyen', 'Du contrat social'],
      correct: 1,
      good: 'Exact. Adoptée le 26 août 1789, elle fonde la liberté et l’égalité devant la loi.',
      bad: 'Non : le Code civil date de 1804. En 1789, c’est la Déclaration des droits de l’homme et du citoyen.' },
    { q: 'Qui dirige la publication de l’Encyclopédie ?',
      options: ['Voltaire et Rousseau', 'Diderot et d’Alembert', 'Montesquieu et Kant'],
      correct: 1,
      good: 'Bien vu. Diderot et d’Alembert en sont les principaux maîtres d’œuvre.',
      bad: 'Ce sont Diderot et d’Alembert qui dirigent l’Encyclopédie à partir de 1751.' }
  ];

  const FILES = [
    { name: 'Chapitre_Lumieres_v3.docx', size: '48 Ko', type: 'doc' },
    { name: 'extrait_Encyclopedie.pdf', size: '612 Ko', type: 'pdf' },
    { name: 'carte_europe_1750.jpg', size: '2,4 Mo', type: 'img' },
    { name: 'evaluation_Lumieres.docx', size: '31 Ko', type: 'doc' }
  ];

  const FOOT = '<span class="kl">kléo<b>.</b></span><span>Histoire · 4e · Lumières et Révolution</span>';

  const head = (kicker, title, meta = '') => `
    <header class="slide-head">
      <div><span class="slide-kicker">${kicker}</span><h2 class="slide-title">${title}</h2></div>
      ${meta ? `<p class="slide-head-meta">${meta}</p>` : ''}
    </header>`;

  const foot = (i, label = '') => `
    <footer class="slide-foot">${FOOT}<span>${label || pad(i + 1)}</span></footer>`;

  /* ------------------------------------------------------------
     Slides
     ------------------------------------------------------------ */
  const SLIDES = {
    cover(i) {
      return `
      <article class="slide slide--cover" data-page="${i}" aria-label="Couverture de la séance">
        <div class="cover-grid">
          <div>
            <p class="cover-series">Séance 2 · Histoire · 4e</p>
            <h1 class="cover-h1">Des Lumières<br>à la <em>Révolution</em></h1>
            <p class="cover-lede">Comment les idées nouvelles du XVIII<sup>e</sup> siècle bouleversent-elles l’ordre politique et social en Europe ?</p>
            <div class="cover-actions">
              <button class="btn-slide" data-page-goto="1">Commencer <svg class="ico"><use href="#i-arrow-right"/></svg></button>
            </div>
            <div class="cover-meta">
              <span><svg class="ico"><use href="#i-clock"/></svg>55 minutes</span>
              <span><svg class="ico"><use href="#i-doc"/></svg>4 documents</span>
              <span><svg class="ico"><use href="#i-users"/></svg>Classe de 4e B</span>
            </div>
          </div>
          <div class="cover-art" aria-hidden="true">
            <span class="orbit"></span><span class="orbit"></span><span class="orbit"></span>
            <span class="axis"></span><span class="sun"></span>
            <span class="year-num">1750 — 1815</span>
          </div>
        </div>
        ${foot(i, 'Séance 2 / 9')}
      </article>`;
    },

    objectives(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Objectifs de la séance">
        ${head('Ce que vous allez apprendre', 'Trois objectifs, <em>une enquête</em>.', '3 minutes')}
        <div class="obj-grid">
          <div class="obj-card"><span class="obj-num">1</span><h3>Situer les idées des Lumières</h3><p>Replacer les grands textes et les grandes dates de 1748 à 1804 sur une frise.</p></div>
          <div class="obj-card"><span class="obj-num">2</span><h3>Expliquer une rupture</h3><p>Comprendre comment les Lumières préparent la Révolution française.</p></div>
          <div class="obj-card"><span class="obj-num">3</span><h3>Analyser un document</h3><p>Prélever des informations dans un texte de 1789 et les mettre en relation.</p></div>
        </div>
        <div class="obj-foot">
          <span class="lbl">Compétences</span>
          <span class="skill">Se repérer dans le temps</span>
          <span class="skill">Analyser un document</span>
          <span class="skill">Argumenter</span>
        </div>
        <p class="obj-quote"><strong>La question de la séance :</strong> en quoi les Lumières sont-elles une révolution des idées avant d’être une révolution politique ?</p>
        ${foot(i)}
      </article>`;
    },

    timeline(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Frise chronologique interactive">
        ${head('Repères chronologiques', 'Les idées neuves, <em>de 1748 à 1804</em>.', 'Cliquez sur une date')}
        <div class="tl-wrap">
          <div class="timeline">
            <div class="tl-line"></div>
            <div class="tl-events" role="group" aria-label="Événements">
              ${EVENTS.map((e, k) => `
                <button class="tl-event${k === 4 ? ' is-on' : ''}" data-event="${k}" aria-pressed="${k === 4}">
                  <span class="dot"></span><span class="tl-year">${e.year}</span><span class="tl-label">${e.label}</span>
                </button>`).join('')}
            </div>
          </div>
          <div class="tl-detail" id="tl-detail" aria-live="polite"></div>
        </div>
        ${foot(i)}
      </article>`;
    },

    map(i) {
      const pins = PLACES.map((p, k) => `
        <g class="map-pin${k === 0 ? ' is-on' : ''}" data-place="${k}" role="button" tabindex="0" aria-label="${p.name}">
          <circle class="pin-bg" cx="${p.x}" cy="${p.y}" r="10.5"></circle>
          <text x="${p.x}" y="${p.y}">${k + 1}</text>
        </g>`).join('');
      return `
      <article class="slide" data-page="${i}" aria-label="Carte interactive des idées en Europe">
        ${head('Géographie des Lumières', 'Où circulent <em>les idées</em> ?', 'Europe, vers 1750')}
        <div class="map-grid">
          <div class="map-panel">
            <span class="map-title">Europe · foyers et circulations</span>
            <img class="map-img" src="assets/europe.svg" alt="Carte simplifiée de l’Europe">
            <svg class="map-overlay" viewBox="0 0 600 430" role="group" aria-label="Cinq lieux cliquables">
              <text class="map-label" x="200" y="205">ANGLETERRE</text>
              <text class="map-label" x="202" y="312">FRANCE</text>
              <text class="map-label" x="160" y="360">ESPAGNE</text>
              <text class="map-label" x="298" y="343">ITALIE</text>
              <path d="M222 268C216 255 211 247 209 242" fill="none" stroke="#B8542F" stroke-width="1.4" stroke-dasharray="4 5" opacity=".5"/>
              <path d="M224 268C231 255 238 244 243 236" fill="none" stroke="#B8542F" stroke-width="1.4" stroke-dasharray="4 5" opacity=".45"/>
              <path d="M224 276C232 286 240 295 246 300" fill="none" stroke="#B8542F" stroke-width="1.4" stroke-dasharray="4 5" opacity=".45"/>
              <path d="M250 300C278 294 304 287 320 281" fill="none" stroke="#B8542F" stroke-width="1.4" stroke-dasharray="4 5" opacity=".45"/>
              ${pins}
            </svg>
          </div>
          <div class="map-detail">
            <div class="place-list" role="group" aria-label="Lieux">
              ${PLACES.map((p, k) => `<button class="place-chip${k === 0 ? ' is-on' : ''}" data-place="${k}">${p.name}</button>`).join('')}
            </div>
            <div class="place-card" id="place-card" aria-live="polite"></div>
          </div>
        </div>
        ${foot(i)}
      </article>`;
    },

    flipcards(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Cartes à retourner sur les idées des Lumières">
        ${head('Les quatre idées', 'Retournez les cartes <em>pour comprendre</em>.', 'Touchez une carte')}
        <div class="cards-grid">
          ${IDEAS.map((idea, k) => `
            <button class="flip" data-flip="${k}" aria-pressed="false" aria-label="Carte ${idea.title}">
              <span class="flip-inner">
                <span class="flip-face flip-front">
                  <span class="fc-num">${idea.num}</span>
                  <span class="fc-mid"><h3>${idea.title}</h3><span class="fc-sub">${idea.sub}</span></span>
                  <span class="fc-hint"><svg class="ico"><use href="#i-cards"/></svg>Toucher pour retourner</span>
                </span>
                <span class="flip-face flip-back">
                  <blockquote>${idea.quote}</blockquote>
                  <cite>${idea.cite}</cite>
                </span>
              </span>
            </button>`).join('')}
        </div>
        ${foot(i)}
      </article>`;
    },

    document(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Étude du document de Sieyès">
        ${head('Étude de document', 'Qu’est-ce que <em>le tiers état</em> ?', 'Sieyès · janvier 1789')}
        <div class="doc-grid">
          <div class="doc-sheet">
            <span class="doc-ref">Pièce 1 · Texte imprimé</span>
            <span class="doc-stamp">Archives · 1789</span>
            <blockquote>Qu’est-ce que le tiers état ? Tout. Qu’a-t-il été jusqu’à présent dans l’ordre politique ? Rien. Que demande-t-il ? À être quelque chose.</blockquote>
            <p class="doc-src">Emmanuel-Joseph Sieyès, <em>Qu’est-ce que le tiers état ?</em>, janvier 1789.</p>
          </div>
          <div class="doc-side">
            <h3>Ce qu’il faut observer</h3>
            <ul class="doc-points">
              <li><span class="n">1</span><span><strong>Qui parle ?</strong> Un membre du clergé, élu du tiers état.</span></li>
              <li><span class="n">2</span><span><strong>Que dénonce-t-il ?</strong> Le poids des privilèges et l’absence de représentation.</span></li>
              <li><span class="n">3</span><span><strong>Que demande-t-il ?</strong> Une place politique pour les 98 % de la population.</span></li>
              <li><span class="n">4</span><span><strong>Pourquoi est-ce une rupture ?</strong> La souveraineté n’est plus celle du roi seul.</span></li>
            </ul>
            <div class="doc-vocab">
              <span class="dv-label">Vocabulaire</span>
              <p><strong>Tiers état</strong> — l’immense majorité de la population, qui ne bénéficie d’aucun privilège.</p>
            </div>
            <div class="doc-actions">
              <button class="btn-slide" data-modal="zoom-doc" style="min-height:2.6em;font-size:.78em;padding:0 1em;background:var(--ink);color:var(--paper)">Agrandir le document</button>
              <button class="btn-slide" data-toast="Source : Bibliothèque nationale de France, Gallica." style="min-height:2.6em;font-size:.78em;padding:0 1em;background:transparent;color:var(--ink-2);border:1px solid var(--line)">Voir la source</button>
            </div>
            <div class="doc-takeaway">
              <span>À retenir</span>
              <p>Avec Sieyès, le tiers état ne demande plus une place : il affirme qu’il <em>est</em> la nation.</p>
            </div>
          </div>
        </div>
        ${foot(i)}
      </article>`;
    },

    quiz(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Quiz de vérification">
        ${head('Vérifions', 'Trois questions <em>pour ancrer</em>.', '6 minutes')}
        <div class="quiz-wrap" id="quiz-area"></div>
        ${foot(i)}
      </article>`;
    },

    deposit(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Dépôt du travail de l’élève">
        ${head('À rendre', 'Votre analyse <em>du document</em>.', 'Avant vendredi 20 h')}
        <div class="deposit-grid">
          <div class="deposit-info">
            <h3>Un paragraphe de 10 lignes, une citation.</h3>
            <p>Expliquez en quoi le texte de Sieyès annonce une rupture politique. Appuyez-vous sur au moins une phrase du document.</p>
            <ul class="deposit-facts">
              <li><svg class="ico"><use href="#i-clock"/></svg>Échéance : vendredi 28 novembre, 20 h</li>
              <li><svg class="ico"><use href="#i-doc"/></svg>PDF, JPG ou HEIC · 20 Mo maximum</li>
              <li><svg class="ico"><use href="#i-lock"/></svg>Seul votre professeur voit votre copie</li>
            </ul>
            <div class="deposit-check">
              <span class="dc-title">Votre copie doit contenir</span>
              <ul>
                <li><i></i>Une phrase qui répond à la question</li>
                <li><i></i>Une citation entre guillemets</li>
                <li><i></i>Une explication personnelle</li>
              </ul>
            </div>
            <div class="deposit-rubric">
              <span class="dc-title">Ce qui est évalué</span>
              <ul>
                <li><span>Réponse à la question</span><b>4 pts</b></li>
                <li><span>Citation du texte</span><b>3 pts</b></li>
                <li><span>Explication personnelle</span><b>3 pts</b></li>
              </ul>
            </div>
          </div>
          <label class="drop-slide" id="drop-slide" tabindex="0">
            <input type="file" id="deposit-input" hidden accept=".pdf,.jpg,.jpeg,.png,.heic">
            <span class="big-ico"><svg class="ico"><use href="#i-upload"/></svg></span>
            <strong id="drop-title">Déposer depuis l’iPad</strong>
            <small id="drop-sub">Fichiers, Photos ou scan · 20 Mo</small>
            <span class="btn-slide" id="drop-btn">Choisir un fichier</span>
          </label>
        </div>
        ${foot(i)}
      </article>`;
    },

    synthesis(i) {
      return `
      <article class="slide" data-page="${i}" aria-label="Synthèse de la séance">
        ${head('Synthèse', 'Trois choses <em>à retenir</em>.', '2 minutes')}
        <div class="synth-grid">
          <div class="synth-list">
            <div class="synth-item"><span class="n">1</span><div><strong>Les Lumières sont un mouvement européen.</strong><p>Des philosophes confrontent les savoirs, la religion et le pouvoir absolu à la raison.</p></div></div>
            <div class="synth-item"><span class="n">2</span><div><strong>Les idées circulent et se diffusent.</strong><p>Salons, correspondances, livres imprimés à l’étranger : un espace public se forme.</p></div></div>
            <div class="synth-item"><span class="n">3</span><div><strong>1789 transforme les idées en droits.</strong><p>La Déclaration des droits de l’homme et du citoyen inscrit la liberté et l’égalité dans la loi.</p></div></div>
          </div>
          <div class="synth-cta">
            <h3>Et maintenant ?</h3>
            <p>Relisez la frise, puis testez-vous. La séance suivante portera sur les transformations politiques de 1789 à 1799.</p>
            <button class="btn-slide" data-page-goto="6">Refaire le quiz <svg class="ico"><use href="#i-arrow-right"/></svg></button>
            <div class="synth-links">
              <button data-toast="Fiche de révision ajoutée à vos documents.">Fiche de révision</button>
              <button data-page-goto="0">Revenir au début</button>
              <button data-modal="publish">Partager la séance</button>
            </div>
          </div>
        </div>
        ${foot(i)}
      </article>`;
    }
  };

  const slideHTML = (page, i) => SLIDES[page.kind](i);

  /* ------------------------------------------------------------
     État
     ------------------------------------------------------------ */
  const state = {
    screen: 'library',
    viewer: false,
    page: 0,
    viewerReturn: 'library',
    quiz: 0,
    answered: false,
    event: 4,
    place: 0,
    files: FILES.slice(),
    genTimers: [],
    timer: null,
    seconds: 0
  };

  /* ------------------------------------------------------------
     Rendu de la séance
     ------------------------------------------------------------ */
  function buildDeck() {
    $('#deck').innerHTML = PAGES.map((p, i) =>
      `<div class="slide-frame" data-frame="${i}">${slideHTML(p, i)}</div>`).join('');
    $('#v-dots').innerHTML = PAGES.map((p, i) =>
      `<button data-dot="${i}" aria-label="Aller à la page ${i + 1} : ${p.title}"></button>`).join('');
    $('#summary-list').innerHTML = PAGES.map((p, i) => `
      <li><button class="summary-item" data-page-goto="${i}">
        <span class="n">${pad(i + 1)}</span>
        <span class="t">${p.title}</span>
        <span class="d">${p.minutes} min</span>
      </button></li>`).join('');
    renderTimelineDetail();
    renderPlace();
    renderQuiz();
    renderNotes();
  }

  function renderTimelineDetail() {
    const e = EVENTS[state.event];
    const el = $('#tl-detail');
    if (!el) return;
    el.innerHTML = `
      <span class="tl-big-year">${e.year}</span>
      <div class="tl-body"><h3>${e.title}</h3><p>${e.text}</p>
        <div class="tl-tags">${(EVENT_TAGS[e.year] || []).map((t) => `<span>${t}</span>`).join('')}</div>
      </div>
      <div class="tl-quote"><blockquote>${e.quote}</blockquote><cite>${e.source}</cite></div>`;
    $$('.tl-event').forEach((b, k) => {
      b.classList.toggle('is-on', k === state.event);
      b.setAttribute('aria-pressed', String(k === state.event));
    });
  }

  function renderPlace() {
    const p = PLACES[state.place];
    const card = $('#place-card');
    if (!card) return;
    card.innerHTML = `
      <span class="pc-kicker">${p.kicker}</span>
      <h3>${p.name}</h3>
      <p>${p.text}</p>
      <div class="place-tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      <div class="pc-question"><span>Question</span><p>${p.question}</p></div>
      <button class="pc-action" data-toast="Document associé : à ouvrir dans la v1.">Voir le document associé <svg class="ico"><use href="#i-arrow-right"/></svg></button>
      <span class="pc-fact"><svg class="ico"><use href="#i-clock"/></svg>${p.fact}</span>
      <span class="pc-foot"><svg class="ico"><use href="#i-pin"/></svg>${p.tag}</span>`;
    card.dataset.num = pad(state.place + 1);
    $$('.map-pin').forEach((g, k) => g.classList.toggle('is-on', k === state.place));
    $$('.place-chip').forEach((b, k) => {
      b.classList.toggle('is-on', k === state.place);
      b.setAttribute('aria-pressed', String(k === state.place));
    });
  }

  function renderQuiz() {
    const area = $('#quiz-area');
    if (!area) return;
    const q = QUIZ[state.quiz];
    area.innerHTML = `
      <div class="quiz-meta">
        <span class="slide-kicker" style="margin:0">Question ${state.quiz + 1} sur ${QUIZ.length}</span>
        <div class="quiz-progress" aria-hidden="true">${QUIZ.map((_, k) => `<i class="${k <= state.quiz ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <h3 class="quiz-q">${q.q}</h3>
      <div class="quiz-options" role="group" aria-label="Réponses">
        ${q.options.map((o, k) => `
          <button class="quiz-opt" data-quiz-opt="${k}"${state.answered ? ' disabled' : ''}>
            <span class="letter">${'ABC'[k]}</span><span>${o}</span>
          </button>`).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>
      <button class="btn-slide quiz-next" id="quiz-next" data-quiz-next>${state.quiz < QUIZ.length - 1 ? 'Question suivante' : 'Voir la synthèse'} <svg class="ico"><use href="#i-arrow-right"/></svg></button>`;
    if (state.answered) paintQuizAnswer(state.lastAnswer);
  }

  function paintQuizAnswer(index) {
    const q = QUIZ[state.quiz];
    const feedback = $('#quiz-feedback');
    if (!feedback) return;
    $$('.quiz-opt').forEach((b, k) => {
      b.disabled = true;
      if (k === q.correct) b.classList.add('is-correct');
      if (k === index && index !== q.correct) b.classList.add('is-wrong');
      if (k === index) b.setAttribute('aria-pressed', 'true');
    });
    const good = index === q.correct;
    feedback.className = `quiz-feedback is-on ${good ? 'good' : 'bad'}`;
    feedback.innerHTML = `<svg class="ico"><use href="#${good ? 'i-check' : 'i-close'}"/></svg><div><strong>${good ? 'Bonne réponse' : 'Réponse incorrecte'}</strong>${good ? q.good : q.bad}</div>`;
    $('#quiz-next').classList.add('is-on');
  }

  function renderNotes() {
    const p = PAGES[state.page];
    const el = $('#notes-content');
    if (!el) return;
    el.innerHTML = `<h3>${pad(state.page + 1)} · ${p.title}</h3><p>${p.note}</p><p class="meta tiny">Durée conseillée : ${p.minutes} min</p>`;
  }

  /* ------------------------------------------------------------
     Écrans & routage
     ------------------------------------------------------------ */
  const SCREENS = ['library', 'import', 'generate', 'editor'];

  function showScreen(name, opts = {}) {
    state.screen = name;
    document.body.classList.toggle('is-editing', name === 'editor');
    SCREENS.forEach((s) => {
      const el = $('#screen-' + s);
      if (el) el.classList.toggle('is-active', s === name);
    });
    $$('.rail-link').forEach((a) => {
      a.classList.toggle('is-active', (a.getAttribute('href') || '').includes('/' + name));
    });
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (name === 'editor') selectPage(state.page, true);
    if (name === 'generate') startGeneration();
  }

  function go(name) {
    const target = '#/' + name;
    if (location.hash === target) route();
    else location.hash = target;
  }

  function parseHash() {
    return location.hash.replace(/^#\/?/, '') || 'library';
  }

  function route() {
    const [name, arg] = parseHash().split('/');
    if (name === 'viewer') {
      openViewer(Number(arg) || 0, { fromHash: true });
      return;
    }
    closeViewer({ silent: true });
    if (SCREENS.includes(name)) showScreen(name);
    else showScreen('library');
  }

  /* ------------------------------------------------------------
     Mode séance
     ------------------------------------------------------------ */
  function openViewer(start = 0, opts = {}) {
    if (!state.viewer) {
      state.viewer = true;
      state.viewerReturn = SCREENS.includes(state.screen) ? state.screen : 'library';
      $('#screen-viewer').hidden = false;
      document.body.style.overflow = 'hidden';
    }
    setPage(start);
    if (!opts.fromHash) {
      const target = '#/viewer/' + start;
      if (location.hash !== target) location.hash = target;
    }
  }

  function closeViewer(opts = {}) {
    if (!state.viewer) return;
    state.viewer = false;
    $('#screen-viewer').hidden = true;
    document.body.style.overflow = '';
    closeDrawer();
    if (!opts.silent) {
      const target = '#/' + state.viewerReturn;
      if (location.hash !== target) location.hash = target;
      else showScreen(state.viewerReturn);
    }
  }

  function setPage(index) {
    const i = Math.max(0, Math.min(PAGES.length - 1, Number(index) || 0));
    state.page = i;
    $$('.slide-frame').forEach((f, k) => f.classList.toggle('is-active', k === i));
    $$('#v-dots button').forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      b.setAttribute('aria-current', k === i ? 'page' : 'false');
    });
    $$('.summary-item').forEach((b, k) => b.classList.toggle('is-on', k === i));
    $('#v-count').textContent = `${pad(i + 1)} / ${pad(PAGES.length)}`;
    $('#v-bar').style.width = `${((i + 1) / PAGES.length) * 100}%`;
    renderNotes();
    const active = $('.slide-frame.is-active');
    if (active) active.scrollTop = 0;
  }

  function step(delta) {
    const next = state.page + delta;
    if (next < 0 || next >= PAGES.length) return;
    setPage(next);
    const target = '#/viewer/' + next;
    if (location.hash !== target) history.replaceState(null, '', target);
  }

  /* ------------------------------------------------------------
     Éditeur
     ------------------------------------------------------------ */
  function renderPageList() {
    $('#page-list').innerHTML = PAGES.map((p, i) => `
      <li><button class="page-item" data-editor-page="${i}">
        <span class="page-num">${pad(i + 1)}</span>
        <span class="page-ico"><svg class="ico"><use href="#${p.icon}"/></svg></span>
        <span class="page-txt"><strong>${p.title}</strong><small>${p.minutes} min</small></span>
        <span class="page-drag"><svg class="ico"><use href="#i-drag"/></svg></span>
      </button></li>`).join('');
  }

  function selectPage(index, initial = false) {
    const i = Math.max(0, Math.min(PAGES.length - 1, index));
    state.page = i;
    $$('.page-item').forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      b.setAttribute('aria-current', k === i ? 'page' : 'false');
    });
    const p = PAGES[i];
    const canvas = $('#canvas-slide');
    canvas.innerHTML = slideHTML(p, i);
    $('#canvas-label').textContent = `Page ${i + 1} · ${p.title}`;
    $('#block-type').textContent = p.title;
    if (!initial) canvas.animate?.([{ opacity: .55 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }

  /* ------------------------------------------------------------
     Import
     ------------------------------------------------------------ */
  const iconFor = (type) => type === 'img' ? 'i-image' : type === 'link' ? 'i-link' : type === 'pdf' ? 'i-doc' : 'i-doc';

  function fileMeta(f) {
    return f.type === 'link' ? 'Lien externe' : `${f.size} · prêt`;
  }

  function renderFiles() {
    const list = $('#file-list');
    if (!list) return;
    list.innerHTML = state.files.map((f, i) => `
      <li class="file-item">
        <span class="file-icon ${f.type}"><svg class="ico"><use href="#${iconFor(f.type)}"/></svg></span>
        <span style="flex:1;min-width:0">
          <span class="file-name">${f.name}</span>
          <span class="file-meta">${fileMeta(f)}</span>
        </span>
        <span class="file-ok"><svg class="ico"><use href="#i-check"/></svg></span>
        <button class="file-remove" data-remove-file="${i}" aria-label="Retirer ${f.name}"><svg class="ico"><use href="#i-close"/></svg></button>
      </li>`).join('');
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    incoming.forEach((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      const type = ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext) ? 'img' : ext === 'pdf' ? 'pdf' : 'doc';
      const kb = f.size ? (f.size > 1e6 ? (f.size / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(f.size / 1024)) + ' Ko') : '—';
      state.files.push({ name: f.name, size: kb, type });
    });
    renderFiles();
    toast(`${incoming.length} document${incoming.length > 1 ? 's' : ''} ajouté${incoming.length > 1 ? 's' : ''}.`);
  }

  /* ------------------------------------------------------------
     Génération
     ------------------------------------------------------------ */
  function startGeneration() {
    clearGeneration();
    const steps = $$('#gen-steps li');
    steps.forEach((li) => li.classList.remove('is-done', 'is-active'));
    $('#gen-bar').style.width = '4%';
    $('#gen-note').textContent = 'Cela prend généralement une vingtaine de secondes.';
    const delays = [350, 1100, 1900, 2750, 3600];
    const widths = [16, 36, 58, 80, 100];
    delays.forEach((d, k) => {
      state.genTimers.push(setTimeout(() => {
        steps.forEach((li, j) => {
          li.classList.toggle('is-done', j < k);
          li.classList.toggle('is-active', j === k);
        });
        if (k === delays.length - 1) steps.forEach((li) => { li.classList.add('is-done'); li.classList.remove('is-active'); });
        $('#gen-bar').style.width = widths[k] + '%';
        if (k === delays.length - 1) {
          $('#gen-note').textContent = 'Séance prête. Ouverture de l’éditeur…';
          state.genTimers.push(setTimeout(() => {
            state.page = 0;
            go('editor');
          }, 700));
        }
      }, d));
    });
  }

  function clearGeneration() {
    state.genTimers.forEach(clearTimeout);
    state.genTimers = [];
  }

  /* ------------------------------------------------------------
     Modales & toast
     ------------------------------------------------------------ */
  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
  }

  function qrSVG() {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const N = 25;
    let cells = '';
    const finders = [[0, 0], [N - 7, 0], [0, N - 7]];
    const inFinder = (x, y) => finders.some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y)) continue;
        if (rnd() > .58) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    }
    let f = '';
    finders.forEach(([x, y]) => {
      f += `<rect x="${x}" y="${y}" width="7" height="7" fill="none" stroke="#152420" stroke-width="1.1"/>`;
      f += `<rect x="${x + 1.6}" y="${y + 1.6}" width="3.8" height="3.8" fill="#152420"/>`;
    });
    return `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" fill="#152420">${cells}${f}</svg>`;
  }

  function openModal(kind) {
    const root = $('#modal-root');
    if (kind === 'publish') {
      root.innerHTML = `
      <div class="modal-root" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
          <div class="modal-head">
            <div><h2 id="m-title">Publier la séance</h2><p>Un lien, un QR, et la classe peut commencer.</p></div>
            <button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="share-link"><span>kleo.app/s/lumieres-4e</span><button class="btn btn-soft btn-sm" data-copy="kleo.app/s/lumieres-4e"><svg class="ico"><use href="#i-copy"/></svg>Copier</button></div>
            <div class="share-row">
              <div class="qr">${qrSVG()}</div>
              <div><strong>Projeter ou faire scanner</strong><p>Le QR ouvre la séance sur les iPad des élèves, sans installation. Le mode séance démarre à la première page.</p></div>
            </div>
            <div class="share-options">
              <div class="share-opt"><div><span>Accès élève</span><small>Lecture, quiz et dépôt de devoir</small></div><label class="switch"><input type="checkbox" checked aria-label="Accès élève"><span></span></label></div>
              <div class="share-opt"><div><span>Notes du professeur</span><small>Visibles uniquement par vous</small></div><label class="switch"><input type="checkbox" checked aria-label="Notes du professeur"><span></span></label></div>
              <div class="share-opt"><div><span>Version PDF</span><small>Pour impression ou ENT</small></div><button class="btn btn-soft btn-sm" data-toast="Export PDF simulé dans la maquette."><svg class="ico"><use href="#i-download"/></svg>PDF</button></div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" data-close-modal>Plus tard</button>
            <button class="btn btn-primary" data-close-modal data-toast="Séance publiée. Le lien est prêt à être partagé.">Publier maintenant</button>
          </div>
        </div>
      </div>`;
    } else if (kind === 'zoom-doc') {
      root.innerHTML = `
      <div class="modal-root" data-backdrop>
        <div class="modal modal-doc" role="dialog" aria-modal="true" aria-labelledby="m-doc">
          <div class="modal-head">
            <div><h2 id="m-doc">Qu’est-ce que le tiers état ?</h2><p>Sieyès, janvier 1789 · extrait</p></div>
            <button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="doc-zoom">
              <span class="doc-stamp">Archives · 1789</span>
              <blockquote>Qu’est-ce que le tiers état ? Tout. Qu’a-t-il été jusqu’à présent dans l’ordre politique ? Rien. Que demande-t-il ? À être quelque chose.</blockquote>
              <p class="doc-src">Emmanuel-Joseph Sieyès, <em>Qu’est-ce que le tiers état ?</em>, janvier 1789. Source : Gallica, BnF.</p>
            </div>
          </div>
          <div class="modal-foot"><button class="btn btn-primary" data-close-modal>J’ai lu</button></div>
        </div>
      </div>`;
    } else if (kind === 'blocks') {
      const blocks = [
        ['timeline', 'i-timeline', 'Frise chronologique'],
        ['map', 'i-map', 'Carte interactive'],
        ['flipcards', 'i-cards', 'Cartes à retourner'],
        ['document', 'i-doc', 'Étude de document'],
        ['quiz', 'i-quiz', 'Quiz'],
        ['deposit', 'i-upload', 'Dépôt de devoir'],
        ['link', 'i-link', 'Lien ou ressource'],
        ['text', 'i-text', 'Texte et consigne']
      ];
      root.innerHTML = `
      <div class="modal-root" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-blocks">
          <div class="modal-head">
            <div><h2 id="m-blocks">Insérer un bloc</h2><p>Choisissez ce que la page doit faire apprendre.</p></div>
            <button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="block-grid">
              ${blocks.map(([k, icon, label]) => `<button class="block-btn" data-add-block="${k}"><svg class="ico"><use href="#${icon}"/></svg>${label}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    }
    const first = $('[data-close-modal]', root);
    if (first) first.focus();
  }

  function closeModal() {
    $('#modal-root').innerHTML = '';
  }

  /* ------------------------------------------------------------
     Drawers
     ------------------------------------------------------------ */
  function openDrawer(name) {
    const drawer = $('#drawer-' + name);
    if (!drawer) return;
    $$('.drawer').forEach((d) => { d.hidden = true; d.classList.remove('is-open'); });
    $('#drawer-scrim').hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    if (name === 'notes') renderNotes();
  }

  function closeDrawer() {
    $$('.drawer').forEach((d) => {
      d.classList.remove('is-open');
      setTimeout(() => { if (!d.classList.contains('is-open')) d.hidden = true; }, 280);
    });
    const scrim = $('#drawer-scrim');
    if (scrim) scrim.hidden = true;
  }

  /* ------------------------------------------------------------
     Timer enseignant
     ------------------------------------------------------------ */
  function toggleTimer() {
    const btn = $('#timer-btn');
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
      btn.textContent = 'Reprendre';
      return;
    }
    btn.textContent = 'Pause';
    state.timer = setInterval(() => {
      state.seconds += 1;
      const m = Math.floor(state.seconds / 60);
      const s = state.seconds % 60;
      $('#notes-time').textContent = `${pad(m)}:${pad(s)}`;
    }, 1000);
  }

  /* ------------------------------------------------------------
     Événements
     ------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const t = e.target;

    const goEl = t.closest('[data-go]');
    if (goEl) { go(goEl.dataset.go); return; }

    const openViewerEl = t.closest('[data-open-viewer]');
    if (openViewerEl) { openViewer(Number(openViewerEl.dataset.openViewer) || 0); return; }

    if (t.closest('[data-viewer-close]')) { closeViewer(); return; }

    const stepEl = t.closest('[data-step]');
    if (stepEl) { step(Number(stepEl.dataset.step)); return; }

    const pageGoto = t.closest('[data-page-goto]');
    if (pageGoto) {
      const n = Number(pageGoto.dataset.pageGoto);
      if (state.viewer) { setPage(n); history.replaceState(null, '', '#/viewer/' + n); }
      else { selectPage(n); go('editor'); }
      return;
    }

    const dot = t.closest('[data-dot]');
    if (dot) { setPage(Number(dot.dataset.dot)); history.replaceState(null, '', '#/viewer/' + dot.dataset.dot); return; }

    const event = t.closest('[data-event]');
    if (event) { state.event = Number(event.dataset.event); renderTimelineDetail(); return; }

    const place = t.closest('[data-place]');
    if (place) { state.place = Number(place.dataset.place); renderPlace(); return; }

    const flip = t.closest('[data-flip]');
    if (flip) {
      flip.classList.toggle('is-flipped');
      flip.setAttribute('aria-pressed', String(flip.classList.contains('is-flipped')));
      return;
    }

    const quizOpt = t.closest('[data-quiz-opt]');
    if (quizOpt && !state.answered) {
      state.answered = true;
      state.lastAnswer = Number(quizOpt.dataset.quizOpt);
      paintQuizAnswer(state.lastAnswer);
      return;
    }

    const quizNext = t.closest('[data-quiz-next]');
    if (quizNext) {
      if (state.quiz >= QUIZ.length - 1) {
        setPage(8);
        history.replaceState(null, '', '#/viewer/8');
      } else {
        state.quiz += 1;
        state.answered = false;
        state.lastAnswer = null;
        renderQuiz();
      }
      return;
    }

    const removeFile = t.closest('[data-remove-file]');
    if (removeFile) {
      state.files.splice(Number(removeFile.dataset.removeFile), 1);
      renderFiles();
      toast('Document retiré.');
      return;
    }

    const editorPage = t.closest('[data-editor-page]');
    if (editorPage) { selectPage(Number(editorPage.dataset.editorPage)); return; }

    const tab = t.closest('[data-tab]');
    if (tab) {
      $$('.tabs button').forEach((b) => { b.classList.remove('is-on'); b.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on'); tab.setAttribute('aria-selected', 'true');
      $$('.tab-panel').forEach((p) => p.hidden = p.id !== 'tab-' + tab.dataset.tab);
      return;
    }

    const block = t.closest('[data-add-block]');
    if (block) {
      const names = { timeline: 'Frise', map: 'Carte', flipcards: 'Cartes', document: 'Document', quiz: 'Quiz', deposit: 'Dépôt', link: 'Lien', text: 'Texte' };
      toast(`Bloc « ${names[block.dataset.addBlock]} » ajouté à la page.`);
      if (block.closest('.modal')) closeModal();
      return;
    }

    const segBtn = t.closest('.segmented button');
    if (segBtn) {
      $$('button', segBtn.parentElement).forEach((b) => b.classList.remove('is-on'));
      segBtn.classList.add('is-on');
      return;
    }

    const chip = t.closest('[data-filter]');
    if (chip) {
      $$('[data-filter]').forEach((c) => c.classList.remove('is-on'));
      chip.classList.add('is-on');
      const filter = chip.textContent.trim().toLowerCase();
      $$('.session-card').forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = filter === 'toutes' || text.includes(filter.slice(0, 4)) ? '' : 'none';
      });
      return;
    }

    const toggle = t.closest('[data-toggle]');
    if (toggle) { toggle.classList.toggle('is-on'); toggle.setAttribute('aria-pressed', String(toggle.classList.contains('is-on'))); return; }

    const palette = t.closest('.palette');
    if (palette) { $$('.palette').forEach((p) => p.classList.remove('is-on')); palette.classList.add('is-on'); }

    const thumb = t.closest('.thumb');
    if (thumb) { $$('.thumb').forEach((p) => p.classList.remove('is-on')); thumb.classList.add('is-on'); }

    const device = t.closest('.device-btn');
    if (device) { $$('.device-btn').forEach((p) => p.classList.remove('is-on')); device.classList.add('is-on'); }

    const toastEl = t.closest('[data-toast]');
    if (toastEl) { toast(toastEl.dataset.toast); }

    if (t.closest('[data-drawer="summary"]')) { openDrawer('summary'); return; }
    if (t.closest('[data-close-drawer]')) { closeDrawer(); return; }

    if (t.closest('#teacher-toggle')) {
      const on = $('#screen-viewer').classList.toggle('teacher-mode');
      $('#teacher-toggle').classList.toggle('is-on', on);
      toast(on ? 'Mode prof activé : les zones interactives sont signalées.' : 'Mode prof désactivé.');
      return;
    }

    if (t.closest('#fullscreen-btn')) {
      const el = document.documentElement;
      const fs = el.requestFullscreen || el.webkitRequestFullscreen;
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) fs?.call(el);
      else exit?.call(document);
      return;
    }

    if (t.closest('#timer-btn')) { toggleTimer(); return; }

    if (t.closest('#present-btn')) { openViewer(state.page); return; }
    if (t.closest('#canvas-present')) { openViewer(state.page); return; }
    if (t.closest('#mobile-blocks')) { openModal('blocks'); return; }

    if (t.closest('#generate-btn')) { go('generate'); return; }

    if (t.closest('#dropzone')) { $('#file-input').click(); return; }

    if (t.closest('#link-add')) {
      const input = $('#link-input');
      const v = input.value.trim();
      if (!v) { toast('Collez d’abord un lien.'); input.focus(); return; }
      state.files.push({ name: v.replace(/^https?:\/\//, '').slice(0, 52), size: '', type: 'link' });
      input.value = '';
      renderFiles();
      toast('Lien ajouté à la séance.');
      return;
    }

    if (t.closest('[data-modal]')) { openModal(t.closest('[data-modal]').dataset.modal); return; }
    if (t.closest('[data-close-modal]')) { closeModal(); return; }
    if (t.closest('[data-copy]')) {
      const text = t.closest('[data-copy]').dataset.copy;
      navigator.clipboard?.writeText(text).then(() => toast('Lien copié.')).catch(() => toast('Lien : ' + text));
      return;
    }
    if (t.closest('.modal-root[data-backdrop]') && !t.closest('.modal')) { closeModal(); return; }
    if (t.closest('#drawer-scrim')) { closeDrawer(); return; }

    const soon = t.closest('[data-soon]');
    if (soon) { e.preventDefault(); toast(soon.dataset.soon + ' — à venir dans la v1.'); }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'file-input') { addFiles(e.target.files); e.target.value = ''; }
    if (e.target.id === 'deposit-input') {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const panel = $('#drop-slide');
      panel.classList.add('is-done');
      panel.innerHTML = `<span class="big-ico" style="background:var(--ok)"><svg class="ico"><use href="#i-check"/></svg></span>
        <strong>Travail déposé</strong>
        <small>Le professeur peut maintenant consulter votre copie.</small>
        <span class="deposit-file"><svg class="ico"><use href="#i-doc"/></svg><span>${f.name}</span><small>${Math.max(1, Math.round(f.size / 1024))} Ko</small></span>`;
      toast('Devoir déposé. Vous pouvez le remplacer jusqu’à l’échéance.');
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.matches('.search input')) {
      const q = e.target.value.trim().toLowerCase();
      $$('.session-card').forEach((card) => {
        card.style.display = !q || card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"]')) {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (e.key === 'Escape') {
      if ($('#modal-root').children.length) { closeModal(); return; }
      if (!$('#drawer-scrim').hidden) { closeDrawer(); return; }
      if (state.viewer) closeViewer();
      return;
    }
    if (!state.viewer) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('.search input')?.focus(); }
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'Home') { setPage(0); }
    if (e.key === 'End') { setPage(PAGES.length - 1); }
  });

  /* Drag & drop import */
  const dz = $('#dropzone');
  ['dragenter', 'dragover'].forEach((ev) => dz?.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz?.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-over'); }));
  dz?.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
  dz?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file-input').click(); }
  });

  /* Dépôt dans la séance */
  document.addEventListener('dragover', (e) => {
    const drop = e.target.closest('#drop-slide');
    if (drop) { e.preventDefault(); drop.classList.add('is-over'); }
  });
  document.addEventListener('dragleave', (e) => {
    const drop = e.target.closest('#drop-slide');
    if (drop) drop.classList.remove('is-over');
  });
  document.addEventListener('drop', (e) => {
    const drop = e.target.closest('#drop-slide');
    if (!drop) return;
    e.preventDefault();
    drop.classList.remove('is-over');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    drop.classList.add('is-done');
    drop.innerHTML = `<span class="big-ico" style="background:var(--ok)"><svg class="ico"><use href="#i-check"/></svg></span><strong>${f.name}</strong><small>Travail déposé.</small>`;
    toast('Devoir déposé.');
  });

  /* Swipe */
  const deckWrap = $('#deck-wrap');
  let touchX = 0, touchY = 0, touching = false;
  deckWrap?.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    touching = true;
  }, { passive: true });
  deckWrap?.addEventListener('touchend', (e) => {
    if (!touching) return;
    touching = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------ */
  function init() {
    renderPageList();
    buildDeck();
    renderFiles();
    setPage(0);
    selectPage(0, true);
    route();
    window.addEventListener('hashchange', route);
  }

  init();
})();
