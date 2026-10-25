/* CPU Quest art. Analogy ON: car factory conveyor, a car gets built. OFF: circuit board, Pete walks to the goal chip. */
function cpuStage(level, box, ana) {
  const W = 480, H = 140;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', ana ? 'Pete on a car factory line. The car gets built as you solve challenges, and a jam creeps closer when you miss.' : 'Pete walks across a circuit board toward the goal chip. A bug creeps closer when you miss.');
  box.append(cv);
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let total = 1, prog = 0, hearts = 3, state = 'play', dead = false, raf = 0, flick = 0, last = 0;
  let px = 0, bx = -999, hop = 0;
  const maxH = 3;
  const nodeX = k => 40 + k * (330 / total);
  const nodeY = k => 84 + Math.sin(k * 1.3 + level.n) * 6;
  px = 40;
  function pete(x, y, walking, t, dead_) {
    const bob = walking ? Math.sin(t * 14) * 1.5 : 0, leg = walking ? Math.sin(t * 16) : 0, top = y - 24 + bob;
    ctx.fillStyle = '#2b2440'; ctx.fillRect(x - 5 + leg * 2, top + 16, 4, 8); ctx.fillRect(x + 1 - leg * 2, top + 16, 4, 8);
    ctx.fillStyle = '#ff8a5c'; ctx.fillRect(x - 7, top + 7, 14, 11);
    ctx.fillStyle = '#d9693a'; ctx.fillRect(x - 7, top + 14, 14, 4);
    ctx.fillStyle = '#6fe3ff'; ctx.fillRect(x - 3, top + 9, 6, 5);
    ctx.fillStyle = '#ffcf6b'; ctx.fillRect(x - 6, top - 3, 12, 11);
    ctx.fillStyle = '#17121f'; if (dead_) { ctx.fillRect(x - 4, top + 1, 3, 1); ctx.fillRect(x + 1, top + 1, 3, 1); } else { ctx.fillRect(x - 4, top + 1, 2, 3); ctx.fillRect(x + 2, top + 1, 2, 3); }
    ctx.fillRect(x - 2, top + 5, 4, 1);
  }
  function bug(x, y, t) {
    ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x - 8, y - 9, 16, 9); ctx.fillStyle = '#b3203f'; ctx.fillRect(x - 8, y - 4, 16, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y - 8, 3, 3); ctx.fillRect(x - 5, y - 8, 3, 3);
    ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y - 7, 1, 1); ctx.fillRect(x - 4, y - 7, 1, 1);
    ctx.fillStyle = '#ff4d6d'; const w = Math.sin(t * 20) * 2;
    for (let i = -1; i <= 1; i++) { ctx.fillRect(x + i * 6 - 1, y, 2, 4 + (i === 0 ? 0 : w)); }
    ctx.fillRect(x - 10, y - 12, 2, 5); ctx.fillRect(x + 8, y - 12, 2, 5);
  }
  function car(x, y, parts, t, moving) {
    const p = Math.min(parts, 6);
    if (p >= 1) { ctx.fillStyle = '#9aa7c0'; ctx.fillRect(x, y - 10, 56, 8); }               // chassis
    if (p >= 2) { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + 12, y - 2, 6, 0, 7); ctx.arc(x + 44, y - 2, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#888'; ctx.fillRect(x + 11, y - 3, 2, 2); ctx.fillRect(x + 43, y - 3, 2, 2); }
    if (p >= 3) { ctx.fillStyle = '#c0532a'; ctx.fillRect(x + 4, y - 18, 22, 8); }             // engine / hood
    if (p >= 4) { ctx.fillStyle = '#ffd36b'; ctx.fillRect(x + 26, y - 26, 26, 16); }           // cabin
    if (p >= 5) { ctx.fillStyle = '#7ad0ff'; ctx.fillRect(x + 30, y - 24, 8, 8); ctx.fillRect(x + 40, y - 24, 8, 8); }
    if (p >= 6) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(x + 26, y - 26, 26, 3); ctx.fillRect(x + 4, y - 18, 22, 3); ctx.fillRect(x, y - 10, 56, 3); }
  }

  function draw(ts) {
    const t = ts / 1000, dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    const tx = nodeX(prog), by = nodeY(prog);
    const moving = Math.abs(tx - px) > 1;
    px += (tx - px) * Math.min(1, dt * 5); if (reduce) px = tx;
    const tb = nodeX(prog - hearts) - 14; if (bx < -900) bx = tb; bx += (tb - bx) * Math.min(1, dt * 4); if (reduce) bx = tb;
    // background
    if (ana) {
      ctx.fillStyle = '#1a1d2e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#242844'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, 0, 2, 70);
      ctx.fillStyle = '#ffd36b'; for (let x = 20; x < W; x += 80) ctx.fillRect(x, 6, 30, 4);   // lights
      ctx.fillStyle = '#2f3354'; ctx.fillRect(0, 96, W, 14);                                    // belt
      ctx.fillStyle = '#4a4f78'; const off = (t * (state === 'lose' ? 0 : 30)) % 12; for (let x = -12 + off; x < W; x += 12) ctx.fillRect(x, 100, 6, 2);
      ctx.fillStyle = '#12142a'; ctx.fillRect(0, 110, W, 30);
      for (let k = 0; k <= total; k++) { const x = nodeX(k); ctx.fillStyle = k <= prog ? '#7ef7c1' : '#4a4f78'; ctx.fillRect(x - 4, 112, 8, 8); }
      // station robot arms at nodes
      for (let k = 1; k <= total; k++) { const x = nodeX(k); ctx.fillStyle = k <= prog ? '#ffb454' : '#3a3f66'; ctx.fillRect(x - 2, 30, 4, 28 + (k <= prog ? Math.sin(t * 4 + k) * 3 : 0)); ctx.fillRect(x - 6, 58 + (k <= prog ? Math.sin(t * 4 + k) * 3 : 0), 12, 4); }
      // the car being built sits at the end
      const cx = state === 'win' ? 400 + ((t * 80) % 140) : 400;
      car(cx, 98, state === 'win' ? 6 : prog, t);
      ctx.fillStyle = '#7ef7c1'; ctx.fillRect(386, 40, 3, 30); ctx.fillStyle = '#ffe66d'; ctx.fillRect(389, 40, 14, 8);
    } else {
      ctx.fillStyle = '#0c3b2e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0f4a39'; for (let x = 0; x < W; x += 20) for (let y = 0; y < H; y += 20) ctx.fillRect(x + 9, y + 9, 2, 2);
      ctx.strokeStyle = '#e0b15a'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= total; k++) { const x = nodeX(k), y = nodeY(k); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.lineTo(nodeX(total) + 40, nodeY(total)); ctx.stroke();
      ctx.strokeStyle = '#7ef7c1'; ctx.beginPath(); for (let k = 0; k <= prog; k++) { const x = nodeX(k), y = nodeY(k); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      for (let k = 0; k <= total; k++) { const x = nodeX(k), y = nodeY(k); ctx.fillStyle = k <= prog ? '#7ef7c1' : '#e0b15a'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = '#0c3b2e'; ctx.fillRect(x - 2, y - 2, 4, 4); }
      // goal chip
      const gx = nodeX(total) + 44, gy = nodeY(total);
      ctx.fillStyle = '#20252f'; ctx.fillRect(gx - 8, gy - 22, 52, 44); ctx.fillStyle = '#8fa0b5'; for (let i = 0; i < 5; i++) { ctx.fillRect(gx - 14, gy - 18 + i * 8, 6, 3); ctx.fillRect(gx + 44, gy - 18 + i * 8, 6, 3); }
      ctx.fillStyle = state === 'win' ? '#ffe66d' : '#6fe3ff'; ctx.font = 'bold 11px monospace'; ctx.fillText('CPU', gx + 4, gy + 4);
      ctx.fillStyle = '#ffe66d'; ctx.fillRect(gx + 20, gy - 38, 2, 16); ctx.fillRect(gx + 22, gy - 38, 12, 8 + (state === 'win' ? Math.sin(t * 8) * 2 : 0));
    }
    // characters
    const py = ana ? 98 : nodeY(prog) + 4;
    if (state === 'lose') { pete(px, py + 4, false, t, true); }
    else pete(px, py - (state === 'win' ? Math.abs(Math.sin(t * 8)) * 10 : 0), moving, t, false);
    bug(bx + (state === 'lose' ? 10 : 0), ana ? 100 : nodeY(Math.max(prog - hearts, 0)) + 4, t);
    if (ana) { ctx.fillStyle = '#ff9f5a'; ctx.font = 'bold 9px monospace'; if (hearts < maxH && state !== 'win') ctx.fillText('JAM', Math.max(0, bx - 10), 118); }
    if (flick > 0) { ctx.fillStyle = 'rgba(255,60,80,' + flick * 0.35 + ')'; ctx.fillRect(0, 0, W, H); flick = Math.max(0, flick - 0.05); }
    if (!reduce && !dead) raf = requestAnimationFrame(draw);
  }
  function once() { if (reduce) draw(performance.now()); }
  raf = requestAnimationFrame(draw);
  return {
    setProgress(i, n) { prog = i; total = n; hearts = maxH; once(); },
    good(i, n) { prog = i; total = n; once(); },
    miss(i, n) { prog = i; total = n; once(); },
    bad(h) { hearts = h; flick = 1; once(); },
    advance() {},
    win() { state = 'win'; once(); },
    lose() { state = 'lose'; hearts = 0; once(); },
    destroy() { dead = true; cancelAnimationFrame(raf); },
  };
}
