// The Midnight Manor - Main Client Game Loop & Network Orchestrator

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
      console.log('Connected to Midnight Manor server');
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

    // Use current URL origin if accessed remotely, or LAN IP
    const hostUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${localIp || '192.168.1.158'}:${port || 3000}`
      : window.location.origin;

    qrUrlText.textContent = hostUrl;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(hostUrl)}`;

    if (qrBtn && qrModal) {
      qrBtn.addEventListener('click', () => {
        qrModal.classList.toggle('qr-modal-hidden');
      });
    }
  }

  setupLobbyEvents() {
    this.btnStartGame.addEventListener('click', () => {
      if (this.isHost && this.socket && this.socket.readyState === WebSocket.OPEN) {
        if (window.soundEngine) window.soundEngine.init();
        this.socket.send(JSON.stringify({ type: 'start_game' }));
      }
    });

    // Audio unlock on user touch anywhere
    window.addEventListener('touchstart', () => {
      if (window.soundEngine) window.soundEngine.init();
    }, { once: true });
  }

  renderCharacterGrid() {
    this.charGrid.innerHTML = '';
    Object.values(this.characters).forEach(char => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.id = `char-card-${char.id}`;

      // Custom badge style
      const specialClass = char.id === 'nika' ? 'char-special-nika' : '';

      card.innerHTML = `
        <div class="char-avatar-frame">
          <img src="${char.image}" alt="${char.name}" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%234a3e30%22/><text x=%2250%22 y=%2255%22 font-size=%2235%22 text-anchor=%22middle%22 fill=%22white%22>${char.name[0]}</text></svg>';">
          <div class="taken-label">TAKEN</div>
        </div>
        <div class="char-name">${char.name}</div>
        <div class="char-trait-badge ${specialClass}">${char.trait}</div>
      `;

      card.addEventListener('click', () => {
        if (!card.classList.contains('taken')) {
          this.selectCharacter(char.id);
        }
      });

      this.charGrid.appendChild(card);
    });
  }

  selectCharacter(charId) {
    this.selectedCharId = charId;
    const char = this.characters[charId];

    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    const selectedCard = document.getElementById(`char-card-${charId}`);
    if (selectedCard) selectedCard.classList.add('selected');

    this.selectedBanner.innerHTML = `<span>Selected: <b>${char.name}</b> (${char.trait})</span>`;

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

    // Update Lobby UI
    if (this.isHost) {
      this.hostBadge.classList.remove('hidden');
    } else {
      this.hostBadge.classList.add('hidden');
    }

    this.lobbyCount.textContent = `Connected: ${state.players.length} / 7 Players`;

    // Update Taken Characters in Lobby
    const takenCharIds = new Set();
    state.players.forEach(p => {
      if (p.characterId) takenCharIds.add(p.characterId);
    });

    Object.keys(this.characters).forEach(charId => {
      const card = document.getElementById(`char-card-${charId}`);
      if (card) {
        if (takenCharIds.has(charId) && this.selectedCharId !== charId) {
          card.classList.add('taken');
        } else {
          card.classList.remove('taken');
        }
      }
    });

    // Start Button state
    if (this.isHost) {
      if (state.players.length >= 2) {
        this.btnStartGame.disabled = false;
        this.btnStartGame.textContent = `START MATCH (${state.players.length} PLAYERS)`;
      } else {
        this.btnStartGame.disabled = true;
        this.btnStartGame.textContent = 'NEED AT LEAST 2 PLAYERS TO START';
      }
    } else {
      this.btnStartGame.disabled = true;
      this.btnStartGame.textContent = 'WAITING FOR HOST TO START...';
    }

    // Switch Screens
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

    // Role Badge
    if (myPlayer.isSpectator) {
      this.roleBadge.className = 'hud-status-badge';
      this.roleIcon.textContent = '👻';
      this.roleText.textContent = 'SPECTATING';
    } else if (myPlayer.isCursed) {
      this.roleBadge.className = 'hud-status-badge cursed';
      this.roleIcon.textContent = '🔥';
      this.roleText.textContent = 'YOU ARE CURSED! TAG SOMEONE!';
    } else {
      this.roleBadge.className = 'hud-status-badge';
      this.roleIcon.textContent = '🏃';
      this.roleText.textContent = 'SURVIVE (RUN)';
    }

    // Living players count
    const living = state.players.filter(p => !p.isSpectator).length;
    this.playersAliveCount.textContent = `${living} Alive`;

    // Proximity to Hiding Spots -> Show Hide Button
    if (this.manor && !myPlayer.isSpectator) {
      const nearSpot = this.manor.hidingSpots.some(spot => {
        return Math.hypot(myPlayer.x - spot.x, myPlayer.y - spot.y) < 65;
      });

      if (nearSpot || myPlayer.isHiding) {
        this.btnHide.classList.remove('hidden-action');
        this.btnHide.querySelector('.btn-label').textContent = myPlayer.isHiding ? 'EXIT' : 'HIDE';
      } else {
        this.btnHide.classList.add('hidden-action');
      }
    }

    // Dynamic Accelerating Heartbeat
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
    if (event === 'countdown_start' || event === 'countdown_tick') {
      this.showAlert(`${payload.count}`, 'Scatter into the rooms!');
      if (window.soundEngine) window.soundEngine.playCountdownTick();
    }

    if (event === 'game_started') {
      this.showAlert('THE CURSE AWAKENS!', `${payload.cursedPlayerName} has been cursed! RUN!`);
      if (window.soundEngine) window.soundEngine.playTagStrike();
      setTimeout(() => this.hideAlert(), 2500);
    }

    if (event === 'player_tagged') {
      // 📸 NIKA'S SIGNATURE CAMERA SNAPSHOT FEATURE!
      if (payload.isNikaPhoto) {
        this.triggerNikaCameraSnap(payload);
      } else {
        if (window.soundEngine) window.soundEngine.playTagStrike();
      }

      this.showAlert('CURSE PASSED!', `${payload.hunter} tagged ${payload.victim}!`);
      setTimeout(() => this.hideAlert(), 2000);
    }

    if (event === 'sound_ripple') {
      this.manorRenderer.addRipple(payload.x, payload.y, payload.type, payload.intensity);
      if (payload.type === 'creak' && window.soundEngine) {
        window.soundEngine.playCreak();
      }
    }

    if (event === 'player_eliminated') {
      this.showAlert('SOUL LOST!', `${payload.name} was eliminated into the shadows!`);
      setTimeout(() => this.hideAlert(), 2500);
    }

    if (event === 'game_over') {
      this.showAlert('MATCH OVER!', `🏆 ${payload.winner.name} is the Last Soul Standing!`);
      if (this.controls) this.controls.vibrate([100, 50, 100, 50, 200]);
    }
  }

  // 📸 Nika's Signature Camera Flash & Polaroid Snapshot Effect
  triggerNikaCameraSnap(payload) {
    // 1. Shutter sound & whirr
    if (window.soundEngine) window.soundEngine.playCameraSnap();

    // 2. Intense White Camera Flash
    this.cameraFlashOverlay.classList.add('flash-active');
    this.flashActive = true;
    setTimeout(() => {
      this.cameraFlashOverlay.classList.remove('flash-active');
      this.flashActive = false;
    }, 140);

    // 3. Tactile Phone Haptic Pattern
    if (this.controls) this.controls.vibrate([80, 40, 120]);

    // 4. Pop up Polaroid Frame with Victim Photo
    this.polaroidImg.src = payload.victimImage || '/assets/portraits/nika.svg';
    this.polaroidName.textContent = payload.victim;
    this.polaroidContainer.classList.remove('polaroid-hidden');

    setTimeout(() => {
      this.polaroidContainer.classList.add('polaroid-hidden');
    }, 3800);
  }

  showAlert(title, subtitle) {
    this.alertTitle.textContent = title;
    this.alertSubtitle.textContent = subtitle;
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

    // Update Camera (smoothly center on local player)
    if (myPlayer) {
      const targetCamX = myPlayer.x - this.canvas.width / 2;
      const targetCamY = myPlayer.y - this.canvas.height / 2;
      this.camera.x += (targetCamX - this.camera.x) * 0.12;
      this.camera.y += (targetCamY - this.camera.y) * 0.12;
    }

    // 1. World Coordinate Transform
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Manor Floor & Architecture
    this.manorRenderer.drawFloor(this.ctx, this.camera);

    // Draw Sound Ripples (visible across dark floor)
    this.manorRenderer.updateRipples(dt);
    this.manorRenderer.drawRipples(this.ctx);

    // Draw Other Players & Self
    this.serverState.players.forEach(p => {
      const isSelf = p.id === this.playerId;
      window.drawPlayerSprite(this.ctx, p, isSelf);
    });

    // Draw Manor Heavy Walls
    this.manorRenderer.drawWalls(this.ctx);

    // Draw Midnight Encroachment mist
    this.manorRenderer.drawEncroachment(this.ctx, this.serverState.encroachmentStage);

    this.ctx.restore();

    // 2. Dynamic 2D Lighting & Fog of War (Screen Space)
    if (this.serverState.status === 'PLAYING') {
      this.lighting.renderLighting(this.ctx, myPlayer, this.manor.walls, this.camera, this.flashActive);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameClient = new MidnightManorClient();
});
