/* Embedded game art. Analogy ON: a smart house whose rooms light up. OFF: a microcontroller chip whose pins and register LEDs power up. */
function mcuStage(level, box, ana) {
  const W = 480, H = 130;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', ana ? 'A smart house whose lamps light up as you solve challenges' : 'A microcontroller chip whose pins and register LEDs power up as you solve challenges');
  box.append(cv);
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let total = 1, prog = 0, shown = 0, state = 'play', flick = 0, dead = false, raf = 0;
  function draw(ts) {
    const t = ts / 1000;
    shown += (prog / total - shown) * 0.1; if (reduce) shown = prog / total;
    ctx.fillStyle = state === 'lose' ? '#05060c' : '#0a0c1c'; ctx.fillRect(0, 0, W, H);
    if (ana) {
      // sky, stars, ground
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 18; i++) ctx.fillRect((i * 97) % W, (i * 41) % 40, 2, 2);
      ctx.fillStyle = '#16301f'; ctx.fillRect(0, 112, W, 18);
      // house body: 3 columns x 2 rows of rooms
      const hx = 120, hy = 34, rw = 80, rh = 38, cols = 3, rows = 2;
      ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.moveTo(hx - 12, hy); ctx.lineTo(hx + cols * rw / 2, hy - 28); ctx.lineTo(hx + cols * rw + 12, hy); ctx.fill();
      const n = cols * rows; const lit = state === 'lose' ? 0 : Math.round(shown * n);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c, x = hx + c * rw, y = hy + r * rh, on = i < lit;
        ctx.fillStyle = on ? (flick > 0.3 && i % 2 ? '#6a5a20' : '#ffd36b') : '#1c2144'; ctx.fillRect(x + 2, y + 2, rw - 4, rh - 4);
        ctx.strokeStyle = '#5a4637'; ctx.lineWidth = 3; ctx.strokeRect(x + 1, y + 1, rw - 2, rh - 2);
        // little lamp / furniture
        ctx.fillStyle = on ? '#fff3c4' : '#2c3260'; ctx.fillRect(x + rw / 2 - 5, y + 8, 10, 8); ctx.fillRect(x + rw / 2 - 1, y + 16, 2, 10);
      }
      // door and doorbell
      ctx.fillStyle = state === 'win' ? '#ffb454' : '#7a4b2a'; ctx.fillRect(hx + rw + rw / 2 - 10, hy + rh + rh - 22, 20, 22);
      ctx.fillStyle = '#ffe66d'; ctx.fillRect(hx + rw + rw / 2 + 12, hy + rh + rh - 12, 3, 3);
      // thermostat blip
      ctx.fillStyle = '#7ef7c1'; ctx.fillRect(hx + cols * rw + 20, 70, 14, 10); ctx.fillStyle = '#0a0c1c'; ctx.font = 'bold 8px monospace'; ctx.fillText(state === 'win' ? '72' : '--', hx + cols * rw + 22, 78);
      if (state === 'win') { ctx.fillStyle = '#ffe66d'; for (let i = 0; i < 8; i++) ctx.fillRect(60 + i * 45 + Math.sin(t * 5 + i) * 3, 12 + Math.abs(Math.cos(t * 3 + i)) * 20, 3, 3); }
    } else {
      // chip body
      const cx = 150, cy = 20, cw = 180, ch = 70;
      ctx.fillStyle = '#1b2030'; ctx.fillRect(cx, cy, cw, ch); ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 3; ctx.strokeRect(cx, cy, cw, ch);
      ctx.fillStyle = '#0a0c1c'; ctx.beginPath(); ctx.arc(cx + 14, cy + 14, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#8ec5ff'; ctx.font = 'bold 12px monospace'; ctx.fillText('MCU', cx + 70, cy + 40);
      const pins = 10, lit = state === 'lose' ? 0 : Math.round(shown * pins * 2);
      for (let i = 0; i < pins; i++) {
        const x = cx + 10 + i * 17;
        [[cy - 10, i], [cy + ch, i + pins]].forEach(([y, idx]) => { const on = idx < lit; ctx.fillStyle = on ? '#ffe66d' : '#5a6488'; ctx.fillRect(x, y, 7, 10); });
      }
      // register LEDs (8) along the bottom
      const ledOn = state === 'lose' ? 0 : Math.round(shown * 8);
      for (let i = 0; i < 8; i++) {
        const x = 130 + i * 28, y = 108; let on = i < ledOn; if (state === 'win') on = Math.sin(t * 8 - i) > -0.2;
        ctx.fillStyle = on ? '#7ef7c1' : '#1c2144'; ctx.fillRect(x, y, 16, 12); ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 16, 12);
        ctx.fillStyle = '#6b7399'; ctx.font = '8px monospace'; ctx.fillText(String(7 - i), x + 5, y + 22 > H ? H - 1 : y + 21);
        ctx.fillStyle = on ? '#7ef7c1' : '#2a3060'; ctx.fillRect(x + 7, cy + ch + 10, 2, y - cy - ch - 10);
      }
      ctx.fillStyle = '#6b7399'; ctx.font = '9px monospace'; ctx.fillText('PORTB', 70, 118);
    }
    if (flick > 0) { ctx.fillStyle = 'rgba(255,60,80,' + flick * 0.35 + ')'; ctx.fillRect(0, 0, W, H); flick = Math.max(0, flick - 0.05); }
    if (!reduce && !dead) raf = requestAnimationFrame(draw);
  }
  function once() { if (reduce) draw(performance.now()); }
  raf = requestAnimationFrame(draw);
  return {
    setProgress(i, n) { prog = i; total = n; once(); },
    good(i, n) { prog = i; total = n; once(); },
    miss(i, n) { prog = i; total = n; once(); },
    bad() { flick = 1; once(); },
    advance() {},
    win() { state = 'win'; prog = total; once(); },
    lose() { state = 'lose'; once(); },
    destroy() { dead = true; cancelAnimationFrame(raf); },
  };
}
