// Web Audio API Procedural Sound Synthesizer & Chiptune Gothic Classical BGM
// Zero external assets, 100% reliable on iOS & Android Safari/Chrome

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.isMuted = localStorage.getItem('run_nika_muted') === 'true';

    this.lastHeartbeatTime = 0;
    this.heartbeatInterval = 1.2;

    // BGM Sequencer state
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.tempoBpm = 112; // Classical Andante con moto
    this.secondsPer16th = (60 / this.tempoBpm) / 4;
    this.nextNoteTime = 0;

    // Baroque D Minor Gothic Arpeggios & Organ Pedal Bass
    // [noteFreq, isOrganBassRoot, bassFreq]
    // D minor -> G minor -> A major -> D minor
    this.dMinorScore = [
      // Measure 1: D minor
      { f: 146.83, bass: 73.42 }, // D3, D2
      { f: 220.00 },              // A3
      { f: 293.66 },              // D4
      { f: 349.23 },              // F4
      { f: 440.00 },              // A4
      { f: 349.23 },              // F4
      { f: 293.66 },              // D4
      { f: 220.00 },              // A3
      { f: 293.66 },              // D4
      { f: 349.23 },              // F4
      { f: 440.00 },              // A4
      { f: 587.33 },              // D5
      { f: 523.25 },              // C5
      { f: 440.00 },              // A4
      { f: 349.23 },              // F4
      { f: 293.66 },              // D4

      // Measure 2: G minor
      { f: 116.54, bass: 58.27 }, // Bb2, Bb1
      { f: 196.00 },              // G3
      { f: 233.08 },              // Bb3
      { f: 293.66 },              // D4
      { f: 392.00 },              // G4
      { f: 293.66 },              // D4
      { f: 233.08 },              // Bb3
      { f: 196.00 },              // G3
      { f: 233.08 },              // Bb3
      { f: 293.66 },              // D4
      { f: 392.00 },              // G4
      { f: 466.16 },              // Bb4
      { f: 392.00 },              // G4
      { f: 293.66 },              // D4
      { f: 233.08 },              // Bb3
      { f: 196.00 },              // G3

      // Measure 3: A Major (Dominant Gothic Tension)
      { f: 110.00, bass: 55.00 }, // A2, A1
      { f: 164.81 },              // E3
      { f: 220.00 },              // A3
      { f: 277.18 },              // C#4
      { f: 329.63 },              // E4
      { f: 277.18 },              // C#4
      { f: 220.00 },              // A3
      { f: 164.81 },              // E3
      { f: 220.00 },              // A3
      { f: 277.18 },              // C#4
      { f: 329.63 },              // E4
      { f: 440.00 },              // A4
      { f: 415.30 },              // G#4
      { f: 329.63 },              // E4
      { f: 277.18 },              // C#4
      { f: 220.00 },              // A3

      // Measure 4: D minor Cadence
      { f: 146.83, bass: 73.42 }, // D3, D2
      { f: 174.61 },              // F3
      { f: 220.00 },              // A3
      { f: 293.66 },              // D4
      { f: 349.23 },              // F4
      { f: 293.66 },              // D4
      { f: 220.00 },              // A3
      { f: 174.61 },              // F3
      { f: 220.00 },              // A3
      { f: 293.66 },              // D4
      { f: 440.00 },              // A4
      { f: 349.23 },              // F4
      { f: 293.66 },              // D4
      { f: 220.00 },              // A3
      { f: 174.61 },              // F3
      { f: 146.83 }               // D3
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startBgm();
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    localStorage.setItem('run_nika_muted', this.isMuted ? 'true' : 'false');
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0.0 : 1.0, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- Chiptune Dark Classical BGM Engine (A4) ---
  startBgm() {
    if (this.isBgmPlaying || !this.ctx) return;
    this.isBgmPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.bgmStep = 0;
    this._scheduleBgm();
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  _scheduleBgm() {
    if (!this.isBgmPlaying || !this.ctx) return;

    // Schedule up to 250ms ahead
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      const note = this.dMinorScore[this.bgmStep % this.dMinorScore.length];
      this._playBgmNote(note, this.nextNoteTime);
      this.nextNoteTime += this.secondsPer16th;
      this.bgmStep++;
    }

    this.bgmTimer = setTimeout(() => this._scheduleBgm(), 80);
  }

  _playBgmNote(note, time) {
    if (!this.ctx || !this.bgmGain) return;

    // 1. Harpsichord / Gothic Chiptune Pluck
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(note.f, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(320, time + 0.14);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.18);

    // 2. Gothic Pipe Organ Pedal Bass Note (at the start of measures)
    if (note.bass) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(note.bass, time);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(280, time);

      const measureDuration = this.secondsPer16th * 16;
      bassGain.gain.setValueAtTime(0.0, time);
      bassGain.gain.linearRampToValueAtTime(0.45, time + 0.08);
      bassGain.gain.setValueAtTime(0.4, time + measureDuration - 0.2);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + measureDuration);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.bgmGain);

      bassOsc.start(time);
      bassOsc.stop(time + measureDuration);
    }
  }

  // --- Sound Effects ---

  // Interactive Wooden Door Slam (A3)
  playDoorSlam() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Heavy wooden slab impact boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'triangle';
    boomOsc.frequency.setValueAtTime(160, now);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.22);
    boomGain.gain.setValueAtTime(0.75, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.26);

    // Iron latch bolt locking click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(950, now + 0.04);
    clickOsc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
    clickGain.gain.setValueAtTime(0.4, now + 0.04);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now + 0.04);
    clickOsc.stop(now + 0.13);
  }

  // Shattered Glass Floor Crunch (A7)
  playGlassCrunch() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Filtered glass shard crunch noise
    const bufferSize = this.ctx.sampleRate * 0.07;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Crystalline high ting
    const tingOsc = this.ctx.createOscillator();
    const tingGain = this.ctx.createGain();
    tingOsc.type = 'sine';
    tingOsc.frequency.setValueAtTime(2600 + Math.random() * 600, now);
    tingGain.gain.setValueAtTime(0.2, now);
    tingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    tingOsc.connect(tingGain);
    tingGain.connect(this.masterGain);
    tingOsc.start(now);
    tingOsc.stop(now + 0.07);
  }

  // Blinding Camera Flash Shutter (A8)
  playFlashBang() {
    this.playCameraSnap();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // High ringing capacitor discharge
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(3400, now + 0.05);
    ringGain.gain.setValueAtTime(0.25, now + 0.05);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    ringOsc.connect(ringGain);
    ringGain.connect(this.masterGain);
    ringOsc.start(now + 0.05);
    ringOsc.stop(now + 0.85);
  }

  // Spectator Spectral Ghost Reaction (A2)
  playGhostWhisper() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.linearRampToValueAtTime(940, now + 0.18);
    osc.frequency.linearRampToValueAtTime(780, now + 0.35);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  // Nika's Signature Mechanical Camera Shutter & Motor Whirr
  playCameraSnap() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Shutter Mechanical Click (Crisp metallic transient)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1400, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    clickGain.gain.setValueAtTime(0.8, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // 2. Optical Flash / Shutter Aperture Burst (Filtered White Noise)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 3. Vintage Polaroid Motor Whirr (*WHIRRRRRR* as photo ejects)
    const whirrOsc = this.ctx.createOscillator();
    const whirrGain = this.ctx.createGain();
    whirrOsc.type = 'sawtooth';
    whirrOsc.frequency.setValueAtTime(320, now + 0.09);
    whirrOsc.frequency.linearRampToValueAtTime(410, now + 0.45);
    whirrGain.gain.setValueAtTime(0.0, now + 0.09);
    whirrGain.gain.linearRampToValueAtTime(0.25, now + 0.15);
    whirrGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    whirrOsc.connect(whirrGain);
    whirrGain.connect(this.masterGain);
    whirrOsc.start(now + 0.09);
    whirrOsc.stop(now + 0.52);
  }

  // Accelerating Deep Bass Heartbeat (A5)
  playHeartbeat(distanceRatio) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    this.heartbeatInterval = 0.35 + (distanceRatio * 0.85); // 0.35s to 1.2s

    if (now - this.lastHeartbeatTime < this.heartbeatInterval) return;
    this.lastHeartbeatTime = now;

    this._thud(now, 68, 0.55);
    this._thud(now + 0.12, 52, 0.38);
  }

  _thud(time, freq, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(28, time + 0.08);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Creaky Floorboard Sound
  playCreak() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(210, now + 0.18);
    osc.frequency.linearRampToValueAtTime(95, now + 0.32);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Sprinting Step
  playSprintStep() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Panic Dash Whoosh
  playDash() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  // Exhausted Gasp
  playGasp() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(360, now + 0.25);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Spooky Gothic Bell Tag Strike
  playTagStrike() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [110, 220, 330, 440].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.5, now);
      gain.gain.setValueAtTime(0.35 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  // Grandfather Clock Tick
  playCountdownTick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

window.soundEngine = new SoundEngine();
