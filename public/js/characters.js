// 16-Bit Chibi Pixel Art Character Engine
// Authentic blocky pixel-by-pixel rendering inspired by classic retro arcade games
// Floating animated 8-bit Soul Flame for the cursed chaser!

const PIXEL_SCALE = 3.5; // Scale each retro pixel on screen

// 16x18 Pixel Grid Blueprints for each character
const PIXEL_DATA = {
  nika: {
    name: 'Nika',
    palette: {
      S: '#fcd5b5', // skin
      E: '#111111', // eye
      B: '#3e2617', // dark wavy hair
      T: '#ffffff', // white crop top
      P: '#3a5a78', // denim blue cargo
      F: '#eaeaea', // sneakers
      C: '#222222', // camera body
      c: '#00f5d4', // camera lens cyan glint
      g: '#d4af37'  // camera gold dial
    },
    grid: [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BBSSSSSSBB....",
      "..BBSSSE.EBB....",
      "..BBSSSSSSBB....",
      "...BSSSSSSB.....",
      "...BBTTTTBB.Cg..",
      "..BB.TTTT.B.Cc..",
      "..B..SSSS....C..",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....P..P.......",
      ".....P..P.......",
      "....FF..FF......"
    ]
  },

  marina: {
    name: 'Marina',
    palette: {
      S: '#fcd8b8',
      E: '#111111',
      B: '#4a2f1b', // wavy chestnut hair
      T: '#f8f4e6', // cream knit sweater
      t: '#e2d7c0', // sweater knit detail
      P: '#2b2d42', // dark skirt
      F: '#1b1b1b', // dark boots
      M: '#d94b62'  // smile
    },
    grid: [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BBSSSSSSBB....",
      "..BBSSSE.EBB....",
      "..BBSSSSSSBB....",
      "...BSSMMSSB.....",
      "...BBTtTtBB.....",
      "..BB.TTTT.B.....",
      "..B..TtTt..B....",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....S..S.......",
      ".....S..S.......",
      "....FF..FF......"
    ]
  },

  ella: {
    name: 'Ella',
    palette: {
      S: '#f8d0b0',
      E: '#111111',
      B: '#251912', // straight dark hair
      T: '#4a1525', // burgundy fitted tee
      P: '#1c1c24', // black trousers
      F: '#f0f0f0', // white shoes
      A: '#ffd700'  // gold necklace
    },
    grid: [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BBSSSSSSBB....",
      "..BBSSSE.EBB....",
      "..BBSSSSSSBB....",
      "...BSSSSSSB.....",
      "...BBTTTTBB.....",
      "..B..TATT..B....",
      "..B..TTTT..B....",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....P..P.......",
      ".....P..P.......",
      "....FF..FF......"
    ]
  },

  kjara: {
    name: 'Kjara',
    palette: {
      S: '#fbe2cd',
      E: '#111111',
      G: '#d4af37', // amber round glasses
      B: '#382517', // shaggy wavy brunette
      T: '#15151c', // sheer black gothic lace top
      t: '#2c2c38', // lace detail
      P: '#1a1a24', // dark bottoms
      F: '#0a0a0f'  // boots
    },
    grid: [
      "...BBBBBBBB.....",
      "..BBBBBBBBBB....",
      "..BBSSSSSSBB....",
      "..BGSE.ESGGB....",
      "..BBSSSSSSBB....",
      "...BSSSSSSB.....",
      "...BBTtTtBB.....",
      "..B..TTTT..B....",
      "..B..TtTt..B....",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....P..P.......",
      ".....P..P.......",
      "....FF..FF......"
    ]
  },

  milan: {
    name: 'Milan',
    palette: {
      S: '#edd3be',
      E: '#111111',
      B: '#1c1512', // dark textured crop fade
      T: '#b07d62', // tan plaid
      t: '#7a4b35', // brown plaid line
      P: '#4a5933', // olive green / khaki trousers
      F: '#eaeaea', // sneakers
      D: '#1c1512'  // beard & eyebrow slit detail
    },
    grid: [
      ".....BBBB.......",
      "...BBBBBBBB.....",
      "..BBSSSSSSBB....",
      "..BBSSSE.EDB....",
      "..BBSSSDDSBB....",
      "...BSSSSSSB.....",
      "...BBTtTtBB.....",
      "..B..tTtT..B....",
      "..B..TtTt..B....",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....P..P.......",
      ".....P..P.......",
      "....FF..FF......"
    ]
  },

  bojana: {
    name: 'Bojana',
    palette: {
      S: '#fedac2',
      E: '#111111',
      B: '#5c3a21', // caramel brown hair
      A: '#111111', // sunglasses on head
      a: '#383838', // sunglasses tint
      T: '#ffffff', // white halter top
      P: '#7cb9e8', // light blue denim skirt
      F: '#d4af37'  // sandals
    },
    grid: [
      "...AaAAAAaA.....",
      "...BBBBBBBB.....",
      "..BBSSSSSSBB....",
      "..BBSSSE.EBB....",
      "..BBSSSSSSBB....",
      "...BSSSSSSB.....",
      "...BBTTTTBB.....",
      "..B..TTTT..B....",
      "..B..SSSS..B....",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....S..S.......",
      ".....S..S.......",
      "....FF..FF......"
    ]
  },

  toni: {
    name: 'Toni',
    palette: {
      S: '#f7d6be',
      E: '#111111',
      G: '#1e2022', // dark glasses
      B: '#181412', // dark styled hair
      T: '#ffffff', // white t-shirt
      t: '#2b4c7e', // graphic logo
      P: '#2b2d42', // dark trousers
      F: '#eaeaea', // sneakers
      D: '#181412'  // goatee
    },
    grid: [
      "....BBBBBB......",
      "...BBBBBBBB.....",
      "..BBSSSSSSBB....",
      "..BGSE.ESGGB....",
      "..BBSSSDDSBB....",
      "...BSSSSSSB.....",
      "...BBTTTTBB.....",
      "..B..TtTT..B....",
      "..B..TTTT..B....",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....PPPP.......",
      ".....P..P.......",
      ".....P..P.......",
      "....FF..FF......"
    ]
  }
};

// 4-Frame Animated Retro Pixel Flame Sprite (8x10 pixels)
// R = Red/Magenta tip, O = Orange, Y = Yellow core, . = transparent
const FLAME_FRAMES = [
  [
    "...RR...",
    "..ROOR..",
    ".ROYYOR.",
    ".OYYYYO.",
    "ROYYYYOR",
    "OYYYYYYO",
    "OYYYYYYO",
    ".OYYYYO.",
    "..ROOR..",
    "...RR..."
  ],
  [
    "..R.....",
    "..ROOR..",
    ".ROYYOR.",
    "ROYYYYOR",
    "OYYYYYYO",
    "OYYYYYYO",
    ".OYYYYO.",
    "..OYYO..",
    "...RR...",
    "........"
  ],
  [
    ".....R..",
    "..ROOR..",
    ".ROYYOR.",
    ".OYYYYOR",
    "ROYYYYYO",
    "OYYYYYYO",
    "OYYYYYYO",
    ".OYYYYO.",
    "..ROOR..",
    "...RR..."
  ],
  [
    "...RR...",
    "..ROOR..",
    "ROOYYOR.",
    "OYYYYYYO",
    "OYYYYYYO",
    ".OYYYYO.",
    "..OYYO..",
    "...RR...",
    "........",
    "........"
  ]
];

const FLAME_PALETTE = {
  R: '#ff0054', // Magenta-Crimson
  O: '#ff7b00', // Electric Orange
  Y: '#ffff3f'  // Radiant Lemon Yellow
};

// Render Pixel Art Character Sprites in Game
function drawPlayerSprite(ctx, p, isSelf) {
  const charData = PIXEL_DATA[p.characterId] || PIXEL_DATA.nika;
  const grid = charData.grid;
  const pal = charData.palette;

  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));

  // If player is hiding, faint silhouette only for self
  if (p.isHiding) {
    if (isSelf) {
      ctx.globalAlpha = 0.45;
    } else {
      ctx.restore();
      return;
    }
  } else if (p.isHoldingBreath && (p.inputVx === 0 && p.inputVy === 0) && !p.isCursed && !p.isSpectator) {
    // Shadow Cloak (A11): slightly translucent while stationary in dark corners
    ctx.globalAlpha = isSelf ? 0.45 : 0.25;
  }

  // 1. Neon Floor Ring (Subtle player indicator)
  if (isSelf) {
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 16, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Chunky Pixel Drop Shadow
  ctx.fillStyle = p.isCursed ? 'rgba(255, 0, 84, 0.35)' : 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-18, 22, 36, 6);
  ctx.fillRect(-14, 20, 28, 10);

  // 3. Walking Animation & Direction
  const isMoving = p.inputVx !== 0 || p.inputVy !== 0;
  const walkFrame = isMoving ? Math.floor((Date.now() / 140) % 2) : 0;
  const bobY = isMoving && walkFrame === 1 ? -2 : 0;

  // Horizontal flip if facing left
  const isFacingLeft = Math.cos(p.angle) < 0;
  if (isFacingLeft) {
    ctx.scale(-1, 1);
  }

  // 4. Draw Character Pixel by Pixel
  const pixelSize = PIXEL_SCALE;
  const offsetX = -(grid[0].length * pixelSize) / 2;
  const offsetY = -(grid.length * pixelSize) / 2 + bobY;

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const code = row[c];
      if (code === '.') continue;

      let drawR = r;
      if (isMoving && r >= 13) {
        if (walkFrame === 1) {
          if (c < 8) drawR += 1;
          else drawR -= 1;
        }
      }

      ctx.fillStyle = pal[code] || '#fff';
      ctx.fillRect(
        Math.round(offsetX + c * pixelSize),
        Math.round(offsetY + drawR * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    }
  }

  ctx.restore();

  // 5. THE SOUL FLAME: Floating 8-Bit Pixel Fire Above Cursed Player's Head!
  if (p.isCursed && !p.isSpectator) {
    ctx.save();
    const fireBob = Math.sin(Date.now() * 0.007) * 4;
    ctx.translate(Math.round(p.x), Math.round(p.y) - 52 + fireBob);

    // Frame selection
    const frameIndex = Math.floor((Date.now() / 90) % FLAME_FRAMES.length);
    const flameGrid = FLAME_FRAMES[frameIndex];
    const flamePixel = 3.2;

    const fOffsetX = -(flameGrid[0].length * flamePixel) / 2;
    const fOffsetY = -(flameGrid.length * flamePixel) / 2;

    // Glowing flame backdrop aura
    ctx.fillStyle = 'rgba(255, 0, 84, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw Flame Pixels
    for (let fr = 0; fr < flameGrid.length; fr++) {
      const fRow = flameGrid[fr];
      for (let fc = 0; fc < fRow.length; fc++) {
        const fCode = fRow[fc];
        if (fCode === '.') continue;

        ctx.fillStyle = FLAME_PALETTE[fCode] || '#ff0054';
        ctx.fillRect(
          Math.round(fOffsetX + fc * flamePixel),
          Math.round(fOffsetY + fr * flamePixel),
          Math.ceil(flamePixel),
          Math.ceil(flamePixel)
        );
      }
    }

    // Drifting rising sparks/embers
    const sparkTime = Date.now() * 0.005;
    const spark1Y = -12 - ((sparkTime * 25) % 18);
    const spark1X = Math.sin(sparkTime * 3) * 8;
    const spark2Y = -10 - (((sparkTime + 1) * 20) % 16);
    const spark2X = -Math.cos(sparkTime * 2.5) * 7;

    ctx.fillStyle = '#ffff3f';
    ctx.fillRect(Math.round(spark1X), Math.round(spark1Y), 3, 3);
    ctx.fillStyle = '#ff7b00';
    ctx.fillRect(Math.round(spark2X), Math.round(spark2Y), 3, 3);

    ctx.restore();
  }

  // 6. Minimalist Overhead Name & Sanity
  // Clean, subtle retro font - no clutter boxes
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y) + (p.isCursed ? 32 : -36));
  ctx.textAlign = 'center';

  if (!p.isCursed) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = isSelf ? '#00f5d4' : 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(charData.name, 0, 0);
  }

  // Sanity Health Bar (Only shown if damaged)
  if (p.sanity < 100 && !p.isSpectator) {
    const barY = p.isCursed ? 8 : 4;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(-16, barY, 32, 5);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, barY, 32, 5);

    ctx.fillStyle = p.sanity > 40 ? '#00f5d4' : '#ff0054';
    const fillW = Math.max(0, (p.sanity / 100) * 30);
    ctx.fillRect(-15, barY + 1, fillW, 3);
  }

  ctx.restore();
}

window.CHARACTER_REGISTRY = PIXEL_DATA;
window.drawPlayerSprite = drawPlayerSprite;
