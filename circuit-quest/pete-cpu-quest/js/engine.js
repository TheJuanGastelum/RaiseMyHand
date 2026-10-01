// Low-res canvas wrapper, scaled up with nearest-neighbor filtering for a
// crisp retro-pixel look. Same trick used throughout Circuit Quest.
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
