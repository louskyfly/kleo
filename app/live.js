/* ============================================================
   Kléo — accès de classe : porte, QR et séance en direct
   Broker public MQTT, sans serveur.
   ============================================================ */
window.KleoLive = (() => {
  'use strict';

  const BROKER = 'wss://test.mosquitto.org:8081/mqtt';
  const ROOT = 'kleo/live/7d3f9a1c';
  const GATE_TOPIC = ROOT + '/gate';
  const SESSION_PREFIX = ROOT + '/session/';
  const TEACHER_CODE = '2026';
  const APP_URL = location.protocol === 'file:'
    ? 'https://louskyfly.github.io/kleo/'
    : location.href.split('#')[0];

  const $ = (s, r = document) => r.querySelector(s);
  const state = { open: true, updatedAt: null, known: false };
  const listeners = new Set();

  let client = null;
  let connected = false;
  let connectWaiters = [];
  let joining = false;

  const isProf = () => /^#\/prof/.test(location.hash);
  const randomCode = (n = 5) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    const bytes = new Uint8Array(n);
    (crypto.getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 255); }));
    for (let i = 0; i < n; i++) out += chars[bytes[i] % chars.length];
    return out;
  };

  function emit() {
    listeners.forEach((cb) => { try { cb({ ...state }); } catch (e) {} });
  }

  function connect(cb) {
    if (typeof mqtt === 'undefined') { cb?.(false); return; }
    if (client) {
      if (connected) { cb?.(true); return; }
      const waiter = cb;
      connectWaiters.push(waiter);
      setTimeout(() => {
        const i = connectWaiters.indexOf(waiter);
        if (i >= 0) { connectWaiters.splice(i, 1); waiter?.(false); }
      }, 6000);
      return;
    }
    client = mqtt.connect(BROKER, {
      clientId: 'kleo-' + Math.random().toString(16).slice(2),
      clean: true,
      connectTimeout: 6000,
      reconnectPeriod: 5000
    });
    client.on('connect', () => {
      connected = true;
      client.subscribe(GATE_TOPIC, { qos: 1 });
      connectWaiters.forEach((w) => w?.(true));
      connectWaiters = [];
      cb?.(true);
    });
    client.on('message', (topic, payload) => {
      if (topic !== GATE_TOPIC) return;
      try {
        const data = JSON.parse(payload.toString());
        state.open = !!data.open;
        state.updatedAt = data.updatedAt || new Date().toISOString();
        state.known = true;
        emit();
        applyGate();
      } catch (e) {}
    });
    client.on('close', () => { connected = false; });
    client.on('error', () => {});
  }

  function onGate(cb) {
    listeners.add(cb);
    cb({ ...state });
    return () => listeners.delete(cb);
  }

  function publishGate(open, cb) {
    connect((ok) => {
      if (!ok) { cb?.(new Error('Connexion au serveur de classe impossible.')); return; }
      const updatedAt = new Date().toISOString();
      client.publish(GATE_TOPIC, JSON.stringify({ open, updatedAt }), { qos: 1, retain: true }, (err) => {
        if (!err) {
          state.open = open;
          state.updatedAt = updatedAt;
          state.known = true;
          emit();
          applyGate();
        }
        cb?.(err || null);
      });
    });
  }

  function publishSession(session, code, cb) {
    connect((ok) => {
      if (!ok) { cb?.(new Error('Connexion au serveur de classe impossible.')); return; }
      const payload = JSON.stringify({ ...session, liveCode: code, publishedAt: new Date().toISOString() });
      client.publish(SESSION_PREFIX + code, payload, { qos: 1, retain: true }, (err) => cb?.(err || null));
    });
  }

  function fetchSession(code, cb) {
    connect((ok) => {
      if (!ok) { cb?.(null); return; }
      const topic = SESSION_PREFIX + String(code || '').toUpperCase();
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        client.removeListener('message', handler);
        client.unsubscribe(topic);
        cb?.(value);
      };
      const handler = (t, payload) => {
        if (t !== topic) return;
        try {
          const data = JSON.parse(payload.toString());
          if (!data || !Array.isArray(data.pages)) return finish(null);
          finish(data);
        } catch (e) { finish(null); }
      };
      const timer = setTimeout(() => finish(null), 5000);
      client.on('message', handler);
      client.subscribe(topic, { qos: 1 }, (err) => { if (err) finish(null); });
    });
  }

  function makeQR(el, text) {
    if (!el) return false;
    el.innerHTML = '';
    if (typeof QRCode === 'undefined') { el.textContent = text; return false; }
    try {
      new QRCode(el, {
        text,
        width: 220,
        height: 220,
        colorDark: '#152420',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.M : 0
      });
      return true;
    } catch (e) {
      el.textContent = 'Lien trop long pour un QR.';
      return false;
    }
  }

  /* ------------------------------------------------------------
     Écran d'accès (élèves)
     ------------------------------------------------------------ */
  function showGate() {
    const el = $('#gate-screen');
    if (!el) return;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.remove('is-hidden'));
  }

  function hideGate() {
    const el = $('#gate-screen');
    if (!el) return;
    el.classList.add('is-hidden');
    setTimeout(() => { if (el.classList.contains('is-hidden')) el.hidden = true; }, 320);
  }

  function setGateContent(mode) {
    const title = $('#gate-title');
    const text = $('#gate-text');
    const actions = $('#gate-actions');
    const icon = $('#gate-icon');
    if (!title || !text || !actions) return;
    if (mode === 'loading') {
      icon?.classList.add('is-loading');
      title.textContent = 'Vérification de l’accès…';
      text.textContent = 'Connexion au panneau du professeur.';
      actions.innerHTML = '<span class="gate-loader" aria-hidden="true"></span>';
    } else if (mode === 'join') {
      icon?.classList.remove('is-loading');
      title.textContent = 'Chargement de la séance…';
      text.textContent = 'Récupération de la séance publiée par le professeur.';
      actions.innerHTML = '<span class="gate-loader" aria-hidden="true"></span>';
    } else {
      icon?.classList.remove('is-loading');
      title.textContent = 'Séance fermée';
      text.textContent = 'Le professeur n’a pas ouvert l’accès pour le moment. Revenez quand il l’ouvrira, ou demandez-lui d’ouvrir la séance.';
      actions.innerHTML = '<button class="btn btn-cream" onclick="location.reload()">Réessayer</button>';
    }
  }

  function applyGate() {
    if (isProf()) { hideGate(); return; }
    if (state.known && !state.open) { setGateContent('closed'); showGate(); return; }
    if (joining) { setGateContent('join'); showGate(); return; }
    if (!state.known) { setGateContent('loading'); showGate(); return; }
    hideGate();
  }

  function startGate() {
    if (!isProf()) {
      setGateContent('loading');
      showGate();
      connect();
      setTimeout(() => {
        if (!state.known) { state.known = true; state.open = true; emit(); applyGate(); }
      }, 2600);
    }
    window.addEventListener('hashchange', applyGate);
    applyGate();
  }

  function beginJoin() { joining = true; applyGate(); }
  function endJoin() { joining = false; applyGate(); }

  window.addEventListener('load', startGate);

  return {
    TEACHER_CODE,
    APP_URL,
    gateState: () => ({ ...state }),
    onGate,
    publishGate,
    publishSession,
    fetchSession,
    makeQR,
    randomCode,
    joinURL: (code) => `${APP_URL}#/join/${code}`,
    applyGate,
    beginJoin,
    endJoin,
    isProf
  };
})();
