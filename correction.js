/* ============================================================
   Clio — espace Correction (professeur)
   Rassemble les copies envoyées par les activités, par activité
   et par code de session. Les notes sont enregistrées dans la base
   (à côté des copies) : elles suivent le professeur sur tous ses
   appareils.
   ============================================================ */
window.KleoCorrection = (() => {
  'use strict';

  const DB = 'https://sync-3626f-default-rtdb.europe-west1.firebasedatabase.app';
  const BROKER = 'wss://test.mosquitto.org:8081/mqtt';
  const HISTORY_KEY = 'clio_session_history';
  const POLL_MS = 20000;

  const D = window.KleoData;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const pts = (v) => Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const nl2br = (v) => esc(v).replace(/\n/g, '<br>');

  const st = {
    mounted: false,
    kits: {},          // projectId -> kit chargé (contenu de l'activité)
    sessions: {},      // projectId -> { code: { meta, copies, grades } }
    loading: false,
    loaded: false,
    error: '',
    pid: null,
    code: null,
    copyId: null,
    timer: null,
    saveTimers: {},
    saving: {},        // copyKey -> 'saving' | 'saved' | 'error'
    localGrades: {},   // copyKey -> grades en cours d'édition (prioritaires sur la base)
    pendingImport: ''
  };

  const copyKey = (pid, code, id) => pid + '|' + code + '|' + id;
  const projects = () => (D.PROJECTS || []);
  const projectById = (id) => projects().find((p) => p.id === id);
  const withCopies = () => projects().filter((p) => p.copies);

  function toast(msg) {
    if (window.KleoToast) window.KleoToast(msg);
  }

  /* ---------------- Base ---------------- */
  async function getJson(path) {
    const r = await fetch(DB + '/' + path + '.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  async function putJson(path, value) {
    const r = await fetch(DB + '/' + path + '.json', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function sessionHistory() {
    try { const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
  }
  function rememberSession(projectId, code) {
    const h = sessionHistory();
    const list = Array.isArray(h[projectId]) ? h[projectId] : [];
    if (!list.includes(code)) list.push(code);
    h[projectId] = list;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch (e) {}
  }

  /** Enregistre un code de session créé dans le Panneau (méta + index). */
  async function registerSession(project, code) {
    rememberSession(project.id, code);
    if (!project.copies) return;
    try {
      await putJson(project.copies.root + '/index/' + code, { createdAt: Date.now(), app: 'clio', project: project.id });
    } catch (e) { /* l'historique local suffit sur cet appareil */ }
  }

  async function loadProjectSessions(project) {
    const root = project.copies.root;
    let index = {};
    try { index = (await getJson(root + '/index')) || {}; } catch (e) { index = {}; }
    const codes = new Set(Object.keys(index));
    (sessionHistory()[project.id] || []).forEach((c) => codes.add(c));
    try {
      const last = JSON.parse(localStorage.getItem('clio_enquete_sessions') || '{}')[project.id];
      if (last) codes.add(last);
    } catch (e) {}
    const out = {};
    await Promise.all(Array.from(codes).map(async (code) => {
      try {
        const data = await getJson(root + '/sessions/' + code);
        if (data) out[code] = { meta: data.meta || index[code] || {}, copies: data.copies || {}, grades: data.grades || {} };
      } catch (e) { /* session illisible : ignorée */ }
    }));
    return out;
  }

  async function refresh(silent) {
    if (st.loading) return;
    st.loading = true;
    const before = openSignature();
    if (!silent) renderList();
    try {
      const results = await Promise.all(withCopies().map(async (p) => [p.id, await loadProjectSessions(p)]));
      results.forEach(([id, sessions]) => { st.sessions[id] = sessions; });
      st.error = '';
    } catch (e) {
      st.error = 'Base injoignable. Vérifie la connexion.';
    }
    st.loading = false;
    st.loaded = true;
    if (!st.code) autoSelect();
    renderList();
    const sig = openSignature();
    if (!silent || (sig !== before && !isTyping())) renderView(true);
  }

  /** Empreinte de la copie ouverte : on ne redessine que si elle a changé. */
  function openSignature() {
    const s = st.sessions[st.pid]?.[st.code];
    if (!s || !st.copyId) return '';
    const local = st.localGrades[copyKey(st.pid, st.code, st.copyId)];
    return JSON.stringify([s.copies?.[st.copyId]?.at, local ? 'local' : s.grades?.[st.copyId]?.at]);
  }

  function autoSelect() {
    for (const p of withCopies()) {
      const list = sortedSessions(p.id).filter((s) => Object.keys(s.copies).length);
      if (list.length) { st.pid = p.id; st.code = list[0].code; return; }
    }
  }

  function sortedSessions(pid) {
    const sessions = st.sessions[pid] || {};
    return Object.entries(sessions)
      .map(([code, s]) => ({ code, ...s }))
      .sort((a, b) => (Number(b.meta?.createdAt) || 0) - (Number(a.meta?.createdAt) || 0));
  }

  function isTyping() {
    const el = document.activeElement;
    return !!(el && el.closest && el.closest('#corr-view') && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'));
  }

  /* ---------------- Contenu des activités ---------------- */
  async function loadKit(project) {
    if (st.kits[project.id]) return st.kits[project.id];
    const cfg = project.copies;
    if (cfg.kind !== 'regimes') throw new Error('kind');
    const v = '?v=' + Math.floor(Date.now() / 3600000);
    const [content, map] = await Promise.all([
      import(cfg.base + 'content.js' + v),
      import(cfg.base + 'map.js' + v).catch(() => null)
    ]);
    const kit = makeRegimesKit(content, map);
    st.kits[project.id] = kit;
    loadTextOverrides(cfg.textsTopic, (overrides) => {
      kit.applyOverrides(overrides);
      renderView(true);
    });
    return kit;
  }

  /** Textes modifiés par le professeur dans l'activité (message MQTT retenu). */
  function loadTextOverrides(topic, cb) {
    if (!topic || typeof mqtt === 'undefined') return;
    let done = false;
    let client = null;
    try {
      client = mqtt.connect(BROKER, { clientId: 'clio-corr-' + Math.random().toString(16).slice(2), clean: true, connectTimeout: 6000, reconnectPeriod: 0 });
    } catch (e) { return; }
    const stop = () => { try { client.end(true); } catch (e) {} };
    client.on('connect', () => client.subscribe(topic, { qos: 1 }));
    client.on('message', (t, payload) => {
      if (t !== topic || done) return;
      done = true;
      try { cb(JSON.parse(payload.toString()) || {}); } catch (e) {}
      stop();
    });
    client.on('error', () => {});
    setTimeout(() => { if (!done) { done = true; stop(); } }, 8000);
  }

  function makeRegimesKit(C, M) {
    const { DOSSIERS, MECHANISMS, SORT_COLUMNS, SORT_ITEMS, EVALUATION } = C;
    const QIDS = DOSSIERS.flatMap((d) => d.questions.map((q) => q.id));
    const MIDS = MECHANISMS.map((m) => m.id);
    const SIDS = SORT_ITEMS.map((i) => i.id);
    const MECH = { u: 'urss', a: 'allemagne', b: 'both' };
    const MECH_CODE = { urss: 'u', allemagne: 'a', both: 'b' };
    const COL = { c: 'commun', u: 'urss', a: 'allemagne', n: 'nuance' };
    const COL_CODE = { commun: 'c', urss: 'u', allemagne: 'a', nuance: 'n' };

    function target(key) {
      const parts = String(key || '').split('.');
      const root = parts[0];
      if (root === 'evaluation') return { obj: EVALUATION, rest: parts.slice(1) };
      if (root === 'dossier') { const d = DOSSIERS.find((x) => x.id === parts[1]); return d ? { obj: d, rest: parts.slice(2) } : null; }
      if (root === 'question') {
        for (const d of DOSSIERS) { const q = d.questions.find((x) => x.id === parts[1]); if (q) return { obj: q, rest: parts.slice(2) }; }
        return null;
      }
      if (root === 'mechanism') { const m = MECHANISMS.find((x) => x.id === parts[1]); return m ? { obj: m, rest: parts.slice(2) } : null; }
      if (root === 'sort') { const i = SORT_ITEMS.find((x) => x.id === parts[1]); return i ? { obj: i, rest: parts.slice(2) } : null; }
      return null;
    }
    function applyOverrides(overrides) {
      Object.entries(overrides || {}).forEach(([key, value]) => {
        if (typeof value !== 'string' || !value.trim()) return;
        const t = target(key);
        if (!t || !t.rest.length) return;
        let node = t.obj;
        for (let i = 0; i < t.rest.length - 1; i++) { node = node[t.rest[i]]; if (node == null) return; }
        node[t.rest[t.rest.length - 1]] = value;
      });
    }

    function expand(p) {
      if (p && p.version === 1) return p;
      if (!p || p.v !== 2) throw new Error('format');
      const dossiers = {};
      DOSSIERS.forEach((d) => {
        const answers = {};
        d.questions.forEach((q) => { answers[q.id] = (p.a || [])[QIDS.indexOf(q.id)] || ''; });
        dossiers[d.id] = { answers };
      });
      const mechanisms = {};
      MIDS.forEach((id, i) => { mechanisms[id] = { choice: MECH[(p.m || '')[i]] || '' }; });
      const sort = {};
      SIDS.forEach((id, i) => { const c = COL[(p.s || '')[i]]; if (c) sort[id] = c; });
      const nodes = (p.n || []).map((r, i) => ({
        id: r[0] || 'n-' + i, category: r[1] || 'commun', x: Number(r[2]) || 0, y: Number(r[3]) || 0,
        w: Number(r[4]) || undefined, h: Number(r[5]) || undefined, shape: r[6] || 'rounded',
        title: r[7] || 'Idée', note: r[8] || '', source: r[9] || '', sourceUrl: r[10] || ''
      }));
      const links = (p.l || []).filter((r) => r && r[0] && r[1]).map((r, i) => ({ id: 'l-' + i, from: r[0], to: r[1], label: r[2] || '' }));
      return {
        version: 1, id: p.id, submittedAt: p.at,
        group: { className: (p.g || [])[0] || '', members: ((p.g || [])[1] || []).map(([f, l]) => ({ firstName: f || '', lastName: l || '' })) },
        dossiers, mechanisms, sort, map: { nodes, links }, conclusion: p.c || ''
      };
    }

    function compact(sub) {
      return {
        v: 2, id: sub.id, at: sub.submittedAt || new Date().toISOString(),
        g: [sub.group?.className || '', (sub.group?.members || []).map((m) => [m.firstName || '', m.lastName || ''])],
        a: QIDS.map((qid) => {
          const d = DOSSIERS.find((x) => x.questions.some((q) => q.id === qid));
          return String(sub.dossiers?.[d.id]?.answers?.[qid] || '');
        }),
        m: MIDS.map((id) => MECH_CODE[sub.mechanisms?.[id]?.choice] || '').join(''),
        s: SIDS.map((id) => COL_CODE[sub.sort?.[id]] || '').join(''),
        n: (sub.map?.nodes || []).map((n) => [n.id, n.category, Math.round(+n.x || 0), Math.round(+n.y || 0), Math.round(+n.w || 0), Math.round(+n.h || 0), n.shape || 'rounded', n.title || '', n.note || '', n.source || '', n.sourceUrl || '']),
        l: (sub.map?.links || []).map((l) => [l.from, l.to, l.label || '']),
        c: sub.conclusion || ''
      };
    }

    /** Barème complet : clé -> { max, correct } (correct = null si jugement du professeur). */
    function items(sub) {
      const list = [];
      DOSSIERS.forEach((d) => d.questions.forEach((q) => list.push({ key: 'q:' + q.id, max: Number(q.points) || 0, section: 'questions', correct: null })));
      MECHANISMS.forEach((m) => list.push({ key: 'm:' + m.id, max: Number(m.points) || 0, section: 'mechanisms', correct: sub ? sub.mechanisms?.[m.id]?.choice === m.answer : null }));
      SORT_ITEMS.forEach((i) => list.push({ key: 's:' + i.id, max: Number(i.points) || 0, section: 'sort', correct: sub ? sub.sort?.[i.id] === i.answer : null }));
      list.push({ key: 'map', max: Number(EVALUATION.map.points) || 0, section: 'map', correct: null });
      list.push({ key: 'conclusion', max: Number(EVALUATION.conclusion.points) || 0, section: 'conclusion', correct: null });
      return list;
    }
    const totalMax = () => items(null).reduce((s, i) => s + i.max, 0);

    function mapSvg(sub) {
      if (!M || !M.toSVGFromData || !sub.map?.nodes?.length) return '';
      try { return M.toSVGFromData(sub.map); } catch (e) { return ''; }
    }

    function csvHeader() {
      return [...QIDS.map((_, i) => 'Q' + (i + 1)), ...MIDS.map((_, i) => 'M' + (i + 1)), ...SIDS.map((_, i) => 'T' + (i + 1)), 'Carte', 'Conclusion'];
    }
    function csvKeys() {
      return [...QIDS.map((id) => 'q:' + id), ...MIDS.map((id) => 'm:' + id), ...SIDS.map((id) => 's:' + id), 'map', 'conclusion'];
    }

    return { C, expand, compact, items, totalMax, mapSvg, applyOverrides, csvHeader, csvKeys, render: (ctx) => renderRegimes(C, ctx) };
  }

  /* ---------------- Notes ---------------- */
  function gradesFor(pid, code, id) {
    const k = copyKey(pid, code, id);
    if (st.localGrades[k]) return st.localGrades[k];
    const g = st.sessions[pid]?.[code]?.grades?.[id];
    return (g && g.g) || {};
  }
  function totalOf(grades) {
    return Object.values(grades || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  }
  function isGraded(pid, code, id) {
    return Object.keys(gradesFor(pid, code, id)).length > 0;
  }

  /* Correction automatique : boîte à outils et tri (réponses fermées). Proposée tant que le professeur n'a pas validé avec OK. */
  const AUTO_SECTIONS = ['mechanisms', 'sort'];
  function copySub(pid, code, id) {
    const c = copiesOf(pid, code).find((x) => x.id === id);
    return c && c.sub;
  }
  function autoItems(pid, code, id, section) {
    const kit = st.kits[pid];
    const sub = copySub(pid, code, id);
    if (!kit || !sub) return [];
    return kit.items(sub).filter((i) => AUTO_SECTIONS.includes(i.section) && i.correct !== null && (!section || i.section === section));
  }
  function pendingSections(pid, code, id) {
    const saved = gradesFor(pid, code, id);
    return AUTO_SECTIONS.filter((sec) => {
      const list = autoItems(pid, code, id, sec);
      return list.length && !list.some((i) => saved[i.key] !== undefined);
    });
  }
  function proposalsFor(pid, code, id, sections) {
    const out = {};
    (sections || pendingSections(pid, code, id)).forEach((sec) => {
      autoItems(pid, code, id, sec).forEach((i) => { out[i.key] = i.correct ? i.max : 0; });
    });
    return out;
  }
  function shownGrades(pid, code, id) {
    return { ...proposalsFor(pid, code, id), ...gradesFor(pid, code, id) };
  }
  function validateSection(section) {
    const { pid, code, copyId } = st;
    if (!pid || !code || !copyId) return;
    const k = copyKey(pid, code, copyId);
    st.localGrades[k] = { ...gradesFor(pid, code, copyId), ...proposalsFor(pid, code, copyId, [section]) };
    scheduleSave(pid, code, copyId);
    renderView(true);
  }

  function setGrade(key, value, max) {
    const { pid, code, copyId } = st;
    if (!pid || !code || !copyId) return;
    const k = copyKey(pid, code, copyId);
    const pend = pendingSections(pid, code, copyId);
    const own = autoItems(pid, code, copyId).find((i) => i.key === key);
    const grades = { ...(own && pend.includes(own.section) ? proposalsFor(pid, code, copyId, [own.section]) : {}), ...gradesFor(pid, code, copyId) };
    if (value === '' || value == null || Number.isNaN(Number(value))) delete grades[key];
    else grades[key] = Math.min(Math.max(0, Number(value)), max);
    st.localGrades[k] = grades;
    scheduleSave(pid, code, copyId);
  }

  function scheduleSave(pid, code, id) {
    const k = copyKey(pid, code, id);
    st.saving[k] = 'saving';
    updateTotals();
    clearTimeout(st.saveTimers[k]);
    st.saveTimers[k] = setTimeout(() => saveGrades(pid, code, id), 600);
  }

  async function saveGrades(pid, code, id) {
    const k = copyKey(pid, code, id);
    const project = projectById(pid);
    const grades = st.localGrades[k] || {};
    const record = { g: grades, t: Math.round(totalOf(grades) * 100) / 100, at: Date.now() };
    try {
      await putJson(project.copies.root + '/sessions/' + code + '/grades/' + id, record);
      const sess = st.sessions[pid]?.[code];
      if (sess) { sess.grades = sess.grades || {}; sess.grades[id] = record; }
      if (st.saveTimers[k] && st.localGrades[k] === grades) delete st.localGrades[k];
      st.saving[k] = 'saved';
    } catch (e) {
      st.saving[k] = 'error';
    }
    updateTotals();
    renderList();
  }

  /* ---------------- Rendu : liste ---------------- */
  function memberNames(sub) {
    return (sub.group?.members || [])
      .map((m) => [m.firstName, m.lastName].filter(Boolean).join(' ').trim())
      .filter(Boolean).join(' & ');
  }
  function fmtDate(v, withTime) {
    const d = new Date(typeof v === 'number' ? v : Date.parse(v));
    if (Number.isNaN(d.getTime())) return '';
    return withTime
      ? d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function copiesOf(pid, code) {
    const kit = st.kits[pid];
    const raw = st.sessions[pid]?.[code]?.copies || {};
    return Object.entries(raw).map(([id, payload]) => {
      let sub = null;
      try { sub = kit ? kit.expand(payload) : null; } catch (e) { sub = null; }
      const at = payload?.at || payload?.submittedAt;
      const names = sub ? memberNames(sub) : ((payload?.g?.[1] || []).map((m) => m.join(' ').trim()).filter(Boolean).join(' & '));
      const cls = sub ? sub.group.className : (payload?.g?.[0] || '');
      return { id, payload, sub, at, names: names || 'Binôme', cls };
    }).sort((a, b) => String(a.names).localeCompare(String(b.names), 'fr'));
  }

  function renderList() {
    const mount = $('#corr-list');
    if (!mount) return;
    const blocks = projects().map((p) => {
      if (!p.copies) {
        return `<section class="corr-act is-paper">
          <h3>${esc(p.title)}</h3>
          <p class="meta">Réponses sur copie papier : aucune copie à recevoir ici.</p>
          ${p.answerKeyUrl ? `<a class="btn btn-ghost btn-sm" href="${esc(p.answerKeyUrl)}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-doc"/></svg>Ouvrir le corrigé</a>` : ''}
        </section>`;
      }
      let current = null;
      try { current = JSON.parse(localStorage.getItem('clio_enquete_sessions') || '{}')[p.id] || null; } catch (e) {}
      const recent = Date.now() - 12 * 3600000;
      /* Les codes sans copie ne restent visibles que s'ils sont récents ou en cours. */
      const sessions = sortedSessions(p.id).filter((s) => Object.keys(s.copies || {}).length
        || s.code === current || s.code === st.code || (Number(s.meta?.createdAt) || 0) > recent);
      const kit = st.kits[p.id];
      const max = kit ? kit.totalMax() : 20;
      const rows = sessions.map((s) => {
        const copies = copiesOf(p.id, s.code);
        const on = st.pid === p.id && st.code === s.code;
        const graded = copies.filter((c) => isGraded(p.id, s.code, c.id)).length;
        const head = `<button type="button" class="corr-session${on ? ' is-on' : ''}${copies.length ? '' : ' is-empty'}" data-corr-session="${esc(p.id)}|${esc(s.code)}">
            <span class="corr-code">${esc(s.code)}</span>
            <span class="corr-session-meta">${esc(fmtDate(s.meta?.createdAt))}</span>
            <span class="badge ${copies.length && graded === copies.length ? 'badge-ready' : 'badge-soft'}">${copies.length ? graded + '/' + copies.length + ' corrigée' + (graded > 1 ? 's' : '') : '0 copie'}</span>
          </button>`;
        if (!on) return head;
        const list = copies.length
          ? copies.map((c) => {
            const done = isGraded(p.id, s.code, c.id);
            const total = totalOf(gradesFor(p.id, s.code, c.id));
            return `<button type="button" class="corr-copy${st.copyId === c.id ? ' is-on' : ''}" data-corr-copy="${esc(c.id)}">
                <span><strong>${esc(c.names)}</strong><small>${esc(c.cls || 'Classe ?')} · ${esc(fmtDate(c.at, true))}</small></span>
                <span class="corr-copy-score${done ? ' is-done' : ''}">${done ? pts(total) + '/' + pts(max) : 'À corriger'}</span>
              </button>`;
          }).join('')
          : '<p class="meta corr-none">Aucune copie reçue pour ce code.</p>';
        const tools = copies.length
          ? `<button type="button" class="link-btn corr-export" data-corr-export="${esc(p.id)}|${esc(s.code)}"><svg class="ico"><use href="#i-download"/></svg>Exporter les notes (.csv)</button>`
          : '';
        return head + `<div class="corr-copies">${list}${tools}</div>`;
      }).join('');
      return `<section class="corr-act">
        <h3>${esc(p.title)}</h3>
        ${sessions.length ? rows : `<p class="meta">${st.loaded ? 'Aucun code de session. Crée-le dans le Panneau.' : 'Chargement…'}</p>`}
      </section>`;
    }).join('');
    mount.innerHTML = `${st.error ? `<p class="form-warn">${esc(st.error)}</p>` : ''}${blocks}
      <details class="corr-import">
        <summary>Importer une copie (secours)</summary>
        <p class="meta tiny">Lien ou code de correction envoyé par un binôme, ou fichier .json. La copie est rangée dans la session ouverte.</p>
        <textarea class="einput" id="corr-import-text" rows="3" placeholder="Colle le lien ou le code…">${esc(st.pendingImport)}</textarea>
        <div class="corr-import-actions">
          <button type="button" class="btn btn-ghost btn-sm" id="corr-import-btn">Importer</button>
          <label class="btn btn-ghost btn-sm">Fichier .json<input type="file" id="corr-import-file" accept=".json,application/json" hidden></label>
        </div>
      </details>`;
  }

  /* ---------------- Rendu : copie ---------------- */
  function gradeCtl(key, max, grades) {
    const v = grades[key];
    const val = v === undefined || v === null ? '' : v;
    const full = v !== undefined && Number(v) >= max;
    return `<span class="cg${full ? ' is-full' : ''}" data-cg="${esc(key)}">
      <input type="number" class="cg-input" data-grade="${esc(key)}" data-max="${max}" min="0" max="${max}" step="0.25" inputmode="decimal" value="${esc(val)}" aria-label="Points">
      <span class="cg-of">/ ${pts(max)}</span>
      <button type="button" class="cg-max" data-grade-max="${esc(key)}" data-max="${max}" title="Mettre tous les points">Max</button>
    </span>`;
  }

  function renderView(keepScroll) {
    const mount = $('#corr-view');
    if (!mount) return;
    const project = projectById(st.pid);
    if (!project || !st.code) {
      mount.innerHTML = `<div class="panel corr-empty"><h2>Choisis une copie</h2>
        <p class="meta">Les copies envoyées par les binômes arrivent ici automatiquement, rangées par activité et par code de session. Le code se crée dans le Panneau.</p></div>`;
      return;
    }
    const kit = st.kits[project.id];
    if (!kit) {
      mount.innerHTML = '<div class="panel corr-empty"><p class="meta">Chargement de l’activité…</p></div>';
      loadKit(project).then(() => { renderList(); renderView(); }, () => {
        mount.innerHTML = '<div class="panel corr-empty"><p class="form-warn">Impossible de charger le contenu de l’activité. Vérifie la connexion.</p></div>';
      });
      return;
    }
    const copies = copiesOf(project.id, st.code);
    const copy = copies.find((c) => c.id === st.copyId);
    if (!copy) {
      mount.innerHTML = `<div class="panel corr-empty"><h2>Session ${esc(st.code)}</h2>
        <p class="meta">${copies.length ? 'Choisis un binôme dans la liste.' : 'Aucune copie reçue pour l’instant. La liste se met à jour toute seule.'}</p></div>`;
      return;
    }
    if (!copy.sub) {
      mount.innerHTML = '<div class="panel corr-empty"><p class="form-warn">Copie illisible (format inconnu).</p></div>';
      return;
    }
    const y = window.scrollY;
    const grades = shownGrades(project.id, st.code, copy.id);
    const pending = pendingSections(project.id, st.code, copy.id);
    mount.innerHTML = kit.render({ copy, sub: copy.sub, grades, kit, code: st.code, pending });
    updateTotals();
    if (keepScroll) window.scrollTo({ top: y });
  }

  function renderRegimes(C, ctx) {
    const { DOSSIERS, MECHANISMS, SORT_COLUMNS, SORT_ITEMS, EVALUATION } = C;
    const { sub, grades, kit, copy } = ctx;
    const pending = ctx.pending || [];
    const max = kit.totalMax();
    const mechLabels = { urss: 'URSS de Staline', allemagne: 'Allemagne nazie', both: 'Les deux' };
    const colLabel = (id) => (SORT_COLUMNS.find((c) => c.id === id) || {}).label || 'Non placé';
    const secMax = (section) => kit.items(sub).filter((i) => i.section === section).reduce((s, i) => s + i.max, 0);

    const questions = DOSSIERS.map((d) => {
      const answers = sub.dossiers?.[d.id]?.answers || {};
      return `<div class="corr-dossier"><h4>Dossier ${esc(d.number)} · ${esc(d.title)}</h4>
        ${d.questions.map((q, i) => {
          const a = String(answers[q.id] || '').trim();
          return `<article class="corr-q">
            <header class="corr-q-head"><span class="corr-q-num">${esc(d.number)}.${i + 1}</span><p>${esc(q.prompt)}</p>${gradeCtl('q:' + q.id, Number(q.points) || 0, grades)}</header>
            <div class="corr-q-body">
              <div class="corr-answer${a ? '' : ' is-blank'}"><span>Réponse du binôme</span><p>${a ? nl2br(a) : 'Non répondu.'}</p></div>
              <div class="corr-key"><span>Corrigé</span><p>${esc(q.correction || '—')}</p></div>
            </div>
          </article>`;
        }).join('')}
      </div>`;
    }).join('');

    const mechanisms = MECHANISMS.map((m) => {
      const choice = sub.mechanisms?.[m.id]?.choice || '';
      const ok = choice === m.answer;
      return `<tr class="${choice ? (ok ? 'is-ok' : 'is-bad') : 'is-blank'}">
        <td class="corr-mech-label">${esc(m.label)}<small>${esc(m.feedback || '')}</small></td>
        <td><span class="corr-pill">${esc(mechLabels[choice] || 'Non répondu')}</span></td>
        <td><span class="corr-pill is-key">${esc(mechLabels[m.answer] || m.answer)}</span></td>
        <td class="corr-mark">${choice ? (ok ? '✓' : '✗') : '–'}</td>
        <td>${gradeCtl('m:' + m.id, Number(m.points) || 0, grades)}</td>
      </tr>`;
    }).join('');

    const sortCols = SORT_COLUMNS.map((col) => {
      const placed = SORT_ITEMS.filter((i) => sub.sort?.[i.id] === col.id);
      return `<div class="corr-col corr-col-${esc(col.id)}">
        <h5>${esc(col.label)}<small>${placed.length} élément${placed.length > 1 ? 's' : ''}</small></h5>
        ${placed.length ? placed.map((i) => sortChip(i, true)).join('') : '<p class="meta tiny">Rien de placé ici.</p>'}
      </div>`;
    }).join('');
    const unplaced = SORT_ITEMS.filter((i) => !sub.sort?.[i.id]);
    function sortChip(i, placed) {
      const ok = placed && sub.sort?.[i.id] === i.answer;
      return `<div class="corr-chip ${placed ? (ok ? 'is-ok' : 'is-bad') : 'is-blank'}" title="${esc(i.feedback || '')}">
        <p><span class="corr-mark">${placed ? (ok ? '✓' : '✗') : '–'}</span>${esc(i.text)}</p>
        ${ok ? '' : `<small>Attendu : ${esc(colLabel(i.answer))}</small>`}
        ${gradeCtl('s:' + i.id, Number(i.points) || 0, grades)}
      </div>`;
    }
    const sortRight = SORT_ITEMS.filter((i) => sub.sort?.[i.id] === i.answer).length;
    const mechRight = MECHANISMS.filter((m) => sub.mechanisms?.[m.id]?.choice === m.answer).length;

    const svg = kit.mapSvg(sub);
    const nodes = sub.map?.nodes || [];
    const sourced = nodes.filter((n) => n.source).length;
    const conclusion = String(sub.conclusion || '').trim();
    const sentences = conclusion ? conclusion.split(/[.!?…]+(?:\s|$)/).filter((x) => x.trim().length > 2).length : 0;

    const secHead = (title, section, label, extra = '') => {
      const auto = pending.includes(section);
      const action = auto
        ? `<button type="button" class="btn btn-primary btn-sm corr-sec-ok" data-section-ok="${section}" title="Valider la correction automatique">OK</button>`
        : `<button type="button" class="btn btn-ghost btn-sm corr-sec-max" data-section-max="${section}">${esc(label)}</button>`;
      return `<header class="corr-sec-head${auto ? ' is-auto' : ''}">
        <div><h3>${esc(title)}</h3>${extra}${auto ? '<p class="corr-auto-note">Corrigé automatiquement. Vérifie, ajuste si besoin, puis appuie sur OK.</p>' : ''}</div>
        <div class="corr-sec-right"><span class="corr-sec-total" data-sec-total="${section}">0</span><span class="meta"> / ${pts(secMax(section))}</span>
        ${action}</div>
      </header>`;
    };

    return `<article class="corr-doc">
      <header class="panel corr-head">
        <div>
          <p class="eyebrow">Copie · session ${esc(ctx.code)}</p>
          <h2>${esc(copy.names)}</h2>
          <p class="meta">${esc(sub.group.className || 'Classe non renseignée')} · envoyée le ${esc(fmtDate(copy.at, true))}</p>
        </div>
        <div class="corr-total"><strong data-total>0</strong><span>/ ${pts(max)}</span><small class="corr-save" data-save-state></small></div>
      </header>

      <section class="panel corr-sec">
        ${secHead("Questions d'enquête", 'questions', 'Tout au max')}
        ${questions}
      </section>

      <section class="panel corr-sec">
        ${secHead('Boîte à outils · mécanismes', 'mechanisms', 'Max aux réponses justes', `<p class="meta">${mechRight} / ${MECHANISMS.length} justes</p>`)}
        <div class="corr-table-wrap"><table class="corr-table">
          <thead><tr><th>Affirmation</th><th>Binôme</th><th>Attendu</th><th></th><th>Points</th></tr></thead>
          <tbody>${mechanisms}</tbody>
        </table></div>
      </section>

      <section class="panel corr-sec">
        ${secHead('Tri comparatif', 'sort', 'Max aux réponses justes', `<p class="meta">${sortRight} / ${SORT_ITEMS.length} bien placés · survole un élément pour lire le corrigé</p>`)}
        <div class="corr-cols">${sortCols}</div>
        ${unplaced.length ? `<div class="corr-unplaced"><h5>Non placés</h5>${unplaced.map((i) => sortChip(i, false)).join('')}</div>` : ''}
      </section>

      <section class="panel corr-sec">
        <header class="corr-sec-head"><div><h3>Carte mentale</h3><p class="meta">${nodes.length} nœud${nodes.length > 1 ? 's' : ''} · ${(sub.map?.links || []).length} lien${(sub.map?.links || []).length > 1 ? 's' : ''} · ${sourced} sourcé${sourced > 1 ? 's' : ''}</p></div>
          <div class="corr-sec-right">${gradeCtl('map', Number(EVALUATION.map.points) || 0, grades)}</div></header>
        <div class="corr-map" data-corr-zoom role="button" tabindex="0" aria-label="Agrandir la carte">${svg || '<p class="meta">Carte non fournie.</p>'}</div>
        ${svg ? '<p class="meta tiny">Touche la carte pour l’agrandir.</p>' : ''}
        ${nodes.length ? `<details class="corr-nodes"><summary>Détail des nœuds et des sources</summary><ul>${nodes.filter((n) => n.category !== 'central').map((n) => `<li><strong>${esc(n.title)}</strong>${n.note ? ' · ' + esc(n.note) : ''}${n.source ? `<small>Source : ${esc(n.source)}</small>` : '<small class="is-missing">Sans source</small>'}</li>`).join('')}</ul></details>` : ''}
        <div class="corr-key"><span>Attendu</span><p>${esc(EVALUATION.map.correction)}</p></div>
      </section>

      <section class="panel corr-sec">
        <header class="corr-sec-head"><div><h3>Conclusion</h3><p class="meta">${conclusion ? sentences + ' phrase' + (sentences > 1 ? 's' : '') : 'Non rédigée'}</p></div>
          <div class="corr-sec-right">${gradeCtl('conclusion', Number(EVALUATION.conclusion.points) || 0, grades)}</div></header>
        <div class="corr-answer${conclusion ? '' : ' is-blank'}"><span>Réponse du binôme</span><p>${conclusion ? nl2br(conclusion) : 'Non rédigée.'}</p></div>
        <div class="corr-key"><span>Attendu</span><p>${esc(EVALUATION.conclusion.correction)}</p></div>
      </section>

      <footer class="panel corr-foot">
        <strong>Total <span data-total>0</span> / ${pts(max)}</strong>
        <span class="corr-save" data-save-state></span>
        <button type="button" class="btn btn-primary btn-sm" data-corr-next>Copie suivante<svg class="ico"><use href="#i-arrow-right"/></svg></button>
      </footer>
    </article>`;
  }

  function updateTotals() {
    const { pid, code, copyId } = st;
    if (!pid || !code || !copyId) return;
    const kit = st.kits[pid];
    const grades = shownGrades(pid, code, copyId);
    const pend = pendingSections(pid, code, copyId);
    const pendKeys = new Set(Object.keys(proposalsFor(pid, code, copyId, pend)));
    document.querySelectorAll('#corr-view [data-total]').forEach((el) => { el.textContent = pts(totalOf(grades)); });
    if (kit) {
      const copy = copiesOf(pid, code).find((c) => c.id === copyId);
      const list = kit.items(copy && copy.sub);
      document.querySelectorAll('#corr-view [data-sec-total]').forEach((el) => {
        const sec = el.dataset.secTotal;
        el.textContent = pts(list.filter((i) => i.section === sec).reduce((s, i) => s + (Number(grades[i.key]) || 0), 0));
      });
    }
    document.querySelectorAll('#corr-view [data-cg]').forEach((el) => {
      const input = el.querySelector('input');
      const max = Number(input.dataset.max);
      const v = grades[el.dataset.cg];
      el.classList.toggle('is-full', v !== undefined && Number(v) >= max);
      el.classList.toggle('is-auto', pendKeys.has(el.dataset.cg));
      if (document.activeElement !== input) input.value = v === undefined ? '' : v;
    });
    const s = st.saving[copyKey(pid, code, copyId)];
    const label = s === 'saving' ? 'Enregistrement…' : s === 'error' ? 'Non enregistré : vérifie la connexion' : s === 'saved' ? 'Enregistré' : (isGraded(pid, code, copyId) ? 'Enregistré' : '');
    document.querySelectorAll('#corr-view [data-save-state]').forEach((el) => {
      el.textContent = label;
      el.classList.toggle('is-error', s === 'error');
    });
  }

  /* ---------------- Import de secours ---------------- */
  function b64urlToBytes(v) {
    const clean = String(v || '').replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(clean + '==='.slice((clean.length + 3) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function decodeCopyCode(input) {
    let value = String(input || '').trim();
    try { const u = new URL(value); value = u.searchParams.get('copie') || (u.hash.split('/copie/')[1] || value); } catch (e) {}
    try { value = decodeURIComponent(value); } catch (e) {}
    value = value.replace(/\s+/g, '');
    const prefix = value[0];
    const body = value.slice(1);
    let json = '';
    if (prefix === 'z') {
      const stream = new Blob([b64urlToBytes(body)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      json = await new Response(stream).text();
    } else if (prefix === 'j') {
      json = new TextDecoder().decode(b64urlToBytes(body));
    } else {
      json = value;
    }
    return JSON.parse(json);
  }

  async function importPayload(parsed) {
    const project = withCopies()[0];
    if (!project) return;
    const kit = await loadKit(project);
    const sub = kit.expand(parsed);
    if (!sub || !sub.group || !sub.map) throw new Error('format');
    if (!sub.id) sub.id = 'copie-' + Date.now();
    let code = st.pid === project.id ? st.code : null;
    if (!code) code = (sortedSessions(project.id)[0] || {}).code;
    if (!code) { toast('Crée d’abord un code de session dans le Panneau.'); return; }
    await putJson(project.copies.root + '/sessions/' + code + '/copies/' + sub.id, kit.compact(sub));
    st.pid = project.id; st.code = code; st.copyId = sub.id;
    st.pendingImport = '';
    await refresh(true);
    renderView();
    toast('Copie ajoutée à la session ' + code + '.');
  }

  /* ---------------- Export CSV ---------------- */
  function exportCsv(pid, code) {
    const kit = st.kits[pid];
    if (!kit) return;
    const keys = kit.csvKeys();
    const header = ['Classe', 'Binôme', 'Envoi', ...kit.csvHeader(), 'Total', 'Barème'];
    const rows = copiesOf(pid, code).map((c) => {
      const g = gradesFor(pid, code, c.id);
      return [c.cls, c.names, fmtDate(c.at, true), ...keys.map((k) => g[k] ?? ''), pts(totalOf(g)), pts(kit.totalMax())];
    });
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'notes-' + code + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------------- Événements ---------------- */
  function bind() {
    const screen = $('#screen-correction');
    if (!screen || st.mounted) return;
    st.mounted = true;

    screen.addEventListener('click', async (e) => {
      const t = e.target;
      const sess = t.closest('[data-corr-session]');
      if (sess) {
        const [pid, code] = sess.dataset.corrSession.split('|');
        const same = st.pid === pid && st.code === code;
        st.pid = pid; st.code = same ? null : code; st.copyId = null;
        if (!same) {
          const project = projectById(pid);
          if (project && !st.kits[pid]) loadKit(project).then(() => { renderList(); }, () => {});
        }
        renderList(); renderView();
        return;
      }
      const cp = t.closest('[data-corr-copy]');
      if (cp) {
        st.copyId = cp.dataset.corrCopy;
        renderList(); renderView();
        $('#corr-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const mx = t.closest('[data-grade-max]');
      if (mx) { setGrade(mx.dataset.gradeMax, Number(mx.dataset.max), Number(mx.dataset.max)); return; }
      const ok = t.closest('[data-section-ok]');
      if (ok) { validateSection(ok.dataset.sectionOk); toast('Correction validée.'); return; }
      const sm = t.closest('[data-section-max]');
      if (sm) {
        const kit = st.kits[st.pid];
        const copy = copiesOf(st.pid, st.code).find((c) => c.id === st.copyId);
        if (!kit || !copy) return;
        kit.items(copy.sub).filter((i) => i.section === sm.dataset.sectionMax).forEach((i) => {
          const value = i.correct === null ? i.max : (i.correct ? i.max : 0);
          setGrade(i.key, value, i.max);
        });
        return;
      }
      const next = t.closest('[data-corr-next]');
      if (next) {
        const list = copiesOf(st.pid, st.code);
        const i = list.findIndex((c) => c.id === st.copyId);
        const after = list.slice(i + 1).find((c) => !isGraded(st.pid, st.code, c.id)) || list[i + 1];
        if (after) { st.copyId = after.id; renderList(); renderView(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else toast('C’était la dernière copie de la session.');
        return;
      }
      const ex = t.closest('[data-corr-export]');
      if (ex) { const [pid, code] = ex.dataset.corrExport.split('|'); exportCsv(pid, code); return; }
      const zoom = t.closest('[data-corr-zoom]');
      if (zoom && zoom.querySelector('svg')) {
        const box = $('#corr-zoom');
        if (box) { box.querySelector('.corr-zoom-body').innerHTML = zoom.innerHTML; box.hidden = false; }
        return;
      }
      if (t.closest('#corr-zoom')) { $('#corr-zoom').hidden = true; return; }
      if (t.closest('#corr-refresh')) { refresh(); return; }
      if (t.closest('#corr-import-btn')) {
        const text = $('#corr-import-text')?.value || '';
        if (!text.trim()) return;
        try { await importPayload(await decodeCopyCode(text)); } catch (err) { toast('Lien ou code illisible.'); }
      }
    });

    screen.addEventListener('input', (e) => {
      const input = e.target.closest('[data-grade]');
      if (input) setGrade(input.dataset.grade, input.value, Number(input.dataset.max));
      const imp = e.target.closest('#corr-import-text');
      if (imp) st.pendingImport = imp.value;
    });
    screen.addEventListener('change', async (e) => {
      const input = e.target.closest('[data-grade]');
      if (input) { updateTotals(); return; }
      const file = e.target.closest('#corr-import-file');
      if (file && file.files && file.files[0]) {
        try { await importPayload(JSON.parse(await file.files[0].text())); } catch (err) { toast('Fichier illisible.'); }
        file.value = '';
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { const z = $('#corr-zoom'); if (z) z.hidden = true; }
    });
  }

  /** Ouvre l'espace (appelé par la navigation de Clio). arg : 'CODE' ou 'copie/<code>'. */
  function show(arg) {
    bind();
    const parts = String(arg || '').split('/');
    if (parts[0] === 'copie' && parts[1]) {
      st.pendingImport = decodeURIComponent(parts.slice(1).join('/'));
      history.replaceState(null, '', '#/correction');
      refresh().then(() => decodeCopyCode(st.pendingImport).then(importPayload).catch(() => toast('Lien de correction illisible.')));
    } else if (parts[0]) {
      const code = parts[0].toUpperCase();
      const p = withCopies()[0];
      if (p) { st.pid = p.id; st.code = code; st.copyId = null; }
      history.replaceState(null, '', '#/correction');
      refresh();
    } else {
      refresh();
    }
    withCopies().forEach((p) => loadKit(p).then(() => { renderList(); renderView(true); }, () => {}));
    renderList();
    renderView();
    clearInterval(st.timer);
    st.timer = setInterval(() => {
      if (!document.body.classList.contains('is-correction')) { clearInterval(st.timer); return; }
      if (document.visibilityState === 'visible') refresh(true);
    }, POLL_MS);
  }

  return { show, registerSession };
})();
