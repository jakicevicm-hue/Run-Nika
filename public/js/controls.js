// Mobile Landscape Split-Thumb Touch Controls & Virtual Joystick

class ControlsManager {
  constructor(socket) {
    this.socket = socket;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.isSprinting = false;
    this.isHoldingBreath = false;
    this.dashCooldownUntil = 0;

    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickStartX = 0;
    this.joystickStartY = 0;
    this.joystickMaxRadius = 50;

    // DOM Elements
    this.joystickZone = document.getElementById('joystick-zone');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickThumb = document.getElementById('joystick-thumb');

    this.btnSprint = document.getElementById('btn-sprint');
    this.btnDash = document.getElementById('btn-dash');
    this.btnBreath = document.getElementById('btn-breath');
    this.btnHide = document.getElementById('btn-hide');
    this.dashOverlay = document.getElementById('dash-cooldown-overlay');

    this.initTouchControls();
    this.initKeyboardFallback();
  }

  // Trigger Phone Vibration
  vibrate(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  initTouchControls() {
    // 1. Floating Virtual Joystick on Left Half of Screen
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickActive) return;

      const touch = e.changedTouches[0];
      this.joystickActive = true;
      this.joystickTouchId = touch.identifier;
      this.joystickStartX = touch.clientX;
      this.joystickStartY = touch.clientY;

      this.joystickBase.style.display = 'block';
      this.joystickBase.style.left = `${this.joystickStartX}px`;
      this.joystickBase.style.top = `${this.joystickStartY}px`;
      this.joystickThumb.style.transform = `translate(-50%, -50%)`;

      this.vibrate(15);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.joystickActive) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          const dx = touch.clientX - this.joystickStartX;
          const dy = touch.clientY - this.joystickStartY;
          const dist = Math.hypot(dx, dy);

          const clampedDist = Math.min(dist, this.joystickMaxRadius);
          const angle = Math.atan2(dy, dx);

          const thumbX = Math.cos(angle) * clampedDist;
          const thumbY = Math.sin(angle) * clampedDist;

          this.joystickThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;

          // Normalized input vector
          const norm = clampedDist / this.joystickMaxRadius;
          this.vx = Math.cos(angle) * norm;
          this.vy = Math.sin(angle) * norm;
          this.angle = angle;

          this.sendInput();
          break;
        }
      }
    }, { passive: false });

    const handleJoystickEnd = (e) => {
      if (!this.joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.joystickActive = false;
          this.joystickTouchId = null;
          this.joystickBase.style.display = 'none';
          this.vx = 0;
          this.vy = 0;
          this.sendInput();
          break;
        }
      }
    };

    window.addEventListener('touchend', handleJoystickEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);

    // 2. Sprint Button (Hold to Sprint)
    this.btnSprint.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isSprinting = true;
      this.btnSprint.classList.add('active');
      this.vibrate(20);
      this.sendInput();
    }, { passive: false });

    this.btnSprint.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.isSprinting = false;
      this.btnSprint.classList.remove('active');
      this.sendInput();
    }, { passive: false });

    // 3. Panic Dash Button
    this.btnDash.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now > this.dashCooldownUntil) {
        this.dashCooldownUntil = now + 3200;
        this.startDashCooldownAnim(3200);
        this.vibrate([30, 20, 40]);
        if (window.soundEngine) window.soundEngine.playDash();

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'dash' }));
        }
      }
    }, { passive: false });

    // 4. Hold Breath (Hold to be Silent)
    this.btnBreath.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isHoldingBreath = true;
      this.btnBreath.classList.add('active');
      this.vibrate(25);
      this.sendInput();
    }, { passive: false });

    this.btnBreath.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.isHoldingBreath = false;
      this.btnBreath.classList.remove('active');
      this.sendInput();
    }, { passive: false });

    // 5. Hide in Wardrobe Button
    this.btnHide.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.vibrate(40);
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'toggle_hide' }));
      }
    }, { passive: false });
  }

  startDashCooldownAnim(durationMs) {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      this.dashOverlay.style.height = `${pct}%`;
      if (pct > 0) {
        requestAnimationFrame(tick);
      } else {
        this.dashOverlay.style.height = '0%';
      }
    };
    tick();
  }

  sendInput() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'input',
        vx: this.vx,
        vy: this.vy,
        angle: this.angle,
        sprint: this.isSprinting,
        holdBreath: this.isHoldingBreath
      }));
    }
  }

  // Keyboard controls for testing on Desktop browsers
  initKeyboardFallback() {
    const keys = {};

    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        // Space to Dash
        const now = Date.now();
        if (now > this.dashCooldownUntil) {
          this.dashCooldownUntil = now + 3200;
          this.startDashCooldownAnim(3200);
          if (window.soundEngine) window.soundEngine.playDash();
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'dash' }));
          }
        }
      }
      if (e.key.toLowerCase() === 'e') {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'toggle_hide' }));
        }
      }
      this.updateKeyboardInput(keys);
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
      this.updateKeyboardInput(keys);
    });
  }

  updateKeyboardInput(keys) {
    let kx = 0;
    let ky = 0;
    if (keys['w'] || keys['arrowup']) ky -= 1;
    if (keys['s'] || keys['arrowdown']) ky += 1;
    if (keys['a'] || keys['arrowleft']) kx -= 1;
    if (keys['d'] || keys['arrowright']) kx += 1;

    if (kx !== 0 || ky !== 0) {
      const angle = Math.atan2(ky, kx);
      this.vx = kx;
      this.vy = ky;
      this.angle = angle;
    } else if (!this.joystickActive) {
      this.vx = 0;
      this.vy = 0;
    }

    this.isSprinting = !!keys['shift'];
    this.isHoldingBreath = !!keys['c'] || !!keys['control'];
    this.sendInput();
  }
}

window.ControlsManager = ControlsManager;
