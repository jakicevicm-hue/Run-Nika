// Character Definitions & Custom Top-Down Pixel Sprite Renderers

const CHARACTER_REGISTRY = {
  nika: {
    id: 'nika',
    name: 'Nika',
    title: 'The Photographer',
    trait: 'Camera Flash & Polaroid on Catch',
    portrait: '/assets/portraits/nika.svg',
    hairColor: '#402617', // Dark wavy brown
    shirtColor: '#f4f3f0', // White crop top
    pantsColor: '#3d5a80', // Blue denim cargo jeans
    hasCamera: true,
    hasGlasses: false,
    skinTone: '#fcd5b5'
  },
  marina: {
    id: 'marina',
    name: 'Marina',
    title: 'The Radiant Spirit',
    trait: 'Gothic Soul Flame',
    portrait: '/assets/portraits/marina.svg',
    hairColor: '#4a2f1b', // Long wavy brown
    shirtColor: '#f8f4e6', // Cream white knit sweater
    pantsColor: '#2b2d42', // Dark bottoms
    hasCamera: false,
    hasGlasses: false,
    skinTone: '#fcd8b8'
  },
  ella: {
    id: 'ella',
    name: 'Ella',
    title: 'The Poised Enigma',
    trait: 'Gothic Soul Flame',
    portrait: '/assets/portraits/ella.svg',
    hairColor: '#2c1e14', // Straight dark brunette
    shirtColor: '#4a1525', // Deep burgundy / chocolate crewneck
    pantsColor: '#1e1e24', // Black trousers
    hasGoldNecklace: true,
    hasCamera: false,
    hasGlasses: false,
    skinTone: '#f8d0b0'
  },
  kjara: {
    id: 'kjara',
    name: 'Kjara',
    title: 'The Nocturnal Mystic',
    trait: 'Gothic Soul Flame',
    portrait: '/assets/portraits/kjara.svg',
    hairColor: '#382517', // Shaggy wavy brunette
    shirtColor: '#121217', // Black gothic lace patterned top
    pantsColor: '#1a1a24', // Dark gothic bottoms
    hasGlasses: true,      // Amber round spectacles
    glassesColor: '#d4af37',
    hasCamera: false,
    skinTone: '#fbe2cd'
  },
  milan: {
    id: 'milan',
    name: 'Milan',
    title: 'The Velvet Rogue',
    trait: 'Gothic Soul Flame',
    portrait: '/assets/portraits/milan.svg',
    hairColor: '#1c1512', // Textured dark crop fade
    shirtColor: '#b07d62', // Tan / brown plaid checked shirt
    pantsColor: '#4f5d2f', // Khaki / olive green trousers
    hasBeard: true,
    hasCamera: false,
    hasGlasses: false,
    skinTone: '#edd3be'
  },
  bojana: {
    id: 'bojana',
    name: 'Bojana',
    title: 'The Daring Explorer',
    trait: 'Gothic Soul Flame',
    portrait: '/assets/portraits/bojana.svg',
    hairColor: '#5c3a21', // Caramel brown
    shirtColor: '#ffffff', // White halter top
    pantsColor: '#8ecae6', // Light denim skirt
    hasHeadSunglasses: true,
    hasCamera: false,
    hasGlasses: false,
    skinTone: '#fedac2'
  },
  toni: {
    id: 'toni',
    name: 'Toni',
    title: 'The Keen Strategist',
    trait: 'Gothic Soul Flame',
    portrait: '/assets/portraits/toni.svg',
    hairColor: '#181412', // Styled dark hair with volume
    shirtColor: '#ffffff', // White graphic tee
    pantsColor: '#2b2d42', // Dark bottoms
    hasBeard: true,
    hasGlasses: true,      // Dark framed glasses
    glassesColor: '#1e2022',
    hasCamera: false,
    skinTone: '#f7d6be'
  }
};

// Render Top-Down Pixel Sprites with Character Details
function drawPlayerSprite(ctx, p, isSelf) {
  const char = CHARACTER_REGISTRY[p.characterId] || {
    name: p.name,
    hairColor: '#333',
    shirtColor: '#fff',
    pantsColor: '#444',
    skinTone: '#fcd5b5'
  };

  ctx.save();
  ctx.translate(p.x, p.y);

  // If player is hiding, render as subtle translucent silhouette only if self, else don't render!
  if (p.isHiding) {
    if (isSelf) {
      ctx.globalAlpha = 0.45;
    } else {
      ctx.restore();
      return;
    }
  }

  // 1. Soul-Flame Curse Aura (if cursed chaser)
  if (p.isCursed) {
    const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.15;
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 36 * pulse);
    grad.addColorStop(0, 'rgba(255, 77, 109, 0.8)');
    grad.addColorStop(0.5, 'rgba(230, 20, 60, 0.4)');
    grad.addColorStop(1, 'rgba(150, 0, 30, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 36 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Swirling ethereal embers
    for (let i = 0; i < 4; i++) {
      const emberAngle = (Date.now() * 0.005) + (i * Math.PI / 2);
      const emberDist = 20 + Math.sin(Date.now() * 0.01 + i) * 6;
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(Math.cos(emberAngle) * emberDist, Math.sin(emberAngle) * emberDist, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rotate to player facing angle
  ctx.rotate(p.angle);

  // 2. Drop Shadow under character
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Walking bounce oscillation
  const isMoving = p.inputVx !== 0 || p.inputVy !== 0;
  const walkBob = isMoving ? Math.sin(Date.now() * 0.015) * 2 : 0;

  // 3. Hands & Shoulders
  ctx.fillStyle = char.skinTone;
  // Left hand
  ctx.beginPath();
  ctx.arc(12, -12, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Right hand
  ctx.beginPath();
  ctx.arc(12, 12, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Nika's Signature Vintage Camera in Hand!
  if (char.hasCamera) {
    // Camera body (black/silver retro SLR)
    ctx.fillStyle = '#222';
    ctx.fillRect(10, -7, 9, 14);
    // Silver top plate
    ctx.fillStyle = '#bbb';
    ctx.fillRect(10, -7, 3, 14);
    // Lens
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(16, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Lens reflection glint
    ctx.fillStyle = '#00f5d4';
    ctx.beginPath();
    ctx.arc(16.5, -1, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Torso / Shirt
  ctx.fillStyle = char.shirtColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pattern overlays for specific characters
  if (char.id === 'milan') {
    // Plaid lines
    ctx.strokeStyle = '#8d5b4c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -8); ctx.lineTo(-6, 8);
    ctx.moveTo(4, -8); ctx.lineTo(4, 8);
    ctx.stroke();
  } else if (char.id === 'kjara') {
    // Gothic lace sheer pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(-6, -4, 12, 8);
  } else if (char.hasGoldNecklace) {
    // Ella's gold necklace
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(5, 0, 5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  // 5. Head
  ctx.fillStyle = char.skinTone;
  ctx.beginPath();
  ctx.arc(2, 0, 10 + walkBob * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 6. Hair & Unique Accessories
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.arc(-2, 0, 10, -Math.PI * 0.7, Math.PI * 0.7);
  ctx.fill();

  // Specific hairstyles
  if (char.id === 'nika' || char.id === 'marina') {
    // Long wavy hair flowing behind
    ctx.beginPath();
    ctx.ellipse(-9, -4, 7, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(-9, 4, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (char.id === 'milan' || char.id === 'toni') {
    // Cropped / textured top
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, -Math.PI * 0.8, Math.PI * 0.8);
    ctx.fill();
  }

  // Bojana's Sunglasses on top of head
  if (char.hasHeadSunglasses) {
    ctx.fillStyle = '#111';
    ctx.fillRect(-2, -7, 4, 5);
    ctx.fillRect(-2, 2, 4, 5);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(-2, -7, 4, 14);
  }

  // Glasses (Kjara / Toni)
  if (char.hasGlasses) {
    ctx.strokeStyle = char.glassesColor || '#d4af37';
    ctx.lineWidth = 1.2;
    // Left eye rim
    ctx.strokeRect(6, -6, 5, 4);
    // Right eye rim
    ctx.strokeRect(6, 2, 5, 4);
    // Bridge
    ctx.beginPath();
    ctx.moveTo(7, -2); ctx.lineTo(7, 2);
    ctx.stroke();
  }

  // Beard (Milan / Toni)
  if (char.hasBeard) {
    ctx.fillStyle = char.hairColor;
    ctx.beginPath();
    ctx.arc(8, 0, 4, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
  }

  ctx.restore();

  // 7. Overhead Name & Sanity Badge
  ctx.save();
  ctx.translate(p.x, p.y - 28);
  ctx.textAlign = 'center';

  // Nametag Background
  const displayName = char.name + (p.isCursed ? ' 🔥' : '');
  ctx.font = 'bold 11px Inter, sans-serif';
  const textWidth = ctx.measureText(displayName).width;

  ctx.fillStyle = p.isCursed ? 'rgba(180, 20, 40, 0.85)' : 'rgba(15, 15, 22, 0.75)';
  ctx.beginPath();
  ctx.roundRect(-textWidth / 2 - 6, -10, textWidth + 12, 16, 4);
  ctx.fill();

  ctx.fillStyle = isSelf ? '#ffd166' : '#ffffff';
  ctx.fillText(displayName, 0, 2);

  // Sanity Mini-Bar if damaged
  if (p.sanity < 100 && !p.isSpectator) {
    ctx.fillStyle = '#1a1820';
    ctx.fillRect(-18, 8, 36, 4);
    ctx.fillStyle = p.sanity > 40 ? '#38b000' : '#ef233c';
    ctx.fillRect(-18, 8, (p.sanity / 100) * 36, 4);
  }

  ctx.restore();
}

window.CHARACTER_REGISTRY = CHARACTER_REGISTRY;
window.drawPlayerSprite = drawPlayerSprite;
