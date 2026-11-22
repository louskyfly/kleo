/* ============================================================
   Kléo v2 — application
   Bibliothèque, éditeur, mode séance, partage.
   ============================================================ */
(() => {
  'use strict';

  const D = window.KleoData;
  const S = window.KleoSlides;
  const E = window.KleoEditor;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = S.esc;
  const pad = S.pad;

  const state = {
    sessions: D.loadSessions(),
    currentId: null,
    pageIndex: 0,
    tab: 'content',
    screen: 'library',
    viewer: false,
    viewerPage: 0,
    viewerReturn: 'library',
    quizStates: {},
    libraryFilter: 'all',
    importFiles: [],
    importOpts: { subject: 'histoire', level: '4e', duration: 55, title: '' },
    genTimers: [],
    timer: null,
    seconds: 0,
    saveTimer: null
  };
  state.currentId = state.sessions[0] ? state.sessions[0].id : null;

  const session = () => state.sessions.find((s) => s.id === state.currentId) || state.sessions[0] || null;
  const page = () => { const s = session(); return s ? s.pages[Math.min(state.pageIndex, s.pages.length - 1)] : null; };

  /* ------------------------------------------------------------
     Petits utilitaires
     ------------------------------------------------------------ */
  function relDate(iso) {
    const d = new Date(iso || Date.now());
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 1) return 'à l’instant';
    if (diff < 60) return `il y a ${Math.floor(diff)} min`;
    if (diff < 1440) return `il y a ${Math.floor(diff / 60)} h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'seance';

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
  }

  function setSaveState(text, ok = true) {
    const el = $('#save-state');
    if (!el) return;
    el.innerHTML = `<svg class="ico"><use href="#${ok ? 'i-check' : 'i-clock'}"/></svg>${text}`;
    el.classList.toggle('is-saving', !ok);
  }

  function save(immediate = false) {
    const s = session();
    if (s) s.updatedAt = new Date().toISOString();
    setSaveState('Enregistrement…', false);
    clearTimeout(state.saveTimer);
    const commit = () => {
      const ok = D.saveSessions(state.sessions);
      setSaveState(ok ? 'Enregistré' : 'Stockage saturé', ok);
      if (!ok) toast('Le stockage local est plein. Exportez la séance pour la conserver.');
    };
    if (immediate) commit();
    else state.saveTimer = setTimeout(commit, 220);
  }

  /* ------------------------------------------------------------
     Bibliothèque
     ------------------------------------------------------------ */
  function coverClass(s) { return (D.SUBJECTS[s.subject] || D.SUBJECTS.histoire).className; }
  function subjectLabel(s) { return (D.SUBJECTS[s.subject] || D.SUBJECTS.histoire).label; }
  const questions = (s) => s.pages.filter((p) => p.kind === 'quiz').reduce((n, p) => n + (p.data.questions || []).length, 0);
  const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

  function sessionCard(s, compact = false) {
    const statusBadge = s.status === 'Prête' ? 'badge-ready' : 'badge-draft';
    if (compact) {
      return `<button class="resume-card" data-open-session="${s.id}">
        <span class="resume-cover cover ${coverClass(s)}"><span class="cover-ghost">${esc(s.coverWord || s.level)}</span></span>
        <span class="resume-body">
          <span class="badge-row"><span class="badge badge-terre">${esc(subjectLabel(s))} · ${esc(s.level)}</span><span class="badge ${statusBadge}">${esc(s.status || 'Brouillon')}</span></span>
          <strong>${esc(s.title)}</strong>
          <span class="meta">${s.pages.length} pages · ${relDate(s.updatedAt)}</span>
          <span class="meta tiny">${plural(questions(s), 'question', 'questions')} de quiz · ${esc(s.theme || 'Sans thème')}</span>
        </span>
        <span class="resume-go"><svg class="ico"><use href="#i-arrow-right"/></svg></span>
      </button>`;
    }
    return `<article class="session-card" data-session-card="${s.id}" data-subject="${esc(s.subject)}">
      <button class="card-main" data-open-session="${s.id}">
        <span class="cover ${coverClass(s)}">
          <span class="cover-kicker">${esc(subjectLabel(s))} · ${esc(s.level)}</span>
          <span class="cover-ghost">${esc(s.coverWord || s.level)}</span>
          <span class="cover-year">${esc(s.theme || `${s.pages.length} pages`)}</span>
        </span>
        <span class="session-body">
          <strong>${esc(s.title)}</strong>
          <span class="meta">${s.pages.length} pages · ${plural(questions(s), 'question', 'questions')}</span>
          <span class="session-foot"><span class="badge ${statusBadge}">${esc(s.status || 'Brouillon')}</span><span class="meta tiny">${relDate(s.updatedAt)}</span></span>
        </span>
      </button>
      <div class="card-actions">
        <button class="card-act" data-play="${s.id}" aria-label="Lancer la séance"><svg class="ico"><use href="#i-play"/></svg></button>
        <button class="card-act" data-menu="${s.id}" aria-label="Options de la séance"><svg class="ico"><use href="#i-more"/></svg></button>
      </div>
    </article>`;
  }

  function renderLibrary() {
    const sorted = state.sessions.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const resumeSection = $('#resume-section');
    if (resumeSection) resumeSection.style.display = state.sessions.length >= 2 ? '' : 'none';
    const resume = sorted.slice(0, 2);
    $('#resume-grid').innerHTML = resume.length
      ? resume.map((s) => sessionCard(s, true)).join('')
      : `<button class="resume-empty" data-go="import"><svg class="ico"><use href="#i-plus"/></svg><span><strong>Créez votre première séance</strong><small>Un titre suffit pour commencer.</small></span></button>`;

    const count = state.sessions.length;
    const drafts = state.sessions.filter((s) => (s.status || 'Brouillon') !== 'Prête').length;
    const libCount = $('#lib-count');
    if (libCount) libCount.textContent = `${count} séance${count > 1 ? 's' : ''} · ${drafts} brouillon${drafts > 1 ? 's' : ''}`;

    if (!count) {
      $('#session-grid').innerHTML = `<div class="empty-grid">
        <div class="empty-card"><span class="empty-icon"><svg class="ico"><use href="#i-spark"/></svg></span>
          <h3>Votre atelier est vide.</h3><p>Créez une séance, ajoutez un quiz, une frise, des cartes. Tout est enregistré sur cet appareil.</p>
          <button class="btn btn-primary" data-go="import"><svg class="ico"><use href="#i-plus"/></svg>Nouvelle séance</button>
        </div></div>`;
      return;
    }
    $('#session-grid').innerHTML = sorted.map((s) => sessionCard(s)).join('') + `<button class="session-card create-card" data-go="import">
      <span class="create-inner"><span class="create-plus"><svg class="ico"><use href="#i-plus"/></svg></span><strong>Nouvelle séance</strong><small>Partir d’un titre ou de documents</small></span>
    </button>`;
    applyLibraryFilter();
  }

  function applyLibraryFilter() {
    const q = ($('.search input')?.value || '').trim().toLowerCase();
    const filter = state.libraryFilter;
    $$('[data-session-card]').forEach((card) => {
      const text = card.textContent.toLowerCase();
      const subj = card.dataset.subject;
      const okSearch = !q || text.includes(q);
      const okFilter = filter === 'all' || subj === filter;
      card.style.display = okSearch && okFilter ? '' : 'none';
    });
  }

  /* ------------------------------------------------------------
     Import
     ------------------------------------------------------------ */
  function renderFiles() {
    const list = $('#file-list');
    if (!list) return;
    if (!state.importFiles.length) {
      list.innerHTML = `<li class="file-empty"><span class="file-icon doc"><svg class="ico"><use href="#i-folder"/></svg></span><span><strong>Aucun document joint</strong><small>Vous pouvez créer la séance maintenant et ajouter vos documents plus tard.</small></span></li>`;
      return;
    }
    list.innerHTML = state.importFiles.map((f, i) => `<li class="file-item">
      <span class="file-icon ${f.type}"><svg class="ico"><use href="#i-${f.type === 'img' ? 'image' : f.type === 'link' ? 'link' : 'doc'}"/></svg></span>
      <span style="flex:1;min-width:0"><span class="file-name">${esc(f.name)}</span><span class="file-meta">${esc(f.meta)}</span></span>
      <span class="file-ok"><svg class="ico"><use href="#i-check"/></svg></span>
      <button class="file-remove" data-remove-file="${i}" aria-label="Retirer ${esc(f.name)}"><svg class="ico"><use href="#i-close"/></svg></button>
    </li>`).join('');
  }

  function addImportFiles(files) {
    Array.from(files || []).forEach((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      const type = ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext) ? 'img' : ext === 'pdf' ? 'pdf' : 'doc';
      const size = f.size ? (f.size > 1e6 ? (f.size / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(f.size / 1024)) + ' Ko') : '—';
      state.importFiles.push({ name: f.name, meta: `${size} · joint`, type, size: f.size || 0 });
    });
    renderFiles();
  }

  function fillImportForm() {
    const t = $('#session-title');
    if (t) t.value = state.importOpts.title;
    const level = $('#level');
    if (level) level.value = state.importOpts.level;
    $$('[data-seg="subject"] button').forEach((b) => b.classList.toggle('is-on', b.dataset.value === state.importOpts.subject));
    $$('[data-seg="duration"] button').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.value) === Number(state.importOpts.duration)));
  }

  function createFromImport(blank = false) {
    const opts = {
      title: ($('#session-title')?.value || '').trim() || 'Nouvelle séance',
      subject: state.importOpts.subject,
      level: state.importOpts.level,
      duration: state.importOpts.duration,
      attachments: blank ? [] : state.importFiles.map((f) => f.name)
    };
    const s = D.createSession(opts);
    s.coverWord = opts.level.toUpperCase();
    if (!blank) {
      const quiz = s.pages.find((p) => p.kind === 'quiz');
      if (quiz) quiz.data.questions = [{
        q: 'Quelle question voulez-vous poser ?',
        options: ['La bonne réponse', 'Une autre réponse', 'Une troisième réponse'],
        correct: 0,
        good: 'Bonne réponse !',
        bad: 'Ce n’est pas la bonne réponse.'
      }];
      s.attachments = opts.attachments;
      if (!$('#opt-quiz') || !$('#opt-quiz').checked) s.pages = s.pages.filter((p) => p.kind !== 'quiz');
    }
    state.sessions.push(s);
    state.currentId = s.id;
    state.pageIndex = 0;
    state.importFiles = [];
    state.importOpts.title = '';
    save(true);
    if (blank) {
      go('editor');
      toast('Séance créée. Ajoutez vos pages et vos questions.');
    } else {
      go('generate');
      startGeneration(s);
    }
  }

  function startGeneration(newSession) {
    clearGeneration();
    state.currentId = newSession.id;
    state.pageIndex = 0;
    const sub = $('#gen-sub');
    if (sub) sub.textContent = `${subjectLabel(newSession)} · ${newSession.level} · ${newSession.duration} min · ${newSession.attachments.length} document(s)`;
    const steps = $$('#gen-steps li');
    steps.forEach((li) => li.classList.remove('is-done', 'is-active'));
    $('#gen-bar').style.width = '4%';
    $('#gen-note').textContent = 'Vous pourrez tout modifier ensuite.';
    const delays = [250, 700, 1150, 1600, 2050];
    const widths = [18, 38, 60, 82, 100];
    delays.forEach((d, k) => {
      state.genTimers.push(setTimeout(() => {
        steps.forEach((li, j) => { li.classList.toggle('is-done', j < k); li.classList.toggle('is-active', j === k); });
        if (k === delays.length - 1) steps.forEach((li) => { li.classList.add('is-done'); li.classList.remove('is-active'); });
        $('#gen-bar').style.width = widths[k] + '%';
        if (k === delays.length - 1) {
          $('#gen-note').textContent = 'Séance prête. Ouverture de l’éditeur…';
          state.genTimers.push(setTimeout(() => go('editor'), 420));
        }
      }, d));
    });
  }

  function clearGeneration() {
    state.genTimers.forEach(clearTimeout);
    state.genTimers = [];
  }

  /* ------------------------------------------------------------
     Éditeur
     ------------------------------------------------------------ */
  function renderPageList() {
    const s = session();
    if (!s) return;
    $('#page-list').innerHTML = E.pageList(s, state.pageIndex);
    const active = $('#page-list .page-item.is-on');
    const host = $('#page-list').closest('.editor-pages');
    if (active && host && window.innerWidth <= 1180) {
      host.scrollTo({ left: Math.max(0, active.offsetLeft - 24), behavior: 'smooth' });
    }
    const planMeta = $('#plan-meta');
    if (planMeta) planMeta.textContent = `${s.pages.length} page${s.pages.length > 1 ? 's' : ''} · ${s.pages.reduce((n, p) => n + (Number(p.minutes) || 0), 0)} min`;
  }

  function renderCanvas() {
    const s = session();
    const p = page();
    if (!s || !p) return;
    const canvas = $('#canvas-slide');
    if (!canvas) return;
    canvas.innerHTML = S.renderSlide(p, Math.min(state.pageIndex, s.pages.length - 1), s);
    const label = $('#canvas-label');
    if (label) label.textContent = `Page ${state.pageIndex + 1} · ${p.name}`;
  }

  function renderInspector() {
    const s = session();
    const p = page();
    const host = $('#inspector');
    if (!s || !p || !host) return;
    const sc = host.scrollTop;
    host.innerHTML = E.inspector(p, s, state.tab);
    host.scrollTop = sc;
  }

  function renderEditor(full = true) {
    const s = session();
    if (!s) return;
    state.pageIndex = Math.max(0, Math.min(state.pageIndex, s.pages.length - 1));
    $('#editor-title').textContent = s.title;
    $('#editor-crumb').textContent = `Bibliothèque / ${subjectLabel(s)} ${s.level}`;
    const st = $('#editor-status');
    st.textContent = s.status || 'Brouillon';
    st.className = `badge ${s.status === 'Prête' ? 'badge-ready' : 'badge-draft'}`;
    renderPageList();
    renderCanvas();
    if (full) renderInspector();
  }

  function selectPage(i) {
    const s = session();
    if (!s) return;
    state.pageIndex = Math.max(0, Math.min(i, s.pages.length - 1));
    state.tab = 'content';
    renderEditor(true);
    $('#canvas-frame')?.scrollTo?.({ top: 0 });
  }

  function refreshAfterEdit() {
    renderCanvas();
    renderPageList();
    save();
  }

  function setPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null || typeof o[keys[i]] !== 'object') o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = value;
  }

  function splitValue(raw, mode) {
    if (mode === 'lines') return raw.split('\n').map((v) => v.trim()).filter(Boolean);
    if (mode === 'csv') return raw.split(',').map((v) => v.trim()).filter(Boolean);
    return raw;
  }

  /* ------------------------------------------------------------
     Mode séance
     ------------------------------------------------------------ */
  function openViewer(start = 0) {
    const s = session();
    if (!s) { toast('Créez d’abord une séance.'); return; }
    state.viewer = true;
    state.viewerReturn = state.screen === 'editor' ? 'editor' : 'library';
    state.quizStates = {};
    $('#screen-viewer').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#v-title').textContent = s.title;
    $('#v-sub').textContent = `${subjectLabel(s)} · ${s.level}`;
    $('#summary-meta').textContent = `${s.duration} min · ${s.pages.length} pages`;
    $('#deck').innerHTML = s.pages.map((p, i) => `<div class="slide-frame" data-frame="${i}">${S.renderSlide(p, i, s)}</div>`).join('');
    $('#v-dots').innerHTML = s.pages.map((p, i) => `<button data-dot="${i}" aria-label="Aller à la page ${i + 1} : ${esc(p.name)}"></button>`).join('');
    $('#summary-list').innerHTML = s.pages.map((p, i) => `<li><button class="summary-item" data-page-goto="${i}"><span class="n">${pad(i + 1)}</span><span class="t">${esc(p.name)}</span><span class="d">${Number(p.minutes) || 0} min</span></button></li>`).join('');
    s.pages.forEach((p) => { if (p.kind === 'quiz') paintQuiz(p); });
    setViewerPage(start);
    if (location.hash !== '#/viewer/' + start) location.hash = '#/viewer/' + start;
  }

  function closeViewer() {
    if (!state.viewer) return;
    state.viewer = false;
    $('#screen-viewer').hidden = true;
    document.body.style.overflow = '';
    closeDrawer();
    const target = '#/' + state.viewerReturn;
    if (location.hash !== target) location.hash = target;
    else showScreen(state.viewerReturn);
  }

  function viewerSession() { return session(); }

  function setViewerPage(index) {
    const s = viewerSession();
    if (!s) return;
    const i = Math.max(0, Math.min(Number(index) || 0, s.pages.length - 1));
    state.viewerPage = i;
    $$('#deck .slide-frame').forEach((f, k) => f.classList.toggle('is-active', k === i));
    $$('#v-dots button').forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      b.setAttribute('aria-current', k === i ? 'page' : 'false');
    });
    $$('.summary-item').forEach((b, k) => b.classList.toggle('is-on', k === i));
    $('#v-count').textContent = `${pad(i + 1)} / ${pad(s.pages.length)}`;
    $('#v-bar').style.width = `${((i + 1) / s.pages.length) * 100}%`;
    const p = s.pages[i];
    const n = $('#notes-content');
    if (n) n.innerHTML = `<h3>${pad(i + 1)} · ${esc(p.name)}</h3><p>${esc(p.note || 'Aucune note pour cette page. Ajoutez-en dans l’onglet « Page » de l’éditeur.')}</p><p class="meta tiny">Durée conseillée : ${Number(p.minutes) || 0} min</p>`;
    const active = $('#deck .slide-frame.is-active');
    if (active) active.scrollTop = 0;
  }

  function step(delta) {
    const s = viewerSession();
    if (!s) return;
    const next = state.viewerPage + delta;
    if (next < 0 || next >= s.pages.length) return;
    setViewerPage(next);
    history.replaceState(null, '', '#/viewer/' + next);
  }

  function paintQuiz(p) {
    const s = viewerSession();
    const qs = state.quizStates[p.id] || { index: 0, answers: {}, done: false };
    state.quizStates[p.id] = qs;
    const areas = $$(`[data-quiz-area][data-page-id="${p.id}"]`);
    areas.forEach((area) => { area.innerHTML = S.quizHTML(p, qs); });
  }

  /* ------------------------------------------------------------
     Modales
     ------------------------------------------------------------ */
  function download(name, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function shareURL(s) {
    return `${location.href.split('#')[0]}#/partage/${D.encodeSession(s)}`;
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return Promise.resolve();
  }

  function openModal(kind, payload) {
    const root = $('#modal-root');
    if (kind === 'publish') {
      const s = session();
      if (!s) return;
      const link = shareURL(s);
      const tooLong = link.length > 12000;
      root.innerHTML = `<div class="modal-root" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
          <div class="modal-head"><div><h2 id="m-title">Partager la séance</h2><p>Un lien, un fichier : la séance s’ouvre sans compte.</p></div>
          <button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button></div>
          <div class="modal-body">
            <div class="share-link"><span id="share-link-text">${esc(link)}</span><button class="btn btn-soft btn-sm" data-copy-link>Copier</button></div>
            <div class="share-row">
              <div class="share-art"><svg class="ico"><use href="#i-share"/></svg></div>
              <div><strong>Lien autonome</strong><p>La séance entière est encodée dans le lien. Idéal pour envoyer par mail ou déposer dans l’ENT.</p></div>
            </div>
            ${tooLong ? `<p class="form-warn">Ce lien est long. Préférez le fichier .json pour un partage fiable.</p>` : ''}
            <div class="share-options">
              <div class="share-opt"><div><span>Fichier de la séance</span><small>Réimportable dans Kléo</small></div><button class="btn btn-soft btn-sm" data-export-json><svg class="ico"><use href="#i-download"/></svg>JSON</button></div>
              <div class="share-opt"><div><span>Tester le lien</span><small>Ouvre le lien dans un nouvel onglet</small></div><button class="btn btn-soft btn-sm" data-open-share>Ouvrir</button></div>
              <div class="share-opt"><div><span>Nom de la séance</span><small>${esc(s.title)}</small></div><span class="badge badge-soft">${s.pages.length} pages</span></div>
            </div>
          </div>
          <div class="modal-foot"><button class="btn btn-primary" data-close-modal>Terminé</button></div>
        </div>
      </div>`;
      return;
    }
    if (kind === 'zoom-doc') {
      const viewed = state.viewer ? viewerSession().pages[state.viewerPage] : page();
      const d = viewed && viewed.kind === 'document' ? viewed.data : {};
      root.innerHTML = `<div class="modal-root" data-backdrop>
        <div class="modal modal-doc" role="dialog" aria-modal="true" aria-labelledby="m-doc">
          <div class="modal-head"><div><h2 id="m-doc">${esc(d.stamp || 'Document')}</h2><p>${esc(d.source || '')}</p></div><button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button></div>
          <div class="modal-body"><div class="doc-zoom"><span class="doc-stamp">${esc(d.stamp || 'Document')}</span><blockquote>${esc(d.quote || '')}</blockquote><p class="doc-src">${esc(d.source || '')}</p></div></div>
          <div class="modal-foot"><button class="btn btn-primary" data-close-modal>J’ai lu</button></div>
        </div>
      </div>`;
      return;
    }
    if (kind === 'add-page') {
      root.innerHTML = `<div class="modal-root" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-add">
          <div class="modal-head"><div><h2 id="m-add">Ajouter une page</h2><p>Choisissez ce que la page doit faire apprendre.</p></div><button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button></div>
          <div class="modal-body"><div class="block-grid">${E.addPageGrid()}</div></div>
        </div>
      </div>`;
      return;
    }
    if (kind === 'session') {
      const s = session();
      if (!s) return;
      root.innerHTML = `<div class="modal-root" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-session">
          <div class="modal-head"><div><h2 id="m-session">Réglages de la séance</h2><p>Le titre et le cadrage général.</p></div><button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button></div>
          <div class="modal-body">
            <label class="efield"><span>Titre</span><input class="einput" data-session-field="title" value="${esc(s.title)}"></label>
            <div class="efields">
              <label class="efield half"><span>Matière</span><select class="einput" data-session-field="subject">${Object.entries(D.SUBJECTS).map(([k, v]) => `<option value="${k}" ${s.subject === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
              <label class="efield half"><span>Niveau</span><input class="einput" data-session-field="level" value="${esc(s.level)}"></label>
            </div>
            <div class="efields">
              <label class="efield half"><span>Durée (min)</span><input class="einput" type="number" min="5" max="300" data-session-field="duration" value="${Number(s.duration) || 55}"></label>
              <label class="efield half"><span>Motif de couverture</span><input class="einput" data-session-field="coverWord" value="${esc(s.coverWord || '')}" placeholder="1789, 4E, VOTE…"></label>
            </div>
            <label class="efield"><span>Thème</span><input class="einput" data-session-field="theme" value="${esc(s.theme || '')}" placeholder="Le XVIIIe siècle, Lumières et révolutions"></label>
            <label class="efield"><span>Statut</span><select class="einput" data-session-field="status"><option ${s.status !== 'Prête' ? 'selected' : ''}>Brouillon</option><option ${s.status === 'Prête' ? 'selected' : ''}>Prête</option></select></label>
          </div>
          <div class="modal-foot"><button class="btn btn-ghost" data-close-modal>Annuler</button><button class="btn btn-primary" data-save-session>Enregistrer</button></div>
        </div>
      </div>`;
      return;
    }
    if (kind === 'menu') {
      const s = state.sessions.find((x) => x.id === payload);
      if (!s) return;
      root.innerHTML = `<div class="modal-root" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-menu">
          <div class="modal-head"><div><h2 id="m-menu">${esc(s.title)}</h2><p>${s.pages.length} pages · ${relDate(s.updatedAt)}</p></div><button class="icon-btn" data-close-modal aria-label="Fermer"><svg class="ico"><use href="#i-close"/></svg></button></div>
          <div class="modal-body menu-list">
            <button class="menu-row" data-open-session="${s.id}"><svg class="ico"><use href="#i-settings"/></svg><span><strong>Ouvrir l’éditeur</strong><small>Modifier les pages et le quiz</small></span></button>
            <button class="menu-row" data-play="${s.id}"><svg class="ico"><use href="#i-play"/></svg><span><strong>Lancer la séance</strong><small>Mode plein écran</small></span></button>
            <button class="menu-row" data-dup="${s.id}"><svg class="ico"><use href="#i-copy"/></svg><span><strong>Dupliquer</strong><small>Une copie indépendante</small></span></button>
            <button class="menu-row" data-export-session="${s.id}"><svg class="ico"><use href="#i-download"/></svg><span><strong>Télécharger</strong><small>Fichier .json</small></span></button>
            <button class="menu-row danger" data-del="${s.id}"><svg class="ico"><use href="#i-close"/></svg><span><strong>Supprimer</strong><small>Action définitive</small></span></button>
          </div>
        </div>
      </div>`;
      return;
    }
  }

  function closeModal() { $('#modal-root').innerHTML = ''; }

  /* ------------------------------------------------------------
     Tiroirs et plein écran
     ------------------------------------------------------------ */
  function openDrawer(name) {
    const d = $('#drawer-' + name);
    if (!d) return;
    $$('.drawer').forEach((x) => { x.hidden = true; x.classList.remove('is-open'); });
    $('#drawer-scrim').hidden = false;
    d.hidden = false;
    requestAnimationFrame(() => d.classList.add('is-open'));
  }
  function closeDrawer() {
    $$('.drawer').forEach((d) => { d.classList.remove('is-open'); setTimeout(() => { if (!d.classList.contains('is-open')) d.hidden = true; }, 280); });
    const scrim = $('#drawer-scrim');
    if (scrim) scrim.hidden = true;
  }

  function openInspector() {
    $('#editor-inspector')?.classList.add('is-open');
    const scrim = $('#inspector-scrim');
    if (scrim) scrim.hidden = false;
  }
  function closeInspector() {
    $('#editor-inspector')?.classList.remove('is-open');
    const scrim = $('#inspector-scrim');
    if (scrim) scrim.hidden = true;
  }

  /* ------------------------------------------------------------
     Navigation
     ------------------------------------------------------------ */
  const SCREENS = ['library', 'import', 'generate', 'editor'];
  function parseHash() { return location.hash.replace(/^#\/?/, '') || 'library'; }

  function showScreen(name) {
    state.screen = name;
    if (name !== 'generate') clearGeneration();
    document.body.classList.toggle('is-editing', name === 'editor');
    SCREENS.forEach((s) => $('#screen-' + s)?.classList.toggle('is-active', s === name));
    $$('.rail-link').forEach((a) => a.classList.toggle('is-active', (a.getAttribute('href') || '').includes('/' + name)));
    if (name === 'editor') { renderEditor(true); closeInspector(); }
    if (name === 'library') renderLibrary();
    if (name === 'import') { fillImportForm(); renderFiles(); }
    if (name !== 'viewer') window.scrollTo({ top: 0 });
  }

  function go(name) {
    const target = '#/' + name;
    if (location.hash === target) route();
    else location.hash = target;
  }

  function route() {
    const [name, arg] = parseHash().split('/');
    if (name === 'viewer') { openViewer(Number(arg) || 0); return; }
    if (name === 'partage') {
      const shared = D.decodeSession(arg || '');
      if (!shared) { toast('Lien de partage invalide ou incomplet.'); showScreen('library'); return; }
      if (state.sessions.some((s) => s.id === shared.id)) shared.id = D.uid('s');
      state.sessions.push(shared);
      state.currentId = shared.id;
      save(true);
      history.replaceState(null, '', '#/viewer/0');
      showScreen('library');
      openViewer(0);
      toast('Séance importée depuis le lien. Elle est maintenant dans votre bibliothèque.');
      return;
    }
    if (state.viewer) {
      state.viewer = false;
      $('#screen-viewer').hidden = true;
      document.body.style.overflow = '';
      closeDrawer();
    }
    closeInspector();
    if (SCREENS.includes(name)) showScreen(name);
    else showScreen('library');
  }

  /* ------------------------------------------------------------
     Événements
     ------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const t = e.target;

    if (t.closest('[data-go]')) { go(t.closest('[data-go]').dataset.go); return; }

    const example = t.closest('[data-open-viewer]');
    if (example) {
      const first = state.sessions[0];
      if (first) { state.currentId = first.id; openViewer(0); }
      else { toast('Créez une séance pour commencer.'); go('import'); }
      return;
    }

    const openS = t.closest('[data-open-session]');
    if (openS) {
      state.currentId = openS.dataset.openSession;
      state.pageIndex = 0;
      state.tab = 'content';
      closeModal();
      go('editor');
      return;
    }

    const play = t.closest('[data-play]');
    if (play) { state.currentId = play.dataset.play; closeModal(); openViewer(0); return; }

    const menu = t.closest('[data-menu]');
    if (menu) { openModal('menu', menu.dataset.menu); return; }

    const dup = t.closest('[data-dup]');
    if (dup) {
      const src = state.sessions.find((x) => x.id === dup.dataset.dup);
      if (!src) return;
      const copy = D.clone(src);
      copy.id = D.uid('s');
      copy.title = `${src.title} (copie)`;
      copy.createdAt = D.now();
      copy.updatedAt = D.now();
      copy.pages = copy.pages.map((p) => ({ ...p, id: D.uid('p') }));
      state.sessions.push(copy);
      save(true);
      closeModal();
      renderLibrary();
      toast('Séance dupliquée.');
      return;
    }

    const del = t.closest('[data-del]');
    if (del) {
      const s = state.sessions.find((x) => x.id === del.dataset.del);
      if (!s) return;
      if (!window.confirm(`Supprimer « ${s.title} » ? Cette action est définitive.`)) return;
      state.sessions = state.sessions.filter((x) => x.id !== s.id);
      if (state.currentId === s.id) state.currentId = state.sessions[0]?.id || null;
      save(true);
      closeModal();
      renderLibrary();
      toast('Séance supprimée.');
      return;
    }

    const exp = t.closest('[data-export-session]');
    if (exp) {
      const s = state.sessions.find((x) => x.id === exp.dataset.exportSession);
      if (s) { download(`${slug(s.title)}.json`, JSON.stringify(s, null, 2)); toast('Fichier téléchargé.'); }
      return;
    }

    if (t.closest('[data-export-json]')) {
      const s = session();
      if (s) { download(`${slug(s.title)}.json`, JSON.stringify(s, null, 2)); toast('Fichier téléchargé.'); }
      return;
    }

    if (t.closest('[data-copy-link]')) {
      const s = session();
      if (!s) return;
      copyText(shareURL(s)).then(() => toast('Lien copié.')).catch(() => toast('Copie impossible — sélectionnez le lien.'));
      return;
    }

    if (t.closest('[data-open-share]')) {
      const s = session();
      if (s) window.open(shareURL(s), '_blank', 'noopener');
      return;
    }

    if (t.closest('#import-json-btn')) { $('#import-json-input').click(); return; }

    if (t.closest('#generate-btn')) {
      state.importOpts.title = ($('#session-title')?.value || '').trim();
      createFromImport(false);
      return;
    }
    if (t.closest('#blank-session')) {
      state.importOpts.title = ($('#session-title')?.value || '').trim();
      createFromImport(true);
      return;
    }

    if (t.closest('#dropzone')) { $('#file-input').click(); return; }
    if (t.closest('#link-add')) {
      const input = $('#link-input');
      const v = input.value.trim();
      if (!v) { toast('Collez d’abord un lien.'); input.focus(); return; }
      state.importFiles.push({ name: v.replace(/^https?:\/\//, '').slice(0, 56), meta: 'Lien · joint', type: 'link', size: 0 });
      input.value = '';
      renderFiles();
      return;
    }
    const rm = t.closest('[data-remove-file]');
    if (rm) { state.importFiles.splice(Number(rm.dataset.removeFile), 1); renderFiles(); return; }

    if (t.closest('[data-close-modal]')) { closeModal(); return; }
    if (t.closest('.modal-root[data-backdrop]') && !t.closest('.modal')) { closeModal(); return; }

    if (t.closest('[data-save-session]')) {
      const s = session();
      if (s) {
        $$('[data-session-field]').forEach((el) => { s[el.dataset.sessionField] = el.dataset.sessionField === 'duration' ? Number(el.value) || 55 : el.value; });
        save(true);
        closeModal();
        renderEditor(true);
        toast('Réglages enregistrés.');
      }
      return;
    }

    if (t.closest('[data-modal]')) { openModal(t.closest('[data-modal]').dataset.modal); return; }

    /* Éditeur */
    const edPage = t.closest('[data-editor-page]');
    if (edPage) { selectPage(Number(edPage.dataset.editorPage)); return; }

    if (t.closest('#add-page-btn') || t.closest('#mobile-blocks')) { openModal('add-page'); return; }
    const addPage = t.closest('[data-add-page]');
    if (addPage) {
      const s = session();
      if (!s) return;
      const p = D.createPage(addPage.dataset.addPage);
      s.pages.splice(state.pageIndex + 1, 0, p);
      state.pageIndex += 1;
      state.tab = 'content';
      save(true);
      closeModal();
      renderEditor(true);
      toast('Page ajoutée.');
      return;
    }

    if (t.closest('[data-tab]')) {
      state.tab = t.closest('[data-tab]').dataset.tab;
      renderInspector();
      return;
    }

    if (t.closest('[data-page-up]') || t.closest('[data-page-down]')) {
      const s = session();
      const dir = t.closest('[data-page-up]') ? -1 : 1;
      const j = state.pageIndex + dir;
      if (j < 0 || j >= s.pages.length) return;
      [s.pages[state.pageIndex], s.pages[j]] = [s.pages[j], s.pages[state.pageIndex]];
      state.pageIndex = j;
      save(true); renderEditor(true);
      return;
    }
    if (t.closest('[data-page-dup]')) {
      const s = session();
      const copy = D.clone(s.pages[state.pageIndex]);
      copy.id = D.uid('p');
      copy.name = `${copy.name} (copie)`;
      s.pages.splice(state.pageIndex + 1, 0, copy);
      state.pageIndex += 1;
      save(true); renderEditor(true);
      toast('Page dupliquée.');
      return;
    }
    if (t.closest('[data-page-del]')) {
      const s = session();
      if (s.pages.length <= 1) { toast('Une séance doit garder au moins une page.'); return; }
      if (!window.confirm(`Supprimer la page « ${page().name} » ?`)) return;
      s.pages.splice(state.pageIndex, 1);
      state.pageIndex = Math.max(0, state.pageIndex - 1);
      save(true); renderEditor(true);
      toast('Page supprimée.');
      return;
    }

    const listAdd = t.closest('[data-list-add]');
    if (listAdd) {
      const p = page();
      const key = listAdd.dataset.listAdd;
      const schema = D.SCHEMAS[p.kind];
      const def = schema.lists.find((l) => l.key === key);
      p.data[key] = p.data[key] || [];
      const item = {};
      (def.fields || []).forEach((f) => { item[f.k] = ''; });
      if (key === 'places') { const pos = D.DEFAULT_PLACES[p.data[key].length % D.DEFAULT_PLACES.length]; item.x = pos[0]; item.y = pos[1]; item.name = 'Nouveau lieu'; }
      p.data[key].push(item);
      save(true); renderEditor(true);
      return;
    }
    const listDel = t.closest('[data-list-del]');
    if (listDel) {
      const p = page();
      p.data[listDel.dataset.listDel].splice(Number(listDel.dataset.idx), 1);
      save(true); renderEditor(true);
      return;
    }
    const listUp = t.closest('[data-list-up]');
    const listDown = t.closest('[data-list-down]');
    if (listUp || listDown) {
      const el = listUp || listDown;
      const p = page();
      const arr = p.data[el.dataset.listUp || el.dataset.listDown];
      const i = Number(el.dataset.idx);
      const j = listUp ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      save(true); renderEditor(true);
      return;
    }

    /* Quiz builder */
    if (t.closest('[data-q-add]') || t.closest('[data-q-add-tf]')) {
      const p = page();
      p.data.questions = p.data.questions || [];
      const tf = !!t.closest('[data-q-add-tf]');
      p.data.questions.push(tf
        ? { q: 'Vrai ou faux ?', options: ['Vrai', 'Faux'], correct: 0, good: 'Bonne réponse.', bad: 'Ce n’est pas la bonne réponse.' }
        : { q: 'Nouvelle question', options: ['La bonne réponse', 'Une autre réponse', 'Une troisième réponse'], correct: 0, good: 'Bonne réponse !', bad: 'Ce n’est pas la bonne réponse.' });
      save(true); renderEditor(true);
      return;
    }
    const qDel = t.closest('[data-q-del]');
    if (qDel) {
      const p = page();
      const i = Number(qDel.dataset.qDel);
      if (p.data.questions.length <= 1) { toast('Gardez au moins une question, ou supprimez la page.'); return; }
      p.data.questions.splice(i, 1);
      save(true); renderEditor(true);
      return;
    }
    const qUp = t.closest('[data-q-up]');
    const qDown = t.closest('[data-q-down]');
    if (qUp || qDown) {
      const el = qUp || qDown;
      const i = Number(el.dataset.qUp ?? el.dataset.qDown);
      const j = qUp ? i - 1 : i + 1;
      const p = page();
      if (j < 0 || j >= p.data.questions.length) return;
      [p.data.questions[i], p.data.questions[j]] = [p.data.questions[j], p.data.questions[i]];
      save(true); renderEditor(true);
      return;
    }
    const qOptAdd = t.closest('[data-qopt-add]');
    if (qOptAdd) {
      const p = page();
      const q = p.data.questions[Number(qOptAdd.dataset.qoptAdd)];
      q.options = q.options || [];
      q.options.push(`Réponse ${q.options.length + 1}`);
      save(true); renderEditor(true);
      return;
    }
    const qOptDel = t.closest('[data-qopt-del]');
    if (qOptDel) {
      const p = page();
      const q = p.data.questions[Number(qOptDel.dataset.qoptDel)];
      if (q.options.length <= 2) { toast('Une question doit garder au moins deux réponses.'); return; }
      q.options.splice(Number(qOptDel.dataset.oi), 1);
      if (q.correct >= q.options.length) q.correct = 0;
      save(true); renderEditor(true);
      return;
    }

    /* Mode séance */
    if (t.closest('[data-viewer-close]')) { closeViewer(); return; }
    const stepEl = t.closest('[data-step]');
    if (stepEl) { step(Number(stepEl.dataset.step)); return; }
    const dot = t.closest('[data-dot]');
    if (dot) { setViewerPage(Number(dot.dataset.dot)); history.replaceState(null, '', '#/viewer/' + dot.dataset.dot); return; }
    const goto = t.closest('[data-page-goto]');
    if (goto) {
      if (state.viewer) { setViewerPage(Number(goto.dataset.pageGoto)); history.replaceState(null, '', '#/viewer/' + goto.dataset.pageGoto); closeDrawer(); }
      else { selectPage(Number(goto.dataset.pageGoto)); go('editor'); }
      return;
    }
    const synthQuiz = t.closest('[data-synth-quiz]');
    if (synthQuiz) {
      const idx = Number(synthQuiz.dataset.synthQuiz);
      if (idx >= 0) { const p = viewerSession().pages[idx]; state.quizStates[p.id] = { index: 0, answers: {}, done: false }; paintQuiz(p); setViewerPage(idx); history.replaceState(null, '', '#/viewer/' + idx); }
      return;
    }
    const synth = t.closest('[data-synth]');
    if (synth) {
      const s = viewerSession();
      const label = (s.pages[state.viewerPage].data.links || [])[Number(synth.dataset.synth)] || '';
      if (/quiz/i.test(label)) { const idx = s.pages.findIndex((p) => p.kind === 'quiz'); if (idx >= 0) setViewerPage(idx); }
      else if (/début|debut/i.test(label)) setViewerPage(0);
      else if (/partager/i.test(label)) openModal('publish');
      else toast('Fiche de révision : à ajouter dans une prochaine version.');
      return;
    }

    const event = t.closest('[data-event]');
    if (event) {
      const frame = event.closest('.slide-frame');
      const p = viewerSession().pages[Number(frame.dataset.frame)];
      const idx = Number(event.dataset.event);
      frame.querySelector('[data-tl-detail]').innerHTML = S.eventDetailHTML(p.data.events[idx]);
      frame.querySelectorAll('.tl-event').forEach((b, k) => { b.classList.toggle('is-on', k === idx); b.setAttribute('aria-pressed', String(k === idx)); });
      return;
    }
    const place = t.closest('[data-place]');
    if (place) {
      const frame = place.closest('.slide-frame');
      const p = viewerSession().pages[Number(frame.dataset.frame)];
      const idx = Number(place.dataset.place);
      const card = frame.querySelector('[data-place-card]');
      card.innerHTML = S.placeCardHTML(p.data.places[idx], idx);
      card.dataset.num = pad(idx + 1);
      frame.querySelectorAll('.map-pin').forEach((g, k) => g.classList.toggle('is-on', k === idx));
      frame.querySelectorAll('.place-chip').forEach((b, k) => { b.classList.toggle('is-on', k === idx); b.setAttribute('aria-pressed', String(k === idx)); });
      return;
    }
    const flip = t.closest('[data-flip]');
    if (flip) { flip.classList.toggle('is-flipped'); flip.setAttribute('aria-pressed', String(flip.classList.contains('is-flipped'))); return; }

    const qOpt = t.closest('[data-quiz-opt]');
    if (qOpt) {
      const area = qOpt.closest('[data-quiz-area]');
      const p = viewerSession().pages.find((x) => x.id === area.dataset.pageId) || viewerSession().pages[state.viewerPage];
      const qs = state.quizStates[p.id];
      if (!qs || qs.done) return;
      if (qs.answers[qs.index] !== undefined) return;
      qs.answers[qs.index] = Number(qOpt.dataset.quizOpt);
      paintQuiz(p);
      return;
    }
    const qNext = t.closest('[data-quiz-next]');
    if (qNext) {
      const area = qNext.closest('[data-quiz-area]');
      const p = viewerSession().pages.find((x) => x.id === area.dataset.pageId) || viewerSession().pages[state.viewerPage];
      const qs = state.quizStates[p.id];
      if (!qs || qs.answers[qs.index] === undefined) return;
      if (qs.index < (p.data.questions || []).length - 1) qs.index += 1;
      else qs.done = true;
      paintQuiz(p);
      return;
    }
    if (t.closest('[data-quiz-restart]')) {
      const area = t.closest('[data-quiz-area]');
      const p = viewerSession().pages.find((x) => x.id === area.dataset.pageId) || viewerSession().pages[state.viewerPage];
      state.quizStates[p.id] = { index: 0, answers: {}, done: false };
      paintQuiz(p);
      return;
    }

    if (t.closest('[data-drawer="summary"]')) { openDrawer('summary'); return; }
    if (t.closest('[data-close-drawer]')) { closeDrawer(); return; }
    if (t.closest('#drawer-scrim')) { closeDrawer(); return; }
    if (t.closest('#teacher-toggle')) {
      const on = $('#screen-viewer').classList.toggle('teacher-mode');
      $('#teacher-toggle').classList.toggle('is-on', on);
      toast(on ? 'Mode prof : les zones interactives sont signalées.' : 'Mode prof désactivé.');
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

    if (t.closest('#present-btn') || t.closest('#canvas-present')) {
      openViewer(state.pageIndex);
      return;
    }
    if (t.closest('#edit-page-btn')) { openInspector(); return; }
    if (t.closest('#inspector-close') || t.closest('#inspector-scrim')) { closeInspector(); return; }

    if (t.closest('[data-toggle]')) { const c = t.closest('[data-toggle]'); c.classList.toggle('is-on'); return; }
    const seg = t.closest('.segmented button');
    if (seg) {
      $$('button', seg.parentElement).forEach((b) => b.classList.remove('is-on'));
      seg.classList.add('is-on');
      const wrapp = seg.closest('[data-seg]');
      if (wrapp) {
        if (wrapp.dataset.seg === 'subject') state.importOpts.subject = seg.dataset.value;
        if (wrapp.dataset.seg === 'duration') state.importOpts.duration = Number(seg.dataset.value);
      }
      return;
    }

    const filter = t.closest('[data-filter]');
    if (filter) {
      const label = filter.textContent.trim().toLowerCase();
      state.libraryFilter = label.startsWith('hist') ? 'histoire' : label.startsWith('géo') || label.startsWith('geo') ? 'geo' : label.startsWith('emc') ? 'emc' : 'all';
      $$('[data-filter]').forEach((c) => c.classList.toggle('is-on', c === filter));
      applyLibraryFilter();
      return;
    }

    const soon = t.closest('[data-soon]');
    if (soon) { e.preventDefault(); toast(soon.dataset.soon + ' — à venir.'); return; }

    const toastEl = t.closest('[data-toast]');
    if (toastEl) { toast(toastEl.dataset.toast); }
  });

  /* Saisie dans l'éditeur */
  document.addEventListener('input', (e) => {
    const el = e.target;
    const s = session();
    const p = page();
    if (s && p) {
      if (el.matches('[data-field]')) {
        setPath(p.data, el.dataset.field, el.dataset.split ? splitValue(el.value, el.dataset.split) : el.value);
        refreshAfterEdit();
      } else if (el.matches('[data-list]')) {
        const arr = p.data[el.dataset.list];
        if (arr && arr[Number(el.dataset.idx)]) {
          const v = el.dataset.split ? splitValue(el.value, el.dataset.split) : el.value;
          arr[Number(el.dataset.idx)][el.dataset.ki] = v;
          refreshAfterEdit();
        }
      } else if (el.matches('[data-page-field]')) {
        const k = el.dataset.pageField;
        p[k] = k === 'minutes' ? Number(el.value) || 0 : el.value;
        refreshAfterEdit();
      } else if (el.matches('[data-q="q"]')) {
        p.data.questions[Number(el.dataset.qi)].q = el.value;
        refreshAfterEdit();
      } else if (el.matches('[data-qopt]')) {
        p.data.questions[Number(el.dataset.qi)].options[Number(el.dataset.qopt)] = el.value;
        refreshAfterEdit();
      } else if (el.matches('[data-qgood]')) {
        p.data.questions[Number(el.dataset.qgood)].good = el.value;
        refreshAfterEdit();
      } else if (el.matches('[data-qbad]')) {
        p.data.questions[Number(el.dataset.qbad)].bad = el.value;
        refreshAfterEdit();
      }
    }
    if (el.matches('#session-title')) { state.importOpts.title = el.value; }
    if (el.matches('.search input')) applyLibraryFilter();
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    const s = session();
    const p = page();
    if (s && p) {
      if (el.matches('[data-qcorrect]')) {
        p.data.questions[Number(el.dataset.qcorrect)].correct = Number(el.value);
        refreshAfterEdit();
      }
      if (el.matches('[data-session-field]')) {
        s[el.dataset.sessionField] = el.dataset.sessionField === 'duration' ? Number(el.value) || 55 : el.value;
        if (el.dataset.sessionField === 'subject') renderEditor(true);
      }
    }
    if (el.id === 'file-input') { addImportFiles(el.files); el.value = ''; }
    if (el.id === 'level') { state.importOpts.level = el.value; }
    if (el.id === 'import-json-input') {
      const f = el.files && el.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const list = Array.isArray(data) ? data : [data];
          list.forEach((x) => { if (x && Array.isArray(x.pages) && x.pages.length) { x.id = D.uid('s'); x.updatedAt = D.now(); state.sessions.push(x); } });
          save(true); renderLibrary(); toast(`${list.length} séance(s) importée(s).`);
        } catch (err) { toast('Fichier illisible : ce n’est pas un export Kléo.'); }
      };
      reader.readAsText(f);
      el.value = '';
    }
    if (el.matches('[data-deposit-input]')) {
      const f = el.files && el.files[0];
      if (!f) return;
      const drop = el.closest('[data-drop]');
      drop.classList.add('is-done');
      drop.innerHTML = `<span class="big-ico" style="background:var(--ok)"><svg class="ico"><use href="#i-check"/></svg></span><strong>Travail déposé</strong><small>${esc(f.name)}</small>`;
      toast('Devoir déposé (démo : rien n’est envoyé).');
    }
  });

  /* Drag & drop import */
  const dz = $('#dropzone');
  ['dragenter', 'dragover'].forEach((ev) => dz?.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz?.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-over'); }));
  dz?.addEventListener('drop', (e) => addImportFiles(e.dataTransfer.files));
  dz?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file-input').click(); } });

  /* Dépôt devoir */
  document.addEventListener('dragover', (e) => { const d = e.target.closest('[data-drop]'); if (d) { e.preventDefault(); d.classList.add('is-over'); } });
  document.addEventListener('drop', (e) => {
    const d = e.target.closest('[data-drop]');
    if (!d) return;
    e.preventDefault(); d.classList.remove('is-over');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) { d.classList.add('is-done'); d.innerHTML = `<span class="big-ico" style="background:var(--ok)"><svg class="ico"><use href="#i-check"/></svg></span><strong>${esc(f.name)}</strong><small>Travail déposé.</small>`; }
  });

  /* Timer */
  function toggleTimer() {
    const btn = $('#timer-btn');
    if (state.timer) { clearInterval(state.timer); state.timer = null; btn.textContent = 'Reprendre'; return; }
    btn.textContent = 'Pause';
    state.timer = setInterval(() => {
      state.seconds += 1;
      const m = Math.floor(state.seconds / 60), s = state.seconds % 60;
      $('#notes-time').textContent = `${pad(m)}:${pad(s)}`;
    }, 1000);
  }

  /* Clavier */
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"]')) {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (e.key === 'Escape') {
      if ($('#modal-root').children.length) { closeModal(); return; }
      if (!$('#drawer-scrim').hidden) { closeDrawer(); return; }
      if ($('#editor-inspector')?.classList.contains('is-open')) { closeInspector(); return; }
      if (state.viewer) closeViewer();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('.search input')?.focus(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(true); toast('Séance enregistrée.'); return; }
    if (!state.viewer) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'Home') setViewerPage(0);
    if (e.key === 'End') setViewerPage(viewerSession().pages.length - 1);
  });

  /* Swipe */
  const deckWrap = $('#deck-wrap');
  let tx = 0, ty = 0, touching = false;
  deckWrap?.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; touching = true;
  }, { passive: true });
  deckWrap?.addEventListener('touchend', (e) => {
    if (!touching) return;
    touching = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('hashchange', route);

  /* ------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------ */
  renderLibrary();
  renderFiles();
  route();
  window.addEventListener('beforeunload', () => { state.genTimers.forEach(clearTimeout); });
})();
