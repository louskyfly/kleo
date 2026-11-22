/* ============================================================
   Kléo v2 — rendu de l'éditeur
   ============================================================ */
(function () {
  'use strict';

  const D = window.KleoData;
  const S = window.KleoSlides;
  const esc = S.esc;
  const pad = S.pad;

  function field(f, value, attrs) {
    const id = `f_${Math.random().toString(36).slice(2, 8)}`;
    const split = f.type === 'csv' ? ' data-split="csv"' : f.type === 'lines' ? ' data-split="lines"' : '';
    const label = `<label class="efield${f.half ? ' half' : ''}" for="${id}"><span>${esc(f.label)}</span>`;
    let input;
    if (f.type === 'textarea' || f.type === 'lines') {
      const v = f.type === 'lines' ? (Array.isArray(value) ? value.join('\n') : (value || '')) : (value || '');
      input = `<textarea id="${id}" class="einput" rows="${f.rows || 3}" ${attrs}${split} placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
    } else if (f.type === 'csv') {
      input = `<input id="${id}" class="einput" type="text" ${attrs}${split} value="${esc(Array.isArray(value) ? value.join(', ') : (value || ''))}" placeholder="${esc(f.placeholder || '')}">`;
    } else {
      input = `<input id="${id}" class="einput" type="${f.type === 'number' ? 'number' : 'text'}" ${attrs} value="${esc(value == null ? '' : value)}" placeholder="${esc(f.placeholder || '')}">`;
    }
    return label + input + '</label>';
  }

  function fieldsHTML(schema, data, prefix = '', list = null, idx = null) {
    return (schema.fields || []).map((f) => {
      const value = f.k.split('.').reduce((o, k) => (o == null ? o : o[k]), data);
      const attrs = list
        ? `data-list="${esc(list)}" data-idx="${idx}" data-ki="${esc(f.k)}"`
        : `data-field="${esc(f.k)}"${prefix ? ` data-prefix="${esc(prefix)}"` : ''}`;
      return field(f, value, attrs);
    }).join('');
  }

  function listsHTML(schema, data) {
    return (schema.lists || []).map((list) => {
      if (list.lines) {
        const value = Array.isArray(data[list.key]) ? data[list.key].join('\n') : (data[list.key] || '');
        return `<div class="esection"><span class="esection-title">${esc(list.label)}</span>
          <textarea class="einput" rows="3" data-field="${esc(list.key)}" data-split="lines" placeholder="${esc(list.placeholder || '')}">${esc(value)}</textarea></div>`;
      }
      const items = Array.isArray(data[list.key]) ? data[list.key] : [];
      return `<div class="esection">
        <div class="esection-head"><span class="esection-title">${esc(list.label)}</span><span class="count">${items.length}</span></div>
        <div class="array-list">
          ${items.map((item, idx) => `
            <div class="array-item">
              <div class="array-head">
                <span class="array-name">${esc(list.title ? list.title(item, idx) : 'Élément ' + (idx + 1))}</span>
                <span class="array-actions">
                  <button class="mini" data-list-up="${esc(list.key)}" data-idx="${idx}" aria-label="Monter" ${idx === 0 ? 'disabled' : ''}>↑</button>
                  <button class="mini" data-list-down="${esc(list.key)}" data-idx="${idx}" aria-label="Descendre" ${idx === items.length - 1 ? 'disabled' : ''}>↓</button>
                  <button class="mini danger" data-list-del="${esc(list.key)}" data-idx="${idx}" aria-label="Supprimer">×</button>
                </span>
              </div>
              <div class="efields">${fieldsHTML({ fields: list.fields }, item, '', list.key, idx)}</div>
            </div>`).join('')}
        </div>
        <button class="add-inline" data-list-add="${esc(list.key)}">+ ${esc(list.add || 'Ajouter')}</button>
      </div>`;
    }).join('');
  }

  function quizBuilder(page) {
    const questions = page.data.questions || [];
    return `<div class="esection">
      <div class="esection-head"><span class="esection-title">Questions</span><span class="count">${questions.length}</span></div>
      <div class="array-list">
        ${questions.map((q, qi) => {
          const options = q.options || [];
          const invalid = options.length < 2 || q.correct == null || q.correct >= options.length;
          return `<div class="array-item quiz-item">
            <div class="array-head">
              <span class="array-name">Question ${qi + 1}${invalid ? ' · <span class="warn">à compléter</span>' : ''}</span>
              <span class="array-actions">
                <button class="mini" data-q-up="${qi}" aria-label="Monter" ${qi === 0 ? 'disabled' : ''}>↑</button>
                <button class="mini" data-q-down="${qi}" aria-label="Descendre" ${qi === questions.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="mini danger" data-q-del="${qi}" aria-label="Supprimer">×</button>
              </span>
            </div>
            <label class="efield"><span>Question</span><textarea class="einput" rows="2" data-q="q" data-qi="${qi}">${esc(q.q || '')}</textarea></label>
            <div class="options-editor">
              <span class="efield-label">Réponses <small>cochez la bonne</small></span>
              ${options.map((o, oi) => `<div class="opt-edit">
                <input type="radio" name="corr_${page.id}_${qi}" data-qcorrect="${qi}" value="${oi}" ${q.correct === oi ? 'checked' : ''} aria-label="Bonne réponse">
                <input class="einput" type="text" data-qopt="${oi}" data-qi="${qi}" value="${esc(o)}" placeholder="Réponse ${oi + 1}">
                <button class="mini danger" data-qopt-del="${qi}" data-oi="${oi}" aria-label="Supprimer la réponse" ${options.length <= 2 ? 'disabled' : ''}>×</button>
              </div>`).join('')}
              <button class="add-inline" data-qopt-add="${qi}">+ Ajouter une réponse</button>
            </div>
            <details class="feedback-edit">
              <summary>Messages de correction</summary>
              <label class="efield"><span>Si la réponse est juste</span><input class="einput" type="text" data-qgood="${qi}" value="${esc(q.good || '')}"></label>
              <label class="efield"><span>Si la réponse est fausse</span><input class="einput" type="text" data-qbad="${qi}" value="${esc(q.bad || '')}"></label>
            </details>
          </div>`;
        }).join('')}
      </div>
      <div class="add-row">
        <button class="add-inline" data-q-add>+ Ajouter une question</button>
        <button class="add-inline" data-q-add-tf>+ Vrai / Faux</button>
      </div>
    </div>`;
  }

  function inspector(page, session, tab) {
    const schema = D.SCHEMAS[page.kind] || { fields: [] };
    const type = D.PAGE_TYPES[page.kind] || { label: page.kind, description: '' };
    return `
      <div class="tabs" role="tablist">
        <button class="${tab === 'content' ? 'is-on' : ''}" role="tab" aria-selected="${tab === 'content'}" data-tab="content">Contenu</button>
        <button class="${tab === 'page' ? 'is-on' : ''}" role="tab" aria-selected="${tab === 'page'}" data-tab="page">Page</button>
        <button class="${tab === 'a11y' ? 'is-on' : ''}" role="tab" aria-selected="${tab === 'a11y'}" data-tab="a11y">Accès</button>
      </div>

      <div class="tab-panel" id="tab-content" ${tab !== 'content' ? 'hidden' : ''}>
        <div class="inspector-head">
          <span class="badge badge-soft">${esc(type.label)}</span>
          <h3>${esc(page.name)}</h3>
          <p class="meta tiny">${esc(type.description)}</p>
        </div>
        <div class="efields">${fieldsHTML(schema, page.data)}</div>
        ${schema.custom === 'quiz' ? quizBuilder(page) : listsHTML(schema, page.data)}
        ${schema.lists && schema.custom !== 'quiz' ? '' : ''}
      </div>

      <div class="tab-panel" id="tab-page" ${tab !== 'page' ? 'hidden' : ''}>
        <div class="inspector-head"><h3>Cette page</h3><p class="meta tiny">Nom, durée et notes pour vous.</p></div>
        <label class="efield"><span>Nom dans le plan</span><input class="einput" type="text" data-page-field="name" value="${esc(page.name)}"></label>
        <label class="efield"><span>Durée affichée (minutes)</span><input class="einput" type="number" min="1" max="120" data-page-field="minutes" value="${Number(page.minutes) || 0}"></label>
        <label class="efield"><span>Notes du professeur</span><textarea class="einput" rows="5" data-page-field="note" placeholder="Ce que vous voulez garder sous les yeux…">${esc(page.note || '')}</textarea></label>
        <div class="page-tools">
          <button class="btn btn-ghost btn-sm" data-page-up>↑ Monter</button>
          <button class="btn btn-ghost btn-sm" data-page-down>↓ Descendre</button>
          <button class="btn btn-ghost btn-sm" data-page-dup>Dupliquer</button>
          <button class="btn btn-danger btn-sm" data-page-del>Supprimer</button>
        </div>
        <p class="meta tiny">Les notes ne sont pas visibles par les élèves.</p>
      </div>

      <div class="tab-panel" id="tab-a11y" ${tab !== 'a11y' ? 'hidden' : ''}>
        <div class="inspector-head"><h3>Accessibilité</h3><p class="meta tiny">Contrôles automatiques sur cette page.</p></div>
        <ul class="check-list">
          <li class="ok"><span class="check-ico"><svg class="ico"><use href="#i-check"/></svg></span>Contrastes conformes AA</li>
          <li class="ok"><span class="check-ico"><svg class="ico"><use href="#i-check"/></svg></span>Cibles tactiles ≥ 44 px</li>
          <li class="ok"><span class="check-ico"><svg class="ico"><use href="#i-check"/></svg></span>Ordre de lecture défini</li>
          <li class="ok"><span class="check-ico"><svg class="ico"><use href="#i-check"/></svg></span>Alternative textuelle sur les documents</li>
          <li class="ok"><span class="check-ico"><svg class="ico"><use href="#i-check"/></svg></span>Navigation clavier complète</li>
          <li class="ok"><span class="check-ico"><svg class="ico"><use href="#i-check"/></svg></span>Information jamais portée par la couleur seule</li>
        </ul>
        <p class="a11y-note">Ces vérifications sont refaites à chaque modification et avant publication.</p>
      </div>`;
  }

  function pageList(session, current) {
    return session.pages.map((p, i) => {
      const t = D.PAGE_TYPES[p.kind] || { label: p.kind, icon: 'i-doc' };
      return `<li><button class="page-item ${i === current ? 'is-on' : ''}" data-editor-page="${i}" aria-current="${i === current ? 'page' : 'false'}">
        <span class="page-num">${pad(i + 1)}</span>
        <span class="page-ico"><svg class="ico"><use href="#${t.icon}"/></svg></span>
        <span class="page-txt"><strong>${esc(p.name)}</strong><small>${Number(p.minutes) || 0} min</small></span>
        <span class="page-drag"><svg class="ico"><use href="#i-drag"/></svg></span>
      </button></li>`;
    }).join('');
  }

  function addPageGrid() {
    return Object.entries(D.PAGE_TYPES).map(([k, t]) => `<button class="block-btn" data-add-page="${k}"><svg class="ico"><use href="#${t.icon}"/></svg><span>${esc(t.label)}</span></button>`).join('');
  }

  window.KleoEditor = { inspector, pageList, addPageGrid, field };
})();
