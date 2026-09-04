// Minimal stand-in for the pieces of the Firestore modular SDK that
// public/app.js uses, so the real app code can be smoke-tested across
// multiple simulated "devices" (browser tabs) sharing one origin.
// Backed by localStorage + the cross-tab `storage` event so writes in
// one tab are observed by onSnapshot listeners in another, roughly the
// way real Firestore's realtime sync looks from the app's point of view.

var LS_KEY = '__fake_firestore_store__';

function readStore() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { return {}; }
}
function writeStore(store) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

var LOCAL_LISTENERS = {}; // path -> array of fire functions

function notifyLocal(path) {
  (LOCAL_LISTENERS[path] || []).forEach(function (fn) { fn(); });
  var parts = path.split('/');
  if (parts.length > 1) {
    var parentColl = parts.slice(0, -1).join('/');
    (LOCAL_LISTENERS[parentColl] || []).forEach(function (fn) { fn(); });
  }
}

window.addEventListener('storage', function (e) {
  if (e.key !== LS_KEY) return;
  // A cross-tab change: we don't cheaply know which paths moved, so just
  // re-fire every listener currently registered in this tab.
  Object.keys(LOCAL_LISTENERS).forEach(function (path) {
    (LOCAL_LISTENERS[path] || []).forEach(function (fn) { fn(); });
  });
});

function makeDocRef(path) {
  var id = path.split('/').pop();
  return { __type: 'doc', path: path, id: id };
}
function makeCollRef(path) {
  return { __type: 'collection', path: path, _order: null };
}

export function getFirestore(app) { return { app: app }; }

export function doc(firestoreOrRef, pathOrId) {
  if (firestoreOrRef && firestoreOrRef.__type === 'collection') {
    var id = pathOrId || ('auto' + Math.random().toString(36).slice(2, 10));
    return makeDocRef(firestoreOrRef.path + '/' + id);
  }
  return makeDocRef(pathOrId);
}

export function collection(firestoreOrRef, path) {
  if (firestoreOrRef && firestoreOrRef.__type === 'doc') {
    return makeCollRef(firestoreOrRef.path + '/' + path);
  }
  return makeCollRef(path);
}

export function getDoc(ref) {
  var data = readStore()[ref.path];
  return Promise.resolve({
    exists: function () { return data !== undefined; },
    data: function () { return data; },
    id: ref.id
  });
}

export function setDoc(ref, data) {
  var store = readStore();
  store[ref.path] = data;
  writeStore(store);
  notifyLocal(ref.path);
  return Promise.resolve();
}

export function deleteDoc(ref) {
  var store = readStore();
  delete store[ref.path];
  writeStore(store);
  notifyLocal(ref.path);
  return Promise.resolve();
}

export function addDoc(collRef, data) {
  var id = 'auto' + Math.random().toString(36).slice(2, 10);
  var path = collRef.path + '/' + id;
  var store = readStore();
  store[path] = data;
  writeStore(store);
  notifyLocal(path);
  return Promise.resolve(makeDocRef(path));
}

export function orderBy(field, dir) {
  return { __type: 'orderBy', field: field, dir: dir || 'asc' };
}

export function query(collRef) {
  var constraints = Array.prototype.slice.call(arguments, 1);
  var q = { __type: 'collection', path: collRef.path, _order: collRef._order };
  constraints.forEach(function (c) { if (c.__type === 'orderBy') q._order = c; });
  return q;
}

function queryDocs(ref) {
  var store = readStore();
  var prefix = ref.path + '/';
  var docs = Object.keys(store)
    .filter(function (k) { return k.indexOf(prefix) === 0 && k.slice(prefix.length).indexOf('/') === -1; })
    .map(function (k) { return { id: k.slice(prefix.length), data: function () { return store[k]; } }; });
  if (ref._order) {
    var field = ref._order.field, dir = ref._order.dir;
    docs.sort(function (a, b) {
      var av = a.data()[field], bv = b.data()[field];
      return dir === 'desc' ? (bv - av) : (av - bv);
    });
  }
  return docs;
}

export function getDocs(ref) {
  var docs = queryDocs(ref);
  return Promise.resolve({ docs: docs, size: docs.length, empty: docs.length === 0 });
}

export function onSnapshot(ref, onNext) {
  if (ref.__type === 'doc') {
    var fireDoc = function () {
      var data = readStore()[ref.path];
      onNext({ exists: function () { return data !== undefined; }, data: function () { return data; }, id: ref.id });
    };
    LOCAL_LISTENERS[ref.path] = LOCAL_LISTENERS[ref.path] || [];
    LOCAL_LISTENERS[ref.path].push(fireDoc);
    fireDoc();
    return function () { LOCAL_LISTENERS[ref.path] = (LOCAL_LISTENERS[ref.path] || []).filter(function (f) { return f !== fireDoc; }); };
  }
  var fireColl = function () {
    var docs = queryDocs(ref);
    onNext({ docs: docs, size: docs.length, empty: docs.length === 0 });
  };
  LOCAL_LISTENERS[ref.path] = LOCAL_LISTENERS[ref.path] || [];
  LOCAL_LISTENERS[ref.path].push(fireColl);
  fireColl();
  return function () { LOCAL_LISTENERS[ref.path] = (LOCAL_LISTENERS[ref.path] || []).filter(function (f) { return f !== fireColl; }); };
}
