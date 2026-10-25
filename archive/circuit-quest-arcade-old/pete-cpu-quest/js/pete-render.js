// Pete — the player's character. Drawn identically everywhere he appears
// (overworld, memory-walk, stack-sim) so he reads as one consistent,
// original character: a small round-headed guy with a chip-shaped badge
// on his chest (nods to "CPU Quest" without being a chip himself).

const Pete = {
  colors: {
    skin: "#ffcf6b",
    body: "#ff8a5c",
    bodyDark: "#d9693a",
    leg: "#2b2440",
    eye: "#17121f",
    chip: "#6fe3ff",
  },

  // x,y = Pete's feet position (ground contact point). scale default 1.
  draw(ctx, x, y, opts) {
    opts = opts || {};
    const walking = !!opts.walking;
    const now = opts.t ?? performance.now();
    const bob = walking ? Math.sin(now / 60) * 1.5 : 0;
    const legPhase = walking ? Math.sin(now / 70) : 0;
    const c = this.colors;
    const top = y - 20 + bob;

    // legs
    ctx.fillStyle = c.leg;
    ctx.fillRect(x - 4 + legPhase * 2, top + 13, 3, 6);
    ctx.fillRect(x + 1 - legPhase * 2, top + 13, 3, 6);

    // body
    ctx.fillStyle = c.body;
    ctx.fillRect(x - 5, top + 6, 10, 9);
    ctx.fillStyle = c.bodyDark;
    ctx.fillRect(x - 5, top + 12, 10, 3);

    // chip badge
    ctx.fillStyle = c.chip;
    ctx.fillRect(x - 2, top + 8, 4, 4);
    ctx.fillStyle = c.bodyDark;
    ctx.fillRect(x - 1, top + 9, 2, 2);

    // head
    ctx.fillStyle = c.skin;
    ctx.fillRect(x - 4, top - 2, 8, 8);
    // eyes
    ctx.fillStyle = c.eye;
    ctx.fillRect(x - 2, top + 1, 1, 1);
    ctx.fillRect(x + 1, top + 1, 1, 1);

    if (opts.label) {
      ctx.fillStyle = "#f4f1f9";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(opts.label, x, top - 6);
      ctx.textAlign = "left";
    }
  },
};

window.Pete = Pete;
