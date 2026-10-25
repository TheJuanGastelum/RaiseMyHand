/* ===== Shared game kit: level select, challenge runner, scoring, progress ===== */
const Kit = (() => {
  const TEST = /[?&]test\b/.test(location.search);
  const $ = (s, r) => (r || document).querySelector(s);
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (x, d = 3) => { const r = Number(x.toFixed(d)); return String(r); };

  let cfg, S, appEl, run = null;
  const TIER_PTS = { 1: 100, 2: 150, 3: 250 };

  /* ---------- storage ---------- */
  const key = () => 'studygame_' + cfg.id;
  function load() { try { return JSON.parse(localStorage.getItem(key())) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(key(), JSON.stringify(S)); } catch (e) {} }

  /* ---------- sound ---------- */
  let AC = null;
  function beep(freq, dur, type, vol) {
    if (S.mute) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'square'; o.frequency.value = freq; g.gain.value = vol || 0.05;
      o.connect(g); g.connect(AC.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
      o.stop(AC.currentTime + dur);
    } catch (e) {}
  }
  const sfx = {
    good() { beep(660, .09); setTimeout(() => beep(880, .12), 80); },
    bad() { beep(160, .25, 'sawtooth', .06); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .18), i * 110)); },
    lose() { [300, 240, 180].forEach((f, i) => setTimeout(() => beep(f, .25, 'sawtooth'), i * 160)); },
  };

  const skin = () => cfg.skin(!!S.ana);
  const lvTitle = l => (S.ana && l.ana && l.ana.title) ? l.ana.title : l.topic;
  /* ---------- helpers ---------- */
  function hwList() {
    const m = /hw=([\d,]+)/.exec(location.hash);
    return m ? m[1].split(',').map(Number).filter(Boolean) : [];
  }
  function parseNum(s) {
    s = String(s).trim().replace(/,/g, '').replace(/[×x]/g, '*');
    if (/^-?\d*\.?\d+\s*\/\s*-?\d*\.?\d+$/.test(s)) { const [a, b] = s.split('/'); return parseFloat(a) / parseFloat(b); }
    if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  function starsHtml(n) { return '<span class="stars" aria-label="' + n + ' of 3 stars">' + [1, 2, 3].map(i => '<span class="' + (i <= n ? 'on' : '') + '">★</span>').join('') + '</span>'; }
  function diffDots(level) {
    const d = level.diff || 1;
    return h('span', { class: 'diff', role: 'img', title: 'Difficulty ' + d + ' of 5', 'aria-label': 'Difficulty ' + d + ' of 5' }, [1, 2, 3, 4, 5].map(i => h('i', { class: i <= d ? 'on' : '' })));
  }

  /* ---------- keyboard: WASD / arrows everywhere ---------- */
  const DIR = { ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  function focusables() { return [...appEl.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), summary, input:not([disabled]), textarea')].filter(el => el.offsetParent !== null); }
  function moveFocus(dir) {
    const list = focusables(); if (!list.length) return false;
    const cur = document.activeElement && list.includes(document.activeElement) ? document.activeElement : null;
    if (!cur) { list[0].focus(); return true; }
    const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bd = 1e9;
    for (const el of list) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, dx = x - cx, dy = y - cy;
      const ok = dir === 'u' ? dy < -4 : dir === 'd' ? dy > 4 : dir === 'l' ? dx < -4 : dx > 4;
      if (!ok) continue;
      const along = dir === 'u' || dir === 'd' ? Math.abs(dy) : Math.abs(dx), across = dir === 'u' || dir === 'd' ? Math.abs(dx) : Math.abs(dy);
      const d = along + across * 2.2;
      if (d < bd) { bd = d; best = el; }
    }
    if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }); return true; }
    return false;
  }
  function typing(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'); }
  document.addEventListener('keydown', e => {
    if (!appEl || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.id === 'anaBtn') return;
    if (!typing(e) && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); setAna(!S.ana); return; }
    if (typing(e)) { if (e.key === 'Escape') e.target.blur(); return; }
    const dir = DIR[e.key];
    if (run && !run.done) {
      if (run.mode === 'lesson') {
        if (e.key === 'Enter' || e.key === ' ' || dir === 'r') { e.preventDefault(); const g = $('#go'); if (g) g.click(); return; }
        if (e.key === 'Escape') { e.preventDefault(); leave(); return; }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); leave(); return; }
      if (run.mode === 'chal' && !run.answered) {
        if ((e.key === 'h' || e.key === 'H')) { const hb = $('#hintbtn'); if (hb && !hb.disabled) { e.preventDefault(); hb.click(); } return; }
        if ((e.key === 'l' || e.key === 'L') && !dir) { const d = $('#reviewlesson'); if (d) { e.preventDefault(); d.open = !d.open; } return; }
        if (run.b && run.b.key && run.b.key(e, dir)) { e.preventDefault(); return; }
        return;
      }
      if (run.answered) {
        if (e.key === 'Enter' || e.key === ' ' || dir === 'r') { const nb = $('#nextbtn'); if (nb) { e.preventDefault(); nb.click(); } return; }
      }
    }
    if (run && run.done) {
      if (e.key === 'Escape') { e.preventDefault(); home(); return; }
      if (dir) { if (moveFocus(dir)) e.preventDefault(); return; }
      return;
    }
    if (dir && !e.shiftKey) { if (moveFocus(dir)) e.preventDefault(); }
  });
  function leave() { if (!TEST && run && !run.done && !confirm('Leave this level? Progress in this run is lost.')) return; home(); }

  /* ---------- home / level select ---------- */
  function home() {
    stopRun();
    document.title = cfg.title;
    const hw = hwList();
    const doneAll = cfg.levels.filter(l => (S.levels[l.n] || {}).done).length;
    const totalStars = cfg.levels.reduce((a, l) => a + ((S.levels[l.n] || {}).stars || 0), 0);
    const totalScore = cfg.levels.reduce((a, l) => a + ((S.levels[l.n] || {}).best || 0), 0);
    appEl.replaceChildren();
    const hero = h('div', { class: 'hero' }, h('h1', null, cfg.title), h('p', null, skin().tagline));
    appEl.append(hero);
    if (hw.length) {
      const doneHw = hw.filter(n => (S.levels[n] || {}).done).length;
      appEl.append(h('div', { class: 'hw', role: 'status' }, h('b', null, 'Assigned: levels ' + hw.join(' and ') + '.'), ' ', doneHw + ' of ' + hw.length + ' complete.'));
    }
    appEl.append(h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, doneAll + '/' + cfg.levels.length), 'levels cleared'),
      h('div', { class: 'stat' }, h('b', null, totalStars + '/' + cfg.levels.length * 3), 'stars'),
      h('div', { class: 'stat' }, h('b', null, totalScore), 'total best score')));
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Analogy mode' },
      h('span', { class: 'dim' }, 'Analogy mode:'),
      h('button', { class: 'btn' + (S.ana ? ' primary' : ''), 'aria-pressed': S.ana ? 'true' : 'false', onclick: () => setAna(true) }, 'On: ' + cfg.modes.on),
      h('button', { class: 'btn' + (!S.ana ? ' primary' : ''), 'aria-pressed': !S.ana ? 'true' : 'false', onclick: () => setAna(false) }, 'Off: ' + cfg.modes.off));
    appEl.append(seg);
    appEl.append(h('div', { class: 'row', style: 'margin-top:10px' },
      h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: !!S.calm, onchange: e => { S.calm = e.target.checked; save(); } }), cfg.timer ? ' Calm mode (no timers)' : ' Calm mode'),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: !!S.mute, onchange: e => { S.mute = e.target.checked; save(); } }), ' Mute sound')));
    const grid = h('div', { class: 'grid', role: 'list' });
    for (const l of cfg.levels) {
      const p = S.levels[l.n] || {};
      const c = h('button', { class: 'card', role: 'listitem', onclick: () => start(l), 'aria-label': 'Level ' + l.n + ': ' + lvTitle(l) + (p.done ? ', cleared, ' + p.stars + ' stars' : '') },
        hw.includes(l.n) ? h('span', { class: 'badge-hw' }, 'ASSIGNED') : null,
        h('div', { class: 'num' }, String(l.n).padStart(2, '0')),
        h('h3', null, lvTitle(l)),
        S.ana && l.ana ? h('p', null, h('b', null, 'Topic: '), l.topic) : null,
        h('p', null, S.ana && l.ana ? l.ana.mission : l.blurb),
        l.lec ? h('div', { class: 'chip' }, 'Lecture ' + l.lec) : null,
        h('div', { class: 'meta' }, diffDots(l), h('span', { class: 'sp' }), h('span', { html: starsHtml(p.stars || 0) }), p.best ? h('span', null, p.best + ' pts') : h('span', null, l.chals.length + ' challenges')));
      grid.append(c);
    }
    appEl.append(h('p', { class: 'dim keyline' }, 'Move with W A S D or the arrow keys. Enter or Space opens a level.'));
    appEl.append(grid);

    // teacher / progress tools
    const picks = h('div', { class: 'picks' });
    const out = h('textarea', { class: 'out', readonly: true, 'aria-label': 'Assignment link' });
    function upd() {
      const sel = [...picks.querySelectorAll('input:checked')].map(i => i.value);
      out.value = sel.length ? location.href.split('#')[0] + '#hw=' + sel.join(',') : '';
    }
    cfg.levels.forEach(l => picks.append(h('label', null, h('input', { type: 'checkbox', value: l.n, onchange: upd }), 'Level ' + l.n)));
    const rep = h('textarea', { class: 'out', readonly: true, 'aria-label': 'Progress report' });
    function report() {
      rep.value = cfg.title + ' progress\n' + cfg.levels.map(l => { const p = S.levels[l.n] || {}; return 'Level ' + l.n + ' (' + l.topic + '): ' + (p.done ? p.stars + ' stars, best ' + p.best + ' pts, ' + p.plays + ' plays' : 'not cleared'); }).join('\n');
      rep.select();
    }
    appEl.append(h('details', { class: 'tools' }, h('summary', null, 'Assign levels and progress report'),
      h('p', { class: 'dim' }, 'Pick levels to assign. The link below opens this game with those levels highlighted as homework. It only works for students once the file is hosted somewhere they can reach.'),
      picks, out,
      h('p', null, h('button', { class: 'btn', onclick: report }, 'Show my progress report')), rep,
      h('p', null, h('button', { class: 'btn ghost', onclick: () => { if (confirm('Erase all saved progress on this device?')) { S.levels = {}; save(); home(); } } }, 'Reset progress'))));
    window.scrollTo(0, 0);
    if (!TEST) { const cards = [...grid.querySelectorAll('button.card')]; const nxt = cfg.levels.findIndex(l => !(S.levels[l.n] || {}).done); (cards[nxt < 0 ? 0 : nxt] || cards[0]).focus({ preventScroll: true }); }
  }

  /* ---------- run lifecycle ---------- */
  function stopRun() {
    if (run) { clearInterval(run.tick); if (run.stage && run.stage.destroy) run.stage.destroy(); run = null; }
  }

  function start(level) {
    stopRun();
    document.title = 'Level ' + level.n + ' · ' + cfg.title;
    const SK = skin();
    const chals = level.chals;
    run = { mode: 'chal', shown: {}, level, i: 0, hearts: cfg.hearts || 3, score: 0, combo: 0, firstTry: 0, hintsUsed: 0, results: [], attempts: 0, hinted: false, done: false, tstart: 0 };
    appEl.replaceChildren();
    const head = h('div', { class: 'bar' },
      h('button', { class: 'btn ghost', onclick: leave }, '← Levels (Esc)'),
      h('h2', { id: 'lvtitle' }, h('span', { class: 'lvl' }, 'Level ' + level.n), ' · ' + lvTitle(level)),
      h('span', { class: 'sp' }),
      h('span', { class: 'hearts', id: 'hearts', role: 'img' }),
      h('span', { class: 'score', id: 'score', 'aria-live': 'off' }, '0'));
    const stageBox = h('div', { class: 'stage' });
    const prog = h('div', { class: 'prog', id: 'prog', 'aria-hidden': 'true' }, chals.map(() => h('i')));
    const combo = h('div', { class: 'combo', id: 'combo', 'aria-live': 'polite' });
    const body = h('div', { id: 'body' });
    appEl.append(head, stageBox, prog, combo, body);
    run.stage = cfg.stage ? cfg.stage(level, stageBox, !!S.ana) : null;
    if (run.stage && run.stage.setProgress) run.stage.setProgress(0, chals.length);
    drawHud();
    run.briefing = false;
    if (!level.learn && (level.intro || (S.ana && level.ana))) {
      run.briefing = true;
      const A = S.ana && level.ana;
      const bp = h('div', { class: 'panel' }, h('h3', null, A ? 'Mission: ' + level.ana.title : 'Briefing'));
      if (A) {
        bp.append(h('div', { class: 'concept', html: '<b>' + level.ana.mission + '</b>' + (level.ana.key ? '<br>' + level.ana.key : '') }));
        if (level.ana.map && level.ana.map.length) bp.append(h('div', { class: 'tr' }, level.ana.map.map(m => h('div', { class: 'trow' }, h('span', { class: 'rt', html: m[0] }), h('span', { class: 'kt', html: m[1] })))));
        if (level.intro) bp.append(h('details', { class: 'real' }, h('summary', null, 'The real thing (technical version)'), h('div', { class: 'concept', html: level.intro })));
      } else bp.append(h('div', { class: 'concept', html: level.intro }));
      body.append(h('div', { class: 'panel' }, ...bp.childNodes,
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', id: 'go', onclick: next }, 'Start level  (Enter)'))));
      $('#go').focus();
    } else next();
  }

  function drawHud() {
    const hs = $('#hearts'), max = cfg.hearts || 3;
    hs.replaceChildren();
    for (let i = 0; i < max; i++) hs.append(h('span', { class: i < run.hearts ? '' : 'lost' }, skin().heartIcon || '♥'));
    hs.setAttribute('aria-label', run.hearts + ' of ' + max + ' ' + (skin().heartName || 'lives') + ' left');
    $('#score').textContent = run.score;
    const p = $('#prog');
    [...p.children].forEach((el, i) => { el.className = i < run.i ? (run.results[i] && run.results[i].ok ? 'd' : 'b') : i === run.i ? 'c' : ''; });
    $('#combo').textContent = run.combo >= 2 ? 'Streak x' + run.combo + '  (+' + Math.min(run.combo - 1, 5) * 10 + '% points)' : '';
  }

  /* ---------- lessons (teach first, then ask) ---------- */
  function lessonTiers(L) { const t = new Set(L.chals.map(c => Math.min(3, c.tier || 1))); return [1, 2, 3].filter(x => t.has(x) && L.learn && L.learn[x]); }
  const lessonTotal = L => lessonTiers(L).length;
  const lessonNo = (L, tier) => lessonTiers(L).indexOf(tier) + 1;
  function lessonHtml(les) { return h('div', { class: 'lbody' }, h('div', { html: les.h }), les.a ? h('div', { class: 'concept anabox anaonly', html: '<b>In the water pipes:</b> ' + les.a }) : null); }
  function showLesson(les, k, m) {
    run.mode = 'lesson'; run.b = null;
    const body = $('#body'); body.replaceChildren();
    const L = run.level, nq = L.chals.filter(c => Math.min(3, c.tier || 1) === Math.min(3, L.chals[run.i].tier || 1)).length;
    body.append(h('div', { class: 'panel pop lesson' },
      h('div', { class: 'row' }, h('span', { class: 'chip t' + Math.min(3, L.chals[run.i].tier || 1) }, 'Lesson ' + k + ' of ' + m), h('span', { class: 'dim' }, 'then ' + nq + ' question' + (nq === 1 ? '' : 's'))),
      h('h3', { class: 'ltitle' }, les.t),
      lessonHtml(les),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', id: 'go', onclick: next }, 'Got it. Play  (Enter)')),
      h('div', { class: 'keyhint' }, 'Enter or Space continues · Esc leaves the level')));
    drawHud();
    if (!TEST) $('#go').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- challenge runner ---------- */
  function next() {
    const L = run.level, body = $('#body');
    if (run.i >= L.chals.length) return finish(true);
    const raw = L.chals[run.i];
    const lt = Math.min(3, raw.tier || 1), les = !L.chals.some(x => x.t === 'lab') && L.learn && L.learn[lt];
    if (les && !run.shown[lt]) { run.shown[lt] = true; return showLesson(les, lessonNo(L, lt), lessonTotal(L)); }
    run.mode = 'chal'; run.briefing = false;
    const spec = raw.gen ? Object.assign({ t: raw.t, tier: raw.tier, boss: raw.boss, concept: raw.concept, ana: raw.ana, hint: raw.hint }, raw.gen()) : raw;
    run.spec = spec; run.attempts = 0; run.hinted = false; run.answered = false;
    body.replaceChildren();
    const panel = h('div', { class: 'panel pop' });
    const tier = spec.tier || 1;
    panel.append(h('div', { class: 'row' },
      h('span', { class: 'chip t' + tier }, spec.t !== 'lab' && L.chals.some(x => x.t === 'lab') ? 'Knowledge check' : spec.t === 'lab' ? ['', 'Guided build', 'Build', 'Build: no help'][tier] : ['', 'Warm-up', 'Challenge', 'Hard'][tier]),
      spec.boss ? h('span', { class: 'chip boss' }, 'Boss') : null,
      h('span', { class: 'dim' }, 'Challenge ' + (run.i + 1) + ' of ' + L.chals.length),
      h('span', { class: 'sp' })));
    if (raw.ana || spec.ana) panel.append(h('div', { class: 'concept anaonly', html: raw.ana || spec.ana }));
    if (spec.concept) panel.append(h('div', { class: 'concept', html: spec.concept }));
    if (spec.t !== 'lab' && L.learn && L.learn[Math.min(3, tier)]) panel.append(h('details', { class: 'review', id: 'reviewlesson' }, h('summary', null, 'Review the lesson (L)'), lessonHtml(L.learn[Math.min(3, tier)])));
    const q = h('div', { class: 'q', html: spec.q });
    panel.append(q);
    const timerSecs = cfg.timer && !S.calm ? (spec.time || cfg.timer[tier] || 60) : 0;
    let tbar = null;
    if (timerSecs) { tbar = h('div', { class: 'timer', role: 'timer', 'aria-label': 'Time left' }, h('i')); panel.append(tbar); }
    const ctx = { attempt, h, rnd, pick, shuffle, fmt, parseNum, $, panel };
    const b = BUILD[spec.t](spec, ctx);
    run.b = b;
    panel.append(b.el);
    const fb = h('div', { id: 'fb', 'aria-live': 'polite' });
    const act = h('div', { class: 'actions' });
    if (b.needsCheck !== false) act.append(h('button', { class: 'btn primary', id: 'check', onclick: () => b.check() }, b.checkLabel || 'Check (Enter)'));
    if (spec.hint) act.append(h('button', { class: 'btn', id: 'hintbtn', onclick: () => { run.hinted = true; run.hintsUsed++; fb.replaceChildren(h('div', { class: 'fb info' }, h('b', { class: 't' }, 'Hint'), h('span', { html: spec.hint }))); $('#hintbtn').disabled = true; } }, 'Hint (-20%)'));
    panel.append(act, fb);
    if (b.keys) panel.append(h('div', { class: 'keyhint' }, b.keys + (spec.hint ? ' · H = hint' : '') + ' · Esc = leave'));
    body.append(panel);
    run.tstart = performance.now();
    if (timerSecs) {
      const total = timerSecs * 1000; run.tick = setInterval(() => {
        if (run.answered) return;
        const left = Math.max(0, 1 - (performance.now() - run.tstart) / total);
        tbar.firstChild.style.transform = 'scaleX(' + left + ')';
        if (left < .25) tbar.firstChild.style.background = 'var(--bad)';
        if (left <= 0) { clearInterval(run.tick); timeout(); }
      }, 100);
    }
    const f = panel.querySelector('input');
    if (!TEST) { if (f) f.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
    drawHud();
  }

  function timeout() {
    if (!run || run.answered) return;
    run.attempts = 2; loseHeart();
    sfx.bad();
    resolve(false, 'Time ran out. ');
  }

  function loseHeart() {
    run.hearts = Math.max(0, run.hearts - 1);
    run.combo = 0;
    if (run.stage && run.stage.bad) run.stage.bad(run.hearts);
    const a = $('#app'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake');
    drawHud();
  }

  // builders call this with true/false each time the player commits an answer
  function attempt(ok) {
    if (!run || run.answered) return;
    if (ok) { sfx.good(); return resolve(true, ''); }
    run.attempts++;
    loseHeart(); sfx.bad();
    if (run.hearts <= 0) { run.b.reveal && run.b.reveal(); run.answered = true; return setTimeout(() => finish(false), 900); }
    if (run.attempts >= 2) { return resolve(false, ''); }
    const fb = $('#fb');
    fb.replaceChildren(h('div', { class: 'fb bad' }, h('b', { class: 't' }, 'Not quite'), 'You lost one ' + (skin().heartName || 'life').replace(/s$/, '') + '. One more try, and a hint can help.'));
    run.b.retry && run.b.retry();
  }

  function resolve(ok, prefix) {
    run.answered = true; clearInterval(run.tick);
    const spec = run.spec, tier = spec.tier || 1;
    let pts = 0;
    if (ok) {
      pts = TIER_PTS[tier] * (spec.boss ? 1.5 : 1);
      if (run.attempts > 0) pts *= 0.5; else run.firstTry++;
      if (run.hinted) pts *= 0.8;
      if (run.attempts === 0) run.combo++; else run.combo = 0;
      pts *= 1 + Math.min(Math.max(run.combo - 1, 0), 5) * 0.1;
      if (cfg.timer && !S.calm) { const el = (performance.now() - run.tstart) / 1000; const lim = spec.time || cfg.timer[tier] || 60; pts *= 1 + Math.max(0, 1 - el / lim) * 0.25; }
      pts = Math.round(pts);
      run.score += pts;
    } else { run.b.reveal && run.b.reveal(); }
    run.results[run.i] = { ok, tries: run.attempts, pts };
    if (run.stage) (ok ? run.stage.good : run.stage.miss) && (ok ? run.stage.good(run.i + 1, run.level.chals.length) : run.stage.miss(run.i + 1, run.level.chals.length));
    const fb = $('#fb');
    fb.replaceChildren(h('div', { class: 'fb ' + (ok ? 'good' : 'info') },
      h('b', { class: 't' }, ok ? (run.attempts ? 'Correct on the retry  +' + pts : 'Correct  +' + pts) : (prefix || '') + 'Here is the answer'),
      h('span', { html: spec.why || '' })));
    const cb = $('#check'); if (cb) cb.disabled = true;
    const hb = $('#hintbtn'); if (hb) hb.disabled = true;
    const last = run.i >= run.level.chals.length - 1;
    const nb = h('button', { class: 'btn primary', id: 'nextbtn', onclick: () => { run.i++; if (run.stage && run.stage.advance) run.stage.advance(run.i, run.level.chals.length); next(); } }, last ? 'Finish level  (Enter)' : 'Next  (Enter)');
    $('#fb').after(h('div', { class: 'actions' }, nb));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); nb.focus({ preventScroll: true });
    drawHud();
  }

  function finish(won) {
    run.done = true; clearInterval(run.tick);
    const L = run.level, n = L.chals.length;
    let stars = 0;
    if (won) { const ratio = run.firstTry / n; stars = 1; if (ratio >= 0.6) stars = 2; if (ratio >= 0.9 && run.hintsUsed <= 1) stars = 3; }
    const p = S.levels[L.n] || { plays: 0, best: 0, stars: 0, done: false };
    p.plays++;
    if (won) { p.done = true; p.stars = Math.max(p.stars, stars); p.best = Math.max(p.best, run.score); }
    S.levels[L.n] = p; save();
    if (run.stage) won ? run.stage.win && run.stage.win() : run.stage.lose && run.stage.lose();
    won ? sfx.win() : sfx.lose();
    const body = $('#body'); body.replaceChildren();
    const nextL = cfg.levels.find(l => l.n === L.n + 1);
    body.append(h('div', { class: 'panel res' },
      h('h2', null, won ? skin().winText || 'Level cleared!' : skin().loseText || 'Out of lives'),
      won ? h('div', { class: 'big', html: starsHtml(stars) }) : h('p', { class: 'dim' }, 'No worries. Retry and the numbers will change.'),
      h('table', null,
        h('tr', null, h('td', null, 'Score'), h('td', null, h('b', null, run.score))),
        h('tr', null, h('td', null, 'Best on this level'), h('td', null, p.best)),
        h('tr', null, h('td', null, 'Right on the first try'), h('td', null, run.firstTry + ' of ' + n)),
        h('tr', null, h('td', null, 'Hints used'), h('td', null, run.hintsUsed)),
        h('tr', null, h('td', null, skin().heartName ? skin().heartName[0].toUpperCase() + skin().heartName.slice(1) + ' left' : 'Lives left'), h('td', null, run.hearts))),
      h('p', { class: 'dim' }, won ? '3 stars: 90% right on the first try and at most one hint.' : ''),
      h('div', { class: 'actions', style: 'justify-content:center' },
        h('button', { class: 'btn primary', id: 'again', onclick: () => start(L) }, won ? 'Play again' : 'Try again'),
        won && nextL ? h('button', { class: 'btn', onclick: () => start(nextL) }, 'Next level') : null,
        h('button', { class: 'btn', onclick: home }, 'Level select'))));
    drawHud();
    window.scrollTo(0, 0);
    if (!TEST) { const bs = [...document.querySelectorAll('.res .actions button')]; (won && nextL ? bs[1] : bs[0]).focus({ preventScroll: true }); }
  }

  /* ---------- challenge builders (keyboard: WASD or arrows) ---------- */
  const BUILD = {};
  const kf = (el, on) => { if (el) el.classList.toggle('kfocus', !!on); };
  const wrap = (i, n) => ((i % n) + n) % n;

  BUILD.choice = (s, c) => {
    const idx = shuffle(s.opts.map((o, i) => i));
    let locked = false, cur = 0;
    const buttons = idx.map((oi, k) => h('button', { class: 'opt', 'data-oi': oi, onclick: e => {
      if (locked) return; const ok = oi === s.a; const btn = e.currentTarget;
      if (ok) { btn.classList.add('right'); locked = true; } else { btn.classList.add('wrong'); btn.disabled = true; }
      c.attempt(ok);
    } }, h('span', { class: 'k' }, String(k + 1)), h('span', { html: s.opts[oi] })));
    const el = h('div', { class: 'opts' + (s.opts.every(o => o.length < 34) ? ' two' : '') }, buttons);
    const paint = () => buttons.forEach((b, i) => kf(b, i === cur && !locked && !b.disabled));
    paint();
    return {
      el, needsCheck: false, keys: 'W/S or ↑/↓ move · Enter or Space choose · 1-' + buttons.length + ' jump',
      key(e, dir) {
        if (locked) return false;
        const live = buttons.map((b, i) => i).filter(i => !buttons[i].disabled);
        if (!live.length) return false;
        if (/^[1-9]$/.test(e.key) && +e.key <= buttons.length) { const b = buttons[+e.key - 1]; if (!b.disabled) b.click(); return true; }
        if (dir === 'u' || dir === 'l') { let n = cur; do { n = wrap(n - 1, buttons.length); } while (buttons[n].disabled); cur = n; paint(); return true; }
        if (dir === 'd' || dir === 'r') { let n = cur; do { n = wrap(n + 1, buttons.length); } while (buttons[n].disabled); cur = n; paint(); return true; }
        if (e.key === 'Enter' || e.key === ' ') { if (buttons[cur].disabled) cur = live[0]; buttons[cur].click(); paint(); return true; }
        return false;
      },
      retry() { const live = buttons.findIndex(b => !b.disabled); cur = live < 0 ? 0 : live; paint(); },
      reveal() { locked = true; buttons.forEach(b => { b.disabled = true; kf(b, false); if (+b.dataset.oi === s.a) b.classList.add('right'); }); },
      auto() { buttons.find(b => +b.dataset.oi === s.a).click(); },
      autoWrong() { const b = buttons.find(b => +b.dataset.oi !== s.a && !b.disabled); b.click(); },
    };
  };

  BUILD.num = (s, c) => {
    const inp = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Your answer', onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); b.check(); } } });
    const el = h('div', null,
      s.given ? h('div', { class: 'given' }, s.given.map(g => h('span', { html: g }))) : null,
      h('div', { class: 'numrow' }, inp, s.unit ? h('span', { class: 'u', html: s.unit }) : null));
    const accepts = Array.isArray(s.a) ? s.a : [s.a];
    const tol = s.tol == null ? 0.02 : s.tol;
    const good = v => accepts.some(a => Math.abs(v - a) <= Math.max(Math.abs(a) * tol, s.abs || 1e-9));
    const b = {
      el, keys: 'Type the number, Enter to check · Esc to leave the box (then H = hint)',
      key(e) { if (e.key === 'Enter' && !run.answered) { inp.focus(); return true; } return false; },
      check() { const v = parseNum(inp.value); if (isNaN(v)) { inp.focus(); return; } c.attempt(good(v)); },
      retry() { inp.select(); },
      reveal() { inp.value = fmt(accepts[0], 4); inp.disabled = true; },
      auto() { inp.value = String(accepts[0]); b.check(); },
      autoWrong() { inp.value = '12345.678'; b.check(); },
    };
    return b;
  };

  BUILD.match = (s, c) => {
    const rights = s.pairs.map(p => p[1]).concat(s.extra || []);
    const chips = shuffle(rights.map((r, i) => ({ r, id: i })));
    let sel = null, cur = 0;
    const tray = h('div', { class: 'tray' });
    const slots = s.pairs.map(p => ({ el: h('div', { class: 'slot', tabindex: 0 }), want: p[1], chip: null }));
    const mk = ch => { ch.el = h('button', { class: 'pill', tabindex: -1, onclick: e => { if (ch.locked) return; const own = slots.find(x => x.chip === ch); if (own) { e.stopPropagation(); own.chip = null; sel = null; refresh(); return; } sel = sel === ch ? null : ch; refresh(); } }, h('span', { html: ch.r })); return ch; };
    chips.forEach(mk);
    function refresh() {
      tray.replaceChildren(...chips.filter(ch => !slots.some(sl => sl.chip === ch)).map(ch => ch.el));
      chips.forEach(ch => ch.el.classList.toggle('sel', sel === ch));
      slots.forEach((sl, i) => { sl.el.replaceChildren(sl.chip ? sl.chip.el : ''); kf(sl.el, i === cur); });
    }
    slots.forEach((sl, i) => sl.el.addEventListener('click', e => {
      cur = i;
      if (e.target.closest('.pill') && sl.chip && !sel) { sl.chip = null; refresh(); return; }
      if (sel) { const prev = slots.find(x => x.chip === sel); if (prev) prev.chip = null; const old = sl.chip; sl.chip = sel; sel = null; if (old) old.el.classList.remove('sel'); }
      refresh();
    }));
    const el = h('div', null, h('div', { class: 'dim' }, 'Pick a card for each slot. Mouse: tap a card, then a slot. Keys: W/S choose the slot, A/D swap the card.'), tray,
      h('div', null, s.pairs.map((p, i) => h('div', { class: 'slotrow' }, h('div', { html: p[0] }), slots[i].el))));
    refresh();
    function fbMsg(m) { $('#fb').replaceChildren(h('div', { class: 'fb info' }, m)); }
    const b = {
      el, keys: 'W/S pick a slot · A/D change its card · Enter = next slot, then check',
      key(e, dir) {
        if (dir === 'u') { cur = wrap(cur - 1, slots.length); refresh(); return true; }
        if (dir === 'd') { cur = wrap(cur + 1, slots.length); refresh(); return true; }
        if (dir === 'l' || dir === 'r') {
          const sl = slots[cur]; if (sl.chip && sl.chip.locked) return true;
          const ci = sl.chip ? chips.indexOf(sl.chip) : (dir === 'r' ? -1 : 0);
          const order = []; for (let k = 1; k <= chips.length; k++) order.push(chips[wrap(ci + (dir === 'r' ? k : -k), chips.length)]);
          const free = order.find(x => x !== sl.chip && !x.locked && !slots.some(o => o.chip === x));
          const target = free || order.find(x => x !== sl.chip && !x.locked);
          if (!target) return true;
          const holder = slots.find(x => x.chip === target);
          if (holder && holder !== sl) holder.chip = sl.chip || null;
          sl.chip = target; refresh(); return true;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          if (slots.every(x => x.chip)) { b.check(); return true; }
          const nx = slots.findIndex((x, i) => i > cur && !x.chip); cur = nx >= 0 ? nx : slots.findIndex(x => !x.chip); refresh(); return true;
        }
        return false;
      },
      check() {
        const filled = slots.every(sl => sl.chip);
        if (!filled) { fbMsg('Fill every slot first.'); return; }
        const okAll = slots.every(sl => sl.chip.r === sl.want);
        slots.forEach(sl => { sl.chip.el.classList.remove('ok', 'no'); sl.chip.el.classList.add(sl.chip.r === sl.want ? 'ok' : 'no'); });
        c.attempt(okAll);
      },
      retry() { slots.forEach(sl => { if (sl.chip.r !== sl.want) sl.chip = null; else sl.chip.locked = true; }); cur = Math.max(0, slots.findIndex(x => !x.chip)); refresh(); },
      reveal() { slots.forEach(sl => { const ch = chips.find(x => x.r === sl.want && !slots.some(o => o !== sl && o.chip === x)); sl.chip = ch || sl.chip; if (sl.chip) { sl.chip.locked = true; sl.chip.el.classList.remove('no'); sl.chip.el.classList.add('ok'); } }); chips.forEach(x => x.locked = true); refresh(); },
      auto() { slots.forEach(sl => { sl.chip = null; }); slots.forEach(sl => { sl.chip = chips.find(x => x.r === sl.want && !slots.some(o => o.chip === x)); }); refresh(); b.check(); },
      autoWrong() { slots.forEach(sl => sl.chip = null); const arr = chips.slice(); slots.forEach((sl, i) => sl.chip = arr[(i + 1) % arr.length]); const dup = new Set(slots.map(x => x.chip)); if (dup.size < slots.length) { slots.forEach((sl, i) => sl.chip = arr[i]); } refresh(); b.check(); },
    };
    return b;
  };

  BUILD.order = (s, c) => {
    const items = shuffle(s.items.map((t, i) => ({ t, i })));
    let seq = [], cur = 0;
    const pool = h('div', { class: 'tray' }), ans = h('div', { class: 'seq' });
    items.forEach(it => { it.el = h('button', { class: 'pill', tabindex: -1, onclick: () => { if (it.locked) return; if (seq.includes(it)) seq = seq.filter(x => x !== it); else seq.push(it); refresh(); } }, h('span', { html: it.t })); });
    const left = () => items.filter(it => !seq.includes(it));
    function refresh() {
      const lf = left(); cur = Math.min(cur, Math.max(0, lf.length - 1));
      pool.replaceChildren(...lf.map(it => it.el));
      ans.replaceChildren(...seq.map((it, k) => { it.el.setAttribute('aria-label', (k + 1) + ': ' + it.el.textContent); return it.el; }));
      items.forEach(it => kf(it.el, false)); if (lf[cur]) kf(lf[cur].el, true);
    }
    refresh();
    const el = h('div', null, h('div', { class: 'dim' }, 'Add the cards in order, first step first. Keys: W/S choose a card, Enter adds it, A or Backspace takes the last one back.'), h('div', { class: 'dim', style: 'margin-top:8px' }, 'Your order:'), h('div', { class: 'tray' }, ans), h('div', { class: 'dim' }, 'Cards left:'), pool);
    const b = {
      el, keys: 'W/S pick a card · Enter add it · A or Backspace undo · Enter again when all are placed to check',
      key(e, dir) {
        const lf = left();
        if (dir === 'u') { cur = wrap(cur - 1, Math.max(1, lf.length)); refresh(); return true; }
        if (dir === 'd') { cur = wrap(cur + 1, Math.max(1, lf.length)); refresh(); return true; }
        if (dir === 'l' || e.key === 'Backspace') { const last = seq[seq.length - 1]; if (last && !last.locked) { seq.pop(); refresh(); } return true; }
        if (e.key === 'Enter' || e.key === ' ' || dir === 'r') {
          if (!lf.length) { b.check(); return true; }
          seq.push(lf[cur]); refresh(); return true;
        }
        return false;
      },
      check() { if (seq.length < items.length) { $('#fb').replaceChildren(h('div', { class: 'fb info' }, 'Place every card first.')); return; } const ok = seq.every((it, k) => it.i === k); seq.forEach((it, k) => { it.el.classList.remove('ok', 'no'); it.el.classList.add(it.i === k ? 'ok' : 'no'); }); c.attempt(ok); },
      retry() { const keep = []; for (const [k, it] of seq.entries()) { if (it.i === k && keep.length === k) { keep.push(it); it.locked = true; } else break; } seq = keep; items.forEach(it => { if (!seq.includes(it)) it.el.classList.remove('ok', 'no'); }); cur = 0; refresh(); },
      reveal() { seq = items.slice().sort((a, b) => a.i - b.i); items.forEach(it => { it.locked = true; it.el.classList.remove('no'); it.el.classList.add('ok'); kf(it.el, false); }); refresh(); },
      auto() { seq = items.slice().sort((a, b) => a.i - b.i); refresh(); b.check(); },
      autoWrong() { seq = items.slice().sort((a, b) => b.i - a.i); refresh(); b.check(); },
    };
    return b;
  };

  BUILD.sort = (s, c) => {
    const items = shuffle(s.items.map((x, i) => ({ q: x[0], b: x[1], i })));
    let k = 0; const prog = h('div', { class: 'sortprog' }, items.map(() => h('i')));
    const card = h('div', { class: 'sortcard', 'aria-live': 'polite' });
    const nb = s.buckets.length;
    const arrows = nb === 2 ? ['←  A', 'D  →'] : nb === 3 ? ['←  A', '↓  S', 'D  →'] : s.buckets.map((_, i) => String(i + 1));
    const bk = h('div', { class: 'buckets' }, s.buckets.map((lab, bi) => h('button', { class: 'btn', onclick: () => pickB(bi) }, h('small', { class: 'kcap' }, arrows[bi]), h('span', { html: lab }))));
    function show() { if (k < items.length) card.innerHTML = items[k].q; prog.childNodes.forEach((p, i) => p.className = i < k ? 'd' : ''); }
    function pickB(bi) {
      if (k >= items.length) return;
      const ok = items[k].b === bi;
      if (ok) { k++; show(); if (k >= items.length) { bk.querySelectorAll('button').forEach(b => b.disabled = true); c.attempt(true); } else sfx.good(); }
      else { c.attempt(false); }
    }
    show();
    const el = h('div', null, h('div', { class: 'dim' }, 'Read the card, then send it to the right box.'), prog, card, bk);
    return {
      el, needsCheck: false, keys: nb === 2 ? 'A/← = left box · D/→ = right box' : nb === 3 ? 'A/← left · S/↓ middle · D/→ right' : 'Press 1-' + nb + ' for the box',
      key(e, dir) {
        if (/^[1-9]$/.test(e.key) && +e.key <= nb) { pickB(+e.key - 1); return true; }
        if (nb === 2) { if (dir === 'l') { pickB(0); return true; } if (dir === 'r') { pickB(1); return true; } }
        if (nb === 3) { if (dir === 'l') { pickB(0); return true; } if (dir === 'd') { pickB(1); return true; } if (dir === 'r') { pickB(2); return true; } }
        return false;
      },
      retry() {},
      reveal() { k = items.length; prog.childNodes.forEach(p => p.className = 'd'); card.textContent = 'Done'; bk.querySelectorAll('button').forEach(b => b.disabled = true); },
      auto() { while (k < items.length) { const b = items[k].b; pickB(b); } },
      autoWrong() { const w = (items[k].b + 1) % s.buckets.length; pickB(w); },
    };
  };

  BUILD.wire = (s, c) => {
    let links = [], sel = null, col = 'L', cur = 0;
    const L = s.left.map(x => ({ x, el: null })), R = s.right.map(x => ({ x, el: null }));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const box = h('div', { class: 'wire' });
    const clickL = o => { sel = sel === o.x.id ? null : o.x.id; paint(); };
    const clickR = o => { if (sel == null) return; const ix = links.findIndex(l => l[0] === sel && l[1] === o.x.id); if (ix >= 0) links.splice(ix, 1); else links.push([sel, o.x.id]); sel = null; paint(); };
    L.forEach((o, i) => o.el = h('button', { class: 'pill', tabindex: -1, onclick: () => { col = 'L'; cur = i; clickL(o); } }, h('span', { html: o.x.label })));
    R.forEach((o, i) => o.el = h('button', { class: 'pill', tabindex: -1, onclick: () => { col = 'R'; cur = i; clickR(o); } }, h('span', { html: o.x.label })));
    box.append(svg, h('div', { class: 'col' }, L.map(o => o.el)), h('div', { class: 'col' }, R.map(o => o.el)));
    let bad = new Set();
    function paint() {
      L.forEach((o, i) => { o.el.classList.toggle('sel', sel === o.x.id); kf(o.el, col === 'L' && cur === i); });
      R.forEach((o, i) => kf(o.el, col === 'R' && cur === i));
      svg.replaceChildren();
      const br = box.getBoundingClientRect();
      links.forEach((l, i) => {
        const a = L.find(o => o.x.id === l[0]).el.getBoundingClientRect(), b = R.find(o => o.x.id === l[1]).el.getBoundingClientRect();
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const x1 = a.right - br.left, y1 = a.top + a.height / 2 - br.top, x2 = b.left - br.left, y2 = b.top + b.height / 2 - br.top;
        ln.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + (x1 + 50) + ' ' + y1 + ',' + (x2 - 50) + ' ' + y2 + ',' + x2 + ' ' + y2);
        ln.setAttribute('fill', 'none'); ln.setAttribute('stroke-width', '4');
        ln.setAttribute('stroke', bad.has(i) ? '#ff6b6b' : '#ffe66d');
        svg.append(ln);
      });
    }
    const ro = window.ResizeObserver ? new ResizeObserver(paint) : null; if (ro) ro.observe(box);
    setTimeout(paint, 30);
    const key = l => l[0] + '>' + l[1];
    const want = new Set(s.links.map(key));
    const el = h('div', null, h('div', { class: 'dim' }, 'Connect each block on the left to the block on the right it feeds. Keys: W/S move, D or Enter picks a left block, then pick its partner on the right with Enter. A goes back. Space checks.'), box,
      h('div', null, h('button', { class: 'btn ghost', onclick: () => { links = []; bad = new Set(); sel = null; paint(); } }, 'Clear wires')));
    const b = {
      el, keys: 'W/S move · D/Enter pick left block, then Enter on its partner · A back · Backspace clear · Space check',
      key(e, dir) {
        const col2 = col === 'L' ? L : R;
        if (dir === 'u') { cur = wrap(cur - 1, col2.length); paint(); return true; }
        if (dir === 'd') { cur = wrap(cur + 1, col2.length); paint(); return true; }
        if (dir === 'l') { col = 'L'; cur = Math.min(cur, L.length - 1); paint(); return true; }
        if (e.key === 'Backspace') { links = []; bad = new Set(); sel = null; paint(); return true; }
        if (e.key === ' ') { b.check(); return true; }
        if (dir === 'r' || e.key === 'Enter') {
          if (col === 'L') { sel = L[cur].x.id; col = 'R'; cur = 0; paint(); return true; }
          if (e.key === 'Enter') { clickR(R[cur]); col = 'L'; cur = 0; paint(); return true; }
        }
        return false;
      },
      check() {
        if (!links.length) { $('#fb').replaceChildren(h('div', { class: 'fb info' }, 'Draw at least one wire first.')); return; }
        bad = new Set(); links.forEach((l, i) => { if (!want.has(key(l))) bad.add(i); });
        const have = new Set(links.map(key)); const ok = bad.size === 0 && [...want].every(k => have.has(k));
        paint(); c.attempt(ok);
      },
      retry() { links = links.filter((l, i) => !bad.has(i)); bad = new Set(); paint(); },
      reveal() { links = s.links.map(l => l.slice()); bad = new Set(); paint(); },
      auto() { links = s.links.map(l => l.slice()); paint(); b.check(); },
      autoWrong() { links = [[s.left[0].id, s.right[s.right.length - 1].id]]; if (want.has(key(links[0]))) links = [[s.left[0].id, '__none__']]; links = links.filter(l => R.some(o => o.x.id === l[1])); if (!links.length) links = [[s.left[0].id, s.right[0].id]]; paint(); b.check(); },
    };
    return b;
  };

  BUILD.bits = (s, c) => {
    const n = s.start.length;
    let v = s.start.split('').map(Number), cur = n - 1;
    const labels = s.labels || Array.from({ length: n }, (_, i) => 'bit ' + (n - 1 - i));
    const btns = v.map((b, i) => h('button', { 'aria-label': labels[i] + ' is ' + b, tabindex: -1, onclick: () => { cur = i; v[i] ^= 1; paint(); } }, ''));
    const read = h('div', { class: 'regread' });
    function val() { return parseInt(v.join(''), 2); }
    function paint() {
      btns.forEach((b, i) => { b.textContent = v[i]; b.classList.toggle('on', !!v[i]); b.setAttribute('aria-label', labels[i] + ' is ' + v[i]); kf(b, i === cur); });
      read.textContent = (s.regName ? s.regName + ' = ' : '') + '0b' + v.join('') + '  =  0x' + val().toString(16).toUpperCase().padStart(Math.ceil(n / 4), '0') + '  =  ' + val();
    }
    paint();
    const el = h('div', null, h('div', { class: 'reg' }, v.map((b, i) => h('div', { class: 'bit' }, btns[i], h('small', null, labels[i])))), read,
      s.stateText ? h('div', { class: 'regread', html: s.stateText }) : null);
    const b = {
      el, keys: 'A/D move along the bits · W/S or Space flips the bit · Enter checks',
      key(e, dir) {
        if (dir === 'l') { cur = wrap(cur - 1, n); paint(); return true; }
        if (dir === 'r') { cur = wrap(cur + 1, n); paint(); return true; }
        if (dir === 'u' || dir === 'd' || e.key === ' ') { v[cur] ^= 1; paint(); return true; }
        if (e.key === 'Enter') { b.check(); return true; }
        return false;
      },
      check() { const ok = v.join('') === s.target; btns.forEach((x, i) => x.classList.toggle('bad', !ok && v[i] !== +s.target[i])); c.attempt(ok); },
      retry() { btns.forEach(x => x.classList.remove('bad')); },
      reveal() { v = s.target.split('').map(Number); btns.forEach(x => { x.classList.remove('bad'); x.disabled = true; kf(x, false); }); paint(); },
      auto() { v = s.target.split('').map(Number); paint(); b.check(); },
      autoWrong() { v = s.target.split('').map(Number); v[n - 1] ^= 1; paint(); b.check(); },
    };
    return b;
  };

  /* ---------- lab: walk, carry parts, build the thing, test it ---------- */
  const GLY = {
    R: '<path d="M1 10h6l2-6 4 12 4-12 4 12 4-12 2 6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    C: '<path d="M1 10h15M16 3v14M24 3v14M24 10h15" fill="none" stroke="currentColor" stroke-width="2"/>',
    L: '<path d="M1 12h5a4 6 0 0 1 8 0a4 6 0 0 1 8 0a4 6 0 0 1 8 0h9" fill="none" stroke="currentColor" stroke-width="2"/>',
    BAT: '<path d="M1 10h13M14 3v14M20 6v8M20 10h19" fill="none" stroke="currentColor" stroke-width="2"/><text x="26" y="6" font-size="7" fill="currentColor">+</text>',
    LED: '<path d="M1 10h12M13 3l10 7-10 7zM24 3v14M24 10h15M26 2l5-3M30 5l5-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    BULB: '<circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 4l12 12M26 4L14 16M1 10h5M34 10h5" stroke="currentColor" stroke-width="2"/>',
    SRC: '<circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 10c2-5 4-5 6 0s4 5 6 0M1 10h5M34 10h5" fill="none" stroke="currentColor" stroke-width="2"/>',
    MOTOR: '<circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><text x="15.5" y="14" font-size="11" font-weight="700" fill="currentColor">M</text><path d="M1 10h5M34 10h5" stroke="currentColor" stroke-width="2"/>',
    BOX: '<rect x="8" y="2" width="24" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1 10h7M32 10h7" stroke="currentColor" stroke-width="2"/>',
  };
  const glyph = k => '<svg class="gly" viewBox="0 0 40 20" aria-hidden="true">' + (GLY[k] || GLY.BOX) + '</svg>';

  BUILD.lab = (s, c) => {
    const cols = s.cols || 11, rows = s.rows || 7;
    const ents = [];
    const parts = s.parts;
    if (parts.length > cols - 1) throw new Error('lab has too many parts: ' + parts.length);
    parts.forEach((p, i) => ents.push({ type: 'bin', x: parts.length === 1 ? Math.floor(cols / 2) : parts.length > cols - 2 ? i : Math.round(1 + i * (cols - 3) / (parts.length - 1)), y: rows - 1, part: p }));
    (s.sockets || []).forEach(k => ents.push(Object.assign({ type: 'socket' }, k)));
    (s.fixed || []).forEach(k => ents.push(Object.assign({ type: 'fixed' }, k)));
    const lev = Object.assign({ x: cols - 1, y: Math.floor(rows / 2) }, s.lever || {});
    ents.push({ type: 'lever', x: lev.x, y: lev.y });
    const at = (x, y) => ents.find(e => e.x === x && e.y === y);
    const sockets = ents.filter(e => e.type === 'socket');
    const placed = {}; sockets.forEach(k => placed[k.id] = null);
    let pos = Object.assign({ x: Math.floor(cols / 2), y: Math.floor(rows / 2) - 1 }, s.start || {}), face = 'u', carry = null, done = false, busy = false;
    const DV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
    const pct = (x, y) => 'left:' + (x / cols * 100) + '%;top:' + (y / rows * 100) + '%;width:' + (100 / cols) + '%;height:' + (100 / rows) + '%';

    const wiresSvg = '<svg class="labwires" viewBox="0 0 ' + cols + ' ' + rows + '" preserveAspectRatio="none" aria-hidden="true">' +
      (s.wires || []).map(w => '<polyline points="' + w.map(p => (p[0] + .5) + ',' + (p[1] + .5)).join(' ') + '" />').join('') + '</svg>';
    const room = h('div', { class: 'lab', role: 'group', 'aria-label': 'Workshop. Walk with W A S D or the arrow keys.', style: '--cols:' + cols + ';--rows:' + rows + ';aspect-ratio:' + cols + '/' + rows, html: wiresSvg });
    const els = new Map();
    ents.forEach(e => {
      let el;
      if (e.type === 'bin') el = h('div', { class: 'ent bin', style: pct(e.x, e.y), html: glyph(e.part.kind || 'R') + '<b>' + e.part.label + '</b>', 'aria-label': 'Parts bin: ' + e.part.label });
      else if (e.type === 'socket') el = h('div', { class: 'ent socket', style: pct(e.x, e.y), 'aria-label': 'Socket ' + (e.label || e.id) });
      else if (e.type === 'lever') el = h('div', { class: 'ent lever', style: pct(e.x, e.y), html: '<i></i><b>TEST</b>', 'aria-label': 'Test lever' });
      else el = h('div', { class: 'ent fixed k-' + (e.kind || 'BOX'), style: pct(e.x, e.y), html: glyph(e.kind) + '<b>' + (e.label || '') + '</b>' + (e.sub ? '<small>' + e.sub + '</small>' : ''), 'aria-label': (e.label || '') + ' ' + (e.sub || '') });
      el.addEventListener('click', () => clickEnt(e));
      els.set(e, el); room.append(el);
    });
    const me = h('div', { class: 'me', style: pct(pos.x, pos.y), 'aria-hidden': 'true' }, h('div', { class: 'carry' }), h('div', { class: 'body' }));
    room.append(me);
    const marker = h('div', { class: 'facemark', 'aria-hidden': 'true' }); room.append(marker);

    const note = h('div', { class: 'labnote', 'aria-live': 'polite' });
    const meters = h('div', { class: 'labmeters', 'aria-live': 'polite' });
    const tipbar = h('div', { class: 'labtip' });
    const teach = s.teach ? h('div', { class: 'labteach', html: '<b class="eh">Lab notebook</b>' + s.teach }) : null;
    const pad = h('div', { class: 'labpad' },
      h('button', { tabindex: -1, 'aria-label': 'Up', onclick: () => step('u') }, '▲'), h('button', { tabindex: -1, 'aria-label': 'Left', onclick: () => step('l') }, '◀'),
      h('button', { tabindex: -1, 'aria-label': 'Down', onclick: () => step('d') }, '▼'), h('button', { tabindex: -1, 'aria-label': 'Right', onclick: () => step('r') }, '▶'),
      h('button', { class: 'act', tabindex: -1, onclick: () => act() }, 'Grab / place'), h('button', { class: 'act', tabindex: -1, onclick: () => b.check() }, 'TEST'));
    const el = h('div', { class: 'labwrap' }, teach, room, tipbar, meters, note, pad);

    const target = () => { const d = DV[face]; return at(pos.x + d[0], pos.y + d[1]); };
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !at(x, y);
    function step(dir) {
      if (done || run.answered) return; face = dir;
      const d = DV[dir], nx = pos.x + d[0], ny = pos.y + d[1];
      if (free(nx, ny)) { pos = { x: nx, y: ny }; sfx.tick && sfx.tick(); }
      paint();
    }
    function snapshot() { return Object.assign({}, placed); }
    function act() {
      if (done || run.answered) return;
      const t = target(); if (!t) { tipbar.textContent = 'Nothing in front of you. Face a bin, a socket or the lever.'; return; }
      if (t.type === 'bin') { carry = t.part; }
      else if (t.type === 'socket') {
        if (carry) { const prev = placed[t.id]; placed[t.id] = carry; carry = prev || null; }
        else if (placed[t.id]) { carry = placed[t.id]; placed[t.id] = null; }
      } else if (t.type === 'lever') { return b.check(); }
      else if (t.type === 'fixed') { tipbar.textContent = t.info || ((t.label || '') + ' ' + (t.sub || '')); return; }
      paint();
    }
    function clickEnt(e) {
      if (done || run.answered) return;
      // stand on any free neighbour and face the thing
      const opts = [['u', 0, 1], ['d', 0, -1], ['l', 1, 0], ['r', -1, 0]].map(([f, dx, dy]) => ({ f, x: e.x + dx, y: e.y + dy })).filter(o => free(o.x, o.y));
      if (!opts.length) return; opts.sort((a, b2) => Math.abs(a.x - pos.x) + Math.abs(a.y - pos.y) - Math.abs(b2.x - pos.x) - Math.abs(b2.y - pos.y));
      pos = { x: opts[0].x, y: opts[0].y }; face = opts[0].f; act();
    }
    function result() {
      const filled = sockets.every(k => placed[k.id]);
      const r = s.model(snapshot()) || {};
      return { filled, r };
    }
    function paint() {
      me.style.cssText = pct(pos.x, pos.y);
      me.className = 'me f-' + face + (carry ? ' has' : '');
      me.firstChild.innerHTML = carry ? glyph(carry.kind || 'R') + '<b>' + carry.label + '</b>' : '';
      const d = DV[face], t = target();
      marker.style.cssText = pct(pos.x + d[0], pos.y + d[1]); marker.classList.toggle('on', !!t);
      ents.forEach(e => {
        const x = els.get(e); x.classList.toggle('target', e === t);
        if (e.type === 'socket') { const p = placed[e.id]; x.classList.toggle('full', !!p); x.innerHTML = p ? glyph(p.kind || 'R') + '<b>' + p.label + '</b>' : '<b class="q">?</b>' + (e.label ? '<small>' + e.label + '</small>' : ''); x.setAttribute('aria-label', 'Socket ' + (e.label || e.id) + (p ? ' holds ' + p.label : ' empty')); }
      });
      if (t) tipbar.textContent = t.type === 'bin' ? (carry ? 'Space: swap what you hold for ' : 'Space: pick up ') + t.part.label : t.type === 'socket' ? (carry ? (placed[t.id] ? 'Space: swap ' + carry.label + ' with ' + placed[t.id].label : 'Space: place ' + carry.label + ' here') : (placed[t.id] ? 'Space: take ' + placed[t.id].label + ' back' : 'Hold a part first')) : t.type === 'lever' ? 'Space or Enter: TEST the circuit' : 'Look: ' + (t.label || '');
      else tipbar.textContent = carry ? 'You are holding ' + carry.label + '. Walk to a socket.' : 'Walk to a parts bin and press Space to pick one up.';
      const { filled, r } = result();
      meters.replaceChildren(...(r.meters || []).map(m => h('div', { class: 'meter ' + (m.st || '') }, h('small', null, m.k), h('b', null, m.v))));
      const coach = s.coach && !done ? s.coach(snapshot(), carry) : '';
      note.innerHTML = (filled ? (r.note || '') : (r.note || '')) + (coach ? '<div class="coach"><b>Next:</b> ' + coach + '</div>' : '');
      room.classList.toggle('live', !!(filled && r.live));
    }
    paint();
    const b = {
      el, checkLabel: 'Test circuit (Enter)', keys: 'W A S D or arrows walk · Space / E grab or place · Q put down · Enter / T test',
      key(e, dir) {
        if (done) return false;
        if (dir) { step(dir); return true; }
        if (e.key === ' ' || e.key === 'e' || e.key === 'E') { act(); return true; }
        if (e.key === 'q' || e.key === 'Q' || e.key === 'Backspace') { carry = null; paint(); return true; }
        if (e.key === 'Enter' || e.key === 't' || e.key === 'T') { b.check(); return true; }
        return false;
      },
      check() {
        if (done || run.answered) return;
        const { filled, r } = result();
        if (!filled) { note.innerHTML = '<b>Fill every socket first.</b> ' + (r.note || ''); tipbar.textContent = 'Some sockets are still empty.'; return; }
        if (r.ok) { done = true; run.spec.why = r.why || r.note; room.classList.add('live', 'won'); }
        else { note.innerHTML = '<b>Not working yet.</b> ' + (r.fail || r.note || ''); }
        c.attempt(!!r.ok);
      },
      retry() { room.classList.remove('won'); },
      reveal() { done = true; solve(); paint(); },
      auto() { solve(); paint(); b.check(); },
      autoWrong() { const combos = enumerate(); const bad = combos.find(x => !s.model(x).ok); Object.assign(placed, bad || {}); paint(); b.check(); },
      lab: { cols, rows, ents, pos: () => pos, face: () => face, carry: () => carry, placed: () => placed },
    };
    function enumerate() {
      const out = [], ids = sockets.map(k => k.id);
      const rec = (i, cur) => { if (i === ids.length) return void out.push(Object.assign({}, cur)); parts.forEach(p => { cur[ids[i]] = p; rec(i + 1, cur); }); };
      rec(0, {}); return out;
    }
    function solve() { const ok = enumerate().find(x => s.model(x).ok); if (ok) Object.assign(placed, ok); carry = null; }
    return b;
  };

  /* ---------- analogy switch: always visible, works mid-level ---------- */
  function anaLabel() { const b = $('#anaBtn'); if (!b) return; b.setAttribute('aria-pressed', S.ana ? 'true' : 'false'); b.firstChild.textContent = 'Analogy: ' + (S.ana ? 'ON' : 'OFF'); b.title = (S.ana ? 'Now showing: ' + cfg.modes.on : 'Now showing: ' + cfg.modes.off) + '. Click or press N to switch.'; document.body.classList.toggle('ana-off', !S.ana); }
  function setAna(v) {
    S.ana = !!v; save(); anaLabel();
    if (!run) return home();
    if (run.briefing) return start(run.level);
    const box = $('.stage');
    if (box && cfg.stage && run.stage) {
      const total = run.level.chals.length;
      if (run.stage.destroy) run.stage.destroy(); box.replaceChildren();
      run.stage = cfg.stage(run.level, box, !!S.ana);
      if (run.stage && run.stage.setProgress) run.stage.setProgress(0, total);
      const dn = run.i + (run.answered && run.results[run.i] && run.results[run.i].ok ? 1 : 0);
      if (run.stage && run.stage.advance) run.stage.advance(dn, total);
      if (run.stage && run.stage.bad && run.hearts < (cfg.hearts || 3)) run.stage.bad(run.hearts);
    }
    drawHud();
    const t = $('#lvtitle'); if (t) t.replaceChildren(h('span', { class: 'lvl' }, 'Level ' + run.level.n), ' · ' + lvTitle(run.level));
  }

  /* ---------- public ---------- */
  function init(config) {
    cfg = config; S = Object.assign({ levels: {}, calm: false, mute: false, ana: true }, load());
    appEl = $('#app');
    const ab = h('button', { id: 'anaBtn', class: 'anabtn', onclick: e => { setAna(!S.ana); e.currentTarget.blur(); } }, h('span'));
    document.body.append(ab); anaLabel();
    document.body.append(h('a', { class: 'hubbtn', href: '../', title: 'Back to the main screen' }, '⌂ Hub'));
    cfg.levels.forEach(l => { l.chals = l.chals.map((c, i) => [c, i]).sort((a, b) => ((a[0].t === 'lab' ? 0 : 1) - (b[0].t === 'lab' ? 0 : 1)) || ((a[0].boss ? 1 : 0) - (b[0].boss ? 1 : 0)) || ((a[0].tier || 1) - (b[0].tier || 1)) || a[1] - b[1]).map(x => x[0]); });
    home();
    if (TEST) window.__kit = {
      cfg, start: n => start(cfg.levels.find(l => l.n === n)), home,
      run: () => run, auto: () => run && run.b && run.b.auto(), autoWrong: () => run && run.b && run.b.autoWrong(),
      next: () => { const b = $('#nextbtn'); if (b) b.click(); else { const g = $('#go'); if (g) g.click(); } let n = 0; while ($('#body .lesson') && $('#go') && n++ < 5) $('#go').click(); },
      key: (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })),
      mode: () => run && run.mode,
      state: () => S,
    };
  }

  return { init, h, rnd, pick, shuffle, fmt, $, TEST, isAna: () => !!(S && S.ana) };
})();
