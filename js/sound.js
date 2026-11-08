// Basit sentezlenmiş sesler (ses dosyası gerekmez)
const Sound = (() => {
  let ctx = null;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
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
    src.connect(f); f.connect(g); g.connect(c.destination);
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
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + duration);
  }

  return {
    unlock: ensure,
    bite() { noise(0.15, 900, 0.5, 2); tone(90, 0.15, 0.3, 'square'); },
    hit() { noise(0.25, 500, 0.6); },
    hurt() { tone(160, 0.3, 0.25, 'sawtooth'); tone(110, 0.3, 0.2, 'sawtooth', 0.05); },
    splash() { noise(0.6, 1800, 0.35); },
    lunge() { noise(0.35, 400, 0.4); },
    eat() { tone(300, 0.1, 0.15, 'triangle'); tone(420, 0.12, 0.15, 'triangle', 0.08); },
    levelUp() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 0.18, 'triangle', i * 0.1)); },
    alert() { tone(880, 0.12, 0.12, 'square'); tone(660, 0.15, 0.12, 'square', 0.12); },
  };
})();
