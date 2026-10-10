const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// 7 Character Roster (16-bit Retro Chibi Pixel Art)
const CHARACTERS = {
  nika: { id: 'nika', name: 'Nika', title: 'The Photographer', trait: '📸 Flash Camera Snap', color: '#ff6b8b', image: '/assets/portraits/nika.svg' },
  marina: { id: 'marina', name: 'Marina', title: 'The Radiant Spirit', trait: '🔥 Gothic Soul Flame', color: '#f8d070', image: '/assets/portraits/marina.svg' },
  ella: { id: 'ella', name: 'Ella', title: 'The Poised Enigma', trait: '🖤 Velvet Silhouette', color: '#b56576', image: '/assets/portraits/ella.svg' },
  kjara: { id: 'kjara', name: 'Kjara', title: 'The Nocturnal Mystic', trait: '🔮 Shadow Veil', color: '#9d4edd', image: '/assets/portraits/kjara.svg' },
  milan: { id: 'milan', name: 'Milan', title: 'The Velvet Rogue', trait: '🗡️ Stealth Stride', color: '#e07a5f', image: '/assets/portraits/milan.svg' },
  bojana: { id: 'bojana', name: 'Bojana', title: 'The Daring Explorer', trait: '🧭 Pathfinder Rush', color: '#3a86ff', image: '/assets/portraits/bojana.svg' },
  toni: { id: 'toni', name: 'Toni', title: 'The Keen Strategist', trait: '⚡ Tactical Sprint', color: '#2ec4b6', image: '/assets/portraits/toni.svg' }
};

// Helper function to build rectangular obstacle walls
function boxWalls(x, y, w, h) {
  return [
    { x1: x, y1: y, x2: x + w, y2: y },
    { x1: x + w, y1: y, x2: x + w, y2: y + h },
    { x1: x + w, y1: y + h, x2: x, y2: y + h },
    { x1: x, y1: y + h, x2: x, y2: y }
  ];
}

// Solid Stone Walls (Impenetrable perimeter & archways)
const STONE_WALLS = [
  { x1: 50, y1: 50, x2: 2150, y2: 50 },
  { x1: 2150, y1: 50, x2: 2150, y2: 1550 },
  { x1: 2150, y1: 1550, x2: 50, y2: 1550 },
  { x1: 50, y1: 1550, x2: 50, y2: 50 },

  // Central Hearth Foyer Partitions & Archways (720..1480, 550..1050)
  { x1: 720, y1: 550, x2: 960, y2: 550 },
  { x1: 1240, y1: 550, x2: 1480, y2: 550 },
  { x1: 720, y1: 1050, x2: 960, y2: 1050 },
  { x1: 1240, y1: 1050, x2: 1480, y2: 1050 },

  // Left Wing (Library & Alchemist Study) Main Stone Archway Dividers
  { x1: 720, y1: 50, x2: 720, y2: 430 },
  { x1: 720, y1: 670, x2: 720, y2: 930 },
  { x1: 720, y1: 1170, x2: 720, y2: 1550 },
  { x1: 50, y1: 800, x2: 580, y2: 800 },

  // Right Wing (Banquet Hall & Conservatory) Main Stone Archway Dividers
  { x1: 1480, y1: 50, x2: 1480, y2: 430 },
  { x1: 1480, y1: 670, x2: 1480, y2: 930 },
  { x1: 1480, y1: 1170, x2: 1480, y2: 1550 },
  { x1: 1620, y1: 800, x2: 2150, y2: 800 },

  // THE GRAND CENTRAL FIREPLACE (Center of Manor: 1000..1200, 720..860)
  ...boxWalls(1000, 720, 200, 140),

  // Tall Gothic Bookcase & Heavy Armor Plinths
  ...boxWalls(320, 650, 160, 80),
  ...boxWalls(725, 505, 30, 30),
  ...boxWalls(1445, 505, 30, 30),
  ...boxWalls(725, 1065, 30, 30),
  ...boxWalls(1445, 1065, 30, 30)
];

// Low Furniture Obstacles (Blocks normal walking, but players can vault over them with Dash!)
const LOW_OBSTACLES = [
  ...boxWalls(180, 230, 360, 65),   // Library Study Desk 1 (Books & Quills)
  ...boxWalls(180, 470, 360, 65),   // Library Study Desk 2
  ...boxWalls(1620, 250, 380, 100),  // Grand Feast Banquet Table (Goblets & Platters)
  ...boxWalls(1620, 480, 380, 60),   // Dining Credenza Buffet
  ...boxWalls(180, 1040, 360, 70),   // Alchemy Workbench 1 (Flasks & Potions)
  ...boxWalls(180, 1280, 360, 65),   // Alchemy Workbench 2 (Scrolls & Alembics)
  ...boxWalls(1620, 1040, 380, 70),  // Stone Sarcophagus & Pedestals
  ...boxWalls(1620, 1280, 380, 65)   // Relic Showcase & Oak Wine Barrels
];

// Haunted Retro Arcade Geometry, Cabinets & Obstacles
const ARCADE_MAP = {
  width: 2200,
  height: 1600,
  stoneWalls: STONE_WALLS,
  lowObstacles: LOW_OBSTACLES,
  walls: [...STONE_WALLS, ...LOW_OBSTACLES],

  // Creaky wooden floorboards that ping noise
  creakyBoards: [
    { x: 720, y: 550, radius: 45 },
    { x: 1480, y: 550, radius: 45 },
    { x: 720, y: 1050, radius: 45 },
    { x: 1480, y: 1050, radius: 45 },
    { x: 380, y: 800, radius: 50 },
    { x: 1820, y: 800, radius: 50 },
    { x: 1100, y: 620, radius: 60 }
  ],

  // Interactive Hiding Spots (Antique Armoires, Velvet Drapes, Clock)
  hidingSpots: [
    { id: 'h1', x: 140, y: 140, type: 'wardrobe', label: 'Vintage Armoire' },
    { id: 'h2', x: 2060, y: 140, type: 'wardrobe', label: 'Grand Armoire' },
    { id: 'h3', x: 140, y: 1460, type: 'drapes', label: 'Heavy Velvet Drapes' },
    { id: 'h4', x: 2060, y: 1460, type: 'drapes', label: 'Gothic Velvet Drapes' },
    { id: 'h5', x: 1100, y: 580, type: 'clock', label: 'Grandfather Clock' },
    { id: 'h6', x: 1100, y: 1460, type: 'wardrobe', label: 'Cellar Cabinet' }
  ],

  spawnPoints: [
    { x: 1100, y: 920 }, // Foyer hearth south
    { x: 420, y: 380 },  // Library Study
    { x: 420, y: 1180 }, // Alchemist Lab
    { x: 1780, y: 380 }, // Banquet Hall
    { x: 1780, y: 1180 },// Conservatory
    { x: 900, y: 680 },  // Foyer West
    { x: 1300, y: 680 }  // Foyer East
  ]
};

// Game State
let room = {
  status: 'LOBBY', // 'LOBBY', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
  hostId: null,
  players: new Map(),
  cursedPlayerId: null,
  gracePeriodUntil: 0,
  countdownSeconds: 3,
  gameTime: 0,
  encroachmentStage: 0,
  winner: null,
  recentCaptures: []
};

let nextPlayerNumber = 1;

function getPublicState() {
  const playersList = [];
  room.players.forEach(p => {
    playersList.push({
      id: p.id,
      number: p.number,
      characterId: p.characterId,
      name: p.character ? p.character.name : `Guest ${p.number}`,
      x: Math.round(p.x),
      y: Math.round(p.y),
      angle: p.angle,
      sanity: Math.max(0, Math.round(p.sanity)),
      stamina: Math.round(p.stamina),
      isCursed: p.id === room.cursedPlayerId,
      isExhausted: p.isExhausted,
      isHoldingBreath: p.isHoldingBreath,
      isHiding: p.isHiding,
      hidingSpotId: p.hidingSpotId,
      isDashing: p.isDashing,
      dashCharges: p.dashCharges !== undefined ? p.dashCharges : 2,
      hidingTimeLeft: p.isHiding ? Math.max(0, Math.ceil(p.hidingTimer || 0)) : 0,
      isSpectator: p.isSpectator,
      isHost: p.id === room.hostId
    });
  });

  return {
    status: room.status,
    hostId: room.hostId,
    cursedPlayerId: room.cursedPlayerId,
    gracePeriod: Math.max(0, room.gracePeriodUntil - Date.now()),
    countdown: room.countdownSeconds,
    gameTime: Math.floor(room.gameTime),
    encroachmentStage: room.encroachmentStage,
    winner: room.winner,
    players: playersList,
    recentCaptures: room.recentCaptures.slice(-5)
  };
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastEvent(type, payload) {
  broadcast({ type: 'event', event: type, payload });
}

// Distance helper
function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Circle to line segment collision helper
function pointLineDist(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Wall and obstacle collision solver (allows vaulting low furniture during dash!)
function resolveWallCollisions(player, isVaulting = false) {
  const radius = 22;
  const activeWalls = isVaulting ? ARCADE_MAP.stoneWalls : ARCADE_MAP.walls;
  activeWalls.forEach(w => {
    const dist = pointLineDist(player.x, player.y, w.x1, w.y1, w.x2, w.y2);
    if (dist < radius && dist > 0.001) {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        // Normal pointing from segment toward player
        const t = Math.max(0, Math.min(1, ((player.x - w.x1) * dx + (player.y - w.y1) * dy) / (len * len)));
        const closestX = w.x1 + t * dx;
        const closestY = w.y1 + t * dy;
        const pushX = player.x - closestX;
        const pushY = player.y - closestY;
        const pushDist = Math.hypot(pushX, pushY) || 1;
        const overlap = radius - dist;
        player.x += (pushX / pushDist) * overlap;
        player.y += (pushY / pushDist) * overlap;
      }
    }
  });

  // Clamp inside arena bounds
  player.x = Math.max(80, Math.min(ARCADE_MAP.width - 80, player.x));
  player.y = Math.max(80, Math.min(ARCADE_MAP.height - 80, player.y));
}

// Player-to-player collision (soft separation, radius 20 each = 40 min distance)
function resolvePlayerCollisions() {
  const activePlayers = Array.from(room.players.values()).filter(p => !p.isSpectator && !p.isHiding);
  const playerRadius = 20;

  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const p1 = activePlayers[i];
      const p2 = activePlayers[j];
      const dist = getDistance(p1.x, p1.y, p2.x, p2.y);
      const minDist = playerRadius * 2; // 40

      if (dist < minDist && dist > 0) {
        const overlap = (minDist - dist) * 0.5;
        const nx = (p2.x - p1.x) / dist;
        const ny = (p2.y - p1.y) / dist;

        p1.x -= nx * overlap;
        p1.y -= ny * overlap;
        p2.x += nx * overlap;
        p2.y += ny * overlap;
      }
    }
  }
}

// Start Game Flow
function startCountdown() {
  if (room.players.size < 2) return;
  room.status = 'COUNTDOWN';
  room.countdownSeconds = 3;
  room.winner = null;
  room.recentCaptures = [];
  room.encroachmentStage = 0;
  room.gameTime = 0;

  // Auto-assign any players who haven't selected a character yet
  const allCharIds = ['nika', 'marina', 'ella', 'kjara', 'milan', 'bojana', 'toni'];
  const takenCharIds = new Set();
  room.players.forEach(p => { if (p.characterId) takenCharIds.add(p.characterId); });
  const openChars = allCharIds.filter(id => !takenCharIds.has(id));

  const spawnIdxs = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
  let idx = 0;
  room.players.forEach(p => {
    if (!p.characterId) {
      const charId = openChars.shift() || 'nika';
      p.characterId = charId;
      p.character = CHARACTERS[charId];
      takenCharIds.add(charId);
    }
    const sp = ARCADE_MAP.spawnPoints[spawnIdxs[idx % ARCADE_MAP.spawnPoints.length]];
    p.x = sp.x;
    p.y = sp.y;
    p.sanity = 100;
    p.stamina = 100;
    p.dashCharges = 2;
    p.dashRechargeTimer = 0;
    p.hidingTimer = 0;
    p.isExhausted = false;
    p.isHoldingBreath = false;
    p.isHiding = false;
    p.hidingSpotId = null;
    p.isSpectator = false;
    idx++;
  });

  broadcast({ type: 'state', state: getPublicState() });
  broadcastEvent('countdown_start', { count: room.countdownSeconds });

  const countdownInterval = setInterval(() => {
    room.countdownSeconds--;
    if (room.countdownSeconds > 0) {
      broadcastEvent('countdown_tick', { count: room.countdownSeconds });
    } else {
      clearInterval(countdownInterval);
      launchMatch();
    }
    broadcast({ type: 'state', state: getPublicState() });
  }, 1000);
}

function launchMatch() {
  room.status = 'PLAYING';
  const eligible = Array.from(room.players.values()).filter(p => !p.isSpectator);
  const starter = eligible[Math.floor(Math.random() * eligible.length)];
  room.cursedPlayerId = starter ? starter.id : null;
  room.gracePeriodUntil = Date.now() + 1500; // 1.5s initial scatter grace

  broadcastEvent('game_started', {
    cursedPlayerId: room.cursedPlayerId,
    cursedPlayerName: starter ? (starter.character ? starter.character.name : 'Unknown') : ''
  });
}

// Tag Execution (Reliable Curse Transfer)
function executeTag(hunter, victim) {
  // Hunter passes the curse to victim!
  room.cursedPlayerId = victim.id;
  room.gracePeriodUntil = Date.now() + 1500; // 1.5s freeze grace for newly cursed

  const victimName = victim.character ? victim.character.name : `Player ${victim.number}`;
  const hunterName = hunter.character ? hunter.character.name : `Player ${hunter.number}`;

  // Check if Hunter is Nika (Camera Snapshot Trait!)
  const isNika = hunter.characterId === 'nika';

  const captureRecord = {
    id: Date.now(),
    hunterId: hunter.id,
    hunterName: hunterName,
    hunterCharacter: hunter.characterId,
    victimId: victim.id,
    victimName: victimName,
    victimCharacter: victim.characterId,
    victimImage: victim.character ? victim.character.image : null,
    isNikaPhoto: isNika,
    time: Math.floor(room.gameTime)
  };

  room.recentCaptures.push(captureRecord);

  // Broadcast Tag Event
  broadcastEvent('player_tagged', {
    hunter: hunterName,
    hunterId: hunter.id,
    hunterCharacter: hunter.characterId,
    victim: victimName,
    victimId: victim.id,
    victimCharacter: victim.characterId,
    victimImage: victim.character ? victim.character.image : null,
    isNikaPhoto: isNika
  });

  // Sound & Visual Ping at tag location
  broadcastEvent('sound_ripple', {
    x: victim.x,
    y: victim.y,
    type: isNika ? 'camera_flash' : 'curse_strike',
    intensity: 1.0
  });
}

// Return room back to Character Selection Lobby
function resetToLobby() {
  room.status = 'LOBBY';
  room.cursedPlayerId = null;
  room.gracePeriodUntil = 0;
  room.countdownSeconds = 3;
  room.gameTime = 0;
  room.encroachmentStage = 0;
  room.winner = null;
  room.recentCaptures = [];

  room.players.forEach(p => {
    p.sanity = 100;
    p.stamina = 100;
    p.isSpectator = false;
    p.isHiding = false;
    p.hidingSpotId = null;
    p.isDashing = false;
    p.isExhausted = false;
    p.isHoldingBreath = false;
  });

  if (room.players.size > 0) {
    room.hostId = room.players.keys().next().value;
  } else {
    room.hostId = null;
  }

  broadcast({ type: 'state', state: getPublicState() });
  broadcastEvent('return_to_lobby', {});
}

// Check Win Condition
function checkWinCondition() {
  const survivors = Array.from(room.players.values()).filter(p => !p.isSpectator && p.sanity > 0);
  if (survivors.length === 1 && room.status === 'PLAYING') {
    room.status = 'GAME_OVER';
    room.winner = {
      id: survivors[0].id,
      name: survivors[0].character ? survivors[0].character.name : `Player ${survivors[0].number}`,
      characterId: survivors[0].characterId,
      image: survivors[0].character ? survivors[0].character.image : null
    };

    broadcastEvent('game_over', { winner: room.winner });
    broadcast({ type: 'state', state: getPublicState() });

    // Automatically return to Character Selection Lobby after 6 seconds!
    setTimeout(() => {
      if (room.status === 'GAME_OVER') {
        resetToLobby();
      }
    }, 6000);
  } else if (survivors.length === 0 && room.status === 'PLAYING') {
    room.status = 'GAME_OVER';
    room.winner = { name: 'The Midnight Fog', characterId: null };
    broadcastEvent('game_over', { winner: room.winner });
    broadcast({ type: 'state', state: getPublicState() });

    setTimeout(() => {
      if (room.status === 'GAME_OVER') {
        resetToLobby();
      }
    }, 6000);
  }
}

// Main 30 Hz Game Loop
const TICK_RATE = 30;
const DT = 1 / TICK_RATE;

setInterval(() => {
  if (room.status !== 'PLAYING') return;

  room.gameTime += DT;

  // Midnight Fog Encroachment (A20: starts after 120 seconds, funnels survivors to the center fireplace)
  if (room.gameTime > 120) {
    room.encroachmentStage = Math.min(1.0, (room.gameTime - 120) / 60);
    if (room.gameTime > 120 && room.gameTime - DT <= 120) {
      broadcastEvent('encroachment_alert', { stage: 1 });
    }
  }

  const now = Date.now();
  const inGracePeriod = now < room.gracePeriodUntil;

  // Process each player
  room.players.forEach(p => {
    if (p.isSpectator) return;

    const isCursed = p.id === room.cursedPlayerId;

    // Sanity Drain for Cursed Player (A3: 30 seconds total soul flame burn)
    if (isCursed && !inGracePeriod) {
      p.sanity -= 3.33 * DT;
      if (p.sanity <= 0) {
        p.sanity = 0;
        p.isSpectator = true;
        broadcastEvent('player_eliminated', {
          name: p.character ? p.character.name : `Player ${p.number}`,
          characterId: p.characterId
        });

        // Pass curse immediately to a random living survivor with a 2-second scatter countdown (A1)
        const remaining = Array.from(room.players.values()).filter(rem => !rem.isSpectator && rem.sanity > 0);
        if (remaining.length > 0) {
          const next = remaining[Math.floor(Math.random() * remaining.length)];
          room.cursedPlayerId = next.id;
          room.gracePeriodUntil = Date.now() + 2000; // 2s scatter countdown
          broadcastEvent('scatter_countdown', {
            count: 2,
            nextPlayer: next.character ? next.character.name : `Player ${next.number}`
          });
        }

        checkWinCondition();
        return;
      }
    }

    // Central Fireplace Hearth warmth (A13): slowly restores sanity for living survivors standing near it
    if (!isCursed && !p.isSpectator && !p.isHiding) {
      const distToHearth = getDistance(p.x, p.y, 1100, 790);
      if (distToHearth < 170 && p.sanity < 100) {
        p.sanity = Math.min(100, p.sanity + 3.0 * DT);
      }
    }

    // Outer fog chills sanity if lingering in outer rooms after 2 minutes (A20)
    if (room.gameTime > 120 && !p.isSpectator && !isCursed && (p.x < 320 || p.x > 1880 || p.y < 260 || p.y > 1340)) {
      p.sanity = Math.max(0, p.sanity - 1.8 * DT);
    }

    // Hiding spot maximum 8-second limit (A10)
    if (p.isHiding) {
      p.hidingTimer = (p.hidingTimer || 8.0) - DT;
      if (p.hidingTimer <= 0) {
        p.isHiding = false;
        p.hidingSpotId = null;
        p.hidingTimer = 0;
        broadcastEvent('sound_ripple', { x: p.x, y: p.y, type: 'gasp', intensity: 0.8 });
      }
    }

    // Dash charge recovery (A8: 2 charges max, 1 charge restored every 5s)
    p.dashCharges = p.dashCharges !== undefined ? p.dashCharges : 2;
    if (p.dashCharges < 2) {
      p.dashRechargeTimer = (p.dashRechargeTimer || 0) + DT;
      if (p.dashRechargeTimer >= 5.0) {
        p.dashCharges++;
        p.dashRechargeTimer = 0;
      }
    }

    // Stamina & Exhaustion Management (A7)
    if (p.isDashing) {
      p.dashTimer -= DT;
      if (p.dashTimer <= 0) p.isDashing = false;
    }

    if (p.isHoldingBreath) {
      p.stamina = Math.max(0, p.stamina - 18 * DT);
      if (p.stamina === 0) {
        p.isHoldingBreath = false;
        p.isExhausted = true;
        p.exhaustionTimer = 2.0;
        broadcastEvent('sound_ripple', { x: p.x, y: p.y, type: 'gasp', intensity: 0.8 });
      }
    } else if (p.isSprinting && (p.inputVx !== 0 || p.inputVy !== 0)) {
      p.stamina = Math.max(0, p.stamina - 20 * DT);
      if (p.stamina === 0) {
        p.isSprinting = false;
        p.isExhausted = true;
        p.exhaustionTimer = 2.2;
        broadcastEvent('sound_ripple', { x: p.x, y: p.y, type: 'gasp', intensity: 0.9 });
      }
    } else {
      // Regenerate stamina (A7: 4s to full recovery)
      p.stamina = Math.min(100, p.stamina + 25 * DT);
    }

    if (p.isExhausted) {
      p.exhaustionTimer -= DT;
      if (p.exhaustionTimer <= 0) p.isExhausted = false;
    }

    // Movement speeds (A5: +15% speed increase across the board)
    let baseSpeed = 184; // was 160
    if (isCursed) baseSpeed = 213; // was 185 (+15% Chaser's Rush)

    if (p.isDashing) {
      baseSpeed = 390; // was 340
    } else if (p.isExhausted) {
      baseSpeed = 105; // was 90
    } else if (p.isHoldingBreath) {
      baseSpeed = 115; // was 100 (Silent stealth crawl)
    } else if (p.isHiding) {
      baseSpeed = 0;
    } else if (p.isSprinting) {
      baseSpeed = 282; // was 245
      p.stepSoundTimer = (p.stepSoundTimer || 0) + DT;
      if (p.stepSoundTimer > 0.28) {
        p.stepSoundTimer = 0;
        broadcastEvent('sound_ripple', { x: p.x, y: p.y, type: 'sprint_step', intensity: 0.6 });
      }
    }

    // Freeze newly cursed player during grace period
    if (isCursed && inGracePeriod) {
      baseSpeed = 0;
    }

    // Apply movement if not hiding
    if (!p.isHiding && (p.inputVx !== 0 || p.inputVy !== 0)) {
      const len = Math.hypot(p.inputVx, p.inputVy) || 1;
      const vx = (p.inputVx / len) * baseSpeed;
      const vy = (p.inputVy / len) * baseSpeed;

      p.x += vx * DT;
      p.y += vy * DT;
      p.angle = Math.atan2(vy, vx);

      resolveWallCollisions(p);

      // Check creaky floor grates
      ARCADE_MAP.creakyBoards.forEach(b => {
        if (getDistance(p.x, p.y, b.x, b.y) < b.radius) {
          if (!p.wasOnCreak && !p.isHoldingBreath) {
            broadcastEvent('sound_ripple', { x: b.x, y: b.y, type: 'creak', intensity: 1.0 });
          }
          p.wasOnCreak = true;
        } else {
          p.wasOnCreak = false;
        }
      });
    }
  });

  resolvePlayerCollisions();

  // Check Tagging Proximity (Generous 65px radius ensures reliable contact catch!)
  if (!inGracePeriod) {
    const cursed = room.players.get(room.cursedPlayerId);
    if (cursed && !cursed.isSpectator) {
      room.players.forEach(other => {
        if (other.id !== cursed.id && !other.isSpectator && !other.isHiding) {
          const dist = getDistance(cursed.x, cursed.y, other.x, other.y);
          if (dist < 65) {
            executeTag(cursed, other);
            checkWinCondition();
          }
        }
      });
    }
  }

  // Periodic state broadcast (every tick)
  broadcast({ type: 'state', state: getPublicState() });
}, 1000 / TICK_RATE);

// WebSocket Connections & Event Handlers
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  const playerNumber = nextPlayerNumber++;

  const newPlayer = {
    id: playerId,
    number: playerNumber,
    characterId: null,
    character: null,
    x: 1100 + (Math.random() * 100 - 50),
    y: 800 + (Math.random() * 100 - 50),
    angle: 0,
    inputVx: 0,
    inputVy: 0,
    sanity: 100,
    stamina: 100,
    isSprinting: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    isHoldingBreath: false,
    isExhausted: false,
    exhaustionTimer: 0,
    isHiding: false,
    hidingSpotId: null,
    isSpectator: false,
    ws: ws
  };

  room.players.set(playerId, newPlayer);

  // Guarantee that the person who joined first is the host!
  if (room.players.size === 1) {
    room.status = 'LOBBY';
    room.hostId = playerId;
    room.cursedPlayerId = null;
    room.winner = null;
  } else if (!room.hostId || !room.players.has(room.hostId)) {
    room.hostId = room.players.keys().next().value;
  }

  console.log(`[CONNECT] Player ${playerId} joined (#${playerNumber}). Host: ${room.hostId}, Total: ${room.players.size}`);

  // Send initial handshake
  ws.send(JSON.stringify({
    type: 'init',
    playerId: playerId,
    isHost: room.hostId === playerId,
    localIp: getLocalIp(),
    port: PORT,
    characters: CHARACTERS,
    manor: ARCADE_MAP,
    state: getPublicState()
  }));

  broadcast({ type: 'state', state: getPublicState() });

  // Handle client messages
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'select_character') {
        const charId = data.characterId;
        let taken = false;
        room.players.forEach(p => {
          if (p.id !== playerId && p.characterId === charId) taken = true;
        });

        if (!taken && CHARACTERS[charId]) {
          newPlayer.characterId = charId;
          newPlayer.character = CHARACTERS[charId];
          broadcast({ type: 'state', state: getPublicState() });
        }
      }

      if (data.type === 'start_game') {
        console.log(`[START MATCH REQUEST] from ${playerId}, current host is ${room.hostId}, total: ${room.players.size}`);
        if (room.players.size >= 2 && room.status === 'LOBBY') {
          room.hostId = playerId; // Confirm this active player as host
          console.log(`[START MATCH APPROVED] Game starting by player ${playerId} with ${room.players.size} players!`);
          startCountdown();
        } else if (room.players.size < 2) {
          console.log(`[START REJECTED] Not enough players (${room.players.size}/2)`);
          broadcastEvent('sound_ripple', { x: newPlayer.x, y: newPlayer.y, type: 'gasp', intensity: 0.5 });
        }
      }

      if (data.type === 'input') {
        newPlayer.inputVx = data.vx || 0;
        newPlayer.inputVy = data.vy || 0;
        if (data.angle !== undefined) newPlayer.angle = data.angle;
        newPlayer.isSprinting = !!data.sprint && !newPlayer.isExhausted;
        newPlayer.isHoldingBreath = !!data.holdBreath && !newPlayer.isExhausted;
      }

      // 2 Consecutive Dash Charges + Low Furniture Vaulting! (A6 & A8)
      if (data.type === 'dash') {
        if (newPlayer.dashCharges === undefined) newPlayer.dashCharges = 2;
        if (newPlayer.dashCharges > 0 && !newPlayer.isExhausted && !newPlayer.isHiding) {
          newPlayer.dashCharges = Math.max(0, newPlayer.dashCharges - 1);
          newPlayer.isDashing = true;
          newPlayer.dashTimer = 0.35;

          // Calculate dash direction: joystick direction or current facing angle
          let dirX = newPlayer.inputVx;
          let dirY = newPlayer.inputVy;
          if (dirX === 0 && dirY === 0) {
            dirX = Math.cos(newPlayer.angle);
            dirY = Math.sin(newPlayer.angle);
          }
          const dirLen = Math.hypot(dirX, dirY) || 1;
          const impulseDist = 120; // Instant 120px thrust!

          // Safely step impulse with vaulting over low obstacles enabled!
          for (let step = 0; step < 4; step++) {
            newPlayer.x += (dirX / dirLen) * (impulseDist / 4);
            newPlayer.y += (dirY / dirLen) * (impulseDist / 4);
            resolveWallCollisions(newPlayer, true); // true = vault low furniture
          }

          broadcastEvent('sound_ripple', { x: newPlayer.x, y: newPlayer.y, type: 'dash', intensity: 0.85 });
        }
      }

      if (data.type === 'toggle_hide') {
        if (newPlayer.isHiding) {
          newPlayer.isHiding = false;
          newPlayer.hidingSpotId = null;
          newPlayer.hidingTimer = 0;
        } else {
          const nearbySpot = ARCADE_MAP.hidingSpots.find(spot => getDistance(newPlayer.x, newPlayer.y, spot.x, spot.y) < 70);
          if (nearbySpot) {
            newPlayer.isHiding = true;
            newPlayer.hidingSpotId = nearbySpot.id;
            newPlayer.hidingTimer = 8.0; // 8-second maximum hiding limit (A10)
            newPlayer.x = nearbySpot.x;
            newPlayer.y = nearbySpot.y;
            broadcastEvent('sound_ripple', { x: newPlayer.x, y: newPlayer.y, type: 'door_click', intensity: 0.4 });
          }
        }
      }

    } catch (e) {
      console.error('Error handling message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`[DISCONNECT] Player ${playerId} left`);
    room.players.delete(playerId);
    if (room.hostId === playerId) {
      const nextHost = room.players.keys().next().value;
      room.hostId = nextHost || null;
      console.log(`[HOST CHANGED] New host is ${room.hostId}`);
    }

    if (room.players.size === 0) {
      resetToLobby();
      nextPlayerNumber = 1;
    } else if (room.players.size === 1 && room.status !== 'PLAYING') {
      resetToLobby();
    }

    if (room.cursedPlayerId === playerId && room.status === 'PLAYING') {
      const survivors = Array.from(room.players.values()).filter(p => !p.isSpectator);
      if (survivors.length > 0) {
        room.cursedPlayerId = survivors[0].id;
      } else {
        resetToLobby();
      }
    }

    if (room.status === 'PLAYING') {
      checkWinCondition();
    }
    broadcast({ type: 'state', state: getPublicState() });
  });
});

// Ghost socket cleanup heartbeat (every 10s)
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((clientWs) => {
    if (clientWs.isAlive === false) {
      console.log('[HEARTBEAT] Terminating inactive ghost client');
      return clientWs.terminate();
    }
    clientWs.isAlive = false;
    clientWs.ping();
  });
}, 10000);

// Get local network IP for phone connection
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`=======================================================`);
  console.log(`⚡ RUN NIKA - 7-PLAYER MOBILE HAUNTED ARCADE CHASE`);
  console.log(`=======================================================`);
  console.log(`🎮 Local URL:     http://localhost:${PORT}`);
  console.log(`📱 Phone LAN URL: http://${localIp}:${PORT}`);
  console.log(`🌐 Public Tunnel: Run "cloudflared.exe tunnel --url http://localhost:${PORT}"`);
  console.log(`=======================================================`);
});
