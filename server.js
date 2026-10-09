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

// 7 Character Roster (Stylized Vector Character Art)
const CHARACTERS = {
  nika: { id: 'nika', name: 'Nika', title: 'The Photographer', trait: 'Flash Camera & Polaroid on Catch', color: '#ff6b8b', image: '/assets/portraits/nika.svg' },
  marina: { id: 'marina', name: 'Marina', title: 'The Radiant Spirit', trait: 'Gothic Soul Flame', color: '#f8d070', image: '/assets/portraits/marina.svg' },
  ella: { id: 'ella', name: 'Ella', title: 'The Poised Enigma', trait: 'Gothic Soul Flame', color: '#b56576', image: '/assets/portraits/ella.svg' },
  kjara: { id: 'kjara', name: 'Kjara', title: 'The Nocturnal Mystic', trait: 'Gothic Soul Flame', color: '#9d4edd', image: '/assets/portraits/kjara.svg' },
  milan: { id: 'milan', name: 'Milan', title: 'The Velvet Rogue', trait: 'Gothic Soul Flame', color: '#e07a5f', image: '/assets/portraits/milan.svg' },
  bojana: { id: 'bojana', name: 'Bojana', title: 'The Daring Explorer', trait: 'Gothic Soul Flame', color: '#3a86ff', image: '/assets/portraits/bojana.svg' },
  toni: { id: 'toni', name: 'Toni', title: 'The Keen Strategist', trait: 'Gothic Soul Flame', color: '#2ec4b6', image: '/assets/portraits/toni.svg' }
};

// Manor Geometry & Rooms
const MANOR = {
  width: 2200,
  height: 1600,
  // Outer boundaries and interior room walls
  walls: [
    // Outer perimeter
    { x1: 50, y1: 50, x2: 2150, y2: 50 },
    { x1: 2150, y1: 50, x2: 2150, y2: 1550 },
    { x1: 2150, y1: 1550, x2: 50, y2: 1550 },
    { x1: 50, y1: 1550, x2: 50, y2: 50 },

    // Central Grand Foyer (1100, 800) partitions
    { x1: 750, y1: 550, x2: 1000, y2: 550 },
    { x1: 1200, y1: 550, x2: 1450, y2: 550 },
    { x1: 750, y1: 1050, x2: 1000, y2: 1050 },
    { x1: 1200, y1: 1050, x2: 1450, y2: 1050 },

    // Left Wing (Library & Cellar)
    { x1: 750, y1: 50, x2: 750, y2: 450 },
    { x1: 750, y1: 650, x2: 750, y2: 950 },
    { x1: 750, y1: 1150, x2: 750, y2: 1550 },
    { x1: 50, y1: 800, x2: 650, y2: 800 }, // Library / Cellar dividing wall

    // Right Wing (Dining Hall & Conservatory)
    { x1: 1450, y1: 50, x2: 1450, y2: 450 },
    { x1: 1450, y1: 650, x2: 1450, y2: 950 },
    { x1: 1450, y1: 1150, x2: 1450, y2: 1550 },
    { x1: 1550, y1: 800, x2: 2150, y2: 800 }, // Dining / Conservatory dividing wall

    // Internal Obstacles & Bookcases
    { x1: 250, y1: 250, x2: 550, y2: 250 },
    { x1: 250, y1: 450, x2: 550, y2: 450 },
    { x1: 1650, y1: 250, x2: 1950, y2: 250 },
    { x1: 1650, y1: 450, x2: 1950, y2: 450 },
    { x1: 250, y1: 1150, x2: 550, y2: 1150 },
    { x1: 1650, y1: 1150, x2: 1950, y2: 1150 },
    { x1: 1000, y1: 750, x2: 1200, y2: 750 } // Center Grand Fireplace
  ],
  // Creaky floorboards that ping noise when walked on
  creakyBoards: [
    { x: 750, y: 550, radius: 45 },
    { x: 1450, y: 550, radius: 45 },
    { x: 750, y: 1050, radius: 45 },
    { x: 1450, y: 1050, radius: 45 },
    { x: 400, y: 800, radius: 50 },
    { x: 1800, y: 800, radius: 50 },
    { x: 1100, y: 600, radius: 60 }
  ],
  // Wardrobes & Heavy Drapes for hiding
  hidingSpots: [
    { id: 'h1', x: 150, y: 120, type: 'wardrobe', label: 'Vintage Armoire' },
    { id: 'h2', x: 650, y: 120, type: 'drapes', label: 'Velvet Drapes' },
    { id: 'h3', x: 150, y: 1450, type: 'wardrobe', label: 'Cellar Cabinet' },
    { id: 'h4', x: 2050, y: 120, type: 'wardrobe', label: 'Grand Armoire' },
    { id: 'h5', x: 2050, y: 1450, type: 'drapes', label: 'Conservatory Vines' },
    { id: 'h6', x: 800, y: 1450, type: 'wardrobe', label: 'Clock Case' }
  ],
  spawnPoints: [
    { x: 1100, y: 800 }, // Foyer center
    { x: 400, y: 350 },  // Library
    { x: 400, y: 1250 }, // Cellar
    { x: 1800, y: 350 }, // Dining Hall
    { x: 1800, y: 1250 },// Conservatory
    { x: 900, y: 700 },  // Foyer North-West
    { x: 1300, y: 900 }  // Foyer South-East
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
  encroachmentStage: 0, // 0 = full map, 1 = outer wings misty, 2 = foyer showdown
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

// Wall collision solver
function resolveWallCollisions(player) {
  const radius = 22;
  MANOR.walls.forEach(w => {
    const dist = pointLineDist(player.x, player.y, w.x1, w.y1, w.x2, w.y2);
    if (dist < radius) {
      // Find normal and push out
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const nx = -dy / len;
        const ny = dx / len;
        const overlap = radius - dist;
        player.x += nx * overlap;
        player.y += ny * overlap;
      }
    }
  });

  // Clamp inside manor
  player.x = Math.max(80, Math.min(MANOR.width - 80, player.x));
  player.y = Math.max(80, Math.min(MANOR.height - 80, player.y));
}

// Player-to-player solid bump & soft shove
function resolvePlayerCollisions() {
  const activePlayers = Array.from(room.players.values()).filter(p => !p.isSpectator && !p.isHiding);
  const playerRadius = 22;

  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const p1 = activePlayers[i];
      const p2 = activePlayers[j];
      const dist = getDistance(p1.x, p1.y, p2.x, p2.y);
      const minDist = playerRadius * 2;

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

  // Reset player stats & assign spawn points
  const spawnIdxs = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
  let idx = 0;
  room.players.forEach(p => {
    const sp = MANOR.spawnPoints[spawnIdxs[idx % MANOR.spawnPoints.length]];
    p.x = sp.x;
    p.y = sp.y;
    p.sanity = 100;
    p.stamina = 100;
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
  // Pick random starting chaser
  const eligible = Array.from(room.players.values()).filter(p => !p.isSpectator);
  const starter = eligible[Math.floor(Math.random() * eligible.length)];
  room.cursedPlayerId = starter ? starter.id : null;
  room.gracePeriodUntil = Date.now() + 2000; // 2s freeze to scatter

  broadcastEvent('game_started', {
    cursedPlayerId: room.cursedPlayerId,
    cursedPlayerName: starter ? (starter.character ? starter.character.name : 'Unknown') : ''
  });
}

// Tag Execution
function executeTag(hunter, victim) {
  const prevCursed = hunter;
  room.cursedPlayerId = victim.id;
  room.gracePeriodUntil = Date.now() + 1800; // 1.8s freeze grace

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
  } else if (survivors.length === 0 && room.status === 'PLAYING') {
    room.status = 'GAME_OVER';
    room.winner = { name: 'The Manor Fog', characterId: null };
    broadcastEvent('game_over', { winner: room.winner });
    broadcast({ type: 'state', state: getPublicState() });
  }
}

// Main 30 Hz Game Loop
const TICK_RATE = 30;
const DT = 1 / TICK_RATE;

setInterval(() => {
  if (room.status !== 'PLAYING') return;

  room.gameTime += DT;

  // Midnight Encroachment (outer fog shrinks inward over time)
  if (room.gameTime > 60 && room.encroachmentStage === 0) {
    room.encroachmentStage = 1;
    broadcastEvent('encroachment_alert', { stage: 1, text: 'The Midnight Fog is creeping into the outer corridors!' });
  } else if (room.gameTime > 130 && room.encroachmentStage === 1) {
    room.encroachmentStage = 2;
    broadcastEvent('encroachment_alert', { stage: 2, text: 'The Midnight Fog is sealing the manor! Foyer showdown!' });
  }

  const now = Date.now();
  const inGracePeriod = now < room.gracePeriodUntil;

  // Process each player
  room.players.forEach(p => {
    if (p.isSpectator) return;

    const isCursed = p.id === room.cursedPlayerId;

    // Sanity Drain for Cursed Player
    if (isCursed && !inGracePeriod) {
      p.sanity -= 2.6 * DT;
      if (p.sanity <= 0) {
        p.sanity = 0;
        p.isSpectator = true;
        broadcastEvent('player_eliminated', {
          name: p.character ? p.character.name : `Player ${p.number}`,
          characterId: p.characterId
        });

        // Pass curse to a random living survivor
        const remaining = Array.from(room.players.values()).filter(rem => !rem.isSpectator && rem.sanity > 0);
        if (remaining.length > 0) {
          const next = remaining[Math.floor(Math.random() * remaining.length)];
          room.cursedPlayerId = next.id;
          room.gracePeriodUntil = Date.now() + 2000;
        }

        checkWinCondition();
        return;
      }
    }

    // Stamina & Exhaustion Management
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
      p.stamina = Math.max(0, p.stamina - 22 * DT);
      if (p.stamina === 0) {
        p.isSprinting = false;
        p.isExhausted = true;
        p.exhaustionTimer = 2.2;
        broadcastEvent('sound_ripple', { x: p.x, y: p.y, type: 'gasp', intensity: 0.9 });
      }
    } else {
      // Regenerate stamina
      p.stamina = Math.min(100, p.stamina + 20 * DT);
    }

    if (p.isExhausted) {
      p.exhaustionTimer -= DT;
      if (p.exhaustionTimer <= 0) p.isExhausted = false;
    }

    // Movement speeds
    let baseSpeed = 160;
    if (isCursed) baseSpeed = 185; // +15% Hunter's Rush

    if (p.isDashing) {
      baseSpeed = 340;
    } else if (p.isExhausted) {
      baseSpeed = 90;
    } else if (p.isHoldingBreath || p.isHiding) {
      baseSpeed = 0;
    } else if (p.isSprinting) {
      baseSpeed = 230;
      // Emit sound ripple while sprinting
      p.stepSoundTimer = (p.stepSoundTimer || 0) + DT;
      if (p.stepSoundTimer > 0.32) {
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

      // Check creaky floorboards
      MANOR.creakyBoards.forEach(b => {
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

  // Check Tagging Proximity
  if (!inGracePeriod) {
    const cursed = room.players.get(room.cursedPlayerId);
    if (cursed && !cursed.isSpectator) {
      room.players.forEach(other => {
        if (other.id !== cursed.id && !other.isSpectator && !other.isHiding) {
          const dist = getDistance(cursed.x, cursed.y, other.x, other.y);
          if (dist < 42) {
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

  // If first player, assign as host
  if (!room.hostId) {
    room.hostId = playerId;
  }

  // Send initial handshake
  ws.send(JSON.stringify({
    type: 'init',
    playerId: playerId,
    isHost: room.hostId === playerId,
    localIp: getLocalIp(),
    port: PORT,
    characters: CHARACTERS,
    manor: MANOR,
    state: getPublicState()
  }));

  broadcast({ type: 'state', state: getPublicState() });

  // Handle client messages
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'select_character') {
        const charId = data.characterId;
        // Verify character is not already taken by someone else
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
        if (room.hostId === playerId && room.players.size >= 2 && room.status === 'LOBBY') {
          startCountdown();
        }
      }

      if (data.type === 'input') {
        newPlayer.inputVx = data.vx || 0;
        newPlayer.inputVy = data.vy || 0;
        if (data.angle !== undefined) newPlayer.angle = data.angle;
        newPlayer.isSprinting = !!data.sprint && !newPlayer.isExhausted;
        newPlayer.isHoldingBreath = !!data.holdBreath && !newPlayer.isExhausted;
      }

      if (data.type === 'dash') {
        const now = Date.now();
        if (now > (newPlayer.dashCooldown || 0) && newPlayer.stamina >= 25 && !newPlayer.isExhausted && !newPlayer.isHiding) {
          newPlayer.isDashing = true;
          newPlayer.dashTimer = 0.22; // Quick dash burst
          newPlayer.dashCooldown = now + 3200; // 3.2s cooldown
          newPlayer.stamina = Math.max(0, newPlayer.stamina - 25);
          broadcastEvent('sound_ripple', { x: newPlayer.x, y: newPlayer.y, type: 'dash', intensity: 0.7 });
        }
      }

      if (data.type === 'toggle_hide') {
        if (newPlayer.isHiding) {
          // Exit hiding
          newPlayer.isHiding = false;
          newPlayer.hidingSpotId = null;
        } else {
          // Check if near a hiding spot
          const nearbySpot = MANOR.hidingSpots.find(spot => getDistance(newPlayer.x, newPlayer.y, spot.x, spot.y) < 65);
          if (nearbySpot) {
            newPlayer.isHiding = true;
            newPlayer.hidingSpotId = nearbySpot.id;
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
    room.players.delete(playerId);
    // If host left, pass host to next player
    if (room.hostId === playerId) {
      const nextHost = room.players.keys().next().value;
      room.hostId = nextHost || null;
    }

    // If cursed player left during match, pass curse
    if (room.cursedPlayerId === playerId && room.status === 'PLAYING') {
      const survivors = Array.from(room.players.values()).filter(p => !p.isSpectator);
      if (survivors.length > 0) {
        room.cursedPlayerId = survivors[0].id;
      } else {
        room.status = 'LOBBY';
      }
    }

    checkWinCondition();
    broadcast({ type: 'state', state: getPublicState() });
  });
});

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
  console.log(`⚡ RUN NIKA - 7-PLAYER MOBILE CHASE GAME SERVER`);
  console.log(`=======================================================`);
  console.log(`🎮 Local URL:     http://localhost:${PORT}`);
  console.log(`📱 Phone LAN URL: http://${localIp}:${PORT}`);
  console.log(`🌐 Public Tunnel: Run "cloudflared.exe tunnel --url http://localhost:${PORT}"`);
  console.log(`=======================================================`);
});
