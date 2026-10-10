// Run Nika - Main Client Game Loop & Network Orchestrator
// Clean Minimalist Retro HUD & Haunted Arcade Integration

class MidnightManorClient {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.lighting = new LightingEngine();
    this.manorRenderer = new ManorRenderer();
    this.controls = null;
    this.socket = null;

    this.playerId = null;
    this.isHost = false;
    this.serverState = null;
    this.characters = {};
    this.manor = null;
    this.selectedCharId = null;

    this.camera = { x: 0, y: 0 };
    this.flashActive = false;

    // DOM Elements
    this.lobbyScreen = document.getElementById('lobby-screen');
    this.gameHud = document.getElementById('game-hud');
    this.charGrid = document.getElementById('character-grid');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.hostBadge = document.getElementById('host-badge');
    this.lobbyCount = document.getElementById('lobby-connected-count');
    this.selectedBanner = document.getElementById('selected-char-preview');

    this.sanityFill = document.getElementById('sanity-bar-fill');
    this.sanityNum = document.getElementById('sanity-num');
    this.staminaFill = document.getElementById('stamina-bar-fill');
    this.roleBadge = document.getElementById('hud-status-badge');
    this.roleText = document.getElementById('hud-role-text');
    this.roleIcon = document.getElementById('hud-role-icon');
    this.playersAliveCount = document.getElementById('players-alive-count');
    this.centerAlert = document.getElementById('hud-center-alert');
    this.alertTitle = document.getElementById('alert-title');
    this.alertSubtitle = document.getElementById('alert-subtitle');

    this.polaroidContainer = document.getElementById('polaroid-container');
    this.polaroidImg = document.getElementById('polaroid-victim-img');
    this.polaroidName = document.getElementById('polaroid-victim-name');
    this.cameraFlashOverlay = document.getElementById('camera-flash-overlay');
    this.btnHide = document.getElementById('btn-hide');

    this.initWindow();
    this.connectNetwork();
    this.setupLobbyEvents();
    this.startRenderLoop();
  }

  initWindow() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.ctx.imageSmoothingEnabled = false;
      this.lighting.resize(this.canvas.width, this.canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  connectNetwork() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('Connected to Run Nika server');
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'init') {
          this.playerId = msg.playerId;
          this.isHost = msg.isHost;
          this.characters = msg.characters;
          this.manor = msg.manor;
          this.manorRenderer.setManor(this.manor);
          this.controls = new ControlsManager(this.socket);
          this.setupQR(msg.localIp, msg.port);
          this.renderCharacterGrid();
          this.updateState(msg.state);
        }

        if (msg.type === 'state') {
          this.updateState(msg.state);
        }

        if (msg.type === 'event') {
          this.handleGameEvent(msg.event, msg.payload);
        }
      } catch (e) {
        console.error('Socket message parse error:', e);
      }
    };

    this.socket.onclose = () => {
      console.log('Disconnected from server');
    };
  }

  setupQR(localIp, port) {
    const qrBtn = document.getElementById('btn-show-qr');
    const qrModal = document.getElementById('qr-modal');
    const qrImg = document.getElementById('qr-img');
    const qrUrlText = document.getElementById('qr-url-text');

    const hostUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${localIp || 'localhost'}:${port || 3000}`
      : window.location.origin;

    if (qrUrlText) qrUrlText.textContent = hostUrl;
    if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(hostUrl)}`;

    if (qrBtn && qrModal) {
      qrBtn.addEventListener('click', () => {
        qrModal.classList.toggle('qr-modal-hidden');
      });
    }
  }

  setupLobbyEvents() {
    let starting = false;
    const triggerStart = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (starting) return;

      if (!this.serverState || this.serverState.players.length < 2) {
        if (navigator.vibrate) navigator.vibrate(40);
        if (this.selectedBanner) {
          this.selectedBanner.innerHTML = `<span style="color: #ff6b6b; font-weight: bold;">⚠️ Need at least 2 players to start tag! Scan QR to join with another phone.</span>`;
          setTimeout(() => {
            if (this.serverState) this.updateState(this.serverState);
          }, 3000);
        }
        return;
      }

      starting = true;
      setTimeout(() => { starting = false; }, 2000);

      if (navigator.vibrate) navigator.vibrate([50, 40, 80]);
      if (window.soundEngine) window.soundEngine.init();
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'start_game' }));
      }
    };

    if (this.btnStartGame) {
      this.btnStartGame.style.touchAction = 'manipulation';
      this.btnStartGame.addEventListener('touchstart', triggerStart, { passive: false });
      this.btnStartGame.addEventListener('touchend', (e) => { e.preventDefault(); }, { passive: false });
      this.btnStartGame.addEventListener('pointerdown', triggerStart);
      this.btnStartGame.addEventListener('click', triggerStart);
    }

    // Audio unlock on user touch anywhere
    window.addEventListener('touchstart', () => {
      if (window.soundEngine) window.soundEngine.init();
    }, { once: true });
    window.addEventListener('pointerdown', () => {
      if (window.soundEngine) window.soundEngine.init();
    }, { once: true });
  }

  renderCharacterGrid() {
    this.charGrid.innerHTML = '';
    Object.values(this.characters).forEach(char => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.id = `char-card-${char.id}`;

      const specialClass = char.id === 'nika' ? 'char-special-nika' : '';

      card.innerHTML = `
        <div class="char-avatar-frame">
          <img src="${char.image}" alt="${char.name}" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%234a3e30%22/><text x=%2250%22 y=%2255%22 font-size=%2235%22 text-anchor=%22middle%22 fill=%22white%22>${char.name[0]}</text></svg>';">
          <div class="taken-label" id="taken-label-${char.id}">TAKEN</div>
          <div class="you-badge" id="you-badge-${char.id}">✔ YOU</div>
        </div>
        <div class="char-name">${char.name}</div>
        <div class="char-title">${char.title || ''}</div>
        <div class="char-trait-badge ${specialClass}">${char.trait}</div>
        <div class="char-status-pill" id="status-pill-${char.id}">TAP TO PICK</div>
      `;

      const onSelect = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!card.classList.contains('taken')) {
          this.selectCharacter(char.id);
        }
      };

      card.addEventListener('pointerdown', onSelect);
      card.addEventListener('click', onSelect);

      this.charGrid.appendChild(card);
    });
  }

  selectCharacter(charId) {
    this.selectedCharId = charId;
    const char = this.characters[charId];
    if (!char) return;

    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = document.getElementById(`char-card-${charId}`);
    if (selectedCard) selectedCard.classList.add('selected');

    if (this.selectedBanner) {
      this.selectedBanner.innerHTML = `<span>Playing as: <b style="color: #ffd700;">${char.name}</b> — ${char.title} (${char.trait})</span>`;
    }

    if (window.soundEngine) window.soundEngine.playCountdownTick();

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'select_character',
        characterId: charId
      }));
    }
  }

  updateState(state) {
    this.serverState = state;
    this.isHost = state.hostId === this.playerId;

    // Update Host Badge & Lobby Count
    if (this.isHost) {
      this.hostBadge.textContent = '👑 YOU ARE THE HOST';
      this.hostBadge.classList.remove('hidden');
    } else {
      const hostPlayer = state.players.find(p => p.id === state.hostId);
      const hostName = hostPlayer ? hostPlayer.name : 'Host';
      this.hostBadge.textContent = `👑 HOST: ${hostName.toUpperCase()}`;
      this.hostBadge.classList.remove('hidden');
    }

    this.lobbyCount.textContent = `${state.players.length} / 7 Players`;

    // Map characterId -> Player who has chosen it
    const takenMap = new Map();
    state.players.forEach(p => {
      if (p.characterId) takenMap.set(p.characterId, p);
    });

    const myPlayer = state.players.find(p => p.id === this.playerId);
    if (myPlayer && myPlayer.characterId) {
      this.selectedCharId = myPlayer.characterId;
    }

    // Update all character cards
    Object.keys(this.characters).forEach(charId => {
      const card = document.getElementById(`char-card-${charId}`);
      if (!card) return;

      const takenLabel = document.getElementById(`taken-label-${charId}`);
      const youBadge = document.getElementById(`you-badge-${charId}`);
      const statusPill = document.getElementById(`status-pill-${charId}`);
      const takenBy = takenMap.get(charId);

      if (this.selectedCharId === charId) {
        card.classList.add('selected');
        card.classList.remove('taken');
        if (takenLabel) takenLabel.style.display = 'none';
        if (youBadge) youBadge.style.display = 'block';
        if (statusPill) {
          statusPill.textContent = '✔ SELECTED';
          statusPill.className = 'char-status-pill pill-selected';
        }
      } else if (takenBy && takenBy.id !== this.playerId) {
        card.classList.remove('selected');
        card.classList.add('taken');
        if (takenLabel) {
          takenLabel.textContent = `TAKEN`;
          takenLabel.style.display = 'block';
        }
        if (youBadge) youBadge.style.display = 'none';
        if (statusPill) {
          statusPill.textContent = `TAKEN (${takenBy.name})`;
          statusPill.className = 'char-status-pill pill-taken';
        }
      } else {
        card.classList.remove('selected');
        card.classList.remove('taken');
        if (takenLabel) takenLabel.style.display = 'none';
        if (youBadge) youBadge.style.display = 'none';
        if (statusPill) {
          statusPill.textContent = 'TAP TO PICK';
          statusPill.className = 'char-status-pill pill-open';
        }
      }
    });

    // Update selected character banner
    if (this.selectedCharId && this.characters[this.selectedCharId]) {
      const char = this.characters[this.selectedCharId];
      if (this.selectedBanner) {
        this.selectedBanner.innerHTML = `<span>Playing as: <b style="color: #ffd700;">${char.name}</b> — ${char.title} (${char.trait})</span>`;
      }
    } else {
      if (this.selectedBanner) {
        this.selectedBanner.innerHTML = `<span style="color: #c49a45;">👆 Tap a character card above to select your hero</span>`;
      }
    }

    // Start Button State: Once 2 or more players are in the lobby, START IS ACTIVE!
    if (state.players.length >= 2) {
      this.btnStartGame.className = 'start-game-btn host-active';
      this.btnStartGame.innerHTML = `👑 START MATCH (${state.players.length} PLAYERS) ▶`;
    } else {
      this.btnStartGame.className = 'start-game-btn host-waiting';
      this.btnStartGame.innerHTML = `👑 WAITING FOR PLAYERS (1/7)...<br><span style="font-size:7px; opacity:0.8;">Need at least 2 players to start tag</span>`;
    }

    // Switch Screens: LOBBY vs GAMEPLAY
    if (state.status === 'LOBBY') {
      this.lobbyScreen.classList.remove('lobby-hidden');
      this.gameHud.classList.add('hud-hidden');
    } else {
      this.lobbyScreen.classList.add('lobby-hidden');
      this.gameHud.classList.remove('hud-hidden');
      this.updateHUD(state);
    }
  }

  updateHUD(state) {
    const myPlayer = state.players.find(p => p.id === this.playerId);
    if (!myPlayer) return;

    // Sanity Bar
    const sanityPct = Math.max(0, Math.min(100, myPlayer.sanity));
    this.sanityFill.style.width = `${sanityPct}%`;
    this.sanityNum.textContent = `${Math.round(sanityPct)}%`;

    if (sanityPct > 50) {
      this.sanityFill.className = 'sanity-fill';
    } else if (sanityPct > 25) {
      this.sanityFill.className = 'sanity-fill warning';
    } else {
      this.sanityFill.className = 'sanity-fill danger';
    }

    // Stamina Bar
    const staminaPct = Math.max(0, Math.min(100, myPlayer.stamina));
    this.staminaFill.style.width = `${staminaPct}%`;

    // Minimalist Role Badge (No long text clutter)
    if (myPlayer.isSpectator) {
      this.roleBadge.className = 'hud-status-badge';
      this.roleIcon.textContent = '👻';
      this.roleText.textContent = 'SPECTATING';
    } else if (myPlayer.isCursed) {
      this.roleBadge.className = 'hud-status-badge cursed';
      this.roleIcon.textContent = '🔥';
      this.roleText.textContent = 'IT';
    } else {
      this.roleBadge.className = 'hud-status-badge';
      this.roleIcon.textContent = '⚡';
      this.roleText.textContent = 'RUN';
    }

    // Living players count
    const living = state.players.filter(p => !p.isSpectator).length;
    this.playersAliveCount.textContent = `👥 ${living}`;

    // Dash charges indicator (A8)
    const dashBtn = document.getElementById('btn-dash');
    if (dashBtn) {
      const charges = myPlayer.dashCharges !== undefined ? myPlayer.dashCharges : 2;
      const pips = charges === 2 ? '⚡⚡' : (charges === 1 ? '⚡' : '⏳');
      const label = dashBtn.querySelector('.btn-label');
      if (label) label.textContent = `DASH ${pips}`;
    }

    // Proximity to Hiding Spots & 8-second limit (A10)
    if (this.manor && !myPlayer.isSpectator) {
      const nearSpot = this.manor.hidingSpots.some(spot => {
        return Math.hypot(myPlayer.x - spot.x, myPlayer.y - spot.y) < 70;
      });

      if (nearSpot || myPlayer.isHiding) {
        this.btnHide.classList.remove('hidden-action');
        const hideLabel = this.btnHide.querySelector('.btn-label');
        if (hideLabel) {
          hideLabel.textContent = myPlayer.isHiding
            ? `EXIT (${myPlayer.hidingTimeLeft || 8}s)`
            : 'HIDE';
        }
      } else {
        this.btnHide.classList.add('hidden-action');
      }
    }

    // Grand Central Fireplace Warmth Indicator (A13)
    if (!myPlayer.isCursed && !myPlayer.isSpectator && !myPlayer.isHiding) {
      const distToHearth = Math.hypot(myPlayer.x - 1100, myPlayer.y - 790);
      if (distToHearth < 170 && myPlayer.sanity < 100) {
        this.sanityNum.textContent = `${Math.round(sanityPct)}% 🔥 HEARTH`;
      }
    }

    // Accelerating Heartbeat sound
    if (!myPlayer.isCursed && !myPlayer.isSpectator) {
      const cursedPlayer = state.players.find(p => p.id === state.cursedPlayerId);
      if (cursedPlayer && !cursedPlayer.isSpectator) {
        const dist = Math.hypot(myPlayer.x - cursedPlayer.x, myPlayer.y - cursedPlayer.y);
        if (dist < 600) {
          const ratio = Math.max(0, (dist - 50) / 550);
          if (window.soundEngine) window.soundEngine.playHeartbeat(ratio);
        }
      }
    }
  }

  handleGameEvent(event, payload) {
    if (event === 'countdown_start') {
      this.lobbyScreen.classList.add('lobby-hidden');
      this.gameHud.classList.remove('hud-hidden');
      this.showAlert(`${payload.count}`, '');
      if (window.soundEngine) window.soundEngine.playCountdownTick();
    } else if (event === 'countdown_tick') {
      this.showAlert(`${payload.count}`, '');
      if (window.soundEngine) window.soundEngine.playCountdownTick();
    }

    if (event === 'scatter_countdown') {
      this.showAlert('CURSE JUMPED!', `${payload.nextPlayer} is IT!`);
      if (this.controls) this.controls.vibrate([150, 60, 150]);
      setTimeout(() => this.hideAlert(), 2000);
    }

    if (event === 'return_to_lobby') {
      this.hideAlert();
      this.lobbyScreen.classList.remove('lobby-hidden');
      this.gameHud.classList.add('hud-hidden');
    }

    if (event === 'game_started') {
      this.showAlert('SURVIVE!', '');
      if (window.soundEngine) window.soundEngine.playTagStrike();
      setTimeout(() => this.hideAlert(), 1200);
    }

    if (event === 'player_tagged') {
      if (payload.isNikaPhoto) {
        this.triggerNikaCameraSnap(payload);
      } else {
        if (window.soundEngine) window.soundEngine.playTagStrike();
      }
      this.showAlert('TAG!', '');
      setTimeout(() => this.hideAlert(), 1000);
    }

    if (event === 'sound_ripple') {
      this.manorRenderer.addRipple(payload.x, payload.y, payload.type, payload.intensity);
      if (payload.type === 'creak' && window.soundEngine) {
        window.soundEngine.playCreak();
      }
    }

    if (event === 'player_eliminated') {
      this.showAlert('LOST', `${payload.name}`);
      setTimeout(() => this.hideAlert(), 1800);
    }

    if (event === 'game_over') {
      this.showAlert('WINNER', `${payload.winner.name}`);
      if (this.controls) this.controls.vibrate([100, 50, 100, 50, 200]);
    }
  }

  // 📸 Nika's Camera Flash & Polaroid Snapshot
  triggerNikaCameraSnap(payload) {
    if (window.soundEngine) window.soundEngine.playCameraSnap();

    this.cameraFlashOverlay.classList.add('flash-active');
    this.flashActive = true;
    setTimeout(() => {
      this.cameraFlashOverlay.classList.remove('flash-active');
      this.flashActive = false;
    }, 140);

    if (this.controls) this.controls.vibrate([80, 40, 120]);

    this.polaroidImg.src = payload.victimImage || '/assets/portraits/nika.svg';
    this.polaroidName.textContent = payload.victim;
    this.polaroidContainer.classList.remove('polaroid-hidden');

    setTimeout(() => {
      this.polaroidContainer.classList.add('polaroid-hidden');
    }, 3200);
  }

  showAlert(title, subtitle) {
    this.alertTitle.textContent = title;
    this.alertSubtitle.textContent = subtitle || '';
    this.centerAlert.classList.remove('hud-alert-hidden');
  }

  hideAlert() {
    this.centerAlert.classList.add('hud-alert-hidden');
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this.render(dt);
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  render(dt) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.serverState || !this.manor) return;

    const myPlayer = this.serverState.players.find(p => p.id === this.playerId);

    // Camera smoothly centers on player
    if (myPlayer) {
      const targetCamX = myPlayer.x - this.canvas.width / 2;
      const targetCamY = myPlayer.y - this.canvas.height / 2;
      this.camera.x += (targetCamX - this.camera.x) * 0.14;
      this.camera.y += (targetCamY - this.camera.y) * 0.14;
    }

    // 1. World Coordinate Transform
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Haunted Arcade Floor & Machines
    this.manorRenderer.drawFloor(this.ctx, this.camera);

    // Draw Sound Ripples
    this.manorRenderer.updateRipples(dt);
    this.manorRenderer.drawRipples(this.ctx);

    // Draw All Players
    this.serverState.players.forEach(p => {
      const isSelf = p.id === this.playerId;
      window.drawPlayerSprite(this.ctx, p, isSelf);
    });

    // Draw Heavy Arcade Walls & Neon Tubing
    this.manorRenderer.drawWalls(this.ctx);

    // Draw Dark Encroachment
    this.manorRenderer.drawEncroachment(this.ctx, this.serverState.encroachmentStage);

    this.ctx.restore();

    // 2. Dynamic 2D Lighting, Flashlight Beam & Neon Glows
    if (this.serverState.status === 'PLAYING') {
      this.lighting.renderLighting(
        this.ctx,
        myPlayer,
        this.manor.walls,
        this.camera,
        this.flashActive,
        this.manor.arcadeEntities,
        this.serverState.players
      );
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameClient = new MidnightManorClient();
});
