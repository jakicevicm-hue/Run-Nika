// Mobile Landscape Split-Thumb Touch Controls & Virtual Joystick
// Rock-solid mobile touch handling with pointer events and haptics

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
    this.joystickMaxRadius = 55;

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
    const handleJoyStart = (e) => {
      e.preventDefault();
      if (this.joystickActive) return;

      const touch = e.touches ? e.touches[0] : e;
      this.joystickActive = true;
      this.joystickTouchId = e.pointerId !== undefined ? e.pointerId : (touch.identifier !== undefined ? touch.identifier : 1);
      this.joystickStartX = touch.clientX;
      this.joystickStartY = touch.clientY;

      this.joystickBase.style.display = 'block';
      this.joystickBase.style.left = `${this.joystickStartX}px`;
      this.joystickBase.style.top = `${this.joystickStartY}px`;
      this.joystickThumb.style.transform = `translate(-50%, -50%)`;

      this.vibrate(15);
    };

    const handleJoyMove = (e) => {
      if (!this.joystickActive) return;
      let clientX = null, clientY = null;

      if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.joystickTouchId) {
            clientX = e.touches[i].clientX;
            clientY = e.touches[i].clientY;
            break;
          }
        }
      } else if (e.pointerId === this.joystickTouchId || e.pointerId === undefined) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      if (clientX === null) return;
      e.preventDefault();

      const dx = clientX - this.joystickStartX;
      const dy = clientY - this.joystickStartY;
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
    };

    const handleJoyEnd = (e) => {
      if (!this.joystickActive) return;
      let matches = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joystickTouchId) matches = true;
        }
      } else {
        matches = true;
      }

      if (matches) {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickBase.style.display = 'none';
        this.vx = 0;
        this.vy = 0;
        this.sendInput();
      }
    };

    if (this.joystickZone) {
      this.joystickZone.style.touchAction = 'none';
      this.joystickZone.addEventListener('touchstart', handleJoyStart, { passive: false });
      window.addEventListener('touchmove', handleJoyMove, { passive: false });
      window.addEventListener('touchend', handleJoyEnd);
      window.addEventListener('touchcancel', handleJoyEnd);

      // Pointer event fallback for mouse/tablets
      this.joystickZone.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return; // Handled by touchstart
        handleJoyStart(e);
      });
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        handleJoyMove(e);
      });
      window.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'touch') return;
        handleJoyEnd(e);
      });
    }

    // Helper to bind tactile mobile buttons with both Pointer and Touch events
    const bindTactileButton = (elem, onDown, onUp) => {
      if (!elem) return;
      elem.style.touchAction = 'none';
      elem.style.userSelect = 'none';
      elem.style.webkitUserSelect = 'none';

      let isPressed = false;

      const triggerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPressed) return;
        isPressed = true;
        onDown();
      };

      const triggerUp = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!isPressed) return;
        isPressed = false;
        if (onUp) onUp();
      };

      // Pointer Events (Modern Mobile Browsers)
      elem.addEventListener('pointerdown', triggerDown, { passive: false });
      window.addEventListener('pointerup', triggerUp, { passive: false });
      window.addEventListener('pointercancel', triggerUp, { passive: false });

      // Touch Events fallback
      elem.addEventListener('touchstart', triggerDown, { passive: false });
      elem.addEventListener('touchend', triggerUp, { passive: false });
      elem.addEventListener('touchcancel', triggerUp, { passive: false });
    };

    // 2. Sprint Button (Hold to Sprint)
    bindTactileButton(this.btnSprint, () => {
      this.isSprinting = true;
      this.btnSprint.classList.add('active');
      this.vibrate(20);
      this.sendInput();
    }, () => {
      this.isSprinting = false;
      this.btnSprint.classList.remove('active');
      this.sendInput();
    });

    // 3. Instant Panic Dash Button (Tap to Dash!) - Supports 2 Consecutive Charges!
    let lastDashTap = 0;
    bindTactileButton(this.btnDash, () => {
      const now = Date.now();
      if (now - lastDashTap > 250) {
        lastDashTap = now;
        this.vibrate([35, 20, 45]);
        if (window.soundEngine) window.soundEngine.playDash();

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'dash' }));
        }
      }
    }, null);

    // 4. Hold Breath / Silent Button (Hold to be Silent)
    bindTactileButton(this.btnBreath, () => {
      this.isHoldingBreath = true;
      this.btnBreath.classList.add('active');
      this.vibrate(25);
      this.sendInput();
    }, () => {
      this.isHoldingBreath = false;
      this.btnBreath.classList.remove('active');
      this.sendInput();
    });

    // 5. Hide in Arcade Cabinet / Photo Booth Button
    bindTactileButton(this.btnHide, () => {
      this.vibrate(40);
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'toggle_hide' }));
      }
    }, null);
  }

  startDashCooldownAnim(durationMs) {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      if (this.dashOverlay) {
        this.dashOverlay.style.height = `${pct}%`;
      }
      if (pct > 0) {
        requestAnimationFrame(tick);
      } else {
        if (this.dashOverlay) this.dashOverlay.style.height = '0%';
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
          this.dashCooldownUntil = now + 2600;
          this.startDashCooldownAnim(2600);
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
