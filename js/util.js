// Ortak yardımcı fonksiyonlar
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function hash2(x, z) {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const u = smoothstep(x - xi), v = smoothstep(z - zi);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi);
  const c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm(x, z) {
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < 4; i++) {
    sum += noise2(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// Yumuşak maksimum: iki yüzeyi dikişsiz birleştirir
function smax(a, b, k) {
  const h = clamp(0.5 + 0.5 * (a - b) / k, 0, 1);
  return lerp(b, a, h) + k * h * (1 - h);
}

// a açısından b açısına en kısa yoldan yaklaş
function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// yaw/pitch'ten ileri yön vektörü (model +Z'ye bakar)
function forwardFrom(yaw, pitch, out) {
  out = out || new THREE.Vector3();
  const cp = Math.cos(pitch);
  return out.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
}

function textSprite(text, color, size) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.font = 'bold 100px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 10;
  g.strokeStyle = '#000';
  g.strokeText(text, 64, 68);
  g.fillStyle = color;
  g.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(size, size, 1);
  sp.renderOrder = 10;
  return sp;
}
