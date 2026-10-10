// 2D Dark Academia Candlelight, Fireplace Hearth Glow & Flashlight Beam

class LightingEngine {
  constructor() {
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  resize(width, height) {
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }

  renderLighting(mainCtx, player, walls, camera, flashActive, arcadeEntities, players) {
    const w = this.lightCanvas.width;
    const h = this.lightCanvas.height;

    // Reset lighting buffer
    this.lightCtx.clearRect(0, 0, w, h);

    // If camera flash active (Nika snapshot), full illumination
    if (flashActive) {
      this.lightCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      this.lightCtx.fillRect(0, 0, w, h);
      mainCtx.drawImage(this.lightCanvas, 0, 0);
      return;
    }

    // 1. Shroud the manor in deep gothic midnight darkness
    this.lightCtx.fillStyle = 'rgba(6, 5, 9, 0.94)';
    this.lightCtx.fillRect(0, 0, w, h);

    // 2. Cut out light using 'destination-out'
    this.lightCtx.globalCompositeOperation = 'destination-out';

    // A. Warm Roaring Fireplace Hearth Light (Center of Manor: 1100, 790)
    const fireScreenX = 1100 - camera.x;
    const fireScreenY = 790 - camera.y;

    if (fireScreenX > -250 && fireScreenX < w + 250 && fireScreenY > -250 && fireScreenY < h + 250) {
      const hearthPulse = Math.sin(Date.now() * 0.007) * 8;
      const hearthRadius = 240 + hearthPulse;
      const hearthGrad = this.lightCtx.createRadialGradient(fireScreenX, fireScreenY, 20, fireScreenX, fireScreenY, hearthRadius);
      hearthGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      hearthGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)');
      hearthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      this.lightCtx.fillStyle = hearthGrad;
      this.lightCtx.beginPath();
      this.lightCtx.arc(fireScreenX, fireScreenY, hearthRadius, 0, Math.PI * 2);
      this.lightCtx.fill();
    }

    // B. Warm Candlelight Points across Manor Desks & Feast Tables
    const candlePoints = [
      { x: 260, y: 260 }, { x: 440, y: 260 },
      { x: 260, y: 500 }, { x: 440, y: 500 },
      { x: 1720, y: 300 }, { x: 1900, y: 300 },
      { x: 1720, y: 510 }, { x: 1900, y: 510 },
      { x: 260, y: 1070 }, { x: 440, y: 1070 },
      { x: 1720, y: 1070 }, { x: 1900, y: 1070 }
    ];

    candlePoints.forEach((cp, idx) => {
      const cx = cp.x - camera.x;
      const cy = cp.y - camera.y;
      if (cx > -80 && cx < w + 80 && cy > -80 && cy < h + 80) {
        const cFlicker = Math.sin(Date.now() * 0.008 + idx) * 4;
        const cRadius = 75 + cFlicker;
        const cGrad = this.lightCtx.createRadialGradient(cx, cy, 8, cx, cy, cRadius);
        cGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        cGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
        cGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

        this.lightCtx.fillStyle = cGrad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(cx, cy, cRadius, 0, Math.PI * 2);
        this.lightCtx.fill();
      }
    });

    // C. Soul Flame Glow for Cursed Chaser
    if (players) {
      players.forEach(p => {
        if (p.isCursed && !p.isSpectator) {
          const px = p.x - camera.x;
          const py = p.y - camera.y;
          const flameGlow = this.lightCtx.createRadialGradient(px, py - 30, 10, px, py - 30, 130);
          flameGlow.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
          flameGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
          flameGlow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

          this.lightCtx.fillStyle = flameGlow;
          this.lightCtx.beginPath();
          this.lightCtx.arc(px, py - 30, 130, 0, Math.PI * 2);
          this.lightCtx.fill();
        }
      });
    }

    // D. Local Player's Vintage Brass Lantern / Flashlight Beam
    if (player) {
      const sx = player.x - camera.x;
      const sy = player.y - camera.y;

      // 360-degree Lantern Footstep Glow
      const ambientGrad = this.lightCtx.createRadialGradient(sx, sy, 5, sx, sy, 85);
      ambientGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      ambientGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.6)');
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      this.lightCtx.fillStyle = ambientGrad;
      this.lightCtx.beginPath();
      this.lightCtx.arc(sx, sy, 85, 0, Math.PI * 2);
      this.lightCtx.fill();

      // Directional Lantern Beam
      const beamAngle = player.angle;
      const beamSpread = Math.PI * 0.42; // ~75 degree beam
      const beamDistance = player.isCursed ? 290 : 350;

      this.lightCtx.beginPath();
      this.lightCtx.moveTo(sx, sy);
      this.lightCtx.arc(sx, sy, beamDistance, beamAngle - beamSpread / 2, beamAngle + beamSpread / 2);
      this.lightCtx.closePath();

      const beamGrad = this.lightCtx.createRadialGradient(sx, sy, 10, sx, sy, beamDistance);
      beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      beamGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.82)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      this.lightCtx.fillStyle = beamGrad;
      this.lightCtx.fill();
    }

    // Reset composite operation
    this.lightCtx.globalCompositeOperation = 'source-over';

    // 3. Composite dark lighting mask onto main game canvas
    mainCtx.drawImage(this.lightCanvas, 0, 0);

    // 4. Subtle Warm Fireplace & Candle Glint on floor
    if (fireScreenX > -250 && fireScreenX < w + 250 && fireScreenY > -250 && fireScreenY < h + 250) {
      mainCtx.save();
      const hearthColorGrad = mainCtx.createRadialGradient(fireScreenX, fireScreenY + 15, 10, fireScreenX, fireScreenY + 15, 140);
      hearthColorGrad.addColorStop(0, 'rgba(255, 140, 30, 0.18)');
      hearthColorGrad.addColorStop(1, 'rgba(255, 100, 20, 0.0)');
      mainCtx.fillStyle = hearthColorGrad;
      mainCtx.beginPath();
      mainCtx.arc(fireScreenX, fireScreenY + 15, 140, 0, Math.PI * 2);
      mainCtx.fill();
      mainCtx.restore();
    }

    // 5. Warm Lantern Glint around player bulb
    if (player) {
      const sx = player.x - camera.x;
      const sy = player.y - camera.y;
      mainCtx.save();
      const bulbGrad = mainCtx.createRadialGradient(sx, sy, 2, sx, sy, 22);
      bulbGrad.addColorStop(0, 'rgba(255, 235, 170, 0.55)');
      bulbGrad.addColorStop(1, 'rgba(255, 200, 100, 0.0)');
      mainCtx.fillStyle = bulbGrad;
      mainCtx.beginPath();
      mainCtx.arc(sx, sy, 22, 0, Math.PI * 2);
      mainCtx.fill();
      mainCtx.restore();
    }
  }
}

window.LightingEngine = LightingEngine;
