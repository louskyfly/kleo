/* ============================================================
   Kléo v2 — rendu des pages de séance
   ============================================================ */
(function () {
  'use strict';

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const pad = (n) => String(n).padStart(2, '0');

  function title(d, tag = 'h2') {
    const t = esc(d.title || '');
    const a = esc(d.accent || '');
    return `${t}${a ? ` <em>${a}</em>` : ''}`;
  }

  function foot(page, i, session) {
    const subject = (window.KleoData.SUBJECTS[session.subject] || {}).label || 'Séance';
    const label = `${subject} · ${esc(session.level)} · ${esc(session.title)}`;
    return `<footer class="slide-foot"><span class="kl">kléo<b>.</b></span><span>${label}</span><span>${pad(i + 1)} / ${pad(session.pages.length)}</span></footer>`;
  }

  function head(d, pageTitle) {
    const meta = d.meta ? `<p class="slide-head-meta">${esc(d.meta)}</p>` : '';
    return `<header class="slide-head"><div><span class="slide-kicker">${esc(d.kicker || '')}</span><h2 class="slide-title">${pageTitle || title(d)}</h2></div>${meta}</header>`;
  }

  function eventDetailHTML(e) {
    e = e || {};
    return `
      <span class="tl-big-year">${esc(e.year || '—')}</span>
      <div class="tl-body"><h3>${esc(e.title || 'Titre de l’événement')}</h3><p>${esc(e.text || '')}</p>
        <div class="tl-tags">${(e.tags || []).filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
      </div>
      <div class="tl-quote"><blockquote>${esc(e.quote || '')}</blockquote><cite>${esc(e.source || '')}</cite></div>`;
  }

  function placeCardHTML(p, index) {
    p = p || {};
    return `
      <span class="pc-kicker">${esc(p.kicker || '')}</span>
      <h3>${esc(p.name || 'Lieu')}</h3>
      <p>${esc(p.text || '')}</p>
      <div class="place-tags">${(p.tags || []).filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="pc-question"><span>Question</span><p>${esc(p.question || '')}</p></div>
      <button class="pc-action" data-toast="Document associé : à ajouter dans la v3.">Voir le document associé <svg class="ico"><use href="#i-arrow-right"/></svg></button>
      <span class="pc-fact"><svg class="ico"><use href="#i-clock"/></svg>${esc(p.fact || '')}</span>
      <span class="pc-foot"><svg class="ico"><use href="#i-pin"/></svg>${esc(p.tag || '')}</span>`;
  }

  function quizHTML(page, state) {
    const questions = (page.data.questions || []).filter((q) => q && q.q);
    const s = state || { index: 0, answers: {}, done: false, last: null };
    if (!questions.length) {
      return `<div class="quiz-empty"><span class="slide-kicker" style="margin:0">Quiz</span><h3 class="quiz-q">Aucune question pour l’instant.</h3><p class="muted">Ajoutez une question dans l’éditeur pour faire vivre cette page.</p></div>`;
    }
    if (s.done) {
      const score = questions.reduce((n, q, i) => n + (s.answers[i] === q.correct ? 1 : 0), 0);
      return `
        <div class="quiz-meta"><span class="slide-kicker" style="margin:0">Résultat</span><div class="quiz-score">${score} / ${questions.length}</div></div>
        <h3 class="quiz-q">${score === questions.length ? 'Tout est juste.' : score >= questions.length / 2 ? 'Bien joué, il reste des points à consolider.' : 'À revoir ensemble.'}</h3>
        <div class="quiz-review">
          ${questions.map((q, i) => {
            const ok = s.answers[i] === q.correct;
            return `<div class="quiz-review-row ${ok ? 'ok' : 'ko'}">
              <span class="qr-ico"><svg class="ico"><use href="#${ok ? 'i-check' : 'i-close'}"/></svg></span>
              <span><strong>${esc(q.q)}</strong><small>${ok ? 'Bonne réponse' : `Réponse attendue : ${esc(q.options[q.correct] || '')}`}</small></span>
            </div>`;
          }).join('')}
        </div>
        <button class="btn-slide quiz-next is-on" data-quiz-restart>Recommencer le quiz <svg class="ico"><use href="#i-arrow-right"/></svg></button>`;
    }
    const idx = Math.min(s.index, questions.length - 1);
    const q = questions[idx];
    const chosen = s.answers[idx];
    const answered = chosen !== undefined;
    return `
      <div class="quiz-meta">
        <span class="slide-kicker" style="margin:0">Question ${idx + 1} sur ${questions.length}</span>
        <div class="quiz-progress" aria-hidden="true">${questions.map((_, k) => `<i class="${k <= idx ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <h3 class="quiz-q">${esc(q.q)}</h3>
      <div class="quiz-options" role="group" aria-label="Réponses">
        ${(q.options || []).map((o, k) => {
          let cls = '';
          if (answered && k === q.correct) cls = 'is-correct';
          if (answered && k === chosen && chosen !== q.correct) cls = 'is-wrong';
          return `<button class="quiz-opt ${cls}" data-quiz-opt="${k}"${answered ? ' disabled' : ''}><span class="letter">${'ABCDEFGH'[k] || '•'}</span><span>${esc(o)}</span></button>`;
        }).join('')}
      </div>
      <div class="quiz-feedback ${answered ? 'is-on ' + (chosen === q.correct ? 'good' : 'bad') : ''}" aria-live="polite">
        ${answered ? `<svg class="ico"><use href="#${chosen === q.correct ? 'i-check' : 'i-close'}"/></svg><div><strong>${chosen === q.correct ? 'Bonne réponse' : 'Réponse incorrecte'}</strong>${esc(chosen === q.correct ? q.good : q.bad)}</div>` : ''}
      </div>
      <button class="btn-slide quiz-next ${answered ? 'is-on' : ''}" data-quiz-next>${idx < questions.length - 1 ? 'Question suivante' : 'Voir le résultat'} <svg class="ico"><use href="#i-arrow-right"/></svg></button>`;
  }

  /* ------------------------------------------------------------
     Pages
     ------------------------------------------------------------ */
  const RENDER = {
    cover(page, i, session) {
      const d = page.data;
      const meta = (d.meta || []).filter(Boolean).map((m) => `<span><svg class="ico"><use href="#i-${/min|heure/.test(m) ? 'clock' : /doc/.test(m) ? 'doc' : 'users'}"/></svg>${esc(m)}</span>`).join('');
      return `<article class="slide slide--cover" data-page="${i}" aria-label="Couverture de la séance">
        <div class="cover-grid">
          <div>
            <p class="cover-series">${esc(d.kicker || '')}</p>
            <h1 class="cover-h1">${esc(d.title || '')}${d.accent ? `<br><em>${esc(d.accent)}</em>` : ''}</h1>
            <p class="cover-lede">${esc(d.lede || '')}</p>
            <div class="cover-actions"><button class="btn-slide" data-page-goto="1">Commencer <svg class="ico"><use href="#i-arrow-right"/></svg></button></div>
            <div class="cover-meta">${meta}</div>
          </div>
          <div class="cover-art" aria-hidden="true"><span class="orbit"></span><span class="orbit"></span><span class="orbit"></span><span class="axis"></span><span class="sun"></span><span class="year-num">${esc(session.coverWord || '')}</span></div>
        </div>
        ${foot(page, i, session)}
      </article>`;
    },

    objectives(page, i, session) {
      const d = page.data;
      return `<article class="slide" data-page="${i}" aria-label="Objectifs">
        ${head(d)}
        <div class="obj-grid">
          ${(d.items || []).map((o, k) => `<div class="obj-card"><span class="obj-num">${k + 1}</span><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></div>`).join('')}
        </div>
        <div class="obj-foot"><span class="lbl">Compétences</span>${(d.skills || []).filter(Boolean).map((s) => `<span class="skill">${esc(s)}</span>`).join('')}</div>
        ${d.question ? `<p class="obj-quote"><strong>La question de la séance :</strong> ${esc(d.question)}</p>` : ''}
        ${foot(page, i, session)}
      </article>`;
    },

    timeline(page, i, session) {
      const d = page.data;
      const events = d.events || [];
      const first = events[0];
      return `<article class="slide" data-page="${i}" aria-label="Frise chronologique">
        ${head(d)}
        <div class="tl-wrap">
          <div class="timeline" style="--n:${Math.max(events.length, 1)}">
            <div class="tl-line"></div>
            <div class="tl-events" style="grid-template-columns:repeat(${Math.max(events.length, 1)},1fr)">
              ${events.map((e, k) => `<button class="tl-event${k === 0 ? ' is-on' : ''}" data-event="${k}" aria-pressed="${k === 0}"><span class="dot"></span><span class="tl-year">${esc(e.year)}</span><span class="tl-label">${esc(e.label)}</span></button>`).join('')}
            </div>
          </div>
          <div class="tl-detail" data-tl-detail>${eventDetailHTML(first)}</div>
        </div>
        ${foot(page, i, session)}
      </article>`;
    },

    map(page, i, session) {
      const d = page.data;
      const places = d.places || [];
      const pins = places.map((p, k) => `<g class="map-pin${k === 0 ? ' is-on' : ''}" data-place="${k}" role="button" tabindex="0" aria-label="${esc(p.name)}"><circle class="pin-bg" cx="${Number(p.x) || 220}" cy="${Number(p.y) || 270}" r="10.5"></circle><text x="${Number(p.x) || 220}" y="${Number(p.y) || 270}">${k + 1}</text></g>`).join('');
      return `<article class="slide" data-page="${i}" aria-label="Carte interactive">
        ${head(d)}
        <div class="map-grid">
          <div class="map-panel">
            <span class="map-title">Europe · foyers et circulations</span>
            <img class="map-img" src="assets/europe.svg" alt="Carte simplifiée de l’Europe">
            <svg class="map-overlay" viewBox="0 0 600 430" role="group" aria-label="Lieux cliquables">
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
            <div class="place-list" role="group" aria-label="Lieux">${places.map((p, k) => `<button class="place-chip${k === 0 ? ' is-on' : ''}" data-place="${k}">${esc(p.name)}</button>`).join('')}</div>
            <div class="place-card" data-place-card data-num="01" aria-live="polite">${placeCardHTML(places[0], 0)}</div>
          </div>
        </div>
        ${foot(page, i, session)}
      </article>`;
    },

    flipcards(page, i, session) {
      const d = page.data;
      return `<article class="slide" data-page="${i}" aria-label="Cartes à retourner">
        ${head(d)}
        <div class="cards-grid">
          ${(d.cards || []).map((c, k) => `<button class="flip" data-flip="${k}" aria-pressed="false" aria-label="Carte ${esc(c.title)}"><span class="flip-inner"><span class="flip-face flip-front"><span class="fc-num">${pad(k + 1)}</span><span class="fc-mid"><h3>${esc(c.title)}</h3><span class="fc-sub">${esc(c.sub)}</span></span><span class="fc-hint"><svg class="ico"><use href="#i-cards"/></svg>Toucher pour retourner</span></span><span class="flip-face flip-back"><blockquote>${esc(c.quote)}</blockquote><cite>${esc(c.cite)}</cite></span></span></button>`).join('')}
        </div>
        ${foot(page, i, session)}
      </article>`;
    },

    document(page, i, session) {
      const d = page.data;
      return `<article class="slide" data-page="${i}" aria-label="Étude de document">
        ${head(d)}
        <div class="doc-grid">
          <div class="doc-sheet">
            <span class="doc-ref">Pièce 1 · Texte</span>
            <span class="doc-stamp">${esc(d.stamp || 'Document')}</span>
            <blockquote>${esc(d.quote || '')}</blockquote>
            <p class="doc-src">${esc(d.source || '')}</p>
          </div>
          <div class="doc-side">
            <h3>Ce qu’il faut observer</h3>
            <ul class="doc-points">${(d.points || []).map((p, k) => `<li><span class="n">${k + 1}</span><span><strong>${esc(p.q)}</strong> ${esc(p.a)}</span></li>`).join('')}</ul>
            ${d.vocab && d.vocab.term ? `<div class="doc-vocab"><span class="dv-label">Vocabulaire</span><p><strong>${esc(d.vocab.term)}</strong> — ${esc(d.vocab.def)}</p></div>` : ''}
            <div class="doc-actions">
              <button class="btn-slide" data-modal="zoom-doc" style="min-height:2.6em;font-size:.78em;padding:0 1em;background:var(--ink);color:var(--paper)">Agrandir le document</button>
              <button class="btn-slide" data-toast="Source : à compléter dans l’éditeur." style="min-height:2.6em;font-size:.78em;padding:0 1em;background:transparent;color:var(--ink-2);border:1px solid var(--line)">Voir la source</button>
            </div>
            ${d.takeaway ? `<div class="doc-takeaway"><span>À retenir</span><p>${esc(d.takeaway)}</p></div>` : ''}
          </div>
        </div>
        ${foot(page, i, session)}
      </article>`;
    },

    quiz(page, i, session) {
      const d = page.data;
      return `<article class="slide" data-page="${i}" aria-label="Quiz">
        ${head(d)}
        <div class="quiz-wrap" data-quiz-area data-page-id="${page.id}">${quizHTML(page, { index: 0, answers: {}, done: false })}</div>
        ${foot(page, i, session)}
      </article>`;
    },

    deposit(page, i, session) {
      const d = page.data;
      return `<article class="slide" data-page="${i}" aria-label="Dépôt de devoir">
        ${head(d)}
        <div class="deposit-grid">
          <div class="deposit-info">
            <h3>${esc(d.promptTitle || '')}</h3>
            <p>${esc(d.prompt || '')}</p>
            <ul class="deposit-facts">
              ${d.deadline ? `<li><svg class="ico"><use href="#i-clock"/></svg>${esc(d.deadline)}</li>` : ''}
              ${d.formats ? `<li><svg class="ico"><use href="#i-doc"/></svg>${esc(d.formats)}</li>` : ''}
              ${d.privacy ? `<li><svg class="ico"><use href="#i-lock"/></svg>${esc(d.privacy)}</li>` : ''}
            </ul>
            ${(d.checklist || []).length ? `<div class="deposit-check"><span class="dc-title">Votre copie doit contenir</span><ul>${d.checklist.map((c) => `<li><i></i>${esc(c)}</li>`).join('')}</ul></div>` : ''}
            ${(d.rubric || []).length ? `<div class="deposit-rubric"><span class="dc-title">Ce qui est évalué</span><ul>${d.rubric.map((r) => `<li><span>${esc(r.label)}</span><b>${esc(r.points)}</b></li>`).join('')}</ul></div>` : ''}
          </div>
          <label class="drop-slide" data-drop tabindex="0">
            <input type="file" data-deposit-input hidden accept=".pdf,.jpg,.jpeg,.png,.heic">
            <span class="big-ico"><svg class="ico"><use href="#i-upload"/></svg></span>
            <strong>Déposer depuis l’iPad</strong>
            <small>Fichiers, Photos ou scan · 20 Mo</small>
            <span class="btn-slide">Choisir un fichier</span>
          </label>
        </div>
        ${foot(page, i, session)}
      </article>`;
    },

    synthesis(page, i, session) {
      const d = page.data;
      const quizIndex = session.pages.findIndex((p) => p.kind === 'quiz');
      return `<article class="slide" data-page="${i}" aria-label="Synthèse">
        ${head(d)}
        <div class="synth-grid">
          <div class="synth-list">${(d.items || []).map((o, k) => `<div class="synth-item"><span class="n">${k + 1}</span><div><strong>${esc(o.title)}</strong><p>${esc(o.text)}</p></div></div>`).join('')}</div>
          <div class="synth-cta">
            <h3>${esc(d.ctaTitle || 'Et maintenant ?')}</h3>
            <p>${esc(d.ctaText || '')}</p>
            <button class="btn-slide" data-synth-quiz="${quizIndex}">${esc(d.ctaButton || 'Refaire le quiz')} <svg class="ico"><use href="#i-arrow-right"/></svg></button>
            <div class="synth-links">${(d.links || []).map((l, k) => `<button data-synth="${k}">${esc(l)}</button>`).join('')}</div>
          </div>
        </div>
        ${foot(page, i, session)}
      </article>`;
    }
  };

  function renderSlide(page, i, session) {
    const fn = RENDER[page.kind] || RENDER.objectives;
    return fn(page, i, session);
  }

  window.KleoSlides = { renderSlide, quizHTML, eventDetailHTML, placeCardHTML, esc, pad };
})();
