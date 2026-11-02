/**
 * SoundManager - Enhanced Procedural Web Audio API Sound Engine for Speed Escape 3D.
 * Implements realistic multi-gear supercar engine synthesis with revving, turbocharger spool,
 * exhaust backfire pops, nitro whoosh, tire drift screeches, and click-free audio transitions.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  // Engine audio nodes
  private engineGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private midOsc: OscillatorNode | null = null;
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private distortionNode: WaveShaperNode | null = null;

  // Nitro & Drift
  private nitroGain: GainNode | null = null;
  private nitroSource: AudioBufferSourceNode | null = null;
  private driftGain: GainNode | null = null;
  private driftSource: AudioBufferSourceNode | null = null;

  private isEngineRunning = false;
  private isDrifting = false;
  private isNitroActive = false;

  // Audio parameters
  public masterVolume = 1.0;
  public sfxVolume = 0.85;
  public musicVolume = 0.7;
  public isMuted = false;

  private musicInterval: number | null = null;
  private currentMusicTheme: 'menu' | 'race' | null = null;

  // Simulation state
  private lastGear = 1;
  private lastSpeed = 0;
  private lastAccel = false;

  constructor() {
    this.setupUnlockListeners();
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  public initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });
      } catch (e) {
        console.warn('Web Audio API not supported', e);
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    if (this.engineGain && this.ctx) {
      const vol = this.isMuted ? 0 : 0.28 * this.sfxVolume * this.masterVolume;
      this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.engineGain && this.ctx) {
      const vol = this.isMuted ? 0 : 0.28 * this.sfxVolume * this.masterVolume;
      this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- SUBTLE SOFT SATURATION DISTORTION CURVE ---
  private makeDistortionCurve(amount = 20): Float32Array<ArrayBuffer> {
    const k = amount;
    const n_samples = 44100;
    const buffer = new ArrayBuffer(n_samples * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // --- REALISTIC SUPERCAR ENGINE SOUND ---
  public startEngine() {
    this.initContext();
    if (!this.ctx || this.isEngineRunning) return;

    try {
      this.isEngineRunning = true;
      const t = this.ctx.currentTime;

      // Master engine gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, t);
      const targetVol = this.isMuted ? 0 : 0.28 * this.sfxVolume * this.masterVolume;
      this.engineGain.gain.linearRampToValueAtTime(targetVol, t + 0.1);

      // Lowpass + Resonant Filter
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, t);
      this.engineFilter.Q.setValueAtTime(2.2, t);

      // Distortion unit for exhaust rasp
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(15);
      this.distortionNode.oversample = '2x';

      // 1. Sub-bass cylinder pulse (Triangle wave)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.setValueAtTime(42, t);

      // 2. Mid engine roar (Sawtooth wave)
      this.midOsc = this.ctx.createOscillator();
      this.midOsc.type = 'sawtooth';
      this.midOsc.frequency.setValueAtTime(84, t);

      // 3. High-pitch turbocharger spool whine (Sine wave)
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(800, t);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.02, t);

      // Connect wiring:
      // Sub & Mid -> Filter -> Distortion -> EngineGain -> Master Destination
      this.subOsc.connect(this.engineFilter);
      this.midOsc.connect(this.engineFilter);
      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.engineGain);

      this.engineFilter.connect(this.distortionNode);
      this.distortionNode.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.subOsc.start(t);
      this.midOsc.start(t);
      this.turboOsc.start(t);
    } catch (e) {
      console.warn('Engine sound start failed', e);
    }
  }

  public updateEnginePitch(speedKmh: number, isAccelerating: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.subOsc || !this.midOsc || !this.turboOsc || !this.engineFilter || !this.turboGain) return;

    try {
      const speed = Math.max(0, speedKmh);
      const t = this.ctx.currentTime;

      // Multi-gear RPM simulation (1st to 5th gear)
      let gear = 1;
      let gearMinSpeed = 0;
      let gearMaxSpeed = 55;

      if (speed < 55) {
        gear = 1; gearMinSpeed = 0; gearMaxSpeed = 55;
      } else if (speed < 110) {
        gear = 2; gearMinSpeed = 55; gearMaxSpeed = 110;
      } else if (speed < 165) {
        gear = 3; gearMinSpeed = 110; gearMaxSpeed = 165;
      } else if (speed < 220) {
        gear = 4; gearMinSpeed = 165; gearMaxSpeed = 220;
      } else {
        gear = 5; gearMinSpeed = 220; gearMaxSpeed = 280;
      }

      // Check gear shift for subtle exhaust pop!
      if (gear !== this.lastGear && speed > 30) {
        this.playExhaustPop();
        this.lastGear = gear;
      }

      // Normalized RPM across the current gear (0.0 to 1.0)
      const gearProgress = Math.min(1.0, Math.max(0.0, (speed - gearMinSpeed) / (gearMaxSpeed - gearMinSpeed)));

      // Idle frequency is ~45Hz, redline is ~140Hz
      const rpmRatio = isAccelerating
        ? 0.35 + gearProgress * 0.65
        : Math.max(0.2, gearProgress * 0.7);

      const baseFreq = 40 + rpmRatio * 95;
      const midFreq = baseFreq * 2.2;
      const filterFreq = 380 + rpmRatio * 1800 + (isAccelerating ? 400 : 0);
      const turboFreq = 900 + speed * 12;
      const turboVol = isAccelerating && speed > 40 ? 0.06 : 0.01;

      // Smooth interpolation without clicks
      this.subOsc.frequency.setTargetAtTime(baseFreq, t, 0.04);
      this.midOsc.frequency.setTargetAtTime(midFreq, t, 0.04);
      this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
      this.turboOsc.frequency.setTargetAtTime(turboFreq, t, 0.06);
      this.turboGain.gain.setTargetAtTime(turboVol, t, 0.06);

      // Burble on deceleration
      if (this.lastAccel && !isAccelerating && speed > 70 && Math.random() < 0.25) {
        this.playExhaustPop();
      }

      this.lastSpeed = speed;
      this.lastAccel = isAccelerating;
    } catch {}
  }

  // --- EXHAUST BACKFIRE / BURBLE POP ---
  private playExhaustPop() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.isEngineRunning = false;
      const t = this.ctx ? this.ctx.currentTime : 0;

      if (this.engineGain && this.ctx) {
        this.engineGain.gain.linearRampToValueAtTime(0.001, t + 0.05);
      }

      setTimeout(() => {
        try {
          this.subOsc?.stop();
          this.midOsc?.stop();
          this.turboOsc?.stop();
          this.subOsc?.disconnect();
          this.midOsc?.disconnect();
          this.turboOsc?.disconnect();
          this.engineFilter?.disconnect();
          this.distortionNode?.disconnect();
          this.engineGain?.disconnect();

          this.subOsc = null;
          this.midOsc = null;
          this.turboOsc = null;
          this.engineFilter = null;
          this.distortionNode = null;
          this.engineGain = null;
        } catch {}
      }, 60);
    } catch {}
  }

  // --- NITRO BOOST WHOOSH ---
  public setNitro(active: boolean) {
    if (this.isNitroActive === active) return;
    this.isNitroActive = active;
    try {
      this.initContext();
      if (!this.ctx) return;

      if (active && !this.isMuted) {
        const bufferSize = this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume * this.masterVolume, this.ctx.currentTime + 0.1);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start();
        this.nitroSource = whiteNoise;
        this.nitroGain = gain;
      } else if (this.nitroSource && this.nitroGain && this.ctx) {
        this.nitroGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            this.nitroSource?.stop();
            this.nitroSource?.disconnect();
            this.nitroGain?.disconnect();
            this.nitroSource = null;
            this.nitroGain = null;
          } catch {}
        }, 110);
      }
    } catch {}
  }

  // --- DRIFT TIRE SCREECH ---
  public setDrift(active: boolean) {
    if (this.isDrifting === active) return;
    this.isDrifting = active;
    try {
      this.initContext();
      if (!this.ctx) return;

      if (active && !this.isMuted) {
        const bufferSize = this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.35;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2600, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        this.driftSource = noise;
        this.driftGain = gain;
      } else if (this.driftSource && this.driftGain && this.ctx) {
        this.driftGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        setTimeout(() => {
          try {
            this.driftSource?.stop();
            this.driftSource?.disconnect();
            this.driftGain?.disconnect();
            this.driftSource = null;
            this.driftGain = null;
          } catch {}
        }, 90);
      }
    } catch {}
  }

  // --- COLLISION THUD ---
  public playCollision(intensity = 1.0) {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(Math.min(0.55, 0.45 * intensity * this.sfxVolume * this.masterVolume), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch {}
  }

  // --- BUTTON CLICK ---
  public playClick() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  // --- COUNTDOWN BEEPS ---
  public playCountdown(isFinal = false) {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      const freq = isFinal ? 880 : 440;
      const duration = isFinal ? 0.4 : 0.18;

      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.32 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.02);
    } catch {}
  }

  // --- VICTORY FANFARE ---
  public playVictory() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + index * 0.11);

        gain.gain.setValueAtTime(0, this.ctx!.currentTime + index * 0.11);
        gain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume * this.masterVolume, this.ctx!.currentTime + index * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + index * 0.11 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + index * 0.11);
        osc.stop(this.ctx!.currentTime + index * 0.11 + 0.45);
      });
    } catch {}
  }

  // --- REWARD COIN COLLECT ---
  public playReward() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.07); // E6

      gain.gain.setValueAtTime(0.22 * this.sfxVolume * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch {}
  }

  // --- BACKGROUND MUSIC LOOP ---
  public playMusic(theme: 'menu' | 'race') {
    if (this.currentMusicTheme === theme) return;
    this.stopMusic();
    this.currentMusicTheme = theme;

    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const chords = theme === 'menu'
        ? [[220, 261.63, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 246.94, 329.63]]
        : [[146.83, 220, 293.66], [130.81, 196, 261.63], [116.54, 174.61, 233.08], [130.81, 196, 293.66]];

      let chordIdx = 0;
      const stepInterval = theme === 'menu' ? 2400 : 1200;

      const playChord = () => {
        if (!this.ctx || this.isMuted || this.musicVolume <= 0.01) return;
        const currentChord = chords[chordIdx % chords.length];
        chordIdx++;

        currentChord.forEach(freq => {
          const osc = this.ctx!.createOscillator();
          const filter = this.ctx!.createBiquadFilter();
          const gain = this.ctx!.createGain();

          osc.type = theme === 'menu' ? 'sine' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(theme === 'menu' ? 600 : 900, this.ctx!.currentTime);

          const dur = stepInterval / 1000;
          gain.gain.setValueAtTime(0.001, this.ctx!.currentTime);
          gain.gain.linearRampToValueAtTime(0.07 * this.musicVolume * this.masterVolume, this.ctx!.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start();
          osc.stop(this.ctx!.currentTime + dur + 0.1);
        });
      };

      playChord();
      this.musicInterval = window.setInterval(playChord, stepInterval);
    } catch {}
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicTheme = null;
  }
}

export const soundManager = new SoundEngine();
