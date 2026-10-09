// 2D Fog of War & Directional Flashlight Lighting System

class LightingEngine {
  constructor() {
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  resize(width, height) {
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }

  renderLighting(mainCtx, player, walls, camera, flashActive) {
    const w = this.lightCanvas.width;
    const h = this.lightCanvas.height;

    // Reset lighting buffer
    this.lightCtx.clearRect(0, 0, w, h);

    // If camera flash active, don't shroud in dark fog
    if (flashActive) {
      this.lightCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.lightCtx.fillRect(0, 0, w, h);
      mainCtx.drawImage(this.lightCanvas, 0, 0);
      return;
    }

    // 1. Shroud the world in pitch dark Fog of War
    this.lightCtx.fillStyle = 'rgba(4, 3, 8, 0.94)';
    this.lightCtx.fillRect(0, 0, w, h);

    if (!player) return;

    // Player screen coordinates
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    // 2. Cut out light using 'destination-out'
    this.lightCtx.globalCompositeOperation = 'destination-out';

    // A. Ambient Personal Footstep Glow (360-degree soft circle around feet)
    const ambientGrad = this.lightCtx.createRadialGradient(sx, sy, 5, sx, sy, 70);
    ambientGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    ambientGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    this.lightCtx.fillStyle = ambientGrad;
    this.lightCtx.beginPath();
    this.lightCtx.arc(sx, sy, 70, 0, Math.PI * 2);
    this.lightCtx.fill();

    // B. Directional Flashlight Beam
    const beamAngle = player.angle;
    const beamSpread = Math.PI * 0.38; // ~68 degree beam
    const beamDistance = player.isCursed ? 280 : 340; // chaser has slightly shorter flashlight, more predatory aura

    this.lightCtx.beginPath();
    this.lightCtx.moveTo(sx, sy);
    this.lightCtx.arc(sx, sy, beamDistance, beamAngle - beamSpread / 2, beamAngle + beamSpread / 2);
    this.lightCtx.closePath();

    const beamGrad = this.lightCtx.createRadialGradient(sx, sy, 10, sx, sy, beamDistance);
    beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    beamGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.85)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    this.lightCtx.fillStyle = beamGrad;
    this.lightCtx.fill();

    // Reset composite operation
    this.lightCtx.globalCompositeOperation = 'source-over';

    // 3. Composite dark lighting mask over main game canvas
    mainCtx.drawImage(this.lightCanvas, 0, 0);

    // 4. Subtle Warm Candlelight Glint around the flashlight bulb
    mainCtx.save();
    const bulbGrad = mainCtx.createRadialGradient(sx, sy, 2, sx, sy, 18);
    bulbGrad.addColorStop(0, 'rgba(255, 230, 160, 0.7)');
    bulbGrad.addColorStop(1, 'rgba(255, 200, 100, 0.0)');
    mainCtx.fillStyle = bulbGrad;
    mainCtx.beginPath();
    mainCtx.arc(sx, sy, 18, 0, Math.PI * 2);
    mainCtx.fill();
    mainCtx.restore();
  }
}

window.LightingEngine = LightingEngine;
