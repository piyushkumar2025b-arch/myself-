// Cute Web Audio API sound synthesizer for Snorlax Pet Companion
// Zero external file dependencies - pure procedural audio synthesis

class SnorlaxAudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved mute state
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('snorlax_sound_muted');
        if (saved !== null) {
          this.isMuted = saved === 'true';
        }
      } catch (e) {}
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;
    
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('snorlax_sound_muted', muted.toString());
    } catch (e) {}
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Cute squeak / poke pop sound
  public playPoke() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  // Cute happy purr / chirp when waking up or petting
  public playHappy() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      });
    } catch (e) {}
  }

  // Deep sleepy gentle snore / yawn sound
  public playYawn() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // Chat message pop
  public playMessagePop() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Sleep ASMR ambient sound generator (gentle binaural lullaby drone)
  private asmrNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

  public startSleepAsmr() {
    if (this.asmrNodes) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      this.asmrNodes = { osc1, osc2, gain };
    } catch (e) {}
  }

  public stopSleepAsmr() {
    if (!this.asmrNodes) return;
    try {
      const ctx = this.getContext();
      if (ctx) {
        this.asmrNodes.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        setTimeout(() => {
          this.asmrNodes?.osc1.stop();
          this.asmrNodes?.osc2.stop();
          this.asmrNodes = null;
        }, 700);
      } else {
        this.asmrNodes.osc1.stop();
        this.asmrNodes.osc2.stop();
        this.asmrNodes = null;
      }
    } catch (e) {
      this.asmrNodes = null;
    }
  }
}

export const snorlaxAudio = new SnorlaxAudioSynth();
