// The Midnight Manor - Dark Academia & Gothic Medieval Architecture
// 16-Bit Pixel Art Furniture: Grand Central Fireplace, Study Desks, Bookcases, Feast Tables, Suits of Armor, Clocks & Rugs

class ManorRenderer {
  constructor() {
    this.ripples = [];
    this.manorData = null;
    this.rugCanvas = null;
    this.initRugCanvas();
  }

  setManor(data) {
    this.manorData = data;
  }

  // Pre-render ornate Persian / Victorian Gothic crimson rug pattern
  initRugCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    // Rich deep burgundy velvet base
    ctx.fillStyle = '#3a0c16';
    ctx.fillRect(0, 0, 120, 120);

    // Inner dark pattern
    ctx.fillStyle = '#29070f';
    ctx.fillRect(10, 10, 100, 100);

    // Antique Gold Filigree & Diamond Medallions
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 108, 108);

    // Medallion Center
    ctx.fillStyle = '#c49a45';
    ctx.beginPath();
    ctx.moveTo(60, 40); ctx.lineTo(80, 60); ctx.lineTo(60, 80); ctx.lineTo(40, 60); ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#591122';
    ctx.beginPath();
    ctx.arc(60, 60, 10, 0, Math.PI * 2);
    ctx.fill();

    // Corner flourishes
    [ [16, 16], [104, 16], [16, 104], [104, 104] ].forEach(([x, y]) => {
      ctx.fillStyle = '#c49a45';
      ctx.fillRect(x - 3, y - 3, 6, 6);
    });

    this.rugCanvas = canvas;
  }

  addRipple(x, y, type, intensity) {
    this.ripples.push({
      x, y, type, intensity,
      radius: 4,
      maxRadius: type === 'camera_flash' ? 220 : (type === 'creak' ? 150 : 80),
      alpha: 1.0,
      color: type === 'camera_flash' ? '#fff6d6' : (type === 'creak' ? '#d4af37' : (type === 'curse_strike' ? '#8b0000' : '#e0dacf'))
    });
  }

  updateRipples(dt) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 180 * dt;
      r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));
      if (r.radius >= r.maxRadius || r.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  // Draw Dark Academia Manor Floors, Carpets & Architecture
  drawFloor(ctx, camera) {
    if (!this.manorData) return;

    const time = Date.now() * 0.003;

    // 1. Dark Outer Void
    ctx.fillStyle = '#07060a';
    ctx.fillRect(0, 0, this.manorData.width, this.manorData.height);

    // 2. Room Flooring: Dark Herringbone Walnut Wood & Aged Flagstone
    // Foyer (Center: 720..1480, 550..1050) - Ancient Dark Stone Flagstones
    ctx.fillStyle = '#18151e';
    ctx.fillRect(720, 550, 760, 500);

    // Left Wing (Library: 50..720, 50..800) - Polished Dark Mahogany Hardwood
    ctx.fillStyle = '#1e1410';
    ctx.fillRect(50, 50, 670, 750);

    // Left Wing (Alchemist Study: 50..720, 800..1550) - Cold Flagstone
    ctx.fillStyle = '#15141c';
    ctx.fillRect(50, 800, 670, 750);

    // Right Wing (Dining Banquet: 1480..2150, 50..800) - Polished Oak Wood
    ctx.fillStyle = '#221612';
    ctx.fillRect(1480, 50, 670, 750);

    // Right Wing (Conservatory / Archive: 1480..2150, 800..1550) - Weathered Mosaic Tile
    ctx.fillStyle = '#141816';
    ctx.fillRect(1480, 800, 670, 750);

    // Wood Plank Seam Details in Library & Dining
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    for (let y = 60; y < 800; y += 28) {
      // Library planks
      ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(720, y); ctx.stroke();
      // Dining Hall planks
      ctx.beginPath(); ctx.moveTo(1480, y); ctx.lineTo(2150, y); ctx.stroke();
    }

    // 3. Woven Gothic Carpets & Rugs
    // A. Grand Foyer Crimson Velvet Persian Rug (820..1380, 620..980)
    ctx.save();
    ctx.fillStyle = '#420d19';
    ctx.fillRect(820, 610, 560, 380);

    // Antique Gold Woven Border & Fringe
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 4;
    ctx.strokeRect(820, 610, 560, 380);
    ctx.strokeStyle = '#5a1523';
    ctx.lineWidth = 2;
    ctx.strokeRect(832, 622, 536, 356);

    // Corner Ornaments
    ctx.fillStyle = '#c49a45';
    [ [832, 622], [1368, 622], [832, 966], [1368, 966] ].forEach(([rx, ry]) => {
      ctx.fillRect(rx - 6, ry - 6, 12, 12);
    });
    ctx.restore();

    // B. Library Study Rug (North-West: 160..600, 320..420)
    ctx.fillStyle = '#1c2238'; // Dark sapphire velvet runner
    ctx.fillRect(160, 330, 440, 100);
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(160, 330, 440, 100);

    // C. Dining Hall Emerald Banquet Runner (North-East: 1600..2040, 240..380)
    ctx.fillStyle = '#0f291e'; // Deep gothic emerald velvet runner
    ctx.fillRect(1580, 230, 460, 160);
    ctx.strokeStyle = '#b8903b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1580, 230, 460, 160);

    // 4. Gothic Arched Stained Glass Windows along Outer Walls
    this.drawWindows(ctx);

    // 5. Creaky Floorboards
    this.manorData.creakyBoards.forEach(b => {
      ctx.save();
      ctx.fillStyle = 'rgba(196, 154, 69, 0.15)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Plank crack
      ctx.strokeStyle = 'rgba(74, 52, 34, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - b.radius * 0.7, b.y);
      ctx.lineTo(b.x + b.radius * 0.7, b.y);
      ctx.stroke();
      ctx.restore();
    });

    // 6. Draw Detailed Pixel Art Medieval Furniture
    this.drawFurniture(ctx, time);

    // 7. Interactive Hiding Spots (Armoires & Velvet Drapes)
    this.drawHidingSpots(ctx);
  }

  // Draw Gothic Arched Windows casting moonlight
  drawWindows(ctx) {
    const windowPositions = [
      // Top wall windows
      { x: 380, y: 50, w: 90, h: 18, wall: 'top' },
      { x: 1100, y: 50, w: 110, h: 18, wall: 'top' },
      { x: 1820, y: 50, w: 90, h: 18, wall: 'top' },
      // Bottom wall windows
      { x: 380, y: 1540, w: 90, h: 18, wall: 'bottom' },
      { x: 1820, y: 1540, w: 90, h: 18, wall: 'bottom' }
    ];

    windowPositions.forEach(win => {
      ctx.save();
      // Stone Window Frame
      ctx.fillStyle = '#2c2738';
      ctx.fillRect(win.x, win.y, win.w, win.h);
      ctx.strokeStyle = '#4e4663';
      ctx.lineWidth = 2;
      ctx.strokeRect(win.x, win.y, win.w, win.h);

      // Moonlight stained glass panes
      ctx.fillStyle = 'rgba(180, 210, 240, 0.35)';
      ctx.fillRect(win.x + 4, win.y + 3, win.w - 8, win.h - 6);

      // Leaded glass divider mullions
      ctx.strokeStyle = '#1a1624';
      ctx.lineWidth = 1.5;
      for (let mx = win.x + 18; mx < win.x + win.w - 6; mx += 18) {
        ctx.beginPath(); ctx.moveTo(mx, win.y); ctx.lineTo(mx, win.y + win.h); ctx.stroke();
      }

      // Faint Moonlight Pool on floor
      const poolY = win.wall === 'top' ? win.y + 20 : win.y - 45;
      const grad = ctx.createRadialGradient(win.x + win.w / 2, poolY + 15, 5, win.x + win.w / 2, poolY + 15, 60);
      grad.addColorStop(0, 'rgba(190, 220, 255, 0.12)');
      grad.addColorStop(1, 'rgba(190, 220, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(win.x + win.w / 2, poolY + 15, win.w * 0.7, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Heavy Velvet Curtains flanking window
      ctx.fillStyle = '#4a0e1b';
      ctx.fillRect(win.x - 14, win.y - 2, 14, 28);
      ctx.fillRect(win.x + win.w, win.y - 2, 14, 28);
      ctx.fillStyle = '#c49a45'; // Gold tassel
      ctx.fillRect(win.x - 6, win.y + 24, 4, 6);
      ctx.fillRect(win.x + win.w + 2, win.y + 24, 4, 6);

      ctx.restore();
    });
  }

  // Draw 16-Bit Pixel Furniture: Grand Central Fireplace, Study Desks, Feast Tables, Bookcases, Armor
  drawFurniture(ctx, time) {
    // ========================================================
    // 1. THE GRAND CARVED STONE FIREPLACE (CENTER OF THE MANOR!)
    // Located at (1100, 800) in the central foyer
    // ========================================================
    ctx.save();
    const fx = 1000;
    const fy = 720;
    const fw = 200;
    const fh = 140;

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(fx - 6, fy + fh, fw + 12, 14);

    // Carved Gothic Stone Outer Chimney & Hearth
    ctx.fillStyle = '#2a2632'; // Heavy dark stone
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = '#443d52';
    ctx.lineWidth = 3;
    ctx.strokeRect(fx, fy, fw, fh);

    // Stone Brickwork texture
    ctx.strokeStyle = '#181620';
    ctx.lineWidth = 1.5;
    for (let by = fy + 12; by < fy + fh; by += 20) {
      ctx.beginPath(); ctx.moveTo(fx, by); ctx.lineTo(fx + fw, by); ctx.stroke();
    }

    // Top Mantelpiece Shelf
    ctx.fillStyle = '#3c3547';
    ctx.fillRect(fx - 10, fy - 6, fw + 20, 16);
    ctx.strokeStyle = '#c49a45'; // Antique gold trim
    ctx.lineWidth = 2;
    ctx.strokeRect(fx - 10, fy - 6, fw + 20, 16);

    // Props on the Mantelpiece: Antique Clock, Candlesticks, Books
    // Center Clock
    ctx.fillStyle = '#1c1510';
    ctx.fillRect(fx + fw / 2 - 12, fy - 22, 24, 16);
    ctx.fillStyle = '#fff6d6';
    ctx.beginPath(); ctx.arc(fx + fw / 2, fy - 14, 6, 0, Math.PI * 2); ctx.fill();
    // Candlesticks with flickering candles
    [ fx + 16, fx + fw - 24 ].forEach(cx => {
      ctx.fillStyle = '#c49a45';
      ctx.fillRect(cx, fy - 18, 4, 12);
      ctx.fillStyle = '#fce205'; // Flame
      ctx.beginPath(); ctx.arc(cx + 2, fy - 21 + Math.sin(time * 8 + cx) * 1.5, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    // Deep Soot Hearth Cavity
    ctx.fillStyle = '#0a080c';
    ctx.fillRect(fx + 24, fy + 36, fw - 48, fh - 42);
    ctx.strokeStyle = '#1c1724';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx + 24, fy + 36, fw - 48, fh - 42);

    // Wrought-iron Fire Grate
    ctx.strokeStyle = '#383244';
    ctx.lineWidth = 2;
    for (let gx = fx + 36; gx < fx + fw - 36; gx += 14) {
      ctx.beginPath(); ctx.moveTo(gx, fy + fh - 8); ctx.lineTo(gx, fy + fh - 24); ctx.stroke();
    }

    // Charred Wood Logs in Hearth
    ctx.fillStyle = '#221510';
    ctx.fillRect(fx + 44, fy + fh - 26, fw - 88, 14);
    ctx.fillStyle = '#3a2016';
    ctx.fillRect(fx + 52, fy + fh - 32, fw - 104, 10);

    // ANIMATED 16-BIT PIXEL ROARING FIRE!
    const firePhase = Math.floor((Date.now() / 110) % 4);
    const fireColors = ['#ff2a2a', '#ff7a00', '#ffc700', '#fff394'];
    const flameBaseX = fx + fw / 2;
    const flameBaseY = fy + fh - 22;

    // Glowing ember backdrop
    ctx.fillStyle = 'rgba(255, 120, 20, 0.4)';
    ctx.beginPath();
    ctx.arc(flameBaseX, flameBaseY - 12, 34, 0, Math.PI * 2);
    ctx.fill();

    // Layer 1: Crimson Base Flames
    ctx.fillStyle = '#d90429';
    ctx.fillRect(flameBaseX - 32, flameBaseY - 26, 64, 16);
    ctx.fillRect(flameBaseX - 24, flameBaseY - 36 + (firePhase % 2) * 3, 48, 16);

    // Layer 2: Vivid Orange Core
    ctx.fillStyle = '#ff7b00';
    ctx.fillRect(flameBaseX - 22, flameBaseY - 24, 44, 14);
    ctx.fillRect(flameBaseX - 16, flameBaseY - 34 + ((firePhase + 1) % 2) * 3, 32, 14);

    // Layer 3: Brilliant Yellow Heart
    ctx.fillStyle = '#ffff3f';
    ctx.fillRect(flameBaseX - 12, flameBaseY - 20, 24, 12);
    ctx.fillRect(flameBaseX - 8, flameBaseY - 30 + (firePhase % 3) * 2, 16, 12);

    // Drifting rising sparks/embers
    const spark1 = (Date.now() * 0.05) % 24;
    const spark2 = (Date.now() * 0.04 + 10) % 24;
    ctx.fillStyle = '#fff394';
    ctx.fillRect(flameBaseX - 10 + Math.sin(time * 4) * 6, flameBaseY - 36 - spark1, 3, 3);
    ctx.fillRect(flameBaseX + 8 - Math.cos(time * 3) * 6, flameBaseY - 36 - spark2, 3, 3);

    ctx.restore();

    // ========================================================
    // 2. LIBRARY STUDY DESKS & SCHOLAR TABLES (NORTH-WEST)
    // ========================================================
    const desks = [
      { x: 180, y: 230, w: 360, h: 65, label: 'GRIMOIRE STUDY' },
      { x: 180, y: 470, w: 360, h: 65, label: 'ANCIENT ARCHIVE' }
    ];

    desks.forEach(d => {
      ctx.save();
      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(d.x - 2, d.y + d.h, d.w + 4, 8);

      // Carved Dark Oak Desk Top
      ctx.fillStyle = '#261710';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = '#4a3020';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(d.x, d.y, d.w, d.h);

      // Green Leather Inset Writing Surface
      ctx.fillStyle = '#14291e';
      ctx.fillRect(d.x + 12, d.y + 8, d.w - 24, d.h - 16);
      ctx.strokeStyle = '#c49a45';
      ctx.lineWidth = 1;
      ctx.strokeRect(d.x + 12, d.y + 8, d.w - 24, d.h - 16);

      // Scholar Props on Desk: Open Books, Scrolls, Candelabras, Quills
      const count = Math.floor(d.w / 65);
      for (let s = 0; s < count; s++) {
        const sx = d.x + 25 + s * 65;

        // Open Leather Book with white pages
        ctx.fillStyle = '#591b15'; // Leather cover
        ctx.fillRect(sx, d.y + 14, 26, 18);
        ctx.fillStyle = '#f8f4e6'; // Pages
        ctx.fillRect(sx + 2, d.y + 16, 10, 14);
        ctx.fillRect(sx + 14, d.y + 16, 10, 14);
        // Text lines on book
        ctx.fillStyle = '#333';
        ctx.fillRect(sx + 4, d.y + 18, 6, 1);
        ctx.fillRect(sx + 4, d.y + 22, 6, 1);
        ctx.fillRect(sx + 16, d.y + 18, 6, 1);
        ctx.fillRect(sx + 16, d.y + 22, 6, 1);

        // Brass Candelabra with 3 lit candles
        ctx.fillStyle = '#c49a45';
        ctx.fillRect(sx + 34, d.y + 20, 6, 12);
        ctx.fillRect(sx + 30, d.y + 24, 14, 3);
        // Candle flame
        ctx.fillStyle = '#fce205';
        ctx.beginPath();
        ctx.arc(sx + 37, d.y + 17 + Math.sin(time * 6 + s) * 1.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Inkwell & Quill
        ctx.fillStyle = '#111';
        ctx.fillRect(sx + 48, d.y + 24, 4, 6);
        ctx.strokeStyle = '#f8f4e6';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx + 50, d.y + 24); ctx.lineTo(sx + 55, d.y + 14); ctx.stroke();
      }

      // Wooden Study Chairs along Desk
      for (let c = 0; c < count; c++) {
        const cx = d.x + 30 + c * 65;
        // Chair back
        ctx.fillStyle = '#1a0e08';
        ctx.fillRect(cx - 2, d.y + d.h + 2, 20, 8);
        ctx.strokeStyle = '#381f14';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 2, d.y + d.h + 2, 20, 8);
        // Crimson velvet cushion
        ctx.fillStyle = '#591122';
        ctx.fillRect(cx, d.y + d.h + 2, 16, 4);
      }

      ctx.restore();
    });

    // ========================================================
    // 3. TALL GOTHIC BOOKCASES (LIBRARY & ALCHEMIST)
    // ========================================================
    const bookcases = [
      { x: 320, y: 650, w: 160, h: 80 }
    ];

    bookcases.forEach(bc => {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(bc.x - 2, bc.y + bc.h, bc.w + 4, 8);

      // Dark Wood Case
      ctx.fillStyle = '#1c110a';
      ctx.fillRect(bc.x, bc.y, bc.w, bc.h);
      ctx.strokeStyle = '#3d2516';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(bc.x, bc.y, bc.w, bc.h);

      // Shelves packed with multicolored books
      const shelfH = 22;
      const bookColors = ['#8b0000', '#1b4d3e', '#1c39bb', '#58371f', '#d4af37', '#4b0082'];

      for (let sy = bc.y + 8; sy < bc.y + bc.h - 8; sy += shelfH) {
        // Shelf plank
        ctx.fillStyle = '#331d10';
        ctx.fillRect(bc.x + 4, sy + shelfH - 4, bc.w - 8, 4);

        // Books in shelf
        for (let bx = bc.x + 8; bx < bc.x + bc.w - 12; bx += 8) {
          const bColor = bookColors[(bx + sy) % bookColors.length];
          const bH = shelfH - 7 - ((bx * 3) % 4);
          ctx.fillStyle = bColor;
          ctx.fillRect(bx, sy + shelfH - 4 - bH, 6, bH);
          // Gold spine foil
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(bx + 1, sy + shelfH - 4 - bH + 2, 4, 1.5);
        }
      }
      ctx.restore();
    });

    // ========================================================
    // 4. THE MEDIEVAL FEAST BANQUET TABLE (NORTH-EAST DINING)
    // ========================================================
    ctx.save();
    const bx = 1620;
    const by = 250;
    const bw = 380;
    const bh = 100;

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(bx - 4, by + bh, bw + 8, 10);

    // Solid Heavy Carved Oak Dining Table
    ctx.fillStyle = '#2a1a12';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#523422';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    // Cream Linen Table Runner with Gold Border
    ctx.fillStyle = '#f8f4e6';
    ctx.fillRect(bx + 14, by + 12, bw - 28, bh - 24);
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 14, by + 12, bw - 28, bh - 24);

    // Banquet Feast Table Details: Golden Goblets, Silver Candelabras, Platters
    const seatCount = Math.floor(bw / 50);
    for (let p = 0; p < seatCount; p++) {
      const px = bx + 24 + p * 50;

      // Wooden Trencher / Plate
      ctx.fillStyle = '#3a2016';
      ctx.beginPath(); ctx.arc(px, by + bh / 2, 10, 0, Math.PI * 2); ctx.fill();

      // Golden Wine Goblet
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(px + 12, by + bh / 2 - 12, 5, 8);
      ctx.fillRect(px + 10, by + bh / 2 - 4, 9, 2);

      // Silver Candelabra every other place
      if (p % 2 === 0) {
        ctx.fillStyle = '#c0c0c0'; // Silver
        ctx.fillRect(px + 24, by + bh / 2 - 14, 6, 12);
        // Candelabra flame
        ctx.fillStyle = '#fce205';
        ctx.beginPath();
        ctx.arc(px + 27, by + bh / 2 - 17 + Math.sin(time * 6 + p) * 1.5, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // High-Back Gothic Chairs on top & bottom
      // Top Chair
      ctx.fillStyle = '#1c100a';
      ctx.fillRect(px - 10, by - 14, 20, 10);
      ctx.fillStyle = '#8b0000'; // Red velvet cushion
      ctx.fillRect(px - 8, by - 6, 16, 4);

      // Bottom Chair
      ctx.fillStyle = '#1c100a';
      ctx.fillRect(px - 10, by + bh + 4, 20, 10);
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(px - 8, by + bh + 2, 16, 4);
    }
    ctx.restore();

    // Dining Hall Sideboard Buffet Credenza
    ctx.save();
    ctx.fillStyle = '#22150e';
    ctx.fillRect(1620, 480, 380, 60);
    ctx.strokeStyle = '#472d1c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1620, 480, 380, 60);
    // Silver punch bowl & decanters
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(1780, 492, 28, 14);
    ctx.fillRect(1840, 490, 14, 20);
    ctx.restore();

    // ========================================================
    // 5. MEDIEVAL SUITS OF ARMOR (STANDING KNIGHT STATUES)
    // Placed proudly by archways and pillars
    // ========================================================
    const armorStands = [
      { x: 740, y: 520 },
      { x: 1460, y: 520 },
      { x: 740, y: 1080 },
      { x: 1460, y: 1080 }
    ];

    armorStands.forEach(ar => {
      ctx.save();
      ctx.translate(ar.x, ar.y);

      // Stone Plinth Pedestal
      ctx.fillStyle = '#1c1a24';
      ctx.fillRect(-18, 14, 36, 12);
      ctx.strokeStyle = '#383446';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-18, 14, 36, 12);

      // Full Plate Steel Armor Knight
      // Legs / Greaves
      ctx.fillStyle = '#7a7688';
      ctx.fillRect(-10, 2, 8, 14);
      ctx.fillRect(2, 2, 8, 14);

      // Steel Cuirass (Breastplate)
      ctx.fillStyle = '#9e99af';
      ctx.fillRect(-12, -18, 24, 20);
      ctx.fillStyle = '#c5c0d6'; // Breastplate highlight
      ctx.fillRect(-6, -16, 12, 16);

      // Great Helm (Knight Helmet)
      ctx.fillStyle = '#8b869c';
      ctx.fillRect(-10, -32, 20, 14);
      // Dark Eye Visor Slit
      ctx.fillStyle = '#111116';
      ctx.fillRect(-8, -26, 16, 3);
      // Gold Helm Crest
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-4, -36, 8, 4);

      // Halberd / Long Medieval Polearm
      ctx.strokeStyle = '#5a3825'; // Wooden shaft
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(14, 24); ctx.lineTo(14, -42); ctx.stroke();
      // Steel Axe Blade
      ctx.fillStyle = '#c5c0d6';
      ctx.beginPath();
      ctx.moveTo(14, -38); ctx.lineTo(24, -32); ctx.lineTo(14, -26); ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // ========================================================
    // 6. ALCHEMIST LABORATORY WORKBENCHES & POTIONS (SOUTH-WEST)
    // ========================================================
    const alchemistBenches = [
      { x: 180, y: 1040, w: 360, h: 70 },
      { x: 180, y: 1280, w: 360, h: 65 }
    ];

    alchemistBenches.forEach(ab => {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(ab.x - 2, ab.y + ab.h, ab.w + 4, 8);

      // Weathered Stone & Oak Table
      ctx.fillStyle = '#201a18';
      ctx.fillRect(ab.x, ab.y, ab.w, ab.h);
      ctx.strokeStyle = '#42342e';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ab.x, ab.y, ab.w, ab.h);

      // Laboratory Flasks & Alembics (Glass with colored liquids)
      const count = Math.floor(ab.w / 60);
      const potionColors = ['#00f5d4', '#d90429', '#9d4edd', '#fee440', '#70e000'];

      for (let p = 0; p < count; p++) {
        const px = ab.x + 20 + p * 60;
        const color = potionColors[p % potionColors.length];

        // Glass Alembic / Flask
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, ab.y + 24, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f0f4f8';
        ctx.fillRect(px - 2, ab.y + 12, 4, 8); // Neck
        ctx.fillStyle = '#5a3825';
        ctx.fillRect(px - 3, ab.y + 10, 6, 3); // Cork

        // Rolled Parchment Scroll
        ctx.fillStyle = '#e8dcc4';
        ctx.fillRect(px + 14, ab.y + 18, 18, 6);
        ctx.fillStyle = '#8b0000'; // Wax seal
        ctx.fillRect(px + 22, ab.y + 19, 3, 4);

        // Brass Mortar & Pestle
        ctx.fillStyle = '#c49a45';
        ctx.fillRect(px + 36, ab.y + 20, 10, 8);
      }
      ctx.restore();
    });

    // ========================================================
    // 7. CONSERVATORY STONE SARCOPHAGUS & RELICS (SOUTH-EAST)
    // ========================================================
    const relics = [
      { x: 1620, y: 1040, w: 380, h: 70 },
      { x: 1620, y: 1280, w: 380, h: 65 }
    ];

    relics.forEach(rel => {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(rel.x - 2, rel.y + rel.h, rel.w + 4, 8);

      // Weathered Medieval Sarcophagus / Carved Stone Pedestal
      ctx.fillStyle = '#1e1c24';
      ctx.fillRect(rel.x, rel.y, rel.w, rel.h);
      ctx.strokeStyle = '#3e384b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rel.x, rel.y, rel.w, rel.h);

      // Medieval Carved Relief on stone
      ctx.strokeStyle = '#2b2636';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rel.x + 12, rel.y + 10, rel.w - 24, rel.h - 20);

      // Antique Wine Casks / Oak Barrels at ends
      [ rel.x + 30, rel.x + rel.w - 45 ].forEach(bx => {
        ctx.fillStyle = '#3a2416';
        ctx.beginPath(); ctx.ellipse(bx, rel.y + rel.h / 2, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1a0e08';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      ctx.restore();
    });
  }

  // Draw Interactive Hiding Spots: Antique Armoires & Velvet Window Drapes
  drawHidingSpots(ctx) {
    if (!this.manorData || !this.manorData.hidingSpots) return;

    this.manorData.hidingSpots.forEach(spot => {
      ctx.save();
      ctx.translate(spot.x, spot.y);

      if (spot.type === 'wardrobe') {
        // Antique Carved Dark Oak Armoire
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-28, 20, 56, 8);

        ctx.fillStyle = '#26160e';
        ctx.fillRect(-26, -22, 52, 44);
        ctx.strokeStyle = '#4a2c1b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-26, -22, 52, 44);

        // Ornate Door Paneling
        ctx.strokeStyle = '#c49a45';
        ctx.lineWidth = 1;
        ctx.strokeRect(-22, -18, 20, 36);
        ctx.strokeRect(2, -18, 20, 36);

        // Brass Keyhole & Handles
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-4, -2, 2, 5);
        ctx.fillRect(2, -2, 2, 5);

      } else if (spot.type === 'drapes') {
        // Heavy Crushed Velvet Drapes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-30, 18, 60, 6);

        ctx.fillStyle = '#4a0e1b'; // Deep Crimson Velvet
        ctx.fillRect(-28, -20, 56, 40);
        ctx.strokeStyle = '#6e172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-28, -20, 56, 40);

        // Gold Fringed Hem & Tiebacks
        ctx.fillStyle = '#c49a45';
        ctx.fillRect(-28, 18, 56, 3);
        ctx.fillRect(-18, -4, 4, 8);
        ctx.fillRect(14, -4, 4, 8);

      } else if (spot.type === 'clock') {
        // Grandfather Clock in Foyer
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-16, 20, 32, 6);

        ctx.fillStyle = '#1c110a';
        ctx.fillRect(-14, -24, 28, 48);
        ctx.strokeStyle = '#3d2516';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, -24, 28, 48);

        // Roman Clock Face
        ctx.fillStyle = '#f8f4e6';
        ctx.beginPath(); ctx.arc(0, -12, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.fillRect(-1, -15, 2, 4);

        // Swinging Brass Pendulum
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-1, 0, 2, 14);
        ctx.beginPath(); ctx.arc(0, 14, 4, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
    });
  }

  // Draw Medieval Castle & Manor Walls with Flickering Candle Sconces
  drawWalls(ctx) {
    if (!this.manorData) return;

    const time = Date.now() * 0.003;

    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    this.manorData.walls.forEach((w, index) => {
      // 1. Pixel Drop Shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1 + 5);
      ctx.lineTo(w.x2, w.y2 + 5);
      ctx.stroke();

      // 2. Heavy Dark Gothic Stone Base
      ctx.strokeStyle = '#181520';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // 3. Weathered Stone Top Mortar Brick
      ctx.strokeStyle = '#2d273a';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();

      // 4. Subtle Carved Stone Edge Highlight
      ctx.strokeStyle = '#423a54';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1 - 3);
      ctx.lineTo(w.x2, w.y2 - 3);
      ctx.stroke();

      // 5. Wrought-Iron Candle Sconces on Wall Midpoints
      const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
      if (len > 250 && index % 2 === 0) {
        const mx = (w.x1 + w.x2) / 2;
        const my = (w.y1 + w.y2) / 2;

        ctx.save();
        ctx.fillStyle = '#111'; // Iron bracket
        ctx.fillRect(mx - 3, my - 6, 6, 8);
        ctx.fillStyle = '#c49a45'; // Brass socket
        ctx.fillRect(mx - 2, my - 8, 4, 3);
        // Flickering warm candle flame
        ctx.fillStyle = '#fce205';
        ctx.beginPath();
        ctx.arc(mx, my - 11 + Math.sin(time * 6 + index) * 1.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  // Draw Sound Ripples (Visible in Darkness)
  drawRipples(ctx) {
    this.ripples.forEach(r => {
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Draw Dark Midnight Fog Encroachment
  drawEncroachment(ctx, stage) {
    if (!this.manorData || stage === 0) return;

    const pulse = Math.sin(Date.now() * 0.003) * 15;
    ctx.fillStyle = 'rgba(7, 5, 12, 0.94)';

    if (stage >= 1) {
      ctx.fillRect(0, 0, 480 + pulse, this.manorData.height);
      ctx.fillRect(1720 - pulse, 0, 480 + pulse, this.manorData.height);
    }

    if (stage >= 2) {
      ctx.fillRect(0, 0, this.manorData.width, 520 + pulse);
      ctx.fillRect(0, 1080 - pulse, this.manorData.width, 520 + pulse);
    }
  }
}

window.ManorRenderer = ManorRenderer;
