import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc,
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
  var CODE_CHARS = '23456789ACDEFGHJKMNPQRSTUVWXYZ';

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
    student: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--raise-ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z"/><path d="M7 10.6v4.6c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z"/><path d="M7 10.6v4.6c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.4" y="11" width="10.4" height="9.6" rx="3"/><rect x="6.9" y="3.2" width="2.3" height="9" rx="1.15"/><rect x="9.6" y="1.6" width="2.3" height="10.6" rx="1.15"/><rect x="12.3" y="1.1" width="2.3" height="11.1" rx="1.15"/><rect x="15" y="2.1" width="2.3" height="10.1" rx="1.15"/><rect x="3.3" y="9.6" width="2.3" height="6.4" rx="1.15" transform="rotate(-24 4.45 12.8)"/></svg>'
  };

  function setTopbar(role) {
    if (!role) { topbarMeta.innerHTML = ''; return; }
    var label = role === 'teacher' ? 'Teacher' : 'Student';
    topbarMeta.innerHTML = '<span class="role-pill">' + label + '</span><button class="exit-link" id="exitBtn">Switch role</button>';
    document.getElementById('exitBtn').addEventListener('click', function () {
      clearSubs();
      renderLanding();
    });
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
        '<div class="link-row">Watching this class on another device? <button id="resumeToggle">Resume with a code</button></div>' +
        '<div id="resumeBox" style="display:none;margin-top:16px;border-top:1px solid var(--line);padding-top:16px;">' +
          '<div class="field" style="margin-bottom:10px;">' +
            '<label for="resumeCode">Session code</label>' +
            '<input type="text" id="resumeCode" class="code-input" maxlength="4" placeholder="CODE">' +
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
      startNewSession(className).then(function (code) {
        saveLS(LS_TEACHER, { code: code, className: className });
        renderTeacherBoard(code, className);
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
      var code = root.querySelector('#resumeCode').value.trim().toUpperCase();
      if (!code) { setErr('Enter the session code to resume.'); return; }
      btn.disabled = true; btn.textContent = 'Checking…';
      sessionDoc(code).get().then(function (snap) {
        if (!snap.exists) {
          setErr('No active session with that code.');
          btn.disabled = false; btn.textContent = 'Resume session';
          return;
        }
        var data = snap.data() || {};
        saveLS(LS_TEACHER, { code: code, className: data.className || '' });
        renderTeacherBoard(code, data.className || '');
      }).catch(function () {
        setErr('Something went wrong checking that code.');
        btn.disabled = false; btn.textContent = 'Resume session';
      });
    });

    // Try to resume a session already open on this device.
    if (saved && saved.code) {
      sessionDoc(saved.code).get().then(function (snap) {
        if (snap.exists) {
          var data = snap.data() || {};
          renderTeacherBoard(saved.code, data.className || saved.className || '');
        } else {
          clearLS(LS_TEACHER);
        }
      }).catch(function () {});
    }
  }

  function startNewSession(className) {
    function attempt(triesLeft) {
      var code = randomCode(4);
      return sessionDoc(code).get().then(function (snap) {
        if (snap.exists) {
          if (triesLeft <= 0) throw new Error('Could not generate a free code. Try again.');
          return attempt(triesLeft - 1);
        }
        return sessionDoc(code).set({ code: code, className: className || '', createdAt: Date.now() }).then(function () {
          return code;
        });
      });
    }
    return attempt(5);
  }

  // ---------- Teacher: board ----------
  function renderTeacherBoard(code, className) {
    setTopbar('teacher');
    var root = mount(
      '<div class="board-header">' +
        '<div class="board-title">' +
          '<h2>' + esc(className || 'Untitled session') + '</h2>' +
          '<div class="sub" id="waitCount">Waiting for students&hellip;</div>' +
        '</div>' +
        '<div class="code-chip">' +
          '<div><div class="code-label">Class code</div><div class="code-value">' + esc(code) + '</div></div>' +
          '<button class="icon-btn" id="copyBtn" title="Copy code" aria-label="Copy code">' + icons.copy + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="queue-scroll"><div class="queue-list" id="queueList"></div></div>' +
      '<div class="board-footer"><button class="btn btn-danger-ghost" id="endBtn">End session</button></div>',
      true
    );

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

    var listEl = root.querySelector('#queueList');
    var waitCountEl = root.querySelector('#waitCount');

    var unsub = queueCol(code).orderBy('joinedAt', 'asc').onSnapshot(function (snap) {
      if (snap.empty) {
        listEl.innerHTML = '<div class="empty-state">' + icons.empty + '<p>No one is waiting. The queue fills up here as hands go up.</p></div>';
        waitCountEl.textContent = 'Waiting for students…';
        return;
      }
      waitCountEl.textContent = snap.size + (snap.size === 1 ? ' student waiting' : ' students waiting');
      var html = '';
      snap.docs.forEach(function (doc, i) {
        var d = doc.data() || {};
        var isNext = i === 0;
        html += '<div class="stub' + (isNext ? ' next' : '') + '" data-joined="' + (d.joinedAt || Date.now()) + '">' +
          '<div class="num">' + (i + 1) + '</div>' +
          '<div class="who"><div class="name">' + esc(d.name || 'Student') + '</div><div class="wait mono">waiting <span class="wait-time">0:00</span></div></div>' +
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
      tickWaitTimes(listEl);
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
          '<label for="joinName">Name or seat number</label>' +
          '<input type="text" id="joinName" maxlength="30" placeholder="e.g. Jordan, or Seat 14">' +
          '<div class="hint">This is what your teacher will see in the queue.</div>' +
        '</div>' +
        '<button class="btn btn-raise" id="joinBtn">Join class</button>' +
      '</div>'
    );

    if (saved && saved.name) root.querySelector('#joinName').value = saved.name;
    if (saved && saved.code) root.querySelector('#joinCode').value = saved.code;

    function setErr(msg) {
      var e = root.querySelector('#err');
      if (!msg) { e.classList.remove('show'); e.textContent = ''; return; }
      e.textContent = msg; e.classList.add('show');
    }

    function doJoin() {
      var code = root.querySelector('#joinCode').value.trim().toUpperCase();
      var name = root.querySelector('#joinName').value.trim();
      if (!code) { setErr('Enter the class code your teacher gave you.'); return; }
      if (!name) { setErr('Let your teacher know who you are.'); return; }
      var btn = root.querySelector('#joinBtn');
      btn.disabled = true; btn.textContent = 'Checking code…';
      sessionDoc(code).get().then(function (snap) {
        if (!snap.exists) {
          setErr('We couldn’t find that class. Double-check the code with your teacher.');
          btn.disabled = false; btn.textContent = 'Join class';
          return;
        }
        var data = snap.data() || {};
        saveLS(LS_STUDENT, { code: code, className: data.className || '', name: name, ticketId: null });
        renderStudentWait(code, data.className || '', name);
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
  function renderStudentWait(code, className, name) {
    setTopbar('student');
    var root = mount('<div id="waitInner"></div>');
    var inner = root.querySelector('#waitInner');
    var keyHandler = null;
    var myTicketId = null;

    function teardownKeys() {
      if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    }

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
          '<div class="link-row" style="margin-top:28px;"><button id="leaveBtn">Not your class? Switch</button></div>' +
        '</div>';

      var raising = false;
      function doRaise() {
        if (raising) return;
        raising = true;
        var btn = document.getElementById('raiseBtn');
        if (btn) btn.disabled = true;
        queueCol(code).add({ name: name, joinedAt: Date.now(), status: 'waiting' }).then(function (ref) {
          myTicketId = ref.id;
          var saved = loadLS(LS_STUDENT) || {};
          saved.ticketId = ref.id; saved.code = code; saved.name = name; saved.className = className;
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
            '<div class="detail"><div class="k">You&rsquo;re listed as</div><div class="v">' + esc(name) + '</div></div>' +
          '</div>' +
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

      var unsub = queueCol(code).orderBy('joinedAt', 'asc').onSnapshot(function (snap) {
        var idx = -1;
        var mine = null;
        snap.docs.forEach(function (doc, i) {
          if (doc.id === myTicketId) { idx = i; mine = doc; }
        });
        if (idx === -1) {
          // We were removed (helped) or the doc no longer exists.
          renderCalled();
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

    // Watch for the session ending entirely.
    var sessUnsub = sessionDoc(code).onSnapshot(function (snap) {
      if (!snap.exists) {
        showToast('This session has ended.');
        leaveClass();
      }
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
