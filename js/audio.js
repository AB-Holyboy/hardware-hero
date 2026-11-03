export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.noiseBuffer = null;
    this.MUSIC = [220.00, 277.18, 329.63, 440.00, 329.63, 277.18, 246.94, 329.63]; // A-minor arpeggio
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  }

  _noise() {
    if (this.noiseBuffer) return this.noiseBuffer;
    const n = Math.floor(this.ctx.sampleRate * 0.25);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    this.noiseBuffer = buf;
    return buf;
  }

  playLaser() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(g).connect(this.master);
    osc.start(t); osc.stop(t + 0.1);
  }

  playExplosion() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise();
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(800, t);
    filt.frequency.linearRampToValueAtTime(50, t + 0.25);
    src.connect(filt).connect(this.master);
    src.start(t); src.stop(t + 0.25);
  }

  playCorrect() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    [[880, 0], [1320, 0.07]].forEach(([f, d]) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16);
      o.connect(g).connect(this.master);
      o.start(t + d); o.stop(t + d + 0.18);
    });
  }

  playWrong() {
    if (!this.init()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.28);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 0.32);
  }

  startMusic() {
    if (!this.init() || this.musicTimer) return;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const step = this.musicStep++;

      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = this.MUSIC[step % this.MUSIC.length];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      o.connect(g).connect(this.master);
      o.start(t); o.stop(t + 0.21);

      if (step % 4 === 0) {
        const b = this.ctx.createOscillator(), bg = this.ctx.createGain();
        b.type = 'sine';
        b.frequency.value = this.MUSIC[step % this.MUSIC.length] / 2;
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        b.connect(bg).connect(this.master);
        b.start(t); b.stop(t + 0.36);
      }
    }, 160);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}