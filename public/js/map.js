// Haunted Manor Floorplan, Room Styling, and Sound Ripple System

class ManorRenderer {
  constructor() {
    this.ripples = [];
    this.manorData = null;
  }

  setManor(data) {
    this.manorData = data;
  }

  addRipple(x, y, type, intensity) {
    this.ripples.push({
      x, y, type, intensity,
      radius: 5,
      maxRadius: type === 'camera_flash' ? 180 : (type === 'creak' ? 140 : 80),
      alpha: 1.0,
      color: type === 'camera_flash' ? '#00f5d4' : (type === 'creak' ? '#ffaa00' : (type === 'curse_strike' ? '#ff0054' : '#e0e1dd'))
    });
  }

  updateRipples(dt) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 200 * dt;
      r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));
      if (r.radius >= r.maxRadius || r.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  // Draw Manor Floor & Architecture
  drawFloor(ctx, camera) {
    if (!this.manorData) return;

    // 1. Manor Outer Foundation / Dark Void
    ctx.fillStyle = '#06050a';
    ctx.fillRect(0, 0, this.manorData.width, this.manorData.height);

    // 2. Room Floor Tile Styling
    // Grand Foyer (Central: 750..1450, 550..1050)
    ctx.fillStyle = '#2a1e17'; // Rich dark mahogany wood
    ctx.fillRect(750, 550, 700, 500);

    // Foyer Center Carpet
    ctx.fillStyle = '#4a1525'; // Victorian velvet crimson rug
    ctx.fillRect(900, 680, 400, 240);
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 3;
    ctx.strokeRect(900, 680, 400, 240);

    // Left Wing: Library (top-left: 50..750, 50..800)
    ctx.fillStyle = '#221915'; // Dark walnut
    ctx.fillRect(50, 50, 700, 750);

    // Left Wing: Cellar (bottom-left: 50..750, 800..1550)
    ctx.fillStyle = '#1c1f24'; // Cold damp stone flagstones
    ctx.fillRect(50, 800, 700, 750);

    // Right Wing: Dining Hall (top-right: 1450..2150, 50..800)
    ctx.fillStyle = '#261b17'; // Polished oak
    ctx.fillRect(1450, 50, 700, 750);

    // Right Wing: Conservatory (bottom-right: 1450..2150, 800..1550)
    ctx.fillStyle = '#1a2421'; // Weathered botanical mosaic tile
    ctx.fillRect(1450, 800, 700, 750);

    // 3. Room Labels on Floor
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.font = 'bold 36px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRAND FOYER', 1100, 800);
    ctx.fillText('LIBRARY', 400, 400);
    ctx.fillText('OLD CELLAR', 400, 1200);
    ctx.fillText('DINING HALL', 1800, 400);
    ctx.fillText('CONSERVATORY', 1800, 1200);

    // 4. Creaky Floorboards
    this.manorData.creakyBoards.forEach(b => {
      ctx.fillStyle = 'rgba(124, 98, 66, 0.25)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Floor plank cracks
      ctx.strokeStyle = 'rgba(60, 45, 30, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x - b.radius * 0.7, b.y);
      ctx.lineTo(b.x + b.radius * 0.7, b.y);
      ctx.stroke();
    });

    // 5. Furniture & Obstacles
    // Dining Table (Center of Dining Hall)
    ctx.fillStyle = '#3a2318';
    ctx.fillRect(1700, 320, 200, 160);
    ctx.strokeStyle = '#5a3826';
    ctx.lineWidth = 3;
    ctx.strokeRect(1700, 320, 200, 160);

    // Bookcases (Library)
    ctx.fillStyle = '#301c13';
    ctx.fillRect(250, 235, 300, 30);
    ctx.fillRect(250, 435, 300, 30);
    ctx.strokeStyle = '#7c6242';
    ctx.strokeRect(250, 235, 300, 30);
    ctx.strokeRect(250, 435, 300, 30);

    // Cellar Barrels
    ctx.fillStyle = '#3a281e';
    [ {x: 200, y: 900}, {x: 260, y: 910}, {x: 220, y: 970} ].forEach(bar => {
      ctx.beginPath();
      ctx.arc(bar.x, bar.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#201610';
      ctx.stroke();
    });

    // 6. Interactive Hiding Spots
    this.manorData.hidingSpots.forEach(spot => {
      ctx.save();
      ctx.translate(spot.x, spot.y);
      if (spot.type === 'wardrobe') {
        // Antique Armoire
        ctx.fillStyle = '#42281d';
        ctx.fillRect(-24, -20, 48, 40);
        ctx.strokeStyle = '#c49a45';
        ctx.lineWidth = 2;
        ctx.strokeRect(-24, -20, 48, 40);
        // Door split
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(0, 20);
        ctx.stroke();
        // Brass handles
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-4, -2, 2, 4);
        ctx.fillRect(2, -2, 2, 4);
      } else {
        // Velvet Drapes
        ctx.fillStyle = '#590d22';
        ctx.fillRect(-28, -12, 56, 24);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-28, -12, 56, 24);
      }
      ctx.restore();
    });
  }

  // Draw Manor Walls
  drawWalls(ctx) {
    if (!this.manorData) return;

    ctx.strokeStyle = '#0f0e14';
    ctx.fillStyle = '#1b1822';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';

    this.manorData.walls.forEach(w => {
      // Wall drop shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1 + 4);
      ctx.lineTo(w.x2, w.y2 + 4);
      ctx.stroke();

      // Main heavy gothic wall
      ctx.strokeStyle = '#25212d';
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // Top trim highlight
      ctx.strokeStyle = '#3e3748';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
      ctx.lineWidth = 18;
    });
  }

  // Draw Sound Ripples (Visible in Darkness)
  drawRipples(ctx) {
    this.ripples.forEach(r => {
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha * 0.85;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Draw The Midnight Encroachment (Dark mist sealing outer wings)
  drawEncroachment(ctx, stage) {
    if (!this.manorData || stage === 0) return;

    const pulse = Math.sin(Date.now() * 0.003) * 15;

    ctx.fillStyle = 'rgba(10, 5, 20, 0.88)';

    if (stage >= 1) {
      // Seal left & right outer perimeters
      ctx.fillRect(0, 0, 450 + pulse, this.manorData.height);
      ctx.fillRect(1750 - pulse, 0, 450 + pulse, this.manorData.height);
    }

    if (stage >= 2) {
      // Seal everything except Grand Foyer
      ctx.fillRect(0, 0, this.manorData.width, 500 + pulse);
      ctx.fillRect(0, 1100 - pulse, this.manorData.width, 500 + pulse);
    }
  }
}

window.ManorRenderer = ManorRenderer;
