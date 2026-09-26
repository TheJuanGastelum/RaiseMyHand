import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, orderBy, onSnapshot, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

(function () {
  "use strict";

  // ---------- Firebase wiring ----------
  // A thin adapter so the app logic below can talk to Firestore with a
  // simple doc()/collection() shape instead of sprinkling Firestore's
  // modular functions through every screen.
  var firebaseApp = initializeApp(firebaseConfig);
  var auth = getAuth(firebaseApp);
  var firestore = getFirestore(firebaseApp);

  function wrapDoc(ref) {
    return {
      id: ref.id,
      get: function () {
        return getDoc(ref).then(function (snap) {
          return { exists: snap.exists(), data: function () { return snap.data(); }, id: snap.id };
        });
      },
      set: function (data) { return setDoc(ref, data); },
      update: function (data) { return updateDoc(ref, data); },
      delete: function () { return deleteDoc(ref); },
      onSnapshot: function (cb, errCb) {
        return onSnapshot(ref, function (snap) {
          cb({ exists: snap.exists(), data: function () { return snap.data(); }, id: snap.id });
        }, errCb);
      }
    };
  }

  function wrapCollection(ref) {
    var q = ref;
    function toSnap(snap) {
      return {
        docs: snap.docs.map(function (d) { return { id: d.id, data: function () { return d.data(); } }; }),
        size: snap.size,
        empty: snap.empty
      };
    }
    var api = {
      doc: function (id) { return wrapDoc(id ? doc(ref, id) : doc(ref)); },
      add: function (data) { return addDoc(ref, data).then(function (r) { return wrapDoc(r); }); },
      orderBy: function (field, dir) { q = query(q, orderBy(field, dir || "asc")); return api; },
      get: function () { return getDocs(q).then(toSnap); },
      onSnapshot: function (cb, errCb) {
        return onSnapshot(q, function (snap) { cb(toSnap(snap)); }, errCb);
      }
    };
    return api;
  }

  var db = {
    doc: function (path) { return wrapDoc(doc(firestore, path)); },
    collection: function (path) { return wrapCollection(collection(firestore, path)); }
  };

  function waitForAuth() {
    return new Promise(function (resolve, reject) {
      var unsub = onAuthStateChanged(auth, function (user) {
        if (user) { unsub(); resolve(user); }
      }, reject);
      signInAnonymously(auth).catch(reject);
    });
  }

  // ---------- App ----------
  var appEl = document.getElementById('app');
  var topbarMeta = document.getElementById('topbarMeta');
  var toastEl = document.getElementById('toast');

  var LS_TEACHER = 'rmh_teacher_v1';
  var LS_STUDENT = 'rmh_student_v1';
  var LS_THEME_HUE = 'rmh_theme_hue_v1';
  var LS_THEME_MODE = 'rmh_theme_mode_v1';
  var LS_THEME_LEGACY = 'rmh_theme_v1';
  var CODE_CHARS = '23456789ACDEFGHJKMNPQRSTUVWXYZ';
  // A teacher can keep reopening the same code all semester. To make that
  // pleasant instead of accumulating stale state:
  // - After a few hours idle, reopening a session wipes its queue/
  //   questions/announcement/discussion state so each class starts clean,
  //   while keeping the code + teacher key unchanged.
  // - After a long stretch nobody's touched it, a *new* session request
  //   that happens to land on that code reclaims it outright.
  // Queue entries and questions carry an expireAt that a Firestore TTL
  // policy uses to delete them automatically, so student names never
  // linger if a teacher forgets to clear or end a session.
  var DATA_TTL_MS = 24 * 60 * 60 * 1000;
  function expireTs() { return Timestamp.fromMillis(Date.now() + DATA_TTL_MS); }
  var SOFT_RESET_IDLE_MS = 4 * 60 * 60 * 1000; // 4 hours
  var HARD_EXPIRE_IDLE_MS = 75 * 24 * 60 * 60 * 1000; // ~75 days

  // ---------- Theme ----------
  // Each hue is a main-screen color paired with a text color that's
  // guaranteed readable against it (set in CSS, keyed off
  // data-theme="<hue>-<mode>"). Light/dark is a second, independent
  // choice layered on top of every hue -- no automatic OS dark-mode
  // switching, so nobody ends up stuck with a low-contrast combo their
  // system picked for them.
  var THEME_HUES = [
    { id: 'ocean', label: 'Ocean', swatchLight: '#1F4E8C', swatchDark: '#3E7CBF' },
    { id: 'slate', label: 'Slate', swatchLight: '#33383D', swatchDark: '#5A6169' },
    { id: 'forest', label: 'Forest', swatchLight: '#1F6B3B', swatchDark: '#3F9260' },
    { id: 'sunset', label: 'Sunset', swatchLight: '#B44A26', swatchDark: '#D9713F' },
    { id: 'pink', label: 'Pink', swatchLight: '#C43D74', swatchDark: '#E85F97' }
  ];
  // Old single-theme ids (pre hue/mode split) map onto a hue + mode below.
  var LEGACY_THEME_MAP = {
    ocean: { hue: 'ocean', mode: 'light' },
    slate: { hue: 'slate', mode: 'light' },
    forest: { hue: 'forest', mode: 'light' },
    sunset: { hue: 'sunset', mode: 'light' },
    midnight: { hue: 'ocean', mode: 'dark' }
  };

  function currentHue() {
    var id = loadLS(LS_THEME_HUE);
    var valid = THEME_HUES.some(function (t) { return t.id === id; });
    return valid ? id : 'ocean';
  }

  function currentMode() {
    var m = loadLS(LS_THEME_MODE);
    return m === 'dark' ? 'dark' : 'light';
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentHue() + '-' + currentMode());
  }

  // One-time migration: if someone has an old rmh_theme_v1 value saved and
  // no new-style hue/mode pair yet, carry it forward instead of quietly
  // resetting them to the default.
  (function migrateLegacyTheme() {
    if (loadLS(LS_THEME_HUE)) return;
    var legacy = loadLS(LS_THEME_LEGACY);
    var mapped = legacy && LEGACY_THEME_MAP[legacy];
    if (mapped) {
      saveLS(LS_THEME_HUE, mapped.hue);
      saveLS(LS_THEME_MODE, mapped.mode);
    }
  })();

  // loadLS/saveLS are declared further below as function declarations,
  // which are hoisted -- safe to call here even though this line runs
  // before their textual definition, so the theme applies before the
  // very first paint of any screen.
  applyTheme();

  var activeUnsubs = [];
  var tickHandle = null;

  function clearSubs() {
    activeUnsubs.forEach(function (u) { try { u(); } catch (e) {} });
    activeUnsubs = [];
    if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDuration(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    var ss = String(sec).padStart(2, '0');
    return h > 0 ? (h + ':' + mm + ':' + ss) : (mm + ':' + ss);
  }

  function randomCode(len) {
    len = len || 4;
    var out = '';
    var arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (var i = 0; i < len; i++) out += CODE_CHARS[arr[i] % CODE_CHARS.length];
    return out;
  }

  function saveLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function loadLS(key) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function clearLS(key) { try { localStorage.removeItem(key); } catch (e) {} }

  function sessionDoc(code) { return db.doc('sessions/' + code); }
  function queueCol(code) { return db.collection('sessions/' + code + '/queue'); }
  function questionsCol(code) { return db.collection('sessions/' + code + '/questions'); }

  var icons = {
    teacher: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-icon)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/></svg>',
    student: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-icon)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z"/><path d="M7 10.6v4.6c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z"/><path d="M7 10.6v4.6c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2C11 5.1 11.5 5 12 5c6 0 9.5 7 9.5 7-.6 1.2-1.6 2.7-3 4.1M6.3 6.3C4 7.9 2.5 12 2.5 12s3.5 7 9.5 7c1.2 0 2.3-.3 3.3-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    bellOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M8.2 4.6A6 6 0 0 1 18 9c0 3 .6 4.9 1.3 6M6 9c0 6-2.5 7.5-2.5 7.5H15"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 21.5c-.66 0-1.3-.26-1.77-.73l-4.3-4.3a1.6 1.6 0 0 1 2.26-2.26l1.81 1.81V9.2a1.5 1.5 0 0 1 3 0v3.8h.5V6.4a1.5 1.5 0 0 1 3 0v6.6h.5V7.6a1.5 1.5 0 0 1 3 0v5.4h.5V9.9a1.5 1.5 0 0 1 3 0v6.35c0 3.07-2.48 5.55-5.55 5.55H9.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.85 1.85M17.55 17.55l1.85 1.85M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.85-1.85M17.55 6.45l1.85-1.85"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a.6.6 0 0 0-.75-.8A9.4 9.4 0 1 0 21.2 15.45a.6.6 0 0 0-.8-.75Z"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5v3a1.5 1.5 0 0 0 1.5 1.5H6l1.2 5a1 1 0 0 0 1 .8h1a1 1 0 0 0 .97-1.24L9 15h1l9 4V6l-9 4H4.5A1.5 1.5 0 0 0 3 10.5Z"/><path d="M19 9.5v6"/></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M11 21h2M12 3a6 6 0 0 1 6 6c0 2.5-1.3 4.7-3.5 5.7V16a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-1.3C7.3 13.7 6 11.5 6 9a6 6 0 0 1 6-6Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h11A1.5 1.5 0 0 1 16 5.5v6A1.5 1.5 0 0 1 14.5 13H8l-4 3.5V13H3.5A1.5 1.5 0 0 1 2 11.5v-6Z"/><path d="M16 7.5h2.5A1.5 1.5 0 0 1 20 9v5a1.5 1.5 0 0 1-1.5 1.5H17l-3 2.5V15h-.5"/></svg>',
    userMute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.5"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><path d="M17 10l4 4M21 10l-4 4"/></svg>',
    userUnmute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.5"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><path d="M17 12l2 2 4-4"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7.5" height="16" rx="1.5"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.5"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v0M14 20h3M20 17v4"/></svg>'
  };

  var KIND_LABELS = { question: 'Quick question', stuck: 'Stuck', check: 'Check my work' };

  function questionWho(q) {
    return (q.authorName || q.authorSeat) ? questionWho(q) : 'Anonymous';
  }

  function identityLabel(name, seat) {
    var n = (name || '').trim();
    var s = (seat || '').trim();
    if (n && s) return n + ' · Seat ' + s;
    if (n) return n;
    if (s) return 'Seat ' + s;
    return 'Student';
  }

  function renderThemeSwitch() {
    var hue = currentHue();
    var mode = currentMode();

    function swatchFor(t) { return mode === 'dark' ? t.swatchDark : t.swatchLight; }

    var dots = THEME_HUES.map(function (t) {
      return '<button data-theme-id="' + t.id + '" class="' + (t.id === hue ? 'active' : '') + '" title="' + esc(t.label) + '" aria-label="' + esc(t.label) + '"></button>';
    }).join('');
    var wrap = document.createElement('div');
    wrap.className = 'theme-switch';
    wrap.innerHTML =
      '<button class="mode-btn" id="modeBtn" title="Light / dark" aria-label="Toggle light or dark"></button>' +
      '<button class="theme-btn" id="themeBtn" title="Color theme" aria-label="Color theme"></button>' +
      '<div class="theme-pop" id="themePop">' + dots + '</div>';

    function paintDots() {
      wrap.querySelectorAll('.theme-pop button').forEach(function (b) {
        var id = b.getAttribute('data-theme-id');
        var t = THEME_HUES.filter(function (x) { return x.id === id; })[0];
        if (t) b.style.background = swatchFor(t);
      });
    }

    function paintModeBtn() {
      var modeBtn = wrap.querySelector('#modeBtn');
      modeBtn.innerHTML = mode === 'dark' ? icons.moon : icons.sun;
    }

    paintDots();
    paintModeBtn();

    wrap.querySelector('#themeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.querySelector('#themePop').classList.toggle('open');
    });
    wrap.querySelector('#modeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      mode = mode === 'dark' ? 'light' : 'dark';
      saveLS(LS_THEME_MODE, mode);
      applyTheme();
      paintDots();
      paintModeBtn();
    });
    wrap.querySelectorAll('.theme-pop button').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        hue = b.getAttribute('data-theme-id');
        saveLS(LS_THEME_HUE, hue);
        applyTheme();
        wrap.querySelectorAll('.theme-pop button').forEach(function (btn) {
          btn.classList.toggle('active', btn.getAttribute('data-theme-id') === hue);
        });
        wrap.querySelector('#themePop').classList.remove('open');
      });
    });
    document.addEventListener('click', function () {
      var pop = wrap.querySelector('#themePop');
      if (pop) pop.classList.remove('open');
    });
    return wrap;
  }

  function renderFeedbackButton(role) {
    var wrap = document.createElement('div');
    wrap.className = 'feedback-switch';
    wrap.innerHTML =
      '<button class="mode-btn" id="feedbackBtn" title="Suggest something" aria-label="Suggest something">' + icons.feedback + '</button>' +
      '<div class="feedback-pop" id="feedbackPop">' +
        '<div class="feedback-pop-head">Suggest something</div>' +
        '<div class="feedback-pop-sub">Bugs, ideas, anything -- goes straight to the person running this app.</div>' +
        '<textarea id="feedbackText" maxlength="500" placeholder="What would make this better?"></textarea>' +
        '<button class="btn btn-primary" id="feedbackSendBtn">Send</button>' +
        '<div class="feedback-thanks" id="feedbackThanks" style="display:none;">Thanks &mdash; sent.</div>' +
      '</div>';

    var pop = wrap.querySelector('#feedbackPop');
    var textEl = wrap.querySelector('#feedbackText');
    var sendBtn = wrap.querySelector('#feedbackSendBtn');
    var thanksEl = wrap.querySelector('#feedbackThanks');

    wrap.querySelector('#feedbackBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      pop.classList.toggle('open');
      if (pop.classList.contains('open')) textEl.focus();
    });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });

    sendBtn.addEventListener('click', function () {
      var text = textEl.value.trim();
      if (!text) { textEl.focus(); return; }
      sendBtn.disabled = true;
      db.collection('feedback').add({
        text: text,
        role: role || null,
        createdAt: Date.now()
      }).then(function () {
        textEl.value = '';
        sendBtn.disabled = false;
        thanksEl.style.display = 'block';
        setTimeout(function () {
          thanksEl.style.display = 'none';
          pop.classList.remove('open');
        }, 1400);
      }).catch(function () {
        sendBtn.disabled = false;
        showToast('Could not send that. Try again.');
      });
    });

    document.addEventListener('click', function () { pop.classList.remove('open'); });
    return wrap;
  }

  function setTopbar(role) {
    topbarMeta.innerHTML = '';
    if (role) {
      var label = role === 'teacher' ? 'Teacher' : 'Student';
      var span = document.createElement('span');
      span.className = 'role-pill';
      span.textContent = label;
      var exitBtn = document.createElement('button');
      exitBtn.className = 'exit-link';
      exitBtn.id = 'exitBtn';
      exitBtn.textContent = 'Switch role';
      exitBtn.addEventListener('click', function () {
        clearSubs();
        renderLanding();
      });
      topbarMeta.appendChild(span);
      topbarMeta.appendChild(exitBtn);
    }
    topbarMeta.appendChild(renderThemeSwitch());
    topbarMeta.appendChild(renderFeedbackButton(role));
  }

  function mount(html, wide) {
    clearSubs();
    appEl.className = 'app' + (wide ? ' top-align' : '');
    var wrap = document.createElement('div');
    wrap.className = 'screen' + (wide ? ' wide' : '');
    wrap.innerHTML = html;
    appEl.innerHTML = '';
    appEl.appendChild(wrap);
    return wrap;
  }

  // ---------- Landing ----------
  var LEADER_TERMS = ['the teacher', 'a TA', 'an organizer', 'the host', 'a facilitator', 'an instructor'];
  var JOINER_TERMS = ['a student', 'a participant', 'an attendee', 'a learner', 'a team member'];

  function renderLanding() {
    setTopbar(null);
    var root = mount(
      '<div class="lede">' +
        '<h1>Raise a hand from anywhere in the room.</h1>' +
        '<p>Anyone can tap in from their own device and line up in order. One live queue instead of a sea of hands.</p>' +
      '</div>' +
      '<div class="role-grid">' +
        '<button class="role-card teacher" id="pickTeacher">' +
          '<div class="icon-badge">' + icons.teacher + '</div>' +
          '<h2>I&rsquo;m <span class="role-cycle" id="leaderCycle">the teacher</span></h2>' +
          '<p>Start a session, share the code, and watch the queue update in real time.</p>' +
        '</button>' +
        '<button class="role-card student" id="pickStudent">' +
          '<div class="icon-badge">' + icons.student + '</div>' +
          '<h2>I&rsquo;m <span class="role-cycle" id="joinerCycle">a student</span></h2>' +
          '<p>Enter your code, then press space or tap the button to raise your hand.</p>' +
        '</button>' +
      '</div>'
    );
    root.querySelector('#pickTeacher').addEventListener('click', function () { renderTeacherStart(); });
    root.querySelector('#pickStudent').addEventListener('click', function () { renderStudentJoin(); });

    // Slowly cycle through role synonyms to signal the app works beyond classrooms
    var leaderEl = root.querySelector('#leaderCycle');
    var joinerEl = root.querySelector('#joinerCycle');
    var li = 0; var ji = 0;
    var cycleTimer = setInterval(function () {
      if (!leaderEl || !leaderEl.isConnected) { clearInterval(cycleTimer); return; }
      li = (li + 1) % LEADER_TERMS.length;
      ji = (ji + 1) % JOINER_TERMS.length;
      leaderEl.classList.add('role-cycle-fade');
      joinerEl.classList.add('role-cycle-fade');
      setTimeout(function () {
        if (leaderEl.isConnected) leaderEl.textContent = LEADER_TERMS[li];
        if (joinerEl.isConnected) joinerEl.textContent = JOINER_TERMS[ji];
        leaderEl.classList.remove('role-cycle-fade');
        joinerEl.classList.remove('role-cycle-fade');
      }, 300);
    }, 3200);
    activeUnsubs.push(function () { clearInterval(cycleTimer); });
  }

  // ---------- Teacher: start / resume ----------
  function renderTeacherStart() {
    setTopbar('teacher');
    var saved = loadLS(LS_TEACHER);

    var root = mount(
      '<div class="card">' +
        '<h2>Start a session</h2>' +
        '<div class="sub">Give your class a name so students recognize the right code, then share it out loud or on the board.</div>' +
        '<div class="error-box" id="err"></div>' +
        '<div class="field">' +
          '<label for="className">Class name <span style="text-transform:none;font-weight:500;">(optional)</span></label>' +
          '<input type="text" id="className" maxlength="40" placeholder="e.g. Period 3 &ndash; ECE 175">' +
        '</div>' +
        '<button class="btn btn-primary" id="startBtn">Start session</button>' +
        '<div class="link-row">Reopening a session from another device? <button id="resumeToggle">Resume with a code</button></div>' +
        '<div id="resumeBox" style="display:none;margin-top:16px;border-top:1px solid var(--line);padding-top:16px;">' +
          '<div class="field" style="margin-bottom:10px;">' +
            '<label for="resumeCode">Reopen code</label>' +
            '<input type="text" id="resumeCode" class="code-input" maxlength="6" placeholder="CODE+KEY">' +
            '<div class="hint">The 4-character class code, plus the 2-character teacher key you saw when you started the session.</div>' +
          '</div>' +
          '<button class="btn btn-ghost" id="resumeBtn">Resume session</button>' +
        '</div>' +
      '</div>'
    );

    function setErr(msg) {
      var e = root.querySelector('#err');
      if (!msg) { e.classList.remove('show'); e.textContent = ''; return; }
      e.textContent = msg; e.classList.add('show');
    }

    var resumeParam = readResumeParam();
    if (resumeParam) {
      root.querySelector('#resumeBox').style.display = 'block';
      root.querySelector('#resumeCode').value = resumeParam;
    }

    root.querySelector('#startBtn').addEventListener('click', function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Starting…';
      var className = root.querySelector('#className').value.trim();
      startNewSession(className).then(function (result) {
        saveLS(LS_TEACHER, { code: result.code, className: className, teacherKey: result.teacherKey });
        renderTeacherBoard(result.code, className, result.teacherKey);
      }).catch(function (err) {
        setErr(err && err.message ? err.message : 'Could not start a session. Please try again.');
        btn.disabled = false; btn.textContent = 'Start session';
      });
    });

    root.querySelector('#resumeToggle').addEventListener('click', function () {
      var box = root.querySelector('#resumeBox');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    root.querySelector('#resumeBtn').addEventListener('click', function () {
      var btn = this;
      var raw = root.querySelector('#resumeCode').value.trim().toUpperCase().replace(/\s+/g, '');
      if (raw.length !== 6) { setErr('Enter your full 6-character reopen code (4-character class code + 2-character teacher key).'); return; }
      var code = raw.slice(0, 4);
      var key = raw.slice(4, 6);
      btn.disabled = true; btn.textContent = 'Checking…';
      sessionDoc(code).get().then(function (snap) {
        if (!snap.exists) {
          setErr('No active session with that code.');
          btn.disabled = false; btn.textContent = 'Resume session';
          return;
        }
        var data = snap.data() || {};
        if (!data.teacherKey || data.teacherKey !== key) {
          setErr('That reopen code doesn’t match this session.');
          btn.disabled = false; btn.textContent = 'Resume session';
          return;
        }
        saveLS(LS_TEACHER, { code: code, className: data.className || '', teacherKey: key });
        maybeSoftReset(code, data).catch(function () {}).then(function () {
          renderTeacherBoard(code, data.className || '', key);
        });
      }).catch(function () {
        setErr('Something went wrong checking that code.');
        btn.disabled = false; btn.textContent = 'Resume session';
      });
    });

    // Try to resume a session already open on this device.
    if (saved && saved.code && saved.teacherKey) {
      sessionDoc(saved.code).get().then(function (snap) {
        if (snap.exists) {
          var data = snap.data() || {};
          maybeSoftReset(saved.code, data).catch(function () {}).then(function () {
            renderTeacherBoard(saved.code, data.className || saved.className || '', saved.teacherKey);
          });
        } else {
          clearLS(LS_TEACHER);
        }
      }).catch(function () {});
    } else if (saved && saved.code) {
      // Saved from before the teacher-key feature existed -- there's no
      // key to trust, so don't auto-resume into someone else's board.
      clearLS(LS_TEACHER);
    }
  }

  function startNewSession(className) {
    // The 4-character code is the public, spoken-aloud join code -- anyone
    // in the room is meant to have it. The 2-character teacher key is
    // private: it never gets shown to students, and it's what lets the
    // teacher (and only the teacher) reopen this same board from another
    // device or tab later, instead of a student who overheard the code
    // being able to claim the teacher board for themselves.
    function attempt(triesLeft) {
      var code = randomCode(4);
      var teacherKey = randomCode(2);
      return sessionDoc(code).get().then(function (snap) {
        if (snap.exists) {
          var data = snap.data() || {};
          var idleSince = Date.now() - (data.lastActiveAt || data.createdAt || 0);
          if (idleSince > HARD_EXPIRE_IDLE_MS) {
            // Nobody's come back to this code in months -- reclaim it
            // for this new session instead of spending a retry.
            if (triesLeft <= 0) throw new Error('Could not generate a free code. Try again.');
            return wipeSession(code).then(function () { return attempt(triesLeft - 1); });
          }
          if (triesLeft <= 0) throw new Error('Could not generate a free code. Try again.');
          return attempt(triesLeft - 1);
        }
        return sessionDoc(code).set({ code: code, className: className || '', createdAt: Date.now(), lastActiveAt: Date.now(), teacherKey: teacherKey }).then(function () {
          return { code: code, teacherKey: teacherKey };
        });
      });
    }
    return attempt(5);
  }

  // Deletes a session doc and its queue/questions subcollections entirely
  // -- used both for an explicit "End session" and for reclaiming a code
  // nobody's used in HARD_EXPIRE_IDLE_MS.
  function wipeSession(code) {
    return Promise.all([
      queueCol(code).get().then(function (snap) {
        return Promise.all(snap.docs.map(function (d) { return queueCol(code).doc(d.id).delete(); }));
      }),
      questionsCol(code).get().then(function (snap) {
        return Promise.all(snap.docs.map(function (d) { return questionsCol(code).doc(d.id).delete(); }));
      })
    ]).then(function () {
      return sessionDoc(code).delete();
    });
  }

  // Clears a session's live, per-class-period state (queue, questions,
  // announcement, discussion controls) but keeps the session doc, code,
  // and teacher key intact -- so a teacher reusing one code all semester
  // gets a clean board each time instead of last class's leftovers.
  function softResetSession(code) {
    var now = Date.now();
    // clearedAt first so students with a tab still open see "Queue cleared"
    // rather than a false "You've been called!".
    return sessionDoc(code).update({ clearedAt: now }).then(function () {
      return Promise.all([
        deleteAllDocs(queueCol, code),
        deleteAllDocs(questionsCol, code),
        sessionDoc(code).update({ blocked: {} }),
        sessionDoc(code).update({ announcement: null, lastActiveAt: now }),
        sessionDoc(code).update({ discussionMode: false, questionsVisible: true, mutedUsers: {}, lastActiveAt: now })
      ]);
    });
  }

  function deleteAllDocs(col, code) {
    return col(code).get().then(function (snap) {
      return Promise.all(snap.docs.map(function (d) { return col(code).doc(d.id).delete(); }));
    });
  }

  // clearedAt is written first so students can tell "teacher cleared the
  // queue" apart from "teacher marked me helped" when their ticket vanishes.
  function clearHands(code) {
    return sessionDoc(code).update({ clearedAt: Date.now() }).then(function () {
      return deleteAllDocs(queueCol, code);
    });
  }

  // Client-side stand-in for a Firestore TTL policy: removes queue entries
  // and questions whose expireAt has passed. Runs when a teacher opens a
  // board or a student joins, best effort.
  function sweepExpired(code) {
    var now = Date.now();
    function sweep(col) {
      return col(code).get().then(function (snap) {
        return Promise.all(snap.docs.filter(function (d) {
          var dd = d.data() || {};
          if (dd.status === 'helped') return true;
          var e = dd.expireAt;
          return e && typeof e.toMillis === 'function' && e.toMillis() < now;
        }).map(function (d) { return col(code).doc(d.id).delete(); }));
      });
    }
    return Promise.all([sweep(queueCol), sweep(questionsCol)]).catch(function () {});
  }

  function clearQuestions(code) {
    return deleteAllDocs(questionsCol, code);
  }

  // Called whenever a teacher reopens an existing session. Resets it first
  // if it's been idle past SOFT_RESET_IDLE_MS; otherwise a no-op.
  function maybeSoftReset(code, data) {
    var idleSince = Date.now() - (data.lastActiveAt || data.createdAt || 0);
    if (idleSince < SOFT_RESET_IDLE_MS) return Promise.resolve();
    return softResetSession(code);
  }

  // ---------- Teacher: board ----------
  function renderTeacherBoard(code, className, teacherKey) {
    setTopbar('teacher');
    sweepExpired(code);
    var root = mount(
      '<div class="board-header">' +
        '<div class="board-title">' +
          '<h2>' + esc(className || 'Untitled session') + '</h2>' +
          '<div class="sub" id="waitCount">Waiting for students&hellip;</div>' +
          '<div class="mode-wrap"><button class="mode-pill" id="discussBtn" aria-haspopup="menu" aria-expanded="false">Mode: Standard &#9662;</button></div>' +
          (teacherKey ? '<button class="reopen-toggle" id="reopenToggle">Show my reopen code</button>' : '') +
          (teacherKey ? '<button class="reopen-toggle" id="coHostBtn" title="Copies a link that opens the resume form for a co-host or TA">Copy co-host link</button>' : '') +
        '</div>' +
        '<div class="code-chip">' +
          '<div><div class="code-label">Class code</div><div class="code-value">' + esc(code) + '</div></div>' +
          '<button class="icon-btn" id="qrBtn" title="Show QR code to join" aria-label="Show QR code to join">' + icons.qr + '</button>' +
          '<button class="icon-btn" id="copyBtn" title="Copy code" aria-label="Copy code">' + icons.copy + '</button>' +
          '<button class="icon-btn" id="settingsBtn" title="Board settings" aria-label="Board settings" aria-haspopup="menu" aria-expanded="false">' + icons.gear + '</button>' +
          '<div class="set-pop" id="settingsPop" hidden>' +
            '<div class="set-row"><button class="icon-btn" id="soundBtn" title="New-hand chime" aria-label="Toggle new-hand chime"></button><span>New-hand chime</span></div>' +
            '<div class="set-row"><button class="icon-btn" id="layoutBtn" title="Switch to side-by-side layout" aria-label="Toggle layout">' + icons.layout + '</button><span>Side-by-side layout</span></div>' +
            '<div class="set-row"><button class="icon-btn" id="notesToggleBtn" title="Toggle note visibility" aria-label="Toggle note visibility"></button><span>Show student notes</span></div>' +
            '<div class="set-row"><button class="icon-btn" id="statsBtn" title="Session stats" aria-label="Session stats">' + icons.stats + '</button><span>Session stats</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="board-panels" id="boardPanels">' +
        '<div class="board-panels-right" id="boardPanelsRight">' +
          '<div class="discuss-card" id="discussCard" style="display:none;">' +
            '<div class="discuss-head">' +
              '<h3>Student Questions</h3>' +
              '<div class="discuss-actions">' +
                '<span class="discuss-count" id="discussCount">0 questions</span>' +
                '<button class="btn btn-danger-ghost" id="clearQsBtn">Clear questions</button>' +
                '<button class="icon-btn" id="qVisBtn" title="Hide questions (projector mode)" aria-label="Toggle question visibility"></button>' +
              '</div>' +
            '</div>' +
            '<div id="discussHiddenNotice" class="discuss-hidden-notice" style="display:none;">Questions hidden for projector &mdash; <button id="showQuestionsBtn">show them</button></div>' +
            '<div id="activeQList"></div>' +
            '<div id="skippedSection" style="display:none;">' +
              '<button class="skipped-toggle-btn" id="skippedToggleBtn"></button>' +
              '<div id="skippedQList" style="display:none;"></div>' +
            '</div>' +
          '</div>' +
          '<div class="announce-card" id="announceCard">' +
            '<div class="announce-card-head"><h3>Announcement</h3><span class="announce-status" id="announceStatus">None posted</span></div>' +
            '<div id="announceCurrent" style="display:none;"></div>' +
            '<div class="announce-form">' +
              '<textarea id="annText" maxlength="200" placeholder="e.g. Quiz starts in 5 minutes"></textarea>' +
              '<div class="announce-controls">' +
                '<select id="annMode">' +
                  '<option value="dismissable">Students can dismiss it</option>' +
                  '<option value="timed">Auto-clear after a few minutes</option>' +
                  '<option value="persistent">Stays until I clear it</option>' +
                '</select>' +
                '<input type="text" inputmode="numeric" id="annMinutes" class="mono" value="5" style="display:none;width:64px;">' +
                '<button class="btn btn-primary" id="annPostBtn" style="width:auto;">Post</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="queue-scroll"><div class="queue-list" id="queueList"></div></div>' +
      '</div>' +
      '<div class="board-footer"><button class="btn btn-ghost" id="blockedBtn" style="display:none;">Blocked (0)</button><button class="btn btn-danger-ghost" id="clearHandsBtn">Clear hands</button><button class="btn btn-danger-ghost" id="endBtn">End session</button></div>',
      true
    );

    if (teacherKey) {
      var reopenToggle = root.querySelector('#reopenToggle');
      var reopenShown = false;
      reopenToggle.addEventListener('click', function () {
        reopenShown = !reopenShown;
        reopenToggle.innerHTML = reopenShown
          ? 'Hide reopen code &middot; <span class="reopen-value">' + esc(code + teacherKey) + '</span>'
          : 'Show my reopen code';
      });
    }

    if (teacherKey) {
      root.querySelector('#coHostBtn').addEventListener('click', function () {
        var link = location.origin + location.pathname + '?resume=' + encodeURIComponent(code + teacherKey);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).then(function () { showToast('Co-host link copied. Anyone with it can run this board.'); }).catch(function () { showToast(link); });
        } else {
          showToast(link);
        }
      });
    }

    root.querySelector('#copyBtn').addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { showToast('Code copied'); }).catch(function () { showToast('Code: ' + code); });
      } else {
        showToast('Code: ' + code);
      }
    });

    var settingsBtn = root.querySelector('#settingsBtn');
    var settingsPop = root.querySelector('#settingsPop');
    function closeSettings() {
      settingsPop.hidden = true;
      settingsBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', settingsOutside, true);
      document.removeEventListener('keydown', settingsKey);
    }
    function settingsOutside(e) { if (!settingsPop.contains(e.target) && !settingsBtn.contains(e.target)) closeSettings(); }
    function settingsKey(e) { if (e.key === 'Escape') closeSettings(); }
    activeUnsubs.push(closeSettings);
    settingsBtn.addEventListener('click', function () {
      if (!settingsPop.hidden) { closeSettings(); return; }
      settingsPop.hidden = false;
      settingsBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', settingsOutside, true);
      document.addEventListener('keydown', settingsKey);
    });

    function joinUrl() {
      return location.origin + location.pathname + '?code=' + encodeURIComponent(code);
    }
    var qrOverlay = null;
    function closeQr() {
      if (qrOverlay) { qrOverlay.remove(); qrOverlay = null; }
      document.removeEventListener('keydown', qrKey);
    }
    function qrKey(e) { if (e.key === 'Escape') closeQr(); }
    activeUnsubs.push(closeQr);
    root.querySelector('#qrBtn').addEventListener('click', function () {
      if (typeof window.qrcode !== 'function') { showToast('QR code unavailable right now. Share the code instead.'); return; }
      var svg;
      try {
        var qr = window.qrcode(0, 'M');
        qr.addData(joinUrl());
        qr.make();
        svg = qr.createSvgTag(4, 2);
      } catch (e) { showToast('Could not build the QR code.'); return; }
      closeQr();
      qrOverlay = document.createElement('div');
      qrOverlay.className = 'qr-overlay';
      qrOverlay.innerHTML =
        '<div class="qr-card" role="dialog" aria-label="Join by QR code">' +
          '<div class="qr-img">' + svg + '</div>' +
          '<div class="qr-code">' + esc(code) + '</div>' +
          '<div class="qr-hint">Scan to join &middot; ' + esc(joinUrl()) + '</div>' +
          '<button class="btn btn-ghost" id="qrClose">Close</button>' +
        '</div>';
      document.body.appendChild(qrOverlay);
      qrOverlay.addEventListener('click', function (e) { if (e.target === qrOverlay) closeQr(); });
      qrOverlay.querySelector('#qrClose').addEventListener('click', closeQr);
      document.addEventListener('keydown', qrKey);
    });

    function confirmTap(btn, label, action) {
      btn.addEventListener('click', function () {
        if (btn.dataset.confirm !== '1') {
          btn.dataset.confirm = '1';
          btn.textContent = 'Tap again to confirm';
          setTimeout(function () { btn.dataset.confirm = ''; btn.textContent = label; }, 3000);
          return;
        }
        btn.dataset.confirm = '';
        btn.disabled = true; btn.textContent = 'Clearing…';
        action().then(function () {
          showToast('Cleared');
        }).catch(function () {
          showToast('Could not clear. Try again.');
        }).then(function () {
          btn.disabled = false; btn.textContent = label;
        });
      });
    }
    confirmTap(root.querySelector('#clearHandsBtn'), 'Clear hands', function () { return clearHands(code); });
    confirmTap(root.querySelector('#clearQsBtn'), 'Clear questions', function () { return clearQuestions(code); });

    root.querySelector('#endBtn').addEventListener('click', function () {
      var btn = this;
      if (btn.dataset.confirm !== '1') {
        btn.dataset.confirm = '1';
        btn.textContent = 'Tap again to confirm';
        setTimeout(function () { btn.dataset.confirm = ''; btn.textContent = 'End session'; }, 3000);
        return;
      }
      btn.disabled = true; btn.textContent = 'Ending…';
      endSession(code).then(function () {
        clearLS(LS_TEACHER);
        renderTeacherStart();
      }).catch(function () {
        showToast('Could not end the session. Try again.');
        btn.disabled = false; btn.textContent = 'End session';
      });
    });

    // ---- Announcement ----
    var announceCardEl = root.querySelector('#announceCard');
    var announceCurrentEl = root.querySelector('#announceCurrent');
    var announceStatusEl = root.querySelector('#announceStatus');
    var annTextEl = root.querySelector('#annText');
    var annModeEl = root.querySelector('#annMode');
    var annMinutesEl = root.querySelector('#annMinutes');
    var annPostBtn = root.querySelector('#annPostBtn');
    var lastAnn = null;

    annModeEl.addEventListener('change', function () {
      annMinutesEl.style.display = annModeEl.value === 'timed' ? 'inline-block' : 'none';
    });

    function renderAnnounceState(ann) {
      var isLive = ann && ann.text && !(ann.mode === 'timed' && ann.expiresAt && Date.now() >= ann.expiresAt);
      announceCardEl.classList.toggle('is-live', !!isLive);
      announceStatusEl.classList.toggle('is-live', !!isLive);
      if (isLive) {
        announceStatusEl.textContent = 'Live on student screens';
        var modeLabel = ann.mode === 'timed'
          ? ('auto-clears ' + new Date(ann.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
          : ann.mode === 'dismissable' ? 'students can dismiss it' : 'stays until you clear it';
        announceCurrentEl.style.display = 'block';
        announceCurrentEl.innerHTML =
          '<div class="announce-live"><div><p>' + esc(ann.text) + '</p><div class="meta">' + modeLabel + '</div></div>' +
          '<button id="annClearBtn">Clear</button></div>';
        announceCurrentEl.querySelector('#annClearBtn').addEventListener('click', function () {
          sessionDoc(code).update({ announcement: null }).catch(function () {
            showToast('Could not clear the announcement.');
          });
        });
      } else {
        announceStatusEl.textContent = 'None posted';
        announceCurrentEl.style.display = 'none';
        announceCurrentEl.innerHTML = '';
        if (ann && ann.mode === 'timed' && ann.expiresAt && Date.now() >= ann.expiresAt) {
          // Opportunistically clean up an expired announcement.
          sessionDoc(code).update({ announcement: null }).catch(function () {});
        }
      }
    }

    annPostBtn.addEventListener('click', function () {
      var text = annTextEl.value.trim();
      if (!text) { showToast('Write something to post first.'); return; }
      var mode = annModeEl.value;
      var ann = { text: text, mode: mode, id: Date.now(), postedAt: Date.now(), expiresAt: null };
      if (mode === 'timed') {
        var mins = parseInt(annMinutesEl.value, 10);
        if (!mins || mins <= 0) mins = 5;
        ann.expiresAt = Date.now() + mins * 60000;
      }
      annPostBtn.disabled = true;
      sessionDoc(code).update({ announcement: ann }).then(function () {
        annTextEl.value = '';
        annPostBtn.disabled = false;
        showToast('Announcement posted');
      }).catch(function () {
        annPostBtn.disabled = false;
        showToast('Could not post the announcement.');
      });
    });

    // Session snapshot: handles announcements AND discussion mode state.
    // Discussion mode variables are declared later in this function but their
    // assignments happen on first snapshot fire, which is always async, so by
    // then the variables are in scope.
    var blockedUsers = {};
    var blockedBtn = root.querySelector('#blockedBtn');
    function updateBlockedBtn() {
      var n = Object.keys(blockedUsers).length;
      blockedBtn.style.display = n ? '' : 'none';
      blockedBtn.textContent = 'Blocked (' + n + ')';
    }
    var annUnsub = sessionDoc(code).onSnapshot(function (snap) {
      if (!snap.exists) return;
      var data = snap.data() || {};
      blockedUsers = data.blocked || {};
      updateBlockedBtn();
      lastAnn = data.announcement || null;
      renderAnnounceState(lastAnn);
      // Discussion fields — picked up once the discussion section is wired up.
      if (typeof discussionMode !== 'undefined') {
        discussionMode = !!data.discussionMode;
        questionsVisible = data.questionsVisible !== false;
        mutedUsers = data.mutedUsers || {};
        updateDiscussBtn();
        updateQVisBtn();
        discussCard.style.display = discussionMode ? 'block' : 'none';
        if (discussionMode) renderQuestionsPanel();
      }
    });
    activeUnsubs.push(annUnsub);
    var annTick = setInterval(function () { if (lastAnn) renderAnnounceState(lastAnn); }, 15000);
    activeUnsubs.push(function () { clearInterval(annTick); });

    var listEl = root.querySelector('#queueList');
    var waitCountEl = root.querySelector('#waitCount');

    // ---- Note visibility (projector-safe) ----
    // Per-device setting: with notes visible on, any shared note shows
    // inline (fine on the teacher's own screen). With it off -- handy when
    // this board is thrown up on a projector -- notes are replaced with a
    // "Show note" button, so nothing private is readable at a glance; a
    // click reveals just that one note.
    var notesMode = loadLS('rmh_notesmode_v1') || 'show';
    var revealedNotes = {};
    var lastQueueDocs = [];
    var notesToggleBtn = root.querySelector('#notesToggleBtn');

    function updateNotesToggleBtn() {
      notesToggleBtn.innerHTML = notesMode === 'hidden' ? icons.eyeOff : icons.eye;
      notesToggleBtn.title = notesMode === 'hidden'
        ? 'Notes hidden on this screen (projector-safe) — click to show them'
        : 'Notes visible — click to hide for a projector';
    }
    updateNotesToggleBtn();

    notesToggleBtn.addEventListener('click', function () {
      notesMode = notesMode === 'hidden' ? 'show' : 'hidden';
      saveLS('rmh_notesmode_v1', notesMode);
      revealedNotes = {};
      updateNotesToggleBtn();
      renderQueueRows(lastQueueDocs);
    });

    var flashIds = {};

    // "Mark helped" flags the ticket, lets the teacher undo for a few
    // seconds, then deletes it. The student sees the called screen right
    // away, and it flips back if the teacher undoes.
    var UNDO_MS = 5000;
    var pendingHelp = null;
    var undoBarEl = null;
    function hideUndoBar() { if (undoBarEl) { undoBarEl.remove(); undoBarEl = null; } }
    function commitHelp() {
      if (!pendingHelp) return;
      clearTimeout(pendingHelp.timer);
      var p = pendingHelp; pendingHelp = null;
      hideUndoBar();
      queueCol(code).doc(p.id).delete().catch(function () {});
    }
    activeUnsubs.push(commitHelp);
    function markHelped(id, label, btn) {
      commitHelp();
      var src = lastQueueDocs.filter(function (d) { return d.id === id; })[0];
      var srcData = (src && src.data()) || {};
      queueCol(code).doc(id).update({ status: 'helped' }).then(function () {
        var logEntry = { id: id, label: label || 'Student', kind: srcData.kind || '', joinedAt: srcData.joinedAt || Date.now(), helpedAt: Date.now() };
        sessLog.helped.push(logEntry); saveLog();
        pendingHelp = { id: id, entry: logEntry, timer: setTimeout(commitHelp, UNDO_MS) };
        undoBarEl = document.createElement('div');
        undoBarEl.className = 'undo-bar';
        undoBarEl.innerHTML = '<span>' + esc(label || 'Student') + ' marked helped</span><button id="undoHelpBtn">Undo</button>';
        document.body.appendChild(undoBarEl);
        undoBarEl.querySelector('#undoHelpBtn').addEventListener('click', function () {
          if (!pendingHelp || pendingHelp.id !== id) return;
          clearTimeout(pendingHelp.timer);
          var undone = pendingHelp.entry;
          sessLog.helped = sessLog.helped.filter(function (e) { return e !== undone; }); saveLog();
          pendingHelp = null;
          hideUndoBar();
          queueCol(code).doc(id).update({ status: 'waiting' }).catch(function () { showToast('Could not undo.'); });
        });
      }).catch(function () {
        if (btn) btn.disabled = false;
        showToast('Could not mark helped. Try again.');
      });
    }

    // Blocks live on this session's doc only, so they end with the session
    // (End session, code reclaim, or the idle soft reset).
    function blockStudent(uid, label) {
      var nb = Object.assign({}, blockedUsers);
      nb[uid] = label || 'Student';
      return sessionDoc(code).update({ blocked: nb }).then(function () {
        return Promise.all([
          queueCol(code).doc(uid).delete().catch(function () {}),
          questionsCol(code).get().then(function (snap) {
            return Promise.all(snap.docs.filter(function (d) { return (d.data() || {}).authorId === uid; })
              .map(function (d) { return questionsCol(code).doc(d.id).delete(); }));
          }).catch(function () {})
        ]);
      });
    }

    function bindBlockButtons(scope) {
      scope.querySelectorAll('.block-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.dataset.confirm !== '1') {
            b.dataset.confirm = '1';
            b.textContent = 'Confirm?';
            setTimeout(function () { if (b.isConnected) { b.dataset.confirm = ''; b.textContent = 'Block'; } }, 3000);
            return;
          }
          b.disabled = true;
          blockStudent(b.getAttribute('data-uid'), b.getAttribute('data-label')).then(function () {
            showToast('Blocked for this session');
          }).catch(function () {
            b.disabled = false; b.textContent = 'Block';
            showToast('Could not block. Try again.');
          });
        });
      });
    }

    var blockedOverlay = null;
    function closeBlocked() {
      if (blockedOverlay) { blockedOverlay.remove(); blockedOverlay = null; }
    }
    activeUnsubs.push(closeBlocked);
    blockedBtn.addEventListener('click', function () {
      closeBlocked();
      var ids = Object.keys(blockedUsers);
      blockedOverlay = document.createElement('div');
      blockedOverlay.className = 'qr-overlay';
      blockedOverlay.innerHTML =
        '<div class="qr-card" role="dialog" aria-label="Blocked students">' +
          '<h3 style="margin-bottom:6px;">Blocked this session</h3>' +
          '<div class="qr-hint">Blocks end with this session.</div>' +
          (ids.length ? ids.map(function (id) {
            return '<div class="q-item" style="text-align:left;"><div class="q-content"><div class="q-text">' + esc(String(blockedUsers[id])) + '</div></div>' +
              '<div class="q-actions"><button class="unblock-btn" data-uid="' + esc(id) + '">Unblock</button></div></div>';
          }).join('') : '<div class="discuss-empty">No one is blocked.</div>') +
          '<button class="btn btn-ghost" id="blockedClose" style="margin-top:8px;">Close</button>' +
        '</div>';
      document.body.appendChild(blockedOverlay);
      blockedOverlay.addEventListener('click', function (e) { if (e.target === blockedOverlay) closeBlocked(); });
      blockedOverlay.querySelector('#blockedClose').addEventListener('click', closeBlocked);
      blockedOverlay.querySelectorAll('.unblock-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var nb = Object.assign({}, blockedUsers);
          delete nb[b.getAttribute('data-uid')];
          b.disabled = true;
          sessionDoc(code).update({ blocked: nb }).then(function () {
            closeBlocked();
          }).catch(function () { b.disabled = false; showToast('Could not unblock.'); });
        });
      });
    });

    function renderQueueRows(docs) {
      lastQueueDocs = docs;
      if (!docs.length) {
        listEl.innerHTML = '<div class="empty-state">' + icons.empty + '<p>No one is waiting. The queue fills up here as hands go up.</p></div>';
        waitCountEl.textContent = 'Waiting for students…';
        return;
      }
      waitCountEl.textContent = docs.length + (docs.length === 1 ? ' student waiting' : ' students waiting');
      var html = '';
      docs.forEach(function (doc, i) {
        var d = doc.data() || {};
        var isNext = i === 0;
        var noteHtml = '';
        if (d.note) {
          if (notesMode === 'hidden' && !revealedNotes[doc.id]) {
            noteHtml = '<button class="note-peek" data-id="' + esc(doc.id) + '">Show note</button>';
          } else {
            noteHtml = '<div class="note">' + esc(d.note) +
              (notesMode === 'hidden' ? ' <button class="note-hide-again" data-id="' + esc(doc.id) + '">hide</button>' : '') +
              '</div>';
          }
        }
        html += '<div class="stub' + (isNext ? ' next' : '') + (flashIds[doc.id] ? ' flash-new' : '') + '" data-joined="' + (d.joinedAt || Date.now()) + '">' +
          '<div class="num">' + (i + 1) + '</div>' +
          '<div class="who"><div class="name" title="' + esc(identityLabel(d.name, d.seat)) + '">' + esc(identityLabel(d.name, d.seat)) + '</div>' +
            '<div class="wait mono">waiting <span class="wait-time">0:00</span>' +
              (KIND_LABELS[d.kind] ? ' <span class="kind-tag k-' + esc(d.kind) + '">' + esc(KIND_LABELS[d.kind]) + '</span>' : '') + '</div>' +
            noteHtml +
          '</div>' +
          (isNext ? '<span class="next-badge">Next</span>' : '') +
          '<button class="help-btn" data-id="' + esc(doc.id) + '" data-label="' + esc(identityLabel(d.name, d.seat)) + '">Mark helped</button>' +
          (doc.id.length > 20 ? '<button class="block-btn" data-uid="' + esc(doc.id) + '" data-label="' + esc(identityLabel(d.name, d.seat)) + '" title="Remove and block this student for the rest of this session">Block</button>' : '') +
        '</div>';
      });
      listEl.innerHTML = html;
      bindBlockButtons(listEl);
      listEl.querySelectorAll('.help-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true;
          markHelped(b.getAttribute('data-id'), b.getAttribute('data-label'), b);
        });
      });
      listEl.querySelectorAll('.note-peek').forEach(function (b) {
        b.addEventListener('click', function () {
          revealedNotes[b.getAttribute('data-id')] = true;
          renderQueueRows(lastQueueDocs);
        });
      });
      listEl.querySelectorAll('.note-hide-again').forEach(function (b) {
        b.addEventListener('click', function () {
          delete revealedNotes[b.getAttribute('data-id')];
          renderQueueRows(lastQueueDocs);
        });
      });
      tickWaitTimes(listEl);
    }

    // ---- New-hand alert: chime, flash, tab-title count ----
    var soundOn = loadLS('rmh_sound_v1') !== 'off';
    var soundBtn = root.querySelector('#soundBtn');
    function updateSoundBtn() {
      soundBtn.innerHTML = soundOn ? icons.bell : icons.bellOff;
      soundBtn.title = soundOn ? 'New-hand chime on — click to mute' : 'New-hand chime muted — click to turn on';
    }
    updateSoundBtn();
    var audioCtx = null;
    function ensureAudio() {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      } catch (e) { audioCtx = null; }
    }
    // Browsers only allow sound after a user gesture, so unlock on first click.
    document.addEventListener('click', ensureAudio, { once: true });
    soundBtn.addEventListener('click', function () {
      soundOn = !soundOn;
      saveLS('rmh_sound_v1', soundOn ? 'on' : 'off');
      updateSoundBtn();
      if (soundOn) { ensureAudio(); chime(); }
    });
    function chime() {
      if (!soundOn || !audioCtx) return;
      try {
        var t = audioCtx.currentTime;
        [660, 880].forEach(function (f, i) {
          var o = audioCtx.createOscillator();
          var g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.35);
          o.connect(g); g.connect(audioCtx.destination);
          o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.4);
        });
      } catch (e) {}
    }
    function setTitleCount(n) { document.title = (n ? '(' + n + ') ' : '') + 'RaiseMyHand'; }
    activeUnsubs.push(function () { setTitleCount(0); });

    // ---- Session stats: kept only in this browser, never uploaded ----
    var logKey = 'rmh_log_' + code;
    var sessLog = loadLS(logKey) || { raised: 0, seen: {}, times: [], helped: [] };
    function saveLog() { sessLog.at = Date.now(); saveLS(logKey, sessLog); }
    (function pruneOldLogs() {
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf('rmh_log_') === 0 && k !== logKey) {
            var v = JSON.parse(localStorage.getItem(k) || '{}');
            if (!v.at || Date.now() - v.at > 24 * 60 * 60 * 1000) localStorage.removeItem(k);
          }
        }
      } catch (e) {}
    })();
    function recordRaised(docs) {
      var changed = false;
      docs.forEach(function (d) {
        var j = (d.data() || {}).joinedAt || 0;
        var key = d.id + '|' + j;
        if (!sessLog.seen[key]) { sessLog.seen[key] = 1; sessLog.raised++; sessLog.times.push(j); changed = true; }
      });
      if (changed) saveLog();
    }
    function fmtDur(s) {
      s = Math.round(s);
      return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    }
    function statsSummary() {
      var h = sessLog.helped;
      var waits = h.map(function (e) { return Math.max(0, (e.helpedAt - e.joinedAt) / 1000); });
      var avg = waits.length ? waits.reduce(function (a, b) { return a + b; }, 0) / waits.length : 0;
      var max = waits.length ? Math.max.apply(null, waits) : 0;
      var busiest = '';
      if (sessLog.times.length) {
        var buckets = {};
        sessLog.times.forEach(function (t) { var b = Math.floor(t / 600000); buckets[b] = (buckets[b] || 0) + 1; });
        var best = Object.keys(buckets).sort(function (a, b) { return buckets[b] - buckets[a]; })[0];
        var st = new Date(best * 600000);
        busiest = st.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' (' + buckets[best] + (buckets[best] === 1 ? ' hand' : ' hands') + ' in 10 min)';
      }
      return { raised: sessLog.raised, helped: h.length, avg: avg, max: max, busiest: busiest };
    }
    function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
    function downloadCsv() {
      var rows = [['Student', 'Type', 'Raised at', 'Helped at', 'Wait (seconds)']];
      sessLog.helped.forEach(function (e) {
        rows.push([e.label, KIND_LABELS[e.kind] || '', new Date(e.joinedAt).toLocaleString(), new Date(e.helpedAt).toLocaleString(), Math.round((e.helpedAt - e.joinedAt) / 1000)]);
      });
      var blob = new Blob([rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'raisemyhand-' + code + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }
    var statsOverlay = null;
    function closeStats() { if (statsOverlay) { statsOverlay.remove(); statsOverlay = null; } }
    activeUnsubs.push(closeStats);
    root.querySelector('#statsBtn').addEventListener('click', function () {
      closeSettings(); closeStats();
      var s = statsSummary();
      statsOverlay = document.createElement('div');
      statsOverlay.className = 'qr-overlay';
      statsOverlay.innerHTML =
        '<div class="qr-card" role="dialog" aria-label="Session stats" style="text-align:left;">' +
          '<h3 style="margin-bottom:10px;">Session stats</h3>' +
          '<div class="stats-grid">' +
            '<div><b>' + s.raised + '</b><span>hands raised</span></div>' +
            '<div><b>' + s.helped + '</b><span>marked helped</span></div>' +
            '<div><b>' + fmtDur(s.avg) + '</b><span>average wait</span></div>' +
            '<div><b>' + fmtDur(s.max) + '</b><span>longest wait</span></div>' +
          '</div>' +
          (s.busiest ? '<div class="qr-hint" style="text-align:left;">Busiest: ' + esc(s.busiest) + '</div>' : '') +
          '<div class="qr-hint" style="text-align:left;">Kept only in this browser for up to 24 hours. Never uploaded.</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button class="btn btn-primary" id="statsCsv"' + (s.helped ? '' : ' disabled') + '>Download CSV</button>' +
            '<button class="btn btn-ghost" id="statsClose">Close</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(statsOverlay);
      statsOverlay.addEventListener('click', function (e) { if (e.target === statsOverlay) closeStats(); });
      statsOverlay.querySelector('#statsClose').addEventListener('click', closeStats);
      statsOverlay.querySelector('#statsCsv').addEventListener('click', downloadCsv);
    });

    var knownIds = null;
    var unsub = queueCol(code).orderBy('joinedAt', 'asc').onSnapshot(function (snap) {
      var waiting = snap.docs.filter(function (d) { return (d.data() || {}).status !== 'helped'; });
      recordRaised(snap.docs);
      var ids = {};
      snap.docs.forEach(function (d) { ids[d.id] = true; });
      if (knownIds) {
        var fresh = waiting.filter(function (d) { return !knownIds[d.id]; });
        if (fresh.length) {
          chime();
          fresh.forEach(function (d) {
            flashIds[d.id] = true;
            setTimeout(function () { delete flashIds[d.id]; }, 2600);
          });
        }
      }
      knownIds = ids;
      setTitleCount(waiting.length);
      renderQueueRows(waiting);
    }, function () {
      showToast('Lost the live connection. Reloading may help.');
    });
    activeUnsubs.push(unsub);

    tickHandle = setInterval(function () { tickWaitTimes(listEl); }, 1000);

    // ---- Discussion mode ----
    var discussCard = root.querySelector('#discussCard');
    var discussBtn = root.querySelector('#discussBtn');
    var activeQListEl = root.querySelector('#activeQList');
    var skippedSection = root.querySelector('#skippedSection');
    var skippedQListEl = root.querySelector('#skippedQList');
    var skippedToggleBtn = root.querySelector('#skippedToggleBtn');
    var discussCountEl = root.querySelector('#discussCount');
    var discussHiddenNotice = root.querySelector('#discussHiddenNotice');
    var qVisBtn = root.querySelector('#qVisBtn');

    var discussionMode = false;
    var questionsVisible = true;
    var mutedUsers = {};
    var lastQuestions = [];
    var skippedOpen = false;

    // Sessions open in Standard (raised hands + announcements). Extra
    // capabilities are opt-in modes picked here, which keeps the default
    // board minimal. Add new entries to MODES as features arrive.
    var MODES = [
      { id: 'standard', label: 'Standard', desc: 'Raised hands and announcements' },
      { id: 'discussion', label: 'Discussion', desc: 'Adds student questions' }
    ];
    function currentModeId() { return discussionMode ? 'discussion' : 'standard'; }

    function updateDiscussBtn() {
      var m = MODES.filter(function (x) { return x.id === currentModeId(); })[0];
      discussBtn.innerHTML = 'Mode: ' + esc(m.label) + ' &#9662;';
      discussBtn.classList.toggle('is-active', currentModeId() !== 'standard');
    }

    var modeMenuEl = null;
    function closeModeMenu() {
      if (modeMenuEl) { modeMenuEl.remove(); modeMenuEl = null; }
      discussBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', modeOutside, true);
      document.removeEventListener('keydown', modeKey);
    }
    function modeOutside(e) { if (modeMenuEl && !modeMenuEl.contains(e.target) && e.target !== discussBtn) closeModeMenu(); }
    function modeKey(e) { if (e.key === 'Escape') closeModeMenu(); }
    activeUnsubs.push(closeModeMenu);

    function setMode(id) {
      var patch = { discussionMode: id === 'discussion' };
      sessionDoc(code).update(patch).catch(function () { showToast('Could not change mode.'); });
    }

    function updateQVisBtn() {
      qVisBtn.innerHTML = questionsVisible ? icons.eye : icons.eyeOff;
      qVisBtn.title = questionsVisible
        ? 'Hide questions (projector mode)'
        : 'Show questions';
      qVisBtn.setAttribute('aria-label', qVisBtn.title);
    }

    function renderQuestionsPanel() {
      var activeQs = lastQuestions.filter(function (q) { return q.status === 'active'; });
      var skippedQs = lastQuestions.filter(function (q) { return q.status === 'skipped'; });

      discussCountEl.textContent = activeQs.length + (activeQs.length === 1 ? ' question' : ' questions');

      // Hidden notice
      discussHiddenNotice.style.display = questionsVisible ? 'none' : 'block';

      // Active questions
      if (!questionsVisible) {
        activeQListEl.innerHTML = '';
      } else if (!activeQs.length) {
        activeQListEl.innerHTML = '<div class="discuss-empty">No questions yet — students can type questions from their devices.</div>';
      } else {
        var html = '';
        activeQs.forEach(function (q) {
          var isMuted = !!mutedUsers[q.authorId];
          html +=
            '<div class="q-item">' +
              '<div class="q-content">' +
                '<div class="q-text">' + esc(q.text) + '</div>' +
                '<div class="q-meta">' + esc(questionWho(q)) + '</div>' +
              '</div>' +
              '<div class="q-actions">' +
                '<button class="q-answered" data-id="' + esc(q.id) + '" title="Mark answered">✓ Answered</button>' +
                '<button class="q-skip" data-id="' + esc(q.id) + '" title="Skip for now">Skip →</button>' +
                '<button class="q-mute' + (isMuted ? ' is-muted' : '') + '" data-id="' + esc(q.id) + '" data-uid="' + esc(q.authorId) + '" title="' + (isMuted ? 'Unmute this student' : 'Mute this student from posting questions') + '">' +
                  (isMuted ? icons.userUnmute + ' Unmute' : icons.userMute + ' Mute') +
                '</button>' +
                (q.authorId ? '<button class="block-btn" data-uid="' + esc(q.authorId) + '" data-label="' + esc(questionWho(q)) + '" title="Remove and block this student for the rest of this session">Block</button>' : '') +
              '</div>' +
            '</div>';
        });
        activeQListEl.innerHTML = html;
        bindBlockButtons(activeQListEl);

        activeQListEl.querySelectorAll('.q-answered').forEach(function (b) {
          b.addEventListener('click', function () {
            b.disabled = true;
            questionsCol(code).doc(b.getAttribute('data-id')).delete().catch(function () {
              b.disabled = false;
              showToast('Could not mark as answered.');
            });
          });
        });

        activeQListEl.querySelectorAll('.q-skip').forEach(function (b) {
          b.addEventListener('click', function () {
            b.disabled = true;
            questionsCol(code).doc(b.getAttribute('data-id')).update({ status: 'skipped' }).catch(function () {
              b.disabled = false;
              showToast('Could not skip that question.');
            });
          });
        });

        activeQListEl.querySelectorAll('.q-mute').forEach(function (b) {
          b.addEventListener('click', function () {
            var uid = b.getAttribute('data-uid');
            var newMuted = Object.assign({}, mutedUsers);
            if (newMuted[uid]) {
              delete newMuted[uid];
            } else {
              newMuted[uid] = true;
            }
            sessionDoc(code).update({ mutedUsers: newMuted }).catch(function () {
              showToast('Could not update mute status.');
            });
          });
        });
      }

      // Skipped section
      if (skippedQs.length > 0) {
        skippedSection.style.display = 'block';
        skippedToggleBtn.textContent = (skippedOpen ? '▾' : '▸') + ' Skipped (' + skippedQs.length + ')';
        if (skippedOpen) {
          var sHtml = '';
          skippedQs.forEach(function (q) {
            sHtml +=
              '<div class="q-item">' +
                '<div class="q-content">' +
                  '<div class="q-text">' + esc(q.text) + '</div>' +
                  '<div class="q-meta">' + esc(questionWho(q)) + '</div>' +
                '</div>' +
                '<div class="q-actions"><button class="q-back" data-id="' + esc(q.id) + '">↩ Move back</button></div>' +
              '</div>';
          });
          skippedQListEl.innerHTML = sHtml;
          skippedQListEl.style.display = 'block';
          skippedQListEl.querySelectorAll('.q-back').forEach(function (b) {
            b.addEventListener('click', function () {
              b.disabled = true;
              questionsCol(code).doc(b.getAttribute('data-id')).update({ status: 'active' }).catch(function () {
                b.disabled = false;
                showToast('Could not move question back.');
              });
            });
          });
        } else {
          skippedQListEl.style.display = 'none';
        }
      } else {
        skippedSection.style.display = 'none';
        skippedQListEl.style.display = 'none';
      }
    }

    discussBtn.addEventListener('click', function () {
      if (modeMenuEl) { closeModeMenu(); return; }
      modeMenuEl = document.createElement('div');
      modeMenuEl.className = 'mode-menu';
      modeMenuEl.setAttribute('role', 'menu');
      modeMenuEl.innerHTML = MODES.map(function (m) {
        var on = m.id === currentModeId();
        return '<button class="mode-opt' + (on ? ' on' : '') + '" role="menuitemradio" aria-checked="' + on + '" data-mode="' + m.id + '">' +
          '<span class="mode-name">' + esc(m.label) + (on ? ' &#10003;' : '') + '</span>' +
          '<span class="mode-desc">' + esc(m.desc) + '</span></button>';
      }).join('');
      discussBtn.parentNode.appendChild(modeMenuEl);
      discussBtn.setAttribute('aria-expanded', 'true');
      modeMenuEl.querySelectorAll('.mode-opt').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-mode');
          closeModeMenu();
          if (id !== currentModeId()) setMode(id);
        });
      });
      document.addEventListener('click', modeOutside, true);
      document.addEventListener('keydown', modeKey);
    });

    qVisBtn.addEventListener('click', function () {
      sessionDoc(code).update({ questionsVisible: !questionsVisible }).catch(function () {
        showToast('Could not toggle question visibility.');
      });
    });

    root.querySelector('#showQuestionsBtn').addEventListener('click', function () {
      sessionDoc(code).update({ questionsVisible: true }).catch(function () {
        showToast('Could not show questions.');
      });
    });

    skippedToggleBtn.addEventListener('click', function () {
      skippedOpen = !skippedOpen;
      renderQuestionsPanel();
    });

    // Subscribe to questions collection
    var qUnsub = questionsCol(code).orderBy('createdAt', 'asc').onSnapshot(function (snap) {
      lastQuestions = snap.docs.map(function (d) {
        var qd = d.data() || {};
        return {
          id: d.id,
          text: qd.text || '',
          authorId: qd.authorId || '',
          authorName: qd.authorName || '',
          authorSeat: qd.authorSeat || '',
          status: qd.status || 'active',
          createdAt: qd.createdAt || 0
        };
      });
      if (discussionMode) renderQuestionsPanel();
    }, function () {
      // Non-fatal: just log, questions panel stays stale
    });
    activeUnsubs.push(qUnsub);

    updateDiscussBtn();
    updateQVisBtn();

    // ---- Layout toggle (stacked vs side-by-side) ----
    var layoutMode = loadLS('rmh_layout_v1') || 'stacked';
    var boardPanelsEl = root.querySelector('#boardPanels');
    var layoutBtn = root.querySelector('#layoutBtn');

    function applyLayout() {
      var isSplit = layoutMode === 'split';
      boardPanelsEl.classList.toggle('layout-split', isSplit);
      root.classList.toggle('layout-split-active', isSplit);
      layoutBtn.style.color = isSplit ? 'var(--accent)' : '';
      layoutBtn.style.background = isSplit ? 'var(--accent-soft)' : '';
      layoutBtn.title = isSplit ? 'Switch to stacked layout' : 'Switch to side-by-side layout';
    }

    layoutBtn.addEventListener('click', function () {
      layoutMode = layoutMode === 'split' ? 'stacked' : 'split';
      saveLS('rmh_layout_v1', layoutMode);
      applyLayout();
    });

    applyLayout();
  }

  function tickWaitTimes(container) {
    var now = Date.now();
    container.querySelectorAll('.stub').forEach(function (row) {
      var joined = parseInt(row.getAttribute('data-joined'), 10) || now;
      var t = row.querySelector('.wait-time');
      if (t) t.textContent = formatDuration(now - joined);
    });
    var ticket = document.querySelector('.ticket[data-joined]');
    if (ticket) {
      var joined2 = parseInt(ticket.getAttribute('data-joined'), 10) || now;
      var v = ticket.querySelector('.wait-value');
      if (v) v.textContent = formatDuration(now - joined2);
    }
  }

  function endSession(code) {
    return wipeSession(code);
  }

  // A co-host link carries ?resume=CODE+KEY (6 characters). Returns it or ''.
  function readResumeParam() {
    var raw = '';
    try { raw = (new URLSearchParams(location.search).get('resume') || '').trim().toUpperCase(); } catch (e) { return ''; }
    if (raw.length !== 6) return '';
    for (var i = 0; i < 6; i++) if (CODE_CHARS.indexOf(raw[i]) === -1) return '';
    return raw;
  }

  // A scanned QR / shared link carries ?code=ABCD. Returns a valid code or ''.
  function readLinkCode() {
    var raw = '';
    try { raw = (new URLSearchParams(location.search).get('code') || '').trim().toUpperCase(); } catch (e) { return ''; }
    if (raw.length !== 4) return '';
    for (var i = 0; i < 4; i++) if (CODE_CHARS.indexOf(raw[i]) === -1) return '';
    return raw;
  }

  // ---------- Student: join ----------
  function renderStudentJoin() {
    setTopbar('student');
    var saved = loadLS(LS_STUDENT);
    var root = mount(
      '<div class="card">' +
        '<h2>Join your class</h2>' +
        '<div class="sub">Enter the code your teacher shared, then tell them who you are.</div>' +
        '<div class="error-box" id="err"></div>' +
        '<div class="field">' +
          '<label for="joinCode">Class code</label>' +
          '<input type="text" id="joinCode" class="code-input" maxlength="4" placeholder="CODE">' +
        '</div>' +
        '<div class="field">' +
          '<label for="joinName">Name <span style="text-transform:none;font-weight:500;">(optional)</span></label>' +
          '<input type="text" id="joinName" maxlength="30" placeholder="e.g. Jordan">' +
        '</div>' +
        '<div class="field">' +
          '<label for="joinSeat">Seat number <span style="text-transform:none;font-weight:500;">(optional)</span></label>' +
          '<input type="text" id="joinSeat" maxlength="12" placeholder="e.g. 14">' +
          '<div class="hint">Fill in one or both &mdash; whatever your teacher will recognize you by. A first name or nickname is fine; it&rsquo;s visible to your teacher and anyone with the class code.</div>' +
        '</div>' +
        '<button class="btn btn-raise" id="joinBtn">Join class</button>' +
      '</div>'
    );

    if (saved && saved.name) root.querySelector('#joinName').value = saved.name;
    if (saved && saved.seat) root.querySelector('#joinSeat').value = saved.seat;
    if (saved && saved.code) root.querySelector('#joinCode').value = saved.code;
    var linkCode = readLinkCode();
    if (linkCode) {
      root.querySelector('#joinCode').value = linkCode;
      var nameEl = root.querySelector('#joinName');
      if (nameEl) nameEl.focus();
    }

    function setErr(msg) {
      var e = root.querySelector('#err');
      if (!msg) { e.classList.remove('show'); e.textContent = ''; return; }
      e.textContent = msg; e.classList.add('show');
    }

    function doJoin() {
      var code = root.querySelector('#joinCode').value.trim().toUpperCase();
      var name = root.querySelector('#joinName').value.trim();
      var seat = root.querySelector('#joinSeat').value.trim();
      if (!code) { setErr('Enter the class code your teacher gave you.'); return; }
      if (!name && !seat) { setErr('Enter a name, a seat number, or both so your teacher can recognize you.'); return; }
      var btn = root.querySelector('#joinBtn');
      btn.disabled = true; btn.textContent = 'Checking code…';
      sessionDoc(code).get().then(function (snap) {
        if (!snap.exists) {
          setErr('We couldn’t find that class. Double-check the code with your teacher.');
          btn.disabled = false; btn.textContent = 'Join class';
          return;
        }
        var data = snap.data() || {};
        sweepExpired(code);
        saveLS(LS_STUDENT, { code: code, className: data.className || '', name: name, seat: seat, ticketId: null });
        renderStudentWait(code, data.className || '', name, seat);
      }).catch(function () {
        setErr('Something went wrong reaching that class. Try again.');
        btn.disabled = false; btn.textContent = 'Join class';
      });
    }

    root.querySelector('#joinBtn').addEventListener('click', doJoin);
    root.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doJoin(); });
    });
    root.querySelector('#joinCode').focus();
  }

  // ---------- Student: raise-hand pad + ticket ----------
  function renderStudentWait(code, className, name, seat) {
    setTopbar('student');
    var root = mount('<div id="announceBanner" style="display:none;"></div><div id="waitInner"></div><div id="questionSection" style="display:none;"></div>');
    var bannerEl = root.querySelector('#announceBanner');
    var inner = root.querySelector('#waitInner');
    var questionSectionEl = root.querySelector('#questionSection');
    var keyHandler = null;
    var myTicketId = null;
    var bannerTimer = null;

    var studentDiscussionMode = false;
    var studentMuted = false;
    var studentBlocked = false;
    var lastQuestionAt = 0;

    function renderBlocked() {
      teardownKeys();
      inner.innerHTML =
        '<div class="ticket">' +
          '<div class="called-flash">' +
            '<h2>Removed from this session</h2>' +
            '<p>Your teacher has removed you from this session. Talk to them if you think this is a mistake.</p>' +
          '</div>' +
          '<button class="btn btn-ghost lower-btn" id="blockedLeave">Leave class</button>' +
        '</div>';
      document.getElementById('blockedLeave').addEventListener('click', leaveClass);
    }

    function updateQuestionSection() {
      if (studentBlocked) {
        questionSectionEl.style.display = 'none';
        return;
      }
      if (!studentDiscussionMode) {
        questionSectionEl.style.display = 'none';
        return;
      }
      questionSectionEl.style.display = 'block';
      questionSectionEl.className = 'question-section';

      if (studentMuted) {
        questionSectionEl.innerHTML = '<div class="question-muted">You&rsquo;ve been muted from posting questions in this session.</div>';
        return;
      }

      // Don't re-render the form if it's already there (avoid clearing an
      // in-progress draft when a session snapshot re-fires mid-typing).
      if (questionSectionEl.querySelector('#qInput')) return;

      questionSectionEl.innerHTML =
        '<div class="question-box">' +
          '<h3>Ask a question</h3>' +
          '<textarea id="qInput" maxlength="300" placeholder="Type your question for the teacher…"></textarea>' +
          '<label class="note-share"><input type="checkbox" id="qAnon"> Ask anonymously (your teacher won&rsquo;t see your name)</label>' +
          '<button class="btn btn-primary q-submit-btn" id="qSubmitBtn">Submit question</button>' +
        '</div>';

      var qInput = questionSectionEl.querySelector('#qInput');
      var qSubmitBtn = questionSectionEl.querySelector('#qSubmitBtn');

      qSubmitBtn.addEventListener('click', function () {
        var text = qInput.value.trim();
        if (!text) { qInput.focus(); return; }
        if (Date.now() - lastQuestionAt < 8000) { showToast('Give it a few seconds before sending another question.'); return; }
        lastQuestionAt = Date.now();
        qSubmitBtn.disabled = true;
        var uid = auth.currentUser && auth.currentUser.uid;
        var entry = { text: text, authorId: uid || '', status: 'active', createdAt: Date.now(), expireAt: expireTs() };
        var anon = questionSectionEl.querySelector('#qAnon');
        if (!(anon && anon.checked)) {
          if (name && name.trim()) entry.authorName = name.trim();
          if (seat && seat.trim()) entry.authorSeat = seat.trim();
        }
        questionsCol(code).add(entry).then(function () {
          qInput.value = '';
          qSubmitBtn.disabled = false;
          showToast('Question submitted!');
        }).catch(function () {
          qSubmitBtn.disabled = false;
          showToast('Could not submit question. Try again.');
        });
      });
    }

    // A private reminder the student can jot for themselves ("what was I
    // going to ask?"). Only sent to Firestore -- and so only ever visible
    // to the teacher -- if they explicitly check "share with teacher".
    var noteDraft = loadLS('rmh_note_' + code) || {};
    var noteText = noteDraft.text || '';
    var noteShare = !!noteDraft.share;
    var handKind = '';

    function teardownKeys() {
      if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    }

    function hideBanner() {
      if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null; }
      bannerEl.style.display = 'none';
      bannerEl.innerHTML = '';
    }

    function updateBanner(ann) {
      if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null; }
      if (!ann || !ann.text) { hideBanner(); return; }
      if (ann.mode === 'timed' && ann.expiresAt && Date.now() >= ann.expiresAt) { hideBanner(); return; }
      if (ann.mode === 'dismissable' && loadLS('rmh_dismissed_' + code) === ann.id) { hideBanner(); return; }

      bannerEl.style.display = 'block';
      bannerEl.innerHTML =
        '<div class="announce-banner"><div class="announce-icon">' + icons.megaphone + '</div>' +
        '<div class="announce-body"><div class="announce-text"><strong>Announcement</strong>' + esc(ann.text) + '</div></div>' +
        (ann.mode === 'dismissable' ? '<button class="announce-dismiss" id="annDismiss" aria-label="Dismiss">&times;</button>' : '') +
        '</div>';
      if (ann.mode === 'dismissable') {
        bannerEl.querySelector('#annDismiss').addEventListener('click', function () {
          saveLS('rmh_dismissed_' + code, ann.id);
          hideBanner();
        });
      }
      if (ann.mode === 'timed' && ann.expiresAt) {
        bannerTimer = setInterval(function () {
          if (Date.now() >= ann.expiresAt) hideBanner();
        }, 1000);
      }
    }
    activeUnsubs.push(function () { if (bannerTimer) clearInterval(bannerTimer); });

    function leaveClass() {
      teardownKeys();
      clearSubs();
      clearLS(LS_STUDENT);
      renderStudentJoin();
    }

    function renderPad(waitingCount) {
      if (studentBlocked) { renderBlocked(); return; }
      teardownKeys();
      inner.innerHTML =
        '<div class="raise-pad">' +
          '<div class="meta">' + esc(className || 'Your class') + ' &middot; code <strong class="mono">' + esc(code) + '</strong>' +
            (waitingCount ? ' &middot; ' + waitingCount + ' waiting' : '') + '</div>' +
          '<button class="raise-btn" id="raiseBtn">' + icons.hand + '<span class="label">Raise hand</span></button>' +
          '<div class="kbd-hint">or press <kbd>Space</kbd></div>' +
          '<div class="kind-row" id="kindRow" role="group" aria-label="What kind of help (optional)">' +
            Object.keys(KIND_LABELS).map(function (k) {
              return '<button type="button" class="kind-chip' + (handKind === k ? ' on' : '') + '" data-kind="' + k + '" aria-pressed="' + (handKind === k) + '">' + esc(KIND_LABELS[k]) + '</button>';
            }).join('') +
          '</div>' +
          '<button class="note-toggle" id="noteToggle">' + (noteText ? 'Edit your note' : '+ Add a note to yourself') + '</button>' +
          '<div class="note-box" id="noteBox" style="display:' + (noteText ? 'block' : 'none') + ';">' +
            '<textarea id="noteInput" maxlength="200" placeholder="What did you want to ask or remember?">' + esc(noteText) + '</textarea>' +
            '<label class="note-share"><input type="checkbox" id="noteShare"' + (noteShare ? ' checked' : '') + '> Let my teacher see this note too</label>' +
          '</div>' +
          '<div class="link-row" style="margin-top:28px;"><button id="leaveBtn">Not your class? Switch</button></div>' +
        '</div>';

      document.querySelectorAll('#kindRow .kind-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var k = chip.getAttribute('data-kind');
          handKind = handKind === k ? '' : k;
          document.querySelectorAll('#kindRow .kind-chip').forEach(function (c) {
            var on = c.getAttribute('data-kind') === handKind;
            c.classList.toggle('on', on);
            c.setAttribute('aria-pressed', on);
          });
        });
      });

      var noteToggleBtn = document.getElementById('noteToggle');
      var noteBox = document.getElementById('noteBox');
      var noteInput = document.getElementById('noteInput');
      var noteShareBox = document.getElementById('noteShare');

      noteToggleBtn.addEventListener('click', function () {
        noteBox.style.display = noteBox.style.display === 'none' ? 'block' : 'none';
        if (noteBox.style.display === 'block') noteInput.focus();
      });
      function persistNoteDraft() {
        noteText = noteInput.value;
        noteShare = noteShareBox.checked;
        saveLS('rmh_note_' + code, { text: noteText, share: noteShare });
      }
      noteInput.addEventListener('input', persistNoteDraft);
      noteShareBox.addEventListener('change', persistNoteDraft);

      var raising = false;
      function doRaise() {
        if (raising) return;
        if (myTicketId) {
          // We already believe we have an active ticket -- don't create a
          // second one; just show it again instead of raising a duplicate.
          renderTicketed();
          return;
        }
        var myUid = auth.currentUser && auth.currentUser.uid;
        if (!myUid) { showToast('Not signed in yet. Try again in a moment.'); return; }
        if (Date.now() - lastRaiseAt < 3000) { showToast('One moment before raising again.'); return; }
        lastRaiseAt = Date.now();
        raising = true;
        var btn = document.getElementById('raiseBtn');
        if (btn) btn.disabled = true;
        var entry = { joinedAt: Date.now(), status: 'waiting', expireAt: expireTs() };
        if (name && name.trim()) entry.name = name.trim();
        if (seat && seat.trim()) entry.seat = seat.trim();
        if (noteShare && noteText && noteText.trim()) entry.note = noteText.trim();
        if (handKind) { entry.kind = handKind; handKind = ''; }
        // The ticket id is this device's user id, and the rules only allow
        // creating it once, so one device can hold at most one hand per
        // session. If it already exists (e.g. after a reload that lost local
        // state), adopt it instead of failing.
        queueCol(code).doc(myUid).set(entry).catch(function (err) {
          return queueCol(code).doc(myUid).get().then(function (s) {
            if (!s.exists) throw err;
            if ((s.data() || {}).status === 'helped') {
              // A leftover already-helped ticket: replace it with a fresh hand.
              return queueCol(code).doc(myUid).delete().then(function () {
                return queueCol(code).doc(myUid).set(entry);
              });
            }
          });
        }).then(function () {
          myTicketId = myUid;
          var saved = loadLS(LS_STUDENT) || {};
          saved.ticketId = myUid; saved.code = code; saved.name = name; saved.seat = seat; saved.className = className;
          saveLS(LS_STUDENT, saved);
          renderTicketed();
        }).catch(function () {
          raising = false;
          if (btn) btn.disabled = false;
          showToast('Could not raise your hand. Try again.');
        });
      }

      var rb = document.getElementById('raiseBtn');
      if (rb) rb.addEventListener('click', doRaise);
      var lb = document.getElementById('leaveBtn');
      if (lb) lb.addEventListener('click', leaveClass);

      keyHandler = function (e) {
        if (e.code !== 'Space' || e.repeat) return;
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
        e.preventDefault();
        doRaise();
      };
      document.addEventListener('keydown', keyHandler);
    }

    var lastRaiseAt = 0;
    var studentClearedAt = null;
    var sessLoaded = false;
    var ticketBaseline;

    function renderCleared() {
      teardownKeys();
      inner.innerHTML =
        '<div class="ticket">' +
          '<div class="called-flash">' +
            '<h2>Queue cleared</h2>' +
            '<p>Your teacher cleared the queue. Raise your hand again if you still need help.</p>' +
          '</div>' +
        '</div>';
      var saved = loadLS(LS_STUDENT) || {};
      saved.ticketId = null;
      saveLS(LS_STUDENT, saved);
      myTicketId = null;
      setTimeout(function () { renderPad(0); refreshCount(); }, 3000);
    }

    function calledHtml() {
      teardownKeys();
      inner.innerHTML =
        '<div class="ticket">' +
          '<div class="called-flash">' +
            '<div class="check">' + icons.check + '</div>' +
            '<h2>You&rsquo;ve been called!</h2>' +
            '<p>Head up &mdash; your teacher marked you as helped.</p>' +
          '</div>' +
        '</div>';
    }

    function renderCalled(alreadyShown) {
      if (!alreadyShown) calledHtml();
      var saved = loadLS(LS_STUDENT) || {};
      saved.ticketId = null;
      saveLS(LS_STUDENT, saved);
      myTicketId = null;
      setTimeout(function () { renderPad(0); refreshCount(); }, alreadyShown ? 1200 : 2600);
    }

    var ticketWatchers = [];
    function stopTicketWatchers() {
      ticketWatchers.forEach(function (u) { try { u(); } catch (e) {} });
      ticketWatchers = [];
    }

    function refreshCount() {
      queueCol(code).get().then(function (snap) {
        var pad = inner.querySelector('.meta');
        if (pad) {
          var extra = snap.size ? (' &middot; ' + snap.size + ' waiting') : '';
          pad.innerHTML = esc(className || 'Your class') + ' &middot; code <strong class="mono">' + esc(code) + '</strong>' + extra;
        }
      }).catch(function () {});
    }

    function renderTicketed() {
      teardownKeys();
      stopTicketWatchers();
      ticketBaseline = sessLoaded ? studentClearedAt : undefined;
      inner.innerHTML =
        '<div class="ticket" id="ticketCard">' +
          '<div class="eyebrow">' + esc(className || 'Your class') + '</div>' +
          '<div class="position" id="posValue">&hellip;</div>' +
          '<div class="of" id="ofValue">Getting your spot in line&hellip;</div>' +
          '<div class="details">' +
            '<div class="detail"><div class="k">Waiting</div><div class="v mono wait-value">0:00</div></div>' +
            '<div class="detail"><div class="k">You&rsquo;re listed as</div><div class="v">' + esc(identityLabel(name, seat)) + '</div></div>' +
          '</div>' +
          (noteText ? (
            '<div class="ticket-note"><div class="k">Your note</div><div class="v-note">' + esc(noteText) + '</div>' +
            (noteShare ? '<span class="note-shared-tag">Shared with your teacher</span>' : '') + '</div>'
          ) : '') +
          '<button class="btn btn-ghost lower-btn" id="lowerBtn">Lower hand</button>' +
        '</div>';

      document.getElementById('lowerBtn').addEventListener('click', function () {
        var btn = this; btn.disabled = true; btn.textContent = 'Lowering…';
        if (!myTicketId) { renderPad(0); return; }
        queueCol(code).doc(myTicketId).delete().then(function () {
          var saved = loadLS(LS_STUDENT) || {};
          saved.ticketId = null;
          saveLS(LS_STUDENT, saved);
          myTicketId = null;
          renderPad(0);
        }).catch(function () {
          btn.disabled = false; btn.textContent = 'Lower hand';
        });
      });

      // Watch the specific ticket document directly for deletion.
      // An ordered collection query can deliver its first snapshot before
      // Firestore propagates a brand-new write to the query index, making
      // the ticket appear missing moments after creation. Relying on that
      // alone (even with a confirmatory .get()) risks a false renderCalled()
      // which clears myTicketId and lets the student raise a duplicate hand,
      // leaving a ghost ticket visible on the teacher's board forever.
      // A doc-level listener on the exact path is immediately consistent.
      var ticketSeen = false;
      var calledTentative = false;
      var watchedId = myTicketId;
      var ticketDocUnsub = queueCol(code).doc(myTicketId).onSnapshot(function (docSnap) {
        if (docSnap.exists) {
          ticketSeen = true;
          var st = (docSnap.data() || {}).status;
          if (st === 'helped' && !calledTentative) {
            // Teacher marked us helped; they can still undo for a few seconds.
            calledTentative = true;
            calledHtml();
          } else if (st !== 'helped' && calledTentative) {
            calledTentative = false;
            renderTicketed();
          }
        } else if (ticketSeen) {
          // Doc existed and is now gone — teacher removed us. Give the
          // session doc's clearedAt a moment to arrive so a bulk clear
          // isn't mistaken for "you've been called".
          setTimeout(function () {
            if (myTicketId !== watchedId || studentBlocked) return;
            if (!calledTentative && ticketBaseline !== undefined && studentClearedAt !== ticketBaseline) renderCleared();
            else renderCalled(calledTentative);
          }, calledTentative ? 0 : 700);
        }
        // If !ticketSeen && !docSnap.exists: listener fired before the
        // create propagated (shouldn't happen on a doc watch, but guard it).
      }, function () {});
      activeUnsubs.push(ticketDocUnsub);
      ticketWatchers.push(ticketDocUnsub);

      var unsub = queueCol(code).orderBy('joinedAt', 'asc').onSnapshot(function (snapAll) {
        var idx = -1;
        var mine = null;
        var docsW = snapAll.docs.filter(function (d) { return (d.data() || {}).status !== 'helped'; });
        var snap = { docs: docsW, size: docsW.length };
        snap.docs.forEach(function (doc, i) {
          if (doc.id === myTicketId) { idx = i; mine = doc; }
        });
        if (idx === -1) return; // deletion is handled by ticketDocUnsub above
        var card = document.getElementById('ticketCard');
        if (card && mine) {
          card.setAttribute('data-joined', (mine.data() || {}).joinedAt || Date.now());
        }
        var posEl = document.getElementById('posValue');
        var ofEl = document.getElementById('ofValue');
        if (posEl) posEl.textContent = '#' + (idx + 1);
        if (ofEl) ofEl.textContent = idx === 0 ? 'You’re next in line' : ('of ' + snap.size + ' waiting');
        tickWaitTimes(document.body);
      }, function () {
        showToast('Lost the live connection. Reloading may help.');
      });
      activeUnsubs.push(unsub);
      ticketWatchers.push(unsub);
      if (tickHandle) clearInterval(tickHandle);
      tickHandle = setInterval(function () { tickWaitTimes(document.body); }, 1000);
    }

    // Watch for the session ending entirely, for announcement updates,
    // and for discussion mode toggling.
    var sessUnsub = sessionDoc(code).onSnapshot(function (snap) {
      if (!snap.exists) {
        showToast('This session has ended.');
        leaveClass();
        return;
      }
      var data = snap.data() || {};
      updateBanner(data.announcement || null);

      studentClearedAt = data.clearedAt || null;
      if (!sessLoaded) {
        sessLoaded = true;
        if (ticketBaseline === undefined) ticketBaseline = studentClearedAt;
      }

      // Discussion mode
      var uid = auth.currentUser && auth.currentUser.uid;
      studentDiscussionMode = !!data.discussionMode;
      studentMuted = !!(data.mutedUsers && uid && data.mutedUsers[uid]);
      var nowBlocked = !!(data.blocked && uid && data.blocked[uid]);
      var blockChanged = nowBlocked !== studentBlocked;
      studentBlocked = nowBlocked;
      if (blockChanged) {
        if (nowBlocked) {
          myTicketId = null;
          var savedB = loadLS(LS_STUDENT) || {};
          savedB.ticketId = null;
          saveLS(LS_STUDENT, savedB);
          renderBlocked();
        } else if (sessLoaded) {
          renderPad(0);
        }
      }
      updateQuestionSection();
    });
    activeUnsubs.push(sessUnsub);

    // Resume an in-flight ticket if we had one before a reload.
    var saved = loadLS(LS_STUDENT);
    if (saved && saved.ticketId && saved.code === code) {
      queueCol(code).doc(saved.ticketId).get().then(function (snap) {
        if (snap.exists && (snap.data() || {}).status !== 'helped') {
          myTicketId = saved.ticketId;
          renderTicketed();
        } else {
          renderPad(0);
        }
      }).catch(function () { renderPad(0); });
    } else {
      renderPad(0);
    }
  }

  // ---------- Boot ----------
  function boot() {
    mount('<div class="card"><h2>Connecting&hellip;</h2><div class="sub">Setting up your session.</div></div>');
    waitForAuth().then(function () {
      if (readResumeParam()) renderTeacherStart();
      else if (readLinkCode()) renderStudentJoin();
      else renderLanding();
    }).catch(function () {
      mount('<div class="card"><h2>Can&rsquo;t connect</h2><div class="sub">Check your internet connection and reload the page. If this keeps happening, the site may not be configured correctly yet.</div></div>');
    });
  }

  var offlineBarEl = document.getElementById('offlineBar');
  function syncOnline() { if (offlineBarEl) offlineBarEl.hidden = navigator.onLine !== false; }
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);
  syncOnline();

  boot();
})();
