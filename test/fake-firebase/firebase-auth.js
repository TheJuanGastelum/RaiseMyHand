export function getAuth(app) {
  return { app: app, currentUser: null, _listeners: [] };
}

export function signInAnonymously(auth) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      auth.currentUser = { uid: 'test-uid' };
      auth._listeners.forEach(function (l) { l(auth.currentUser); });
      resolve({ user: auth.currentUser });
    }, 30);
  });
}

export function onAuthStateChanged(auth, cb) {
  auth._listeners.push(cb);
  if (auth.currentUser) cb(auth.currentUser);
  return function () {
    auth._listeners = auth._listeners.filter(function (l) { return l !== cb; });
  };
}
