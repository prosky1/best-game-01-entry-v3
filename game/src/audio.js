// Paper Pilot — every sound is synthesized with WebAudio.
// No audio files are shipped: the wind, the chimes and the thuds are
// built from oscillators and filtered noise at run time, so the game
// loads nothing over the network and weighs nothing extra.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.windGain = null;
    this.windFilter = null;
    this.musicTimer = 0;
    this.musicStep = 0;
    // A slow, warm pad progression in C major pentatonic colours:
    // C, Am, F, G — one chord every couple of seconds while playing.
    this.chords = [
      { name: 'C', notes: [261.63, 329.63, 392.0] },
      { name: 'Am', notes: [220.0, 261.63, 329.63] },
      { name: 'F', notes: [174.61, 220.0, 261.63] },
      { name: 'G', notes: [196.0, 246.94, 293.66] },
    ];
  }

  // Browsers only allow audio after a user gesture; call from the
  // first pointer/keydown handler. Safe to call repeatedly: the second
  // call just resumes a suspended context.
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.startWind();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.context) this.context.suspend();
    if (this.context && !this.muted) this.context.resume();
    return this.muted;
  }

  // Looping wind: white noise through a low-pass filter whose cutoff
  // follows the plane's speed. Started once, never stopped; the gain
  // sits at zero until the game tells it how fast the plane flies.
  startWind() {
    const ctx = this.context;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 320;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.0;
    source.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(ctx.destination);
    source.start();
  }

  setWind(amount) {
    if (!this.context || !this.windGain) return;
    const t = this.context.currentTime;
    this.windGain.gain.setTargetAtTime(0.02 + amount * 0.05, t, 0.2);
    this.windFilter.frequency.setTargetAtTime(280 + amount * 700, t, 0.2);
  }

  // One oscillator note with a quick attack and an exponential fade,
  // optionally sliding to another pitch. Silent when muted or before
  // the context exists.
  tone(freq, seconds, type, volume, when = 0, slideTo = null) {
    if (!this.context || this.muted) return;
    const ctx = this.context;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  // A burst of filtered noise that decays: the hit thud.
  noiseBurst(seconds, volume, filterFreq) {
    if (!this.context || this.muted) return;
    const ctx = this.context;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // A bright two-note chime that climbs with the combo.
  ring(combo) {
    const base = 660 * Math.pow(1.059, Math.min(combo, 8));
    this.tone(base, 0.22, 'sine', 0.16);
    this.tone(base * 1.5, 0.3, 'sine', 0.14, 0.07);
  }

  star() {
    this.tone(1180, 0.12, 'triangle', 0.1);
    this.tone(1560, 0.16, 'triangle', 0.08, 0.05);
  }

  // A sun shard: one bright ping, a touch higher than a ring chime.
  shard() {
    this.tone(1320, 0.1, 'sine', 0.12);
    this.tone(1760, 0.14, 'sine', 0.09, 0.04);
  }

  // A zone gate cleared: a rising four-note fanfare.
  zoneComplete() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.13, i * 0.09));
  }

  hit() {
    this.noiseBurst(0.25, 0.35, 900);
    this.tone(140, 0.3, 'sine', 0.3, 0, 55);
  }

  levelUp() {
    [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, i * 0.08));
  }

  win() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, 0.5, 'triangle', 0.14, i * 0.11),
    );
  }

  click() {
    this.tone(880, 0.07, 'sine', 0.08);
  }

  // One soft pad chord every couple of seconds, while playing only.
  updateMusic(dt, playing) {
    if (!this.context || this.muted) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = 2.4;
    if (!playing) return;
    const chord = this.chords[this.musicStep % this.chords.length];
    this.musicStep += 1;
    chord.notes.forEach((f) => this.tone(f, 2.2, 'sine', 0.028));
  }
}
