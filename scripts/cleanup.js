// Daily cleanup for RaiseMyHand. Stands in for a Firestore TTL policy (which
// needs a billing account) by deleting expired student data with the Admin SDK.
//
// Deletes:
//   - queue entries, questions, and roster entries past their expireAt
//   - queue tickets left flagged "helped"
//   - polls (and their votes) past their expireAt
//   - whole sessions untouched for 75+ days
//   - sessions from before teacher ownership existed (no creatorUid) once
//     they're 2+ days old, since nobody can reopen them any more
//
// DRY_RUN=1 only prints what would be deleted.

const admin = require('firebase-admin');

const DAY = 24 * 60 * 60 * 1000;
const dry = process.env.DRY_RUN === '1';

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});
const db = admin.firestore();

const stats = { sessionsSeen: 0, sessionsDeleted: 0, docsDeleted: 0, pollsDeleted: 0 };

async function removeDocs(snap, label) {
  for (const d of snap.docs) {
    console.log((dry ? '[dry] ' : '') + 'delete ' + label + ' ' + d.ref.path);
    if (!dry) await d.ref.delete();
    stats.docsDeleted++;
  }
}

async function main() {
  const now = Date.now();
  const nowTs = admin.firestore.Timestamp.now();
  const sessions = await db.collection('sessions').get();

  for (const s of sessions.docs) {
    stats.sessionsSeen++;
    const d = s.data();
    const last = d.lastActiveAt || d.createdAt || 0;
    const orphan = !d.creatorUid && now - (d.createdAt || 0) > 2 * DAY;
    const stale = now - last > 75 * DAY;

    if (orphan || stale) {
      console.log((dry ? '[dry] ' : '') + 'delete session ' + s.id + (orphan ? ' (no owner)' : ' (idle 75+ days)'));
      if (!dry) await db.recursiveDelete(s.ref);
      stats.sessionsDeleted++;
      continue;
    }

    for (const name of ['queue', 'questions', 'roster']) {
      await removeDocs(await s.ref.collection(name).where('expireAt', '<', nowTs).get(), name);
    }
    await removeDocs(await s.ref.collection('queue').where('status', '==', 'helped').get(), 'helped ticket');

    const polls = await s.ref.collection('polls').where('expireAt', '<', nowTs).get();
    for (const p of polls.docs) {
      console.log((dry ? '[dry] ' : '') + 'delete poll ' + p.ref.path);
      if (!dry) await db.recursiveDelete(p.ref);
      stats.pollsDeleted++;
    }
  }

  console.log((dry ? 'DRY RUN -- nothing deleted. ' : '') + JSON.stringify(stats));
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
