import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, orderBy, onSnapshot, addDoc
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

  var icons = {
    teacher: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/></svg>',
    student: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--raise-ink-soft)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z"/><path d="M7 10.6v4.6c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z"/><path d="M7 10.6v4.6c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2C11 5.1 11.5 5 12 5c6 0 9.5 7 9.5 7-.6 1.2-1.6 2.7-3 4.1M6.3 6.3C4 7.9 2.5 12 2.5 12s3.5 7 9.5 7c1.2 0 2.3-.3 3.3-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 21.5c-.66 0-1.3-.26-1.77-.73l-4.3-4.3a1.6 1.6 0 0 1 2.26-2.26l1.81 1.81V9.2a1.5 1.5 0 0 1 3 0v3.8h.5V6.4a1.5 1.5 0 0 1 3 0v6.6h.5V7.6a1.5 1.5 0 0 1 3 0v5.4h.5V9.9a1.5 1.5 0 0 1 3 0v6.35c0 3.07-2.48 5.55-5.55 5.55H9.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.85 1.85M17.55 17.55l1.85 1.85M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.85-1.85M17.55 6.45l1.85-1.85"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a.6.6 0 0 0-.75-.8A9.4 9.4 0 1 0 21.2 15.45a.6.6 0 0 0-.8-.75Z"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5v3a1.5 1.5 0 0 0 1.5 1.5H6l1.2 5a1 1 0 0 0 1 .8h1a1 1 0 0 0 .97-1.24L9 15h1l9 4V6l-9 4H4.5A1.5 1.5 0 0 0 3 10.5Z"/><path d="M19 9.5v6"/></svg>'
  };

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
  function renderLanding() {
    setTopbar(null);
    var root = mount(
      '<div class="lede">' +
        '<h1>Raise a hand from anywhere in the room.</h1>' +
        '<p>Students tap in from their own device and line up in order. Teachers watch one live queue instead of a sea of hands.</p>' +
      '</div>' +
      '<div class="role-grid">' +
        '<button class="role-card teacher" id="pickTeacher">' +
          '<div class="icon-badge">' + icons.teacher + '</div>' +
          '<h2>I&rsquo;m the teacher</h2>' +
          '<p>Start a session, share the code, and watch students line up in real time.</p>' +
        '</button>' +
        '<button class="role-card student" id="pickStudent">' +
          '<div class="icon-badge">' + icons.student + '</div>' +
          '<h2>I&rsquo;m a student</h2>' +
          '<p>Enter your class code, then press space or tap the button to raise your hand.</p>' +
        '</button>' +
      '</div>'
    );
    root.querySelector('#pickTeacher').addEventListener('click', function () { renderTeacherStart(); });
    root.querySelector('#pickStudent').addEventListener('click', function () { renderStudentJoin(); });
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
        renderTeacherBoard(code, data.className || '', key);
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
          renderTeacherBoard(saved.code, data.className || saved.className || '', saved.teacherKey);
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
          if (triesLeft <= 0) throw new Error('Could not generate a free code. Try again.');
          return attempt(triesLeft - 1);
        }
        return sessionDoc(code).set({ code: code, className: className || '', createdAt: Date.now(), teacherKey: teacherKey }).then(function () {
          return { code: code, teacherKey: teacherKey };
        });
      });
    }
    return attempt(5);
  }

  // ---------- Teacher: board ----------
  function renderTeacherBoard(code, className, teacherKey) {
    setTopbar('teacher');
    var root = mount(
      '<div class="board-header">' +
        '<div class="board-title">' +
          '<h2>' + esc(className || 'Untitled session') + '</h2>' +
          '<div class="sub" id="waitCount">Waiting for students&hellip;</div>' +
          (teacherKey ? '<button class="reopen-toggle" id="reopenToggle">Show my reopen code</button>' : '') +
        '</div>' +
        '<div class="code-chip">' +
          '<div><div class="code-label">Class code</div><div class="code-value">' + esc(code) + '</div></div>' +
          '<button class="icon-btn" id="notesToggleBtn" title="Toggle note visibility" aria-label="Toggle note visibility"></button>' +
          '<button class="icon-btn" id="copyBtn" title="Copy code" aria-label="Copy code">' + icons.copy + '</button>' +
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
      '<div class="queue-scroll"><div class="queue-list" id="queueList"></div></div>' +
      '<div class="board-footer"><button class="btn btn-danger-ghost" id="endBtn">End session</button></div>',
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

    root.querySelector('#copyBtn').addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { showToast('Code copied'); }).catch(function () { showToast('Code: ' + code); });
      } else {
        showToast('Code: ' + code);
      }
    });

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

    var annUnsub = sessionDoc(code).onSnapshot(function (snap) {
      if (!snap.exists) return;
      var data = snap.data() || {};
      lastAnn = data.announcement || null;
      renderAnnounceState(lastAnn);
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
        html += '<div class="stub' + (isNext ? ' next' : '') + '" data-joined="' + (d.joinedAt || Date.now()) + '">' +
          '<div class="num">' + (i + 1) + '</div>' +
          '<div class="who"><div class="name">' + esc(identityLabel(d.name, d.seat)) + '</div>' +
            '<div class="wait mono">waiting <span class="wait-time">0:00</span></div>' +
            noteHtml +
          '</div>' +
          (isNext ? '<span class="next-badge">Next</span>' : '') +
          '<button class="help-btn" data-id="' + esc(doc.id) + '">Mark helped</button>' +
        '</div>';
      });
      listEl.innerHTML = html;
      listEl.querySelectorAll('.help-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true;
          queueCol(code).doc(b.getAttribute('data-id')).delete().catch(function () {
            b.disabled = false;
          });
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

    var unsub = queueCol(code).orderBy('joinedAt', 'asc').onSnapshot(function (snap) {
      renderQueueRows(snap.docs);
    }, function () {
      showToast('Lost the live connection. Reloading may help.');
    });
    activeUnsubs.push(unsub);

    tickHandle = setInterval(function () { tickWaitTimes(listEl); }, 1000);
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
    return queueCol(code).get().then(function (snap) {
      var deletes = snap.docs.map(function (d) { return queueCol(code).doc(d.id).delete(); });
      return Promise.all(deletes);
    }).then(function () {
      return sessionDoc(code).delete();
    });
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
          '<div class="hint">Fill in one or both &mdash; whatever your teacher will recognize you by.</div>' +
        '</div>' +
        '<button class="btn btn-raise" id="joinBtn">Join class</button>' +
      '</div>'
    );

    if (saved && saved.name) root.querySelector('#joinName').value = saved.name;
    if (saved && saved.seat) root.querySelector('#joinSeat').value = saved.seat;
    if (saved && saved.code) root.querySelector('#joinCode').value = saved.code;

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
    var root = mount('<div id="announceBanner" style="display:none;"></div><div id="waitInner"></div>');
    var bannerEl = root.querySelector('#announceBanner');
    var inner = root.querySelector('#waitInner');
    var keyHandler = null;
    var myTicketId = null;
    var bannerTimer = null;

    // A private reminder the student can jot for themselves ("what was I
    // going to ask?"). Only sent to Firestore -- and so only ever visible
    // to the teacher -- if they explicitly check "share with teacher".
    var noteDraft = loadLS('rmh_note_' + code) || {};
    var noteText = noteDraft.text || '';
    var noteShare = !!noteDraft.share;

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
      teardownKeys();
      inner.innerHTML =
        '<div class="raise-pad">' +
          '<div class="meta">' + esc(className || 'Your class') + ' &middot; code <strong class="mono">' + esc(code) + '</strong>' +
            (waitingCount ? ' &middot; ' + waitingCount + ' waiting' : '') + '</div>' +
          '<button class="raise-btn" id="raiseBtn">' + icons.hand + '<span class="label">Raise hand</span></button>' +
          '<div class="kbd-hint">or press <kbd>Space</kbd></div>' +
          '<button class="note-toggle" id="noteToggle">' + (noteText ? 'Edit your note' : '+ Add a note to yourself') + '</button>' +
          '<div class="note-box" id="noteBox" style="display:' + (noteText ? 'block' : 'none') + ';">' +
            '<textarea id="noteInput" maxlength="200" placeholder="What did you want to ask or remember?">' + esc(noteText) + '</textarea>' +
            '<label class="note-share"><input type="checkbox" id="noteShare"' + (noteShare ? ' checked' : '') + '> Let my teacher see this note too</label>' +
          '</div>' +
          '<div class="link-row" style="margin-top:28px;"><button id="leaveBtn">Not your class? Switch</button></div>' +
        '</div>';

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
        raising = true;
        var btn = document.getElementById('raiseBtn');
        if (btn) btn.disabled = true;
        var entry = { joinedAt: Date.now(), status: 'waiting' };
        if (name && name.trim()) entry.name = name.trim();
        if (seat && seat.trim()) entry.seat = seat.trim();
        if (noteShare && noteText && noteText.trim()) entry.note = noteText.trim();
        queueCol(code).add(entry).then(function (ref) {
          myTicketId = ref.id;
          var saved = loadLS(LS_STUDENT) || {};
          saved.ticketId = ref.id; saved.code = code; saved.name = name; saved.seat = seat; saved.className = className;
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

    function renderCalled() {
      teardownKeys();
      inner.innerHTML =
        '<div class="ticket">' +
          '<div class="called-flash">' +
            '<div class="check">' + icons.check + '</div>' +
            '<h2>You&rsquo;ve been called!</h2>' +
            '<p>Head up &mdash; your teacher marked you as helped.</p>' +
          '</div>' +
        '</div>';
      var saved = loadLS(LS_STUDENT) || {};
      saved.ticketId = null;
      saveLS(LS_STUDENT, saved);
      myTicketId = null;
      setTimeout(function () { renderPad(0); refreshCount(); }, 2600);
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

      var confirmingRemoval = false;

      var unsub = queueCol(code).orderBy('joinedAt', 'asc').onSnapshot(function (snap) {
        var idx = -1;
        var mine = null;
        snap.docs.forEach(function (doc, i) {
          if (doc.id === myTicketId) { idx = i; mine = doc; }
        });
        if (idx === -1) {
          // Our ticket isn't in this snapshot -- normally because the
          // teacher marked us helped and deleted it. But a brand-new
          // collection query like this one can occasionally deliver its
          // first snapshot before it's fully caught up with a write we
          // just made a moment ago (raising a hand), which would
          // otherwise show the "called" screen and clear our ticket ID
          // while the ticket is actually still sitting in the queue --
          // and raising again would then add a second, duplicate entry.
          // Confirm directly against our own ticket doc before acting on
          // that, instead of trusting this query alone.
          if (!confirmingRemoval) {
            confirmingRemoval = true;
            var checkingId = myTicketId;
            queueCol(code).doc(checkingId).get().then(function (docSnap) {
              confirmingRemoval = false;
              if (!docSnap.exists && myTicketId === checkingId) {
                renderCalled();
              }
              // else: false alarm -- our ticket is still there; the next
              // snapshot from this listener will pick it back up.
            }).catch(function () { confirmingRemoval = false; });
          }
          return;
        }
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
      tickHandle = setInterval(function () { tickWaitTimes(document.body); }, 1000);
    }

    // Watch for the session ending entirely, and for announcement updates.
    var sessUnsub = sessionDoc(code).onSnapshot(function (snap) {
      if (!snap.exists) {
        showToast('This session has ended.');
        leaveClass();
        return;
      }
      var data = snap.data() || {};
      updateBanner(data.announcement || null);
    });
    activeUnsubs.push(sessUnsub);

    // Resume an in-flight ticket if we had one before a reload.
    var saved = loadLS(LS_STUDENT);
    if (saved && saved.ticketId && saved.code === code) {
      queueCol(code).doc(saved.ticketId).get().then(function (snap) {
        if (snap.exists) {
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
      renderLanding();
    }).catch(function () {
      mount('<div class="card"><h2>Can&rsquo;t connect</h2><div class="sub">Check your internet connection and reload the page. If this keeps happening, the site may not be configured correctly yet.</div></div>');
    });
  }

  boot();
})();
