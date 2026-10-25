/* Circuits game art. Analogy ON: water pipes, pump, flywheel, tank. OFF: circuit schematic and a city that lights up. */
function gridStage(level, box, ana) {
  const W = 480, H = 120;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', ana ? 'A pump pushing water around a pipe loop into a tank that fills as you solve challenges' : 'An AC circuit loop feeding a city whose lights come on as you solve challenges');
  box.append(cv);
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let prog = 0, total = 1, flick = 0, state = 'play', raf = 0, dead = false, target = 0, shown = 0;
  const parts = (level.theme && level.theme.parts) || ['R'];
  const phase = ((level.theme && level.theme.phase) || 0) * Math.PI / 180;
  const seed = level.n * 7919;
  const rnd = i => { const x = Math.sin(seed + i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const B = []; for (let i = 0; i < 9; i++) B.push({ x: 292 + i * 20, w: 16 + Math.floor(rnd(i) * 4), h: 30 + Math.floor(rnd(i + 20) * 55) });
  const wins = []; B.forEach((b, bi) => { for (let y = 0; y < b.h - 8; y += 9) for (let x = 3; x < b.w - 3; x += 6) wins.push({ x: b.x + x, y: 112 - b.h + 4 + y }); });
  wins.forEach((w, i) => w.r = rnd(i + 100));
  wins.sort((a, b) => a.r - b.r);
  const P = [[24, 28], [250, 28], [250, 92], [24, 92]], LEN = [226, 64, 226, 64], TOT = 580;
  function at(d) { let s = ((d % 1) + 1) % 1 * TOT, i = 0; while (s > LEN[i]) { s -= LEN[i]; i++; } const a = P[i], b = P[(i + 1) % 4], f = s / LEN[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }

  function draw(ts) {
    const t = (ts || 0) / 1000;
    shown += (target - shown) * 0.08; if (Math.abs(target - shown) < 0.002) shown = target;
    ctx.fillStyle = state === 'lose' ? '#05050c' : '#070815'; ctx.fillRect(0, 0, W, H);
    const col = ana ? '#4aa3ff' : '#6a70c0';
    // loop wires
    ctx.strokeStyle = col; ctx.lineWidth = ana ? 7 : 3;
    ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    if (ana) { ctx.strokeStyle = '#0c2a52'; ctx.lineWidth = 3; ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke(); }
    // source
    const sx = 24, sy = 60;
    if (ana) { ctx.fillStyle = '#16345e'; ctx.fillRect(sx - 14, sy - 16, 28, 32); ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = 3; ctx.strokeRect(sx - 14, sy - 16, 28, 32); const py = sy + Math.sin(t * 5) * 8; ctx.fillStyle = '#9fd0ff'; ctx.fillRect(sx - 10, py - 4, 20, 8); }
    else { ctx.fillStyle = '#070815'; ctx.beginPath(); ctx.arc(sx, sy, 15, 0, 7); ctx.fill(); ctx.strokeStyle = '#7ef7c1'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); for (let x = -8; x <= 8; x++) { const y = Math.sin(x / 8 * Math.PI * 2 - t * 4) * 5; x === -8 ? ctx.moveTo(sx + x, sy + y) : ctx.lineTo(sx + x, sy + y); } ctx.stroke(); }
    // parts along the top
    parts.forEach((p, i) => {
      const x = 70 + i * (170 / Math.max(parts.length, 1)) + (parts.length === 1 ? 40 : 0), y = 28;
      ctx.lineWidth = 3;
      if (p === 'R') { if (ana) { ctx.fillStyle = '#070815'; ctx.fillRect(x - 14, y - 6, 28, 12); ctx.fillStyle = '#6a7a93'; ctx.fillRect(x - 14, y - 9, 28, 3); ctx.fillRect(x - 14, y + 6, 28, 3); ctx.fillStyle = '#4aa3ff'; ctx.fillRect(x - 14, y - 2, 28, 4); } else { ctx.strokeStyle = '#ffe66d'; ctx.fillStyle = '#070815'; ctx.fillRect(x - 16, y - 7, 32, 14); ctx.beginPath(); ctx.moveTo(x - 16, y); for (let k = 0; k < 6; k++) ctx.lineTo(x - 13 + k * 5, y + (k % 2 ? 7 : -7)); ctx.lineTo(x + 16, y); ctx.stroke(); } }
      if (p === 'L') { if (ana) { ctx.fillStyle = '#070815'; ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffb454'; ctx.stroke(); const a = t * 3 + phase; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + k * Math.PI / 2) * 12, y + Math.sin(a + k * Math.PI / 2) * 12); ctx.stroke(); } } else { ctx.strokeStyle = '#ff9f5a'; ctx.fillStyle = '#070815'; ctx.fillRect(x - 16, y - 8, 32, 14); ctx.beginPath(); for (let k = 0; k < 4; k++) ctx.arc(x - 12 + k * 8, y, 4, Math.PI, 0); ctx.stroke(); } }
      if (p === 'C') { if (ana) { ctx.fillStyle = '#070815'; ctx.fillRect(x - 12, y - 14, 24, 28); ctx.strokeStyle = '#7ef7c1'; ctx.strokeRect(x - 12, y - 14, 24, 28); const lvl = 12 + Math.sin(t * 2 + phase) * 6; ctx.fillStyle = '#4aa3ff'; ctx.fillRect(x - 10, y + 12 - lvl, 20, lvl); } else { ctx.strokeStyle = '#7ef7c1'; ctx.fillStyle = '#070815'; ctx.fillRect(x - 10, y - 12, 20, 24); ctx.beginPath(); ctx.moveTo(x - 4, y - 12); ctx.lineTo(x - 4, y + 12); ctx.moveTo(x + 4, y - 12); ctx.lineTo(x + 4, y + 12); ctx.stroke(); } }
    });
    // flowing dots
    const n = 22, spd = (state === 'lose' ? 0 : 0.06 + 0.06 * (prog / total));
    for (let i = 0; i < n; i++) {
      const d = i / n + t * spd; const dir = ana ? 1 : Math.sin(t * 3 + phase);
      const [x, y] = at(ana ? d : (i / n) + Math.sin(t * 1.5) * 0.02 + t * spd * 0.3 * (dir > 0 ? 1 : 1));
      ctx.fillStyle = ana ? '#bfe3ff' : '#7ef7c1'; ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    // right side: tank (analogy) or city (circuit)
    if (ana) {
      const tx = 320, ty = 20, tw = 140, th = 88;
      ctx.fillStyle = '#0a1830'; ctx.fillRect(tx, ty, tw, th); ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = 3; ctx.strokeRect(tx, ty, tw, th);
      const lvl = (th - 6) * shown; ctx.fillStyle = state === 'lose' ? '#1b2540' : '#2c7be5'; ctx.fillRect(tx + 3, ty + th - 3 - lvl, tw - 6, lvl);
      ctx.fillStyle = '#7fc0ff'; for (let x = 0; x < tw - 6; x += 8) { const w = Math.sin(t * 3 + x / 6) * 2; ctx.fillRect(tx + 3 + x, ty + th - 3 - lvl + w, 6, 3); }
      ctx.strokeStyle = '#4aa3ff'; ctx.beginPath(); ctx.moveTo(250, 60); ctx.lineTo(tx, 60); ctx.stroke();
      // mill wheel
      const wx = 300, wy = 60; ctx.strokeStyle = '#ffe66d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy, 10, 0, 7); ctx.stroke(); const a = t * (state === 'lose' ? 0 : 2 + 4 * shown); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a + k * 1.047) * 10, wy + Math.sin(a + k * 1.047) * 10); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#10142a'; B.forEach(b => ctx.fillRect(b.x, 112 - b.h, b.w, b.h));
      const lit = Math.round(wins.length * shown);
      wins.forEach((w, i) => { const on = i < lit && state !== 'lose'; ctx.fillStyle = on ? (flick > 0.3 && i % 3 === 0 ? '#3a3a20' : '#ffe66d') : '#1c2144'; ctx.fillRect(w.x, w.y, 3, 5); });
      ctx.fillStyle = '#10142a'; ctx.fillRect(280, 112, 200, 8);
      ctx.strokeStyle = '#6a70c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(250, 60); ctx.lineTo(286, 60); ctx.lineTo(286, 112); ctx.stroke();
    }
    if (flick > 0) { ctx.fillStyle = 'rgba(255,60,80,' + (flick * 0.35) + ')'; ctx.fillRect(0, 0, W, H); flick = Math.max(0, flick - 0.04); }
    if (state === 'win') { ctx.fillStyle = 'rgba(255,230,109,' + (0.1 + 0.08 * Math.sin(t * 6)) + ')'; ctx.fillRect(0, 0, W, H); }
    if (!reduce && !dead) raf = requestAnimationFrame(draw);
  }
  function once() { if (reduce) { shown = target; draw(0); } }
  raf = requestAnimationFrame(draw);
  return {
    setProgress(i, n) { prog = i; total = n; target = i / n; once(); },
    good(i, n) { prog = i; total = n; target = i / n; once(); },
    miss(i, n) { prog = i; total = n; target = i / n; flick = 1; once(); },
    bad() { flick = 1; once(); },
    advance() {},
    win() { state = 'win'; target = 1; once(); },
    lose() { state = 'lose'; once(); },
    destroy() { dead = true; cancelAnimationFrame(raf); },
  };
}
