// Tiny wrapper that gives a <canvas> a fixed low internal resolution and
// scales it up with nearest-neighbor filtering, which is the classic trick
// for a crisp retro-pixel look without shipping sprite image assets.

class PixelCanvas {
  constructor(canvasEl, internalW, internalH) {
    this.canvas = canvasEl;
    this.w = internalW;
    this.h = internalH;
    canvasEl.width = internalW;
    canvasEl.height = internalH;
    canvasEl.style.imageRendering = "pixelated";
    this.ctx = canvasEl.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
  }
}

window.PixelCanvas = PixelCanvas;
