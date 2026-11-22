// Basit sentezlenmiş sesler (ses dosyası gerekmez)
// Bütün sesler tek bir ana sesten geçer (Kaplan Macerası'ndaki gibi); N açıp kapatır, seçim hatırlanır.
const MUTE_KEY = 'megalodon_muted';
const MASTER_VOLUME = 0.4;

const Sound = (() => {
  let ctx = null, master = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* yoksay */ }

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : MASTER_VOLUME;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noise(duration, freq, volume, q) {
    const c = ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = c.createGain(); g.gain.value = volume;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  function tone(freq, duration, volume, type, delay) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    const g = c.createGain();
    g.gain.setValueAtTime(volume, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + duration);
  }

  return {
    unlock: ensure,
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : MASTER_VOLUME;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* yoksay */ }
      return muted;
    },
    bite() { noise(0.15, 900, 0.5, 2); tone(90, 0.15, 0.3, 'square'); },
    hit() { noise(0.25, 500, 0.6); },
    hurt() { tone(160, 0.3, 0.25, 'sawtooth'); tone(110, 0.3, 0.2, 'sawtooth', 0.05); },
    splash() { noise(0.6, 1800, 0.35); },
    lunge() { noise(0.35, 400, 0.4); },
    eat() { tone(300, 0.1, 0.15, 'triangle'); tone(420, 0.12, 0.15, 'triangle', 0.08); },
    levelUp() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 0.18, 'triangle', i * 0.1)); },
    wood() { noise(0.2, 2500, 0.4, 3); tone(140, 0.12, 0.2, 'square'); },
    crash() { noise(0.9, 1400, 0.8); noise(0.6, 300, 0.7); tone(70, 0.5, 0.3, 'sawtooth'); },
    cannon() { noise(0.7, 250, 0.9); tone(55, 0.4, 0.35, 'sine'); },
    laser() { tone(1400, 0.12, 0.12, 'sawtooth'); tone(700, 0.15, 0.1, 'square', 0.03); },
    tentacle() { noise(0.4, 600, 0.6, 2); tone(90, 0.3, 0.25, 'triangle'); },
    transform() { [392, 523, 659, 880, 1175].forEach((f, i) => tone(f, 0.25, 0.14, 'sine', i * 0.06)); noise(0.5, 3000, 0.25); },
    mystery() { [392, 494, 587, 784, 988, 1175].forEach((f, i) => tone(f, 0.5, 0.15, 'triangle', i * 0.12)); noise(1.2, 4000, 0.15); },
    alert() { tone(880, 0.12, 0.12, 'square'); tone(660, 0.15, 0.12, 'square', 0.12); },
  };
})();
