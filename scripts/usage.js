// Appends one row per day to usage/usage.csv so you can see how close the app
// is to the free-plan limits, and how much it's being used. Aggregate numbers
// only -- no names, no student data.
//
// Firestore/Hosting numbers come from Cloud Monitoring (trailing 24 hours).
// If the service account can't read metrics yet, those cells are left blank
// and the reason is printed in the job log.
//
// Set GITHUB_OUTPUT (done by Actions) to receive alert=true|false.

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { MetricServiceClient } = require('@google-cloud/monitoring');

const DAY_MS = 24 * 60 * 60 * 1000;
const LIMITS = { reads: 50000, writes: 20000, deletes: 20000, hostingMb: 360 };
const ALERT_AT = 0.7;
const CSV = path.join(__dirname, '..', 'usage', 'usage.csv');
const HEADER = [
  'date_utc', 'firestore_reads', 'reads_pct_of_free', 'firestore_writes', 'writes_pct_of_free',
  'firestore_deletes', 'deletes_pct_of_free', 'hosting_mb', 'hosting_pct_of_free',
  'sessions_total', 'sessions_created_24h', 'sessions_active_24h', 'note'
];

const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const projectId = credentials.project_id;
admin.initializeApp({ credential: admin.credential.cert(credentials) });
const db = admin.firestore();
const monitoring = new MetricServiceClient({ credentials, projectId });

const notes = [];

async function metricSum(metricType) {
  const end = Math.floor(Date.now() / 1000);
  const [series] = await monitoring.listTimeSeries({
    name: monitoring.projectPath(projectId),
    filter: 'metric.type="' + metricType + '"',
    interval: { startTime: { seconds: end - 86400 }, endTime: { seconds: end } },
    aggregation: {
      alignmentPeriod: { seconds: 86400 },
      perSeriesAligner: 'ALIGN_SUM',
      crossSeriesReducer: 'REDUCE_SUM'
    },
    view: 'FULL'
  });
  let total = 0;
  for (const s of series) {
    for (const p of s.points) total += Number(p.value.int64Value || p.value.doubleValue || 0);
  }
  return total;
}

async function safeMetric(label, type) {
  try {
    return await metricSum(type);
  } catch (err) {
    const msg = String(err.message || err).split('\n')[0].slice(0, 160);
    console.log('metric ' + label + ' unavailable: ' + msg);
    notes.push(label + ' unavailable');
    return null;
  }
}

async function activity() {
  const cutoff = Date.now() - DAY_MS;
  const sessions = await db.collection('sessions').get();
  let created = 0;
  let active = 0;
  for (const s of sessions.docs) {
    const d = s.data();
    if ((d.createdAt || 0) >= cutoff) created++;
    let isActive = (d.lastActiveAt || 0) >= cutoff;
    if (!isActive) {
      const probes = [['queue', 'joinedAt'], ['questions', 'createdAt'], ['roster', 'joinedAt'], ['polls', 'createdAt']];
      for (const [col, field] of probes) {
        const c = await s.ref.collection(col).where(field, '>=', cutoff).count().get();
        if (c.data().count > 0) { isActive = true; break; }
      }
    }
    if (isActive) active++;
  }
  return { total: sessions.size, created, active };
}

function pct(value, limit) {
  return value === null ? '' : Math.round(value * 1000 / limit) / 10;
}

function csvCell(v) {
  v = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

async function main() {
  const reads = await safeMetric('reads', 'firestore.googleapis.com/document/read_count');
  const writes = await safeMetric('writes', 'firestore.googleapis.com/document/write_count');
  const deletes = await safeMetric('deletes', 'firestore.googleapis.com/document/delete_count');
  const hostBytes = await safeMetric('hosting', 'firebasehosting.googleapis.com/network/sent_bytes_count');
  const hostingMb = hostBytes === null ? null : Math.round(hostBytes / 1048576 * 10) / 10;
  const act = await activity();

  const date = new Date().toISOString().slice(0, 10);
  const row = [
    date, reads, pct(reads, LIMITS.reads), writes, pct(writes, LIMITS.writes),
    deletes, pct(deletes, LIMITS.deletes), hostingMb, pct(hostingMb, LIMITS.hostingMb),
    act.total, act.created, act.active, notes.join('; ')
  ];

  fs.mkdirSync(path.dirname(CSV), { recursive: true });
  let lines = fs.existsSync(CSV) ? fs.readFileSync(CSV, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  if (!lines.length || lines[0] !== HEADER.join(',')) lines = [HEADER.join(',')];
  lines = lines.filter(function (l, i) { return i === 0 || l.slice(0, 10) !== date; });
  lines.push(row.map(csvCell).join(','));
  lines = [lines[0]].concat(lines.slice(1).slice(-400));
  fs.writeFileSync(CSV, lines.join('\n') + '\n');
  console.log(HEADER.join(',') + '\n' + row.map(csvCell).join(','));

  const worst = Math.max.apply(null, [
    reads === null ? 0 : reads / LIMITS.reads,
    writes === null ? 0 : writes / LIMITS.writes,
    deletes === null ? 0 : deletes / LIMITS.deletes,
    hostingMb === null ? 0 : hostingMb / LIMITS.hostingMb
  ]);
  const alert = worst >= ALERT_AT;
  console.log('highest share of a free limit: ' + Math.round(worst * 100) + '% (alert at ' + ALERT_AT * 100 + '%)');
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'alert=' + alert + '\nworst=' + Math.round(worst * 100) + '\n');
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
