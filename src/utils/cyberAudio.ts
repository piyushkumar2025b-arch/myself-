// Web Audio API Synthesizer for futuristic sci-fi sound effects (Zero external files needed)
class CyberAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play subtle futuristic whoosh / portal jump when entering portfolio
  playEnterTransition() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Low sub sweep
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(90, now);
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.6);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 1.2);

      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.3);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Shimmering high harmonic
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.8);

      gain2.gain.setValueAtTime(0.01, now);
      gain2.gain.linearRampToValueAtTime(0.06, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.8);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Subtle interactive UI blip on hover
  playHoverBlip() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // Button click confirmation
  playClickConfirm() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.setValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  // Sweet, gentle cat meow synthesizer using formant shaping
  playCatMeow() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Primary feline vocal tract pitch glide: ~580Hz -> rise to ~780Hz -> glide down to ~490Hz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(790, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.42);

      // Formant filter for organic feline meow acoustic color
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150, now);
      filter.frequency.linearRampToValueAtTime(1600, now + 0.15);
      filter.frequency.linearRampToValueAtTime(950, now + 0.42);
      filter.Q.setValueAtTime(2.2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Ignore
    }
  }

  // Soothing rhythmic low-frequency cat purr
  playCatPurr() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      // Low chest fundamental (~26Hz feline purr frequency)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65, now);

      // 24Hz amplitude modulation for the distinctive purring flutter
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(24, now);
      lfoGain.gain.setValueAtTime(0.02, now);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.85);
      lfo.stop(now + 0.85);
    } catch {
      // Ignore
    }
  }

  // Combined joyful purr rumble followed by cute melodic meow chirp
  playPurrAndMeow() {
    this.playCatPurr();
    setTimeout(() => {
      this.playCatMeow();
    }, 280);
  }

  // Authentic mechanical keyboard tactile switch clack ("thock")
  playKeyboardClack() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Keycap bottom-out thock (low wooden/plastic resonance)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const pitch = 220 + Math.random() * 80;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);

      // High click leaf snap
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1600 + Math.random() * 400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

      clickGain.gain.setValueAtTime(0.025, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.02);
    } catch {}
  }

  // Heavy mechanical toggle switch for studio lamp
  playLampSwitch(isTurningOn: boolean = true) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(isTurningOn ? 320 : 220, now);
      osc.frequency.setValueAtTime(isTurningOn ? 640 : 160, now + 0.02);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } catch {}
  }

  // Micro-turbine spool-up whir for AI Welcome Drone barrel roll
  playDroneStunt() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(1280, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.9);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 0.4);
      filter.frequency.linearRampToValueAtTime(900, now + 0.9);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch {}
  }

  // Gentle espresso steam hiss
  playCoffeeSteam() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Filtered noise steam sound
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.022, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.5);
    } catch {}
  }

  // Studio Monitors procedural Lofi Focus Beat synthesizer
  private lofiInterval: number | null = null;
  public isLofiActive: boolean = false;

  toggleLofiBeat(): boolean {
    if (this.isLofiActive) {
      this.stopLofiBeat();
      return false;
    } else {
      this.startLofiBeat();
      return true;
    }
  }

  startLofiBeat() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      this.isLofiActive = true;

      // Chords: Dmaj7 -> Bm7 -> Em7 -> A7 (Smooth jazzy lofi progression)
      const chordNotes = [
        [146.83, 220.0, 277.18, 329.63], // Dmaj7
        [123.47, 185.0, 220.0, 293.66],  // Bm7
        [164.81, 246.94, 293.66, 392.0], // Em7
        [110.0, 164.81, 220.0, 277.18],  // A7
      ];
      let step = 0;

      const playChord = () => {
        if (!this.isLofiActive || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = chordNotes[step % chordNotes.length];
        step++;

        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.015, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 1.85);
        });

        // Soft sub kick
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        kickGain.gain.setValueAtTime(0.04, now);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.22);
      };

      playChord();
      this.lofiInterval = window.setInterval(playChord, 1900);
    } catch {}
  }

  stopLofiBeat() {
    this.isLofiActive = false;
    if (this.lofiInterval) {
      clearInterval(this.lofiInterval);
      this.lofiInterval = null;
    }
  }
}

export const cyberAudio = new CyberAudioEngine();
