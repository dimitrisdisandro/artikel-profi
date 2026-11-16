'use strict';
/*
 * lernapp-core v0.1.0
 *
 * Gemeinsamer Kern für alle Lern-Apps: Profile, Statistik, adaptive Gewichtung,
 * Ausgleichssystem, Abzeichen, Lernpfad, Tagesaufgabe, Einstellungen,
 * Disclaimer, Ton und Sprachausgabe.
 *
 * Eine App liefert nur ein Konfigurationsobjekt (siehe docs/FRAMEWORK.md):
 *   id, name, icon, modes[], levels[], createTask(), statGroups[], badges[], texts{}
 * Ein Übungsmodus meldet dem Kern nur das Ergebnis: ui.done(ok, given).
 */
const Core = (function () {
  let APP = null;
  let settings = { dark: false, sound: true, speech: true };
  let profiles = [];
  let cur = null;
  const G = { mode: 0, level: 0, task: null, answered: false, lastItem: null };

  const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐵', '🦄', '🐙'];
  const PATH = [0, 3, 8, 15, 25, 40, 60, 85, 120];

  // ── Speicher ────────────────────────────────────────────────────
  const Store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(APP.id + ':' + k);
        return v !== null ? JSON.parse(v) : d;
      } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(APP.id + ':' + k, JSON.stringify(v)); } catch (e) { /* ignorieren */ }
    }
  };
  function saveProfiles() { Store.set('profiles', profiles); }
  function saveSettings() { Store.set('settings', settings); }

  // ── Ton und Sprachausgabe ───────────────────────────────────────
  const Snd = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) this.ctx = new AC();
        } catch (e) { this.ctx = null; }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (e) { /* ignorieren */ }
      }
      return this.ctx;
    },
    tone(freq, t0, dur, type, vol) {
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    },
    play(name) {
      if (!settings.sound) return;
      const c = this.ensure();
      if (!c) return;
      const t = c.currentTime;
      try {
        if (name === 'tick') this.tone(660, t, 0.05, 'square', 0.04);
        else if (name === 'correct') [523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.09, 0.22, 'sine', 0.12));
        else if (name === 'wrong') { this.tone(200, t, 0.28, 'sawtooth', 0.08); this.tone(160, t + 0.12, 0.28, 'sawtooth', 0.08); }
        else if (name === 'badge') [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.1, 0.3, 'triangle', 0.12));
      } catch (e) { /* ignorieren */ }
    },
    speak(text) {
      if (!settings.speech || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
      try {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = APP.speechLang || 'de-DE';
          u.rate = 0.9;
          window.speechSynthesis.speak(u);
        }, 120);
      } catch (e) { /* ignorieren */ }
    }
  };

  // ── Hinweise und Konfetti ───────────────────────────────────────
  let toastTimer = null;
  function toast(msg, kind) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }

  function confetti() {
    const cv = $('confetti');
    if (!cv || typeof cv.getContext !== 'function') return;
    let ctx = null;
    try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx) return;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6'];
    const parts = [];
    for (let i = 0; i < 90; i++) {
      parts.push({
        x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.4,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
        s: 5 + Math.random() * 6, c: colors[i % colors.length]
      });
    }
    let frames = 0;
    (function step() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => { p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s * 0.6); });
      frames++;
      if (frames < 140) window.requestAnimationFrame(step);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  // ── Profile ─────────────────────────────────────────────────────
  function blankProgress() {
    return {
      stats: { total: 0, correct: 0, streak: 0, bestStreak: 0, dayStreak: 0, lastGoalDay: '', modesUsed: [] },
      modeStats: {}, cats: {}, weights: {}, earned: [],
      daily: { date: '', done: 0 }, balance: null, lastMode: 0, lastLevel: 0
    };
  }

  function ensureProfile(p) {
    const b = blankProgress();
    p.stats = Object.assign({}, b.stats, p.stats || {});
    if (!Array.isArray(p.stats.modesUsed)) p.stats.modesUsed = [];
    ['modeStats', 'cats', 'weights'].forEach((k) => { if (!p[k] || typeof p[k] !== 'object') p[k] = {}; });
    if (!Array.isArray(p.earned)) p.earned = [];
    if (!p.daily || typeof p.daily !== 'object') p.daily = { date: '', done: 0 };
    if (typeof p.lastMode !== 'number' || p.lastMode >= APP.modes.length) p.lastMode = 0;
    if (typeof p.lastLevel !== 'number' || p.lastLevel >= APP.levels.length) p.lastLevel = 0;
    return p;
  }

  function createProfile(name, avatar) {
    const p = Object.assign({
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name, avatar: avatar, created: Date.now()
    }, blankProgress());
    profiles.push(ensureProfile(p));
    saveProfiles();
    return p;
  }

  function selectProfile(id) {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    cur = ensureProfile(p);
    G.level = cur.lastLevel;
    G.mode = cur.lastMode;
    G.lastItem = null;
    if (isLocked(G.mode)) { G.mode = firstFree(); cur.lastMode = G.mode; saveProfiles(); }
    newTask();
    showScreen('app');
    renderApp();
  }

  // ── Datum und Tagesaufgabe ──────────────────────────────────────
  function dayString(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function today() { return dayString(new Date()); }
  function yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return dayString(d); }

  function dailyState() {
    if (cur.daily.date !== today()) cur.daily = { date: today(), done: 0 };
    return cur.daily;
  }
  function updateDayStreak() {
    const s = cur.stats;
    s.dayStreak = s.lastGoalDay === yesterday() ? (s.dayStreak || 0) + 1 : 1;
    s.lastGoalDay = today();
  }

  // ── Ausgleichssystem ────────────────────────────────────────────
  function bmax() { return APP.balanceMax || 10; }
  function bal() {
    const n = APP.modes.length;
    if (!cur.balance || !Array.isArray(cur.balance.counts) || cur.balance.counts.length !== n) {
      cur.balance = { counts: APP.modes.map(() => 0), round: 1 };
    }
    return cur.balance;
  }
  function isLocked(i) { return bal().counts[i] >= bmax(); }
  function firstFree() {
    for (let i = 0; i < APP.modes.length; i++) if (!isLocked(i)) return i;
    return 0;
  }
  function recordPlay(i) {
    const b = bal();
    b.counts[i] = (b.counts[i] || 0) + 1;
    if (b.counts.every((c) => c >= bmax())) {
      b.counts = APP.modes.map(() => 0);
      b.round = (b.round || 1) + 1;
      toast(APP.texts.roundDone, 'ok');
      Snd.play('correct');
      confetti();
    }
  }

  // ── Aufgabenablauf ──────────────────────────────────────────────
  function newTask() {
    G.task = APP.createTask({ mode: G.mode, level: G.level, weights: cur.weights, last: G.lastItem });
    G.lastItem = G.task.itemKey;
    G.answered = false;
  }

  function nextTask() {
    if (isLocked(G.mode)) { G.mode = firstFree(); cur.lastMode = G.mode; saveProfiles(); }
    newTask();
    renderModeTabs();
    renderBalance();
    renderTask();
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function onAnswer(ok, given) {
    if (G.answered) return;
    G.answered = true;
    const t = G.task;
    const s = cur.stats;

    s.total++;
    if (ok) {
      s.correct++; s.streak++;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    } else {
      s.streak = 0;
    }
    if (s.modesUsed.indexOf(G.mode) < 0) s.modesUsed.push(G.mode);

    const ms = cur.modeStats[G.mode] || (cur.modeStats[G.mode] = { t: 0, c: 0 });
    ms.t++; if (ok) ms.c++;

    (t.cats || []).forEach((k) => {
      const c = cur.cats[k] || (cur.cats[k] = { t: 0, c: 0 });
      c.t++; if (ok) c.c++;
    });

    const w = cur.weights;
    const k = t.itemKey;
    w[k] = ok ? Math.max(1, (w[k] || 1) - 1) : Math.min(8, (w[k] || 1) + 2);

    const d = dailyState();
    let goalReached = false;
    if (d.done < APP.dailyGoal) {
      d.done++;
      if (d.done === APP.dailyGoal) { goalReached = true; updateDayStreak(); }
    }

    recordPlay(G.mode);

    const fb = $('feedback');
    if (ok) {
      fb.className = 'fb-success';
      fb.textContent = pick(APP.texts.praise);
      Snd.play('correct');
      Snd.speak(t.speak);
    } else {
      fb.className = 'fb-error';
      fb.textContent = APP.texts.wrong(t, given);
      Snd.play('wrong');
      Snd.speak(APP.texts.speakWrong(t));
    }

    const newBadges = [];
    APP.badges.forEach((b) => {
      if (cur.earned.indexOf(b.id) < 0 && b.test(cur)) { cur.earned.push(b.id); newBadges.push(b); }
    });

    saveProfiles();
    renderScores(); renderDaily(); renderPath(); renderModeTabs();
    renderBalance(); renderStats(); renderBadges();

    const row = $('btn-row');
    row.innerHTML = '';
    const nb = el('button', 'btn btn-primary btn-block', APP.texts.next);
    nb.onclick = nextTask;
    row.appendChild(nb);
    nb.focus();

    if (newBadges.length) {
      toast(APP.texts.newBadge(newBadges[0]), 'ok');
      setTimeout(() => Snd.play('badge'), 450);
    }
    if (ok && s.streak > 0 && s.streak % 5 === 0) {
      confetti();
      toast(APP.texts.streakMsg(s.streak), 'ok');
    }
    if (goalReached) {
      confetti();
      toast(APP.texts.dailyDone, 'ok');
    }
  }

  // ── Anzeige ─────────────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $('screen-' + id).classList.add('active');
    window.scrollTo && window.scrollTo(0, 0);
  }

  function applyDark() {
    document.documentElement.setAttribute('data-theme', settings.dark ? 'dark' : 'light');
  }

  function renderAbout(host) {
    host.innerHTML = '';
    host.appendChild(el('div', 'about-title', APP.texts.aboutTitle));
    host.appendChild(el('p', 'about-text', APP.texts.aboutText));
    host.appendChild(el('p', 'about-version', APP.name + ' · Version ' + APP.version));
  }

  function renderProfileScreen() {
    const T = APP.texts;
    $('app-logo').textContent = APP.icon;
    $('ph-title').textContent = T.whoPlays;
    $('ph-sub').textContent = T.tagline;
    $('btn-add-profile').textContent = '+ ' + T.newProfile;

    const list = $('profile-list');
    list.innerHTML = '';
    profiles.forEach((p) => {
      const card = el('div', 'profile-card');
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.appendChild(el('div', 'pc-avatar', p.avatar));
      const info = el('div', 'pc-info');
      info.appendChild(el('div', 'pc-name', p.name));
      info.appendChild(el('div', 'pc-meta', T.profileMeta(p)));
      card.appendChild(info);
      const del = el('button', 'icon-btn pc-del', '🗑');
      del.title = T.deleteProfile;
      del.onclick = (e) => {
        e.stopPropagation();
        if (window.confirm(T.deleteConfirm(p.name))) {
          profiles = profiles.filter((x) => x.id !== p.id);
          saveProfiles();
          renderProfileScreen();
        }
      };
      card.appendChild(del);
      card.onclick = () => selectProfile(p.id);
      card.onkeydown = (e) => { if (e.key === 'Enter') selectProfile(p.id); };
      list.appendChild(card);
    });

    renderHighscore();
    renderAbout($('about-profile'));
  }

  function renderHighscore() {
    const host = $('highscore-box');
    host.innerHTML = '';
    if (profiles.length < 2) return;
    host.appendChild(el('div', 'section-title', APP.texts.highscore));
    const sorted = profiles.slice().sort((a, b) => b.stats.correct - a.stats.correct);
    sorted.forEach((p, i) => {
      const r = el('div', 'hs-row');
      r.appendChild(el('span', 'hs-rank', ['🥇', '🥈', '🥉'][i] || String(i + 1)));
      r.appendChild(el('span', 'hs-name', p.avatar + ' ' + p.name));
      r.appendChild(el('span', 'hs-score', p.stats.correct + ' ✓'));
      host.appendChild(r);
    });
  }

  function showNewProfileForm() {
    const T = APP.texts;
    const host = $('profile-form');
    host.innerHTML = '';
    host.style.display = 'block';
    let avatar = AVATARS[0];

    const inp = el('input', 'text-input');
    inp.type = 'text';
    inp.maxLength = 20;
    inp.placeholder = T.namePlaceholder;
    inp.autocomplete = 'off';
    inp.setAttribute('aria-label', T.namePlaceholder);

    const picker = el('div', 'avatar-picker');
    AVATARS.forEach((a) => {
      const b = el('button', 'avatar-btn' + (a === avatar ? ' active' : ''), a);
      b.type = 'button';
      b.onclick = () => {
        avatar = a;
        picker.querySelectorAll('.avatar-btn').forEach((x) => x.classList.toggle('active', x === b));
      };
      picker.appendChild(b);
    });

    const btns = el('div', 'form-btns');
    const cancel = el('button', 'btn', T.cancel);
    cancel.onclick = () => { host.style.display = 'none'; host.innerHTML = ''; };
    const save = el('button', 'btn btn-primary', T.save);
    save.onclick = () => {
      const name = inp.value.trim();
      if (!name) { inp.focus(); return; }
      createProfile(name, avatar);
      host.style.display = 'none';
      host.innerHTML = '';
      renderProfileScreen();
    };
    inp.onkeydown = (e) => { if (e.key === 'Enter') save.click(); };
    btns.appendChild(cancel);
    btns.appendChild(save);

    host.appendChild(inp);
    host.appendChild(picker);
    host.appendChild(btns);
    host.appendChild(el('p', 'form-hint', T.storageHint));
    inp.focus();
  }

  function renderApp() {
    const T = APP.texts;
    $('app-title').textContent = cur.avatar + ' ' + cur.name;
    $('lbl-correct').textContent = T.scoreCorrect;
    $('lbl-total').textContent = T.scoreTotal;
    $('lbl-streak').textContent = T.scoreStreak;
    renderDaily(); renderBalance(); renderScores(); renderPath();
    renderModeTabs(); renderDifficulty(); renderTask(); renderStats(); renderBadges();
  }

  function renderScores() {
    const s = cur.stats;
    $('score-correct').textContent = s.correct;
    $('score-total').textContent = s.total;
    $('score-streak').textContent = s.streak > 0 ? '🔥 ' + s.streak : '—';
  }

  function renderDaily() {
    const d = dailyState();
    const host = $('daily-banner');
    host.innerHTML = '';
    host.appendChild(el('span', 'daily-text', APP.texts.daily(d.done, APP.dailyGoal)));
    const dots = el('span', 'daily-dots');
    for (let i = 0; i < APP.dailyGoal; i++) dots.appendChild(el('i', 'daily-dot' + (i < d.done ? ' on' : '')));
    host.appendChild(dots);
  }

  function renderPath() {
    const row = $('path-row');
    row.innerHTML = '';
    const c = cur.stats.correct;
    let idx = 0;
    PATH.forEach((th, i) => { if (c >= th) idx = i; });
    PATH.forEach((th, i) => {
      const d = el('div', 'path-dot' + (i < idx ? ' done' : '') + (i === idx ? ' now' : ''), APP.pathIcons[i] || '⭐');
      d.title = th + ' ✓';
      row.appendChild(d);
    });
  }

  function renderBalance() {
    const banner = $('balance-banner');
    const b = bal();
    const lockedLabels = [];
    const left = [];
    APP.modes.forEach((m, i) => {
      if (b.counts[i] >= bmax()) lockedLabels.push(m.label);
      else left.push(bmax() - b.counts[i]);
    });
    if (!lockedLabels.length) { banner.style.display = 'none'; return; }
    banner.style.display = 'block';
    banner.textContent = APP.texts.balanceInfo(lockedLabels, Math.min.apply(null, left));
  }

  function renderModeTabs() {
    const mt = $('mode-tabs');
    mt.innerHTML = '';
    const b = bal();
    APP.modes.forEach((m, i) => {
      const locked = isLocked(i);
      const tab = el('button', 'mode-tab' + (i === G.mode ? ' active' : '') + (locked ? ' locked' : ''));
      tab.type = 'button';
      tab.appendChild(el('span', 'mt-label', (locked ? '🔒 ' : '') + m.label));
      tab.appendChild(el('span', 'mt-count', (b.counts[i] || 0) + '/' + bmax()));
      if (locked) tab.setAttribute('aria-disabled', 'true');
      tab.onclick = () => {
        if (isLocked(i)) { toast(APP.texts.locked, 'warn'); return; }
        if (i === G.mode) return;
        Snd.play('tick');
        G.mode = i; cur.lastMode = i; saveProfiles();
        newTask(); renderModeTabs(); renderTask();
      };
      mt.appendChild(tab);
    });
  }

  function renderDifficulty() {
    const row = $('difficulty-row');
    $('lbl-level').textContent = APP.texts.level;
    row.querySelectorAll('.diff-btn').forEach((b) => b.remove());
    APP.levels.forEach((lv, i) => {
      const b = el('button', 'diff-btn' + (i === G.level ? ' active' : ''), lv.label);
      b.type = 'button';
      b.title = lv.info || '';
      b.onclick = () => {
        if (i === G.level) return;
        Snd.play('tick');
        G.level = i; cur.lastLevel = i; saveProfiles();
        newTask(); renderDifficulty(); renderTask();
      };
      row.appendChild(b);
    });
  }

  function renderTask() {
    const T = APP.texts;
    const mode = APP.modes[G.mode];
    $('task-title').textContent = mode.title || T.taskTitle;
    $('task-sub').textContent = mode.sub || '';
    const body = $('task-body');
    const row = $('btn-row');
    const fb = $('feedback');
    body.innerHTML = '';
    row.innerHTML = '';
    fb.className = 'fb-neutral';
    fb.textContent = '';
    G.answered = false;

    let hintStage = 0;
    const ui = {
      body: body,
      row: row,
      done: (ok, given) => onAnswer(ok, given),
      hintButton: () => {
        const b = el('button', 'btn', T.hint);
        b.type = 'button';
        b.onclick = () => {
          const hs = G.task.hints || [];
          if (!hs.length || G.answered) return;
          fb.className = 'fb-neutral';
          fb.textContent = hs[Math.min(hintStage, hs.length - 1)];
          hintStage++;
          Snd.play('tick');
        };
        return b;
      }
    };
    mode.render(G.task, ui);
  }

  function renderStats() {
    const host = $('stats-section');
    host.innerHTML = '';
    host.appendChild(el('div', 'section-title', APP.texts.statsTitle));
    APP.statGroups.forEach((g) => {
      host.appendChild(el('div', 'stat-group-title', g.title));
      const grid = el('div', 'stat-grid');
      g.items.forEach((it) => {
        const s = cur.cats[it.key] || { t: 0, c: 0 };
        const pct = s.t ? Math.round((s.c / s.t) * 100) : null;
        const cls = pct === null ? '' : pct >= 80 ? ' good' : pct >= 50 ? ' mid' : ' bad';
        const cell = el('div', 'stat-cell' + cls + (it.tone ? ' tone-' + it.tone : ''));
        cell.appendChild(el('div', 'stat-label', it.label));
        cell.appendChild(el('div', 'stat-val', s.t ? s.c + '/' + s.t : '—'));
        cell.appendChild(el('div', 'stat-pct', pct === null ? '' : pct + '%'));
        grid.appendChild(cell);
      });
      host.appendChild(grid);
    });
  }

  function renderBadges() {
    $('lbl-badges').textContent = APP.texts.badgesTitle;
    const grid = $('badges-grid');
    grid.innerHTML = '';
    APP.badges.forEach((b) => {
      const got = cur.earned.indexOf(b.id) >= 0;
      const d = el('div', 'badge' + (got ? ' earned' : ''));
      d.title = b.title + ' – ' + b.desc;
      d.appendChild(el('div', 'badge-icon', b.icon));
      d.appendChild(el('div', 'badge-name', b.title));
      grid.appendChild(d);
    });
  }

  function renderSettings() {
    const T = APP.texts;
    $('set-title').textContent = T.settings;
    const list = $('settings-list');
    list.innerHTML = '';
    const addRow = (label, node) => {
      const r = el('div', 'setting-row');
      r.appendChild(el('span', 'setting-label', label));
      r.appendChild(node);
      list.appendChild(r);
    };
    const toggle = (key) => {
      const b = el('button', 'btn btn-toggle' + (settings[key] ? ' on' : ''), settings[key] ? T.on : T.off);
      b.type = 'button';
      b.onclick = () => {
        settings[key] = !settings[key];
        saveSettings();
        if (key === 'dark') applyDark();
        renderSettings();
      };
      return b;
    };
    addRow(T.darkMode, toggle('dark'));
    addRow(T.sound, toggle('sound'));
    addRow(T.speech, toggle('speech'));
    const rb = el('button', 'btn btn-danger', T.resetBtn);
    rb.type = 'button';
    rb.onclick = () => {
      if (!window.confirm(T.resetConfirm)) return;
      const keep = { id: cur.id, name: cur.name, avatar: cur.avatar, created: cur.created };
      Object.keys(cur).forEach((k) => { delete cur[k]; });
      Object.assign(cur, keep, blankProgress());
      ensureProfile(cur);
      saveProfiles();
      G.mode = 0; G.level = 0; G.lastItem = null;
      newTask();
      showScreen('app');
      renderApp();
    };
    addRow(T.reset, rb);
    renderAbout($('about-settings'));
  }

  function initDisclaimer() {
    const D = APP.texts.disclaimer;
    const overlay = $('disclaimer-overlay');
    $('disclaimer-title').textContent = D.title;
    $('disclaimer-text').textContent = D.text;
    $('disclaimer-btn').textContent = D.btn;
    if (Store.get('disclaimer_accepted', false)) { overlay.classList.add('hidden'); return; }
    overlay.classList.remove('hidden');
    $('disclaimer-btn').onclick = () => {
      Store.set('disclaimer_accepted', true);
      overlay.classList.add('hidden');
    };
  }

  function bindStatic() {
    $('btn-add-profile').onclick = showNewProfileForm;
    $('btn-back').onclick = () => { renderProfileScreen(); showScreen('profile'); };
    $('btn-settings').onclick = () => { renderSettings(); showScreen('settings'); };
    $('set-back').onclick = () => showScreen('app');
  }

  function init(app) {
    APP = app;
    settings = Object.assign({ dark: false, sound: true, speech: true }, Store.get('settings', {}));
    profiles = Store.get('profiles', []);
    if (!Array.isArray(profiles)) profiles = [];
    profiles.forEach(ensureProfile);
    applyDark();
    document.title = APP.name;
    bindStatic();
    renderProfileScreen();
    initDisclaimer();
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    }
  }

  // Nur für automatische Tests
  function state() { return { G: G, cur: cur, settings: settings, profiles: profiles, APP: APP }; }

  return { init: init, state: state };
})();
